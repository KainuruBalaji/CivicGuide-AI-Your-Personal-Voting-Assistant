/**
 * @module CivicGuideChatbot
 * @description Conversation engine using a finite state machine architecture.
 * Handles intent detection, response generation, neutrality enforcement,
 * and personalized voter roadmap creation for all 50 US states + DC.
 * @version 2.0.0
 */

const Chatbot = (() => {
  /* ── Conversation States ── */
  const STATES = Object.freeze({
    WELCOME: 'WELCOME',
    INTAKE: 'INTAKE',
    ROADMAP: 'ROADMAP',
    STEP_DETAIL: 'STEP_DETAIL',
    FOLLOWUP: 'FOLLOWUP'
  });

  /* ── Universal Command Strings ── */
  const COMMANDS = Object.freeze({
    START_OVER: 'start over',
    RESET: 'reset',
    RESTART: 'restart',
    BACK_TO_ROADMAP: 'back to roadmap',
    ROADMAP: 'roadmap',
    BACK: 'back',
    NEXT_MILESTONE: 'next milestone',
    NEXT_STEP: 'next step'
  });

  /* ── Shared Milestone Keyword Map (DRY — used in ROADMAP and STEP_DETAIL states) ── */
  const MILESTONE_KEYWORDS = Object.freeze({
    registration: ['registration', 'register', 'sign up'],
    absentee: ['absentee', 'ballot', 'mail', 'mail-in'],
    earlyVoting: ['early', 'early voting'],
    electionDay: ['election day', 'election', 'vote day', 'november']
  });

  /* ── Milestone Navigation Order ── */
  const MILESTONE_ORDER = ['registration', 'absentee', 'earlyVoting', 'electionDay'];

  /* ── State ── */
  let currentState = STATES.WELCOME;
  let userProfile = { state: null, stateData: null, method: null };
  let selectedMilestone = null;
  let milestones = null;

  /* ── Partisan Detection Patterns ── */
  const PARTISAN_PATTERNS = Object.freeze([
    /\b(democrats?|republicans?|gop|liberals?|conservatives?|left-wing|right-wing|maga|progressives?)\b/i,
    /\b(trump|biden|harris|desantis|obama|clinton|bernie|sanders|pelosi|mcconnell|aoc)\b/i,
    /\bwho should i vote for\b/i,
    /\bwhich party\b/i,
    /\bbest candidate\b/i,
    /\bvote for .+ (party|candidate)\b/i,
    /\b(pro-life|pro-choice|gun control|gun rights|defund|build the wall|green new deal)\b/i
  ]);

  /* ── Voting Method Keywords ── */
  const MAIL_KEYWORDS = ['mail', 'absentee', 'mail-in', 'postal', 'by mail', 'mail in'];
  const INPERSON_KEYWORDS = ['in-person', 'in person', 'polling', 'polls', 'walk in', 'election day', 'at the polls'];

  /**
   * Check if input contains partisan content.
   * @param {string} input - Sanitized user input
   * @returns {boolean}
   */
  function isPartisan(input) {
    return PARTISAN_PATTERNS.some(p => p.test(input));
  }

  /**
   * Detect voting method from input.
   * @param {string} input - Sanitized user input
   * @returns {string|null} 'mail', 'in-person', or null
   */
  function detectMethod(input) {
    const lower = input.toLowerCase();
    if (MAIL_KEYWORDS.some(k => lower.includes(k))) return 'mail';
    if (INPERSON_KEYWORDS.some(k => lower.includes(k))) return 'in-person';
    return null;
  }

  /**
   * Detect state from input using the data module's fuzzy matcher.
   * @param {string} input - Sanitized user input
   * @returns {object|null} State data object or null
   */
  function detectState(input) {
    return getStateData(input);
  }

  /**
   * Match user input against the shared milestone keyword map.
   * @param {string} lowerInput - Lowercased user input
   * @returns {string|null} Matched milestone key or null
   * @private
   */
  function _matchMilestoneKeyword(lowerInput) {
    for (const [key, terms] of Object.entries(MILESTONE_KEYWORDS)) {
      if (terms.some(t => lowerInput.includes(t))) {
        return key;
      }
    }
    return null;
  }

  /**
   * Generate the welcome message and transition to INTAKE state.
   * @returns {object} Bot response object
   */
  function getWelcomeMessage() {
    currentState = STATES.INTAKE;
    return {
      text: `👋 **Welcome to CivicGuide AI!**\n\nI'm your personal civic assistant, here to make sure you're 100% ready for **Election Day ${ELECTION_DAY.split('-')[0]}**. I'll build you a custom voting roadmap with every deadline and step you need.\n\n🗳️ To give you the right timeline and rules, could you tell me:\n- Your **State** (e.g., California, TX, New York)\n- Whether you plan to vote **in-person** or **by mail**?`,
      quickReplies: ['In-person voting', 'Vote by mail'],
      type: 'bot'
    };
  }

  /**
   * Generate the neutrality disclaimer response.
   * @returns {object} Bot response object with neutralAlert flag
   */
  function getNeutralityResponse() {
    Analytics.trackPartisanFilter();
    return {
      text: `⚖️ I am a **neutral civic guide** here to help with the logistics of voting. I cannot offer political opinions, but I encourage you to research candidates using official state/local voter guides.\n\nLet's get back on track! 🗳️`,
      neutralAlert: true,
      quickReplies: currentState === STATES.INTAKE
        ? ['In-person voting', 'Vote by mail']
        : ['Back to roadmap', 'Start over'],
      type: 'bot'
    };
  }

  /**
   * Build the personalized voter roadmap response.
   * @returns {object} Bot response with milestone buttons
   */
  function buildRoadmap() {
    const sd = userProfile.stateData;
    milestones = getMilestones(sd);
    const prevState = currentState;
    currentState = STATES.ROADMAP;

    Analytics.trackConversationStep(prevState, STATES.ROADMAP);

    const methodLabel = userProfile.method === 'mail' ? '📬 By Mail' : '🏛️ In-Person';
    let text = `🎉 **Awesome! Here's your personalized Voter Roadmap for ${sd.name}!**\n\nVoting method: ${methodLabel}\n\n`;

    // Add special notes
    if (sd.notes) {
      text += `📌 *${sd.notes}*\n\n`;
    }

    text += `Here are your key milestones:`;

    const milestoneButtons = [];

    // Registration
    if (sd.regDeadlineDays > 0 || sd.sameDay) {
      const regInfo = sd.sameDay
        ? `Same-day registration available! (Regular deadline: ${Utils.formatDate(milestones.registration.date)})`
        : Utils.formatDate(milestones.registration.date);
      milestoneButtons.push({
        icon: '📝', label: `Registration Deadline — ${regInfo}`,
        countdown: Utils.daysUntil(milestones.registration.date),
        key: 'registration'
      });
    } else if (sd.abbr === 'ND') {
      milestoneButtons.push({
        icon: '✅', label: 'No Registration Required — North Dakota!',
        countdown: null, key: 'registration'
      });
    }

    // Absentee / mail ballot
    if (userProfile.method === 'mail') {
      milestoneButtons.push({
        icon: '📬', label: `Ballot Request Deadline — ${Utils.formatDate(milestones.absentee.date)}`,
        countdown: Utils.daysUntil(milestones.absentee.date),
        key: 'absentee'
      });
    }

    // Early voting
    if (sd.earlyVotingDays > 0 && userProfile.method === 'in-person') {
      milestoneButtons.push({
        icon: '⏰', label: `Early Voting Begins — ${Utils.formatDate(milestones.earlyVoting.date)}`,
        countdown: Utils.daysUntil(milestones.earlyVoting.date),
        key: 'earlyVoting'
      });
    }

    // Election Day
    milestoneButtons.push({
      icon: '🗳️', label: `Election Day — ${Utils.formatDate(milestones.electionDay.date)}`,
      countdown: Utils.daysUntil(milestones.electionDay.date),
      key: 'electionDay'
    });

    return {
      text,
      milestoneButtons,
      quickReplies: [],
      type: 'bot'
    };
  }

  /**
   * Generate detailed micro-steps for a selected milestone.
   * @param {string} key - Milestone key ('registration', 'absentee', 'earlyVoting', 'electionDay')
   * @returns {object} Bot response with detailed instructions
   */
  function getMilestoneDetail(key) {
    selectedMilestone = key;
    const prevState = currentState;
    currentState = STATES.STEP_DETAIL;
    const sd = userProfile.stateData;
    let text = '';

    Analytics.trackMilestoneView(key);
    Analytics.trackConversationStep(prevState, STATES.STEP_DETAIL);

    switch (key) {
      case 'registration': {
        if (sd.abbr === 'ND') {
          text = `✅ **Great news — No Registration Needed!**\n\nNorth Dakota is the only US state that doesn't require voter registration. Here's what you need instead:\n\n**Step 1:** Bring a valid **ID with your current address** to the polls.\n- Accepted: ND driver's license, tribal ID, or other govt-issued ID\n\n**Step 2:** If your ID doesn't have your current address, bring a supplemental document (utility bill, bank statement, etc.)\n\n**Step 3:** You're ready to vote! Just show up on Election Day or during early voting.\n\n🔗 [Check your voting info](${sd.statusUrl})`;
        } else {
          text = `📝 **Let's Get You Registered!**\n\nYou're taking a great step! Here's exactly what to do:\n\n**Step 1: Check if you're already registered**\n🔗 [Check your status here](${sd.statusUrl})\n\n**Step 2: Gather your documents**\nYou'll need:\n- ${sd.idRequired.join('\n- ')}\n${sd.onlineReg ? '\n**Step 3: Register online** (fastest method!)\n🔗 [Register at your state portal]('+sd.regUrl+')' : '\n**Step 3: Register by mail or in person**\nYour state doesn\'t offer online registration. Download the National Voter Registration Form or visit your county clerk.'}`;

          if (sd.sameDay) {
            text += `\n\n💡 **Bonus:** ${sd.name} offers **same-day registration**, so even if you miss the deadline, you can register at the polls! You'll need to bring valid ID and proof of address.`;
          }

          text += `\n\n⏰ **Deadline:** ${Utils.formatDate(milestones.registration.date)} — ${Utils.countdownBadge(Utils.daysUntil(milestones.registration.date))}`;
        }
        break;
      }
      case 'absentee': {
        text = `📬 **Mail-In / Absentee Ballot Steps**\n\nLet's make sure your vote gets counted from home!\n\n**Step 1: Request your ballot**\n🔗 [Visit your state portal](${sd.regUrl}) to request a mail ballot.\n- Deadline: **${Utils.formatDate(milestones.absentee.date)}**\n\n**Step 2: Watch your mailbox**\nBallots are typically mailed 4-6 weeks before Election Day. If you haven't received yours 2 weeks before the election, contact your county clerk!\n\n**Step 3: Fill it out carefully**\n- Use a black or blue pen\n- Follow all instructions — especially the **signature** on the envelope\n- Don't forget to sign!\n\n**Step 4: Return it on time**\nOptions:\n- **Mail it back** (allow 7+ days for delivery)\n- **Drop it off** at an official ballot drop box\n- **Hand-deliver** to your county election office\n\n⚠️ *A \"Provisional Ballot\" is like a backup ballot — if there's an issue with your record, they'll give you one so your vote can still be counted after verification.*`;
        break;
      }
      case 'earlyVoting': {
        text = `⏰ **Early Voting Guide**\n\nBeat the Election Day crowds!\n\n**When:** Early voting in ${sd.name} starts **${Utils.formatDate(milestones.earlyVoting.date)}** (${sd.earlyVotingDays} days before Election Day)\n\n**Step 1: Find your early voting location**\n🔗 [Look up locations](${sd.statusUrl})\nNote: Early voting locations may differ from your Election Day polling place!\n\n**Step 2: Bring required ID**\n- ${sd.idRequired.join('\n- ')}\n\n**Step 3: Go vote!**\nEarly voting locations often have shorter wait times, especially mid-week in the mornings.\n\n💡 **Pro tip:** Going on a weekday morning typically means the shortest lines!`;
        break;
      }
      case 'electionDay': {
        text = `🗳️ **Election Day Checklist**\n\n**Date:** ${Utils.formatDate(milestones.electionDay.date)}\n\n**Before you go:**\n- ✅ Confirm your polling place — 🔗 [Find it here](${sd.statusUrl})\n- ✅ Bring required ID: ${sd.idRequired[0]}\n- ✅ Know what's on your ballot — research candidates beforehand\n\n**At the polls:**\n- Polls are typically open **7:00 AM – 7:00 PM** (check your state for exact hours)\n- If you're in line when polls close, **you still have the right to vote!**\n- If there's an issue with your registration, ask for a **Provisional Ballot** *(think of it as a \"safety net\" ballot that gets verified and counted later)*\n\n**After voting:**\n- 🎉 Grab your "I Voted" sticker!\n- Share that you voted (but not who you voted for) to encourage others`;
        if (userProfile.method === 'mail') {
          text += `\n\n📬 **Mail ballot reminder:** If you haven't mailed your ballot yet, you may be able to drop it off at your polling place on Election Day!`;
        }
        break;
      }
    }

    text += `\n\n*⚠️ Always verify deadlines with your [local election authority](${sd.regUrl}). Rules can change!*`;

    return {
      text,
      quickReplies: ['Back to roadmap', 'Next milestone', 'Start over'],
      type: 'bot'
    };
  }

  /**
   * Main process function — routes user input through the state machine.
   * @param {string} rawInput - Raw (pre-sanitized) user input
   * @returns {object|null} Bot response object or null if input is empty
   */
  function process(rawInput) {
    const input = Security.sanitizeInput(rawInput);
    if (!input) return null;

    // Check for suspicious input
    if (Security.isSuspiciousInput(rawInput)) {
      return {
        text: `🛡️ I detected some unusual characters in your message. For security, I've sanitized the input. Could you rephrase your question?`,
        quickReplies: ['Start over'],
        type: 'bot'
      };
    }

    // Neutrality guard — always active
    if (isPartisan(input)) {
      return getNeutralityResponse();
    }

    // Handle universal commands
    const lower = input.toLowerCase();
    if (lower === COMMANDS.START_OVER || lower === COMMANDS.RESET || lower === COMMANDS.RESTART) {
      const prevState = currentState;
      currentState = STATES.WELCOME;
      userProfile = { state: null, stateData: null, method: null };
      selectedMilestone = null;
      milestones = null;
      Analytics.trackConversationStep(prevState, STATES.WELCOME);
      return getWelcomeMessage();
    }

    if (lower === COMMANDS.BACK_TO_ROADMAP || lower === COMMANDS.ROADMAP || lower === COMMANDS.BACK) {
      if (userProfile.stateData) {
        return buildRoadmap();
      }
    }

    // Handle "next milestone"
    if (lower.includes(COMMANDS.NEXT_MILESTONE) || lower.includes(COMMANDS.NEXT_STEP)) {
      if (milestones && selectedMilestone) {
        const idx = MILESTONE_ORDER.indexOf(selectedMilestone);
        if (idx < MILESTONE_ORDER.length - 1) {
          return getMilestoneDetail(MILESTONE_ORDER[idx + 1]);
        } else {
          return {
            text: `🎉 **You've covered all your milestones!** You're all set for Election Day. Is there anything else you'd like to review?`,
            quickReplies: ['Back to roadmap', 'Start over'],
            type: 'bot'
          };
        }
      }
    }

    // State machine routing
    switch (currentState) {
      case STATES.INTAKE: {
        const detectedMethod = detectMethod(input);
        const detectedState = detectedMethod ? null : detectState(input);

        if (detectedState) {
          userProfile.stateData = detectedState;
          Analytics.trackStateSelection(detectedState.abbr);
        }
        if (detectedMethod) {
          userProfile.method = detectedMethod;
          Analytics.trackMethodSelection(detectedMethod);
        }

        // If we only got method, ask for state
        if (!userProfile.stateData && userProfile.method) {
          return {
            text: `Great choice! Now, **which state** are you voting in? (e.g., "California", "TX", "New York")`,
            quickReplies: [],
            type: 'bot'
          };
        }

        // If we only got state, ask for method
        if (userProfile.stateData && !userProfile.method) {
          return {
            text: `Got it — **${userProfile.stateData.name}**! 🎯\n\nAre you planning to vote **in-person** at a polling place, or **by mail** (absentee)?`,
            quickReplies: ['In-person voting', 'Vote by mail'],
            type: 'bot'
          };
        }

        // If we have both, build roadmap
        if (userProfile.stateData && userProfile.method) {
          return buildRoadmap();
        }

        // Nothing detected
        return {
          text: `I'd love to help! Could you tell me **which state** you're voting in and whether you'd like to vote **in-person** or **by mail**?\n\nFor example: "I'm in Texas and want to vote in person"`,
          quickReplies: ['In-person voting', 'Vote by mail'],
          type: 'bot'
        };
      }

      case STATES.ROADMAP: {
        const matchedKey = _matchMilestoneKeyword(lower);
        if (matchedKey) return getMilestoneDetail(matchedKey);

        return {
          text: `Which milestone would you like to explore? You can click one of the buttons above, or type something like "registration" or "election day".`,
          quickReplies: ['Registration', 'Election Day', 'Start over'],
          type: 'bot'
        };
      }

      case STATES.STEP_DETAIL:
      case STATES.FOLLOWUP: {
        const matchedKey = _matchMilestoneKeyword(lower);
        if (matchedKey) return getMilestoneDetail(matchedKey);

        // Generic follow-up
        currentState = STATES.FOLLOWUP;
        return {
          text: `Great question! For specific details about your situation, I'd recommend checking with your **${userProfile.stateData.name} election authority**:\n\n🔗 [Official Portal](${userProfile.stateData.regUrl})\n\nIs there another milestone you'd like to explore?`,
          quickReplies: ['Back to roadmap', 'Next milestone', 'Start over'],
          type: 'bot'
        };
      }

      default:
        return getWelcomeMessage();
    }
  }

  /**
   * Handle milestone button click (public API).
   * @param {string} key - Milestone key
   * @returns {object} Bot response object
   */
  function selectMilestone(key) {
    return getMilestoneDetail(key);
  }

  return {
    getWelcomeMessage,
    process,
    selectMilestone,
    getCurrentState: () => currentState,
    getUserProfile: () => ({ ...userProfile }),
    /** @type {Readonly<object>} Exposed for testing */
    _STATES: STATES,
    _COMMANDS: COMMANDS,
    _MILESTONE_KEYWORDS: MILESTONE_KEYWORDS
  };
})();
