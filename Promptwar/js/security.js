/**
 * CivicGuide AI — Security Module
 * Input sanitization, rate limiting, and XSS prevention
 */

const Security = (() => {
  const MAX_INPUT_LENGTH = 500;
  const RATE_LIMIT_MS = 500;
  const RATE_LIMIT_MAX = 3;
  let messageTimestamps = [];

  /**
   * Sanitize user input — strip HTML tags, trim, limit length
   * @param {string} raw
   * @returns {string}
   */
  function sanitizeInput(raw) {
    if (typeof raw !== 'string') return '';
    // Create a temporary text node to escape HTML entities
    const div = document.createElement('div');
    div.textContent = raw;
    let clean = div.innerHTML;
    // Trim and limit length
    clean = clean.trim().substring(0, MAX_INPUT_LENGTH);
    return clean;
  }

  /**
   * Safely set text content (never innerHTML for user content)
   * @param {HTMLElement} el
   * @param {string} text
   */
  function safeSetText(el, text) {
    el.textContent = text;
  }

  /**
   * Check rate limit — returns true if allowed, false if throttled
   * @returns {boolean}
   */
  function checkRateLimit() {
    const now = Date.now();
    // Remove timestamps older than the window
    messageTimestamps = messageTimestamps.filter(t => now - t < RATE_LIMIT_MS * RATE_LIMIT_MAX);
    if (messageTimestamps.length >= RATE_LIMIT_MAX) {
      return false;
    }
    messageTimestamps.push(now);
    return true;
  }

  /**
   * Detect potentially malicious input patterns
   * @param {string} input
   * @returns {boolean} true if suspicious
   */
  function isSuspiciousInput(input) {
    const patterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /document\./i,
      /window\./i,
      /innerHTML/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];
    return patterns.some(p => p.test(input));
  }

  return {
    sanitizeInput,
    safeSetText,
    checkRateLimit,
    isSuspiciousInput,
    MAX_INPUT_LENGTH
  };
})();
