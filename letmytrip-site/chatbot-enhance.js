(function () {
  const API = "/api/config";
  const QUICK = [
    ["Flight booking", "I need help with flight booking."],
    ["Bus booking", "I need help with bus booking."],
    ["Hotels", "I need help with hotel booking."],
    ["Agent registration", "I want to register as a travel agent."],
    ["Offers", "Please tell me about current offers."],
    ["Contact support", "I need customer support."]
  ];
  let conversationId = null;
  let customerName = "";
  let customerMobile = "";
  let root = null;
  let messagesBox = null;
  let input = null;
  let sendButton = null;
  let quickBox = null;

  async function api(payload) {
    const response = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Unable to save chat");
    return data;
  }

  function addMessage(text, who) {
    const item = document.createElement("div");
    item.className = "lt-chat-message " + who;
    item.textContent = text;
    messagesBox.appendChild(item);
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }

  async function saveMessage(message, sender) {
    if (!conversationId) return;
    try { await api({ action: "message", conversationId, message, sender }); }
    catch (err) { console.warn("LETMYTRIP chat message was not saved:", err.message); }
  }

  function replyFor(text) {
    const value = text.toLowerCase();
    if (value.includes("flight")) return "I can help you get started with flight booking. Please share your travel route and date with our team. For a confirmed fare, we’ll need live supplier availability.";
    if (value.includes("bus")) return "I can help with bus booking. Please share your from-city, destination and travel date.";
    if (value.includes("hotel")) return "I can help with hotel enquiries. Please share your destination, check-in date, check-out date and number of guests.";
    if (value.includes("agent") || value.includes("register")) return "To register as a travel agent, use the “Agent Signup / Login” button on the website and choose New Agent.";
    if (value.includes("offer")) return "Please tell me which service you’re interested in—flights, buses or hotels. Our team can confirm currently applicable offers.";
    if (value.includes("support") || value.includes("contact")) return "Please describe your issue here. Your message will be recorded for the LETMYTRIP support team.";
    return "Thanks for your message. It has been recorded for the LETMYTRIP team. Please share your travel service, destination and travel date so we can guide you better.";
  }

  async function send(text) {
    const message = String(text || "").trim();
    if (!message) return;
    if (!conversationId) {
      addMessage("Please enter your name and mobile number first so our team can follow up.", "bot");
      return;
    }
    addMessage(message, "customer");
    input.value = "";
    sendButton.disabled = true;
    await saveMessage(message, "customer");
    const reply = replyFor(message);
    addMessage(reply, "bot");
    await saveMessage(reply, "bot");
    sendButton.disabled = false;
    input.focus();
  }

  function makeButton(label, handler, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.className = className || "lt-chat-quick";
    button.addEventListener("click", handler);
    return button;
  }

  function startUI(body) {
    body.innerHTML = "";
    const form = document.createElement("form");
    form.className = "lt-chat-start";
    form.innerHTML = '<p>Welcome to LETMYTRIP! 👋 Please enter your name and mobile number to start.</p><label>Your name<input name="name" autocomplete="name" required maxlength="100" placeholder="Enter your name"></label><label>Mobile number<input name="mobile" inputmode="numeric" autocomplete="tel" required minlength="10" maxlength="15" placeholder="10-digit mobile number"></label><button type="submit">Start chat</button><small>Your details and chat messages are recorded so our team can respond.</small>';
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      const name = form.elements.name.value.trim();
      const mobile = form.elements.mobile.value.replace(/[^0-9+]/g, "");
      if (name.length < 2 || mobile.replace(/\D/g, "").length < 10) {
        form.querySelector("small").textContent = "Please enter a valid name and mobile number.";
        return;
      }
      const submit = form.querySelector("button");
      submit.disabled = true;
      try {
        const result = await api({ action: "start", name, mobile, source: "website-chatbot", page: location.href });
        conversationId = result.conversationId;
        customerName = name;
        customerMobile = mobile;
        buildChat(body);
        addMessage("Hi " + customerName + "! Thanks for contacting LETMYTRIP. Choose a topic or type your question below.", "bot");
        await saveMessage("Chat started by " + customerName + " (" + customerMobile + ").", "bot");
      } catch (error) {
        form.querySelector("small").textContent = "We couldn't start the chat just now. Please try again shortly.";
        submit.disabled = false;
      }
    });
    body.appendChild(form);
  }

  function buildChat(body) {
    body.innerHTML = "";
    messagesBox = document.createElement("div");
    messagesBox.className = "lt-chat-messages";
    quickBox = document.createElement("div");
    quickBox.className = "lt-chat-quicklist";
    QUICK.forEach(([label, message]) => quickBox.appendChild(makeButton(label, () => send(message))));
    const composer = document.createElement("form");
    composer.className = "lt-chat-composer";
    input = document.createElement("input");
    input.placeholder = "Type your message…";
    input.setAttribute("aria-label", "Type your message");
    input.maxLength = 1000;
    input.required = true;
    sendButton = document.createElement("button");
    sendButton.type = "submit";
    sendButton.textContent = "Send";
    composer.append(input, sendButton);
    composer.addEventListener("submit", (event) => { event.preventDefault(); send(input.value); });
    body.append(messagesBox, quickBox, composer);
  }

  function findWidget() {
    const heading = Array.from(document.querySelectorAll("h1,h2,h3,h4,[role='heading'],strong,b,div,span"))
      .find((el) => el.children.length < 4 && /LETMYTRIP Assistant/i.test((el.textContent || "").trim()));
    if (!heading) return;
    let candidate = heading.parentElement;
    while (candidate && candidate !== document.body) {
      const rect = candidate.getBoundingClientRect();
      const hasInput = !!candidate.querySelector("input,textarea");
      const hasButton = candidate.querySelector("button,[role='button']");
      if (hasInput && hasButton && rect.width >= 280 && rect.height >= 300) return candidate;
      candidate = candidate.parentElement;
    }
  }

  function mount() {
    if (root && root.isConnected) return;
    const found = findWidget();
    if (!found) return;
    root = found;
    const title = Array.from(root.querySelectorAll("*")).find((el) =>
      el.children.length < 4 && /LETMYTRIP Assistant/i.test((el.textContent || "").trim()));
    let header = title;
    while (header && header.parentElement !== root) header = header.parentElement;
    if (!header) return;
    const body = document.createElement("div");
    body.className = "lt-chat-body";
    const oldChildren = Array.from(root.children);
    oldChildren.forEach((child) => { if (child !== header) child.remove(); });
    root.appendChild(body);
    const style = document.createElement("style");
    style.textContent = `
      .lt-chat-body { display:flex; flex-direction:column; height:min(440px,65vh); min-height:280px; background:#f4f7fc; color:#10264b; font:14px/1.45 Arial,sans-serif; }
      .lt-chat-start { padding:14px; display:flex; flex-direction:column; gap:10px; overflow:auto; }
      .lt-chat-start p { margin:0 0 4px; padding:12px; background:white; border:1px solid #dce5f2; border-radius:12px; }
      .lt-chat-start label { display:flex; flex-direction:column; gap:4px; font-size:12px; color:#41536e; }
      .lt-chat-start input { width:100%; box-sizing:border-box; padding:11px; border:1px solid #d5deeb; border-radius:9px; background:white; color:#10264b; font-size:14px; }
      .lt-chat-start button,.lt-chat-composer button { border:0; border-radius:9px; padding:11px 15px; color:white; background:#103783; font-weight:600; cursor:pointer; }
      .lt-chat-start button:disabled,.lt-chat-composer button:disabled { opacity:.55; cursor:wait; }
      .lt-chat-start small { color:#61718a; font-size:11px; }
      .lt-chat-messages { flex:1; overflow:auto; padding:12px; display:flex; flex-direction:column; gap:8px; }
      .lt-chat-message { max-width:88%; padding:10px 12px; border-radius:12px; white-space:pre-wrap; overflow-wrap:anywhere; }
      .lt-chat-message.bot { align-self:flex-start; background:white; border:1px solid #dce5f2; }
      .lt-chat-message.customer { align-self:flex-end; background:#dce9ff; }
      .lt-chat-quicklist { display:flex; flex-wrap:wrap; gap:6px; padding:0 10px 10px; }
      .lt-chat-quick { border:1px solid #c8d6eb; background:white; color:#12346d; padding:6px 9px; border-radius:16px; font-size:11px; cursor:pointer; }
      .lt-chat-composer { display:flex; gap:7px; padding:10px; border-top:1px solid #dce5f2; background:white; }
      .lt-chat-composer input { flex:1; min-width:0; border:1px solid #d5deeb; border-radius:9px; padding:10px; font-size:14px; }
      @media(max-width:500px) { .lt-chat-body { height:65vh; min-height:280px; } .lt-chat-quicklist { gap:5px; } }
    `;
    document.head.appendChild(style);
    startUI(body);
  }

  const observer = new MutationObserver(() => { if (!root || !root.isConnected) mount(); });
  function init() {
    mount();
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
