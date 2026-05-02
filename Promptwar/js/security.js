/**
 * @module CivicGuideSecurity
 * @description Input sanitization, adaptive rate limiting, and XSS prevention.
 * All user input MUST pass through this module before processing.
 * @version 2.0.0
 */

const Security = (() => {
  /** @constant {number} Maximum allowed input length */
  const MAX_INPUT_LENGTH = 500;

  /** @constant {number} Base rate limit window in milliseconds */
  const RATE_LIMIT_WINDOW_MS = 1500;

  /** @constant {number} Maximum messages allowed within the rate limit window */
  const RATE_LIMIT_MAX = 3;

  /** @constant {number} Maximum backoff multiplier for repeated violations */
  const MAX_BACKOFF = 5;

  /** @type {number[]} Timestamps of recent messages for rate limiting */
  let messageTimestamps = [];

  /** @type {number} Current backoff multiplier (escalates on repeated violations) */
  let backoffMultiplier = 1;

  /** @type {number} Timestamp of last rate limit violation */
  let lastViolation = 0;

  // Restore rate-limit state from sessionStorage (survives in-session navigation)
  try {
    const saved = sessionStorage.getItem('cg_ratelimit');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.ts)) {
        messageTimestamps = parsed.ts.filter(t => Date.now() - t < RATE_LIMIT_WINDOW_MS * MAX_BACKOFF);
        backoffMultiplier = parsed.bm || 1;
      }
    }
  } catch (_) { /* sessionStorage unavailable — proceed with defaults */ }

  /**
   * Persist rate-limit state to sessionStorage.
   * @private
   */
  function _persistRateState() {
    try {
      sessionStorage.setItem('cg_ratelimit', JSON.stringify({
        ts: messageTimestamps.slice(-RATE_LIMIT_MAX * 2),
        bm: backoffMultiplier
      }));
    } catch (_) { /* Ignore storage errors */ }
  }

  /**
   * Sanitize user input — strip HTML/script content, trim, limit length.
   * Uses regex-based stripping instead of DOM creation for efficiency.
   * @param {string} raw - Raw user input
   * @returns {string} Sanitized input string
   */
  function sanitizeInput(raw) {
    if (typeof raw !== 'string') return '';

    let clean = raw
      // Strip all HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove null bytes
      .replace(/\0/g, '')
      // Encode critical HTML entities
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    // Trim and limit length
    clean = clean.trim().substring(0, MAX_INPUT_LENGTH);
    return clean;
  }

  /**
   * Safely set text content on an element (never innerHTML for user content).
   * @param {HTMLElement} el - Target DOM element
   * @param {string} text - Text content to set
   */
  function safeSetText(el, text) {
    if (el && typeof el.textContent !== 'undefined') {
      el.textContent = text;
    }
  }

  /**
   * Check rate limit with adaptive backoff.
   * Returns true if the message is allowed, false if throttled.
   * Repeated violations increase the cooldown window.
   * @returns {boolean} Whether the message is allowed
   */
  function checkRateLimit() {
    const now = Date.now();
    const windowMs = RATE_LIMIT_WINDOW_MS * backoffMultiplier;

    // Remove timestamps older than the current window
    messageTimestamps = messageTimestamps.filter(t => now - t < windowMs);

    if (messageTimestamps.length >= RATE_LIMIT_MAX) {
      // Violation — escalate backoff
      lastViolation = now;
      backoffMultiplier = Math.min(backoffMultiplier + 1, MAX_BACKOFF);
      _persistRateState();
      return false;
    }

    // Decay backoff if user has been well-behaved (10s since last violation)
    if (backoffMultiplier > 1 && now - lastViolation > 10000) {
      backoffMultiplier = Math.max(1, backoffMultiplier - 1);
    }

    messageTimestamps.push(now);
    _persistRateState();
    return true;
  }

  /**
   * Detect potentially malicious input patterns (XSS, injection attempts).
   * @param {string} input - Raw user input to check
   * @returns {boolean} True if the input appears suspicious
   */
  function isSuspiciousInput(input) {
    if (typeof input !== 'string') return false;

    /** @type {RegExp[]} Patterns that indicate potential XSS or injection */
    const SUSPICIOUS_PATTERNS = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /document\./i,
      /window\./i,
      /innerHTML/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /data:\s*text\/html/i,
      /vbscript:/i,
      /expression\s*\(/i,
      /url\s*\(\s*['"]?\s*data:/i
    ];

    return SUSPICIOUS_PATTERNS.some(p => p.test(input));
  }

  /**
   * Validate input length and return feedback.
   * @param {string} input - Raw user input
   * @returns {{ valid: boolean, message: string }} Validation result
   */
  function validateInputLength(input) {
    if (!input || input.trim().length === 0) {
      return { valid: false, message: 'Please enter a message.' };
    }
    if (input.length > MAX_INPUT_LENGTH) {
      return { valid: false, message: `Message is too long (max ${MAX_INPUT_LENGTH} characters).` };
    }
    return { valid: true, message: '' };
  }

  return {
    sanitizeInput,
    safeSetText,
    checkRateLimit,
    isSuspiciousInput,
    validateInputLength,
    MAX_INPUT_LENGTH
  };
})();
