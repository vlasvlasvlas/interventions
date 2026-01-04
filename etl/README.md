# ETL / Data Processing

Este directorio documenta el origen de los datos y cómo regenerar `data/countries.json` a partir de fuentes oficiales.

## Fuentes
- **Intervenciones (interventions.json)**: extraído manualmente de Wikipedia (ES/EN) según los enlaces del README principal. El CSV/JSON abiertos derivan de ese conjunto.
- **Countries (countries.json)**: indicadores macro y de rentas de recursos obtenidos desde la API oficial del Banco Mundial. Campo por campo:
  - `gdp_pc_ppp` (`NY.GDP.PCAP.PP.KD`)
  - `gini` (`SI.POV.GINI`)
  - `poverty_rate` (`SI.POV.DDAY`)
  - `oil_rents_pct_gdp` (`NY.GDP.PETR.RT.ZS`)
  - `gas_rents_pct_gdp` (`NY.GDP.NGAS.RT.ZS`)
  - `mineral_rents_pct_gdp` (`NY.GDP.MINR.RT.ZS`)
  - Metadatos de país: endpoint `/country/{code}` de la API WB (incluye `region_wb`, `admin_region_wb`, `income_level_wb`, `lending_type_wb`).
- **Pendiente**: `independence_year` y `regime_series` quedan en `null` hasta conectar fuentes específicas (ONU/Factbook para independencia; Polity/V-Dem para régimen).

## Cómo actualizar `data/countries.json`
1) Requisitos: Python 3, conexión a internet.
2) Ejecutar desde la raíz del repo:
   ```bash
   python3 etl/fetch_countries.py
   ```
3) El script:
   - Lee `data/interventions.json` para obtener los códigos ISO únicos.
   - Consulta los indicadores en la API del Banco Mundial.
   - Escribe `data/countries.json` con los valores, año de referencia y URL fuente por campo.
   - Si un indicador no existe para un país (p.ej. TW, FK, CU, VE, YE), deja `value` y `year` en `null`.

## Transparencia
- Cada campo lleva la URL de la solicitud usada.
- El bloque raíz incluye `retrieved_at` y una descripción de la fuente.
- No se inventan valores: ausencias se representan con `null`.
