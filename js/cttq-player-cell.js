(function() {
    const API = 'https://api.chess.com/pub/player/';
    const DEFAULT_AVATAR = 'https://www.chess.com/bundles/web/images/user-image.007dad08.svg';

    const escapeHtml = value => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const statusText = {
        'closed:abuse': 'Bị khóa: Lạm dụng',
        'closed:fair_play_violations': 'Bị khóa: Fair Play',
        closed: 'Bị khóa',
        premium: 'Premium',
        titled: 'Kỳ thủ có danh hiệu'
    };

    async function getPlayer(username) {
        try {
            const response = await fetch(`${API}${encodeURIComponent(username)}`);
            return response.ok ? await response.json() : null;
        } catch (error) {
            console.error('Không thể tải thông tin kỳ thủ:', error);
            return null;
        }
    }

    function renderStatus(status) {
        if (!status || status === 'basic') return '';
        const text = statusText[status] || status;
        const icon = status === 'closed:fair_play_violations' ? 'bx-block' : status.startsWith('closed') ? 'bx-no-signal' : 'bx-check-circle';
        const className = status.startsWith('closed') ? 'user-badges-closed' : status === 'premium' ? 'user-badges-premium' : 'user-badges-inactive';
        return `<div class="user-badges-component"><div class="user-badges-badge ${className}"><span class="bx ${icon}"></span><span>${escapeHtml(text)}</span></div></div>`;
    }

    function ratingRows(player) {
        const ratings = [
            ['Bullet', player.chess_bullet],
            ['Blitz', player.chess_blitz],
            ['Rapid', player.chess_rapid],
            ['Daily', player.chess_daily]
        ].filter(([, data]) => data?.last?.rating);

        if (!ratings.length) return '';
        return `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:14px;">${ratings.map(([name, data]) => `
            <div style="padding:10px;border-radius:8px;background:rgba(255,255,255,.04);text-align:center;">
                <div style="font-size:.8em;opacity:.7;">${name}</div>
                <strong>${data.last.rating}</strong>
            </div>`).join('')}</div>`;
    }

    async function showPlayerInfo(playerData) {
        const username = playerData?.username;
        if (!username || !window.TournamentModalManager) return;

        const player = await getPlayer(username);
        const data = player || {};
        const avatar = data.avatar || DEFAULT_AVATAR;
        const displayName = data.name || data.username || username;
        const profile = `https://www.chess.com/member/${encodeURIComponent(data.username || username)}`;
        const points = Number(playerData.totalPoints || 0);
        const tournaments = Array.isArray(playerData.breakdown) ? playerData.breakdown : [];
        const details = [
            data.username ? `<div><strong>Username:</strong> ${escapeHtml(data.username)}</div>` : '',
            data.title ? `<div><strong>Danh hiệu:</strong> ${escapeHtml(data.title)}</div>` : '',
            data.country ? `<div><strong>Quốc gia:</strong> ${escapeHtml(data.country.split('/').pop())}</div>` : '',
            Number.isFinite(data.followers) ? `<div><strong>Người theo dõi:</strong> ${data.followers.toLocaleString('vi-VN')}</div>` : ''
        ].filter(Boolean).join('');

        const breakdown = tournaments.length ? `
            <details style="margin-top:16px;">
                <summary style="cursor:pointer;">Kết quả các giải trong tháng</summary>
                <div style="margin-top:10px;display:grid;gap:6px;">${tournaments.map(item => `
                    <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
                        <a href="${escapeHtml(item.url || '#')}" target="_blank" rel="noopener">${escapeHtml(item.tourName)}</a>
                        <strong>${item.points}</strong>
                    </div>`).join('')}</div>
            </details>` : '';

        const html = `<div style="max-width:620px;margin:auto;">
            <div style="display:flex;gap:16px;align-items:center;">
                <img src="${escapeHtml(avatar)}" width="72" height="72" alt="${escapeHtml(displayName)}" style="border-radius:50%;object-fit:cover;">
                <div style="min-width:0;">
                    <h3 style="margin:0 0 4px;">${escapeHtml(displayName)}</h3>
                    <div style="opacity:.7;">@${escapeHtml(data.username || username)}</div>
                    ${renderStatus(data.status)}
                </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:18px;">
                <div style="padding:12px;border-radius:8px;background:rgba(255,255,255,.04);"><div style="font-size:.8em;opacity:.7;">Điểm CTTQ</div><strong style="font-size:1.25em;">${points}</strong></div>
                <div style="padding:12px;border-radius:8px;background:rgba(255,255,255,.04);"><div style="font-size:.8em;opacity:.7;">Số giải tham gia</div><strong style="font-size:1.25em;">${tournaments.length}</strong></div>
            </div>
            ${details ? `<div style="display:grid;gap:6px;margin-top:16px;">${details}</div>` : ''}
            ${ratingRows(data)}
            ${breakdown}
            <div style="margin-top:18px;text-align:center;"><a href="${profile}" target="_blank" rel="noopener">Xem hồ sơ Chess.com ↗</a></div>
        </div>`;

        window.TournamentModalManager.show(`Thông tin kỳ thủ: ${data.username || username}`, html);
    }

    function setup() {
        const tbody = document.getElementById('tournament-tbody');
        if (!tbody || tbody.dataset.playerCellInfoReady) return;
        tbody.dataset.playerCellInfoReady = 'true';

        tbody.addEventListener('click', event => {
            const cell = event.target.closest('td:has(.post-user-component)');
            if (!cell || !tbody.contains(cell)) return;

            const scorePill = cell.querySelector('.score-pill');
            if (!scorePill) return;

            event.preventDefault();
            event.stopImmediatePropagation();

            try {
                showPlayerInfo(JSON.parse(scorePill.dataset.player));
            } catch (error) {
                console.error('Dữ liệu kỳ thủ không hợp lệ:', error);
            }
        }, true);
    }

    const observer = new MutationObserver(setup);
    observer.observe(document.body, { childList: true, subtree: true });
    setup();
})();
