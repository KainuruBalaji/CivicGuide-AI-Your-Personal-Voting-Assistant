/**
 * @module CivicGuideTests
 * @description Comprehensive zero-dependency test suite for CivicGuide AI.
 * Covers: Security, Data Integrity, State Detection, Chatbot Flow, Utils,
 * Analytics, Accessibility, Edge Cases, and Error Handling.
 * @version 2.0.0
 */

const TestRunner = (() => {
  let _passed = 0, _failed = 0, _results = [];

  function assert(name, condition) {
    if (condition) { _passed++; _results.push({ name, status: 'PASS' }); }
    else { _failed++; _results.push({ name, status: 'FAIL' }); console.error(`❌ FAIL: ${name}`); }
  }
  function assertEqual(name, actual, expected) {
    const pass = actual === expected;
    if (!pass) console.error(`❌ FAIL: ${name} — expected "${expected}", got "${actual}"`);
    assert(name, pass);
  }
  function assertExists(name, value) { assert(name, value !== null && value !== undefined); }
  function assertNull(name, value) { assert(name, value === null || value === undefined); }

  /* ═══ Security Tests ═══ */
  function testSecurity() {
    console.group('🔒 Security Tests');
    assertEqual('Sanitize: strips HTML tags', Security.sanitizeInput('<script>alert(1)</script>Hello'), 'alert(1)Hello');
    assertEqual('Sanitize: encodes ampersands', Security.sanitizeInput('Tom & Jerry').includes('&amp;'), true);
    assertEqual('Sanitize: returns empty for non-string', Security.sanitizeInput(123), '');
    assertEqual('Sanitize: returns empty for null', Security.sanitizeInput(null), '');
    assertEqual('Sanitize: trims whitespace', Security.sanitizeInput('  hello  '), 'hello');
    assertEqual('Sanitize: truncates long input', Security.sanitizeInput('a'.repeat(600)).length <= 500, true);
    assertEqual('Sanitize: handles undefined', Security.sanitizeInput(undefined), '');
    assertEqual('Sanitize: handles boolean', Security.sanitizeInput(true), '');
    assertEqual('Sanitize: strips nested tags', Security.sanitizeInput('<div><b>hi</b></div>').includes('<div>'), false);
    assertEqual('Sanitize: removes null bytes', Security.sanitizeInput('hel\0lo'), 'hello');
    assert('Suspicious: detects <script>', Security.isSuspiciousInput('<script>alert(1)</script>'));
    assert('Suspicious: detects javascript:', Security.isSuspiciousInput('javascript:void(0)'));
    assert('Suspicious: detects onload=', Security.isSuspiciousInput('<img onload=alert(1)>'));
    assert('Suspicious: detects eval(', Security.isSuspiciousInput('eval("code")'));
    assert('Suspicious: detects data: URI', Security.isSuspiciousInput('data: text/html,<h1>x</h1>'));
    assert('Suspicious: detects vbscript:', Security.isSuspiciousInput('vbscript:msgbox'));
    assert('Suspicious: allows normal text', !Security.isSuspiciousInput('I want to vote in California'));
    assert('Suspicious: allows state names', !Security.isSuspiciousInput('New York'));
    assert('Suspicious: allows questions', !Security.isSuspiciousInput('How do I register to vote?'));
    assert('Suspicious: handles non-string', !Security.isSuspiciousInput(42));
    assertEqual('Validate: empty string invalid', Security.validateInputLength('').valid, false);
    assertEqual('Validate: normal string valid', Security.validateInputLength('Hello').valid, true);
    assertEqual('Validate: long string invalid', Security.validateInputLength('a'.repeat(501)).valid, false);
    assertEqual('Validate: whitespace-only invalid', Security.validateInputLength('   ').valid, false);
    assert('Validate: returns message on invalid', Security.validateInputLength('').message.length > 0);
    assert('Rate limit: first message allowed', Security.checkRateLimit());
    console.groupEnd();
  }

  /* ═══ Data Integrity Tests ═══ */
  function testDataIntegrity() {
    console.group('📊 Data Integrity Tests');
    const stateKeys = Object.keys(STATE_DATA);
    assertEqual('Data: 51 entries (50 states + DC)', stateKeys.length, 51);
    const REQUIRED_FIELDS = ['name','abbr','regDeadlineDays','regUrl','absenteeDeadlineDays','earlyVotingDays','idRequired','statusUrl','sameDay','onlineReg','notes'];
    let allFieldsPresent = true;
    stateKeys.forEach(key => { REQUIRED_FIELDS.forEach(field => { if (STATE_DATA[key][field] === undefined) { allFieldsPresent = false; } }); });
    assert('Data: all required fields present', allFieldsPresent);
    let abbrOk = true;
    stateKeys.forEach(key => { if (STATE_DATA[key].abbr !== key) abbrOk = false; });
    assert('Data: abbreviation keys match abbr fields', abbrOk);
    let allHttps = true;
    stateKeys.forEach(key => { const s = STATE_DATA[key]; if (!s.regUrl.startsWith('https://') || !s.statusUrl.startsWith('https://')) allHttps = false; });
    assert('Data: all URLs use HTTPS', allHttps);
    let idValid = true;
    stateKeys.forEach(key => { if (!Array.isArray(STATE_DATA[key].idRequired) || STATE_DATA[key].idRequired.length === 0) idValid = false; });
    assert('Data: idRequired is non-empty array', idValid);
    let numericOk = true;
    stateKeys.forEach(key => { const s = STATE_DATA[key]; if (typeof s.regDeadlineDays !== 'number' || typeof s.absenteeDeadlineDays !== 'number' || typeof s.earlyVotingDays !== 'number') numericOk = false; });
    assert('Data: deadline fields are numbers', numericOk);
    let boolOk = true;
    stateKeys.forEach(key => { const s = STATE_DATA[key]; if (typeof s.sameDay !== 'boolean' || typeof s.onlineReg !== 'boolean') boolOk = false; });
    assert('Data: boolean fields are booleans', boolOk);
    let notesOk = true;
    stateKeys.forEach(key => { if (typeof STATE_DATA[key].notes !== 'string' || STATE_DATA[key].notes.length === 0) notesOk = false; });
    assert('Data: every state has notes', notesOk);
    assertEqual('Data: ELECTION_DAY is 2026-11-03', ELECTION_DAY, '2026-11-03');
    const caMilestones = getMilestones(STATE_DATA.CA);
    assertExists('Data: CA milestones has registration', caMilestones.registration);
    assertExists('Data: CA milestones has electionDay', caMilestones.electionDay);
    assert('Data: election day is valid date', caMilestones.electionDay.date instanceof Date);
    assert('Data: registration before election day', caMilestones.registration.date <= caMilestones.electionDay.date);
    assert('Data: STATE_DATA is frozen', Object.isFrozen(STATE_DATA));
    assert('Data: STATE_LOOKUP is frozen', Object.isFrozen(STATE_LOOKUP));
    assertEqual('Data: ND has 0 reg deadline', STATE_DATA.ND.regDeadlineDays, 0);
    assertEqual('Data: OR has 0 early voting (all-mail)', STATE_DATA.OR.earlyVotingDays, 0);
    console.groupEnd();
  }

  /* ═══ State Detection Tests ═══ */
  function testStateDetection() {
    console.group('🔍 State Detection Tests');
    assertExists('Detect: "California" → CA', getStateData('California'));
    assertEqual('Detect: "California" name', getStateData('California').abbr, 'CA');
    assertExists('Detect: "california" (lowercase)', getStateData('california'));
    assertEqual('Detect: "TX" abbreviation', getStateData('TX').abbr, 'TX');
    assertEqual('Detect: "tx" lowercase abbr', getStateData('tx').abbr, 'TX');
    assertEqual('Detect: "New York"', getStateData('New York').abbr, 'NY');
    assertEqual('Detect: "north carolina"', getStateData('north carolina').abbr, 'NC');
    assertEqual('Detect: "District of Columbia"', getStateData('District of Columbia').abbr, 'DC');
    assertExists('Detect: "I live in Texas"', getStateData('I live in Texas'));
    assertEqual('Detect: "west virginia"', getStateData('west virginia').abbr, 'WV');
    assertEqual('Detect: "rhode island"', getStateData('rhode island').abbr, 'RI');
    assertEqual('Detect: "south dakota"', getStateData('south dakota').abbr, 'SD');
    assertNull('Detect: "In-person voting" no match', getStateData('In-person voting'));
    assertNull('Detect: "vote by mail" no match', getStateData('vote by mail'));
    assertNull('Detect: empty string', getStateData(''));
    assertNull('Detect: null', getStateData(null));
    assertNull('Detect: gibberish', getStateData('xyzzy123'));
    assertEqual('Detect: North Dakota no reg', STATE_DATA.ND.regDeadlineDays, 0);
    console.groupEnd();
  }

  /* ═══ Chatbot Flow Tests ═══ */
  function testChatbotFlow() {
    console.group('🤖 Chatbot Flow Tests');
    const welcome = Chatbot.getWelcomeMessage();
    assertExists('Chatbot: welcome exists', welcome);
    assert('Chatbot: welcome has text', welcome.text.length > 0);
    assert('Chatbot: welcome has quickReplies', Array.isArray(welcome.quickReplies));
    assert('Chatbot: welcome quickReplies non-empty', welcome.quickReplies.length > 0);
    assertEqual('Chatbot: state is INTAKE', Chatbot.getCurrentState(), 'INTAKE');
    const p1 = Chatbot.process('Who should I vote for?');
    assert('Chatbot: partisan query neutralAlert', p1 && p1.neutralAlert === true);
    const p2 = Chatbot.process('I support the Democrats');
    assert('Chatbot: party mention neutrality', p2 && p2.neutralAlert === true);
    const p3 = Chatbot.process('What about Trump?');
    assert('Chatbot: candidate name neutrality', p3 && p3.neutralAlert === true);
    const p4 = Chatbot.process('pro-choice stance');
    assert('Chatbot: political issue neutrality', p4 && p4.neutralAlert === true);
    Chatbot.process('start over');
    const sr = Chatbot.process('California');
    assertExists('Chatbot: state response', sr);
    assert('Chatbot: asks for method', sr.text.includes('in-person') || sr.text.includes('mail'));
    const mr = Chatbot.process('In-person voting');
    assertExists('Chatbot: roadmap', mr);
    assert('Chatbot: has milestone buttons', mr.milestoneButtons && mr.milestoneButtons.length > 0);
    assertEqual('Chatbot: state is ROADMAP', Chatbot.getCurrentState(), 'ROADMAP');
    const d = Chatbot.selectMilestone('registration');
    assertExists('Chatbot: milestone detail', d);
    assert('Chatbot: detail has text', d.text.length > 0);
    assert('Chatbot: detail has quick replies', d.quickReplies.length > 0);
    assertEqual('Chatbot: state is STEP_DETAIL', Chatbot.getCurrentState(), 'STEP_DETAIL');
    const next = Chatbot.process('next milestone');
    assertExists('Chatbot: next milestone works', next);
    Chatbot.process('start over');
    Chatbot.process('Florida');
    const mailResp = Chatbot.process('Vote by mail');
    assert('Chatbot: mail roadmap has absentee', mailResp.milestoneButtons.some(m => m.key === 'absentee'));
    const profile = Chatbot.getUserProfile();
    assert('Chatbot: getUserProfile returns object', typeof profile === 'object');
    const reset = Chatbot.process('start over');
    assertEqual('Chatbot: reset to INTAKE', Chatbot.getCurrentState(), 'INTAKE');
    const sus = Chatbot.process('<script>alert(1)</script>');
    assert('Chatbot: XSS blocked', sus && sus.text.includes('unusual'));
    assert('Chatbot: STATES exposed', Chatbot._STATES !== undefined);
    assert('Chatbot: COMMANDS exposed', Chatbot._COMMANDS !== undefined);
    assert('Chatbot: MILESTONE_KEYWORDS exposed', Chatbot._MILESTONE_KEYWORDS !== undefined);
    assert('Chatbot: STATES is frozen', Object.isFrozen(Chatbot._STATES));
    console.groupEnd();
  }

  /* ═══ Utils Tests ═══ */
  function testUtils() {
    console.group('🔧 Utils Tests');
    const td = new Date('2026-11-03T00:00:00');
    assertEqual('Utils: formatDate', Utils.formatDate(td), 'November 3, 2026');
    assertEqual('Utils: formatDate invalid', Utils.formatDate(new Date('invalid')), 'Date unavailable');
    assertEqual('Utils: formatDate non-date', Utils.formatDate('not a date'), 'Date unavailable');
    const future = new Date(); future.setDate(future.getDate() + 10);
    assertEqual('Utils: daysUntil future', Utils.daysUntil(future), 10);
    const past = new Date(); past.setDate(past.getDate() - 5);
    assertEqual('Utils: daysUntil past', Utils.daysUntil(past), -5);
    assertEqual('Utils: daysUntil today', Utils.daysUntil(new Date()), 0);
    assertEqual('Utils: bold parsing', Utils.parseMarkdown('**hello**'), '<strong>hello</strong>');
    assertEqual('Utils: italic parsing', Utils.parseMarkdown('*hello*'), '<em>hello</em>');
    assert('Utils: link has href', Utils.parseMarkdown('[click](https://example.com)').includes('href="https://example.com"'));
    assert('Utils: link has noopener', Utils.parseMarkdown('[click](https://example.com)').includes('noopener'));
    assert('Utils: link has target blank', Utils.parseMarkdown('[click](https://example.com)').includes('target="_blank"'));
    assertEqual('Utils: empty markdown', Utils.parseMarkdown(''), '');
    assertEqual('Utils: null markdown', Utils.parseMarkdown(null), '');
    assert('Utils: bold+italic combo', Utils.parseMarkdown('**bold** and *italic*').includes('<strong>') && Utils.parseMarkdown('**bold** and *italic*').includes('<em>'));
    assert('Utils: countdown urgent <=7', Utils.countdownBadge(5).includes('urgent'));
    assert('Utils: countdown passed <0', Utils.countdownBadge(-1).includes('passed'));
    assert('Utils: countdown today', Utils.countdownBadge(0).includes('Today'));
    assert('Utils: countdown normal 30', Utils.countdownBadge(30).includes('30 days'));
    assert('Utils: countdown far away', Utils.countdownBadge(100).includes('away'));
    assert('Utils: countdown aria-label', Utils.countdownBadge(10).includes('aria-label'));
    assert('Utils: delay returns promise', Utils.delay(1) instanceof Promise);
    assert('Utils: debounce returns function', typeof Utils.debounce(() => {}, 100) === 'function');
    const id1 = Utils.uniqueId('test'), id2 = Utils.uniqueId('test');
    assert('Utils: uniqueId prefix', id1.startsWith('test-'));
    assert('Utils: uniqueId unique', id1 !== id2);
    assert('Utils: uniqueId default prefix', Utils.uniqueId().startsWith('cg-'));
    console.groupEnd();
  }

  /* ═══ Analytics Tests ═══ */
  function testAnalytics() {
    console.group('📈 Analytics Tests');
    const noThrow = (fn) => { try { fn(); return true; } catch(_) { return false; } };
    assert('Analytics: logEvent safe', noThrow(() => Analytics.logEvent('test', { k: 'v' })));
    assert('Analytics: trackStateSelection safe', noThrow(() => Analytics.trackStateSelection('CA')));
    assert('Analytics: trackMethodSelection safe', noThrow(() => Analytics.trackMethodSelection('mail')));
    assert('Analytics: trackMilestoneView safe', noThrow(() => Analytics.trackMilestoneView('registration')));
    assert('Analytics: trackPartisanFilter safe', noThrow(() => Analytics.trackPartisanFilter()));
    assert('Analytics: trackConversationStep safe', noThrow(() => Analytics.trackConversationStep('INTAKE', 'ROADMAP')));
    assert('Analytics: trackEngagement safe', noThrow(() => Analytics.trackEngagement()));
    assert('Analytics: optOut safe', noThrow(() => Analytics.optOut()));
    assert('Analytics: optIn safe', noThrow(() => Analytics.optIn()));
    assert('Analytics: logEvent with empty params', noThrow(() => Analytics.logEvent('test')));
    console.groupEnd();
  }

  /* ═══ Accessibility Tests ═══ */
  function testAccessibility() {
    console.group('♿ Accessibility Tests');
    assert('A11y: html has lang', document.documentElement.getAttribute('lang') === 'en');
    assert('A11y: page has h1', document.querySelectorAll('h1').length === 1);
    assert('A11y: skip link exists', !!document.getElementById('skip-link'));
    assert('A11y: skip link has href', document.getElementById('skip-link')?.getAttribute('href') === '#chat-input');
    assert('A11y: chat input has label', !!document.querySelector('label[for="chat-input"]'));
    assert('A11y: chat input has aria-label', !!document.getElementById('chat-input')?.getAttribute('aria-label'));
    assert('A11y: send btn has aria-label', !!document.getElementById('send-btn')?.getAttribute('aria-label'));
    assert('A11y: messages has role=log', document.getElementById('chat-messages')?.getAttribute('role') === 'log');
    assert('A11y: messages has aria-live', !!document.getElementById('chat-messages')?.getAttribute('aria-live'));
    assert('A11y: sr announcements region', !!document.getElementById('sr-announcements'));
    assert('A11y: header has role=banner', !!document.querySelector('[role="banner"]'));
    assert('A11y: footer has role=contentinfo', !!document.querySelector('[role="contentinfo"]'));
    assert('A11y: main element exists', !!document.querySelector('main'));
    assert('A11y: noscript exists', !!document.querySelector('noscript'));
    assert('A11y: input has maxlength', document.getElementById('chat-input')?.getAttribute('maxlength') === '500');
    assert('A11y: input has enterkeyhint', !!document.getElementById('chat-input')?.getAttribute('enterkeyhint'));
    assert('A11y: meta description exists', !!document.querySelector('meta[name="description"]'));
    assert('A11y: meta viewport exists', !!document.querySelector('meta[name="viewport"]'));
    assert('A11y: manifest link exists', !!document.querySelector('link[rel="manifest"]'));
    console.groupEnd();
  }

  /* ═══ PWA / Google Services Tests ═══ */
  function testGoogleServices() {
    console.group('🔥 Google Services Tests');
    assert('GS: Firebase SDK loaded', typeof firebase !== 'undefined');
    assert('GS: Firebase has analytics', typeof firebase !== 'undefined' && typeof firebase.analytics === 'function');
    assert('GS: Firebase has performance', typeof firebase !== 'undefined' && typeof firebase.performance === 'function');
    assert('GS: manifest.json linked', !!document.querySelector('link[rel="manifest"]'));
    assert('GS: theme-color set', !!document.querySelector('meta[name="theme-color"]'));
    assert('GS: JSON-LD structured data', !!document.querySelector('script[type="application/ld+json"]'));
    const jsonLd = document.querySelector('script[type="application/ld+json"]');
    let ldValid = false;
    try { const d = JSON.parse(jsonLd.textContent); ldValid = d['@type'] === 'WebApplication' && d.name === 'CivicGuide AI'; } catch(_) {}
    assert('GS: JSON-LD is valid and correct', ldValid);
    assert('GS: Google Fonts loaded', !!document.querySelector('link[href*="fonts.googleapis.com"]'));
    assert('GS: preconnect fonts.googleapis', !!document.querySelector('link[rel="preconnect"][href*="fonts.googleapis"]'));
    assert('GS: preconnect gstatic', !!document.querySelector('link[rel="preconnect"][href*="gstatic"]'));
    assert('GS: OG title exists', !!document.querySelector('meta[property="og:title"]'));
    assert('GS: Twitter card exists', !!document.querySelector('meta[name="twitter:card"]'));
    assert('GS: serviceWorker API exists', 'serviceWorker' in navigator);
    console.groupEnd();
  }

  /* ═══ Run All ═══ */
  function runAll() {
    _passed = 0; _failed = 0; _results = [];
    console.log('%c🧪 CivicGuide AI — Test Suite v2.0.0', 'font-size:16px;font-weight:bold;color:#818cf8;');
    testSecurity();
    testDataIntegrity();
    testStateDetection();
    testChatbotFlow();
    testUtils();
    testAnalytics();
    testAccessibility();
    testGoogleServices();
    const c = _failed === 0 ? 'color:#34d399' : 'color:#f87171';
    console.log(`%c✅ Passed: ${_passed}  ❌ Failed: ${_failed}  📊 Total: ${_passed + _failed}`, `font-size:14px;font-weight:bold;${c}`);
    return { passed: _passed, failed: _failed, total: _passed + _failed, results: _results };
  }

  function renderResults(container) {
    const r = runAll();
    const sc = r.failed === 0 ? 'test-pass' : 'test-fail';
    let html = `<div class="test-summary ${sc}"><h2>${r.failed === 0 ? '✅ All Tests Passed!' : `❌ ${r.failed} Test(s) Failed`}</h2><p>Passed: ${r.passed} | Failed: ${r.failed} | Total: ${r.total}</p></div><div class="test-details">`;
    r.results.forEach(t => { html += `<div class="test-result ${t.status === 'PASS' ? 'result-pass' : 'result-fail'}">${t.status === 'PASS' ? '✅' : '❌'} ${t.name}</div>`; });
    html += '</div>';
    container.innerHTML = html;
  }

  return { runAll, renderResults };
})();
