---
layout: default
title: Liên hệ - Thí Vua Lấy Tốt
permalink: /contact
---

<div class="contact-page">
    <header class="contact-hero wow fadeInUp" data-wow-delay="0.05s">
        <div class="contact-eyebrow">
            <span class="bx bxs-envelope"></span>
            <span>Liên hệ &amp; Hỗ trợ</span>
        </div>
        <h1>Kết nối với <span>Thí Vua Lấy Tốt</span></h1>
        <p>Hãy liên hệ Ban điều hành nếu bạn cần hỗ trợ, muốn đóng góp ý kiến hoặc muốn đồng hành cùng cộng đồng.</p>
    </header>

    <div class="contact-layout">
        <section class="contact-panel contact-panel--admins wow fadeInLeft" data-wow-delay="0.1s">
            <div class="panel-heading">
                <div class="panel-icon"><span class="bx bx-support"></span></div>
                <div>
                    <span class="panel-kicker">Hỗ trợ trực tiếp</span>
                    <h2>Ban quản trị</h2>
                </div>
            </div>

            <p class="panel-description">Liên hệ với các điều hành viên hoặc xem hồ sơ đầy đủ để tìm đúng người hỗ trợ vấn đề của bạn.</p>

            <div class="admin-list">
                <a href="/leaders#own" class="admin-item">
                    <img src="https://images.chesscomfiles.com/uploads/v1/group/515437.8435c963.160x160o.57cc274de812.png" alt="Mr. TungJohn" loading="lazy">
                    <span class="admin-copy">
                        <strong>Mr. TungJohn</strong>
                        <small>Chủ sáng lập / Chủ kênh</small>
                    </span>
                    <span class="admin-arrow bx bx-right-arrow-alt" aria-hidden="true"></span>
                </a>

                <a href="/leaders#admin3" class="admin-item">
                    <img src="https://avatars.githubusercontent.com/u/134517889" alt="M-DinhHoangViet" loading="lazy">
                    <span class="admin-copy">
                        <strong>M-DinhHoangViet</strong>
                        <small>Quản trị viên / Phát triển Web</small>
                    </span>
                    <span class="admin-arrow bx bx-right-arrow-alt" aria-hidden="true"></span>
                </a>

                <a href="/leaders#admin4" class="admin-item">
                    <img src="https://images.chesscomfiles.com/uploads/v1/user/98639406.387c082e.160x160o.418e5655b3c6.jpg" alt="VN-SenJin" loading="lazy">
                    <span class="admin-copy">
                        <strong>VN-SenJin</strong>
                        <small>Quản trị viên</small>
                    </span>
                    <span class="admin-arrow bx bx-right-arrow-alt" aria-hidden="true"></span>
                </a>
            </div>

            <a href="/leaders" class="contact-secondary-btn">
                <span class="bx bx-group"></span>
                Xem toàn bộ ban điều hành
            </a>
        </section>

        <section class="contact-panel contact-panel--actions wow fadeInRight" data-wow-delay="0.15s">
            <div class="panel-heading">
                <div class="panel-icon panel-icon--purple"><span class="bx bx-message-rounded-dots"></span></div>
                <div>
                    <span class="panel-kicker">Cùng xây dựng CLB</span>
                    <h2>Góp ý &amp; Ủng hộ</h2>
                </div>
            </div>

            <div class="action-list">
                <article class="contact-action contact-action--feedback">
                    <div class="action-icon"><span class="bx bx-edit-alt"></span></div>
                    <div class="action-copy">
                        <span class="action-label">Phản hồi</span>
                        <h3>Đánh giá &amp; Góp ý</h3>
                        <p>Ý kiến của các kỳ thủ giúp chúng tôi cải thiện trải nghiệm và phát triển câu lạc bộ.</p>
                        <a href="https://forms.gle/iCYUAbVD5GUmbdsL8" target="_blank" rel="noopener noreferrer" class="action-link">
                            Gửi phản hồi
                            <span class="bx bx-right-arrow-alt"></span>
                        </a>
                    </div>
                </article>

                <article class="contact-action contact-action--donation">
                    <div class="action-icon"><span class="bx bx-wallet"></span></div>
                    <div class="action-copy">
                        <span class="action-label">Đồng hành</span>
                        <h3>Ủng hộ Mr.TungJohn</h3>
                        <p>Hỗ trợ kinh phí duy trì các giải đấu và hoạt động của Thí Vua Lấy Tốt.</p>
                        <div class="donation-content">
                            <div class="qr-frame">
                                <img src="/images/tvlt/payment.jpg" alt="Mã QR ủng hộ Mr.TungJohn" loading="lazy">
                            </div>
                            <div class="donation-note">
                                <strong>Quét mã QR</strong>
                                <span>Thực hiện thanh toán bằng ứng dụng ngân hàng.</span>
                            </div>
                        </div>
                    </div>
                </article>
            </div>
        </section>
    </div>
</div>

<style>
.contact-page {
    --contact-border: rgba(255, 255, 255, 0.08);
    --contact-surface: rgba(10, 17, 31, 0.72);
    --contact-surface-soft: rgba(255, 255, 255, 0.035);
    --contact-accent: var(--color-accent, #38bdf8);
    --contact-purple: var(--color-secondary, #a855f7);
    max-width: 1120px;
    margin: 0 auto;
    padding: clamp(1rem, 3vw, 2.5rem) 0 1rem;
}

.contact-hero {
    position: relative;
    max-width: 760px;
    margin: 0 auto clamp(2rem, 5vw, 3.25rem);
    text-align: center;
}

.contact-hero::before {
    content: "";
    position: absolute;
    z-index: -1;
    width: 220px;
    height: 220px;
    top: -80px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.16), transparent 68%);
    filter: blur(12px);
}

.contact-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    margin-bottom: 0.85rem;
    padding: 0.42rem 0.8rem;
    border: 1px solid rgba(56, 189, 248, 0.2);
    border-radius: 999px;
    background: rgba(56, 189, 248, 0.07);
    color: var(--contact-accent);
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.contact-hero h1 {
    margin: 0;
    color: var(--color-text-primary, #fff);
    font-size: clamp(2rem, 5vw, 3.25rem);
    line-height: 1.08;
    letter-spacing: -0.035em;
}

.contact-hero h1 span {
    background: linear-gradient(110deg, var(--contact-accent), var(--contact-purple));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.contact-hero p {
    max-width: 650px;
    margin: 1rem auto 0;
    color: var(--color-text-secondary, #d1d5db);
    font-size: 0.98rem;
    line-height: 1.7;
}

.contact-layout {
    display: grid;
    grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
    gap: 1.25rem;
    align-items: stretch;
}

.contact-panel {
    position: relative;
    overflow: hidden;
    padding: clamp(1.25rem, 3vw, 2rem);
    border: 1px solid var(--contact-border);
    border-radius: 1.25rem;
    background: var(--contact-surface);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.22);
    backdrop-filter: blur(18px) saturate(140%);
    -webkit-backdrop-filter: blur(18px) saturate(140%);
}

.contact-panel::after {
    content: "";
    position: absolute;
    width: 180px;
    height: 180px;
    top: -110px;
    right: -70px;
    border-radius: 50%;
    background: rgba(56, 189, 248, 0.08);
    filter: blur(28px);
    pointer-events: none;
}

.contact-panel--actions::after {
    background: rgba(168, 85, 247, 0.08);
}

.panel-heading {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding-bottom: 1.1rem;
    border-bottom: 1px solid var(--contact-border);
}

.panel-icon {
    display: grid;
    place-items: center;
    flex: 0 0 46px;
    width: 46px;
    height: 46px;
    border: 1px solid rgba(56, 189, 248, 0.2);
    border-radius: 0.9rem;
    background: rgba(56, 189, 248, 0.1);
    color: var(--contact-accent);
    font-size: 1.35rem;
}

.panel-icon--purple {
    border-color: rgba(168, 85, 247, 0.22);
    background: rgba(168, 85, 247, 0.1);
    color: #c084fc;
}

.panel-kicker {
    display: block;
    margin-bottom: 0.15rem;
    color: var(--color-text-muted, #9ca3af);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.panel-heading h2 {
    margin: 0;
    color: var(--color-text-primary, #fff);
    font-size: 1.35rem;
    line-height: 1.2;
}

.panel-description {
    margin: 1rem 0 1.25rem;
    color: var(--color-text-secondary, #d1d5db);
    font-size: 0.88rem;
    line-height: 1.6;
}

.admin-list,
.action-list {
    display: grid;
    gap: 0.7rem;
}

.admin-item {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    min-width: 0;
    padding: 0.7rem;
    border: 1px solid rgba(255, 255, 255, 0.055);
    border-radius: 0.9rem;
    background: var(--contact-surface-soft);
    color: inherit;
    text-decoration: none;
    transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.admin-item:hover,
.admin-item:focus-visible {
    border-color: rgba(56, 189, 248, 0.28);
    background: rgba(56, 189, 248, 0.055);
    transform: translateX(3px);
}

.admin-item img {
    width: 46px;
    height: 46px;
    flex: 0 0 46px;
    border: 2px solid rgba(56, 189, 248, 0.22);
    border-radius: 50%;
    object-fit: cover;
}

.admin-copy {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    gap: 0.18rem;
}

.admin-copy strong {
    overflow: hidden;
    color: var(--color-text-primary, #fff);
    font-size: 0.9rem;
    font-weight: 650;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.admin-copy small {
    overflow: hidden;
    color: var(--color-text-muted, #9ca3af);
    font-size: 0.72rem;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.admin-arrow {
    display: grid;
    place-items: center;
    flex: 0 0 32px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    color: var(--color-text-muted, #9ca3af);
    font-size: 1rem;
    transition: background 0.2s ease, color 0.2s ease;
}

.admin-item:hover .admin-arrow,
.admin-item:focus-visible .admin-arrow {
    background: var(--contact-accent);
    color: #04101c;
}

.contact-secondary-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    width: 100%;
    margin-top: 1rem;
    padding: 0.72rem 1rem;
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: 0.8rem;
    background: rgba(56, 189, 248, 0.055);
    color: var(--contact-accent);
    font-size: 0.8rem;
    font-weight: 650;
    text-decoration: none;
    transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.contact-secondary-btn:hover,
.contact-secondary-btn:focus-visible {
    border-color: rgba(56, 189, 248, 0.45);
    background: rgba(56, 189, 248, 0.1);
    color: #fff;
}

.contact-action {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.9rem;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.055);
    border-radius: 1rem;
    background: var(--contact-surface-soft);
}

.action-icon {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 0.75rem;
    background: rgba(56, 189, 248, 0.1);
    color: var(--contact-accent);
    font-size: 1.25rem;
}

.contact-action--donation .action-icon {
    background: rgba(168, 85, 247, 0.1);
    color: #c084fc;
}

.action-label {
    color: var(--color-text-muted, #9ca3af);
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.action-copy h3 {
    margin: 0.18rem 0 0.35rem;
    color: var(--color-text-primary, #fff);
    font-size: 1rem;
}

.action-copy p {
    margin: 0;
    color: var(--color-text-secondary, #d1d5db);
    font-size: 0.8rem;
    line-height: 1.55;
}

.action-link {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-top: 0.75rem;
    color: var(--contact-accent);
    font-size: 0.78rem;
    font-weight: 700;
    text-decoration: none;
}

.action-link:hover,
.action-link:focus-visible {
    color: #fff;
}

.donation-content {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    margin-top: 0.85rem;
    padding-top: 0.85rem;
    border-top: 1px solid rgba(255, 255, 255, 0.055);
}

.qr-frame {
    flex: 0 0 108px;
    width: 108px;
    height: 108px;
    padding: 0.35rem;
    border-radius: 0.7rem;
    background: #fff;
}

.qr-frame img {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 0.4rem;
    object-fit: cover;
}

.donation-note {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.donation-note strong {
    color: var(--color-text-primary, #fff);
    font-size: 0.82rem;
}

.donation-note span {
    color: var(--color-text-muted, #9ca3af);
    font-size: 0.72rem;
    line-height: 1.45;
}

.contact-page a:focus-visible {
    outline: 2px solid var(--contact-accent);
    outline-offset: 3px;
}

@media (max-width: 820px) {
    .contact-layout {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 520px) {
    .contact-page {
        padding-top: 0.5rem;
    }

    .contact-hero {
        margin-bottom: 1.5rem;
    }

    .contact-hero p {
        font-size: 0.88rem;
    }

    .contact-panel {
        padding: 1rem;
        border-radius: 1rem;
    }

    .panel-heading h2 {
        font-size: 1.15rem;
    }

    .admin-item {
        padding: 0.62rem;
    }

    .admin-item img {
        width: 42px;
        height: 42px;
        flex-basis: 42px;
    }

    .admin-copy small {
        white-space: normal;
    }

    .contact-action {
        grid-template-columns: 1fr;
    }

    .action-icon {
        width: 38px;
        height: 38px;
    }

    .donation-content {
        align-items: flex-start;
    }

    .qr-frame {
        flex-basis: 92px;
        width: 92px;
        height: 92px;
    }
}

@media (prefers-reduced-motion: reduce) {
    .admin-item,
    .admin-arrow,
    .contact-secondary-btn,
    .action-link {
        transition: none;
    }
}
</style>
