"""
Script de Auditoría de Datos de Intervenciones (ETL)

Este script analiza `data/interventions.json` y genera un reporte de anomalías y calidad de datos.
Identifica:
1.  **Registros mapeados a Estados Unidos ('US')**: Que deberían ser eliminados según la regla de negocio de "intervenciones extranjeras".
2.  **Registros con Código Nulo**: Países o regiones que no tienen un mapeo ISO definido y por tanto no aparecerán en el mapa.
3.  **Nombres Compuestos o Irregulares**: Entradas con paréntesis o estructuras atípicas que sugieren necesidad de normalización (ej. "Colombia (Panamá)").

Es útil para verificar el éxito del script de normalización (`normalize_interventions.py`).

Uso:
    python3 etl/audit_interventions.py
"""

import json
from pathlib import Path

def analyze_interventions():
    # Cargar datos
    path = Path('data/interventions.json')
    if not path.exists():
        print(f"Error: No se encuentra {path}")
        return

    data = json.loads(path.read_text())
    
    us_codes = []
    null_codes = []
    compound_names = []
    
    unique_names = set()

    # Analizar cada intervención
    for i in data['interventions']:
        name = i['country']['es']
        code = i['country'].get('code')
        
        # Detectar US codes
        if code == 'US':
            us_codes.append(name)
        # Detectar Null codes
        elif code is None:
            null_codes.append(name)
        
        # Detectar nombres sospechosos (paréntesis, 'parte de')
        if '(' in name or ' part ' in name or ' parte ' in name:
            compound_names.append((name, code))
            
        unique_names.add(name)

    # Imprimir Reporte
    print(f"Total de Intervenciones: {len(data['interventions'])}")
    
    print("\n=== ALERTA: REGISTROS CON CODE 'US' (Deben ser 0) ===")
    if not us_codes:
        print("✅ Ninguno detectado.")
    else:
        for n in set(us_codes):
            print(f"❌ {n}")

    print("\n=== REGISTROS CON CODE NULL (No aparecerán en mapa) ===")
    if not null_codes:
        print("✅ Todos los registros tienen código ISO.")
    else:
        for n in set(null_codes):
            print(f"- {n}")

    print("\n=== NOMBRES COMPUESTOS (Verificar Normalización) ===")
    if not compound_names:
        print("✅ Nombres limpios.")
    else:
        for n, c in set(compound_names):
            print(f"- {n} [{c}]")

if __name__ == "__main__":
    analyze_interventions()
