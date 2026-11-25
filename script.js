/* ============================================================
   LEON — Personal Brand Website
   Vanilla JavaScript · No dependencies
   ============================================================ */

(function () {
    'use strict';

    /* ---------- Config ---------- */
    const CONFIG = {
        whatsapp: '254748397839',
        pubgUid: '52458215837',

        /* Promotions: set `active: true` and fill in details to show the promo section.
           Leave `active: false` (default) to keep the section hidden. */
        promotion: {
            active: false,
            title: 'Active Promotion',
            name: 'Promotion title',
            description: 'Offer description goes here.',
            discount: '-20%',          // e.g. "-20%" or "KSh 2,000 off"
            startDate: '2026-01-01',   // free-text or YYYY-MM-DD
            endDate: '2026-01-31'
        }
    };

    /* ---------- Helpers ---------- */
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    const on = (el, evt, handler, opts) => {
        if (el) el.addEventListener(evt, handler, opts);
    };

    /* ---------- WhatsApp link builder ---------- */
    function waLink(message) {
        const base = `https://wa.me/${CONFIG.whatsapp}`;
        return message ? `${base}?text=${encodeURIComponent(message)}` : base;
    }

    // Expose for inline handlers if ever needed
    window.LEON = { waLink, config: CONFIG };

    /* ---------- 1. Auto copyright year ---------- */
    function updateYear() {
        const el = $('#year');
        if (el) el.textContent = new Date().getFullYear();
    }

    /* ---------- 2. Mobile navigation ---------- */
    function initMobileNav() {
        const toggle = $('#navToggle');
        const links = $('#navLinks');
        if (!toggle || !links) return;

        const closeMenu = () => {
            links.classList.remove('open');
            toggle.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        };

        const openMenu = () => {
            links.classList.add('open');
            toggle.classList.add('open');
            toggle.setAttribute('aria-expanded', 'true');
            // Lock body scroll only on small screens
            if (window.matchMedia('(max-width: 768px)').matches) {
                document.body.style.overflow = 'hidden';
            }
        };

        on(toggle, 'click', () => {
            const isOpen = links.classList.contains('open');
            isOpen ? closeMenu() : openMenu();
        });

        // Close when a link is clicked
        $$('a', links).forEach(a => on(a, 'click', closeMenu));

        // Close on outside click
        on(document, 'click', (e) => {
            if (!links.classList.contains('open')) return;
            if (links.contains(e.target) || toggle.contains(e.target)) return;
            closeMenu();
        });

        // Close on Escape
        on(document, 'keydown', (e) => {
            if (e.key === 'Escape') closeMenu();
        });

        // Close if resized to desktop
        on(window, 'resize', () => {
            if (window.innerWidth > 768) closeMenu();
        });
    }

    /* ---------- 3. Sticky nav state + active link ---------- */
    function initNavScroll() {
        const nav = $('#nav');
        const backTop = $('#backTop');
        if (!nav) return;

        const onScroll = () => {
            const y = window.scrollY;
            nav.classList.toggle('scrolled', y > 40);
            if (backTop) backTop.classList.toggle('show', y > 600);

            // Active link highlighting
            const sections = $$('section[id]');
            let current = '';
            const offset = 120;
            sections.forEach(sec => {
                if (y >= sec.offsetTop - offset) current = sec.id;
            });
            $$('.nav__links a').forEach(a => {
                const href = a.getAttribute('href') || '';
                a.classList.toggle('active', href === `#${current}`);
            });
        };

        on(window, 'scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ---------- 4. Smooth scrolling for in-page anchors ---------- */
    function initSmoothScroll() {
        // CSS handles scroll-behavior: smooth; this is a JS fallback that also
        // accounts for the fixed nav height and works on older browsers.
        $$('a[href^="#"]').forEach(a => {
            on(a, 'click', (e) => {
                const href = a.getAttribute('href');
                if (!href || href === '#') return;
                const target = document.querySelector(href);
                if (!target) return;
                e.preventDefault();
                const navH = ($('#nav')?.offsetHeight || 70) + 10;
                const top = target.getBoundingClientRect().top + window.scrollY - navH;
                window.scrollTo({ top, behavior: 'smooth' });
                // Update hash without jumping
                history.pushState(null, '', href);
            });
        });
    }

    /* ---------- 5. Copy PUBG UID ---------- */
    function initCopyUid() {
        const btn = $('#copyUid');
        const uidEl = $('#uidValue');
        if (!btn || !uidEl) return;

        const setText = (label) => {
            const span = $('#copyUidText');
            if (span) span.textContent = label;
        };

        const showToast = (msg) => {
            const toast = $('#toast');
            const toastText = $('#toastText');
            if (!toast) return;
            if (toastText) toastText.textContent = msg;
            toast.classList.add('show');
            clearTimeout(showToast._t);
            showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
        };

        const copyText = async (text) => {
            // Modern async clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                try {
                    await navigator.clipboard.writeText(text);
                    return true;
                } catch (_) { /* fall through to fallback */ }
            }
            // Legacy fallback
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.setAttribute('readonly', '');
                ta.style.position = 'absolute';
                ta.style.left = '-9999px';
                document.body.appendChild(ta);
                ta.select();
                const ok = document.execCommand('copy');
                document.body.removeChild(ta);
                return ok;
            } catch (_) {
                return false;
            }
        };

        on(btn, 'click', async () => {
            const uid = (uidEl.textContent || CONFIG.pubgUid).trim();
            const ok = await copyText(uid);
            if (ok) {
                showToast(`UID ${uid} copied!`);
                setText('Copied!');
                setTimeout(() => setText('Copy UID'), 1800);
            } else {
                // Last resort: select the UID text so user can copy manually
                const range = document.createRange();
                range.selectNodeContents(uidEl);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
                showToast('Select and copy the UID');
            }
        });
    }

    /* ---------- 6. Reveal-on-scroll animations ---------- */
    function initReveal() {
        const items = $$('.reveal');
        if (!items.length) return;

        // Fallback: if IntersectionObserver isn't available, show everything.
        if (!('IntersectionObserver' in window)) {
            items.forEach(el => el.classList.add('visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        items.forEach(el => observer.observe(el));
    }

    /* ---------- 7. Promotions: activate if configured ---------- */
    function initPromo() {
        const section = $('#promo');
        if (!section) return;
        const p = CONFIG.promotion;
        if (!p || !p.active) {
            // Keep hidden — the section already has `hidden` in markup
            return;
        }
        section.hidden = false;
        const setText = (id, val) => { const el = $(`#${id}`); if (el && val) el.textContent = val; };
        setText('promoTitle', p.title);
        setText('promoName', p.name);
        setText('promoDesc', p.description);
        setText('promoBadge', p.discount);
        setText('promoStart', p.startDate);
        setText('promoEnd', p.endDate);
    }

    /* ---------- 8. Lazy progressive enhancement for hero letters ---------- */
    function initHeroLetters() {
        const letters = $$('.hero__name-letter');
        letters.forEach((ltr, i) => {
            ltr.style.animation = `none`;
            // Stagger entrance via inline transition delay
            ltr.style.transitionDelay = `${i * 0.08}s`;
        });
        // Trigger entrance on load
        requestAnimationFrame(() => {
            const wrap = $('.hero__name');
            if (wrap) wrap.classList.add('visible');
        });
    }

    /* ---------- 9. Back-top visibility + click ---------- */
    function initBackTop() {
        const btn = $('#backTop');
        if (!btn) return;
        on(btn, 'click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            history.pushState(null, '', '#hero');
        });
    }

    /* ---------- 10. Keyboard accessibility for placeholder socials ---------- */
    function initPlaceholderHints() {
        $$('.social-chip--placeholder, .footer__social--placeholder').forEach(el => {
            on(el, 'click', (e) => {
                // Prevent navigation to "#" — these are intentionally placeholders.
                if ((el.getAttribute('href') || '') === '#') {
                    e.preventDefault();
                }
            });
        });
    }

    /* ---------- Init ---------- */
    function init() {
        updateYear();
        initMobileNav();
        initNavScroll();
        initSmoothScroll();
        initCopyUid();
        initReveal();
        initPromo();
        initHeroLetters();
        initBackTop();
        initPlaceholderHints();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
