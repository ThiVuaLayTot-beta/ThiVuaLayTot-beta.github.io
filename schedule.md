---
layout: default
title: Lịch sự kiện của tháng
schedule_css: /css/schedule.css
---

<div class="schedule-intro-row">
    <p class="schedule-updated">
        <i class="bx bx-refresh" aria-hidden="true"></i>
        Cập nhật dữ liệu: <strong id="last-updated">Đang tải…</strong>
        <span class="schedule-updated-separator">·</span>
        Có thắc mắc? Trao đổi trên <a href="https://chess.com/clubs/forum/view/lich-su-kien-hang-thang-clb-tvlt?clubId=325849&quote_id=125015758&page=1#comment_box" target="_blank" rel="noopener noreferrer">forum</a>
        hoặc liên hệ <a href="/leaders#admin3">M-DinhHoangViet</a>.
    </p>
    <details class="schedule-guide">
        <summary><i class="bx bx-info-circle" aria-hidden="true"></i> Hướng dẫn sử dụng</summary>
        <section class="schedule-intro" aria-label="Hướng dẫn sử dụng lịch">
            <p class="schedule-intro-title">Tìm giải nhanh, rồi chọn một sự kiện để xem chi tiết và tham gia.</p>
            <ul>
                <li>Chọn biểu tượng giải đấu trên lịch hoặc nút <strong>Chi tiết</strong> trong danh sách.</li>
                <li>Các mục <strong>Dự kiến</strong> có thể thay đổi về ngày, giờ hoặc thể lệ.</li>
                <li>Dùng tìm kiếm, bộ lọc trạng thái, thể loại và giải thưởng để thu hẹp kết quả.</li>
            </ul>
        </section>
    </details>
</div>

<section id="next-match-spotlight" class="next-match-spotlight" aria-live="off" hidden>
    <div class="next-match-main">
        <div class="next-match-eyebrow">
            <span class="next-match-kicker"><i class="bx bx-broadcast" aria-hidden="true"></i> TÂM ĐIỂM SẮP DIỄN RA</span>
            <span id="next-match-priority" class="next-match-priority" hidden></span>
        </div>
        <h2 id="next-match-title">Đang tìm giải đấu tiếp theo…</h2>
        <p id="next-match-meta" class="next-match-meta"></p>
    </div>
    <div class="next-match-aside">
        <div class="next-match-countdown-wrap">
            <span>Thời gian bắt đầu còn</span>
            <strong id="next-match-countdown">--:--:--</strong>
        </div>
        <div class="next-match-actions">
            <a id="next-match-join" class="next-match-join" href="#" target="_blank" rel="noopener noreferrer" hidden><i class="bx bx-log-in-circle" aria-hidden="true"></i> Vào phòng đấu</a>
            <button id="next-match-detail" type="button" class="next-match-detail"><i class="bx bx-info-circle" aria-hidden="true"></i> Chi tiết</button>
        </div>
    </div>
</section>

<section class="schedule-explorer" aria-labelledby="schedule-explorer-title">
    <header class="schedule-explorer-header" aria-labelledby="schedule-explorer-title">
        <div class="schedule-explorer-top">
            <div class="schedule-explorer-copy">
                <span class="schedule-section-kicker">LỊCH SỰ KIỆN</span>
                <h2 id="schedule-explorer-title">Lịch thi đấu</h2>
                <p>Theo dõi lịch, tìm giải phù hợp và truy cập nhanh thông tin sự kiện.</p>
            </div>

            <div class="schedule-explorer-tools">
                <div class="month-nav-wrapper" role="group" aria-label="Điều hướng lịch theo tháng">
                    <button type="button" class="month-nav-btn" id="btn-prev-month" title="Tháng trước" aria-label="Xem tháng trước">
                        <i class="bx bx-chevron-left" aria-hidden="true"></i>
                    </button>
                    <div class="month-display" aria-live="polite">
                        <span class="month-display-label">ĐANG XEM</span>
                        <div class="month-display-value">
                            <span class="month-title" id="month-title">Đang tải…</span>
                            <span class="month-year" id="month-year"></span>
                        </div>
                    </div>
                    <button type="button" class="month-nav-btn" id="btn-next-month" title="Tháng sau" aria-label="Xem tháng sau">
                        <i class="bx bx-chevron-right" aria-hidden="true"></i>
                    </button>
                </div>
                <div id="view-switcher-container" class="segmented-control" style="display: none;" role="group" aria-label="Kiểu hiển thị">
                    <button type="button" id="btn-view-calendar" class="segment-btn" title="Xem dạng lịch" aria-pressed="false">
                        <i class="bx bx-calendar" aria-hidden="true"></i><span>Lịch</span>
                    </button>
                    <button type="button" id="btn-view-list" class="segment-btn" title="Xem dạng danh sách" aria-pressed="false">
                        <i class="bx bx-list-ul" aria-hidden="true"></i><span>Danh sách</span>
                    </button>
                </div>
            </div>
        </div>

        <div class="schedule-filter-panel" role="search" aria-label="Tìm kiếm và lọc sự kiện">
            <div class="schedule-filter-panel-header">
                <div class="schedule-filter-panel-title">
                    <span class="schedule-filter-overline">KHÁM PHÁ SỰ KIỆN</span>
                    <h3>Tìm giải đấu phù hợp</h3>
                </div>
                <p class="schedule-filter-hint"><i class="bx bx-info-circle" aria-hidden="true"></i> Kết hợp các tiêu chí để tìm nhanh sự kiện phù hợp.</p>
            </div>

            <div id="schedule-filters" class="schedule-filter-controls" style="display: none;">
                <div class="schedule-filter-primary">
                    <label class="schedule-filter-field schedule-filter-search" for="schedule-search">
                        <span class="schedule-filter-field-label">Tìm kiếm</span>
                        <span class="schedule-filter-input-control">
                            <i class="bx bx-search" aria-hidden="true"></i>
                            <input type="search" id="schedule-search" class="control-input search-input" placeholder="Nhập tên giải đấu…" aria-label="Tìm kiếm sự kiện">
                        </span>
                    </label>

                    <label class="schedule-filter-field schedule-filter-status" for="schedule-status-filters">
                        <span class="schedule-filter-field-label">Trạng thái</span>
                        <span class="schedule-status-select-control">
                            <i class="bx bx-pulse" aria-hidden="true"></i>
                            <select id="schedule-status-filters" aria-label="Lọc sự kiện theo trạng thái">
                                <option value="all">Tất cả trạng thái</option>
                                <option value="upcoming">Sắp diễn ra</option>
                                <option value="ongoing">Đang diễn ra</option>
                                <option value="ended">Đã kết thúc</option>
                            </select>
                            <i class="bx bx-chevron-down" aria-hidden="true"></i>
                        </span>
                    </label>
                </div>

                <div class="schedule-filter-secondary">
                    <div class="schedule-filter-secondary-heading">
                        <span class="schedule-filter-secondary-title">Bộ lọc bổ sung</span>
                        <span class="schedule-filter-secondary-description">Thể loại và điều kiện giải thưởng</span>
                    </div>

                    <div class="schedule-filter-secondary-controls">
                        <div class="tour-dropdown" id="schedule-category-dropdown">
                            <button type="button" class="tour-dropdown-btn compact-btn" id="schedule-category-button" aria-expanded="false" aria-controls="schedule-type-group">
                                <span class="tour-dropdown-btn-content">
                                    <i class="bx bx-filter-alt" aria-hidden="true"></i>
                                    <span data-filter-label>Thể loại (9/9)</span>
                                </span>
                                <i class="bx bx-chevron-down tour-dropdown-arrow" aria-hidden="true"></i>
                            </button>
                            <div class="tour-dropdown-menu" id="schedule-type-group" aria-label="Lọc theo thể loại">
                                <label class="custom-checkbox-container"><input type="checkbox" value="tvlt" checked><span class="checkmark"></span> Thí Vua Lấy Tốt</label>
                                <label class="custom-checkbox-container"><input type="checkbox" value="cttq" checked><span class="checkmark"></span> Chiến Trường Thí Quân</label>
                                <label class="custom-checkbox-container"><input type="checkbox" value="cbtt" checked><span class="checkmark"></span> Cờ Bí Thí Tốt</label>
                                <label class="custom-checkbox-container"><input type="checkbox" value="dttv" checked><span class="checkmark"></span> Đấu Trường Thí Vua</label>
                                <label class="custom-checkbox-container"><input type="checkbox" value="multi-club-arena" checked><span class="checkmark"></span> Đấu trường đa CLB (Multi-Club Arena)</label>
                                <label class="custom-checkbox-container"><input type="checkbox" value="club-arena" checked><span class="checkmark"></span> Đấu trường Arena</label>
                                <label class="custom-checkbox-container"><input type="checkbox" value="swiss" checked><span class="checkmark"></span> Hệ Thụy Sĩ (Swiss)</label>
                                <label class="custom-checkbox-container"><input type="checkbox" value="vote" checked><span class="checkmark"></span> Cờ vua bỏ phiếu (Votechess)</label>
                                <label class="custom-checkbox-container"><input type="checkbox" value="daily" checked><span class="checkmark"></span> Cờ hàng ngày (Daily)</label>
                            </div>
                        </div>

                        <label class="compact-switch-container">
                            <span class="compact-switch">
                                <input type="checkbox" id="schedule-prize-filter">
                                <span class="compact-slider"></span>
                            </span>
                            <span class="switch-label">Chỉ có thưởng</span>
                        </label>

                        <button type="button" id="schedule-reset-filters" class="reset-filters-btn" hidden>
                            <i class="bx bx-reset" aria-hidden="true"></i> Xóa tất cả
                        </button>
                    </div>
                </div>
            </div>
        </div>    </header>

    <section class="schedule-results" aria-label="Kết quả lịch sự kiện">
        <div id="loading" class="loading" role="status" aria-live="polite">
            <span class="schedule-skeleton-label">Đang tải dữ liệu lịch sự kiện…</span>
            <div class="schedule-skeleton" aria-hidden="true">
                <div class="schedule-skeleton-weekdays"><span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span></div>
                <div class="schedule-skeleton-grid"><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span></div>
            </div>
        </div>
        <div id="calendar-wrapper" style="display: none;">
            <table id="calendar-table">
                <thead><tr>
                    <th scope="col" title="Thứ Hai">Thứ 2</th><th scope="col" title="Thứ Ba">Thứ 3</th><th scope="col" title="Thứ Tư">Thứ 4</th>
                    <th scope="col" title="Thứ Năm">Thứ 5</th><th scope="col" title="Thứ Sáu">Thứ 6</th><th scope="col" title="Thứ Bảy">Thứ 7</th><th scope="col" title="Chủ Nhật">Chủ nhật</th>
                </tr></thead>
                <tbody id="calendar-body"></tbody>
            </table>
        </div>
        <div id="list-wrapper" style="display: none;"><div id="list-container" class="events-list-grid"></div></div>
        <p id="schedule-results-summary" class="schedule-results-summary" aria-live="polite"></p>
        <div id="error" style="display: none;" role="alert"></div>
        <div id="empty" style="display: none;" class="empty-message">
            <i class="bx bx-calendar" aria-hidden="true" style="color: #00f2ff; font-size: 2em; margin-bottom: 10px;"></i>
            <p>Không có giải đấu trong tháng này</p>
        </div>
    </section>
</section>

<section class="schedule-system-links" aria-labelledby="schedule-system-links-title">
    <div class="schedule-system-links-heading">
        <span class="schedule-section-kicker">KHÁM PHÁ THÊM</span>
        <h2 id="schedule-system-links-title">Các hệ thống giải đấu</h2>
        <p>Tìm hiểu thể lệ và xem lại kết quả của từng hệ thống.</p>
    </div>
    <div class="schedule-system-links-grid">
        <a class="schedule-system-card" href="/events/tvlt-thi-vua-lay-tot"><img src="/images/tvltlogo.png" alt="" loading="lazy" decoding="async"><span><strong>Thí Vua Lấy Tốt</strong><small>Thể lệ & thông tin giải</small></span><i class="bx bx-chevron-right" aria-hidden="true"></i></a>
        <a class="schedule-system-card" href="/events/cttq-chien-truong-thi-quan"><img src="/images/events/logo/cttq.png" alt="" loading="lazy" decoding="async"><span><strong>Chiến Trường Thí Quân</strong><small>Thể lệ & thông tin giải</small></span><i class="bx bx-chevron-right" aria-hidden="true"></i></a>
        <a class="schedule-system-card" href="/events/cbtt-co-bi-thi-tot"><img src="/images/events/logo/cbtt-swiss.png" alt="" loading="lazy" decoding="async"><span><strong>Cờ Bí Thí Tốt</strong><small>Thể lệ & thông tin giải</small></span><i class="bx bx-chevron-right" aria-hidden="true"></i></a>
        <a class="schedule-system-card" href="https://chess.com/clubs/events/thi-vua-lay-tot-tungjohn-playing-chess?clubId=325849&ref_id=89365835" target="_blank" rel="noopener noreferrer"><img src="/images/lichesslogo.png" alt="" loading="lazy" decoding="async"><span><strong>Các thể loại khác</strong><small>Arena, Swiss, Daily, Votechess</small></span><i class="bx bx-link-external" aria-hidden="true"></i></a>
    </div>
</section>

<!-- Modal -->
<div id="eventModal" class="cc-modal-overlay" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="modal-name">
    <div class="cc-modal-dialog" role="document" tabindex="-1">
        <div class="cc-modal-banner-section">
            <img id="modal-banner" src="/" alt="Banner">
        </div>
        <button type="button" class="cc-modal-close" aria-label="Đóng cửa sổ">×</button>
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
            <a id="modal-join" href="#" target="_blank" class="btn btn-primary" rel="noopener noreferrer"><span class="bx bx-user-plus"></span> Tham gia</a>
            <a id="modal-rule" href="#" target="_blank" class="btn btn-secondary" rel="noopener noreferrer"><span class="bx bx-task"></span> Thể lệ</a>
            <a id="modal-results" href="#" target="_blank" class="btn btn-secondary" rel="noopener noreferrer"><span class="bx bx-trophy"></span> Kết quả</a>
        </div>
    </div>
</div>

<script src="/js/schedule.js"></script>
