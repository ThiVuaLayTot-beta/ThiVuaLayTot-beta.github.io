(function() {
    const API = {
        CHESS_COM: 'https://api.chess.com/pub',
        GIST: 'https://gist.githubusercontent.com/M-DinhHoangViet/9c53a11fca709a656076bf6de7c118b0/raw'
    };

    const CONFIG = {
        MAX_CONCURRENT: 10,
        TOP_PLAYERS: 6,
        CHESS_COM_URL: 'https://www.chess.com',
        DEFAULT_AVATAR: 'https://www.chess.com/bundles/web/images/user-image.007dad08.svg',
        CACHE_PREFIX: 'agg_cache_',
        CACHE_TTL: { p: 604800000, t: 86400000, a: 43200000 }
    };

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
        'lightning': { name: 'Bullet', path: '/bundles/web/images/icons/smileys/2x/bullet.png' },
        'bullet': { name: 'Bullet', path: '/bundles/web/images/icons/smileys/2x/bullet.png' },
        'blitz': { name: 'Blitz', path: '/bundles/web/images/icons/smileys/2x/blitz.png' },
        'rapid': { name: 'Rapid', path: '/bundles/web/images/icons/smileys/2x/live.png' },
        'standard': { name: 'Rapid', path: '/bundles/web/images/icons/smileys/2x/live.png' }
    };

    const BADGE_CONFIG = {
        'closed:abuse': { c: 'user-badges-closed', i: 'bx bx-dislike', t: 'Bị khóa: Lạm dụng' },
        'closed:fair_play_violations': { c: 'user-badges-closed', i: 'bx bx-block', t: 'Bị khóa: Fair Play' },
        'closed': { c: 'user-badges-inactive', i: 'bx bx-no-signal', t: 'Bị khóa' },
    };

    const PLAYER_TOP6_STORE = new Map();

    function recordTop6Finish(monthId, player, rank, totalMonthTours, finishedCount, monthStatus) {
        const key = player.username.toLowerCase();
        if (!PLAYER_TOP6_STORE.has(key)) {
            PLAYER_TOP6_STORE.set(key, {
                username: player.username,
                finishes: []
            });
        }
        const record = PLAYER_TOP6_STORE.get(key);
        if (!record.finishes.some(f => f.monthId === monthId)) {
            record.finishes.push({
                monthId,
                rank,
                totalPoints: player.totalPoints,
                tourCount: player.breakdown ? player.breakdown.length : 0,
                totalMonthTours: totalMonthTours || (player.breakdown ? player.breakdown.length : 0),
                finishedCount: finishedCount ?? 0,
                monthStatus: monthStatus || 'finished',
                breakdown: player.breakdown
            });
        }
    }

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

    function getRankBadge(rank) {
        const badges = {
            1: '🥇 Hạng 1',
            2: '🥈 Hạng 2',
            3: '🥉 Hạng 3',
            4: '🎖️ Hạng 4',
            5: '🏅 Hạng 5',
            6: '⭐ Hạng 6'
        };
        return badges[rank] || `Hạng ${escapeHTML(rank)}`;
    }

    function formatTourStatus(status, isFinished) {
        if (isFinished || status === 'finished') {
            return `<span class="user-badges-badge" style="background: rgba(34, 197, 94, 0.15); color: #4ade80; border-color: rgba(34, 197, 94, 0.4);"><i class="bx bx-check-circle" style="margin-right: 3px;"></i>Đã hoàn thành</span>`;
        } else if (status === 'in_progress') {
            return `<span class="user-badges-badge" style="background: rgba(234, 179, 8, 0.15); color: #facc15; border-color: rgba(234, 179, 8, 0.4);"><i class="bx bx-loader-circle bx-spin" style="margin-right: 3px;"></i>Đang diễn ra</span>`;
        } else if (status === 'registration') {
            return `<span class="user-badges-badge" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border-color: rgba(59, 130, 246, 0.4);"><i class="bx bx-user-plus" style="margin-right: 3px;"></i>Đang đăng ký</span>`;
        } else if (status === 'scheduled') {
            return `<span class="user-badges-badge" style="background: rgba(148, 163, 184, 0.15); color: #94a3b8; border-color: rgba(148, 163, 184, 0.4);"><i class="bx bx-calendar" style="margin-right: 3px;"></i>Sắp diễn ra</span>`;
        } else {
            return `<span class="user-badges-badge" style="background: rgba(234, 179, 8, 0.15); color: #facc15; border-color: rgba(234, 179, 8, 0.4);"><i class="bx bx-time-five" style="margin-right: 3px;"></i>Chưa hoàn thành</span>`;
        }
    }

    function parseMonthTimestamp(m) {
        const parts = m.split('-');
        if (parts.length === 2) {
            return new Date(parseInt(parts[1]), parseInt(parts[0]) - 1, 1).getTime();
        }
        return 0;
    }

    function formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp * 1000);
        if (isNaN(date)) return 'N/A';
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${h}:${m}, ngày ${day}/${month}/${year}`;
    }

    function calculateDuration(startTs, endTs) {
        if (!startTs || !endTs) return 'N/A';
        const start = new Date(startTs * 1000);
        const end = new Date(endTs * 1000);
        if (isNaN(start) || isNaN(end) || end < start) return 'N/A';
        const diff = end - start;
        const units = [
            { n: 'ngày', m: 86400000 },
            { n: 'tiếng', m: 3600000 },
            { n: 'phút', m: 60000 },
            { n: 'giây', m: 1000 }
        ];
        for (const { n, m } of units) {
            if (diff >= m) {
                const val = Math.floor(diff / m);
                const rem = diff % m;
                if (n === 'tiếng' && rem >= 60000) return `${val} tiếng ${Math.floor(rem / 60000)} phút`;
                return `${val} ${n}`;
            }
        }
        return 'N/A';
    }

    function parseTimeControl(tc) {
        if (!tc) return '3+0';
        const match = String(tc).match(/^(\d+)\+(\d+)$/);
        if (match) {
            const base = parseInt(match[1]);
            const increment = parseInt(match[2]);
            return base >= 60 ? `${Math.floor(base / 60)}+${increment}` : `${base}+${increment}`;
        }
        const num = parseInt(tc);
        return !isNaN(num) ? (num >= 60 ? `${Math.floor(num / 60)}+0` : `${num}+0`) : '3+0';
    }

    function createImg(src, w = 15) {
        return `<img src="${escapeHTML(safeHttpUrl(src))}" width="${w}" height="${w}" alt="" style="display: inline-block; vertical-align: middle;">`;
    }

    const Cache = {
        memory: new Map(),
        get(key) {
            if (this.memory.has(key)) return this.memory.get(key);
            try {
                const stored = localStorage.getItem(CONFIG.CACHE_PREFIX + key);
                if (stored) {
                    const { val, exp } = JSON.parse(stored);
                    if (Date.now() < exp) {
                        this.memory.set(key, val);
                        return val;
                    }
                    localStorage.removeItem(CONFIG.CACHE_PREFIX + key);
                }
            } catch (e) {}
            return null;
        },
        set(key, val, ttl) {
            this.memory.set(key, val);
            try {
                localStorage.setItem(CONFIG.CACHE_PREFIX + key, JSON.stringify({ val, exp: Date.now() + ttl }));
            } catch (e) {
                if (e.name === 'QuotaExceededError') {
                    Object.keys(localStorage)
                        .filter(k => k.startsWith(CONFIG.CACHE_PREFIX))
                        .forEach(k => localStorage.removeItem(k));
                }
            }
        }
    };

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

        async fetch(url, isJson = true) {
            const cached = Cache.get(url);
            if (cached) return cached;

            const requestKey = `${isJson ? 'json' : 'text'}:${url}`;
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

                            const data = isJson ? await response.json() : await response.text();
                            if (url.startsWith(API.CHESS_COM)) {
                                const ttl = url.includes('/player/') ? CONFIG.CACHE_TTL.p : CONFIG.CACHE_TTL.t;
                                Cache.set(url, data, ttl);
                            } else {
                                Cache.memory.set(url, data);
                            }
                            return data;
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

    const DataProcessor = {
        toursByMonth: {},

        parseUnifiedFormat(text) {
            const lines = text ? text.split('\n').map(l => l.trim()) : [];
            const months = [];
            const toursByMonth = {};
            let currentMonth = null;
            for (const line of lines) {
                if (!line) continue;
                if (line.startsWith('*')) {
                    currentMonth = line.slice(1).trim();
                    if (currentMonth) {
                        months.push(currentMonth);
                        toursByMonth[currentMonth] = [];
                    }
                } else if (currentMonth) {
                    toursByMonth[currentMonth].push(line);
                }
            }
            return { months, toursByMonth };
        },

        getTournamentMetadata(data) {
            if (!data) {
                return {
                    rounds: 0,
                    variant: 'standard',
                    setup: null,
                    timeControl: '3+0',
                    timeClass: 'blitz',
                    registeredCount: 0,
                    startTime: 0,
                    endTime: 0,
                    status: 'unknown',
                    isFinished: false
                };
            }
            const rounds = data.settings?.total_rounds || data.rounds || data.total_rounds || 0;
            const variant = data.settings?.rules || data.rules || 'standard';
            const setup = data.settings?.initial_setup || null;
            const finalVariant = (variant === 'standard' || variant === 'chess') && setup ? 'custom' : variant;
            const status = data.status || data.settings?.status || 'unknown';
            const finishTime = data.finish_time || data.endTime || data.finishTime || 0;
            const nowSeconds = Math.floor(Date.now() / 1000);
            const isFinished = status === 'finished' || (finishTime > 0 && finishTime <= nowSeconds);

            return {
                rounds,
                variant: finalVariant,
                setup,
                timeControl: parseTimeControl(data.settings?.time_control || data.time_control || data.timeControl),
                timeClass: data.settings?.time_class || data.time_class || 'classical',
                registeredCount: Math.max(
                    data.settings?.registered_user_count || 0,
                    data.players_registered || 0,
                    (data.players || []).length
                ),
                startTime: data.start_time || data.startTime || 0,
                endTime: finishTime,
                status,
                isFinished
            };
        },

        buildPlayersMap(mainPlayers, pointsMap) {
            const playerMap = new Map();
            const originalNames = new Map();

            for (const player of mainPlayers) {
                const username = typeof player === 'string' ? player : player?.username;
                if (!username) continue;
                const key = username.toLowerCase();
                if (!originalNames.has(key)) originalNames.set(key, username);
            }

            pointsMap.forEach((points, username) => {
                const key = username.toLowerCase();
                playerMap.set(key, { username: originalNames.get(key) || key, points });
            });

            for (const player of mainPlayers) {
                const username = typeof player === 'string' ? player : player?.username;
                if (!username) continue;
                const key = username.toLowerCase();
                const points = player.points ?? pointsMap.get(key) ?? 0;
                const existing = playerMap.get(key);
                if (existing) existing.points = Math.max(existing.points, points);
                else playerMap.set(key, { username, points });
            }

            return Array.from(playerMap.values());
        },

        async getMonthlyAggregation(monthId, eventType) {
            const cacheKey = `agg_v3_${eventType}_${monthId}`;
            const cached = Cache.get(cacheKey);
            if (cached) return cached;

            let tournamentIds = [];
            if (this.toursByMonth?.[monthId]) {
                tournamentIds = this.toursByMonth[monthId];
            } else {
                const text = await RequestManager.fetch(`${API.GIST}/${monthId}.txt`, false);
                tournamentIds = text ? text.split('\n').filter(l => l.trim()) : [];
            }

            if (!tournamentIds.length) {
                return { playerScores: {}, tournaments: [], status: 'finished' };
            }

            const tourDataList = await Promise.all(
                tournamentIds.map(id => RequestManager.fetch(`${API.CHESS_COM}/tournament/${id}`))
            );

            const processedTournaments = await Promise.all(tournamentIds.map(async (id, index) => {
                const data = tourDataList[index];
                if (!data) return null;

                const meta = this.getTournamentMetadata(data);
                const pointsMap = new Map();

                if (meta.rounds > 0) {
                    const roundData = await RequestManager.fetch(
                        `${API.CHESS_COM}/tournament/${id}/${meta.rounds}`
                    );
                    const groups = roundData?.groups || [];
                    const playerList = groups.length
                        ? (await Promise.all(groups.map(url => RequestManager.fetch(url))))
                            .flatMap(result => result?.players || [])
                        : (roundData?.players || []);

                    playerList.forEach(player => {
                        if (player.username) {
                            pointsMap.set(player.username.toLowerCase(), player.points || 0);
                        }
                    });
                }

                return {
                    id,
                    data,
                    meta,
                    players: this.buildPlayersMap(data.players || [], pointsMap)
                };
            }));

            const playerScores = {};
            const tournaments = [];
            let monthStatus = 'finished';

            for (const processed of processedTournaments) {
                if (!processed) continue;

                const { id, data, meta, players } = processed;
                if (!meta.isFinished) monthStatus = 'unfinished';

                const format = meta.rounds === 1
                    ? `<span class="tournament-format-type"><a href="https://support.chess.com/articles/8562889-what-are-arena-tournaments" target="_blank" rel="noopener noreferrer">Đấu trường Arena</a><span class="tournament-format-detail">${calculateDuration(meta.startTime, meta.endTime)}</span><img src="https://chess.com/bundles/web/images/color-icons/arena-club.495ffa75.svg" width="15" height="15" alt="Arena" style="vertical-align:middle"></span>`
                    : `<span class="tournament-format-type"><a href="https://chess.com/terms/swiss-chess" target="_blank" rel="noopener noreferrer">Hệ Thụy Sĩ</a><span class="tournament-format-detail">${escapeHTML(meta.rounds)} vòng</span><img src="https://chess.com/bundles/web/images/color-icons/tournaments.3a561883.svg" width="15" height="15" alt="Swiss" style="vertical-align:middle"></span>`;

                tournaments.push({
                    id,
                    name: data.name || 'Unknown',
                    url: data.url || `${CONFIG.CHESS_COM_URL}/tournament/${id}`,
                    variant: meta.variant,
                    setup: meta.setup,
                    timeClass: meta.timeClass,
                    timeControl: meta.timeControl,
                    totalRounds: meta.rounds,
                    duration: calculateDuration(meta.startTime, meta.endTime),
                    playersCount: meta.registeredCount,
                    startTime: meta.startTime,
                    format,
                    status: meta.status,
                    isFinished: meta.isFinished
                });

                players.forEach(player => {
                    const usernameLower = player.username.toLowerCase();
                    if (!playerScores[usernameLower]) {
                        playerScores[usernameLower] = {
                            username: player.username,
                            totalPoints: 0,
                            breakdown: []
                        };
                    }
                    playerScores[usernameLower].totalPoints += player.points;
                    playerScores[usernameLower].breakdown.push({
                        tourId: id,
                        tourName: data.name || 'Unknown',
                        points: player.points,
                        url: data.url,
                        variant: meta.variant,
                        timeControl: meta.timeControl,
                        timeClass: meta.timeClass,
                        startTime: meta.startTime,
                        format
                    });
                });
            }

            const result = { playerScores, tournaments, status: monthStatus };
            Cache.set(cacheKey, result, CONFIG.CACHE_TTL.a);
            return result;
        }
    };

    const Renderer = {
        timeFormat(tc, timeClass) {
            const icon = TIME_ICONS[timeClass];
            const iconHtml = icon ? createImg(`${CONFIG.CHESS_COM_URL}${icon.path}`) : '';
            return `${tc} ${icon?.name || 'Standard'}${iconHtml}`;
        },

        variantInfo(variant) {
            const data = VARIANTS[variant.toLowerCase()];
            return data ? {
                name: data.name,
                url: `${CONFIG.CHESS_COM_URL}${data.url}`,
                icon: `${CONFIG.CHESS_COM_URL}${data.icon}`
            } : null;
        },

        formatBadge(status) {
            const badge = BADGE_CONFIG[status];
            if (!badge) return '';
            return `<div class="user-badges-component"><div class="user-badges-badge ${badge.c}"><span class="${badge.i}"></span><span>${badge.t}</span></div></div>`;
        },

        playerCell(player, monthId) {
            if (!player) {
                return '<td style="color: var(--primary-warning)">Chưa có dữ liệu!</td>';
            }

            const safeUsername = escapeHTML(player.username);
            const safeAvatar = escapeHTML(CONFIG.DEFAULT_AVATAR);
            const profileUrl = `${CONFIG.CHESS_COM_URL}/member/${encodeURIComponent(player.username)}`;

            return `<td class="player-cell clickable-player"
                    data-month="${escapeHTML(monthId || '')}"
                    data-player='${escapeHTML(JSON.stringify(player))}'
                    data-player-username="${safeUsername}"
                    data-avatar="${safeAvatar}"
                    data-status="N/A"
                    style="cursor: pointer;">
                <div class="post-user-component">
                    <div class="cc-avatar-component post-user-avatar">
                        <img class="cc-avatar-img" src="${safeAvatar}" loading="lazy" height="50" width="50" alt="${safeUsername}">
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
        },

        monthRow(monthId, aggregation) {
            const { playerScores, tournaments, status } = aggregation;
            const topPlayers = Object.values(playerScores)
                .sort((a, b) => b.totalPoints - a.totalPoints)
                .slice(0, CONFIG.TOP_PLAYERS);

            const finishedCount = tournaments.filter(tournament => tournament.isFinished).length;
            const totalCount = tournaments.length;

            topPlayers.forEach((player, index) => {
                recordTop6Finish(monthId, player, index + 1, totalCount, finishedCount, status);
            });

            const tournamentsJson = escapeHTML(JSON.stringify(tournaments));
            const safeMonthId = escapeHTML(monthId);
            const isAllFinished = totalCount > 0 && finishedCount === totalCount;
            const statusBadgeStyle = isAllFinished
                ? 'background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4);'
                : 'background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4);';
            const statusBadgeIcon = isAllFinished ? 'bx-check-circle' : 'bx-time-five';
            const statsHtml = `<span style="white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; font-weight: 600;">${totalCount} giải đấu <i class="bx bx-info-circle" style="font-size: 0.85em; opacity: 0.7;"></i></span><div style="margin-top: 4px; white-space: nowrap;"><span class="user-badges-badge" style="${statusBadgeStyle} font-size: 0.82em; padding: 2px 8px; font-weight: 600; display: inline-flex; align-items: center; gap: 3px;"><i class="bx ${statusBadgeIcon}"></i>${finishedCount}/${totalCount} đã hoàn thành</span></div>`;

            let html = `<tr>
                <td class="name-tour month-clickable" data-tournaments='${tournamentsJson}' data-month="${safeMonthId}">
                    <span style="white-space: nowrap; display: inline-flex; align-items: center; gap: 4px;">Tháng ${safeMonthId} <i class="bx bx-info-circle" style="font-size: 0.85em; opacity: 0.7;"></i></span>
                </td>
                <td class="rules month-clickable" data-tournaments='${tournamentsJson}' data-month="${safeMonthId}">
                    ${statsHtml}
                </td>
                <td class="players-count">${Object.keys(playerScores).length}</td>`;

            for (let index = 0; index < CONFIG.TOP_PLAYERS; index++) {
                html += this.playerCell(topPlayers[index], monthId);
            }

            return html + '</tr>';
        },

        async loadMonthAvatars(row) {
            const cellsByUsername = new Map();
            row.querySelectorAll('.player-cell[data-player-username]').forEach(cell => {
                const username = cell.dataset.playerUsername?.trim();
                if (!username) return;
                const key = username.toLowerCase();
                if (!cellsByUsername.has(key)) cellsByUsername.set(key, { username, cells: [] });
                cellsByUsername.get(key).cells.push(cell);
            });

            await Promise.allSettled(Array.from(cellsByUsername.values(), async ({ username, cells }) => {
                const profile = await RequestManager.fetch(
                    `${API.CHESS_COM}/player/${encodeURIComponent(username)}`
                );
                if (!profile) return;

                const avatar = safeHttpUrl(profile.avatar || CONFIG.DEFAULT_AVATAR, CONFIG.DEFAULT_AVATAR);
                const status = profile.status || 'N/A';
                const badgeHtml = this.formatBadge(status);

                cells.forEach(cell => {
                    const image = cell.querySelector('.cc-avatar-img');
                    if (image && profile.avatar) image.src = avatar;
                    cell.dataset.avatar = avatar;
                    cell.dataset.status = status;
                    const statusElement = cell.querySelector('.player-status-badge');
                    if (statusElement) statusElement.innerHTML = badgeHtml;
                });
            }));
        }
    };

    const ModalManager = {
        show(title, content) {
            const modal = document.getElementById('scoreModal');
            if (modal) {
                document.getElementById('modal-player-name').textContent = title;
                document.getElementById('modal-score-breakdown').innerHTML = content;
                modal.classList.add('open');
                document.body.style.overflow = 'hidden';
            }
        },
        close() {
            const modal = document.getElementById('scoreModal');
            if (modal) {
                modal.classList.remove('open');
                document.body.style.overflow = '';
            }
        }
    };

    const EventHandlers = {
        handlePlayerClick(playerData, avatar, status, monthId) {
            const badgeHtml = Renderer.formatBadge(status);
            const safeUsername = escapeHTML(playerData.username);
            const safeAvatar = escapeHTML(safeHttpUrl(avatar, CONFIG.DEFAULT_AVATAR));
            const profileUrl = `${CONFIG.CHESS_COM_URL}/member/${encodeURIComponent(playerData.username)}`;
            let html = `<div class="calendar-wrapper">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${safeAvatar}" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 10px; border: 2px solid var(--cyan-300);" alt="${safeUsername}">
                    <h3 style="margin: 10px 0 5px 0;"><a href="${profileUrl}" target="_blank" rel="noopener noreferrer">${safeUsername}</a></h3>
                    ${badgeHtml ? `<div style="margin-top: 5px;">${badgeHtml}</div>` : ''}
                </div>

                <div style="margin-bottom: 25px;">
                    <h4 style="color: var(--cyan-300); margin: 0 0 10px 0; font-size: 1.05em; display: flex; align-items: center; gap: 6px;">
                        <i class="bx bx-calendar"></i> Tổng kết Tháng ${escapeHTML(monthId || '')}
                    </h4>
                    <table class="styled-table score-detail-table" style="width: 100%;">
                        <thead><tr><th>Giải đấu</th><th style="text-align: center;">Thể lệ</th><th style="text-align: center;">Điểm</th></tr></thead>
                        <tbody>`;

            playerData.breakdown.forEach(item => {
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
                    <td style="text-align: center; font-size: 0.9em;">
                        <div>${Renderer.timeFormat(item.timeControl, item.timeClass)}</div>
                        <div style="margin-top: 4px;">${escapeHTML(variantName)} ${variantIcon}</div>
                        <div>${item.format}</div>
                    </td>
                    <td style="text-align: center; color: var(--green-400); font-weight: bold; font-size: 1.05em;">
                        ${escapeHTML(item.points)}
                    </td>
                </tr>`;
            });

            html += `</tbody>
                <tfoot>
                    <tr style="border-top: 2px solid var(--cyan-300); background-color: rgba(0, 255, 255, 0.05);">
                        <td style="font-weight: bold; color: var(--cyan-300);">TỔNG CỘNG THÁNG</td>
                        <td style="text-align: center; color: var(--blue-400);">${playerData.breakdown.length} giải</td>
                        <td style="text-align: center; color: var(--yellow-400); font-weight: bold; font-size: 1.15em;">
                            ${escapeHTML(playerData.totalPoints)}
                        </td>
                    </tr>
                </tfoot>
                </table>
                </div>`;

            const historyObj = PLAYER_TOP6_STORE.get(playerData.username.toLowerCase());
            if (historyObj && historyObj.finishes && historyObj.finishes.length > 0) {
                const sortedFinishes = [...historyObj.finishes].sort((a, b) => parseMonthTimestamp(b.monthId) - parseMonthTimestamp(a.monthId));

                html += `<div style="margin-top: 25px;">
                    <h4 style="color: var(--yellow-400); margin: 0 0 10px 0; font-size: 1.05em; display: flex; align-items: center; gap: 6px;">
                        <i class="bx bx-trophy"></i> Lịch sử lọt top 6 (${sortedFinishes.length} tháng)
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
                        <tbody>`;

                sortedFinishes.forEach(f => {
                    let monthStatusNote = '';
                    if (f.finishedCount < f.totalMonthTours || f.monthStatus === 'unfinished') {
                        monthStatusNote = `<div style="font-size: 0.8em; color: var(--yellow-400, #f59e0b); font-weight: 500; margin-top: 2px;">(Chưa hoàn thành)</div>`;
                    }

                    html += `<tr>
                        <td style="font-weight: 600; color: var(--neutral-100);">
                            Tháng ${f.monthId}
                            ${monthStatusNote}
                        </td>
                        <td style="text-align: center; font-weight: 600; font-size: 0.95em;">${getRankBadge(f.rank)}</td>
                        <td style="text-align: center; color: var(--neutral-300);">${f.tourCount}/${f.totalMonthTours} giải</td>
                        <td style="text-align: center; color: var(--yellow-400); font-weight: bold; font-size: 1.05em;">${f.totalPoints} ĐIỂM</td>
                    </tr>`;
                });

                html += `</tbody></table></div>`;
            }

            html += `</div>`;

            ModalManager.show(`Tổng kết kỳ thủ ${playerData.username}`, html);
        },

        handleMonthClick(monthElement, tournaments) {
            let html = `<div class="calendar-wrapper">
                <table class="styled-table score-detail-table">
                    <thead><tr><th>Vòng đấu</th><th>Thời gian bắt đầu</th><th>Thể lệ</th><th style="text-align: center;">Kỳ thủ</th></tr></thead>
                    <tbody>`;

            tournaments.forEach(tour => {
                const variantInfo = Renderer.variantInfo(tour.variant);
                let variantHtml = '';
                if (variantInfo) {
                    if (tour.setup) {
                        variantHtml = ` <a href="#" class="custom-variant-link" data-setup="${escapeHTML(tour.setup)}">${escapeHTML(variantInfo.name)}${createImg(variantInfo.icon)}</a>`;
                    } else {
                        variantHtml = ` <a href="${escapeHTML(safeHttpUrl(variantInfo.url))}" target="_blank" rel="noopener noreferrer">${escapeHTML(variantInfo.name)} ${createImg(variantInfo.icon)}</a>`;
                    }
                }

                const startTimeStr = formatDate(tour.startTime);
                const statusBadge = formatTourStatus(tour.status, tour.isFinished);
                html += `<tr>
                    <td>
                        <a href="${escapeHTML(safeHttpUrl(tour.url))}" target="_blank" rel="noopener noreferrer">${escapeHTML(tour.name)}</a>
                        <div style="margin-top: 4px;">${statusBadge}</div>
                    </td>
                    <td>${startTimeStr}</td>
                    <td>${Renderer.timeFormat(tour.timeControl, tour.timeClass)}<br>${variantHtml}<br>${tour.format}</td>
                    <td style="text-align: center;">${tour.playersCount}</td>
                </tr>`;
            });

            html += '</tbody></table></div>';
            ModalManager.show(`Chi tiết tháng ${monthElement.dataset.month}`, html);
        },

        handleCustomVariantClick(setup) {
            ModalManager.show('Thế cờ ban đầu', `<div class="calendar-wrapper" style="padding: 20px; color: var(--neutral-100); word-break: break-all;">${escapeHTML(setup)}</div>`);
        }
    };

    const PageManager = {
        async init() {
            const container = document.querySelector('[data-fetch-aggregated]');
            if (!container) return;

            const eventType = container.dataset.fetchAggregated || 'cttq';
            container.innerHTML = '<div class="loading">Đang xử lý dữ liệu...</div>';

            let text = await RequestManager.fetch(`${API.GIST}/${eventType}.txt`, false);
            if (!text) {
                text = await RequestManager.fetch(`${API.GIST}/${eventType}`, false);
            }

            let months = [];
            if (text?.includes('*')) {
                const parsed = DataProcessor.parseUnifiedFormat(text);
                months = parsed.months;
                DataProcessor.toursByMonth = parsed.toursByMonth;
            } else if (text) {
                months = text.split('\n').map(l => l.trim()).filter(l => l);
            }

            if (!months.length) {
                container.innerHTML = '<div class="error">Không tìm thấy dữ liệu.</div>';
                return;
            }

            container.innerHTML = "<div class=\"table\"><table class=\"styled-table\" id=\"tournament-results-table\"><thead><tr><th class=\"month-in4\">Tháng</th><th class=\"rules\">Thống kê</th><th class=\"players-count\">Kỳ thủ</th><th class=\"winner\">🥇 Hạng 1</th><th class=\"winner\">🥈 Hạng 2</th><th class=\"winner\">🥉 Hạng 3</th><th class=\"winner\">🎖️ Hạng 4</th><th class=\"winner\">🏅 Hạng 5</th><th class=\"winner\">⭐ Hạng 6</th></tr></thead><tbody id=\"tournament-tbody\"><tr class=\"not-match\" style=\"display: none\"><td colspan=\"9\" class=\"table-empty-state\">Không tìm thấy kết quả nào phù hợp.</td></tr></tbody></table></div>";

            if (typeof window.loadTournamentFiltersFromURL === 'function') {
                window.loadTournamentFiltersFromURL();
            }

            this.setupEventHandlers();
            this.loadMonthsData(months);
        },

        setupEventHandlers() {
            const modal = document.getElementById('scoreModal');
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target.id === 'scoreModal') {
                        ModalManager.close();
                    }
                    const customLink = e.target.closest('.custom-variant-link');
                    if (customLink) {
                        e.preventDefault();
                        EventHandlers.handleCustomVariantClick(customLink.dataset.setup);
                    }
                });
            }

            const tbody = document.getElementById('tournament-tbody');
            tbody.addEventListener('click', (e) => {
                const playerCell = e.target.closest('.clickable-player');
                if (playerCell) {
                    const playerData = JSON.parse(playerCell.dataset.player);
                    const avatar = playerCell.dataset.avatar;
                    const status = playerCell.dataset.status;
                    const monthId = playerCell.dataset.month;
                    EventHandlers.handlePlayerClick(playerData, avatar, status, monthId);
                    return;
                }

                const monthElement = e.target.closest('.month-clickable');
                if (monthElement) {
                    const tournaments = JSON.parse(monthElement.dataset.tournaments);
                    EventHandlers.handleMonthClick(monthElement, tournaments);
                }
            });
        },

        async loadMonthsData(months) {
            const tbody = document.getElementById('tournament-tbody');
            const skeletonRows = this.createSkeletonRows(months);
            const skeletonFragment = document.createDocumentFragment();
            skeletonRows.forEach(row => skeletonFragment.appendChild(row));
            tbody.appendChild(skeletonFragment);

            // Month dates are known up front, so the visible slots can be sorted immediately.
            if (typeof window.sortTournamentRows === 'function') {
                window.sortTournamentRows();
            }

            let successCount = 0;
            const eventType = document.querySelector('[data-fetch-aggregated]').dataset.fetchAggregated || 'cttq';

            await Promise.allSettled(months.map(async (monthId, idx) => {
                try {
                    const aggregation = await DataProcessor.getMonthlyAggregation(monthId, eventType);
                    const html = await Renderer.monthRow(monthId, aggregation);
                    const tempContainer = document.createElement('tbody');
                    tempContainer.innerHTML = html;
                    const newRow = tempContainer.firstElementChild;

                    const { playerScores, tournaments, status } = aggregation;

                    const [monthNum, year] = monthId.split('-').map(Number);
                    const timestamp = new Date(year, monthNum - 1, 1).getTime();

                    newRow.setAttribute('data-start-time', timestamp);
                    newRow.setAttribute('data-sort-order', String(idx));
                    newRow.setAttribute('data-players-count', Object.keys(playerScores).length);
                    newRow.setAttribute('data-tours-count', tournaments.length);
                    newRow.setAttribute('data-status', status || 'finished');

                    newRow.classList.add('results-row-enter');
                    skeletonRows[idx].replaceWith(newRow);
                    successCount++;
                    const currentTournament = document.getElementById('current-tournament');
                    if (currentTournament) {
                        currentTournament.textContent = `${successCount}/${months.length}`;
                    }

                    if (typeof window.searchTable === 'function') {
                        window.searchTable();
                    }

                    // Give the completed month a chance to paint before fetching its avatars.
                    requestAnimationFrame(() => requestAnimationFrame(() => {
                        Renderer.loadMonthAvatars(newRow).catch(error => {
                            console.error('Error loading player avatars for month:', monthId, error);
                        });
                    }));
                } catch (e) {
                    console.error('Error loading month:', monthId, e);

                    // A failed month is no longer an endless skeleton or an unknown sort key.
                    const failedRow = skeletonRows[idx];
                    if (failedRow) {
                        failedRow.setAttribute('data-players-count', '0');
                        failedRow.setAttribute('data-tours-count', '0');
                        failedRow.classList.remove('skeleton-row');
                        failedRow.classList.add('results-row-error');
                        failedRow.innerHTML = `<td colspan="${3 + CONFIG.TOP_PLAYERS}" class="table-empty-state">Không thể tải dữ liệu tháng ${escapeHTML(monthId)}.</td>`;
                    }
                    if (typeof window.searchTable === 'function') {
                        window.searchTable();
                    }
                }
            }));

            if (typeof window.searchTable === 'function') {
                window.searchTable();
            }

            this.updateStatus(successCount, months.length);
        },

        createSkeletonRows(months) {
            return months.map((monthId, index) => {
                const tr = document.createElement('tr');
                tr.className = 'skeleton-row';
                const [monthNum, year] = monthId.split('-').map(Number);
                const timestamp = Number.isFinite(monthNum) && Number.isFinite(year)
                    ? new Date(year, monthNum - 1, 1).getTime()
                    : 0;
                tr.setAttribute('data-start-time', String(timestamp));
                tr.setAttribute('data-sort-order', String(index));
                let html = `
                    <td><div class="skeleton skeleton-text" style="width: 80%;"></div></td>
                    <td><div class="skeleton skeleton-text" style="width: 60%;"></div></td>
                    <td><div class="skeleton skeleton-text" style="width: 30px; margin: auto;"></div></td>`;

                html += Array.from({ length: CONFIG.TOP_PLAYERS }, () => `
                    <td>
                        <div class="post-user-component">
                            <div class="skeleton skeleton-avatar"></div>
                            <div class="post-user-details">
                                <div class="skeleton skeleton-text" style="width: 70px;"></div>
                                <div class="skeleton skeleton-text" style="width: 40px;"></div>
                            </div>
                        </div>
                    </td>`
                ).join('');

                tr.innerHTML = html;
                return tr;
            });
        },

        updateStatus(successCount, totalCount) {
            const statusIcon = document.getElementById('statusIcon');
            const isComplete = successCount === totalCount;
            if (!statusIcon) return;
            statusIcon.style.color = isComplete ? 'var(--primary-success)' : 'var(--color-danger)';
            statusIcon.className = isComplete ? 'bx bx-check' : 'bx bx-x';
        }
    };

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', () => PageManager.init());
    } else {
        PageManager.init();
    }

    window.TournamentModalManager = ModalManager;
})();