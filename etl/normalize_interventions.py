"""
Script de Normalización de Intervenciones (ETL)

Este script procesa el archivo crudo `data/interventions.json` para garantizar la calidad de los datos mostrados en la visualización.
Realiza las siguientes tareas de limpieza:

1.  **Eliminación de Eventos Domésticos**: Filtra registros que corresponden a conflictos internos de Estados Unidos (ej. Guerras Indias, Guerra Civil, Rebelión del Whiskey) o intervenciones en territorios que hoy son parte integral de EEUU (ej. Florida española, Texas pre-anexión) para cumplir con el criterio de "Intervenciones en países extranjeros".
2.  **Normalización de Nombres**: Estandariza nombres fragmentados o arcaicos a sus equivalentes modernos soberanos (ej. "Colombia (Bahía de Panamá)" -> "Panamá") para asegurar un correcto agrupamiento en los filtros y el mapa.
3.  **Asignación de Códigos ISO**: Rellena códigos ISO 3166-1 alpha-2 faltantes para entidades históricas mapeables (ej. "Imperio Otomano" -> "TR") permitiendo su visualización en el mapa choropleth.

Uso:
    python3 etl/normalize_interventions.py
"""

import json
import shutil
from pathlib import Path

# Configuración de archivos
SRC_FILE = Path('data/interventions.json')
BACKUP_FILE = Path('data/interventions.backup.json')

# Lista negra de palabras clave que identifican conflictos domésticos o internos de EEUU
DOMESTIC_KEYWORDS = [
    "cherokee", "whiskey", "shays", "indios del noroeste", "nube roja", 
    "homestead", "wounded knee", "utah", "sioux", "guerra civil estadounidense",
    "juzgado de honolulu", "wyoming", "oregón", "florida occidental", 
    "florida española", "isla amelia", "territorio de florida", 
    "incidente del itata", "guerra de 1812", "revolución americana", 
    "guerra de independencia", "sur de estados unidos", "reconstrucción",
    "rough rider", "mar de bering", "guerra seminola", "rebelión de fries"
]

# Mapa de normalización: Fragmento de nombre -> (Nombre ES, Nombre EN, Código ISO)
NORMALIZATION_MAP = {
    # Normalización de Panamá (separándolo de Colombia histórica para visualización geográfica correcta)
    "Departamento de Panamá": ("Panamá", "Panama", "PA"),
    "Bahía de Panamá": ("Panamá", "Panama", "PA"),
    "Colón": ("Panamá", "Panama", "PA"),
    
    # Normalización de Nombres Históricos y Territorios
    "Guayana Neerlandesa": ("Surinam", "Suriname", "SR"),
    "Zaire": ("R. D. del Congo", "DR Congo", "CD"),
    "Abisinia": ("Etiopía", "Ethiopia", "ET"),
    "Costa de los Mosquitos": ("Nicaragua", "Nicaragua", "NI"),
    "Puerto Rico (territorio español)": ("Puerto Rico", "Puerto Rico", "PR"),
    "Dalmacia": ("Croacia", "Croatia", "HR"),
    "Trieste": ("Italia", "Italy", "IT"),
    "Formosa": ("Taiwán", "Taiwan", "TW"),
    "Siberia": ("Rusia", "Russia", "RU"),
    "Esmirna": ("Turquía", "Turkey", "TR"), 
    "Islas Ryukyu": ("Japón", "Japan", "JP"),
    "Jerusalén": ("Israel/Palestina", "Israel/Palestine", "IL"),
    "Berlín": ("Alemania", "Germany", "DE"),
    "Imperio otomano": ("Turquía (Imperio Otomano)", "Turkey (Ottoman Empire)", "TR"),
    "Isla Johanna": ("Comoras", "Comoros", "KM"),
    "Islas Gilbert": ("Kiribati", "Kiribati", "KI"),
    "Reino de Hawái": ("Hawái", "Hawaii", "US"), # Geográficamente US, pero entidad distinta
    "Derrocamiento del Reino de Hawái": ("Hawái", "Hawaii", "US"),
}

# Asignación manual de códigos ISO faltantes para entidades conocidas
MISSING_CODES_MAP = {
    "Primera guerra berberisca": "LY", 
    "Trípoli": "LY",
    "Argel": "DZ",
    "Campaña de Nuku Hiva": "PF",
    "Expedición Pike": "MX",
    "Paraguay": "PY",
    "Uruguay": "UY",
    "Guerra méxicano-estadounidense": "MX",
    "Guerra hispanoamericana": "CU", # Teatro principal
    "Puente aéreo de Kabul de 2021": "AF",
    "Operación Guardián de la Prosperidad": "YE",
    "Batalla de Boca Teacapan": "MX",
    "Costa de Marfil": "CI",
    "República Centroafricana, Operación Quick Response": "CF",
    "Operación Sentinel": "IR",
    "Primera expedición a Sumatra": "ID",
    "Segunda expedición a Sumatra": "ID",
    "Evacuación de Chipre": "CY",
}

def main():
    # Crear backup si no existe uno reciente
    if not BACKUP_FILE.exists():
        shutil.copy(SRC_FILE, BACKUP_FILE)
        print(f"Backup creado en {BACKUP_FILE}")

    data = json.loads(SRC_FILE.read_text())
    cleaned_interventions = []
    count_removed = 0

    print("Iniciando normalización...")

    for item in data['interventions']:
        name_es = item['country']['es']
        name_lower = name_es.lower()
        code = item['country'].get('code')
        
        # 1. Filtro de EEUU y Domésticos
        if code == 'US':
            # Excepción: Hawái histórico (Reino)
            if "Hawái" not in name_es:
                count_removed += 1
                # print(f"Eliminado (Code US): {name_es}")
                continue
            
        is_domestic = False
        for kw in DOMESTIC_KEYWORDS:
            if kw in name_lower:
                is_domestic = True
                break
                
        if name_es == "Estados Unidos":
            is_domestic = True

        if is_domestic:
            count_removed += 1
            # print(f"Eliminado (Doméstico): {name_es}")
            continue

        # 2. Normalización de Nombres
        new_es = name_es
        new_en = item['country']['en']
        new_code = code

        normalized = False
        for key, (map_es, map_en, map_code) in NORMALIZATION_MAP.items():
            if key in name_es:
                new_es = map_es
                new_en = map_en
                new_code = map_code
                normalized = True
                break
                
        # 3. Relleno de Códigos Faltantes
        if not new_code:
            if new_es in MISSING_CODES_MAP:
                new_code = MISSING_CODES_MAP[new_es]
                
        # Limpieza final específica para Somalia (caso detectado)
        if "Somalia" in new_es and "(" in new_es:
             new_es = "Somalia"
             new_en = "Somalia"
             new_code = "SO"
             
        # Manejo especial Hawái para evitar pintar mainland US
        if "Hawái" in new_es:
            new_code = None 

        # Actualizar registro
        item['country']['es'] = new_es
        item['country']['en'] = new_en
        item['country']['code'] = new_code
        
        cleaned_interventions.append(item)

    # Guardar resultados
    data['interventions'] = cleaned_interventions
    SRC_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding='utf-8')

    print(f"=== Reporte de Limpieza ===")
    print(f"Registros eliminados (domésticos/US): {count_removed}")
    print(f"Registros finales válidos: {len(cleaned_interventions)}")
    print(f"Archivo guardado: {SRC_FILE}")

if __name__ == "__main__":
    main()
