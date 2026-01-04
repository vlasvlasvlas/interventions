// ================================
// Interactive Map with Leaflet
// ================================

let map = null;
let geojsonLayer = null;
let countriesData = {};
let interventionCounts = {};

// Color scale for interventions
function getInterventionColor(count) {
    if (count === 0) return '#374151';
    if (count <= 3) return '#fbbf24';
    if (count <= 10) return '#f97316';
    return '#dc2626';
}

// Get regime border color
function getRegimeColor(regimeFamily) {
    switch (regimeFamily) {
        case 'democracy': return '#10b981';
        case 'hybrid': return '#fbbf24';
        case 'autocracy': return '#ef4444';
        default: return '#666666';
    }
}

// Initialize the map
async function initMap() {
    // Check if map already initialized
    if (map) return;

    const mapContainer = document.getElementById('interventionsMap');
    if (!mapContainer) return;

    // Create map with CartoDB dark basemap (matches theme)
    map = L.map('interventionsMap', {
        center: [20, 0],
        zoom: 2,
        minZoom: 1,
        maxZoom: 8,
        worldCopyJump: true
    });

    // Add Stadia Alidade Smooth base layer (grey, minimal)
    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://stadiamaps.com/">Stadia Maps</a>',
        maxZoom: 20
    }).addTo(map);

    // Load countries data
    try {
        const response = await fetch('data/countries.json');
        const data = await response.json();
        data.countries.forEach(c => {
            countriesData[c.iso3] = c;
        });
    } catch (e) {
        console.error('Error loading countries.json:', e);
    }

    // Count interventions per country
    if (typeof interventions !== 'undefined') {
        interventions.forEach(i => {
            const code = i.country?.code;
            if (code) {
                // Find iso3 from code
                const country = Object.values(countriesData).find(c => c.code === code);
                if (country) {
                    interventionCounts[country.iso3] = (interventionCounts[country.iso3] || 0) + 1;
                }
            }
        });
    }

    // Load GeoJSON
    try {
        const geoResponse = await fetch('data/world.geojson');
        const geoData = await geoResponse.json();

        geojsonLayer = L.geoJSON(geoData, {
            style: styleCountry,
            onEachFeature: onEachCountry
        }).addTo(map);

    } catch (e) {
        console.error('Error loading GeoJSON:', e);
        // Show message in map container
        mapContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#a3a3a3;">Error loading map data</div>';
    }

    // Setup regime toggle
    const showRegimes = document.getElementById('showRegimes');
    if (showRegimes) {
        showRegimes.addEventListener('change', () => {
            if (geojsonLayer) {
                geojsonLayer.setStyle(styleCountry);
            }
        });
    }
}

// Style for each country
function styleCountry(feature) {
    const iso3 = feature.properties.ISO_A3;
    const count = interventionCounts[iso3] || 0;
    const showRegimes = document.getElementById('showRegimes')?.checked;

    let borderColor = '#262626';
    let borderWidth = 1;

    if (showRegimes && countriesData[iso3]) {
        const regimeSeries = countriesData[iso3].regime_series;
        if (regimeSeries && regimeSeries.length > 0) {
            const currentRegime = regimeSeries[regimeSeries.length - 1].regime_family;
            borderColor = getRegimeColor(currentRegime);
            borderWidth = 2;
        }
    }

    return {
        fillColor: getInterventionColor(count),
        weight: borderWidth,
        opacity: 1,
        color: borderColor,
        fillOpacity: count > 0 ? 0.7 : 0.3
    };
}

// Event handlers for each country
function onEachCountry(feature, layer) {
    const iso3 = feature.properties.ISO_A3;
    const name = feature.properties.NAME_ES || feature.properties.NAME;
    const count = interventionCounts[iso3] || 0;
    const countryData = countriesData[iso3];

    // Popup content
    let popupContent = `<div class="map-popup-title">${name}</div>`;
    popupContent += `<div class="map-popup-stat">Intervenciones: <strong>${count}</strong></div>`;

    if (countryData) {
        // Regime
        if (countryData.regime_series && countryData.regime_series.length > 0) {
            const current = countryData.regime_series[countryData.regime_series.length - 1];
            const emoji = current.regime_family === 'democracy' ? '🟢' :
                current.regime_family === 'autocracy' ? '🔴' : '🟡';
            popupContent += `<div class="map-popup-stat">Régimen: ${emoji} ${current.regime_family}</div>`;
        }

        // Resources
        const oilRents = countryData.resources?.oil_rents_pct_gdp?.value;
        if (oilRents && oilRents > 5) {
            popupContent += `<div class="map-popup-stat">🛢️ Petróleo: ${oilRents.toFixed(1)}% PIB</div>`;
        }

        // GDP
        const gdp = countryData.indicators?.gdp_pc_ppp?.value;
        if (gdp) {
            popupContent += `<div class="map-popup-stat">💰 GDP: $${Math.round(gdp).toLocaleString()}</div>`;
        }
    }

    layer.bindPopup(popupContent);

    // Hover events
    layer.on({
        mouseover: (e) => highlightCountry(e, name, count, countryData),
        mouseout: resetHighlight,
        click: (e) => zoomToCountry(e)
    });
}

// Highlight on hover
function highlightCountry(e, name, count, countryData) {
    const layer = e.target;

    layer.setStyle({
        weight: 3,
        color: '#60a5fa',
        fillOpacity: 0.9
    });

    layer.bringToFront();

    // Update info panel
    const infoPanel = document.getElementById('mapInfo');
    if (infoPanel) {
        infoPanel.hidden = false;
        document.getElementById('mapInfoCountry').textContent = name;
        document.getElementById('mapInfoCount').textContent = count;

        if (countryData) {
            // Regime
            if (countryData.regime_series && countryData.regime_series.length > 0) {
                const current = countryData.regime_series[countryData.regime_series.length - 1];
                document.getElementById('mapInfoRegime').textContent = current.regime_family;
            } else {
                document.getElementById('mapInfoRegime').textContent = '-';
            }

            // Resources
            const oilRents = countryData.resources?.oil_rents_pct_gdp?.value;
            if (oilRents && oilRents > 1) {
                document.getElementById('mapInfoResources').textContent = `🛢️ ${oilRents.toFixed(1)}%`;
            } else {
                document.getElementById('mapInfoResources').textContent = '-';
            }
        }
    }
}

// Reset highlight
function resetHighlight(e) {
    if (geojsonLayer) {
        geojsonLayer.resetStyle(e.target);
    }
    // Info panel stays visible until user hovers over another country
}

// Zoom to country on click
function zoomToCountry(e) {
    map.fitBounds(e.target.getBounds());
}

// Update map with filtered data
function updateMapWithFilters(filteredInterventions) {
    if (!geojsonLayer) return;

    // Recount interventions based on filtered data
    interventionCounts = {};
    filteredInterventions.forEach(i => {
        const code = i.country?.code;
        if (code) {
            const country = Object.values(countriesData).find(c => c.code === code);
            if (country) {
                interventionCounts[country.iso3] = (interventionCounts[country.iso3] || 0) + 1;
            }
        }
    });

    // Update map colors
    geojsonLayer.setStyle(styleCountry);
}

// Export for use in app.js
window.initMap = initMap;
window.updateMapWithFilters = updateMapWithFilters;
