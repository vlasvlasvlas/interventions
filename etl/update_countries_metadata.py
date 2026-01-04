"""
Script de Actualización de Metadatos de Países (ETL)

Este script sincroniza `data/countries.json` con la lista de códigos ISO presentes en `data/interventions.json`.
Su función crítica es **PRESERVAR la data enriquecida manualmente** (como series de régimen político e independencia) para los países existentes, 
mientras consulta automáticamente la API del Banco Mundial para rellenar datos de países nuevos.

Lógica:
1. Lee `data/interventions.json` para obtener la lista autoritativa de códigos de países `target_codes`.
2. Lee `data/countries.json` actual y lo indexa.
3. Para cada código en `target_codes`:
    - Si existe en `countries.json`: Se COPIA tal cual (preservando trabajo manual).
    - Si NO existe (país nuevo tras limpieza): Se consulta la API del World Bank para obtener indicadores macro, recursos y metadatos básicos.
4. Países que ya no están en `interventions.json` (ej. si se eliminó 'US') no se incluyen en el resultado final, limpiando el archivo.

Indicadores World Bank consultados:
- PIB per cápita PPP (NY.GDP.PCAP.PP.KD)
- Índice Gini (SI.POV.GINI)
- Tasa de pobreza (SI.POV.DDAY)
- Rentas de recursos naturales (% PIB): Petróleo, Gas, Minerales.

Uso:
    python3 etl/update_countries_metadata.py
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

# Importar funciones de red básicas
from urllib.error import URLError, HTTPError
from urllib.request import urlopen

BASE_API_URL = "https://api.worldbank.org/v2"
TIMEOUT = 10

# Mapeo de indicadores internos -> IDs de World Bank
INDICATORS = {
    "gdp_pc_ppp": "NY.GDP.PCAP.PP.KD",
    "gini": "SI.POV.GINI",
    "poverty_rate": "SI.POV.DDAY",
    "oil_rents_pct_gdp": "NY.GDP.PETR.RT.ZS",
    "gas_rents_pct_gdp": "NY.GDP.NGAS.RT.ZS",
    "mineral_rents_pct_gdp": "NY.GDP.MINR.RT.ZS",
}

def fetch_json(url: str) -> Optional[Any]:
    """Descarga y parsea JSON desde una URL con timeout."""
    try:
        with urlopen(url, timeout=TIMEOUT) as resp:
            if resp.status != 200: return None
            return json.load(resp)
    except Exception:
        return None

def fetch_indicator(code: str, indicator: str):
    """Obtiene el valor más reciente de un indicador específico para un país dado."""
    url = f"{BASE_API_URL}/country/{code}/indicator/{indicator}?format=json&per_page=10" # Pedimos 10 para buscar recientes
    data = fetch_json(url)
    if not data or len(data) < 2 or not data[1]: return None, None, url
    
    # Buscar el valor no-nulo más reciente
    for entry in data[1]:
        if entry.get("value") is not None:
            val = entry.get("value")
            year = entry.get("date")
            try:
                year = int(year)
            except: 
                pass
            return val, year, url
            
    return None, None, url

def fetch_meta(code: str):
    """Obtiene metadatos (región, ingresos) del endpoint de país."""
    url = f"{BASE_API_URL}/country/{code}?format=json"
    data = fetch_json(url)
    if not data or len(data) < 2 or not data[1]: return (None,)*6 + (url,)
    
    item = data[1][0]
    return (
        item.get("name"),
        item.get("iso2Code") or code,
        item.get("region", {}).get("value"),
        item.get("adminregion", {}).get("value"),
        item.get("incomeLevel", {}).get("value"),
        item.get("lendingType", {}).get("value"),
        url,
    )

def main():
    interventions_path = Path("data/interventions.json")
    countries_path = Path("data/countries.json")
    
    interventions = json.loads(interventions_path.read_text(encoding="utf-8"))
    existing_countries_data = json.loads(countries_path.read_text(encoding="utf-8"))
    
    # Indexar países existentes por código para búsqueda rápida
    existing_map = {c['code']: c for c in existing_countries_data['countries']}
    
    # Obtener lista de códigos objetivo desde intervenciones (Source of Truth de qué países necesitamos)
    target_codes = sorted({
        i['country']['code'] 
        for i in interventions['interventions'] 
        if i['country'].get('code')
    })
    
    new_countries_list = []
    
    print(f"Códigos objetivo encontrados en intervenciones: {len(target_codes)}")
    
    for code in target_codes:
        if code in existing_map:
            # CASO 1: YA EXISTE -> PRESERVAR
            # Simplemente copiamos el objeto completo existente para no perder data manual
            new_countries_list.append(existing_map[code])
        else:
            # CASO 2: NUEVO (ej. apareció tras normalización) -> FETCH
            print(f"Detectado país nuevo: {code}. Consultando World Bank...")
            (name_en, iso2, region, admin, income, lending, url) = fetch_meta(code)
            
            # Estructura base
            entry = {
                "code": iso2 or code,
                "iso3": None, # Se intentará rellenar abajo
                "name_en": name_en or code,
                "name_es": name_en or code, # Placeholder, idealmente traducir
                "region_wb": region,
                "admin_region_wb": admin,
                "income_level_wb": income,
                "lending_type_wb": lending,
                # Campos manuales nulos por defecto
                "independence_year": None,
                "source_independence": None,
                "regime_series": [],
                "resources": {},
                "indicators": {},
                "sources": {"meta": url}
            }
            
            # Descargar indicadores
            for key, ind in INDICATORS.items():
                val, year, src = fetch_indicator(code, ind)
                if key in {"oil_rents_pct_gdp", "gas_rents_pct_gdp", "mineral_rents_pct_gdp"}:
                    entry["resources"][key] = {"value": val, "year": year}
                else:
                    entry["indicators"][key] = {"value": val, "year": year}
                entry["sources"][key] = src
                
            # Intentar obtener ISO3 (campo 'id' en respuesta WB)
            url3 = f"{BASE_API_URL}/country/{code}?format=json"
            d3 = fetch_json(url3)
            if d3 and len(d3) > 1 and d3[1]:
                entry['iso3'] = d3[1][0].get('id')
                
            new_countries_list.append(entry)
            
    # Guardar archivo actualizado
    out = {
        "countries": new_countries_list,
        "retrieved_at": datetime.utcnow().isoformat() + "Z",
        "source": "Merged: Manual data preserved + WB API for new codes"
    }
    
    countries_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Actualización completada. Total países en countries.json: {len(new_countries_list)}")

if __name__ == "__main__":
    main()
