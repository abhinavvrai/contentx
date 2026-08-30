const AUTH_API = "/api/auth";
const BRIEF_API = "/api/briefs";
const NOTIFICATION_API = "/api/notifications";
let currentUser = null;
let sessionChecked = false;
let accountProviders = { google:{ available:false, clientId:"" }, emailOtp:{ available:false }, passwordReset:{ available:false } };
let googleScriptPromise = null;

const escapeHTML = value => String(value ?? "").replace(/[&<>'"]/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[character]);
const money = (value, currency = "INR") => currency === "USD" ? `$${Math.round(Number(value || 0) / 100).toLocaleString("en-US")}` : `₹${Math.round(Number(value || 0) / 100).toLocaleString("en-IN")}`;

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
  localStorage.setItem("cx_return_route", route || "workspace");
}

export function renderAccountAccess(root, actions) {
  const returningTo = localStorage.getItem("cx_return_route") || "workspace";
  root.className = "account-app";
  root.innerHTML = `<main class="account-access account-access-frame"><section class="account-story"><a class="brand" href="#home"><span class="brand-mark">CX</span><span>Content X</span></a><div><span class="account-orbit-mark">CX</span><p class="eyebrow light"><span></span>Free review workspace</p><h1>Welcome to your production room.</h1><p>Create projects, upload safe files, compare versions, create share links and keep feedback away from scattered WhatsApp threads.</p><ul><li><b>✓</b> Free 50 GB account workspace</li><li><b>✓</b> Private project files and version stacks</li><li><b>✓</b> Share links with expiry and upload controls</li></ul></div><small>Clients can review from a private link without creating an account.</small></section><section class="account-card account-card-frame"><button class="account-close" type="button" aria-label="Return home">×</button><div class="account-card-logo"><span>CX</span><small>Content X Workspace</small></div><div class="account-toggle" role="tablist" aria-label="Account action"><button class="active" type="button" data-account-tab="login">Sign in</button><button type="button" data-account-tab="register">Create account</button></div><div data-account-panel></div><div class="account-workflow-signature"><div><span>The Content X flow</span><strong>One private room. Every version. A clear final yes.</strong></div><p aria-label="Organise, review and deliver"><span>Organise</span><i></i><span>Review</span><i></i><span>Deliver</span></p></div><aside class="account-security"><span>✓</span><p><strong>Ready to review</strong><small>Sign in with Google, email code, or password to open your workspace.</small></p></aside></section></main>`;
  root.querySelector(".account-close").addEventListener("click", actions.openMarketing);
  root.querySelector(".account-story .brand").addEventListener("click", event => { event.preventDefault(); actions.openMarketing(); });
  const panel = root.querySelector("[data-account-panel]");
  const tabs = [...root.querySelectorAll("[data-account-tab]")];
  const resetParams = new URLSearchParams((location.hash.split("?")[1] || "").replace(/^#/, ""));
  const resetToken = resetParams.get("reset");
  const resetEmail = resetParams.get("email") || "";

  function show(mode) {
    tabs.forEach(button => button.classList.toggle("active", button.dataset.accountTab === mode));
    const register = mode === "register";
    panel.innerHTML = `<p class="eyebrow"><span></span>${register ? "New creator account" : "Welcome back"}</p><h2>${register ? "Create your account." : "Sign in to continue."}</h2><p>${register ? "Use Google, email code or a password to open your free review workspace." : "Open your workspace, project files, versions and private share links."}</p><div class="account-provider-actions">${accountProviders.google?.available ? `<div data-google-button></div>` : ""}${accountProviders.emailOtp?.available ? `<button type="button" data-account-otp>✉ Continue with email code</button>` : ""}</div>${(accountProviders.google?.available || accountProviders.emailOtp?.available) ? '<div class="account-divider"><span>or continue with password</span></div>' : ""}<form data-password-form>${register ? '<label>Full name<input name="name" autocomplete="name" required placeholder="Your full name"></label>' : ""}<label>Email address<input name="email" type="email" autocomplete="email" required placeholder="you@company.com"></label><label>Password<input name="password" type="password" autocomplete="${register ? "new-password" : "current-password"}" minlength="10" maxlength="128" required placeholder="10+ character passphrase"></label>${register ? '<small class="password-tip">A long phrase is better than a short complex password.</small>' : '<button class="account-text-link" type="button" data-forgot-password>Forgot password?</button>'}<p class="account-form-error" role="alert" hidden></p><button class="pill pill-hot" type="submit">${register ? "Create account →" : "Sign in →"}</button></form>`;
    panel.querySelector("[data-password-form]").addEventListener("submit", async event => {
      event.preventDefault();
      const button = event.currentTarget.querySelector("button[type=submit]");
      const error = event.currentTarget.querySelector(".account-form-error");
      button.disabled = true; button.textContent = register ? "Creating account…" : "Signing in…"; error.hidden = true;
      try {
        const values = Object.fromEntries(new FormData(event.currentTarget));
        const result = await api(AUTH_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:register ? "register" : "login", ...values }) });
        finishAccountAccess(result.user, returningTo);
      } catch (failure) {
        error.textContent = failure.message; error.hidden = false;
        button.disabled = false; button.textContent = register ? "Create account →" : "Sign in →";
      }
    });
    panel.querySelector("[data-account-otp]")?.addEventListener("click", () => renderOtpAccess(panel, returningTo, register));
    panel.querySelector("[data-forgot-password]")?.addEventListener("click", () => renderPasswordResetRequest(panel, returningTo));
    if (accountProviders.google?.available) renderGoogleAccess(panel, returningTo);
  }

  tabs.forEach(button => button.addEventListener("click", () => show(button.dataset.accountTab)));
  if (resetToken) {
    tabs.forEach(button => button.classList.remove("active"));
    renderPasswordResetForm(panel, returningTo, resetToken, resetEmail);
    return;
  }
  show(returningTo === "checkout" ? "register" : "login");
}

function finishAccountAccess(user, returningTo) {
  currentUser = user; sessionChecked = true;
  localStorage.setItem("cx_access", JSON.stringify({ paid:true, account:true }));
  localStorage.removeItem("cx_return_route");
  location.hash = returningTo;
}

function renderPasswordResetRequest(panel, returningTo) {
  panel.innerHTML = `<button class="account-inline-back" type="button">← Back to sign in</button><p class="eyebrow"><span></span>Password help</p><h2>Reset your password.</h2><p>Enter the email used for your Content X account. If it exists, we’ll send a secure reset link.</p><form data-reset-request><label>Email address<input name="email" type="email" autocomplete="email" required placeholder="you@company.com"></label><p class="account-form-error" role="alert" hidden></p><button class="pill pill-hot" type="submit">Send reset link →</button></form>`;
  panel.querySelector(".account-inline-back").addEventListener("click", () => panel.closest(".account-card").querySelector('[data-account-tab="login"]').click());
  panel.querySelector("[data-reset-request]").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector("button[type=submit]");
    const error = form.querySelector("[role=alert]");
    button.disabled = true; button.textContent = "Sending secure link…"; error.hidden = true;
    try {
      await api(AUTH_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"request_password_reset", email:new FormData(form).get("email") }) });
      form.innerHTML = `<div class="account-success"><span>✓</span><h3>Check your email.</h3><p>If this address has an account, a password reset link was sent. The link expires in 60 minutes.</p><button class="pill pill-dark" type="button" data-back-login>Return to sign in</button></div>`;
      form.querySelector("[data-back-login]").addEventListener("click", () => panel.closest(".account-card").querySelector('[data-account-tab="login"]').click());
    } catch (failure) {
      error.textContent = failure.message; error.hidden = false; button.disabled = false; button.textContent = "Send reset link →";
    }
  });
}

function renderPasswordResetForm(panel, returningTo, token, email) {
  panel.innerHTML = `<p class="eyebrow"><span></span>New password</p><h2>Create a fresh password.</h2><p>Use at least 10 characters. This will sign out old sessions after the password changes.</p><form data-reset-password><input type="hidden" name="token" value="${escapeHTML(token)}"><label>Email address<input name="email" type="email" autocomplete="email" required value="${escapeHTML(email)}" placeholder="you@company.com"></label><label>New password<input name="password" type="password" autocomplete="new-password" minlength="10" maxlength="128" required placeholder="10+ character passphrase"></label><small class="password-tip">Never reuse a password from another website.</small><p class="account-form-error" role="alert" hidden></p><button class="pill pill-hot" type="submit">Reset password & sign in →</button></form>`;
  panel.querySelector("[data-reset-password]").addEventListener("submit", async event => {
    event.preventDefault();
    const button = event.currentTarget.querySelector("button[type=submit]");
    const error = event.currentTarget.querySelector("[role=alert]");
    button.disabled = true; button.textContent = "Resetting…"; error.hidden = true;
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const result = await api(AUTH_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"reset_password", ...values }) });
      finishAccountAccess(result.user, returningTo);
    } catch (failure) {
      error.textContent = failure.message; error.hidden = false; button.disabled = false; button.textContent = "Reset password & sign in →";
    }
  });
}

function renderOtpAccess(panel, returningTo, register) {
  panel.innerHTML = `<button class="account-inline-back" type="button">← Other sign-in options</button><p class="eyebrow"><span></span>Email verification</p><h2>${register ? "Create with an email code." : "Sign in with an email code."}</h2><p>Enter your email and we’ll send a short one-time code.</p><form data-otp-request><label>Email address<input name="email" type="email" autocomplete="email" required placeholder="you@company.com"></label><p class="account-form-error" role="alert" hidden></p><button class="pill pill-hot" type="submit">Send verification code →</button></form>`;
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
  panel.innerHTML = `<button class="account-inline-back" type="button">← Change details</button><p class="eyebrow"><span></span>Verify your identity</p><h2>Enter the code.</h2><p>We sent a 6-digit code to <strong>${escapeHTML(email)}</strong>.</p><form data-otp-verify><input type="hidden" name="email" value="${escapeHTML(email)}"><input type="hidden" name="otp" data-otp-value><div class="otp-box-grid" aria-label="Verification code">${Array.from({ length:6 }, (_, index) => `<input data-otp-box inputmode="numeric" autocomplete="${index === 0 ? "one-time-code" : "off"}" maxlength="1" aria-label="Digit ${index + 1}">`).join("")}</div><p class="account-form-error" role="alert" hidden></p><div class="otp-actions"><button type="button" class="account-inline-back" data-otp-resend>Resend code</button><button class="pill pill-hot" type="submit">${register ? "Verify & create account" : "Verify & continue"} →</button></div></form>`;
  panel.querySelector(".account-inline-back").addEventListener("click", () => renderOtpAccess(panel, returningTo, register));
  bindOtpBoxes(panel.querySelector("[data-otp-verify]"));
  panel.querySelector("[data-otp-resend]").addEventListener("click", async event => {
    const button = event.currentTarget;
    button.disabled = true; button.textContent = "Sending…";
    try {
      await api(AUTH_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"request_otp", email }) });
      button.textContent = "Code sent ✓";
    } catch (failure) {
      button.textContent = failure.message;
    }
    setTimeout(() => { button.disabled = false; button.textContent = "Resend code"; }, 3000);
  });
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

function bindOtpBoxes(form) {
  const boxes = [...form.querySelectorAll("[data-otp-box]")];
  const hidden = form.querySelector("[data-otp-value]");
  const sync = () => { hidden.value = boxes.map(input => input.value.replace(/\D/g, "")).join(""); };
  boxes.forEach((input, index) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 1);
      sync();
      if (input.value && boxes[index + 1]) boxes[index + 1].focus();
    });
    input.addEventListener("keydown", event => {
      if (event.key === "Backspace" && !input.value && boxes[index - 1]) boxes[index - 1].focus();
    });
    input.addEventListener("paste", event => {
      event.preventDefault();
      const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, boxes.length).split("");
      digits.forEach((digit, offset) => { if (boxes[index + offset]) boxes[index + offset].value = digit; });
      sync();
      boxes[Math.min(index + digits.length, boxes.length - 1)]?.focus();
    });
  });
  boxes[0]?.focus();
}

async function renderGoogleAccess(panel, returningTo) {
  const host = panel.querySelector("[data-google-button]");
  if (!host) return;
  host.setAttribute("aria-busy", "true");
  try {
    const nonceData = await api(AUTH_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"google_nonce" }) });
    await loadGoogleIdentity();
    if (!host.isConnected || !panel.contains(host)) return;
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
    host.replaceChildren();
    const width = Math.max(240, Math.min(400, Math.floor(host.getBoundingClientRect().width || 400)));
    window.google.accounts.id.renderButton(host, { theme:"filled_black", size:"large", shape:"rectangular", text:"continue_with", logo_alignment:"left", width });
    host.setAttribute("aria-busy", "false");
  } catch (error) {
    host.setAttribute("aria-busy", "false");
    showProviderError(panel, error.message);
  }
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
  root.className = "account-app account-settings-app";
  root.innerHTML = `<main class="account-loading"><span></span><h1>Opening your settings…</h1></main>`;
  try {
    const [data, notificationData] = await Promise.all([
      api(BRIEF_API, { cache:"no-store" }),
      api(NOTIFICATION_API, { cache:"no-store" }).catch(() => null),
    ]);
    currentUser = data.user;
    const orders = data.orders || [];
    const activeRefunds = orders.filter(order => ["requested", "processing"].includes(order.refund_status)).length;
    const refundUpdates = orders.filter(order => order.refund_status && order.refund_status !== "none").length;
    const initials = data.user.name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
    root.innerHTML = `<div class="account-settings-shell">
      <aside class="account-global-rail" aria-label="Content X navigation">
        <a class="account-rail-brand" href="#home" aria-label="Content X home">CX</a>
        <nav><a href="#workspace" aria-label="Workspace" title="Workspace">⌂</a><a class="active" href="#account" aria-label="Account settings" title="Account settings">◎</a></nav>
        <span class="account-rail-avatar">${escapeHTML(initials || "CX")}</span>
      </aside>
      <aside class="account-settings-sidebar">
        <a class="account-settings-back" href="#workspace">← Back to workspace</a>
        <div class="account-settings-identity"><span>${escapeHTML(initials || "CX")}</span><div><strong>${escapeHTML(data.user.name)}</strong><small>${escapeHTML(data.user.email)}</small></div></div>
        <nav aria-label="Account settings sections">
          <small>PERSONAL</small>
          <button class="active" type="button" data-account-view="profile"><span>◎</span>Profile</button>
          <button type="button" data-account-view="notifications"><span>◌</span>Notifications</button>
          <small>ACCOUNT</small>
          <button type="button" data-account-view="billing"><span>₹</span>Orders & billing</button>
        </nav>
        <button class="account-settings-signout" type="button" data-account-logout>Sign out</button>
      </aside>
      <main class="account-settings-main">
        <header class="account-settings-topbar"><div><span>Account</span><b data-account-section-title>Profile</b></div><a class="workspace-button" href="#workspace">Open workspace</a></header>
        <div class="account-settings-content">
          <section class="account-settings-panel active" data-account-panel="profile">
            <div class="account-panel-heading"><p>PERSONAL</p><h1>Your profile</h1><span>Your Content X identity, workspace access and account status in one place.</span></div>
            <article class="account-profile-card"><div class="account-profile-avatar">${escapeHTML(initials || "CX")}</div><div><small>DISPLAY NAME</small><strong>${escapeHTML(data.user.name)}</strong><span>${escapeHTML(data.user.email)}</span></div><a href="#workspace">View workspace →</a></article>
            <div class="account-profile-metrics"><article><span>Storage plan</span><strong>50 GB free</strong><small>Private creator workspace</small></article><article><span>Privacy</span><strong>Protected</strong><small>Owner-authorized access only</small></article><article><span>Refunds</span><strong>${activeRefunds}</strong><small>Active requests</small></article></div>
            <article class="account-profile-note"><span>✓</span><div><strong>Your workspace is ready.</strong><p>Create projects, upload source files, manage versions and share review links from the main dashboard.</p></div><a class="workspace-button primary" href="#workspace">Go to workspace</a></article>
          </section>
          <section class="account-settings-panel" data-account-panel="notifications" hidden>${notificationSettingsPanel(notificationData)}</section>
          <section class="account-settings-panel" data-account-panel="billing" hidden>
            <div class="account-panel-heading"><p>ACCOUNT</p><h1>Orders & billing</h1><span>Packages, receipts and refund updates stay private to your account.</span></div>
            <section class="account-order-section"><div class="account-section-title"><div><h2>Paid Content X orders</h2><p>Editing packages and project briefs appear here after checkout.</p></div><span>${orders.length} order${orders.length === 1 ? "" : "s"}</span></div><div class="account-orders">${orders.length ? orders.map(orderCard).join("") : `<div class="account-empty"><span>◇</span><h3>No paid orders yet</h3><p>Your free workspace is already available.</p><a class="workspace-button primary" href="#workspace">Open workspace</a></div>`}</div></section>
            <section class="account-order-section account-payment-history"><div class="account-section-title"><div><h2>Payment history & refunds</h2><p>Receipts and status changes appear automatically.</p></div><span>${refundUpdates} refund update${refundUpdates === 1 ? "" : "s"}</span></div><div class="account-payment-list">${orders.length ? orders.map(paymentHistoryCard).join("") : `<div class="account-empty"><span>₹</span><h3>No payment history yet</h3><p>Your receipts will appear here after checkout.</p></div>`}</div></section>
          </section>
        </div>
      </main>
    </div>`;
    root.querySelector("[data-account-logout]").addEventListener("click", async () => {
      await api(AUTH_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"logout" }) });
      currentUser = null; sessionChecked = true; localStorage.removeItem("cx_access"); actions.openMarketing();
    });
    const titles = { profile:"Profile", notifications:"Notifications", billing:"Orders & billing" };
    root.querySelectorAll("[data-account-view]").forEach(button => button.addEventListener("click", () => {
      const view = button.dataset.accountView;
      root.querySelectorAll("[data-account-view]").forEach(item => item.classList.toggle("active", item === button));
      root.querySelectorAll("[data-account-panel]").forEach(panel => { const active = panel.dataset.accountPanel === view; panel.hidden = !active; panel.classList.toggle("active", active); });
      root.querySelector("[data-account-section-title]").textContent = titles[view] || "Account";
      root.querySelector(".account-settings-main")?.scrollTo({ top:0, behavior:"smooth" });
    }));
    bindNotificationSettings(root);
  } catch (error) {
    root.innerHTML = `<main class="account-error"><span>!</span><h1>We couldn’t open your account.</h1><p>${escapeHTML(error.message)}</p><button class="pill pill-dark" type="button">Sign in again</button></main>`;
    root.querySelector("button").addEventListener("click", () => { rememberProtectedRoute("workspace"); location.hash = "access"; });
  }
}

export async function renderWorkspaceAccountPanel(container, actions, initialView = "profile") {
  container.innerHTML = `<div class="workspace-account-opening"><span></span><span></span><span></span></div>`;
  try {
    const [data, notificationData] = await Promise.all([
      api(BRIEF_API, { cache:"no-store" }),
      api(NOTIFICATION_API, { cache:"no-store" }).catch(() => null),
    ]);
    currentUser = data.user;
    const orders = data.orders || [];
    const activeRefunds = orders.filter(order => ["requested", "processing"].includes(order.refund_status)).length;
    const refundUpdates = orders.filter(order => order.refund_status && order.refund_status !== "none").length;
    const initials = data.user.name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
    container.innerHTML = `<div class="workspace-account-head"><div><span class="account-profile-avatar">${escapeHTML(initials || "CX")}</span><p><small>ACCOUNT</small><strong>${escapeHTML(data.user.name)}</strong><em>${escapeHTML(data.user.email)}</em></p></div><button class="workspace-button" type="button" data-account-logout>Sign out</button></div>
      <nav class="workspace-account-tabs" aria-label="Account sections"><button type="button" data-account-view="profile">Profile</button><button type="button" data-account-view="notifications">Notifications</button><button type="button" data-account-view="billing">Orders & billing</button></nav>
      <div class="account-settings-content workspace-account-content">
        <section class="account-settings-panel" data-account-panel="profile">
          <div class="account-panel-heading"><p>PERSONAL</p><h1>Your profile</h1><span>Your Content X identity, workspace access and account status in one place.</span></div>
          <article class="account-profile-card"><div class="account-profile-avatar">${escapeHTML(initials || "CX")}</div><div><small>DISPLAY NAME</small><strong>${escapeHTML(data.user.name)}</strong><span>${escapeHTML(data.user.email)}</span></div><a href="#workspace">View projects →</a></article>
          <div class="account-profile-metrics"><article><span>Storage plan</span><strong>50 GB free</strong><small>Private creator workspace</small></article><article><span>Privacy</span><strong>Protected</strong><small>Owner-authorized access only</small></article><article><span>Refunds</span><strong>${activeRefunds}</strong><small>Active requests</small></article></div>
        </section>
        <section class="account-settings-panel" data-account-panel="notifications" hidden>${notificationSettingsPanel(notificationData)}</section>
        <section class="account-settings-panel" data-account-panel="billing" hidden>
          <div class="account-panel-heading"><p>ACCOUNT</p><h1>Orders & billing</h1><span>Packages, receipts and refund updates stay private to your account.</span></div>
          <section class="account-order-section"><div class="account-section-title"><div><h2>Paid Content X orders</h2><p>Editing packages and project briefs appear here after checkout.</p></div><span>${orders.length} order${orders.length === 1 ? "" : "s"}</span></div><div class="account-orders">${orders.length ? orders.map(orderCard).join("") : `<div class="account-empty"><span>◇</span><h3>No paid orders yet</h3><p>Your free workspace is already available.</p><a class="workspace-button primary" href="#workspace">View projects</a></div>`}</div></section>
          <section class="account-order-section account-payment-history"><div class="account-section-title"><div><h2>Payment history & refunds</h2><p>Receipts and status changes appear automatically.</p></div><span>${refundUpdates} refund update${refundUpdates === 1 ? "" : "s"}</span></div><div class="account-payment-list">${orders.length ? orders.map(paymentHistoryCard).join("") : `<div class="account-empty"><span>₹</span><h3>No payment history yet</h3><p>Your receipts will appear here after checkout.</p></div>`}</div></section>
        </section>
      </div>`;
    const openView = view => {
      const selected = ["profile", "notifications", "billing"].includes(view) ? view : "profile";
      container.querySelectorAll("[data-account-view]").forEach(button => button.classList.toggle("active", button.dataset.accountView === selected));
      container.querySelectorAll("[data-account-panel]").forEach(panel => { const active = panel.dataset.accountPanel === selected; panel.hidden = !active; panel.classList.toggle("active", active); });
      history.replaceState(null, "", `${location.pathname}${location.search}#workspace?panel=account&view=${selected}`);
      container.closest(".workspace-main")?.scrollTo({ top:0, behavior:"smooth" });
    };
    container.querySelectorAll("[data-account-view]").forEach(button => button.addEventListener("click", () => openView(button.dataset.accountView)));
    container.querySelector("[data-account-logout]").addEventListener("click", async () => {
      await api(AUTH_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"logout" }) });
      currentUser = null; sessionChecked = true; localStorage.removeItem("cx_access"); actions.openMarketing();
    });
    bindNotificationSettings(container);
    openView(initialView);
  } catch (error) {
    container.innerHTML = `<div class="workspace-account-error"><span>!</span><h1>We couldn’t open your account.</h1><p>${escapeHTML(error.message)}</p><button class="workspace-button" type="button">Sign in again</button></div>`;
    container.querySelector("button").addEventListener("click", () => { rememberProtectedRoute("workspace?panel=account"); location.hash = "access"; });
  }
}

async function renderLegacyAccountDashboard(root, actions) {
  root.className = "account-app";
  root.innerHTML = `<main class="account-loading"><span></span><h1>Opening your account…</h1></main>`;
  try {
    const [data, notificationData] = await Promise.all([
      api(BRIEF_API, { cache:"no-store" }),
      api(NOTIFICATION_API, { cache:"no-store" }).catch(() => null),
    ]);
    currentUser = data.user;
    const orders = data.orders || [];
    const totalPaid = orders.filter(order => ["verified", "captured"].includes(order.status)).reduce((sum, order) => sum + Number(order.amount_paise || 0), 0);
    const activeRefunds = orders.filter(order => ["requested", "processing"].includes(order.refund_status)).length;
    root.innerHTML = `<header class="account-head"><a class="brand" href="#home"><span class="brand-mark">CX</span><span>Content X</span></a><nav><a href="#pricing">Pricing</a><a href="#workspace">Workspace</a><button type="button" data-account-logout>Sign out</button></nav></header><main class="account-dashboard"><section class="account-welcome"><div><p class="eyebrow"><span></span>Free creator account</p><h1>Hello, ${escapeHTML(data.user.name.split(" ")[0])}.</h1><p>Create projects for your own editing clients, upload files, manage versions and collect comments through private share links.</p></div><a class="pill pill-hot" href="#workspace">Open free workspace →</a></section><section class="dashboard-help-strip account-help-strip"><article><span>1</span><strong>Create project</strong><small>Every account gets a free 50 GB review workspace.</small></article><article><span>2</span><strong>Upload files</strong><small>Add videos, audio, images, documents and replacement versions.</small></article><article><span>3</span><strong>Share for review</strong><small>Clients can comment from a secure link without login.</small></article></section><section class="account-review-panel"><article><span>Share links</span><strong>Send secure review pages</strong><small>Control downloads, uploads, expiry and client review access for every project link.</small></article><article><span>Versions</span><strong>Keep every cut together</strong><small>Drop a new file on the same asset to make V2, V3 and final delivery easy to follow.</small></article><article><span>Activity</span><strong>Know what changed</strong><small>Views, comments, approvals and downloads stay attached to each project.</small></article></section>${notificationSettingsPanel(notificationData)}<section class="account-finance-summary"><article><span>Free storage</span><strong>50 GB</strong><small>Included for every account while Content X is free</small></article><article><span>Refunds</span><strong>${activeRefunds}</strong><small>Active refund requests</small></article><article><span>Privacy</span><strong>Private</strong><small>Only you and authorized Content X admins can view account data.</small></article></section><section class="account-order-section"><div class="account-section-title"><div><h2>Paid Content X orders</h2><p>If someone buys editing from Content X, their payment and project brief appears here too.</p></div><span>${orders.length} order${orders.length === 1 ? "" : "s"}</span></div><div class="account-orders">${orders.length ? orders.map(orderCard).join("") : `<div class="account-empty"><span>◇</span><h3>No paid orders yet</h3><p>You can still use the free workspace for your own editing clients.</p><a class="pill pill-dark" href="#workspace">Open workspace →</a></div>`}</div></section><section class="account-order-section account-payment-history"><div class="account-section-title"><div><h2>Payment history & refund status</h2><p>Receipts, payment status and refund updates stay private to your account.</p></div><span>${orders.filter(order => order.refund_status && order.refund_status !== "none").length} refund update${orders.filter(order => order.refund_status && order.refund_status !== "none").length === 1 ? "" : "s"}</span></div><div class="account-payment-list">${orders.length ? orders.map(paymentHistoryCard).join("") : `<div class="account-empty"><span>₹</span><h3>No payment history yet</h3><p>Your receipts will appear here after checkout.</p></div>`}</div></section></main>`;
    root.querySelector(".brand").addEventListener("click", event => { event.preventDefault(); actions.openMarketing(); });
    root.querySelector("[data-account-logout]").addEventListener("click", async () => {
      await api(AUTH_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"logout" }) });
      currentUser = null; sessionChecked = true; localStorage.removeItem("cx_access"); actions.openMarketing();
    });
    bindNotificationSettings(root);
  } catch (error) {
    root.innerHTML = `<main class="account-error"><span>!</span><h1>We couldn’t open your account.</h1><p>${escapeHTML(error.message)}</p><button class="pill pill-dark" type="button">Sign in again</button></main>`;
    root.querySelector("button").addEventListener("click", () => { rememberProtectedRoute("account"); location.hash = "access"; });
  }
}

function notificationSettingsPanel(data) {
  const preferences = { emailEnabled:true, inAppEnabled:true, uploadEmail:true, uploadInApp:true, versionEmail:true, versionInApp:true, approvalEmail:true, approvalInApp:true, paymentEmail:true, paymentInApp:true, securityEmail:true, securityInApp:true, commentEmailMode:"digest", commentInApp:true, digestThreshold:9, ...(data?.preferences || {}) };
  const notifications = Array.isArray(data?.notifications) ? data.notifications : [];
  const queuedEmails = Array.isArray(data?.queuedEmails) ? data.queuedEmails : [];
  const rows = [
    ["upload", "Uploads", "When files or new versions are added."],
    ["version", "Delivery updates", "When a new cut, delivery or managed review is ready."],
    ["approval", "Approvals", "When a version is approved or marked complete."],
    ["payment", "Payments", "Receipts, refund status and checkout updates."],
    ["security", "Security", "Login and important account changes."],
  ];
  const activity = notifications.length ? notifications.slice(0, 5).map(item => `<article data-notification-item="${escapeHTML(item.id)}"><span>${notificationIcon(item.event_type)}</span><div><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.message)}</small></div>${item.read_at ? "<em>Read</em>" : `<button type="button" data-mark-notification-read="${escapeHTML(item.id)}">Mark read</button>`}</article>`).join("") : `<div class="account-empty compact"><span>◌</span><h3>No notifications yet</h3><p>Uploads, comments, approvals and payments will appear here.</p></div>`;
  return `<section class="account-notification-center"><div class="account-section-title"><div><h2>Notification controls</h2><p>Choose what comes by email and what stays inside the website.</p></div><button class="pill pill-dark" type="button" data-test-account-notification>Send test</button></div><div class="notification-control-grid"><article class="notification-master-card"><label><span><strong>Email updates</strong><small>Uses your account email. Comment emails are bundled by default.</small></span><input type="checkbox" data-account-notification="emailEnabled" ${preferences.emailEnabled ? "checked" : ""}></label><label><span><strong>Website notifications</strong><small>Show updates in your Content X dashboard.</small></span><input type="checkbox" data-account-notification="inAppEnabled" ${preferences.inAppEnabled ? "checked" : ""}></label><div><span>Email queue</span><strong>${queuedEmails.length}</strong><small>${queuedEmails.length ? "Recent sent / queued items" : "No email activity yet"}</small></div></article><article class="notification-event-card"><h3>Events</h3>${rows.map(([key, title, copy]) => `<div class="notification-event-row"><div><strong>${title}</strong><small>${copy}</small></div><label>Email<input type="checkbox" data-account-notification="${key}Email" ${preferences[`${key}Email`] ? "checked" : ""}></label><label>Website<input type="checkbox" data-account-notification="${key}InApp" ${preferences[`${key}InApp`] ? "checked" : ""}></label></div>`).join("")}<div class="notification-event-row comment-row"><div><strong>Comments</strong><small>Use digest mode to avoid one email for every single comment.</small></div><label>Email<select data-account-notification="commentEmailMode"><option value="digest" ${preferences.commentEmailMode === "digest" ? "selected" : ""}>Digest at 9+</option><option value="instant" ${preferences.commentEmailMode === "instant" ? "selected" : ""}>Instant</option><option value="off" ${preferences.commentEmailMode === "off" ? "selected" : ""}>Off</option></select></label><label>Website<input type="checkbox" data-account-notification="commentInApp" ${preferences.commentInApp ? "checked" : ""}></label><label>Digest count<input type="number" min="3" max="25" value="${Number(preferences.digestThreshold) || 9}" data-account-notification="digestThreshold"></label></div></article></div><div class="notification-activity-list"><div class="account-section-title small"><div><h3>Recent website notifications</h3><p>Unread items can be marked read without changing email history.</p></div></div>${activity}</div><p class="notification-save-state" data-notification-save-state role="status"></p></section>`;
}

function bindNotificationSettings(root) {
  const panel = root.querySelector(".account-notification-center");
  if (!panel) return;
  const status = panel.querySelector("[data-notification-save-state]");
  const current = {};
  const collect = () => {
    panel.querySelectorAll("[data-account-notification]").forEach(input => {
      const key = input.dataset.accountNotification;
      current[key] = input.type === "checkbox" ? input.checked : input.type === "number" ? Number(input.value) : input.value;
    });
    return current;
  };
  const save = async () => {
    status.textContent = "Saving notification settings…";
    try {
      await api(NOTIFICATION_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"update_preferences", ...collect() }) });
      status.textContent = "Saved ✓";
      setTimeout(() => { if (status.textContent === "Saved ✓") status.textContent = ""; }, 1800);
    } catch (error) {
      status.textContent = error.message || "Could not save notification settings.";
    }
  };
  panel.querySelectorAll("[data-account-notification]").forEach(input => input.addEventListener("change", save));
  panel.querySelector("[data-test-account-notification]")?.addEventListener("click", async event => {
    const button = event.currentTarget;
    button.textContent = "Sending…";
    try {
      await api(NOTIFICATION_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"test_notification" }) });
      button.textContent = "Test sent ✓";
    } catch (error) {
      button.textContent = "Try again";
      status.textContent = error.message || "Could not send test notification.";
    }
    setTimeout(() => { if (button.isConnected) button.textContent = "Send test"; }, 2200);
  });
  panel.querySelectorAll("[data-mark-notification-read]").forEach(button => button.addEventListener("click", async () => {
    button.textContent = "Marking…";
    try {
      await api(NOTIFICATION_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"mark_read", id:button.dataset.markNotificationRead }) });
      button.closest("article")?.classList.add("is-read");
      button.replaceWith(Object.assign(document.createElement("em"), { textContent:"Read" }));
    } catch (error) {
      status.textContent = error.message || "Could not update notification.";
      button.textContent = "Mark read";
    }
  }));
}

function notificationIcon(type) {
  return type === "upload" ? "↑" : type === "approval" ? "✓" : type === "payment" ? "₹" : type === "comment" ? "◌" : type === "security" ? "⌾" : "•";
}

function contentUnit(type, quantity) {
  if (type === "podcast") return quantity === 1 ? "episode" : "episodes";
  if (type === "longform") return quantity === 1 ? "long-form video" : "long-form videos";
  return quantity === 1 ? "video" : "videos";
}

function orderCard(order) {
  const refundStatus = normalizeRefundStatus(order.refund_status);
  const refunded = refundStatus === "refunded";
  const pausedForRefund = refundStatus === "requested" || refundStatus === "processing";
  const paid = ["verified", "captured"].includes(order.status) && !refunded && !pausedForRefund;
  const hasBrief = Boolean(order.brief_id);
  const revisionPurchase = order.plan_id === "revision_short" || order.plan_id === "revision_long";
  const addOns = Array.isArray(order.add_ons) ? order.add_ons : [];
  const statusLabel = refunded ? "Refunded" : pausedForRefund ? (refundStatus === "processing" ? "Refund processing" : "Refund requested") : paid ? "Paid" : "Payment pending";
  return `<article class="account-order-card"><header><div><span>${escapeHTML(order.content_type || "video")}</span><small>${new Date(Number(order.created_at)).toLocaleDateString([], { dateStyle:"medium" })}</small></div><b class="${paid ? "paid" : refunded ? "refunded" : "pending"}">${statusLabel}</b></header><h3>${escapeHTML(order.plan_name)}</h3><p>${revisionPurchase ? "1 additional round · Attached to an existing video" : `${Number(order.quantity)} ${contentUnit(order.content_type, Number(order.quantity))} · ${escapeHTML(order.billing === "monthly" ? "Monthly" : "One-time")}`}</p>${addOns.length ? `<ul>${addOns.map(item => `<li>+ ${escapeHTML(item.name)}</li>`).join("")}</ul>` : ""}${pausedForRefund || refunded ? `<aside class="account-refund-note">${refundStatusCopy(refundStatus)}${order.refund_reason ? `<small>Reason: ${escapeHTML(order.refund_reason)}</small>` : ""}</aside>` : ""}<footer><strong>${money(order.amount_paise, order.currency)}</strong><div>${paid ? `${revisionPurchase ? "" : `<a class="pill pill-dark" href="#brief?order=${encodeURIComponent(order.razorpay_order_id)}">${hasBrief ? "Edit brief" : "Add project brief"}</a>`}${order.project_id ? `<a class="pill pill-hot" href="#workspace?project=${encodeURIComponent(order.project_id)}">Open workspace</a>` : ""}` : refunded ? `<span>This order is closed after refund</span>` : pausedForRefund ? `<span>Project paused while refund is reviewed</span>` : `<span>Finish payment to add the brief</span>`}</div></footer></article>`;
}

function paymentHistoryCard(order) {
  const refundStatus = normalizeRefundStatus(order.refund_status);
  const statusLabel = refundStatus === "none" ? (["verified", "captured"].includes(order.status) ? "Paid" : "Payment pending") : refundStatusCopy(refundStatus);
  const refundAmount = Number(order.refund_amount_paise || 0);
  return `<article class="account-payment-row"><div><strong>${escapeHTML(order.plan_name || "Content X package")}</strong><small>${escapeHTML(order.razorpay_order_id || "Receipt pending")}</small></div><span>${new Date(Number(order.created_at)).toLocaleDateString([], { dateStyle:"medium" })}</span><span>${money(order.amount_paise, order.currency)}</span><b class="finance-status ${refundStatus}">${statusLabel}</b>${refundAmount ? `<em>Refund: ${money(refundAmount, order.currency)}</em>` : "<em>—</em>"}</article>`;
}

function normalizeRefundStatus(value) {
  return ["requested", "processing", "refunded", "cancelled"].includes(value) ? value : "none";
}

function refundStatusCopy(status) {
  return status === "requested" ? "Refund requested" : status === "processing" ? "Refund processing" : status === "refunded" ? "Refunded" : status === "cancelled" ? "Refund cancelled" : "No refund";
}

export async function renderProjectBrief(root, actions, route) {
  root.className = "account-app";
  root.innerHTML = `<main class="account-loading"><span></span><h1>Preparing your project brief…</h1></main>`;
  try {
    const data = await api(BRIEF_API, { cache:"no-store" });
    const requestedOrder = new URLSearchParams(route.split("?")[1] || "").get("order");
    const order = data.orders.find(item => item.razorpay_order_id === requestedOrder && canStartBrief(item)) || data.orders.find(canStartBrief);
    if (!order) throw new Error("Complete a package payment before adding the project brief.");
    const addOns = Array.isArray(order.add_ons) ? order.add_ons : [];
    root.innerHTML = `<header class="account-head"><a class="brand" href="#home"><span class="brand-mark">CX</span><span>Content X</span></a><a href="#account">Your account</a></header><main class="brief-shell"><section class="brief-intro"><p class="eyebrow light"><span></span>After-payment project setup</p><h1>Tell us exactly what to create.</h1><p>Your package and add-ons are already locked. Share Drive/source links, tell us which takes matter, then upload any files you want to keep inside the website.</p><div><span>01 <b>Package paid</b></span><span class="active">02 <b>Project brief</b></span><span>03 <b>Upload files</b></span></div><aside><strong>${escapeHTML(order.plan_name)}</strong><span>${Number(order.quantity)} ${contentUnit(order.content_type, Number(order.quantity))}</span>${addOns.map(item => `<small>+ ${escapeHTML(item.name)}</small>`).join("")}</aside></section><section class="brief-card"><p class="eyebrow"><span></span>Project details</p><h2>${order.brief_id ? "Update your brief." : "Start your brief."}</h2><form><input type="hidden" name="razorpayOrderId" value="${escapeHTML(order.razorpay_order_id)}"><label>Video or episode title<input name="title" required maxlength="140" value="${escapeHTML(order.title || "")}" placeholder="e.g. Why most founders struggle with content"></label><label>What is this content about?<textarea name="description" required maxlength="2500" rows="4" placeholder="Topic, audience, platform and the main message…">${escapeHTML(order.description || "")}</textarea></label><label>Editing and creative instructions<textarea name="instructions" required maxlength="5000" rows="6" placeholder="Pacing, captions, brand colours, best takes, shots to keep, shots to avoid, CTA and anything else…">${escapeHTML(order.instructions || "")}</textarea></label><label>Source links & takes <span>optional</span><textarea name="referenceUrl" maxlength="5000" rows="5" placeholder="Take 1 - https://drive.google.com/…&#10;Take 2 - https://dropbox.com/…&#10;References - https://youtube.com/…">${escapeHTML(order.reference_url || "")}</textarea><small>Paste Google Drive, Dropbox, WeTransfer, YouTube, Instagram or any other https link. You can still upload files directly in the next step.</small></label><p class="account-form-error" role="alert" hidden></p><button class="pill pill-hot" type="submit">Save brief & upload files →</button></form></section></main>`;
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

function canStartBrief(order) {
  return !["revision_short", "revision_long"].includes(order.plan_id) && ["verified", "captured"].includes(order.status) && !["requested", "processing", "refunded"].includes(order.refund_status);
}
