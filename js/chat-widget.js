/* ============================================================
   Young Grasshopper AI Chat Widget — shared across all pages
   Self-injecting: adds the button, panel, styles, and logic.
   Backend: https://app.younggrasshopper.io/api/website-chat
   ============================================================ */
(function () {
  if (window.__YG_CHAT_LOADED__) return;
  window.__YG_CHAT_LOADED__ = true;

  var CHAT_URL = 'https://app.younggrasshopper.io/api/website-chat';
  var SESSION = 'web-' + Math.random().toString(36).slice(2, 8);
  var chatOpen = false;

  // ---- Inject styles ----
  var css = `
    .chat-toggle-btn {
      position: fixed; bottom: 24px; right: 24px;
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #d4af37, #b8952e); border: none;
      color: #0a0f0a; font-size: 24px; cursor: pointer;
      z-index: 1000; box-shadow: 0 4px 20px rgba(212,175,55,0.35);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .chat-toggle-btn:hover { transform: scale(1.06); box-shadow: 0 6px 30px rgba(212,175,55,0.45); }
    .chat-toggle-btn .close-icon { display: none; }
    .chat-toggle-btn.active .chat-icon { display: none; }
    .chat-toggle-btn.active .close-icon { display: block; }
    .chat-panel {
      position: fixed; bottom: 92px; right: 24px;
      width: 380px; height: 540px;
      background: linear-gradient(180deg, #0d150d, #080c08);
      border: 1px solid rgba(109,163,109,0.25); border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.55); z-index: 999;
      display: none; flex-direction: column; overflow: hidden;
      font-family: 'Inter', -apple-system, sans-serif;
    }
    .chat-panel.open { display: flex; }
    .chat-header {
      padding: 14px 18px; background: linear-gradient(135deg, #111a11, #0d150d);
      border-bottom: 1px solid rgba(109,163,109,0.2);
      display: flex; align-items: center; gap: 10px; flex-shrink: 0;
    }
    .chat-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, #d4af37, #b8952e);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; color: #0a0f0a; font-weight: 700; flex-shrink: 0;
    }
    .chat-header-info h4 { font-size: 14px; font-weight: 600; color: #f0f5f0; margin: 0; }
    .chat-header-info span { font-size: 11px; color: #10b981; }
    .chat-header-info .dot { display: inline-block; width: 5px; height: 5px; background: #10b981; border-radius: 50%; margin-right: 3px; }
    .chat-msgs { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    .chat-msgs::-webkit-scrollbar { width: 4px; }
    .chat-msgs::-webkit-scrollbar-thumb { background: rgba(109,163,109,0.4); border-radius: 2px; }
    .msg { max-width: 88%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.5; animation: ygMsgIn 0.3s ease; white-space: pre-wrap; word-wrap: break-word; }
    @keyframes ygMsgIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .msg.ai { align-self: flex-start; background: linear-gradient(135deg, #111a11, #0d150d); border: 1px solid rgba(109,163,109,0.2); color: #c8d8c8; }
    .msg.user { align-self: flex-end; background: linear-gradient(135deg, #1a2a1a, #152015); border: 1px solid rgba(109,163,109,0.25); color: #e8f0e8; }
    .chat-quick { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 14px 8px; }
    .chat-quick button {
      background: rgba(109,163,109,0.12); border: 1px solid rgba(109,163,109,0.3);
      color: #b8d0b8; border-radius: 20px; padding: 6px 12px; font-size: 12px;
      cursor: pointer; font-family: 'Inter', sans-serif; transition: background 0.2s;
    }
    .chat-quick button:hover { background: rgba(109,163,109,0.25); }
    .chat-input-area { padding: 10px 14px; border-top: 1px solid rgba(109,163,109,0.2); display: flex; gap: 8px; flex-shrink: 0; background: #0d150d; }
    .chat-input-area input {
      flex: 1; background: #111a11; border: 1px solid rgba(109,163,109,0.25);
      border-radius: 8px; padding: 10px 12px; font-size: 13px;
      color: #f0f5f0; outline: none; font-family: 'Inter', sans-serif;
    }
    .chat-input-area input:focus { border-color: rgba(109,163,109,0.6); }
    .chat-input-area input::placeholder { color: rgba(200,216,200,0.4); }
    .chat-send {
      width: 38px; height: 38px; border-radius: 8px;
      background: linear-gradient(135deg, #d4af37, #b8952e); border: none;
      color: #0a0f0a; font-size: 16px; cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .typing { align-self: flex-start; display: none; padding: 10px 14px; gap: 3px; }
    .typing.show { display: flex; }
    .typing span { width: 6px; height: 6px; background: rgba(200,216,200,0.5); border-radius: 50%; animation: ygTyping 1.4s infinite; }
    .typing span:nth-child(2) { animation-delay: 0.2s; }
    .typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes ygTyping { 0%,60%,100% { opacity: 0.3; } 30% { opacity: 1; } }
    @media (max-width: 768px) {
      .chat-panel { width: calc(100vw - 24px); height: 62vh; bottom: 88px; right: 12px; }
    }
  `;
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ---- Inject HTML ----
  // Safe: `host.innerHTML` below is STATIC widget markup authored in this file.
  // No user input ever touches innerHTML — all chat text goes through textContent in addMsg().
  var host = document.createElement('div');
  host.innerHTML = `
    <button class="chat-toggle-btn" id="chatBtn" aria-label="Open chat">
      <span class="chat-icon">💬</span>
      <span class="close-icon">✕</span>
    </button>
    <div class="chat-panel" id="chatPanel">
      <div class="chat-header">
        <div class="chat-avatar">YG</div>
        <div class="chat-header-info">
          <h4>Young Grasshopper AI</h4>
          <span><span class="dot"></span>Online — Ask me anything</span>
        </div>
      </div>
      <div class="chat-msgs" id="chatMsgs">
        <div class="msg ai">👋 Hey there! I'm the Young Grasshopper AI. Ask me anything about our AI Employees — what they can do, how they work, or if they'd be a good fit for your business.</div>
      </div>
      <div class="chat-quick" id="chatQuick">
        <button onclick="window.__YGCHAT__ && window.__YGCHAT__.quick('What does an AI Employee do?')">What does an AI Employee do?</button>
        <button onclick="window.__YGCHAT__ && window.__YGCHAT__.quick('How much does it cost?')">How much does it cost?</button>
        <button onclick="window.__YGCHAT__ && window.__YGCHAT__.quick('How do I get started?')">How do I get started?</button>
      </div>
      <div class="typing" id="typing"><span></span><span></span><span></span></div>
      <div class="chat-input-area">
        <input type="text" id="chatInput" placeholder="Ask about AI Employees..." />
        <button class="chat-send" id="chatSend" aria-label="Send">➤</button>
      </div>
    </div>
  `;
  document.body.appendChild(host);

  // ---- Logic ----
  function addMsg(text, sender) {
    var container = document.getElementById('chatMsgs');
    var msg = document.createElement('div');
    msg.className = 'msg ' + sender;
    msg.textContent = text;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  function toggleChat() {
    chatOpen = !chatOpen;
    document.getElementById('chatPanel').classList.toggle('open', chatOpen);
    document.getElementById('chatBtn').classList.toggle('active', chatOpen);
    if (chatOpen) document.getElementById('chatInput').focus();
  }

  function sendMsg() {
    var input = document.getElementById('chatInput');
    var msg = input.value.trim();
    if (!msg) return;
    addMsg(msg, 'user');
    input.value = '';
    document.getElementById('typing').classList.add('show');
    fetch(CHAT_URL + '?q=' + encodeURIComponent(msg) + '&session=' + SESSION)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        document.getElementById('typing').classList.remove('show');
        addMsg(d.response || 'Good question! Send us an email at hello@younggrasshopper.io and we can discuss it.', 'ai');
      })
      .catch(function () {
        document.getElementById('typing').classList.remove('show');
        addMsg('Having trouble connecting. Please email hello@younggrasshopper.io and we will get right back to you.', 'ai');
      });
  }

  function quick(q) {
    document.getElementById('chatInput').value = q;
    sendMsg();
  }

  document.getElementById('chatBtn').addEventListener('click', toggleChat);
  document.getElementById('chatSend').addEventListener('click', sendMsg);
  document.getElementById('chatInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') sendMsg();
  });

  window.__YGCHAT__ = { toggle: toggleChat, send: sendMsg, quick: quick, open: function () { if (!chatOpen) toggleChat(); } };
})();
