---
layout: default
title: Lịch sự kiện của tháng
schedule_css: /css/schedule.css
---

<div class="schedule-intro-row">
    <details class="schedule-guide">
        <summary aria-controls="schedule-guide-panel">
            <span class="schedule-guide-summary-icon" aria-hidden="true"><i class="bx bx-bulb"></i></span>
            <span class="schedule-guide-summary-copy">
                <strong>Mẹo sử dụng lịch</strong>
                <small>4 thao tác giúp bạn tìm giải đấu nhanh hơn</small>
            </span>
            <i class="bx bx-chevron-down schedule-guide-chevron" aria-hidden="true"></i>
        </summary>
        <div class="schedule-guide-panel" id="schedule-guide-panel" aria-label="Hướng dẫn sử dụng lịch">
            <div class="schedule-guide-grid">
                <div class="schedule-guide-item">
                    <span class="schedule-guide-step">01</span>
                    <div><strong>Xem thông tin giải</strong><p>Chọn biểu tượng giải đấu để mở thông tin chi tiết và đường dẫn tham gia.</p></div>
                </div>
                <div class="schedule-guide-item">
                    <span class="schedule-guide-step">02</span>
                    <div><strong>Chú ý trạng thái</strong><p>Giải <b>Dự kiến</b> chưa chốt hoàn toàn; ngày, giờ hoặc thể lệ có thể được cập nhật.</p></div>
                </div>
                <div class="schedule-guide-item">
                    <span class="schedule-guide-step">03</span>
                    <div><strong>Lọc đúng giải cần tìm</strong><p>Dùng tìm kiếm, trạng thái, thể loại hoặc tùy chọn <b>Chỉ có thưởng</b> để thu hẹp kết quả.</p></div>
                </div>
                <div class="schedule-guide-item">
                    <span class="schedule-guide-step">04</span>
                    <div><strong>Đổi cách xem</strong><p>Chuyển giữa <b>Lịch</b> và <b>Timeline</b>; dùng mũi tên hoặc mở ô thả xuống tháng/năm để chọn nhanh thời gian cần xem.</p></div>
                </div>
            </div>
        </div>
    </details>
</div>


<section class="schedule-explorer" aria-label="Điều hướng lịch và bộ lọc sự kiện">
    <header class="schedule-explorer-header">
        <div class="schedule-explorer-top">
            <div class="schedule-toolbar schedule-explorer-tools" role="group" aria-label="Điều hướng và chế độ xem lịch">
                <div class="month-nav-wrapper" role="group" aria-label="Điều hướng lịch theo tháng">
                    <button type="button" class="month-nav-btn" id="btn-prev-month" title="Tháng trước" aria-label="Xem tháng trước">
                        <i class="bx bx-chevron-left" aria-hidden="true"></i>
                    </button>
                    <div class="month-display">
                        <div class="month-display-value">
                            <span class="month-title" id="month-title">
                                <button type="button" id="btn-month-select" class="month-box month-select-btn" aria-haspopup="listbox" aria-expanded="false" aria-controls="schedule-select-menu" aria-label="Chọn tháng"><span id="month-select-label">Tháng 11</span><i class="bx bx-chevron-down month-select-chevron" aria-hidden="true"></i></button>
                                <button type="button" id="btn-year-select" class="year-box month-select-btn" aria-haspopup="listbox" aria-expanded="false" aria-controls="schedule-select-menu" aria-label="Chọn năm"><span id="year-select-label">2026</span><i class="bx bx-chevron-down month-select-chevron" aria-hidden="true"></i></button>
                            </span>
                            <span class="month-year" id="month-year"></span>
                        </div>
                        <span class="visually-hidden" id="month-live" role="status" aria-live="polite"></span>
                    </div>
                    <button type="button" class="month-nav-btn" id="btn-next-month" title="Tháng sau" aria-label="Xem tháng sau">
                        <i class="bx bx-chevron-right" aria-hidden="true"></i>
                    </button>
                </div>
                <div id="view-switcher-container" class="segmented-control" style="display: none;" role="group" aria-label="Kiểu hiển thị">
                    <button type="button" id="btn-view-calendar" class="segment-btn" title="Xem dạng lịch" aria-pressed="false">
                        <i class="bx bx-calendar" aria-hidden="true"></i><span>Lịch</span>
                    </button>
                    <button type="button" id="btn-view-timeline" class="segment-btn" title="Xem dạng timeline" aria-pressed="false">
                        <i class="bx bx-git-commit" aria-hidden="true"></i><span>Timeline</span>
                    </button>
                </div>
            </div>

        </div>

        <div class="schedule-filter-panel" role="search" aria-label="Tìm kiếm và lọc sự kiện">
            <div id="schedule-filters" class="schedule-filter-controls" style="display: none;">
                <label class="schedule-filter-field schedule-filter-search" for="schedule-search" aria-label="Tìm kiếm sự kiện">
                    <span class="schedule-filter-input-control">
                        <i class="bx bx-search" aria-hidden="true"></i>
                        <input type="search" id="schedule-search" class="control-input search-input" placeholder="Nhập tên giải đấu…" aria-label="Tìm kiếm sự kiện">
                    </span>
                </label>

                <label class="schedule-filter-field schedule-filter-status" for="schedule-status-filters" aria-label="Trạng thái">
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

                <div class="tour-dropdown schedule-filter-category" id="schedule-category-dropdown">
                    <button type="button" class="tour-dropdown-btn compact-btn" id="schedule-category-button" aria-expanded="false" aria-controls="schedule-type-group">
                        <span class="tour-dropdown-btn-content">
                            <i class="bx bx-filter-alt" aria-hidden="true"></i>
                            <span data-filter-label>Thể loại (8/8)</span>
                        </span>
                        <i class="bx bx-chevron-down tour-dropdown-arrow" aria-hidden="true"></i>
                    </button>
                    <div class="tour-dropdown-menu" id="schedule-type-group" aria-label="Lọc theo thể loại">
                        <label class="custom-checkbox-container" hidden data-internal-filter="true" style="display:none"><input type="checkbox" value="tvlt" checked><span class="checkmark"></span> Thí Vua Lấy Tốt</label>
                        <label class="custom-checkbox-container" hidden data-internal-filter="true" style="display:none"><input type="checkbox" value="cttq" checked><span class="checkmark"></span> Chiến Trường Thí Quân</label>
                        <label class="custom-checkbox-container" hidden data-internal-filter="true" style="display:none"><input type="checkbox" value="cbtt" checked><span class="checkmark"></span> Cờ Bí Thí Tốt</label>
                        <label class="custom-checkbox-container"><input type="checkbox" id="schedule-prize-filter"><span class="checkmark"></span> 🏆 Chỉ có thưởng</label>
                        <label class="custom-checkbox-container"><input type="checkbox" value="multi-club-arena" checked><span class="checkmark"></span> Đấu trường đa CLB (Multi-Club Arena)</label>
                        <label class="custom-checkbox-container"><input type="checkbox" value="club-arena" checked><span class="checkmark"></span> Đấu trường Arena</label>
                        <label class="custom-checkbox-container"><input type="checkbox" value="swiss" checked><span class="checkmark"></span> Hệ Thụy Sĩ (Swiss)</label>
                        <label class="custom-checkbox-container"><input type="checkbox" value="vote" checked><span class="checkmark"></span> Cờ vua bỏ phiếu (Votechess)</label>
                        <label class="custom-checkbox-container"><input type="checkbox" value="daily" checked><span class="checkmark"></span> Cờ hàng ngày (Daily)</label>
                    </div>
                </div>

         
                <button type="button" id="schedule-reset-filters" class="reset-filters-btn" hidden>
                    <i class="bx bx-reset" aria-hidden="true"></i> Xóa lọc
                </button>
            </div>
        </div>    </header>

    <section class="schedule-results" aria-label="Kết quả lịch sự kiện">
        <div id="loading" class="loading" role="status" aria-live="polite">
            <span class="schedule-skeleton-label">Đang tải dữ liệu lịch sự kiện…</span>
            <div id="schedule-skeleton"  class="schedule-skeleton" aria-hidden="true">
                <div class="schedule-skeleton-weekdays"><span>Thứ 2</span><span>Thứ 3</span><span>Thứ 4</span><span>Thứ 5</span><span>Thứ 6</span><span>Thứ 7</span><span>Chủ Nhật</span></div>
                <div class="schedule-skeleton-grid"><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span><span class="schedule-skeleton-cell"></span></div>
            </div>
        </div>
        <div id="calendar-wrapper" style="display: none;">
            <table id="calendar-table">
                <caption class="visually-hidden">Lịch sự kiện theo ngày trong tháng đang chọn</caption>
                <thead><tr>
                    <th scope="col" title="Thứ Hai">Thứ 2</th><th scope="col" title="Thứ Ba">Thứ 3</th><th scope="col" title="Thứ Tư">Thứ 4</th>
                    <th scope="col" title="Thứ Năm">Thứ 5</th><th scope="col" title="Thứ Sáu">Thứ 6</th><th scope="col" title="Thứ Bảy">Thứ 7</th><th scope="col" title="Chủ Nhật">Chủ nhật</th>
                </tr></thead>
                <tbody id="calendar-body"></tbody>
            </table>
        </div>
        <div id="timeline-wrapper" style="display: none;"><div id="timeline-container" class="schedule-timeline-wrap"></div></div>
        <p class="schedule-updated schedule-results-updated">
            <i class="bx bx-refresh" aria-hidden="true"></i>
           <span id="schedule-results-summary" class="schedule-results-summary" aria-live="polite"></span> <span class="schedule-updated-sep">·</span> Cập nhật dữ liệu lần cuối: <strong id="last-updated">Đang tải…</strong>
            <span class="schedule-updated-separator">·</span>
            Có thắc mắc? Trao đổi trên <a href="https://chess.com/clubs/forum/view/lich-su-kien-hang-thang-clb-tvlt?clubId=325849&quote_id=125015758&page=1#comment_box" target="_blank" rel="noopener noreferrer">forum</a>
            hoặc liên hệ <a href="/leaders#admin3">M-DinhHoangViet</a>.
        </p>
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
            <img id="modal-banner" src="/images/events/dau-truong-thi-vua.svg" alt="Biểu ngữ giải đấu" width="1280" height="720">
        </div>
        <button type="button" class="cc-modal-close" aria-label="Đóng cửa sổ">×</button>
        <div class="cc-modal-content-wrapper">
            <div class="cc-modal-header-row">
                <div class="cc-modal-logo-box">
                    <a id="modal-logo-link" href="/events" target="_blank" rel="noopener noreferrer" title="Xem trang thể lệ của giải đấu">
                        <img src="/images/tvltlogo.png" alt="Logo câu lạc bộ" id="modal-logo" width="80" height="80">
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
            <a id="modal-join" aria-disabled="true" tabindex="-1" class="btn btn-primary"><span class="bx bx-user-plus"></span> Tham gia</a>
            <a id="modal-rule" href="/events" target="_blank" rel="noopener noreferrer" class="btn btn-secondary"><span class="bx bx-task"></span> Thể lệ</a>
            <a id="modal-results" href="/events/tournaments" target="_blank" rel="noopener noreferrer" class="btn btn-secondary"><span class="bx bx-trophy"></span> Kết quả</a>
        </div>
    </div>
</div>

<script src="/js/schedule.js"></script>
