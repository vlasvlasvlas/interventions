// ================================
// Interactive Map with Leaflet
// ================================

let map = null;
let geojsonLayer = null;
// countriesData is GLOBAL from app.js
let interventionCounts = {};
let currentMapMode = 'interventions'; // interventions, oil, gas, mineral

// Internal index for ISO3 mapping (Map uses ISO3 from GeoJSON, app.js uses code/ISO2)
let iso3Map = {};

// ================================
// Color Scales
// ================================

function getInterventionColor(count) {
    if (count === 0) return '#374151'; // Gray for 0
    if (count == 1) return '#feb24c';
    if (count <= 3) return '#fd8d3c';
    if (count <= 5) return '#fc4e2a';
    if (count <= 9) return '#e31a1c';
    return '#800026'; // 10+
}

function getResourceColor(value, type) {
    if (!value || value === 0) return '#374151'; // Gray for 0

    // Oil: Gold/Black scale
    if (type === 'oil_rents_pct_gdp') {
        if (value < 1) return '#fef08a'; // yellow-200
        if (value < 5) return '#eab308'; // yellow-500
        if (value < 15) return '#a16207'; // yellow-700
        return '#422006'; // yellow-950 (Black/Brown)
    }

    // Gas: Blue scale
    if (type === 'gas_rents_pct_gdp') {
        if (value < 0.5) return '#bfdbfe'; // blue-200
        if (value < 2) return '#60a5fa'; // blue-400
        if (value < 10) return '#2563eb'; // blue-600
        return '#1e3a8a'; // blue-900
    }

    // Mineral: Purple/Stone scale
    if (type === 'mineral_rents_pct_gdp') {
        if (value < 1) return '#e9d5ff'; // purple-200
        if (value < 5) return '#c084fc'; // purple-400
        if (value < 15) return '#9333ea'; // purple-600
        return '#581c87'; // purple-900
    }

    return '#374151';
}

function getRegimeColor(regimeFamily) {
    switch (regimeFamily) {
        case 'democracy': return '#10b981';
        case 'hybrid': return '#fbbf24';
        case 'autocracy': return '#ef4444';
        default: return '#666666';
    }
}

// ================================
// Map Initialization
// ================================

async function initMap() {
    if (map) return;

    const mapContainer = document.getElementById('interventionsMap');
    if (!mapContainer) return;

    // --- DATA LOADING & FALLBACK ---
    // Check if global data provided by app.js is ready
    let hasGlobalData = typeof countriesData !== 'undefined' && Object.keys(countriesData).length > 0;

    if (!hasGlobalData) {
        // Fallback: Fetch manually if app.js hasn't finished loading data
        try {
            console.log('Map: Global data missing, fetching countries.json...');
            const cRes = await fetch('data/countries.json');
            const cData = await cRes.json();

            // Populate global object to sync with app.js
            if (typeof countriesData !== 'undefined') {
                cData.countries.forEach(c => countriesData[c.code] = c);
            }

            // Build local ISO3 index
            cData.countries.forEach(c => { if (c.iso3) iso3Map[c.iso3] = c; });

        } catch (err) {
            console.warn('Map fallback data load failed:', err);
        }
    } else {
        // Use existing global data
        Object.values(countriesData).forEach(c => {
            if (c.iso3) iso3Map[c.iso3] = c;
        });
    }

    // Create map
    map = L.map('interventionsMap', {
        center: [20, 0],
        zoom: 2,
        minZoom: 1,
        maxZoom: 8,
        worldCopyJump: true
    });

    // Dark Basemap (CartoDB Dark Matter) - Free & No API Key necessary for this usage
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Load GeoJSON
    try {
        const gResponse = await fetch('data/world.geojson');
        const geoData = await gResponse.json();

        // Initial Calculations
        recalculateInterventions();

        // GeoJSON Layer
        geojsonLayer = L.geoJSON(geoData, {
            style: styleCountry,
            onEachFeature: onEachCountry
        }).addTo(map);

        // Update Legend Initial
        updateLegend();

    } catch (e) {
        console.error('Error loading map geojson:', e);
        mapContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#a3a3a3;">Error loading map data</div>';
    }

    // Event Listeners for Controls
    setupMapControls();
}


function setupMapControls() {
    // Regime Toggle
    const showRegimes = document.getElementById('showRegimes');
    if (showRegimes) {
        showRegimes.addEventListener('change', () => geojsonLayer?.setStyle(styleCountry));
    }

    // View Mode Radios
    const radios = document.querySelectorAll('input[name="mapMode"]');
    radios.forEach(r => {
        r.addEventListener('change', (e) => {
            currentMapMode = e.target.value;
            // Map type 'interventions' vs 'oil_rents_pct_gdp' etc.
            if (currentMapMode === 'oil') currentMapMode = 'oil_rents_pct_gdp';
            if (currentMapMode === 'gas') currentMapMode = 'gas_rents_pct_gdp';
            if (currentMapMode === 'mineral') currentMapMode = 'mineral_rents_pct_gdp';

            updateLegend();
            geojsonLayer?.setStyle(styleCountry);
        });
    });
}

function recalculateInterventions() {
    // Used on init, but updated via updateMapWithFilters generally
    if (typeof interventions !== 'undefined') {
        countInterventions(interventions);
    }
}

function countInterventions(dataList) {
    interventionCounts = {};
    dataList.forEach(i => {
        const code = i.country?.code;
        // Optimization: app.js provides countriesData indexed by code (ISO2)
        // Ensure we check global variable existence safely
        if (code && typeof countriesData !== 'undefined' && countriesData[code]) {
            const country = countriesData[code];
            if (country && country.iso3) {
                interventionCounts[country.iso3] = (interventionCounts[country.iso3] || 0) + 1;
            }
        }
    });
}

// ================================
// Styling & Interaction
// ================================

function styleCountry(feature) {
    const iso3 = feature.properties.ISO_A3;
    // Map uses ISO3, but global countriesData uses ISO2 code. Use local index.
    const countryData = iso3Map[iso3];
    const showRegimes = document.getElementById('showRegimes')?.checked;

    let fillColor = '#374151'; // Default gray
    let fillOpacity = 0.3;

    // COLOR LOGIC
    if (currentMapMode === 'interventions') {
        const count = interventionCounts[iso3] || 0;
        fillColor = getInterventionColor(count);
        fillOpacity = count > 0 ? 0.7 : 0.3;
    } else {
        // Resource Modes
        // Apply filter mask: Only show color if country has interventions in current filter
        const count = interventionCounts[iso3] || 0;

        if (count > 0 && countryData && countryData.resources && countryData.resources[currentMapMode]) {
            const val = countryData.resources[currentMapMode].value;
            fillColor = getResourceColor(val, currentMapMode);
            fillOpacity = 0.7;
        } else {
            // No interventions or no data -> Gray
            fillColor = '#374151';
            fillOpacity = 0.3;
        }
    }

    // REGIME BORDER LOGIC
    let borderColor = '#262626';
    let borderWidth = 1;

    if (showRegimes && countryData && countryData.regime_series?.length > 0) {
        const currentRegime = countryData.regime_series[countryData.regime_series.length - 1].regime_family;
        borderColor = getRegimeColor(currentRegime);
        borderWidth = 2;
    }

    return {
        fillColor: fillColor,
        weight: borderWidth,
        opacity: 1,
        color: borderColor,
        fillOpacity: fillOpacity
    };
}

function onEachCountry(feature, layer) {
    const iso3 = feature.properties.ISO_A3;
    const name = feature.properties.NAME_ES || feature.properties.NAME; // Use ES name if available in simple geojson

    // Popup binding
    layer.on({
        mouseover: (e) => highlightCountry(e, name, iso3),
        mouseout: resetHighlight,
        click: (e) => zoomToCountry(e)
    });
}

function highlightCountry(e, name, iso3) {
    const layer = e.target;
    layer.setStyle({ weight: 3, color: '#60a5fa', fillOpacity: 0.9 });
    layer.bringToFront();

    updateInfoPanel(name, iso3);
}

function resetHighlight(e) {
    if (geojsonLayer) geojsonLayer.resetStyle(e.target);
}

function zoomToCountry(e) {
    map.fitBounds(e.target.getBounds());
}

// ================================
// UI Updates
// ================================

function updateInfoPanel(name, iso3) {
    const infoPanel = document.getElementById('mapInfo');
    const countryData = iso3Map[iso3];
    const count = interventionCounts[iso3] || 0;

    infoPanel.hidden = false;
    document.getElementById('mapInfoCountry').textContent = name;
    document.getElementById('mapInfoCount').textContent = count;

    // Regime
    const regEl = document.getElementById('mapInfoRegime');
    if (countryData?.regime_series?.length > 0) {
        regEl.textContent = countryData.regime_series.at(-1).regime_family;
    } else {
        regEl.textContent = '-';
    }

    // Resources
    const resEl = document.getElementById('mapInfoResources');
    if (countryData?.resources?.oil_rents_pct_gdp?.value > 1) {
        resEl.textContent = `🛢️ ${countryData.resources.oil_rents_pct_gdp.value.toFixed(1)}% (Oil)`;
    } else {
        resEl.textContent = '-';
    }
}

function updateLegend() {
    const container = document.getElementById('legendScale');
    const title = document.getElementById('legendTitle');
    const lang = window.currentLang || 'es';

    if (currentMapMode === 'interventions') {
        title.textContent = lang === 'en' ? 'Interventions per Country' : 'Intervenciones p/ País';
        container.innerHTML = `
            <div class="legend-item"><span class="legend-color" style="background:#374151"></span>0</div>
            <div class="legend-item"><span class="legend-color" style="background:#feb24c"></span>1</div>
            <div class="legend-item"><span class="legend-color" style="background:#fd8d3c"></span>2-3</div>
            <div class="legend-item"><span class="legend-color" style="background:#fc4e2a"></span>4-5</div>
            <div class="legend-item"><span class="legend-color" style="background:#dc2626"></span>6-9</div>
            <div class="legend-item"><span class="legend-color" style="background:#800026"></span>10+</div>
        `;
    } else {
        let label = lang === 'en' ? 'Resources (% GDP)' : 'Recursos (% PIB)';
        if (currentMapMode.includes('oil')) label = lang === 'en' ? 'Oil Rents (% GDP)' : 'Renta Petrolera (% PIB)';
        else if (currentMapMode.includes('gas')) label = lang === 'en' ? 'Gas Rents (% GDP)' : 'Renta Gas (% PIB)';
        else if (currentMapMode.includes('mineral')) label = lang === 'en' ? 'Mineral Rents (% GDP)' : 'Renta Mineral (% PIB)';

        title.textContent = label;

        // Dynamic scales
        let colors = [];
        let labels = ['< 1%', '1-5%', '5-15%', '> 15%'];

        if (currentMapMode.includes('oil')) colors = ['#fef08a', '#eab308', '#a16207', '#422006'];
        else if (currentMapMode.includes('gas')) {
            colors = ['#bfdbfe', '#60a5fa', '#2563eb', '#1e3a8a'];
            labels = ['< 0.5%', '0.5-2%', '2-10%', '> 10%'];
        }
        else colors = ['#e9d5ff', '#c084fc', '#9333ea', '#581c87']; // Mineral

        const naLabel = lang === 'en' ? '0 / N/A' : '0 / N/A';
        let html = `<div class="legend-item"><span class="legend-color" style="background:#374151"></span>${naLabel}</div>`;
        colors.forEach((c, i) => {
            html += `<div class="legend-item"><span class="legend-color" style="background:${c}"></span>${labels[i]}</div>`;
        });
        container.innerHTML = html;
    }
}

// ================================
// App Integration
// ================================

function updateMapWithFilters(filteredData, mode) {
    if (mode) {
        currentMapMode = mode;
        if (mode === 'oil') currentMapMode = 'oil_rents_pct_gdp';
        if (mode === 'gas') currentMapMode = 'gas_rents_pct_gdp';
        if (mode === 'mineral') currentMapMode = 'mineral_rents_pct_gdp';
    }

    countInterventions(filteredData);

    // Update map style
    if (geojsonLayer) {
        geojsonLayer.setStyle(styleCountry);
        updateLegend();
    }
}

// Export
window.initMap = initMap;
window.updateMapWithFilters = updateMapWithFilters;
