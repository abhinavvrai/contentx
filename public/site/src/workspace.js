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

async function api(url, options = {}) {
  const response = await fetch(url, { credentials:"same-origin", ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "This workspace request could not be completed.");
  return body;
}

const bearerHeaders = (token, json = false) => ({ ...(token ? { Authorization:`Bearer ${token}` } : {}), ...(json ? { "Content-Type":"application/json" } : {}) });

export async function renderClientWorkspace(root, actions, route) {
  root.className = "workspace-app";
  root.innerHTML = `<main class="workspace-loading"><span></span><h1>Opening your workspace…</h1></main>`;
  try {
    const account = await api(BRIEF_API, { cache:"no-store" });
    const projects = (account.orders || []).filter(order => order.project_id);
    const params = new URLSearchParams(route.split("?")[1] || "");
    const requested = params.get("project");
    const selected = projects.find(project => project.project_id === requested) || projects[0] || null;
    const [projectData, shareData] = selected ? await Promise.all([
      api(`${UPLOAD_API}?action=project&projectId=${encodeURIComponent(selected.project_id)}`, { cache:"no-store" }),
      api(`${UPLOAD_API}?action=shares&projectId=${encodeURIComponent(selected.project_id)}`, { cache:"no-store" }),
    ]) : [{ project:null, files:[], permissions:{ canUpload:false } }, { shares:[] }];
    renderWorkspaceShell(root, actions, account.user, projects, selected, projectData, shareData.shares || []);
  } catch (error) {
    root.innerHTML = `<main class="workspace-error"><span>!</span><h1>Workspace unavailable.</h1><p>${escapeHTML(error.message)}</p><a class="workspace-button primary" href="#account">Return to account</a></main>`;
  }
}

function renderWorkspaceShell(root, actions, user, projects, selected, projectData, shares) {
  const project = projectData.project;
  const files = projectData.files || [];
  root.innerHTML = `<div class="workspace-shell">
    <aside class="workspace-sidebar">
      <a class="workspace-brand" href="#home"><span>CX</span><b>Content X</b></a>
      <nav><a class="active" href="#workspace"><span>▱</span>Projects</a><a href="#account"><span>◎</span>Orders & briefs</a><a href="#home"><span>＋</span>New project</a></nav>
      <div class="workspace-project-nav"><small>YOUR PROJECTS</small>${projects.map(item => `<a class="${selected?.project_id === item.project_id ? "active" : ""}" href="#workspace?project=${encodeURIComponent(item.project_id)}"><span>${escapeHTML((item.title || item.plan_name || "P").slice(0,1).toUpperCase())}</span><b>${escapeHTML(item.title || item.plan_name)}</b><small>${escapeHTML(item.brief_status || "Ready")}</small></a>`).join("") || `<p>Your paid projects appear here.</p>`}</div>
      <div class="workspace-user"><span>${escapeHTML(user.name.slice(0,1).toUpperCase())}</span><div><b>${escapeHTML(user.name)}</b><small>${escapeHTML(user.email)}</small></div><a href="#account" aria-label="Account settings">•••</a></div>
    </aside>
    <main class="workspace-main">
      <header class="workspace-topbar"><button type="button" data-workspace-menu aria-label="Open project menu">☰</button><div><span>Projects</span>${project ? `<b>/ ${escapeHTML(project.name)}</b>` : ""}</div><div>${project ? `<button class="workspace-button" type="button" data-share-project>Share</button><button class="workspace-button primary" type="button" data-upload-files>Upload files</button>` : `<a class="workspace-button primary" href="#home">Choose a package</a>`}</div></header>
      ${project ? projectSurface(project, files, projectData.permissions?.canUpload !== false) : emptyWorkspace()}
    </main>
  </div><input type="file" multiple hidden data-workspace-picker><div data-workspace-layer></div>`;

  root.querySelector("[data-workspace-menu]")?.addEventListener("click", () => root.querySelector(".workspace-sidebar").classList.toggle("open"));
  root.querySelector(".workspace-main")?.addEventListener("click", () => root.querySelector(".workspace-sidebar")?.classList.remove("open"));
  if (!project) return;
  const picker = root.querySelector("[data-workspace-picker]");
  root.querySelector("[data-upload-files]")?.addEventListener("click", () => { picker.dataset.replaceFile = ""; picker.click(); });
  root.querySelector("[data-project-drop]")?.addEventListener("click", () => { picker.dataset.replaceFile = ""; picker.click(); });
  picker.addEventListener("change", async () => {
    await uploadSelectedFiles(root, project.id, "", [...picker.files], picker.dataset.replaceFile || "", project.maxFileSize);
    picker.value = "";
    actions.refreshRoute();
  });
  bindDropTarget(root.querySelector("[data-project-drop]"), async dropped => {
    await uploadSelectedFiles(root, project.id, "", dropped, "", project.maxFileSize);
    actions.refreshRoute();
  });
  root.querySelectorAll("[data-file-card]").forEach(card => {
    const fileId = card.dataset.fileId;
    const assetId = card.dataset.assetId;
    card.querySelector("[data-file-open]").addEventListener("click", () => openVersions(root, project.id, assetId, ""));
    card.querySelector("[data-new-version]")?.addEventListener("click", () => { picker.dataset.replaceFile = fileId; picker.click(); });
    bindDropTarget(card, async dropped => {
      await uploadSelectedFiles(root, project.id, "", dropped.slice(0, 1), fileId, project.maxFileSize);
      actions.refreshRoute();
    }, "is-version-drop");
  });
  root.querySelector("[data-share-project]")?.addEventListener("click", () => openSharePanel(root, project, shares));
}

function projectSurface(project, files, canUpload) {
  return `<section class="workspace-project-head"><div><p>PROJECT</p><h1>${escapeHTML(project.name)}</h1><span>${files.length} active file${files.length === 1 ? "" : "s"} · Updated ${formatDate(project.updatedAt)}</span></div><div class="workspace-view-toggle"><button class="active" type="button">Grid</button><button type="button">List</button></div></section>
    <section class="workspace-dropbar ${canUpload ? "" : "disabled"}" data-project-drop><span>↑</span><div><b>${canUpload ? "Drop files anywhere here" : "This link is view-only"}</b><small>${canUpload ? "Upload new assets, or drop directly on a file to create its next version." : "Ask the owner to enable uploads on this share link."}</small></div></section>
    <section class="workspace-files"><header><div><h2>Files</h2><span>Latest versions</span></div><p>${canUpload ? "Drop a replacement onto a card to keep every version together." : "Open a file to review and download its version history."}</p></header><div class="workspace-file-grid">${files.length ? files.map(file => fileCard(file, canUpload)).join("") : `<div class="workspace-empty-files"><span>↑</span><h3>No files yet</h3><p>${canUpload ? "Upload raw footage, references, audio or working files." : "The project owner has not shared any files yet."}</p></div>`}</div></section>
    <section class="workspace-queue" data-workspace-queue></section>`;
}

function fileCard(file, canUpload) {
  const version = Number(file.version_number || 1);
  const count = Number(file.version_count || 1);
  return `<article class="workspace-file-card ${canUpload ? "" : "view-only"}" data-file-card data-file-id="${escapeHTML(file.id)}" data-asset-id="${escapeHTML(file.asset_id || file.id)}"><button class="workspace-file-preview" type="button" data-file-open><span>${fileGlyph(file.content_type)}</span><em>v${version}</em>${canUpload ? "<i>Drop replacement here</i>" : ""}</button><div class="workspace-file-info"><div><strong title="${escapeHTML(file.original_name)}">${escapeHTML(file.original_name)}</strong><small>${formatBytes(file.size_bytes)} · ${formatDate(file.completed_at)}</small></div>${canUpload ? '<button type="button" data-new-version aria-label="Upload next version">＋</button>' : ""}</div><footer><span>${count} version${count === 1 ? "" : "s"}</span><b>Ready</b></footer></article>`;
}

function emptyWorkspace() {
  return `<section class="workspace-zero"><span>◇</span><h1>Your production workspace is ready.</h1><p>Complete payment and submit the brief to open a project with uploads, versions and share links.</p><a class="workspace-button primary" href="#home">View packages</a></section>`;
}

async function openVersions(root, projectId, assetId, token) {
  const layer = root.querySelector("[data-workspace-layer]");
  layer.innerHTML = `<div class="workspace-drawer-backdrop"><aside class="workspace-drawer"><button type="button" data-close-drawer>×</button><div class="workspace-drawer-loading">Loading versions…</div></aside></div>`;
  layer.querySelector("[data-close-drawer]").addEventListener("click", () => { layer.innerHTML = ""; });
  try {
    const data = await api(`${UPLOAD_API}?action=versions&projectId=${encodeURIComponent(projectId)}&assetId=${encodeURIComponent(assetId)}`, { headers:bearerHeaders(token) });
    const drawer = layer.querySelector(".workspace-drawer");
    drawer.innerHTML = `<button type="button" data-close-drawer>×</button><p class="workspace-kicker">VERSION HISTORY</p><h2>${escapeHTML(data.versions[0]?.original_name || "Project file")}</h2><p>Every replacement stays attached to the same asset.</p><div class="workspace-version-list">${data.versions.map(version => `<article><span>${fileGlyph(version.content_type)}</span><div><b>Version ${Number(version.version_number || 1)}</b><small>${escapeHTML(version.original_name)} · ${formatBytes(version.size_bytes)} · ${formatDate(version.completed_at)}</small></div><button type="button" data-download-version="${escapeHTML(version.id)}">Download</button></article>`).join("")}</div>`;
    drawer.querySelector("[data-close-drawer]").addEventListener("click", () => { layer.innerHTML = ""; });
    drawer.querySelectorAll("[data-download-version]").forEach(button => button.addEventListener("click", () => downloadProjectFile(projectId, button.dataset.downloadVersion, token, button)));
  } catch (error) {
    layer.querySelector(".workspace-drawer-loading").textContent = error.message;
  }
}

async function openSharePanel(root, project, shares) {
  const layer = root.querySelector("[data-workspace-layer]");
  layer.innerHTML = `<div class="workspace-modal-backdrop"><section class="workspace-share-modal"><button type="button" data-close-share>×</button><p class="workspace-kicker">SHARE PROJECT</p><h2>Create a client link</h2><p>Clients can review and download the latest files. Turn on uploads when you also want them to add references or replacements.</p><form><label>Link name<input name="name" value="Client review" maxlength="100"></label><label class="workspace-switch"><span><b>Allow uploads</b><small>People with the link can add files and create new versions.</small></span><input type="checkbox" name="allowUploads"><i></i></label><label>Link expiry<select name="expiryDays"><option value="0">Never expires</option><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option></select></label><p role="alert" data-share-error hidden></p><button class="workspace-button primary" type="submit">Create share link</button></form><div class="workspace-existing-shares"><h3>Existing links</h3>${shares.length ? shares.map(shareRow).join("") : `<p>No share links created yet.</p>`}</div></section></div>`;
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
      layer.querySelector(".workspace-share-modal").innerHTML = `<span class="workspace-share-success">✓</span><p class="workspace-kicker">LINK READY</p><h2>${escapeHTML(result.share.name)}</h2><p>${result.share.allowUploads ? "This link accepts downloads, new files and replacement versions." : "This link is view and download only."}</p><label>Shareable project link<input data-created-share value="${escapeHTML(result.shareUrl)}" readonly></label><button class="workspace-button primary" type="button" data-copy-share>Copy link</button><button class="workspace-button" type="button" data-done-share>Done</button>`;
      layer.querySelector("[data-copy-share]").addEventListener("click", async event => { await navigator.clipboard.writeText(result.shareUrl); event.currentTarget.textContent = "Copied ✓"; });
      layer.querySelector("[data-done-share]").addEventListener("click", close);
    } catch (failure) {
      error.textContent = failure.message; error.hidden = false; button.disabled = false; button.textContent = "Create share link";
    }
  });
  layer.querySelectorAll("[data-share-toggle]").forEach(button => button.addEventListener("click", async () => {
    await api(UPLOAD_API, { method:"PATCH", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"share-link", projectId:project.id, shareId:button.dataset.shareToggle, status:"active", allowUploads:button.dataset.uploads !== "true" }) });
    button.dataset.uploads = button.dataset.uploads === "true" ? "false" : "true";
    button.textContent = button.dataset.uploads === "true" ? "Uploads on" : "View only";
  }));
  layer.querySelectorAll("[data-share-revoke]").forEach(button => button.addEventListener("click", async () => {
    await api(UPLOAD_API, { method:"PATCH", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action:"share-link", projectId:project.id, shareId:button.dataset.shareRevoke, status:"revoked", allowUploads:false }) });
    button.closest("article").remove();
  }));
}

function shareRow(share) {
  const active = share.status === "active";
  return `<article><div><b>${escapeHTML(share.name)}</b><small>${active ? (share.allow_uploads ? "Uploads enabled" : "View and download") : "Revoked"} · ${share.expires_at ? `Expires ${formatDate(share.expires_at)}` : "No expiry"}</small></div>${active ? `<button type="button" data-share-toggle="${escapeHTML(share.id)}" data-uploads="${Boolean(share.allow_uploads)}">${share.allow_uploads ? "Uploads on" : "View only"}</button><button type="button" data-share-revoke="${escapeHTML(share.id)}">Revoke</button>` : ""}</article>`;
}

export async function renderSharedWorkspace(root, actions, route) {
  root.className = "workspace-app shared-workspace";
  const params = new URLSearchParams(route.split("?")[1] || "");
  const projectId = params.get("project") || "";
  const token = params.get("token") || "";
  root.innerHTML = `<main class="workspace-loading"><span></span><h1>Opening shared project…</h1></main>`;
  if (!projectId || !token) return sharedError(root, "This share link is incomplete.");
  try {
    const data = await api(`${UPLOAD_API}?action=project&projectId=${encodeURIComponent(projectId)}`, { headers:bearerHeaders(token), cache:"no-store" });
    const canUpload = Boolean(data.permissions?.canUpload);
    root.innerHTML = `<header class="shared-header"><a href="#home"><span>CX</span><b>Content X</b></a><div><b>Shared project</b><small>${canUpload ? "Uploads enabled" : "View and download"}</small></div></header><main class="shared-main"><section class="shared-title"><p class="workspace-kicker">PRIVATE CLIENT LINK</p><h1>${escapeHTML(data.project.name)}</h1><p>Review the latest files, download any version${canUpload ? ", or add new files and replacements" : ""}.</p></section>${projectSurface(data.project, data.files || [], canUpload)}</main><input type="file" multiple hidden data-workspace-picker><div data-workspace-layer></div>`;
    const picker = root.querySelector("[data-workspace-picker]");
    if (canUpload) {
      root.querySelector("[data-project-drop]").addEventListener("click", () => { picker.dataset.replaceFile = ""; picker.click(); });
      bindDropTarget(root.querySelector("[data-project-drop]"), async dropped => { await uploadSelectedFiles(root, projectId, token, dropped, "", data.project.maxFileSize); await renderSharedWorkspace(root, actions, route); });
      picker.addEventListener("change", async () => { await uploadSelectedFiles(root, projectId, token, [...picker.files], picker.dataset.replaceFile || "", data.project.maxFileSize); picker.value = ""; await renderSharedWorkspace(root, actions, route); });
    }
    root.querySelectorAll("[data-file-card]").forEach(card => {
      card.querySelector("[data-file-open]").addEventListener("click", () => openVersions(root, projectId, card.dataset.assetId, token));
      if (canUpload) {
        card.querySelector("[data-new-version]")?.addEventListener("click", () => { picker.dataset.replaceFile = card.dataset.fileId; picker.click(); });
        bindDropTarget(card, async dropped => { await uploadSelectedFiles(root, projectId, token, dropped.slice(0,1), card.dataset.fileId, data.project.maxFileSize); await renderSharedWorkspace(root, actions, route); }, "is-version-drop");
      }
    });
  } catch (error) { sharedError(root, error.message); }
}

function sharedError(root, message) {
  root.innerHTML = `<main class="workspace-error"><span>!</span><h1>Share link unavailable.</h1><p>${escapeHTML(message)}</p><a class="workspace-button" href="#home">Visit Content X</a></main>`;
}

async function uploadSelectedFiles(root, projectId, token, selected, replaceFileId, maximum) {
  const files = selected.filter(file => file.size > 0 && file.size <= Number(maximum));
  if (!files.length) throw new Error(`Choose a non-empty file up to ${formatBytes(maximum)}.`);
  const queue = root.querySelector("[data-workspace-queue]");
  for (const file of files) {
    const row = document.createElement("article");
    row.innerHTML = `<span>${fileGlyph(file.type)}</span><div><b>${escapeHTML(file.name)}</b><small>Preparing secure upload…</small><i><em></em></i></div><strong>0%</strong>`;
    queue.prepend(row);
    await uploadOne(file, row, projectId, token, replaceFileId);
  }
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
