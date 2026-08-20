/**
 * Schedule performance + accessibility enhancements.
 * Loaded after schedule.js so the core schedule logic stays isolated.
 */
(() => {
    'use strict';

    const scheduleFilter = window.filterSchedule;
    if (typeof scheduleFilter === 'function') {
        let timer = 0;
        window.filterSchedule = function optimizedFilterSchedule() {
            window.clearTimeout(timer);
            timer = window.setTimeout(scheduleFilter, 120);
        };
    }

    const observeScheduleImages = () => {
        const roots = [
            document.getElementById('calendar-body'),
            document.getElementById('list-container')
        ].filter(Boolean);

        roots.forEach((root) => {
            root.querySelectorAll('img:not([loading])').forEach((img) => {
                if (!img.closest('#modal-banner, #modal-logo')) {
                    img.loading = 'lazy';
                    img.decoding = 'async';
                }
            });
        });
    };

    let imageFrame = 0;
    const imageObserver = new MutationObserver(() => {
        if (imageFrame) return;
        imageFrame = requestAnimationFrame(() => {
            imageFrame = 0;
            observeScheduleImages();
        });
    });

    const init = () => {
        observeScheduleImages();

        const calendarBody = document.getElementById('calendar-body');
        const listContainer = document.getElementById('list-container');
        if (calendarBody) imageObserver.observe(calendarBody, { childList: true, subtree: true });
        if (listContainer) imageObserver.observe(listContainer, { childList: true, subtree: true });

        const modal = document.getElementById('eventModal');
        const modalDialog = modal?.querySelector('.cc-modal-dialog');
        const closeButton = modal?.querySelector('.cc-modal-close');
        let previousFocus = null;

        if (modal) {
            const modalObserver = new MutationObserver(() => {
                const opened = modal.classList.contains('open');
                if (opened && !previousFocus) {
                    previousFocus = document.activeElement;
                    closeButton?.focus({ preventScroll: true });
                } else if (!opened && previousFocus) {
                    previousFocus.focus?.({ preventScroll: true });
                    previousFocus = null;
                }
            });
            modalObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });

            modal.addEventListener('keydown', (event) => {
                if (event.key !== 'Tab' || !modal.classList.contains('open')) return;
                const focusable = modalDialog?.querySelectorAll(
                    'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                if (!focusable?.length) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
