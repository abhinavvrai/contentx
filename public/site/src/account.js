const AUTH_API = "/api/auth";
const BRIEF_API = "/api/briefs";
let currentUser = null;
let sessionChecked = false;

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
    currentUser = (await api(AUTH_API, { cache:"no-store" })).user || null;
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
  root.innerHTML = `<main class="account-access"><section class="account-story"><a class="brand" href="#home"><span class="brand-mark">CX</span><span>Content X</span></a><div><p class="eyebrow light"><span></span>Client account</p><h1>One login for every order, brief and upload.</h1><p>Choose your package first. After payment, your account keeps the brief, references and project files together.</p><ul><li><b>✓</b> Payment-linked project history</li><li><b>✓</b> Private file upload spaces</li><li><b>✓</b> Secure sessions across devices</li></ul></div><small>Passwords are never stored in readable form.</small></section><section class="account-card"><button class="account-close" type="button" aria-label="Return home">×</button><div class="account-toggle" role="tablist" aria-label="Account action"><button class="active" type="button" data-account-tab="login">Sign in</button><button type="button" data-account-tab="register">Create account</button></div><div data-account-panel></div><aside class="account-security"><span>⌾</span><p><strong>How your password is protected</strong><small>We store a salted PBKDF2-SHA-256 password hash—not the password itself. Login sessions use secure, HTTP-only cookies.</small></p></aside></section></main>`;
  root.querySelector(".account-close").addEventListener("click", actions.openMarketing);
  root.querySelector(".account-story .brand").addEventListener("click", event => { event.preventDefault(); actions.openMarketing(); });
  const panel = root.querySelector("[data-account-panel]");
  const tabs = [...root.querySelectorAll("[data-account-tab]")];

  function show(mode) {
    tabs.forEach(button => button.classList.toggle("active", button.dataset.accountTab === mode));
    const register = mode === "register";
    panel.innerHTML = `<p class="eyebrow"><span></span>${register ? "New client account" : "Welcome back"}</p><h2>${register ? "Create your account." : "Sign in to continue."}</h2><p>${register ? "Use the same email you will use for payment." : "Open your orders, briefs and private uploads."}</p><form>${register ? '<label>Full name<input name="name" autocomplete="name" required placeholder="Your full name"></label>' : ""}<label>Email address<input name="email" type="email" autocomplete="email" required placeholder="you@company.com"></label><label>Password<input name="password" type="password" autocomplete="${register ? "new-password" : "current-password"}" minlength="10" maxlength="128" required placeholder="At least 10 characters"></label>${register ? '<small class="password-tip">A long, unique passphrase is easiest to remember and safest to use.</small>' : ""}<p class="account-form-error" role="alert" hidden></p><button class="pill pill-hot" type="submit">${register ? "Create account →" : "Sign in →"}</button></form>`;
    panel.querySelector("form").addEventListener("submit", async event => {
      event.preventDefault();
      const button = event.currentTarget.querySelector("button[type=submit]");
      const error = event.currentTarget.querySelector(".account-form-error");
      button.disabled = true; button.textContent = register ? "Creating account…" : "Signing in…"; error.hidden = true;
      try {
        const values = Object.fromEntries(new FormData(event.currentTarget));
        const result = await api(AUTH_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:register ? "register" : "login", ...values }) });
        currentUser = result.user; sessionChecked = true;
        localStorage.setItem("cx_access", JSON.stringify({ email:currentUser.email, name:currentUser.name, paid:true, account:true }));
        localStorage.removeItem("cx_return_route");
        location.hash = returningTo;
      } catch (failure) {
        error.textContent = failure.message; error.hidden = false;
        button.disabled = false; button.textContent = register ? "Create account →" : "Sign in →";
      }
    });
  }

  tabs.forEach(button => button.addEventListener("click", () => show(button.dataset.accountTab)));
  show(returningTo === "checkout" ? "register" : "login");
}

export async function renderAccountDashboard(root, actions) {
  root.className = "account-app";
  root.innerHTML = `<main class="account-loading"><span></span><h1>Opening your account…</h1></main>`;
  try {
    const data = await api(BRIEF_API, { cache:"no-store" });
    currentUser = data.user;
    const orders = data.orders || [];
    root.innerHTML = `<header class="account-head"><a class="brand" href="#home"><span class="brand-mark">CX</span><span>Content X</span></a><nav><a href="#pricing">Pricing</a><button type="button" data-account-logout>Sign out</button></nav></header><main class="account-dashboard"><section class="account-welcome"><div><p class="eyebrow"><span></span>Client account</p><h1>Hello, ${escapeHTML(data.user.name.split(" ")[0])}.</h1><p>Manage paid orders, send the full project brief and upload footage or references.</p></div><a class="pill pill-hot" href="#home">Choose another package →</a></section><section class="account-order-section"><div class="account-section-title"><div><h2>Your projects</h2><p>Detailed briefs and files are collected after payment, so checkout stays quick.</p></div><span>${orders.length} order${orders.length === 1 ? "" : "s"}</span></div><div class="account-orders">${orders.length ? orders.map(orderCard).join("") : `<div class="account-empty"><span>◇</span><h3>No paid projects yet</h3><p>Choose a video or podcast package to start.</p><a class="pill pill-dark" href="#home">See pricing →</a></div>`}</div></section></main>`;
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

function orderCard(order) {
  const paid = ["verified", "captured"].includes(order.status);
  const hasBrief = Boolean(order.brief_id);
  const addOns = Array.isArray(order.add_ons) ? order.add_ons : [];
  return `<article class="account-order-card"><header><div><span>${escapeHTML(order.content_type || "video")}</span><small>${new Date(Number(order.created_at)).toLocaleDateString([], { dateStyle:"medium" })}</small></div><b class="${paid ? "paid" : "pending"}">${paid ? "Paid" : "Payment pending"}</b></header><h3>${escapeHTML(order.plan_name)}</h3><p>${Number(order.quantity)} ${order.content_type === "podcast" ? "episode" : "video"}${Number(order.quantity) === 1 ? "" : "s"} · ${escapeHTML(order.billing === "monthly" ? "Monthly" : "One-time")}</p>${addOns.length ? `<ul>${addOns.map(item => `<li>+ ${escapeHTML(item.name)}</li>`).join("")}</ul>` : ""}<footer><strong>${money(order.amount_paise)}</strong><div>${paid ? `<a class="pill pill-dark" href="#brief?order=${encodeURIComponent(order.razorpay_order_id)}">${hasBrief ? "Edit brief" : "Add project brief"}</a>${order.project_id ? `<a class="pill pill-hot" href="#upload?project=${encodeURIComponent(order.project_id)}">Upload files</a>` : ""}` : `<span>Finish payment to add the brief</span>`}</div></footer></article>`;
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
    root.innerHTML = `<header class="account-head"><a class="brand" href="#home"><span class="brand-mark">CX</span><span>Content X</span></a><a href="#account">Your account</a></header><main class="brief-shell"><section class="brief-intro"><p class="eyebrow light"><span></span>After-payment project setup</p><h1>Tell us exactly what to create.</h1><p>Your package and add-ons are already locked. Now share the creative details and then upload the footage and references.</p><div><span>01 <b>Package paid</b></span><span class="active">02 <b>Project brief</b></span><span>03 <b>Upload files</b></span></div><aside><strong>${escapeHTML(order.plan_name)}</strong><span>${Number(order.quantity)} ${order.content_type === "podcast" ? "episode" : "video"}${Number(order.quantity) === 1 ? "" : "s"}</span>${addOns.map(item => `<small>+ ${escapeHTML(item.name)}</small>`).join("")}</aside></section><section class="brief-card"><p class="eyebrow"><span></span>Project details</p><h2>${order.brief_id ? "Update your brief." : "Start your brief."}</h2><form><input type="hidden" name="razorpayOrderId" value="${escapeHTML(order.razorpay_order_id)}"><label>Video or episode title<input name="title" required maxlength="140" value="${escapeHTML(order.title || "")}" placeholder="e.g. Why most founders struggle with content"></label><label>What is this content about?<textarea name="description" required maxlength="2500" rows="4" placeholder="Topic, audience, platform and the main message…">${escapeHTML(order.description || "")}</textarea></label><label>Editing and creative instructions<textarea name="instructions" required maxlength="5000" rows="6" placeholder="Pacing, captions, brand colours, shots to keep, shots to avoid, CTA and anything else…">${escapeHTML(order.instructions || "")}</textarea></label><label>Reference link <span>optional</span><input name="referenceUrl" type="url" value="${escapeHTML(order.reference_url || "")}" placeholder="https://youtube.com/… or https://instagram.com/…"><small>You can upload reference files in the next step.</small></label><p class="account-form-error" role="alert" hidden></p><button class="pill pill-hot" type="submit">Save brief & upload files →</button></form></section></main>`;
    root.querySelector(".brand").addEventListener("click", event => { event.preventDefault(); actions.openMarketing(); });
    root.querySelector("form").addEventListener("submit", async event => {
      event.preventDefault();
      const button = event.currentTarget.querySelector("button[type=submit]");
      const error = event.currentTarget.querySelector(".account-form-error");
      button.disabled = true; button.textContent = "Saving your brief…"; error.hidden = true;
      try {
        const result = await api(BRIEF_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
        location.hash = `upload?project=${encodeURIComponent(result.projectId)}`;
      } catch (failure) {
        error.textContent = failure.message; error.hidden = false; button.disabled = false; button.textContent = "Save brief & upload files →";
      }
    });
  } catch (error) {
    root.innerHTML = `<main class="account-error"><span>!</span><h1>Project brief unavailable.</h1><p>${escapeHTML(error.message)}</p><a class="pill pill-dark" href="#account">Return to your account</a></main>`;
  }
}
