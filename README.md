# 🌍 Intervenciones de EEUU en el Extranjero

[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue)](https://vlasvlasvlas.github.io/interventions/)
[![License: CC BY-SA 4.0](https://img.shields.io/badge/License-CC%20BY--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)
[![Data: Wikipedia](https://img.shields.io/badge/Data-Wikipedia-green)](https://es.wikipedia.org/wiki/Anexo:Intervenciones_militares_de_los_Estados_Unidos)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-purple)](https://vlasvlasvlas.github.io/interventions/)

Base de datos interactiva de intervenciones militares y políticas de Estados Unidos en el extranjero (1775-2026). **Herramienta diseñada para periodismo de investigación e investigación académica.**

🔗 **Demo en vivo**: [https://vlasvlasvlas.github.io/interventions/](https://vlasvlasvlas.github.io/interventions/)

![Screenshot](screenshot.png)

---

## 📚 Objetivo

Este proyecto tiene un **objetivo didáctico y periodístico**: facilitar la comprensión del contexto histórico de las relaciones internacionales a través de visualizaciones claras y accesibles de datos públicos.

**Ideal para:**
- 📰 Periodistas de investigación
- 🎓 Investigadores académicos
- 📊 Analistas de política internacional
- 👥 Educadores y estudiantes

No promueve ninguna posición política. La información se presenta de manera neutral con fines educativos.

---

## ✨ Características

### 📊 Visualizaciones Analíticas (v3.1)

| Gráfico | Descripción | Insight |
|---------|-------------|---------|
| **📈 Evolución Histórica** | Intervenciones por década (1770s-2020s) | Identifica períodos de mayor actividad y correlación con eventos globales. |
| **🎯 Países Más Afectados** | Top 10 países intervenidos | Muestra concentración geográfica y objetivos recurrentes. |
| **🌎 Distribución Regional** | Porcentaje por continente/región | Análisis de foco geopolítico (América Latina vs Medio Oriente). |
| **🛢️ Distribución Petrolera** | Doughnut global por riqueza petrolera | Correlación general entre operaciones y recursos. |
| **📈 Evolución Petrolera** | Stacked Bar (Décadas x Recursos) | **Nuevo**: Visualiza si las intervenciones en Petro-Estados han aumentado históricamente. |
| **⏱️ Duración de Operaciones** | Clasificación por años de duración | Patrón de intervenciones prolongadas vs "golpes" rápidos. |

### 🛠️ Sistema Data-Driven (Nuevo)

Los gráficos son **completamente configurables** mediante un archivo JSON, permitiendo extender el análisis sin programar.
- **Configuración**: `data/charts_config.json`
- **Documentación**: [Ver Guía de Gráficos](docs/CHARTS.md)

### 🗺️ Mapa Interactivo (SOTA)

- **Choropleth dinámico** con intensidad por número de intervenciones
- **Capas de recursos naturales**: Petróleo, Gas, Minerales (% PIB) con **filtrado inteligente**
- **Indicador de régimen político** (democracia/autocracia)
- **Panel informativo** al hover con datos del país
- **UX**: Selector de capas no intrusivo y leyenda dinámica.

### 📅 Timeline & Datos

- **Timeline cronológica** con cards expandibles
- **Tabla paginada** con búsqueda y filtros
- **318+ intervenciones** documentadas
- **Búsqueda inteligente** por país, año o descripción

### 🎛️ Filtros Unificados

Todos los filtros aplican simultáneamente a **todas las vistas** (Timeline, Mapa, Charts, Tabla):
- **Rango de años**: Slider dual (1775-2026) con track arrastrable
- **Región geográfica**: Dropdown por continente
- **País específico**: Dropdown alfabético
- **Búsqueda libre**: Texto en cualquier campo

### 🌐 UX/UI

- 🌙 **Dark theme** elegante y accesible
- 📱 **Mobile-first** responsive design optimizado
- 🌐 **Bilingüe completo** ES/EN con toggle
- ⬆️ **Navegación fluida** con scroll-to-top
- ♿ **Accesible** (ARIA, semántica HTML5)

### ⚡ Técnico

- **PWA instalable** con Service Worker
- **SEO optimizado** (JSON-LD, Open Graph, sitemap)
- **Zero dependencies** (HTML/CSS/JS puro + Leaflet + Chart.js CDN)
- **Datos abiertos** descargables en CSV y JSON
- **Arquitectura robusta**: Carga lazy de datos y manejo de race conditions

---

## 📊 Fuentes de Datos

La integridad y neutralidad de los datos es prioritaria. Se utilizan fuentes públicas y verificables:

| Categoría | Fuente | Detalles |
|-----------|--------|----------|
| **Eventos** | Wikipedia | Intervenciones militares, operaciones encubiertas, timeline general |
| **Geografía** | Natural Earth | Límites fronterizos simplificados (1:110m) |
| **Economía** | World Bank API | PIB per cápita, Gini, Pobreza, Rentas de recursos naturales |
| **Política** | Polity5 Project | Series de régimen político (democracia/autocracia) |

---

## 🛠️ Stack Técnico

| Tecnología | Uso |
|------------|-----|
| HTML5 | Estructura semántica |
| CSS3 | Variables, Grid, Flexbox, animaciones |
| JavaScript ES6+ | Lógica sin frameworks |
| Chart.js | Gráficos interactivos + Plugin Stacked |
| Leaflet.js | Mapa interactivo + GeoJSON |
| Python (ETL) | Limpieza y enriquecimiento de datos |
| GitHub Pages | Hosting estático |

---

## 📁 Estructura del Proyecto

```
interventions/
├── index.html          # Página principal
├── styles.css          # Estilos (dark theme, responsive)
├── app.js              # Lógica principal, filtros, tabs
├── map.js              # Mapa Leaflet, capas, leyenda
├── charts.js           # Motor de gráficos Data-Driven V3.1
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker
├── robots.txt          # SEO
├── sitemap.xml         # SEO
├── screenshot.png      # Preview para social
├── README.md
├── docs/
│   └── CHARTS.md       # Guía de configuración de gráficos
│
├── i18n/
│   ├── es.json         # Traducciones Español
│   └── en.json         # Traducciones English
│
├── data/
│   ├── interventions.json   # Base de datos primaria (318+ registros)
│   ├── countries.json       # Metadatos de países (economía, régimen)
│   ├── charts_config.json   # Configuración de visualizaciones
│   └── world.geojson        # Geometría del mapa
│
└── etl/
    ├── normalize_interventions.py    # Limpieza y normalización
    ├── update_countries_metadata.py  # Sincronización World Bank
    ├── audit_interventions.py        # Auditoría de calidad
    └── README.md                     # Documentación ETL
```

---

## 🚀 Uso Local

```bash
# Clonar el repositorio
git clone https://github.com/vlasvlasvlas/interventions.git
cd interventions

# Iniciar servidor local
python3 -m http.server 8080

# Abrir en navegador
open http://localhost:8080
```

---

## 📱 Compatibilidad

| Navegador | Desktop | Mobile |
|-----------|---------|--------|
| Chrome | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Safari | ✅ | ✅ |
| Edge | ✅ | ✅ |

**PWA**: Instalable en dispositivos móviles y desktop.

---

## 🌐 Deploy

El sitio se despliega automáticamente en GitHub Pages desde la rama `main`.

**URL**: https://vlasvlasvlas.github.io/interventions/

---

## 📋 Changelog

### v3.1 (Enero 2026)
- ✅ **6 gráficos analíticos** incluyendo "Evolución Petrolera" (Stacked)
- ✅ **Sistema Data-Driven**: Configurable vía JSON con soporte Multiserie
- ✅ **Filtros unificados** sincrónicos con Mapa, Charts y Tabla
- ✅ **Capas de mapa inteligentes**: Filtran países según intervenciones activas
- ✅ **UI Refinada**: Controles de mapa no intrusivos, leyenda dinámica
- ✅ **Performance**: Lazy loading de GeoJSON y estrategias anti-race-conditions
- ✅ **Traducciones completas** ES/EN

### v3.0
- ✅ Mapa choropleth interactivo
- ✅ Leyenda dinámica
- ✅ Datos de régimen político 1946-2022

### v2.0
- ✅ Timeline interactivo
- ✅ Tabla paginada
- ✅ Búsqueda inteligente
- ✅ Sistema bilingüe

### v1.0
- ✅ Base de datos inicial
- ✅ Estructura HTML/CSS/JS

---

## 📜 Licencia

**CC BY-SA 4.0** - Los datos provienen de Wikipedia y están sujetos a la misma licencia.

Puedes:
- ✅ Compartir y adaptar el material
- ✅ Uso comercial permitido
- ⚠️ Debes dar atribución apropiada
- ⚠️ Misma licencia para obras derivadas

---

## 📧 Contacto

- **GitHub**: [@vlasvlasvlas](https://github.com/vlasvlasvlas)
- **Issues**: [Reportar bug o sugerencia](https://github.com/vlasvlasvlas/interventions/issues)

---

<p align="center">
  <strong>📚 Datos abiertos con fines educativos y periodísticos</strong><br>
  <em>Hecho con ❤️ para la transparencia informativa</em>
</p>
