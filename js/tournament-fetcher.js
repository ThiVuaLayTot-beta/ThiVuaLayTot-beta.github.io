/**
 * Trang kết quả từng giải (tvlt / cbtt / dttv): đọc danh sách ID giải từ gist,
 * lấy dữ liệu từ API chess.com và điền dần vào bảng.
 *
 * Luồng chính:
 *  1. Dựng bảng với một dòng giữ chỗ (skeleton) cho mỗi giải.
 *  2. Tải metadata của mọi giải để gắn khoá sắp xếp/lọc cho dòng giữ chỗ, rồi sắp xếp một lần.
 *  3. Mỗi giải tải bảng điểm cuối và thay đúng dòng giữ chỗ của nó; avatar tải sau khi dòng đã được vẽ.
 *
 * Phụ thuộc: tournament-common.js (nạp trước), search-events.js (lọc/sắp xếp bảng).
 */
(() => {
'use strict';

const common = window.TVLTTournamentCommon;
if (!common) {
    console.error('tournament-common.js chưa được nạp; không thể hiển thị bảng giải đấu.');
    return;
}
const {
    CHESS_COM_URL, CHESS_COM_API, GIST_BASE, DEFAULT_AVATAR, TOP_PLAYERS, TTL, VARIANTS,
    escapeHTML, safeHttpUrl, iconHTML, getRankBadge, formatAccountBadge, formatTimeControl,
    formatTimestamp, calculateDuration, parseTimeControl, formatTournamentType,
    createCache, createRequestManager, fetchFinalPoints, createAvatarLoader, createModalManager
} = common;

const COLUMN_COUNT = 4 + TOP_PLAYERS;

/** Tên đăng nhập có nhiều tài khoản/biệt danh -> tên hiển thị thống nhất. */
const SPECIAL_PLAYERS = new Map([
    ['m_dinhhoangviet', 'M-DinhHoangViet'],
    ['tungjohn_playing_chess', 'M-DinhHoangViet'],
    ['thangthukquantrong', 'thangthukquantrong'],
    ['manh_duy', 'ManhDuy19']
]);

const TABLE_HTML = '<div class="table"><table class="styled-table" id="tournament-results-table"><thead><tr><th class="name-tour">Giải đấu</th><th class="organization-day">Thời gian bắt đầu</th><th class="rules">Thể lệ</th><th class="players-count">Kỳ thủ</th><th class="winner">🥇 Hạng 1</th><th class="winner">🥈 Hạng 2</th><th class="winner">🥉 Hạng 3</th><th class="winner">🎖️ Hạng 4</th><th class="winner">🏅 Hạng 5</th><th class="winner">⭐ Hạng 6</th></tr></thead><tbody id="tournament-tbody"><tr class="not-match" style="display:none"><td colspan="10" class="table-empty-state">Không tìm thấy kết quả nào phù hợp.</td></tr></tbody></table></div><br><br><hr>';

const SKELETON_ROW_HTML = `
    <td><div class="skeleton skeleton-text" style="width: 80%;"></div></td>
    <td><div class="skeleton skeleton-text" style="width: 70%;"></div></td>
    <td><div class="skeleton skeleton-text" style="width: 90%;"></div></td>
    <td><div class="skeleton skeleton-text" style="width: 30px; margin: auto;"></div></td>` +
    `<td><div class="post-user-component"><div class="skeleton skeleton-avatar"></div>
                    <div class="post-user-details"><div class="skeleton skeleton-text" style="width: 70px;"></div>
                    <div class="skeleton skeleton-text" style="width: 40px;"></div></div></div></td>`.repeat(TOP_PLAYERS);

const cache = createCache('tvlt_');
const requests = createRequestManager();
const modal = createModalManager();

/* ============================ Dữ liệu kỳ thủ (cho modal) ============================ */

// username (lowercase) -> { avatar, status, breakdown[], tourIds:Set }
const playerStore = new Map();

function getPlayerEntry(username) {
    const key = username.toLowerCase();
    let entry = playerStore.get(key);
    if (!entry) {
        entry = { avatar: DEFAULT_AVATAR, status: 'N/A', breakdown: [], tourIds: new Set() };
        playerStore.set(key, entry);
    }
    return entry;
}

/** Thêm thành tích của một giải (bỏ qua nếu giải đó đã có). */
function addPlayerResult(username, result) {
    const entry = getPlayerEntry(username);
    if (entry.tourIds.has(result.tourId)) return;
    entry.tourIds.add(result.tourId);
    entry.breakdown.push(result);
}

function setPlayerProfile(username, avatar, status) {
    const entry = getPlayerEntry(username);
    entry.avatar = avatar || entry.avatar;
    entry.status = status || entry.status;
}

/* ============================ Modal nội dung ============================ */

function showPlayerModal(username) {
    const entry = playerStore.get(username.toLowerCase());
    if (!entry) {
        modal.show(username, `<div class="calendar-wrapper" style="padding: 20px;">
                    <div style="text-align: center;">
                        <p>Đang tải dữ liệu...</p>
                    </div>
                </div>`);
        return;
    }

    const safeUsername = escapeHTML(username);
    const safeAvatar = escapeHTML(safeHttpUrl(entry.avatar, DEFAULT_AVATAR));
    const profileUrl = `${CHESS_COM_URL}/member/${encodeURIComponent(username)}`;
    const badgeHTML = formatAccountBadge(entry.status);

    const rows = entry.breakdown.map(item => {
        const variant = VARIANTS[item.variant?.toLowerCase()] || {};
        const variantIcon = variant.icon ? iconHTML(CHESS_COM_URL + variant.icon) : '';
        const variantName = variant.name || item.variant || 'N/A';
        return `<tr>
                    <td>
                        <a href="${escapeHTML(safeHttpUrl(item.url))}" target="_blank" rel="noopener noreferrer" style="color: var(--cyan-300); text-decoration: none; font-weight: 500;">
                            ${escapeHTML(item.tourName)}
                        </a>
                        <div style="font-size: 0.85em; color: var(--neutral-300); margin-top: 3px;">
                            ${formatTimestamp(item.startTime)}
                        </div>
                    </td>
                    <td style="text-align: center; font-weight: 600; font-size: 0.95em;">
                        ${getRankBadge(item.rank)}
                    </td>
                    <td style="text-align: center; font-size: 0.9em;">
                        <div><span class="tournament-format-tc">${formatTimeControl(item.timeControl, item.timeClass)}</span></div>
                        <div>${escapeHTML(variantName)} ${variantIcon}</div>
                        <div>${escapeHTML(item.format)}</div>
                    </td>
                    <td style="text-align: center; color: var(--green-400); font-weight: bold; font-size: 1.05em;">
                        ${escapeHTML(item.points)}
                    </td>
                </tr>`;
    }).join('');

    const html = `<div class="calendar-wrapper">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${safeAvatar}" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 10px; border: 2px solid var(--cyan-300);" alt="${safeUsername}">
                    <h3 style="margin: 10px 0 5px 0;"><a href="${profileUrl}" target="_blank" rel="noopener noreferrer">${safeUsername}</a></h3>
                    ${badgeHTML ? `<div style="margin-top: 5px;">${badgeHTML}</div>` : ''}
                </div>

                <div class="score-detail-table-scroll">
                    <table class="styled-table score-detail-table">
                    <thead>
                        <tr>
                            <th>Giải Đấu</th>
                            <th style="text-align: center;">Thành tích</th>
                            <th style="text-align: center;">Thể lệ</th>
                            <th style="text-align: center;">Điểm</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>`;

    modal.show(`Lịch sử lọt top 6 của ${username}`, html);
}

function showCustomVariantModal(setup) {
    modal.show('Thế cờ ban đầu', `<div class="calendar-wrapper" style="padding: 20px; color: var(--neutral-100); word-break: break-all;">Xem thế cờ: <a href="https://lichess.org/analysis/${encodeURIComponent(setup)}" target="_blank" rel="noopener noreferrer">${escapeHTML(setup)}</a></div>`);
}

/* ============================ Tải dữ liệu ============================ */

async function getTournament(id) {
    const key = `t_${id}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const data = await requests.fetch(`${CHESS_COM_API}/tournament/${id}`);
    if (data) {
        const finished = data.status === 'finished' || data.tournament?.status === 'finished';
        cache.set(key, data, finished ? TTL.FINISHED_TOURNAMENT : TTL.TOURNAMENT);
    }
    return data;
}

async function getPlayerProfile(username) {
    const key = `p_${username}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const data = await requests.fetch(`${CHESS_COM_API}/player/${username}`);
    if (data) cache.set(key, data, TTL.PLAYER);
    return data;
}

/** Các trường cần dùng của dữ liệu API, tính một lần cho mỗi giải. */
function readTournamentMeta(data) {
    const settings = data.settings || {};
    const setup = settings.initial_setup || null;
    let variant = settings.rules || data.rules || 'standard';
    if ((variant === 'standard' || variant === 'chess') && setup) variant = 'custom';

    return {
        rounds: settings.total_rounds || data.rounds || data.total_rounds || 0,
        variant,
        setup,
        startTime: data.start_time || data.startTime || 0,
        endTime: data.finish_time || data.endTime,
        playersCount: settings.registered_user_count || data.players_registered || data.players?.length || 0,
        timeClass: settings.time_class || data.time_class || 'classical',
        timeControl: parseTimeControl(settings.time_control || data.time_control || data.timeControl)
    };
}

/** Top kỳ thủ: xếp theo hạng (nếu có) rồi theo điểm. */
function pickTopPlayers(data, pointsMap) {
    return (data.players || [])
        .map(player => {
            const username = typeof player === 'string' ? player : player.username;
            if (!username) return null;
            return {
                username,
                points: player.points ?? pointsMap.get(username.toLowerCase()) ?? 0,
                rank: player.rank || player.place_finish
            };
        })
        .filter(Boolean)
        .sort((a, b) => (a.rank || Infinity) - (b.rank || Infinity) || b.points - a.points)
        .slice(0, TOP_PLAYERS);
}

/* ============================ Dựng dòng ============================ */

function formatVariantLink(variant, setup) {
    const config = VARIANTS[variant.toLowerCase()] || { name: variant, url: '/terms', icon: '/bundles/web/images/icons/smileys/2x/board.png' };
    const icon = iconHTML(CHESS_COM_URL + config.icon);
    if (setup) {
        return `<br><a href="#" class="custom-variant-link" data-setup="${escapeHTML(setup)}">${escapeHTML(config.name)} ${icon}</a><br>`;
    }
    return `<br><a href="${escapeHTML(safeHttpUrl(CHESS_COM_URL + config.url))}" target="_blank" rel="noopener noreferrer">${escapeHTML(config.name)} ${icon}</a><br>`;
}

function renderPlayerCell(username, points, tour, rank) {
    if (!username) return '<td style="color:var(--primary-warning)">Giải chưa kết thúc!</td>';

    const displayName = SPECIAL_PLAYERS.get(username.toLowerCase()) || username;
    // Lưu thành tích ngay; hồ sơ/avatar chỉ được tải sau khi dòng đã hiển thị.
    addPlayerResult(displayName, { ...tour, points, rank: rank || 0 });

    const safeUsername = escapeHTML(displayName);
    const profileUrl = `${CHESS_COM_URL}/member/${encodeURIComponent(displayName)}`;

    return `<td class="player-cell clickable-player" data-username="${safeUsername}" data-player-username="${safeUsername}" data-points="${escapeHTML(points)}" style="cursor: pointer;">
            <div class="post-user-component">
                <div class="cc-avatar-component post-user-avatar">
                    <img class="cc-avatar-img" src="${DEFAULT_AVATAR}" loading="lazy" height="50" width="50" alt="${safeUsername}">
                </div>
                <div class="post-user-details">
                    <div class="user-tagline-component">
                        <a class="user-username-component user-tagline-username" href="${profileUrl}" target="_blank" rel="noopener noreferrer">${safeUsername}</a>
                    </div>
                    <div class="post-user-status">
                        <span class="player-status-badge"></span>
                        <span class="score-display" style="font-weight: bold;">${escapeHTML(points)} ĐIỂM</span>
                    </div>
                </div>
            </div>
        </td>`;
}

/** Nội dung các ô của một giải đã hoàn thành. */
function renderTournamentCells(id, data, meta, topPlayers) {
    const duration = meta.rounds === 1 ? calculateDuration(meta.startTime, meta.endTime) : '';
    const tour = {
        tourId: id,
        tourName: data.name || 'Unknown',
        url: data.url || `${CHESS_COM_URL}/tournament/${id}`,
        variant: meta.variant,
        timeControl: meta.timeControl,
        timeClass: meta.timeClass,
        playersCount: meta.playersCount,
        startTime: meta.startTime,
        format: meta.rounds === 1 ? `Đấu trường Arena ${duration}` : `Hệ Thụy Sĩ ${meta.rounds} vòng`
    };

    const tournamentUrl = escapeHTML(safeHttpUrl(data.url, `${CHESS_COM_URL}/tournament/${encodeURIComponent(id)}`));
    let html = `<td><a href="${tournamentUrl}" target="_blank" rel="noopener noreferrer">${escapeHTML(tour.tourName)}</a></td>
                    <td>${formatTimestamp(meta.startTime)}</td>
                    <td><span class="tournament-format-tc">${formatTimeControl(meta.timeControl, meta.timeClass)}</span>${formatVariantLink(meta.variant, meta.setup)}${formatTournamentType(meta.rounds, duration, true)}</td>
                    <td class="players-count">${meta.playersCount}</td>`;

    for (let rank = 0; rank < TOP_PLAYERS; rank++) {
        const player = topPlayers[rank];
        html += renderPlayerCell(player?.username, player?.points || 0, tour, rank + 1);
    }
    return html;
}

function createSkeletonRows(count) {
    const fragment = document.createDocumentFragment();
    const rows = Array.from({ length: count }, (_, index) => {
        const row = document.createElement('tr');
        row.className = 'skeleton-row';
        row.innerHTML = SKELETON_ROW_HTML;
        row.setAttribute('data-sort-order', String(index));
        fragment.appendChild(row);
        return row;
    });
    return { rows, fragment };
}

function markRowFailed(row, id) {
    row.className = 'results-row-error';
    row.innerHTML = `<td colspan="${COLUMN_COUNT}" class="table-empty-state">Không thể tải giải đấu ${escapeHTML(id)}.</td>`;
}

const searchTable = () => window.searchTable?.();

/* ============================ Khởi tạo trang ============================ */

async function init(type = 'tvlt', containerId = 'tournament-table') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="loading">Đang xử lý dữ liệu...</div>';

    const text = await requests.fetch(`${GIST_BASE}/${type}.txt`, false);
    const ids = text ? text.split('\n').map(id => id.trim()).filter(Boolean) : [];
    if (!ids.length) {
        container.innerHTML = '<div class="error">Không tìm thấy giải đấu.</div>';
        return;
    }

    container.innerHTML = TABLE_HTML;
    window.loadTournamentFiltersFromURL?.();

    const tbody = document.getElementById('tournament-tbody');
    const currentTournament = document.getElementById('current-tournament');
    const { rows: placeholders, fragment } = createSkeletonRows(ids.length);
    tbody.appendChild(fragment);

    // Gắn tương tác trước khi có dòng đầu tiên để kết quả đến sớm dùng được ngay.
    modal.bind();
    tbody.addEventListener('click', event => {
        const playerCell = event.target.closest('.clickable-player');
        if (playerCell) {
            showPlayerModal(playerCell.dataset.username);
            return;
        }
        const variantLink = event.target.closest('.custom-variant-link');
        if (variantLink) {
            event.preventDefault();
            showCustomVariantModal(variantLink.dataset.setup);
        }
    });

    const loadAvatars = createAvatarLoader(getPlayerProfile, ({ username, avatar, status }) => {
        setPlayerProfile(username, avatar, status);
    });

    // Bước 1: metadata của mọi giải, để gắn khoá sắp xếp/lọc cho dòng giữ chỗ.
    const metadataResults = await Promise.allSettled(ids.map(id => getTournament(id)));

    // Dòng nào chưa biết khoá thì có vị trí dự phòng ở cuối.
    placeholders.forEach(row => {
        row.setAttribute('data-start-time', '0');
        row.setAttribute('data-players-count', '0');
        row.setAttribute('data-tours-count', '0');
    });

    const tournaments = [];
    metadataResults.forEach((result, index) => {
        const placeholder = placeholders[index];
        if (result.status !== 'fulfilled' || !result.value) {
            markRowFailed(placeholder, ids[index]);
            return;
        }

        const data = result.value;
        const meta = readTournamentMeta(data);
        placeholder.setAttribute('data-start-time', String(meta.startTime));
        placeholder.setAttribute('data-players-count', String(meta.playersCount));
        placeholder.setAttribute('data-time-class', meta.timeClass);
        placeholder.setAttribute('data-variant', String(meta.variant).toLowerCase());
        placeholder.setAttribute('data-format', meta.rounds === 1 ? 'arena' : 'swiss');
        tournaments.push({ id: ids[index], index, data, meta });
    });

    // Sắp xếp mọi vị trí một lần khi chúng vẫn còn là dòng giữ chỗ.
    window.sortTournamentRows?.();
    searchTable();

    // Bước 2: mỗi giải độc lập; giải chậm không chặn các giải khác thay dòng của mình.
    let successCount = 0;
    const processTournament = async ({ id, index, data, meta }) => {
        try {
            const pointsMap = await fetchFinalPoints(requests, id, meta.rounds);
            const row = placeholders[index];
            row.innerHTML = renderTournamentCells(id, data, meta, pickTopPlayers(data, pointsMap));
            row.setAttribute('data-start-time', meta.startTime);
            row.setAttribute('data-players-count', meta.playersCount);
            row.setAttribute('data-time-class', meta.timeClass);
            row.setAttribute('data-variant', meta.variant.toLowerCase());
            row.setAttribute('data-format', meta.rounds === 1 ? 'arena' : 'swiss');
            row.className = 'results-row-enter';

            successCount++;
            if (currentTournament) currentTournament.textContent = `${successCount}/${ids.length}`;
            searchTable();
            loadAvatars(row);
        } catch (error) {
            console.error('Error processing tournament:', id, error);
            markRowFailed(placeholders[index], id);
        }
    };

    await Promise.allSettled(tournaments.map(processTournament));
    searchTable();

    const icon = document.getElementById('statusIcon');
    if (icon) {
        const allLoaded = successCount === ids.length;
        icon.style.color = allLoaded ? 'var(--primary-success)' : 'var(--color-danger)';
        icon.className = allLoaded ? 'bx bx-check' : 'bx bx-x';
    }
}

function initAll() {
    document.querySelectorAll('[data-fetch-tournament]').forEach(container => {
        init(container.dataset.fetchTournament, container.id);
    });
}

if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', initAll);
else initAll();
})();
