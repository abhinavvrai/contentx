import { enhanceFileLibrary, fileToolbar, hasTimestamp } from "./studio-workspace.js?v=frame-native-9";
import { openReviewRoom } from "./review-room.js?v=frame-native-17";
import { renderWorkspaceAccountPanel } from "./account.js?v=frame-native-17";

const UPLOAD_API = "/api/uploads";
const BRIEF_API = "/api/briefs";

const escapeHTML = value => String(value ?? "").replace(/[&<>'"]/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[character]);
const userAvatar = user => user?.avatarUrl ? `<img src="${escapeHTML(user.avatarUrl)}" alt="">` : escapeHTML(user.name.slice(0,1).toUpperCase());
const formatBytes = bytes => {
  const value = Number(bytes || 0);
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(value >= 10 * 1024 ** 3 ? 0 : 1)} GB`;
  if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(value >= 10 * 1024 ** 2 ? 0 : 1)} MB`;
  if (value >= 1024) return `${Math.round(value / 1024)} KB`;
  return `${value} B`;
};
const fileGlyph = type => String(type || "").startsWith("video/") ? "▶" : String(type || "").startsWith("image/") ? "▧" : String(type || "").startsWith("audio/") ? "♫" : "◇";
const workspaceIcon = name => {
  const paths = {
    projects:'<path d="M4 7.5h6.5l1.6 2H20v9.5H4z"/><path d="M4 7.5V5h6l1.5 2"/>',
    search:'<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4 4"/>',
    bell:'<path d="M7 17h10l-1.2-2v-4a3.8 3.8 0 0 0-7.6 0v4z"/><path d="M10 19h4"/>',
    account:'<circle cx="12" cy="8" r="3"/><path d="M6.5 19c.5-3.3 2.3-5 5.5-5s5 1.7 5.5 5"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    menu:'<path d="M5 7h14M5 12h14M5 17h14"/>',
    folder:'<path d="M3.5 7.5h6l1.7 2H20v9H3.5z"/><path d="M3.5 7.5V5h6l1.5 2"/>',
    trash:'<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 10v7M14 10v7"/>',
    restore:'<path d="M5 8V4m0 0h4M5 4l3 3a7 7 0 1 1-2 7"/>',
  };
  return `<svg class="workspace-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name] || paths.projects}</svg>`;
};
const formatDate = value => value ? new Date(Number(value)).toLocaleDateString([], { dateStyle:"medium" }) : "—";
const SAFE_WORKSPACE_EXTENSIONS = new Set(["mp4","mov","m4v","webm","mkv","avi","mp3","wav","m4a","aac","flac","ogg","jpg","jpeg","png","webp","gif","heic","heif","pdf","txt","md","csv","srt","vtt"]);
const RECENT_PROJECTS_KEY = "cx_recent_projects_v1";
let workspaceRenderVersion = 0;
let workspaceShortcutHandler = null;
let activeWorkspaceUploads = 0;
const sharePasswords = new Map();

window.addEventListener("beforeunload", event => {
  if (!activeWorkspaceUploads) return;
  event.preventDefault();
  event.returnValue = "";
});

function hydrateUnreadNotificationBadge(root) {
  const badge = root.querySelector("[data-notification-badge]");
  if (!badge) return;
  api("/api/notifications", { cache:"no-store" }).then(data => {
    if (!badge.isConnected) return;
    const unread = (data.notifications || []).filter(item => !item.read_at).length;
    badge.hidden = unread === 0; badge.textContent = unread > 99 ? "99+" : String(unread);
    badge.closest("a")?.setAttribute("aria-label", unread ? `Notifications, ${unread} unread` : "Notifications");
  }).catch(() => { badge.hidden = true; });
}

function readRecentProjects() {
  try { return JSON.parse(localStorage.getItem(RECENT_PROJECTS_KEY) || "[]").filter(Boolean).slice(0, 8); }
  catch { return []; }
}

function rememberRecentProject(projectId) {
  if (!projectId) return;
  try { localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify([projectId, ...readRecentProjects().filter(id => id !== projectId)].slice(0, 8))); }
  catch { /* Private browsing can disable device-local preferences. */ }
}

async function api(url, options = {}) {
  const response = await fetch(url, { credentials:"same-origin", ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(body.error || "This workspace request could not be completed."); error.status = response.status; throw error; }
  return body;
}

const bearerHeaders = (token, json = false) => ({
  ...(token ? { Authorization:`Bearer ${token}` } : {}),
  ...(token && sharePasswords.has(token) ? { "X-ContentX-Share-Password":sharePasswords.get(token) } : {}),
  ...(json ? { "Content-Type":"application/json" } : {}),
});

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
    const selected = requested ? projects.find(project => project.project_id === requested) || null : null;
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
    if (existingShell?.isConnected) {
      existingShell.classList.remove("is-refreshing"); root.removeAttribute("aria-busy");
      const previous = root.querySelector("[data-workspace-refresh-error]"); previous?.remove();
      const banner = document.createElement("div"); banner.className = "workspace-refresh-error"; banner.dataset.workspaceRefreshError = "";
      banner.innerHTML = `<span>!</span><div><b>That view did not finish loading.</b><small>${escapeHTML(error.message)} Your open workspace is still safe.</small></div><button type="button">Retry</button>`;
      banner.querySelector("button").addEventListener("click", actions.refreshRoute); root.querySelector(".workspace-main")?.prepend(banner); return;
    }
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
  if (project) rememberRecentProject(project.id);
  root.innerHTML = `<div class="workspace-shell ${project && !accountPanel ? "project-open" : accountPanel ? "account-open" : "overview-open"}">
    <aside class="workspace-rail" aria-label="Workspace tools">
      <a class="workspace-rail-brand" href="#home" aria-label="Content X home">CX</a>
      <nav>
        <a class="${accountPanel ? "" : "active"}" href="#workspace" aria-label="Projects" title="Projects">${workspaceIcon("projects")}</a>
         <button type="button" data-command-menu aria-label="Quick commands and search" title="Quick commands · Ctrl K">${workspaceIcon("search")}</button>
         <a class="workspace-notification-link" href="#workspace?panel=account&view=notifications" aria-label="Notifications" title="Notifications">${workspaceIcon("bell")}<span data-notification-badge hidden></span></a>
        <a class="${accountPanel ? "active" : ""}" href="#workspace?panel=account" aria-label="Account and notifications" title="Account">${workspaceIcon("account")}</a>
      </nav>
      <a class="workspace-rail-user${user.avatarUrl ? " has-image" : ""}" data-account-avatar href="#workspace?panel=account" aria-label="Open account" title="Account">${userAvatar(user)}</a>
    </aside>
    <aside class="workspace-sidebar">
      <a class="workspace-brand" href="#home"><span>CX</span><b>Content X</b></a>
      <nav><a class="${accountPanel ? "" : "active"}" href="#workspace"><span>${workspaceIcon("projects")}</span>Projects</a><a class="${accountPanel ? "active" : ""}" href="#workspace?panel=account"><span>${workspaceIcon("account")}</span>Account</a><button type="button" data-create-free-project><span>${workspaceIcon("plus")}</span>New project</button></nav>
      <label class="workspace-project-search"><span>${workspaceIcon("search")}</span><input type="search" placeholder="Search projects" aria-label="Search projects" data-project-nav-search></label>
      <div class="workspace-project-nav"><small>YOUR PROJECTS</small>${projects.map(item => `<a class="${selected?.project_id === item.project_id ? "active" : ""} ${item.status === "archived" ? "archived" : ""}" href="#workspace?project=${encodeURIComponent(item.project_id)}" data-project-nav-item><span>${escapeHTML((item.name || "P").slice(0,1).toUpperCase())}</span><b>${escapeHTML(item.name)}</b><small>${item.status === "archived" ? "Archived" : `${Number(item.file_count || 0)} file${Number(item.file_count || 0) === 1 ? "" : "s"} · ${formatBytes(item.total_bytes || 0)}`}</small></a>`).join("") || `<p>Create a free project to begin.</p>`}</div>
      ${project && !accountPanel ? `<button class="workspace-project-focus" type="button" data-project-settings><span>${escapeHTML(project.name.slice(0,1).toUpperCase())}</span><div><b>${escapeHTML(project.name)}</b><small>${escapeHTML(project.clientName || "Private production")}</small></div><em>⌄</em></button><div class="workspace-tree"><div><small>ASSETS</small><button type="button" data-create-folder title="New folder">＋</button></div><button class="active" type="button" data-folder-id=""><span>▱</span><b>All assets</b><em>${files.length}</em></button>${folderTreeNodes(folders)}<button type="button" data-create-folder><span>＋</span><b>New folder</b></button><button class="workspace-recycle-link" type="button" data-recycle-bin><span>${workspaceIcon("restore")}</span><b>Recently deleted</b><em>30d</em></button></div><div class="workspace-share-nav"><header><small>SHARE LINKS</small><button type="button" data-share-project title="New share link">＋</button></header><button class="all" type="button" data-share-project><span>☷</span><b>All share links</b><em>${shares.filter(share => share.status === "active").length}</em></button>${shares.slice(0,6).map(share => `<button type="button" data-share-project><span>↗</span><b>${escapeHTML(share.name)}</b><small>${share.status === "active" ? "Active" : "Disabled"}</small></button>`).join("") || `<p>No links yet. Create one when the project is ready.</p>`}</div>` : ""}
      <div class="workspace-storage"><div><b>Free storage</b><small>${formatBytes(used)} of ${formatBytes(quota)}</small></div><i><em style="width:${percent}%"></em></i></div>
      <div class="workspace-user"><span class="${user.avatarUrl ? "has-image" : ""}" data-account-avatar>${userAvatar(user)}</span><div><b data-account-name>${escapeHTML(user.name)}</b><small data-account-email>${escapeHTML(user.email)}</small></div><a href="#workspace?panel=account" aria-label="Account settings">•••</a></div>
    </aside>
    <main class="workspace-main">
      <header class="workspace-topbar"><button type="button" data-workspace-menu aria-label="Open project menu">${workspaceIcon("menu")}</button><div><span>All projects</span>${accountPanel ? `<b>/ Account</b>` : project ? `<i>/</i><b>${escapeHTML(project.name)}</b>` : ""}</div>${project && !accountPanel ? `<label class="workspace-global-search"><span>${workspaceIcon("search")}</span><input type="search" data-global-file-search placeholder="Search files" aria-label="Search this project"></label>` : `<button class="workspace-command-trigger" type="button" data-command-menu><span>${workspaceIcon("search")}</span> Quick find <kbd>Ctrl K</kbd></button>`}<div>${accountPanel ? `<a class="workspace-button" href="#workspace">View projects</a>` : project ? `<button class="workspace-button subtle" type="button" data-project-activity>Activity</button><button class="workspace-button subtle" type="button" data-project-settings aria-label="Project settings">•••</button><button class="workspace-button" type="button" data-share-project ${project.status === "archived" ? "disabled" : ""}>Share</button><button class="workspace-button primary" type="button" data-upload-files ${project.status === "archived" ? "disabled" : ""}>${workspaceIcon("plus")} Add</button>` : `<button class="workspace-button primary" type="button" data-create-free-project>Create project</button>`}</div></header>
      ${accountPanel ? `<section class="workspace-account-surface" data-workspace-account></section>` : project ? projectSurface(project, files, folders, projectData.permissions?.canUpload !== false, comments, true, projectData.revisionPolicy, project.status === "active", projectData.permissions) : projects.length ? workspaceOverview(projects, storage) : emptyWorkspace()}
    </main>
  </div><nav class="workspace-mobile-nav" aria-label="Mobile workspace navigation"><a href="#home"><span>CX</span><small>Home</small></a><a class="${!accountPanel ? "active" : ""}" href="#workspace">${workspaceIcon("projects")}<small>Projects</small></a><button type="button" data-command-menu>${workspaceIcon("search")}<small>Search</small></button><a href="#workspace?panel=account&view=notifications">${workspaceIcon("bell")}<small>Alerts</small></a><a class="${accountPanel ? "active" : ""}" href="#workspace?panel=account">${workspaceIcon("account")}<small>Account</small></a></nav><input type="file" multiple hidden data-workspace-picker><div data-workspace-layer></div>`;

  root.querySelector("[data-workspace-menu]")?.addEventListener("click", () => root.querySelector(".workspace-sidebar").classList.toggle("open"));
  hydrateUnreadNotificationBadge(root);
  root.querySelector(".workspace-main")?.addEventListener("click", () => root.querySelector(".workspace-sidebar")?.classList.remove("open"));
  root.querySelectorAll("[data-create-free-project]").forEach(button => button.addEventListener("click", () => openCreateProjectModal(root, actions)));
  const projectSearch = root.querySelector("[data-project-nav-search]");
  projectSearch?.addEventListener("input", () => {
    const query = projectSearch.value.trim().toLowerCase();
    root.querySelectorAll("[data-project-nav-item]").forEach(item => { item.hidden = Boolean(query) && !item.textContent.toLowerCase().includes(query); });
  });
  bindWorkspaceShortcuts(root, projects, project, actions, files, folders, comments);
  bindWorkspaceOverview(root, projects, actions);
  if (accountPanel || !project) return;
  enhanceFileLibrary(root, files, comments);
  bindVideoHoverPreviews(root, project.id, "");
  bindFolderBrowser(root, project.id, folders, actions);
  bindAssetSelection(root, project.id, actions);
  const picker = root.querySelector("[data-workspace-picker]");
  root.querySelectorAll("[data-upload-files]").forEach(button => button.addEventListener("click", () => { picker.dataset.replaceFile = ""; picker.click(); }));
  root.querySelector("[data-project-drop]")?.addEventListener("click", () => { picker.dataset.replaceFile = ""; picker.click(); });
  picker.addEventListener("change", async () => {
    await uploadSelectedFiles(root, project.id, "", [...picker.files], picker.dataset.replaceFile || "", project.maxFileSize, project.maxVideoSeconds || project.max_video_seconds || 0);
    picker.value = "";
    actions.refreshRoute();
  });
  bindDropTarget(root.querySelector(".workspace-files"), async dropped => {
    await uploadSelectedFiles(root, project.id, "", dropped, "", project.maxFileSize, project.maxVideoSeconds || project.max_video_seconds || 0);
    actions.refreshRoute();
  });
  root.querySelectorAll("[data-file-card]").forEach(card => {
    const fileId = card.dataset.fileId;
    const assetId = card.dataset.assetId;
    card.querySelector("[data-file-open]").addEventListener("click", () => openVersions(root, project.id, assetId, "", true, actions.refreshRoute));
    card.querySelector("[data-new-version]")?.addEventListener("click", () => { picker.dataset.replaceFile = fileId; picker.click(); });
    card.querySelector("[data-delete-asset]")?.addEventListener("click", async () => {
      if (!confirm(`Move ${card.dataset.fileName || "this asset"} and all its versions to Recently deleted?`)) return;
      try {
        await api(`${UPLOAD_API}?action=project-file&projectId=${encodeURIComponent(project.id)}&assetId=${encodeURIComponent(assetId)}`, { method:"DELETE" });
        actions.refreshRoute();
      } catch (error) { alert(error.message); }
    });
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
  root.querySelectorAll("[data-share-project]").forEach(button => button.addEventListener("click", () => openSharePanel(root, project, shares, files)));
  root.querySelectorAll("[data-project-activity]").forEach(button => button.addEventListener("click", () => openActivityPanel(root, project)));
  root.querySelector("[data-recycle-bin]")?.addEventListener("click", () => openRecycleBinModal(root, project, actions));
  root.querySelectorAll("[data-project-settings]").forEach(button => button.addEventListener("click", () => openProjectSettingsModal(root, project, actions)));
  const globalSearch = root.querySelector("[data-global-file-search]");
  globalSearch?.addEventListener("input", () => { const fileSearch = root.querySelector("[data-file-search]"); if (fileSearch) { fileSearch.value = globalSearch.value; fileSearch.dispatchEvent(new Event("input", { bubbles:true })); } });
  root.querySelector("[data-delete-project]")?.addEventListener("click", () => openDeleteProjectModal(root, project, actions));
  root.querySelector("[data-review-attention]")?.addEventListener("click", () => root.querySelector(".workspace-comments")?.scrollIntoView({ behavior:"smooth", block:"start" }));
  bindComments(root, project.id, "", actions, true);
}

function workspaceOverview(projects, storage) {
  const active = projects.filter(project => project.status !== "archived").length;
  const used = Number(storage.usedBytes || 0), quota = Number(storage.quotaBytes || 50 * 1024 ** 3);
  const recent = readRecentProjects();
  const ordered = [...projects].sort((a, b) => {
    const aIndex = recent.indexOf(a.project_id), bIndex = recent.indexOf(b.project_id);
    if (aIndex >= 0 || bIndex >= 0) return (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex);
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
  return `<section class="workspace-overview"><header><div><small>CONTENT X WORKSPACE</small><h1>Projects</h1><p>${active} active · ${formatBytes(used)} of ${formatBytes(quota)} used</p></div><button class="workspace-button primary" type="button" data-create-free-project>＋ New project</button></header><div class="workspace-overview-tools"><label><span>⌕</span><input type="search" data-overview-search placeholder="Search projects" aria-label="Search projects"></label><div><button class="active" type="button" data-overview-filter="active">Active</button><button type="button" data-overview-filter="all">All</button><button class="active" type="button" data-overview-view="grid" aria-label="Grid view">▦</button><button type="button" data-overview-view="list" aria-label="List view">☷</button></div></div><div class="workspace-overview-grid" data-overview-grid>${ordered.map((project,index) => `<article class="workspace-overview-card ${project.status === "archived" ? "archived" : ""}" data-overview-card data-project-status="${escapeHTML(project.status || "active")}" data-project-name="${escapeHTML(project.name || "")}" style="--project-index:${index}"><a href="#workspace?project=${encodeURIComponent(project.project_id)}"><div class="workspace-overview-art"><i></i><i></i><i></i><span>${escapeHTML((project.name || "CX").slice(0,2).toUpperCase())}</span></div><div><h2>${escapeHTML(project.name)}</h2><p>${escapeHTML(project.client_name || "Private production")}</p><small>${Number(project.file_count || 0)} file${Number(project.file_count || 0) === 1 ? "" : "s"} · ${formatBytes(project.total_bytes || 0)}</small></div></a><footer><span>${project.status === "archived" ? "Archived" : recent.includes(project.project_id) ? "Recent" : "Active"}</span><button type="button" data-overview-project-settings="${escapeHTML(project.project_id)}" aria-label="Project settings">•••</button></footer></article>`).join("")}<button class="workspace-overview-new" type="button" data-create-free-project><span>＋</span><b>New project</b><small>Start a private production space</small></button></div><p class="workspace-overview-empty" data-overview-empty hidden>No projects match this view.</p></section>`;
}

function bindWorkspaceOverview(root, projects, actions) {
  const grid = root.querySelector("[data-overview-grid]");
  if (!grid) return;
  const search = root.querySelector("[data-overview-search]");
  let filter = "active";
  const update = () => {
    let visible = 0; const query = search.value.trim().toLowerCase();
    root.querySelectorAll("[data-overview-card]").forEach(card => { card.hidden = (filter === "active" && card.dataset.projectStatus === "archived") || (query && !card.textContent.toLowerCase().includes(query)); if (!card.hidden) visible++; });
    root.querySelector("[data-overview-empty]").hidden = visible > 0;
  };
  search.addEventListener("input", update);
  root.querySelectorAll("[data-overview-filter]").forEach(button => button.addEventListener("click", () => { filter = button.dataset.overviewFilter; root.querySelectorAll("[data-overview-filter]").forEach(item => item.classList.toggle("active", item === button)); update(); }));
  root.querySelectorAll("[data-overview-view]").forEach(button => button.addEventListener("click", () => { grid.classList.toggle("list", button.dataset.overviewView === "list"); root.querySelectorAll("[data-overview-view]").forEach(item => item.classList.toggle("active", item === button)); }));
  root.querySelectorAll("[data-overview-project-settings]").forEach(button => button.addEventListener("click", () => { const raw = projects.find(project => project.project_id === button.dataset.overviewProjectSettings); if (raw) openProjectSettingsModal(root, { id:raw.project_id, name:raw.name, clientName:raw.client_name, clientEmail:raw.client_email, status:raw.status }, actions); }));
  update();
}

function bindWorkspaceShortcuts(root, projects, project, actions, files = [], folders = [], comments = []) {
  const navigate = route => {
    const next = `#${route}`;
    if (location.hash === next) actions.refreshRoute();
    else location.hash = route;
  };
  const commands = [
    { label:"View all projects", meta:"Navigation", icon:"▱", run:() => navigate("workspace") },
    { label:"Create a new project", meta:"Action", icon:"＋", run:() => root.querySelector("[data-create-free-project]")?.click() },
    { label:"Account and notifications", meta:"Navigation", icon:"◎", run:() => navigate("workspace?panel=account") },
    ...projects.slice(0, 12).map(item => ({ label:`Open ${item.name}`, meta:item.status === "archived" ? "Archived project" : "Project", icon:"◇", run:() => navigate(`workspace?project=${encodeURIComponent(item.project_id)}`) })),
    ...(project ? [
      { label:"Search files in this project", meta:"Project action", icon:"⌕", run:() => (root.querySelector("[data-global-file-search]") || root.querySelector("[data-file-search]"))?.focus() },
      { label:"Upload files", meta:"Project action", icon:"↑", run:() => (root.querySelector("[data-upload-files]") || root.querySelector("[data-project-drop]"))?.click() },
      { label:"Create a folder", meta:"Project action", icon:"▱", run:() => root.querySelector("[data-create-folder]")?.click() },
      { label:"Create a share link", meta:"Project action", icon:"↗", run:() => root.querySelector("[data-share-project]")?.click() },
      { label:"Open project settings", meta:"Project action", icon:"•••", run:() => root.querySelector("[data-project-settings]")?.click() },
      ...folders.slice(0,30).map(folder => ({ label:`Open folder · ${folder.name}`, meta:"Folder", icon:"▱", run:() => root.querySelector(`[data-folder-id="${CSS.escape(folder.id)}"]`)?.click() })),
      ...files.slice(0,50).map(file => ({ label:`Open file · ${file.original_name}`, meta:`File · V${Number(file.version_number || 1)}`, icon:fileGlyph(file.content_type), run:() => openVersions(root, project.id, String(file.asset_id || file.id), "", true, actions.refreshRoute) })),
      ...comments.slice(0,40).map(comment => ({ label:`Feedback · ${String(comment.body || "Voice note").slice(0,80)}`, meta:`${commentIsComplete(comment) ? "Completed" : "Open"} · ${comment.author_name || "Reviewer"}`, icon:"◌", run:() => comment.asset_id ? openVersions(root, project.id, comment.asset_id, "", true, actions.refreshRoute) : root.querySelector(".workspace-comments")?.scrollIntoView({ behavior:"smooth" }) })),
    ] : []),
  ];
  const open = () => openWorkspaceCommandMenu(root, commands);
  root.querySelectorAll("[data-command-menu]").forEach(button => button.addEventListener("click", open));
  if (workspaceShortcutHandler) document.removeEventListener("keydown", workspaceShortcutHandler);
  workspaceShortcutHandler = event => {
    if (!root.isConnected || !root.classList.contains("workspace-app")) return;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "");
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); open(); return; }
    if (event.key === "/" && !typing) {
      const search = root.querySelector("[data-global-file-search], [data-overview-search], [data-project-nav-search]");
      if (search) { event.preventDefault(); search.focus(); }
    }
  };
  document.addEventListener("keydown", workspaceShortcutHandler);
}

function openWorkspaceCommandMenu(root, commands) {
  const layer = root.querySelector("[data-workspace-layer]");
  if (!layer) return;
  layer.innerHTML = `<div class="workspace-modal-backdrop workspace-command-backdrop"><section class="workspace-command-menu" role="dialog" aria-modal="true" aria-label="Quick commands"><header><span>⌕</span><input type="search" data-command-search placeholder="Search projects, folders, files or feedback" aria-label="Search commands"><kbd>Esc</kbd></header><div data-command-list>${commands.map((command,index) => `<button type="button" data-command-index="${index}"><i>${escapeHTML(command.icon)}</i><span><b>${escapeHTML(command.label)}</b><small>${escapeHTML(command.meta)}</small></span><em>↵</em></button>`).join("")}</div><p data-command-empty hidden>No matching command.</p><footer><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></footer></section></div>`;
  const backdrop = layer.querySelector(".workspace-command-backdrop");
  const input = layer.querySelector("[data-command-search]");
  const empty = layer.querySelector("[data-command-empty]");
  let active = 0;
  const visibleButtons = () => [...layer.querySelectorAll("[data-command-index]")].filter(button => !button.hidden);
  const paint = () => visibleButtons().forEach((button,index) => button.classList.toggle("active", index === active));
  const close = () => { layer.innerHTML = ""; };
  const run = button => { const command = commands[Number(button.dataset.commandIndex)]; close(); command?.run(); };
  layer.querySelectorAll("[data-command-index]").forEach(button => button.addEventListener("click", () => run(button)));
  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase(); let visible = 0;
    layer.querySelectorAll("[data-command-index]").forEach(button => { button.hidden = Boolean(query) && !button.textContent.toLowerCase().includes(query); if (!button.hidden) visible++; });
    active = 0; empty.hidden = visible > 0; paint();
  });
  input.addEventListener("keydown", event => {
    const buttons = visibleButtons();
    if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); active = Math.max(0, Math.min(buttons.length - 1, active + (event.key === "ArrowDown" ? 1 : -1))); paint(); buttons[active]?.scrollIntoView({ block:"nearest" }); }
    if (event.key === "Enter" && buttons[active]) { event.preventDefault(); run(buttons[active]); }
    if (event.key === "Escape") { event.preventDefault(); close(); }
  });
  backdrop.addEventListener("click", event => { if (event.target === backdrop) close(); });
  paint(); input.focus();
}

function folderTreeNodes(folders, parentId = null, depth = 0) {
  return folders.filter(folder => (folder.parent_id || null) === parentId).map(folder => `<div class="workspace-tree-node" style="--depth:${depth}"><button type="button" draggable="true" data-folder-id="${escapeHTML(folder.id)}" data-folder-drag="${escapeHTML(folder.id)}"><span>▸</span><b>${escapeHTML(folder.name)}</b><em>${Number(folder.asset_count || 0)}</em></button>${folderTreeNodes(folders, folder.id, depth + 1)}</div>`).join("");
}

function projectSurface(project, files, folders, canUpload, comments = [], canManageComments = false, revisionPolicy = null, canManageFolders = false, permissions = {}) {
  const rootFolders = folders.filter(folder => !folder.parent_id);
  const openComments = comments.filter(comment => !commentIsComplete(comment)).length;
  return `<section class="workspace-project-head"><div><p>PROJECT ${project.status === "archived" ? `<b class="workspace-status-badge">ARCHIVED</b>` : ""}</p><h1>${escapeHTML(project.name)}</h1><span>${files.length} active file${files.length === 1 ? "" : "s"} · Updated ${formatDate(project.updatedAt)}</span></div><div class="workspace-view-toggle" aria-label="File layout"><button class="active" type="button" data-file-view="grid" aria-pressed="true">Grid</button><button type="button" data-file-view="list" aria-pressed="false">List</button></div></section>
    ${openComments ? `<button class="workspace-review-attention" type="button" data-review-attention><span>${openComments}</span><div><b>Feedback needs attention</b><small>${openComments} open comment${openComments === 1 ? "" : "s"} waiting for a decision</small></div><em>Review now →</em></button>` : ""}
    <section class="workspace-browser"><div class="workspace-browser-head"><nav aria-label="Folder breadcrumb"><button class="active" type="button" data-folder-id="">${escapeHTML(project.name)}</button><span data-folder-crumbs></span></nav><div>${canManageFolders ? `<button type="button" data-folder-settings-current hidden>Folder options</button><button type="button" data-create-folder>＋ New folder</button>` : ""}</div></div><div class="workspace-folder-grid">${rootFolders.map(folder => folderCard(folder)).join("")}</div></section>
    <section class="workspace-files" title="Executables, archives, scripts, HTML and SVG are blocked"><header><div><h2>Assets</h2><span data-visible-folder-label>Project root</span></div></header>${files.length ? `${fileToolbar()}${canManageFolders ? assetBulkBar(folders) : ""}` : ""}<div class="workspace-file-grid" data-active-folder="">${files.length ? files.map(file => fileCard(file, canUpload, revisionPolicy, canManageFolders)).join("") : `<button class="workspace-empty-files" type="button" ${canUpload ? "data-project-drop" : "disabled"}><span>↑</span><h3>${canUpload ? "Add your first file" : "No files shared yet"}</h3><p>${canUpload ? "Upload footage, references, or drag files here." : "Uploads are disabled for this project."}</p>${canUpload ? `<b>Choose files</b>` : ""}</button>`}</div></section>
    ${files.length ? commentsPanel(comments, canManageComments, permissions.canComment !== false) : ""}
    <section class="workspace-queue" data-workspace-queue></section>`;
}

function folderCard(folder) {
  return `<article class="workspace-folder-card" draggable="true" data-folder-drag="${escapeHTML(folder.id)}"><button class="workspace-folder-open" type="button" data-folder-id="${escapeHTML(folder.id)}"><span class="workspace-folder-preview"><i></i><i></i><i></i></span><div><b>${escapeHTML(folder.name)}</b><small>${Number(folder.asset_count || 0)} item${Number(folder.asset_count || 0) === 1 ? "" : "s"}</small></div></button><button class="workspace-folder-more" type="button" data-folder-menu="${escapeHTML(folder.id)}" aria-label="Folder options">•••</button><div class="workspace-folder-menu" data-folder-menu-panel="${escapeHTML(folder.id)}" hidden><button type="button" data-folder-open-action="${escapeHTML(folder.id)}">Open folder</button><button type="button" data-folder-rename="${escapeHTML(folder.id)}">Rename</button><button type="button" data-folder-remove="${escapeHTML(folder.id)}">Remove folder</button></div></article>`;
}

function assetBulkBar(folders) {
  const byParent = new Map();
  folders.forEach(folder => { const parent = folder.parent_id || ""; byParent.set(parent, [...(byParent.get(parent) || []), folder]); });
  const options = [], seen = new Set();
  const visit = (parent = "", depth = 0) => (byParent.get(parent) || []).forEach(folder => {
    if (seen.has(folder.id)) return; seen.add(folder.id);
    options.push(`<option value="${escapeHTML(folder.id)}">${"— ".repeat(depth)}${escapeHTML(folder.name)}</option>`);
    visit(folder.id, depth + 1);
  });
  visit();
  return `<div class="workspace-bulk-bar" data-asset-bulk hidden><b><span data-selected-count>0</span> selected</b><label>Move to<select data-bulk-folder><option value="">Project root</option>${options.join("")}</select></label><button type="button" data-bulk-move>Move</button><button class="danger" type="button" data-bulk-delete>Recently delete</button><button type="button" data-bulk-clear>Clear</button></div>`;
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
    folderGrid.innerHTML = `${activeFolder ? `<button class="workspace-folder-card root-target" type="button" data-folder-id=""><span>⌂</span><div><b>Project root</b><small>Move to top level</small></div><em>↖</em></button>` : ""}${children.map(folderCard).join("")}`;
    root.querySelectorAll(".workspace-tree [data-folder-id]").forEach(button => button.classList.toggle("active", button.dataset.folderId === activeFolder));
    const chain = []; let cursor = byId.get(activeFolder);
    while (cursor) { chain.unshift(cursor); cursor = byId.get(cursor.parent_id); }
    root.querySelector("[data-folder-crumbs]").innerHTML = chain.map(folder => `<i>/</i><button type="button" data-folder-id="${escapeHTML(folder.id)}">${escapeHTML(folder.name)}</button>`).join("");
    const label = root.querySelector("[data-visible-folder-label]"); if (label) label.textContent = activeFolder ? byId.get(activeFolder)?.name || "Folder" : "Project root";
    const manage = root.querySelector("[data-folder-settings-current]"); if (manage) { manage.hidden = !activeFolder; manage.dataset.folderSettingsCurrent = activeFolder; }
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
    root.querySelectorAll("[data-folder-menu]").forEach(button => button.addEventListener("click", event => { event.stopPropagation(); const panel = root.querySelector(`[data-folder-menu-panel="${CSS.escape(button.dataset.folderMenu)}"]`); root.querySelectorAll("[data-folder-menu-panel]").forEach(item => { if (item !== panel) item.hidden = true; }); panel.hidden = !panel.hidden; }));
    root.querySelectorAll("[data-folder-open-action]").forEach(button => button.addEventListener("click", () => setActive(button.dataset.folderOpenAction)));
    root.querySelectorAll("[data-folder-rename],[data-folder-remove]").forEach(button => button.addEventListener("click", () => { const id = button.dataset.folderRename || button.dataset.folderRemove; const folder = byId.get(id); if (folder) openFolderSettingsModal(root, projectId, folder, actions); }));
    folderGrid.addEventListener("click", () => root.querySelectorAll("[data-folder-menu-panel]").forEach(panel => { panel.hidden = true; }), { once:true });
  }
  root.querySelectorAll("[data-file-card]").forEach(card => card.addEventListener("dragstart", event => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("application/x-contentx-asset", card.dataset.assetId); card.classList.add("is-moving"); }));
  root.querySelectorAll("[data-file-card]").forEach(card => card.addEventListener("dragend", () => card.classList.remove("is-moving")));
  root.querySelectorAll("[data-create-folder]").forEach(button => button.addEventListener("click", async () => { const name = prompt("Folder name"); if (!name?.trim()) return; try { await api(UPLOAD_API, { method:"POST", headers:bearerHeaders("", true), body:JSON.stringify({ action:"create-folder", projectId, parentId:activeFolder || null, name:name.trim() }) }); actions.refreshRoute(); } catch (error) { alert(error.message); } }));
  root.querySelector("[data-folder-settings-current]")?.addEventListener("click", buttonEvent => { const folder = byId.get(buttonEvent.currentTarget.dataset.folderSettingsCurrent); if (folder) openFolderSettingsModal(root, projectId, folder, actions); });
  paintFolders();
}

function fileCard(file, canUpload, revisionPolicy = null, canManage = false) {
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
  return `<article class="workspace-file-card ${canUpload ? "" : "view-only"} ${isVideo ? "has-video-preview" : ""}" draggable="${canUpload}" data-file-card data-file-id="${escapeHTML(file.id)}" data-file-name="${escapeHTML(file.original_name)}" data-asset-id="${escapeHTML(assetId)}" data-folder-id="${escapeHTML(file.folder_id || "")}">${canManage ? `<label class="workspace-file-select" title="Select ${escapeHTML(file.original_name)}"><input type="checkbox" data-select-asset value="${escapeHTML(assetId)}" aria-label="Select ${escapeHTML(file.original_name)}"><span></span></label>` : ""}<button class="workspace-file-preview" type="button" data-file-open aria-label="Open ${escapeHTML(file.original_name)}"><span class="workspace-file-glyph">${fileGlyph(file.content_type)}</span>${isVideo ? '<span class="workspace-video-preview" data-video-preview aria-hidden="true"></span><small class="workspace-video-hint"><b>▶</b> Hover to preview</small>' : ""}<em>v${version}</em>${canUpload ? "<i>Drop replacement here</i>" : ""}</button><div class="workspace-file-info"><div><strong title="${escapeHTML(file.original_name)}">${escapeHTML(file.original_name)}</strong><small><span data-card-field="size">${formatBytes(file.size_bytes)}</span><span data-card-field="date"> · ${formatDate(file.completed_at)}</span></small></div>${canUpload ? `<div class="workspace-file-actions"><button type="button" data-new-version aria-label="Upload next version" title="Upload next version">＋</button>${canManage ? `<button type="button" data-delete-asset aria-label="Move to Recently deleted" title="Move to Recently deleted">${workspaceIcon("trash")}</button>` : ""}</div>` : ""}</div><footer><span data-card-field="versions">${count} version${count === 1 ? "" : "s"}</span><b data-card-field="status">Ready</b></footer>${revisionStatus}</article>`;
}

function bindAssetSelection(root, projectId, actions) {
  const bar = root.querySelector("[data-asset-bulk]"), checks = [...root.querySelectorAll("[data-select-asset]")];
  if (!bar || !checks.length) return;
  const selected = () => checks.filter(input => input.checked).map(input => input.value);
  const update = () => {
    const ids = selected(); bar.hidden = ids.length === 0; bar.querySelector("[data-selected-count]").textContent = String(ids.length);
    checks.forEach(input => input.closest("[data-file-card]").classList.toggle("is-selected", input.checked));
  };
  checks.forEach(input => { input.addEventListener("pointerdown", event => event.stopPropagation()); input.addEventListener("change", update); });
  bar.querySelector("[data-bulk-clear]").addEventListener("click", () => { checks.forEach(input => { input.checked = false; }); update(); });
  bar.querySelector("[data-bulk-move]").addEventListener("click", async event => {
    const ids = selected(); if (!ids.length) return; const button = event.currentTarget; button.disabled = true; button.textContent = "Moving…";
    try { await api(UPLOAD_API, { method:"PATCH", headers:bearerHeaders("", true), body:JSON.stringify({ action:"move-assets", projectId, folderId:bar.querySelector("[data-bulk-folder]").value || null, assetIds:ids }) }); actions.refreshRoute(); }
    catch (error) { button.disabled = false; button.textContent = "Move"; alert(error.message); }
  });
  bar.querySelector("[data-bulk-delete]").addEventListener("click", async event => {
    const ids = selected(); if (!ids.length || !confirm(`Move ${ids.length} selected asset${ids.length === 1 ? "" : "s"} and every version to Recently deleted?`)) return;
    const button = event.currentTarget; button.disabled = true; button.textContent = "Removing…";
    try { await api(UPLOAD_API, { method:"PATCH", headers:bearerHeaders("", true), body:JSON.stringify({ action:"project-files-delete", projectId, assetIds:ids }) }); actions.refreshRoute(); }
    catch (error) { button.disabled = false; button.textContent = "Recently delete"; alert(error.message); }
  });
}

function bindVideoHoverPreviews(root, projectId, token = "") {
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  root.querySelectorAll("[data-video-preview]").forEach(slot => {
    const card = slot.closest("[data-file-card]");
    const trigger = card?.querySelector("[data-file-open]");
    if (!card || !trigger || trigger.dataset.previewBound) return;
    trigger.dataset.previewBound = "true";
    let video = null;
    let linkRequest = null;
    let active = false;

    const mediaLink = () => {
      linkRequest ||= api(UPLOAD_API, {
        method:"POST",
        headers:bearerHeaders(token, true),
        body:JSON.stringify({ action:"project-download-link", projectId, fileId:card.dataset.fileId, inline:true }),
      });
      return linkRequest;
    };
    const readyToPaint = media => media.readyState >= 2 ? Promise.resolve() : new Promise((resolve, reject) => {
      media.addEventListener("loadeddata", resolve, { once:true });
      media.addEventListener("error", () => reject(new Error("Preview unavailable")), { once:true });
    });
    const start = async event => {
      if (event.type === "pointerenter" && event.pointerType === "touch") return;
      active = true;
      trigger.classList.remove("is-preview-unavailable");
      trigger.classList.add("is-preview-loading");
      try {
        if (!video) {
          const { downloadUrl } = await mediaLink();
          if (!trigger.isConnected) return;
          video = document.createElement("video");
          video.muted = true;
          video.defaultMuted = true;
          video.loop = true;
          video.playsInline = true;
          video.preload = "metadata";
          video.disablePictureInPicture = true;
          video.setAttribute("aria-hidden", "true");
          video.setAttribute("tabindex", "-1");
          slot.replaceChildren(video);
          video.src = downloadUrl;
        }
        await readyToPaint(video);
        if (!active || !trigger.isConnected) return;
        if (video.duration > .4 && video.currentTime === 0) video.currentTime = Math.min(.35, video.duration / 10);
        trigger.classList.add("is-previewing");
        if (!reducedMotion) await video.play().catch(() => undefined);
      } catch {
        if (active) trigger.classList.add("is-preview-unavailable");
      } finally {
        trigger.classList.remove("is-preview-loading");
      }
    };
    const stop = () => {
      active = false;
      video?.pause();
      trigger.classList.remove("is-previewing", "is-preview-loading");
    };
    trigger.addEventListener("pointerenter", start, { passive:true });
    trigger.addEventListener("pointerleave", stop, { passive:true });
    trigger.addEventListener("focus", start);
    trigger.addEventListener("blur", stop);
  });
}

function emptyWorkspace() {
  return `<section class="workspace-zero"><span>◇</span><h1>Your free review workspace is ready.</h1><p>Create a project, upload files, then send a private review link to your client. Every free account starts with 50 GB storage.</p><button class="workspace-button primary" type="button" data-create-free-project>Create first project</button></section>`;
}

async function openRecycleBinModal(root, project, actions) {
  const layer = root.querySelector("[data-workspace-layer]");
  layer.innerHTML = `<div class="workspace-modal-backdrop"><section class="workspace-share-modal workspace-recycle-modal" aria-labelledby="recycle-title"><button type="button" data-close-recycle aria-label="Close">×</button><p class="workspace-kicker">RECENTLY DELETED</p><h2 id="recycle-title">Recover project files</h2><p>Deleted assets and every version inside them stay recoverable for 30 days.</p><div class="workspace-recycle-loading" role="status"><i></i><span>Checking deleted files…</span></div></section></div>`;
  const close = () => { layer.innerHTML = ""; };
  layer.querySelector("[data-close-recycle]").addEventListener("click", close);
  layer.querySelector(".workspace-modal-backdrop").addEventListener("click", event => { if (event.target === event.currentTarget) close(); });
  try {
    const result = await api(`${UPLOAD_API}?action=deleted-files&projectId=${encodeURIComponent(project.id)}`, { cache:"no-store" });
    const modal = layer.querySelector(".workspace-recycle-modal");
    if (!modal) return;
    const files = result.files || [];
    modal.querySelector(".workspace-recycle-loading").outerHTML = files.length
      ? `<div class="workspace-recycle-list">${files.map(file => `<article data-deleted-asset="${escapeHTML(file.asset_id)}"><span>${fileGlyph(file.content_type)}</span><div><b>${escapeHTML(file.original_name)}</b><small>${Number(file.version_count || 1)} version${Number(file.version_count || 1) === 1 ? "" : "s"} · ${formatBytes(file.size_bytes)} · deleted ${formatDate(file.deleted_at)}</small></div><button class="workspace-button" type="button" data-restore-asset>Restore</button></article>`).join("")}</div>`
      : `<div class="workspace-recycle-empty"><span>✓</span><b>Nothing is waiting for recovery.</b><small>Files you remove from this project will appear here for ${Number(result.recycleBinDays || 30)} days.</small></div>`;
    modal.querySelectorAll("[data-restore-asset]").forEach(button => button.addEventListener("click", async () => {
      const row = button.closest("[data-deleted-asset]");
      button.disabled = true; button.textContent = "Restoring…";
      try {
        await api(UPLOAD_API, { method:"PATCH", headers:bearerHeaders("", true), body:JSON.stringify({ action:"project-file-restore", projectId:project.id, assetId:row.dataset.deletedAsset }) });
        row.classList.add("is-restored");
        button.textContent = "Restored ✓";
        setTimeout(() => { if (layer.isConnected) { close(); actions.refreshRoute(); } }, 500);
      } catch (error) {
        button.disabled = false; button.textContent = "Restore"; alert(error.message);
      }
    }));
  } catch (error) {
    const loading = layer.querySelector(".workspace-recycle-loading");
    if (loading) loading.outerHTML = `<div class="workspace-recycle-empty is-error"><span>!</span><b>Recently deleted could not open.</b><small>${escapeHTML(error.message)}</small></div>`;
  }
}

async function openVersions(root, projectId, assetId, token, canManage = false, onChange = () => {}) {
  return openReviewRoom({ layer:root.querySelector("[data-workspace-layer]"), api, headers:json => bearerHeaders(token, json), projectId, assetId, canManage, onChange });
}

async function openSharePanel(root, project, shares, files = []) {
  const layer = root.querySelector("[data-workspace-layer]");
  const defaultExpiry = localDateTime(Date.now() + 14 * 24 * 60 * 60 * 1000);
  layer.innerHTML = `<div class="workspace-modal-backdrop"><section class="workspace-share-modal workspace-share-control"><button type="button" data-close-share aria-label="Close">×</button><p class="workspace-kicker">SHARE PROJECT</p><h2>Create a secure review link</h2><p>Choose exactly what a reviewer can see and do. The secret link appears once and is copied when created.</p><form><label>Link label<input name="name" value="Client review" maxlength="100" placeholder="Client review, agency review, final approval..."></label><div class="workspace-share-permissions">${sharePermissionSwitch("uploads","Uploads","Add files or new versions.",false)}${sharePermissionSwitch("downloads","Downloads","Save original files.",true)}${sharePermissionSwitch("comments","Comments","Write text or voice feedback.",true)}${sharePermissionSwitch("approval","Approval","Approve or request changes.",true)}${sharePermissionSwitch("previous","Version history","Open earlier versions.",true)}</div><div class="workspace-share-edit-grid"><label>Exact expiry <span>optional</span><input name="expiresAt" type="datetime-local" value="${defaultExpiry}"></label><label>Password <span>optional</span><input name="password" type="password" minlength="6" maxlength="128" autocomplete="new-password" placeholder="At least 6 characters"></label></div>${shareAssetChoices(files)}<p role="alert" data-share-error hidden></p><button class="workspace-button primary" type="submit">Create & copy share link</button></form><div class="workspace-existing-shares"><h3>Manage links</h3><small class="workspace-share-safe-note">Secret URLs are only shown at creation. Disable a lost link and create a fresh one.</small>${shares.length ? shares.map(share => shareRow(share, files)).join("") : `<p>No share links created yet.</p>`}</div></section></div>`;
  const close = () => { layer.innerHTML = ""; };
  layer.querySelector("[data-close-share]").addEventListener("click", close);
  layer.querySelector(".workspace-modal-backdrop").addEventListener("click", event => { if (event.target === event.currentTarget) close(); });
  layer.querySelector("form").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget, button = form.querySelector("button[type=submit]"), error = form.querySelector("[data-share-error]");
    const values = Object.fromEntries(new FormData(form));
    const permission = key => form.querySelector(`[data-share-permission="${key}"]`).checked;
    const assetIds = [...form.querySelectorAll('[data-share-asset="new"]:checked')].map(input => input.value);
    const expiresAt = values.expiresAt ? Date.parse(String(values.expiresAt)) : null;
    button.disabled = true; button.textContent = "Creating link…"; error.hidden = true;
    try {
      const result = await api(UPLOAD_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"create-share-link", projectId:project.id, name:values.name, expiresAt, password:values.password, assetIds, allowUploads:permission("uploads"), allowDownloads:permission("downloads"), allowComments:permission("comments"), allowApproval:permission("approval"), allowPreviousVersions:permission("previous") }) });
      await copyShareUrl(result.shareUrl);
      const capabilities = [result.share.allowUploads ? "uploads" : "", result.share.allowDownloads ? "downloads" : "", result.share.allowComments ? "comments" : "", result.share.allowApproval ? "approval" : ""].filter(Boolean).join(", ") || "viewing only";
      layer.querySelector(".workspace-share-modal").innerHTML = `<span class="workspace-share-success">✓</span><p class="workspace-kicker">LINK READY</p><h2>${escapeHTML(result.share.name)}</h2><p>Access: ${escapeHTML(capabilities)}${result.share.scopedAssets ? ` · ${result.share.scopedAssets} selected file${result.share.scopedAssets === 1 ? "" : "s"}` : " · whole project"}${result.share.passwordProtected ? " · password protected" : ""}.</p><label>Shareable project link<input data-created-share value="${escapeHTML(result.shareUrl)}" readonly></label><div class="workspace-share-actions"><button class="workspace-button primary" type="button" data-copy-share>Copied to clipboard ✓</button><a class="workspace-button" href="${shareIntent("whatsapp", result.shareUrl, result.share.name)}" target="_blank" rel="noreferrer">WhatsApp</a><a class="workspace-button" href="${shareIntent("email", result.shareUrl, result.share.name)}">Email</a><a class="workspace-button" href="${shareIntent("facebook", result.shareUrl, result.share.name)}" target="_blank" rel="noreferrer">Facebook</a></div><button class="workspace-button" type="button" data-done-share>Done</button>`;
      layer.querySelector("[data-copy-share]").addEventListener("click", async event => { const copyButton = event.currentTarget; await copyShareUrl(result.shareUrl); if (copyButton.isConnected) copyButton.textContent = "Copied again ✓"; });
      layer.querySelector("[data-done-share]").addEventListener("click", close);
    } catch (failure) {
      error.textContent = failure.message; error.hidden = false; button.disabled = false; button.textContent = "Create share link";
    }
  });
  layer.querySelectorAll("[data-share-save]").forEach(button => button.addEventListener("click", async () => {
    const row = button.closest("[data-share-row]");
    const permission = key => row.querySelector(`[data-share-permission="${key}"]`).checked;
    const assetIds = [...row.querySelectorAll(`[data-share-asset="${CSS.escape(row.dataset.shareRow)}"]:checked`)].map(input => input.value);
    const expiresValue = row.querySelector("[data-share-expires]").value;
    const rowError = row.querySelector("[data-share-row-error]");
    button.disabled = true; button.textContent = "Saving…"; rowError.hidden = true;
    try {
      await api(UPLOAD_API, { method:"PATCH", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"share-link", projectId:project.id, shareId:row.dataset.shareRow, status:row.querySelector("[data-share-status]").value, name:row.querySelector("[data-share-name]").value, expiresAt:expiresValue ? Date.parse(expiresValue) : null, password:row.querySelector("[data-share-password]").value, clearPassword:row.querySelector("[data-share-clear-password]").checked, assetIds, allowUploads:permission("uploads"), allowDownloads:permission("downloads"), allowComments:permission("comments"), allowApproval:permission("approval"), allowPreviousVersions:permission("previous") }) });
      button.textContent = "Saved ✓"; setTimeout(() => { if (button.isConnected) { button.disabled = false; button.textContent = "Save access"; } }, 1200);
    } catch (error) {
      rowError.textContent = error.message; rowError.hidden = false; button.disabled = false; button.textContent = "Save access";
    }
  }));
}

async function openActivityPanel(root, project) {
  const layer = root.querySelector("[data-workspace-layer]");
  layer.innerHTML = `<div class="workspace-modal-backdrop"><section class="workspace-share-modal workspace-activity-modal"><button type="button" data-close-activity aria-label="Close">×</button><p class="workspace-kicker">PROJECT ACTIVITY</p><h2>${escapeHTML(project.name)}</h2><p>Uploads, feedback, version decisions and share links in one chronological trail.</p><div class="workspace-activity-loading" role="status"><i></i><span>Loading activity…</span></div></section></div>`;
  const close = () => { layer.innerHTML = ""; };
  layer.querySelector("[data-close-activity]").addEventListener("click", close);
  layer.querySelector(".workspace-modal-backdrop").addEventListener("click", event => { if (event.target === event.currentTarget) close(); });
  try {
    const data = await api(`${UPLOAD_API}?action=activity&projectId=${encodeURIComponent(project.id)}`, { cache:"no-store" });
    const modal = layer.querySelector(".workspace-activity-modal");
    if (!modal) return;
    const labels = { upload:"Uploaded", comment:"Commented", approved:"Approved", changes_requested:"Requested changes", share:"Created share link" };
    const items = data.activity || [];
    modal.querySelector(".workspace-activity-loading").outerHTML = items.length ? `<div class="workspace-activity-list">${items.map(item => `<article><span data-kind="${escapeHTML(item.event_type)}">${item.event_type === "upload" ? "↑" : item.event_type === "comment" ? "◌" : item.event_type === "approved" ? "✓" : item.event_type === "changes_requested" ? "↺" : "↗"}</span><div><b>${escapeHTML(labels[item.event_type] || "Updated")}</b><p>${escapeHTML(item.label || "Project activity")}</p><small>${escapeHTML(item.actor_name || "Content X")} · ${escapeHTML(new Date(Number(item.created_at)).toLocaleString())}</small></div></article>`).join("")}</div>` : `<div class="workspace-recycle-empty"><span>◇</span><b>No activity yet</b><small>Uploads, comments, decisions and links will appear here.</small></div>`;
  } catch (error) {
    const loading = layer.querySelector(".workspace-activity-loading");
    if (loading) loading.outerHTML = `<div class="workspace-recycle-empty is-error"><span>!</span><b>Activity could not load.</b><small>${escapeHTML(error.message)}</small></div>`;
  }
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

function openProjectSettingsModal(root, project, actions) {
  const layer = root.querySelector("[data-workspace-layer]");
  layer.innerHTML = `<div class="workspace-modal-backdrop"><form class="workspace-share-modal workspace-settings-modal"><button type="button" data-close-settings aria-label="Close">×</button><p class="workspace-kicker">PROJECT SETTINGS</p><h2>Keep project details current</h2><p>Correct names, update the client contact, or archive finished work without deleting its files.</p><label>Project name<input name="name" required maxlength="120" value="${escapeHTML(project.name)}"></label><div class="workspace-settings-grid"><label>Client name <span>optional</span><input name="clientName" maxlength="120" value="${escapeHTML(project.clientName || "")}"></label><label>Client email <span>optional</span><input name="clientEmail" type="email" maxlength="254" value="${escapeHTML(project.clientEmail || "")}"></label></div><label>Project status<select name="status"><option value="active" ${project.status === "active" ? "selected" : ""}>Active — uploads and share links work</option><option value="archived" ${project.status === "archived" ? "selected" : ""}>Archived — preserved, but uploads stop</option></select></label><p role="alert" data-settings-error hidden></p><button class="workspace-button primary" type="submit">Save project settings</button><div class="workspace-settings-danger"><div><b>Need to remove it forever?</b><small>Permanent deletion remains protected by typed confirmation.</small></div><button class="workspace-button danger" type="button" data-delete-from-settings>Delete project</button></div></form></div>`;
  const form = layer.querySelector("form");
  const close = () => { layer.innerHTML = ""; };
  layer.querySelector("[data-close-settings]").addEventListener("click", close);
  layer.querySelector(".workspace-modal-backdrop").addEventListener("click", event => { if (event.target === event.currentTarget) close(); });
  layer.querySelector("[data-delete-from-settings]").addEventListener("click", () => openDeleteProjectModal(root, project, actions));
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const button = form.querySelector("button[type=submit]");
    const error = form.querySelector("[data-settings-error]");
    button.disabled = true; button.textContent = "Saving…"; error.hidden = true;
    try {
      await api(UPLOAD_API, { method:"PATCH", headers:bearerHeaders("", true), body:JSON.stringify({ action:"project-settings", projectId:project.id, ...Object.fromEntries(new FormData(form)) }) });
      close(); actions.refreshRoute();
    } catch (failure) {
      error.textContent = failure.message; error.hidden = false; button.disabled = false; button.textContent = "Save project settings";
    }
  });
}

function openFolderSettingsModal(root, projectId, folder, actions) {
  const layer = root.querySelector("[data-workspace-layer]");
  layer.innerHTML = `<div class="workspace-modal-backdrop"><form class="workspace-share-modal workspace-folder-modal"><button type="button" data-close-folder-settings aria-label="Close">×</button><p class="workspace-kicker">FOLDER OPTIONS</p><h2>${escapeHTML(folder.name)}</h2><label>Folder name<input name="name" required maxlength="80" value="${escapeHTML(folder.name)}"></label><p role="alert" data-folder-error hidden></p><button class="workspace-button primary" type="submit">Save folder name</button><aside><span>↖</span><div><b>Safe folder removal</b><small>Files and subfolders move up one level. No media is deleted.</small></div></aside><button class="workspace-button danger" type="button" data-remove-folder>Remove folder only</button></form></div>`;
  const form = layer.querySelector("form");
  const error = form.querySelector("[data-folder-error]");
  const close = () => { layer.innerHTML = ""; };
  layer.querySelector("[data-close-folder-settings]").addEventListener("click", close);
  layer.querySelector(".workspace-modal-backdrop").addEventListener("click", event => { if (event.target === event.currentTarget) close(); });
  form.addEventListener("submit", async event => {
    event.preventDefault(); const button = form.querySelector("button[type=submit]");
    button.disabled = true; button.textContent = "Saving…"; error.hidden = true;
    try { await api(UPLOAD_API, { method:"PATCH", headers:bearerHeaders("", true), body:JSON.stringify({ action:"rename-folder", projectId, folderId:folder.id, name:new FormData(form).get("name") }) }); close(); actions.refreshRoute(); }
    catch (failure) { error.textContent = failure.message; error.hidden = false; button.disabled = false; button.textContent = "Save folder name"; }
  });
  layer.querySelector("[data-remove-folder]").addEventListener("click", async event => {
    if (!confirm(`Remove the folder “${folder.name}”? Its contents will move up one level.`)) return;
    const button = event.currentTarget; button.disabled = true; button.textContent = "Removing folder…"; error.hidden = true;
    try { await api(`${UPLOAD_API}?action=project-folder&projectId=${encodeURIComponent(projectId)}&folderId=${encodeURIComponent(folder.id)}`, { method:"DELETE" }); sessionStorage.removeItem(`cx_active_folder_${projectId}`); close(); actions.refreshRoute(); }
    catch (failure) { error.textContent = failure.message; error.hidden = false; button.disabled = false; button.textContent = "Remove folder only"; }
  });
}

function openDeleteProjectModal(root, project, actions) {
  const layer = root.querySelector("[data-workspace-layer]");
  layer.innerHTML = `<div class="workspace-modal-backdrop"><form class="workspace-share-modal workspace-delete-modal"><button type="button" data-close-delete aria-label="Close">×</button><p class="workspace-kicker">DANGER ZONE</p><h2>Delete this project?</h2><p>This permanently removes <strong>${escapeHTML(project.name)}</strong>, its folders, comments, share links, every file version, and stored media. Payment history remains available.</p><aside><span>!</span><div><b>This cannot be undone.</b><small>If this is your only project, a fresh empty project will be created automatically.</small></div></aside><label>Type <strong>${escapeHTML(project.name)}</strong> to confirm<input name="confirmation" autocomplete="off" required></label><p role="alert" data-delete-error hidden></p><button class="workspace-button danger" type="submit" disabled>Delete project permanently</button></form></div>`;
  const form = layer.querySelector("form");
  const close = () => { layer.innerHTML = ""; };
  const input = form.elements.confirmation;
  const submit = form.querySelector("button[type=submit]");
  layer.querySelector("[data-close-delete]").addEventListener("click", close);
  layer.querySelector(".workspace-modal-backdrop").addEventListener("click", event => { if (event.target === event.currentTarget) close(); });
  input.addEventListener("input", () => { submit.disabled = input.value.trim() !== project.name; });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const error = form.querySelector("[data-delete-error]");
    if (input.value.trim() !== project.name) return;
    submit.disabled = true; submit.textContent = "Deleting project…"; error.hidden = true;
    try {
      await api(`${UPLOAD_API}?action=account-project&projectId=${encodeURIComponent(project.id)}`, { method:"DELETE" });
      sessionStorage.removeItem(`cx_active_folder_${project.id}`);
      close();
      if (location.hash === "#workspace") actions.refreshRoute();
      else location.hash = "workspace";
    } catch (failure) {
      error.textContent = failure.message; error.hidden = false; submit.disabled = false; submit.textContent = "Delete project permanently";
    }
  });
  input.focus();
}

function commentIsComplete(comment) {
  return comment.status === "completed" || comment.status === "resolved";
}

function commentsPanel(comments, canManageComments, canComment = true) {
  const ordered = [...comments].sort((a, b) => Number(commentIsComplete(a)) - Number(commentIsComplete(b)) || Number(b.created_at || 0) - Number(a.created_at || 0));
  const open = ordered.filter(comment => !commentIsComplete(comment)).length;
  return `<section class="workspace-comments"><header><div><h2>Review comments</h2><p>Open feedback stays first so the next decision is always clear.</p></div><div class="workspace-comment-summary"><span>${open} open · ${comments.length} total</span>${comments.length ? `<div><button class="active" type="button" data-comment-filter="open">Open</button><button type="button" data-comment-filter="all">All</button></div>` : ""}</div></header><div class="workspace-comment-list">${ordered.length ? ordered.map(comment => commentRow(comment, canManageComments)).join("") : `<article class="workspace-comment-empty"><span>◌</span><b>No feedback yet</b><small>Share this project with your client to collect comments here.</small></article>`}</div><p class="workspace-comment-filter-empty" hidden>Everything is resolved. Switch to All to view completed feedback.</p>${canComment ? `<form class="workspace-comment-form"><div><input name="authorName" required maxlength="100" placeholder="Your name"><input name="authorEmail" type="email" maxlength="254" placeholder="Email optional"></div><textarea name="body" required maxlength="2000" rows="3" placeholder="Write feedback for this project…"></textarea><button class="workspace-button primary" type="submit">Send comment</button><p role="alert" hidden></p></form>` : `<div class="workspace-comment-locked"><span>◇</span><div><b>Comments are view-only</b><small>The project owner disabled new feedback for this link.</small></div></div>`}</section>`;
}

function commentRow(comment, canManageComments) {
  const completed = commentIsComplete(comment);
  const timestamp = hasTimestamp(comment.timestamp_seconds) ? `<em>${formatDuration(Number(comment.timestamp_seconds))}</em>` : "";
  return `<article class="workspace-comment ${completed ? "completed" : ""}" data-comment-status="${completed ? "completed" : "open"}"><span>${escapeHTML((comment.author_name || "?").slice(0,1).toUpperCase())}</span><div><strong>${escapeHTML(comment.author_name || "Reviewer")} <small>${formatDate(comment.created_at)}</small></strong>${timestamp}<p>${escapeHTML(comment.body)}</p></div>${canManageComments ? `<button type="button" data-comment-complete="${escapeHTML(comment.id)}">${completed ? "Completed ✓" : "Mark complete"}</button>` : ""}</article>`;
}

function bindComments(root, projectId, token, actions, canManageComments = false) {
  const form = root.querySelector(".workspace-comment-form");
  const filterEmpty = root.querySelector(".workspace-comment-filter-empty");
  root.querySelectorAll("[data-comment-filter]").forEach(button => button.addEventListener("click", () => {
    const filter = button.dataset.commentFilter; let visible = 0;
    root.querySelectorAll("[data-comment-filter]").forEach(item => item.classList.toggle("active", item === button));
    root.querySelectorAll("[data-comment-status]").forEach(comment => { comment.hidden = filter === "open" && comment.dataset.commentStatus !== "open"; if (!comment.hidden) visible++; });
    if (filterEmpty) filterEmpty.hidden = visible > 0 || filter !== "open";
  }));
  root.querySelector('[data-comment-filter="open"]')?.click();
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

function localDateTime(value) {
  if (!value) return "";
  const date = new Date(Number(value));
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0,16);
}

function parseShareScope(value) {
  try { const parsed = JSON.parse(value || "[]"); return Array.isArray(parsed) ? parsed.map(String) : []; }
  catch { return []; }
}

function shareAssetChoices(files, selected = [], prefix = "new") {
  const selectedIds = new Set(selected);
  if (!files.length) return `<p class="workspace-share-no-assets">Upload a file before creating a file-specific link.</p>`;
  return `<fieldset class="workspace-share-assets"><legend>Files included</legend><p>Leave every file unchecked to share the whole project, including future files.</p><div>${files.map(file => { const assetId = String(file.asset_id || file.id); return `<label><input type="checkbox" data-share-asset="${escapeHTML(prefix)}" value="${escapeHTML(assetId)}" ${selectedIds.has(assetId) ? "checked" : ""}><span>${fileGlyph(file.content_type)}</span><b>${escapeHTML(file.original_name)}</b></label>`; }).join("")}</div></fieldset>`;
}

function sharePermissionSwitch(key, title, description, checked = true) {
  return `<label class="workspace-switch compact"><span><b>${title}</b><small>${description}</small></span><input type="checkbox" data-share-permission="${key}" ${checked ? "checked" : ""}><i></i></label>`;
}

function shareRow(share, files) {
  const active = share.status === "active", scope = parseShareScope(share.asset_scope_json);
  const metrics = `${Number(share.view_count || 0)} views · ${Number(share.comment_count || 0)} comments · ${Number(share.approval_count || 0)} decisions · ${Number(share.download_count || 0)} downloads`;
  return `<article data-share-row="${escapeHTML(share.id)}" class="workspace-share-row"><header><div><label>Label<input data-share-name value="${escapeHTML(share.name)}" maxlength="100"></label><small>${active ? "Active" : "Disabled"} · ${scope.length ? `${scope.length} selected file${scope.length === 1 ? "" : "s"}` : "Whole project"} · ${share.expires_at ? `Expires ${formatDate(share.expires_at)}` : "No expiry"}</small><em>${metrics}</em></div><span>${share.password_protected ? "Password protected" : "No password"}</span></header><details><summary>Edit access</summary><div class="workspace-share-permissions">${sharePermissionSwitch("uploads","Uploads","Add files or new versions.",Boolean(share.allow_uploads))}${sharePermissionSwitch("downloads","Downloads","Save original files.",share.allow_downloads !== 0)}${sharePermissionSwitch("comments","Comments","Write text or voice feedback.",share.allow_comments !== 0)}${sharePermissionSwitch("approval","Approval","Approve or request changes.",share.allow_approval !== 0)}${sharePermissionSwitch("previous","Version history","Open earlier versions.",share.allow_previous_versions !== 0)}</div><div class="workspace-share-edit-grid"><label>Exact expiry<input type="datetime-local" data-share-expires value="${localDateTime(share.expires_at)}"></label><label>Status<select data-share-status><option value="active" ${active ? "selected" : ""}>Active</option><option value="revoked" ${!active ? "selected" : ""}>Disabled</option></select></label><label>New password <span>optional</span><input type="password" data-share-password minlength="6" maxlength="128" autocomplete="new-password" placeholder="Keep current password"></label><label class="mini-check"><input type="checkbox" data-share-clear-password> Remove password</label></div>${shareAssetChoices(files, scope, share.id)}<button class="workspace-button primary" type="button" data-share-save>Save access</button><p role="alert" data-share-row-error hidden></p></details></article>`;
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
    const permissions = data.permissions || {};
    const allowed = [permissions.canComment ? "Feedback" : "", permissions.canApprove ? "Approval" : "", permissions.canDownload ? "Downloads" : "", canUpload ? "Uploads" : ""].filter(Boolean);
    root.innerHTML = `<header class="shared-header"><a href="#home"><span>CX</span><b>Content X</b></a><div><b>Shared project</b><small>${allowed.length ? allowed.join(" · ") : "View only"}</small></div></header><main class="shared-main"><section class="shared-title"><p class="workspace-kicker">PRIVATE CLIENT LINK</p><h1>${escapeHTML(data.project.name)}</h1><p>Open the shared files and use the available review controls below. No Content X account is required.</p><div class="shared-permission-chips">${allowed.map(label => `<span>✓ ${label}</span>`).join("")}${permissions.canViewPrevious ? `<span>✓ Version history</span>` : `<span>Latest version only</span>`}${permissions.scopedAssets ? `<span>${permissions.scopedAssets} selected file${permissions.scopedAssets === 1 ? "" : "s"}</span>` : `<span>Whole project</span>`}</div></section>${projectSurface(data.project, data.files || [], data.folders || [], canUpload, commentData.comments || [], false, null, false, permissions)}</main><input type="file" multiple hidden data-workspace-picker><div data-workspace-layer></div>`;
    enhanceFileLibrary(root, data.files || [], commentData.comments || []);
    bindVideoHoverPreviews(root, resolvedProjectId, token);
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
  } catch (error) { error.status === 401 ? sharedPasswordGate(root, actions, route, token, error.message) : sharedError(root, error.message); }
}

function sharedPasswordGate(root, actions, route, token, message) {
  root.innerHTML = `<main class="shared-password-gate"><a href="#home" class="workspace-brand"><span>CX</span><b>Content X</b></a><form><p class="workspace-kicker">PROTECTED REVIEW</p><h1>Enter the share password.</h1><p>${escapeHTML(message || "This private link is password protected.")}</p><label>Password<input name="password" type="password" minlength="6" maxlength="128" autocomplete="current-password" required autofocus></label><button class="workspace-button primary" type="submit">Open shared project</button><p role="alert" hidden></p></form></main>`;
  const form = root.querySelector("form");
  form.addEventListener("submit", async event => {
    event.preventDefault(); const password = form.elements.password.value; const button = form.querySelector("button[type=submit]"), error = form.querySelector("[role=alert]");
    button.disabled = true; button.textContent = "Checking…"; error.hidden = true; sharePasswords.set(token, password);
    try { await renderSharedWorkspace(root, actions, route); }
    catch (failure) { sharePasswords.delete(token); error.textContent = failure.message; error.hidden = false; button.disabled = false; button.textContent = "Open shared project"; }
  });
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
    row.innerHTML = `<span>${fileGlyph(file.type)}</span><div><b>${escapeHTML(file.name)}</b><small>Preparing secure upload…</small><i><em></em></i><div class="workspace-upload-actions"><button type="button" data-upload-pause>Pause</button><button type="button" data-upload-cancel>Cancel</button></div></div><strong>0%</strong>`;
    queue.prepend(row);
    const control = { paused:false, cancelled:false, resume:null };
    row.querySelector("[data-upload-pause]").addEventListener("click", event => {
      if (row.classList.contains("done") || row.classList.contains("error")) return;
      control.paused = !control.paused; row.classList.toggle("paused", control.paused); event.currentTarget.textContent = control.paused ? "Resume" : "Pause";
      if (!control.paused) { control.resume?.(); control.resume = null; }
    });
    row.querySelector("[data-upload-cancel]").addEventListener("click", event => { if (row.classList.contains("done") || row.classList.contains("error")) return; control.cancelled = true; control.paused = false; control.resume?.(); control.resume = null; event.currentTarget.disabled = true; row.querySelector("small").textContent = "Cancelling secure upload…"; });
    activeWorkspaceUploads += 1;
    try {
      if (!fileLooksSafe(file)) throw new Error("This file type is blocked for safety. Use video, audio, image, PDF, text, CSV or subtitle files.");
      await verifyVideoDuration(file, Number(maxVideoSeconds || 0), row);
      await uploadOne(file, row, projectId, token, replaceFileId, control);
    } catch (error) {
      row.classList.add("error"); row.querySelector("small").textContent = error.message; row.querySelector("strong").textContent = "!";
      row.querySelectorAll(".workspace-upload-actions button").forEach(button => { button.disabled = true; });
    } finally {
      activeWorkspaceUploads = Math.max(0, activeWorkspaceUploads - 1);
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

function uploadPartCanRetry(error) {
  const status = Number(error?.status || 0);
  return !status || status === 408 || status === 425 || status === 429 || status >= 500;
}

async function uploadPartWithRetry(url, options, row, partNumber, checkpoint) {
  const maximumAttempts = 3;
  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try { return await api(url, options); }
    catch (error) {
      if (attempt === maximumAttempts || !uploadPartCanRetry(error)) throw error;
      row.querySelector("small").textContent = `Connection interrupted · retrying part ${partNumber} (${attempt}/${maximumAttempts - 1})…`;
      await new Promise(resolve => setTimeout(resolve, attempt * 450));
      await checkpoint();
    }
  }
  throw new Error("This upload part could not be completed.");
}

async function uploadOne(file, row, projectId, token, replaceFileId, control = { paused:false, cancelled:false, resume:null }) {
  let session;
  const setProgress = (percent, label) => { row.querySelector("small").textContent = label; row.querySelector("em").style.width = `${percent}%`; row.querySelector("strong").textContent = percent >= 100 ? "✓" : `${percent}%`; };
  const checkpoint = async () => {
    if (control.cancelled) throw new Error("Upload cancelled. No partial file was kept.");
    if (!control.paused) return;
    row.querySelector("small").textContent = "Upload paused safely. Resume when ready.";
    await new Promise(resolve => { control.resume = resolve; });
    control.resume = null;
    if (control.cancelled) throw new Error("Upload cancelled. No partial file was kept.");
  };
  try {
    await checkpoint();
    session = await api(UPLOAD_API, { method:"POST", headers:bearerHeaders(token, true), body:JSON.stringify({ action:"start-upload", projectId, fileName:file.name, fileSize:file.size, contentType:file.type, replaceFileId:replaceFileId || undefined }) });
    const parts = [];
    let sent = 0;
    for (let offset = 0, partNumber = 1; offset < file.size; offset += session.partSize, partNumber += 1) {
      await checkpoint();
      const blob = file.slice(offset, Math.min(offset + session.partSize, file.size));
      const part = await uploadPartWithRetry(`${UPLOAD_API}?action=upload-part&projectId=${encodeURIComponent(projectId)}&fileId=${encodeURIComponent(session.fileId)}&uploadId=${encodeURIComponent(session.uploadId)}&partNumber=${partNumber}`, { method:"PUT", headers:bearerHeaders(token), body:blob }, row, partNumber, checkpoint);
      parts.push(part); sent += blob.size; setProgress(Math.min(98, Math.round(sent / file.size * 100)), `${replaceFileId ? `Uploading version ${session.versionNumber}` : "Uploading"} · ${formatBytes(sent)} of ${formatBytes(file.size)}`);
    }
    await checkpoint();
    await api(UPLOAD_API, { method:"POST", headers:bearerHeaders(token, true), body:JSON.stringify({ action:"complete-upload", projectId, fileId:session.fileId, uploadId:session.uploadId, parts }) });
    row.classList.add("done"); row.querySelectorAll(".workspace-upload-actions button").forEach(button => { button.disabled = true; }); setProgress(100, replaceFileId ? `Version ${session.versionNumber} ready` : "Upload ready");
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
  element.addEventListener("drop", event => { event.stopPropagation(); handler([...event.dataTransfer.files]); });
}
