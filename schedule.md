---
layout: default
title: Lịch sự kiện của tháng
schedule_css: /css/schedule.css
---

<details class="schedule-guide">
    <summary><i class="bx bx-info-circle" aria-hidden="true"></i> Hướng dẫn sử dụng lịch</summary>
    <section class="schedule-intro" aria-label="Hướng dẫn sử dụng lịch">
    <p class="schedule-intro-title"><i class="bx bx-info-circle" aria-hidden="true"></i> Tìm giải nhanh, rồi chọn một sự kiện để xem chi tiết và tham gia.</p>
    <ul>
        <li>Nhấn vào các icon để biết thêm thông tin về sự kiện đó.</li>
        <li>Lịch được cập nhật thường xuyên; các mục <strong>Dự kiến</strong> có thể thay đổi.</li>
        <li>Dùng ô tìm kiếm, bộ lọc thể loại hoặc nút <strong>Chỉ có thưởng</strong> để thu hẹp kết quả.</li>
    </ul>
    <p class="schedule-updated"><i class="bx bx-refresh" aria-hidden="true"></i> Lần cập nhật gần nhất: <span id="last-updated">Đang tải…</span>. Nếu có vấn đề, hãy bình luận trong <a href="https://chess.com/clubs/forum/view/lich-su-kien-hang-thang-clb-tvlt?clubId=325849&quote_id=125015758&page=1#comment_box" target="_blank" rel="noopener">forum</a> hoặc liên hệ <a href="/leaders#admin3">M-DinhHoangViet</a>.</p>
</section>
</details>
<section id="next-match-spotlight" class="next-match-spotlight" aria-live="polite" hidden>
    <div class="next-match-content">
        <span class="next-match-kicker"><i class="bx bx-broadcast" aria-hidden="true"></i> TÂM ĐIỂM SẮP DIỄN RA</span>
        <h2 id="next-match-title">Đang tìm giải đấu tiếp theo…</h2>
        <p id="next-match-meta" class="next-match-meta"></p>
        <div class="next-match-countdown-wrap"><span>Thời gian bắt đầu còn</span><strong id="next-match-countdown">--:--:--</strong></div>
    </div>
    <div class="next-match-actions">
        <a id="next-match-join" class="next-match-join" href="#" target="_blank" rel="noopener noreferrer" hidden><i class="bx bx-log-in-circle" aria-hidden="true"></i> Vào phòng đấu</a>
        <button id="next-match-detail" type="button" class="next-match-detail"><i class="bx bx-info-circle" aria-hidden="true"></i> Chi tiết</button>
    </div>
</section>
<div id="schedule-status-filters" class="schedule-status-filters" role="group" aria-label="Lọc theo trạng thái">
    <button type="button" data-status="all" class="active" aria-pressed="true">Tất cả</button>
    <button type="button" data-status="upcoming" aria-pressed="false">Sắp diễn ra</button>
    <button type="button" data-status="ongoing" aria-pressed="false">Đang diễn ra</button>
    <button type="button" data-status="ended" aria-pressed="false">Đã kết thúc</button>
</div>
<div id="schedule-filters" class="schedule-control-bar" style="display: inline-flex;">
    <!-- Left: Search input -->
    <div class="control-item search-wrapper">
        <span class="bx bx-search search-icon"></span>
        <input type="search" id="schedule-search" class="control-input search-input" placeholder="Tìm tên giải đấu..." aria-label="Tìm kiếm sự kiện">
    </div>
    <!-- Right: Controls group (Dropdown, Switch, Segmented Switcher) -->
    <div class="control-group">
        <div class="tour-dropdown" id="schedule-category-dropdown">
            <button type="button" class="tour-dropdown-btn compact-btn" id="schedule-category-button" aria-expanded="false" aria-controls="schedule-type-group">
                <div class="tour-dropdown-btn-content">
                    <i class="bx bx-filter-alt"></i>
                    <span>Thể loại (9/9)</span>
                </div>
                <span class="bx bx-chevron-down tour-dropdown-arrow"></span>
            </button>
            <div class="tour-dropdown-menu" id="schedule-type-group" aria-label="Lọc theo thể loại">
                <label class="custom-checkbox-container">
                    <input type="checkbox" value="tvlt" checked>
                    <span class="checkmark"></span> Thí Vua Lấy Tốt
                </label>
                <label class="custom-checkbox-container">
                    <input type="checkbox" value="cttq" checked>
                    <span class="checkmark"></span> Chiến Trường Thí Quân
                </label>
                <label class="custom-checkbox-container">
                    <input type="checkbox" value="cbtt" checked>
                    <span class="checkmark"></span> Cờ Bí Thí Tốt
                </label>
                <label class="custom-checkbox-container">
                    <input type="checkbox" value="dttv" checked>
                    <span class="checkmark"></span> Đấu Trường Thí Vua
                </label>
                <label class="custom-checkbox-container">
                    <input type="checkbox" value="multi-club-arena" checked>
                    <span class="checkmark"></span> Đấu trường đa CLB (Multi-Club Arena)
                </label>
                <label class="custom-checkbox-container">
                    <input type="checkbox" value="club-arena" checked>
                    <span class="checkmark"></span> Đấu trường Arena
                </label>
                <label class="custom-checkbox-container">
                    <input type="checkbox" value="swiss" checked>
                    <span class="checkmark"></span> Hệ Thụy Sĩ (Swiss)
                </label>
                <label class="custom-checkbox-container">
                    <input type="checkbox" value="vote" checked>
                    <span class="checkmark"></span> Cờ vua bỏ phiếu (Votechess)
                </label>
                <label class="custom-checkbox-container">
                    <input type="checkbox" value="daily" checked>
                    <span class="checkmark"></span> Cờ hàng ngày (Daily)
                </label>
            </div>
        </div>
        <label class="compact-switch-container">
            <span class="compact-switch">
                <input type="checkbox" id="schedule-prize-filter">
                <span class="compact-slider"></span>
            </span>
            <span class="switch-label">Chỉ có thưởng</span>
        </label>
        <button type="button" id="schedule-reset-filters" class="reset-filters-btn" hidden><i class="bx bx-reset" aria-hidden="true"></i> Xóa lọc</button>
        <div id="view-switcher-container" class="segmented-control" style="display: none;">
            <button type="button" id="btn-view-calendar" class="segment-btn" title="Xem dạng lịch" aria-pressed="false">
                <i class="bx bx-calendar"></i>
                <span>Lịch</span>
            </button>
            <button type="button" id="btn-view-list" class="segment-btn" title="Xem dạng danh sách" aria-pressed="false">
                <i class="bx bx-list-ul"></i>
                <span>Danh sách</span>
            </button>
        </div>
    </div>
</div>

<div class="month-nav-wrapper">
    <button type="button" class="month-nav-btn" id="btn-prev-month" title="Tháng trước" aria-label="Xem tháng trước">
        <i class="bx bx-chevron-left"></i>
    </button>
    <button type="button" class="month-nav-today" id="btn-today" title="Quay về tháng và ngày hiện tại"><i class="bx bx-calendar-check" aria-hidden="true"></i> Hôm nay</button>
    <div class="month-title" id="month-title" aria-live="polite">Đang tải…</div>
    <button type="button" class="month-nav-btn" id="btn-next-month" title="Tháng sau" aria-label="Xem tháng sau">
        <i class="bx bx-chevron-right"></i>
    </button>
</div>
<div id="loading" class="loading" role="status" aria-live="polite">
    <span class="schedule-skeleton-label">Đang tải dữ liệu lịch sự kiện…</span>
    <div class="schedule-skeleton" aria-hidden="true">
        <div class="schedule-skeleton-weekdays"><span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span></div>
        <div class="schedule-skeleton-grid"><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span></div>
    </div>
</div>

<div id="calendar-wrapper" style="display: none;">
    <table id="calendar-table">
        <thead>
            <tr>
                <th scope="col" title="Thứ Hai">Thứ 2</th>
                <th scope="col" title="Thứ Ba">Thứ 3</th>
                <th scope="col" title="Thứ Tư">Thứ 4</th>
                <th scope="col" title="Thứ Năm">Thứ 5</th>
                <th scope="col" title="Thứ Sáu">Thứ 6</th>
                <th scope="col" title="Thứ Bảy">Thứ 7</th>
                <th scope="col" title="Chủ Nhật">Chủ nhật</th>
            </tr>
        </thead>
        <tbody id="calendar-body">
        </tbody>
    </table>
</div>
<section id="schedule-day-panel" class="schedule-day-panel" aria-live="polite" hidden>
    <div class="schedule-day-panel-header">
        <h2 id="schedule-day-panel-title">Sự kiện trong ngày</h2>
        <button type="button" id="schedule-day-panel-close" aria-label="Đóng danh sách ngày"><i class="bx bx-x" aria-hidden="true"></i></button>
    </div>
    <div id="schedule-day-panel-events" class="schedule-day-panel-events"></div>
</section>

<!-- List View Container -->
<div id="list-wrapper" style="display: none;">
    <div id="list-container" class="events-list-grid"></div>
</div>

<p id="schedule-results-summary" class="schedule-results-summary" aria-live="polite"></p>
<div id="error" style="display: none;" role="alert"></div>
<div id="empty" style="display: none;" class="empty-message">
    <i class="bx bx-calendar" style="color: #00f2ff; font-size: 2em; margin-bottom: 10px;"></i>
    <p>Không có giải đấu trong tháng này</p>
</div>
<br>

<div>
    <a href="/events/tvlt-thi-vua-lay-tot" style="display: block" target="_top"><img src="/images/tvltlogo.png" alt="TVLT" title="Thí Vua Lấy Tốt" class="inl-bl">: <b>Siêu giải Thí Vua Lấy Tốt</b></a><br>
    <a href="/events/cttq-chien-truong-thi-quan" style="display: block" target="_top"><img src="/images/events/logo/cttq.png" alt="CTTQ" title="Chiến Trường Thí Quân" class="inl-bl">: <b>Sự kiện Chiến Trường Thí Quân</b></a><br>
    <a href="/events/cbtt-co-bi-thi-tot" style="display: block" target="_top"><img src="/images/events/logo/cbtt-swiss.png" alt="CBTT Swiss" title="Cờ Bí Thí Tốt Swiss" class="inl-bl"><img src="/images/events/logo/cbtt-arena.png" title="Cờ Bí Thí Tốt Arena" alt="CBTT Arena" class="inl-bl">: <b>Giải đấu Cờ Bí Thí Tốt</b></a><br>
    <a href="https://chess.com/clubs/events/thi-vua-lay-tot-tungjohn-playing-chess?clubId=325849&ref_id=89365835" target="_blank" style="display: block"><img src="https://chess.com/bundles/web/images/color-icons/time-daily.a2f7bbb6.svg" title="Daily Chess Matches" class="inl-bl"><img src="https://chess.com/bundles/web/images/color-icons/tournaments.3a561883.svg" title="Giải đấu hệ Thụy Sĩ (Swiss tournament)" class="inl-bl"><img src="https://chess.com/bundles/web/images/color-icons/arena-club-multi.b56c9ae4.svg" title="Đấu trường đa câu lạc bộ (Multi-Club Arena)" class="inl-bl"><img src="https://chess.com/bundles/web/images/color-icons/clipboard-vote.svg" title="Cờ vua bỏ phiếu (Votechess)" class="inl-bl"><img src="https://chess.com/bundles/web/images/color-icons/arena-club.495ffa75.svg" title="Giải đấu Đấu trường (Arena)" class="inl-bl">: <b>Các thể loại giải đấu khác</b></a>
</div>
<!-- Modal -->
<div id="eventModal" class="cc-modal-overlay" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="modal-name">
    <div class="cc-modal-dialog" role="document" tabindex="-1">
        <div class="cc-modal-banner-section">
            <img id="modal-banner" src="/" alt="Banner">
        </div>
        <button class="cc-modal-close" onclick="closeModal()" aria-label="Đóng cửa sổ">×</button>
        <div class="cc-modal-content-wrapper">
            <div class="cc-modal-header-row">
                <div class="cc-modal-logo-box">
                    <a id="modal-logo-link" href="#" target="_blank" title="Xem trang thể lệ của giải đấu">
                        <img src="/images/tvltlogo.png" alt="Logo" id="modal-logo">
                    </a>
                </div>
                <div class="cc-modal-title-section" style="flex: 1;">
                    <div class="cc-modal-category" id="modal-category"></div>
                    <h2 id="modal-name"></h2>
                </div>
            </div>
            <div class="cc-modal-info-section">
                <div class="cc-modal-info-item">
                    <div>
                        <strong><span class="bx bx-grid-alt"></span> Kiểu giải đấu:</strong>
                        <span id="modal-event-rules"></span>
                    </div>
                </div>
                <div class="cc-modal-info-item">
                    <div>
                        <strong><span class="bx bxs-chess"></span> Thể thức ván đấu:</strong>
                        <span id="modal-game-rules"></span>
                    </div>
                </div>
                <div class="cc-modal-info-item">
                    <div>
                        <strong><span class="bx bx-calendar"></span> Thời gian bắt đầu:</strong>
                        <span id="modal-time"></span>
                    </div>
                </div>
                <div class="cc-modal-info-item">
                    <div>
                        <strong><span class="bx bxs-user-check"></span> Tổ chức bởi:</strong>
                        <span id="modal-organizer"></span>
                    </div>
                </div>
            </div>
        </div>
        <div class="btn-group">
            <a id="modal-join" href="#" target="_blank"><button class="btn btn-primary" type="button"><span class="bx bx-user-plus"></span> Tham gia</button></a>
            <a id="modal-rule" href="#" target="_blank"><button class="btn btn-secondary" type="button"><span class="bx bx-task"></span> Thể lệ</button></a>
            <a id="modal-results" href="#" target="_blank"><button class="btn btn-secondary" type="button"><span class="bx bx-trophy"></span> Kết quả</button></a>
        </div>
    </div>
</div>

<script src="/js/schedule.js"></script>
