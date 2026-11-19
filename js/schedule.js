const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbzBFtevfcYM7MLEgpB2R5hn4_sS3RovSy_rBiuljJMRgOJ7KEl50lffXH46aEOd-uAX/exec',
    VIETNAM_OFFSET_MS: 7 * 3600 * 1000,
    EVENT_DURATION_MS: 2 * 60 * 60 * 1000,
    MONTH_NAMES: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
    DAY_NAMES_VN: ['Chủ Nhật', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy'],
    INTERNAL_EVENT_TYPES: ["cttq", "tvlt", "cbtt", "dttv"]
};

const STATUS = Object.freeze({
    ONGOING: 'Đang diễn ra',
    UPCOMING: 'Sắp diễn ra',
    TENTATIVE: 'Dự kiến',
    ENDED: 'Đã kết thúc'
});

const ORGANIZER_MAP = {
    'M-DinhHoangViet': '<a href="/leaders#admin3" target="_blank">M-DinhHoangViet</a> (CLB <a href="/leaders" target="_blank">Thí Vua Lấy Tốt</a>)',
    'Mr. TungJohn': '<a href="https://youtube.com/channel/UCvNW1NAWWjblgrP6JQI4MbQ" target="_blank">Mr.TungJohn</a> (CLB <a href="/leaders" target="_blank">Thí Vua Lấy Tốt</a>)',
    'Chess123-2k': '<a href="https://chess.com/member/Chess123-2k" target="_blank">Chess123-2k</a> (CLB <a href="https://link.chess.com/club/0CVQh6" target="_blank">Thí Vua Lấy Tốt</a>)',
    'VN-SenJin': '<a href="/leaders#admin5" target="_blank">VN-SenJin</a> (CLB <a href="/leaders" target="_blank">Thí Vua Lấy Tốt</a>)',
    'FR-CH_TheClanTeamIsMine': '<a href="/leaders#admin2" target="_blank">FR-CH_TheClanTeamIsMine</a> (CLB <a href="/leaders" target="_blank">Thí Vua Lấy Tốt</a>)'
};

const CHESS_TERMS_RULES = [
    { regex: /Đấu trường đa CLB/gi, url: 'https://support.chess.com/articles/8724653-how-can-i-create-a-multi-club-arena' },
    { regex: /Đấu trường Arena/gi, url: 'https://support.chess.com/articles/8562889-what-are-arena-tournaments' },
    { regex: /Hệ Thụy Sĩ/gi, url: 'https://chess.com/terms/swiss-chess' },
    { regex: /King of the Hill/gi, url: 'https://chess.com/terms/king-of-the-hill' },
    { regex: /Crazyhouse/gi, url: 'https://chess.com/terms/crazyhouse' },
    { regex: /Bughouse/gi, url: 'https://chess.com/terms/bughouse' },
    { regex: /Three Check|3 Check|3 chiếu/gi, url: 'https://chess.com/terms/3-check-chess' },
    { regex: /Chess960|960/gi, url: 'https://chess.com/terms/chess960' },
    { regex: /\bKOTH\b/gi, url: 'https://chess.com/terms/king-of-the-hill' },
    { regex: /Daily|Cờ Hàng Ngày|Đấu Hàng Ngày/gi, url: 'https://chess.com/terms/correspondence-chess' },
    { regex: /Cờ bỏ phiếu/gi, url: 'https://support.chess.com/articles/8614177-how-do-i-play-vote-chess' }
];

const ICON_RULES = [
    { keys: ['blitz'], url: 'icons/smileys/2x/blitz.png' },
    { keys: ['bullet', 'lightning'], url: 'icons/smileys/2x/bullet.png' },
    { keys: ['rapid'], url: 'icons/smileys/2x/live.png' },
    { keys: ['daily', 'ngày', 'nước đi'], url: 'icons/smileys/2x/daily.png' },
    { keys: ['chess960', '960'], url: 'variants/live_960_orange.svg' },
    { keys: ['crazyhouse'], url: 'variants/crazyhouse.svg' },
    { keys: ['bughouse'], url: 'variants/bughouse.svg' },
    { keys: ['king of the hill', 'koth'], url: 'variants/koth.svg' },
    { keys: ['three check', '3 chiếu', '3check'], url: 'variants/3check.svg' }
];

const BANNER_MAP = {
    tvlt: "/images/events/sieu-giai-thi-vua-lay-tot.png",
    cttq: "/images/events/giai-chien-truong-thi-quan.png",
    cbtt: "/images/events/su-kien-co-bi-thi-tot.png",
    dttv: "/images/events/dau-truong-thi-vua.svg",
    "club-arena": "https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/VN-SenJin/phpjs58p98gfqbbaDynSFJ.png",
    "multi-club-arena": "https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/VN-SenJin/php4oaq7r23q7n79I3kRE6.png",
    "swiss": "https://images.chesscomfiles.com/uploads/v1/chess_term/a4c9fe4c-9c0b-11ed-b393-4181bdd78517.3191b6e0.630x354o.10a700f2cb88.png",
    "vote": "https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/M-DinhHoangViet/php8s3ooliju70kciI1yut.png",
    "daily": "https://images.chesscomfiles.com/uploads/v1/chess_term/f1e3ca50-b739-11ea-a14a-a1c9be904231.33918ce9.630x354o.8cae25a1ccc9.png"
};

const INFO_MAP = {
    tvlt: "/events/tvlt-thi-vua-lay-tot",
    cttq: "/events/cttq-chien-truong-thi-quan",
    cbtt: "/events/cbtt-co-bi-thi-tot",
    dttv: "/events/tournaments/dttv",
    "club-arena": "https://support.chess.com/articles/8562889-what-are-arena-tournaments",
    "swiss": "https://chess.com/terms/swiss-chess",
    "vote": "https://support.chess.com/articles/8614177-how-do-i-play-vote-chess",
    "daily": "https://support.chess.com/articles/8649115-what-are-club-matches",
    "multi-club-arena": "https://support.chess.com/articles/8724653-how-can-i-create-a-multi-club-arena"
};

const DOM = {};
const STATE = {
    tournaments: [],
    selectedEvent: null,
    currentView: 'calendar',
    displayYear: undefined,
    displayMonth: undefined,
    lastFocusedElement: null,
    previousBodyOverflow: '',
    statusFilter: 'all',
    hasUsableData: false,
    refreshPromise: null,
};

function cacheDOMElements() {
    DOM.loadingEl = document.getElementById('loading');
    DOM.errorEl = document.getElementById('error');
    DOM.emptyEl = document.getElementById('empty');
    DOM.retryButton = null;
    DOM.lastUpdatedEl = document.getElementById('last-updated');
    DOM.statusFilters = document.getElementById('schedule-status-filters');
    DOM.viewSwitcherContainer = document.getElementById('view-switcher-container');
    DOM.scheduleFilters = document.getElementById('schedule-filters');
    DOM.calendarWrapper = document.getElementById('calendar-wrapper');
    DOM.listWrapper = document.getElementById('list-wrapper');
    DOM.calendarBody = document.getElementById('calendar-body');
    DOM.listContainer = document.getElementById('list-container');
    DOM.monthTitle = document.getElementById('month-title');
    DOM.monthYear = document.getElementById('month-year');
    DOM.btnPrevMonth = document.getElementById('btn-prev-month');
    DOM.btnNextMonth = document.getElementById('btn-next-month');
    DOM.resultsSummary = document.getElementById('schedule-results-summary');
    DOM.resetFilters = document.getElementById('schedule-reset-filters');
    DOM.categoryButton = document.getElementById('schedule-category-button');
    DOM.btnViewCalendar = document.getElementById('btn-view-calendar');
    DOM.btnViewList = document.getElementById('btn-view-list');
    DOM.scheduleSearch = document.getElementById('schedule-search');
    DOM.schedulePrizeFilter = document.getElementById('schedule-prize-filter');
    DOM.scheduleTypeGroup = document.getElementById('schedule-type-group');
    DOM.eventModal = document.getElementById('eventModal');
    DOM.modalDialog = DOM.eventModal?.querySelector('.cc-modal-dialog') || null;
    DOM.modalCloseBtn = DOM.eventModal?.querySelector('.cc-modal-close') || null;
    DOM.modalName = document.getElementById('modal-name');
    DOM.modalCategory = document.getElementById('modal-category');
    DOM.modalOrganizer = document.getElementById('modal-organizer');
    DOM.modalTime = document.getElementById('modal-time');
    DOM.modalGameRules = document.getElementById('modal-game-rules');
    DOM.modalEventRules = document.getElementById('modal-event-rules');
    DOM.modalLogo = document.getElementById('modal-logo');
    DOM.modalLogoLink = document.getElementById('modal-logo-link');
    DOM.modalBanner = document.getElementById('modal-banner');
    DOM.modalJoinBtn = document.getElementById('modal-join');
    DOM.modalRuleBtn = document.getElementById('modal-rule');
    DOM.modalResultsBtn = document.getElementById('modal-results');
}

function safeUrl(value, fallback = '') {
    const raw = String(value ?? '').trim();
    if (!raw) return fallback;
    try {
        const url = new URL(raw, window.location.origin);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : fallback;
    } catch {
        return fallback;
    }
}

function setSafeImageSource(image, source, fallback) {
    if (!image) return;
    image.onerror = () => {
        image.onerror = null;
        image.src = fallback;
    };
    image.src = safeUrl(source, fallback);
}
function getVietnamNow() {
    const now = new Date();
    const vnTime = new Date(now.getTime() + CONFIG.VIETNAM_OFFSET_MS);
    return vnTime;
}

function parseEventDate(dateStr) {
    if (typeof dateStr !== 'string' || !dateStr.trim()) return null;
    let formatted = dateStr.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) {
        formatted += 'T00:00:00+07:00';
    } else {
        formatted = formatted.replace(' ', 'T');
        if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(formatted)) formatted += '+07:00';
    }

    const date = new Date(formatted);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getVietnamDateParts(dateStr) {
    if (typeof dateStr === 'string') {
        const dateOnly = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (dateOnly) {
            const year = Number(dateOnly[1]);
            const month = Number(dateOnly[2]) - 1;
            const day = Number(dateOnly[3]);
            const check = new Date(Date.UTC(year, month, day));
            if (check.getUTCFullYear() === year && check.getUTCMonth() === month && check.getUTCDate() === day) {
                return { year, month, date: day, hours: 0, minutes: 0 };
            }
        }
    }

    const date = parseEventDate(dateStr);
    if (!date) return { year: 1970, month: 0, date: 1, hours: 0, minutes: 0 };

    const vnDate = new Date(date.getTime() + CONFIG.VIETNAM_OFFSET_MS);
    return {
        year: vnDate.getUTCFullYear(),
        month: vnDate.getUTCMonth(),
        date: vnDate.getUTCDate(),
        hours: vnDate.getUTCHours(),
        minutes: vnDate.getUTCMinutes()
    };
}

function getDayOfWeekVn(dateStr) {
    const parts = getVietnamDateParts(dateStr);
    const date = new Date(parts.year, parts.month, parts.date);
    return CONFIG.DAY_NAMES_VN[date.getDay()];
}

function padZero(n) {
    return String(n).padStart(2, '0');
}

const parseMarkdownLinks = (() => {
    const cache = new Map();

    return (input) => {
        const text = String(input ?? '');

        if (!text || text === 'Chưa có thông tin') {
            return escapeHTML(text);
        }

        if (cache.has(text)) return cache.get(text);

        const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
        let html = '';
        let lastIndex = 0;
        let match;

        while ((match = pattern.exec(text)) !== null) {
            html += escapeHTML(text.slice(lastIndex, match.index));

            let linkHTML = escapeHTML(match[0]);

            try {
                const url = new URL(match[2], window.location.origin);

                if (['http:', 'https:'].includes(url.protocol)) {
                    linkHTML =
                        '<a href="' + escapeHTML(url.href) +
                        '" target="_blank" rel="noopener noreferrer">' +
                        escapeHTML(match[1]) + '</a>';
                }
            } catch {
                // Keep malformed URLs as safely escaped text.
            }

            html += linkHTML;
            lastIndex = pattern.lastIndex;
        }

        html += escapeHTML(text.slice(lastIndex));
        cache.set(text, html);

        return html;
    };
})();

const linkifyChessTerms = (() => {
    const cache = new Map();
    return (text) => {
        if (!text || text === 'Chưa có thông tin') return text;
        if (cache.has(text)) return cache.get(text);

        const placeholders = [];
        let result = text.replace(/<a\b[^>]*>.*?<\/a>/gi, (match) => {
            placeholders.push(match);
            return `___PH_${placeholders.length - 1}___`;
        });

        CHESS_TERMS_RULES.forEach(({ regex, url }) => {
            result = result.replace(regex, (match) => {
                placeholders.push(`<a href="${url}" target="_blank" class="rule-helper-link">${match}</a>`);
                return `___PH_${placeholders.length - 1}___`;
            });
        });

        for (let i = placeholders.length - 1; i >= 0; i--) {
            result = result.replace(`___PH_${i}___`, placeholders[i]);
        }

        cache.set(text, result);
        return result;
    };
})();

function getGameRulesWithIcon(rulesText) {
    if (!rulesText || rulesText === 'Chưa có thông tin') return rulesText;
    const lower = rulesText.toLowerCase();

    const icons = ICON_RULES
        .filter(rule => rule.keys.some(k => lower.includes(k)))
        .map(rule => {
            const fullUrl = `https://chess.com/bundles/web/images/${rule.url}`;
            return `<img src="${fullUrl}" width="17" height="17" alt="" style="vertical-align:middle;margin-left:4px;">`;
        })
        .join('');

    return rulesText + icons;
}

function getPrizeCategory(tournament) {
    const prize = tournament?.prize;
    if (typeof prize === 'boolean') return prize ? 'Có thưởng' : 'Giao lưu';
    if (typeof prize === 'number') return prize > 0 ? 'Có thưởng' : 'Giao lưu';

    const value = String(prize || '').toLowerCase().trim().replace(/\s*\+\s*/g, '+');
    if (['đặc biệt+có thưởng', 'đặc biệt có thưởng', 'special+prize'].includes(value)) return 'Đặc biệt+Có thưởng';
    if (['đặc biệt', 'special'].includes(value)) return 'Đặc biệt';
    if (['giao lưu', 'không', 'không có', 'false', '0', ''].includes(value)) return 'Giao lưu';
    if (['có thưởng', 'co thuong', 'prize', 'true', '1'].includes(value)) return 'Có thưởng';

    return 'Có thưởng';
}

function getEventBadgesHTML(tournament) {
    let html = '';
    const category = getPrizeCategory(tournament);

    if (category === 'Đặc biệt+Có thưởng') {
        html += `<span class="badge-schedule badge-special-prize"><i class="bx bxs-star"></i> Đặc biệt+Có thưởng</span>`;
    } else if (category === 'Đặc biệt') {
        html += `<span class="badge-schedule badge-special"><i class="bx bxs-star"></i> Đặc biệt</span>`;
    } else if (category === 'Có thưởng') {
        html += `<span class="badge-schedule badge-co-thuong"><i class="bx bxs-award"></i> Có thưởng</span>`;
    } else {
        html += `<span class="badge-schedule badge-giao-luu"><i class="bx bx-coffee"></i> Giao lưu</span>`;
    }

    const status = getEventStatus(tournament);
    if (status === STATUS.TENTATIVE) {
        html += `<span class="badge-schedule badge-tentative"><i class="bx bx-time-five"></i> Dự kiến</span>`;
    } else if (status === STATUS.UPCOMING) {
        html += `<span class="badge-schedule badge-upcoming"><i class="bx bx-calendar-event"></i> Sắp diễn ra</span>`;
    } else if (status === STATUS.ONGOING) {
        html += `<span class="badge-schedule badge-ongoing"><i class="bx bx-play-circle"></i> Đang diễn ra</span>`;
    } else if (status === STATUS.ENDED) {
        html += `<span class="badge-schedule badge-ended"><i class="bx bx-check-circle"></i> Đã kết thúc</span>`;
    }

    return html;
}

function isPrizeEvent(tournament) {
    const category = getPrizeCategory(tournament);
    return category === 'Có thưởng' || category === 'Đặc biệt+Có thưởng';
}

function getExplicitEventStatus(tournament) {
    const value = String(tournament?.status || '')
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, ' ');

    if (['đã kết thúc', 'ended', 'finished', 'completed'].includes(value)) return STATUS.ENDED;
    if (['sắp diễn ra', 'upcoming', 'scheduled'].includes(value)) return STATUS.UPCOMING;
    if (['dự kiến', 'tentative', 'proposed'].includes(value)) return STATUS.TENTATIVE;
    if (['đang diễn ra', 'in progress', 'ongoing', 'live', 'running', 'active'].includes(value)) {
        return STATUS.ONGOING;
    }

    return '';
}

function getEventStatus(tournament) {
    const explicitStatus = getExplicitEventStatus(tournament);

    // Explicit terminal/live/tentative states take precedence over inferred dates.
    if ([STATUS.ENDED, STATUS.TENTATIVE, STATUS.ONGOING].includes(explicitStatus)) {
        return explicitStatus;
    }

    const tentative = tournament?.isTentative;
    if (tentative === true || tentative === 'true' || tentative === STATUS.TENTATIVE || tentative === 'Tentative') {
        return STATUS.TENTATIVE;
    }

    // A past start date alone does not prove that an event has ended.
    // Treat it as ongoing until its configured fallback duration has elapsed.
    const now = Date.now();
    const start = getEventStartTime(tournament);
    const end = getEventEndTime(tournament);

    if (start > now) return explicitStatus || STATUS.UPCOMING;
    if (end > now) return STATUS.ONGOING;
    return STATUS.ENDED;
}

function isTentativeEvent(tournament) {
    return getEventStatus(tournament) === STATUS.TENTATIVE;
}

function isEndedEvent(tournament) {
    return getEventStatus(tournament) === STATUS.ENDED;
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function getMappedOrganizer(rawOrganizer, organizerLinks = []) {
    if (Array.isArray(organizerLinks) && organizerLinks.length) {
        return organizerLinks.map(item => {
            const label = escapeHTML(item?.text || '');
            const rawUrl = String(item?.url || '').trim();
            if (!rawUrl) return label;

            try {
                const url = new URL(rawUrl, window.location.origin);
                if (!['http:', 'https:'].includes(url.protocol)) return label;
                return `<a href="${escapeHTML(url.href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
            } catch {
                return label;
            }
        }).join('');
    }

    return ORGANIZER_MAP[rawOrganizer] || parseMarkdownLinks(rawOrganizer) || 'Quản trị viên';
}

function getCurrentMonthEvents(filters = getFilterState()) {
    return getSortedEvents().filter(tournament => {
        const parts = getVietnamDateParts(tournament.startTime);
        return parts.year === STATE.displayYear && parts.month === STATE.displayMonth && matchesFilters(tournament, filters);
    });
}

function updateFilterControls(filters = getFilterState()) {
    const allTypes = Array.from(DOM.scheduleTypeGroup?.querySelectorAll('input[type="checkbox"]:not(#schedule-prize-filter):not([data-internal-filter])') || []);
    const selectedVisibleTypes = allTypes.filter(checkbox => checkbox.checked);
    const hasActiveFilters = Boolean(filters.search || filters.onlyPrize ||
        selectedVisibleTypes.length !== allTypes.length || STATE.statusFilter !== 'all');
    if (DOM.resetFilters) DOM.resetFilters.hidden = !hasActiveFilters;
    if (DOM.categoryButton) {
        const categoryLabel = DOM.categoryButton.querySelector('[data-filter-label], .tour-dropdown-btn-content span');
        const categoryText = `Thể loại (${selectedVisibleTypes.length}/${allTypes.length})`;
        if (categoryLabel) categoryLabel.textContent = categoryText;
        DOM.categoryButton.setAttribute('aria-label', `${categoryText}. Mở bộ lọc thể loại`);
    }
}

function updateResultsSummary() {
    if (!DOM.resultsSummary || STATE.displayYear === undefined) return;

    if (STATE.currentView === 'list') {
        const events = getListViewEvents(STATE.displayYear, STATE.displayMonth, getFilterState());
        const earlierOngoingCount = events.filter(tournament => {
            const parts = getVietnamDateParts(tournament.startTime);
            return (parts.year !== STATE.displayYear || parts.month !== STATE.displayMonth) &&
                getEventStatus(tournament) === STATUS.ONGOING;
        }).length;
        const monthLabel = `${CONFIG.MONTH_NAMES[STATE.displayMonth]}/${STATE.displayYear}`;
        const extraLabel = earlierOngoingCount
            ? `, bao gồm ${earlierOngoingCount} giải đang diễn ra ngoài tháng đang xem`
            : '';
        DOM.resultsSummary.textContent = `Đang hiển thị ${events.length} sự kiện${extraLabel} (tháng ${monthLabel}).`;
        return;
    }

    const count = getCurrentMonthEvents().length;
    DOM.resultsSummary.textContent = `Đang hiển thị ${count} sự kiện trong ${CONFIG.MONTH_NAMES[STATE.displayMonth]}/${STATE.displayYear}.`;
}

function resetFilters() {
    if (DOM.scheduleSearch) DOM.scheduleSearch.value = '';
    if (DOM.schedulePrizeFilter) DOM.schedulePrizeFilter.checked = false;
    DOM.scheduleTypeGroup?.querySelectorAll('input[type="checkbox"]:not(#schedule-prize-filter)').forEach(checkbox => { checkbox.checked = true; });
    STATE.statusFilter = 'all';
    updateStatusFilterButtons();
    filterSchedule();
}

function getFilterState() {
    return {
        search: removeVietnameseTones(DOM.scheduleSearch?.value || ''),
        onlyPrize: DOM.schedulePrizeFilter?.checked || false,
        types: Array.from(DOM.scheduleTypeGroup?.querySelectorAll('input[type="checkbox"]:not(#schedule-prize-filter):checked') || []).map(cb => cb.value)
    };
}

function updateStatusFilterButtons() {
    if (DOM.statusFilters instanceof HTMLSelectElement) {
        DOM.statusFilters.value = STATE.statusFilter;
    }
}

function statusMatchesFilter(tournament) {
    const status = getEventStatus(tournament);
    if (STATE.statusFilter === 'upcoming') return status === STATUS.UPCOMING || status === STATUS.TENTATIVE;
    if (STATE.statusFilter === 'ongoing') return status === STATUS.ONGOING;
    if (STATE.statusFilter === 'ended') return status === STATUS.ENDED;
    return true;
}

function setStatusFilter(status) {
    if (!['all', 'upcoming', 'ongoing', 'ended'].includes(status)) return;
    STATE.statusFilter = status;
    saveFiltersToURL();
    updateStatusFilterButtons();
    renderActiveView();
}

function matchesFilters(tournament, filters) {
    const name = removeVietnameseTones(tournament.eventName || '');
    const matchesSearch = !filters.search || name.includes(filters.search);
    const matchesPrize = !filters.onlyPrize || isPrizeEvent(tournament);
    const matchesType = filters.types.includes(tournament.eventType);
    return matchesSearch && matchesPrize && matchesType && statusMatchesFilter(tournament);
}

function loadFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('search') && DOM.scheduleSearch) DOM.scheduleSearch.value = params.get('search');
    if (params.has('prize') && DOM.schedulePrizeFilter) DOM.schedulePrizeFilter.checked = (params.get('prize') === '1');
    const status = params.get('status');
    if (['upcoming', 'ongoing', 'ended'].includes(status)) STATE.statusFilter = status;
    if (params.has('type') && DOM.scheduleTypeGroup) {
        const selectedTypes = params.get('type').toLowerCase().split(/[\s+]+/);
        DOM.scheduleTypeGroup.querySelectorAll('input[type="checkbox"]:not(#schedule-prize-filter)').forEach(cb => {
            cb.checked = cb.dataset.internalFilter === 'true' || selectedTypes.includes(cb.value.toLowerCase());
        });
    }
}

function saveFiltersToURL() {
    const params = new URLSearchParams();
    const filters = getFilterState();
    if (filters.search) params.set('search', filters.search);
    if (DOM.schedulePrizeFilter?.checked) params.set('prize', '1');
    if (STATE.statusFilter !== 'all') params.set('status', STATE.statusFilter);
    const allTypes = Array.from(DOM.scheduleTypeGroup?.querySelectorAll('input[type="checkbox"]:not(#schedule-prize-filter)') || [])
        .map(cb => cb.value);
    if (filters.types.length < allTypes.length) {
        params.set('type', filters.types.length ? filters.types.join(' ') : 'none');
    }
    const newQuery = params.toString();
    const newURL = window.location.pathname + (newQuery ? '?' + newQuery : '');
    window.history.replaceState(null, '', newURL);
}

function getCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    const startDay = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const days = [];

    let prevMonth = month - 1, prevYear = year;
    if (prevMonth < 0) { prevMonth = 11; prevYear--; }
    for (let i = startDay - 1; i >= 0; i--) {
        days.push({ day: daysInPrevMonth - i, month: prevMonth, year: prevYear, isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
        days.push({ day: i, month, year, isCurrentMonth: true });
    }

    let nextMonth = month + 1, nextYear = year;
    if (nextMonth > 11) { nextMonth = 0; nextYear++; }
    const totalCells = 42;
    const remainingDays = totalCells - days.length;
    for (let i = 1; i <= remainingDays; i++) {
        days.push({ day: i, month: nextMonth, year: nextYear, isCurrentMonth: false });
    }

    return days;
}

const dateKeyOf = (year, month, day) => `${year}-${month}-${day}`;

/** Filters once and buckets events by Vietnam-local day: O(events) instead of O(cells x events). */
function groupEventsByDay(filters) {
    const byDay = new Map();
    STATE.tournaments.forEach(tournament => {
        if (!matchesFilters(tournament, filters)) return;
        const { year, month, date } = getVietnamDateParts(tournament.startTime);
        const key = dateKeyOf(year, month, date);
        if (!byDay.has(key)) byDay.set(key, []);
        byDay.get(key).push(tournament);
    });
    return byDay;
}

let activeScheduleTooltip = null;

function getScheduleTooltipElement() {
    let tooltip = document.getElementById('schedule-event-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'schedule-event-tooltip';
        tooltip.className = 'schedule-event-tooltip';
        tooltip.setAttribute('role', 'tooltip');
        tooltip.setAttribute('aria-hidden', 'true');
        document.body.appendChild(tooltip);
    }
    return tooltip;
}

function showScheduleTooltip(icon) {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const tooltip = getScheduleTooltipElement();
    tooltip.textContent = icon.dataset.tooltip || '';
    tooltip.style.maxWidth = `min(250px, calc(100vw - 24px))`;
    tooltip.style.left = '0px';
    tooltip.style.top = '0px';
    tooltip.hidden = false;
    tooltip.setAttribute('aria-hidden', 'false');
    tooltip.classList.add('is-visible');
    icon.setAttribute('aria-describedby', tooltip.id);
    activeScheduleTooltip = icon;

    const anchor = icon.getBoundingClientRect();
    const bounds = tooltip.getBoundingClientRect();
    const margin = 12;
    const maxLeft = Math.max(margin, window.innerWidth - bounds.width - margin);
    const left = Math.max(margin, Math.min(anchor.left + anchor.width / 2 - bounds.width / 2, maxLeft));
    let top = anchor.top - bounds.height - 8;
    if (top < margin) {
        top = Math.min(window.innerHeight - bounds.height - margin, anchor.bottom + 8);
    }
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${Math.max(margin, top)}px`;
}

function hideScheduleTooltip() {
    const tooltip = document.getElementById('schedule-event-tooltip');
    if (activeScheduleTooltip) activeScheduleTooltip.removeAttribute('aria-describedby');
    activeScheduleTooltip = null;
    if (!tooltip) return;
    tooltip.classList.remove('is-visible');
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.hidden = true;
}

document.addEventListener('scroll', hideScheduleTooltip, true);
window.addEventListener('resize', hideScheduleTooltip, { passive: true });

function createEventIcon(tournament) {
    const parts = getVietnamDateParts(tournament.startTime);
    const status = getEventStatus(tournament);
    const eventName = tournament.eventName || 'sự kiện';
    const clock = `${padZero(parts.hours)}:${padZero(parts.minutes)}`;

    const icon = document.createElement('button');
    icon.type = 'button';
    icon.className = 'event-icon';
    icon.classList.toggle('ended', isEndedEvent(tournament));
    icon.classList.toggle('tentative', isTentativeEvent(tournament));
    icon.classList.toggle('upcoming', status === STATUS.UPCOMING);
    icon.classList.toggle('ongoing', status === STATUS.ONGOING);
    icon.classList.toggle('has-prize', isPrizeEvent(tournament));

    const spokenTime = tournament.hasStartTime ? ` lúc ${padZero(parts.hours)} giờ ${padZero(parts.minutes)}` : '';
    icon.setAttribute('aria-label', `Xem chi tiết ${eventName}${spokenTime}`);

    const timeLabel = tournament.hasStartTime ? clock : 'Chưa có giờ bắt đầu';
    const tooltip = `${eventName}\n${timeLabel} · ${status}\n${tournament.eventRules || 'Chưa có thông tin thể lệ'}`;
    icon.dataset.tooltip = tooltip;
    icon.title = tooltip;
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        icon.addEventListener('pointerenter', () => showScheduleTooltip(icon));
        icon.addEventListener('pointerleave', hideScheduleTooltip);
        icon.addEventListener('focus', () => showScheduleTooltip(icon));
        icon.addEventListener('blur', hideScheduleTooltip);
    }

    const img = document.createElement('img');
    img.src = safeUrl(tournament.logo, '/images/tvltlogo.png');
    img.addEventListener('error', () => {
        img.src = '/images/tvltlogo.png';
    }, { once: true });
    img.alt = '';
    icon.appendChild(img);

    icon.addEventListener('click', event => {
        event.stopPropagation();
        openModal(tournament);
    });
    return icon;
}

function renderCalendar() {
    if (!DOM.calendarBody) return;
    const today = getVietnamNow();
    const eventsByDay = groupEventsByDay(getFilterState());
    const days = getCalendarDays(STATE.displayYear, STATE.displayMonth);
    const rows = document.createDocumentFragment();

    for (let i = 0; i < days.length; i += 7) {
        const tr = document.createElement('tr');
        days.slice(i, i + 7).forEach(({ day, month, year, isCurrentMonth }) => {
            const td = document.createElement('td');
            td.classList.toggle('other-month', !isCurrentMonth);
            td.classList.toggle('today', today.getUTCFullYear() === year && today.getUTCMonth() === month && today.getUTCDate() === day);

            const dayNum = document.createElement('div');
            dayNum.className = 'day-number';
            dayNum.textContent = day;

            const eventsDiv = document.createElement('div');
            eventsDiv.className = 'events-container';
            (eventsByDay.get(dateKeyOf(year, month, day)) || []).forEach(tournament => {
                eventsDiv.appendChild(createEventIcon(tournament));
            });
            td.append(dayNum, eventsDiv);
            tr.appendChild(td);
        });
        rows.appendChild(tr);
    }

    DOM.calendarBody.replaceChildren(rows);
}

function getSortedEvents() {
    return STATE.tournaments
        .map(t => {
            const tParts = getVietnamDateParts(t.startTime);
            const time = new Date(tParts.year, tParts.month, tParts.date, tParts.hours, tParts.minutes).getTime();
            return { t, time };
        })
        .sort((a, b) => a.time - b.time)
        .map(item => item.t);
}

function renderListView() {
    if (!DOM.listContainer) return;
    DOM.listContainer.innerHTML = '';

    const events = getListViewEvents(STATE.displayYear, STATE.displayMonth, getFilterState());

    if (events.length === 0) {
        DOM.listContainer.innerHTML = `
            <div class="empty-list-message">
                <i class="bx bx-calendar-x"></i>
                <p>Không có sự kiện nào khớp với bộ lọc hiện tại</p>
            </div>`;
        return;
    }

    events.forEach(tournament => renderEventCard(tournament, DOM.listContainer));
}

function getListViewEvents(year, month, filters) {
    const events = STATE.tournaments
        .filter(tournament => {
            const parts = getVietnamDateParts(tournament.startTime);
            const belongsToMonth = parts.year === year && parts.month === month;
            const isOngoing = getEventStatus(tournament) === STATUS.ONGOING;
            return belongsToMonth || isOngoing;
        })
        .filter(tournament => matchesFilters(tournament, filters));

    const statusPriority = {
        [STATUS.ONGOING]: 0,
        [STATUS.UPCOMING]: 1,
        [STATUS.TENTATIVE]: 2,
        [STATUS.ENDED]: 3
    };

    return events.sort((a, b) => {
        const statusA = getEventStatus(a);
        const statusB = getEventStatus(b);
        const statusDifference = (statusPriority[statusA] ?? 99) -
            (statusPriority[statusB] ?? 99);
        if (statusDifference !== 0) return statusDifference;

        const startA = getEventStartTime(a);
        const startB = getEventStartTime(b);

        if (statusA === STATUS.ENDED) {
            // Keep the most recently finished events easiest to find.
            const recencyDifference = startB - startA;
            if (recencyDifference !== 0) return recencyDifference;
        } else if (statusA === STATUS.ONGOING) {
            // Surface ongoing events that are closest to finishing first.
            const endingDifference = getEventEndTime(a) - getEventEndTime(b);
            if (endingDifference !== 0) return endingDifference;
        } else {
            // Confirmed upcoming and tentative events follow chronological order.
            const startDifference = startA - startB;
            if (startDifference !== 0) return startDifference;
        }

        // Prize category only breaks ties after status and timing are comparable.
        return Number(isPrizeEvent(b)) - Number(isPrizeEvent(a));
    });
}

function getEventStartTime(tournament) {
    return parseEventDate(tournament?.startTime)?.getTime() || 0;
}

function getEventEndTime(tournament) {
    const start = getEventStartTime(tournament);
    const rawEnd = tournament?.endTime || tournament?.finishTime || tournament?.endDate;
    const parsedEnd = parseEventDate(rawEnd);

    if (parsedEnd) {
        let end = parsedEnd.getTime();
        // Date-only end values represent the end of that Vietnam-local day.
        if (!hasEventTime(rawEnd)) end += 24 * 60 * 60 * 1000;
        if (end >= start) return end;
    }

    // Without an explicit end, timed events remain active for two hours;
    // date-only events are treated as all-day events in Vietnam time.
    const duration = tournament?.hasStartTime === false
        ? 24 * 60 * 60 * 1000
        : CONFIG.EVENT_DURATION_MS;
    return start + duration;
}

function renderEventCard(tournament, container) {
    const card = document.createElement('div');
    card.className = 'event-list-card';
    const isCoThuong = isPrizeEvent(tournament);
    const isTentative = isTentativeEvent(tournament);
    const isEnded = isEndedEvent(tournament);
    if (isEnded) card.classList.add('is-ended');
    const categoryHTML = getEventBadgesHTML(tournament);
    const tParts = getVietnamDateParts(tournament.startTime);
    const dayVn = getDayOfWeekVn(tournament.startTime);
    const dayPrefix = dayVn === 'Chủ Nhật' ? '' : 'Thứ ';
    const dateLabel = `${dayPrefix}${dayVn}, ${padZero(tParts.date)} thg ${padZero(tParts.month + 1)}, ${tParts.year}`;
    let formattedTime = tournament.hasStartTime
        ? `${dateLabel} lúc ${padZero(tParts.hours)}h${padZero(tParts.minutes)}`
        : dateLabel;
    if (isTentative) formattedTime = `Dự kiến: ${formattedTime}`;
    const mappedOrganizer = getMappedOrganizer(tournament.organizer || '', tournament.organizerLinks);
    card.innerHTML = `
        <div class="event-card-header">
            <div class="event-card-logo">
                <img src="${escapeHTML(safeUrl(tournament.logo, '/images/tvltlogo.png'))}" alt="" data-fallback-src="/images/tvltlogo.png">
            </div>
            <div class="event-card-title-group">
                <div class="event-card-badges">${categoryHTML}</div>
                <h3 class="event-card-title">${escapeHTML(tournament.eventName || 'Tournament')}</h3>
            </div>
        </div>
        <div class="event-card-details">
            <div class="event-card-detail-item">
                <i class="bx bx-calendar"></i>
                <span><strong>Thời gian:</strong> ${formattedTime}</span>
            </div>
            <div class="event-card-detail-item">
                <i class="bx bx-grid-alt"></i>
                <span><strong>Thể lệ:</strong> ${parseMarkdownLinks(tournament.eventRules || 'Chưa có thông tin')}</span>
            </div>
            <div class="event-card-detail-item">
                <i class="bx bxs-chess"></i>
                <span><strong>Ván đấu:</strong> ${getGameRulesWithIcon(linkifyChessTerms(parseMarkdownLinks(tournament.gameRules || 'Chưa có thông tin')))}</span>
            </div>
            <div class="event-card-detail-item">
                <i class="bx bxs-user-check"></i>
                <span><strong>Tổ chức:</strong> ${mappedOrganizer}</span>
            </div>
        </div>
        <div class="event-card-footer">
            <button class="btn btn-secondary card-detail-btn"><i class="bx bx-info-circle"></i> Chi tiết</button>
        </div>
    `;

    card.querySelector('.card-detail-btn').onclick = (e) => {
        e.stopPropagation();
        openModal(tournament);
    };
    
    card.querySelectorAll('.event-card-detail-item a').forEach(link => {
        link.addEventListener('click', event => event.stopPropagation());
    });

    card.onclick = () => openModal(tournament);
    
    container.appendChild(card);
}

function getDefaultResultUrl(type) {
    if (CONFIG.INTERNAL_EVENT_TYPES.includes(type)) {
        return `/events/tournaments/${type}`;
    }
    return `https://chess.com/clubs/events/thi-vua-lay-tot-tungjohn-playing-chess?clubId=325849&ref_id=89365835&type=${type}`;
}

function getModalURLs(tournament) {
    const type = tournament.eventType;
    const resultUrl = tournament.resultLink !== undefined
        ? tournament.resultLink
        : getDefaultResultUrl(type);

    if (CONFIG.INTERNAL_EVENT_TYPES.includes(type)) {
        return {
            bannerUrl: tournament.bannerLink || BANNER_MAP[type],
            newsUrl: tournament.newsLink || INFO_MAP[type],
            resultUrl: resultUrl,
            rulesPageUrl: INFO_MAP[type] || "https://support.chess.com"
        };
    } else {
        return {
            bannerUrl: tournament.bannerLink || BANNER_MAP[type] || "https://chess.com/bundles/web/images/404-pawn.f17f262c.gif",
            newsUrl: tournament.newsLink || INFO_MAP[type] || "https://support.chess.com",
            resultUrl: resultUrl,
            rulesPageUrl: INFO_MAP[type] || "https://support.chess.com"
        };
    }
}

function openModal(tournament) {
    if (!DOM.eventModal || !tournament) return;

    if (!DOM.eventModal.classList.contains('open')) {
        STATE.lastFocusedElement = document.activeElement;
        STATE.previousBodyOverflow = document.body.style.overflow;
    }
    STATE.selectedEvent = tournament;
    const urls = getModalURLs(tournament);
    const isTentative = isTentativeEvent(tournament);
    const eventName = tournament.eventName || 'Chi tiết giải đấu';
    const joinUrl = safeUrl(tournament.joinLink);

    if (DOM.modalName) {
        DOM.modalName.textContent = '';
        if (joinUrl) {
            const titleLink = document.createElement('a');
            titleLink.href = joinUrl;
            titleLink.target = '_blank';
            titleLink.rel = 'noopener noreferrer';
            titleLink.textContent = eventName;
            DOM.modalName.appendChild(titleLink);
        } else {
            DOM.modalName.textContent = eventName;
        }
    }

    DOM.modalCategory.innerHTML = getEventBadgesHTML(tournament);
    DOM.modalOrganizer.innerHTML = getMappedOrganizer(tournament.organizer || '', tournament.organizerLinks);

    const tParts = getVietnamDateParts(tournament.startTime);
    const dayVn = getDayOfWeekVn(tournament.startTime);
    const dayPrefix = dayVn === 'Chủ Nhật' ? '' : 'Thứ ';
    const dateLabel = `${dayPrefix}${dayVn}, ngày ${padZero(tParts.date)} tháng ${padZero(tParts.month + 1)} năm ${tParts.year}`;
    let formattedTime = tournament.hasStartTime
        ? `${dateLabel} lúc ${padZero(tParts.hours)}h${padZero(tParts.minutes)}`
        : dateLabel;

    let gameRulesText = tournament.gameRules || 'Chưa có thông tin';
    let eventRulesText = tournament.eventRules || 'Chưa có thông tin';
    if (isTentative) {
        formattedTime = `Dự kiến ${formattedTime}`;
        if (gameRulesText !== 'Chưa có thông tin') gameRulesText = `Dự kiến ${gameRulesText}`;
        if (eventRulesText !== 'Chưa có thông tin') eventRulesText = `Dự kiến ${eventRulesText}`;
    }

    DOM.modalTime.textContent = formattedTime;
    DOM.modalGameRules.innerHTML = getGameRulesWithIcon(linkifyChessTerms(parseMarkdownLinks(gameRulesText)));
    DOM.modalEventRules.innerHTML = linkifyChessTerms(parseMarkdownLinks(eventRulesText));
    setSafeImageSource(DOM.modalLogo, tournament.logo, '/images/tvltlogo.png');
    setSafeImageSource(DOM.modalBanner, urls.bannerUrl, '/images/events/dau-truong-thi-vua.svg');
    DOM.modalLogoLink.href = safeUrl(urls.rulesPageUrl, '/events');
    DOM.modalLogoLink.rel = 'noopener noreferrer';

    if (joinUrl) {
        DOM.modalJoinBtn.href = joinUrl;
        DOM.modalJoinBtn.removeAttribute('aria-disabled');
        DOM.modalJoinBtn.tabIndex = 0;
    } else {
        DOM.modalJoinBtn.removeAttribute('href');
        DOM.modalJoinBtn.setAttribute('aria-disabled', 'true');
        DOM.modalJoinBtn.tabIndex = -1;
    }
    DOM.modalRuleBtn.href = safeUrl(urls.newsUrl, '/events');
    DOM.modalResultsBtn.href = safeUrl(urls.resultUrl, '/events/tournaments');

    DOM.eventModal.classList.add('open');
    DOM.eventModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    (DOM.modalCloseBtn || DOM.modalDialog)?.focus({ preventScroll: true });
}

function closeModal() {
    if (!DOM.eventModal?.classList.contains('open')) return;
    DOM.eventModal.classList.remove('open');
    DOM.eventModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = STATE.previousBodyOverflow;
    STATE.previousBodyOverflow = '';
    STATE.selectedEvent = null;
    STATE.lastFocusedElement?.focus?.();
    STATE.lastFocusedElement = null;
}

function updateNavButtonStates() {
    // Month navigation remains unrestricted in both directions.
    if (DOM.btnPrevMonth) {
        DOM.btnPrevMonth.disabled = false;
        DOM.btnPrevMonth.style.opacity = '1';
    }
    if (DOM.btnNextMonth) {
        DOM.btnNextMonth.disabled = false;
        DOM.btnNextMonth.style.opacity = '1';
    }
}

function updateViewSwitcherButtons() {
    if (DOM.btnViewCalendar && DOM.btnViewList) {
        if (STATE.currentView === 'calendar') {
            DOM.btnViewCalendar.classList.add('active');
            DOM.btnViewCalendar.setAttribute('aria-pressed', 'true');
            DOM.btnViewList.classList.remove('active');
            DOM.btnViewList.setAttribute('aria-pressed', 'false');
        } else {
            DOM.btnViewList.classList.add('active');
            DOM.btnViewList.setAttribute('aria-pressed', 'true');
            DOM.btnViewCalendar.classList.remove('active');
            DOM.btnViewCalendar.setAttribute('aria-pressed', 'false');
        }
    }
}

function renderActiveView() {
    if (DOM.calendarWrapper) DOM.calendarWrapper.style.display = 'none';
    if (DOM.listWrapper) DOM.listWrapper.style.display = 'none';
    if (DOM.emptyEl) DOM.emptyEl.style.display = 'none';
    updateStatusFilterButtons();

    if (STATE.tournaments.length === 0) {
        if (DOM.emptyEl) DOM.emptyEl.style.display = 'block';
        return;
    }
    if (DOM.monthTitle) { const monthStr = padZero(STATE.displayMonth + 1); const yearStr = String(STATE.displayYear); const key = `${monthStr}-${yearStr}`; if (DOM.monthTitle.dataset.monthKey !== key) { DOM.monthTitle.dataset.monthKey = key; DOM.monthTitle.innerHTML = `<span class="month-box">${monthStr}</span><span class="year-box">${yearStr}</span>`; } }
    if (DOM.monthYear) DOM.monthYear.textContent = '';
    updateNavButtonStates();
    updateFilterControls();
    updateResultsSummary();
    if (STATE.currentView === 'calendar') {
        if (DOM.calendarWrapper) DOM.calendarWrapper.style.display = 'block';
        renderCalendar();
        const visibleEvents = getCurrentMonthEvents().length;
        if (DOM.emptyEl && visibleEvents === 0) {
            const message = DOM.emptyEl.querySelector('p');
            if (message) message.textContent = 'Không có sự kiện nào khớp với các bộ lọc trong tháng này.';
            DOM.emptyEl.style.display = 'block';
        }
    } else {
        if (DOM.listWrapper) DOM.listWrapper.style.display = 'block';
        renderListView();
    }
}

function changeMonth(offset) {
    STATE.displayMonth += offset;
    if (STATE.displayMonth < 0) {
        STATE.displayMonth = 11;
        STATE.displayYear--;
    } else if (STATE.displayMonth > 11) {
        STATE.displayMonth = 0;
        STATE.displayYear++;
    }
    renderActiveView();
}

function switchView(view) {
    if (!['calendar', 'list'].includes(view)) return;
    STATE.currentView = view;
    updateViewSwitcherButtons();
    renderActiveView();
}

function toggleTourDropdown(id) {
    const el = document.getElementById(id);
    if (!el) return;

    document.querySelectorAll('.tour-dropdown').forEach(d => {
        if (d.id !== id) d.classList.remove('open');
    });

    const isOpen = el.classList.toggle('open');
    DOM.categoryButton?.setAttribute('aria-expanded', String(isOpen));
}

function filterSchedule() {
    saveFiltersToURL();
    renderActiveView();
}

function normalizeEventDate(value) {
    if (value && typeof value === 'object') {
        value = value.start || value.date?.start || value.date || value.start_time;
    }
    if (typeof value === 'number') {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '' : date.toISOString();
    }
    if (typeof value !== 'string') return '';

    const raw = value.trim();
    const notionDate = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (!notionDate) return raw;

    const [, monthText, dayText, yearText, hourText, minuteText, secondText = '0'] = notionDate;
    const month = Number(monthText);
    const day = Number(dayText);
    const year = Number(yearText);
    const hasTime = hourText !== undefined && minuteText !== undefined;
    const hour = Number(hourText || 0);
    const minute = Number(minuteText || 0);
    const second = Number(secondText);
    const check = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

    if (
        month < 1 || month > 12 || day < 1 || day > 31 ||
        hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59 ||
        check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 ||
        check.getUTCDate() !== day
    ) return '';

    const pad = number => String(number).padStart(2, '0');
    const datePart = `${year}-${pad(month)}-${pad(day)}`;
    if (!hasTime) return datePart;
    return `${datePart}T${pad(hour)}:${pad(minute)}:${pad(second)}+07:00`;
}

function hasEventTime(value) {
    if (value && typeof value === 'object') {
        return hasEventTime(value.start || value.date?.start || value.date || value.start_time);
    }
    return typeof value === 'string' && /(?:T|\s)\d{1,2}:\d{2}/i.test(value.trim());
}

function ensureEventTypeFilters(events) {
    const group = DOM.scheduleTypeGroup;
    if (!group) return;

    const existingCheckboxes = Array.from(group.querySelectorAll('input[type="checkbox"]:not(#schedule-prize-filter)'));
    const existingTypes = new Set(existingCheckboxes.map(checkbox => checkbox.value.toLowerCase()));
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get('type');
    const selectedFromURL = typeParam === null
        ? null
        : new Set(typeParam.toLowerCase().split(/[\s+]+/));
    const allExistingTypesSelected = existingCheckboxes.length > 0 &&
        existingCheckboxes.every(checkbox => checkbox.checked);

    const unknownTypes = Array.from(new Set(
        events.map(event => event.eventType).filter(type => type && !existingTypes.has(type))
    )).sort();

    unknownTypes.forEach(type => {
        const label = document.createElement('label');
        label.className = 'custom-checkbox-container';
        if (CONFIG.INTERNAL_EVENT_TYPES.includes(type)) {
            label.hidden = true;
            label.dataset.internalFilter = 'true';
            label.style.display = 'none';
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = type;
        checkbox.checked = CONFIG.INTERNAL_EVENT_TYPES.includes(type) ||
            (selectedFromURL ? selectedFromURL.has(type) : allExistingTypesSelected);

        const mark = document.createElement('span');
        mark.className = 'checkmark';

        const labelText = type === 'other' ? ' Khác (chưa phân loại)' : ` Khác — ${type}`;
        label.append(checkbox, mark, document.createTextNode(labelText));
        group.appendChild(label);
    });
}

function normalizeTournament(record) {
    if (!record || typeof record !== 'object') return null;

    const rawStartTime = record.startTime;
    const rawEndTime = record.endTime || record.finishTime || record.endDate;
    return {
        ...record,
        eventName: String(record.eventName || '').trim(),
        hasStartTime: typeof record.hasStartTime === 'boolean' ? record.hasStartTime : hasEventTime(rawStartTime),
        startTime: normalizeEventDate(rawStartTime),
        endTime: normalizeEventDate(rawEndTime),
        eventType: String(record.eventType || '').trim().toLowerCase().replace(/\s+/g, '-') || 'other',
        status: String(record.status || '').trim(),
        organizerLinks: Array.isArray(record.organizerLinks) ? record.organizerLinks : [],
        isTentative: record.isTentative === true || record.isTentative === 'true' ||
            record.isTentative === STATUS.TENTATIVE || record.isTentative === 'Tentative',
        prize: record.prize ?? ''
    };
}

const FORUM_URL = 'https://chess.com/clubs/forum/view/lich-su-kien-hang-thang-clb-tvlt?clubId=325849&quote_id=125015758&page=1#comment_box';

function setDisplay(element, value) {
    if (element) element.style.display = value;
}

/**
 * The schedule transport is isolated here so the data source can be replaced
 * without changing normalization, filtering or rendering code.
 */
const scheduleDataAdapter = {
    async fetch() {
        const response = await fetch(CONFIG.API_URL, {
            headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error(`Mã phản hồi từ máy chủ: ${response.status}`);

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error(text.trim().startsWith('<')
                ? 'Máy chủ Google Apps Script trả về trang HTML thay vì dữ liệu JSON. Có thể do dịch vụ tạm thời bị giới hạn hoặc bảo trì. Vui lòng thử lại sau ít phút.'
                : 'Dữ liệu phản hồi từ máy chủ không đúng định dạng JSON.');
        }

        if (data?.status === 'error') {
            throw new Error(data.message || 'Nguồn dữ liệu lịch trả về lỗi.');
        }
        if (!Array.isArray(data?.events)) {
            throw new Error('JSON API không đúng cấu trúc: cần có thuộc tính "events" là một mảng.');
        }
        return data;
    }
};

function fetchScheduleData() {
    return scheduleDataAdapter.fetch();
}

/** "Last updated" timestamp from the API (Vietnam time when no zone is given); falls back to now. */
function parseLastUpdated(data) {
    let value = String(data.lastUpdated || data.events[0]?.timestamp || '').trim().replace(' ', 'T');
    if (value && !value.includes('+') && !value.includes('Z')) value += '+07:00';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date() : date;
}

function setScheduleState(state) {
    setDisplay(DOM.loadingEl, state === 'loading' ? 'block' : 'none');
    setDisplay(DOM.errorEl, state === 'error' ? 'block' : 'none');
    setDisplay(DOM.emptyEl, state === 'empty' ? 'block' : 'none');
    setDisplay(document.getElementById('schedule-skeleton'), state === 'loading' ? 'block' : 'none');

    if (state === 'loading' || state === 'error' || state === 'empty') {
        setDisplay(DOM.calendarWrapper, 'none');
        setDisplay(DOM.listWrapper, 'none');
    }
}

function setLastUpdated(data) {
    if (!DOM.lastUpdatedEl) return;
    DOM.lastUpdatedEl.textContent = parseLastUpdated(data).toLocaleString('vi-VN', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

function applyScheduleData(data) {
    STATE.tournaments = data.events
        .map(normalizeTournament)
        .filter(tournament => tournament && parseEventDate(tournament.startTime));

    if (data.events.length > 0 && STATE.tournaments.length === 0) {
        throw new Error(`Nguồn dữ liệu trả về ${data.events.length} sự kiện nhưng không có ngày bắt đầu hợp lệ.`);
    }

    ensureEventTypeFilters(STATE.tournaments);
    setLastUpdated(data);
    STATE.hasUsableData = true;
}

const SCHEDULE_CACHE_KEY = 'tvlt_schedule_cache_v1';
const SCHEDULE_CACHE_TTL_MS = 5 * 60 * 1000;
const SCHEDULE_CACHE_MAX_STALE_MS = 24 * 60 * 60 * 1000;

function readScheduleCache() {
    try {
        const cached = JSON.parse(localStorage.getItem(SCHEDULE_CACHE_KEY) || 'null');
        if (!cached || cached.version !== 1 || !Array.isArray(cached.data?.events)) return null;
        if (Date.now() - cached.savedAt > SCHEDULE_CACHE_MAX_STALE_MS) return null;
        return cached;
    } catch {
        return null;
    }
}

function writeScheduleCache(data) {
    try {
        localStorage.setItem(SCHEDULE_CACHE_KEY, JSON.stringify({
            version: 1,
            savedAt: Date.now(),
            data
        }));
    } catch {
        // Private browsing or storage quota must not block schedule rendering.
    }
}

function showScheduleError(error) {
    setScheduleState('error');
    if (!DOM.errorEl) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'error';
    const message = document.createElement('p');
    message.textContent = `Không thể tải lịch sự kiện: ${error.message}`;
    const hint = document.createElement('p');
    hint.className = 'error-hint';
    hint.textContent = 'Bạn có thể thử tải lại hoặc báo lỗi trong diễn đàn của CLB.';
    const forum = document.createElement('a');
    forum.href = FORUM_URL;
    forum.target = '_blank';
    forum.rel = 'noopener noreferrer';
    forum.textContent = 'Mở diễn đàn';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'schedule-retry-btn';
    retry.textContent = 'Thử lại';
    retry.addEventListener('click', () => loadTournaments({ force: true }), { once: true });
    hint.append(' ', forum);
    wrapper.append(message, hint, retry);
    DOM.errorEl.replaceChildren(wrapper);
}

async function refreshScheduleData({ background = false } = {}) {
    if (STATE.refreshPromise) return STATE.refreshPromise;
    if (!background) setScheduleState('loading');

    STATE.refreshPromise = (async () => {
        try {
            const data = await fetchScheduleData();
            applyScheduleData(data);
            writeScheduleCache(data);

            if (STATE.tournaments.length) {
                setScheduleState('ready');
                showSchedule();
            } else {
                setScheduleState('empty');
            }
        } catch (error) {
            if (STATE.hasUsableData) {
                // Stale-while-revalidate: retain the last usable calendar if refresh fails.
                setScheduleState(STATE.tournaments.length ? 'ready' : 'empty');
                return;
            }
            showScheduleError(error);
        } finally {
            STATE.refreshPromise = null;
        }
    })();

    return STATE.refreshPromise;
}

async function loadTournaments() {
    const cached = readScheduleCache();
    if (cached) {
        try {
            applyScheduleData(cached.data);
            if (STATE.tournaments.length) {
                setScheduleState('ready');
                showSchedule();
            } else {
                setScheduleState('empty');
            }

            const cacheIsFresh = Date.now() - cached.savedAt <= SCHEDULE_CACHE_TTL_MS;
            if (!cacheIsFresh && DOM.lastUpdatedEl) {
                DOM.lastUpdatedEl.textContent += ' · đang dùng dữ liệu lưu tạm';
            }
            // Render cached data immediately, then revalidate without blocking the calendar.
            void refreshScheduleData({ background: true });
            return;
        } catch {
            try { localStorage.removeItem(SCHEDULE_CACHE_KEY); } catch { /* storage may be unavailable */ }
            STATE.hasUsableData = false;
        }
    }

    await refreshScheduleData({ background: false });
}

function showSchedule() {
    setScheduleState('ready');
    setDisplay(DOM.viewSwitcherContainer, 'inline-flex');
    setDisplay(DOM.scheduleFilters, 'grid');
    STATE.currentView = 'calendar';
    updateViewSwitcherButtons();

    const today = getVietnamNow();
    STATE.displayYear = today.getUTCFullYear();
    STATE.displayMonth = today.getUTCMonth();
    renderActiveView();

    DOM.calendarWrapper?.classList.add('schedule-entrance');
}



function trapModalFocus(event) {
    if (!DOM.modalDialog) return;
    const focusable = Array.from(DOM.modalDialog.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(element => element.getClientRects().length > 0 && !element.closest('[hidden]'));
    if (!focusable.length) {
        event.preventDefault();
        DOM.modalDialog.focus();
        return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (!DOM.modalDialog.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && (active === first || active === DOM.modalDialog)) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && (active === last || active === DOM.modalDialog)) {
        event.preventDefault();
        first.focus();
    }
}

function initializeEventListeners() {
    window.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            if (DOM.eventModal?.classList.contains('open')) {
                closeModal();
            } else {
                const openDropdown = document.querySelector('.tour-dropdown.open');
                if (openDropdown) {
                    openDropdown.classList.remove('open');
                    DOM.categoryButton?.setAttribute('aria-expanded', 'false');
                    DOM.categoryButton?.focus();
                }
            }
        } else if (event.key === 'Tab' && DOM.eventModal?.classList.contains('open')) {
            trapModalFocus(event);
        }
    });
    window.addEventListener('click', event => {
        if (event.target === DOM.eventModal) closeModal();
    });
    document.addEventListener('click', event => {
        if (!event.target.closest('.tour-dropdown')) {
            document.querySelectorAll('.tour-dropdown').forEach(dropdown => dropdown.classList.remove('open'));
            DOM.categoryButton?.setAttribute('aria-expanded', 'false');
        }
    });

    if (DOM.scheduleSearch) DOM.scheduleSearch.addEventListener('input', filterSchedule);
    if (DOM.schedulePrizeFilter) DOM.schedulePrizeFilter.addEventListener('change', filterSchedule);
    if (DOM.scheduleTypeGroup) DOM.scheduleTypeGroup.addEventListener('change', filterSchedule);
    if (DOM.resetFilters) DOM.resetFilters.addEventListener('click', resetFilters);
    if (DOM.categoryButton) DOM.categoryButton.addEventListener('click', () => toggleTourDropdown('schedule-category-dropdown'));
    if (DOM.btnPrevMonth) DOM.btnPrevMonth.addEventListener('click', () => changeMonth(-1));
    if (DOM.btnNextMonth) DOM.btnNextMonth.addEventListener('click', () => changeMonth(1));
    if (DOM.btnViewCalendar) DOM.btnViewCalendar.addEventListener('click', () => switchView('calendar'));
    if (DOM.btnViewList) DOM.btnViewList.addEventListener('click', () => switchView('list'));
    if (DOM.modalCloseBtn) DOM.modalCloseBtn.addEventListener('click', closeModal);
    if (DOM.statusFilters instanceof HTMLSelectElement) {
        DOM.statusFilters.addEventListener('change', () => setStatusFilter(DOM.statusFilters.value));
    }
    updateStatusFilterButtons();
}


document.addEventListener('DOMContentLoaded', () => {
    cacheDOMElements();
    loadFiltersFromURL();
    loadTournaments();
    initializeEventListeners();
});

window.switchView = switchView;
window.changeMonth = changeMonth;
window.toggleTourDropdown = toggleTourDropdown;
window.filterSchedule = filterSchedule;
window.openModal = openModal;
window.closeModal = closeModal;
window.renderActiveView = renderActiveView;
