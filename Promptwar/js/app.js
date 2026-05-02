/**
 * CivicGuide AI — Main Application Controller
 * Initializes chat, handles UI events, renders messages
 */

const App = (() => {
  // DOM refs
  let messagesContainer;
  let inputField;
  let sendButton;
  let typingIndicator;

  /**
   * Initialize the application
   */
  function init() {
    messagesContainer = document.getElementById('chat-messages');
    inputField = document.getElementById('chat-input');
    sendButton = document.getElementById('send-btn');

    // Event listeners
    sendButton.addEventListener('click', handleSend);
    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // Show welcome message with a slight delay for effect
    setTimeout(async () => {
      const welcome = Chatbot.getWelcomeMessage();
      await showTypingThenMessage(welcome);
    }, 600);
  }

  /**
   * Handle send button click or Enter key
   */
  async function handleSend() {
    const raw = inputField.value.trim();
    if (!raw) return;

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
   * Handle quick reply button click
   */
  async function handleQuickReply(text) {
    renderUserMessage(text);

    const response = Chatbot.process(text);
    if (response) {
      await showTypingThenMessage(response);
    }
  }

  /**
   * Handle milestone button click
   */
  async function handleMilestoneClick(key) {
    // Show as user action
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
  }

  /**
   * Show typing indicator, then render the bot message
   */
  async function showTypingThenMessage(response) {
    sendButton.disabled = true;
    showTypingIndicator();

    // Variable delay based on response length
    const textLen = response.text ? response.text.length : 0;
    const delay = Math.min(800 + textLen * 2, 2000);
    await Utils.delay(delay);

    hideTypingIndicator();
    renderBotMessage(response);
    sendButton.disabled = false;
    inputField.focus();
  }

  /**
   * Render a user message bubble
   */
  function renderUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'message message--user';
    msg.innerHTML = `
      <div class="message__avatar">👤</div>
      <div class="message__content"></div>
    `;
    // Use textContent for user messages (XSS safe)
    msg.querySelector('.message__content').textContent = text;
    messagesContainer.appendChild(msg);
    Utils.scrollToBottom(messagesContainer);
  }

  /**
   * Render a bot message bubble with optional milestone buttons and quick replies
   */
  function renderBotMessage(response) {
    const msg = document.createElement('div');
    msg.className = 'message message--bot';

    let contentHtml = Utils.parseMarkdown(response.text);

    // Add neutral alert if flagged
    if (response.neutralAlert) {
      contentHtml += `
        <div class="neutral-alert">
          <span class="neutral-alert__icon">⚖️</span>
          <span class="neutral-alert__text">This assistant is strictly non-partisan and cannot provide political opinions or candidate recommendations.</span>
        </div>`;
    }

    msg.innerHTML = `
      <div class="message__avatar">🗳️</div>
      <div class="message__content">${contentHtml}</div>
    `;

    // Add milestone buttons if present
    if (response.milestoneButtons && response.milestoneButtons.length > 0) {
      const content = msg.querySelector('.message__content');
      response.milestoneButtons.forEach(m => {
        const btn = document.createElement('button');
        btn.className = 'milestone-btn';
        btn.setAttribute('data-milestone', m.key);
        btn.innerHTML = `
          <span class="milestone-btn__icon">${m.icon}</span>
          <span class="milestone-btn__text">${m.label}</span>
          <span class="milestone-btn__arrow">→</span>
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
      response.quickReplies.forEach(text => {
        const btn = document.createElement('button');
        btn.className = 'quick-reply-btn';
        btn.textContent = text;
        btn.addEventListener('click', () => handleQuickReply(text));
        qrContainer.appendChild(btn);
      });
      content.appendChild(qrContainer);
    }

    messagesContainer.appendChild(msg);
    Utils.scrollToBottom(messagesContainer);
  }

  /**
   * Show a system/status message
   */
  function showSystemMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'message message--bot';
    msg.innerHTML = `
      <div class="message__avatar">⚙️</div>
      <div class="message__content" style="opacity:0.7;font-size:0.85rem"></div>
    `;
    msg.querySelector('.message__content').textContent = text;
    messagesContainer.appendChild(msg);
    Utils.scrollToBottom(messagesContainer);
  }

  /**
   * Show typing indicator
   */
  function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
      <div class="typing-indicator__avatar">🗳️</div>
      <div class="typing-indicator__dots">
        <div class="typing-indicator__dot"></div>
        <div class="typing-indicator__dot"></div>
        <div class="typing-indicator__dot"></div>
      </div>
    `;
    messagesContainer.appendChild(indicator);
    Utils.scrollToBottom(messagesContainer);
  }

  /**
   * Hide typing indicator
   */
  function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
  }

  // Public API
  return { init };
})();

// Boot when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
