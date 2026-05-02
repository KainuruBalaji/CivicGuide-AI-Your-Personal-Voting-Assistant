/**
 * CivicGuide AI — Utility Functions
 * Date helpers, formatters, animations
 */

const Utils = (() => {

  /**
   * Format a Date object to a readable string
   * @param {Date} date
   * @returns {string} e.g., "October 5, 2026"
   */
  function formatDate(date) {
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  /**
   * Calculate days from now until a target date
   * @param {Date} target
   * @returns {number}
   */
  function daysUntil(target) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const t = new Date(target);
    t.setHours(0, 0, 0, 0);
    return Math.ceil((t - now) / (1000 * 60 * 60 * 24));
  }

  /**
   * Smooth scroll an element to the bottom
   * @param {HTMLElement} container
   */
  function scrollToBottom(container) {
    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    });
  }

  /**
   * Lightweight markdown-ish parser for bot messages
   * Supports: **bold**, *italic*, - bullets, numbered lists, [text](url)
   * @param {string} text
   * @returns {string} HTML
   */
  function parseMarkdown(text) {
    let html = text
      // Escape HTML entities from template (not user input)
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br>');

    // Convert bullet lists
    html = html.replace(/((?:^|\<br\>)- .+(?:\<br\>- .+)*)/g, (match) => {
      const items = match.split('<br>').filter(l => l.startsWith('- ')).map(l =>
        `<li>${l.substring(2)}</li>`
      ).join('');
      return `<ul>${items}</ul>`;
    });

    return html;
  }

  /**
   * Generate a countdown badge string
   * @param {number} days
   * @returns {string}
   */
  function countdownBadge(days) {
    if (days < 0) return '<span class="countdown countdown--urgent">Passed</span>';
    if (days === 0) return '<span class="countdown countdown--urgent">Today!</span>';
    if (days <= 7) return `<span class="countdown countdown--urgent">${days} days left</span>`;
    if (days <= 30) return `<span class="countdown">${days} days left</span>`;
    return `<span class="countdown">${days} days away</span>`;
  }

  /**
   * Delay utility
   * @param {number} ms
   * @returns {Promise}
   */
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  return { formatDate, daysUntil, scrollToBottom, parseMarkdown, countdownBadge, delay };
})();
