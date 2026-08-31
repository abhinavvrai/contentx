import { demoComments, demoProjects } from "./data.js";

const NOTIFICATION_API = "/api/notifications";

function startMutedPreviewVideos(root) {
  root.querySelectorAll("[data-preview-autoplay]").forEach(video => {
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("loop", "");
    video.setAttribute("autoplay", "");
    video.setAttribute("playsinline", "");
    video.removeAttribute("controls");
    video.play?.().catch(() => {});
  });
}

function postNotificationEvent(type, title, message, meta = {}) {
  fetch(NOTIFICATION_API, {
    method:"POST",
    credentials:"same-origin",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      action:"record_event",
      eventType:type,
      title,
      message,
      projectId:meta.projectId || "apex-launch",
      actorName:meta.actorName || "",
      actorEmail:meta.actorEmail || "",
      actionUrl:meta.actionUrl || `${location.origin}${location.pathname}#review`,
    }),
  }).catch(() => {});
}

const checkoutPlans = {
  basic_reel: { name: "Captions Only", price: 1500, features: ["Caption timing", "Spelling cleanup", "Brand fonts and colours", "Vertical export"] },
  better_edit: { name: "Clean Edit", price: 2000, features: ["Clean cuts and pacing", "Branded captions", "Audio and colour balance", "1 revision round"] },
  growth_reel: { name: "Social Pro", price: 2500, features: ["Everything in Clean Edit", "B-roll and visual layers", "Transitions and sound design", "2 revision rounds"] },
  premium_motion: { name: "Motion Plus", price: 3500, features: ["Custom motion graphics", "Animated captions", "Advanced sound design", "3 revision rounds"] },
  advanced_reel: { name: "Signature Edit", price: 5000, features: ["Advanced motion and graphics", "Premium colour and sound", "Custom branded system", "Priority handling"] },
  script_hook: { name: "Hook & Idea Script", price: 1000, features: ["Content angle", "Opening hook", "Short-form outline"] },
  script_full: { name: "Full Reel Script", price: 1500, features: ["Hook to CTA", "Scene-by-scene flow", "Platform-ready copy"] },
  script_research: { name: "Research-led Script", price: 2000, features: ["Research-backed angle", "Retention structure", "Brand voice refinement"] },
  podcast_30: { name: "Podcast Edit · 30 minutes", price: 5000, features: ["Clean multi-camera edit", "Audio cleanup", "Simple branded delivery"] },
  podcast_45: { name: "Podcast Edit · 45 minutes", price: 7500, features: ["Everything in 30 minutes", "Chapter-ready structure", "Polished delivery"] },
  podcast_60: { name: "Podcast Edit · 60 minutes", price: 10000, features: ["Full episode edit", "Audio cleanup", "Branded final master"] }
};

function serviceCard(id, title, price, copy, featured = false) {
  return `<article class="service-card ${featured ? "featured" : ""}"><div><h3>${title}</h3><p>${copy}</p></div><strong>₹${price.toLocaleString("en-IN")}</strong><small>per project</small><button class="pill ${featured ? "pill-hot" : "pill-dark"}" data-service-plan="${id}">Pay securely →</button></article>`;
}

export function renderMarketing(root, data, actions) {
  root.className = "marketing-app";
  root.innerHTML = `
    <header class="site-nav">
      <a class="brand" href="#top"><span class="brand-mark">CX</span><span>${data.brand}</span></a>
      <nav aria-label="Main navigation"><a href="#workflow">How it works</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></nav>
      <div class="nav-actions"><button class="text-button" data-action="login">Login</button><a class="pill pill-hot" href="#pricing">Start here <span>↓</span></a></div>
    </header>
    <main id="top">
      <section class="hero section-shell">
        <div class="hero-glow"></div>
        <div class="hero-content">
          <p class="eyebrow"><span></span>${data.hero.eyebrow}</p>
          <h1>${data.hero.title.map((line, i) => `<span class="${i === 1 ? "accent" : ""}">${line}</span>`).join("")}</h1>
          <p class="hero-copy">${data.hero.copy}</p>
          <div class="hero-actions"><a class="pill pill-hot pill-large" href="#pricing">${data.hero.primary} ↓</a><button class="pill pill-dark pill-large" data-action="workspace">${data.hero.secondary} →</button></div>
          <div class="trust-row"><span class="faces"><b>AR</b><b>MK</b><b>RS</b></span><span><strong>Built for fast feedback</strong><small>No scattered links. No lost revisions.</small></span></div>
        </div>
        <div class="hero-product" aria-label="Content X client workspace preview">
          <div class="product-window">
            <div class="window-bar"><span class="brand-mark mini">CX</span><span>Apex Fitness Launch</span><div><i></i><i></i><i></i></div></div>
            <div class="product-body">
              <aside><span>⌂</span><span class="active">▱</span><span>◌</span><span>✓</span></aside>
              <div class="video-preview"><video src="videos/landscape1.mp4" muted loop playsinline autoplay preload="auto" data-preview-autoplay></video><span class="version-chip">V3 · Ready for review</span></div>
              <div class="comment-preview"><strong>Comments <span>3</span></strong><article><b>MK</b><p><span>00:04</span> Could we start with this shot?</p></article><article><b>AR</b><p><span>00:12</span> Updated in the next version.</p></article><div class="fake-input">Add feedback at 00:18…</div></div>
            </div>
          </div>
          <div class="float-card float-card-a"><span class="success-dot">✓</span><div><strong>Version approved</strong><small>Apex launch reel · V2</small></div></div>
          <div class="float-card float-card-b"><b>V3</b><div><strong>New version ready</strong><small>Just now</small></div></div>
        </div>
      </section>
      <section class="stat-strip section-shell">${data.stats.map(s => `<div><strong>${s.value}</strong><span>${s.label}</span></div>`).join("")}<p>Trusted by creators, coaches<br>and growing brands.</p></section>
      <section id="work" class="section-shell block-section">
        <div class="section-heading"><p class="eyebrow"><span></span>Selected work</p><h2>Edits designed to <em>hold attention.</em></h2><p>Every cut has a job: earn the next second, make the message clear, and leave the brand looking premium.</p></div>
        <div class="work-grid">${data.cases.map((item, i) => `<article class="work-card"><div class="work-media"><video src="${item.src}" muted loop playsinline autoplay preload="auto" data-preview-autoplay></video><span>0${i + 1}</span></div><div><p>${item.label}</p><h3>${item.title}</h3><small>${item.copy}</small></div></article>`).join("")}</div>
      </section>
      <section id="workflow" class="workflow-section block-section"><div class="section-shell"><div class="section-heading split"><div><p class="eyebrow"><span></span>Your workflow</p><h2>From raw footage to <em>approved.</em></h2></div><p>Everything your project needs lives in one place—so feedback stays clear and delivery keeps moving.</p></div><div class="workflow-grid">${data.workflow.map(w => `<article class="workflow-step workflow-step-${w.step}"><span class="workflow-step-number">${w.step}</span><div class="step-icon">${["↑","✦","◌","✓"][Number(w.step)-1]}</div><h3>${w.title}</h3><p>${w.copy}</p></article>`).join("")}</div><div class="feature-banner"><div><span class="live-dot"></span><small>THE CONTENT X WORKSPACE</small><h3>Review video without the back-and-forth.</h3><p>Click any moment to add a timestamped note. Compare versions, resolve feedback and approve the final cut—all in your browser.</p><button class="pill pill-hot" data-action="workspace">Open interactive demo →</button></div><div class="review-mini"><div class="review-video"><video src="videos/video3.mp4" muted loop playsinline autoplay preload="auto" data-preview-autoplay></video><span>00:12</span></div><div class="review-note"><b>MK</b><p><strong>00:12</strong> Can we make this transition faster?</p><button>Reply</button></div></div></div></div></section>
      <section id="pricing" class="section-shell block-section service-pricing"><div class="section-heading centered"><p class="eyebrow"><span></span>Clear pricing</p><h2>Choose one service. Add only what you <em>need.</em></h2><p>Revision rounds follow the selected package. One-off reel pricing includes a 20% flexibility rate. Need ongoing support? Ask us for a monthly proposal.</p></div><div class="service-groups"><section class="service-group"><div class="service-group-head"><span>01</span><div><p>Short-form editing</p><h3>Reels that feel sharp, clear and native to the feed.</h3></div></div><div class="service-card-grid">${serviceCard("basic_reel", "Basic Reel", 1500, "Clean edits, captions and a polished social-ready finish.")}${serviceCard("growth_reel", "Growth Reel", 2500, "More B-roll, stronger pacing and richer sound design.", true)}${serviceCard("premium_motion", "Premium Motion Reel", 3500, "Motion-led editing for premium brand content.")}${serviceCard("advanced_reel", "Advanced Reel", 5000, "A high-concept reel with custom graphics and advanced motion.")}</div></section><section class="service-group"><div class="service-group-head"><span>02</span><div><p>Scriptwriting</p><h3>Start with a clearer idea, hook and story flow.</h3></div></div><div class="service-card-grid three-up">${serviceCard("script_hook", "Hook & Idea", 1000, "A focused content angle and opening hook.")}${serviceCard("script_full", "Full Reel Script", 1500, "A complete script from hook to CTA.", true)}${serviceCard("script_research", "Research-led Script", 2000, "Research, structure and brand voice refinement.")}</div></section><section class="service-group"><div class="service-group-head"><span>03</span><div><p>Podcast editing</p><h3>Long-form conversations, professionally cleaned and structured.</h3></div></div><div class="service-card-grid three-up">${serviceCard("podcast_30", "30 minutes", 5000, "Clean edit, audio cleanup and branded delivery.")}${serviceCard("podcast_45", "45 minutes", 7500, "A polished episode with chapter-ready structure.", true)}${serviceCard("podcast_60", "60 minutes", 10000, "Full episode edit and final branded master.")}</div></section></div><aside class="service-addons"><div><p class="eyebrow"><span></span>Optional support</p><h3>Social media management</h3><p>Content planning, posting, scheduling, comment management and monthly reporting—built around your publishing rhythm.</p></div><button class="pill pill-hot" type="button" data-support-open>Ask for a monthly plan →</button></aside><p class="pricing-note">Need a cover, extra revision, rush delivery, posting or another add-on? Choose a package first, then add it inside the website checkout flow.</p></section>
      <section id="faq" class="section-shell faq-section block-section"><div><p class="eyebrow"><span></span>Questions</p><h2>Before we<br><em>get started.</em></h2><p>Still unsure? Ask on the website first and we’ll recommend the right package before moving to WhatsApp.</p><button class="pill pill-dark" type="button" data-support-open>Ask a question →</button></div><div class="faq-list">${data.faqs.map((f,i) => `<details ${i===0?"open":""}><summary>${f[0]}<span>+</span></summary><p>${f[1]}</p></details>`).join("")}</div></section>
      <section class="cta-section"><div class="section-shell"><p class="eyebrow light"><span></span>Ready when you are</p><h2>Let’s make your next reel <em>impossible to skip.</em></h2><p>Choose a package on the website, pay securely, then share the brief and files inside your workspace.</p><div><a class="pill pill-light pill-large" href="#pricing">Start on website ↓</a><button class="pill pill-outline pill-large" type="button" data-support-open>Talk to support</button></div></div></section>
    </main>
    <button class="support-fab" type="button" data-support-open>?</button>
    <aside class="support-panel" data-support-panel hidden><button type="button" data-support-close>×</button><p class="eyebrow"><span></span>Content X support</p><h3>Ask first, then start properly.</h3><p>Use the website for packages, payment, brief and uploads. WhatsApp stays available only when you need quick human help.</p><div><button class="pill pill-hot" type="button" data-support-pricing>Choose package</button><a class="pill pill-dark" href="${data.whatsapp}" target="_blank" rel="noreferrer">WhatsApp help ↗</a><a class="pill pill-outline" href="mailto:${data.email}">Email team</a></div></aside>
    <footer class="site-footer"><div class="section-shell"><div><a class="brand" href="#top"><span class="brand-mark">CX</span><span>${data.brand}</span></a><p>Premium video editing and a better way to review it.</p></div><div><strong>Explore</strong><a href="#workflow">How it works</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></div><div><strong>Connect</strong><button data-support-open>Support</button><a href="mailto:${data.email}">Email</a><button data-action="login">Login</button></div></div><p class="copyright">© 2026 Content X. Built for better content.</p></footer>
  `;

  const pricingFallback = root.querySelector("#pricing");
  if (pricingFallback) pricingFallback.innerHTML = `<div class="section-heading centered"><p class="eyebrow"><span></span>Simple pricing</p><h2>Choose Video or Podcast. Add scripts only when you <em>need them.</em></h2><p>Five clear video packages start at ₹1,500. The interactive package builder is loading now.</p></div>`;

  root.querySelectorAll('[data-action="workspace"]').forEach(btn => btn.addEventListener("click", actions.openDashboard));
  root.querySelectorAll('[data-action="login"]').forEach(btn => btn.addEventListener("click", actions.openAccess));
  root.querySelectorAll("[data-support-open]").forEach(btn => btn.addEventListener("click", () => root.querySelector("[data-support-panel]").hidden = false));
  root.querySelector("[data-support-close]")?.addEventListener("click", () => root.querySelector("[data-support-panel]").hidden = true);
  root.querySelector("[data-support-pricing]")?.addEventListener("click", () => { root.querySelector("[data-support-panel]").hidden = true; root.querySelector("#pricing")?.scrollIntoView({ behavior:"smooth" }); });
  root.querySelectorAll("[data-service-plan]").forEach(button => button.addEventListener("click", () => {
    const plan = checkoutPlans[button.dataset.servicePlan];
    if (plan) actions.openCheckout({ id: button.dataset.servicePlan, ...plan, unit: "project", badge: "Secure one-time payment" });
  }));
  startMutedPreviewVideos(root);
}

const cxIcon = (name, label = "") => {
  const paths = {
    home:'<path d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-5v-6h-5v6h-5A1.5 1.5 0 0 1 3 19.5z"/>',
    projects:'<path d="M3 6.5h7l2 2h9v10.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 10h18"/>',
    review:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    bell:'<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M9.5 21h5"/>',
    grid:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    share:'<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 1 1 3.5 2.1c-.9.5-1.3 1-1.3 2M12 17h.01"/>'
  };
  return `<svg class="cx-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name] || paths.help}</svg>${label ? `<span>${label}</span>` : ""}`;
};

function dashboardShell(content, active = "projects") {
  return `<div class="dashboard-shell"><aside class="cx-app-rail" aria-label="Global navigation"><a class="cx-rail-brand dash-brand" href="#" aria-label="Content X home">CX</a><nav><button class="${active === "home" ? "active" : ""}" aria-label="Home">${cxIcon("home")}</button><button class="${active === "projects" ? "active" : ""}" aria-label="Projects">${cxIcon("projects")}</button><button aria-label="Review">${cxIcon("review")}</button><button aria-label="Search">${cxIcon("search")}</button></nav><div class="cx-rail-bottom"><button aria-label="Help">${cxIcon("help")}</button><button class="cx-rail-avatar" aria-label="Account">MK</button></div></aside><aside class="dash-sidebar"><div class="dash-workspace"><strong>Content X</strong><small>Apex Fitness</small><button aria-label="Workspace menu">•••</button></div><nav><small>WORKSPACE</small><button class="${active === "home" ? "active" : ""}" data-dash="home">${cxIcon("home","Home")}</button><button class="${active === "projects" ? "active" : ""}" data-dash="projects">${cxIcon("projects","Projects")}<b>3</b></button><button data-dash="reviews">${cxIcon("review","Needs review")}<b>2</b></button><small>LIBRARY</small><button data-dash="approved">${cxIcon("grid","All assets")}</button><button data-dash="assets">${cxIcon("share","Share links")}</button></nav><div class="storage"><div><span>Storage</span><small>6.4 / 20 GB</small></div><i><em></em></i><button>Manage plan</button></div></aside><main class="dash-main"><div class="cx-product-topbar"><label>${cxIcon("search")}<input type="search" placeholder="Search Content X" aria-label="Search Content X"></label><button aria-label="Notifications">${cxIcon("bell")}</button><button aria-label="Help">${cxIcon("help")}</button></div>${content}</main></div>`;
}

export function renderDashboard(root, actions, options = {}) {
  root.className = "dashboard-app";
  const projects = JSON.parse(localStorage.getItem("cx_projects") || "null") || demoProjects;
  const projectCards = projects.map((p,index) => `<article class="project-card" data-project="${p.id}" style="--project:${p.color};--art-index:${index}"><div class="project-card-top"><div class="cx-project-poster"><i></i><i></i><span>${p.client.slice(0,2).toUpperCase()}</span></div><span class="cx-lock" aria-label="Private project">⌁</span><span class="card-hover-arrow">Open →</span></div><div class="cx-card-copy"><h3>${p.name}</h3><p>${p.client}</p><small>Updated ${index ? `${index + 1} days ago` : "12 minutes ago"}</small></div><footer><span class="status ${p.status.toLowerCase().replace(" ", "-")}"><i></i>${p.status}</span><span>${p.files} assets</span><button aria-label="Project options">•••</button></footer></article>`).join("");
  const demoChip = options.demo ? `<button class="cx-demo-chip" type="button" data-demo-login>Demo workspace · Sign in</button>` : "";
  root.innerHTML = dashboardShell(`<header class="dash-header"><div><p>Workspace</p><h1>Projects</h1></div><div>${demoChip}<button class="pill pill-hot" data-action="new-project">${cxIcon("plus")} New project</button></div></header><section class="project-section"><div class="dash-section-head"><div><h2>All projects</h2><p>${projects.length} active projects</p></div><div class="cx-project-actions"><button class="cx-filter active">Active</button><button class="cx-filter">All</button><button class="cx-sort">Name ⌄</button><div class="view-switch"><button class="active" aria-label="Grid view">${cxIcon("grid")}</button><button aria-label="List view">${cxIcon("list")}</button></div></div></div><div class="project-grid">${projectCards}<button class="new-project-card" data-action="new-project">${cxIcon("plus")}<strong>New project</strong><small>Start a private production space</small></button></div></section>`, "projects");
  root.querySelectorAll("[data-demo-login]").forEach(button => button.addEventListener("click", actions.openAccess));
  bindDashboard(root, actions);
}

function bindDashboard(root, actions) {
  root.querySelectorAll("[data-project]").forEach(el => el.addEventListener("click", actions.openProject));
  root.querySelectorAll('[data-action="new-project"]').forEach(el => el.addEventListener("click", () => openProjectModal(root, actions)));
  root.querySelector(".dash-brand").addEventListener("click", e => { e.preventDefault(); actions.openMarketing(); });
  root.querySelector('.cx-app-rail button[aria-label="Home"]')?.addEventListener("click", actions.openMarketing);
  root.querySelector('.cx-app-rail button[aria-label="Projects"]')?.addEventListener("click", actions.openDashboard);
  root.querySelector('.cx-app-rail button[aria-label="Review"]')?.addEventListener("click", actions.openReview);
  root.querySelector('.cx-app-rail button[aria-label="Search"]')?.addEventListener("click", () => root.querySelector('.cx-product-topbar input[type="search"]')?.focus());
  root.querySelector('.cx-app-rail button[aria-label="Account"]')?.addEventListener("click", actions.openAccess);
  root.querySelector('.cx-product-topbar button[aria-label="Notifications"]')?.addEventListener("click", () => root.querySelector('[data-dash="notifications"]')?.click());
  root.querySelectorAll('.cx-app-rail button[aria-label="Help"], .cx-product-topbar button[aria-label="Help"]').forEach(button => button.addEventListener("click", () => {
    actions.openMarketing();
    setTimeout(() => document.querySelector("#contact-form")?.scrollIntoView({ behavior:"smooth", block:"start" }), 0);
  }));
  root.querySelector('[data-dash="home"]')?.addEventListener("click", actions.openDashboard);
  root.querySelector('[data-dash="projects"]')?.addEventListener("click", actions.openDashboard);
}

function openProjectModal(root, actions) {
  const modal = document.createElement("div");
  modal.className = "modal-layer";
  modal.innerHTML = `<form class="project-modal"><button type="button" class="modal-close">×</button><p class="eyebrow"><span></span>New workspace</p><h2>Start a project</h2><label>Project name<input name="name" placeholder="e.g. September Reel Series" required></label><label>What are we creating?<select name="type"><option>Short-form video</option><option>Long-form video</option><option>Monthly content package</option><option>Other</option></select></label><label>Project brief<textarea name="brief" placeholder="Goals, platform, references and anything we should know…"></textarea></label><label class="upload-box"><input type="file" multiple><span>↑</span><strong>Drop your footage or browse</strong><small>Video, audio, images, documents</small></label><button class="pill pill-hot" type="submit">Create project →</button></form>`;
  root.append(modal);
  modal.querySelector(".modal-close").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
  modal.querySelector("form").addEventListener("submit", e => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const projects = JSON.parse(localStorage.getItem("cx_projects") || "null") || [...demoProjects];
    projects.unshift({ id: `p${Date.now()}`, name: data.get("name"), client: "Apex Fitness", type: data.get("type"), progress: 0, status: "Briefing", due: "Not set", color: "#3b82f6", files: e.currentTarget.querySelector('input[type="file"]').files.length });
    localStorage.setItem("cx_projects", JSON.stringify(projects));
    modal.remove(); actions.openDashboard();
  });
}

export function renderProject(root, actions) {
  root.className = "dashboard-app";
  root.innerHTML = dashboardShell(`<header class="project-header"><button class="back-button" data-action="back">←</button><div><p>Apex Fitness</p><h1>Apex Fitness Launch</h1></div><span class="status in-review"><i></i>In review</span><div class="project-header-actions"><button class="pill pill-dark">Share ↗</button><button class="pill pill-hot" data-action="upload">↑ Upload files</button></div></header><nav class="project-tabs"><button class="active">Videos <b>6</b></button><button>Assets <b>18</b></button><button>Brief</button><button>Activity</button></nav><section class="project-content"><div class="project-toolbar"><div><button class="pill pill-dark">+ New folder</button><button class="pill pill-dark" data-action="upload">↑ Upload</button></div><label>⌕ <input placeholder="Search files"></label></div><div class="folder-row"><article><span class="folder-icon" style="--project:#ff6b35">▰</span><div><strong>Raw Footage</strong><small>12 files · 3.8 GB</small></div></article><article><span class="folder-icon" style="--project:#8b5cf6">▰</span><div><strong>Brand Assets</strong><small>6 files · 124 MB</small></div></article><article><span class="folder-icon" style="--project:#24b47e">▰</span><div><strong>Final Exports</strong><small>2 files · 286 MB</small></div></article></div><div class="dash-section-head"><div><h2>Videos</h2><p>Click a video to review, comment or approve. Open details for bitrate, FPS, size and access history.</p></div><span>Last updated 12 min ago</span></div><div class="file-table"><div class="file-row head"><span>Name</span><span>Version</span><span>Status</span><span>Updated</span><span>Details</span></div><button class="file-row" data-action="review"><span class="file-name"><i><video src="videos/premium1.mp4" muted loop playsinline autoplay preload="metadata" data-preview-autoplay controlsList="nodownload noplaybackrate noremoteplayback"></video></i><strong>Launch Reel 01<small>1080 × 1920 · 32 sec · 24 FPS</small></strong></span><span>V3</span><span class="status in-review"><i></i>In review</span><span>12 min ago</span><span data-file-detail="Launch Reel 01">Details</span></button><button class="file-row"><span class="file-name"><i><video src="videos/premium2.mp4" muted loop playsinline autoplay preload="metadata" data-preview-autoplay controlsList="nodownload noplaybackrate noremoteplayback"></video></i><strong>Launch Reel 02<small>1080 × 1920 · 28 sec · 30 FPS</small></strong></span><span>V2</span><span class="status editing"><i></i>Changes requested</span><span>Yesterday</span><span data-file-detail="Launch Reel 02">Details</span></button><button class="file-row"><span class="file-name"><i><video src="videos/standard3.mp4" muted loop playsinline autoplay preload="metadata" data-preview-autoplay controlsList="nodownload noplaybackrate noremoteplayback"></video></i><strong>Brand Story Cut<small>1080 × 1920 · 41 sec · 24 FPS</small></strong></span><span>V4</span><span class="status approved"><i></i>Approved</span><span>Aug 1</span><span data-file-detail="Brand Story Cut">Details</span></button></div></section><input class="hidden-upload" type="file" multiple>`);
  startMutedPreviewVideos(root);
  root.querySelector('[data-action="back"]').addEventListener("click", actions.openDashboard);
  root.querySelector('[data-action="review"]').addEventListener("click", actions.openReview);
  const uploadInput = root.querySelector(".hidden-upload");
  root.querySelectorAll('[data-action="upload"]').forEach(btn => btn.addEventListener("click", () => uploadInput.click()));
  const dropTarget = root.querySelector(".project-content");
  const showDropNote = message => {
    const existing = root.querySelector(".dashboard-drop-note");
    existing?.remove();
    const note = document.createElement("div");
    note.className = "dashboard-drop-note";
    note.textContent = message;
    root.append(note);
    setTimeout(() => note.remove(), 2600);
  };
  ["dragenter", "dragover"].forEach(type => dropTarget.addEventListener(type, event => { event.preventDefault(); dropTarget.classList.add("is-dragging"); }));
  ["dragleave", "drop"].forEach(type => dropTarget.addEventListener(type, event => { event.preventDefault(); if (type === "drop" && event.dataTransfer?.files?.length) showDropNote(`${event.dataTransfer.files.length} file${event.dataTransfer.files.length === 1 ? "" : "s"} ready to upload.`); dropTarget.classList.remove("is-dragging"); }));
  root.querySelector(".dash-brand").addEventListener("click", e => { e.preventDefault(); actions.openMarketing(); });
}

export function renderReview(root, actions) {
  root.className = "review-app";
  let comments = JSON.parse(localStorage.getItem("cx_comments") || "null") || [...demoComments];
  const permissions = JSON.parse(localStorage.getItem("cx_comment_permissions") || "null") || { canEditOwn: true, canDeleteOwn: true, canDeleteAll: false, canMarkComplete: true };
  const currentUser = JSON.parse(localStorage.getItem("cx_comment_user") || "null") || { name: "Meera", initials: "MK", role: "client" };
  root.innerHTML = `<aside class="review-global-rail" aria-label="Global navigation"><button class="cx-rail-brand" aria-label="Content X">CX</button><nav><button aria-label="Home">${cxIcon("home")}</button><button class="active" aria-label="Projects">${cxIcon("projects")}</button><button aria-label="Search">${cxIcon("search")}</button></nav><button class="cx-rail-avatar" aria-label="Account">MK</button></aside><header class="review-header"><button class="back-button" data-action="back">←</button><div class="review-breadcrumb"><strong>Apex Fitness Launch</strong><span>/</span><small>Launch Reel 01</small></div><span class="review-position">2 of 5</span><span class="version-select">Version 3⌄</span><div class="review-head-actions"><button class="pill pill-dark">${cxIcon("share")} Share</button><button class="pill pill-dark" data-action="changes">Request changes</button><button class="pill pill-green" data-action="approve">✓ Approve</button></div></header><main class="review-layout"><section class="review-stage"><div class="stage-status"><span class="status in-review"><i></i>Waiting for review</span><span>V3 uploaded 12 minutes ago</span></div><div class="player-wrap"><video src="videos/premium1.mp4" muted autoplay playsinline controlsList="nodownload noplaybackrate noremoteplayback"></video></div><div class="player-controls"><button class="player-play-toggle" data-action="play" aria-label="Pause video"><span>Ⅱ</span><small>Pause</small></button><span class="current-time">00:00</span><input type="range" min="0" max="100" value="0" step="0.1" aria-label="Video timeline"><span class="duration">00:32</span><button>⚙</button><button>⛶</button></div><div class="version-bar"><div><strong>Versions</strong><small>Compare every cut</small></div><button><span>V1</span><small>Jul 29</small></button><button><span>V2</span><small>Aug 1</small></button><button class="active"><span>V3</span><small>Current</small></button><button class="upload-version">+ New version</button></div></section><aside class="comment-panel"><div class="comment-tabs"><button class="active" data-review-panel="comments">Comments <span>${comments.length}</span></button><button data-review-panel="details">Details</button></div><section class="review-comments-view"><div class="comment-head"><div><h2>Feedback</h2><p>Leave precise notes on the exact frame.</p></div></div><div class="comment-filter"><button class="active">Open</button><button>Resolved</button><span></span><button>Newest⌄</button></div><div class="comments"></div><form class="comment-form"><div class="comment-input-row"><b>${currentUser.initials}</b><textarea rows="3" placeholder="Leave feedback at 00:00…"></textarea></div><p class="comment-attachment-preview" data-attachment-preview hidden></p><div class="comment-action-row"><button type="button" data-attach-comment-media>＋ Attach</button><span>At <strong>00:00</strong></span><button class="send-comment" type="submit">Send ↑</button></div><input type="file" accept="image/*,video/*" data-comment-media hidden></form></section><section class="review-details-view" hidden><div><small>ASSET</small><h2>Launch Reel 01</h2><p>Vertical social campaign edit</p></div><dl><div><dt>Format</dt><dd>1080 × 1920</dd></div><div><dt>Duration</dt><dd>00:32</dd></div><div><dt>Frame rate</dt><dd>24 fps</dd></div><div><dt>Version</dt><dd>V3</dd></div><div><dt>Uploaded</dt><dd>12 min ago</dd></div><div><dt>Access</dt><dd>Private</dd></div></dl><button class="pill pill-dark">Download original ↓</button></section></aside></main><div class="toast" role="status"></div>`;
  const video = root.querySelector("video");
  const range = root.querySelector('input[type="range"]');
  const playButtons = root.querySelectorAll('[data-action="play"], .center-play');
  const timeEls = root.querySelectorAll(".current-time, .comment-action-row strong");
  let selectedAttachment = null;
  root.querySelectorAll("[data-review-panel]").forEach(button => button.addEventListener("click", () => {
    const details = button.dataset.reviewPanel === "details";
    root.querySelectorAll("[data-review-panel]").forEach(item => item.classList.toggle("active", item === button));
    root.querySelector(".review-comments-view").hidden = details;
    root.querySelector(".review-details-view").hidden = !details;
  }));
  const format = seconds => `${String(Math.floor(seconds / 60)).padStart(2,"0")}:${String(Math.floor(seconds % 60)).padStart(2,"0")}`;
  const canManageComment = comment => comment.author === currentUser.name || permissions.canDeleteAll;
  const commentActions = comment => {
    const own = comment.author === currentUser.name;
    return `<div class="comment-tools">${permissions.canMarkComplete ? `<button data-complete-comment="${comment.id}">${comment.completed ? "✓ Completed" : "✓ Mark done"}</button>` : ""}${own && permissions.canEditOwn ? `<button data-edit-comment="${comment.id}">Edit</button>` : ""}${canManageComment(comment) && (own ? permissions.canDeleteOwn : permissions.canDeleteAll) ? `<button class="danger" data-delete-comment="${comment.id}">Delete</button>` : ""}</div>`;
  };
  const renderComments = () => {
    root.querySelector(".comments").innerHTML = comments.map(c => `<article class="comment ${c.resolved ? "resolved" : ""} ${c.completed ? "completed" : ""}" data-comment="${c.id}"><div class="comment-avatar">${c.initials}</div><div><header><strong>${c.author}</strong><time>${c.age}${c.edited ? " · edited" : ""}</time></header><button class="timecode" data-time="${c.time}">▶ ${format(c.time)}</button><p>${c.text}</p>${c.completed ? `<span class="comment-complete-badge">Completed by editor</span>` : ""}${c.attachment ? `<div class="comment-media-chip"><span>${c.attachment.type}</span><strong>${c.attachment.name}</strong><small>${c.attachment.quality}</small></div>` : ""}<footer><button data-resolve="${c.id}">${c.resolved ? "↶ Reopen" : "Resolve"}</button><button>Reply</button></footer>${commentActions(c)}</div></article>`).join("");
    root.querySelectorAll(".timecode").forEach(btn => btn.addEventListener("click", () => { video.currentTime = Number(btn.dataset.time); video.play(); }));
    root.querySelectorAll("[data-resolve]").forEach(btn => btn.addEventListener("click", () => { const c = comments.find(x => x.id === Number(btn.dataset.resolve)); c.resolved = !c.resolved; save(); renderComments(); }));
    root.querySelectorAll("[data-complete-comment]").forEach(btn => btn.addEventListener("click", () => { const c = comments.find(x => x.id === Number(btn.dataset.completeComment)); if (!c) return; c.completed = !c.completed; c.completedAt = c.completed ? "Just now" : ""; save(); renderComments(); }));
    root.querySelectorAll("[data-edit-comment]").forEach(btn => btn.addEventListener("click", () => { const c = comments.find(x => x.id === Number(btn.dataset.editComment)); if (!c || c.author !== currentUser.name) return; const next = prompt("Edit your comment:", c.text); if (next === null) return; if (!next.trim()) return; c.text = next.trim(); c.edited = true; save(); renderComments(); }));
    root.querySelectorAll("[data-delete-comment]").forEach(btn => btn.addEventListener("click", () => { const c = comments.find(x => x.id === Number(btn.dataset.deleteComment)); if (!c || !canManageComment(c)) return; if (!confirm("Delete this comment?")) return; comments = comments.filter(item => item.id !== c.id); save(); renderComments(); root.querySelector('[data-review-panel="comments"] span').textContent = comments.length; }));
  };
  const save = () => localStorage.setItem("cx_comments", JSON.stringify(comments));
  playButtons.forEach(btn => btn.addEventListener("click", () => video.paused ? video.play() : video.pause()));
  const setPlayState = playing => playButtons.forEach(b => { b.innerHTML = playing ? "<span>Ⅱ</span><small>Pause</small>" : "<span>▶</span><small>Play</small>"; b.setAttribute("aria-label", playing ? "Pause video" : "Play video"); });
  video.addEventListener("play", () => setPlayState(true));
  video.addEventListener("pause", () => setPlayState(false));
  video.addEventListener("loadedmetadata", () => root.querySelector(".duration").textContent = format(video.duration));
  video.addEventListener("timeupdate", () => { range.value = video.duration ? (video.currentTime / video.duration) * 100 : 0; timeEls.forEach(e => e.textContent = format(video.currentTime)); });
  range.addEventListener("input", () => { if (video.duration) video.currentTime = (range.value / 100) * video.duration; });
  root.querySelector("[data-attach-comment-media]").addEventListener("click", () => root.querySelector("[data-comment-media]").click());
  root.querySelector("[data-comment-media]").addEventListener("change", event => { const file = event.target.files?.[0]; if (!file) return; selectedAttachment = { name:file.name, type:file.type.startsWith("video") ? "Video reference" : "Image reference", quality:"Original-quality upload allowed" }; const preview = root.querySelector("[data-attachment-preview]"); preview.hidden = false; preview.textContent = `${selectedAttachment.type}: ${selectedAttachment.name}`; });
  root.querySelector(".comment-form").addEventListener("submit", e => { e.preventDefault(); const field = e.currentTarget.querySelector("textarea"); if (!field.value.trim() && !selectedAttachment) return; const feedback = field.value.trim() || "Attached a visual reference."; comments.push({ id: Date.now(), author: currentUser.name, initials: currentUser.initials, time: video.currentTime, text: feedback, attachment:selectedAttachment, age: "Just now", resolved: false, completed: false, edited: false }); postNotificationEvent("comment", "New review comment", `${feedback} · ${format(video.currentTime)}`, { actorName:currentUser.name }); field.value = ""; selectedAttachment = null; root.querySelector("[data-attachment-preview]").hidden = true; root.querySelector("[data-comment-media]").value = ""; save(); renderComments(); root.querySelector('[data-review-panel="comments"] span').textContent = comments.length; });
  const toast = message => { const t = root.querySelector(".toast"); t.textContent = message; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 2400); };
  const timelinePreview = document.createElement("div");
  timelinePreview.className = "timeline-hover-preview";
  timelinePreview.innerHTML = `<video muted playsinline preload="metadata"></video><span>00:00</span>`;
  root.querySelector(".player-controls").append(timelinePreview);
  const previewVideo = timelinePreview.querySelector("video");
  const showTimelinePreview = event => {
    if (!video.duration) return;
    const rect = range.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const seconds = ratio * video.duration;
    const src = video.currentSrc || video.src;
    if (previewVideo.src !== src) previewVideo.src = src;
    try { previewVideo.currentTime = Math.min(seconds, Math.max(0, video.duration - 0.05)); } catch {}
    timelinePreview.querySelector("span").textContent = format(seconds);
    timelinePreview.style.left = `${Math.max(44, Math.min(rect.left + ratio * rect.width - root.getBoundingClientRect().left, root.clientWidth - 44))}px`;
    timelinePreview.classList.add("show");
  };
  range.addEventListener("pointermove", showTimelinePreview);
  range.addEventListener("pointerenter", showTimelinePreview);
  range.addEventListener("pointerleave", () => timelinePreview.classList.remove("show"));
  const versionDropTargets = [root.querySelector(".player-wrap"), root.querySelector(".version-bar")].filter(Boolean);
  versionDropTargets.forEach(zone => {
    ["dragenter", "dragover"].forEach(type => zone.addEventListener(type, event => { event.preventDefault(); zone.classList.add("is-version-drop"); }));
    ["dragleave", "drop"].forEach(type => zone.addEventListener(type, event => {
      event.preventDefault();
      zone.classList.remove("is-version-drop");
      if (type === "drop" && event.dataTransfer?.files?.length) toast(`${event.dataTransfer.files.length} file${event.dataTransfer.files.length === 1 ? "" : "s"} ready as the next version.`);
    }));
  });
  root.querySelector('[data-action="approve"]').addEventListener("click", () => { postNotificationEvent("approval", "Version approved", "Launch Reel 01 · Version 3 was approved.", { actorName:currentUser.name }); toast("✓ Version 3 approved. The editor has been notified."); });
  root.querySelector('[data-action="changes"]').addEventListener("click", () => { postNotificationEvent("feedback", "Changes requested", "Open feedback for Launch Reel 01 was sent to the editor.", { actorName:currentUser.name }); toast("Changes requested. Open comments were sent to the editor."); });
  root.querySelector('[data-action="back"]').addEventListener("click", actions.openProject);
  renderComments();
}
