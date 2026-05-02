/**
 * @module CivicGuideUtils
 * @description Date helpers, formatters, markdown parser, and UI utilities.
 * @version 2.0.0
 */

const Utils = (() => {

  /* ── Pre-compiled regex patterns for parseMarkdown (efficiency) ── */
  const MD_BOLD    = /\*\*(.+?)\*\*/g;
  const MD_ITALIC  = /\*(.+?)\*/g;
  const MD_LINK    = /\[(.+?)\]\((.+?)\)/g;
  const MD_NEWLINE = /\n/g;
  const MD_BULLETS = /((?:^|<br>)- .+(?:<br>- .+)*)/g;

  /** @type {number|null} Pending scroll animation frame ID */
  let _scrollRAF = null;

  /**
   * Format a Date object to a human-readable string.
   * @param {Date} date - The date to format
   * @returns {string} e.g., "October 5, 2026"
   */
  function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date)) return 'Date unavailable';
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  /**
   * Calculate the number of days from today until a target date.
   * @param {Date} target - Target date
   * @returns {number} Days until the target (negative if past)
   */
  function daysUntil(target) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const t = new Date(target);
    t.setHours(0, 0, 0, 0);
    return Math.ceil((t - now) / (1000 * 60 * 60 * 24));
  }

  /**
   * Smooth scroll an element to the bottom (debounced via rAF).
   * @param {HTMLElement} container - Scrollable container element
   */
  function scrollToBottom(container) {
    if (_scrollRAF) cancelAnimationFrame(_scrollRAF);
    _scrollRAF = requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
      _scrollRAF = null;
    });
  }

  /**
   * Lightweight markdown-ish parser for bot messages.
   * Supports: **bold**, *italic*, - bullets, [text](url)
   * Uses pre-compiled regex for efficiency.
   * @param {string} text - Markdown-flavored text
   * @returns {string} Parsed HTML string
   */
  function parseMarkdown(text) {
    if (!text) return '';

    let html = text
      .replace(MD_BOLD, '<strong>$1</strong>')
      .replace(MD_ITALIC, '<em>$1</em>')
      .replace(MD_LINK, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(MD_NEWLINE, '<br>');

    // Convert bullet lists
    html = html.replace(MD_BULLETS, (match) => {
      const items = match.split('<br>').filter(l => l.startsWith('- ')).map(l =>
        `<li>${l.substring(2)}</li>`
      ).join('');
      return `<ul>${items}</ul>`;
    });

    return html;
  }

  /**
   * Generate a countdown badge HTML string with urgency styling.
   * @param {number} days - Days remaining
   * @returns {string} HTML span element with countdown info
   */
  function countdownBadge(days) {
    if (days < 0) return '<span class="countdown countdown--passed" aria-label="Deadline has passed">Passed</span>';
    if (days === 0) return '<span class="countdown countdown--urgent" aria-label="Deadline is today">Today!</span>';
    if (days <= 7) return `<span class="countdown countdown--urgent" aria-label="${days} days remaining">${days} days left</span>`;
    if (days <= 30) return `<span class="countdown" aria-label="${days} days remaining">${days} days left</span>`;
    return `<span class="countdown" aria-label="${days} days remaining">${days} days away</span>`;
  }

  /**
   * Promise-based delay utility.
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   */
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a debounced version of a function.
   * @param {Function} fn - Function to debounce
   * @param {number} wait - Debounce delay in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(fn, wait) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /**
   * Generate a unique ID string for DOM elements.
   * @param {string} [prefix='cg'] - Prefix for the ID
   * @returns {string} Unique ID string
   */
  function uniqueId(prefix = 'cg') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  return { formatDate, daysUntil, scrollToBottom, parseMarkdown, countdownBadge, delay, debounce, uniqueId };
})();
