import { enhanceFileLibrary, fileToolbar, hasTimestamp } from "./studio-workspace.js?v=frame-native-3";
import { openReviewRoom } from "./review-room.js?v=frame-account-1";
import { renderWorkspaceAccountPanel } from "./account.js?v=frame-native-3";

const UPLOAD_API = "/api/uploads";
const BRIEF_API = "/api/briefs";

const escapeHTML = value => String(value ?? "").replace(/[&<>'"]/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[character]);
const formatBytes = bytes => {
  const value = Number(bytes || 0);
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(value >= 10 * 1024 ** 3 ? 0 : 1)} GB`;
  if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(value >= 10 * 1024 ** 2 ? 0 : 1)} MB`;
  if (value >= 1024) return `${Math.round(value / 1024)} KB`;
  return `${value} B`;
};
const fileGlyph = type => String(type || "").startsWith("video/") ? "▶" : String(type || "").startsWith("image/") ? "▧" : String(type || "").startsWith("audio/") ? "♫" : "◇";
const formatDate = value => value ? new Date(Number(value)).toLocaleDateString([], { dateStyle:"medium" }) : "—";
const SAFE_WORKSPACE_EXTENSIONS = new Set(["mp4","mov","m4v","webm","mkv","avi","mp3","wav","m4a","aac","flac","ogg","jpg","jpeg","png","webp","gif","heic","heif","pdf","txt","md","csv","srt","vtt"]);
let workspaceRenderVersion = 0;

async function api(url, options = {}) {
  const response = await fetch(url, { credentials:"same-origin", ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "This workspace request could not be completed.");
  return body;
}

const bearerHeaders = (token, json = false) => ({ ...(token ? { Authorization:`Bearer ${token}` } : {}), ...(json ? { "Content-Type":"application/json" } : {}) });

export async function renderClientWorkspace(root, actions, route) {
  const renderVersion = ++workspaceRenderVersion;
  const existingShell = root.querySelector(".workspace-shell");
  root.className = "workspace-app";
  root.setAttribute("aria-busy", "true");
  if (existingShell) existingShell.classList.add("is-refreshing");
  else root.innerHTML = workspaceOpeningShell();
  try {
    const params = new URLSearchParams(route.split("?")[1] || "");
    const accountPanel = params.get("panel") === "account";
    const accountView = params.get("view") || "profile";
    const account = await api(`${UPLOAD_API}?action=account-projects`, { cache:"no-store" });
    const projects = account.projects || [];
    const requested = params.get("project");
    const selected = projects.find(project => project.project_id === requested) || projects[0] || null;
    const [projectData, shareData, commentData] = selected && !accountPanel ? await Promise.all([
      api(`${UPLOAD_API}?action=project&projectId=${encodeURIComponent(selected.project_id)}`, { cache:"no-store" }),
      api(`${UPLOAD_API}?action=shares&projectId=${encodeURIComponent(selected.project_id)}`, { cache:"no-store" }),
      api(`${UPLOAD_API}?action=comments&projectId=${encodeURIComponent(selected.project_id)}`, { cache:"no-store" }),
    ]) : [{ project:null, files:[], permissions:{ canUpload:false } }, { shares:[] }, { comments:[] }];
    if (renderVersion !== workspaceRenderVersion) return;
    renderWorkspaceShell(root, actions, account.user, projects, selected, projectData, shareData.shares || [], account.storage || {}, commentData.comments || [], accountPanel);
    if (accountPanel) await renderWorkspaceAccountPanel(root.querySelector("[data-workspace-account]"), actions, accountView);
    root.removeAttribute("aria-busy");
  } catch (error) {
    if (renderVersion !== workspaceRenderVersion) return;
    root.innerHTML = `<main class="workspace-error"><span>!</span><h1>Workspace unavailable.</h1><p>${escapeHTML(error.message)}</p><a class="workspace-button primary" href="#account">Return to account</a></main>`;
    root.removeAttribute("aria-busy");
  }
}

function workspaceOpeningShell() {
  return `<div class="workspace-shell workspace-opening-shell" aria-label="Opening workspace">
    <aside class="workspace-rail"><span class="workspace-rail-brand">CX</span><nav><span></span><span></span><span></span></nav></aside>
    <aside class="workspace-sidebar"><div class="workspace-opening-brand"></div><div class="workspace-opening-nav"></div><div class="workspace-opening-nav short"></div><div class="workspace-opening-projects"></div></aside>
    <main class="workspace-main"><header class="workspace-topbar"><span class="workspace-opening-line compact"></span><span class="workspace-opening-line action"></span></header><section class="workspace-opening-content"><span class="workspace-opening-line title"></span><span class="workspace-opening-line subtitle"></span><div class="workspace-opening-toolbar"></div><div class="workspace-opening-cards"><i></i><i></i><i></i></div></section></main>
  </div>`;
}

function renderWorkspaceShell(root, actions, user, projects, selected, projectData, shares, storage, comments, accountPanel = false) {
  const project = projectData.project;
  const files = projectData.files || [];
  const folders = projectData.folders || [];
  const used = Number(storage.usedBytes || 0);
  const quota = Number(storage.quotaBytes || 50 * 1024 ** 3);
  const percent = Math.min(100, Math.round(used / quota * 100));
  root.innerHTML = `<div class="workspace-shell">
    <aside class="workspace-rail" aria-label="Workspace tools">
      <a class="workspace-rail-brand" href="#home" aria-label="Content X home">CX</a>
      <nav>
        <a class="${accountPanel ? "" : "active"}" href="#workspace" aria-label="Projects" title="Projects">▱</a>
        <button type="button" data-focus-files aria-label="Search project files" title="Search">⌕</button>
        <a class="${accountPanel ? "active" : ""}" href="#workspace?panel=account" aria-label="Account and notifications" title="Account">◎</a>
      </nav>
      <a class="workspace-rail-user" href="#workspace?panel=account" aria-label="Open account" title="Account">${escapeHTML(user.name.slice(0,1).toUpperCase())}</a>
    </aside>
    <aside class="workspace-sidebar">
      <a class="workspace-brand" href="#home"><span>CX</span><b>Content X</b></a>
      <nav><a class="${accountPanel ? "" : "active"}" href="#workspace"><span>▱</span>Projects</a><a class="${accountPanel ? "active" : ""}" href="#workspace?panel=account"><span>◎</span>Account</a><button type="button" data-create-free-project><span>＋</span>New project</button></nav>
      <label class="workspace-project-search"><span>⌕</span><input type="search" placeholder="Search projects" aria-label="Search projects" data-project-nav-search></label>
      <div class="workspace-project-nav"><small>YOUR PROJECTS</small>${projects.map(item => `<a class="${selected?.project_id === item.project_id ? "active" : ""}" href="#workspace?project=${encodeURIComponent(item.project_id)}" data-project-nav-item><span>${escapeHTML((item.name || "P").slice(0,1).toUpperCase())}</span><b>${escapeHTML(item.name)}</b><small>${Number(item.file_count || 0)} file${Number(item.file_count || 0) === 1 ? "" : "s"} · ${formatBytes(item.total_bytes || 0)}</small></a>`).join("") || `<p>Create a free project to begin.</p>`}</div>
      ${project && !accountPanel ? `<div class="workspace-tree"><div><small>PROJECT FILES</small><button type="button" data-create-folder title="New folder">＋</button></div><button class="active" type="button" data-folder-id=""><span>⌂</span><b>Project root</b><em>${files.filter(file => !file.folder_id).length}</em></button>${folderTreeNodes(folders)}</div>` : ""}
      <div class="workspace-storage"><div><b>Free storage</b><small>${formatBytes(used)} of ${formatBytes(quota)}</small></div><i><em style="width:${percent}%"></em></i></div>
      <div class="workspace-user"><span>${escapeHTML(user.name.slice(0,1).toUpperCase())}</span><div><b>${escapeHTML(user.name)}</b><small>${escapeHTML(user.email)}</small></div><a href="#workspace?panel=account" aria-label="Account settings">•••</a></div>
    </aside>
    <main class="workspace-main">
      <header class="workspace-topbar"><button type="button" data-workspace-menu aria-label="Open project menu">☰</button><div><span>Workspace</span>${accountPanel ? `<b>/ Account</b>` : project ? `<b>/ ${escapeHTML(project.name)}</b>` : ""}</div><div>${accountPanel ? `<a class="workspace-button" href="#workspace">View projects</a>` : project ? `<button class="workspace-button" type="button" data-share-project>Share</button><button class="workspace-button primary" type="button" data-upload-files>Upload files</button>` : `<button class="workspace-button primary" type="button" data-create-free-project>Create project</button>`}</div></header>
      ${accountPanel ? `<section class="workspace-account-surface" data-workspace-account></section>` : project ? projectSurface(project, files, folders, projectData.permissions?.canUpload !== false, comments, true, projectData.revisionPolicy, true) : emptyWorkspace()}
    </main>
  </div><input type="file" multiple hidden data-workspace-picker><div data-workspace-layer></div>`;

  root.querySelector("[data-workspace-menu]")?.addEventListener("click", () => root.querySelector(".workspace-sidebar").classList.toggle("open"));
  root.querySelector(".workspace-main")?.addEventListener("click", () => root.querySelector(".workspace-sidebar")?.classList.remove("open"));
  root.querySelectorAll("[data-create-free-project]").forEach(button => button.addEventListener("click", () => openCreateProjectModal(root, actions)));
  const projectSearch = root.querySelector("[data-project-nav-search]");
  projectSearch?.addEventListener("input", () => {
    const query = projectSearch.value.trim().toLowerCase();
    root.querySelectorAll("[data-project-nav-item]").forEach(item => { item.hidden = Boolean(query) && !item.textContent.toLowerCase().includes(query); });
  });
  root.querySelector("[data-focus-files]")?.addEventListener("click", () => (root.querySelector("[data-file-search]") || projectSearch)?.focus());
  if (accountPanel || !project) return;
  enhanceFileLibrary(root, files, comments);
  bindFolderBrowser(root, project.id, folders, actions);
  const picker = root.querySelector("[data-workspace-picker]");
  root.querySelectorAll("[data-upload-files]").forEach(button => button.addEventListener("click", () => { picker.dataset.replaceFile = ""; picker.click(); }));
  root.querySelector("[data-project-drop]")?.addEventListener("click", () => { picker.dataset.replaceFile = ""; picker.click(); });
  picker.addEventListener("change", async () => {
    await uploadSelectedFiles(root, project.id, "", [...picker.files], picker.dataset.replaceFile || "", project.maxFileSize, project.maxVideoSeconds || project.max_video_seconds || 0);
    picker.value = "";
    actions.refreshRoute();
  });
  bindDropTarget(root.querySelector("[data-project-drop]"), async dropped => {
    await uploadSelectedFiles(root, project.id, "", dropped, "", project.maxFileSize, project.maxVideoSeconds || project.max_video_seconds || 0);
    actions.refreshRoute();
  });
  root.querySelectorAll("[data-file-card]").forEach(card => {
    const fileId = card.dataset.fileId;
    const assetId = card.dataset.assetId;
    card.querySelector("[data-file-open]").addEventListener("click", () => openVersions(root, project.id, assetId, "", true, actions.refreshRoute));
    card.querySelector("[data-new-version]")?.addEventListener("click", () => { picker.dataset.replaceFile = fileId; picker.click(); });
    bindDropTarget(card, async dropped => {
      await uploadSelectedFiles(root, project.id, "", dropped.slice(0, 1), fileId, project.maxFileSize, project.maxVideoSeconds || project.max_video_seconds || 0);
      actions.refreshRoute();
    }, "is-version-drop");
  });
  root.querySelectorAll("[data-buy-revision]").forEach(button => button.addEventListener("click", () => {
    const longform = button.dataset.revisionService === "longform";
    const price = longform ? 500 : 300;
    actions.openCheckout({
      id:longform ? "revision_long" : "revision_short",
      name:`Extra revision round · ${button.dataset.fileName}`,
      price,
      quantity:1,
      billing:"one_off",
      unit:"project",
      badge:"Extra revision for this video",
      contentType:longform ? "longform" : "video",
      projectId:project.id,
      assetId:button.dataset.assetId,
      returnTo:`workspace?project=${project.id}`,
      revisionPurchase:true,
      features:["1 additional revision round", `Attached to ${button.dataset.fileName}`, "Timestamped feedback and version history stay in this workspace"],
    });
  }));
  root.querySelector("[data-share-project]")?.addEventListener("click", () => openSharePanel(root, project, shares));
  bindComments(root, project.id, "", actions, true);
}

function folderTreeNodes(folders, parentId = null, depth = 0) {
  return folders.filter(folder => (folder.parent_id || null) === parentId).map(folder => `<div class="workspace-tree-node" style="--depth:${depth}"><button type="button" draggable="true" data-folder-id="${escapeHTML(folder.id)}" data-folder-drag="${escapeHTML(folder.id)}"><span>▸</span><b>${escapeHTML(folder.name)}</b><em>${Number(folder.asset_count || 0)}</em></button>${folderTreeNodes(folders, folder.id, depth + 1)}</div>`).join("");
}

function projectSurface(project, files, folders, canUpload, comments = [], canManageComments = false, revisionPolicy = null, canManageFolders = false) {
  const rootFolders = folders.filter(folder => !folder.parent_id);
  return `<section class="workspace-project-head"><div><p>PROJECT</p><h1>${escapeHTML(project.name)}</h1><span>${files.length} active file${files.length === 1 ? "" : "s"} · Updated ${formatDate(project.updatedAt)}</span></div><div class="workspace-view-toggle" aria-label="File layout"><button class="active" type="button" data-file-view="grid" aria-pressed="true">Grid</button><button type="button" data-file-view="list" aria-pressed="false">List</button></div></section>
    <section class="workspace-browser"><div class="workspace-browser-head"><nav aria-label="Folder breadcrumb"><button class="active" type="button" data-folder-id="">${escapeHTML(project.name)}</button><span data-folder-crumbs></span></nav><div>${canManageFolders ? `<button type="button" data-create-folder>＋ Folder</button>` : ""}${canUpload ? `<button class="workspace-button primary" type="button" data-upload-files>↑ Upload</button>` : ""}</div></div><div class="workspace-folder-grid"><button class="workspace-folder-card root-target" type="button" data-folder-id=""><span>⌂</span><div><b>Project root</b><small>${files.filter(file => !file.folder_id).length} assets</small></div><em>Drop here</em></button>${rootFolders.map(folder => folderCard(folder)).join("")}</div></section>
    <section class="workspace-dropbar ${canUpload ? "" : "disabled"}" data-project-drop title="Executables, archives, scripts, HTML and SVG are blocked"><span>↑</span><div><b>${canUpload ? "Drop to upload" : "View only"}</b><small>${canUpload ? "Or drag assets into a folder." : "Uploads are disabled for this link."}</small></div></section>
    <section class="workspace-files"><header><div><h2>Assets</h2><span data-visible-folder-label>Project root</span></div></header>${fileToolbar()}<div class="workspace-file-grid" data-active-folder="">${files.length ? files.map(file => fileCard(file, canUpload, revisionPolicy)).join("") : `<div class="workspace-empty-files"><span>↑</span><h3>No files yet</h3><p>${canUpload ? "Drop footage or references here." : "No files shared yet."}</p></div>`}</div></section>
    ${commentsPanel(comments, canManageComments)}
    <section class="workspace-queue" data-workspace-queue></section>`;
}

function folderCard(folder) {
  return `<button class="workspace-folder-card" type="button" draggable="true" data-folder-id="${escapeHTML(folder.id)}" data-folder-drag="${escapeHTML(folder.id)}"><span>▰</span><div><b>${escapeHTML(folder.name)}</b><small>${Number(folder.asset_count || 0)} assets</small></div><em>•••</em></button>`;
}

function bindFolderBrowser(root, projectId, folders, actions) {
  const grid = root.querySelector(".workspace-file-grid");
  const folderGrid = root.querySelector(".workspace-folder-grid");
  if (!grid || !folderGrid) return;
  const byId = new Map(folders.map(folder => [folder.id, folder]));
  let activeFolder = sessionStorage.getItem(`cx_active_folder_${projectId}`) || "";
  if (activeFolder && !byId.has(activeFolder)) activeFolder = "";
  const signalLibrary = () => (root.querySelector("[data-file-search]") || grid).dispatchEvent(new Event("input", { bubbles:true }));
  const paintFolders = () => {
    const children = folders.filter(folder => (folder.parent_id || "") === activeFolder);
    const rootCount = [...grid.querySelectorAll("[data-file-card]")].filter(card => (card.dataset.folderId || "") === activeFolder).length;
    folderGrid.innerHTML = `<button class="workspace-folder-card root-target" type="button" data-folder-id=""><span>⌂</span><div><b>Project root</b><small>Drop to move out</small></div><em>↖</em></button>${children.map(folderCard).join("")}`;
    root.querySelectorAll(".workspace-tree [data-folder-id]").forEach(button => button.classList.toggle("active", button.dataset.folderId === activeFolder));
    const chain = []; let cursor = byId.get(activeFolder);
    while (cursor) { chain.unshift(cursor); cursor = byId.get(cursor.parent_id); }
    root.querySelector("[data-folder-crumbs]").innerHTML = chain.map(folder => `<i>/</i><button type="button" data-folder-id="${escapeHTML(folder.id)}">${escapeHTML(folder.name)}</button>`).join("");
    const label = root.querySelector("[data-visible-folder-label]"); if (label) label.textContent = activeFolder ? byId.get(activeFolder)?.name || "Folder" : "Project root";
    grid.dataset.activeFolder = activeFolder;
    grid.dataset.folderAssetCount = String(rootCount);
    sessionStorage.setItem(`cx_active_folder_${projectId}`, activeFolder);
    bindFolderControls(); signalLibrary();
  };
  const setActive = folderId => { activeFolder = folderId || ""; paintFolders(); };
  const move = async (payload, targetId) => {
    const isAsset = payload.type === "asset";
    await api(UPLOAD_API, { method:"PATCH", headers:bearerHeaders("", true), body:JSON.stringify(isAsset ? { action:"move-assets", projectId, folderId:targetId || null, assetIds:[payload.id] } : { action:"move-folder", projectId, folderId:payload.id, parentId:targetId || null }) });
    actions.refreshRoute();
  };
  const payloadFrom = event => {
    const asset = event.dataTransfer.getData("application/x-contentx-asset");
    const folder = event.dataTransfer.getData("application/x-contentx-folder");
    return asset ? { type:"asset", id:asset } : folder ? { type:"folder", id:folder } : null;
  };
  function bindFolderControls() {
    root.querySelectorAll("[data-folder-id]").forEach(button => {
      if (button.dataset.folderBound) return; button.dataset.folderBound = "true";
      button.addEventListener("click", event => { if (!event.defaultPrevented) setActive(button.dataset.folderId); });
      button.addEventListener("dragover", event => { if (![...event.dataTransfer.types].some(type => type.includes("contentx"))) return; event.preventDefault(); button.classList.add("is-drop-target"); });
      button.addEventListener("dragleave", () => button.classList.remove("is-drop-target"));
      button.addEventListener("drop", async event => { const payload = payloadFrom(event); if (!payload) return; event.preventDefault(); event.stopPropagation(); button.classList.remove("is-drop-target"); try { await move(payload, button.dataset.folderId); } catch (error) { alert(error.message); } });
    });
    root.querySelectorAll("[data-folder-drag]").forEach(button => button.addEventListener("dragstart", event => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("application/x-contentx-folder", button.dataset.folderDrag); }));
  }
  root.querySelectorAll("[data-file-card]").forEach(card => card.addEventListener("dragstart", event => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("application/x-contentx-asset", card.dataset.assetId); card.classList.add("is-moving"); }));
  root.querySelectorAll("[data-file-card]").forEach(card => card.addEventListener("dragend", () => card.classList.remove("is-moving")));
  root.querySelectorAll("[data-create-folder]").forEach(button => button.addEventListener("click", async () => { const name = prompt("Folder name"); if (!name?.trim()) return; try { await api(UPLOAD_API, { method:"POST", headers:bearerHeaders("", true), body:JSON.stringify({ action:"create-folder", projectId, parentId:activeFolder || null, name:name.trim() }) }); actions.refreshRoute(); } catch (error) { alert(error.message); } }));
  paintFolders();
}

function fileCard(file, canUpload, revisionPolicy = null) {
  const version = Number(file.version_number || 1);
  const count = Number(file.version_count || 1);
  const assetId = String(file.asset_id || file.id);
  const purchased = Number(revisionPolicy?.purchasedByAsset?.[assetId] || 0);
  const allowed = Number(revisionPolicy?.included || 0) + purchased;
  const used = Math.max(0, count - 1);
  const isVideo = String(file.content_type || "").startsWith("video/");
  const exhausted = Boolean(revisionPolicy && isVideo && used >= allowed);
  const revisionStatus = revisionPolicy && isVideo
    ? `<div class="workspace-revision-status ${exhausted ? "is-exhausted" : ""}"><span>${Math.min(used, allowed)} of ${allowed} revision round${allowed === 1 ? "" : "s"} used</span>${exhausted ? `<button type="button" data-buy-revision data-asset-id="${escapeHTML(assetId)}" data-file-name="${escapeHTML(file.original_name)}" data-revision-service="${revisionPolicy.service}">Buy another revision · ${revisionPolicy.service === "longform" ? "₹500" : "₹300"}</button>` : `<small>${allowed - used} round${allowed - used === 1 ? "" : "s"} remaining</small>`}</div>`
    : "";
  return `<article class="workspace-file-card ${canUpload ? "" : "view-only"}" draggable="${canUpload}" data-file-card data-file-id="${escapeHTML(file.id)}" data-asset-id="${escapeHTML(assetId)}" data-folder-id="${escapeHTML(file.folder_id || "")}"><button class="workspace-file-preview" type="button" data-file-open><span>${fileGlyph(file.content_type)}</span><em>v${version}</em>${canUpload ? "<i>Drop replacement here</i>" : ""}</button><div class="workspace-file-info"><div><strong title="${escapeHTML(file.original_name)}">${escapeHTML(file.original_name)}</strong><small>${formatBytes(file.size_bytes)} · ${formatDate(file.completed_at)}</small></div>${canUpload ? '<button type="button" data-new-version aria-label="Upload next version">＋</button>' : ""}</div><footer><span>${count} version${count === 1 ? "" : "s"}</span><b>Ready</b></footer>${revisionStatus}</article>`;
}

function emptyWorkspace() {
  return `<section class="workspace-zero"><span>◇</span><h1>Your free review workspace is ready.</h1><p>Create a project, upload files, then send a private review link to your client. Every free account starts with 50 GB storage.</p><button class="workspace-button primary" type="button" data-create-free-project>Create first project</button></section>`;
}

async function openVersions(root, projectId, assetId, token, canManage = false, onChange = () => {}) {
  return openReviewRoom({ layer:root.querySelector("[data-workspace-layer]"), api, headers:json => bearerHeaders(token, json), projectId, assetId, canManage, onChange });
}

async function openSharePanel(root, project, shares) {
  const layer = root.querySelector("[data-workspace-layer]");
  layer.innerHTML = `<div class="workspace-modal-backdrop"><section class="workspace-share-modal"><button type="button" data-close-share>×</button><p class="workspace-kicker">SHARE PROJECT</p><h2>Create a review link</h2><p>One secure link can include every current project video, plus future versions. The random secret URL is copied immediately when created.</p><form><label>Link label<input name="name" value="Client review" maxlength="100" placeholder="Client review, agency review, final approval..."></label><label class="workspace-switch"><span><b>Allow uploads</b><small>People with the link can add files and create new versions.</small></span><input type="checkbox" name="allowUploads"><i></i></label><label>Link expiry<select name="expiryDays"><option value="0">Never expires</option><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option></select></label><p role="alert" data-share-error hidden></p><button class="workspace-button primary" type="submit">Create & copy share link</button></form><div class="workspace-existing-shares"><h3>Manage links</h3><small class="workspace-share-safe-note">Secret URLs are only shown at creation. If a client loses one, disable it and create a fresh random link.</small>${shares.length ? shares.map(shareRow).join("") : `<p>No share links created yet.</p>`}</div></section></div>`;
  const close = () => { layer.innerHTML = ""; };
  layer.querySelector("[data-close-share]").addEventListener("click", close);
  layer.querySelector(".workspace-modal-backdrop").addEventListener("click", event => { if (event.target === event.currentTarget) close(); });
  layer.querySelector("form").addEventListener("submit", async event => {
    event.preventDefault();
    const button = event.currentTarget.querySelector("button[type=submit]");
    const error = event.currentTarget.querySelector("[data-share-error]");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    button.disabled = true; button.textContent = "Creating link…"; error.hidden = true;
    try {
      const result = await api(UPLOAD_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"create-share-link", projectId:project.id, name:values.name, expiryDays:values.expiryDays, allowUploads:Boolean(values.allowUploads) }) });
      await copyShareUrl(result.shareUrl);
      layer.querySelector(".workspace-share-modal").innerHTML = `<span class="workspace-share-success">✓</span><p class="workspace-kicker">LINK READY</p><h2>${escapeHTML(result.share.name)}</h2><p>${result.share.allowUploads ? "This link accepts downloads, new files and replacement versions." : "This link is view and download only."}</p><label>Shareable project link<input data-created-share value="${escapeHTML(result.shareUrl)}" readonly></label><div class="workspace-share-actions"><button class="workspace-button primary" type="button" data-copy-share>Copied to clipboard ✓</button><a class="workspace-button" href="${shareIntent("whatsapp", result.shareUrl, result.share.name)}" target="_blank" rel="noreferrer">WhatsApp</a><a class="workspace-button" href="${shareIntent("email", result.shareUrl, result.share.name)}">Email</a><a class="workspace-button" href="${shareIntent("facebook", result.shareUrl, result.share.name)}" target="_blank" rel="noreferrer">Facebook</a></div><button class="workspace-button" type="button" data-done-share>Done</button>`;
      layer.querySelector("[data-copy-share]").addEventListener("click", async event => { const copyButton = event.currentTarget; await copyShareUrl(result.shareUrl); if (copyButton.isConnected) copyButton.textContent = "Copied again ✓"; });
      layer.querySelector("[data-done-share]").addEventListener("click", close);
    } catch (failure) {
      error.textContent = failure.message; error.hidden = false; button.disabled = false; button.textContent = "Create share link";
    }
  });
  layer.querySelectorAll("[data-share-save]").forEach(button => button.addEventListener("click", async () => {
    const row = button.closest("[data-share-row]");
    button.disabled = true; button.textContent = "Saving…";
    await api(UPLOAD_API, { method:"PATCH", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"share-link", projectId:project.id, shareId:row.dataset.shareRow, status:row.querySelector("[data-share-status]").value, allowUploads:row.querySelector("[data-share-uploads]").checked, name:row.querySelector("[data-share-name]").value, expiryDays:row.querySelector("[data-share-expiry]").value }) });
    button.textContent = "Saved ✓"; setTimeout(() => { button.disabled = false; button.textContent = "Save"; }, 1200);
  }));
}

function openCreateProjectModal(root, actions) {
  const layer = root.querySelector("[data-workspace-layer]");
  layer.innerHTML = `<div class="workspace-modal-backdrop"><form class="workspace-share-modal workspace-create-modal"><button type="button" data-close-create>×</button><p class="workspace-kicker">FREE WORKSPACE</p><h2>Create a project</h2><p>Use this for your own editing clients. Upload files, keep versions together and send a private review link.</p><label>Project name<input name="name" required maxlength="120" placeholder="e.g. Kapil launch reel"></label><label>Client name <span>optional</span><input name="clientName" maxlength="120" placeholder="Client or brand name"></label><label>Client email <span>optional</span><input name="clientEmail" type="email" maxlength="254" placeholder="client@example.com"></label><p role="alert" data-create-error hidden></p><button class="workspace-button primary" type="submit">Create project</button></form></div>`;
  const close = () => { layer.innerHTML = ""; };
  layer.querySelector("[data-close-create]").addEventListener("click", close);
  layer.querySelector(".workspace-modal-backdrop").addEventListener("click", event => { if (event.target === event.currentTarget) close(); });
  layer.querySelector("form").addEventListener("submit", async event => {
    event.preventDefault();
    const button = event.currentTarget.querySelector("button[type=submit]");
    const error = event.currentTarget.querySelector("[data-create-error]");
    button.disabled = true; button.textContent = "Creating…"; error.hidden = true;
    try {
      const result = await api(UPLOAD_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"create-account-project", ...Object.fromEntries(new FormData(event.currentTarget)) }) });
      location.hash = `workspace?project=${encodeURIComponent(result.project.id)}`;
      actions.refreshRoute();
    } catch (failure) {
      error.textContent = failure.message; error.hidden = false; button.disabled = false; button.textContent = "Create project";
    }
  });
}

function commentsPanel(comments, canManageComments) {
  return `<section class="workspace-comments"><header><div><h2>Review comments</h2><p>Clients can leave feedback from the share link without creating an account.</p></div><span>${comments.length} comment${comments.length === 1 ? "" : "s"}</span></header><div class="workspace-comment-list">${comments.length ? comments.map(comment => commentRow(comment, canManageComments)).join("") : `<article class="workspace-comment-empty"><span>◌</span><b>No feedback yet</b><small>Share this project with your client to collect comments here.</small></article>`}</div><form class="workspace-comment-form"><div><input name="authorName" required maxlength="100" placeholder="Your name"><input name="authorEmail" type="email" maxlength="254" placeholder="Email optional"></div><textarea name="body" required maxlength="2000" rows="3" placeholder="Write feedback for this project…"></textarea><button class="workspace-button primary" type="submit">Send comment</button><p role="alert" hidden></p></form></section>`;
}

function commentRow(comment, canManageComments) {
  const completed = comment.status === "completed" || comment.status === "resolved";
  const timestamp = hasTimestamp(comment.timestamp_seconds) ? `<em>${formatDuration(Number(comment.timestamp_seconds))}</em>` : "";
  return `<article class="workspace-comment ${completed ? "completed" : ""}"><span>${escapeHTML((comment.author_name || "?").slice(0,1).toUpperCase())}</span><div><strong>${escapeHTML(comment.author_name || "Reviewer")} <small>${formatDate(comment.created_at)}</small></strong>${timestamp}<p>${escapeHTML(comment.body)}</p></div>${canManageComments ? `<button type="button" data-comment-complete="${escapeHTML(comment.id)}">${completed ? "Completed ✓" : "Mark complete"}</button>` : ""}</article>`;
}

function bindComments(root, projectId, token, actions, canManageComments = false) {
  const form = root.querySelector(".workspace-comment-form");
  if (!form) return;
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const button = form.querySelector("button[type=submit]");
    const error = form.querySelector("[role=alert]");
    button.disabled = true; button.textContent = "Sending…"; error.hidden = true;
    try {
      await api(UPLOAD_API, { method:"POST", headers:bearerHeaders(token, true), body:JSON.stringify({ action:"create-comment", projectId, ...Object.fromEntries(new FormData(form)) }) });
      actions.refreshRoute ? actions.refreshRoute() : null;
    } catch (failure) {
      error.textContent = failure.message; error.hidden = false; button.disabled = false; button.textContent = "Send comment";
    }
  });
  if (canManageComments) {
    root.querySelectorAll("[data-comment-complete]").forEach(button => button.addEventListener("click", async () => {
      button.disabled = true; button.textContent = "Saving…";
      await api(UPLOAD_API, { method:"PATCH", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"comment-status", projectId, commentId:button.dataset.commentComplete, status:"completed" }) });
      actions.refreshRoute();
    }));
  }
}

function shareRow(share) {
  const active = share.status === "active";
  return `<article data-share-row="${escapeHTML(share.id)}" class="workspace-share-row"><div><label>Label<input data-share-name value="${escapeHTML(share.name)}"></label><small>${active ? (share.allow_uploads ? "Uploads enabled" : "View and download") : "Disabled"} · ${share.expires_at ? `Expires ${formatDate(share.expires_at)}` : "No expiry"}</small></div><label class="mini-check"><input type="checkbox" data-share-uploads ${share.allow_uploads ? "checked" : ""}>Uploads</label><select data-share-expiry><option value="0">No expiry</option><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option></select><select data-share-status><option value="active" ${active ? "selected" : ""}>Active</option><option value="revoked" ${!active ? "selected" : ""}>Disabled</option></select><button type="button" data-share-save>Save</button></article>`;
}

async function copyShareUrl(url) {
  try { await navigator.clipboard.writeText(url); } catch { /* clipboard can be blocked in some browsers */ }
}

function shareIntent(channel, url, name) {
  const encodedUrl = encodeURIComponent(url);
  const text = encodeURIComponent(`Review ${name || "this Content X project"}: ${url}`);
  if (channel === "whatsapp") return `https://wa.me/?text=${text}`;
  if (channel === "facebook") return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  return `mailto:?subject=${encodeURIComponent(`Review ${name || "Content X project"}`)}&body=${text}`;
}

export async function renderSharedWorkspace(root, actions, route) {
  root.className = "workspace-app shared-workspace";
  const params = new URLSearchParams(route.split("?")[1] || "");
  const projectId = params.get("project") || "";
  const token = params.get("token") || "";
  root.innerHTML = `<main class="workspace-loading"><span></span><h1>Opening shared project…</h1></main>`;
  if (!token) return sharedError(root, "This share link is incomplete.");
  try {
    const data = await api(`${UPLOAD_API}?action=project&projectId=${encodeURIComponent(projectId)}`, { headers:bearerHeaders(token), cache:"no-store" });
    const resolvedProjectId = data.project.id;
    const canUpload = Boolean(data.permissions?.canUpload);
    const commentData = await api(`${UPLOAD_API}?action=comments&projectId=${encodeURIComponent(resolvedProjectId)}`, { headers:bearerHeaders(token), cache:"no-store" }).catch(() => ({ comments:[] }));
    root.innerHTML = `<header class="shared-header"><a href="#home"><span>CX</span><b>Content X</b></a><div><b>Shared project</b><small>${canUpload ? "Uploads enabled" : "View and download"}</small></div></header><main class="shared-main"><section class="shared-title"><p class="workspace-kicker">PRIVATE CLIENT LINK</p><h1>${escapeHTML(data.project.name)}</h1><p>Review the latest files, download any version${canUpload ? ", or add new files and replacements" : ""}. Leave your name and feedback below — no login needed.</p></section>${projectSurface(data.project, data.files || [], data.folders || [], canUpload, commentData.comments || [], false)}</main><input type="file" multiple hidden data-workspace-picker><div data-workspace-layer></div>`;
    enhanceFileLibrary(root, data.files || [], commentData.comments || []);
    const picker = root.querySelector("[data-workspace-picker]");
    if (canUpload) {
      root.querySelector("[data-project-drop]").addEventListener("click", () => { picker.dataset.replaceFile = ""; picker.click(); });
      bindDropTarget(root.querySelector("[data-project-drop]"), async dropped => { await uploadSelectedFiles(root, resolvedProjectId, token, dropped, "", data.project.maxFileSize, data.project.maxVideoSeconds || data.project.max_video_seconds || 0); await renderSharedWorkspace(root, actions, route); });
      picker.addEventListener("change", async () => { await uploadSelectedFiles(root, resolvedProjectId, token, [...picker.files], picker.dataset.replaceFile || "", data.project.maxFileSize, data.project.maxVideoSeconds || data.project.max_video_seconds || 0); picker.value = ""; await renderSharedWorkspace(root, actions, route); });
    }
    root.querySelectorAll("[data-file-card]").forEach(card => {
      card.querySelector("[data-file-open]").addEventListener("click", () => openVersions(root, resolvedProjectId, card.dataset.assetId, token, false, () => renderSharedWorkspace(root, actions, route)));
      if (canUpload) {
        card.querySelector("[data-new-version]")?.addEventListener("click", () => { picker.dataset.replaceFile = card.dataset.fileId; picker.click(); });
        bindDropTarget(card, async dropped => { await uploadSelectedFiles(root, resolvedProjectId, token, dropped.slice(0,1), card.dataset.fileId, data.project.maxFileSize, data.project.maxVideoSeconds || data.project.max_video_seconds || 0); await renderSharedWorkspace(root, actions, route); }, "is-version-drop");
      }
    });
    bindComments(root, resolvedProjectId, token, { refreshRoute:() => renderSharedWorkspace(root, actions, route) }, false);
  } catch (error) { sharedError(root, error.message); }
}

function sharedError(root, message) {
  root.innerHTML = `<main class="workspace-error"><span>!</span><h1>Share link unavailable.</h1><p>${escapeHTML(message)}</p><a class="workspace-button" href="#home">Visit Content X</a></main>`;
}

async function uploadSelectedFiles(root, projectId, token, selected, replaceFileId, maximum, maxVideoSeconds = 0) {
  const files = selected.filter(file => file.size > 0 && file.size <= Number(maximum));
  if (!files.length) throw new Error(`Choose a non-empty file up to ${formatBytes(maximum)}.`);
  const queue = root.querySelector("[data-workspace-queue]");
  for (const file of files) {
    const row = document.createElement("article");
    row.innerHTML = `<span>${fileGlyph(file.type)}</span><div><b>${escapeHTML(file.name)}</b><small>Preparing secure upload…</small><i><em></em></i></div><strong>0%</strong>`;
    queue.prepend(row);
    try {
      if (!fileLooksSafe(file)) throw new Error("This file type is blocked for safety. Use video, audio, image, PDF, text, CSV or subtitle files.");
      await verifyVideoDuration(file, Number(maxVideoSeconds || 0), row);
      await uploadOne(file, row, projectId, token, replaceFileId);
    } catch (error) {
      row.classList.add("error"); row.querySelector("small").textContent = error.message; row.querySelector("strong").textContent = "!";
      throw error;
    }
  }
}

function fileLooksSafe(file) {
  const extension = String(file.name || "").toLowerCase().split(".").pop() || "";
  return SAFE_WORKSPACE_EXTENSIONS.has(extension) && !/[\u0000-\u001f\\\/]/.test(file.name);
}

async function verifyVideoDuration(file, maxVideoSeconds, row) {
  if (!file.type.startsWith("video/")) return;
  row.querySelector("small").textContent = "Checking video length before upload…";
  const duration = await readVideoDuration(file);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("We could not read this video length. Please export the video again and upload a valid file.");
  if (maxVideoSeconds && duration > maxVideoSeconds + 1) {
    throw new Error(`This video is ${formatDuration(duration)}, but this project allows up to ${formatDuration(maxVideoSeconds)}.`);
  }
  row.querySelector("small").textContent = `Video length checked · ${formatDuration(duration)}`;
}

function readVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    const cleanup = () => { URL.revokeObjectURL(url); video.removeAttribute("src"); video.load(); };
    video.preload = "metadata";
    video.onloadedmetadata = () => { const duration = video.duration; cleanup(); resolve(duration); };
    video.onerror = () => { cleanup(); reject(new Error("We could not read this video length. Please upload a valid video file.")); };
    video.src = url;
  });
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

async function uploadOne(file, row, projectId, token, replaceFileId) {
  let session;
  const setProgress = (percent, label) => { row.querySelector("small").textContent = label; row.querySelector("em").style.width = `${percent}%`; row.querySelector("strong").textContent = percent >= 100 ? "✓" : `${percent}%`; };
  try {
    session = await api(UPLOAD_API, { method:"POST", headers:bearerHeaders(token, true), body:JSON.stringify({ action:"start-upload", projectId, fileName:file.name, fileSize:file.size, contentType:file.type, replaceFileId:replaceFileId || undefined }) });
    const parts = [];
    let sent = 0;
    for (let offset = 0, partNumber = 1; offset < file.size; offset += session.partSize, partNumber += 1) {
      const blob = file.slice(offset, Math.min(offset + session.partSize, file.size));
      const part = await api(`${UPLOAD_API}?action=upload-part&projectId=${encodeURIComponent(projectId)}&fileId=${encodeURIComponent(session.fileId)}&uploadId=${encodeURIComponent(session.uploadId)}&partNumber=${partNumber}`, { method:"PUT", headers:bearerHeaders(token), body:blob });
      parts.push(part); sent += blob.size; setProgress(Math.min(98, Math.round(sent / file.size * 100)), `${replaceFileId ? `Uploading version ${session.versionNumber}` : "Uploading"} · ${formatBytes(sent)} of ${formatBytes(file.size)}`);
    }
    await api(UPLOAD_API, { method:"POST", headers:bearerHeaders(token, true), body:JSON.stringify({ action:"complete-upload", projectId, fileId:session.fileId, uploadId:session.uploadId, parts }) });
    row.classList.add("done"); setProgress(100, replaceFileId ? `Version ${session.versionNumber} ready` : "Upload ready");
  } catch (error) {
    if (session) await api(UPLOAD_API, { method:"POST", headers:bearerHeaders(token, true), body:JSON.stringify({ action:"abort-upload", projectId, fileId:session.fileId, uploadId:session.uploadId }) }).catch(() => undefined);
    row.classList.add("error"); row.querySelector("small").textContent = error.message; row.querySelector("strong").textContent = "!"; throw error;
  }
}

async function downloadProjectFile(projectId, fileId, token, button) {
  const original = button.textContent; button.disabled = true; button.textContent = "Preparing…";
  try {
    const data = await api(UPLOAD_API, { method:"POST", headers:bearerHeaders(token, true), body:JSON.stringify({ action:"project-download-link", projectId, fileId }) });
    location.href = data.downloadUrl;
  } catch (error) { button.textContent = error.message; }
  finally { setTimeout(() => { button.disabled = false; button.textContent = original; }, 1200); }
}

function bindDropTarget(element, handler, activeClass = "is-dragging") {
  if (!element || element.classList.contains("disabled")) return;
  ["dragenter","dragover"].forEach(type => element.addEventListener(type, event => { event.preventDefault(); element.classList.add(activeClass); }));
  ["dragleave","drop"].forEach(type => element.addEventListener(type, event => { event.preventDefault(); element.classList.remove(activeClass); }));
  element.addEventListener("drop", event => handler([...event.dataTransfer.files]));
}
