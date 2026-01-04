# 🌍 Intervenciones de EEUU en el Extranjero

[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue)](https://vlasvlasvlas.github.io/interventions/)
[![License: CC BY-SA 4.0](https://img.shields.io/badge/License-CC%20BY--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)
[![Data: Wikipedia](https://img.shields.io/badge/Data-Wikipedia-green)](https://es.wikipedia.org/wiki/Anexo:Intervenciones_militares_de_los_Estados_Unidos)

Base de datos interactiva de intervenciones militares y políticas de Estados Unidos en el extranjero (1775-2026).

🔗 **Demo en vivo**: [https://vlasvlasvlas.github.io/interventions/](https://vlasvlasvlas.github.io/interventions/)

![Screenshot](screenshot.png)

---

## 📚 Objetivo

Este proyecto tiene un **objetivo didáctico**: facilitar la comprensión del contexto histórico de las relaciones internacionales a través de una visualización clara y accesible de datos públicos.

No promueve ninguna posición política. La información se presenta de manera neutral con fines educativos y de consulta histórica.

---

## ✨ Características

| Feature | Descripción |
|---------|-------------|
| 🔍 **Búsqueda inteligente** | Busca por país, año o descripción. Los años detectan rangos (ej: buscar "1980" muestra intervenciones 1975-1989) |
| 📅 **Timeline** | Visualización cronológica con cards expandibles |
| 📊 **Tabla paginada** | 10 registros por página con filtros por década y región |
| 🌐 **Bilingüe** | Interfaz completa en Español e Inglés |
| 🏳️ **Banderas** | Emojis de banderas para cada país (códigos ISO) |
| 📥 **Open Data** | Descarga directa de datos en CSV y JSON |
| 📱 **Mobile-first** | Diseño responsive optimizado para móviles |
| 🌙 **Dark theme** | Interfaz oscura, moderna y accesible |

---

## 📊 Datos

### Estadísticas actuales

- **347 intervenciones** documentadas
- **182 países/regiones** afectados
- **251 años** de historia (1775-2026)

### Fuentes

Los datos provienen de artículos de Wikipedia verificables:

1. **[Anexo: Intervenciones militares de EEUU](https://es.wikipedia.org/wiki/Anexo:Intervenciones_militares_de_los_Estados_Unidos)** (Wikipedia ES)
2. **[Timeline of US military operations](https://en.wikipedia.org/wiki/Timeline_of_United_States_military_operations)** (Wikipedia EN)
3. **[Intervención en golpes de estado en América Latina](https://es.wikipedia.org/wiki/Intervención_estadounidense_en_golpes_de_Estado_en_América_Latina)** (Wikipedia ES)

### Estructura de datos

```json
{
  "id": 1,
  "year_start": 1975,
  "year_end": 1989,
  "section": "1970s",
  "country": {
    "es": "Cono Sur - Operación Cóndor",
    "en": "Southern Cone - Operation Condor",
    "code": "AR"
  },
  "description": {
    "es": "Operación Cóndor: campaña de represión política...",
    "en": "Operation Condor: coordinated political repression..."
  },
  "source": {
    "es": "https://es.wikipedia.org/wiki/...",
    "en": "https://en.wikipedia.org/wiki/..."
  }
}
```

---

## 🛠️ Stack Técnico

| Tecnología | Uso |
|------------|-----|
| **HTML5** | Estructura semántica |
| **CSS3** | Estilos con variables CSS, Grid, Flexbox |
| **JavaScript ES6+** | Lógica de la aplicación (vanilla, sin frameworks) |
| **JSON** | Almacenamiento de datos |
| **GitHub Pages** | Hosting estático gratuito |

### Sin dependencias externas

- ✅ No requiere Node.js
- ✅ No requiere build tools
- ✅ No requiere backend
- ✅ Funciona 100% en el navegador

---

## 📁 Estructura del Proyecto

```
interventions/
├── index.html              # Página principal
├── styles.css              # Estilos (dark theme, mobile-first)
├── app.js                  # Lógica de la aplicación
├── README.md               # Este archivo
├── i18n/
│   ├── es.json             # Traducciones español
│   └── en.json             # Traducciones inglés
└── data/
    ├── interventions.json  # Datos unificados (347 registros)
    ├── raw_interventions_es.csv   # Fuente original ES
    └── raw_interventions_en.csv   # Fuente original EN
```

---

## 🚀 Uso Local

### Clonar el repositorio

```bash
git clone https://github.com/vlasvlasvlas/interventions.git
cd interventions
```

### Iniciar servidor local

```bash
# Con Python 3
python3 -m http.server 8080

# O con Python 2
python -m SimpleHTTPServer 8080
```

### Abrir en el navegador

```
http://localhost:8080
```

---

## 🌐 Deploy en GitHub Pages

1. Hacer push del código a GitHub
2. Ir a **Settings → Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** / **(root)**
5. Guardar

El sitio estará disponible en: `https://[usuario].github.io/interventions/`

---

## 🤝 Contribuir

Las contribuciones son bienvenidas:

1. **Datos faltantes**: Si encontrás intervenciones no documentadas, abrí un Issue con la fuente
2. **Traducciones**: Mejoras en las traducciones ES/EN
3. **Bugs**: Reportá errores o problemas de visualización
4. **Features**: Sugerencias de nuevas funcionalidades

### Para contribuir código:

```bash
# Fork del repo
git checkout -b feature/nueva-funcionalidad
# Hacer cambios
git commit -m "Agrega nueva funcionalidad"
git push origin feature/nueva-funcionalidad
# Crear Pull Request
```

---

## 📜 Licencia

Este proyecto está bajo la licencia **[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)** (Creative Commons Attribution-ShareAlike 4.0 International).

Los datos provienen de Wikipedia y están sujetos a la misma licencia.

---

## 📧 Contacto

- **GitHub**: [@vlasvlasvlas](https://github.com/vlasvlasvlas)
- **Proyecto**: [github.com/vlasvlasvlas/interventions](https://github.com/vlasvlasvlas/interventions)

---

<p align="center">
  <strong>📚 Objetivo didáctico: comprender el contexto histórico de las relaciones internacionales</strong>
</p>
