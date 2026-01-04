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
    const continents = new Set(interventions.map(i => i.continent?.[currentLang] || i.continent?.es).filter(Boolean));
    const years = interventions.length > 0
        ? Math.max(...interventions.map(i => i.year_end)) - Math.min(...interventions.map(i => i.year_start))
        : 0;

    document.getElementById('totalInterventions').textContent = interventions.length;
    document.getElementById('totalCountries').textContent = countries.size;
    document.getElementById('totalContinents').textContent = continents.size;
    document.getElementById('totalYears').textContent = years;
}

// ================================
// Filters
// ================================

function initializeFilters() {
    // Region filter (unified)
    const filterRegion = document.getElementById('filterRegion');
    if (filterRegion) {
        const regions = [...new Set(interventions.map(i => i.continent?.[currentLang] || i.continent?.es).filter(Boolean))].sort();
        filterRegion.innerHTML = `<option value="">${t('filters.allRegions') || 'Todas las regiones'}</option>`;
        regions.forEach(r => {
            filterRegion.innerHTML += `<option value="${r}">${r}</option>`;
        });
        filterRegion.addEventListener('change', applyFilters);
    }

    // Country filter (unified)
    const filterCountry = document.getElementById('filterCountry');
    if (filterCountry) {
        const countries = [...new Set(interventions.map(i => i.country?.[currentLang] || i.country?.es).filter(Boolean))].sort();
        filterCountry.innerHTML = `<option value="">${t('filters.allCountries') || 'Todos los países'}</option>`;
        countries.forEach(c => {
            filterCountry.innerHTML += `<option value="${c}">${c}</option>`;
        });
        filterCountry.addEventListener('change', applyFilters);
    }

    // Year sliders (unified)
    const yearStart = document.getElementById('yearStart');
    const yearEnd = document.getElementById('yearEnd');
    if (yearStart && yearEnd) {
        yearStart.addEventListener('input', updateYearSliders);
        yearEnd.addEventListener('input', updateYearSliders);
        initDraggableSlider(); // Initialize drag logic
        updateYearSliders(); // Initial visual update
    }

    // Clear filters button
    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearFilters);
    }
}

// Draggable Slider Logic
function initDraggableSlider() {
    const track = document.getElementById('sliderTrackActive');
    const startInput = document.getElementById('yearStart');
    const endInput = document.getElementById('yearEnd');
    const container = document.getElementById('yearSliderContainer');

    if (!track || !startInput || !endInput || !container) return;

    let isDragging = false;
    let startX, startVal, endVal, min, max, range;

    function onMouseDown(e) {
        if (e.target !== track) return;
        isDragging = true;
        startX = e.clientX || e.touches[0].clientX;
        startVal = parseInt(startInput.value);
        endVal = parseInt(endInput.value);
        min = parseInt(startInput.min);
        max = parseInt(startInput.max);
        range = max - min;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('touchmove', onMouseMove);
        document.addEventListener('touchend', onMouseUp);
        e.preventDefault();
    }

    function onMouseMove(e) {
        if (!isDragging) return;

        const currentX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
        const containerWidth = container.offsetWidth;
        const movePx = currentX - startX;
        const moveYears = Math.round((movePx / containerWidth) * range);

        let newStart = startVal + moveYears;
        let newEnd = endVal + moveYears;

        // Boundaries check
        if (newStart < min) {
            newStart = min;
            newEnd = min + (endVal - startVal);
        }
        if (newEnd > max) {
            newEnd = max;
            newStart = max - (endVal - startVal);
        }

        startInput.value = newStart;
        endInput.value = newEnd;

        updateYearSliders();
        e.preventDefault();
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('touchmove', onMouseMove);
        document.removeEventListener('touchend', onMouseUp);
    }

    track.addEventListener('mousedown', onMouseDown);
    track.addEventListener('touchstart', onMouseDown);
}

function updateYearSliders() {
    const yearStart = document.getElementById('yearStart');
    const yearEnd = document.getElementById('yearEnd');
    const startLabel = document.getElementById('yearStartLabel');
    const endLabel = document.getElementById('yearEndLabel');

    if (!yearStart || !yearEnd) return;

    let startVal = parseInt(yearStart.value);
    let endVal = parseInt(yearEnd.value);

    // Ensure start <= end
    if (startVal > endVal) {
        yearStart.value = endVal;
        startVal = endVal;
    }

    if (startLabel) startLabel.textContent = startVal;
    if (endLabel) endLabel.textContent = endVal;

    // Update active track visual
    const track = document.getElementById('sliderTrackActive');
    if (track) {
        const min = parseInt(yearStart.min);
        const max = parseInt(yearStart.max);
        const range = max - min;

        const leftPercent = ((startVal - min) / range) * 100;
        const widthPercent = ((endVal - startVal) / range) * 100;

        track.style.left = `${leftPercent}%`;
        track.style.width = `${widthPercent}%`;
    }

    applyFilters();
}

function clearFilters() {
    const yearStart = document.getElementById('yearStart');
    const yearEnd = document.getElementById('yearEnd');
    const filterRegion = document.getElementById('filterRegion');
    const filterCountry = document.getElementById('filterCountry');
    const globalSearch = document.getElementById('globalSearch');

    if (yearStart) yearStart.value = 1775;
    if (yearEnd) yearEnd.value = 2026;
    if (filterRegion) filterRegion.value = '';
    if (filterCountry) filterCountry.value = '';
    if (globalSearch) globalSearch.value = '';

    updateYearSliders();
}

function applyFilters() {
    const searchTerm = document.getElementById('globalSearch').value.toLowerCase().trim();

    // Unified year range filter
    const yearStartEl = document.getElementById('yearStart');
    const yearEndEl = document.getElementById('yearEnd');
    const yearStart = yearStartEl ? parseInt(yearStartEl.value) : 1775;
    const yearEnd = yearEndEl ? parseInt(yearEndEl.value) : 2026;

    // Unified region and country filters
    const regionFilter = document.getElementById('filterRegion')?.value || '';
    const countryFilter = document.getElementById('filterCountry')?.value || '';

    filteredData = interventions.filter(item => {
        // Search filter
        if (searchTerm) {
            const country = (item.country?.[currentLang] || item.country?.es || '').toLowerCase();
            const desc = (item.description?.[currentLang] || item.description?.es || '').toLowerCase();
            const continent = (item.continent?.[currentLang] || item.continent?.es || '').toLowerCase();

            // Check if search term is a year (4 digits)
            const searchYear = parseInt(searchTerm);
            const isYearSearch = /^\d{4}$/.test(searchTerm) && searchYear >= 1700 && searchYear <= 2100;

            let matchesSearch = false;

            if (isYearSearch) {
                matchesSearch = searchYear >= item.year_start && searchYear <= item.year_end;
            }

            if (!matchesSearch) {
                matchesSearch = country.includes(searchTerm) || desc.includes(searchTerm) || continent.includes(searchTerm);
            }

            if (!matchesSearch && !isYearSearch) {
                matchesSearch = String(item.year_start).includes(searchTerm) || String(item.year_end).includes(searchTerm);
            }

            if (!matchesSearch) {
                return false;
            }
        }

        // Unified year range filter (applies to all tabs)
        if (item.year_end < yearStart || item.year_start > yearEnd) {
            return false;
        }

        // Region filter
        if (regionFilter) {
            const itemRegion = item.continent?.[currentLang] || item.continent?.es || '';
            if (itemRegion !== regionFilter) {
                return false;
            }
        }

        // Country filter
        if (countryFilter) {
            const itemCountry = item.country?.[currentLang] || item.country?.es || '';
            if (itemCountry !== countryFilter) {
                return false;
            }
        }

        return true;
    });

    currentPage = 1;
    render();

    // Also update map if visible
    if (currentTab === 'map' && typeof updateMapWithFilters === 'function') {
        updateMapWithFilters(filteredData);
    }
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
        tbody.innerHTML = `<tr><td colspan="6" class="no-results">${t('noResults')}</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(item => {
        const flag = getFlagEmoji(item.country?.code || getCountryCode(item.country?.[currentLang]));
        const country = item.country?.[currentLang] || item.country?.es || '-';
        const continent = item.continent?.[currentLang] || item.continent?.es || 'Global';
        const desc = item.description?.[currentLang] || item.description?.es || '-';
        const source = item.source?.[currentLang] || item.source?.es || '#';

        const shortDesc = desc.length > 150 ? desc.substring(0, 150) + '...' : desc;

        return `
            <tr>
                <td>${item.year_start}</td>
                <td>${item.year_end}</td>
                <td><span class="continent-badge">${continent}</span></td>
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

    // Initialize map when first switching to map tab
    if (tabName === 'map' && typeof initMap === 'function') {
        initMap();
    }

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

    // Global search with autosuggest
    const searchInput = document.getElementById('globalSearch');
    const autosuggestDiv = document.getElementById('autosuggest');
    let searchTimeout;

    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const term = searchInput.value.toLowerCase().trim();

        // Show autosuggest only for text (not years)
        if (term.length >= 2 && !/^\d+$/.test(term)) {
            showAutosuggest(term);
        } else {
            hideAutosuggest();
        }

        searchTimeout = setTimeout(applyFilters, 300);
    });

    // Hide autosuggest on blur (with delay for click)
    searchInput.addEventListener('blur', () => {
        setTimeout(hideAutosuggest, 200);
    });

    // Show again on focus if there's text
    searchInput.addEventListener('focus', () => {
        const term = searchInput.value.toLowerCase().trim();
        if (term.length >= 2 && !/^\d+$/.test(term)) {
            showAutosuggest(term);
        }
    });

    // Timeline decade filter
    document.getElementById('timelineDecade').addEventListener('change', applyFilters);

    // Year range sliders for table
    const yearStartSlider = document.getElementById('yearStart');
    const yearEndSlider = document.getElementById('yearEnd');
    const yearStartLabel = document.getElementById('yearStartLabel');
    const yearEndLabel = document.getElementById('yearEndLabel');

    function updateYearSliders() {
        let startVal = parseInt(yearStartSlider.value);
        let endVal = parseInt(yearEndSlider.value);

        // Ensure start <= end
        if (startVal > endVal) {
            if (this === yearStartSlider) {
                yearEndSlider.value = startVal;
                endVal = startVal;
            } else {
                yearStartSlider.value = endVal;
                startVal = endVal;
            }
        }

        yearStartLabel.textContent = startVal;
        yearEndLabel.textContent = endVal;
        applyFilters();
    }

    yearStartSlider.addEventListener('input', updateYearSliders);
    yearEndSlider.addEventListener('input', updateYearSliders);

    // Download buttons
    document.getElementById('downloadCSV').addEventListener('click', downloadCSV);
    document.getElementById('downloadJSON').addEventListener('click', downloadJSON);
});

// ================================
// Autosuggest
// ================================

function showAutosuggest(term) {
    const autosuggestDiv = document.getElementById('autosuggest');

    // Get unique countries and continents
    const countries = [...new Set(interventions.map(i => i.country?.[currentLang] || i.country?.es).filter(Boolean))];
    const continents = [...new Set(interventions.map(i => i.continent?.[currentLang] || i.continent?.es).filter(Boolean))];

    // Filter matching
    const matchingContinents = continents.filter(c => c.toLowerCase().includes(term)).slice(0, 3);
    const matchingCountries = countries.filter(c => c.toLowerCase().includes(term)).slice(0, 7);

    if (matchingContinents.length === 0 && matchingCountries.length === 0) {
        hideAutosuggest();
        return;
    }

    let html = '';

    // Continents first
    matchingContinents.forEach(c => {
        html += `<div class="autosuggest-item" data-value="${c}">
            <span class="type">🌍</span>
            <span class="name">${highlightMatch(c, term)}</span>
        </div>`;
    });

    // Then countries
    matchingCountries.forEach(c => {
        const code = getCountryCode(c);
        const flag = getFlagEmoji(code);
        html += `<div class="autosuggest-item" data-value="${c}">
            <span class="type">${flag}</span>
            <span class="name">${highlightMatch(c, term)}</span>
        </div>`;
    });

    autosuggestDiv.innerHTML = html;
    autosuggestDiv.hidden = false;

    // Add click handlers
    autosuggestDiv.querySelectorAll('.autosuggest-item').forEach(item => {
        item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const value = item.dataset.value;
            document.getElementById('globalSearch').value = value;
            hideAutosuggest();
            applyFilters();
        });
    });
}

function hideAutosuggest() {
    const autosuggestDiv = document.getElementById('autosuggest');
    if (autosuggestDiv) {
        autosuggestDiv.hidden = true;
    }
}

function highlightMatch(text, term) {
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<strong style="color: var(--accent);">$1</strong>');
}
