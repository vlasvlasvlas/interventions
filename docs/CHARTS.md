# 📊 Charts Data-Driven System

Los gráficos de esta aplicación se generan dinámicamente a partir de un archivo de configuración JSON. Esto permite agregar, eliminar o modificar las visualizaciones sin tocar el código JavaScript.

**Archivo de configuración:** [`data/charts_config.json`](data/charts_config.json)

## 🛠️ Cómo agregar un nuevo gráfico

Para crear un nuevo gráfico, simplemente agrega un objeto al array en `charts_config.json`.

### Estructura del Objeto

```json
{
  "id": "miNuevoGrafico",
  "type": "bar",
  "title": {
    "es": "Título en Español",
    "en": "Title in English"
  },
  "subtitle": {
    "es": "Descripción corta",
    "en": "Short description"
  },
  "groupBy": "country",
  "limit": 10,
  "style": {
    "colorType": "gradient",
    "baseColor": "blue"
  }
}
```

### Opciones Disponibles

#### `type` (Tipo de Gráfico)
- `"bar"`: Gráfico de barras (vertical u horizontal).
- `"doughnut"`: Gráfico de dona (ideal para porcentajes).
- `"pie"`: Gráfico de torta.

#### `groupBy` (Agrupación de Datos)
Define cómo se cuentan las intervenciones.
- `"country"`: Cuenta por país objetivo.
- `"region"`: Cuenta por continente/región.
- `"year_start"`: Cuenta por año de inicio (cronológico). Opcionalmente usa `bucketSize` (ej: 10 para décadas).
- `"duration"`: Calcula la duración (Fin - Inicio). Usa `buckets` para rangos personalizados.
- `"resource_oil"`: Agrupa según la riqueza petrolera del país objetivo (Baja/Media/Alta/Petro-Estado).

#### `stackBy` (NUEVO: Gráficos Apilados)
Permite dividir cada barra en su-categorías (multiserie).
- Recibe los mismos valores que `groupBy` (ej: `"resource_oil"`).
- **Efecto**: Si `groupBy="year_start"` y `stackBy="resource_oil"`, creará barras por décadas, y dentro de cada década mostrará colores según el nivel de petróleo.

#### `style` (Estilos)
- `"colorType"`:
  - `"gradient"`: Genera un degradado de un solo color base (`baseColor`).
  - `"intensity"`: Opacidad variable según el valor (más alto = más oscuro).
  - `"palette"`: Usa una paleta predefinida.
    - `palette: "regions"`: Colores fijos por continente.
    - `palette: "resources"`: Escala dorada/petróleo.
    - `palette: "duration"`: Escala semáforo (Verde a Rojo).

#### Extras
- `"orientation": "horizontal"`: Solo para tipo `bar`. Gira las barras.
- `"limit": N`: Muestra solo los N valores más altos.
- `"exclude": ["Texto1", "Texto2"]`: Filtra claves que contengan estos textos.
- `"buckets"`: Array para definir rangos (ver ejemplo en `chartDuration`).

## 🔄 Flujo de Datos

1. `initCharts()` (charts.js) carga `charts_config.json` y `countries.json`.
2. Genera las tarjetas HTML automáticamente en `#chartsGrid`.
3. Al filtrar datos (por año, región, búsquedas), llama a `updateCharts(data)`.
4. El motor procesa los datos según las reglas `groupBy` de cada gráfico y actualiza la visualización.

Este sistema permite correlacionar datos de intervenciones con metadatos de países (como recursos naturales) simplemente definiendo una nueva regla de agrupación en el código.
