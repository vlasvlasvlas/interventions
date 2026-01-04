# Documentación del Pipeline ETL

Este directorio contiene los scripts necesarios para la limpieza, normalización y enriquecimiento de los datos que alimentan el mapa interactivo de intervenciones. El flujo ha sido diseñado para ser idempotente, seguro y trazable.

## 📌 Flujo de Trabajo (Workflow)

El pipeline de datos sigue los siguientes pasos lógicos:

1.  **Fuente Primaria**: `data/interventions.json` (extraído originalmente de Wikipedia/DBpedia). Este archivo contiene la lista bruta de intervenciones.
2.  **Limpieza y Normalización**: Ejecutar `normalize_interventions.py`.
    *   Elimina eventos domésticos o guerras internas de EEUU.
    *   Normaliza nombres históricos a entidades soberanas modernas (ej. "Departamento de Panamá" -> "Panamá").
    *   Asigna códigos ISO faltantes.
    *   *Resultado*: Modifica `data/interventions.json` in-situ (crea backup automático).
3.  **Auditoría de Calidad**: Ejecutar `audit_interventions.py`.
    *   Verifica que no queden registros mapeados a 'US'.
    *   Reporta cuántos registros no tienen código ISO (es decir, no aparecerán en el mapa).
4.  **Actualización de Metadatos de Países**: Ejecutar `update_countries_metadata.py`.
    *   Sincroniza el archivo `data/countries.json` (usado por el Frontend) con los códigos presentes en `interventions.json`.
    *   **Importante**: Preserva cualquier dato enriquecido manualmente (fechas de independencia, series de regímenes) para países existentes.
    *   Para países nuevos, consulta automáticamente la API del Banco Mundial para obtener PIB, Gini, Recursos, etc.

## 📜 Descripción de Scripts

### `normalize_interventions.py`
**Propósito**: Limpieza primaria de datos crudos.
- **Entrada**: `data/interventions.json`
- **Lógica**: Utiliza listas negras (`DOMESTIC_KEYWORDS`) para filtrar eventos internos de EEUU y diccionarios de mapeo (`NORMALIZATION_MAP`) para corregir nombres geográficos.
- **Salida**: `data/interventions.json` limpio.

### `audit_interventions.py`
**Propósito**: Control de calidad (QA).
- **Entrada**: `data/interventions.json`
- **Salida**: Reporte en consola. Debe mostrar "0 registros US" para considerar el dataset limpio.

### `update_countries_metadata.py`
**Propósito**: Enriquecimiento de metadatos (Sync).
- **Entrada**: `data/interventions.json` y `data/countries.json`.
- **Lógica**: Cruce de claves (ISO Codes). Fetch selectivo a API World Bank solo para claves nuevas.
- **Salida**: `data/countries.json` actualizado y sincronizado.
- **Nota**: Este script reemplaza al antiguo `fetch_countries.py` que era destructivo.

## 🛠 Ejecución

Para correr el pipeline completo y actualizar los datos del proyecto:

```bash
# 1. Limpiar datos de intervenciones
python3 etl/normalize_interventions.py

# 2. Verificar resultados
python3 etl/audit_interventions.py

# 3. Sincronizar metadatos de países (toma unos segundos si hay países nuevos)
python3 etl/update_countries_metadata.py
```
