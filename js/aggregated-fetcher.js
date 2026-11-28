/**
 * Trang tổng hợp theo tháng (CTTQ): mỗi dòng là một tháng với top 6 kỳ thủ theo
 * tổng điểm của mọi giải trong tháng đó.
 *
 * Luồng chính:
 *  1. Đọc danh sách tháng (và ID giải của từng tháng) từ gist, dựng dòng giữ chỗ cho mỗi tháng.
 *  2. Mỗi tháng tải dữ liệu các giải, cộng điểm theo kỳ thủ rồi thay đúng dòng giữ chỗ của tháng đó.
 *  3. Dữ liệu chi tiết (giải của tháng, thành tích của kỳ thủ) giữ trong bộ nhớ và chỉ tra khi người
 *     dùng bấm; không nhét JSON vào thuộc tính data-* của DOM.
 *
 * Phụ thuộc: tournament-common.js (nạp trước), search-events.js (lọc/sắp xếp bảng).
 */
(() => {
'use strict';

const common = window.TVLTTournamentCommon;
if (!common) {
    console.error('tournament-common.js chưa được nạp; không thể hiển thị bảng tổng hợp.');
    return;
}
const {
    CHESS_COM_URL, CHESS_COM_API, GIST_BASE, DEFAULT_AVATAR, TOP_PLAYERS, TTL, VARIANTS,
    escapeHTML, safeHttpUrl, iconHTML, getRankBadge, formatAccountBadge, formatTimeControl,
    formatTimestamp, calculateDuration, parseTimeControl, formatTournamentType,
    createCache, createRequestManager, fetchFinalPoints, createAvatarLoader, createModalManager
} = common;

const COLUMN_COUNT = 3 + TOP_PLAYERS;
const DEFAULT_EVENT_TYPE = 'cttq';
// Thành tích đã đổi dạng lưu (breakdown chỉ còn { tourId, points }); đổi khoá để bỏ cache cũ.
const AGGREGATE_CACHE_VERSION = 'agg_v4';
const LEGACY_AGGREGATE_CACHE_PREFIXES = ['agg_v3_'];

const cache = createCache('agg_cache_');
const requests = createRequestManager({
    cache,
    getTtl: url => {
        if (!url.startsWith(CHESS_COM_API)) return null; // gist: chỉ giữ trong bộ nhớ
        return url.includes('/player/') ? TTL.PLAYER : TTL.TOURNAMENT;
    }
});
const modal = createModalManager();

const TABLE_HTML = '<div class="table"><table class="styled-table" id="tournament-results-table"><thead><tr><th class="month-in4">Tháng</th><th class="rules">Thống kê</th><th class="players-count">Kỳ thủ</th><th class="winner">🥇 Hạng 1</th><th class="winner">🥈 Hạng 2</th><th class="winner">🥉 Hạng 3</th><th class="winner">🎖️ Hạng 4</th><th class="winner">🏅 Hạng 5</th><th class="winner">⭐ Hạng 6</th></tr></thead><tbody id="tournament-tbody"><tr class="not-match" style="display: none"><td colspan="9" class="table-empty-state">Không tìm thấy kết quả nào phù hợp.</td></tr></tbody></table></div>';

const SKELETON_ROW_HTML = `
    <td><div class="skeleton skeleton-text" style="width: 80%;"></div></td>
    <td><div class="skeleton skeleton-text" style="width: 60%;"></div></td>
    <td><div class="skeleton skeleton-text" style="width: 30px; margin: auto;"></div></td>` +
    `<td>
        <div class="post-user-component">
            <div class="skeleton skeleton-avatar"></div>
            <div class="post-user-details">
                <div class="skeleton skeleton-text" style="width: 70px;"></div>
                <div class="skeleton skeleton-text" style="width: 40px;"></div>
            </div>
        </div>
    </td>`.repeat(TOP_PLAYERS);

/* ============================ Tháng ============================ */

/** "MM-YYYY" -> timestamp đầu tháng (giờ trình duyệt); 0 nếu không hợp lệ. */
function monthStartTimestamp(monthId) {
    const parts = String(monthId).split('-');
    if (parts.length !== 2) return 0;
    const [month, year] = parts.map(Number);
    return Number.isFinite(month) && Number.isFinite(year) ? new Date(year, month - 1, 1).getTime() : 0;
}

/** Định dạng gist: dòng "*MM-YYYY" mở đầu một tháng, các dòng sau là ID giải của tháng đó. */
function parseUnifiedFormat(text) {
    const months = [];
    const tournamentIdsByMonth = new Map();
    let currentMonth = null;

    for (const rawLine of text.split('\n')) {
        const line = rawLine.trim();
        if (!line) continue;
        if (line.startsWith('*')) {
            currentMonth = line.slice(1).trim();
            if (currentMonth) {
                months.push(currentMonth);
                tournamentIdsByMonth.set(currentMonth, []);
            }
        } else if (currentMonth) {
            tournamentIdsByMonth.get(currentMonth).push(line);
        }
    }
    return { months, tournamentIdsByMonth };
}

/* ============================ Dữ liệu ============================ */

function readTournamentMeta(data) {
    const settings = data.settings || {};
    const setup = settings.initial_setup || null;
    const rules = settings.rules || data.rules || 'standard';
    const status = data.status || settings.status || 'unknown';
    const finishTime = data.finish_time || data.endTime || data.finishTime || 0;
    const nowSeconds = Math.floor(Date.now() / 1000);

    return {
        rounds: settings.total_rounds || data.rounds || data.total_rounds || 0,
        variant: (rules === 'standard' || rules === 'chess') && setup ? 'custom' : rules,
        setup,
        timeControl: parseTimeControl(settings.time_control || data.time_control || data.timeControl),
        timeClass: settings.time_class || data.time_class || 'classical',
        registeredCount: Math.max(
            settings.registered_user_count || 0,
            data.players_registered || 0,
            (data.players || []).length
        ),
        startTime: data.start_time || data.startTime || 0,
        endTime: finishTime,
        status,
        isFinished: status === 'finished' || (finishTime > 0 && finishTime <= nowSeconds)
    };
}

/** Gộp danh sách kỳ thủ của giải với bảng điểm vòng cuối (lấy điểm cao hơn khi trùng). */
function buildPlayerList(listedPlayers, pointsMap) {
    const originalNames = new Map();
    for (const player of listedPlayers) {
        const username = typeof player === 'string' ? player : player?.username;
        if (!username) continue;
        const key = username.toLowerCase();
        if (!originalNames.has(key)) originalNames.set(key, username);
    }

    const merged = new Map();
    pointsMap.forEach((points, username) => {
        const key = username.toLowerCase();
        merged.set(key, { username: originalNames.get(key) || key, points });
    });

    for (const player of listedPlayers) {
        const username = typeof player === 'string' ? player : player?.username;
        if (!username) continue;
        const key = username.toLowerCase();
        const points = player.points ?? pointsMap.get(key) ?? 0;
        const existing = merged.get(key);
        if (existing) existing.points = Math.max(existing.points, points);
        else merged.set(key, { username, points });
    }
    return Array.from(merged.values());
}

async function loadTournament(id) {
    const data = await requests.fetch(`${CHESS_COM_API}/tournament/${id}`);
    if (!data) return null;

    const meta = readTournamentMeta(data);
    const pointsMap = await fetchFinalPoints(requests, id, meta.rounds);
    return { id, data, meta, players: buildPlayerList(data.players || [], pointsMap) };
}

/**
 * Tổng hợp một tháng. Kết quả (đã lưu cache) gồm:
 *  - tournaments: các giải của tháng (thông tin hiển thị, lưu một lần cho mỗi giải)
 *  - players: kỳ thủ + tổng điểm + breakdown [{ tourId, points }] (tra thông tin giải qua tourId)
 */
async function getMonthlyAggregation(monthId, eventType, tournamentIdsByMonth) {
    const cacheKey = `${AGGREGATE_CACHE_VERSION}_${eventType}_${monthId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    let tournamentIds;
    if (tournamentIdsByMonth.has(monthId)) {
        tournamentIds = tournamentIdsByMonth.get(monthId);
    } else {
        const text = await requests.fetch(`${GIST_BASE}/${monthId}.txt`, false);
        tournamentIds = text ? text.split('\n').filter(line => line.trim()) : [];
    }
    if (!tournamentIds.length) return { players: [], tournaments: [], status: 'finished' };

    // Mỗi giải tải metadata rồi điểm vòng cuối ngay, không chờ các giải khác.
    const loaded = await Promise.all(tournamentIds.map(loadTournament));

    const playersByKey = new Map();
    const tournaments = [];
    let status = 'finished';

    for (const entry of loaded) {
        if (!entry) continue;
        const { id, data, meta, players } = entry;
        if (!meta.isFinished) status = 'unfinished';

        const duration = calculateDuration(meta.startTime, meta.endTime);
        tournaments.push({
            id,
            name: data.name || 'Unknown',
            url: data.url || `${CHESS_COM_URL}/tournament/${id}`,
            variant: meta.variant,
            setup: meta.setup,
            timeClass: meta.timeClass,
            timeControl: meta.timeControl,
            totalRounds: meta.rounds,
            duration,
            playersCount: meta.registeredCount,
            startTime: meta.startTime,
            format: formatTournamentType(meta.rounds, duration, false),
            status: meta.status,
            isFinished: meta.isFinished
        });

        players.forEach(player => {
            const key = player.username.toLowerCase();
            let record = playersByKey.get(key);
            if (!record) {
                record = { username: player.username, totalPoints: 0, breakdown: [] };
                playersByKey.set(key, record);
            }
            record.totalPoints += player.points;
            record.breakdown.push({ tourId: id, points: player.points });
        });
    }

    const result = { players: Array.from(playersByKey.values()), tournaments, status };
    cache.set(cacheKey, result, TTL.AGGREGATE);
    return result;
}

/* ============================ Dữ liệu hiển thị (tra khi bấm) ============================ */

// monthId -> { tournaments, tournamentsById, players: Map(username lowercase -> record) }
const monthStore = new Map();
// username lowercase -> { finishes: Map(monthId -> thành tích tháng đó) }
const top6History = new Map();

function storeMonth(monthId, aggregation) {
    monthStore.set(monthId, {
        tournaments: aggregation.tournaments,
        tournamentsById: new Map(aggregation.tournaments.map(tour => [tour.id, tour])),
        players: new Map(aggregation.players.map(player => [player.username.toLowerCase(), player]))
    });
}

function recordTop6Finish(monthId, player, rank, totalMonthTours, finishedCount, monthStatus) {
    const key = player.username.toLowerCase();
    let history = top6History.get(key);
    if (!history) {
        history = new Map();
        top6History.set(key, history);
    }
    if (history.has(monthId)) return;
    history.set(monthId, {
        monthId,
        rank,
        totalPoints: player.totalPoints,
        tourCount: player.breakdown.length,
        totalMonthTours: totalMonthTours || player.breakdown.length,
        finishedCount: finishedCount ?? 0,
        monthStatus: monthStatus || 'finished'
    });
}

/* ============================ Dựng giao diện ============================ */

function variantInfo(variant) {
    const config = VARIANTS[variant.toLowerCase()];
    return config ? {
        name: config.name,
        url: `${CHESS_COM_URL}${config.url}`,
        icon: `${CHESS_COM_URL}${config.icon}`
    } : null;
}

const TOUR_STATUS_BADGES = Object.freeze({
    finished: { background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.4)', icon: 'bx bx-check-circle', label: 'Đã hoàn thành' },
    in_progress: { background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: 'rgba(234, 179, 8, 0.4)', icon: 'bx bx-loader-circle bx-spin', label: 'Đang diễn ra' },
    registration: { background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.4)', icon: 'bx bx-user-plus', label: 'Đang đăng ký' },
    scheduled: { background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.4)', icon: 'bx bx-calendar', label: 'Sắp diễn ra' },
    other: { background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: 'rgba(234, 179, 8, 0.4)', icon: 'bx bx-time-five', label: 'Chưa hoàn thành' }
});

function formatTourStatus(status, isFinished) {
    const key = isFinished || status === 'finished' ? 'finished' : (Object.hasOwn(TOUR_STATUS_BADGES, status) ? status : 'other');
    const badge = TOUR_STATUS_BADGES[key];
    return `<span class="user-badges-badge" style="background: ${badge.background}; color: ${badge.color}; border-color: ${badge.border};"><i class="${badge.icon}" style="margin-right: 3px;"></i>${badge.label}</span>`;
}

function renderPlayerCell(player, monthId) {
    if (!player) return '<td style="color: var(--primary-warning)">Chưa có dữ liệu!</td>';

    const safeUsername = escapeHTML(player.username);
    const profileUrl = `${CHESS_COM_URL}/member/${encodeURIComponent(player.username)}`;

    return `<td class="player-cell clickable-player"
                    data-month="${escapeHTML(monthId || '')}"
                    data-player-username="${safeUsername}"
                    data-avatar="${escapeHTML(DEFAULT_AVATAR)}"
                    data-status="N/A"
                    style="cursor: pointer;">
                <div class="post-user-component">
                    <div class="cc-avatar-component post-user-avatar">
                        <img class="cc-avatar-img" src="${escapeHTML(DEFAULT_AVATAR)}" loading="lazy" height="50" width="50" alt="${safeUsername}">
                    </div>
                    <div class="post-user-details">
                        <div class="user-tagline-component">
                            <a class="user-username-component user-tagline-username" href="${profileUrl}" target="_blank" rel="noopener noreferrer">${safeUsername}</a>
                        </div>
                        <div class="post-user-status">
                            <span class="player-status-badge"></span>
                            <span class="score-display" style="font-weight: bold;">${escapeHTML(player.totalPoints)} ĐIỂM</span>
                        </div>
                    </div>
                </div>
            </td>`;
}

function renderMonthRow(monthId, aggregation) {
    const { players, tournaments, status } = aggregation;
    const topPlayers = [...players].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, TOP_PLAYERS);

    const totalCount = tournaments.length;
    const finishedCount = tournaments.filter(tour => tour.isFinished).length;
    topPlayers.forEach((player, index) => {
        recordTop6Finish(monthId, player, index + 1, totalCount, finishedCount, status);
    });

    const safeMonthId = escapeHTML(monthId);
    const allFinished = totalCount > 0 && finishedCount === totalCount;
    const badgeStyle = allFinished
        ? 'background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4);'
        : 'background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4);';
    const badgeIcon = allFinished ? 'bx-check-circle' : 'bx-time-five';
    const statsHTML = `<span style="white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; font-weight: 600;">${totalCount} giải đấu <i class="bx bx-info-circle" style="font-size: 0.85em; opacity: 0.7;"></i></span><div style="margin-top: 4px; white-space: nowrap;"><span class="user-badges-badge" style="${badgeStyle} font-size: 0.82em; padding: 2px 8px; font-weight: 600; display: inline-flex; align-items: center; gap: 3px;"><i class="bx ${badgeIcon}"></i>${finishedCount}/${totalCount} đã hoàn thành</span></div>`;

    let html = `<tr>
                <td class="name-tour month-clickable" data-month="${safeMonthId}">
                    <span style="white-space: nowrap; display: inline-flex; align-items: center; gap: 4px;">Tháng ${safeMonthId} <i class="bx bx-info-circle" style="font-size: 0.85em; opacity: 0.7;"></i></span>
                </td>
                <td class="rules month-clickable" data-month="${safeMonthId}">
                    ${statsHTML}
                </td>
                <td class="players-count">${players.length}</td>`;
    for (let index = 0; index < TOP_PLAYERS; index++) {
        html += renderPlayerCell(topPlayers[index], monthId);
    }
    return html + '</tr>';
}

function createSkeletonRows(months) {
    const fragment = document.createDocumentFragment();
    const rows = months.map((monthId, index) => {
        const row = document.createElement('tr');
        row.className = 'skeleton-row';
        row.setAttribute('data-start-time', String(monthStartTimestamp(monthId)));
        row.setAttribute('data-sort-order', String(index));
        row.innerHTML = SKELETON_ROW_HTML;
        fragment.appendChild(row);
        return row;
    });
    return { rows, fragment };
}

/* ============================ Modal ============================ */

function renderBreakdownRow(item, tour) {
    const variant = VARIANTS[tour.variant?.toLowerCase()] || {};
    const variantIcon = variant.icon ? iconHTML(CHESS_COM_URL + variant.icon) : '';
    const variantName = variant.name || tour.variant || 'N/A';
    return `<tr>
                    <td>
                        <a href="${escapeHTML(safeHttpUrl(tour.url))}" target="_blank" rel="noopener noreferrer" style="color: var(--cyan-300); text-decoration: none; font-weight: 500;">
                            ${escapeHTML(tour.name)}
                        </a>
                        <div style="font-size: 0.85em; color: var(--neutral-300); margin-top: 3px;">
                            ${formatTimestamp(tour.startTime, ':')}
                        </div>
                    </td>
                    <td style="text-align: center; font-size: 0.9em;">
                        <div>${formatTimeControl(tour.timeControl, tour.timeClass)}</div>
                        <div style="margin-top: 4px;">${escapeHTML(variantName)} ${variantIcon}</div>
                        <div>${tour.format}</div>
                    </td>
                    <td style="text-align: center; color: var(--green-400); font-weight: bold; font-size: 1.05em;">
                        ${escapeHTML(item.points)}
                    </td>
                </tr>`;
}

function renderTop6History(username) {
    const history = top6History.get(username.toLowerCase());
    if (!history || !history.size) return '';

    const finishes = [...history.values()].sort((a, b) => monthStartTimestamp(b.monthId) - monthStartTimestamp(a.monthId));
    const rows = finishes.map(finish => {
        const unfinished = finish.finishedCount < finish.totalMonthTours || finish.monthStatus === 'unfinished';
        const note = unfinished
            ? '<div style="font-size: 0.8em; color: var(--yellow-400, #f59e0b); font-weight: 500; margin-top: 2px;">(Chưa hoàn thành)</div>'
            : '';
        return `<tr>
                        <td style="font-weight: 600; color: var(--neutral-100);">
                            Tháng ${escapeHTML(finish.monthId)}
                            ${note}
                        </td>
                        <td style="text-align: center; font-weight: 600; font-size: 0.95em;">${getRankBadge(finish.rank)}</td>
                        <td style="text-align: center; color: var(--neutral-300);">${finish.tourCount}/${finish.totalMonthTours} giải</td>
                        <td style="text-align: center; color: var(--yellow-400); font-weight: bold; font-size: 1.05em;">${escapeHTML(finish.totalPoints)} ĐIỂM</td>
                    </tr>`;
    }).join('');

    return `<div style="margin-top: 25px;">
                    <h4 style="color: var(--yellow-400); margin: 0 0 10px 0; font-size: 1.05em; display: flex; align-items: center; gap: 6px;">
                        <i class="bx bx-trophy"></i> Lịch sử lọt top 6 (${finishes.length} tháng)
                    </h4>
                    <table class="styled-table score-detail-table" style="width: 100%;">
                        <thead>
                            <tr>
                                <th>Tháng tổ chức</th>
                                <th style="text-align: center;">Thành tích</th>
                                <th style="text-align: center;">Số giải đã chơi</th>
                                <th style="text-align: center;">Tổng điểm</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody></table></div>`;
}

function showPlayerModal(cell) {
    const monthId = cell.dataset.month;
    const username = cell.dataset.playerUsername;
    const month = monthStore.get(monthId);
    const player = month?.players.get(username.toLowerCase());
    if (!player) return;

    const safeUsername = escapeHTML(player.username);
    const safeAvatar = escapeHTML(safeHttpUrl(cell.dataset.avatar, DEFAULT_AVATAR));
    const profileUrl = `${CHESS_COM_URL}/member/${encodeURIComponent(player.username)}`;
    const badgeHTML = formatAccountBadge(cell.dataset.status);

    const rows = player.breakdown
        .map(item => ({ item, tour: month.tournamentsById.get(item.tourId) }))
        .filter(({ tour }) => tour)
        .map(({ item, tour }) => renderBreakdownRow(item, tour))
        .join('');

    const html = `<div class="calendar-wrapper">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${safeAvatar}" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 10px; border: 2px solid var(--cyan-300);" alt="${safeUsername}">
                    <h3 style="margin: 10px 0 5px 0;"><a href="${profileUrl}" target="_blank" rel="noopener noreferrer">${safeUsername}</a></h3>
                    ${badgeHTML ? `<div style="margin-top: 5px;">${badgeHTML}</div>` : ''}
                </div>

                <div style="margin-bottom: 25px;">
                    <h4 style="color: var(--cyan-300); margin: 0 0 10px 0; font-size: 1.05em; display: flex; align-items: center; gap: 6px;">
                        <i class="bx bx-calendar"></i> Tổng kết Tháng ${escapeHTML(monthId || '')}
                    </h4>
                    <table class="styled-table score-detail-table" style="width: 100%;">
                        <thead><tr><th>Giải đấu</th><th style="text-align: center;">Thể lệ</th><th style="text-align: center;">Điểm</th></tr></thead>
                        <tbody>${rows}</tbody>
                <tfoot>
                    <tr style="border-top: 2px solid var(--cyan-300); background-color: rgba(0, 255, 255, 0.05);">
                        <td style="font-weight: bold; color: var(--cyan-300);">TỔNG CỘNG THÁNG</td>
                        <td style="text-align: center; color: var(--blue-400);">${player.breakdown.length} giải</td>
                        <td style="text-align: center; color: var(--yellow-400); font-weight: bold; font-size: 1.15em;">
                            ${escapeHTML(player.totalPoints)}
                        </td>
                    </tr>
                </tfoot>
                </table>
                </div>${renderTop6History(player.username)}</div>`;

    modal.show(`Tổng kết kỳ thủ ${player.username}`, html);
}

function showMonthModal(monthId) {
    const month = monthStore.get(monthId);
    if (!month) return;

    const rows = month.tournaments.map(tour => {
        const info = variantInfo(tour.variant);
        let variantHTML = '';
        if (info) {
            variantHTML = tour.setup
                ? ` <a href="#" class="custom-variant-link" data-setup="${escapeHTML(tour.setup)}">${escapeHTML(info.name)}${iconHTML(info.icon)}</a>`
                : ` <a href="${escapeHTML(safeHttpUrl(info.url))}" target="_blank" rel="noopener noreferrer">${escapeHTML(info.name)} ${iconHTML(info.icon)}</a>`;
        }
        return `<tr>
                    <td>
                        <a href="${escapeHTML(safeHttpUrl(tour.url))}" target="_blank" rel="noopener noreferrer">${escapeHTML(tour.name)}</a>
                        <div style="margin-top: 4px;">${formatTourStatus(tour.status, tour.isFinished)}</div>
                    </td>
                    <td>${formatTimestamp(tour.startTime, ':')}</td>
                    <td>${formatTimeControl(tour.timeControl, tour.timeClass)}<br>${variantHTML}<br>${tour.format}</td>
                    <td style="text-align: center;">${tour.playersCount}</td>
                </tr>`;
    }).join('');

    modal.show(`Chi tiết tháng ${monthId}`, `<div class="calendar-wrapper">
                <table class="styled-table score-detail-table">
                    <thead><tr><th>Vòng đấu</th><th>Thời gian bắt đầu</th><th>Thể lệ</th><th style="text-align: center;">Kỳ thủ</th></tr></thead>
                    <tbody>${rows}</tbody></table></div>`);
}

function showCustomVariantModal(setup) {
    modal.show('Thế cờ ban đầu', `<div class="calendar-wrapper" style="padding: 20px; color: var(--neutral-100); word-break: break-all;">${escapeHTML(setup)}</div>`);
}

/* ============================ Trang ============================ */

const searchTable = () => window.searchTable?.();

function bindInteractions(tbody) {
    modal.bind();
    // Link "thế cờ tuỳ chỉnh" nằm trong nội dung modal chi tiết tháng.
    document.getElementById('scoreModal')?.addEventListener('click', event => {
        const link = event.target.closest('.custom-variant-link');
        if (!link) return;
        event.preventDefault();
        showCustomVariantModal(link.dataset.setup);
    });

    tbody.addEventListener('click', event => {
        const playerCell = event.target.closest('.clickable-player');
        if (playerCell) {
            showPlayerModal(playerCell);
            return;
        }
        const monthCell = event.target.closest('.month-clickable');
        if (monthCell) showMonthModal(monthCell.dataset.month);
    });
}

async function loadMonths(months, eventType, tournamentIdsByMonth) {
    const tbody = document.getElementById('tournament-tbody');
    const { rows: placeholders, fragment } = createSkeletonRows(months);
    tbody.appendChild(fragment);

    // Ngày của từng tháng đã biết trước nên có thể sắp xếp ngay.
    window.sortTournamentRows?.();

    const loadAvatars = createAvatarLoader(
        username => requests.fetch(`${CHESS_COM_API}/player/${encodeURIComponent(username)}`),
        ({ avatar, status, cells }) => {
            cells.forEach(cell => {
                cell.dataset.avatar = avatar;
                cell.dataset.status = status;
            });
        }
    );

    let successCount = 0;
    await Promise.allSettled(months.map(async (monthId, index) => {
        try {
            const aggregation = await getMonthlyAggregation(monthId, eventType, tournamentIdsByMonth);
            storeMonth(monthId, aggregation);

            const template = document.createElement('tbody');
            template.innerHTML = renderMonthRow(monthId, aggregation);
            const row = template.firstElementChild;

            row.setAttribute('data-start-time', monthStartTimestamp(monthId));
            row.setAttribute('data-sort-order', String(index));
            row.setAttribute('data-players-count', aggregation.players.length);
            row.setAttribute('data-tours-count', aggregation.tournaments.length);
            row.setAttribute('data-status', aggregation.status || 'finished');
            row.classList.add('results-row-enter');
            placeholders[index].replaceWith(row);

            successCount++;
            const counter = document.getElementById('current-tournament');
            if (counter) counter.textContent = `${successCount}/${months.length}`;
            searchTable();
            loadAvatars(row);
        } catch (error) {
            console.error('Error loading month:', monthId, error);

            // Tháng lỗi không còn là skeleton vô hạn hay khoá sắp xếp chưa biết.
            const row = placeholders[index];
            row.setAttribute('data-players-count', '0');
            row.setAttribute('data-tours-count', '0');
            row.classList.remove('skeleton-row');
            row.classList.add('results-row-error');
            row.innerHTML = `<td colspan="${COLUMN_COUNT}" class="table-empty-state">Không thể tải dữ liệu tháng ${escapeHTML(monthId)}.</td>`;
            searchTable();
        }
    }));
    searchTable();

    const icon = document.getElementById('statusIcon');
    if (icon) {
        const allLoaded = successCount === months.length;
        icon.style.color = allLoaded ? 'var(--primary-success)' : 'var(--color-danger)';
        icon.className = allLoaded ? 'bx bx-check' : 'bx bx-x';
    }
}

async function init() {
    const container = document.querySelector('[data-fetch-aggregated]');
    if (!container) return;

    const eventType = container.dataset.fetchAggregated || DEFAULT_EVENT_TYPE;
    container.innerHTML = '<div class="loading">Đang xử lý dữ liệu...</div>';

    // Bỏ cache tổng hợp của phiên bản cũ (khoá không còn được đọc nên sẽ không tự hết hạn).
    LEGACY_AGGREGATE_CACHE_PREFIXES.forEach(prefix => cache.removeStored(prefix));

    let text = await requests.fetch(`${GIST_BASE}/${eventType}.txt`, false);
    if (!text) text = await requests.fetch(`${GIST_BASE}/${eventType}`, false);

    let months = [];
    let tournamentIdsByMonth = new Map();
    if (text?.includes('*')) {
        ({ months, tournamentIdsByMonth } = parseUnifiedFormat(text));
    } else if (text) {
        months = text.split('\n').map(line => line.trim()).filter(Boolean);
    }
    if (!months.length) {
        container.innerHTML = '<div class="error">Không tìm thấy dữ liệu.</div>';
        return;
    }

    container.innerHTML = TABLE_HTML;
    window.loadTournamentFiltersFromURL?.();
    bindInteractions(document.getElementById('tournament-tbody'));
    loadMonths(months, eventType, tournamentIdsByMonth);
}

if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', init);
else init();
})();
