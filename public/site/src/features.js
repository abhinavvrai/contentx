const store = {
  get(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  remove(key) { localStorage.removeItem(key); }
};

function razorpayPlanId(plan) {
  const validPlans = new Set(["basic_reel", "better_edit", "growth_reel", "premium_motion", "advanced_reel", "saas_animation", "script_hook", "script_full", "script_research", "podcast_30", "podcast_45", "podcast_60"]);
  if (validPlans.has(plan.id)) return plan.id;
  const name = String(plan.name || "").toLowerCase();
  if (name.includes("saas animation")) return "saas_animation";
  if (name.includes("premium motion")) return "premium_motion";
  if (name.includes("advanced reel")) return "advanced_reel";
  if (name.includes("graphics lite") || name.includes("growth reel")) return "growth_reel";
  if (name.includes("better edit")) return "better_edit";
  return "basic_reel";
}

function razorpayQuantity(plan) {
  const match = String(plan.name || "").match(/·\s*(\d+)\s*(?:reel|video|episode)/i);
  return Math.max(1, Number(plan.quantity || match?.[1] || 1));
}

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Razorpay checkout could not be loaded."));
    document.head.append(script);
  });
}

function activeClientContext() {
  const clients = store.get("cx_clients_v2", []);
  const access = store.get("cx_access", {});
  const clientId = store.get("cx_active_client", access.clientId || "apex");
  return clients.find(client => client.id === clientId) || clients[0] || {
    id: "apex", name: "Apex Fitness", initials: "AF", contactName: "Meera Kapoor",
    contactInitials: "MK", email: access.email || "demo@apexfitness.in", notificationEmail: true,
    projects: [{ id: "apex-launch", name: "Apex Fitness Launch", format: "Reel · 9:16" }]
  };
}

function clientStoreKey(base, clientId = activeClientContext().id) { return `${base}_${clientId}`; }
function clientMessages(client) {
  const fallback = client.id === "apex"
    ? store.get("cx_messages", [{ author: "Abhinav", role: "Content X", text: "V3 is ready for your review. I tightened the opening hook and updated the captions.", time: "12:40 PM", projectId: client.projects[0]?.id }])
    : [{ author: "Abhinav", role: "Content X", text: `Welcome to the private ${client.name} workspace. Your project team will keep every update here.`, time: "10:00 AM", projectId: client.projects[0]?.id }];
  return store.get(clientStoreKey("cx_messages", client.id), fallback);
}

const monthlyPlans = [
  { id: "monthly-starter", name: "Creator Starter", price: 13000, unit: "month", badge: "10 videos minimum", copy: "A consistent editing engine for creators building momentum.", features: ["10 short-form videos", "₹1,300 effective per video", "Captions & clean motion", "10 content ideas", "2 revisions per video"] },
  { id: "monthly-growth", name: "Content Growth", price: 24000, unit: "month", badge: "Most popular", featured: true, copy: "Strategy, scripts and stronger edits in one monthly system.", features: ["20 short-form videos", "₹1,200 effective per video", "12 ready-to-shoot scripts", "Monthly content calendar", "Advanced captions & B-roll", "2 revisions per video"] },
  { id: "monthly-full", name: "Full-Stack Social", price: 45000, unit: "month", badge: "Managed service", copy: "Your outsourced content team—from idea to scheduled post.", features: ["30 short-form videos", "Content strategy & scripts", "Covers and thumbnails", "Instagram scheduling", "Dedicated social manager", "Monthly performance review"] }
];

const talentRoles = [
  ["Video Idea Creator", "Find hooks, formats and original angles creators can actually film.", "✦"],
  ["Content Creator", "Turn briefs into authentic on-camera or UGC-style content.", "●"],
  ["Scriptwriter", "Write sharp, platform-native scripts that sound human.", "¶"],
  ["Video Editor", "Build retention-led edits with taste, speed and precision.", "▶"],
  ["Social Media Manager", "Own calendars, posting, community and reporting.", "⌁"],
  ["Cover / Thumbnail Designer", "Design scroll-stopping Instagram and YouTube covers.", "◇"]
];

function money(value) { return `₹${Number(value).toLocaleString("en-IN")}`; }
function escapeHTML(value = "") { const d = document.createElement("div"); d.textContent = value; return d.innerHTML; }
function screenMessage(text = "") {
  const directContact = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text) || /(?:\+?\d[\s().-]*){9,}/.test(text) || /(^|\s)@[a-z0-9_.]{2,}/i.test(text) || /\b(whatsapp|telegram|instagram|insta|snapchat|my\s+(?:account|profile|channel)|username|phone\s+number|email\s+me)\b/i.test(text);
  const links = text.match(/https?:\/\/[^\s]+/gi) || [];
  if (directContact) return { state: "blocked", message: "Direct contact details, social handles and account usernames are not allowed here. Please keep communication inside Content X." };
  if (links.length) return { state: "review", message: "Your media link was sent to the Content X manager for approval. Its status will appear in this chat." };
  return { state: "allowed" };
}
function queueModeration(text, source = "chat") {
  const client = activeClientContext();
  const queue = store.get("cx_moderation", []); const item = { id: Date.now(), text, source, clientId: client.id, author: client.contactName, status: "Pending", created: new Date().toLocaleString() }; queue.unshift(item); store.set("cx_moderation", queue); return item;
}
function notify(message) {
  let el = document.querySelector(".global-toast");
  if (!el) { el = document.createElement("div"); el.className = "global-toast"; document.body.append(el); }
  el.textContent = message; el.classList.add("show"); clearTimeout(el._timer); el._timer = setTimeout(() => el.classList.remove("show"), 2600);
}

const notificationDefaults = {
  emailEnabled: true, inAppEnabled: true, frequency: "Instant", projectEnabled: true,
  upload: true, comment: true, reply: true, feedback: true, version: true,
  approval: true, payment: true, delivery: true, managedReview: true
};

export function recordNotification(type, title, message, meta = {}) {
  const client = activeClientContext();
  const workspaceRoute = /#(?:workspace|project|review)/.test(location.hash);
  const clientId = meta.clientId || (workspaceRoute ? client.id : null);
  const settingsKey = clientStoreKey("cx_notification_settings", client.id);
  const settings = { ...notificationDefaults, ...store.get(settingsKey, client.id === "apex" ? store.get("cx_notification_settings", {}) : {}) };
  const created = new Date().toLocaleString();
  const notifications = store.get("cx_notifications", []);
  const item = { id: Date.now() + Math.random(), type, title, message, meta: { ...meta, ...(clientId ? { clientId } : {}) }, read: false, created };
  if (settings.inAppEnabled && settings.projectEnabled && settings[type] !== false) {
    notifications.unshift(item);
    store.set("cx_notifications", notifications.slice(0, 100));
  }
  if (settings.emailEnabled && settings.projectEnabled && settings.frequency !== "Never" && settings[type] !== false) {
    const access = store.get("cx_access", {});
    const outbox = store.get("cx_email_outbox", []);
    outbox.unshift({ ...item, email: meta.email || client.email || access.email || "demo@apexfitness.in", frequency: settings.frequency, status: settings.frequency === "Instant" ? "Ready to send" : `Queued for ${settings.frequency.toLowerCase()} digest` });
    store.set("cx_email_outbox", outbox.slice(0, 100));
  }
  window.dispatchEvent(new CustomEvent("cx:notification", { detail: item }));
  return item;
}

export function initTheme() {
  const theme = localStorage.getItem("cx_theme") || "light";
  document.documentElement.dataset.theme = theme;
  syncThemeControls();
}

function syncThemeControls() {
  const dark = document.documentElement.dataset.theme === "dark";
  document.querySelectorAll("[data-theme-toggle], [data-market-theme]").forEach(button => {
    const label = button.dataset.themeLabel || "";
    button.textContent = `${dark ? "\u2600" : "\u263e"}${label ? ` ${label}` : ""}`;
    button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    button.setAttribute("aria-pressed", String(dark));
    button.title = dark ? "Switch to light mode" : "Switch to dark mode";
  });
}

export function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next; localStorage.setItem("cx_theme", next);
  syncThemeControls();
}

export function enhanceMarketing(root, actions, data = {}) {
  const navActions = root.querySelector(".nav-actions");
  if (navActions) {
    const theme = document.createElement("button"); theme.className = "theme-toggle"; theme.dataset.themeToggle = ""; theme.setAttribute("aria-label", "Toggle dark mode"); theme.textContent = document.documentElement.dataset.theme === "dark" ? "☀" : "☾"; theme.addEventListener("click", toggleTheme); navActions.prepend(theme);
    const work = document.createElement("button"); work.className = "text-button work-with-us"; work.textContent = "Work with us"; work.addEventListener("click", openWorkMenu); navActions.insertBefore(work, navActions.querySelector('[data-action="login"]'));
  }
  const nav = root.querySelector(".site-nav nav");
  if (nav) nav.insertAdjacentHTML("beforeend", '<a href="#contact-form">Contact</a>');

  const workflow = root.querySelector("#workflow");
  if (workflow) {
    const feedbackDemo = workflow.querySelector('[data-action="workspace"]');
    if (feedbackDemo) {
      const restoredDemo = feedbackDemo.cloneNode(true);
      restoredDemo.textContent = "Try video feedback \u2192";
      restoredDemo.dataset.feedbackDemo = "";
      feedbackDemo.replaceWith(restoredDemo);
      restoredDemo.addEventListener("click", () => {
        store.set("cx_access", { email: "demo@apexfitness.in", plan: "Interactive feedback demo", paid: false, code: "CX-DEMO", clientId: "apex" });
        actions.openReview();
      });
      restoredDemo.insertAdjacentHTML("beforebegin", '<div class="feedback-demo-points"><span>\u25cc Timestamped notes</span><span>\u270e Frame annotations</span><span>\u21c4 Version comparison</span></div>');
    }
    workflow.insertAdjacentHTML("afterend", `
    <section id="network" class="network-section block-section"><div class="section-shell">
      <div class="section-heading split"><div><p class="eyebrow"><span></span>Content X network</p><h2>Ideas meet the people who can <em>make them real.</em></h2></div><p>Pitch a video idea, join our vetted creative network, or build a project team across strategy, scripts, production, editing and social management.</p></div>
      <div class="network-paths"><article class="idea-path"><small>HAVE A STRONG CONCEPT?</small><h3>Pitch a video idea.</h3><p>Creators and strategists can submit original video concepts. If a brand picks it, we connect both sides and manage the production.</p><button class="pill pill-light" data-apply="Pitch a video idea">Submit your idea →</button></article><article class="talent-path"><small>BUILD WITH CONTENT X</small><h3>Join the creator network.</h3><p>Apply once, show us your strongest work, and get matched with suitable paid projects when they arrive.</p><button class="pill pill-dark" data-apply="Content Creator">Apply as a creator →</button></article></div>
      <div class="talent-grid">${talentRoles.map(([name,copy,symbol]) => `<article><span>${symbol}</span><h3>${name}</h3><p>${copy}</p><button data-apply="${name}">Apply for this role →</button></article>`).join("")}</div>
      <div class="network-note"><strong>One project. One connected team.</strong><span>Content strategist</span><i>→</i><span>Scriptwriter</span><i>→</i><span>Creator</span><i>→</i><span>Editor</span><i>→</i><span>Social manager</span></div>
    </div></section>`);
  }

  const roleGrid = root.querySelector(".talent-grid");
  if (roleGrid) roleGrid.outerHTML = `<div class="network-roles"><p><strong>We currently welcome</strong> idea creators, content creators, scriptwriters, editors, social media managers and cover designers.</p><button class="pill pill-dark" data-apply="Join creative network">One application for every role →</button></div>`;
  const joinButton = root.querySelector(".talent-path [data-apply]"); if (joinButton) { joinButton.dataset.apply = "Join creative network"; joinButton.textContent = "Join the network →"; }

  const pricing = root.querySelector("#pricing");
  if (false && pricing) {
    pricing.innerHTML = `<div class="section-heading centered"><p class="eyebrow"><span></span>Build your package</p><h2>Pay for the quality and volume you <em>actually need.</em></h2><p>Choose 1–30 videos and an editing level. Monthly production starts at 10 videos and is 20% below the base rate. One-off work carries a 25% flexibility premium.</p></div><div class="billing-toggle" role="tablist"><button class="active" data-billing="monthly">Monthly <span>20% lower</span></button><button data-billing="video">One-off <span>+25%</span></button></div><div class="pricing-calculator"><section class="calculator-controls"><div class="calculator-step"><header><span>01</span><div><strong>Editing quality</strong><small>Pick the finish that fits your content.</small></div></header><div class="quality-options"><label><input type="radio" name="quality" value="Standard"><span><b>Standard</b><strong>₹2,000</strong><small>Clean pacing, captions, music and simple polish.</small></span></label><label><input type="radio" name="quality" value="Gold" checked><span><b>Gold</b><strong>₹2,500</strong><small>Advanced captions, B-roll, sound design and colour.</small></span></label><label><input type="radio" name="quality" value="Premium"><span><b>Premium</b><strong>₹3,500</strong><small>Strategy-led hook, motion graphics and premium finish.</small></span></label></div></div><div class="calculator-step"><header><span>02</span><div><strong>Number of videos</strong><small class="minimum-note">Monthly plans require at least 10 videos.</small></div></header><div class="volume-control"><button data-volume="minus" aria-label="Remove one video">−</button><input type="range" min="10" max="30" value="10" aria-label="Number of videos"><strong><span data-count>10</span> videos</strong><button data-volume="plus" aria-label="Add one video">+</button></div><div class="volume-marks"><span>10</span><span>20</span><span>30</span></div></div></section><aside class="calculator-summary"><span class="calculator-badge">MONTHLY SAVING</span><p>Your package</p><h3><span data-summary-count>10</span> × <span data-summary-quality>Gold</span> videos</h3><div class="rate-lines"><span>Base rate <b data-base-rate>₹2,500/video</b></span><span class="adjustment-line">Monthly discount <b data-adjustment>−20%</b></span></div><div class="calculated-total"><small>Estimated total</small><del data-original-total>₹25,000</del><strong data-total>₹20,000</strong><span data-effective>₹2,000 per video</span></div><p class="included-note">Includes two revision rounds per video. Extra revisions are ₹300 each.</p><button class="pill pill-hot" data-calculator-checkout>Continue to payment →</button></aside></div>`;
    const bases = { Standard: 2000, Gold: 2500, Premium: 3500 }; let billing = "monthly", quality = "Gold", count = 10;
    const slider = pricing.querySelector('input[type="range"]');
    const updatePrice = () => { const base = bases[quality], factor = billing === "monthly" ? .8 : 1.25, total = Math.round(base * factor * count), original = base * count, effective = Math.round(total / count); pricing.querySelector("[data-count]").textContent = count; pricing.querySelector("[data-summary-count]").textContent = count; pricing.querySelector("[data-summary-quality]").textContent = quality; pricing.querySelector("[data-base-rate]").textContent = `${money(base)}/video`; pricing.querySelector("[data-adjustment]").textContent = billing === "monthly" ? "−20%" : "+25%"; pricing.querySelector(".adjustment-line").firstChild.textContent = billing === "monthly" ? "Monthly discount " : "One-off premium "; pricing.querySelector("[data-original-total]").textContent = money(original); pricing.querySelector("[data-total]").textContent = money(total); pricing.querySelector("[data-effective]").textContent = `${money(effective)} per video`; pricing.querySelector(".calculator-badge").textContent = billing === "monthly" ? "20% MONTHLY SAVING" : "ONE-OFF FLEXIBILITY"; slider.value = count; };
    pricing.querySelectorAll("[data-billing]").forEach(btn => btn.addEventListener("click", () => { billing = btn.dataset.billing; pricing.querySelectorAll("[data-billing]").forEach(b => b.classList.toggle("active", b === btn)); slider.min = billing === "monthly" ? 10 : 1; if (billing === "monthly" && count < 10) count = 10; pricing.querySelector(".minimum-note").textContent = billing === "monthly" ? "Monthly plans require at least 10 videos." : "Choose any quantity from 1 to 30 videos."; updatePrice(); }));
    pricing.querySelectorAll('input[name="quality"]').forEach(input => input.addEventListener("change", () => { quality = input.value; updatePrice(); })); slider.addEventListener("input", () => { count = Number(slider.value); updatePrice(); }); pricing.querySelectorAll("[data-volume]").forEach(btn => btn.addEventListener("click", () => { count = Math.min(30, Math.max(Number(slider.min), count + (btn.dataset.volume === "plus" ? 1 : -1))); updatePrice(); }));
    pricing.querySelector("[data-calculator-checkout]").addEventListener("click", () => { const base = bases[quality], factor = billing === "monthly" ? .8 : 1.25, total = Math.round(base * factor * count); actions.openCheckout({ id:`${billing}-${quality.toLowerCase()}-${count}`, name:`${quality} · ${count} videos`, price:total, unit:billing === "monthly" ? "month" : "project", badge:billing === "monthly" ? "20% monthly saving" : "One-off package", features:[`${count} ${quality} videos`, `${money(Math.round(total/count))} effective per video`, "2 revision rounds per video", billing === "monthly" ? "Monthly workspace & production queue" : "Single-project workspace access"] }); }); updatePrice();
  }
  if (pricing) enhancePricingSelections(pricing, actions);
  if (pricing) setupUnifiedPricing(pricing, actions, data);

  const faq = root.querySelector("#faq");
  if (faq) faq.insertAdjacentHTML("afterend", `<section id="contact-form" class="contact-form-section block-section"><div class="section-shell contact-grid"><div><p class="eyebrow"><span></span>Tell us what you need</p><h2>Start with a <em>conversation.</em></h2><p>Share your goal, budget and timeline. Your enquiry will appear inside the Content X owner dashboard—nothing is emailed yet.</p><div class="contact-details"><span>Typical reply</span><strong>Within one business day</strong><span>Best for</span><strong>Projects, retainers & partnerships</strong></div></div><form class="lead-form"><div class="field-pair"><label>Name<input name="name" required placeholder="Your name"></label><label>Phone / WhatsApp<input name="phone" required placeholder="+91 …"></label></div><label>Email<input type="email" name="email" placeholder="you@company.com"></label><label>I’m interested in<select name="interest"><option>Monthly video package</option><option>One-off video</option><option>Full content strategy</option><option>Scripts + video editing</option><option>Social media management</option><option>Joining the creator network</option></select></label><label>Tell us about the project<textarea name="message" required placeholder="What are you creating, how many videos do you need, and when do you want to start?"></textarea></label><button class="pill pill-hot" type="submit">Save my enquiry →</button><small>Saved privately in this website’s owner dashboard for testing.</small></form></div></section>`);
    root.querySelector(".lead-form")?.addEventListener("submit", e => { e.preventDefault(); const data = Object.fromEntries(new FormData(e.currentTarget)); const leads = store.get("cx_leads", []); leads.unshift({ id: Date.now(), ...data, status: "New", created: new Date().toLocaleString() }); store.set("cx_leads", leads); e.currentTarget.reset(); notify("Enquiry saved. It is now visible in Owner view."); });
  root.querySelectorAll("[data-apply]").forEach(btn => btn.addEventListener("click", () => openApplication(btn.dataset.apply)));
  root.querySelectorAll('[data-action="login"]').forEach(btn => { const replacement = btn.cloneNode(true); btn.replaceWith(replacement); replacement.addEventListener("click", actions.openAccess); });
  root.querySelectorAll('a[href^="mailto:"]').forEach(link => { link.href = "#contact-form"; link.textContent = link.textContent.trim() === "Email" ? "Website enquiry" : "Send a project brief"; });
}

function enhancePricingSelections(pricing, actions) {
  pricing.dataset.pricingRestored = "true";
  const steps = pricing.querySelectorAll(".calculator-step");
  const qualityStep = steps[0], volumeStep = steps[1];
  if (!qualityStep || !volumeStep) return;
  volumeStep.querySelector("header>span").textContent = "03";
  volumeStep.querySelector("header strong").textContent = "Select number of videos";
  qualityStep.insertAdjacentHTML("afterend", `<div class="calculator-step delivery-format-step"><header><span>02</span><div><strong>Delivery format</strong><small>Select the main format included in this estimate.</small></div></header><div class="delivery-format-options"><label><input type="radio" name="deliveryFormat" value="Vertical 9:16" checked><span><b>9:16</b><strong>Reels & Shorts</strong><small>Vertical social delivery</small></span></label><label><input type="radio" name="deliveryFormat" value="Landscape 16:9"><span><b>16:9</b><strong>YouTube & web</strong><small>Landscape delivery</small></span></label><label><input type="radio" name="deliveryFormat" value="Square 1:1"><span><b>1:1</b><strong>Square social</strong><small>Feed-ready delivery</small></span></label></div></div>`);
  volumeStep.querySelector(".volume-control").insertAdjacentHTML("afterend", '<div class="volume-presets" aria-label="Quick video quantity choices"></div>');
  const summaryTitle = pricing.querySelector(".calculator-summary h3");
  summaryTitle.insertAdjacentHTML("afterend", '<span class="selected-format" data-summary-format>Vertical 9:16</span>');
  const slider = pricing.querySelector('.volume-control input[type="range"]');
  const presets = pricing.querySelector(".volume-presets");
  const currentBilling = () => pricing.querySelector("[data-billing].active")?.dataset.billing || "monthly";
  const renderPresets = () => {
    const monthly = currentBilling() === "monthly";
    const values = monthly ? [10, 15, 20, 25, 30] : [1, 3, 5, 10, 20];
    const selected = Number(slider.value);
    presets.innerHTML = values.map(value => `<button type="button" class="${value === selected ? "active" : ""}" data-volume-preset="${value}" aria-pressed="${value === selected}">${value} video${value === 1 ? "" : "s"}</button>`).join("");
    presets.querySelectorAll("[data-volume-preset]").forEach(button => button.addEventListener("click", () => {
      slider.value = button.dataset.volumePreset;
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      renderPresets();
    }));
  };
  pricing.querySelectorAll("[data-billing]").forEach(button => button.addEventListener("click", () => setTimeout(renderPresets, 0)));
  slider.addEventListener("input", renderPresets);
  pricing.querySelectorAll("[data-volume]").forEach(button => button.addEventListener("click", () => setTimeout(renderPresets, 0)));
  pricing.querySelectorAll('input[name="deliveryFormat"]').forEach(input => input.addEventListener("change", () => {
    pricing.querySelector("[data-summary-format]").textContent = input.value;
  }));
  const oldCheckout = pricing.querySelector("[data-calculator-checkout]");
  const checkout = oldCheckout.cloneNode(true);
  oldCheckout.replaceWith(checkout);
  checkout.addEventListener("click", () => {
    const bases = { Standard: 2000, Gold: 2500, Premium: 3500 };
    const billing = currentBilling();
    const quality = pricing.querySelector('input[name="quality"]:checked').value;
    const format = pricing.querySelector('input[name="deliveryFormat"]:checked').value;
    const count = Number(slider.value);
    const total = Math.round(bases[quality] * (billing === "monthly" ? .8 : 1.25) * count);
    actions.openCheckout({ id:`${billing}-${quality.toLowerCase()}-${count}`, name:`${quality} \u00b7 ${count} videos`, price:total, unit:billing === "monthly" ? "month" : "project", badge:billing === "monthly" ? "20% monthly saving" : "One-off package", features:[`${count} ${quality} videos`, `${format} delivery`, `${money(Math.round(total/count))} effective per video`, "2 revision rounds per video", billing === "monthly" ? "Monthly workspace & production queue" : "Single-project workspace access"] });
  });
  renderPresets();
}

function setupUnifiedPricing(pricing, actions, data) {
  const packages = {
    video: [
      { id:"basic_reel", name:"Basic", price:1500, range:"₹1,500", tag:"BUDGET · UP TO 1 MIN", delivery:"3-day delivery", revisions:"1 revision", summary:"A simple, clean reel for creators who need captions, pacing and light engagement elements without heavy visual layers.", availableAddOns:["quick_delivery", "cover_design", "extra_revision"], includes:["1 reel up to 60 seconds", "Clean cuts, pacing and zooms", "Engaging captions and subtitles", "Stickers, emojis and simple highlights", "Light sound effects and music sync", "1080p social export"], unavailable:["B-roll package", "Custom typography system", "Motion graphics"] },
      { id:"better_edit", name:"Standard", price:2000, range:"₹2,000–₹2,500", tag:"STANDARD · BETTER EDIT", delivery:"4-day delivery", revisions:"2 revisions", featured:true, summary:"A stronger social edit with B-roll, sound effects, custom text styling and better visual polish.", availableAddOns:["motion_graphics", "reel_script", "cover_design", "extra_revision"], includes:["1 video up to 90 seconds", "B-roll placement and visual cutaways", "Sound effects and music accents", "Custom text, typography and captions", "Colour grading and audio balance", "Source file included"], unavailable:["Advanced motion graphics"] },
      { id:"premium_motion", name:"Premium", price:3500, range:"₹3,500–₹5,000", tag:"PREMIUM · MOTION READY", delivery:"5-day priority", revisions:"3 revisions", summary:"A high-retention premium edit with deeper structure, richer sound design and motion-ready finishing for flagship posts.", availableAddOns:["advanced_motion_graphics", "reel_script", "cover_design", "rush_delivery", "extra_revision"], includes:["1 video up to 180 seconds", "Premium edit with retention-led structure", "Up to 10 relevant B-roll inserts", "Full sound design and premium mix", "Motion titles and custom callouts", "Premium colour finish", "Source file included"], unavailable:[] },
    ],
    podcast: [
      { id:"podcast_30", name:"Podcast · 30 min", price:5000, tag:"STARTER EPISODE", delivery:"4-day delivery", revisions:"2 revisions", summary:"A polished short episode with clean audio and a focused flow.", includes:["Episode up to 30 minutes", "Audio cleanup and level balance", "Single or multi-camera cut", "Remove pauses and false starts", "Simple branded intro and outro"], unavailable:["Chapter graphics", "Advanced motion package"] },
      { id:"podcast_45", name:"Podcast · 45 min", price:7500, tag:"MOST POPULAR", delivery:"5-day delivery", revisions:"2 revisions", featured:true, summary:"A complete mid-length episode with stronger structure and visual finish.", includes:["Episode up to 45 minutes", "Advanced audio cleanup", "Multi-camera pacing", "Branded lower thirds", "Chapter-ready structure"], unavailable:["Advanced motion package"] },
      { id:"podcast_60", name:"Podcast · 60 min", price:10000, tag:"FULL EPISODE", delivery:"6-day delivery", revisions:"2 revisions", summary:"Full-length podcast production with a premium branded master.", includes:["Episode up to 60 minutes", "Advanced audio cleanup", "Multi-camera edit", "Chapters and branded graphics", "Premium master export"], unavailable:[] },
    ],
  };
  const addOns = {
    video: [
      { id:"broll_sfx", name:"Extra B-roll + Sound Design", price:500, copy:"Extra cutaways, music accents and timed sound effects when a project needs more visual coverage." },
      { id:"motion_graphics", name:"Motion Graphics", price:500, copy:"For Standard: animated callouts, icons, titles and light branded movement. Standard becomes ₹2,500." },
      { id:"advanced_motion_graphics", name:"Advanced Motion Graphics", price:1500, copy:"For Premium: tracked graphics, custom animated scenes and premium transitions. Premium becomes ₹5,000." },
      { id:"reel_script", name:"Instagram Reel Script", price:500, copy:"Hook, complete short-form script and CTA." },
      { id:"cover_design", name:"Cover / Thumbnail", price:500, copy:"One scroll-stopping branded cover." },
      { id:"extra_revision", name:"Extra Revision Round", price:300, copy:"One additional consolidated revision." },
      { id:"rush_delivery", name:"Priority Delivery", price:1000, copy:"Priority placement in the production queue." },
      { id:"quick_delivery", name:"Quick Delivery", price:700, copy:"For Basic: faster delivery when you need a simple reel turned around quickly." },
    ],
    podcast: [
      { id:"podcast_script", name:"Podcast Episode Script", price:1500, copy:"Opening, segment flow, questions and closing CTA." },
      { id:"podcast_notes", name:"Show Notes & Chapters", price:500, copy:"Episode summary, timestamps and chapter titles." },
      { id:"podcast_clips", name:"Two Short Social Clips", price:1500, copy:"Two vertical highlights from the episode." },
      { id:"podcast_cover", name:"Episode Cover", price:500, copy:"One branded episode cover or thumbnail." },
    ],
  };
  const state = { billing:"one_off", service:"video", quantity:1, planId:"basic_reel", selectedAddOns:new Set(), deliveryFormat:"Vertical 9:16" };
  pricing.dataset.pricingRestored = "unified";
  pricing.innerHTML = `<div class="section-heading centered"><p class="eyebrow"><span></span>Simple, flexible pricing</p><h2>Choose the work. Add only what you <em>need.</em></h2><p>Start with Short-form or Podcast, compare each package, then open the package add-ons only if you want to customize the order.</p></div><div class="pricing-primary-toggles"><div><small>How often?</small><div class="billing-toggle" role="tablist" aria-label="Billing type"><button type="button" data-unified-billing="one_off" class="active">Per reel</button><button type="button" data-unified-billing="monthly">Monthly</button></div></div><div><small>What are we making?</small><div class="billing-toggle service-toggle" role="tablist" aria-label="Content type"><button type="button" data-unified-service="video" class="active">Short-form</button><button type="button" data-unified-service="podcast">Podcast</button></div></div></div><div class="unified-pricing-builder"><section class="unified-builder-main"><div class="unified-step"><header><span>01</span><div><strong data-package-heading>Choose a short-form package</strong><small>Switch between the tabs, then expand add-ons if needed.</small></div></header><div class="unified-package-browser" data-unified-packages></div></div><div class="unified-step" data-quantity-step><header><span>02</span><div><strong>Choose quantity and format</strong><small data-quantity-note>Buy one reel or build a larger batch.</small></div></header><div class="unified-quantity-row"><label>Quantity <span><button type="button" data-unified-quantity="minus" aria-label="Decrease quantity">−</button><b data-unified-count>1</b><button type="button" data-unified-quantity="plus" aria-label="Increase quantity">+</button></span></label><label>Delivery format<select data-unified-format></select></label></div><label class="unified-volume-slider"><span>Package volume</span><input type="range" min="1" max="30" value="1" data-unified-slider><small><b data-unified-slider-min>1</b><b data-unified-slider-max>30</b></small></label></div></section><aside class="unified-summary"><span data-unified-badge>ONE-OFF PER REEL</span><p>Your package</p><h3 data-unified-summary-name></h3><small data-unified-summary-meta></small><ul data-unified-summary-list></ul><div class="unified-total-lines"><span>Package <b data-unified-base></b></span><span>Add-ons <b data-unified-addons-total></b></span></div><div class="calculated-total"><small>Total before payment</small><strong data-unified-total></strong><span data-unified-effective></span></div><p class="included-note">You’ll add the title, description, instructions, reference links and files immediately after payment.</p><button class="pill pill-hot" type="button" data-unified-checkout>Continue securely →</button></aside></div><section class="managed-services"><div class="managed-services-head"><p class="eyebrow"><span></span>Need more than editing?</p><h3>Build a complete content system.</h3><p>These managed services are scoped around your brand, publishing volume and goals.</p></div><div class="managed-service-grid">${[
    ["Content Strategy & Planning", "Plan", "Content pillars, audience positioning, monthly calendar, campaign concepts, hooks and performance review."],
    ["Social Media Management", "Manage", "Scheduling, publishing, captions, hashtag research, comment management and monthly reporting."],
    ["Full Content Team", "Full service", "Strategy, scripts, editing, covers, scheduling and one accountable Content X manager."],
    ["SaaS Product Animation", "From ₹9,000", "Up to 30 seconds of animated product UI, callouts, transitions and premium sound design."],
  ].map(([name,label,copy]) => `<article><span>${label}</span><h4>${name}</h4><p>${copy}</p><details><summary>Know more</summary><ul>${copy.split(", ").map(item => `<li>${item}</li>`).join("")}</ul></details><a href="${data.whatsapp || "#contact-form"}" target="_blank" rel="noreferrer">Request a custom plan →</a></article>`).join("")}</div></section>`;

  const packageContainer = pricing.querySelector("[data-unified-packages]");
  const formatSelect = pricing.querySelector("[data-unified-format]");
  const volumeSlider = pricing.querySelector("[data-unified-slider]");

  const selectedPackage = () => packages[state.service].find(item => item.id === state.planId) || packages[state.service][0];
  const maximumQuantity = () => state.service === "podcast" ? 12 : 30;
  const minimumQuantity = () => state.billing === "monthly" ? (state.service === "podcast" ? 4 : 10) : 1;
  const serviceSingular = () => state.service === "podcast" ? "episode" : "reel";
  const servicePlural = () => state.service === "podcast" ? "episodes" : "reels";
  const availableAddOnsForPlan = () => {
    const plan = selectedPackage();
    if (state.service === "podcast") return addOns.podcast;
    return addOns.video.filter(item => (plan.availableAddOns || []).includes(item.id));
  };
  const keepOnlyAvailableAddOns = () => {
    const allowed = new Set(availableAddOnsForPlan().map(item => item.id));
    [...state.selectedAddOns].forEach(id => { if (!allowed.has(id)) state.selectedAddOns.delete(id); });
  };
  const selectedAddOnObjects = () => availableAddOnsForPlan().filter(item => state.selectedAddOns.has(item.id));

  function renderPackages() {
    pricing.querySelector("[data-package-heading]").textContent = `Choose a ${state.service === "podcast" ? "podcast" : "short-form"} package`;
    const plan = selectedPackage();
    const available = availableAddOnsForPlan();
    packageContainer.innerHTML = `<div class="unified-plan-tabs" role="tablist" aria-label="${state.service} packages">${packages[state.service].map(item => `<button type="button" role="tab" aria-selected="${item.id === state.planId}" class="${item.id === state.planId ? "active" : ""}" data-plan-tab="${item.id}">${item.name}<small>${item.range || money(item.price)}</small></button>`).join("")}</div><article class="unified-plan-detail"><p class="unified-plan-label">${plan.tag}</p><div class="unified-plan-price"><strong>${money(plan.price)}</strong><span>starting per ${serviceSingular()}</span></div><p class="unified-plan-copy">${plan.summary}</p><div class="unified-plan-meta"><span>◷ <b>${plan.delivery}</b></span><span>⟳ <b>${plan.revisions}</b></span></div><ul>${plan.includes.map(feature => `<li><b>✓</b>${feature}</li>`).join("")}${(plan.unavailable || []).map(feature => `<li class="unavailable"><b>—</b>${feature}</li>`).join("")}</ul>${available.length ? `<details class="unified-package-addons" data-package-addons ${state.selectedAddOns.size ? "open" : ""}><summary><span>Customize this ${plan.name} package</span><b>${state.selectedAddOns.size ? `${state.selectedAddOns.size} selected` : "Show add-ons"} ↓</b></summary><div class="unified-addon-grid" data-unified-addons></div></details>` : `<div class="unified-package-note"><strong>No paid upgrade needed for this package.</strong><small>Core inclusions are already bundled into the selected package.</small></div>`}<button type="button" class="unified-plan-continue" data-plan-continue>Continue with ${plan.name}<span>→</span></button></article>`;
    packageContainer.querySelectorAll("[data-plan-tab]").forEach(button => button.addEventListener("click", () => { state.planId = button.dataset.planTab; keepOnlyAvailableAddOns(); renderPackages(); updateSummary(); }));
    renderAddOns();
    packageContainer.querySelector("[data-plan-continue]").addEventListener("click", () => pricing.querySelector("[data-quantity-step]").scrollIntoView({ behavior:"smooth", block:"start" }));
  }

  function renderAddOns() {
    const addOnContainer = packageContainer.querySelector("[data-unified-addons]");
    if (!addOnContainer) return;
    addOnContainer.innerHTML = availableAddOnsForPlan().map(item => `<label><input type="checkbox" value="${item.id}" ${state.selectedAddOns.has(item.id) ? "checked" : ""}><span><b>${item.name}</b><strong>+${money(item.price)}</strong><small>${item.copy}</small></span></label>`).join("");
    addOnContainer.querySelectorAll('input[type="checkbox"]').forEach(input => input.addEventListener("change", () => { input.checked ? state.selectedAddOns.add(input.value) : state.selectedAddOns.delete(input.value); renderPackages(); updateSummary(); }));
  }

  function renderFormats() {
    const formats = state.service === "podcast" ? ["Video podcast", "Audio podcast", "Multi-camera podcast"] : ["Vertical 9:16", "Landscape 16:9", "Square 1:1"];
    if (!formats.includes(state.deliveryFormat)) state.deliveryFormat = formats[0];
    formatSelect.innerHTML = formats.map(format => `<option ${format === state.deliveryFormat ? "selected" : ""}>${format}</option>`).join("");
  }

  function updateSummary() {
    const plan = selectedPackage();
    const extras = selectedAddOnObjects();
    const base = plan.price * state.quantity;
    const extrasTotal = extras.reduce((total, item) => total + item.price * state.quantity, 0);
    const total = base + extrasTotal;
    pricing.querySelector("[data-unified-count]").textContent = state.quantity;
    volumeSlider.min = minimumQuantity();
    volumeSlider.max = maximumQuantity();
    volumeSlider.value = state.quantity;
    pricing.querySelector("[data-unified-slider-min]").textContent = minimumQuantity();
    pricing.querySelector("[data-unified-slider-max]").textContent = maximumQuantity();
    pricing.querySelector("[data-unified-badge]").textContent = state.billing === "monthly" ? "MONTHLY PRODUCTION" : `ONE-OFF PER ${serviceSingular().toUpperCase()}`;
    pricing.querySelector("[data-unified-summary-name]").textContent = plan.name;
    pricing.querySelector("[data-unified-summary-meta]").textContent = `${state.quantity} ${state.quantity === 1 ? serviceSingular() : servicePlural()} · ${state.deliveryFormat}`;
    pricing.querySelector("[data-unified-summary-list]").innerHTML = plan.includes.slice(0, 3).map(item => `<li><span>✓</span>${item}</li>`).join("") + extras.map(item => `<li><span>+</span>${item.name}</li>`).join("");
    pricing.querySelector("[data-unified-base]").textContent = money(base);
    pricing.querySelector("[data-unified-addons-total]").textContent = extrasTotal ? money(extrasTotal) : "₹0";
    pricing.querySelector("[data-unified-total]").textContent = money(total);
    pricing.querySelector("[data-unified-effective]").textContent = `${money(Math.round(total / state.quantity))} per ${serviceSingular()}`;
  }

  function switchService(service) {
    state.service = service;
    state.planId = service === "podcast" ? "podcast_45" : "basic_reel";
    state.selectedAddOns.clear();
    state.quantity = Math.max(minimumQuantity(), state.billing === "monthly" ? minimumQuantity() : 1);
    pricing.querySelectorAll("[data-unified-service]").forEach(button => button.classList.toggle("active", button.dataset.unifiedService === service));
    pricing.querySelector('[data-unified-billing="one_off"]').textContent = service === "podcast" ? "Per episode" : "Per reel";
    pricing.querySelector("[data-quantity-note]").textContent = state.billing === "monthly" ? `Monthly ${service === "podcast" ? "podcast" : "short-form"} production starts at ${minimumQuantity()}.` : `Choose between 1 and ${maximumQuantity()} ${service === "podcast" ? "episodes" : "reels"}.`;
    renderPackages(); renderFormats(); updateSummary();
  }

  pricing.querySelectorAll("[data-unified-billing]").forEach(button => button.addEventListener("click", () => {
    state.billing = button.dataset.unifiedBilling;
    pricing.querySelectorAll("[data-unified-billing]").forEach(item => item.classList.toggle("active", item === button));
    state.quantity = state.billing === "monthly" ? Math.max(minimumQuantity(), state.quantity) : 1;
    pricing.querySelector("[data-quantity-note]").textContent = state.billing === "monthly" ? `Monthly ${state.service === "podcast" ? "podcast" : "short-form"} production starts at ${minimumQuantity()}.` : `Choose between 1 and ${maximumQuantity()} ${state.service === "podcast" ? "episodes" : "reels"}.`;
    updateSummary();
  }));
  pricing.querySelectorAll("[data-unified-service]").forEach(button => button.addEventListener("click", () => switchService(button.dataset.unifiedService)));
  pricing.querySelectorAll("[data-unified-quantity]").forEach(button => button.addEventListener("click", () => {
    state.quantity = Math.min(maximumQuantity(), Math.max(minimumQuantity(), state.quantity + (button.dataset.unifiedQuantity === "plus" ? 1 : -1)));
    updateSummary();
  }));
  volumeSlider.addEventListener("input", () => { state.quantity = Number(volumeSlider.value); updateSummary(); });
  formatSelect.addEventListener("change", () => { state.deliveryFormat = formatSelect.value; updateSummary(); });
  pricing.querySelector("[data-unified-checkout]").addEventListener("click", () => {
    const plan = selectedPackage();
    const extras = selectedAddOnObjects();
    const total = (plan.price + extras.reduce((sum, item) => sum + item.price, 0)) * state.quantity;
    actions.openCheckout({ id:plan.id, name:`${plan.name} · ${state.quantity} ${state.quantity === 1 ? serviceSingular() : servicePlural()}`, price:total, basePrice:plan.price, quantity:state.quantity, billing:state.billing, contentType:state.service, deliveryFormat:state.deliveryFormat, addOns:extras, unit:state.billing === "monthly" ? "month" : "project", badge:state.billing === "monthly" ? "Monthly production" : "One-time project", features:[...plan.includes, ...extras.map(item => `${item.name} (+${money(item.price)} each)`)] });
  });
  renderPackages(); renderAddOns(); renderFormats(); updateSummary();
}

function openWorkMenu() {
  const modal = document.createElement("div"); modal.className = "modal-layer"; modal.innerHTML = `<div class="work-menu"><button class="modal-close">×</button><p class="eyebrow"><span></span>Work with Content X</p><h2>Choose one path.</h2><p>We keep applications simple so the right opportunities reach the right people.</p><div><button data-path="idea"><span>✦</span><strong>Submit a video idea</strong><small>Pitch an original hook, format or content concept.</small></button><button data-path="network"><span>●</span><strong>Join the creative network</strong><small>One application covers creator, writing, editing, design and social roles.</small></button></div></div>`; document.body.append(modal); const close = () => modal.remove(); modal.querySelector(".modal-close").addEventListener("click", close); modal.addEventListener("click", e => { if(e.target === modal) close(); }); modal.querySelector('[data-path="idea"]').addEventListener("click", () => { close(); openApplication("Pitch a video idea"); }); modal.querySelector('[data-path="network"]').addEventListener("click", () => { close(); openApplication("Join creative network"); });
}

function openApplication(role) {
  const modal = document.createElement("div"); modal.className = "modal-layer";
  const isIdea = role === "Pitch a video idea";
  modal.innerHTML = `<form class="application-modal"><button type="button" class="modal-close">×</button><p class="eyebrow"><span></span>Content X network</p><h2>${isIdea ? "Pitch your idea" : "Join the creative network"}</h2><p class="application-privacy">Your private contact information is visible only to the Content X owner and is never shown to clients or other applicants.</p><div class="field-pair"><label>Full name<input name="name" required></label><label>WhatsApp<input name="phone" required></label></div><label>Email<input type="email" name="email" required></label>${isIdea ? '<label>Idea title<input name="idea" required placeholder="A short, memorable title"></label><label>Explain the concept<textarea name="pitch" required placeholder="Hook, format, audience and why it will work…"></textarea></label>' : `<label>Primary role<select name="role">${talentRoles.map(([name]) => `<option>${name}</option>`).join("")}</select></label><label>Portfolio link<input type="url" name="portfolio" placeholder="https://…"></label><label>Experience and strongest skills<textarea name="pitch" required placeholder="Tell us what you do best…"></textarea></label>`}<label>Availability<select name="availability"><option>Available now</option><option>Available part-time</option><option>Available for selected projects</option></select></label><button class="pill pill-hot" type="submit">Submit application →</button></form>`;
  document.body.append(modal); const close = () => modal.remove(); modal.querySelector(".modal-close").addEventListener("click", close); modal.addEventListener("click", e => { if (e.target === modal) close(); });
  modal.querySelector("form").addEventListener("submit", e => { e.preventDefault(); const applications = store.get("cx_applications", []); applications.unshift({ id: Date.now(), role, ...Object.fromEntries(new FormData(e.currentTarget)), status: "New", created: new Date().toLocaleString() }); store.set("cx_applications", applications); close(); notify("Application received and added to Owner view."); });
}

export function renderAccess(root, actions) {
  root.className = "access-app";
  root.innerHTML = `<div class="access-shell"><section class="access-brand"><a class="brand" href="#"><span class="brand-mark">CX</span><span>Content X</span></a><div><p class="eyebrow light"><span></span>Private client access</p><h1>Your content operation, <em>organized.</em></h1><p>Projects, files, versions, feedback, messages and approvals live in one secure workspace.</p></div><small>Access activates automatically after a successful payment.</small></section><section class="access-card"><button class="theme-toggle access-theme" data-theme-toggle>${document.documentElement.dataset.theme === "dark" ? "☀" : "☾"}</button><p class="eyebrow"><span></span>Client login</p><h2>Welcome back.</h2><p>Enter the email used at checkout. In this local test build, use the demo button to preview the complete workspace.</p><form><label>Email address<input type="email" name="email" required placeholder="you@company.com"></label><label>Order / access code<input name="code" required placeholder="CX-123456"></label><button class="pill pill-hot" type="submit">Open workspace →</button></form><div class="or"><span></span>TEST MODE<span></span></div><button class="pill pill-dark demo-access">Preview as demo client</button><button class="owner-link">I’m the Content X owner →</button><p class="access-help">No active package? <button data-buy>Choose a plan</button></p></section></div>`;
  root.querySelector(".brand").addEventListener("click", e => { e.preventDefault(); actions.openMarketing(); });
  root.querySelector("[data-theme-toggle]").addEventListener("click", toggleTheme);
  root.querySelector("form").addEventListener("submit", e => { e.preventDefault(); const payments = store.get("cx_payments", []); const data = Object.fromEntries(new FormData(e.currentTarget)); const found = payments.find(p => p.email.toLowerCase() === data.email.toLowerCase() && p.code === data.code); if (!found) return notify("No matching paid order found. Use Demo Client while testing."); store.set("cx_access", { email: data.email, plan: found.plan, paid: true }); actions.openDashboard(true); });
  root.querySelector(".demo-access").addEventListener("click", () => { store.set("cx_access", { email: "demo@apexfitness.in", plan: "Content Growth", paid: true, demo: true }); actions.openDashboard(true); });
  root.querySelector(".owner-link").addEventListener("click", actions.openAdmin);
  root.querySelector("[data-buy]").addEventListener("click", actions.openMarketing);
}

export function renderCheckout(root, actions) {
  const plan = store.get("cx_checkout", monthlyPlans[1]);
  const checkoutCopy = plan.marketplace
    ? { back: "Back to specialist", eyebrow: "Protected marketplace order", secure: "Content X order protection", note: "The provider payout is managed by Content X while your messages, files, reviews and delivery stay connected.", success: "Your protected specialist order and workspace are active." }
    : plan.managedReview
      ? { back: "Back to review", eyebrow: "Hands-off review add-on", secure: "Content X managed review", note: "Your paid request goes directly to the review desk for brief checks, consolidated feedback, revision follow-up and final quality approval.", success: "Your managed review is paid and queued with the Content X review desk." }
      : { back: "Back to pricing", eyebrow: "Activate your workspace", secure: "Payment-gated access", note: "Your client workspace opens only after a successful payment record is created.", success: "Your Content X workspace is active." };
  root.className = "checkout-app";
  root.innerHTML = `<header class="checkout-head"><a class="brand" href="#"><span class="brand-mark">CX</span><span>Content X</span></a><span>Secure test checkout</span><button class="theme-toggle" data-theme-toggle>${document.documentElement.dataset.theme === "dark" ? "☀" : "☾"}</button></header><main class="checkout-shell"><section class="checkout-form"><button class="back-link">← ${checkoutCopy.back}</button><p class="eyebrow"><span></span>${checkoutCopy.eyebrow}</p><h1>Complete your order.</h1><div class="test-banner"><strong>TEST MODE</strong><span>No real payment will be charged. Completing this form unlocks the dashboard on this device.</span></div><form><h3>Contact information</h3><div class="field-pair"><label>Full name<input name="name" required value="Meera Kapoor"></label><label>WhatsApp<input name="phone" required value="+91 98765 43210"></label></div><label>Email<input name="email" type="email" required value="demo@apexfitness.in"></label><h3>Payment method</h3><div class="payment-tabs"><label><input type="radio" name="method" value="UPI" checked><span>UPI</span></label><label><input type="radio" name="method" value="Card"><span>Card</span></label><label><input type="radio" name="method" value="Bank transfer"><span>Bank transfer</span></label></div><div class="payment-fields"><label>UPI ID / test reference<input name="paymentRef" required placeholder="name@upi or TEST123"></label></div><label class="terms"><input type="checkbox" required><span>I agree to the scope, two included revisions per video, and ₹300 for each additional revision round.</span></label><button class="pill pill-hot pay-button" type="submit">Complete test payment · ${money(plan.price)}</button></form></section><aside class="order-summary"><p>Your package</p><h2>${escapeHTML(plan.name)}</h2>${plan.marketplace ? `<div class="marketplace-checkout-provider"><span>✓</span><p><strong>${escapeHTML(plan.providerName)}</strong><small>${escapeHTML(plan.providerRole)} · Content X verified</small></p></div>` : ""}<span class="summary-badge">${escapeHTML(plan.badge)}</span><ul>${plan.features.map(f => `<li><span>✓</span>${escapeHTML(f)}</li>`).join("")}</ul><div class="order-total"><span>Package total<small>${plan.unit === "month" ? "Renews monthly after approval" : "One-time project"}</small></span><strong>${money(plan.price)}</strong></div><div class="secure-note"><span>⌾</span><p><strong>${checkoutCopy.secure}</strong><small>${checkoutCopy.note}</small></p></div></aside></main><div class="payment-success"><div><span>✓</span><h2>Payment complete</h2><p>${checkoutCopy.success}</p><strong class="access-code"></strong><button class="pill pill-hot">Enter workspace →</button></div></div>`;
  root.querySelector('input[name="name"]').value = "";
  root.querySelector('input[name="phone"]').value = "";
  root.querySelector('input[name="email"]').value = "";
  root.querySelector('input[name="name"]').setAttribute("autocomplete", "name");
  root.querySelector('input[name="phone"]').setAttribute("autocomplete", "tel");
  root.querySelector('input[name="email"]').setAttribute("autocomplete", "email");
  root.querySelector(".terms span").textContent = "I agree to the selected package scope, add-ons and revision allowance shown in this order.";
  root.querySelector(".brand").addEventListener("click", e => { e.preventDefault(); actions.openMarketing(); }); root.querySelector(".back-link").addEventListener("click", plan.marketplace ? actions.openTalentProfile : plan.managedReview ? actions.openReview : actions.openMarketing); root.querySelector("[data-theme-toggle]").addEventListener("click", toggleTheme);
  root.querySelectorAll('.payment-tabs input').forEach(input => input.addEventListener("change", () => { const field = root.querySelector('.payment-fields label'); field.innerHTML = input.value === "Card" ? 'Test card number<input name="paymentRef" required value="4242 4242 4242 4242">' : input.value === "UPI" ? 'UPI ID / test reference<input name="paymentRef" required placeholder="name@upi or TEST123">' : 'Bank reference<input name="paymentRef" required placeholder="TEST-TRANSFER">'; }));
  root.querySelector("form").addEventListener("submit", e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const createdAt = Date.now(), code = `CX-${String(createdAt).slice(-6)}`, created = new Date().toLocaleString();
    const payment = { id: createdAt, ...data, code, plan: plan.name, amount: plan.price, status: "Paid (test)", type: plan.marketplace ? "Marketplace" : plan.managedReview ? "Managed review" : "Agency package", created };
    const payments = store.get("cx_payments", []); payments.unshift(payment); store.set("cx_payments", payments);
    if (plan.marketplace) {
      const commissionRate = Number(plan.commissionRate || store.get("cx_commission_rate", 20));
      const commissionAmount = Math.round(Number(plan.price) * commissionRate / 100);
      const orders = store.get("cx_market_orders", []);
      orders.unshift({ id: createdAt, paymentId: createdAt, code, clientName: data.name, clientEmail: data.email, providerId: plan.providerId, providerName: plan.providerName, providerRole: plan.providerRole, packageName: plan.packageName, amount: Number(plan.price), commissionRate, commissionAmount, providerPayout: Number(plan.price) - commissionAmount, status: "Paid · Brief needed", created });
      store.set("cx_market_orders", orders);
    }
    if (plan.managedReview) {
      const requests = store.get("cx_managed_review_requests", []);
      requests.unshift({ id: createdAt, paymentId: createdAt, code, clientId: plan.clientId || "apex", clientName: data.name, clientEmail: data.email, project: plan.project || "Apex Fitness Launch", version: plan.version || "V3", price: Number(plan.price), reviewer: "Content X review desk", turnaround: plan.turnaround || "Within 1 business day", status: "Paid · Review queued", created });
      store.set("cx_managed_review_requests", requests);
      recordNotification("managedReview", "Managed review is queued", `${plan.project || "Your project"} ${plan.version || "V3"} has been assigned to the Content X review desk.`, { email: data.email, project: plan.project });
    }
    recordNotification("payment", "Payment confirmed", `${plan.name} was paid successfully in local test mode.`, { email: data.email, amount: plan.price });
    store.set("cx_access", { email: data.email, plan: plan.name, paid: true, code, clientId: plan.clientId || "apex" });
    root.querySelector(".access-code").textContent = `Access code: ${code}`;
    root.querySelector(".payment-success").classList.add("show");
  });
  root.querySelector(".payment-success .pill").textContent = "Add project brief →";
  root.querySelector(".payment-success .pill").addEventListener("click", event => actions.openBrief(event.currentTarget.dataset.orderId || ""));

  root.querySelector(".checkout-head>span").textContent = "Secure Razorpay checkout";
  const testBanner = root.querySelector(".test-banner");
  testBanner.innerHTML = "<strong>SECURE PAYMENT</strong><span>Pay safely with UPI, card, netbanking or wallets through Razorpay.</span>";
  const originalForm = root.querySelector("form");
  const paymentForm = originalForm.cloneNode(true);
  originalForm.replaceWith(paymentForm);
  paymentForm.querySelector(".payment-tabs").innerHTML = "<span class=\"payment-method-note\">Choose UPI, card, netbanking or wallet securely in the Razorpay payment window.</span>";
  paymentForm.querySelector(".payment-fields").remove();
  const payButton = paymentForm.querySelector(".pay-button");
  payButton.textContent = `Pay securely with Razorpay · ${money(plan.price)}`;
  fetch("/api/auth", { cache:"no-store", credentials:"same-origin" }).then(response => response.json()).then(({ user }) => {
    if (!user) return;
    paymentForm.elements.name.value = user.name || "";
    paymentForm.elements.email.value = user.email || "";
  }).catch(() => undefined);
  paymentForm.addEventListener("submit", async event => {
    event.preventDefault();
    const contact = Object.fromEntries(new FormData(paymentForm));
    const restore = () => { payButton.disabled = false; payButton.textContent = `Pay securely with Razorpay · ${money(plan.price)}`; };
    payButton.disabled = true;
    payButton.textContent = "Preparing secure payment…";
    try {
      const [configResponse, orderResponse] = await Promise.all([
        fetch("/api/payments/razorpay/config", { cache:"no-store" }),
        fetch("/api/payments/razorpay/order", {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body:JSON.stringify({ planId:razorpayPlanId(plan), quantity:razorpayQuantity(plan), billing:plan.billing || (plan.unit === "month" ? "monthly" : "one_off"), addOns:(plan.addOns || []).map(item => item.id), contentType:plan.contentType || "video", deliveryFormat:plan.deliveryFormat || "", name:contact.name, email:contact.email, phone:contact.phone })
        })
      ]);
      const config = await configResponse.json(), order = await orderResponse.json();
      if (!configResponse.ok || !orderResponse.ok) throw new Error(config.error || order.error || "Payment setup is unavailable. Please try again.");
      await loadRazorpayCheckout();
      const checkout = new window.Razorpay({
        key:config.keyId,
        amount:order.amount,
        currency:order.currency,
        name:"Content X",
        description:plan.name,
        order_id:order.orderId,
        prefill:{ name:contact.name, email:contact.email, contact:contact.phone },
        theme:{ color:"#f15b2a" },
        modal:{ ondismiss:restore },
        handler:async response => {
          try {
            const verifyResponse = await fetch("/api/payments/razorpay/verify", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(response) });
            const verification = await verifyResponse.json();
            if (!verifyResponse.ok || !verification.verified) throw new Error(verification.error || "Payment verification failed.");
            const createdAt = Date.now(), code = `CX-${String(createdAt).slice(-6)}`;
            const payment = { id:verification.paymentId, name:contact.name, phone:contact.phone, email:contact.email, code, plan:plan.name, amount:plan.price, status:"Verified", type:"Razorpay", created:new Date().toLocaleString() };
            store.set("cx_payments", [payment, ...store.get("cx_payments", [])]);
            store.set("cx_access", { email:contact.email, plan:plan.name, paid:true, code, clientId:plan.clientId || "apex" });
            root.querySelector(".access-code").textContent = "Payment verified · Next, add the project brief and files.";
            root.querySelector(".payment-success .pill").dataset.orderId = verification.orderId;
            root.querySelector(".payment-success").classList.add("show");
          } catch (error) {
            restore();
            alert(error.message || "We could not verify the payment. Please contact Content X support.");
          }
        }
      });
      checkout.on("payment.failed", () => { restore(); alert("Payment failed or was cancelled. No amount was charged by Content X."); });
      checkout.open();
    } catch (error) {
      restore();
      alert(error.message || "Payment setup is unavailable. Please try again.");
    }
  });
}

export function enhanceDashboard(root, actions) {
  const user = root.querySelector(".dash-user");
  if (user) user.insertAdjacentHTML("beforebegin", `<button class="owner-switch" data-owner>⚙ Owner view</button><button class="owner-switch" data-theme-toggle data-theme-label="Theme">${document.documentElement.dataset.theme === "dark" ? "☀" : "☾"} Theme</button>`);
  root.querySelector("[data-owner]")?.addEventListener("click", actions.openAdmin); root.querySelector("[data-theme-toggle]")?.addEventListener("click", toggleTheme);
  const nav = root.querySelector(".dash-sidebar nav");
  const client = activeClientContext();
  const unread = store.get("cx_notifications", []).filter(item => !item.read && (item.meta?.clientId === client.id || (client.id === "apex" && !item.meta?.clientId))).length;
  const messageCount = clientMessages(client).filter(message => message.author !== client.contactName).length;
  if (nav) nav.insertAdjacentHTML("beforeend", `<button data-dash="messages"><span>↗</span>Team messages <b>${messageCount}</b></button><button data-dash="notifications"><span>◉</span>Notifications <b>${unread}</b></button>`);
  root.querySelector('[data-dash="messages"]')?.addEventListener("click", () => renderClientMessages(root));
  root.querySelector('[data-dash="notifications"]')?.addEventListener("click", () => renderNotificationCenter(root));
  root.querySelectorAll('[data-dash="reviews"], [data-dash="approved"], [data-dash="assets"]').forEach(btn => btn.addEventListener("click", () => notify(`${btn.textContent.trim()} view is ready. Open a project to manage its files.`)));
}

function renderClientMessages(root) {
  const main = root.querySelector(".dash-main"), client = activeClientContext();
  const projectId = store.get("cx_active_project", client.projects[0]?.id);
  const activeProject = client.projects.find(project => project.id === projectId) || client.projects[0] || { id: "general", name: `${client.name} General` };
  const messages = clientMessages(client);
  const reviews = store.get("cx_moderation", []).filter(item => item.source === "chat" && (item.clientId === client.id || (client.id === "apex" && !item.clientId)));
  const messageHTML = messages.filter(message => !message.projectId || message.projectId === activeProject.id).map(m => `<article class="${m.author === client.contactName ? "mine" : ""}"><span>${m.author.slice(0,2).toUpperCase()}</span><div><strong>${escapeHTML(m.author)}<small>${escapeHTML(m.role)} · ${escapeHTML(m.time)}</small></strong><p>${escapeHTML(m.text)}</p></div></article>`).join("");
  const reviewHTML = reviews.map(m => `<article class="mine moderated-message"><span>${escapeHTML(client.contactInitials)}</span><div><strong>${escapeHTML(client.contactName)}<small>Client · link review</small></strong><p>Media link submitted to Content X</p><em class="moderation-status ${m.status.toLowerCase()}">${m.status === "Pending" ? "◷ Awaiting manager approval" : m.status === "Approved" ? "✓ Link approved" : "× Link not approved"}</em></div></article>`).join("");
  const channels = client.projects.length ? client.projects.map(project => `<button class="${project.id === activeProject.id ? "active" : ""}" data-message-project="${escapeHTML(project.id)}"><span>${escapeHTML(client.initials)}</span><p><strong>${escapeHTML(project.name)}</strong><small>${escapeHTML(project.format || "Private channel")}</small></p></button>`).join("") : `<button class="active"><span>${escapeHTML(client.initials)}</span><p><strong>${escapeHTML(client.name)} General</strong><small>Private client channel</small></p></button>`;
  main.innerHTML = `<header class="dash-header"><div><p>${escapeHTML(client.name)} · private communication</p><h1>Messages</h1></div></header><div class="communication-rule"><span>⌾</span><p><strong>Protected communication</strong><small>Phone numbers, email addresses and social handles cannot be shared. Media links are reviewed by a Content X manager before becoming visible.</small></p></div><section class="messenger"><aside><h3>${escapeHTML(client.name)} channels</h3>${channels}</aside><div class="chat"><header><div><strong>${escapeHTML(activeProject.name)}</strong><small>${escapeHTML(client.contactName)} and assigned Content X teammates</small></div><button class="pill pill-dark" data-open-project>Open project →</button></header><div class="chat-messages">${messageHTML}${reviewHTML}</div><form><button type="button" class="attach-chat">＋</button><input placeholder="Write a message to the project team…" required><button type="submit">Send ↑</button></form></div></section>`;
  main.querySelectorAll("[data-message-project]").forEach(button => button.addEventListener("click", () => { store.set("cx_active_project", button.dataset.messageProject); renderClientMessages(root); }));
  main.querySelector("[data-open-project]").addEventListener("click", () => { store.set("cx_active_project", activeProject.id); location.hash = "project"; });
  main.querySelector("form").addEventListener("submit", e => { e.preventDefault(); const input = e.currentTarget.querySelector("input"), result = screenMessage(input.value); if (result.state === "blocked") return notify(result.message); if (result.state === "review") { queueModeration(input.value, "chat"); notify(result.message); return renderClientMessages(root); } messages.push({ author: client.contactName, role: "Client", projectId: activeProject.id, text: input.value, time: new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) }); store.set(clientStoreKey("cx_messages", client.id), messages); recordNotification("reply", `New ${client.name} project message`, input.value, { clientId: client.id, projectId: activeProject.id }); renderClientMessages(root); });
}

function renderNotificationCenter(root) {
  const main = root.querySelector(".dash-main");
  const access = store.get("cx_access", { email: "demo@apexfitness.in" }), client = activeClientContext();
  const settingsKey = clientStoreKey("cx_notification_settings", client.id);
  const settings = { ...notificationDefaults, ...store.get(settingsKey, client.id === "apex" ? store.get("cx_notification_settings", {}) : {}) };
  const allNotifications = store.get("cx_notifications", []);
  const notifications = allNotifications.filter(item => item.meta?.clientId === client.id || (client.id === "apex" && !item.meta?.clientId));
  const outbox = store.get("cx_email_outbox", []).filter(item => item.meta?.clientId === client.id || (client.id === "apex" && !item.meta?.clientId));
  const eventRows = [
    ["upload", "New uploads", "Raw files, assets and attachments"],
    ["version", "New versions", "A new edit is ready to review"],
    ["comment", "Comments", "New timestamped or anchored comments"],
    ["reply", "Replies and mentions", "Replies to your notes and @mentions"],
    ["feedback", "Feedback decisions", "Changes requested or reviewer notes"],
    ["approval", "Approvals and status", "Approved, completed or status changes"],
    ["delivery", "Final delivery", "Final files or provider deliveries"],
    ["payment", "Payments", "Payment confirmations and receipts"],
    ["managedReview", "Managed review", "Updates from the Content X review desk"]
  ];
  const activity = notifications.length ? notifications.map(item => `<article class="notification-item ${item.read ? "" : "unread"}"><span>${({upload:"↑",version:"V",comment:"◌",reply:"↩",feedback:"✎",approval:"✓",delivery:"↓",payment:"₹",managedReview:"CX"})[item.type] || "•"}</span><div><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.message)}</p><small>${escapeHTML(item.created)}</small></div><button data-read-notification="${item.id}">${item.read ? "Read" : "Mark read"}</button></article>`).join("") : '<div class="empty-state"><span>◉</span><h3>No activity yet</h3><p>Uploads, comments, feedback and approvals will appear here.</p></div>';
  main.innerHTML = `<header class="dash-header"><div><p>Account settings</p><h1>Notifications</h1></div><button class="pill pill-dark" data-test-email>Send test notification</button></header><div class="notification-summary"><div><span>✉</span><p><strong>${escapeHTML(access.email || "demo@apexfitness.in")}</strong><small>Notification email · local preview</small></p></div><label><span>Email notifications<small>Queue activity emails for this address</small></span><input type="checkbox" data-notification-setting="emailEnabled" ${settings.emailEnabled ? "checked" : ""}></label><label><span>In-app notifications<small>Show updates inside the workspace</small></span><input type="checkbox" data-notification-setting="inAppEnabled" ${settings.inAppEnabled ? "checked" : ""}></label></div><div class="notification-layout"><section><div class="dash-section-head"><div><h2>What should notify you?</h2><p>Choose exactly which project events produce email and in-app updates.</p></div></div><div class="notification-settings"><label class="project-notification-master"><span><strong>All activity for this project</strong><small>Turn off every optional update for Apex Fitness Launch</small></span><input type="checkbox" data-notification-setting="projectEnabled" ${settings.projectEnabled ? "checked" : ""}></label>${eventRows.map(([key,title,copy]) => `<label><span><strong>${title}</strong><small>${copy}</small></span><input type="checkbox" data-notification-setting="${key}" ${settings[key] ? "checked" : ""}></label>`).join("")}</div></section><aside><div class="email-frequency-card"><p class="eyebrow"><span></span>Email delivery</p><h2>Choose your frequency.</h2><p>Receive updates immediately or bundle them into fewer digest emails.</p><select data-notification-frequency>${["Instant","Every 15 minutes","Hourly","Daily","Never"].map(value => `<option ${settings.frequency === value ? "selected" : ""}>${value}</option>`).join("")}</select><div><span>Queued emails</span><strong>${outbox.length}</strong></div><small>Real delivery will activate when a production email provider is connected.</small></div></aside></div><section class="notification-activity"><div class="dash-section-head"><div><h2>Recent activity</h2><p>Every stage is recorded, even when email is disabled.</p></div><button data-mark-all-read>Mark all read</button></div><div class="notification-list">${activity}</div></section>`;
  main.querySelector(".dash-header p").textContent = `${client.name} · account settings`;
  main.querySelector(".notification-summary strong").textContent = client.email || access.email || "demo@apexfitness.in";
  main.querySelector(".notification-summary small").textContent = `${client.name} notification email · local preview`;
  main.querySelector(".project-notification-master strong").textContent = "All activity for this client";
  main.querySelector(".project-notification-master small").textContent = `Turn off every optional update for ${client.name}`;
  main.querySelector(".notification-activity h2").textContent = `${client.name} activity`;
  main.querySelector(".notification-activity .dash-section-head p").textContent = "Only events from this client workspace appear here.";
  const saveSetting = (key, value) => { settings[key] = value; store.set(settingsKey, settings); notify(`${client.name} notification preferences saved.`); };
  main.querySelectorAll("[data-notification-setting]").forEach(input => input.addEventListener("change", () => saveSetting(input.dataset.notificationSetting, input.checked)));
  main.querySelector("[data-notification-frequency]").addEventListener("change", event => saveSetting("frequency", event.target.value));
  main.querySelector("[data-test-email]").addEventListener("click", () => { recordNotification("test", `${client.name} test notification`, "Your Content X notification preferences are working.", { email: client.email, clientId: client.id }); renderNotificationCenter(root); notify("Test notification added to this client's activity log."); });
  main.querySelector("[data-mark-all-read]").addEventListener("click", () => { notifications.forEach(item => item.read = true); store.set("cx_notifications", allNotifications); renderNotificationCenter(root); });
  main.querySelectorAll("[data-read-notification]").forEach(button => button.addEventListener("click", () => { const item = allNotifications.find(entry => String(entry.id) === button.dataset.readNotification); if (item) item.read = true; store.set("cx_notifications", allNotifications); renderNotificationCenter(root); }));
}

export function enhanceProject(root, actions) {
  const client = activeClientContext(), projectId = store.get("cx_active_project", client.projects[0]?.id), project = client.projects.find(item => item.id === projectId) || client.projects[0] || { id: "general", name: `${client.name} General` };
  const upload = root.querySelector(".hidden-upload"); if (upload) upload.setAttribute("accept", "video/*,image/*,audio/*,.pdf,.doc,.docx");
  const toolbar = root.querySelector(".project-toolbar>div"); if (toolbar) toolbar.insertAdjacentHTML("beforeend", '<button class="pill pill-dark" data-team-chat>↗ Team chat</button>'); root.querySelector("[data-team-chat]")?.addEventListener("click", () => { actions.openDashboard(true); setTimeout(() => document.querySelector('[data-dash="messages"]')?.click(), 0); });
  upload?.addEventListener("change", () => { const assets = store.get("cx_assets", []); [...upload.files].forEach(file => assets.unshift({ id: Date.now()+Math.random(), name: file.name, size: file.size, type: file.type, clientId: client.id, projectId: project.id, created: new Date().toLocaleString() })); store.set("cx_assets", assets); recordNotification("upload", `${upload.files.length} new file${upload.files.length === 1 ? "" : "s"} uploaded`, `New full-quality project assets are available in ${project.name}.`, { clientId: client.id, projectId: project.id }); notify(`${upload.files.length} full-quality file${upload.files.length === 1 ? "" : "s"} added to ${project.name}.`); });
  root.querySelectorAll(".project-tabs button").forEach((btn, index) => btn.addEventListener("click", () => { root.querySelectorAll(".project-tabs button").forEach(b => b.classList.toggle("active", b === btn)); if (index === 1) showAssets(root); else if (index === 2) showBrief(root); else if (index > 2) notify("Project activity is visible in the owner dashboard."); }));
  const tabs = root.querySelector(".project-tabs"); if (tabs) tabs.insertAdjacentHTML("beforeend", '<button data-share-tab>Shares <b>2</b></button>'); root.querySelector("[data-share-tab]")?.addEventListener("click", e => { root.querySelectorAll(".project-tabs button").forEach(b => b.classList.toggle("active", b === e.currentTarget)); showShares(root); });
  const shareButton = root.querySelector(".project-header-actions .pill-dark"); if (shareButton) { shareButton.dataset.openShareSpace = ""; shareButton.onclick = event => { event.preventDefault(); openShareSpace(root); }; }
}

function openShareSpace(root) {
  const modal = document.createElement("div"); modal.className = "modal-layer"; modal.innerHTML = `<form class="share-modal"><button type="button" class="modal-close">×</button><p class="eyebrow"><span></span>Share a protected space</p><h2>Create a client share</h2><div class="share-preview"><div class="share-preview-bg"><span class="brand-mark">CX</span><strong>Apex Fitness Review</strong><small>Presented by Content X</small></div><label>Background<input type="color" name="background" value="#17171b"></label></div><label>Share name<input name="name" required value="Apex Fitness Review"></label><div class="field-pair"><label>Layout<select name="layout"><option>Reel</option><option>Grid</option><option>List</option></select></label><label>Access role<select name="role"><option>View only</option><option>Comment only</option><option selected>Contributor</option><option>Publisher</option><option>Full access</option></select></label></div><div class="share-permissions"><label><input type="checkbox" name="comments" checked><span>Comments</span></label><label><input type="checkbox" name="uploads"><span>Uploads</span></label><label><input type="checkbox" name="download"><span>Downloads</span></label><label><input type="checkbox" name="versions" checked><span>All versions</span></label></div><div class="field-pair"><label>Passcode<input name="passcode" placeholder="Optional"></label><label>Expires<input type="date" name="expires"></label></div><label class="share-approval"><input type="checkbox" name="approval" checked><span>New access requests must be approved by a Content X manager.</span></label><button class="pill pill-hot" type="submit">Create protected link →</button></form>`; document.body.append(modal); const close=()=>modal.remove(); modal.querySelector(".modal-close").addEventListener("click",close); modal.addEventListener("click",e=>{if(e.target===modal)close();}); const color=modal.querySelector('input[name="background"]'); color.addEventListener("input",()=>modal.querySelector(".share-preview-bg").style.background=color.value); modal.querySelector("form").addEventListener("submit",e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));const shares=store.get("cx_shares",[]),code=`SH-${String(Date.now()).slice(-6)}`;shares.unshift({id:Date.now(),...data,code,status:"Active",views:0,created:new Date().toLocaleString()});store.set("cx_shares",shares);close();showShares(root);notify("Protected share created. Access requests will appear in Owner view.");});
}

function showShares(root) {
  const shares = store.get("cx_shares", [{id:1,name:"Launch Reel Review",layout:"Reel",role:"Comment only",code:"SH-481920",status:"Active",views:12,background:"#17171b"},{id:2,name:"Approved Exports",layout:"Grid",role:"View only",code:"SH-228103",status:"Active",views:4,background:"#4d2a21"}]); const area=root.querySelector(".project-content"); area.innerHTML=`<div class="project-toolbar"><div><button class="pill pill-hot" data-new-share>+ Create share</button></div></div><div class="share-intro"><span>↗</span><div><strong>Branded, controlled review spaces</strong><p>Choose a layout, background, passcode, expiry and exactly what every recipient can do.</p></div></div><div class="share-grid">${shares.map(s=>`<article><div class="share-cover" style="background:${escapeHTML(s.background||"#17171b")}"><span class="brand-mark">CX</span><em>${escapeHTML(s.layout)}</em></div><div><span class="status approved"><i></i>${escapeHTML(s.status)}</span><h3>${escapeHTML(s.name)}</h3><p>${escapeHTML(s.role)} · ${s.views||0} views</p><div><button data-copy-share="${s.code}">Copy link</button><button>Manage</button></div></div></article>`).join("")}</div>`; area.querySelector("[data-new-share]").addEventListener("click",()=>openShareSpace(root)); area.querySelectorAll("[data-copy-share]").forEach(btn=>btn.addEventListener("click",()=>{navigator.clipboard?.writeText(`https://contentx.local/share/${btn.dataset.copyShare}`);notify("Protected share link copied.");}));
}

function showAssets(root) {
  const assets = store.get("cx_assets", []); const area = root.querySelector(".project-content");
  area.innerHTML = `<div class="project-toolbar"><div><button class="pill pill-hot" data-add-assets>↑ Upload images or video</button></div></div><div class="asset-library">${assets.length ? assets.map(a => `<article><span>${a.type.startsWith("video") ? "▶" : a.type.startsWith("image") ? "▧" : "◇"}</span><div><strong>${escapeHTML(a.name)}</strong><small>${(a.size/1024/1024).toFixed(1)} MB · Original quality</small></div><button>•••</button></article>`).join("") : '<div class="empty-state"><span>↑</span><h3>No uploaded assets yet</h3><p>Add original-quality images, video, audio or documents.</p></div>'}</div><input type="file" accept="video/*,image/*,audio/*,.pdf" multiple hidden>`;
  const picker = area.querySelector("input"); area.querySelector("[data-add-assets]").addEventListener("click", () => picker.click()); picker.addEventListener("change", () => { const next = store.get("cx_assets", []); [...picker.files].forEach(f => next.unshift({ id: Date.now()+Math.random(), name:f.name,size:f.size,type:f.type,created:new Date().toLocaleString() })); store.set("cx_assets", next); recordNotification("upload", "New project assets uploaded", `${picker.files.length} original-quality file${picker.files.length === 1 ? "" : "s"} added to Apex Fitness Launch.`); showAssets(root); });
}

function showBrief(root) {
  root.querySelector(".project-content").innerHTML = `<section class="brief-view"><p class="eyebrow"><span></span>Creative brief</p><h2>Apex Fitness August Launch</h2><div class="brief-grid"><label>Primary goal<textarea>Build awareness for the new 8-week transformation program and generate qualified WhatsApp leads.</textarea></label><label>Audience<textarea>Working professionals aged 24–38 who want coached, time-efficient fitness.</textarea></label><label>Platforms<input value="Instagram Reels, YouTube Shorts"></label><label>Brand tone<input value="Direct, motivating, premium—not aggressive"></label></div><button class="pill pill-hot" data-save-brief>Save brief</button></section>`; root.querySelector("[data-save-brief]").addEventListener("click", () => notify("Project brief saved."));
}

export function enhanceReview(root, actions) {
  const wrap = root.querySelector(".player-wrap"), video = wrap?.querySelector("video");
  if (!wrap || !video) return;
  const managedSettings = { enabled: true, price: 2500, turnaround: "Within 1 business day", ...store.get("cx_managed_review_settings", {}) };
  const managedRequests = store.get("cx_managed_review_requests", []);
  const activeManagedReview = managedRequests.find(request => request.project === "Apex Fitness Launch" && !["Completed", "Cancelled"].includes(request.status));
  const headerActions = root.querySelector(".review-head-actions");
  headerActions?.insertAdjacentHTML("afterbegin", `<button class="review-theme-button" type="button" data-theme-toggle aria-label="Switch colour theme">${document.documentElement.dataset.theme === "dark" ? "\u2600" : "\u263e"}</button>`);
  root.querySelector(".review-theme-button")?.addEventListener("click", toggleTheme);
  headerActions?.insertAdjacentHTML("afterbegin", `<button class="pill managed-review-button ${activeManagedReview ? "is-active" : ""}" data-managed-review>${activeManagedReview ? "✓ Managed review active" : "✦ Let Content X review"}</button>`);
  wrap.insertAdjacentHTML("beforeend", `<canvas class="annotation-canvas" aria-label="Frame annotation canvas"></canvas><div class="watermark">CONTENT X · PREVIEW</div><div class="frame-annotation-toolbar" role="toolbar" aria-label="Frame annotation tools"><div class="annotation-tool-group"><button class="active" data-draw-tool="arrow" title="Arrow"><span>↗</span><small>Arrow</small></button><button data-draw-tool="line" title="Line"><span>╱</span><small>Line</small></button><button data-draw-tool="box" title="Rectangle"><span>□</span><small>Box</small></button><button data-draw-tool="circle" title="Ellipse"><span>○</span><small>Circle</small></button><button data-draw-tool="pencil" title="Free draw"><span>〰</span><small>Draw</small></button><button data-draw-tool="pin" title="Anchored comment"><span>●</span><small>Pin</small></button></div><div class="annotation-options"><div class="annotation-colors" aria-label="Annotation colour">${["#ff5c20","#ffd43b","#56d6a5","#4da3ff","#b985ff","#ffffff"].map((value,index) => `<button class="${index === 0 ? "active" : ""}" data-draw-color="${value}" style="--swatch:${value}" aria-label="Use ${value}"></button>`).join("")}</div><div class="annotation-widths"><button data-draw-width="3">S</button><button class="active" data-draw-width="5">M</button><button data-draw-width="8">L</button></div><span class="annotation-separator"></span><button data-annotation-action="undo" title="Undo">↶</button><button data-annotation-action="redo" title="Redo">↷</button><button data-annotation-action="visibility" title="Show or hide saved annotations">◉</button><button data-annotation-action="clear" title="Clear this draft">⌫</button><button data-annotation-action="close" title="Close annotation tools">×</button></div><div class="annotation-hint"><span>Paused at <strong>00:00</strong></span><em>Draw, then send your comment to attach this markup.</em></div></div>`);
  const controls = root.querySelector(".player-controls");
  controls?.insertAdjacentHTML("beforeend", '<button class="download-review" title="Download disabled by owner">↓</button>');
  const settings = store.get("cx_review_settings", { watermark: true, download: false });
  wrap.querySelector(".watermark").hidden = !settings.watermark;
  const download = root.querySelector(".download-review");
  download.disabled = !settings.download;
  download.addEventListener("click", () => settings.download ? notify("Download would start from protected storage.") : notify("Download is disabled by Content X until approval."));
  const annotations = initFrameAnnotations(wrap, video, root);
  const commentForm = root.querySelector(".comment-form");
  if (commentForm) {
    commentForm.insertAdjacentHTML("afterbegin", `<div class="comment-mode-row"><button type="button" data-comment-scope="public"><span>◉</span> Public comment⌄</button><button type="button" data-range-comment><span>↔</span> Mark range</button><button type="button" data-toggle-annotations><span>✎</span> Annotate frame</button></div>`);
    commentForm.insertAdjacentHTML("beforeend", '<input type="file" class="comment-attachment" accept="image/*,video/*,audio/*,.pdf" multiple hidden><div class="attachment-chips"></div>');
    const picker = commentForm.querySelector(".comment-attachment");
    const addLink = commentForm.querySelector('div:nth-of-type(3) button[type="button"]') || commentForm.querySelector('button[type="button"]');
    if (addLink) { addLink.textContent = "＋ Attach files"; addLink.addEventListener("click", () => picker.click()); }
    picker.addEventListener("change", () => { commentForm.querySelector(".attachment-chips").innerHTML = [...picker.files].slice(0,6).map(file => `<span>${file.type.startsWith("video") ? "▶" : file.type.startsWith("image") ? "▧" : "◇"} ${escapeHTML(file.name)}</span>`).join(""); recordNotification("upload", "Comment attachments added", `${Math.min(picker.files.length,6)} attachment${picker.files.length === 1 ? "" : "s"} were added to review feedback.`); });
    commentForm.querySelector("[data-toggle-annotations]").addEventListener("click", () => annotations.open());
    let rangeStart = null;
    commentForm.querySelector("[data-range-comment]").addEventListener("click", event => { if (rangeStart === null) { rangeStart = video.currentTime; event.currentTarget.classList.add("active"); event.currentTarget.innerHTML = `<span>↔</span> Range starts ${formatReviewTime(rangeStart)} · choose end`; video.pause(); } else { const end = video.currentTime; event.currentTarget.classList.remove("active"); event.currentTarget.innerHTML = `<span>↔</span> ${formatReviewTime(rangeStart)}–${formatReviewTime(end)}`; commentForm.dataset.range = `${rangeStart},${end}`; } });
  }
  commentForm?.addEventListener("submit", event => {
    const field = commentForm.querySelector("textarea"), result = screenMessage(field.value);
    if (result.state === "allowed") {
      if (!field.value.trim()) return;
      const attached = annotations.commit(video.currentTime);
      recordNotification("comment", attached ? "Annotated feedback added" : "New review comment", `${field.value.trim() || "A new comment"} · ${formatReviewTime(video.currentTime)}`);
      if (attached) setTimeout(() => root.querySelector(".comment:last-of-type")?.classList.add("has-annotation"), 0);
      return;
    }
    event.preventDefault(); event.stopImmediatePropagation();
    if (result.state === "blocked") return notify(result.message);
    const item = queueModeration(field.value,"comment"); field.value="";
    const note=document.createElement("div"); note.className="pending-comment-note"; note.innerHTML=`<span>◷</span><p><strong>Media link awaiting manager approval</strong><small>Request ${item.id} · Status will update after review.</small></p>`; root.querySelector(".comments")?.append(note); notify(result.message);
  }, true);
  root.addEventListener("click", event => { const timecode = event.target.closest(".timecode"); if (!timecode) return; setTimeout(() => { video.pause(); annotations.showAt(Number(timecode.dataset.time)); }, 0); });
  video.addEventListener("play", () => annotations.playing());
  video.addEventListener("timeupdate", () => annotations.updateTime(video.currentTime));
  root.querySelector('[data-action="changes"]')?.addEventListener("click", () => recordNotification("feedback", "Changes requested", "Open feedback for Launch Reel 01 was sent to the editor."));
  root.querySelector('[data-action="approve"]')?.addEventListener("click", () => recordNotification("approval", "Version approved", "Launch Reel 01 · Version 3 was approved."));
  root.querySelector(".upload-version")?.addEventListener("click", () => { recordNotification("version", "New version upload started", "A new version is being added to Launch Reel 01."); notify("Version upload is ready. Choose the replacement video in the project workspace."); });
  root.querySelector("[data-managed-review]")?.addEventListener("click", () => activeManagedReview ? notify(`${activeManagedReview.status}. ${activeManagedReview.turnaround}.`) : openManagedReviewModal(actions, managedSettings));
}

function formatReviewTime(seconds = 0) { return `${String(Math.floor(seconds / 60)).padStart(2,"0")}:${String(Math.floor(seconds % 60)).padStart(2,"0")}`; }

function openManagedReviewModal(actions, settings) {
  const modal = document.createElement("div"); modal.className = "modal-layer managed-review-layer";
  modal.innerHTML = `<div class="managed-review-modal"><button class="modal-close">×</button><div class="managed-review-mark">CX</div><p class="eyebrow"><span></span>Content X managed review</p><h2>We review every cut.<br>You only see the final decision.</h2><p>Our review desk checks the edit against your brief, consolidates feedback, follows up with the editor and verifies the next version—so you do not need to manage the review loop.</p><div class="managed-review-benefits"><span><b>✓</b> Brief and brand check</span><span><b>✓</b> Frame-accurate team feedback</span><span><b>✓</b> Revision follow-up</span><span><b>✓</b> Final quality approval</span></div><div class="managed-review-price"><div><small>OWNER-SET PROJECT FEE</small><strong>${money(settings.price)}</strong><span>${escapeHTML(settings.turnaround)}</span></div><p>This price is controlled by the Content X owner and can be changed per project before payment.</p></div><button class="pill pill-hot" data-buy-managed-review>Continue to payment →</button><small class="managed-review-fine">Local test checkout · No real charge will be made.</small></div>`;
  document.body.append(modal);
  const close = () => modal.remove(); modal.querySelector(".modal-close").addEventListener("click", close); modal.addEventListener("click", event => { if (event.target === modal) close(); });
  modal.querySelector("[data-buy-managed-review]").addEventListener("click", () => { close(); actions.openCheckout({ id:"managed-review-apex-v3", name:"Content X Managed Review", price:Number(settings.price), unit:"project", badge:"Hands-off quality control", managedReview:true, project:"Apex Fitness Launch", version:"V3", turnaround:settings.turnaround, features:["Content X reviews every submitted cut","Consolidated frame-accurate feedback","Editor follow-up managed for you","Final quality and brief check",settings.turnaround] }); });
}

function initFrameAnnotations(wrap, video, root) {
  const canvas = wrap.querySelector(".annotation-canvas"), ctx = canvas.getContext("2d"), toolbar = wrap.querySelector(".frame-annotation-toolbar");
  let tool = "arrow", color = "#ff5c20", width = 5, start = null, current = null, draft = [], redo = [], saved = store.get("cx_review_annotations", []), viewingTime = null, showSaved = true, editing = false;
  const point = event => { const rect = canvas.getBoundingClientRect(); return { x:(event.clientX-rect.left)/rect.width, y:(event.clientY-rect.top)/rect.height }; };
  function drawShape(shape) {
    const scale = devicePixelRatio, x1=shape.x1*canvas.width, y1=shape.y1*canvas.height, x2=shape.x2*canvas.width, y2=shape.y2*canvas.height;
    ctx.strokeStyle=shape.color; ctx.fillStyle=shape.color; ctx.lineWidth=shape.width*scale; ctx.lineCap="round"; ctx.lineJoin="round";
    if (shape.tool === "pencil") { const points=shape.points||[]; if(points.length<2)return; ctx.beginPath(); ctx.moveTo(points[0].x*canvas.width,points[0].y*canvas.height); points.slice(1).forEach(p=>ctx.lineTo(p.x*canvas.width,p.y*canvas.height)); ctx.stroke(); return; }
    if (shape.tool === "circle") { ctx.beginPath(); ctx.ellipse((x1+x2)/2,(y1+y2)/2,Math.abs(x2-x1)/2,Math.abs(y2-y1)/2,0,0,Math.PI*2); ctx.stroke(); return; }
    if (shape.tool === "box") { ctx.strokeRect(Math.min(x1,x2),Math.min(y1,y2),Math.abs(x2-x1),Math.abs(y2-y1)); return; }
    if (shape.tool === "pin") { const radius=11*scale; ctx.beginPath(); ctx.arc(x2,y2-radius*.35,radius,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.moveTo(x2-radius*.5,y2+radius*.35); ctx.lineTo(x2,y2+radius*1.35); ctx.lineTo(x2+radius*.5,y2+radius*.35); ctx.fill(); ctx.fillStyle="#16161a"; ctx.beginPath(); ctx.arc(x2,y2-radius*.35,radius*.32,0,Math.PI*2); ctx.fill(); return; }
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    if (shape.tool === "arrow") { const angle=Math.atan2(y2-y1,x2-x1), head=Math.max(13,shape.width*3.4)*scale; ctx.beginPath(); ctx.moveTo(x2,y2); ctx.lineTo(x2-head*Math.cos(angle-.52),y2-head*Math.sin(angle-.52)); ctx.moveTo(x2,y2); ctx.lineTo(x2-head*Math.cos(angle+.52),y2-head*Math.sin(angle+.52)); ctx.stroke(); }
  }
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if (showSaved && viewingTime !== null && video.paused) saved.filter(group => Math.abs(group.time-viewingTime)<.6).forEach(group => group.shapes.forEach(drawShape));
    draft.forEach(drawShape); if(current) drawShape(current);
    toolbar.querySelector(".annotation-hint strong").textContent = formatReviewTime(video.currentTime);
  }
  function resize() { const rect=wrap.getBoundingClientRect(); canvas.width=Math.max(1,rect.width*devicePixelRatio); canvas.height=Math.max(1,rect.height*devicePixelRatio); canvas.style.width=`${rect.width}px`; canvas.style.height=`${rect.height}px`; draw(); }
  function open() { editing=true; viewingTime=video.currentTime; video.pause(); toolbar.classList.add("show"); canvas.classList.add("editing"); draw(); }
  function close() { editing=false; toolbar.classList.remove("show"); canvas.classList.remove("editing"); current=null; draw(); }
  canvas.addEventListener("pointerdown", event => { if(!editing)return; start=point(event); redo=[]; canvas.setPointerCapture(event.pointerId); current={tool,color,width,x1:start.x,y1:start.y,x2:start.x,y2:start.y,points:tool==="pencil"?[start]:undefined}; draw(); });
  canvas.addEventListener("pointermove", event => { if(!start||!current)return; const next=point(event); current.x2=next.x;current.y2=next.y;if(tool==="pencil")current.points.push(next);draw(); });
  canvas.addEventListener("pointerup", event => { if(!start||!current)return; const end=point(event); current.x2=end.x;current.y2=end.y;if(tool==="pin"){current.x1=end.x;current.y1=end.y;} draft.push(current);start=null;current=null;draw();if(tool==="pin")root.querySelector(".comment-form textarea")?.focus(); });
  toolbar.querySelectorAll("[data-draw-tool]").forEach(button => button.addEventListener("click", () => { tool=button.dataset.drawTool; toolbar.querySelectorAll("[data-draw-tool]").forEach(item=>item.classList.toggle("active",item===button)); open(); }));
  toolbar.querySelectorAll("[data-draw-color]").forEach(button => button.addEventListener("click", () => { color=button.dataset.drawColor; toolbar.querySelectorAll("[data-draw-color]").forEach(item=>item.classList.toggle("active",item===button)); }));
  toolbar.querySelectorAll("[data-draw-width]").forEach(button => button.addEventListener("click", () => { width=Number(button.dataset.drawWidth); toolbar.querySelectorAll("[data-draw-width]").forEach(item=>item.classList.toggle("active",item===button)); }));
  toolbar.querySelectorAll("[data-annotation-action]").forEach(button => button.addEventListener("click", () => { const action=button.dataset.annotationAction;if(action==="undo"&&draft.length)redo.push(draft.pop());if(action==="redo"&&redo.length)draft.push(redo.pop());if(action==="clear"){draft=[];redo=[];}if(action==="visibility")showSaved=!showSaved;if(action==="close")close();draw(); }));
  new ResizeObserver(resize).observe(wrap); resize();
  return { open, commit(time){ if(!draft.length)return false;saved.unshift({id:Date.now(),time,shapes:draft.map(shape=>({...shape}))});store.set("cx_review_annotations",saved);draft=[];redo=[];viewingTime=time;close();draw();return true; }, showAt(time){viewingTime=time;draw();}, playing(){viewingTime=null;close();draw();}, updateTime(time){if(editing){viewingTime=time;draw();}} };
}

function renderOwnerGate(root, actions) {
  root.className = "owner-access-app";
  root.innerHTML = `<main class="owner-access-shell"><section><a class="brand" href="#home"><span class="brand-mark">CX</span><span>Content X</span></a><p class="eyebrow light"><span></span>Owner operations</p><h1>Private control room.<br><em>Owner access only.</em></h1><p>Client briefs, provider portfolios, internal pricing and assignments are separated from client and provider workspaces.</p><ul><li><b>✓</b> Private provider vault</li><li><b>✓</b> Client-by-client isolation</li><li><b>✓</b> Assignment and payout controls</li></ul></section><section class="owner-access-card"><span>⌾</span><p class="eyebrow"><span></span>Owner verification</p><h2>Unlock this device session.</h2><p>This preview gate no longer prints private access details. Production should use server-side identity and role checks.</p><form><label>Owner email<input name="email" type="email" required autocomplete="email" placeholder="Owner email"></label><label>Private access code<input name="code" required autocomplete="off" placeholder="Enter private code"></label><button class="pill pill-hot" type="submit">Open owner workspace →</button></form><small>Use your private owner code. Never share it in docs, chat or screenshots.</small><button type="button" data-owner-gate-back>← Back to client access</button></section></main>`;
  root.querySelector(".brand").addEventListener("click", event => { event.preventDefault(); actions.openMarketing(); });
  root.querySelector("[data-owner-gate-back]").addEventListener("click", actions.openAccess);
  root.querySelector("form").addEventListener("submit", async event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const encoded = new TextEncoder().encode(`${String(data.email).trim().toLowerCase()}:${String(data.code).trim().toUpperCase()}`);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    if (hash !== "e104f474b6f4ea826ad5236d83eeb6682df52f020a987cb8a5e5d9aa73e02084") return notify("Owner details do not match this Content X preview.");
    store.set("cx_owner_access", { email: String(data.email).trim().toLowerCase(), verifiedAt: Date.now() });
    actions.refreshRoute();
    notify("Owner workspace unlocked on this device.");
  });
}

export function renderAdmin(root, actions) {
  if (!store.get("cx_owner_access")) return renderOwnerGate(root, actions);
  root.className = "admin-app"; const leads = store.get("cx_leads", []), apps = store.get("cx_applications", []), payments = store.get("cx_payments", []), moderation = store.get("cx_moderation", []), settings = store.get("cx_review_settings", { watermark:true, download:false }), managedRequests = store.get("cx_managed_review_requests", []), managedSettings = { enabled:true, price:2500, turnaround:"Within 1 business day", ...store.get("cx_managed_review_settings", {}) };
  root.innerHTML = `<div class="admin-shell"><aside><a class="brand" href="#"><span class="brand-mark">CX</span><span>Content X<small>Owner control room</small></span></a><nav><button class="active" data-admin="overview">⌂ Overview</button><button data-admin="clients">● Clients <b>3</b></button><button data-admin="moderation">◷ Approval queue <b>${moderation.filter(x=>x.status==="Pending").length}</b></button><button data-admin="applications">✦ Talent applications <b>${apps.length}</b></button><button data-admin="leads">↗ Enquiries <b>${leads.length}</b></button><button data-admin="payments">₹ Payments <b>${payments.length}</b></button><button data-admin="team">◇ Team</button><button data-admin="managed-review">✦ Managed review <b>${managedRequests.filter(item=>!["Completed","Cancelled"].includes(item.status)).length}</b></button><button data-admin="settings">⚙ Review controls</button></nav><div><button data-client-view>← Client workspace</button><button data-theme-toggle data-theme-label="Theme">${document.documentElement.dataset.theme === "dark" ? "☀" : "☾"} Theme</button></div></aside><main><header><div><p>Owner workspace</p><h1>Operations overview</h1></div><button class="pill pill-hot" data-add-client>+ Add client</button></header><section class="admin-content"></section></main></div>`;
  root.querySelector(".admin-shell>aside>div")?.insertAdjacentHTML("beforeend", '<button data-owner-lock>⌾ Lock owner session</button>');
  const content = root.querySelector(".admin-content");
  const overview = () => content.innerHTML = `<div class="admin-stats"><article><span>₹</span><div><strong>${money(payments.reduce((s,p)=>s+Number(p.amount||0),0))}</strong><small>Recorded revenue</small></div></article><article><span>●</span><div><strong>3</strong><small>Active clients</small></div></article><article><span>◷</span><div><strong>${moderation.filter(x=>x.status==="Pending").length}</strong><small>Pending approvals</small></div></article><article><span>✦</span><div><strong>${apps.length}</strong><small>Talent applications</small></div></article></div><div class="admin-columns"><section><div class="dash-section-head"><div><h2>Projects needing attention</h2><p>Review status across active clients.</p></div></div><div class="admin-table"><div><strong>Apex Fitness Launch</strong><span>Waiting on client review</span><b class="status in-review"><i></i>In review</b></div><div><strong>Founder Story Series</strong><span>2 open comments</span><b class="status editing"><i></i>Editing</b></div><div><strong>Product Walkthrough</strong><span>Ready to deliver</span><b class="status approved"><i></i>Approved</b></div></div></section><section class="control-card"><h2>Preview protection</h2><p>These rules apply to client review files.</p><label><span>Show Content X watermark<small>Protect previews before approval</small></span><input type="checkbox" data-setting="watermark" ${settings.watermark?"checked":""}></label><label><span>Allow client download<small>Turn off until payment or approval</small></span><input type="checkbox" data-setting="download" ${settings.download?"checked":""}></label></section></div>`;
  const table = (items, type) => { if(!items.length) return `<div class="empty-state"><span>✦</span><h3>No ${type} yet</h3><p>New submissions from the website will appear here.</p></div>`; return `<div class="management-table"><div class="management-head"><span>Name</span><span>Type</span><span>Contact</span><span>Status</span></div>${items.map(i=>`<article><strong>${escapeHTML(i.name||i.email)}</strong><span>${escapeHTML(i.role||i.interest||i.plan||"")}</span><span>${escapeHTML(i.email||i.phone||"")}</span><select data-record="${i.id}" data-kind="${type}"><option>New</option><option>Contacted</option><option>Shortlisted</option><option>Closed</option></select></article>`).join("")}</div>`; };
  const clients = () => content.innerHTML = `<div class="dash-section-head"><div><h2>Clients & access</h2><p>Manage packages, project count and workspace access.</p></div></div><div class="client-admin-grid"><article><span>AF</span><h3>Apex Fitness</h3><p>Content Growth · 3 projects</p><strong>Workspace active</strong><button>Manage access →</button></article><article><span>NS</span><h3>Nivara Studio</h3><p>Creator Starter · 2 projects</p><strong>Workspace active</strong><button>Manage access →</button></article><article><span>OL</span><h3>Orbit Labs</h3><p>One-off Premium · 1 project</p><strong>Project complete</strong><button>Manage access →</button></article></div>`;
  const moderationView = () => { content.innerHTML=`<div class="dash-section-head"><div><h2>Communication approval queue</h2><p>Review external media links before they appear in client or applicant conversations.</p></div></div><div class="moderation-list">${moderation.length?moderation.map(item=>`<article><span>${item.source==="chat"?"↗":"◌"}</span><div><strong>${escapeHTML(item.author)} submitted a ${escapeHTML(item.source)} link</strong><p>${escapeHTML(item.text)}</p><small>${escapeHTML(item.created)}</small></div><em class="moderation-status ${item.status.toLowerCase()}">${escapeHTML(item.status)}</em><div><button data-moderate="Approved" data-id="${item.id}">Approve</button><button data-moderate="Rejected" data-id="${item.id}">Reject</button></div></article>`).join(""):'<div class="empty-state"><span>✓</span><h3>Approval queue is clear</h3><p>Submitted media links will appear here.</p></div>'}</div>`; };
  const managedReviewView = () => { content.innerHTML = `<div class="dash-section-head"><div><h2>Content X managed review</h2><p>Set the hands-off review price and manage paid review requests.</p></div><span class="status ${managedSettings.enabled ? "approved" : "briefing"}"><i></i>${managedSettings.enabled ? "Available to clients" : "Paused"}</span></div><div class="managed-review-admin"><aside><p class="eyebrow"><span></span>Service settings</p><h3>You decide the review fee.</h3><p>Clients see this price before payment. The review desk then handles feedback, revision follow-up and final quality approval.</p><label>Project fee (₹)<input type="number" min="500" step="100" value="${managedSettings.price}" data-managed-price></label><label>Review turnaround<select data-managed-turnaround>${["Within 4 hours","Within 1 business day","Within 2 business days","Custom schedule"].map(value=>`<option ${value===managedSettings.turnaround?"selected":""}>${value}</option>`).join("")}</select></label><label class="managed-toggle"><span><strong>Offer managed review</strong><small>Show the add-on inside the client review screen</small></span><input type="checkbox" data-managed-enabled ${managedSettings.enabled?"checked":""}></label><button class="pill pill-hot" data-save-managed-review>Save service settings</button></aside><section><div class="dash-section-head"><div><h2>Review queue</h2><p>Paid requests appear here automatically.</p></div></div><div class="managed-request-list">${managedRequests.length ? managedRequests.map(item=>`<article><div><span>CX</span><p><strong>${escapeHTML(item.project)} · ${escapeHTML(item.version)}</strong><small>${escapeHTML(item.clientName)} · ${escapeHTML(item.created)}</small></p></div><strong>${money(item.price)}</strong><select data-managed-status="${item.id}">${["Paid · Review queued","Reviewing brief","Reviewing cut","Feedback sent to editor","Checking revision","Completed","Cancelled"].map(status=>`<option ${status===item.status?"selected":""}>${status}</option>`).join("")}</select></article>`).join("") : '<div class="empty-state"><span>✦</span><h3>No managed reviews yet</h3><p>Paid client requests will appear in this queue.</p></div>'}</div></section></div>`; };
  root.querySelectorAll("[data-admin]").forEach(btn => btn.addEventListener("click", () => { root.querySelectorAll("[data-admin]").forEach(b=>b.classList.toggle("active",b===btn)); const view=btn.dataset.admin; if(view==="overview") overview(); else if(view==="clients") clients(); else if(view==="moderation") moderationView(); else if(view==="applications") content.innerHTML=`<div class="dash-section-head"><div><h2>Talent & idea applications</h2><p>Private contact details are visible only in Owner view.</p></div></div>${table(apps,"applications")}`; else if(view==="leads") content.innerHTML=`<div class="dash-section-head"><div><h2>Website enquiries</h2><p>Messages submitted through your public website.</p></div></div>${table(leads,"leads")}`; else if(view==="payments") content.innerHTML=`<div class="dash-section-head"><div><h2>Payment records</h2><p>Test checkout records and access codes.</p></div></div>${table(payments,"payments")}`; else if(view==="team") content.innerHTML=`<div class="dash-section-head"><div><h2>Creative team</h2><p>Assign people across active projects.</p></div><button class="pill pill-hot">+ Invite teammate</button></div><div class="team-grid">${[["AR","Abhinav Rai","Owner · Editor"],["SK","Sara Khan","Scriptwriter"],["RV","Ravi Verma","Social Manager"],["PD","Priya Das","Cover Designer"]].map(x=>`<article><span>${x[0]}</span><h3>${x[1]}</h3><p>${x[2]}</p><button>Manage projects →</button></article>`).join("")}</div>`; else if(view==="managed-review") managedReviewView(); else { overview(); content.querySelector(".control-card")?.scrollIntoView({behavior:"smooth"}); } }));
  content.addEventListener("change", e => { if(e.target.matches("[data-setting]")){settings[e.target.dataset.setting]=e.target.checked;store.set("cx_review_settings",settings);notify("Review protection updated.");} if(e.target.matches("[data-managed-status]")){const item=managedRequests.find(request=>request.id===Number(e.target.dataset.managedStatus));if(!item)return;item.status=e.target.value;item.updated=new Date().toLocaleString();store.set("cx_managed_review_requests",managedRequests);recordNotification(item.status==="Completed"?"approval":"managedReview",`Managed review: ${item.status}`,`${item.project} · ${item.version} has moved to ${item.status}.`,{email:item.clientEmail});notify("Client review status and email activity updated.");} }); content.addEventListener("click",e=>{const save=e.target.closest("[data-save-managed-review]");if(save){managedSettings.price=Math.max(500,Number(content.querySelector("[data-managed-price]").value||2500));managedSettings.turnaround=content.querySelector("[data-managed-turnaround]").value;managedSettings.enabled=content.querySelector("[data-managed-enabled]").checked;store.set("cx_managed_review_settings",managedSettings);managedReviewView();return notify("Managed review pricing saved.");}const button=e.target.closest("[data-moderate]");if(!button)return;const item=moderation.find(x=>x.id===Number(button.dataset.id));if(!item)return;item.status=button.dataset.moderate;item.reviewed=new Date().toLocaleString();store.set("cx_moderation",moderation);moderationView();notify(`Link ${item.status.toLowerCase()}. Status is now visible in chat.`);});
  root.querySelector("[data-client-view]").addEventListener("click", () => actions.openDashboard(true)); root.querySelector("[data-theme-toggle]").addEventListener("click", toggleTheme); root.querySelector("[data-owner-lock]").addEventListener("click", () => { store.remove("cx_owner_access"); actions.refreshRoute(); notify("Owner session locked on this device."); }); root.querySelector(".brand").addEventListener("click", e=>{e.preventDefault();actions.openMarketing();}); root.querySelector("[data-add-client]").addEventListener("click", () => notify("Client invitation draft created.")); overview();
}

export function canAccessWorkspace() { return Boolean(store.get("cx_access")); }
export function selectCheckoutPlan(plan) { store.set("cx_checkout", plan); }
