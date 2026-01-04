/**
 * charts.js
 * Visualizaciones Analíticas para Periodismo de Investigación
 * Sistema Data-Driven basado en configuración JSON
 */

let chartsConfig = [];
let chartInstances = {}; // Map: id -> Chart instance
let chartsCountriesMap = {}; // Map: code (iso2) -> data - Loaded from app.js context or fetch

// Color Palettes
const PALETTES = {
    regions: {
        'América Latina': '#ef4444', 'Latin America': '#ef4444',
        'Caribe': '#f97316', 'Caribbean': '#f97316',
        'Norteamérica': '#3b82f6', 'North America': '#3b82f6',
        'Europa': '#8b5cf6', 'Europe': '#8b5cf6',
        'Medio Oriente': '#f59e0b', 'Middle East': '#f59e0b',
        'Asia': '#10b981',
        'África': '#ec4899', 'Africa': '#ec4899',
        'Oceanía': '#14b8a6', 'Oceania': '#14b8a6',
        'Global': '#6b7280'
    },
    duration: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'], // Green to Red
    resources: ['#374151', '#fef08a', '#eab308', '#a16207', '#422006'], // Gray to Gold
    default: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']
};

/**
 * Initialize Charts System
 */
async function initCharts() {
    if (Object.keys(chartInstances).length > 0) return;

    try {
        const [configResp, countriesResp] = await Promise.all([
            fetch('data/charts_config.json'),
            fetch('data/countries.json')
        ]);

        chartsConfig = await configResp.json();
        const cData = await countriesResp.json();

        // Build local map
        cData.countries.forEach(c => {
            if (c.code) chartsCountriesMap[c.code] = c;
        });

        renderChartCards();
        initializeChartInstances();

    } catch (e) {
        console.error('Error loading charts configuration:', e);
        const grid = document.getElementById('chartsGrid');
        if (grid) grid.innerHTML = '<p style="color:red;text-align:center">Error loading charts configuration.</p>';
    }
}

/**
 * Render HTML Structure
 */
function renderChartCards() {
    const grid = document.getElementById('chartsGrid');
    if (!grid) return;

    const lang = window.currentLang || 'es';

    grid.innerHTML = chartsConfig.map(config => {
        const title = config.title?.[lang] || config.title?.es || config.id;
        const subtitle = config.subtitle?.[lang] || config.subtitle?.es || '';
        const isDoughnut = config.type === 'doughnut' || config.type === 'pie';
        const bodyClass = isDoughnut ? 'chart-body chart-body-doughnut' : 'chart-body';

        return `
            <div class="chart-card" id="card-${config.id}">
                <div class="chart-header">
                    <h3>${title}</h3>
                    <p class="chart-subtitle">${subtitle}</p>
                </div>
                <div class="${bodyClass}">
                    <canvas id="${config.id}"></canvas>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Initialize Instances
 */
function initializeChartInstances() {
    chartsConfig.forEach(config => {
        const ctx = document.getElementById(config.id);
        if (!ctx) return;

        const chartOptions = getChartOptions(config);

        chartInstances[config.id] = new Chart(ctx, {
            type: config.type,
            data: { labels: [], datasets: [] }, // Empty init
            options: chartOptions
        });
    });
}

/**
 * Generate Chart Options
 */
function getChartOptions(config) {
    const isHorizontal = config.orientation === 'horizontal';
    const isPie = config.type === 'doughnut' || config.type === 'pie';
    const isStacked = !!config.stackBy;

    const scales = isPie ? {} : {
        x: {
            beginAtZero: true,
            stacked: isStacked,
            grid: { color: 'rgba(255, 255, 255, 0.06)', display: !isHorizontal },
            ticks: { color: '#9ca3af', font: { size: 10 } }
        },
        y: {
            beginAtZero: true,
            stacked: isStacked,
            grid: { color: 'rgba(255, 255, 255, 0.06)', display: isHorizontal },
            ticks: { color: '#9ca3af', font: { size: 10 } }
        }
    };

    return {
        indexAxis: isHorizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        cutout: config.type === 'doughnut' ? '55%' : undefined,
        interaction: {
            mode: isStacked ? 'index' : 'nearest',
            intersect: false,
        },
        plugins: {
            legend: {
                display: isPie || isStacked, // Show legend for stacked
                position: 'bottom',
                labels: { color: '#d1d5db', padding: 12, usePointStyle: true, font: { size: 11 } }
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                titleColor: '#f5f5f5',
                bodyColor: '#d1d5db',
                borderColor: '#374151',
                borderWidth: 1,
                padding: 12,
                callbacks: {
                    label: (context) => {
                        const label = context.dataset.label || context.label || '';
                        const val = context.raw;
                        if (isPie) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = ((val / total) * 100).toFixed(1);
                            return ` ${label}: ${val} (${pct}%)`;
                        }
                        return ` ${label}: ${val}`;
                    }
                }
            }
        },
        scales: scales
    };
}

/**
 * Update logic
 */
function updateCharts(data, lang = 'es') {
    window.currentLang = lang;

    // Update titles
    chartsConfig.forEach(config => {
        const card = document.getElementById(`card-${config.id}`);
        if (card) {
            const h3 = card.querySelector('h3');
            const p = card.querySelector('.chart-subtitle');
            if (h3) h3.textContent = config.title?.[lang] || config.title?.es;
            if (p) p.textContent = config.subtitle?.[lang] || config.subtitle?.es;
        }
    });

    // Update Data
    chartsConfig.forEach(config => {
        const chart = chartInstances[config.id];
        if (!chart) return;

        const processResult = processChartData(data, config, lang);

        chart.data.labels = processResult.labels;
        chart.data.datasets = processResult.datasets; // Uses full datasets array

        chart.update('none');
    });
}

/**
 * CORE LOGIC: GROUPING & STACKING
 */
function processChartData(data, config, lang) {

    // --- Helper to get Key from Item ---
    const getKey = (d, type, buckets) => {
        if (type === 'country') {
            const val = d.country?.[lang] || d.country?.es || 'Unknown';
            if (config.exclude && config.exclude.some(ex => val.includes(ex))) return null;
            return val;
        }
        if (type === 'region') return d.continent?.[lang] || d.continent?.es || (lang === 'en' ? 'Other' : 'Otro');
        if (type === 'year_start') {
            return config.bucketSize
                ? Math.floor(d.year_start / config.bucketSize) * config.bucketSize + 's'
                : d.year_start;
        }
        if (type === 'duration') {
            const dur = (d.year_end || d.year_start) - d.year_start;
            if (config.buckets) {
                const b = config.buckets.find(x => dur <= x.max);
                return b ? (b.label?.[lang] || b.label?.es) : 'Unknown';
            }
            return dur;
        }
        if (type === 'resource_oil') {
            const code = d.country?.code;
            if (code && chartsCountriesMap[code]) {
                const val = chartsCountriesMap[code].resources?.oil_rents_pct_gdp?.value || 0;
                // Index-based keys for sorting: 0, 1, 2, 3
                if (val < 1) return '0';
                if (val < 5) return '1';
                if (val < 15) return '2';
                return '3';
            }
            return '0';
        }
        return 'Unknown';
    };

    // --- CASE 1: Simple Grouping (No Stack) ---
    if (!config.stackBy) {
        const counts = {};
        data.forEach(d => {
            const key = getKey(d, config.groupBy);
            if (key) counts[key] = (counts[key] || 0) + 1;
        });

        // Sort
        let sorted = Object.entries(counts);
        if (config.groupBy === 'year_start') sorted.sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
        else if (config.groupBy === 'resource_oil') sorted.sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
        else sorted.sort((a, b) => b[1] - a[1]);

        // Remap Labels for Resources
        if (config.groupBy === 'resource_oil') {
            const labelsMap = lang === 'en'
                ? ['Low/None (<1%)', 'Medium (1-5%)', 'High (5-15%)', 'Petro-State (>15%)']
                : ['Baja/Nula (<1%)', 'Media (1-5%)', 'Alta (5-15%)', 'Petro-Estado (>15%)'];
            sorted = sorted.map(([k, v]) => [labelsMap[parseInt(k)], v]);
        }

        if (config.limit) sorted = sorted.slice(0, config.limit);

        const labels = sorted.map(x => x[0]);
        const values = sorted.map(x => x[1]);

        // Colors
        let colors = [];
        if (config.style?.colorType === 'gradient') colors = createGradientColors(values.length, config.style.baseColor);
        else if (config.style?.palette === 'regions') colors = sorted.map(x => PALETTES.regions[x[0]] || '#6b7280');
        else if (config.style?.palette === 'resources') colors = ['#fef08a', '#eab308', '#a16207', '#422006']; // Simplified
        else colors = PALETTES.default.slice(0, values.length);
        if (colors.length < values.length && !config.style?.colorType) colors = PALETTES.default; // Fallback

        return {
            labels,
            datasets: [{
                label: lang === 'en' ? 'Interventions' : 'Intervenciones',
                data: values,
                backgroundColor: colors,
                borderWidth: 1,
                borderColor: '#1f2937'
            }]
        };
    }

    // --- CASE 2: Multi-Series Stacking (Two Dimensions) ---
    else {
        // Structure: buckets[xKey][stackKey] = count
        const buckets = {};
        const allXKeys = new Set();
        const allStackKeys = new Set();

        data.forEach(d => {
            const xKey = getKey(d, config.groupBy);
            const stackKey = getKey(d, config.stackBy);

            if (xKey && stackKey) {
                if (!buckets[xKey]) buckets[xKey] = {};
                buckets[xKey][stackKey] = (buckets[xKey][stackKey] || 0) + 1;
                allXKeys.add(xKey);
                allStackKeys.add(stackKey);
            }
        });

        // Sort X Axis (Years)
        const sortedXKeys = Array.from(allXKeys).sort((a, b) => parseInt(a) - parseInt(b));

        // Define Stack Order (Resource Levels 0-3)
        // If stackBy is resource_oil, use fixed order 0..3
        let stackOrder = [];
        if (config.stackBy === 'resource_oil') {
            stackOrder = ['0', '1', '2', '3']; // Intrinsic order
        } else {
            stackOrder = Array.from(allStackKeys).sort();
        }

        // Generate Datasets
        const datasets = stackOrder.map((stackKey, index) => {
            // Get data for this stack across all X keys
            const stackData = sortedXKeys.map(x => buckets[x][stackKey] || 0);

            // Resolve Label
            let label = stackKey;
            if (config.stackBy === 'resource_oil') {
                const labelsMap = lang === 'en'
                    ? ['Low/None (<1%)', 'Medium (1-5%)', 'High (5-15%)', 'Petro-State (>15%)']
                    : ['Baja/Nula (<1%)', 'Media (1-5%)', 'Alta (5-15%)', 'Petro-Estado (>15%)'];
                label = labelsMap[parseInt(stackKey)] || stackKey;
            }

            // Resolve Color
            let color = '#ccc';
            if (config.style?.palette === 'resources') {
                const resPalette = ['#fef08a', '#eab308', '#a16207', '#422006']; // Custom for oil
                color = resPalette[index] || '#ccc';
            } else {
                color = PALETTES.default[index % PALETTES.default.length];
            }

            return {
                label: label,
                data: stackData,
                backgroundColor: color,
                borderWidth: 1,
                borderColor: '#1f2937'
            };
        });

        // Filter out empty datasets if desired, but better to keep for legend consistency

        return {
            labels: sortedXKeys,
            datasets: datasets
        };
    }
}

function createGradientColors(count, baseColorName = 'blue') {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const opacity = 0.9 - (i * (0.8 / count));
        let r = 59, g = 130, b = 246;
        if (baseColorName === 'red') { r = 239; g = 68; b = 68; }
        colors.push(`rgba(${r}, ${g}, ${b}, ${opacity})`);
    }
    return colors;
}

// Expose
window.initCharts = initCharts;
window.updateCharts = updateCharts;
