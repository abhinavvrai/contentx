const API_PATH = "/api/uploads";
const OWNER_TOKEN_KEY = "cx_owner_upload_token";

const escapeHTML = value => String(value ?? "").replace(/[&<>'"]/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[character]);
const formatBytes = bytes => {
  const value = Number(bytes || 0);
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(value >= 10 * 1024 ** 3 ? 0 : 1)} GB`;
  if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(value >= 10 * 1024 ** 2 ? 0 : 1)} MB`;
  if (value >= 1024) return `${Math.round(value / 1024)} KB`;
  return `${value} B`;
};
const formatDate = value => value ? new Date(Number(value)).toLocaleString([], { dateStyle:"medium", timeStyle:"short" }) : "—";
const fileIcon = type => String(type || "").startsWith("video/") ? "▶" : String(type || "").startsWith("image/") ? "▧" : String(type || "").startsWith("audio/") ? "♫" : "◇";
const SAFE_UPLOAD_EXTENSIONS = new Set(["mp4","mov","m4v","webm","mkv","avi","mp3","wav","m4a","aac","flac","ogg","jpg","jpeg","png","webp","gif","heic","heif","pdf","txt","md","csv","srt","vtt"]);
const BLOCKED_UPLOAD_EXTENSIONS = new Set(["exe","msi","bat","cmd","com","scr","ps1","vbs","js","jar","dll","php","html","htm","svg","sh","zip","rar","7z","iso","dmg"]);
const safeUploadHelp = "Allowed: video, audio, image, PDF, text, CSV and subtitle files. Executables, archives, scripts, HTML and SVG are blocked.";

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) throw new Error(body?.error || "The file service could not complete this request.");
  return body;
}

function clientHeaders(token, json = true) {
  return { ...(token ? { Authorization:`Bearer ${token}` } : {}), ...(json ? { "Content-Type":"application/json" } : {}) };
}

function ownerHeaders(json = true) {
  const token = sessionStorage.getItem(OWNER_TOKEN_KEY) || "";
  return { "X-ContentX-Owner-Token":token, ...(json ? { "Content-Type":"application/json" } : {}) };
}

export async function renderClientUpload(root, actions, route) {
  root.className = "upload-app";
  const params = new URLSearchParams(route.split("?")[1] || "");
  const projectId = params.get("project") || "";
  const token = params.get("token") || "";
  root.innerHTML = uploadShell(`<section class="upload-loading"><span></span><h1>Opening your upload space…</h1><p>Checking this private project link.</p></section>`, actions);
  if (!projectId) return renderUploadError(root, actions, "This upload link is incomplete. Ask Content X for a new project link.");
  try {
    const data = await apiRequest(`${API_PATH}?action=project&projectId=${encodeURIComponent(projectId)}`, { headers:clientHeaders(token, false) });
    renderUploadWorkspace(root, actions, data.project, data.files, projectId, token);
  } catch (error) {
    renderUploadError(root, actions, error.message);
  }
}

function uploadShell(content, actions) {
  return `<header class="upload-header"><a class="brand" href="#home"><span class="brand-mark">CX</span><span>Content X</span></a><span><b>⌾</b> Private project upload</span></header><main>${content}</main><footer class="upload-footer"><span>Files are encrypted in transit and stored in private project storage.</span><button type="button" data-upload-home>contentx.co.in</button></footer>`;
}

function bindUploadShell(root, actions) {
  root.querySelector(".brand")?.addEventListener("click", event => { event.preventDefault(); actions.openMarketing(); });
  root.querySelector("[data-upload-home]")?.addEventListener("click", actions.openMarketing);
}

function renderUploadError(root, actions, message) {
  root.innerHTML = uploadShell(`<section class="upload-error"><span>!</span><p class="eyebrow"><i></i>Upload link unavailable</p><h1>We couldn’t open this project.</h1><p>${escapeHTML(message)}</p><button class="pill pill-dark" type="button" data-upload-home>Return to Content X</button></section>`, actions);
  bindUploadShell(root, actions);
}

function renderUploadWorkspace(root, actions, project, files, projectId, token) {
  root.innerHTML = uploadShell(`<section class="upload-hero"><div><p class="eyebrow"><span></span>Client delivery portal</p><h1>Send files for<br><em>${escapeHTML(project.name)}</em></h1><p>Drop footage, audio, images, PDFs, text notes or subtitle files here. If your raw files are already in Google Drive, Dropbox, WeTransfer or another link, add those source links in your project brief and upload only what you want stored here.</p><dl><div><dt>Project</dt><dd>${escapeHTML(project.name)}</dd></div><div><dt>Per-file limit</dt><dd>${formatBytes(project.maxFileSize)}</dd></div><div><dt>Safety</dt><dd>Private + type-checked</dd></div></dl><small class="upload-security-note">${safeUploadHelp}</small></div><aside class="upload-panel"><div class="upload-identity"><label>Your name <span>optional</span><input data-uploader-name value="${escapeHTML(project.clientName || "")}" autocomplete="name" placeholder="Your name"></label><label>Email <span>optional</span><input data-uploader-email type="email" value="${escapeHTML(project.clientEmail || "")}" autocomplete="email" placeholder="you@example.com"></label></div><button class="upload-drop" type="button" data-upload-drop><span>↑</span><strong>Drop files here</strong><small>Upload multiple takes, raw files or references · up to ${formatBytes(project.maxFileSize)} each</small></button><input data-upload-picker type="file" multiple hidden><div class="upload-queue" data-upload-queue></div></aside></section><section class="upload-history"><div><p class="eyebrow"><span></span>Delivered files</p><h2>Your project uploads</h2></div><div data-client-files>${clientFileList(files)}</div></section>`, actions);
  bindUploadShell(root, actions);
  const picker = root.querySelector("[data-upload-picker]");
  const drop = root.querySelector("[data-upload-drop]");
  drop.addEventListener("click", () => picker.click());
  picker.addEventListener("change", () => beginFiles([...picker.files]));
  ["dragenter", "dragover"].forEach(type => drop.addEventListener(type, event => { event.preventDefault(); drop.classList.add("is-dragging"); }));
  ["dragleave", "drop"].forEach(type => drop.addEventListener(type, event => { event.preventDefault(); drop.classList.remove("is-dragging"); }));
  drop.addEventListener("drop", event => beginFiles([...event.dataTransfer.files]));

  async function beginFiles(selected) {
    if (!selected.length) return;
    const maximum = Number(project.maxFileSize);
    const allowed = selected.filter(file => file.size > 0 && file.size <= maximum && fileLooksSafe(file));
    const rejected = selected.filter(file => !allowed.includes(file));
    rejected.forEach(file => addQueueRow(file, rejectedReason(file, maximum), "error"));
    drop.disabled = true;
    for (const file of allowed) await uploadFile(file).catch(() => undefined);
    drop.disabled = false;
    picker.value = "";
    await refreshClientFiles();
  }

  async function uploadFile(file) {
    const row = addQueueRow(file, "Preparing…", "uploading");
    let session = null;
    try {
      session = await apiRequest(API_PATH, { method:"POST", headers:clientHeaders(token), body:JSON.stringify({ action:"start-upload", projectId, fileName:file.name, fileSize:file.size, contentType:file.type, uploaderName:root.querySelector("[data-uploader-name]").value, uploaderEmail:root.querySelector("[data-uploader-email]").value }) });
      const chunks = [];
      for (let offset = 0, partNumber = 1; offset < file.size; offset += session.partSize, partNumber += 1) chunks.push({ partNumber, blob:file.slice(offset, Math.min(offset + session.partSize, file.size)) });
      const completed = new Array(chunks.length);
      let sentBytes = 0;
      let nextIndex = 0;
      const worker = async () => {
        while (nextIndex < chunks.length) {
          const index = nextIndex++;
          const chunk = chunks[index];
          const result = await apiRequest(`${API_PATH}?action=upload-part&projectId=${encodeURIComponent(projectId)}&fileId=${encodeURIComponent(session.fileId)}&uploadId=${encodeURIComponent(session.uploadId)}&partNumber=${chunk.partNumber}`, { method:"PUT", headers:clientHeaders(token, false), body:chunk.blob });
          completed[index] = result;
          sentBytes += chunk.blob.size;
          updateQueueRow(row, Math.min(99, Math.round(sentBytes / file.size * 100)), `Uploading · ${formatBytes(sentBytes)} of ${formatBytes(file.size)}`);
        }
      };
      await Promise.all(Array.from({ length:Math.min(3, chunks.length) }, () => worker()));
      updateQueueRow(row, 99, "Finalizing secure upload…");
      await apiRequest(API_PATH, { method:"POST", headers:clientHeaders(token), body:JSON.stringify({ action:"complete-upload", projectId, fileId:session.fileId, uploadId:session.uploadId, parts:completed }) });
      updateQueueRow(row, 100, "Delivered", "done");
    } catch (error) {
      if (session) await apiRequest(API_PATH, { method:"POST", headers:clientHeaders(token), body:JSON.stringify({ action:"abort-upload", projectId, fileId:session.fileId, uploadId:session.uploadId }) }).catch(() => undefined);
      updateQueueRow(row, 0, error.message, "error");
      throw error;
    }
  }

  function addQueueRow(file, status, state) {
    const row = document.createElement("article");
    row.className = `upload-queue-row ${state}`;
    row.innerHTML = `<span>${fileIcon(file.type)}</span><div><strong>${escapeHTML(file.name)}</strong><small data-queue-status>${escapeHTML(status)}</small><i><em data-queue-progress></em></i></div><b data-queue-percent>${state === "error" ? "!" : "0%"}</b>`;
    root.querySelector("[data-upload-queue]").prepend(row);
    return row;
  }

  function updateQueueRow(row, percent, status, state = "uploading") {
    row.className = `upload-queue-row ${state}`;
    row.querySelector("[data-queue-status]").textContent = status;
    row.querySelector("[data-queue-progress]").style.width = `${percent}%`;
    row.querySelector("[data-queue-percent]").textContent = state === "error" ? "!" : state === "done" ? "✓" : `${percent}%`;
  }

  async function refreshClientFiles() {
    const data = await apiRequest(`${API_PATH}?action=project&projectId=${encodeURIComponent(projectId)}`, { headers:clientHeaders(token, false) });
    root.querySelector("[data-client-files]").innerHTML = clientFileList(data.files);
  }
}

function fileExtension(fileName) {
  return String(fileName || "").toLowerCase().split(".").pop() || "";
}

function fileLooksSafe(file) {
  const extension = fileExtension(file.name);
  return SAFE_UPLOAD_EXTENSIONS.has(extension) && !BLOCKED_UPLOAD_EXTENSIONS.has(extension) && !/[\u0000-\u001f\\\/]/.test(file.name);
}

function rejectedReason(file, maximum) {
  if (!file.size) return "Empty file";
  if (file.size > maximum) return `Larger than ${formatBytes(maximum)}`;
  return "Blocked file type for safety";
}

function clientFileList(files = []) {
  if (!files.length) return `<div class="upload-empty"><span>↑</span><h3>No files delivered yet</h3><p>Your finished uploads will appear here.</p></div>`;
  return `<div class="upload-file-list">${files.map(file => `<article><span>${fileIcon(file.content_type)}</span><div><strong>${escapeHTML(file.original_name)}</strong><small>${formatBytes(file.size_bytes)} · ${formatDate(file.completed_at)}</small></div><em>Delivered ✓</em></article>`).join("")}</div>`;
}

export function enhanceUploadAdmin(root) {
  const nav = root.querySelector(".admin-shell>aside nav");
  const content = root.querySelector(".admin-content");
  if (!nav || !content || nav.querySelector("[data-admin-files]")) return;
  const button = document.createElement("button");
  button.dataset.adminFiles = "";
  button.innerHTML = "<span>↑</span><span>Project files</span><b>R2</b>";
  nav.insertBefore(button, nav.querySelector('[data-admin="settings"]'));
  button.addEventListener("click", () => {
    root.querySelectorAll(".admin-shell>aside nav button").forEach(item => item.classList.toggle("active", item === button));
    renderOwnerFileHub(content);
  });
}

async function renderOwnerFileHub(content) {
  const token = sessionStorage.getItem(OWNER_TOKEN_KEY);
  if (!token) return renderOwnerFileGate(content);
  content.innerHTML = `<section class="owner-files-loading"><span></span><h2>Opening private file storage…</h2></section>`;
  try {
    const data = await apiRequest(`${API_PATH}?action=admin-projects`, { headers:ownerHeaders(false) });
    renderOwnerProjects(content, data.projects);
  } catch (error) {
    sessionStorage.removeItem(OWNER_TOKEN_KEY);
    renderOwnerFileGate(content, error.message);
  }
}

function renderOwnerFileGate(content, message = "") {
  content.innerHTML = `<section class="owner-files-gate"><span>⌾</span><p class="eyebrow"><i></i>Secure file storage</p><h2>Unlock project files.</h2><p>Enter the private owner key configured for Content X file storage. It stays only in this browser tab.</p>${message ? `<em>${escapeHTML(message)}</em>` : ""}<form><label>Owner file key<input name="token" type="password" required autocomplete="off" placeholder="Private owner key"></label><button class="pill pill-hot" type="submit">Open file storage →</button></form></section>`;
  content.querySelector("form").addEventListener("submit", async event => {
    event.preventDefault();
    sessionStorage.setItem(OWNER_TOKEN_KEY, new FormData(event.currentTarget).get("token"));
    await renderOwnerFileHub(content);
  });
}

function renderOwnerProjects(content, projects = []) {
  const totalFiles = projects.reduce((sum, project) => sum + Number(project.file_count || 0), 0);
  const totalBytes = projects.reduce((sum, project) => sum + Number(project.total_bytes || 0), 0);
  content.innerHTML = `<section class="owner-files-head"><div><p class="eyebrow"><span></span>Private R2 storage</p><h2>Project files</h2><p>Create a secure link for every client, then receive raw footage and working files directly into that project.</p></div><button class="pill pill-hot" type="button" data-new-upload-project>+ New upload project</button></section><div class="owner-files-stats"><article><span>▱</span><strong>${projects.length}</strong><small>Upload projects</small></article><article><span>↑</span><strong>${totalFiles}</strong><small>Delivered files</small></article><article><span>◇</span><strong>${formatBytes(totalBytes)}</strong><small>Private storage used</small></article></div><div class="owner-project-grid">${projects.length ? projects.map(project => `<article data-owner-project="${escapeHTML(project.id)}"><div><span>${project.status === "active" ? "LIVE" : "PAUSED"}</span><em>${Number(project.file_count || 0)} files</em></div><h3>${escapeHTML(project.name)}</h3><p>${escapeHTML(project.client_name || project.client_email || "Client upload project")}</p><small>${formatBytes(project.total_bytes)} · Updated ${formatDate(project.updated_at)}</small><div><button type="button" data-open-owner-project="${escapeHTML(project.id)}">Open files →</button><button type="button" data-rotate-owner-project="${escapeHTML(project.id)}">New link</button></div></article>`).join("") : `<div class="upload-empty owner-project-empty"><span>↑</span><h3>No upload projects yet</h3><p>Create one link and send it to your client.</p></div>`}</div><button class="owner-files-lock" type="button" data-owner-files-lock>⌾ Lock file storage</button>`;
  content.querySelector("[data-new-upload-project]").addEventListener("click", () => openCreateProject(content));
  content.querySelector("[data-owner-files-lock]").addEventListener("click", () => { sessionStorage.removeItem(OWNER_TOKEN_KEY); renderOwnerFileGate(content); });
  content.querySelectorAll("[data-open-owner-project]").forEach(button => button.addEventListener("click", () => renderOwnerProjectFiles(content, button.dataset.openOwnerProject)));
  content.querySelectorAll("[data-rotate-owner-project]").forEach(button => button.addEventListener("click", () => rotateProjectLink(content, button.dataset.rotateOwnerProject)));
}

function openCreateProject(content) {
  const layer = document.createElement("div");
  layer.className = "modal-layer";
  layer.innerHTML = `<form class="upload-project-modal"><button class="modal-close" type="button">×</button><p class="eyebrow"><span></span>New upload space</p><h2>Create a client project</h2><p>The client receives a private link for large uploads. Each file can be up to 50 GB.</p><label>Project name<input name="name" required placeholder="e.g. August campaign raw footage"></label><div class="field-pair"><label>Client name<input name="clientName" placeholder="Optional"></label><label>Client email<input name="clientEmail" type="email" placeholder="Optional"></label></div><button class="pill pill-hot" type="submit">Create secure upload link →</button></form>`;
  document.body.append(layer);
  const close = () => layer.remove();
  layer.querySelector(".modal-close").addEventListener("click", close);
  layer.addEventListener("click", event => { if (event.target === layer) close(); });
  layer.querySelector("form").addEventListener("submit", async event => {
    event.preventDefault();
    const button = event.currentTarget.querySelector("button[type=submit]");
    button.disabled = true; button.textContent = "Creating…";
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const data = await apiRequest(API_PATH, { method:"POST", headers:ownerHeaders(), body:JSON.stringify({ action:"admin-create-project", ...values }) });
      showCreatedProject(layer, data.project, data.uploadUrl, content);
    } catch (error) {
      button.disabled = false; button.textContent = "Create secure upload link →";
      showFormError(event.currentTarget, error.message);
    }
  });
}

function showCreatedProject(layer, project, uploadUrl, content) {
  layer.innerHTML = `<section class="upload-project-created"><span>✓</span><p class="eyebrow"><i></i>Upload link ready</p><h2>${escapeHTML(project.name)}</h2><p>Send this private link to your client. Anyone with the link can upload to this project.</p><label>Private client link<input value="${escapeHTML(uploadUrl)}" readonly></label><button class="pill pill-hot" type="button" data-copy-created-link>Copy client link</button><button type="button" data-close-created-link>Done</button></section>`;
  layer.querySelector("[data-copy-created-link]").addEventListener("click", async event => {
    await navigator.clipboard.writeText(uploadUrl);
    event.currentTarget.textContent = "Copied ✓";
  });
  layer.querySelector("[data-close-created-link]").addEventListener("click", async () => { layer.remove(); await renderOwnerFileHub(content); });
}

async function rotateProjectLink(content, projectId) {
  if (!confirm("Create a new client link? The previous upload link will stop working.")) return;
  try {
    const data = await apiRequest(API_PATH, { method:"POST", headers:ownerHeaders(), body:JSON.stringify({ action:"admin-rotate-link", projectId }) });
    const layer = document.createElement("div"); layer.className = "modal-layer"; document.body.append(layer);
    showCreatedProject(layer, data.project, data.uploadUrl, content);
  } catch (error) {
    alert(error.message);
  }
}

async function renderOwnerProjectFiles(content, projectId) {
  content.innerHTML = `<section class="owner-files-loading"><span></span><h2>Loading project files…</h2></section>`;
  try {
    const showDeleted = sessionStorage.getItem(`cx_owner_show_deleted_${projectId}`) === "1";
    const data = await apiRequest(`${API_PATH}?action=admin-files&projectId=${encodeURIComponent(projectId)}${showDeleted ? "&deleted=1" : ""}`, { headers:ownerHeaders(false) });
    const project = data.project;
    content.innerHTML = `<button class="owner-back" type="button" data-owner-files-back>← All upload projects</button><section class="owner-project-head"><div><p class="eyebrow"><span></span>${showDeleted ? `Recycle bin · ${data.recycleBinDays || 30} days backup` : project.status === "active" ? "Accepting uploads" : "Uploads paused"}</p><h2>${escapeHTML(project.name)}</h2><p>${escapeHTML(project.clientName || project.clientEmail || "Private client upload project")}</p></div><div><button class="pill pill-dark" type="button" data-toggle-deleted>${showDeleted ? "Show active files" : "Open recycle bin"}</button><button class="pill pill-dark" type="button" data-rotate-owner-project="${escapeHTML(project.id)}">Create new link</button><button class="pill ${project.status === "active" ? "pill-dark" : "pill-hot"}" type="button" data-project-status="${project.status === "active" ? "archived" : "active"}">${project.status === "active" ? "Pause uploads" : "Resume uploads"}</button></div></section>${showDeleted ? `<div class="share-intro"><span>↺</span><div><strong>30-day backup after deletion</strong><p>Deleted files stay recoverable here for ${data.recycleBinDays || 30} days. Use permanent delete only when you are sure.</p></div></div>` : ""}<div class="owner-file-table"><div class="owner-file-row head"><span>File</span><span>Uploaded by</span><span>Size</span><span>Status</span><span></span></div>${data.files.length ? data.files.map(file => `<article class="owner-file-row"><div><b>${fileIcon(file.content_type)}</b><span><strong>${escapeHTML(file.original_name)}</strong><small>${showDeleted ? `Deleted ${formatDate(file.deleted_at)}` : formatDate(file.completed_at || file.created_at)}</small></span></div><span>${escapeHTML(file.uploader_name || file.uploader_email || "Client")}</span><span>${formatBytes(file.size_bytes)}</span><em class="file-status ${escapeHTML(file.status)}">${escapeHTML(file.status)}</em><div>${showDeleted ? `<button type="button" data-restore-owner-file="${escapeHTML(file.id)}">Restore</button><button type="button" data-purge-owner-file="${escapeHTML(file.id)}">Delete forever</button>` : `<button type="button" data-download-owner-file="${escapeHTML(file.id)}" ${file.status !== "ready" ? "disabled" : ""}>Download</button><button type="button" data-delete-owner-file="${escapeHTML(file.id)}">Move to bin</button>`}</div></article>`).join("") : `<div class="upload-empty"><span>${showDeleted ? "↺" : "↑"}</span><h3>${showDeleted ? "Recycle bin is empty" : "No files received yet"}</h3><p>${showDeleted ? "Recently deleted files will appear here for 30 days." : "Send the project link to your client to begin."}</p></div>`}</div>`;
    content.querySelector("[data-owner-files-back]").addEventListener("click", () => renderOwnerFileHub(content));
    content.querySelector("[data-toggle-deleted]").addEventListener("click", async () => {
      sessionStorage.setItem(`cx_owner_show_deleted_${project.id}`, showDeleted ? "0" : "1");
      await renderOwnerProjectFiles(content, project.id);
    });
    content.querySelector("[data-rotate-owner-project]").addEventListener("click", () => rotateProjectLink(content, project.id));
    content.querySelector("[data-project-status]").addEventListener("click", async event => {
      await apiRequest(API_PATH, { method:"PATCH", headers:ownerHeaders(), body:JSON.stringify({ action:"admin-project-status", projectId:project.id, status:event.currentTarget.dataset.projectStatus }) });
      await renderOwnerProjectFiles(content, project.id);
    });
    content.querySelectorAll("[data-download-owner-file]").forEach(button => button.addEventListener("click", () => downloadOwnerFile(button, button.dataset.downloadOwnerFile)));
    content.querySelectorAll("[data-delete-owner-file]").forEach(button => button.addEventListener("click", async () => {
      if (!confirm("Move this file to the recycle bin? It will stay recoverable for 30 days.")) return;
      await apiRequest(`${API_PATH}?action=admin-file&fileId=${encodeURIComponent(button.dataset.deleteOwnerFile)}`, { method:"DELETE", headers:ownerHeaders(false) });
      await renderOwnerProjectFiles(content, project.id);
    }));
    content.querySelectorAll("[data-restore-owner-file]").forEach(button => button.addEventListener("click", async () => {
      await apiRequest(API_PATH, { method:"PATCH", headers:ownerHeaders(), body:JSON.stringify({ action:"admin-file-restore", fileId:button.dataset.restoreOwnerFile }) });
      await renderOwnerProjectFiles(content, project.id);
    }));
    content.querySelectorAll("[data-purge-owner-file]").forEach(button => button.addEventListener("click", async () => {
      if (!confirm("Permanently delete this file from storage? This cannot be undone.")) return;
      await apiRequest(`${API_PATH}?action=admin-file-purge&fileId=${encodeURIComponent(button.dataset.purgeOwnerFile)}`, { method:"DELETE", headers:ownerHeaders(false) });
      await renderOwnerProjectFiles(content, project.id);
    }));
  } catch (error) {
    content.innerHTML = `<section class="upload-error"><span>!</span><h2>Couldn’t open this project.</h2><p>${escapeHTML(error.message)}</p><button class="pill pill-dark" type="button">Return to projects</button></section>`;
    content.querySelector("button").addEventListener("click", () => renderOwnerFileHub(content));
  }
}

async function downloadOwnerFile(button, fileId) {
  const original = button.textContent;
  button.disabled = true; button.textContent = "Preparing…";
  try {
    const data = await apiRequest(API_PATH, { method:"POST", headers:ownerHeaders(), body:JSON.stringify({ action:"admin-download-link", fileId }) });
    location.href = data.downloadUrl;
  } catch (error) {
    alert(error.message);
  } finally {
    button.disabled = false; button.textContent = original;
  }
}

function showFormError(form, message) {
  let error = form.querySelector(".upload-form-error");
  if (!error) { error = document.createElement("p"); error.className = "upload-form-error"; form.insertBefore(error, form.querySelector("button[type=submit]")); }
  error.textContent = message;
}
