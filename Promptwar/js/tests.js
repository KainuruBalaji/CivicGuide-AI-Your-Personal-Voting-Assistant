/**
 * @module CivicGuideTests
 * @description Lightweight zero-dependency test suite for CivicGuide AI.
 * Covers: Security, Data Integrity, State Detection, Chatbot Flow, and Utils.
 * @version 1.0.0
 */

const TestRunner = (() => {
  let _passed = 0;
  let _failed = 0;
  let _results = [];

  /**
   * Assert that a condition is true.
   * @param {string} name - Test name
   * @param {boolean} condition - Assertion
   */
  function assert(name, condition) {
    if (condition) {
      _passed++;
      _results.push({ name, status: 'PASS' });
    } else {
      _failed++;
      _results.push({ name, status: 'FAIL' });
      console.error(`❌ FAIL: ${name}`);
    }
  }

  /**
   * Assert that two values are equal.
   * @param {string} name - Test name
   * @param {*} actual - Actual value
   * @param {*} expected - Expected value
   */
  function assertEqual(name, actual, expected) {
    const pass = actual === expected;
    if (!pass) {
      console.error(`❌ FAIL: ${name} — expected "${expected}", got "${actual}"`);
    }
    assert(name, pass);
  }

  /**
   * Assert that a value is not null/undefined.
   */
  function assertExists(name, value) {
    assert(name, value !== null && value !== undefined);
  }

  /**
   * Assert that a value is null.
   */
  function assertNull(name, value) {
    assert(name, value === null || value === undefined);
  }

  /* ═══════════════════════════════════════════════
   *  TEST SUITE: Security Module
   * ═══════════════════════════════════════════════ */
  function testSecurity() {
    console.group('🔒 Security Tests');

    // Sanitization
    assertEqual('Sanitize: strips HTML tags',
      Security.sanitizeInput('<script>alert(1)</script>Hello'),
      'alert(1)Hello');

    assertEqual('Sanitize: encodes ampersands',
      Security.sanitizeInput('Tom & Jerry').includes('&amp;'), true);

    assertEqual('Sanitize: returns empty for non-string',
      Security.sanitizeInput(123), '');

    assertEqual('Sanitize: returns empty for null',
      Security.sanitizeInput(null), '');

    assertEqual('Sanitize: trims whitespace',
      Security.sanitizeInput('  hello  '), 'hello');

    assertEqual('Sanitize: truncates long input',
      Security.sanitizeInput('a'.repeat(600)).length <= 500, true);

    // Suspicious input detection
    assert('Suspicious: detects <script>',
      Security.isSuspiciousInput('<script>alert(1)</script>'));

    assert('Suspicious: detects javascript:',
      Security.isSuspiciousInput('javascript:void(0)'));

    assert('Suspicious: detects onload=',
      Security.isSuspiciousInput('<img onload=alert(1)>'));

    assert('Suspicious: detects eval(',
      Security.isSuspiciousInput('eval("code")'));

    assert('Suspicious: allows normal text',
      !Security.isSuspiciousInput('I want to vote in California'));

    assert('Suspicious: allows state names',
      !Security.isSuspiciousInput('New York'));

    // Input validation
    assertEqual('Validate: empty string invalid',
      Security.validateInputLength('').valid, false);

    assertEqual('Validate: normal string valid',
      Security.validateInputLength('Hello').valid, true);

    assertEqual('Validate: long string invalid',
      Security.validateInputLength('a'.repeat(501)).valid, false);

    // Rate limiting
    assert('Rate limit: first message allowed',
      Security.checkRateLimit());

    console.groupEnd();
  }

  /* ═══════════════════════════════════════════════
   *  TEST SUITE: Data Integrity
   * ═══════════════════════════════════════════════ */
  function testDataIntegrity() {
    console.group('📊 Data Integrity Tests');

    const stateKeys = Object.keys(STATE_DATA);
    assertEqual('Data: 51 entries (50 states + DC)', stateKeys.length, 51);

    // Required fields for every state
    const REQUIRED_FIELDS = ['name', 'abbr', 'regDeadlineDays', 'regUrl', 'absenteeDeadlineDays',
      'earlyVotingDays', 'idRequired', 'statusUrl', 'sameDay', 'onlineReg', 'notes'];

    let allFieldsPresent = true;
    stateKeys.forEach(key => {
      const state = STATE_DATA[key];
      REQUIRED_FIELDS.forEach(field => {
        if (state[field] === undefined) {
          console.error(`Missing field "${field}" in state "${key}"`);
          allFieldsPresent = false;
        }
      });
    });
    assert('Data: all required fields present in every state', allFieldsPresent);

    // Abbreviation consistency
    let abbrConsistent = true;
    stateKeys.forEach(key => {
      if (STATE_DATA[key].abbr !== key) {
        console.error(`Abbreviation mismatch: key="${key}", abbr="${STATE_DATA[key].abbr}"`);
        abbrConsistent = false;
      }
    });
    assert('Data: abbreviation keys match abbr fields', abbrConsistent);

    // URLs are HTTPS
    let allHttps = true;
    stateKeys.forEach(key => {
      const s = STATE_DATA[key];
      if (!s.regUrl.startsWith('https://') || !s.statusUrl.startsWith('https://')) {
        console.error(`Non-HTTPS URL in state "${key}"`);
        allHttps = false;
      }
    });
    assert('Data: all URLs use HTTPS', allHttps);

    // idRequired is non-empty array
    let idValid = true;
    stateKeys.forEach(key => {
      if (!Array.isArray(STATE_DATA[key].idRequired) || STATE_DATA[key].idRequired.length === 0) {
        console.error(`Invalid idRequired in state "${key}"`);
        idValid = false;
      }
    });
    assert('Data: idRequired is non-empty array for every state', idValid);

    // Election day constant
    assertEqual('Data: ELECTION_DAY is 2026-11-03', ELECTION_DAY, '2026-11-03');

    // Milestones calculation
    const caMilestones = getMilestones(STATE_DATA.CA);
    assertExists('Data: CA milestones has registration', caMilestones.registration);
    assertExists('Data: CA milestones has electionDay', caMilestones.electionDay);
    assert('Data: election day is a valid date', caMilestones.electionDay.date instanceof Date);

    // Frozen objects
    assert('Data: STATE_DATA is frozen', Object.isFrozen(STATE_DATA));
    assert('Data: STATE_LOOKUP is frozen', Object.isFrozen(STATE_LOOKUP));

    console.groupEnd();
  }

  /* ═══════════════════════════════════════════════
   *  TEST SUITE: State Detection
   * ═══════════════════════════════════════════════ */
  function testStateDetection() {
    console.group('🔍 State Detection Tests');

    // Exact matches
    assertExists('Detect: "California" → CA', getStateData('California'));
    assertEqual('Detect: "California" name', getStateData('California').abbr, 'CA');

    assertExists('Detect: "california" (lowercase)', getStateData('california'));
    assertEqual('Detect: "TX" abbreviation', getStateData('TX').abbr, 'TX');
    assertEqual('Detect: "tx" lowercase abbr', getStateData('tx').abbr, 'TX');

    // Multi-word states
    assertEqual('Detect: "New York"', getStateData('New York').abbr, 'NY');
    assertEqual('Detect: "north carolina"', getStateData('north carolina').abbr, 'NC');
    assertEqual('Detect: "District of Columbia"', getStateData('District of Columbia').abbr, 'DC');

    // Embedded in sentences
    assertExists('Detect: "I live in Texas"', getStateData('I live in Texas'));

    // False positive prevention
    assertNull('Detect: "In-person voting" should NOT match IN',
      getStateData('In-person voting'));
    assertNull('Detect: "vote by mail" should NOT match any state',
      getStateData('vote by mail'));
    assertNull('Detect: empty string', getStateData(''));
    assertNull('Detect: null', getStateData(null));

    // North Dakota special case
    assertEqual('Detect: North Dakota no registration',
      STATE_DATA.ND.regDeadlineDays, 0);

    console.groupEnd();
  }

  /* ═══════════════════════════════════════════════
   *  TEST SUITE: Chatbot Flow
   * ═══════════════════════════════════════════════ */
  function testChatbotFlow() {
    console.group('🤖 Chatbot Flow Tests');

    // Welcome message
    const welcome = Chatbot.getWelcomeMessage();
    assertExists('Chatbot: welcome message exists', welcome);
    assert('Chatbot: welcome has text', welcome.text.length > 0);
    assert('Chatbot: welcome has quickReplies', Array.isArray(welcome.quickReplies));
    assertEqual('Chatbot: state is INTAKE after welcome',
      Chatbot.getCurrentState(), 'INTAKE');

    // Partisan detection
    const partisan1 = Chatbot.process('Who should I vote for?');
    assert('Chatbot: partisan query returns neutralAlert',
      partisan1 && partisan1.neutralAlert === true);

    const partisan2 = Chatbot.process('I support the Democrats');
    assert('Chatbot: party mention triggers neutrality',
      partisan2 && partisan2.neutralAlert === true);

    // Normal flow — reset first
    Chatbot.process('start over');

    // Process state input
    const stateResp = Chatbot.process('California');
    assertExists('Chatbot: state detection response', stateResp);
    assert('Chatbot: asks for method after state',
      stateResp.text.includes('in-person') || stateResp.text.includes('mail'));

    // Process method
    const methodResp = Chatbot.process('In-person voting');
    assertExists('Chatbot: method response (roadmap)', methodResp);
    assert('Chatbot: roadmap has milestone buttons',
      methodResp.milestoneButtons && methodResp.milestoneButtons.length > 0);

    // Milestone detail
    const detail = Chatbot.selectMilestone('registration');
    assertExists('Chatbot: milestone detail response', detail);
    assert('Chatbot: detail has text', detail.text.length > 0);
    assert('Chatbot: detail has quick replies',
      Array.isArray(detail.quickReplies) && detail.quickReplies.length > 0);

    // Start over command
    const reset = Chatbot.process('start over');
    assertEqual('Chatbot: start over returns to INTAKE',
      Chatbot.getCurrentState(), 'INTAKE');

    // Exposed constants for testing
    assert('Chatbot: STATES exposed', Chatbot._STATES !== undefined);
    assert('Chatbot: COMMANDS exposed', Chatbot._COMMANDS !== undefined);
    assert('Chatbot: MILESTONE_KEYWORDS exposed', Chatbot._MILESTONE_KEYWORDS !== undefined);

    console.groupEnd();
  }

  /* ═══════════════════════════════════════════════
   *  TEST SUITE: Utils
   * ═══════════════════════════════════════════════ */
  function testUtils() {
    console.group('🔧 Utils Tests');

    // Date formatting
    const testDate = new Date('2026-11-03T00:00:00');
    assertEqual('Utils: formatDate', Utils.formatDate(testDate), 'November 3, 2026');
    assertEqual('Utils: formatDate invalid', Utils.formatDate(new Date('invalid')), 'Date unavailable');

    // daysUntil
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    assertEqual('Utils: daysUntil future', Utils.daysUntil(futureDate), 10);

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    assertEqual('Utils: daysUntil past', Utils.daysUntil(pastDate), -5);

    // Markdown parser
    assertEqual('Utils: bold parsing',
      Utils.parseMarkdown('**hello**'), '<strong>hello</strong>');

    assertEqual('Utils: italic parsing',
      Utils.parseMarkdown('*hello*'), '<em>hello</em>');

    assert('Utils: link parsing has href',
      Utils.parseMarkdown('[click](https://example.com)').includes('href="https://example.com"'));

    assert('Utils: link has noopener',
      Utils.parseMarkdown('[click](https://example.com)').includes('noopener'));

    assertEqual('Utils: empty markdown', Utils.parseMarkdown(''), '');

    // Countdown badge
    assert('Utils: countdown urgent <=7', Utils.countdownBadge(5).includes('urgent'));
    assert('Utils: countdown passed <0', Utils.countdownBadge(-1).includes('passed'));
    assert('Utils: countdown today', Utils.countdownBadge(0).includes('Today'));
    assert('Utils: countdown normal 30', Utils.countdownBadge(30).includes('30 days'));
    assert('Utils: countdown aria-label', Utils.countdownBadge(10).includes('aria-label'));

    // Delay
    assert('Utils: delay returns promise', Utils.delay(1) instanceof Promise);

    // Debounce
    assert('Utils: debounce returns function', typeof Utils.debounce(() => {}, 100) === 'function');

    // uniqueId
    const id1 = Utils.uniqueId('test');
    const id2 = Utils.uniqueId('test');
    assert('Utils: uniqueId starts with prefix', id1.startsWith('test-'));
    assert('Utils: uniqueId is unique', id1 !== id2);

    console.groupEnd();
  }

  /* ═══════════════════════════════════════════════
   *  TEST SUITE: Analytics
   * ═══════════════════════════════════════════════ */
  function testAnalytics() {
    console.group('📈 Analytics Tests');

    // Analytics should not throw even without Firebase
    assert('Analytics: logEvent does not throw', (() => {
      try { Analytics.logEvent('test_event', { key: 'value' }); return true; }
      catch (_) { return false; }
    })());

    assert('Analytics: trackStateSelection does not throw', (() => {
      try { Analytics.trackStateSelection('CA'); return true; }
      catch (_) { return false; }
    })());

    assert('Analytics: trackPartisanFilter does not throw', (() => {
      try { Analytics.trackPartisanFilter(); return true; }
      catch (_) { return false; }
    })());

    assert('Analytics: optOut does not throw', (() => {
      try { Analytics.optOut(); return true; }
      catch (_) { return false; }
    })());

    assert('Analytics: optIn does not throw', (() => {
      try { Analytics.optIn(); return true; }
      catch (_) { return false; }
    })());

    console.groupEnd();
  }

  /* ═══════════════════════════════════════════════
   *  RUN ALL TESTS
   * ═══════════════════════════════════════════════ */
  function runAll() {
    _passed = 0;
    _failed = 0;
    _results = [];

    console.log('%c🧪 CivicGuide AI — Test Suite v1.0.0', 'font-size:16px;font-weight:bold;color:#818cf8;');
    console.log('─'.repeat(50));

    testSecurity();
    testDataIntegrity();
    testStateDetection();
    testChatbotFlow();
    testUtils();
    testAnalytics();

    console.log('─'.repeat(50));
    const totalColor = _failed === 0 ? 'color:#34d399' : 'color:#f87171';
    console.log(`%c✅ Passed: ${_passed}  ❌ Failed: ${_failed}  📊 Total: ${_passed + _failed}`, `font-size:14px;font-weight:bold;${totalColor}`);

    return { passed: _passed, failed: _failed, total: _passed + _failed, results: _results };
  }

  /**
   * Render test results to the DOM (for test.html).
   * @param {HTMLElement} container - Target container element
   */
  function renderResults(container) {
    const results = runAll();
    const statusClass = results.failed === 0 ? 'test-pass' : 'test-fail';

    let html = `<div class="test-summary ${statusClass}">
      <h2>${results.failed === 0 ? '✅ All Tests Passed!' : `❌ ${results.failed} Test(s) Failed`}</h2>
      <p>Passed: ${results.passed} | Failed: ${results.failed} | Total: ${results.total}</p>
    </div><div class="test-details">`;

    results.results.forEach(r => {
      const cls = r.status === 'PASS' ? 'result-pass' : 'result-fail';
      const icon = r.status === 'PASS' ? '✅' : '❌';
      html += `<div class="test-result ${cls}">${icon} ${r.name}</div>`;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  return { runAll, renderResults };
})();
