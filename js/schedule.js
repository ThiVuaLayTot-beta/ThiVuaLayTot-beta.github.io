/**
 * Lịch sự kiện TVLT (/schedule): dạng lịch tháng và dạng timeline.
 *
 * Bố cục file:
 *  1. Hằng số & dữ liệu tĩnh
 *  2. State & DOM
 *  3. Tiện ích (escape, URL, văn bản)
 *  4. Thời gian (múi giờ Việt Nam)
 *  5. Mô hình sự kiện (chuẩn hoá, trạng thái)
 *  6. Bộ lọc & URL
 *  7. Lịch tháng, tooltip
 *  8. Modal chi tiết
 *  9. Menu chọn tháng/năm
 * 10. Timeline
 * 11. Tải dữ liệu & cache
 * 12. Khởi tạo
 *
 * Đặt trong IIFE để không làm bẩn global scope; main.js cung cấp
 * window.removeVietnameseTones.
 */
(() => {
'use strict';

/* ============================ 1. Hằng số ============================ */

const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;
const NO_INFO = 'Chưa có thông tin';
const DEFAULT_LOGO = '/images/tvltlogo.png';
const DEFAULT_BANNER = '/images/events/dau-truong-thi-vua.svg';
const FALLBACK_BANNER = 'https://chess.com/bundles/web/images/404-pawn.f17f262c.gif';
const SUPPORT_URL = 'https://support.chess.com';
const FORUM_URL = 'https://chess.com/clubs/forum/view/lich-su-kien-hang-thang-clb-tvlt?clubId=325849&quote_id=125015758&page=1#comment_box';
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const CONFIG = Object.freeze({
    API_URL: 'https://script.google.com/macros/s/AKfycbzBFtevfcYM7MLEgpB2R5hn4_sS3RovSy_rBiuljJMRgOJ7KEl50lffXH46aEOd-uAX/exec',
    VIETNAM_OFFSET_MS: 7 * HOUR_MS,
    EVENT_DURATION_MS: 2 * HOUR_MS,
    MONTH_NAMES: Array.from({ length: 12 }, (_, index) => `Tháng ${index + 1}`),
    WEEKDAY_LABELS: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
    INTERNAL_EVENT_TYPES: new Set(['cttq', 'tvlt', 'cbtt', 'dttv'])
});

const STATUS = Object.freeze({
    ONGOING: 'Đang diễn ra',
    UPCOMING: 'Sắp diễn ra',
    TENTATIVE: 'Dự kiến',
    ENDED: 'Đã kết thúc'
});

// Chuỗi trạng thái (API) -> trạng thái chuẩn. Khoá đã lowercase, "_" và "-" đổi thành khoảng trắng.
const STATUS_ALIASES = new Map([
    ['đã kết thúc', STATUS.ENDED], ['ended', STATUS.ENDED], ['finished', STATUS.ENDED], ['completed', STATUS.ENDED],
    ['sắp diễn ra', STATUS.UPCOMING], ['upcoming', STATUS.UPCOMING], ['scheduled', STATUS.UPCOMING],
    ['dự kiến', STATUS.TENTATIVE], ['tentative', STATUS.TENTATIVE], ['proposed', STATUS.TENTATIVE],
    ['đang diễn ra', STATUS.ONGOING], ['in progress', STATUS.ONGOING], ['ongoing', STATUS.ONGOING],
    ['live', STATUS.ONGOING], ['running', STATUS.ONGOING], ['active', STATUS.ONGOING]
]);

const STATUS_BADGES = Object.freeze({
    [STATUS.TENTATIVE]: '<span class="badge-schedule badge-tentative"><i class="bx bx-time-five"></i> Dự kiến</span>',
    [STATUS.UPCOMING]: '<span class="badge-schedule badge-upcoming"><i class="bx bx-calendar-event"></i> Sắp diễn ra</span>',
    [STATUS.ONGOING]: '<span class="badge-schedule badge-ongoing"><i class="bx bx-play-circle"></i> Đang diễn ra</span>',
    [STATUS.ENDED]: '<span class="badge-schedule badge-ended"><i class="bx bx-check-circle"></i> Đã kết thúc</span>'
});

const PRIZE_BADGES = Object.freeze({
    'Đặc biệt+Có thưởng': '<span class="badge-schedule badge-special-prize"><i class="bx bxs-star"></i> Đặc biệt+Có thưởng</span>',
    'Đặc biệt': '<span class="badge-schedule badge-special"><i class="bx bxs-star"></i> Đặc biệt</span>',
    'Có thưởng': '<span class="badge-schedule badge-co-thuong"><i class="bx bxs-award"></i> Có thưởng</span>',
    'Giao lưu': '<span class="badge-schedule badge-giao-luu"><i class="bx bx-coffee"></i> Giao lưu</span>'
});

const TIMELINE_STATUS_CLASS = Object.freeze({
    [STATUS.ONGOING]: 'is-ongoing',
    [STATUS.UPCOMING]: 'is-upcoming',
    [STATUS.TENTATIVE]: 'is-tentative',
    [STATUS.ENDED]: 'is-ended'
});

const STATUS_FILTER_VALUES = ['all', 'upcoming', 'ongoing', 'ended'];
const SELECT_MIN_YEAR = 1900;
const SELECT_MAX_YEAR = 2100;

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

// Chuẩn hoá: icon của từng luật chỉ cần dựng HTML một lần.
const ICON_RULES_COMPILED = ICON_RULES.map(({ keys, url }) => ({
    keys,
    html: `<img src="https://chess.com/bundles/web/images/${url}" width="17" height="17" alt="" style="vertical-align:middle;margin-left:4px;">`
}));

/* ============================ 2. State & DOM ============================ */

const DOM = {};
const STATE = {
    tournaments: [],
    currentView: 'calendar',
    displayYear: undefined,
    displayMonth: undefined,
    initialMonth: null,
    lastFocusedElement: null,
    previousBodyOverflow: '',
    selectedStatusFilter: 'all',
    hasUsableData: false,
    hasShownSchedule: false,
    refreshPromise: null
};

// Hộp kiểm thể loại (trừ "Chỉ có thưởng"); dựng lại khi có thể loại mới từ API.
let typeCheckboxes = [];
let searchTimer = 0;
// Phần tử DOM -> sự kiện; dùng cho event delegation (không gắn listener cho từng icon/card).
const eventByElement = new WeakMap();

function cacheDOMElements() {
    const byId = id => document.getElementById(id);
    Object.assign(DOM, {
        loadingState: byId('loading'),
        errorState: byId('error'),
        emptyState: byId('empty'),
        lastUpdated: byId('last-updated'),
        statusFilters: byId('schedule-status-filters'),
        viewSwitcherContainer: byId('view-switcher-container'),
        scheduleFilters: byId('schedule-filters'),
        calendarWrapper: byId('calendar-wrapper'),
        timelineWrapper: byId('timeline-wrapper'),
        timelineContainer: byId('timeline-container'),
        scheduleSkeleton: byId('schedule-skeleton'),
        calendarBody: byId('calendar-body'),
        monthTitle: byId('month-title'),
        previousMonthButton: byId('btn-prev-month'),
        nextMonthButton: byId('btn-next-month'),
        monthSelectButton: byId('btn-month-select'),
        yearSelectButton: byId('btn-year-select'),
        monthLabel: byId('month-select-label'),
        yearLabel: byId('year-select-label'),
        monthLive: byId('month-live'),
        resultsSummary: byId('schedule-results-summary'),
        resetFilters: byId('schedule-reset-filters'),
        categoryButton: byId('schedule-category-button'),
        calendarViewButton: byId('btn-view-calendar'),
        timelineViewButton: byId('btn-view-timeline'),
        scheduleSearch: byId('schedule-search'),
        schedulePrizeFilter: byId('schedule-prize-filter'),
        scheduleTypeGroup: byId('schedule-type-group'),
        eventModal: byId('eventModal'),
        modalName: byId('modal-name'),
        modalCategory: byId('modal-category'),
        modalOrganizer: byId('modal-organizer'),
        modalTime: byId('modal-time'),
        modalGameRules: byId('modal-game-rules'),
        modalEventRules: byId('modal-event-rules'),
        modalLogo: byId('modal-logo'),
        modalLogoLink: byId('modal-logo-link'),
        modalBanner: byId('modal-banner'),
        modalJoinButton: byId('modal-join'),
        modalInfoButton: byId('modal-rule'),
        modalResultsButton: byId('modal-results')
    });
    DOM.modalDialog = DOM.eventModal?.querySelector('.cc-modal-dialog') || null;
    DOM.modalCloseButton = DOM.eventModal?.querySelector('.cc-modal-close') || null;
    DOM.categoryLabel = DOM.categoryButton?.querySelector('[data-filter-label], .tour-dropdown-btn-content span') || null;
}

/* ============================ 3. Tiện ích ============================ */

const HTML_ESCAPES = Object.freeze({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' });

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => HTML_ESCAPES[character]);
}

function padZero(number) {
    return String(number).padStart(2, '0');
}

function setDisplay(element, value) {
    if (element) element.style.display = value;
}

function setText(element, text) {
    if (element && element.textContent !== text) element.textContent = text;
}

function normalizeSearchText(value) {
    if (typeof window.removeVietnameseTones === 'function') return window.removeVietnameseTones(value);
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/gi, 'd')
        .toLowerCase()
        .trim();
}

/** Chỉ chấp nhận http(s); trả về href tuyệt đối hoặc `fallback`. */
function safeUrl(value, fallback = '') {
    const raw = String(value ?? '').trim();
    if (!raw) return fallback;
    try {
        const url = new URL(raw, window.location.origin);
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : fallback;
    } catch {
        return fallback;
    }
}

function externalLinkHTML(href, label) {
    return `<a href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)}</a>`;
}

function setSafeImageSource(image, source, fallback) {
    if (!image) return;
    image.onerror = () => {
        image.onerror = null;
        image.src = fallback;
    };
    image.src = safeUrl(source, fallback);
}

const MARKDOWN_LINK = /\[([^\]]+)\]\(([^)]+)\)/g;

/** Escape văn bản và đổi [nhãn](url) thành thẻ <a> an toàn. Có memo theo chuỗi. */
const renderMarkdownLinks = (() => {
    const cache = new Map();
    return input => {
        const text = String(input ?? '');
        if (!text || text === NO_INFO) return escapeHTML(text);
        const cached = cache.get(text);
        if (cached !== undefined) return cached;

        let html = '';
        let lastIndex = 0;
        for (const match of text.matchAll(MARKDOWN_LINK)) {
            html += escapeHTML(text.slice(lastIndex, match.index));
            const href = safeUrl(match[2]);
            html += href ? externalLinkHTML(href, match[1]) : escapeHTML(match[0]);
            lastIndex = match.index + match[0].length;
        }
        html += escapeHTML(text.slice(lastIndex));
        cache.set(text, html);
        return html;
    };
})();

/** Gắn link giải thích cho thuật ngữ cờ vua, bỏ qua phần đã nằm trong thẻ <a>. Có memo. */
const linkifyChessTerms = (() => {
    const cache = new Map();
    return html => {
        if (!html || html === NO_INFO) return html;
        const cached = cache.get(html);
        if (cached !== undefined) return cached;

        const placeholders = [];
        const stash = markup => `___PH_${placeholders.push(markup) - 1}___`;
        let result = html.replace(/<a\b[^>]*>.*?<\/a>/gi, stash);
        CHESS_TERMS_RULES.forEach(({ regex, url }) => {
            result = result.replace(regex, match => stash(`<a href="${url}" target="_blank" class="rule-helper-link">${match}</a>`));
        });
        for (let index = placeholders.length - 1; index >= 0; index--) {
            result = result.replace(`___PH_${index}___`, placeholders[index]);
        }
        cache.set(html, result);
        return result;
    };
})();

function appendGameRuleIcons(rulesHTML) {
    if (!rulesHTML || rulesHTML === NO_INFO) return rulesHTML;
    const lower = rulesHTML.toLowerCase();
    return rulesHTML + ICON_RULES_COMPILED
        .filter(rule => rule.keys.some(key => lower.includes(key)))
        .map(rule => rule.html)
        .join('');
}

const formatGameRules = text => appendGameRuleIcons(linkifyChessTerms(renderMarkdownLinks(text)));

function getOrganizerHTML(rawOrganizer, organizerLinks) {
    if (organizerLinks.length) {
        return organizerLinks.map(item => {
            const label = item?.text || '';
            const href = safeUrl(item?.url);
            return href ? externalLinkHTML(href, label) : escapeHTML(label);
        }).join(' · ');
    }
    return ORGANIZER_MAP[rawOrganizer] || renderMarkdownLinks(rawOrganizer) || 'Quản trị viên';
}

/* ============================ 4. Thời gian ============================ */

const TIMEZONE_SUFFIX = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/** Chuỗi ngày (không có múi giờ => giờ Việt Nam) -> timestamp, hoặc null nếu không hợp lệ. */
function parseEventTimestamp(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    let text = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        text += 'T00:00:00+07:00';
    } else {
        text = text.replace(' ', 'T');
        if (!TIMEZONE_SUFFIX.test(text)) text += '+07:00';
    }
    const timestamp = new Date(text).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
}

/** Các thành phần ngày/giờ theo giờ Việt Nam, bất kể múi giờ của trình duyệt. */
function getVietnamParts(timestamp) {
    const date = new Date(timestamp + CONFIG.VIETNAM_OFFSET_MS);
    return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth(),
        date: date.getUTCDate(),
        hours: date.getUTCHours(),
        minutes: date.getUTCMinutes()
    };
}

const getVietnamToday = () => getVietnamParts(Date.now());

const dateKeyOf = (year, month, day) => `${year}-${month}-${day}`;

const getWeekdayLabel = parts => CONFIG.WEEKDAY_LABELS[new Date(parts.year, parts.month, parts.date).getDay()];

const formatClock = parts => `${padZero(parts.hours)}h${padZero(parts.minutes)}`;

function eventValueToRaw(value) {
    return value && typeof value === 'object'
        ? value.start || value.date?.start || value.date || value.start_time
        : value;
}

function hasEventTime(value) {
    const raw = eventValueToRaw(value);
    return typeof raw === 'string' && /(?:T|\s)\d{1,2}:\d{2}/i.test(raw.trim());
}

/** Đưa các định dạng ngày từ API/Notion (m/d/yyyy [h:mm[:ss]], timestamp, object) về chuỗi ISO. */
function normalizeEventDate(value) {
    value = eventValueToRaw(value);
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
    const hour = Number(hourText || 0);
    const minute = Number(minuteText || 0);
    const second = Number(secondText);
    const check = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

    if (
        month < 1 || month > 12 || day < 1 || day > 31 ||
        hour > 23 || minute > 59 || second > 59 ||
        check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day
    ) return '';

    const datePart = `${year}-${padZero(month)}-${padZero(day)}`;
    return hourText === undefined || minuteText === undefined
        ? datePart
        : `${datePart}T${padZero(hour)}:${padZero(minute)}:${padZero(second)}+07:00`;
}

function formatModalDate(parts, withTime) {
    const date = `${getWeekdayLabel(parts)}, ngày ${padZero(parts.date)} tháng ${padZero(parts.month + 1)} năm ${parts.year}`;
    return withTime ? `${date} lúc ${formatClock(parts)}` : date;
}

function formatTimelineDate(tournament) {
    const parts = tournament._startDateParts;
    const date = `${getWeekdayLabel(parts)}, ${padZero(parts.date)} thg ${padZero(parts.month + 1)}, ${parts.year}`;
    return tournament.hasStartTime ? `${date} lúc ${formatClock(parts)}` : date;
}

/** Đoạn "đến ..." ngắn gọn; chỉ có khi dữ liệu thật sự có thời điểm kết thúc. */
function formatEventEndLabel(tournament) {
    if (tournament._explicitEndTimestamp === null) return '';

    const start = tournament._startDateParts;
    const end = tournament._endDateParts;
    const timed = tournament._endHasTime;
    const timeText = formatClock(end);
    const sameDay = start.year === end.year && start.month === end.month && start.date === end.date;

    if (sameDay) {
        if (timed) return `đến ${timeText}`;
        return tournament.hasStartTime ? 'đến hết ngày' : '';
    }
    const yearSuffix = end.year !== start.year ? `/${end.year}` : '';
    const dateText = `${padZero(end.date)}/${padZero(end.month + 1)}${yearSuffix}`;
    return `đến ${timed ? `${timeText} ` : ''}${dateText}`;
}

/* ============================ 5. Mô hình sự kiện ============================ */

function getPrizeCategory(prize) {
    if (typeof prize === 'boolean') return prize ? 'Có thưởng' : 'Giao lưu';
    if (typeof prize === 'number') return prize > 0 ? 'Có thưởng' : 'Giao lưu';

    const value = String(prize || '').toLowerCase().trim().replace(/\s*\+\s*/g, '+');
    if (['đặc biệt+có thưởng', 'đặc biệt có thưởng', 'special+prize'].includes(value)) return 'Đặc biệt+Có thưởng';
    if (['đặc biệt', 'special'].includes(value)) return 'Đặc biệt';
    if (['giao lưu', 'không', 'không có', 'false', '0', ''].includes(value)) return 'Giao lưu';
    return 'Có thưởng';
}

function getExplicitStatus(status) {
    const key = String(status || '').trim().toLowerCase().replace(/[_-]+/g, ' ');
    return STATUS_ALIASES.get(key) || '';
}

/**
 * Chuẩn hoá một bản ghi API và tính sẵn mọi thứ cần cho lọc/hiển thị
 * (timestamp, thành phần ngày, tên không dấu, hạng mục thưởng...), để các
 * lần render sau chỉ còn so sánh số. Trả về null nếu không có ngày bắt đầu hợp lệ.
 */
function normalizeTournament(record) {
    if (!record || typeof record !== 'object') return null;

    const rawEndTime = record.endTime || record.finishTime || record.endDate;
    const startTime = normalizeEventDate(record.startTime);
    const endTime = normalizeEventDate(rawEndTime);
    const startTimestamp = parseEventTimestamp(startTime);
    if (startTimestamp === null) return null;

    const endTimestampRaw = parseEventTimestamp(endTime);
    const endHasTime = hasEventTime(rawEndTime);
    let explicitEndTimestamp = null;
    if (endTimestampRaw !== null) {
        // Ngày kết thúc không kèm giờ nghĩa là hết cả ngày hôm đó (giờ Việt Nam).
        const endTimestamp = endHasTime ? endTimestampRaw : endTimestampRaw + DAY_MS;
        if (endTimestamp >= startTimestamp) explicitEndTimestamp = endTimestamp;
    }

    const eventName = String(record.eventName || '').trim();
    const hasStartTime = typeof record.hasStartTime === 'boolean' ? record.hasStartTime : hasEventTime(record.startTime);
    const prizeCategory = getPrizeCategory(record.prize ?? '');

    return {
        ...record,
        eventName,
        hasStartTime,
        startTime,
        endTime,
        eventType: String(record.eventType || '').trim().toLowerCase().replace(/\s+/g, '-') || 'other',
        status: String(record.status || '').trim(),
        organizerLinks: Array.isArray(record.organizerLinks) ? record.organizerLinks : [],
        isTentative: record.isTentative === true || record.isTentative === 'true' ||
            record.isTentative === STATUS.TENTATIVE || record.isTentative === 'Tentative',
        prize: record.prize ?? '',
        _normalizedEventName: normalizeSearchText(eventName),
        _startTimestamp: startTimestamp,
        _startDateParts: getVietnamParts(startTimestamp),
        _explicitEndTimestamp: explicitEndTimestamp,
        _endTimestamp: explicitEndTimestamp !== null
            ? explicitEndTimestamp
            : startTimestamp + (hasStartTime ? CONFIG.EVENT_DURATION_MS : DAY_MS),
        _endDateParts: endTimestampRaw !== null ? getVietnamParts(endTimestampRaw) : null,
        _endHasTime: endHasTime,
        _explicitStatus: getExplicitStatus(record.status),
        _prizeCategory: prizeCategory,
        _isPrize: prizeCategory === 'Có thưởng' || prizeCategory === 'Đặc biệt+Có thưởng'
    };
}

/**
 * Trạng thái tại thời điểm `now`:
 * - "Đã kết thúc"/"Dự kiến" khai báo rõ là quyết định cuối cùng;
 * - ngày bắt đầu ở tương lai thắng nhãn "đang diễn ra" đã cũ của API;
 * - thời lượng mặc định 2 giờ chỉ để hiển thị, không được tự kết thúc một giải
 *   đã được đánh dấu "đang diễn ra" mà không có giờ kết thúc.
 */
function getEventStatus(tournament, now = Date.now()) {
    const explicit = tournament._explicitStatus;
    if (explicit === STATUS.ENDED || explicit === STATUS.TENTATIVE) return explicit;
    if (tournament.isTentative) return STATUS.TENTATIVE;
    if (tournament._startTimestamp > now) return STATUS.UPCOMING;
    if (explicit === STATUS.ONGOING && tournament._explicitEndTimestamp === null) return STATUS.ONGOING;
    return tournament._endTimestamp > now ? STATUS.ONGOING : STATUS.ENDED;
}

function getEventBadgesHTML(tournament) {
    return PRIZE_BADGES[tournament._prizeCategory] + (STATUS_BADGES[getEventStatus(tournament)] || '');
}

const byStartTime = (a, b) => a._startTimestamp - b._startTimestamp;

/* ============================ 6. Bộ lọc & URL ============================ */

const isInternalCheckbox = checkbox => Boolean(checkbox.closest('[data-internal-filter]'));
const getVisibleTypeCheckboxes = () => typeCheckboxes.filter(checkbox => !isInternalCheckbox(checkbox));

function refreshTypeCheckboxes() {
    typeCheckboxes = Array.from(
        DOM.scheduleTypeGroup?.querySelectorAll('input[type="checkbox"]:not(#schedule-prize-filter)') ?? []
    );
}

function readFilters() {
    return {
        search: normalizeSearchText(DOM.scheduleSearch?.value || ''),
        onlyPrize: Boolean(DOM.schedulePrizeFilter?.checked),
        types: new Set(typeCheckboxes.filter(checkbox => checkbox.checked).map(checkbox => checkbox.value))
    };
}

function statusMatchesFilter(tournament) {
    const filter = STATE.selectedStatusFilter;
    if (filter === 'all') return true;
    const status = getEventStatus(tournament);
    if (filter === 'upcoming') return status === STATUS.UPCOMING || status === STATUS.TENTATIVE;
    if (filter === 'ongoing') return status === STATUS.ONGOING;
    return status === STATUS.ENDED;
}

function matchesFilters(tournament, filters) {
    return (!filters.search || tournament._normalizedEventName.includes(filters.search)) &&
        (!filters.onlyPrize || tournament._isPrize) &&
        filters.types.has(tournament.eventType) &&
        statusMatchesFilter(tournament);
}

function replaceURLQuery(params) {
    const query = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : '') + window.location.hash);
}

function loadFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);

    const monthMatch = /^([0-9]{1,2})-([0-9]{4})$/.exec((params.get('mo') || '').trim());
    if (monthMatch) {
        const month = Number(monthMatch[1]);
        const year = Number(monthMatch[2]);
        if (month >= 1 && month <= 12 && year >= SELECT_MIN_YEAR && year <= SELECT_MAX_YEAR) {
            STATE.initialMonth = { month: month - 1, year };
        }
    }
    if (params.has('search') && DOM.scheduleSearch) DOM.scheduleSearch.value = params.get('search');
    if (params.has('prize') && DOM.schedulePrizeFilter) DOM.schedulePrizeFilter.checked = params.get('prize') === '1';

    const status = params.get('status');
    if (['upcoming', 'ongoing', 'ended'].includes(status)) STATE.selectedStatusFilter = status;

    if (params.has('type')) {
        const selected = new Set(params.get('type').toLowerCase().split(/[\s+]+/));
        typeCheckboxes.forEach(checkbox => {
            // Thể loại nội bộ bị ẩn khỏi UI nên luôn được bật.
            checkbox.checked = isInternalCheckbox(checkbox) || selected.has(checkbox.value.toLowerCase());
        });
    }
}

function saveFiltersToURL(filters) {
    // Giữ tham số "mo" cho tới khi người dùng chủ động đổi tháng.
    const params = new URLSearchParams(window.location.search);
    ['search', 'prize', 'status', 'type'].forEach(key => params.delete(key));

    if (filters.search) params.set('search', filters.search);
    if (filters.onlyPrize) params.set('prize', '1');
    if (STATE.selectedStatusFilter !== 'all') params.set('status', STATE.selectedStatusFilter);

    const visible = getVisibleTypeCheckboxes();
    const selected = visible.filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);
    if (selected.length < visible.length) params.set('type', selected.length ? selected.join(' ') : 'none');
    replaceURLQuery(params);
}

function clearMonthQueryFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('mo')) return;
    params.delete('mo');
    replaceURLQuery(params);
}

function updateStatusFilterControl() {
    if (DOM.statusFilters instanceof HTMLSelectElement) DOM.statusFilters.value = STATE.selectedStatusFilter;
}

function updateFilterControls(filters) {
    const visible = getVisibleTypeCheckboxes();
    const selectedCount = visible.filter(checkbox => checkbox.checked).length;
    const hasActiveFilters = Boolean(filters.search || filters.onlyPrize ||
        selectedCount !== visible.length || STATE.selectedStatusFilter !== 'all');
    if (DOM.resetFilters) DOM.resetFilters.hidden = !hasActiveFilters;

    if (DOM.categoryButton) {
        const text = `Thể loại (${selectedCount}/${visible.length})`;
        setText(DOM.categoryLabel, text);
        DOM.categoryButton.setAttribute('aria-label', `${text}. Mở bộ lọc thể loại`);
    }
}

function updateResultsSummary(monthCount, carryOverCount) {
    if (!DOM.resultsSummary || STATE.displayYear === undefined) return;
    const monthLabel = `${CONFIG.MONTH_NAMES[STATE.displayMonth]}/${STATE.displayYear}`;
    const extra = carryOverCount ? `, cùng ${carryOverCount} giải đang diễn ra từ trước` : '';
    setText(DOM.resultsSummary, `Đang hiển thị ${monthCount} sự kiện trong ${monthLabel}${extra}.`);
}

function applyFilters() {
    const filters = readFilters();
    saveFiltersToURL(filters);
    renderActiveView(filters);
}

function resetFilters() {
    window.clearTimeout(searchTimer);
    searchTimer = 0;
    if (DOM.scheduleSearch) DOM.scheduleSearch.value = '';
    if (DOM.schedulePrizeFilter) DOM.schedulePrizeFilter.checked = false;
    typeCheckboxes.forEach(checkbox => { checkbox.checked = true; });
    STATE.selectedStatusFilter = 'all';
    updateStatusFilterControl();
    applyFilters();
}

function setStatusFilter(status) {
    if (!STATUS_FILTER_VALUES.includes(status)) return;
    STATE.selectedStatusFilter = status;
    applyFilters();
}

/** Thêm hộp kiểm cho thể loại mới xuất hiện trong dữ liệu mà HTML chưa có. */
function ensureEventTypeFilters(events) {
    const group = DOM.scheduleTypeGroup;
    if (!group) return;

    const existingTypes = new Set(typeCheckboxes.map(checkbox => checkbox.value.toLowerCase()));
    const typeParam = new URLSearchParams(window.location.search).get('type');
    const selectedFromURL = typeParam === null ? null : new Set(typeParam.toLowerCase().split(/[\s+]+/));
    const allExistingSelected = typeCheckboxes.length > 0 && typeCheckboxes.every(checkbox => checkbox.checked);

    const unknownTypes = [...new Set(events.map(event => event.eventType))]
        .filter(type => type && !existingTypes.has(type))
        .sort();
    if (!unknownTypes.length) return;

    unknownTypes.forEach(type => {
        const internal = CONFIG.INTERNAL_EVENT_TYPES.has(type);
        const label = document.createElement('label');
        label.className = 'custom-checkbox-container';
        if (internal) {
            label.hidden = true;
            label.dataset.internalFilter = 'true';
            label.style.display = 'none';
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = type;
        checkbox.checked = internal || (selectedFromURL ? selectedFromURL.has(type) : allExistingSelected);

        const mark = document.createElement('span');
        mark.className = 'checkmark';

        const labelText = type === 'other' ? ' Khác (chưa phân loại)' : ` Khác — ${type}`;
        label.append(checkbox, mark, document.createTextNode(labelText));
        group.appendChild(label);
    });
    refreshTypeCheckboxes();
}

function toggleTourDropdown(id) {
    const element = document.getElementById(id);
    if (!element) return;
    document.querySelectorAll('.tour-dropdown').forEach(dropdown => {
        if (dropdown.id !== id) dropdown.classList.remove('open');
    });
    const isOpen = element.classList.toggle('open');
    DOM.categoryButton?.setAttribute('aria-expanded', String(isOpen));
}

function closeTourDropdowns() {
    document.querySelectorAll('.tour-dropdown.open').forEach(dropdown => dropdown.classList.remove('open'));
    DOM.categoryButton?.setAttribute('aria-expanded', 'false');
}

/* ============================ 7. Lịch tháng & tooltip ============================ */

/** Lưới 6 tuần (42 ô), tuần bắt đầu từ thứ Hai. */
function getCalendarDays(year, month) {
    const leadingDays = (new Date(year, month, 1).getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(year, month, 1 - leadingDays + index);
        return { day: date.getDate(), month: date.getMonth(), year: date.getFullYear(), isCurrentMonth: date.getMonth() === month };
    });
}

/** Gom sự kiện theo ngày (giờ Việt Nam) trong một lượt duyệt: O(sự kiện) thay vì O(ô × sự kiện). */
function groupEventsByDay(events) {
    const byDay = new Map();
    events.forEach(tournament => {
        const { year, month, date } = tournament._startDateParts;
        const key = dateKeyOf(year, month, date);
        const bucket = byDay.get(key);
        if (bucket) bucket.push(tournament);
        else byDay.set(key, [tournament]);
    });
    return byDay;
}

const HOVER_QUERY = window.matchMedia('(hover: hover) and (pointer: fine)');
let activeTooltipTrigger = null;

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
    if (!HOVER_QUERY.matches) return;
    const tooltip = getScheduleTooltipElement();
    tooltip.textContent = icon.dataset.tooltip || '';
    tooltip.style.left = '0px';
    tooltip.style.top = '0px';
    tooltip.hidden = false;
    tooltip.setAttribute('aria-hidden', 'false');
    tooltip.classList.add('is-visible');
    icon.setAttribute('aria-describedby', tooltip.id);
    activeTooltipTrigger = icon;

    const anchor = icon.getBoundingClientRect();
    const bounds = tooltip.getBoundingClientRect();
    const margin = 12;
    const maxLeft = Math.max(margin, window.innerWidth - bounds.width - margin);
    const left = Math.max(margin, Math.min(anchor.left + anchor.width / 2 - bounds.width / 2, maxLeft));
    let top = anchor.top - bounds.height - 8;
    if (top < margin) top = Math.min(window.innerHeight - bounds.height - margin, anchor.bottom + 8);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${Math.max(margin, top)}px`;
}

function hideScheduleTooltip() {
    if (!activeTooltipTrigger) return;
    const tooltip = document.getElementById('schedule-event-tooltip');
    activeTooltipTrigger.removeAttribute('aria-describedby');
    activeTooltipTrigger = null;
    if (!tooltip) return;
    tooltip.classList.remove('is-visible');
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.hidden = true;
}

function createEventIcon(tournament) {
    const parts = tournament._startDateParts;
    const status = getEventStatus(tournament);
    const eventName = tournament.eventName || 'sự kiện';

    const icon = document.createElement('button');
    icon.type = 'button';
    icon.className = [
        'event-icon',
        status === STATUS.ENDED && 'ended',
        status === STATUS.TENTATIVE && 'tentative',
        status === STATUS.UPCOMING && 'upcoming',
        status === STATUS.ONGOING && 'ongoing',
        tournament._isPrize && 'has-prize'
    ].filter(Boolean).join(' ');

    const spokenTime = tournament.hasStartTime ? ` lúc ${padZero(parts.hours)} giờ ${padZero(parts.minutes)}` : '';
    icon.setAttribute('aria-label', `Xem chi tiết ${eventName}${spokenTime}`);

    const timeLabel = tournament.hasStartTime ? `${padZero(parts.hours)}:${padZero(parts.minutes)}` : 'Chưa có giờ bắt đầu';
    icon.dataset.tooltip = `${eventName}\n${timeLabel} · ${status}\n${tournament.eventRules || 'Chưa có thông tin thể lệ'}`;
    icon.title = 'Nhấn vào để đọc thêm thông tin về giải này';

    const image = document.createElement('img');
    image.alt = '';
    image.decoding = 'async';
    setSafeImageSource(image, tournament.logo, DEFAULT_LOGO);
    icon.appendChild(image);

    eventByElement.set(icon, tournament);
    return icon;
}

function renderCalendar(eventsByDay) {
    if (!DOM.calendarBody) return;
    const today = getVietnamToday();
    const todayKey = dateKeyOf(today.year, today.month, today.date);
    const days = getCalendarDays(STATE.displayYear, STATE.displayMonth);
    const rows = document.createDocumentFragment();

    for (let index = 0; index < days.length; index += 7) {
        const row = document.createElement('tr');
        days.slice(index, index + 7).forEach(({ day, month, year, isCurrentMonth }) => {
            const key = dateKeyOf(year, month, day);
            const cell = document.createElement('td');
            cell.classList.toggle('other-month', !isCurrentMonth);
            cell.classList.toggle('today', key === todayKey);

            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;

            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'events-container';
            (eventsByDay.get(key) || []).forEach(tournament => eventsContainer.appendChild(createEventIcon(tournament)));

            cell.append(dayNumber, eventsContainer);
            row.appendChild(cell);
        });
        rows.appendChild(row);
    }
    DOM.calendarBody.replaceChildren(rows);
}

/** Một bộ listener uỷ quyền trên <tbody> thay cho 4-5 listener trên mỗi icon. */
function bindCalendarEvents() {
    const body = DOM.calendarBody;
    if (!body) return;
    const iconOf = event => event.target.closest?.('.event-icon') || null;
    const isInternalMove = (event, icon) => icon.contains(event.relatedTarget);

    body.addEventListener('click', event => {
        const icon = iconOf(event);
        if (!icon) return;
        event.stopPropagation();
        openModal(eventByElement.get(icon));
    });
    body.addEventListener('pointerover', event => {
        const icon = iconOf(event);
        if (icon && !isInternalMove(event, icon)) showScheduleTooltip(icon);
    });
    body.addEventListener('pointerout', event => {
        const icon = iconOf(event);
        if (icon && !isInternalMove(event, icon)) hideScheduleTooltip();
    });
    body.addEventListener('focusin', event => {
        const icon = iconOf(event);
        if (icon) showScheduleTooltip(icon);
    });
    body.addEventListener('focusout', event => {
        if (iconOf(event)) hideScheduleTooltip();
    });
}

/* ============================ 8. Modal chi tiết ============================ */

function getDefaultResultUrl(type) {
    return CONFIG.INTERNAL_EVENT_TYPES.has(type)
        ? `/events/tournaments/${type}`
        : `https://chess.com/clubs/events/thi-vua-lay-tot-tungjohn-playing-chess?clubId=325849&ref_id=89365835&type=${type}`;
}

function getModalURLs(tournament) {
    const type = tournament.eventType;
    const internal = CONFIG.INTERNAL_EVENT_TYPES.has(type);
    return {
        // Giải nội bộ luôn có banner/info trong map; chỉ giải ngoài mới cần URL dự phòng.
        bannerUrl: tournament.bannerLink || BANNER_MAP[type] || (internal ? '' : FALLBACK_BANNER),
        newsUrl: tournament.newsLink || INFO_MAP[type] || (internal ? '' : SUPPORT_URL),
        resultUrl: tournament.resultLink !== undefined ? tournament.resultLink : getDefaultResultUrl(type),
        rulesPageUrl: INFO_MAP[type] || SUPPORT_URL
    };
}

function setModalJoinLink(joinUrl) {
    const button = DOM.modalJoinButton;
    if (joinUrl) {
        button.href = joinUrl;
        button.removeAttribute('aria-disabled');
        button.tabIndex = 0;
    } else {
        button.removeAttribute('href');
        button.setAttribute('aria-disabled', 'true');
        button.tabIndex = -1;
    }
}

function openModal(tournament) {
    hideScheduleTooltip();
    if (!DOM.eventModal || !tournament) return;

    if (!DOM.eventModal.classList.contains('open')) {
        STATE.lastFocusedElement = document.activeElement;
        STATE.previousBodyOverflow = document.body.style.overflow;
    }
    const urls = getModalURLs(tournament);
    const tentative = getEventStatus(tournament) === STATUS.TENTATIVE;
    const eventName = tournament.eventName || 'Chi tiết giải đấu';
    const joinUrl = safeUrl(tournament.joinLink);

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

    const withTentativePrefix = text => (tentative && text !== NO_INFO ? `Dự kiến ${text}` : text);
    const gameRules = withTentativePrefix(tournament.gameRules || NO_INFO);
    const eventRules = withTentativePrefix(tournament.eventRules || NO_INFO);
    const dateText = formatModalDate(tournament._startDateParts, tournament.hasStartTime);

    DOM.modalCategory.innerHTML = getEventBadgesHTML(tournament);
    DOM.modalOrganizer.innerHTML = getOrganizerHTML(tournament.organizer || '', tournament.organizerLinks);
    DOM.modalTime.textContent = tentative ? `Dự kiến ${dateText}` : dateText;
    DOM.modalGameRules.innerHTML = formatGameRules(gameRules);
    DOM.modalEventRules.innerHTML = linkifyChessTerms(renderMarkdownLinks(eventRules));
    setSafeImageSource(DOM.modalLogo, tournament.logo, DEFAULT_LOGO);
    setSafeImageSource(DOM.modalBanner, urls.bannerUrl, DEFAULT_BANNER);
    DOM.modalLogoLink.href = safeUrl(urls.rulesPageUrl, '/events');
    DOM.modalLogoLink.rel = 'noopener noreferrer';
    setModalJoinLink(joinUrl);
    DOM.modalInfoButton.href = safeUrl(urls.newsUrl, '/events');
    DOM.modalResultsButton.href = safeUrl(urls.resultUrl, '/events/tournaments');

    DOM.eventModal.classList.add('open');
    DOM.eventModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    (DOM.modalCloseButton || DOM.modalDialog)?.focus({ preventScroll: true });
}

function closeModal() {
    if (!DOM.eventModal?.classList.contains('open')) return;
    DOM.eventModal.classList.remove('open');
    DOM.eventModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = STATE.previousBodyOverflow;
    STATE.previousBodyOverflow = '';
    STATE.lastFocusedElement?.focus?.();
    STATE.lastFocusedElement = null;
}

function trapModalFocus(event) {
    const dialog = DOM.modalDialog;
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR))
        .filter(element => element.getClientRects().length > 0 && !element.closest('[hidden]'));
    if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (!dialog.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && (active === last || active === dialog)) {
        event.preventDefault();
        first.focus();
    }
}

/* ============================ Điều hướng & render chính ============================ */

function updateViewSwitcherButtons() {
    [['calendar', DOM.calendarViewButton], ['timeline', DOM.timelineViewButton]].forEach(([view, button]) => {
        if (!button) return;
        const isActive = STATE.currentView === view;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
}

function updateMonthHeading() {
    const key = `${padZero(STATE.displayMonth + 1)}-${STATE.displayYear}`;
    if (!DOM.monthTitle || DOM.monthTitle.dataset.monthKey === key) return;

    const monthText = `${STATE.displayMonth + 1}`;
    DOM.monthTitle.dataset.monthKey = key;
    if (DOM.monthLabel) DOM.monthLabel.textContent = `Tháng ${monthText}`;
    if (DOM.yearLabel) DOM.yearLabel.textContent = String(STATE.displayYear);
    DOM.monthSelectButton?.setAttribute('aria-label', `Chọn tháng. Đang xem tháng ${monthText}`);
    DOM.yearSelectButton?.setAttribute('aria-label', `Chọn năm. Đang xem năm ${STATE.displayYear}`);
    if (DOM.monthLive) DOM.monthLive.textContent = `Đang xem tháng ${monthText} năm ${STATE.displayYear}`;
}

/** Giải bắt đầu từ tháng trước nhưng vẫn đang diễn ra; chỉ hiện khi xem tháng hiện tại. */
function getCarryOverEvents(visibleEvents) {
    const today = getVietnamToday();
    if (STATE.displayYear !== today.year || STATE.displayMonth !== today.month) return [];
    return visibleEvents
        .filter(tournament => {
            const { year, month } = tournament._startDateParts;
            const startsEarlier = year < STATE.displayYear || (year === STATE.displayYear && month < STATE.displayMonth);
            return startsEarlier && getEventStatus(tournament) === STATUS.ONGOING;
        })
        .sort(byStartTime);
}

function renderActiveView(filters = readFilters()) {
    updateStatusFilterControl();

    if (!STATE.tournaments.length) {
        setDisplay(DOM.calendarWrapper, 'none');
        setDisplay(DOM.timelineWrapper, 'none');
        setDisplay(DOM.emptyState, 'block');
        return;
    }

    updateMonthHeading();

    // Lọc đúng một lượt; lịch, timeline và bản tóm tắt cùng dùng kết quả này.
    const visibleEvents = STATE.tournaments.filter(tournament => matchesFilters(tournament, filters));
    const monthEvents = visibleEvents
        .filter(({ _startDateParts: { year, month } }) => year === STATE.displayYear && month === STATE.displayMonth)
        .sort(byStartTime);
    const isTimeline = STATE.currentView === 'timeline';
    const carryOverEvents = isTimeline ? getCarryOverEvents(visibleEvents) : [];

    updateFilterControls(filters);
    updateResultsSummary(monthEvents.length, carryOverEvents.length);

    setDisplay(DOM.calendarWrapper, isTimeline ? 'none' : 'block');
    setDisplay(DOM.timelineWrapper, isTimeline ? 'block' : 'none');
    if (isTimeline) renderTimeline(monthEvents, carryOverEvents);
    else renderCalendar(groupEventsByDay(visibleEvents));

    if (monthEvents.length || carryOverEvents.length) {
        setDisplay(DOM.emptyState, 'none');
    } else if (DOM.emptyState) {
        setText(DOM.emptyState.querySelector('p'), 'Không có sự kiện nào khớp với các bộ lọc trong tháng này.');
        setDisplay(DOM.emptyState, 'block');
    }
}

function setDisplayedMonth({ month = STATE.displayMonth, year = STATE.displayYear }) {
    const changed = month !== STATE.displayMonth || year !== STATE.displayYear;
    STATE.displayMonth = month;
    STATE.displayYear = year;
    if (changed) clearMonthQueryFromURL();
    renderActiveView();
}

function changeMonth(offset) {
    // Date tự cuộn tháng/năm (0 - 1 => tháng 12 năm trước).
    const next = new Date(STATE.displayYear, STATE.displayMonth + offset, 1);
    setDisplayedMonth({ month: next.getMonth(), year: next.getFullYear() });
}

function switchView(view) {
    if (view !== 'calendar' && view !== 'timeline') return;
    STATE.currentView = view;
    updateViewSwitcherButtons();
    renderActiveView();
}

/* ============================ 9. Menu chọn tháng/năm ============================ */

const SELECT_MENU = { el: null, kind: '', trigger: null, isOpen: false };
let selectMenuPositionFrame = 0;

const getSelectTrigger = kind => (kind === 'month' ? DOM.monthSelectButton : DOM.yearSelectButton);

function buildSelectMenu() {
    if (SELECT_MENU.el) return SELECT_MENU.el;

    const menu = document.createElement('div');
    menu.id = 'schedule-select-menu';
    menu.className = 'schedule-select-menu';
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;
    document.body.appendChild(menu);

    menu.addEventListener('click', event => {
        const option = event.target.closest('[data-value]');
        if (option) selectFromMenu(SELECT_MENU.kind, Number(option.dataset.value));
    });
    menu.addEventListener('keydown', event => {
        if (event.key === 'Tab') {
            moveFocusFromSelectMenu(event);
            return;
        }
        const options = Array.from(menu.querySelectorAll('[role="option"]'));
        if (!options.length) return;
        const index = options.indexOf(document.activeElement);
        const targets = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: options.length - 1 };
        if (!(event.key in targets)) return;

        event.preventDefault();
        const nextIndex = Math.min(Math.max(targets[event.key], 0), options.length - 1);
        options.forEach((option, optionIndex) => { option.tabIndex = optionIndex === nextIndex ? 0 : -1; });
        options[nextIndex].focus();
    });

    SELECT_MENU.el = menu;
    return menu;
}

function getSelectOptions(kind) {
    const today = getVietnamToday();
    if (kind === 'month') {
        return CONFIG.MONTH_NAMES.map((name, month) => ({
            value: month,
            label: name,
            selected: month === STATE.displayMonth,
            current: STATE.displayYear === today.year && month === today.month,
            aria: name
        }));
    }

    let min = Math.min(today.year - 1, STATE.displayYear);
    let max = Math.max(today.year + 2, STATE.displayYear);
    STATE.tournaments.forEach(({ _startDateParts: { year } }) => {
        if (year <= 1970) return;
        min = Math.min(min, year);
        max = Math.max(max, year);
    });
    min = Math.max(min, SELECT_MIN_YEAR);
    max = Math.min(max, SELECT_MAX_YEAR);
    return Array.from({ length: max - min + 1 }, (_, index) => {
        const year = min + index;
        return { value: year, label: String(year), selected: year === STATE.displayYear, current: year === today.year, aria: `Năm ${year}` };
    });
}

function positionSelectMenu() {
    const { el: menu, trigger } = SELECT_MENU;
    if (!menu || !trigger || menu.hidden) return;

    const margin = 8;
    const rect = trigger.getBoundingClientRect();
    // Để nhãn quyết định chiều rộng menu thay vì kế thừa nút kích hoạt rộng hơn.
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    const viewportWidth = document.documentElement.clientWidth;
    const left = Math.min(Math.max(rect.left, margin), Math.max(margin, viewportWidth - width - margin));
    const roomBelow = window.innerHeight - rect.bottom - margin;
    const preferredTop = roomBelow >= height || rect.top < height + margin ? rect.bottom + 6 : rect.top - height - 6;
    const maxTop = Math.max(margin, window.innerHeight - height - margin);

    menu.style.left = `${left}px`;
    menu.style.top = `${Math.min(Math.max(margin, preferredTop), maxTop)}px`;
}

function scheduleSelectMenuPosition() {
    if (!SELECT_MENU.isOpen || selectMenuPositionFrame) return;
    selectMenuPositionFrame = window.requestAnimationFrame(() => {
        selectMenuPositionFrame = 0;
        if (SELECT_MENU.isOpen) positionSelectMenu();
    });
}

function openSelectMenu(kind) {
    const trigger = getSelectTrigger(kind);
    if (!trigger || STATE.displayYear === undefined) return;

    closeSelectMenu();
    const menu = buildSelectMenu();
    menu.dataset.kind = kind;
    menu.setAttribute('aria-label', kind === 'month' ? 'Chọn tháng' : 'Chọn năm');

    const fragment = document.createDocumentFragment();
    getSelectOptions(kind).forEach(option => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'schedule-select-option';
        button.dataset.value = String(option.value);
        button.setAttribute('role', 'option');
        button.setAttribute('aria-selected', String(option.selected));
        button.tabIndex = option.selected ? 0 : -1;
        button.classList.toggle('is-current', option.current);
        button.setAttribute('aria-label', `${option.aria}${option.current ? ', hiện tại' : ''}`);

        const text = document.createElement('span');
        text.textContent = option.label;
        button.appendChild(text);
        fragment.appendChild(button);
    });
    menu.replaceChildren(fragment);

    SELECT_MENU.kind = kind;
    SELECT_MENU.trigger = trigger;
    SELECT_MENU.isOpen = true;
    trigger.setAttribute('aria-expanded', 'true');
    menu.hidden = false;
    positionSelectMenu();

    const selected = menu.querySelector('[aria-selected="true"]') || menu.querySelector('[role="option"]');
    selected?.focus({ preventScroll: true });
    selected?.scrollIntoView?.({ block: 'nearest' });
}

function closeSelectMenu({ restoreFocus = false } = {}) {
    if (!SELECT_MENU.isOpen) return;
    if (selectMenuPositionFrame) {
        window.cancelAnimationFrame(selectMenuPositionFrame);
        selectMenuPositionFrame = 0;
    }
    const { trigger } = SELECT_MENU;
    SELECT_MENU.isOpen = false;
    SELECT_MENU.trigger = null;
    if (SELECT_MENU.el) SELECT_MENU.el.hidden = true;
    trigger?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger?.focus();
}

function moveFocusFromSelectMenu(event) {
    const { trigger } = SELECT_MENU;
    event.preventDefault();
    closeSelectMenu();
    if (!trigger) return;

    const focusable = Array.from(document.querySelectorAll(FOCUSABLE_SELECTOR)).filter(element =>
        !element.closest('#schedule-select-menu, [hidden], [aria-hidden="true"]') && element.getClientRects().length > 0
    );
    const index = focusable.indexOf(trigger);
    if (index < 0) {
        trigger.focus();
        return;
    }
    const direction = event.shiftKey ? -1 : 1;
    const next = focusable[index + direction] || (direction > 0 ? focusable[0] : focusable[focusable.length - 1]);
    next?.focus();
}

function selectFromMenu(kind, value) {
    if (!Number.isInteger(value)) return;
    let target;
    if (kind === 'month' && value >= 0 && value <= 11) target = { month: value };
    else if (kind === 'year' && value >= SELECT_MIN_YEAR && value <= SELECT_MAX_YEAR) target = { year: value };
    else return;

    closeSelectMenu({ restoreFocus: true });
    setDisplayedMonth(target);
}

function initializeSelectMenus() {
    const menu = buildSelectMenu();
    [['month', DOM.monthSelectButton], ['year', DOM.yearSelectButton]].forEach(([kind, trigger]) => {
        if (!trigger) return;
        trigger.setAttribute('aria-controls', menu.id);
        trigger.addEventListener('click', () => {
            if (SELECT_MENU.isOpen && SELECT_MENU.trigger === trigger) closeSelectMenu();
            else openSelectMenu(kind);
        });
        trigger.addEventListener('keydown', event => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                openSelectMenu(kind);
            }
        });
    });

    const isInsideSelect = target =>
        SELECT_MENU.el?.contains(target) || DOM.monthSelectButton?.contains(target) || DOM.yearSelectButton?.contains(target);
    document.addEventListener('click', event => {
        if (SELECT_MENU.isOpen && !isInsideSelect(event.target)) closeSelectMenu();
    });
    document.addEventListener('focusin', event => {
        if (SELECT_MENU.isOpen && !isInsideSelect(event.target)) closeSelectMenu();
    });
    window.addEventListener('resize', scheduleSelectMenuPosition, { passive: true });
    window.addEventListener('scroll', scheduleSelectMenuPosition, { passive: true });
}

/* ============================ 10. Timeline ============================ */

function createTimelineEvent(tournament, { carryOver = false } = {}) {
    const parts = tournament._startDateParts;
    const status = getEventStatus(tournament);
    const joinUrl = safeUrl(tournament.joinLink);
    const endLabel = formatEventEndLabel(tournament);

    const item = document.createElement('li');
    item.className = `timeline-event ${TIMELINE_STATUS_CLASS[status] || ''}`.trim();

    const time = document.createElement('span');
    time.className = 'timeline-event-time';
    const timeMain = document.createElement('strong');
    timeMain.textContent = tournament.hasStartTime ? formatClock(parts) : 'Cả ngày';
    time.appendChild(timeMain);
    const timeNote = carryOver ? `Từ ${padZero(parts.date)}/${padZero(parts.month + 1)}` : endLabel;
    if (timeNote) {
        const small = document.createElement('small');
        small.textContent = timeNote;
        time.appendChild(small);
    }

    const node = document.createElement('span');
    node.className = 'timeline-node';
    node.setAttribute('aria-hidden', 'true');

    const card = document.createElement('article');
    card.className = 'timeline-card';
    eventByElement.set(card, tournament);

    const head = document.createElement('div');
    head.className = 'timeline-card-head';
    const logo = document.createElement('img');
    logo.className = 'timeline-card-logo';
    logo.alt = '';
    logo.width = 48;
    logo.height = 48;
    logo.loading = 'lazy';
    logo.decoding = 'async';
    setSafeImageSource(logo, tournament.logo, DEFAULT_LOGO);
    const titleGroup = document.createElement('div');
    titleGroup.className = 'timeline-card-title-group';
    const badges = document.createElement('div');
    badges.className = 'timeline-card-badges';
    badges.innerHTML = getEventBadgesHTML(tournament);
    const title = document.createElement('h3');
    title.className = 'timeline-card-title';
    title.textContent = tournament.eventName || 'Tournament';
    titleGroup.append(badges, title);
    head.append(logo, titleGroup);

    const timeText = `${formatTimelineDate(tournament)}${endLabel ? ` ${endLabel}` : ''}`;
    const whenText = status === STATUS.TENTATIVE ? `Dự kiến: ${timeText}` : timeText;
    const details = document.createElement('div');
    details.className = 'timeline-card-details';
    details.innerHTML = `
        <div class="event-card-detail-item"><i class="bx bx-calendar" aria-hidden="true"></i><span><strong>Thời gian:</strong> ${escapeHTML(whenText)}</span></div>
        <div class="event-card-detail-item"><i class="bx bx-grid-alt" aria-hidden="true"></i><span><strong>Thể lệ:</strong> ${renderMarkdownLinks(tournament.eventRules || NO_INFO)}</span></div>
        <div class="event-card-detail-item"><i class="bx bxs-chess" aria-hidden="true"></i><span><strong>Ván đấu:</strong> ${formatGameRules(tournament.gameRules || NO_INFO)}</span></div>
        <div class="event-card-detail-item"><i class="bx bxs-user-check" aria-hidden="true"></i><span><strong>Tổ chức:</strong> ${getOrganizerHTML(tournament.organizer || '', tournament.organizerLinks)}</span></div>`;

    const footer = document.createElement('div');
    footer.className = 'timeline-card-footer';
    const detailButton = document.createElement('button');
    detailButton.type = 'button';
    detailButton.className = 'btn btn-secondary timeline-card-btn';
    detailButton.innerHTML = '<i class="bx bx-info-circle" aria-hidden="true"></i> Chi tiết';
    footer.appendChild(detailButton);
    if (joinUrl && status !== STATUS.ENDED) {
        const joinLink = document.createElement('a');
        joinLink.className = 'btn btn-primary timeline-card-btn';
        joinLink.href = joinUrl;
        joinLink.target = '_blank';
        joinLink.rel = 'noopener noreferrer';
        joinLink.innerHTML = '<i class="bx bx-link-external" aria-hidden="true"></i> Tham gia';
        footer.appendChild(joinLink);
    }

    card.append(head, details, footer);
    item.append(time, node, card);
    return item;
}

function createTimelineDay({ key, parts, today, todayKey, events, carryOver = false }) {
    const dayItem = document.createElement('li');
    dayItem.className = 'timeline-day';
    const head = document.createElement('div');
    head.className = 'timeline-day-head';
    const number = document.createElement('span');
    number.className = 'timeline-day-num';
    const meta = document.createElement('span');
    meta.className = 'timeline-day-meta';
    const heading = document.createElement('strong');
    const sub = document.createElement('small');
    let isToday = false;

    if (carryOver) {
        dayItem.classList.add('timeline-day--ongoing');
        number.innerHTML = '<i class="bx bx-play-circle" aria-hidden="true"></i>';
        heading.textContent = 'Đang diễn ra';
        sub.textContent = 'Bắt đầu từ trước tháng này';
    } else {
        isToday = key === todayKey;
        const isPast = Date.UTC(parts.year, parts.month, parts.date) < Date.UTC(today.year, today.month, today.date);
        dayItem.classList.toggle('is-today', isToday);
        dayItem.classList.toggle('is-past', isPast);
        number.textContent = padZero(parts.date);
        heading.textContent = getWeekdayLabel(parts);
        sub.textContent = `thg ${padZero(parts.month + 1)}, ${parts.year}`;
    }

    meta.append(heading, sub);
    head.append(number, meta);
    if (isToday) {
        const chip = document.createElement('span');
        chip.className = 'timeline-today-chip';
        chip.textContent = 'Hôm nay';
        head.appendChild(chip);
    }

    const eventList = document.createElement('ul');
    eventList.className = 'timeline-events';
    events.forEach(tournament => eventList.appendChild(createTimelineEvent(tournament, { carryOver })));
    dayItem.append(head, eventList);
    return dayItem;
}

function renderTimeline(events, carryOverEvents) {
    if (!DOM.timelineContainer) return;
    if (!events.length && !carryOverEvents.length) {
        DOM.timelineContainer.replaceChildren();
        return;
    }

    const today = getVietnamToday();
    const todayKey = dateKeyOf(today.year, today.month, today.date);
    const groups = new Map();
    events.forEach(tournament => {
        const parts = tournament._startDateParts;
        const key = dateKeyOf(parts.year, parts.month, parts.date);
        const group = groups.get(key);
        if (group) group.events.push(tournament);
        else groups.set(key, { key, parts, events: [tournament] });
    });

    const list = document.createElement('ol');
    list.className = 'schedule-timeline';
    list.setAttribute('aria-label', `Timeline sự kiện ${CONFIG.MONTH_NAMES[STATE.displayMonth]}/${STATE.displayYear}`);
    if (carryOverEvents.length) {
        list.appendChild(createTimelineDay({ events: carryOverEvents, carryOver: true, today, todayKey }));
    }
    groups.forEach(group => list.appendChild(createTimelineDay({ ...group, today, todayKey })));
    DOM.timelineContainer.replaceChildren(list);
}

/** Click vào vùng trống của card mở modal; link bên trong card giữ hành vi riêng. */
function bindTimelineEvents() {
    DOM.timelineContainer?.addEventListener('click', event => {
        if (event.target.closest('a')) return;
        const card = event.target.closest('.timeline-card');
        if (card) openModal(eventByElement.get(card));
    });
}

/* ============================ 11. Tải dữ liệu & cache ============================ */

const SCHEDULE_CACHE_KEY = 'tvlt_schedule_cache_v1';
const SCHEDULE_CACHE_TTL_MS = 5 * 60 * 1000;
const SCHEDULE_CACHE_MAX_STALE_MS = DAY_MS;

/**
 * Nguồn dữ liệu nằm sau một adapter để sau này thay bằng Notion mà không phải
 * sửa phần chuẩn hoá, lọc hay hiển thị.
 */
const scheduleDataAdapter = {
    async fetch() {
        const response = await fetch(CONFIG.API_URL, { headers: { Accept: 'application/json' } });
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

        if (data?.status === 'error') throw new Error(data.message || 'Nguồn dữ liệu lịch trả về lỗi.');
        if (!Array.isArray(data?.events)) {
            throw new Error('JSON API không đúng cấu trúc: cần có thuộc tính "events" là một mảng.');
        }
        return data;
    }
};

/** Thời điểm cập nhật từ API (không có múi giờ => giờ Việt Nam); thiếu/sai thì dùng giờ hiện tại. */
function parseLastUpdated(data) {
    let value = String(data.lastUpdated || data.events[0]?.timestamp || '').trim().replace(' ', 'T');
    if (value && !TIMEZONE_SUFFIX.test(value)) value += '+07:00';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date() : date;
}

function setLastUpdated(data) {
    if (!DOM.lastUpdated) return;
    DOM.lastUpdated.textContent = parseLastUpdated(data).toLocaleString('vi-VN', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

function setScheduleState(state) {
    setDisplay(DOM.loadingState, state === 'loading' ? 'block' : 'none');
    setDisplay(DOM.errorState, state === 'error' ? 'block' : 'none');
    setDisplay(DOM.emptyState, state === 'empty' ? 'block' : 'none');
    setDisplay(DOM.scheduleSkeleton, state === 'loading' ? 'block' : 'none');

    if (state === 'loading' || state === 'error' || state === 'empty') {
        setDisplay(DOM.calendarWrapper, 'none');
        setDisplay(DOM.timelineWrapper, 'none');
    }
}

function applyScheduleData(data) {
    const tournaments = data.events.map(normalizeTournament).filter(Boolean);
    if (data.events.length && !tournaments.length) {
        throw new Error(`Nguồn dữ liệu trả về ${data.events.length} sự kiện nhưng không có ngày bắt đầu hợp lệ.`);
    }

    STATE.tournaments = tournaments;
    ensureEventTypeFilters(tournaments);
    setLastUpdated(data);
    STATE.hasUsableData = true;
}

function readScheduleCache() {
    try {
        const cached = JSON.parse(localStorage.getItem(SCHEDULE_CACHE_KEY) || 'null');
        if (!cached || cached.version !== 1 || !Array.isArray(cached.data?.events)) return null;
        const age = Date.now() - Number(cached.savedAt);
        if (!Number.isFinite(age) || age < 0 || age > SCHEDULE_CACHE_MAX_STALE_MS) return null;
        return cached;
    } catch {
        return null;
    }
}

function writeScheduleCache(data) {
    try {
        localStorage.setItem(SCHEDULE_CACHE_KEY, JSON.stringify({ version: 1, savedAt: Date.now(), data }));
    } catch {
        // Bị chặn storage hoặc hết dung lượng không được làm hỏng việc hiển thị lịch.
    }
}

function clearScheduleCache() {
    try { localStorage.removeItem(SCHEDULE_CACHE_KEY); } catch { /* storage không khả dụng */ }
}

function showScheduleError(error) {
    setScheduleState('error');
    if (!DOM.errorState) return;

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
    retry.addEventListener('click', () => loadTournaments(), { once: true });
    hint.append(' ', forum);
    wrapper.append(message, hint, retry);
    DOM.errorState.replaceChildren(wrapper);
}

function showSchedule() {
    STATE.hasShownSchedule = true;
    setScheduleState('ready');
    setDisplay(DOM.viewSwitcherContainer, 'inline-flex');
    setDisplay(DOM.scheduleFilters, 'grid');
    STATE.currentView = 'calendar';
    updateViewSwitcherButtons();

    const today = getVietnamToday();
    STATE.displayYear = STATE.initialMonth?.year ?? today.year;
    STATE.displayMonth = STATE.initialMonth?.month ?? today.month;
    renderActiveView();

    DOM.calendarWrapper?.classList.add('schedule-entrance');
}

async function refreshScheduleData({ background = false } = {}) {
    if (STATE.refreshPromise) return STATE.refreshPromise;
    if (!background) setScheduleState('loading');

    STATE.refreshPromise = (async () => {
        try {
            const data = await scheduleDataAdapter.fetch();
            applyScheduleData(data);
            writeScheduleCache(data);

            if (!STATE.tournaments.length) {
                setScheduleState('empty');
            } else if (background && STATE.hasShownSchedule) {
                // Giữ tháng, chế độ xem và bộ lọc của người dùng; chỉ vẽ lại với dữ liệu mới.
                setScheduleState('ready');
                renderActiveView();
            } else {
                showSchedule();
            }
        } catch (error) {
            if (STATE.hasUsableData) {
                // Giữ lịch dùng được gần nhất khi làm mới thất bại.
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

            const isFresh = Date.now() - cached.savedAt <= SCHEDULE_CACHE_TTL_MS;
            if (!isFresh && DOM.lastUpdated) DOM.lastUpdated.textContent += ' · đang dùng dữ liệu lưu tạm';
            // Vẽ ngay từ cache, làm mới nguồn ở nền.
            void refreshScheduleData({ background: true });
            return;
        } catch {
            clearScheduleCache();
            STATE.hasUsableData = false;
        }
    }
    await refreshScheduleData({ background: false });
}

/* ============================ 12. Khởi tạo ============================ */

function initializeEventListeners() {
    window.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            if (SELECT_MENU.isOpen) {
                closeSelectMenu({ restoreFocus: true });
            } else if (DOM.eventModal?.classList.contains('open')) {
                closeModal();
            } else if (document.querySelector('.tour-dropdown.open')) {
                closeTourDropdowns();
                DOM.categoryButton?.focus();
            }
        } else if (event.key === 'Tab' && DOM.eventModal?.classList.contains('open')) {
            trapModalFocus(event);
        }
    });
    window.addEventListener('click', event => {
        if (event.target === DOM.eventModal) closeModal();
    });
    document.addEventListener('click', event => {
        if (!event.target.closest('.tour-dropdown')) closeTourDropdowns();
    });
    document.addEventListener('scroll', hideScheduleTooltip, { capture: true, passive: true });
    window.addEventListener('resize', hideScheduleTooltip, { passive: true });

    DOM.scheduleSearch?.addEventListener('input', () => {
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(() => {
            searchTimer = 0;
            applyFilters();
        }, 140);
    });
    DOM.schedulePrizeFilter?.addEventListener('change', applyFilters);
    DOM.scheduleTypeGroup?.addEventListener('change', applyFilters);
    DOM.resetFilters?.addEventListener('click', resetFilters);
    DOM.categoryButton?.addEventListener('click', () => toggleTourDropdown('schedule-category-dropdown'));
    DOM.previousMonthButton?.addEventListener('click', () => changeMonth(-1));
    DOM.nextMonthButton?.addEventListener('click', () => changeMonth(1));
    DOM.calendarViewButton?.addEventListener('click', () => switchView('calendar'));
    DOM.timelineViewButton?.addEventListener('click', () => switchView('timeline'));
    DOM.modalCloseButton?.addEventListener('click', closeModal);
    if (DOM.statusFilters instanceof HTMLSelectElement) {
        DOM.statusFilters.addEventListener('change', () => setStatusFilter(DOM.statusFilters.value));
    }

    initializeSelectMenus();
    bindCalendarEvents();
    bindTimelineEvents();
    updateStatusFilterControl();
}

function initialize() {
    cacheDOMElements();
    refreshTypeCheckboxes();
    loadFiltersFromURL();
    initializeEventListeners();
    loadTournaments();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
else initialize();
})();
