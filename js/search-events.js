/**
 * Bộ lọc, tìm kiếm và sắp xếp bảng kết quả giải đấu (/events/tournaments/*).
 *
 * Giao diện công khai (được gọi từ HTML inline và từ tournament-fetcher.js /
 * aggregated-fetcher.js):
 *   window.searchTable()                    lọc + sắp xếp bảng (debounce 100ms)
 *   window.sortTournamentRows()             chỉ sắp xếp lại các dòng
 *   window.loadTournamentFiltersFromURL()   đọc bộ lọc từ query string
 *   window.toggleTourDropdown(id)           mở/đóng dropdown bộ lọc
 */
(() => {
'use strict';

/* ============================ Hằng số ============================ */

const DEFAULT_SORT = 'date-desc';
const SEARCH_DEBOUNCE_MS = 100;

/** Giá trị của #sortFilter -> thuộc tính data-* trên <tr> dùng làm khoá sắp xếp. */
const SORT_ATTRIBUTES = Object.freeze({
    'date-desc': 'data-start-time',
    'date-asc': 'data-start-time',
    'players-desc': 'data-players-count',
    'players-asc': 'data-players-count',
    'tours-desc': 'data-tours-count',
    'tours-asc': 'data-tours-count'
});

/** Các ô nhập đơn (search, sort) đồng bộ với query string. Thứ tự = thứ tự tham số trên URL. */
const FIELD_FILTERS = Object.freeze([
    {
        elementId: 'searchInput',
        param: 'search',
        read: element => (element.value || '').trim(),
        shouldSave: value => Boolean(value)
    },
    {
        elementId: 'sortFilter',
        param: 'sort',
        read: element => element.value,
        shouldSave: value => value !== DEFAULT_SORT
    }
]);

/** Các nhóm hộp kiểm đồng bộ với query string (chỉ lưu khi không chọn đủ tất cả). */
const GROUP_FILTERS = Object.freeze([
    { groupId: 'timeclass-checkbox-group', param: 'speed' },
    { groupId: 'variant-checkbox-group', param: 'var' },
    { groupId: 'format-checkbox-group', param: 'format' }
]);

const TIME_CLASS_ALIASES = Object.freeze({ lightning: 'bullet', standard: 'rapid' });
const VARIANT_ALIASES = Object.freeze({ chess: 'standard' });

const normalizeWithAliases = aliases => value => {
    const lower = value.toLowerCase();
    return aliases[lower] || lower;
};

const byId = id => document.getElementById(id);

/** Gọi `func` sau `wait` ms kể từ lần gọi cuối cùng. */
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/* ============================ Checkbox helpers ============================ */

function getCheckboxes(groupId) {
    return Array.from(byId(groupId)?.querySelectorAll('input[type="checkbox"]') ?? []);
}

/** Đọc một nhóm hộp kiểm bằng một truy vấn DOM duy nhất. */
function readCheckboxGroup(groupId) {
    const boxes = getCheckboxes(groupId);
    const checked = boxes.filter(box => box.checked).map(box => box.value);
    return { checked, total: boxes.length, isFiltering: checked.length < boxes.length };
}

/** Tham số URL (ngăn cách bởi khoảng trắng hoặc "+") -> danh sách giá trị lowercase. */
const parseListParam = value => value.toLowerCase().split(/[\s+]+/).filter(Boolean);

/** Giá trị của một hộp kiểm có thể gồm nhiều từ (vd. "bughouse crazyhouse ..."). */
const splitCheckboxValue = value => value.toLowerCase().split(/\s+/).filter(Boolean);

/* ============================ URL <-> bộ lọc ============================ */

function loadTournamentFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);

    FIELD_FILTERS.forEach(({ elementId, param }) => {
        const element = byId(elementId);
        const value = params.get(param);
        if (element && value !== null) element.value = value;
    });

    GROUP_FILTERS.forEach(({ groupId, param }) => {
        const value = params.get(param);
        if (value === null) return;
        const wanted = new Set(parseListParam(value));
        getCheckboxes(groupId).forEach(box => {
            box.checked = splitCheckboxValue(box.value).some(part => wanted.has(part));
        });
    });
}

function saveTournamentFiltersToURL() {
    const params = new URLSearchParams();

    FIELD_FILTERS.forEach(({ elementId, param, read, shouldSave }) => {
        const element = byId(elementId);
        if (!element) return;
        const value = read(element);
        if (shouldSave(value)) params.set(param, value);
    });

    GROUP_FILTERS.forEach(({ groupId, param }) => {
        const { checked, isFiltering } = readCheckboxGroup(groupId);
        if (isFiltering) params.set(param, checked.join(' '));
    });

    const query = params.toString();
    const nextURL = window.location.pathname + (query ? `?${query}` : '') + window.location.hash;
    const currentURL = window.location.pathname + window.location.search + window.location.hash;
    if (nextURL === currentURL) return;

    // Safari ném lỗi nếu replaceState bị gọi quá dày; lỗi đó không được chặn việc lọc bảng.
    try {
        window.history.replaceState(null, '', nextURL);
    } catch {
        // Bỏ qua: URL chỉ là tiện ích chia sẻ, không ảnh hưởng kết quả hiển thị.
    }
}

/* ============================ Sắp xếp ============================ */

function getTournamentTbody() {
    const table = byId('tournament-results-table');
    if (!table) return null;
    return byId('tournament-tbody') || table.querySelector('tbody');
}

const sortState = { tbody: null, value: null, rowCount: -1, rows: [], keys: [], orders: [] };

/**
 * Sắp xếp các dòng đã hoàn thành cùng các dòng giữ chỗ (skeleton) như một
 * chuỗi. Dòng giữ chỗ mang sẵn khoá sắp xếp từ metadata nên khi được thay bằng
 * dòng thật, vị trí của các dòng khác không đổi.
 */
function sortTournamentRows() {
    const tbody = getTournamentTbody();
    if (!tbody) return false;

    if (tbody !== sortState.tbody) {
        sortState.tbody = tbody;
        sortState.value = null;
        sortState.rowCount = -1;
        sortState.rows = [];
        sortState.keys = [];
        sortState.orders = [];
    }

    const sortValue = byId('sortFilter')?.value || DEFAULT_SORT;
    const sortAttribute = SORT_ATTRIBUTES[sortValue];
    if (!sortAttribute) return false;

    const rows = Array.from(tbody.children);
    const sortableRows = rows.filter(row =>
        !row.classList.contains('not-match') &&
        (row.classList.contains('skeleton-row') || row.hasAttribute('data-start-time'))
    );

    // Không đoán vị trí khi chưa biết khoá sắp xếp. Trang giải thường nạp đủ
    // metadata cho mọi dòng giữ chỗ; trang tổng hợp chờ đủ khoá số lượng rồi mới sắp theo số.
    if (!sortableRows.length || sortableRows.some(row => !row.hasAttribute(sortAttribute))) return false;
    if (
        sortValue === sortState.value &&
        sortableRows.length === sortState.rowCount &&
        sortableRows.every((row, index) =>
            row === sortState.rows[index] &&
            row.getAttribute(sortAttribute) === sortState.keys[index] &&
            row.getAttribute('data-sort-order') === sortState.orders[index]
        )
    ) return false;

    const toNumber = (raw, fallback) => {
        const value = raw === null ? NaN : Number(raw);
        return Number.isFinite(value) ? value : fallback;
    };
    // Tính khoá một lần cho mỗi dòng thay vì trong comparator.
    const sortKeys = new Map(sortableRows.map((row, index) => [row, {
        value: toNumber(row.getAttribute(sortAttribute), 0),
        order: toNumber(row.getAttribute('data-sort-order'), index)
    }]));
    const direction = sortValue.endsWith('-desc') ? -1 : 1;

    sortableRows.sort((a, b) => {
        const keyA = sortKeys.get(a);
        const keyB = sortKeys.get(b);
        const difference = keyA.value - keyB.value;
        return difference !== 0 ? direction * difference : keyA.order - keyB.order;
    });

    // Các dòng còn lại (vd. thông báo "không tìm thấy") luôn nằm cuối.
    const sortableSet = new Set(sortableRows);
    const ordered = sortableRows.concat(rows.filter(row => !sortableSet.has(row)));

    // Chỉ di chuyển DOM khi thứ tự thật sự thay đổi.
    if (ordered.some((row, index) => row !== rows[index])) {
        const fragment = document.createDocumentFragment();
        ordered.forEach(row => fragment.appendChild(row));
        tbody.appendChild(fragment);
    }

    sortState.value = sortValue;
    sortState.rowCount = sortableRows.length;
    sortState.rows = sortableRows.slice();
    sortState.keys = sortableRows.map(row => row.getAttribute(sortAttribute));
    sortState.orders = sortableRows.map(row => row.getAttribute('data-sort-order'));
    return true;
}

/* ============================ Lọc ============================ */

// Văn bản (viết hoa) của từng dòng; được xoá theo dòng khi nội dung dòng đó đổi.
const rowTextCache = new WeakMap();
let rowObserver = null;
let observedTbody = null;

function invalidateRowTexts(records) {
    records.forEach(({ target }) => {
        const element = target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;
        const row = element?.closest('tr');
        if (row) rowTextCache.delete(row);
    });
}

function watchRowContent(tbody) {
    if (typeof MutationObserver === 'undefined') return;
    if (observedTbody !== tbody) {
        rowObserver?.disconnect();
        observedTbody = tbody;
        rowObserver = new MutationObserver(invalidateRowTexts);
        rowObserver.observe(tbody, { childList: true, characterData: true, subtree: true });
    }
    // Xử lý ngay các thay đổi chưa được giao để cache không bao giờ cũ.
    invalidateRowTexts(rowObserver.takeRecords());
}

function getRowText(row) {
    let text = rowTextCache.get(row);
    if (text === undefined) {
        text = row.textContent.toUpperCase();
        rowTextCache.set(row, text);
    }
    return text;
}

/** Danh sách điều kiện thuộc tính đang bật: dòng phải có thuộc tính và giá trị (đã chuẩn hoá) nằm trong `allowed`. */
function buildAttributeFilters() {
    const timeClass = readCheckboxGroup('timeclass-checkbox-group');
    const variant = readCheckboxGroup('variant-checkbox-group');
    const format = readCheckboxGroup('format-checkbox-group');
    const cttqStatus = byId('cttq-status-filter')?.value || 'all';

    const filters = [];
    if (timeClass.isFiltering) {
        filters.push({ attr: 'data-time-class', allowed: new Set(timeClass.checked), normalize: normalizeWithAliases(TIME_CLASS_ALIASES) });
    }
    if (variant.isFiltering) {
        filters.push({ attr: 'data-variant', allowed: new Set(variant.checked.flatMap(splitCheckboxValue)), normalize: normalizeWithAliases(VARIANT_ALIASES) });
    }
    if (format.isFiltering) {
        filters.push({ attr: 'data-format', allowed: new Set(format.checked), normalize: value => value.toLowerCase() });
    }
    if (cttqStatus !== 'all') {
        filters.push({ attr: 'data-status', allowed: new Set([cttqStatus]), normalize: value => value });
    }
    return filters;
}

function matchesAttributeFilters(row, filters) {
    for (const { attr, allowed, normalize } of filters) {
        const value = row.getAttribute(attr);
        if (!value || !allowed.has(normalize(value))) return false;
    }
    return true;
}

function setRowDisplay(row, display) {
    if (row.style.display !== display) row.style.display = display;
}

function filterTournamentTable() {
    const searchInput = byId('searchInput');
    if (!searchInput) return;

    saveTournamentFiltersToURL();

    const tbody = getTournamentTbody();
    if (!tbody) return;

    watchRowContent(tbody);
    // Dòng đã hoàn thành giữ nguyên vị trí của dòng giữ chỗ tương ứng.
    sortTournamentRows();

    const searchText = searchInput.value.toUpperCase();
    const attributeFilters = buildAttributeFilters();
    const notMatchRow = tbody.querySelector('tr.not-match');

    let matchedCount = 0;
    let hasPendingRows = false;

    for (const row of tbody.getElementsByTagName('tr')) {
        if (row.classList.contains('not-match')) continue;

        if (row.classList.contains('skeleton-row')) {
            hasPendingRows = true;
            setRowDisplay(row, '');
            continue;
        }

        const matches = (!searchText || getRowText(row).includes(searchText)) &&
            matchesAttributeFilters(row, attributeFilters);
        setRowDisplay(row, matches ? '' : 'none');
        if (matches) matchedCount++;
    }

    if (notMatchRow) notMatchRow.style.display = matchedCount === 0 && !hasPendingRows ? '' : 'none';
}

/* ============================ Dropdown ============================ */

function toggleTourDropdown(id) {
    const element = byId(id);
    if (!element) return;

    document.querySelectorAll('.tour-dropdown').forEach(dropdown => {
        if (dropdown.id !== id) dropdown.classList.remove('open');
    });
    element.classList.toggle('open');
}

window.addEventListener('click', event => {
    if (event.target.closest('.tour-dropdown')) return;
    document.querySelectorAll('.tour-dropdown.open').forEach(dropdown => dropdown.classList.remove('open'));
});

/* ============================ Giao diện công khai ============================ */

window.loadTournamentFiltersFromURL = loadTournamentFiltersFromURL;
window.sortTournamentRows = sortTournamentRows;
window.searchTable = debounce(filterTournamentTable, SEARCH_DEBOUNCE_MS);
window.toggleTourDropdown = toggleTourDropdown;
})();