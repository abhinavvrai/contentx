const AUTH_API = "/api/auth";
const BRIEF_API = "/api/briefs";
let currentUser = null;
let sessionChecked = false;
let accountProviders = { google:{ available:false, clientId:"" }, emailOtp:{ available:false } };
let googleScriptPromise = null;

const escapeHTML = value => String(value ?? "").replace(/[&<>'"]/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[character]);
const money = value => `₹${Math.round(Number(value || 0) / 100).toLocaleString("en-IN")}`;

async function api(url, options = {}) {
  const response = await fetch(url, { credentials:"same-origin", ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "This request could not be completed.");
  return body;
}

export async function refreshAccountSession(force = false) {
  if (sessionChecked && !force) return currentUser;
  try {
    const session = await api(AUTH_API, { cache:"no-store" });
    currentUser = session.user || null;
    accountProviders = session.providers || accountProviders;
  } catch {
    currentUser = null;
  }
  sessionChecked = true;
  return currentUser;
}

export function accountUser() {
  return currentUser;
}

export function rememberProtectedRoute(route) {
  localStorage.setItem("cx_return_route", route || "account");
}

export function renderAccountAccess(root, actions) {
  const returningTo = localStorage.getItem("cx_return_route") || "account";
  root.className = "account-app";
  root.innerHTML = `<main class="account-access"><section class="account-story"><a class="brand" href="#home"><span class="brand-mark">CX</span><span>Content X</span></a><div><p class="eyebrow light"><span></span>Client workspace</p><h1>Files, versions and feedback in one account.</h1><p>Sign in once to manage every order, project brief, share link and upload.</p><ul><li><b>✓</b> Verified email and Google sign-in</li><li><b>✓</b> Frame-style project workspace</li><li><b>✓</b> Private, versioned file delivery</li></ul></div><small>Your password and verification codes are never stored in readable form.</small></section><section class="account-card"><button class="account-close" type="button" aria-label="Return home">×</button><div class="account-toggle" role="tablist" aria-label="Account action"><button class="active" type="button" data-account-tab="login">Sign in</button><button type="button" data-account-tab="register">Create account</button></div><div data-account-panel></div><div class="dashboard-help-strip account-help-strip"><article><span>1</span><strong>Choose package</strong><small>Pay first so your workspace opens with the right scope.</small></article><article><span>2</span><strong>Add brief & files</strong><small>Share instructions, references and footage after payment.</small></article><article><span>3</span><strong>Review versions</strong><small>Comment, approve or request changes in one place.</small></article></div><aside class="account-security"><span>⌾</span><p><strong>Protected account access</strong><small>Passwords use salted PBKDF2 hashes and sessions use HttpOnly cookies. The browser never stores readable passwords or payment details.</small></p></aside></section></main>`;
  root.querySelector(".account-close").addEventListener("click", actions.openMarketing);
  root.querySelector(".account-story .brand").addEventListener("click", event => { event.preventDefault(); actions.openMarketing(); });
  const panel = root.querySelector("[data-account-panel]");
  const tabs = [...root.querySelectorAll("[data-account-tab]")];

  function show(mode) {
    tabs.forEach(button => button.classList.toggle("active", button.dataset.accountTab === mode));
    const register = mode === "register";
    panel.innerHTML = `<p class="eyebrow"><span></span>${register ? "New client account" : "Welcome back"}</p><h2>${register ? "Create your account." : "Sign in to continue."}</h2><p>${register ? "Verify your email or connect Google, then use the same address at checkout." : "Open projects, file versions and private share links."}</p><div class="account-provider-actions">${accountProviders.google?.available ? `<div data-google-button></div>` : ""}${accountProviders.emailOtp?.available ? `<button type="button" data-account-otp>✉ Continue with email OTP</button>` : ""}</div>${(accountProviders.google?.available || accountProviders.emailOtp?.available) ? '<div class="account-divider"><span>or use a password</span></div>' : ""}<form data-password-form>${register ? '<label>Full name<input name="name" autocomplete="name" required placeholder="Your full name"></label>' : ""}<label>Email address<input name="email" type="email" autocomplete="email" required placeholder="you@company.com"></label><label>Password<input name="password" type="password" autocomplete="${register ? "new-password" : "current-password"}" minlength="10" maxlength="128" required placeholder="At least 10 characters"></label>${register ? '<small class="password-tip">A long, unique passphrase is easiest to remember and safest to use.</small>' : ""}<p class="account-form-error" role="alert" hidden></p><button class="pill pill-hot" type="submit">${register ? "Create account →" : "Sign in →"}</button></form>`;
    panel.querySelector("[data-password-form]").addEventListener("submit", async event => {
      event.preventDefault();
      const button = event.currentTarget.querySelector("button[type=submit]");
      const error = event.currentTarget.querySelector(".account-form-error");
      button.disabled = true; button.textContent = register ? "Creating account…" : "Signing in…"; error.hidden = true;
      try {
        const values = Object.fromEntries(new FormData(event.currentTarget));
        if (register && accountProviders.emailOtp?.available) {
          await api(AUTH_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"request_otp", email:values.email }) });
          renderOtpVerification(panel, returningTo, true, values);
          return;
        }
        const result = await api(AUTH_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:register ? "register" : "login", ...values }) });
        finishAccountAccess(result.user, returningTo);
      } catch (failure) {
        error.textContent = failure.message; error.hidden = false;
        button.disabled = false; button.textContent = register ? "Create account →" : "Sign in →";
      }
    });
    panel.querySelector("[data-account-otp]")?.addEventListener("click", () => renderOtpAccess(panel, returningTo, register));
    if (accountProviders.google?.available) renderGoogleAccess(panel, returningTo);
  }

  tabs.forEach(button => button.addEventListener("click", () => show(button.dataset.accountTab)));
  show(returningTo === "checkout" ? "register" : "login");
}

function finishAccountAccess(user, returningTo) {
  currentUser = user; sessionChecked = true;
  localStorage.setItem("cx_access", JSON.stringify({ paid:true, account:true }));
  localStorage.removeItem("cx_return_route");
  location.hash = returningTo;
}

function renderOtpAccess(panel, returningTo, register) {
  panel.innerHTML = `<button class="account-inline-back" type="button">← Other sign-in options</button><p class="eyebrow"><span></span>Verified email</p><h2>${register ? "Create with an OTP." : "Sign in with an OTP."}</h2><p>We’ll send a short, one-time verification code to your email.</p><form data-otp-request><label>Email address<input name="email" type="email" autocomplete="email" required placeholder="you@company.com"></label><p class="account-form-error" role="alert" hidden></p><button class="pill pill-hot" type="submit">Send verification code →</button></form>`;
  panel.querySelector(".account-inline-back").addEventListener("click", () => panel.closest(".account-card").querySelector(`[data-account-tab="${register ? "register" : "login"}"]`).click());
  panel.querySelector("[data-otp-request]").addEventListener("submit", async event => {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email");
    const button = event.currentTarget.querySelector("button[type=submit]");
    const error = event.currentTarget.querySelector("[role=alert]");
    button.disabled = true; button.textContent = "Sending code…"; error.hidden = true;
    try {
      await api(AUTH_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"request_otp", email }) });
      renderOtpVerification(panel, returningTo, register, { email });
    } catch (failure) { error.textContent = failure.message; error.hidden = false; button.disabled = false; button.textContent = "Send verification code →"; }
  });
}

function renderOtpVerification(panel, returningTo, register, pending) {
  const email = String(pending.email || "");
  panel.innerHTML = `<button class="account-inline-back" type="button">← Change details</button><p class="eyebrow"><span></span>Check your inbox</p><h2>Enter your OTP.</h2><p>We sent a verification code to <strong>${escapeHTML(email)}</strong>.</p><form data-otp-verify><input type="hidden" name="email" value="${escapeHTML(email)}"><label>Verification code<input name="otp" inputmode="numeric" autocomplete="one-time-code" minlength="6" maxlength="8" required placeholder="000000"></label><p class="account-form-error" role="alert" hidden></p><button class="pill pill-hot" type="submit">${register ? "Verify & create account" : "Verify & continue"} →</button></form>`;
  panel.querySelector(".account-inline-back").addEventListener("click", () => renderOtpAccess(panel, returningTo, register));
  panel.querySelector("[data-otp-verify]").addEventListener("submit", async event => {
    event.preventDefault();
    const button = event.currentTarget.querySelector("button[type=submit]");
    const error = event.currentTarget.querySelector("[role=alert]");
    button.disabled = true; button.textContent = "Verifying…"; error.hidden = true;
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const result = await api(AUTH_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"verify_otp", ...pending, ...values }) });
      finishAccountAccess(result.user, returningTo);
    } catch (failure) { error.textContent = failure.message; error.hidden = false; button.disabled = false; button.textContent = `${register ? "Verify & create account" : "Verify & continue"} →`; }
  });
}

async function renderGoogleAccess(panel, returningTo) {
  const host = panel.querySelector("[data-google-button]");
  if (!host) return;
  try {
    const nonceData = await api(AUTH_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"google_nonce" }) });
    await loadGoogleIdentity();
    window.google.accounts.id.initialize({
      client_id:nonceData.clientId,
      nonce:nonceData.nonce,
      callback:async response => {
        try {
          const result = await api(AUTH_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"google_login", credential:response.credential }) });
          finishAccountAccess(result.user, returningTo);
        } catch (failure) { showProviderError(panel, failure.message); }
      },
    });
    window.google.accounts.id.renderButton(host, { theme:"outline", size:"large", shape:"rectangular", text:"continue_with", width:Math.min(420, host.clientWidth || 420) });
  } catch (error) { showProviderError(panel, error.message); }
}

function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!googleScriptPromise) googleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script"); script.src = "https://accounts.google.com/gsi/client"; script.async = true; script.defer = true;
    script.onload = resolve; script.onerror = () => reject(new Error("Google sign-in could not load.")); document.head.append(script);
  });
  return googleScriptPromise;
}

function showProviderError(panel, message) {
  let error = panel.querySelector(".account-provider-error");
  if (!error) { error = document.createElement("p"); error.className = "account-form-error account-provider-error"; panel.querySelector(".account-provider-actions")?.after(error); }
  error.textContent = message; error.hidden = false;
}

export async function renderAccountDashboard(root, actions) {
  root.className = "account-app";
  root.innerHTML = `<main class="account-loading"><span></span><h1>Opening your account…</h1></main>`;
  try {
    const data = await api(BRIEF_API, { cache:"no-store" });
    currentUser = data.user;
    const orders = data.orders || [];
    root.innerHTML = `<header class="account-head"><a class="brand" href="#home"><span class="brand-mark">CX</span><span>Content X</span></a><nav><a href="#pricing">Pricing</a><button type="button" data-account-logout>Sign out</button></nav></header><main class="account-dashboard"><section class="account-welcome"><div><p class="eyebrow"><span></span>Client account</p><h1>Hello, ${escapeHTML(data.user.name.split(" ")[0])}.</h1><p>Manage paid orders, send the full project brief and upload footage or references.</p></div><a class="pill pill-hot" href="#home">Choose another package →</a></section><section class="dashboard-help-strip account-help-strip"><article><span>1</span><strong>Open project</strong><small>Every paid order gets its own private workspace.</small></article><article><span>2</span><strong>Upload files</strong><small>Add footage, logos and reference links after the brief.</small></article><article><span>3</span><strong>Review delivery</strong><small>Track versions, comments, approvals and downloads.</small></article></section><section class="account-review-panel"><article><span>Share links</span><strong>Send secure review pages</strong><small>Control comments, downloads, uploads, passcode and expiry for every client link.</small></article><article><span>Versions</span><strong>Keep every cut together</strong><small>Drop a new file on the same asset to make V2, V3 and final delivery easy to follow.</small></article><article><span>Activity</span><strong>Know what changed</strong><small>Views, comments, approvals and downloads stay attached to each project.</small></article></section><section class="account-order-section"><div class="account-section-title"><div><h2>Your projects</h2><p>Detailed briefs and files are collected after payment, so checkout stays quick.</p></div><span>${orders.length} order${orders.length === 1 ? "" : "s"}</span></div><div class="account-orders">${orders.length ? orders.map(orderCard).join("") : `<div class="account-empty"><span>◇</span><h3>No paid projects yet</h3><p>Choose a video or podcast package to start.</p><a class="pill pill-dark" href="#home">See pricing →</a></div>`}</div></section></main>`;
    root.querySelector(".brand").addEventListener("click", event => { event.preventDefault(); actions.openMarketing(); });
    root.querySelector("[data-account-logout]").addEventListener("click", async () => {
      await api(AUTH_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"logout" }) });
      currentUser = null; sessionChecked = true; localStorage.removeItem("cx_access"); actions.openMarketing();
    });
  } catch (error) {
    root.innerHTML = `<main class="account-error"><span>!</span><h1>We couldn’t open your account.</h1><p>${escapeHTML(error.message)}</p><button class="pill pill-dark" type="button">Sign in again</button></main>`;
    root.querySelector("button").addEventListener("click", () => { rememberProtectedRoute("account"); location.hash = "access"; });
  }
}

function contentUnit(type, quantity) {
  if (type === "podcast") return quantity === 1 ? "episode" : "episodes";
  if (type === "longform") return quantity === 1 ? "long-form video" : "long-form videos";
  return quantity === 1 ? "video" : "videos";
}

function orderCard(order) {
  const paid = ["verified", "captured"].includes(order.status);
  const hasBrief = Boolean(order.brief_id);
  const addOns = Array.isArray(order.add_ons) ? order.add_ons : [];
  return `<article class="account-order-card"><header><div><span>${escapeHTML(order.content_type || "video")}</span><small>${new Date(Number(order.created_at)).toLocaleDateString([], { dateStyle:"medium" })}</small></div><b class="${paid ? "paid" : "pending"}">${paid ? "Paid" : "Payment pending"}</b></header><h3>${escapeHTML(order.plan_name)}</h3><p>${Number(order.quantity)} ${contentUnit(order.content_type, Number(order.quantity))} · ${escapeHTML(order.billing === "monthly" ? "Monthly" : "One-time")}</p>${addOns.length ? `<ul>${addOns.map(item => `<li>+ ${escapeHTML(item.name)}</li>`).join("")}</ul>` : ""}<footer><strong>${money(order.amount_paise)}</strong><div>${paid ? `<a class="pill pill-dark" href="#brief?order=${encodeURIComponent(order.razorpay_order_id)}">${hasBrief ? "Edit brief" : "Add project brief"}</a>${order.project_id ? `<a class="pill pill-hot" href="#workspace?project=${encodeURIComponent(order.project_id)}">Open workspace</a>` : ""}` : `<span>Finish payment to add the brief</span>`}</div></footer></article>`;
}

export async function renderProjectBrief(root, actions, route) {
  root.className = "account-app";
  root.innerHTML = `<main class="account-loading"><span></span><h1>Preparing your project brief…</h1></main>`;
  try {
    const data = await api(BRIEF_API, { cache:"no-store" });
    const requestedOrder = new URLSearchParams(route.split("?")[1] || "").get("order");
    const order = data.orders.find(item => item.razorpay_order_id === requestedOrder) || data.orders.find(item => ["verified", "captured"].includes(item.status));
    if (!order) throw new Error("Complete a package payment before adding the project brief.");
    const addOns = Array.isArray(order.add_ons) ? order.add_ons : [];
    root.innerHTML = `<header class="account-head"><a class="brand" href="#home"><span class="brand-mark">CX</span><span>Content X</span></a><a href="#account">Your account</a></header><main class="brief-shell"><section class="brief-intro"><p class="eyebrow light"><span></span>After-payment project setup</p><h1>Tell us exactly what to create.</h1><p>Your package and add-ons are already locked. Now share the creative details and then upload the footage and references.</p><div><span>01 <b>Package paid</b></span><span class="active">02 <b>Project brief</b></span><span>03 <b>Upload files</b></span></div><aside><strong>${escapeHTML(order.plan_name)}</strong><span>${Number(order.quantity)} ${contentUnit(order.content_type, Number(order.quantity))}</span>${addOns.map(item => `<small>+ ${escapeHTML(item.name)}</small>`).join("")}</aside></section><section class="brief-card"><p class="eyebrow"><span></span>Project details</p><h2>${order.brief_id ? "Update your brief." : "Start your brief."}</h2><form><input type="hidden" name="razorpayOrderId" value="${escapeHTML(order.razorpay_order_id)}"><label>Video or episode title<input name="title" required maxlength="140" value="${escapeHTML(order.title || "")}" placeholder="e.g. Why most founders struggle with content"></label><label>What is this content about?<textarea name="description" required maxlength="2500" rows="4" placeholder="Topic, audience, platform and the main message…">${escapeHTML(order.description || "")}</textarea></label><label>Editing and creative instructions<textarea name="instructions" required maxlength="5000" rows="6" placeholder="Pacing, captions, brand colours, shots to keep, shots to avoid, CTA and anything else…">${escapeHTML(order.instructions || "")}</textarea></label><label>Reference link <span>optional</span><input name="referenceUrl" type="url" value="${escapeHTML(order.reference_url || "")}" placeholder="https://youtube.com/… or https://instagram.com/…"><small>You can upload reference files in the next step.</small></label><p class="account-form-error" role="alert" hidden></p><button class="pill pill-hot" type="submit">Save brief & upload files →</button></form></section></main>`;
    root.querySelector(".brand").addEventListener("click", event => { event.preventDefault(); actions.openMarketing(); });
    root.querySelector("form").addEventListener("submit", async event => {
      event.preventDefault();
      const button = event.currentTarget.querySelector("button[type=submit]");
      const error = event.currentTarget.querySelector(".account-form-error");
      button.disabled = true; button.textContent = "Saving your brief…"; error.hidden = true;
      try {
        const result = await api(BRIEF_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
        location.hash = `workspace?project=${encodeURIComponent(result.projectId)}`;
      } catch (failure) {
        error.textContent = failure.message; error.hidden = false; button.disabled = false; button.textContent = "Save brief & upload files →";
      }
    });
  } catch (error) {
    root.innerHTML = `<main class="account-error"><span>!</span><h1>Project brief unavailable.</h1><p>${escapeHTML(error.message)}</p><a class="pill pill-dark" href="#account">Return to your account</a></main>`;
  }
}
