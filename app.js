/**
 * US Interventions V2 - Main Application
 * Static site for GitHub Pages with pagination, timeline, and full i18n
 */

// ================================
// State
// ================================
let interventions = [];
let filteredData = [];
let currentLang = 'es';
let translations = {};
let currentPage = 1;
let currentTab = 'timeline';
const ITEMS_PER_PAGE = 10;

// ================================
// Country ISO Codes Mapping
// ================================
const countryToISO = {
    // Americas
    'estados unidos': 'US', 'united states': 'US', 'usa': 'US',
    'méxico': 'MX', 'mexico': 'MX',
    'cuba': 'CU',
    'nicaragua': 'NI',
    'panamá': 'PA', 'panama': 'PA',
    'colombia': 'CO',
    'haití': 'HT', 'haiti': 'HT',
    'república dominicana': 'DO', 'dominican republic': 'DO',
    'guatemala': 'GT',
    'honduras': 'HN',
    'el salvador': 'SV',
    'costa rica': 'CR',
    'argentina': 'AR',
    'chile': 'CL',
    'perú': 'PE', 'peru': 'PE',
    'bolivia': 'BO',
    'brasil': 'BR', 'brazil': 'BR',
    'venezuela': 'VE',
    'ecuador': 'EC',
    'uruguay': 'UY',
    'paraguay': 'PY',
    'puerto rico': 'PR',
    'grenada': 'GD', 'granada': 'GD',
    'canadá': 'CA', 'canada': 'CA',
    'jamaica': 'JM',
    'bahamas': 'BS',
    'trinidad': 'TT',

    // Europe
    'alemania': 'DE', 'germany': 'DE',
    'francia': 'FR', 'france': 'FR',
    'italia': 'IT', 'italy': 'IT',
    'españa': 'ES', 'spain': 'ES',
    'reino unido': 'GB', 'united kingdom': 'GB',
    'grecia': 'GR', 'greece': 'GR',
    'turquía': 'TR', 'turkey': 'TR',
    'rusia': 'RU', 'russia': 'RU',
    'serbia': 'RS',
    'bosnia': 'BA',
    'croacia': 'HR', 'croatia': 'HR',
    'albania': 'AL',
    'macedonia': 'MK',
    'austria': 'AT',
    'islandia': 'IS', 'iceland': 'IS',

    // Middle East
    'irak': 'IQ', 'iraq': 'IQ',
    'irán': 'IR', 'iran': 'IR',
    'siria': 'SY', 'syria': 'SY',
    'líbano': 'LB', 'lebanon': 'LB',
    'israel': 'IL',
    'jordania': 'JO', 'jordan': 'JO',
    'arabia saudita': 'SA', 'saudi arabia': 'SA',
    'kuwait': 'KW',
    'yemen': 'YE',
    'afganistán': 'AF', 'afghanistan': 'AF',
    'egipto': 'EG', 'egypt': 'EG',
    'golfo pérsico': 'SA', 'persian gulf': 'SA',

    // Asia
    'japón': 'JP', 'japan': 'JP',
    'china': 'CN',
    'corea': 'KR', 'korea': 'KR',
    'vietnam': 'VN',
    'filipinas': 'PH', 'philippines': 'PH',
    'tailandia': 'TH', 'thailand': 'TH',
    'indonesia': 'ID',
    'laos': 'LA',
    'camboya': 'KH', 'cambodia': 'KH',
    'pakistán': 'PK', 'pakistan': 'PK',
    'taiwán': 'TW', 'taiwan': 'TW',
    'timor oriental': 'TL', 'east timor': 'TL',

    // Africa
    'libia': 'LY', 'libya': 'LY',
    'somalia': 'SO',
    'sudán': 'SD', 'sudan': 'SD',
    'etiopía': 'ET', 'ethiopia': 'ET',
    'kenia': 'KE', 'kenya': 'KE',
    'nigeria': 'NG',
    'mali': 'ML',
    'chad': 'TD',
    'liberia': 'LR',
    'sierra leona': 'SL', 'sierra leone': 'SL',
    'congo': 'CD', 'zaire': 'CD',
    'uganda': 'UG',
    'yibuti': 'DJ', 'djibouti': 'DJ',
    'marruecos': 'MA', 'morocco': 'MA',
    'argelia': 'DZ', 'algeria': 'DZ',
    'eritrea': 'ER',
    'angola': 'AO',
    'gabón': 'GA', 'gabon': 'GA',

    // Oceania
    'australia': 'AU',
    'samoa': 'WS',
    'fiji': 'FJ',
    'groenlandia': 'GL', 'greenland': 'GL',
    'bermuda': 'BM'
};

// ================================
// Utility Functions
// ================================

function getCountryCode(countryName) {
    if (!countryName) return null;
    const n = countryName.toLowerCase().trim();
    for (const [key, code] of Object.entries(countryToISO)) {
        if (n.includes(key) || key.includes(n)) return code;
    }
    return null;
}

function getFlagEmoji(countryCode) {
    if (!countryCode) return '🌍';
    const codePoints = countryCode.toUpperCase().split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

function getDecade(year) {
    return Math.floor(year / 10) * 10 + 's';
}

function t(key) {
    const keys = key.split('.');
    let value = translations;
    for (const k of keys) {
        value = value?.[k];
    }
    return value || key;
}

// ================================
// Data Loading
// ================================

async function loadTranslations(lang) {
    try {
        const response = await fetch(`i18n/${lang}.json`);
        if (response.ok) {
            translations = await response.json();
        }
    } catch (e) {
        console.warn('Could not load translations:', e);
    }
}

async function loadData() {
    try {
        const response = await fetch('data/interventions.json');
        if (!response.ok) throw new Error('Failed');

        const data = await response.json();
        interventions = data.interventions || [];
        filteredData = [...interventions];

        // Sort by year descending (newest first)
        interventions.sort((a, b) => b.year_start - a.year_start);
        filteredData = [...interventions];

        updateStats();
        initializeFilters();
        render();

    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('timeline').innerHTML = '<p class="no-results">Error loading data</p>';
    }
}

// ================================
// Stats
// ================================

function updateStats() {
    const countries = new Set(interventions.map(i => i.country?.[currentLang] || i.country?.es));
    const years = interventions.length > 0
        ? Math.max(...interventions.map(i => i.year_end)) - Math.min(...interventions.map(i => i.year_start))
        : 0;

    document.getElementById('totalInterventions').textContent = interventions.length;
    document.getElementById('totalCountries').textContent = countries.size;
    document.getElementById('totalYears').textContent = years;
}

// ================================
// Filters
// ================================

function initializeFilters() {
    const decades = [...new Set(interventions.map(i => getDecade(i.year_start)))].sort().reverse();
    const sections = [...new Set(interventions.map(i => i.section).filter(Boolean))].sort();

    // Timeline decade filter
    const timelineDecade = document.getElementById('timelineDecade');
    timelineDecade.innerHTML = `<option value="">${t('filters.all')} décadas</option>`;
    decades.forEach(d => {
        timelineDecade.innerHTML += `<option value="${d}">${d}</option>`;
    });

    // Table filters
    const filterDecade = document.getElementById('filterDecade');
    const filterRegion = document.getElementById('filterRegion');

    filterDecade.innerHTML = `<option value="">${t('filters.all')}</option>`;
    decades.forEach(d => {
        filterDecade.innerHTML += `<option value="${d}">${d}</option>`;
    });

    filterRegion.innerHTML = `<option value="">${t('filters.all')}</option>`;
    sections.forEach(s => {
        filterRegion.innerHTML += `<option value="${s}">${s}</option>`;
    });
}

function applyFilters() {
    const searchTerm = document.getElementById('globalSearch').value.toLowerCase().trim();
    const decade = currentTab === 'timeline'
        ? document.getElementById('timelineDecade').value
        : document.getElementById('filterDecade').value;
    const section = document.getElementById('filterRegion').value;

    filteredData = interventions.filter(item => {
        // Search filter
        if (searchTerm) {
            const country = (item.country?.[currentLang] || item.country?.es || '').toLowerCase();
            const desc = (item.description?.[currentLang] || item.description?.es || '').toLowerCase();

            // Check if search term is a year (4 digits)
            const searchYear = parseInt(searchTerm);
            const isYearSearch = /^\d{4}$/.test(searchTerm) && searchYear >= 1700 && searchYear <= 2100;

            let matchesSearch = false;

            // If searching for a year, check if it falls within the intervention's year range
            if (isYearSearch) {
                matchesSearch = searchYear >= item.year_start && searchYear <= item.year_end;
            }

            // Also check country and description
            if (!matchesSearch) {
                matchesSearch = country.includes(searchTerm) || desc.includes(searchTerm);
            }

            // Also check exact year_start match for partial year searches
            if (!matchesSearch && !isYearSearch) {
                matchesSearch = String(item.year_start).includes(searchTerm) || String(item.year_end).includes(searchTerm);
            }

            if (!matchesSearch) {
                return false;
            }
        }

        // Decade filter
        if (decade && getDecade(item.year_start) !== decade) {
            return false;
        }

        // Section/Region filter
        if (section && item.section !== section) {
            return false;
        }

        return true;
    });

    currentPage = 1;
    render();
}

// ================================
// Pagination
// ================================

function getPaginatedData() {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
}

function getTotalPages() {
    return Math.ceil(filteredData.length / ITEMS_PER_PAGE);
}

function renderPagination(containerId) {
    const container = document.getElementById(containerId);
    const totalPages = getTotalPages();

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const end = Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length);

    let html = `
        <span class="pagination-info">
            ${t('pagination.showing')} ${start} ${t('pagination.to')} ${end} ${t('pagination.of')} ${filteredData.length}
        </span>
    `;

    // Previous button
    html += `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">←</button>`;

    // Page numbers
    const pages = getPageNumbers(currentPage, totalPages);
    pages.forEach(p => {
        if (p === '...') {
            html += `<span class="pagination-ellipsis">...</span>`;
        } else {
            html += `<button class="pagination-btn ${p === currentPage ? 'active' : ''}" onclick="goToPage(${p})">${p}</button>`;
        }
    });

    // Next button
    html += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">→</button>`;

    container.innerHTML = html;
}

function getPageNumbers(current, total) {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = [];
    pages.push(1);

    if (current > 3) pages.push('...');

    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
    }

    if (current < total - 2) pages.push('...');

    pages.push(total);

    return pages;
}

function goToPage(page) {
    const totalPages = getTotalPages();
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    render();

    // Scroll to top of content
    document.querySelector('.main-content').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ================================
// Timeline Rendering
// ================================

function renderTimeline() {
    const container = document.getElementById('timeline');
    const data = getPaginatedData();

    if (data.length === 0) {
        container.innerHTML = `<p class="no-results">${t('noResults')}</p>`;
        return;
    }

    container.innerHTML = data.map(item => {
        const flag = getFlagEmoji(item.country?.code || getCountryCode(item.country?.[currentLang]));
        const country = item.country?.[currentLang] || item.country?.es || 'Sin especificar';
        const desc = item.description?.[currentLang] || item.description?.es || '';
        const source = item.source?.[currentLang] || item.source?.es || '#';
        const years = item.year_start === item.year_end
            ? item.year_start
            : `${item.year_start} - ${item.year_end}`;

        return `
            <article class="timeline-item">
                <span class="timeline-year">${years}</span>
                <div class="timeline-card">
                    <div class="timeline-header">
                        <span class="timeline-flag">${flag}</span>
                        <span class="timeline-country">${country}</span>
                    </div>
                    <p class="timeline-description">${desc}</p>
                    <a href="${source}" target="_blank" rel="noopener" class="timeline-link">
                        ${t('table.viewSource')} →
                    </a>
                </div>
            </article>
        `;
    }).join('');

    renderPagination('timelinePagination');
}

// ================================
// Table Rendering
// ================================

function renderTable() {
    const tbody = document.getElementById('tableBody');
    const data = getPaginatedData();

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="no-results">${t('noResults')}</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(item => {
        const flag = getFlagEmoji(item.country?.code || getCountryCode(item.country?.[currentLang]));
        const country = item.country?.[currentLang] || item.country?.es || '-';
        const desc = item.description?.[currentLang] || item.description?.es || '-';
        const source = item.source?.[currentLang] || item.source?.es || '#';

        const shortDesc = desc.length > 150 ? desc.substring(0, 150) + '...' : desc;

        return `
            <tr>
                <td>${item.year_start}</td>
                <td>${item.year_end}</td>
                <td>
                    <div class="table-country">
                        <span class="table-flag">${flag}</span>
                        <span>${country}</span>
                    </div>
                </td>
                <td class="table-description">${shortDesc}</td>
                <td>
                    <a href="${source}" target="_blank" rel="noopener" class="table-link">
                        ${t('table.viewSource')}
                    </a>
                </td>
            </tr>
        `;
    }).join('');

    renderPagination('tablePagination');
}

// ================================
// Main Render
// ================================

function render() {
    if (currentTab === 'timeline') {
        renderTimeline();
    } else {
        renderTable();
    }
}

// ================================
// i18n
// ================================

async function updateLanguage() {
    await loadTranslations(currentLang);

    // Update all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });

    // Update HTML lang
    document.documentElement.lang = currentLang;

    // Update title
    document.title = t('title');

    // Re-initialize filters and render
    initializeFilters();
    updateStats();
    render();
}

function toggleLanguage() {
    currentLang = currentLang === 'es' ? 'en' : 'es';

    const toggle = document.getElementById('langToggle');
    const spans = toggle.querySelectorAll('span:not(.lang-separator)');
    spans.forEach(span => {
        if (span.textContent === 'ES') {
            span.className = currentLang === 'es' ? 'lang-active' : 'lang-inactive';
        } else if (span.textContent === 'EN') {
            span.className = currentLang === 'en' ? 'lang-active' : 'lang-inactive';
        }
    });

    updateLanguage();
}

// ================================
// Tabs
// ================================

function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1;

    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}Tab`);
    });

    render();
}

// ================================
// Downloads
// ================================

function downloadCSV() {
    const headers = ['year_start', 'year_end', 'section', 'country_es', 'country_en', 'country_code', 'description_es', 'description_en', 'source_es', 'source_en'];

    const rows = interventions.map(i => [
        i.year_start,
        i.year_end,
        i.section || '',
        i.country?.es || '',
        i.country?.en || '',
        i.country?.code || '',
        `"${(i.description?.es || '').replace(/"/g, '""')}"`,
        `"${(i.description?.en || '').replace(/"/g, '""')}"`,
        i.source?.es || '',
        i.source?.en || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csv, 'interventions.csv', 'text/csv');
}

function downloadJSON() {
    const json = JSON.stringify({ interventions }, null, 2);
    downloadFile(json, 'interventions.json', 'application/json');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ================================
// Event Listeners
// ================================

document.addEventListener('DOMContentLoaded', async () => {
    // Load translations first
    await loadTranslations(currentLang);

    // Load data
    await loadData();

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Language toggle
    document.getElementById('langToggle').addEventListener('click', toggleLanguage);

    // Global search
    let searchTimeout;
    document.getElementById('globalSearch').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(applyFilters, 300);
    });

    // Timeline decade filter
    document.getElementById('timelineDecade').addEventListener('change', applyFilters);

    // Table filters
    document.getElementById('filterDecade').addEventListener('change', applyFilters);
    document.getElementById('filterRegion').addEventListener('change', applyFilters);

    // Download buttons
    document.getElementById('downloadCSV').addEventListener('click', downloadCSV);
    document.getElementById('downloadJSON').addEventListener('click', downloadJSON);
});
