/**
 * 2D slide deck navigation — Cerere-style
 *
 * Vertical scroll-snap between rows, horizontal scroll-snap within rows.
 * JS coordinates keyboard nav, active state, nav links, and progress.
 */

import { createIcons, Maximize, Minimize } from 'lucide';

createIcons({ icons: { Maximize, Minimize } });

const deck = document.querySelector('.js-deck');
const rows = Array.from(document.querySelectorAll('.js-deck-row'));
const slides = Array.from(document.querySelectorAll('.js-slide'));
const navLinks = Array.from(document.querySelectorAll('.deck-nav a'));

if (!deck || rows.length === 0) {
  console.warn('Slide deck not found.');
} else {
  const supportsSmooth = CSS.supports('scroll-behavior', 'smooth');
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  );

  function getScrollPadding() {
    return (
      parseInt(
        getComputedStyle(deck).getPropertyValue('scroll-padding-top'),
        10,
      ) || 0
    );
  }

  function getActiveSlide() {
    return deck.querySelector('.js-slide.is-active');
  }

  function getRowForSlide(slide) {
    return slide.closest('.js-deck-row');
  }

  function getSlidesInRow(row) {
    return Array.from(row.querySelectorAll('.js-slide'));
  }

  // ── Animated scroll fallback ──

  function animateScroll(element, prop, target, duration = 500) {
    const start = element[prop];
    const delta = target - start;
    let startTime = null;

    function easeOutQuart(t) {
      return 1 - (1 - t) ** 4;
    }

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      let elapsed = timestamp - startTime;
      if (elapsed > duration) elapsed = duration;
      const progress = easeOutQuart(elapsed / duration);
      element[prop] = start + delta * progress;
      if (elapsed < duration) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  // ── Core navigation ──

  function navigateTo(targetSlide, targetRow) {
    const padding = getScrollPadding();

    if (targetRow) {
      const yTarget = targetRow.offsetTop - 0.75 * padding;
      if (supportsSmooth && !prefersReducedMotion.matches) {
        deck.scrollTop = yTarget;
      } else {
        animateScroll(deck, 'scrollTop', yTarget);
      }
    }

    if (targetSlide) {
      const row = getRowForSlide(targetSlide);
      const xTarget = targetSlide.offsetLeft - padding;
      if (supportsSmooth && !prefersReducedMotion.matches) {
        row.scrollLeft = xTarget;
      } else {
        animateScroll(row, 'scrollLeft', xTarget);
      }
    }
  }

  function navigate(direction) {
    const active = getActiveSlide();
    if (!active) return;

    const row = getRowForSlide(active);
    let targetSlide = null;
    let targetRow = null;

    if (direction === 'row-down' || direction === 'row-up') {
      const nextRow =
        direction === 'row-down'
          ? row.nextElementSibling
          : row.previousElementSibling;
      targetRow = nextRow?.classList.contains('js-deck-row') ? nextRow : row;
    } else {
      const nextSlide =
        direction === 'col-next'
          ? active.nextElementSibling
          : active.previousElementSibling;
      targetSlide = nextSlide?.classList.contains('js-slide')
        ? nextSlide
        : active;
    }

    navigateTo(targetSlide, targetRow);
  }

  // ── Active slide tracking ──

  function setActiveSlide(slide) {
    const prev = getActiveSlide();
    if (prev === slide) return;

    if (prev) prev.classList.remove('is-active');
    slide.classList.add('is-active');

    updateNavLinks(slide);
    updateHash(slide);
  }

  function updateNavLinks(slide) {
    const row = getRowForSlide(slide);
    const rowIndex = rows.indexOf(row);

    navLinks.forEach((link) => {
      const linkRow = link.getAttribute('data-row');
      const isActive = linkRow === String(rowIndex);
      link.classList.toggle('is-active', isActive);
      link.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }

  function updateHash(slide) {
    if (slide.id && window.location.hash !== `#${slide.id}`) {
      history.replaceState(null, '', `#${slide.id}`);
    }
  }

  // ── IntersectionObserver ──

  function initObserver() {
    const padding = getScrollPadding();
    const usePercent50 = (axis) =>
      axis / 2 > padding ? '-50%' : `-${padding}px`;

    const rootMarginY = usePercent50(window.innerHeight);
    const rootMarginX = usePercent50(window.innerWidth);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSlide(entry.target);
          }
        });
      },
      {
        rootMargin: `${rootMarginY} ${rootMarginX} ${rootMarginY} ${rootMarginX}`,
      },
    );

    for (const slide of slides) observer.observe(slide);
  }

  // ── Keyboard ──

  function handleKeydown(event) {
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT')
    ) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === 'arrowdown') {
      event.preventDefault();
      navigate('row-down');
    } else if (key === 'arrowup') {
      event.preventDefault();
      navigate('row-up');
    } else if (key === 'arrowleft') {
      event.preventDefault();
      navigate('col-prev');
    } else if (key === 'arrowright') {
      event.preventDefault();
      navigate('col-next');
    } else if (key === 'home') {
      event.preventDefault();
      const firstRow = rows[0];
      const firstSlide = getSlidesInRow(firstRow)[0];
      navigateTo(firstSlide, firstRow);
    } else if (key === 'end') {
      event.preventDefault();
      const lastRow = rows[rows.length - 1];
      const lastSlide = getSlidesInRow(lastRow)[0];
      navigateTo(lastSlide, lastRow);
    } else if (key === 'f') {
      event.preventDefault();
      toggleFullscreen();
    }
  }

  // ── Nav link clicks ──

  function handleNavClick(event) {
    const link = event.currentTarget;
    if (!(link instanceof HTMLAnchorElement)) return;

    const href = link.getAttribute('href');
    if (!href?.startsWith('#')) return;

    event.preventDefault();

    const targetSlide = document.getElementById(href.slice(1));
    if (!targetSlide) return;

    const targetRow = getRowForSlide(targetSlide);
    navigateTo(targetSlide, targetRow);
  }

  // ── Hash-based initial navigation ──

  function navigateToHash() {
    const hash = window.location.hash;
    if (!hash) return;

    const target = document.getElementById(hash.slice(1));
    if (!target) return;

    const row = getRowForSlide(target);
    if (!row) return;

    navigateTo(target, row);
  }

  /*  ── Fullscreen ── */

  const fullscreenBtn = document.querySelector('.js-fullscreen');

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', toggleFullscreen);
  }

  document.addEventListener('fullscreenchange', () => {
    const active = getActiveSlide();
    if (!active) return;
    const row = getRowForSlide(active);
    const padding = getScrollPadding();

    // Double-rAF: first frame the browser
    // applies the new fullscreen geometry,
    // second frame layout values are stable.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Instant jump — no smooth animation during resize
        deck.style.scrollBehavior = 'auto';
        row.style.scrollBehavior = 'auto';

        deck.scrollTop = row.offsetTop - 0.75 * padding;
        row.scrollLeft = active.offsetLeft - padding;

        // Restore smooth for future navigation
        requestAnimationFrame(() => {
          deck.style.scrollBehavior = '';
          row.style.scrollBehavior = '';
        });
      });
    });
  });

  // ── Init ──

  window.addEventListener('keydown', handleKeydown, { passive: false });

  navLinks.forEach((link) => {
    link.addEventListener('click', handleNavClick);
  });

  window.addEventListener('hashchange', navigateToHash);

  initObserver();

  if (window.location.hash) {
    const initial = document.getElementById(window.location.hash.slice(1));
    if (initial) {
      setActiveSlide(initial);
      requestAnimationFrame(() => navigateToHash());
    } else {
      setActiveSlide(slides[0]);
    }
  } else {
    setActiveSlide(slides[0]);
  }
}
