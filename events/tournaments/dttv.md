---
layout: event
title: Bảng tổng giải Đấu Trường Thí Vua
---

<header>
    <h1 class="page-title">Các kỳ thủ đạt giải Đấu Trường Thí Vua</h1>
    <p class="page-decription">Tổng hợp kỳ thủ và thứ hạng đạt được qua những kỳ giải đã tổ chức.</p>
</header>

<ul class="nav-tabs">
    <li><a href="tvlt">Thí Vua Lấy Tốt</a></li>
    <li><a href="cttq">Chiến Trường Thí Quân</a></li>
    <li><a href="cbtt">Cờ Bí Thí Tốt</a></li>
    <li><a href="dttv" class="active">Đấu Trường Thí Vua</a></li>
</ul>

<div class="tournament-page-context">
    <div class="tournament-page-context__item">
        <span class="tournament-page-context__icon" aria-hidden="true"><i class="bx bx-user-check"></i></span>
        <div class="tournament-page-context__body">
            <span class="tournament-page-context__label">Người phụ trách</span>
            <div class="tournament-page-context__details">
                <a href="/leaders#admin2">FR-CH_TheClanTeamIsMine</a>
                <span>phụ trách giải đấu này.</span>
            </div>
        </div>
    </div>
    <div class="tournament-page-context__item">
        <span class="tournament-page-context__icon" aria-hidden="true"><i class="bx bx-message-rounded-dots"></i></span>
        <div class="tournament-page-context__body">
            <span class="tournament-page-context__label">Góp ý và hỗ trợ</span>
            <div class="tournament-page-context__details">
                <span>Bạn có thể</span>
                <a href="https://chess.com/clubs/forum/view/danh-sach-cac-giai-da-to-chuc-clb-tvlt?clubId=325849&amp;quote_id=131524731&amp;page=1#comment_box" target="_blank" rel="noopener noreferrer">gửi góp ý trên diễn đàn của câu lạc bộ</a>
                <span>hoặc liên hệ</span>
                <a href="/leaders#admin3">quản trị viên M-DinhHoangViet</a><span>.</span>
            </div>
        </div>
    </div>
</div>
<div class="filter-group-container" style="margin-bottom: 25px;">
<div class="tour-top-grid">
<div class="tour-dropdown" id="tournament-speed-dropdown"><div class="tour-dropdown-btn" onclick="toggleTourDropdown('tournament-speed-dropdown')"><div class="tour-dropdown-btn-content"><i class="bx bx-time"></i><span>Thể lệ</span></div><span class="bx bx-chevron-down tour-dropdown-arrow"></span></div><div class="tour-dropdown-menu" id="timeclass-checkbox-group">
<label class="custom-checkbox-container"><input type="checkbox" value="bullet" checked onchange="searchTable()"><span class="checkmark"></span> Bullet (Cờ Siêu chớp)</label>
<label class="custom-checkbox-container"><input type="checkbox" value="blitz" checked onchange="searchTable()"><span class="checkmark"></span> Blitz (Cờ chớp)</label>
<label class="custom-checkbox-container"><input type="checkbox" value="rapid" checked onchange="searchTable()"><span class="checkmark"></span> Rapid (Cờ Nhanh)</label></div></div>
<div class="tour-dropdown" id="tournament-variant-dropdown"><div class="tour-dropdown-btn" onclick="toggleTourDropdown('tournament-variant-dropdown')"><div class="tour-dropdown-btn-content"><i class="bx bxs-chess"></i><span>Biến thể</span></div><span class="bx bx-chevron-down tour-dropdown-arrow"></span></div><div class="tour-dropdown-menu" id="variant-checkbox-group">
<label class="custom-checkbox-container"><input type="checkbox" value="standard" checked onchange="searchTable()"><span class="checkmark"></span> Cờ tiêu chuẩn</label>
<label class="custom-checkbox-container"><input type="checkbox" value="chess960" checked onchange="searchTable()"><span class="checkmark"></span> Chess960</label>
<label class="custom-checkbox-container"><input type="checkbox" value="crazyhouse" checked onchange="searchTable()"><span class="checkmark"></span> Crazyhouse</label>
<label class="custom-checkbox-container"><input type="checkbox" value="bughouse" checked onchange="searchTable()"><span class="checkmark"></span> Bughouse</label>
<label class="custom-checkbox-container"><input type="checkbox" value="kingofthehill" checked onchange="searchTable()"><span class="checkmark"></span> King of the hill</label>
<label class="custom-checkbox-container"><input type="checkbox" value="threecheck" checked onchange="searchTable()"><span class="checkmark"></span> 3 Chiếu</label>
<label class="custom-checkbox-container"><input type="checkbox" value="custom" checked onchange="searchTable()"><span class="checkmark"></span> Custom Position</label></div></div>
<div class="tour-dropdown" id="tournament-format-dropdown"><div class="tour-dropdown-btn" onclick="toggleTourDropdown('tournament-format-dropdown')"><div class="tour-dropdown-btn-content"><i class="bx bx-medal"></i><span>Thể thức</span></div><span class="bx bx-chevron-down tour-dropdown-arrow"></span></div><div class="tour-dropdown-menu" id="format-checkbox-group">
<label class="custom-checkbox-container"><input type="checkbox" value="swiss" checked onchange="searchTable()"><span class="checkmark"></span> Hệ Thụy Sĩ (Swiss)</label>
<label class="custom-checkbox-container"><input type="checkbox" value="arena" checked onchange="searchTable()"><span class="checkmark"></span> Đấu trường Arena</label></div></div>
<div class="tour-select-container"><select id="sortFilter" class="tour-select-btn" onchange="searchTable()"><option value="date-desc">Ngày tổ chức (Gần đây nhất)</option><option value="date-asc">Ngày tổ chức (Lâu đời nhất)</option><option value="players-desc">Kỳ thủ tham gia (Nhiều nhất)</option><option value="players-asc">Kỳ thủ tham gia (Ít nhất)</option></select></div>
</div>
<div class="tour-search-row"><div class="tour-search-wrapper"><span class="bx bx-search tour-search-icon"></span><input type="text" id="searchInput" class="tour-search-input" placeholder="Tìm kiếm tên giải hoặc kỳ thủ..." onkeyup="searchTable()"></div>
<div class="tour-misc">
<div id="loading-status" class="loading-status-badge"><span id="statusIcon" class="bx bx-dots-horizontal-rounded" style="color:var(--primary-warning);font-size:large"></span><span id="current-tournament">0</span> giải</div></div></div>
</div>

<section class="tournament-results-section">
    <div id="tournament-table" data-fetch-tournament="dttv"></div>
</section>
