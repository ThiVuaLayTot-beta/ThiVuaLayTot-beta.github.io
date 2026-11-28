/**
 * Tiện ích dùng chung cho tournament-fetcher.js và aggregated-fetcher.js
 * (các trang /events/tournaments/*).
 *
 * File này phải được nạp (defer) TRƯỚC hai fetcher; xem _layouts/event.html.
 * Giao diện công khai: window.TVLTTournamentCommon.
 */
(() => {
'use strict';

/* ============================ Hằng số ============================ */

const CHESS_COM_URL = 'https://www.chess.com';
const CHESS_COM_API = 'https://api.chess.com/pub';
const GIST_BASE = 'https://gist.githubusercontent.com/M-DinhHoangViet/9c53a11fca709a656076bf6de7c118b0/raw';
const DEFAULT_AVATAR = 'https://www.chess.com/bundles/web/images/user-image.007dad08.svg';
const TOP_PLAYERS = 6;
const MAX_CONCURRENT_REQUESTS = 10;

const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;
const TTL = Object.freeze({
    PLAYER: 7 * DAY_MS,
    TOURNAMENT: DAY_MS,
    FINISHED_TOURNAMENT: 30 * DAY_MS,
    AGGREGATE: 12 * HOUR_MS
});

const VARIANTS = Object.freeze({
    chess: { name: 'Cờ tiêu chuẩn', url: '/terms/chess', icon: '/bundles/web/images/icons/smileys/2x/board.png' },
    standard: { name: 'Cờ tiêu chuẩn', url: '/terms/chess', icon: '/bundles/web/images/icons/smileys/2x/board.png' },
    chess960: { name: 'Chess960', url: '/terms/chess960', icon: '/bundles/web/images/variants/live_960_orange.svg' },
    kingofthehill: { name: 'KOTH', url: '/terms/king-of-the-hill', icon: '/bundles/web/images/variants/koth.svg' },
    crazyhouse: { name: 'Crazyhouse', url: '/terms/crazyhouse-chess', icon: '/bundles/web/images/variants/crazyhouse.svg' },
    bughouse: { name: 'Bughouse', url: '/terms/bughouse-chess', icon: '/bundles/web/images/variants/bughouse.svg' },
    threecheck: { name: '3 Chiếu', url: '/terms/3-check-chess', icon: '/bundles/web/images/variants/3check.svg' },
    custom: { name: 'Custom', url: '/terms/chess-variants', icon: '/bundles/web/images/icons/smileys/2x/themes.png' }
});

const TIME_ICONS = Object.freeze({
    lightning: { name: 'Bullet', path: '/bundles/web/images/icons/smileys/2x/bullet.png' },
    bullet: { name: 'Bullet', path: '/bundles/web/images/icons/smileys/2x/bullet.png' },
    blitz: { name: 'Blitz', path: '/bundles/web/images/icons/smileys/2x/blitz.png' },
    rapid: { name: 'Rapid', path: '/bundles/web/images/icons/smileys/2x/live.png' },
    standard: { name: 'Rapid', path: '/bundles/web/images/icons/smileys/2x/live.png' }
});

const ACCOUNT_BADGES = Object.freeze({
    'closed:abuse': { className: 'user-badges-closed', icon: 'bx bx-dislike', text: 'Bị khóa: Lạm dụng' },
    'closed:fair_play_violations': { className: 'user-badges-closed', icon: 'bx bx-block', text: 'Bị khóa: Fair Play' },
    closed: { className: 'user-badges-inactive', icon: 'bx bx-no-signal', text: 'Bị khóa' }
});

const RANK_BADGES = Object.freeze({
    1: '🥇 Hạng 1',
    2: '🥈 Hạng 2',
    3: '🥉 Hạng 3',
    4: '🎖️ Hạng 4',
    5: '🏅 Hạng 5',
    6: '⭐ Hạng 6'
});

/* ============================ Escape & URL ============================ */

const HTML_ESCAPES = Object.freeze({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' });

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => HTML_ESCAPES[character]);
}

/** Chỉ chấp nhận http(s); trả về href tuyệt đối hoặc `fallback`. */
function safeHttpUrl(value, fallback = '#') {
    try {
        const url = new URL(String(value ?? ''), window.location.origin);
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : fallback;
    } catch {
        return fallback;
    }
}

/* ============================ Định dạng ============================ */

function iconHTML(src, size = 15) {
    return `<img src="${escapeHTML(safeHttpUrl(src))}" width="${size}" height="${size}" alt="" style="display: inline-block; vertical-align: middle;">`;
}

function getRankBadge(rank) {
    return RANK_BADGES[rank] || (rank ? `Hạng ${escapeHTML(rank)}` : 'N/A');
}

function formatAccountBadge(status) {
    const badge = ACCOUNT_BADGES[status];
    if (!badge) return '';
    return `<div class="user-badges-component"><div class="user-badges-badge ${badge.className}"><span class="${badge.icon}"></span><span>${badge.text}</span></div></div>`;
}

/** "{tc} {Bullet|Blitz|Rapid|Standard}" kèm icon của thể loại thời gian. */
function formatTimeControl(timeControl, timeClass) {
    const icon = TIME_ICONS[timeClass];
    const iconMarkup = icon ? iconHTML(CHESS_COM_URL + icon.path) : '';
    return `${escapeHTML(timeControl)} ${icon?.name || 'Standard'}${iconMarkup}`;
}

/** Timestamp (giây) -> "HHhMM, ngày dd/mm/yyyy" theo giờ trình duyệt; `clockSeparator` đổi dấu giữa giờ và phút. */
function formatTimestamp(seconds, clockSeparator = 'h') {
    if (!seconds) return 'N/A';
    const date = new Date(seconds * 1000);
    if (Number.isNaN(date.getTime())) return 'N/A';
    const pad = number => String(number).padStart(2, '0');
    return `${pad(date.getHours())}${clockSeparator}${pad(date.getMinutes())}, ngày ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

const DURATION_UNITS = Object.freeze([
    { name: 'ngày', ms: DAY_MS },
    { name: 'tiếng', ms: HOUR_MS },
    { name: 'phút', ms: 60 * 1000 },
    { name: 'giây', ms: 1000 }
]);

function calculateDuration(startSeconds, endSeconds) {
    if (!startSeconds || !endSeconds) return 'N/A';
    const start = new Date(startSeconds * 1000);
    const end = new Date(endSeconds * 1000);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 'N/A';

    const diff = end - start;
    for (const { name, ms } of DURATION_UNITS) {
        if (diff < ms) continue;
        const value = Math.floor(diff / ms);
        const remainder = diff % ms;
        if (name === 'tiếng' && remainder >= 60000) return `${value} tiếng ${Math.floor(remainder / 60000)} phút`;
        return `${value} ${name}`;
    }
    return 'N/A';
}

/** "180+2" (giây) hoặc "180" -> "3+2" / "3+0" (phút+tăng); thiếu/sai -> "3+0". */
function parseTimeControl(timeControl) {
    if (!timeControl) return '3+0';
    const toMinutes = seconds => (seconds >= 60 ? Math.floor(seconds / 60) : seconds);

    const match = String(timeControl).match(/^(\d+)\+(\d+)$/);
    if (match) return `${toMinutes(parseInt(match[1], 10))}+${parseInt(match[2], 10)}`;

    const seconds = parseInt(timeControl, 10);
    return Number.isNaN(seconds) ? '3+0' : `${toMinutes(seconds)}+0`;
}

/**
 * Nhãn thể thức (Arena / Swiss). `spaced` giữ nguyên khoảng trắng giữa các
 * thành phần như trang giải thường vẫn dùng; trang tổng hợp dùng bản liền.
 */
function formatTournamentType(rounds, duration, spaced) {
    const gap = spaced ? ' ' : '';
    if (rounds === 1) {
        return `<span class="tournament-format-type"><a href="https://support.chess.com/articles/8562889-what-are-arena-tournaments" target="_blank" rel="noopener noreferrer">Đấu trường Arena</a>${gap}<span class="tournament-format-detail">${duration}</span>${gap}<img src="https://chess.com/bundles/web/images/color-icons/arena-club.495ffa75.svg" width="15" height="15" alt="Arena" style="vertical-align:middle"></span>`;
    }
    return `<span class="tournament-format-type"><a href="https://chess.com/terms/swiss-chess" target="_blank" rel="noopener noreferrer">Hệ Thụy Sĩ</a>${gap}<span class="tournament-format-detail">${escapeHTML(rounds)} vòng</span><img src="https://chess.com/bundles/web/images/color-icons/tournaments.3a561883.svg" width="15" height="15" alt="Swiss" style="vertical-align:middle"></span>`;
}

/* ============================ Cache ============================ */

/** Cache hai tầng: Map trong bộ nhớ + localStorage (có hạn dùng), tự dọn khi đầy. */
function createCache(prefix) {
    const memory = new Map();
    return {
        get(key) {
            if (memory.has(key)) return memory.get(key);
            try {
                const stored = localStorage.getItem(prefix + key);
                if (stored) {
                    const { val, exp } = JSON.parse(stored);
                    if (Date.now() < exp) {
                        memory.set(key, val);
                        return val;
                    }
                    localStorage.removeItem(prefix + key);
                }
            } catch {
                // Dữ liệu hỏng hoặc storage bị chặn: coi như chưa có cache.
            }
            return null;
        },
        set(key, val, ttlMs) {
            memory.set(key, val);
            try {
                localStorage.setItem(prefix + key, JSON.stringify({ val, exp: Date.now() + ttlMs }));
            } catch (error) {
                if (error.name === 'QuotaExceededError') removeStoredKeys(prefix);
            }
        },
        /** Chỉ lưu trong bộ nhớ (không ghi localStorage). */
        setMemory(key, val) {
            memory.set(key, val);
        },
        /** Xoá các khoá localStorage bắt đầu bằng prefix + keyPrefix (dọn cache phiên bản cũ). */
        removeStored(keyPrefix = '') {
            removeStoredKeys(prefix + keyPrefix);
        }
    };
}

function removeStoredKeys(startsWith) {
    try {
        Object.keys(localStorage)
            .filter(key => key.startsWith(startsWith))
            .forEach(key => localStorage.removeItem(key));
    } catch {
        // localStorage không khả dụng.
    }
}

/* ============================ Request queue ============================ */

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Hàng đợi request: giới hạn đồng thời, gộp request trùng URL đang bay,
 * thử lại một lần (429 chờ 2s, lỗi mạng chờ 1s), trả về null khi thất bại.
 * Nếu có `cache`, kiểm tra cache trước và lưu kết quả với TTL do `getTtl(url)`
 * quyết định (null => chỉ lưu bộ nhớ).
 */
function createRequestManager({ maxConcurrent = MAX_CONCURRENT_REQUESTS, cache = null, getTtl = () => null } = {}) {
    let active = 0;
    const waiting = [];
    const inFlight = new Map();

    async function acquire() {
        if (active < maxConcurrent) {
            active++;
            return;
        }
        await new Promise(resolve => waiting.push(resolve));
    }

    function release() {
        const next = waiting.shift();
        if (next) next();
        else active = Math.max(0, active - 1);
    }

    async function download(url, isJson) {
        await acquire();
        try {
            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    const response = await fetch(url);
                    if (response.status === 429) {
                        await wait(2000);
                        continue;
                    }
                    if (!response.ok) return null;
                    return isJson ? await response.json() : await response.text();
                } catch {
                    if (attempt === 1) return null;
                    await wait(1000);
                }
            }
            return null;
        } finally {
            release();
        }
    }

    async function fetchResource(url, isJson = true) {
        if (cache) {
            const cached = cache.get(url);
            if (cached) return cached;
        }

        const requestKey = `${isJson ? 'json' : 'text'}:${url}`;
        const pending = inFlight.get(requestKey);
        if (pending) return pending;

        const request = (async () => {
            const data = await download(url, isJson);
            if (data !== null && cache) {
                const ttl = getTtl(url);
                if (ttl) cache.set(url, data, ttl);
                else cache.setMemory(url, data);
            }
            return data;
        })();

        inFlight.set(requestKey, request);
        try {
            return await request;
        } finally {
            if (inFlight.get(requestKey) === request) inFlight.delete(requestKey);
        }
    }

    return { fetch: fetchResource };
}

/** Điểm cuối cùng của từng kỳ thủ ở vòng cuối: Map(username lowercase -> points). */
async function fetchFinalPoints(requests, tournamentId, rounds) {
    const pointsMap = new Map();
    if (!(rounds > 0)) return pointsMap;

    const roundData = await requests.fetch(`${CHESS_COM_API}/tournament/${tournamentId}/${rounds}`);
    const groups = roundData?.groups || [];
    const players = groups.length
        ? (await Promise.allSettled(groups.map(url => requests.fetch(url))))
            .filter(result => result.status === 'fulfilled')
            .flatMap(result => result.value?.players || [])
        : (roundData?.players || []);

    players.forEach(player => {
        if (player.username) pointsMap.set(player.username.toLowerCase(), player.points || 0);
    });
    return pointsMap;
}

/* ============================ Avatar ============================ */

/**
 * Tải hồ sơ cho mọi ô kỳ thủ trong `rows` (mỗi username một request), rồi cập
 * nhật avatar + huy hiệu tài khoản. `onProfile({ username, avatar, status, cells })`
 * cho phép trang lưu thêm dữ liệu.
 */
async function hydratePlayerCells(rows, loadProfile, onProfile) {
    const byUsername = new Map();
    rows.forEach(row => {
        row.querySelectorAll('.player-cell[data-player-username]').forEach(cell => {
            const username = cell.dataset.playerUsername?.trim();
            if (!username) return;
            const key = username.toLowerCase();
            if (!byUsername.has(key)) byUsername.set(key, { username, cells: [] });
            byUsername.get(key).cells.push(cell);
        });
    });

    await Promise.allSettled(Array.from(byUsername.values(), async ({ username, cells }) => {
        const profile = await loadProfile(username);
        if (!profile) return;

        const avatar = safeHttpUrl(profile.avatar || DEFAULT_AVATAR, DEFAULT_AVATAR);
        const status = profile.status || 'N/A';
        const badgeHTML = formatAccountBadge(status);
        onProfile?.({ username, avatar, status, cells });

        cells.forEach(cell => {
            const image = cell.querySelector('.cc-avatar-img');
            if (image && profile.avatar) image.src = avatar;
            const statusElement = cell.querySelector('.player-status-badge');
            if (statusElement) statusElement.innerHTML = badgeHTML;
        });
    }));
}

/**
 * Gom các dòng vừa hoàn thành và chỉ bắt đầu tải avatar sau khi chúng đã được
 * vẽ (hai khung hình), thay vì mỗi dòng một cặp requestAnimationFrame.
 */
function createAvatarLoader(loadProfile, onProfile) {
    let pendingRows = null;
    return row => {
        if (pendingRows) {
            pendingRows.add(row);
            return;
        }
        pendingRows = new Set([row]);
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
            const rows = Array.from(pendingRows);
            pendingRows = null;
            hydratePlayerCells(rows, loadProfile, onProfile).catch(error => {
                console.error('Error loading player avatars:', error);
            });
        }));
    };
}

/* ============================ Modal ============================ */

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Modal #scoreModal (layout event.html) có quản lý focus, Esc, bẫy Tab và đóng khi bấm nền. */
function createModalManager() {
    let previousFocus = null;
    let previousOverflow = '';
    let bound = false;

    const getModal = () => document.getElementById('scoreModal');

    function show(title, content) {
        const modal = getModal();
        const titleElement = document.getElementById('modal-player-name');
        const contentElement = document.getElementById('modal-score-breakdown');
        if (!modal || !titleElement || !contentElement) return;

        if (!modal.classList.contains('open')) {
            previousFocus = document.activeElement;
            previousOverflow = document.body.style.overflow;
        }

        titleElement.textContent = title;
        contentElement.innerHTML = content;
        modal.setAttribute('aria-hidden', 'false');
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';

        (modal.querySelector('.cc-modal-close') || modal.querySelector('.cc-modal-dialog'))?.focus({ preventScroll: true });
    }

    function close() {
        const modal = getModal();
        if (!modal?.classList.contains('open')) return;

        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = previousOverflow;

        const focusTarget = previousFocus;
        previousFocus = null;
        if (focusTarget?.isConnected) focusTarget.focus?.({ preventScroll: true });
    }

    function trapFocus(event) {
        const dialog = getModal()?.querySelector('.score-modal-dialog');
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
        } else if (event.shiftKey && active === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function handleKeydown(event) {
        if (!getModal()?.classList.contains('open')) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            close();
        } else if (event.key === 'Tab') {
            trapFocus(event);
        }
    }

    /** Gắn nút đóng, bấm nền và bàn phím (chỉ một lần). */
    function bind() {
        if (bound) return;
        bound = true;
        const modal = getModal();
        modal?.querySelector('.cc-modal-close')?.addEventListener('click', close);
        modal?.addEventListener('click', event => {
            if (event.target === modal) close();
        });
        document.addEventListener('keydown', handleKeydown);
    }

    return { show, close, bind };
}

/* ============================ Giao diện công khai ============================ */

window.TVLTTournamentCommon = Object.freeze({
    CHESS_COM_URL, CHESS_COM_API, GIST_BASE, DEFAULT_AVATAR, TOP_PLAYERS, TTL, VARIANTS,
    escapeHTML, safeHttpUrl, iconHTML, getRankBadge, formatAccountBadge, formatTimeControl,
    formatTimestamp, calculateDuration, parseTimeControl, formatTournamentType,
    createCache, createRequestManager, fetchFinalPoints,
    hydratePlayerCells, createAvatarLoader, createModalManager
});
})();
