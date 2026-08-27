import { demoComments, demoProjects } from "./data.js";

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
      <div class="nav-actions"><button class="text-button" data-action="login">Client login</button><a class="pill pill-hot" href="#pricing">Start here <span>↓</span></a></div>
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
              <div class="video-preview"><video src="videos/landscape1.mp4" muted loop playsinline autoplay></video><span class="version-chip">V3 · Ready for review</span><div class="fake-controls"><b>▶</b><i><em></em></i><small>00:18 / 00:32</small></div></div>
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
        <div class="work-grid">${data.cases.map((item, i) => `<article class="work-card"><div class="work-media"><video src="${item.src}" muted loop playsinline preload="metadata"></video><button class="play-work" aria-label="Play ${item.title}">▶</button><span>0${i + 1}</span></div><div><p>${item.label}</p><h3>${item.title}</h3><small>${item.copy}</small></div></article>`).join("")}</div>
      </section>
      <section id="workflow" class="workflow-section block-section"><div class="section-shell"><div class="section-heading split"><div><p class="eyebrow"><span></span>Your workflow</p><h2>From raw footage to <em>approved.</em></h2></div><p>Everything your project needs lives in one place—so feedback stays clear and delivery keeps moving.</p></div><div class="workflow-grid">${data.workflow.map(w => `<article><span>${w.step}</span><div class="step-icon">${["↑","✦","◌","✓"][Number(w.step)-1]}</div><h3>${w.title}</h3><p>${w.copy}</p></article>`).join("")}</div><div class="feature-banner"><div><span class="live-dot"></span><small>THE CONTENT X WORKSPACE</small><h3>Review video without the back-and-forth.</h3><p>Click any moment to add a timestamped note. Compare versions, resolve feedback and approve the final cut—all in your browser.</p><button class="pill pill-light" data-action="workspace">Open interactive demo →</button></div><div class="review-mini"><div class="review-video"><video src="videos/video3.mp4" muted loop playsinline autoplay></video><span>00:12</span></div><div class="review-note"><b>MK</b><p><strong>00:12</strong> Can we make this transition faster?</p><button>Reply</button></div></div></div></div></section>
      <section id="pricing" class="section-shell block-section service-pricing"><div class="section-heading centered"><p class="eyebrow"><span></span>Clear pricing</p><h2>Choose one service. Add only what you <em>need.</em></h2><p>Every edit includes two revision rounds. One-off reel pricing includes a 20% flexibility rate. Need ongoing support? Ask us for a monthly proposal.</p></div><div class="service-groups"><section class="service-group"><div class="service-group-head"><span>01</span><div><p>Short-form editing</p><h3>Reels that feel sharp, clear and native to the feed.</h3></div></div><div class="service-card-grid">${serviceCard("basic_reel", "Basic Reel", 1500, "Clean edits, captions and a polished social-ready finish.")}${serviceCard("growth_reel", "Growth Reel", 2500, "More B-roll, stronger pacing and richer sound design.", true)}${serviceCard("premium_motion", "Premium Motion Reel", 3500, "Motion-led editing for premium brand content.")}${serviceCard("advanced_reel", "Advanced Reel", 5000, "A high-concept reel with custom graphics and advanced motion.")}</div></section><section class="service-group"><div class="service-group-head"><span>02</span><div><p>Scriptwriting</p><h3>Start with a clearer idea, hook and story flow.</h3></div></div><div class="service-card-grid three-up">${serviceCard("script_hook", "Hook & Idea", 1000, "A focused content angle and opening hook.")}${serviceCard("script_full", "Full Reel Script", 1500, "A complete script from hook to CTA.", true)}${serviceCard("script_research", "Research-led Script", 2000, "Research, structure and brand voice refinement.")}</div></section><section class="service-group"><div class="service-group-head"><span>03</span><div><p>Podcast editing</p><h3>Long-form conversations, professionally cleaned and structured.</h3></div></div><div class="service-card-grid three-up">${serviceCard("podcast_30", "30 minutes", 5000, "Clean edit, audio cleanup and branded delivery.")}${serviceCard("podcast_45", "45 minutes", 7500, "A polished episode with chapter-ready structure.", true)}${serviceCard("podcast_60", "60 minutes", 10000, "Full episode edit and final branded master.")}</div></section></div><aside class="service-addons"><div><p class="eyebrow"><span></span>Optional support</p><h3>Social media management</h3><p>Content planning, posting, scheduling, comment management and monthly reporting—built around your publishing rhythm.</p></div><button class="pill pill-hot" type="button" data-support-open>Ask for a monthly plan →</button></aside><p class="pricing-note">Need a cover, extra revision, rush delivery, posting or another add-on? Choose a package first, then add it inside the website checkout flow.</p></section>
      <section id="faq" class="section-shell faq-section block-section"><div><p class="eyebrow"><span></span>Questions</p><h2>Before we<br><em>get started.</em></h2><p>Still unsure? Ask on the website first and we’ll recommend the right package before moving to WhatsApp.</p><button class="pill pill-dark" type="button" data-support-open>Ask a question →</button></div><div class="faq-list">${data.faqs.map((f,i) => `<details ${i===0?"open":""}><summary>${f[0]}<span>+</span></summary><p>${f[1]}</p></details>`).join("")}</div></section>
      <section class="cta-section"><div class="section-shell"><p class="eyebrow light"><span></span>Ready when you are</p><h2>Let’s make your next reel <em>impossible to skip.</em></h2><p>Choose a package on the website, pay securely, then share the brief and files inside your workspace.</p><div><a class="pill pill-light pill-large" href="#pricing">Start on website ↓</a><button class="pill pill-outline pill-large" type="button" data-support-open>Talk to support</button></div></div></section>
    </main>
    <button class="support-fab" type="button" data-support-open>?</button>
    <aside class="support-panel" data-support-panel hidden><button type="button" data-support-close>×</button><p class="eyebrow"><span></span>Content X support</p><h3>Ask first, then start properly.</h3><p>Use the website for packages, payment, brief and uploads. WhatsApp stays available only when you need quick human help.</p><div><button class="pill pill-hot" type="button" data-support-pricing>Choose package</button><a class="pill pill-dark" href="${data.whatsapp}" target="_blank" rel="noreferrer">WhatsApp help ↗</a><a class="pill pill-outline" href="mailto:${data.email}">Email team</a></div></aside>
    <footer class="site-footer"><div class="section-shell"><div><a class="brand" href="#top"><span class="brand-mark">CX</span><span>${data.brand}</span></a><p>Premium video editing and a better way to review it.</p></div><div><strong>Explore</strong><a href="#workflow">How it works</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></div><div><strong>Connect</strong><button data-support-open>Support</button><a href="mailto:${data.email}">Email</a><button data-action="login">Client login</button></div></div><p class="copyright">© 2026 Content X. Built for better content.</p></footer>
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
  root.querySelectorAll(".work-card").forEach(card => {
    const video = card.querySelector("video");
    const button = card.querySelector("button");
    const toggle = () => { if (video.paused) { video.play(); button.textContent = "Ⅱ"; } else { video.pause(); button.textContent = "▶"; } };
    button.addEventListener("click", toggle);
  });
}

function dashboardShell(content, active = "projects") {
  return `<div class="dashboard-shell"><aside class="dash-sidebar"><a class="brand dash-brand" href="#"><span class="brand-mark">CX</span><span>Content X<small>Client workspace</small></span></a><nav><button class="${active === "home" ? "active" : ""}" data-dash="home"><span>⌂</span>Overview</button><button class="${active === "projects" ? "active" : ""}" data-dash="projects"><span>▱</span>Projects <b>3</b></button><button data-dash="reviews"><span>◌</span>Needs review <b>2</b></button><button data-dash="approved"><span>✓</span>Approved</button><button data-dash="assets"><span>◇</span>Shared assets</button></nav><div class="storage"><div><span>Storage</span><small>6.4 GB of 20 GB</small></div><i><em></em></i><button>Upgrade storage</button></div><div class="dash-user"><b>MK</b><span>Meera Kapoor<small>Apex Fitness</small></span><button>•••</button></div></aside><main class="dash-main">${content}</main></div>`;
}

export function renderDashboard(root, actions) {
  root.className = "dashboard-app";
  const projects = JSON.parse(localStorage.getItem("cx_projects") || "null") || demoProjects;
  const projectCards = projects.map(p => `<article class="project-card" data-project="${p.id}"><div class="project-card-top"><span class="folder-icon" style="--project:${p.color}">▰</span><button>•••</button></div><p>${p.client}</p><h3>${p.name}</h3><small>${p.type}</small><div class="project-meta"><span class="status ${p.status.toLowerCase().replace(" ", "-")}"><i></i>${p.status}</span><span>${p.files} files</span></div><div class="progress-row"><i><em style="width:${p.progress}%;--project:${p.color}"></em></i><span>${p.progress}%</span></div><footer><span>Due ${p.due}</span><b>MK</b></footer></article>`).join("");
  root.innerHTML = dashboardShell(`<header class="dash-header"><div><p>Client workspace</p><h1>Good afternoon, Meera.</h1></div><div><button class="icon-button">⌕</button><button class="icon-button">◦<i></i></button><button class="pill pill-hot" data-action="new-project">+ New project</button></div></header><section class="dashboard-help-strip"><article><span>1</span><strong>Upload files</strong><small>Add footage, logos and references.</small></article><article><span>2</span><strong>Review edits</strong><small>Click a project and comment on the exact time.</small></article><article><span>3</span><strong>Approve delivery</strong><small>Approve, request changes or download final files.</small></article></section><section class="dash-summary"><article><span class="summary-icon orange">▱</span><div><strong>${projects.length}</strong><small>Active projects</small></div><em>+1 this month</em></article><article><span class="summary-icon violet">◌</span><div><strong>2</strong><small>Awaiting review</small></div><em>Needs attention</em></article><article><span class="summary-icon green">✓</span><div><strong>18</strong><small>Videos approved</small></div><em>All time</em></article></section><section class="project-section"><div class="dash-section-head"><div><h2>Your projects</h2><p>Manage footage, review edits and download final files.</p></div><div class="view-switch"><button class="active">▦</button><button>☷</button></div></div><div class="project-grid">${projectCards}<button class="new-project-card" data-action="new-project"><span>+</span><strong>Start a new project</strong><small>Create a workspace for your next video.</small></button></div></section><section class="recent-section"><div class="dash-section-head"><div><h2>Recent activity</h2><p>The latest updates across your projects.</p></div><button>View all →</button></div><div class="activity-list"><article><span class="activity-icon violet">↑</span><p><strong>Version 3 uploaded</strong><small>Apex Fitness Launch · Launch Reel 01</small></p><time>12 min ago</time></article><article><span class="activity-icon orange">◌</span><p><strong>Abhinav replied to your comment</strong><small>Founder Story Series · Episode 02</small></p><time>1 hr ago</time></article><article><span class="activity-icon green">✓</span><p><strong>You approved Product Demo V4</strong><small>Product Walkthrough</small></p><time>Yesterday</time></article></div></section>`, "projects");
  bindDashboard(root, actions);
}

function bindDashboard(root, actions) {
  root.querySelectorAll('[data-project="apex"]').forEach(el => el.addEventListener("click", actions.openProject));
  root.querySelectorAll('[data-action="new-project"]').forEach(el => el.addEventListener("click", () => openProjectModal(root, actions)));
  root.querySelector(".dash-brand").addEventListener("click", e => { e.preventDefault(); actions.openMarketing(); });
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
  root.innerHTML = dashboardShell(`<header class="project-header"><button class="back-button" data-action="back">←</button><div><p>Apex Fitness</p><h1>Apex Fitness Launch</h1></div><span class="status in-review"><i></i>In review</span><div class="project-header-actions"><button class="pill pill-dark">Share ↗</button><button class="pill pill-hot" data-action="upload">↑ Upload files</button></div></header><nav class="project-tabs"><button class="active">Videos <b>6</b></button><button>Assets <b>18</b></button><button>Brief</button><button>Activity</button></nav><section class="project-content"><div class="project-toolbar"><div><button class="pill pill-dark">+ New folder</button><button class="pill pill-dark" data-action="upload">↑ Upload</button></div><label>⌕ <input placeholder="Search files"></label></div><div class="folder-row"><article><span class="folder-icon" style="--project:#ff6b35">▰</span><div><strong>Raw Footage</strong><small>12 files · 3.8 GB</small></div><button>•••</button></article><article><span class="folder-icon" style="--project:#8b5cf6">▰</span><div><strong>Brand Assets</strong><small>6 files · 124 MB</small></div><button>•••</button></article><article><span class="folder-icon" style="--project:#24b47e">▰</span><div><strong>Final Exports</strong><small>2 files · 286 MB</small></div><button>•••</button></article></div><div class="dash-section-head"><div><h2>Videos</h2><p>Click a video to review, comment or approve. Open details for bitrate, FPS, size and access history.</p></div><span>Last updated 12 min ago</span></div><div class="file-table"><div class="file-row head"><span>Name</span><span>Version</span><span>Status</span><span>Updated</span><span>Details</span></div><button class="file-row" data-action="review"><span class="file-name"><i><video src="videos/premium1.mp4" muted></video><b>▶</b></i><strong>Launch Reel 01<small>1080 × 1920 · 32 sec · 24 FPS</small></strong></span><span>V3</span><span class="status in-review"><i></i>In review</span><span>12 min ago</span><span data-file-detail="Launch Reel 01">Details</span></button><button class="file-row"><span class="file-name"><i><video src="videos/premium2.mp4" muted></video><b>▶</b></i><strong>Launch Reel 02<small>1080 × 1920 · 28 sec · 30 FPS</small></strong></span><span>V2</span><span class="status editing"><i></i>Changes requested</span><span>Yesterday</span><span data-file-detail="Launch Reel 02">Details</span></button><button class="file-row"><span class="file-name"><i><video src="videos/standard3.mp4" muted></video><b>▶</b></i><strong>Brand Story Cut<small>1080 × 1920 · 41 sec · 24 FPS</small></strong></span><span>V4</span><span class="status approved"><i></i>Approved</span><span>Aug 1</span><span data-file-detail="Brand Story Cut">Details</span></button></div></section><input class="hidden-upload" type="file" multiple>`);
  root.querySelector('[data-action="back"]').addEventListener("click", actions.openDashboard);
  root.querySelector('[data-action="review"]').addEventListener("click", actions.openReview);
  root.querySelectorAll('[data-action="upload"]').forEach(btn => btn.addEventListener("click", () => root.querySelector(".hidden-upload").click()));
  root.querySelector(".dash-brand").addEventListener("click", e => { e.preventDefault(); actions.openMarketing(); });
}

export function renderReview(root, actions) {
  root.className = "review-app";
  let comments = JSON.parse(localStorage.getItem("cx_comments") || "null") || [...demoComments];
  root.innerHTML = `<header class="review-header"><button class="back-button" data-action="back">←</button><a class="brand" href="#"><span class="brand-mark">CX</span></a><div><strong>Launch Reel 01</strong><small>Apex Fitness Launch</small></div><span class="version-select">Version 3⌄</span><div class="review-head-actions"><button class="pill pill-dark">Share ↗</button><button class="pill pill-dark" data-action="changes">Request changes</button><button class="pill pill-green" data-action="approve">✓ Approve</button></div></header><main class="review-layout"><section class="review-stage"><div class="stage-status"><span class="status in-review"><i></i>Waiting for review</span><span>V3 uploaded 12 minutes ago</span></div><div class="player-wrap"><video src="videos/premium1.mp4" playsinline></video><button class="center-play">▶</button></div><div class="player-controls"><button data-action="play">▶</button><span class="current-time">00:00</span><input type="range" min="0" max="100" value="0" step="0.1" aria-label="Video timeline"><span class="duration">00:32</span><button>⚙</button><button>⛶</button></div><div class="version-bar"><div><strong>Version history</strong><small>Compare every uploaded cut.</small></div><button><span>V1</span><small>Jul 29</small></button><button><span>V2</span><small>Aug 1</small></button><button class="active"><span>V3</span><small>Current</small></button><button class="upload-version">+ Upload version</button></div></section><aside class="comment-panel"><div class="comment-head"><div><h2>Comments <span>${comments.length}</span></h2><p>Feedback is pinned to the video timeline.</p></div><button>•••</button></div><div class="comment-filter"><button class="active">Open</button><button>Resolved</button><span></span><button>Newest⌄</button></div><div class="review-permission-strip"><span>Comments on</span><span>Downloads owner-controlled</span><span>Image/video comments allowed</span><span>Original quality</span></div><div class="comments"></div><form class="comment-form"><div><b>MK</b><textarea rows="3" placeholder="Leave feedback at 00:00…"></textarea></div><p class="comment-attachment-preview" data-attachment-preview hidden></p><div><button type="button" data-attach-comment-media>＋ Add image/video</button><span>Comment at <strong>00:00</strong></span><button class="send-comment" type="submit">Send ↑</button></div><input type="file" accept="image/*,video/*" data-comment-media hidden></form></aside></main><div class="toast" role="status"></div>`;
  const video = root.querySelector("video");
  const range = root.querySelector('input[type="range"]');
  const playButtons = root.querySelectorAll('[data-action="play"], .center-play');
  const timeEls = root.querySelectorAll(".current-time, .comment-form strong");
  let selectedAttachment = null;
  const format = seconds => `${String(Math.floor(seconds / 60)).padStart(2,"0")}:${String(Math.floor(seconds % 60)).padStart(2,"0")}`;
  const renderComments = () => {
    root.querySelector(".comments").innerHTML = comments.map(c => `<article class="comment ${c.resolved ? "resolved" : ""}" data-comment="${c.id}"><div class="comment-avatar">${c.initials}</div><div><header><strong>${c.author}</strong><time>${c.age}</time><button>•••</button></header><button class="timecode" data-time="${c.time}">▶ ${format(c.time)}</button><p>${c.text}</p>${c.attachment ? `<div class="comment-media-chip"><span>${c.attachment.type}</span><strong>${c.attachment.name}</strong><small>${c.attachment.quality}</small></div>` : ""}<footer><button data-resolve="${c.id}">${c.resolved ? "↶ Reopen" : "✓ Resolve"}</button><button>Reply</button></footer></div></article>`).join("");
    root.querySelectorAll(".timecode").forEach(btn => btn.addEventListener("click", () => { video.currentTime = Number(btn.dataset.time); video.play(); }));
    root.querySelectorAll("[data-resolve]").forEach(btn => btn.addEventListener("click", () => { const c = comments.find(x => x.id === Number(btn.dataset.resolve)); c.resolved = !c.resolved; save(); renderComments(); }));
  };
  const save = () => localStorage.setItem("cx_comments", JSON.stringify(comments));
  playButtons.forEach(btn => btn.addEventListener("click", () => video.paused ? video.play() : video.pause()));
  video.addEventListener("play", () => playButtons.forEach(b => b.textContent = "Ⅱ"));
  video.addEventListener("pause", () => playButtons.forEach(b => b.textContent = "▶"));
  video.addEventListener("loadedmetadata", () => root.querySelector(".duration").textContent = format(video.duration));
  video.addEventListener("timeupdate", () => { range.value = video.duration ? (video.currentTime / video.duration) * 100 : 0; timeEls.forEach(e => e.textContent = format(video.currentTime)); });
  range.addEventListener("input", () => { if (video.duration) video.currentTime = (range.value / 100) * video.duration; });
  root.querySelector("[data-attach-comment-media]").addEventListener("click", () => root.querySelector("[data-comment-media]").click());
  root.querySelector("[data-comment-media]").addEventListener("change", event => { const file = event.target.files?.[0]; if (!file) return; selectedAttachment = { name:file.name, type:file.type.startsWith("video") ? "Video reference" : "Image reference", quality:"Original-quality upload allowed" }; const preview = root.querySelector("[data-attachment-preview]"); preview.hidden = false; preview.textContent = `${selectedAttachment.type}: ${selectedAttachment.name}`; });
  root.querySelector(".comment-form").addEventListener("submit", e => { e.preventDefault(); const field = e.currentTarget.querySelector("textarea"); if (!field.value.trim() && !selectedAttachment) return; comments.push({ id: Date.now(), author: "Meera", initials: "MK", time: video.currentTime, text: field.value.trim() || "Attached a visual reference.", attachment:selectedAttachment, age: "Just now", resolved: false }); field.value = ""; selectedAttachment = null; root.querySelector("[data-attachment-preview]").hidden = true; root.querySelector("[data-comment-media]").value = ""; save(); renderComments(); root.querySelector(".comment-head h2 span").textContent = comments.length; });
  const toast = message => { const t = root.querySelector(".toast"); t.textContent = message; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 2400); };
  root.querySelector('[data-action="approve"]').addEventListener("click", () => toast("✓ Version 3 approved. The editor has been notified."));
  root.querySelector('[data-action="changes"]').addEventListener("click", () => toast("Changes requested. Open comments were sent to the editor."));
  root.querySelector('[data-action="back"]').addEventListener("click", actions.openProject);
  renderComments();
}
