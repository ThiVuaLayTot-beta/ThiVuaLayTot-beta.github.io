
(function() {
    const CONFIG = {
        CHESS_COM_BASE: 'https://api.chess.com/pub',
        CHESS_COM_URL: 'https://www.chess.com',
        GIST_BASE: 'https://gist.githubusercontent.com/M-DinhHoangViet/9c53a11fca709a656076bf6de7c118b0/raw',
        MAX_PLAYERS: 6,
        MAX_CONCURRENT: 10,
        CACHE_PREFIX: 'tvlt_',
        CACHE_TTL: { p: 604800000, t: 86400000, f: 2592000000 },
        DEFAULT_AVATAR: 'https://www.chess.com/bundles/web/images/user-image.007dad08.svg'
    };

    const SPECIAL_PLAYERS = new Map([
        ['m_dinhhoangviet', 'M-DinhHoangViet'],
        ['tungjohn_playing_chess', 'M-DinhHoangViet'],
        ['thangthukquantrong', 'thangthukquantrong'],
        ['manh_duy', 'ManhDuy19']
    ]);

    const VARIANTS = {
        'chess': { name: 'Cờ tiêu chuẩn', url: '/terms/chess', icon: '/bundles/web/images/icons/smileys/2x/board.png' },
        'standard': { name: 'Cờ tiêu chuẩn', url: '/terms/chess', icon: '/bundles/web/images/icons/smileys/2x/board.png' },
        'chess960': { name: 'Chess960', url: '/terms/chess960', icon: '/bundles/web/images/variants/live_960_orange.svg' },
        'kingofthehill': { name: 'KOTH', url: '/terms/king-of-the-hill', icon: '/bundles/web/images/variants/koth.svg' },
        'crazyhouse': { name: 'Crazyhouse', url: '/terms/crazyhouse-chess', icon: '/bundles/web/images/variants/crazyhouse.svg' },
        'bughouse': { name: 'Bughouse', url: '/terms/bughouse-chess', icon: '/bundles/web/images/variants/bughouse.svg' },
        'threecheck': { name: '3 Chiếu', url: '/terms/3-check-chess', icon: '/bundles/web/images/variants/3check.svg' },
        'custom': { name: 'Custom', url: '/terms/chess-variants', icon: '/bundles/web/images/icons/smileys/2x/themes.png' }
    };

    const TIME_ICONS = {
        'lightning': { name: 'Bullet', p: '/bundles/web/images/icons/smileys/2x/bullet.png' },
        'bullet': { name: 'Bullet', p: '/bundles/web/images/icons/smileys/2x/bullet.png' },
        'blitz': { name: 'Blitz', p: '/bundles/web/images/icons/smileys/2x/blitz.png' },
        'rapid': { name: 'Rapid', p: '/bundles/web/images/icons/smileys/2x/live.png' },
        'standard': { name: 'Rapid', p: '/bundles/web/images/icons/smileys/2x/live.png' }
    };

    const BADGE_CONFIG = {
        'closed:abuse': { c: 'user-badges-closed', i: 'bx bx-dislike', t: 'Bị khóa: Lạm dụng' },
        'closed:fair_play_violations': { c: 'user-badges-closed', i: 'bx bx-block', t: 'Bị khóa: Fair Play' },
        'closed': { c: 'user-badges-inactive', i: 'bx bx-no-signal', t: 'Đã khóa' },
    };

    function getRankBadge(rank) {
        const badges = {
            1: '🥇 Hạng 1',
            2: '🥈 Hạng 2',
            3: '🥉 Hạng 3',
            4: '🎖️ Hạng 4',
            5: '🏅 Hạng 5',
            6: '⭐ Hạng 6'
        };
        return badges[rank] || (rank ? `Hạng ${escapeHTML(rank)}` : 'N/A');
    }

    // ========== Utility Functions ==========
    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[character]);
    }

    function safeHttpUrl(value, fallback = '#') {
        try {
            const url = new URL(String(value ?? ''), window.location.origin);
            return ['http:', 'https:'].includes(url.protocol) ? url.href : fallback;
        } catch {
            return fallback;
        }
    }

    function createImg(src, w = 15) {
        return `<img src="${escapeHTML(safeHttpUrl(src))}" width="${w}" height="${w}" alt="" style="vertical-align:middle">`;
    }

    function formatVariantLink(variant, setup) {
        const config = VARIANTS[variant.toLowerCase()] || { name: variant, url: '/terms', icon: '/bundles/web/images/icons/smileys/2x/board.png' };
        const url = CONFIG.CHESS_COM_URL + config.url;
        const img = createImg(CONFIG.CHESS_COM_URL + config.icon);
        
        if (setup) {
            return `<br><a href="#" class="custom-variant-link" data-setup="${escapeHTML(setup)}">${escapeHTML(config.name)} ${img}</a><br>`;
        }
        return `<br><a href="${escapeHTML(safeHttpUrl(url))}" target="_blank" rel="noopener noreferrer">${escapeHTML(config.name)} ${img}</a><br>`;
    }

    function formatTimeControl(tc, timeClass) {
        const icon = TIME_ICONS[timeClass];
        const iconHtml = icon ? createImg(CONFIG.CHESS_COM_URL + icon.p) : '';
        return `<span class="tournament-format-tc">${escapeHTML(tc)} ${icon?.name || 'Standard'}${iconHtml}</span>`;
    }

    function formatBadge(status) {
        const badge = BADGE_CONFIG[status];
        if (!badge) return '';
        return `<div class="user-badges-component"><div class="user-badges-badge ${badge.c}"><span class="${badge.i}"></span><span>${badge.t}</span></div></div>`;
    }

    function formatDate(ts) {
        if (!ts) return 'N/A';
        const d = new Date(ts * 1000);
        if (isNaN(d)) return 'N/A';
        const h = String(d.getHours()).padStart(2, '0'), m = String(d.getMinutes()).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0'), mo = String(d.getMonth() + 1).padStart(2, '0'), y = d.getFullYear();
        return `${h}h${m}, ngày ${day}/${mo}/${y}`;
    }

    function calculateDuration(start, end) {
        if (!start || !end) return 'N/A';
        const s = new Date(start * 1000), e = new Date(end * 1000);
        if (isNaN(s) || isNaN(e) || e < s) return 'N/A';
        const diff = e - s;
        const units = [{ n: 'ngày', m: 86400000 }, { n: 'tiếng', m: 3600000 }, { n: 'phút', m: 60000 }, { n: 'giây', m: 1000 }];
        for (const u of units) {
            if (diff >= u.m) {
                const val = Math.floor(diff / u.m), rem = diff % u.m;
                if (u.n === 'tiếng' && rem >= 60000) return `${val} tiếng ${Math.floor(rem / 60000)} phút`;
                return `${val} ${u.n}`;
            }
        }
        return 'N/A';
    }

    // ========== Cache System ==========
    const Cache = {
        mem: new Map(),
        get(k) {
            if (this.mem.has(k)) return this.mem.get(k);
            try {
                const stored = localStorage.getItem(CONFIG.CACHE_PREFIX + k);
                if (stored) {
                    const { val, exp } = JSON.parse(stored);
                    if (Date.now() < exp) {
                        this.mem.set(k, val);
                        return val;
                    }
                    localStorage.removeItem(CONFIG.CACHE_PREFIX + k);
                }
            } catch (e) {}
            return null;
        },
        set(k, val, type = 't') {
            this.mem.set(k, val);
            try {
                const exp = Date.now() + (CONFIG.CACHE_TTL[type] || CONFIG.CACHE_TTL.t);
                localStorage.setItem(CONFIG.CACHE_PREFIX + k, JSON.stringify({ val, exp }));
            } catch (e) {
                if (e.name === 'QuotaExceededError') {
                    Object.keys(localStorage)
                        .filter(k => k.startsWith(CONFIG.CACHE_PREFIX))
                        .forEach(k => localStorage.removeItem(k));
                }
            }
        }
    };

    // ========== Modal Manager ==========
    const ModalManager = {
        previousFocus: null,
        previousOverflow: '',

        show(title, content) {
            const modal = document.getElementById('scoreModal');
            const titleElement = document.getElementById('modal-player-name');
            const contentElement = document.getElementById('modal-score-breakdown');
            if (!modal || !titleElement || !contentElement) return;

            if (!modal.classList.contains('open')) {
                this.previousFocus = document.activeElement;
                this.previousOverflow = document.body.style.overflow;
            }

            titleElement.textContent = title;
            contentElement.innerHTML = content;
            modal.setAttribute('aria-hidden', 'false');
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';

            const focusTarget = modal.querySelector('.cc-modal-close') ||
                modal.querySelector('.cc-modal-dialog');
            focusTarget?.focus({ preventScroll: true });
        },

        close() {
            const modal = document.getElementById('scoreModal');
            if (!modal || !modal.classList.contains('open')) return;

            modal.classList.remove('open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = this.previousOverflow;

            const previousFocus = this.previousFocus;
            this.previousFocus = null;
            if (previousFocus?.isConnected) {
                previousFocus.focus?.({ preventScroll: true });
            }
        },

        handleKeydown(event) {
            const modal = document.getElementById('scoreModal');
            if (!modal?.classList.contains('open')) return;

            if (event.key === 'Escape') {
                event.preventDefault();
                this.close();
                return;
            }
            if (event.key !== 'Tab') return;

            const dialog = modal.querySelector('.score-modal-dialog');
            if (!dialog) return;
            const focusable = Array.from(dialog.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )).filter(element => element.getClientRects().length > 0 && !element.closest('[hidden]'));

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
    };

    const scoreModal = document.getElementById('scoreModal');
    scoreModal?.querySelector('.cc-modal-close')?.addEventListener('click', () => ModalManager.close());
    scoreModal?.addEventListener('click', event => {
        if (event.target === scoreModal) ModalManager.close();
    });
    document.addEventListener('keydown', event => ModalManager.handleKeydown(event));

    // ========== Store Player Data with Tournament Details ==========
    const PLAYER_DATA_STORE = new Map();

    function storePlayerData(username, data) {
        const key = username.toLowerCase();
        if (PLAYER_DATA_STORE.has(key)) {
            const existing = PLAYER_DATA_STORE.get(key);
            existing.avatar = data.avatar || existing.avatar;
            existing.status = data.status || existing.status;
            // Merge tournament breakdowns, avoiding duplicates
            data.breakdown.forEach(newBk => {
                if (!existing.breakdown.some(item => item.tourId === newBk.tourId)) {
                    existing.breakdown.push(newBk);
                }
            });
        } else {
            PLAYER_DATA_STORE.set(key, data);
        }
    }

    function getStoredPlayerData(username) {
        return PLAYER_DATA_STORE.get(username.toLowerCase());
    }

    // ========== Event Handlers ==========
    const EventHandlers = {
        handlePlayerClick(username, points) {
            const playerData = getStoredPlayerData(username);
            
            if (!playerData) {
                ModalManager.show(username, `<div class="calendar-wrapper" style="padding: 20px;">
                    <div style="text-align: center;">
                        <p>Đang tải dữ liệu...</p>
                    </div>
                </div>`);
                return;
            }

            const { avatar, status, breakdown } = playerData;
            const safeUsername = escapeHTML(username);
            const safeAvatar = escapeHTML(safeHttpUrl(avatar, CONFIG.DEFAULT_AVATAR));
            const profileUrl = `${CONFIG.CHESS_COM_URL}/member/${encodeURIComponent(username)}`;
            const badgeHtml = formatBadge(status);

            let html = `<div class="calendar-wrapper">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${safeAvatar}" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 10px; border: 2px solid var(--cyan-300);" alt="${safeUsername}">
                    <h3 style="margin: 10px 0 5px 0;"><a href="${profileUrl}" target="_blank" rel="noopener noreferrer">${safeUsername}</a></h3>
                    ${badgeHtml ? `<div style="margin-top: 5px;">${badgeHtml}</div>` : ''}
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
                    <tbody>`;

            breakdown.forEach(item => {
                const variantInfo = VARIANTS[item.variant?.toLowerCase()] || {};
                const variantIcon = variantInfo.icon ? createImg(CONFIG.CHESS_COM_URL + variantInfo.icon) : '';
                const variantName = variantInfo.name || item.variant || 'N/A';

                html += `<tr>
                    <td>
                        <a href="${escapeHTML(safeHttpUrl(item.url))}" target="_blank" rel="noopener noreferrer" style="color: var(--cyan-300); text-decoration: none; font-weight: 500;">
                            ${escapeHTML(item.tourName)}
                        </a>
                        <div style="font-size: 0.85em; color: var(--neutral-300); margin-top: 3px;">
                            ${formatDate(item.startTime)}
                        </div>
                    </td>
                    <td style="text-align: center; font-weight: 600; font-size: 0.95em;">
                        ${getRankBadge(item.rank)}
                    </td>
                    <td style="text-align: center; font-size: 0.9em;">
                        <div>${formatTimeControl(item.timeControl, item.timeClass)}</div>
                        <div>${escapeHTML(variantName)} ${variantIcon}</div>
                        <div>${escapeHTML(item.format)}</div>
                    </td>
                    <td style="text-align: center; color: var(--green-400); font-weight: bold; font-size: 1.05em;">
                        ${escapeHTML(item.points)}
                    </td>
                </tr>`;
            });

            html += `</tbody>
                    </table>
                </div>
            </div>`;

            ModalManager.show(`Lịch sử lọt top 6 của ${username}`, html);
        },

        handleCustomVariantClick(setup) {
            const safeSetup = escapeHTML(setup);
            ModalManager.show('Thế cờ ban đầu', `<div class="calendar-wrapper" style="padding: 20px; color: var(--neutral-100); word-break: break-all;">Xem thế cờ: <a href="https://lichess.org/analysis/${encodeURIComponent(setup)}" target="_blank" rel="noopener noreferrer">${safeSetup}</a></div>`);
        }
    };

    // ========== Fetch & Data Processing ==========
    const RequestManager = {
        active: 0,
        queue: [],
        inFlight: new Map(),

        async acquire() {
            if (this.active < CONFIG.MAX_CONCURRENT) {
                this.active++;
                return;
            }
            await new Promise(resolve => this.queue.push(resolve));
        },

        release() {
            const next = this.queue.shift();
            if (next) {
                next();
                return;
            }
            this.active = Math.max(0, this.active - 1);
        },

        async fetch(url, json = true) {
            const requestKey = `${json ? 'json' : 'text'}:${url}`;
            const pending = this.inFlight.get(requestKey);
            if (pending) return pending;

            const request = (async () => {
                await this.acquire();
                try {
                    for (let attempt = 0; attempt < 2; attempt++) {
                        try {
                            const response = await fetch(url);
                            if (response.status === 429) {
                                await new Promise(resolve => setTimeout(resolve, 2000));
                                continue;
                            }
                            if (!response.ok) return null;
                            return json ? await response.json() : await response.text();
                        } catch (error) {
                            if (attempt === 1) return null;
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }
                    return null;
                } finally {
                    this.release();
                }
            })();

            this.inFlight.set(requestKey, request);
            try {
                return await request;
            } finally {
                if (this.inFlight.get(requestKey) === request) {
                    this.inFlight.delete(requestKey);
                }
            }
        }
    };

    async function fetchRetry(url, json = true) {
        return RequestManager.fetch(url, json);
    }

    async function getTour(id) {
        const c = Cache.get(`t_${id}`); 
        if (c) return c;
        const d = await fetchRetry(`${CONFIG.CHESS_COM_BASE}/tournament/${id}`);
        if (d) Cache.set(`t_${id}`, d, (d.status === 'finished' || d.tournament?.status === 'finished') ? 'f' : 't');
        return d;
    }

    async function getPlayer(u) {
        const c = Cache.get(`p_${u}`); 
        if (c) return c;
        const d = await fetchRetry(`${CONFIG.CHESS_COM_BASE}/player/${u}`);
        if (d) Cache.set(`p_${u}`, d, 'p');
        return d;
    }

    function parseTC(tc) {
        if (!tc) return '3+0';
        const m = String(tc).match(/^(\d+)\+(\d+)$/);
        if (m) { 
            const b = parseInt(m[1]), i = parseInt(m[2]); 
            return b >= 60 ? `${Math.floor(b/60)}+${i}` : `${b}+${i}`; 
        }
        const n = parseInt(tc); 
        return !isNaN(n) ? (n >= 60 ? `${Math.floor(n/60)}+0` : `${n}+0`) : '3+0';
    }

    // ========== Render Player Cell ==========
    function renderPlayer(u, pts, tourData, rank) {
        if (!u) return '<td style="color:var(--primary-warning)">Giải chưa kết thúc!</td>';

        const specialUsername = SPECIAL_PLAYERS.get(u.toLowerCase()) || u;
        const breakdownItem = {
            tourId: tourData.id || tourData.url,
            tourName: tourData.name || 'Unknown',
            url: tourData.url || `${CONFIG.CHESS_COM_URL}/tournament/${tourData.id}`,
            points: pts,
            rank: rank || 0,
            variant: tourData._finalVariant,
            timeControl: parseTC(tourData.settings?.time_control || tourData.time_control || tourData.timeControl),
            timeClass: tourData.settings?.time_class || tourData.time_class || 'classical',
            playersCount: tourData.settings?.registered_user_count || tourData.players_registered || tourData.players?.length || 0,
            startTime: tourData.start_time || tourData.startTime || 0,
            format: tourData._formatLabel
        };

        // Save tournament details now; fetch the player's profile only after this month renders.
        storePlayerData(specialUsername, {
            avatar: CONFIG.DEFAULT_AVATAR,
            status: 'N/A',
            breakdown: [breakdownItem]
        });

        const safeUsername = escapeHTML(specialUsername);
        const profileUrl = `${CONFIG.CHESS_COM_URL}/member/${encodeURIComponent(specialUsername)}`;

        return `<td class="player-cell clickable-player" data-username="${safeUsername}" data-player-username="${safeUsername}" data-points="${escapeHTML(pts)}" style="cursor: pointer;">
            <div class="post-user-component">
                <div class="cc-avatar-component post-user-avatar">
                    <img class="cc-avatar-img" src="${CONFIG.DEFAULT_AVATAR}" loading="lazy" height="50" width="50" alt="${safeUsername}">
                </div>
                <div class="post-user-details">
                    <div class="user-tagline-component">
                        <a class="user-username-component user-tagline-username" href="${profileUrl}" target="_blank" rel="noopener noreferrer">${safeUsername}</a>
                    </div>
                    <div class="post-user-status">
                        <span class="player-status-badge"></span>
                        <span class="score-display" style="font-weight: bold;">${escapeHTML(pts)} ĐIỂM</span>
                    </div>
                </div>
            </div>
        </td>`;
    }

    async function loadMonthAvatars(rows) {
        const cells = rows.flatMap(row =>
            Array.from(row.querySelectorAll('.player-cell[data-player-username]'))
        );
        const usernames = [...new Set(cells.map(cell => cell.dataset.playerUsername).filter(Boolean))];

        await Promise.allSettled(usernames.map(async username => {
            const profile = await getPlayer(username);
            if (!profile) return;

            const avatar = profile.avatar || CONFIG.DEFAULT_AVATAR;
            const status = profile.status || 'N/A';
            storePlayerData(username, { avatar, status, breakdown: [] });

            cells
                .filter(cell => cell.dataset.playerUsername?.toLowerCase() === username.toLowerCase())
                .forEach(cell => {
                    const image = cell.querySelector('.cc-avatar-img');
                    if (image && profile.avatar) {
                        image.src = safeHttpUrl(avatar, CONFIG.DEFAULT_AVATAR);
                    }

                    const statusElement = cell.querySelector('.player-status-badge');
                    if (statusElement) statusElement.innerHTML = formatBadge(status);
                });
        }));
    }

    function runAfterPaint(callback) {
        // Let the completed month reach the screen before starting profile requests.
        window.requestAnimationFrame(() => window.requestAnimationFrame(callback));
    }

    // ========== Main Init ==========
    async function init(type = 'tvlt', containerId = 'tournament-table') {
        const el = document.getElementById(containerId);
        if (!el) return;

        el.innerHTML = '<div class="loading">Đang xử lý dữ liệu...</div>';

        const txt = await fetchRetry(`${CONFIG.GIST_BASE}/${type}.txt`, false);
        const ids = txt ? txt.split('\n').map(id => id.trim()).filter(Boolean) : [];
        if (!ids.length) {
            el.innerHTML = '<div class="error">Không tìm thấy giải đấu.</div>';
            return;
        }

        el.innerHTML = "<div class=\"table\"><table class=\"styled-table\" id=\"tournament-results-table\"><thead><tr><th class=\"name-tour\">Giải đấu</th><th class=\"organization-day\">Thời gian bắt đầu</th><th class=\"rules\">Thể lệ</th><th class=\"players-count\">Kỳ thủ</th><th class=\"winner\">🥇 Hạng 1</th><th class=\"winner\">🥈 Hạng 2</th><th class=\"winner\">🥉 Hạng 3</th><th class=\"winner\">🎖️ Hạng 4</th><th class=\"winner\">🏅 Hạng 5</th><th class=\"winner\">⭐ Hạng 6</th></tr></thead><tbody id=\"tournament-tbody\"><tr class=\"not-match\" style=\"display:none\"><td colspan=\"10\" class=\"table-empty-state\">Không tìm thấy kết quả nào phù hợp.</td></tr></tbody></table></div><br><br><hr>";

        if (typeof window.loadTournamentFiltersFromURL === 'function') {
            window.loadTournamentFiltersFromURL();
        }

        const tbody = document.getElementById('tournament-tbody');
        const currentTournament = document.getElementById('current-tournament');
        const skeletonFragment = document.createDocumentFragment();
        const skeletons = ids.map(() => {
            const tr = document.createElement('tr');
            tr.className = 'skeleton-row';
            let row = `
                <td><div class="skeleton skeleton-text" style="width: 80%;"></div></td>
                <td><div class="skeleton skeleton-text" style="width: 70%;"></div></td>
                <td><div class="skeleton skeleton-text" style="width: 90%;"></div></td>
                <td><div class="skeleton skeleton-text" style="width: 30px; margin: auto;"></div></td>`;
            for (let i = 0; i < CONFIG.MAX_PLAYERS; i++) {
                row += `<td><div class="post-user-component"><div class="skeleton skeleton-avatar"></div>
                    <div class="post-user-details"><div class="skeleton skeleton-text" style="width: 70px;"></div>
                    <div class="skeleton skeleton-text" style="width: 40px;"></div></div></div></td>`;
            }
            tr.innerHTML = row;
            skeletonFragment.appendChild(tr);
            return tr;
        });
        skeletons.forEach((row, index) => {
            row.setAttribute('data-sort-order', String(index));
        });
        tbody.appendChild(skeletonFragment);

        // Bind interactions before the first month is rendered, so early results are usable.
        tbody.addEventListener('click', event => {
            const playerCell = event.target.closest('.clickable-player');
            if (playerCell) {
                EventHandlers.handlePlayerClick(
                    playerCell.dataset.username,
                    playerCell.dataset.points
                );
                return;
            }

            const link = event.target.closest('.custom-variant-link');
            if (link) {
                event.preventDefault();
                EventHandlers.handleCustomVariantClick(link.dataset.setup);
            }
        });

        /*
         * Fetch tournament metadata first to group IDs by their actual start month.
         * Player profiles and avatars are not requested during this stage.
         */
        const metadataResults = await Promise.allSettled(ids.map(async (id, idx) => ({
            id,
            idx,
            data: await getTour(id)
        })));

        const monthsByKey = new Map();

        // Give every placeholder its sort keys before detailed tournament data is processed.
        // Failed metadata lookups retain a deterministic fallback position at the end.
        skeletons.forEach(row => {
            row.setAttribute('data-start-time', '0');
            row.setAttribute('data-players-count', '0');
            row.setAttribute('data-tours-count', '0');
        });

        metadataResults.forEach((result, index) => {
            const placeholder = skeletons[index];
            if (result.status !== 'fulfilled' || !result.value.data) {
                placeholder.className = 'results-row-error';
                placeholder.innerHTML = `<td colspan="${4 + CONFIG.MAX_PLAYERS}" class="table-empty-state">Không thể tải giải đấu ${escapeHTML(ids[index])}.</td>`;
                return;
            }

            const entry = result.value;
            const data = entry.data;
            const settings = data.settings || {};
            const timestamp = data.start_time || data.startTime || 0;
            const rounds = settings.total_rounds || data.rounds || data.total_rounds || 0;
            const playersCount = settings.registered_user_count || data.players_registered || data.players?.length || 0;
            const timeClass = settings.time_class || data.time_class || 'classical';
            let variant = settings.rules || data.rules || 'standard';
            if ((variant === 'standard' || variant === 'chess') && settings.initial_setup) {
                variant = 'custom';
            }

            placeholder.setAttribute('data-start-time', String(timestamp));
            placeholder.setAttribute('data-players-count', String(playersCount));
            placeholder.setAttribute('data-time-class', timeClass);
            placeholder.setAttribute('data-variant', String(variant).toLowerCase());
            placeholder.setAttribute('data-format', rounds === 1 ? 'arena' : 'swiss');

            const date = timestamp ? new Date(timestamp * 1000) : null;
            const monthKey = date && !isNaN(date)
                ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                : 'unknown';

            if (!monthsByKey.has(monthKey)) monthsByKey.set(monthKey, []);
            monthsByKey.get(monthKey).push(entry);
        });

        // Sort all tournament slots once, while they are still placeholders.
        if (typeof window.sortTournamentRows === 'function') {
            window.sortTournamentRows();
        }
        if (typeof window.searchTable === 'function') {
            window.searchTable();
        }

        let success = 0;

        const processTournament = async entry => {
            const { id, idx, data } = entry;

            try {
                const rounds = data.settings?.total_rounds || data.rounds || data.total_rounds || 0;
                const pointsMap = new Map();

                if (rounds > 0) {
                    const roundData = await fetchRetry(`${CONFIG.CHESS_COM_BASE}/tournament/${id}/${rounds}`);
                    const groups = roundData?.groups || [];
                    const playerList = groups.length
                        ? (await Promise.allSettled(groups.map(url => fetchRetry(url))))
                            .filter(result => result.status === 'fulfilled')
                            .flatMap(result => result.value?.players || [])
                        : (roundData?.players || []);

                    playerList.forEach(player => {
                        if (player.username) {
                            pointsMap.set(player.username.toLowerCase(), player.points || 0);
                        }
                    });
                }

                const players = (data.players || [])
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
                    .sort((a, b) =>
                        (a.rank || Infinity) - (b.rank || Infinity) || b.points - a.points
                    );
                const topPlayers = players.slice(0, CONFIG.MAX_PLAYERS);

                data.id = id;

                let variant = data.settings?.rules || data.rules || 'standard';
                const setup = data.settings?.initial_setup || null;
                if ((variant === 'standard' || variant === 'chess') && setup) {
                    variant = 'custom';
                }

                const formatLabel = rounds === 1
                    ? `Đấu trường Arena ${calculateDuration(data.start_time || data.startTime, data.finish_time || data.endTime)}`
                    : `Hệ Thụy Sĩ ${rounds} vòng`;
                data._finalVariant = variant;
                data._formatLabel = formatLabel;

                const formatHtml = rounds === 1
                    ? `<span class="tournament-format-type"><a href="https://support.chess.com/articles/8562889-what-are-arena-tournaments" target="_blank" rel="noopener noreferrer">Đấu trường Arena</a><span class="tournament-format-detail">${calculateDuration(data.start_time || data.startTime, data.finish_time || data.endTime)}</span> <img src="https://chess.com/bundles/web/images/color-icons/arena-club.495ffa75.svg" width="15" height="15" alt="Arena" style="vertical-align:middle"></span>`
                    : `<span class="tournament-format-type"><a href="https://chess.com/terms/swiss-chess" target="_blank" rel="noopener noreferrer">Hệ Thụy Sĩ</a><span class="tournament-format-detail">${escapeHTML(rounds)} vòng</span><img src="https://chess.com/bundles/web/images/color-icons/tournaments.3a561883.svg" width="15" height="15" alt="Swiss" style="vertical-align:middle"></span>`;

                const tournamentUrl = escapeHTML(safeHttpUrl(
                    data.url,
                    `${CONFIG.CHESS_COM_URL}/tournament/${encodeURIComponent(id)}`
                ));
                const tournamentName = escapeHTML(data.name || 'Unknown');
                let row = `<td><a href="${tournamentUrl}" target="_blank" rel="noopener noreferrer">${tournamentName}</a></td>
                    <td>${formatDate(data.start_time || data.startTime)}</td>
                    <td>${formatTimeControl(parseTC(data.settings?.time_control || data.time_control || data.timeControl), data.settings?.time_class || data.time_class)}${formatVariantLink(variant, setup)}${formatHtml}</td>
                    <td class="players-count">${data.settings?.registered_user_count || data.players_registered || data.players?.length || 0}</td>`;

                for (let rank = 0; rank < CONFIG.MAX_PLAYERS; rank++) {
                    const player = topPlayers[rank];
                    row += renderPlayer(player?.username, player?.points || 0, data, rank + 1);
                }

                // Replace the tournament's own placeholder; no other row is moved.
                const tableRow = skeletons[idx];
                tableRow.innerHTML = row;
                tableRow.setAttribute('data-start-time', data.start_time || data.startTime || 0);
                tableRow.setAttribute('data-players-count', data.settings?.registered_user_count || data.players_registered || data.players?.length || 0);
                tableRow.setAttribute('data-time-class', data.settings?.time_class || data.time_class || 'classical');
                tableRow.setAttribute('data-variant', variant.toLowerCase());
                tableRow.setAttribute('data-format', rounds === 1 ? 'arena' : 'swiss');
                tableRow.className = 'results-row-enter';

                success++;
                if (currentTournament) {
                    currentTournament.textContent = `${success}/${ids.length}`;
                }

                if (typeof window.searchTable === 'function') {
                    window.searchTable();
                }

                // Start avatar requests only after this specific tournament row has painted.
                runAfterPaint(() => {
                    loadMonthAvatars([tableRow]).catch(error => {
                        console.error('Error loading player avatars for tournament:', id, error);
                    });
                });
            } catch (error) {
                console.error('Error processing tournament:', id, error);

                const failedRow = skeletons[idx];
                if (failedRow) {
                    failedRow.className = 'results-row-error';
                    failedRow.innerHTML = `<td colspan="${4 + CONFIG.MAX_PLAYERS}" class="table-empty-state">Không thể tải giải đấu ${escapeHTML(id)}.</td>`;
                }
            }
        };

        // Process every tournament independently: a slow event no longer blocks
        // other completed events from replacing their own sorted placeholders.
        const monthJobs = Array.from(monthsByKey.values(), monthEntries =>
            Promise.allSettled(monthEntries.map(processTournament))
        );

        await Promise.allSettled(monthJobs);

        if (typeof window.searchTable === 'function') {
            window.searchTable();
        }

        const icon = document.getElementById('statusIcon');
        if (icon) {
            icon.style.color = success === ids.length ? 'var(--primary-success)' : 'var(--color-danger)';
            icon.className = success === ids.length ? 'bx bx-check' : 'bx bx-x';
        }
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('[data-fetch-tournament]').forEach(c => init(c.dataset.fetchTournament, c.id));
        });
    } else {
        document.querySelectorAll('[data-fetch-tournament]').forEach(c => init(c.dataset.fetchTournament, c.id));
    }

    window.TournamentModalManager = ModalManager;
})();