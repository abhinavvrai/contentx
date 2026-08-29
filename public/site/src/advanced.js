import { recordNotification } from "./features.js";

const local = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

const safe = (value = "") => { const element = document.createElement("div"); element.textContent = value; return element.innerHTML; };
const fmt = (seconds = 0) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
const today = () => new Date().toISOString().slice(0, 10);
const defaultTasks = [
  { id: 101, clientId: "apex", title: "Approve Launch Reel V3", project: "Apex Fitness Launch", assignee: "Meera", priority: "High", due: "2026-08-04", status: "Review" },
  { id: 102, clientId: "nivara", title: "Rewrite founder-story hook", project: "Founder Story Series", assignee: "Sara", priority: "Medium", due: "2026-08-05", status: "In progress" },
  { id: 103, clientId: "orbit", title: "Export clean master without watermark", project: "Product Walkthrough", assignee: "Abhinav", priority: "High", due: "2026-08-06", status: "To do" },
  { id: 104, clientId: "apex", title: "Schedule approved August posts", project: "Apex Fitness Launch", assignee: "Ravi", priority: "Low", due: "2026-08-08", status: "Done" }
];

const defaultClients = [
  { id: "apex", name: "Apex Fitness", initials: "AF", contactName: "Meera Kapoor", contactInitials: "MK", email: "demo@apexfitness.in", plan: "Content Growth", status: "Active", color: "#ff5c20", storage: 32, storageLabel: "6.4 GB of 20 GB", billing: "₹24,000/month", renewal: "Aug 28, 2026", notificationEmail: true, team: ["Abhinav", "Ravi"], projects: [
    { id: "apex-launch", name: "Apex Fitness Launch", type: "12 short-form reels", format: "Reel · 9:16", status: "In review", progress: 72, files: 24, due: "Aug 8", color: "#ff5c20" },
    { id: "apex-august", name: "August Content Batch", type: "10 monthly reels", format: "Reel · 9:16", status: "Editing", progress: 44, files: 31, due: "Aug 14", color: "#ff8b61" },
    { id: "apex-campaign", name: "Transformation Campaign", type: "Ad variations", format: "Mixed formats", status: "Briefing", progress: 15, files: 8, due: "Aug 20", color: "#ffb097" }
  ]},
  { id: "nivara", name: "Nivara Studio", initials: "NS", contactName: "Ananya Shah", contactInitials: "AS", email: "ananya@nivara.example", plan: "Creator Starter", status: "Active", color: "#8b5cf6", storage: 21, storageLabel: "4.2 GB of 20 GB", billing: "₹13,000/month", renewal: "Sep 2, 2026", notificationEmail: true, team: ["Sara", "Abhinav"], projects: [
    { id: "nivara-founder", name: "Founder Story Series", type: "6 founder-led reels", format: "Reel · 9:16", status: "Editing", progress: 38, files: 18, due: "Aug 12", color: "#8b5cf6" },
    { id: "nivara-launch", name: "Studio Launch Film", type: "Brand film", format: "Landscape · 16:9", status: "Briefing", progress: 12, files: 9, due: "Aug 22", color: "#ad8bf8" }
  ]},
  { id: "orbit", name: "Orbit Labs", initials: "OL", contactName: "Karan Malhotra", contactInitials: "KM", email: "karan@orbit.example", plan: "One-off Premium", status: "Project complete", color: "#4da3ff", storage: 64, storageLabel: "12.8 GB of 20 GB", billing: "₹5,500 one-time", renewal: "No renewal", notificationEmail: false, team: ["Abhinav", "Priya"], projects: [
    { id: "orbit-product", name: "Product Walkthrough", type: "Launch video", format: "Landscape · 16:9", status: "Approved", progress: 100, files: 31, due: "Delivered", color: "#4da3ff" }
  ]}
];

function getClients() {
  const saved = local.get("cx_clients_v2", null);
  if (saved?.length) return saved;
  local.set("cx_clients_v2", defaultClients);
  return structuredClone(defaultClients);
}
function saveClients(clients) { local.set("cx_clients_v2", clients); }
function getActiveClient() {
  const clients = getClients(), access = local.get("cx_access", {}), id = local.get("cx_active_client", access.clientId || "apex");
  return clients.find(client => client.id === id) || clients.find(client => client.email.toLowerCase() === String(access.email || "").toLowerCase()) || clients[0];
}
function getTasks() {
  const mapping = { "Apex Fitness Launch": "apex", "August Content Batch": "apex", "Transformation Campaign": "apex", "Founder Story Series": "nivara", "Studio Launch Film": "nivara", "Product Walkthrough": "orbit" };
  const tasks = local.get("cx_tasks", defaultTasks).map(task => ({ ...task, clientId: task.clientId || mapping[task.project] || "apex" }));
  local.set("cx_tasks", tasks); return tasks;
}
function getActiveProject(client = getActiveClient()) {
  const projectId = local.get("cx_active_project", client.projects[0]?.id);
  return client.projects.find(project => project.id === projectId) || client.projects[0];
}

export function prepareClientRoute(route) {
  const client = getActiveClient(), project = getActiveProject(client);
  if (route === "review") {
    const key = `cx_comments_${project.id}`, scoped = local.get(key, null), current = local.get("cx_comments", null);
    if (scoped) local.set("cx_comments", scoped);
    else if (client.id === "apex" && current) local.set(key, current);
    else localStorage.removeItem("cx_comments");
  }
  if (route === "project") {
    const key = `cx_assets_${project.id}`, scoped = local.get(key, []); local.set("cx_assets", scoped);
  }
}

function toast(message) {
  let element = document.querySelector(".global-toast");
  if (!element) { element = document.createElement("div"); element.className = "global-toast"; document.body.append(element); }
  element.textContent = message; element.classList.add("show"); clearTimeout(element._timer); element._timer = setTimeout(() => element.classList.remove("show"), 2600);
}

function openLayer(content, className = "advanced-modal") {
  const layer = document.createElement("div");
  layer.className = "modal-layer advanced-layer";
  layer.innerHTML = `<section class="${className}"><button class="advanced-close" aria-label="Close">×</button>${content}</section>`;
  document.body.append(layer);
  const close = () => layer.remove();
  layer.querySelector(".advanced-close").addEventListener("click", close);
  layer.addEventListener("click", event => { if (event.target === layer) close(); });
  return { layer, close };
}

export function enhanceReviewSuite(root, actions) {
  if (root.dataset.advancedReview || !root.querySelector(".review-stage")) return;
  root.dataset.advancedReview = "true";
  const activeClient = getActiveClient(), activeProject = getActiveProject(activeClient);
  const isPortrait = /9:16|reel|short-form/i.test(`${activeProject.format} ${activeProject.type}`);
  root.classList.toggle("media-portrait", isPortrait); root.classList.toggle("media-landscape", !isPortrait);
  root.dataset.mediaFormat = isPortrait ? "9:16" : "16:9";
  const video = root.querySelector(".player-wrap video");
  const stageStatus = root.querySelector(".stage-status");
  const controls = root.querySelector(".player-controls");
  const versionBar = root.querySelector(".version-bar");
  const panel = root.querySelector(".comment-panel");
  const comments = root.querySelector(".comments");
  const commentForm = root.querySelector(".comment-form");
  if (activeClient.id !== "apex") {
    const clientComment = comments.querySelector(".comment");
    if (clientComment) {
      clientComment.querySelector(".comment-avatar").textContent = activeClient.contactInitials;
      clientComment.querySelector("header strong").textContent = activeClient.contactName;
      clientComment.querySelector("p").textContent = `Please align this opening with the approved direction for ${activeProject.name}.`;
    }
    const formAvatar = commentForm.querySelector("b"); if (formAvatar) formAvatar.textContent = activeClient.contactInitials;
  }
  const versions = {
    V1: { src: "videos/standard3.mp4", label: "First cut · Jul 29" },
    V2: { src: "videos/premium2.mp4", label: "Client changes · Aug 1" },
    V3: { src: "videos/premium1.mp4", label: "Current version · Aug 3" }
  };

  const reviewTitle = root.querySelector(".review-header>div:nth-of-type(1)");
  if (reviewTitle) reviewTitle.innerHTML = `<strong>${safe(activeProject.name)} · 01</strong><small>${safe(activeClient.name)}</small>`;
  const statusCopy = stageStatus.querySelector(":scope > span:last-of-type"); if (statusCopy) statusCopy.textContent = `V3 · ${activeProject.format} · uploaded 12 minutes ago`;
  const managedButton = root.querySelector("[data-managed-review]"); if (managedButton && activeClient.id !== "apex") { const cleanButton = managedButton.cloneNode(true); cleanButton.classList.remove("is-active"); cleanButton.textContent = "✦ Let Content X review"; managedButton.replaceWith(cleanButton); cleanButton.addEventListener("click", () => openClientManagedReview(activeClient, activeProject, actions)); }
  video.dataset.mediaFormat = isPortrait ? "reel" : "landscape";
  video.setAttribute("aria-label", `${activeProject.name} ${isPortrait ? "vertical reel" : "landscape video"}`);
  stageStatus.insertAdjacentHTML("beforeend", `<span class="media-format-chip">${isPortrait ? "▯ 9:16 REEL" : "▭ 16:9 VIDEO"}</span>`);

  stageStatus.insertAdjacentHTML("beforeend", `<div class="review-command-bar"><button data-review-compare>◫ Compare</button><button data-review-transcript>≡ Transcript</button><button data-review-checklist>✓ Checklist <b data-check-count>0/6</b></button><button data-review-shortcuts>⌨</button></div>`);
  controls.querySelector('[data-action="play"]')?.insertAdjacentHTML("afterend", `<button data-frame-step="-1" title="Previous frame">|‹</button><button data-frame-step="1" title="Next frame">›|</button>`);
  root.querySelector(".duration")?.insertAdjacentHTML("afterend", `<select class="review-speed" aria-label="Playback speed"><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select>`);
  const passiveControls = [...controls.querySelectorAll(":scope > button")].filter(button => !button.dataset.action && !button.dataset.frameStep && !button.classList.contains("download-review"));
  if (passiveControls[0]) { passiveControls[0].dataset.reviewSettings = ""; passiveControls[0].title = "Playback settings"; }
  if (passiveControls[1]) { passiveControls[1].dataset.reviewFullscreen = ""; passiveControls[1].title = "Fullscreen"; }

  const transcript = document.createElement("section");
  transcript.className = "review-transcript";
  transcript.hidden = true;
  const transcriptLines = activeClient.id === "apex" ? [
    [0, "Most people wait for motivation before they begin."],
    [4, "But progress starts when your system is easier than your excuses."],
    [11, "Apex gives you a plan, a coach, and a clear next step."],
    [20, "Train with purpose, track every win, and build momentum that lasts."],
    [31, "Your eight-week transformation starts here."],
    [38, "Join Apex Fitness today."]
  ] : [[0, `${activeProject.name} begins with a clear, human opening.`],[4, `This story was created for ${activeClient.name}.`],[11, "The visual direction builds trust before introducing the offer."],[20, "Each scene supports the approved message and brand tone."],[31, "The final call to action brings the story together."],[38, `${activeClient.name} · final review line.`]];
  transcript.innerHTML = `<header><div><strong>Interactive transcript</strong><small>Click any line to jump to that moment.</small></div><button data-close-transcript>×</button></header><label>⌕ <input placeholder="Search transcript"></label><div>${transcriptLines.map(([time, text]) => `<button data-transcript-time="${time}"><span>${fmt(time)}</span><p>${safe(text)}</p></button>`).join("")}</div>`;
  panel.insertBefore(transcript, commentForm);

  const filter = root.querySelector(".comment-filter");
  filter?.insertAdjacentHTML("beforeend", `<label class="comment-search">⌕<input placeholder="Search"></label>`);
  const applyCommentFilter = () => {
    const mode = filter?.dataset.mode || "open";
    const query = filter?.querySelector("input")?.value.trim().toLowerCase() || "";
    comments.querySelectorAll(".comment").forEach(article => {
      const resolved = article.classList.contains("resolved");
      const modeMatch = mode === "all" || (mode === "resolved" ? resolved : !resolved);
      article.hidden = !modeMatch || !article.textContent.toLowerCase().includes(query);
    });
  };
  const filterButtons = filter ? [...filter.querySelectorAll(":scope > button")] : [];
  filterButtons[0]?.addEventListener("click", () => { filter.dataset.mode = "open"; filterButtons.forEach((b, i) => b.classList.toggle("active", i === 0)); applyCommentFilter(); });
  filterButtons[1]?.addEventListener("click", () => { filter.dataset.mode = "resolved"; filterButtons.forEach((b, i) => b.classList.toggle("active", i === 1)); applyCommentFilter(); });
  filterButtons[2]?.addEventListener("click", () => { comments.classList.toggle("reverse-order"); filterButtons[2].textContent = comments.classList.contains("reverse-order") ? "Oldest⌄" : "Newest⌄"; });
  filter?.querySelector("input")?.addEventListener("input", applyCommentFilter);
  new MutationObserver(applyCommentFilter).observe(comments, { childList: true });
  new MutationObserver(() => {
    const current = local.get("cx_comments", null);
    if (current && activeClient.id !== "apex") current.forEach(item => { if (item.author === "Meera") { item.author = activeClient.contactName; item.initials = activeClient.contactInitials; } });
    if (current) { local.set("cx_comments", current); local.set(`cx_comments_${activeProject.id}`, current); }
    if (activeClient.id !== "apex") comments.querySelectorAll(".comment").forEach(article => { if (article.querySelector("header strong")?.textContent === "Meera") { article.querySelector("header strong").textContent = activeClient.contactName; article.querySelector(".comment-avatar").textContent = activeClient.contactInitials; } });
  }).observe(comments, { childList: true, subtree: true });

  root.querySelectorAll("[data-frame-step]").forEach(button => button.addEventListener("click", () => { video.pause(); video.currentTime = Math.max(0, Math.min(video.duration || 999, video.currentTime + Number(button.dataset.frameStep) / 30)); }));
  root.querySelector(".review-speed")?.addEventListener("change", event => { video.playbackRate = Number(event.target.value); local.set("cx_review_speed", video.playbackRate); toast(`Playback speed set to ${event.target.value}.`); });
  const savedSpeed = Number(local.get("cx_review_speed", 1)); video.playbackRate = savedSpeed; if (root.querySelector(`.review-speed option[value="${savedSpeed}"]`)) root.querySelector(".review-speed").value = String(savedSpeed);

  root.querySelector("[data-review-settings]")?.addEventListener("click", () => openPlaybackSettings(video));
  root.querySelector("[data-review-fullscreen]")?.addEventListener("click", async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await root.querySelector(".player-wrap").requestFullscreen(); }
    catch { toast("Fullscreen is unavailable in this preview window."); }
  });
  root.querySelector("[data-review-compare]")?.addEventListener("click", () => openComparison(versions));
  root.querySelector("[data-review-checklist]")?.addEventListener("click", () => openReviewChecklist(root));
  root.querySelector("[data-review-shortcuts]")?.addEventListener("click", openShortcutGuide);
  root.querySelector("[data-review-transcript]")?.addEventListener("click", () => toggleTranscript(true));
  transcript.querySelector("[data-close-transcript]").addEventListener("click", () => toggleTranscript(false));
  transcript.querySelectorAll("[data-transcript-time]").forEach(button => button.addEventListener("click", () => { video.currentTime = Number(button.dataset.transcriptTime); video.pause(); }));
  transcript.querySelector("input").addEventListener("input", event => transcript.querySelectorAll("[data-transcript-time]").forEach(button => button.hidden = !button.textContent.toLowerCase().includes(event.target.value.toLowerCase())));

  function toggleTranscript(show) {
    transcript.hidden = !show; comments.hidden = show; filter.hidden = show; commentForm.hidden = show;
    root.querySelector("[data-review-transcript]").classList.toggle("active", show);
  }

  versionBar?.querySelectorAll(":scope > button:not(.upload-version)").forEach(button => button.addEventListener("click", () => {
    const version = button.querySelector("span")?.textContent.trim(); if (!versions[version]) return;
    const time = video.currentTime; video.pause(); video.src = versions[version].src; video.currentTime = time;
    versionBar.querySelectorAll(":scope > button").forEach(item => item.classList.toggle("active", item === button));
    root.querySelector(".version-select").textContent = `Version ${version.slice(1)}⌄`;
    stageStatus.querySelector(":scope > span:last-of-type").textContent = versions[version].label;
    toast(`${version} loaded. Comments remain attached to their saved timestamps.`);
  }));

  const headerShare = [...root.querySelectorAll(".review-head-actions .pill-dark")].find(button => !button.dataset.action);
  headerShare?.addEventListener("click", openReviewShare);
  comments.addEventListener("click", event => {
    const article = event.target.closest(".comment"); if (!article) return;
    if (event.target.textContent.trim() === "Reply") { const author = article.querySelector("header strong")?.textContent || "teammate"; const field = commentForm.querySelector("textarea"); field.value = `@${author} `; field.focus(); }
    if (event.target.textContent.trim() === "•••") openCommentActions(article);
  });

  const keyHandler = event => {
    if (!document.body.contains(root)) return window.removeEventListener("keydown", keyHandler);
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
    if (event.code === "Space") { event.preventDefault(); if (video.paused) video.play(); else video.pause(); }
    else if (event.key === "ArrowLeft") video.currentTime = Math.max(0, video.currentTime - 5);
    else if (event.key === "ArrowRight") video.currentTime = Math.min(video.duration || 999, video.currentTime + 5);
    else if (event.key === "[") { video.pause(); video.currentTime = Math.max(0, video.currentTime - 1 / 30); }
    else if (event.key === "]") { video.pause(); video.currentTime = Math.min(video.duration || 999, video.currentTime + 1 / 30); }
    else if (event.key.toLowerCase() === "c") commentForm.querySelector("textarea")?.focus();
    else if (event.key.toLowerCase() === "m") root.querySelector("[data-toggle-annotations]")?.click();
    else if (event.key === "?") openShortcutGuide();
  };
  window.addEventListener("keydown", keyHandler);
  updateChecklistChip(root);
}

function openPlaybackSettings(video) {
  const prefs = { loop: false, autoplayNext: false, dimComments: false, ...local.get("cx_playback_settings", {}) };
  const { layer, close } = openLayer(`<p class="eyebrow"><span></span>Playback</p><h2>Review settings</h2><div class="advanced-settings"><label><span><strong>Loop this version</strong><small>Replay automatically while checking details</small></span><input type="checkbox" data-setting="loop" ${prefs.loop ? "checked" : ""}></label><label><span><strong>Autoplay next version</strong><small>Continue comparison after a version ends</small></span><input type="checkbox" data-setting="autoplayNext" ${prefs.autoplayNext ? "checked" : ""}></label><label><span><strong>Focus mode</strong><small>Dim the comment panel during playback</small></span><input type="checkbox" data-setting="dimComments" ${prefs.dimComments ? "checked" : ""}></label></div><button class="pill pill-hot" data-save-settings>Save review settings</button>`);
  layer.querySelector("[data-save-settings]").addEventListener("click", () => { layer.querySelectorAll("[data-setting]").forEach(input => prefs[input.dataset.setting] = input.checked); local.set("cx_playback_settings", prefs); video.loop = prefs.loop; document.querySelector(".review-app")?.classList.toggle("focus-comments", prefs.dimComments); close(); toast("Review settings saved."); });
}

function openClientManagedReview(client, project, actions) {
  const settings = { price: 2500, turnaround: "Within 1 business day", ...local.get("cx_managed_review_settings", {}) };
  const { layer, close } = openLayer(`<p class="eyebrow"><span></span>${safe(client.name)}</p><h2>Let Content X manage this review.</h2><p class="advanced-subcopy">Our review desk checks ${safe(project.name)}, consolidates every note, follows up on revisions and sends this client only the final decision.</p><div class="managed-review-price"><div><small>CLIENT-SPECIFIC REVIEW FEE</small><strong>₹${Number(settings.price).toLocaleString("en-IN")}</strong><span>${safe(settings.turnaround)}</span></div><p>This request stays inside ${safe(client.name)}'s workspace.</p></div><button class="pill pill-hot" data-client-managed-review>Continue to payment →</button>`);
  layer.querySelector("[data-client-managed-review]").addEventListener("click", () => { close(); actions.openCheckout({ id:`managed-${client.id}-${project.id}`, name:`Content X Managed Review · ${client.name}`, price:Number(settings.price), unit:"project", badge:"Hands-off quality control", managedReview:true, project:project.name, version:"V3", turnaround:settings.turnaround, clientId:client.id, features:[`Private ${client.name} review desk`,"Frame-accurate quality check","Revision follow-up managed for you","Final brief and brand approval",settings.turnaround] }); });
}

function openComparison(versions) {
  const { layer } = openLayer(`<p class="eyebrow"><span></span>Version comparison</p><h2>Compare cuts side by side.</h2><p class="advanced-subcopy">Playback stays synchronised so timing, graphics and colour changes are easier to spot.</p><div class="comparison-selects"><label>Left version<select data-side="left">${Object.keys(versions).map(v => `<option ${v === "V2" ? "selected" : ""}>${v}</option>`).join("")}</select></label><label>Right version<select data-side="right">${Object.keys(versions).map(v => `<option ${v === "V3" ? "selected" : ""}>${v}</option>`).join("")}</select></label></div><div class="comparison-grid"><article><span data-left-label>V2</span><video src="${versions.V2.src}" muted playsinline></video></article><article><span data-right-label>V3</span><video src="${versions.V3.src}" muted playsinline></video></article></div><div class="comparison-controls"><button data-sync-back>−5s</button><button class="pill pill-hot" data-sync-play>▶ Play both</button><button data-sync-forward>+5s</button><span data-sync-time>00:00</span></div>`, "advanced-modal comparison-modal");
  const videos = [...layer.querySelectorAll("video")];
  const sync = time => videos.forEach(video => video.currentTime = Math.max(0, Math.min(video.duration || 999, time)));
  layer.querySelectorAll("[data-side]").forEach(select => select.addEventListener("change", () => { const side = select.dataset.side, index = side === "left" ? 0 : 1; videos[index].src = versions[select.value].src; layer.querySelector(`[data-${side}-label]`).textContent = select.value; }));
  layer.querySelector("[data-sync-play]").addEventListener("click", event => { if (videos[0].paused) { const time = Math.max(videos[0].currentTime, videos[1].currentTime); sync(time); videos.forEach(video => video.play()); event.currentTarget.textContent = "Ⅱ Pause both"; } else { videos.forEach(video => video.pause()); event.currentTarget.textContent = "▶ Play both"; } });
  layer.querySelector("[data-sync-back]").addEventListener("click", () => sync(videos[0].currentTime - 5));
  layer.querySelector("[data-sync-forward]").addEventListener("click", () => sync(videos[0].currentTime + 5));
  videos[0].addEventListener("timeupdate", () => { if (!videos[0].paused && Math.abs(videos[1].currentTime - videos[0].currentTime) > .2) videos[1].currentTime = videos[0].currentTime; layer.querySelector("[data-sync-time]").textContent = fmt(videos[0].currentTime); });
}

function updateChecklistChip(root) {
  const project = getActiveProject(); const items = local.get(`cx_review_checklist_${project.id}`, []); const done = items.filter(item => item.done).length;
  const chip = root.querySelector("[data-check-count]"); if (chip) chip.textContent = `${done}/6`;
}

function openReviewChecklist(root) {
  const client = getActiveClient(), project = getActiveProject(client), checklistKey = `cx_review_checklist_${project.id}`;
  const labels = ["Hook is clear in the first three seconds", "Captions are accurate and inside safe zones", "Brand colours, logo and fonts are correct", "Audio levels and music feel balanced", "All open feedback is addressed", "Final CTA and export format are correct"];
  let items = local.get(checklistKey, labels.map((label, index) => ({ id: index + 1, label, done: false })));
  const { layer, close } = openLayer(`<p class="eyebrow"><span></span>${safe(client.name)} · quality gate</p><h2>Final review checklist</h2><p class="advanced-subcopy">Use the same approval standard for ${safe(project.name)}.</p><div class="review-checklist">${items.map(item => `<label><input type="checkbox" data-check-id="${item.id}" ${item.done ? "checked" : ""}><span><strong>${safe(item.label)}</strong><small>${item.done ? "Checked" : "Needs review"}</small></span></label>`).join("")}</div><div class="checklist-footer"><div><strong data-progress-label>0 of 6 complete</strong><i><em data-progress-bar></em></i></div><button class="pill pill-green" data-finish-review>Mark quality check complete</button></div>`);
  const paint = () => { const done = items.filter(item => item.done).length; layer.querySelector("[data-progress-label]").textContent = `${done} of ${items.length} complete`; layer.querySelector("[data-progress-bar]").style.width = `${done / items.length * 100}%`; layer.querySelector("[data-finish-review]").disabled = done !== items.length; layer.querySelectorAll(".review-checklist label").forEach((label, index) => { label.classList.toggle("done", items[index].done); label.querySelector("small").textContent = items[index].done ? "Checked" : "Needs review"; }); updateChecklistChip(root); };
  layer.querySelectorAll("[data-check-id]").forEach(input => input.addEventListener("change", () => { const item = items.find(entry => entry.id === Number(input.dataset.checkId)); item.done = input.checked; local.set(checklistKey, items); paint(); }));
  layer.querySelector("[data-finish-review]").addEventListener("click", () => { recordNotification("approval", "Quality checklist completed", `All six review checks passed for ${project.name} · V3.`, { clientId: client.id, projectId: project.id }); close(); toast("Quality gate completed. This version is ready for approval."); });
  paint();
}

function openShortcutGuide() {
  openLayer(`<p class="eyebrow"><span></span>Fast review</p><h2>Keyboard shortcuts</h2><div class="shortcut-grid">${[["Space","Play / pause"],["← / →","Jump 5 seconds"],["[ / ]","Previous / next frame"],["C","Write a comment"],["M","Open annotation tools"],["?","Show this guide"]].map(([key, copy]) => `<span><kbd>${key}</kbd><strong>${copy}</strong></span>`).join("")}</div>`);
}

function openReviewShare() {
  const client = getActiveClient(), project = getActiveProject(client), sharesKey = `cx_review_shares_${project.id}`;
  const { layer, close } = openLayer(`<p class="eyebrow"><span></span>${safe(client.name)} · protected review</p><h2>Share ${safe(project.name)} · V3</h2><label class="advanced-field">Recipient email<input type="email" data-share-email placeholder="client@company.com"></label><div class="advanced-settings compact"><label><span><strong>Allow comments</strong><small>Recipient can leave timestamped feedback</small></span><input type="checkbox" data-share-comments checked></label><label><span><strong>Allow downloads</strong><small>Only after owner approval</small></span><input type="checkbox" data-share-download></label><label><span><strong>Allow image/video comments</strong><small>Recipient can attach visual references.</small></span><input type="checkbox" data-share-media-comments checked></label><label><span><strong>Keep comment uploads original quality</strong><small>Use more storage, but preserves reference quality.</small></span><input type="checkbox" data-share-original-quality checked></label><label><span><strong>Require passcode</strong><small>Add an extra access check</small></span><input type="checkbox" data-share-passcode checked></label></div><button class="pill pill-hot" data-create-review-share>Create protected link →</button>`);
  layer.querySelector("[data-create-review-share]").addEventListener("click", () => { const email = layer.querySelector("[data-share-email]").value.trim(); if (!/^\S+@\S+\.\S+$/.test(email)) return toast("Enter a valid recipient email."); const shares = local.get(sharesKey, []); const code = `RV-${String(Date.now()).slice(-6)}`; shares.unshift({ id: Date.now(), code, email, clientId: client.id, projectId: project.id, comments: layer.querySelector("[data-share-comments]").checked, download: layer.querySelector("[data-share-download]").checked, mediaComments: layer.querySelector("[data-share-media-comments]").checked, originalQuality: layer.querySelector("[data-share-original-quality]").checked, passcode: layer.querySelector("[data-share-passcode]").checked, created: new Date().toLocaleString() }); local.set(sharesKey, shares); recordNotification("delivery", "Protected review shared", `${project.name} · V3 was shared with ${email}.`, { email, clientId: client.id, projectId: project.id }); navigator.clipboard?.writeText(`https://contentx.local/review/${code}`); close(); toast("Protected review link created and copied."); });
}

function openCommentActions(article) {
  const client = getActiveClient(), project = getActiveProject(client);
  const { layer, close } = openLayer(`<p class="eyebrow"><span></span>Comment actions</p><h2>Manage this feedback</h2><div class="action-list"><button data-comment-action="copy">↗ Copy comment link</button><button data-comment-action="task">✓ Convert to task</button><button data-comment-action="pin">● Pin as priority</button></div>`);
  layer.querySelectorAll("[data-comment-action]").forEach(button => button.addEventListener("click", () => { const action = button.dataset.commentAction; if (action === "copy") navigator.clipboard?.writeText(`https://contentx.local/review/comment/${article.dataset.comment}`); if (action === "task") { const tasks = getTasks(); tasks.unshift({ id: Date.now(), clientId: client.id, title: article.querySelector("p")?.textContent || "Review comment", project: project.name, assignee: "Abhinav", priority: "High", due: today(), status: "To do" }); local.set("cx_tasks", tasks); recordNotification("feedback", "Comment converted to task", article.querySelector("p")?.textContent || "Review feedback task created.", { clientId: client.id, projectId: project.id }); } if (action === "pin") article.classList.add("priority-comment"); close(); toast(action === "task" ? "Feedback added to the task board." : action === "pin" ? "Comment pinned as a priority." : "Comment link copied."); }));
}

export function enhanceDashboardSuite(root, actions) {
  if (root.dataset.advancedDashboard || !root.querySelector(".dash-sidebar")) return;
  root.dataset.advancedDashboard = "true";
  const nav = root.querySelector(".dash-sidebar nav");
  const activeClient = getActiveClient();
  applyClientDashboard(root, activeClient, actions);
  const tasks = getTasks();
  const taskButton = document.createElement("button"); taskButton.dataset.dash = "tasks"; taskButton.innerHTML = `<span>✓</span>Tasks <b>${tasks.filter(task => task.clientId === activeClient.id && task.status !== "Done").length}</b>`;
  nav.insertBefore(taskButton, nav.querySelector('[data-dash="messages"]') || null);
  taskButton.addEventListener("click", () => { setActiveNav(root, taskButton); renderTaskBoard(root.querySelector(".dash-main"), false, null, activeClient.id); });
  root.querySelector('[data-dash="reviews"]')?.addEventListener("click", event => { setActiveNav(root, event.currentTarget); renderWorkspaceCollection(root.querySelector(".dash-main"), "review", actions); });
  root.querySelector('[data-dash="approved"]')?.addEventListener("click", event => { setActiveNav(root, event.currentTarget); renderWorkspaceCollection(root.querySelector(".dash-main"), "approved", actions); });
  root.querySelector('[data-dash="assets"]')?.addEventListener("click", event => { setActiveNav(root, event.currentTarget); renderWorkspaceCollection(root.querySelector(".dash-main"), "assets", actions); });
  root.querySelector('[data-dash="home"]')?.addEventListener("click", () => { location.hash = "workspace"; window.dispatchEvent(new Event("hashchange")); });
  root.querySelector('[data-dash="projects"]')?.addEventListener("click", () => { location.hash = "workspace"; window.dispatchEvent(new Event("hashchange")); });

  const iconButtons = root.querySelectorAll(".dash-header .icon-button");
  iconButtons[0]?.addEventListener("click", () => openWorkspaceSearch(actions));
  iconButtons[1]?.addEventListener("click", () => root.querySelector('[data-dash="notifications"]')?.click());
  root.querySelector(".storage button")?.addEventListener("click", openStorageUpgrade);
  root.querySelector(".dash-user button")?.addEventListener("click", openAccountMenu);
  root.querySelectorAll(".view-switch button").forEach((button, index) => button.addEventListener("click", () => { root.querySelectorAll(".view-switch button").forEach(item => item.classList.toggle("active", item === button)); root.querySelector(".project-grid")?.classList.toggle("project-list-view", index === 1); }));
  const viewAll = [...root.querySelectorAll(".recent-section button")].find(button => button.textContent.includes("View all")); viewAll?.addEventListener("click", () => root.querySelector('[data-dash="notifications"]')?.click());
}

function setActiveNav(root, active) { root.querySelectorAll(".dash-sidebar nav button").forEach(button => button.classList.toggle("active", button === active)); }

function applyClientDashboard(root, client, actions) {
  const user = root.querySelector(".dash-user");
  if (user) { user.querySelector("b").textContent = client.contactInitials; const text = user.querySelector("span"); text.innerHTML = `${safe(client.contactName)}<small>${safe(client.name)}</small>`; }
  const greeting = root.querySelector(".dash-header h1"); if (greeting) greeting.textContent = "Good afternoon.";
  const storage = root.querySelector(".storage"); if (storage) { storage.querySelector("small").textContent = client.storageLabel; storage.querySelector("em").style.width = `${client.storage}%`; }
  const projectCount = root.querySelector('[data-dash="projects"] b'); if (projectCount) projectCount.textContent = client.projects.length;
  const reviewCount = client.projects.filter(project => project.status === "In review" || project.status === "Editing").length;
  const reviewBadge = root.querySelector('[data-dash="reviews"] b'); if (reviewBadge) reviewBadge.textContent = reviewCount;
  const summaryValues = root.querySelectorAll(".dash-summary article strong");
  if (summaryValues[0]) summaryValues[0].textContent = client.projects.length;
  if (summaryValues[1]) summaryValues[1].textContent = reviewCount;
  if (summaryValues[2]) summaryValues[2].textContent = client.projects.filter(project => project.status === "Approved").length;
  const activityList = root.querySelector(".recent-section .activity-list");
  if (activityList) {
    const activityProjects = client.projects.slice(0, 3);
    activityList.innerHTML = activityProjects.length ? activityProjects.map((project, index) => {
      const activity = project.status === "Approved" ? ["✓", "green", "Master approved", "Yesterday"] : project.status === "In review" ? ["◌", "orange", "Feedback is waiting", "32 min ago"] : ["↑", "violet", `${project.status} update`, index ? "2 hr ago" : "18 min ago"];
      return `<article><span class="activity-icon ${activity[1]}">${activity[0]}</span><p><strong>${safe(activity[2])}</strong><small>${safe(project.name)} · ${safe(project.format)}</small></p><time>${activity[3]}</time></article>`;
    }).join("") : '<div class="empty-state"><span>◷</span><h3>No client activity yet</h3><p>Private project updates will appear here.</p></div>';
  }
  const grid = root.querySelector(".project-grid");
  if (grid) {
    grid.innerHTML = `${client.projects.map(project => `<article class="project-card" data-client-project="${project.id}"><div class="project-card-top"><span class="folder-icon" style="--project:${safe(project.color)}">▰</span><button type="button" data-project-menu>•••</button></div><p>${safe(client.name)}</p><h3>${safe(project.name)}</h3><small>${safe(project.type)} · ${safe(project.format)}</small><div class="project-meta"><span class="status ${project.status.toLowerCase().replaceAll(" ", "-")}"><i></i>${safe(project.status)}</span><span>${project.files} files</span></div><div class="progress-row"><i><em style="width:${project.progress}%;--project:${safe(project.color)}"></em></i><span>${project.progress}%</span></div><footer><span>Due ${safe(project.due)}</span><b>${safe(client.contactInitials)}</b></footer></article>`).join("")}<button class="new-project-card" data-client-new-project><span>+</span><strong>Start a new project</strong><small>Create a private workspace for ${safe(client.name)}.</small></button>`;
    grid.querySelectorAll("[data-client-project]").forEach(card => card.addEventListener("click", event => { if (event.target.closest("[data-project-menu]")) return openClientProjectActions(client, card.dataset.clientProject); local.set("cx_active_project", card.dataset.clientProject); actions.openProject(); }));
    grid.querySelector("[data-client-new-project]")?.addEventListener("click", () => openClientProjectModal(client, actions));
  }
  root.querySelectorAll('[data-action="new-project"]').forEach(button => { const clone = button.cloneNode(true); button.replaceWith(clone); clone.addEventListener("click", () => openClientProjectModal(client, actions)); });
  const header = root.querySelector(".dash-header");
  header?.insertAdjacentHTML("afterbegin", `<div class="client-context-pill" style="--client:${safe(client.color)}"><span>${safe(client.initials)}</span><p><strong>${safe(client.name)}</strong><small>${safe(client.plan)} · isolated workspace</small></p></div>`);
  if (local.get("cx_owner_preview", false)) { const actionArea = header?.querySelector(":scope > div:last-child"); actionArea?.insertAdjacentHTML("afterbegin", `<button class="pill pill-dark" data-return-owner>← Owner view</button>`); root.querySelector("[data-return-owner]")?.addEventListener("click", () => { local.set("cx_owner_preview", false); actions.openAdmin(); }); }
}

function openClientProjectActions(client, projectId) {
  const project = client.projects.find(item => item.id === projectId); if (!project) return;
  const { layer, close } = openLayer(`<p class="eyebrow"><span></span>${safe(client.name)}</p><h2>${safe(project.name)}</h2><div class="action-list"><button data-project-card-action="rename">✎ Rename project</button><button data-project-card-action="share">↗ Share workspace</button><button data-project-card-action="archive">◇ Archive project</button></div>`);
  layer.querySelectorAll("[data-project-card-action]").forEach(button => button.addEventListener("click", () => { close(); toast(`${button.textContent.trim()} is ready for ${client.name}.`); }));
}

function openClientProjectModal(client, actions, onComplete = null) {
  const { layer, close } = openLayer(`<p class="eyebrow"><span></span>${safe(client.name)}</p><h2>Create a separate project workspace</h2><form class="advanced-form"><label>Project name<input name="name" required></label><label>Content format<select name="format"><option>Reel · 9:16</option><option>Landscape · 16:9</option><option>Square · 1:1</option><option>Mixed formats</option></select></label><label>Service type<select name="type"><option>Short-form video series</option><option>Long-form video</option><option>Monthly content batch</option><option>Social media management</option></select></label><label>Due date<input name="due" type="date" required value="${today()}"></label><button class="pill pill-hot" type="submit">Create client project →</button></form>`);
  layer.querySelector("form").addEventListener("submit", event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); const clients = getClients(), current = clients.find(item => item.id === client.id); const project = { id: `${client.id}-${Date.now()}`, ...data, status: "Briefing", progress: 0, files: 0, color: client.color }; current.projects.unshift(project); saveClients(clients); local.set("cx_active_project", project.id); close(); recordNotification("upload", "New client project created", `${project.name} was created inside ${client.name}'s private workspace.`); toast(`Separate workspace created for ${client.name}.`); if (onComplete) onComplete(current); else { local.set("cx_active_client", client.id); actions.openDashboard(true); window.dispatchEvent(new Event("hashchange")); } });
}

function renderWorkspaceCollection(main, type, actions) {
  const client = getActiveClient();
  const reviewProjects = client.projects.filter(project => project.status === "In review" || project.status === "Editing");
  const approvedProjects = client.projects.filter(project => project.status === "Approved");
  if (type === "review") main.innerHTML = `<header class="dash-header"><div><p>${safe(client.name)} · review queue</p><h1>Needs your decision</h1></div>${reviewProjects.length ? '<button class="pill pill-hot" data-open-review>Open next review →</button>' : ""}</header><div class="workspace-collection">${reviewProjects.length ? reviewProjects.map((project, index) => `<article><span>▶</span><div><strong>${safe(project.name)} · ${String(index + 1).padStart(2, "0")}</strong><small>${safe(project.format)} · V${index + 2}</small></div><em>${index + 2} open comments</em><button data-review-item="${project.id}">Review now →</button></article>`).join("") : '<div class="empty-state"><span>✓</span><h3>No reviews waiting</h3><p>This client has no open review decisions.</p></div>'}</div>`;
  else if (type === "approved") main.innerHTML = `<header class="dash-header"><div><p>${safe(client.name)} · final library</p><h1>Approved videos</h1></div></header><div class="workspace-collection">${approvedProjects.length ? approvedProjects.map(project => `<article><span class="approved-mark">✓</span><div><strong>${safe(project.name)} · Master</strong><small>${safe(project.format)} · approved</small></div><em>Master ready</em><button data-final-download>Download master ↓</button></article>`).join("") : '<div class="empty-state"><span>◇</span><h3>No approved masters yet</h3><p>Approved files for this client will appear here.</p></div>'}</div>`;
  else main.innerHTML = `<header class="dash-header"><div><p>${safe(client.name)} · private assets</p><h1>Reusable brand files</h1></div><button class="pill pill-hot" data-asset-upload>↑ Upload assets</button></header><div class="asset-dropzone"><span>◇</span><h2>${safe(client.name)} brand library</h2><p>These original-quality files are isolated from every other client.</p><button data-asset-upload>Choose files</button><input type="file" hidden multiple accept="image/*,video/*,audio/*,.pdf,.zip"></div><div class="workspace-collection asset-items"><article><span>PNG</span><div><strong>${safe(client.initials)}-Logo-Master.png</strong><small>${safe(client.name)} Brand Assets · 2.4 MB</small></div><em>Client-only asset</em><button data-copy-asset>Copy to project</button></article><article><span>ZIP</span><div><strong>${safe(client.initials)}-Brand-Kit.zip</strong><small>Fonts, colours and guidelines</small></div><em>Client-only asset</em><button data-copy-asset>Copy to project</button></article></div>`;
  main.querySelector("[data-open-review]")?.addEventListener("click", () => { local.set("cx_active_project", reviewProjects[0].id); actions.openReview(); });
  main.querySelectorAll("[data-review-item]").forEach(button => button.addEventListener("click", () => { local.set("cx_active_project", button.dataset.reviewItem); actions.openReview(); }));
  main.querySelectorAll("[data-final-download]").forEach(button => button.addEventListener("click", () => toast("Protected master download prepared.")));
  const picker = main.querySelector('input[type="file"]'); main.querySelectorAll("[data-asset-upload]").forEach(button => button.addEventListener("click", () => picker?.click())); picker?.addEventListener("change", () => { const assets = local.get(`cx_client_assets_${client.id}`, []); [...picker.files].forEach(file => assets.unshift({ id: Date.now() + Math.random(), name: file.name, size: file.size, type: file.type, clientId: client.id })); local.set(`cx_client_assets_${client.id}`, assets); recordNotification("upload", `${client.name} assets uploaded`, `${picker.files.length} reusable asset${picker.files.length === 1 ? "" : "s"} added to this client's private library.`); toast(`${picker.files.length} ${client.name} asset${picker.files.length === 1 ? "" : "s"} added.`); });
  main.querySelectorAll("[data-copy-asset]").forEach(button => button.addEventListener("click", () => toast(`Asset copied to ${getActiveProject(client).name}.`)));
}

function syncTaskCounts(tasks) {
  const active = tasks.filter(task => task.status !== "Done").length;
  const activeClientId = getActiveClient().id;
  document.querySelector('[data-dash="tasks"] b')?.replaceChildren(String(tasks.filter(task => task.clientId === activeClientId && task.status !== "Done").length));
  document.querySelector('[data-admin-workflow] b')?.replaceChildren(String(active));
  const activeProject = getActiveProject();
  const projectActive = tasks.filter(task => task.project === activeProject.name && task.status !== "Done").length;
  document.querySelector('[data-project-tasks] b')?.replaceChildren(String(projectActive));
}

function renderTaskBoard(container, owner = false, projectScope = null, clientScope = null) {
  let tasks = getTasks();
  const paint = () => {
    const visibleTasks = tasks.filter(task => (!projectScope || task.project === projectScope) && (!clientScope || task.clientId === clientScope));
    const statuses = ["To do", "In progress", "Review", "Done"];
    const scopeCopy = projectScope ? `${visibleTasks.filter(task => task.status !== "Done").length} active in ${projectScope}` : `${visibleTasks.filter(task => task.status !== "Done").length} active across ${new Set(visibleTasks.map(task => task.project)).size} projects`;
    container.innerHTML = `<header class="task-board-head"><div><p>${owner ? "Operations workflow" : "Project workflow"}</p><h1>${owner ? "Team tasks & workload" : "Tasks"}</h1><span>${scopeCopy}</span></div><div><select data-task-assignee><option>Everyone</option>${[...new Set(visibleTasks.map(task => task.assignee))].map(name => `<option>${safe(name)}</option>`).join("")}</select><button class="pill pill-hot" data-add-task>+ Add task</button></div></header><div class="task-board">${statuses.map(status => `<section data-task-column="${status}"><header><strong>${status}</strong><span>${visibleTasks.filter(task => task.status === status).length}</span></header><div>${visibleTasks.filter(task => task.status === status).map(task => taskCard(task, statuses)).join("") || '<p class="task-empty">No tasks here</p>'}</div></section>`).join("")}</div>`;
    syncTaskCounts(tasks);
    container.querySelector("[data-add-task]").addEventListener("click", () => openTaskModal(newTask => { tasks.unshift(newTask); local.set("cx_tasks", tasks); recordNotification("feedback", "New project task assigned", `${newTask.title} was assigned to ${newTask.assignee}.`); paint(); }, projectScope, clientScope));
    container.querySelector("[data-task-assignee]").addEventListener("change", event => container.querySelectorAll("[data-task-card]").forEach(card => card.hidden = event.target.value !== "Everyone" && card.dataset.assignee !== event.target.value));
    container.querySelectorAll("[data-task-status]").forEach(select => select.addEventListener("change", () => { const task = tasks.find(item => item.id === Number(select.dataset.taskStatus)); task.status = select.value; local.set("cx_tasks", tasks); recordNotification(task.status === "Done" ? "approval" : "feedback", `Task moved to ${task.status}`, task.title); paint(); }));
    container.querySelectorAll("[data-task-delete]").forEach(button => button.addEventListener("click", () => { tasks = tasks.filter(item => item.id !== Number(button.dataset.taskDelete)); local.set("cx_tasks", tasks); paint(); toast("Task removed."); }));
  };
  paint();
}

function taskCard(task, statuses) {
  const overdue = task.due < today() && task.status !== "Done";
  return `<article data-task-card="${task.id}" data-assignee="${safe(task.assignee)}"><div><span class="task-priority ${task.priority.toLowerCase()}">${safe(task.priority)}</span><button data-task-delete="${task.id}" aria-label="Delete task">×</button></div><h3>${safe(task.title)}</h3><p>${safe(task.project)}</p><footer><span>${safe(task.assignee.slice(0, 2).toUpperCase())}</span><time class="${overdue ? "overdue" : ""}">${overdue ? "Overdue · " : "Due · "}${safe(task.due)}</time></footer><select data-task-status="${task.id}">${statuses.map(status => `<option ${status === task.status ? "selected" : ""}>${status}</option>`).join("")}</select></article>`;
}

function openTaskModal(onSave, defaultProject = null, clientId = null) {
  const taskClient = getClients().find(client => client.id === clientId) || getActiveClient();
  const { layer, close } = openLayer(`<p class="eyebrow"><span></span>${safe(taskClient.name)} task</p><h2>Add a clear next action</h2><form class="advanced-form"><label>Task title<input name="title" required placeholder="What needs to happen?"></label><label>Project<select name="project">${taskClient.projects.map(project => `<option>${safe(project.name)}</option>`).join("")}</select></label><div><label>Assignee<select name="assignee">${[...new Set(["Abhinav",taskClient.contactName,"Sara","Ravi","Priya",...taskClient.team])].map(name => `<option>${safe(name)}</option>`).join("")}</select></label><label>Priority<select name="priority"><option>Medium</option><option>High</option><option>Low</option></select></label></div><label>Due date<input type="date" name="due" required value="${today()}"></label><button class="pill pill-hot" type="submit">Create task →</button></form>`);
  if (defaultProject) layer.querySelector('[name="project"]').value = defaultProject;
  layer.querySelector("form").addEventListener("submit", event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); onSave({ id: Date.now(), clientId: clientId || getActiveClient().id, ...data, status: "To do" }); close(); toast("Task added to the workflow."); });
}

function openWorkspaceSearch(actions) {
  const client = getActiveClient(), project = getActiveProject(client), task = getTasks().find(item => item.clientId === client.id) || { title: `Review ${project.name}`, assignee: "Abhinav" };
  const { layer, close } = openLayer(`<p class="eyebrow"><span></span>${safe(client.name)} search</p><h2>Find anything.</h2><label class="workspace-search-input">⌕<input autofocus placeholder="Projects, files, tasks or people"></label><div class="workspace-search-results"><button data-search-route="review"><span>▶</span><p><strong>${safe(project.name)} · V3</strong><small>${safe(project.format)} · waiting for review</small></p></button><button data-search-route="project"><span>▱</span><p><strong>${safe(project.name)}</strong><small>Project · ${project.files} files</small></p></button><button data-search-route="tasks"><span>✓</span><p><strong>${safe(task.title)}</strong><small>Task · assigned to ${safe(task.assignee)}</small></p></button></div>`);
  const input = layer.querySelector("input"); input.focus(); input.addEventListener("input", () => layer.querySelectorAll(".workspace-search-results button").forEach(button => button.hidden = !button.textContent.toLowerCase().includes(input.value.toLowerCase())));
  layer.querySelector('[data-search-route="review"]').addEventListener("click", () => { close(); actions.openReview(); });
  layer.querySelector('[data-search-route="project"]').addEventListener("click", () => { close(); actions.openProject(); });
  layer.querySelector('[data-search-route="tasks"]').addEventListener("click", () => { close(); document.querySelector('[data-dash="tasks"]')?.click(); });
}

function openStorageUpgrade() { openLayer(`<p class="eyebrow"><span></span>Storage</p><h2>Upgrade project storage</h2><div class="storage-plans"><button><strong>50 GB</strong><span>₹799/month</span></button><button class="active"><strong>200 GB</strong><span>₹1,999/month</span></button><button><strong>1 TB</strong><span>Talk to us</span></button></div><p class="advanced-subcopy">Storage upgrades use the same protected payment flow as your content package.</p><button class="pill pill-hot" data-storage-request>Request upgrade →</button>`).layer.querySelector("[data-storage-request]").addEventListener("click", () => toast("Storage upgrade request saved for the owner.")); }
function openAccountMenu() { const client = getActiveClient(); const { layer, close } = openLayer(`<p class="eyebrow"><span></span>${safe(client.name)} account</p><h2>${safe(client.contactName)}</h2><div class="action-list"><button data-account-action="profile">● Edit profile</button><button data-account-action="notifications">◉ Notification preferences</button><button data-account-action="access">⌾ Security & access</button><button data-account-action="logout">← Sign out on this device</button></div>`); layer.querySelectorAll("[data-account-action]").forEach(button => button.addEventListener("click", () => { const action = button.dataset.accountAction; close(); if (action === "notifications") document.querySelector('[data-dash="notifications"]')?.click(); else toast(`${button.textContent.trim()} is ready for ${client.name}.`); })); }

export function enhanceProjectSuite(root, actions) {
  if (root.dataset.advancedProject || !root.querySelector(".project-content")) return;
  root.dataset.advancedProject = "true";
  const activeClient = getActiveClient(), activeProject = getActiveProject(activeClient);
  const sidebarUser = root.querySelector(".dash-user"); if (sidebarUser) { sidebarUser.querySelector("b").textContent = activeClient.contactInitials; sidebarUser.querySelector("span").innerHTML = `${safe(activeClient.contactName)}<small>${safe(activeClient.name)}</small>`; }
  const sidebarStorage = root.querySelector(".storage"); if (sidebarStorage) { sidebarStorage.querySelector("small").textContent = activeClient.storageLabel; sidebarStorage.querySelector("em").style.width = `${activeClient.storage}%`; }
  root.querySelector('[data-dash="projects"] b')?.replaceChildren(String(activeClient.projects.length));
  root.querySelector('[data-dash="reviews"] b')?.replaceChildren(String(activeClient.projects.filter(project => project.status === "In review" || project.status === "Editing").length));
  const projectHeader = root.querySelector(".project-header>div"); if (projectHeader) projectHeader.innerHTML = `<p>${safe(activeClient.name)}</p><h1>${safe(activeProject.name)}</h1>`;
  const projectStatus = root.querySelector(".project-header>.status"); if (projectStatus) projectStatus.innerHTML = `<i></i>${safe(activeProject.status)}`;
  const fileNames = activeProject.format.includes("9:16") ? [`${activeProject.name} · Reel 01`, `${activeProject.name} · Reel 02`, `${activeProject.name} · Cutdown`] : [`${activeProject.name} · Main Film`, `${activeProject.name} · Short Cut`, `${activeProject.name} · Master`];
  root.querySelectorAll(".file-row:not(.head) .file-name strong").forEach((name, index) => { const small = name.querySelector("small"); name.firstChild.textContent = fileNames[index] || `${activeProject.name} · ${index + 1}`; if (small) small.textContent = `${activeProject.format.includes("9:16") ? "1080 × 1920" : "1920 × 1080"} · ${32 + index * 5} sec`; });
  const tabs = root.querySelector(".project-tabs");
  const taskTab = document.createElement("button"); taskTab.dataset.projectTasks = ""; taskTab.innerHTML = `Tasks <b>${getTasks().filter(task => task.project === activeProject.name && task.status !== "Done").length}</b>`; tabs.append(taskTab);
  taskTab.addEventListener("click", () => { tabs.querySelectorAll("button").forEach(button => button.classList.toggle("active", button === taskTab)); renderTaskBoard(root.querySelector(".project-content"), false, activeProject.name, activeClient.id); });
  const activityTab = [...tabs.querySelectorAll("button")].find(button => button.textContent.trim().startsWith("Activity")); activityTab?.addEventListener("click", () => { tabs.querySelectorAll("button").forEach(button => button.classList.toggle("active", button === activityTab)); renderProjectActivity(root.querySelector(".project-content")); });
  const search = root.querySelector(".project-toolbar input"); search?.addEventListener("input", () => { const query = search.value.toLowerCase(); root.querySelectorAll(".folder-row article,.file-row:not(.head)").forEach(item => item.hidden = !item.textContent.toLowerCase().includes(query)); });
  const newFolder = [...root.querySelectorAll(".project-toolbar .pill-dark")].find(button => button.textContent.includes("New folder")); newFolder?.addEventListener("click", () => openFolderModal(root, activeProject.id));
  const shareTab = tabs.querySelector("[data-share-tab]");
  if (shareTab) {
    const privateShareTab = shareTab.cloneNode(true); shareTab.replaceWith(privateShareTab);
    privateShareTab.querySelector("b")?.replaceChildren(String(local.get(`cx_shares_${activeClient.id}_${activeProject.id}`, []).length));
    privateShareTab.addEventListener("click", () => { tabs.querySelectorAll("button").forEach(button => button.classList.toggle("active", button === privateShareTab)); renderClientShares(root, activeClient, activeProject); });
  }
  const shareButton = root.querySelector(".project-header-actions .pill-dark");
  if (shareButton) shareButton.onclick = event => { event.preventDefault(); openClientShareSpace(root, activeClient, activeProject); };
  root.querySelector(".hidden-upload")?.addEventListener("change", () => local.set(`cx_assets_${activeProject.id}`, local.get("cx_assets", [])));
  root.querySelectorAll("[data-file-detail]").forEach(button => button.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); openFileDetailPanel(button.dataset.fileDetail, activeClient, activeProject); }));
  root.querySelectorAll(".file-row:not(.head)").forEach(row => row.addEventListener("click", actions.openReview));
  root.querySelectorAll(".folder-row article>button").forEach(button => button.addEventListener("click", event => { event.stopPropagation(); const folder = button.closest("article").querySelector("strong").textContent; openFolderActions(folder); }));
}

function openFileDetailPanel(fileName, client, project) {
  const details = {
    "Launch Reel 01": { size:"184 MB", fps:"24 FPS", bitrate:"42 Mbps", resolution:"1080 × 1920", codec:"H.264", viewed:"Meera Kapoor · today 11:42 AM", seen:"4 views", downloads:"2 downloads", downloadedBy:["Abhinav Rai · today 12:03 PM", "Meera Kapoor · yesterday 6:20 PM"] },
    "Launch Reel 02": { size:"162 MB", fps:"30 FPS", bitrate:"38 Mbps", resolution:"1080 × 1920", codec:"H.264", viewed:"Sara Khan · yesterday 4:18 PM", seen:"2 views", downloads:"0 downloads", downloadedBy:["No downloads yet"] },
    "Brand Story Cut": { size:"231 MB", fps:"24 FPS", bitrate:"48 Mbps", resolution:"1080 × 1920", codec:"H.264", viewed:"Client team · Aug 1, 5:40 PM", seen:"7 views", downloads:"5 downloads", downloadedBy:["Abhinav Rai · Aug 1", "Ravi Verma · Aug 1", "Meera Kapoor · Aug 2"] },
  }[fileName] || { size:"—", fps:"—", bitrate:"—", resolution:"—", codec:"—", viewed:"Not seen yet", seen:"0 views", downloads:"0 downloads", downloadedBy:["No downloads yet"] };
  const key = `cx_file_controls_${project.id}_${fileName}`;
  const controls = { download:true, comments:true, mediaComments:true, highQualityMedia:true, ...local.get(key, {}) };
  const { layer, close } = openLayer(`<p class="eyebrow"><span></span>${safe(client.name)} · file control</p><h2>${safe(fileName)}</h2><div class="file-detail-grid">${[
    ["Size", details.size],
    ["FPS", details.fps],
    ["Bitrate", details.bitrate],
    ["Resolution", details.resolution],
    ["Codec", details.codec],
    ["Seen", details.seen],
  ].map(([label,value]) => `<article><span>${label}</span><strong>${safe(value)}</strong></article>`).join("")}</div><section class="file-audit-panel"><h3>View and download history</h3><p>Last seen by ${safe(details.viewed)}</p><ul>${details.downloadedBy.map(item => `<li>${safe(item)}</li>`).join("")}</ul></section><div class="advanced-settings"><label><span><strong>Allow downloads</strong><small>Turn off to stop clients/reviewers downloading this file.</small></span><input type="checkbox" data-file-control="download" ${controls.download ? "checked" : ""}></label><label><span><strong>Allow comments</strong><small>Turn off to make this file view-only.</small></span><input type="checkbox" data-file-control="comments" ${controls.comments ? "checked" : ""}></label><label><span><strong>Allow image/video comments</strong><small>Reviewers can attach visual references in comments.</small></span><input type="checkbox" data-file-control="mediaComments" ${controls.mediaComments ? "checked" : ""}></label><label><span><strong>Highest-quality comment uploads</strong><small>Preserve original quality where storage allows.</small></span><input type="checkbox" data-file-control="highQualityMedia" ${controls.highQualityMedia ? "checked" : ""}></label></div><button class="pill pill-hot" data-save-file-controls>Save file controls</button>`);
  layer.querySelector("[data-save-file-controls]").addEventListener("click", () => {
    const next = Object.fromEntries([...layer.querySelectorAll("[data-file-control]")].map(input => [input.dataset.fileControl, input.checked]));
    local.set(key, next);
    close();
    toast(`${fileName} controls saved.`);
  });
}

function openFolderModal(root, projectId) {
  const { layer, close } = openLayer(`<p class="eyebrow"><span></span>Project files</p><h2>Create a folder</h2><form class="advanced-form"><label>Folder name<input name="name" required placeholder="e.g. Music & sound effects"></label><label>Colour<input name="color" type="color" value="#4da3ff"></label><button class="pill pill-hot" type="submit">Create folder →</button></form>`);
  layer.querySelector("form").addEventListener("submit", event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); const key = `cx_folders_${projectId}`, folders = local.get(key, []); folders.push({ id: Date.now(), ...data }); local.set(key, folders); const row = root.querySelector(".folder-row"); row.insertAdjacentHTML("beforeend", `<article><span class="folder-icon" style="--project:${safe(data.color)}">▰</span><div><strong>${safe(data.name)}</strong><small>0 files · New</small></div><button>•••</button></article>`); close(); toast("Folder created inside this client project only."); });
}
function openFolderActions(folder) { const { layer, close } = openLayer(`<p class="eyebrow"><span></span>Folder</p><h2>${safe(folder)}</h2><div class="action-list"><button data-folder-action="rename">✎ Rename folder</button><button data-folder-action="share">↗ Create share link</button><button data-folder-action="download">↓ Download folder</button><button data-folder-action="archive">◇ Archive folder</button></div>`); layer.querySelectorAll("[data-folder-action]").forEach(button => button.addEventListener("click", () => { close(); toast(`${button.textContent.trim()} requested.`); })); }
function renderProjectActivity(container) { const client = getActiveClient(); const activity = local.get("cx_notifications", []).filter(item => item.meta?.clientId === client.id || (client.id === "apex" && !item.meta?.clientId)).slice(0, 10); container.innerHTML = `<div class="project-activity-head"><div><p class="eyebrow"><span></span>${safe(client.name)} history</p><h2>Project activity</h2><span>Uploads, reviews, payments and status changes remain isolated and auditable.</span></div><button class="pill pill-dark" data-export-activity>Export activity</button></div><div class="project-activity-timeline">${activity.length ? activity.map(item => `<article><span>${safe(item.type?.slice(0,2).toUpperCase() || "CX")}</span><div><strong>${safe(item.title)}</strong><p>${safe(item.message)}</p><small>${safe(item.created)}</small></div></article>`).join("") : '<div class="empty-state"><span>◷</span><h3>No recorded activity yet</h3><p>Private project events will appear here as your team works.</p></div>'}</div>`; container.querySelector("[data-export-activity]").addEventListener("click", () => toast(`${client.name} activity export prepared.`)); }

function openClientShareSpace(root, client, project) {
  const key = `cx_shares_${client.id}_${project.id}`;
  const { layer, close } = openLayer(`<p class="eyebrow"><span></span>${safe(client.name)} · protected share</p><h2>Share ${safe(project.name)}</h2><form class="advanced-form"><div class="client-share-preview" data-share-preview style="background:#17171b"><span>CX</span><strong>${safe(project.name)}</strong><small>Presented by Content X for ${safe(client.name)}</small></div><label>Share name<input name="name" required value="${safe(project.name)} Review"></label><div class="field-pair"><label>Layout<select name="layout"><option ${project.format.includes("9:16") ? "selected" : ""}>Reel</option><option ${!project.format.includes("9:16") ? "selected" : ""}>Grid</option><option>List</option></select></label><label>Background<input type="color" name="background" value="#17171b"></label></div><label>Access role<select name="role"><option>View only</option><option>Comment only</option><option selected>Contributor</option><option>Publisher</option></select></label><div class="share-permissions"><label><input type="checkbox" name="comments" checked><span>Comments</span></label><label><input type="checkbox" name="mediaComments" checked><span>Image/video comments</span></label><label><input type="checkbox" name="originalQuality" checked><span>Original quality</span></label><label><input type="checkbox" name="uploads"><span>Uploads</span></label><label><input type="checkbox" name="download"><span>Downloads</span></label><label><input type="checkbox" name="versions" checked><span>All versions</span></label></div><div class="field-pair"><label>Passcode<input name="passcode" placeholder="Optional"></label><label>Expires<input type="date" name="expires"></label></div><label class="share-approval"><input type="checkbox" name="approval" checked><span>New access requests require Content X approval.</span></label><button class="pill pill-hot" type="submit">Create protected link →</button></form>`);
  const colour = layer.querySelector('[name="background"]'); colour.addEventListener("input", () => layer.querySelector("[data-share-preview]").style.background = colour.value);
  layer.querySelector("form").addEventListener("submit", event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); const shares = local.get(key, []); shares.unshift({ id: Date.now(), ...data, clientId: client.id, projectId: project.id, code: `SH-${String(Date.now()).slice(-6)}`, status: "Active", views: 0, created: new Date().toLocaleString() }); local.set(key, shares); close(); renderClientShares(root, client, project); toast(`${client.name} protected share created.`); });
}

function renderClientShares(root, client, project) {
  const area = root.querySelector(".project-content"), shares = local.get(`cx_shares_${client.id}_${project.id}`, []);
  area.innerHTML = `<div class="project-toolbar"><div><button class="pill pill-hot" data-private-new-share>+ Create share</button></div></div><div class="share-intro"><span>↗</span><div><strong>${safe(client.name)} · private review spaces</strong><p>Each link belongs only to ${safe(project.name)} with separate access, downloads, comments and expiry settings.</p></div></div><div class="share-grid">${shares.length ? shares.map(share => `<article><div class="share-cover" style="background:${safe(share.background || "#17171b")}"><span class="brand-mark">CX</span><em>${safe(share.layout)}</em></div><div><span class="status approved"><i></i>${safe(share.status)}</span><h3>${safe(share.name)}</h3><p>${safe(share.role)} · ${share.views || 0} views</p><div><button data-private-copy-share="${safe(share.code)}">Copy link</button><button data-private-manage-share>Manage</button></div></div></article>`).join("") : '<div class="empty-state"><span>↗</span><h3>No shares for this client project</h3><p>Create a protected link without exposing another client’s files or settings.</p></div>'}</div>`;
  area.querySelector("[data-private-new-share]").addEventListener("click", () => openClientShareSpace(root, client, project));
  area.querySelectorAll("[data-private-copy-share]").forEach(button => button.addEventListener("click", () => { navigator.clipboard?.writeText(`https://contentx.local/share/${button.dataset.privateCopyShare}`); toast("Protected client share copied."); }));
  area.querySelectorAll("[data-private-manage-share]").forEach(button => button.addEventListener("click", () => toast("Client-specific share controls opened.")));
}

export function enhanceAdminSuite(root, actions) {
  if (root.dataset.advancedAdmin || !root.querySelector(".admin-content")) return;
  root.dataset.advancedAdmin = "true";
  const nav = root.querySelector(".admin-shell>aside nav");
  const tasks = getTasks();
  const workflow = document.createElement("button"); workflow.dataset.adminWorkflow = ""; workflow.innerHTML = `✓ Workflow & tasks <b>${tasks.filter(task => task.status !== "Done").length}</b>`; nav.append(workflow);
  workflow.addEventListener("click", () => { nav.querySelectorAll("button").forEach(button => button.classList.toggle("active", button === workflow)); renderOwnerWorkflow(root.querySelector(".admin-content")); });
  nav.querySelector('[data-admin="clients"]')?.addEventListener("click", () => renderClientDirectory(root.querySelector(".admin-content"), actions));
  nav.querySelector('[data-admin="team"]')?.addEventListener("click", () => renderTeamAccess(root.querySelector(".admin-content")));
  root.addEventListener("click", event => {
    if (event.target.closest("[data-add-client]")) openNewClientModal(actions, () => renderClientDirectory(root.querySelector(".admin-content"), actions));
    else if (event.target.textContent.trim().startsWith("+ Invite teammate")) openInviteTeammate();
    else if (event.target.textContent.trim().startsWith("Manage projects")) workflow.click();
    else if (event.target.textContent.trim().startsWith("Manage access")) openClientAccess(event.target.closest("article")?.querySelector("h3")?.textContent || "Client");
  });
}

function renderTeamAccess(content) {
  const clients = getClients();
  const members = local.get("cx_team_members", [
    { id:"owner", initials:"AR", name:"Abhinav Rai", email:"owner@contentx.local", role:"Owner", scope:"All clients", clients:["all"], projects:["all"], permissions:{ view:true, files:true, comment:true, upload:true, download:true, approve:true, payments:true, team:true } },
    { id:"editor", initials:"ED", name:"Senior Editor", email:"editor@contentx.local", role:"Editor", scope:"Assigned clients", clients:["apex", "nivara"], projects:["Launch Reel 01", "Founder Story Series"], permissions:{ view:true, files:true, comment:true, upload:true, download:false, approve:false, payments:false, team:false } },
    { id:"manager", initials:"PM", name:"Project Manager", email:"pm@contentx.local", role:"Project Manager", scope:"All active clients", clients:["all"], projects:["all"], permissions:{ view:true, files:true, comment:true, upload:true, download:true, approve:true, payments:false, team:false } },
  ]);
  const permissionLabels = [["view","View client posts"],["files","View files"],["comment","Comment"],["upload","Upload versions"],["download","Download files"],["approve","Approve versions"],["payments","View payments"],["team","Manage team"]];
  content.innerHTML = `<div class="team-access-head"><div><p class="eyebrow"><span></span>Company access control</p><h2>Team roles & permissions</h2><p>Control who can see client posts, files, projects, comments, downloads and admin features.</p></div><button class="pill pill-hot" data-team-add>+ Add team member</button></div><div class="role-template-grid">${[
    ["Owner","Everything, including payments and team access."],
    ["Project Manager","Clients, projects, comments, uploads and approvals."],
    ["Editor","Assigned projects, files, uploads and comments."],
    ["Reviewer","View and comment only on assigned projects."],
  ].map(([role, copy]) => `<article><strong>${role}</strong><p>${copy}</p><button data-role-template="${role}">Use template</button></article>`).join("")}</div><div class="team-access-table"><div class="team-access-row head"><span>Person</span><span>Role</span><span>Client/project scope</span><span>Permissions</span><span></span></div>${members.map(member => `<article class="team-access-row" data-team-member="${safe(member.id)}"><div><b>${safe(member.initials)}</b><p><strong>${safe(member.name)}</strong><small>${safe(member.email)}</small></p></div><label><span>Role</span><select data-team-role>${["Owner","Project Manager","Editor","Reviewer","Uploader","Finance"].map(role => `<option ${role === member.role ? "selected" : ""}>${role}</option>`).join("")}</select></label><label><span>Scope</span><select data-team-scope><option ${member.scope === "All clients" ? "selected" : ""}>All clients</option><option ${member.scope === "All active clients" ? "selected" : ""}>All active clients</option><option ${member.scope === "Assigned clients" ? "selected" : ""}>Assigned clients</option><option ${member.scope === "Specific projects only" ? "selected" : ""}>Specific projects only</option></select><small>${safe((member.clients || []).includes("all") ? "All client workspaces" : (member.clients || []).map(id => clients.find(client => client.id === id)?.name || id).join(", ") || "No client assigned")} · ${safe((member.projects || []).includes("all") ? "All projects" : (member.projects || []).join(", ") || "No project assigned")}</small></label><div class="team-permission-toggles">${permissionLabels.map(([key,label]) => `<label><input type="checkbox" data-team-permission="${key}" ${member.permissions?.[key] ? "checked" : ""}><span>${label}</span></label>`).join("")}</div><button data-save-team-member>Save</button></article>`).join("")}</div><aside class="team-security-note"><span>⌾</span><p><strong>Important production rule</strong><small>These controls model the owner interface. Real enforcement must happen on the server too, so a team member cannot bypass UI toggles and open another client's private data.</small></p></aside>`;
  content.querySelector("[data-team-add]").addEventListener("click", () => openInviteTeammate());
  content.querySelectorAll("[data-role-template]").forEach(button => button.addEventListener("click", () => toast(`${button.dataset.roleTemplate} permission template selected. Apply it when inviting a teammate.`)));
  content.querySelectorAll("[data-save-team-member]").forEach(button => button.addEventListener("click", () => {
    const row = button.closest("[data-team-member]");
    const member = members.find(item => item.id === row.dataset.teamMember);
    member.role = row.querySelector("[data-team-role]").value;
    member.scope = row.querySelector("[data-team-scope]").value;
    member.permissions = Object.fromEntries([...row.querySelectorAll("[data-team-permission]")].map(input => [input.dataset.teamPermission, input.checked]));
    local.set("cx_team_members", members);
    toast(`${member.name} permissions saved.`);
  }));
}

function renderClientDirectory(content, actions) {
  const clients = getClients();
  const activeProjects = clients.flatMap(client => client.projects).filter(project => project.status !== "Approved").length;
  content.innerHTML = `<div class="client-directory-head"><div><p class="eyebrow"><span></span>Separated client operations</p><h2>Client workspaces</h2><p>Every client has isolated projects, assets, tasks, permissions and billing records.</p></div><button class="pill pill-hot" data-new-client-space>+ New client</button></div><div class="client-directory-stats"><article><strong>${clients.length}</strong><span>Client workspaces</span></article><article><strong>${clients.reduce((sum, client) => sum + client.projects.length, 0)}</strong><span>Total projects</span></article><article><strong>${activeProjects}</strong><span>Active projects</span></article><article><strong>${clients.filter(client => client.status === "Active").length}</strong><span>Active retainers</span></article></div><div class="client-space-grid">${clients.map(client => `<article style="--client:${safe(client.color)}"><header><span>${safe(client.initials)}</span><div><h3>${safe(client.name)}</h3><p>${safe(client.contactName)} · ${safe(client.email)}</p></div><em>${safe(client.status)}</em></header><div><span><strong>${client.projects.length}</strong> projects</span><span><strong>${client.projects.filter(project => project.status === "In review").length}</strong> reviews</span><span><strong>${safe(client.storageLabel.split(" of ")[0])}</strong> storage</span></div><p>${safe(client.plan)} · ${safe(client.billing)}</p><footer><button data-open-client="${client.id}">Manage workspace →</button><button data-preview-client="${client.id}">Preview as client ↗</button></footer></article>`).join("")}</div>`;
  content.querySelector("[data-new-client-space]").addEventListener("click", () => openNewClientModal(actions, () => renderClientDirectory(content, actions)));
  content.querySelectorAll("[data-open-client]").forEach(button => button.addEventListener("click", () => renderClientHub(content, clients.find(client => client.id === button.dataset.openClient), actions)));
  content.querySelectorAll("[data-preview-client]").forEach(button => button.addEventListener("click", () => previewClient(clients.find(client => client.id === button.dataset.previewClient), actions)));
}

function renderClientHub(content, client, actions) {
  if (!client) return renderClientDirectory(content, actions);
  const tasks = getTasks().filter(task => task.clientId === client.id);
  content.innerHTML = `<button class="client-hub-back" data-client-directory>← All client workspaces</button><section class="client-hub-hero" style="--client:${safe(client.color)}"><div><span>${safe(client.initials)}</span><p><small>${safe(client.plan)}</small><strong>${safe(client.name)}</strong><em>${safe(client.contactName)} · ${safe(client.email)}</em></p></div><div><button class="pill pill-dark" data-client-preview>Preview as client</button><button class="pill pill-hot" data-client-add-project>+ New project</button></div></section><div class="client-hub-stats"><article><span>▱</span><p><strong>${client.projects.length}</strong><small>Projects</small></p></article><article><span>◌</span><p><strong>${client.projects.filter(project => project.status === "In review").length}</strong><small>Needs review</small></p></article><article><span>✓</span><p><strong>${tasks.filter(task => task.status !== "Done").length}</strong><small>Open tasks</small></p></article><article><span>◇</span><p><strong>${safe(client.storageLabel.split(" of ")[0])}</strong><small>Storage used</small></p></article></div><div class="client-hub-layout"><section><div class="dash-section-head"><div><h2>${safe(client.name)} projects</h2><p>Only this client's records are shown here.</p></div></div><div class="client-project-list">${client.projects.map(project => `<article><span style="--project:${safe(project.color)}">▰</span><div><strong>${safe(project.name)}</strong><small>${safe(project.type)} · ${safe(project.format)}</small></div><em class="status ${project.status.toLowerCase().replaceAll(" ", "-")}"><i></i>${safe(project.status)}</em><p>${project.progress}%</p><button data-hub-project="${project.id}">Open →</button></article>`).join("")}</div><div class="client-team-panel"><div class="dash-section-head"><div><h2>Assigned Content X team</h2><p>Separate responsibilities for this account.</p></div></div><div>${["Abhinav","Sara","Ravi","Priya"].map(name => `<label><span>${name.slice(0,2).toUpperCase()}</span><p><strong>${name}</strong><small>${({Abhinav:"Editor & owner",Sara:"Scriptwriter",Ravi:"Social manager",Priya:"Designer"})[name]}</small></p><input type="checkbox" data-client-team="${name}" ${client.team.includes(name) ? "checked" : ""}></label>`).join("")}</div></div></section><aside><div class="client-account-card"><p class="eyebrow"><span></span>Account controls</p><h3>Access and billing</h3><label>Status<select data-client-status><option ${client.status === "Active" ? "selected" : ""}>Active</option><option ${client.status === "Paused" ? "selected" : ""}>Paused</option><option ${client.status === "Project complete" ? "selected" : ""}>Project complete</option></select></label><label>Package<input value="${safe(client.plan)}" data-client-plan></label><label>Billing<input value="${safe(client.billing)}" data-client-billing></label><label>Renewal<input value="${safe(client.renewal)}" data-client-renewal></label><label class="client-email-toggle"><span><strong>Activity emails</strong><small>Uploads, comments and approvals</small></span><input type="checkbox" data-client-email ${client.notificationEmail ? "checked" : ""}></label><button class="pill pill-hot" data-save-client>Save client settings</button></div><div class="client-isolation-note"><span>⌾</span><p><strong>Data isolation active</strong><small>Projects, files, comments, tasks and access settings use this client's own workspace records.</small></p></div></aside></div>`;
  content.querySelector("[data-client-directory]").addEventListener("click", () => renderClientDirectory(content, actions));
  content.querySelector("[data-client-preview]").addEventListener("click", () => previewClient(client, actions));
  content.querySelector("[data-client-add-project]").addEventListener("click", () => openClientProjectModal(client, actions, updated => renderClientHub(content, updated, actions)));
  content.querySelectorAll("[data-hub-project]").forEach(button => button.addEventListener("click", () => { local.set("cx_active_client", client.id); local.set("cx_active_project", button.dataset.hubProject); local.set("cx_owner_preview", true); actions.openProject(); }));
  content.querySelectorAll("[data-client-team]").forEach(input => input.addEventListener("change", () => { const clients = getClients(), record = clients.find(item => item.id === client.id); record.team = [...content.querySelectorAll("[data-client-team]:checked")].map(item => item.dataset.clientTeam); saveClients(clients); toast(`${client.name} team assignments updated.`); }));
  content.querySelector("[data-save-client]").addEventListener("click", () => { const clients = getClients(), record = clients.find(item => item.id === client.id); record.status = content.querySelector("[data-client-status]").value; record.plan = content.querySelector("[data-client-plan]").value; record.billing = content.querySelector("[data-client-billing]").value; record.renewal = content.querySelector("[data-client-renewal]").value; record.notificationEmail = content.querySelector("[data-client-email]").checked; saveClients(clients); toast(`${client.name} settings saved separately.`); renderClientHub(content, record, actions); });
}

function previewClient(client, actions) {
  if (!client) return;
  local.set("cx_active_client", client.id); local.set("cx_active_project", client.projects[0]?.id); local.set("cx_owner_preview", true);
  local.set("cx_access", { email: client.email, plan: client.plan, paid: true, demo: true, clientId: client.id });
  actions.openDashboard(true);
}

function openNewClientModal(actions, onComplete) {
  const { layer, close } = openLayer(`<p class="eyebrow"><span></span>Private workspace</p><h2>Create a new client</h2><form class="advanced-form"><label>Business name<input name="name" required></label><label>Primary contact<input name="contactName" required></label><label>Email<input name="email" type="email" required></label><label>Package<select name="plan"><option>Creator Starter</option><option>Content Growth</option><option>Full-Stack Social</option><option>Custom package</option></select></label><button class="pill pill-hot" type="submit">Create isolated client workspace →</button></form>`);
  layer.querySelector("form").addEventListener("submit", event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); const clients = getClients(), id = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `client-${Date.now()}`; const client = { id, ...data, initials: data.name.split(/\s+/).map(word => word[0]).join("").slice(0,2).toUpperCase(), contactInitials: data.contactName.split(/\s+/).map(word => word[0]).join("").slice(0,2).toUpperCase(), status: "Active", color: "#56d6a5", storage: 0, storageLabel: "0 GB of 20 GB", billing: "To configure", renewal: "To configure", notificationEmail: true, team: ["Abhinav"], projects: [] }; clients.push(client); saveClients(clients); close(); toast(`${client.name} now has a separate client workspace.`); onComplete?.(client); });
}

function renderOwnerWorkflow(content) {
  const tasks = getTasks();
  const people = ["Abhinav", "Meera", "Sara", "Ravi", "Priya"];
  content.innerHTML = `<div class="owner-workload"><section><p class="eyebrow"><span></span>Capacity this week</p><h2>Team workload</h2><div>${people.map(name => { const count = tasks.filter(task => task.assignee === name && task.status !== "Done").length; return `<article><span>${name.slice(0,2).toUpperCase()}</span><p><strong>${name}</strong><small>${count} active task${count === 1 ? "" : "s"}</small></p><i><em style="width:${Math.min(100, count * 28)}%"></em></i><b>${count > 3 ? "At capacity" : count > 1 ? "Balanced" : "Available"}</b></article>`; }).join("")}</div></section><aside><p class="eyebrow"><span></span>Workflow health</p><h2>On-time delivery</h2><strong>92%</strong><span>+6% this month</span><dl><div><dt>Reviews due today</dt><dd>2</dd></div><div><dt>Blocked tasks</dt><dd>0</dd></div><div><dt>Waiting on client</dt><dd>3</dd></div></dl></aside></div><div class="owner-task-host"></div>`;
  renderTaskBoard(content.querySelector(".owner-task-host"), true);
}

function openInviteTeammate() {
  const clients = getClients();
  const { layer, close } = openLayer(`<p class="eyebrow"><span></span>Team access</p><h2>Invite a teammate</h2><form class="advanced-form"><label>Name<input name="name" required></label><label>Email<input name="email" type="email" required></label><label>Role<select name="role"><option>Editor</option><option>Project Manager</option><option>Reviewer</option><option>Uploader</option><option>Finance</option><option>Owner</option></select></label><label>Client access<select name="clientScope"><option>Assigned clients only</option><option>All active clients</option><option>Specific projects only</option><option>No client data yet</option></select></label><div class="permission-grid"><label><input type="checkbox" checked> View assigned clients</label><label><input type="checkbox" checked> View files</label><label><input type="checkbox" checked> Comment</label><label><input type="checkbox" checked> Upload versions</label><label><input type="checkbox"> Download files</label><label><input type="checkbox"> Approve versions</label><label><input type="checkbox"> View payments</label><label><input type="checkbox"> Manage team</label></div><label>Assign clients<select name="clients" multiple>${clients.map(client => `<option value="${safe(client.id)}">${safe(client.name)}</option>`).join("")}</select><small>Hold Ctrl/Cmd to select more than one.</small></label><button class="pill pill-hot" type="submit">Create invitation →</button></form>`);
  layer.querySelector("form").addEventListener("submit", event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); const invites = local.get("cx_team_invites", []); invites.unshift({ id: Date.now(), ...data, status: "Invitation ready", created: new Date().toLocaleString() }); local.set("cx_team_invites", invites); close(); toast("Team invitation saved in the owner workspace."); });
}

function openClientAccess(client) {
  const { layer, close } = openLayer(`<p class="eyebrow"><span></span>Client permissions</p><h2>${safe(client)}</h2><div class="advanced-settings"><label><span><strong>Workspace access</strong><small>Allow this client to sign in</small></span><input type="checkbox" checked></label><label><span><strong>Upload source files</strong><small>Add footage and brand assets</small></span><input type="checkbox" checked></label><label><span><strong>Download approved masters</strong><small>Only after final approval</small></span><input type="checkbox" checked></label><label><span><strong>Invite reviewers</strong><small>Create external review links</small></span><input type="checkbox"></label></div><button class="pill pill-hot" data-save-client-access>Save permissions</button>`);
  layer.querySelector("[data-save-client-access]").addEventListener("click", () => { close(); toast(`${client} permissions updated.`); });
}
