/**
 * @module CivicGuideApp
 * @description Main UI controller — initializes chat, handles events,
 * renders messages with accessibility support, and manages focus.
 * @version 2.0.0
 */

const App = (() => {
  /** @type {HTMLElement} Chat messages container */
  let messagesContainer;
  /** @type {HTMLInputElement} Chat input field */
  let inputField;
  /** @type {HTMLButtonElement} Send button */
  let sendButton;

  /** @constant {number} Maximum messages kept in DOM for performance */
  const MAX_DOM_MESSAGES = 100;

  /** Firebase configuration for analytics */
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDemo-CivicGuide",
    authDomain: "civicguide-ai-election.firebaseapp.com",
    projectId: "civicguide-ai-election",
    storageBucket: "civicguide-ai-election.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:abcdef1234567890",
    measurementId: "G-XXXXXXXXXX"
  };

  /**
   * Initialize the application.
   * Sets up DOM references, event listeners, error handlers, and analytics.
   */
  function init() {
    // DOM references with validation
    messagesContainer = document.getElementById('chat-messages');
    inputField = document.getElementById('chat-input');
    sendButton = document.getElementById('send-btn');

    if (!messagesContainer || !inputField || !sendButton) {
      console.error('[CivicGuide] Critical DOM elements missing — cannot initialize.');
      return;
    }

    // Event listeners
    sendButton.addEventListener('click', handleSend);
    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // Global error handler
    window.addEventListener('error', (event) => {
      console.error('[CivicGuide] Unhandled error:', event.message);
      Analytics.logEvent('app_error', { message: event.message?.substring(0, 100) });
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('[CivicGuide] Unhandled promise rejection:', event.reason);
      Analytics.logEvent('app_error', { message: String(event.reason)?.substring(0, 100) });
    });

    // Track engagement on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        Analytics.trackEngagement();
      }
    });

    // Initialize analytics (privacy-first)
    Analytics.init(FIREBASE_CONFIG);
    Analytics.logEvent('app_loaded');

    // Show welcome message with a slight delay for effect
    setTimeout(async () => {
      const welcome = Chatbot.getWelcomeMessage();
      await showTypingThenMessage(welcome);
    }, 600);
  }

  /**
   * Handle send button click or Enter key.
   * Validates input, checks rate limits, and processes through chatbot.
   * @returns {Promise<void>}
   */
  async function handleSend() {
    const raw = inputField.value.trim();
    if (!raw) return;

    // Validate input length
    const validation = Security.validateInputLength(raw);
    if (!validation.valid) {
      showSystemMessage(`⚠️ ${validation.message}`);
      return;
    }

    // Rate limit check
    if (!Security.checkRateLimit()) {
      showSystemMessage('⏳ Please slow down a bit!');
      return;
    }

    // Render user message
    renderUserMessage(raw);
    inputField.value = '';
    inputField.focus();

    // Process through chatbot
    const response = Chatbot.process(raw);
    if (response) {
      await showTypingThenMessage(response);
    }
  }

  /**
   * Handle quick reply button click.
   * @param {string} text - Quick reply text
   * @returns {Promise<void>}
   */
  async function handleQuickReply(text) {
    renderUserMessage(text);

    const response = Chatbot.process(text);
    if (response) {
      await showTypingThenMessage(response);
    }

    // Return focus to input after quick reply
    inputField.focus();
  }

  /**
   * Handle milestone button click.
   * @param {string} key - Milestone key
   * @returns {Promise<void>}
   */
  async function handleMilestoneClick(key) {
    const labelMap = {
      registration: '📝 Registration Deadline',
      absentee: '📬 Ballot Request Deadline',
      earlyVoting: '⏰ Early Voting',
      electionDay: '🗳️ Election Day'
    };
    renderUserMessage(labelMap[key] || key);

    const response = Chatbot.selectMilestone(key);
    if (response) {
      await showTypingThenMessage(response);
    }

    // Return focus to input
    inputField.focus();
  }

  /**
   * Show typing indicator, then render the bot message.
   * Sets aria-busy during typing for screen reader support.
   * @param {object} response - Bot response object
   * @returns {Promise<void>}
   */
  async function showTypingThenMessage(response) {
    sendButton.disabled = true;
    messagesContainer.setAttribute('aria-busy', 'true');
    showTypingIndicator();

    // Variable delay based on response length
    const textLen = response.text ? response.text.length : 0;
    const delay = Math.min(800 + textLen * 2, 2000);
    await Utils.delay(delay);

    hideTypingIndicator();
    messagesContainer.setAttribute('aria-busy', 'false');
    renderBotMessage(response);
    sendButton.disabled = false;
    inputField.focus();
  }

  /**
   * Render a user message bubble.
   * Uses textContent (not innerHTML) for XSS safety.
   * @param {string} text - User message text
   */
  function renderUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'message message--user';
    msg.setAttribute('role', 'listitem');
    msg.innerHTML = `
      <div class="message__avatar" aria-hidden="true">👤</div>
      <div class="message__content"></div>
    `;
    // Use textContent for user messages (XSS safe)
    msg.querySelector('.message__content').textContent = text;
    messagesContainer.appendChild(msg);
    pruneOldMessages();
    Utils.scrollToBottom(messagesContainer);
  }

  /**
   * Render a bot message bubble with optional milestone buttons and quick replies.
   * @param {object} response - Bot response object
   */
  function renderBotMessage(response) {
    const msg = document.createElement('div');
    msg.className = 'message message--bot';
    msg.setAttribute('role', 'listitem');

    let contentHtml = Utils.parseMarkdown(response.text);

    // Add neutral alert if flagged
    if (response.neutralAlert) {
      contentHtml += `
        <div class="neutral-alert" role="alert">
          <span class="neutral-alert__icon" aria-hidden="true">⚖️</span>
          <span class="neutral-alert__text">This assistant is strictly non-partisan and cannot provide political opinions or candidate recommendations.</span>
        </div>`;
    }

    msg.innerHTML = `
      <div class="message__avatar" aria-hidden="true">🗳️</div>
      <div class="message__content">${contentHtml}</div>
    `;

    // Add milestone buttons if present
    if (response.milestoneButtons && response.milestoneButtons.length > 0) {
      const content = msg.querySelector('.message__content');
      response.milestoneButtons.forEach(m => {
        const btn = document.createElement('button');
        btn.className = 'milestone-btn';
        btn.setAttribute('data-milestone', m.key);
        btn.setAttribute('aria-label', `View details for ${m.label}`);
        btn.innerHTML = `
          <span class="milestone-btn__icon" aria-hidden="true">${m.icon}</span>
          <span class="milestone-btn__text">${m.label}</span>
          <span class="milestone-btn__arrow" aria-hidden="true">→</span>
        `;
        btn.addEventListener('click', () => handleMilestoneClick(m.key));
        content.appendChild(btn);
      });
    }

    // Add quick reply buttons if present
    if (response.quickReplies && response.quickReplies.length > 0) {
      const content = msg.querySelector('.message__content');
      const qrContainer = document.createElement('div');
      qrContainer.className = 'quick-replies';
      qrContainer.setAttribute('role', 'group');
      qrContainer.setAttribute('aria-label', 'Quick reply options');
      response.quickReplies.forEach(text => {
        const btn = document.createElement('button');
        btn.className = 'quick-reply-btn';
        btn.textContent = text;
        btn.setAttribute('aria-label', `Reply: ${text}`);
        btn.addEventListener('click', () => handleQuickReply(text));
        qrContainer.appendChild(btn);
      });
      content.appendChild(qrContainer);
    }

    messagesContainer.appendChild(msg);
    pruneOldMessages();
    Utils.scrollToBottom(messagesContainer);
  }

  /**
   * Show a system/status message.
   * @param {string} text - System message text
   */
  function showSystemMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'message message--system';
    msg.setAttribute('role', 'status');
    msg.innerHTML = `
      <div class="message__avatar" aria-hidden="true">⚙️</div>
      <div class="message__content message__content--system"></div>
    `;
    msg.querySelector('.message__content').textContent = text;
    messagesContainer.appendChild(msg);
    Utils.scrollToBottom(messagesContainer);
  }

  /**
   * Show typing indicator with screen reader announcement.
   */
  function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.setAttribute('role', 'status');
    indicator.setAttribute('aria-label', 'CivicGuide is typing a response');
    indicator.innerHTML = `
      <div class="typing-indicator__avatar" aria-hidden="true">🗳️</div>
      <div class="typing-indicator__dots" aria-hidden="true">
        <div class="typing-indicator__dot"></div>
        <div class="typing-indicator__dot"></div>
        <div class="typing-indicator__dot"></div>
      </div>
    `;
    messagesContainer.appendChild(indicator);
    Utils.scrollToBottom(messagesContainer);
  }

  /**
   * Hide and remove typing indicator.
   */
  function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
  }

  /**
   * Prune old messages from the DOM to maintain performance.
   * Keeps the last MAX_DOM_MESSAGES messages.
   */
  function pruneOldMessages() {
    const messages = messagesContainer.querySelectorAll('.message');
    if (messages.length > MAX_DOM_MESSAGES) {
      const toRemove = messages.length - MAX_DOM_MESSAGES;
      for (let i = 0; i < toRemove; i++) {
        messages[i].remove();
      }
    }
  }

  // Public API
  return { init };
})();

// Boot when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
