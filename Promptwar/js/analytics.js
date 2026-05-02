/**
 * @module CivicGuideAnalytics
 * @description Privacy-first analytics wrapper using Firebase Analytics (Google Services).
 * Tracks anonymized usage patterns to improve the voting assistant experience.
 * NO personally identifiable information (PII) is ever collected.
 * Respects navigator.doNotTrack and provides opt-out capability.
 * @version 1.0.0
 */

const Analytics = (() => {
  /** @type {boolean} Whether analytics has been initialized */
  let _initialized = false;

  /** @type {boolean} Whether the user has opted out */
  let _optedOut = false;

  /** @type {object|null} Firebase Analytics instance */
  let _analytics = null;

  /** @type {number} Session start timestamp */
  const _sessionStart = Date.now();

  /**
   * Check if tracking is permitted (respects Do Not Track and opt-out).
   * @returns {boolean} Whether tracking is allowed
   * @private
   */
  function _isTrackingAllowed() {
    if (_optedOut) return false;
    // Respect Do Not Track browser setting
    if (navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes') return false;
    // Respect Global Privacy Control
    if (navigator.globalPrivacyControl) return false;
    return true;
  }

  /**
   * Initialize Firebase Analytics with privacy-respecting configuration.
   * Must be called after Firebase SDK is loaded.
   * @param {object} firebaseConfig - Firebase project configuration
   */
  function init(firebaseConfig) {
    if (_initialized) return;

    try {
      // Check user opt-out preference from localStorage
      try {
        _optedOut = localStorage.getItem('cg_analytics_optout') === 'true';
      } catch (_) { /* Storage unavailable */ }

      if (!_isTrackingAllowed()) {
        console.info('[CivicGuide Analytics] Tracking disabled (user preference or DNT).');
        _initialized = true;
        return;
      }

      // Initialize Firebase if SDK is available
      if (typeof firebase !== 'undefined' && firebase.initializeApp && firebase.analytics) {
        // Check if already initialized
        if (!firebase.apps || firebase.apps.length === 0) {
          firebase.initializeApp(firebaseConfig);
        }
        _analytics = firebase.analytics();

        // Configure privacy settings
        _analytics.setAnalyticsCollectionEnabled(true);

        console.info('[CivicGuide Analytics] Firebase Analytics initialized (privacy-first mode).');
      } else {
        console.info('[CivicGuide Analytics] Firebase SDK not loaded — analytics disabled.');
      }

      _initialized = true;
    } catch (err) {
      console.warn('[CivicGuide Analytics] Initialization failed:', err.message);
      _initialized = true; // Prevent retry loops
    }
  }

  /**
   * Log a custom analytics event (privacy-safe).
   * @param {string} eventName - Event name (snake_case)
   * @param {object} [params={}] - Event parameters (no PII allowed)
   */
  function logEvent(eventName, params = {}) {
    if (!_initialized || !_isTrackingAllowed()) return;

    try {
      if (_analytics) {
        _analytics.logEvent(eventName, {
          ...params,
          session_duration_sec: Math.floor((Date.now() - _sessionStart) / 1000)
        });
      }
    } catch (_) { /* Fail silently — analytics should never break the app */ }
  }

  /**
   * Track state selection (anonymized — only state abbreviation, no user data).
   * @param {string} stateAbbr - Two-letter state abbreviation
   */
  function trackStateSelection(stateAbbr) {
    logEvent('state_selected', { state: stateAbbr });
  }

  /**
   * Track voting method selection.
   * @param {string} method - 'in-person' or 'mail'
   */
  function trackMethodSelection(method) {
    logEvent('method_selected', { voting_method: method });
  }

  /**
   * Track milestone exploration.
   * @param {string} milestone - Milestone key (e.g., 'registration', 'electionDay')
   */
  function trackMilestoneView(milestone) {
    logEvent('milestone_viewed', { milestone_key: milestone });
  }

  /**
   * Track when the partisan filter is triggered (count only, no content).
   */
  function trackPartisanFilter() {
    logEvent('partisan_filter_triggered');
  }

  /**
   * Track a chatbot conversation step.
   * @param {string} fromState - Previous conversation state
   * @param {string} toState - New conversation state
   */
  function trackConversationStep(fromState, toState) {
    logEvent('conversation_step', { from: fromState, to: toState });
  }

  /**
   * Track session engagement on page visibility change.
   */
  function trackEngagement() {
    logEvent('session_engagement', {
      duration_sec: Math.floor((Date.now() - _sessionStart) / 1000)
    });
  }

  /**
   * Allow user to opt out of analytics.
   */
  function optOut() {
    _optedOut = true;
    try { localStorage.setItem('cg_analytics_optout', 'true'); } catch (_) {}
    if (_analytics) {
      try { _analytics.setAnalyticsCollectionEnabled(false); } catch (_) {}
    }
    console.info('[CivicGuide Analytics] User opted out of analytics.');
  }

  /**
   * Allow user to opt back in to analytics.
   */
  function optIn() {
    _optedOut = false;
    try { localStorage.removeItem('cg_analytics_optout'); } catch (_) {}
    if (_analytics) {
      try { _analytics.setAnalyticsCollectionEnabled(true); } catch (_) {}
    }
  }

  return {
    init,
    logEvent,
    trackStateSelection,
    trackMethodSelection,
    trackMilestoneView,
    trackPartisanFilter,
    trackConversationStep,
    trackEngagement,
    optOut,
    optIn
  };
})();
