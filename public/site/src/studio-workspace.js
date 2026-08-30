// Presentation and derived views only. Project/comment records remain server-owned.
export const escapeText = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]);
export const isComplete = comment => ["completed", "resolved"].includes(comment.status);
export const hasTimestamp = value => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0;
export const timecode = seconds => {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};
export function commentsForVersion(comments, version) {
  return comments.filter(comment => comment.file_id === version.id || (!comment.file_id && comment.asset_id === (version.asset_id || version.id)));
}
export function filterFiles(files, { query = "", type = "all", sort = "newest" } = {}, comments = []) {
  const term = query.trim().toLowerCase();
  const openAssets = new Set(comments.filter(comment => !isComplete(comment)).flatMap(comment => [comment.asset_id, comment.file_id]).filter(Boolean));
  const result = files.filter(file => {
    const matchesType = type === "all" || (type === "feedback" ? openAssets.has(file.asset_id || file.id) || openAssets.has(file.id) : type === "versions" ? Number(file.version_count) > 1 : String(file.content_type).startsWith(`${type}/`));
    return matchesType && String(file.original_name || "").toLowerCase().includes(term);
  });
  return result.sort((a, b) => sort === "name" ? String(a.original_name).localeCompare(String(b.original_name)) : sort === "size" ? Number(b.size_bytes) - Number(a.size_bytes) : Number(b.completed_at || 0) - Number(a.completed_at || 0));
}
export function filterComments(comments, { query = "", status = "all", sort = "time" } = {}) {
  const term = query.trim().toLowerCase();
  return comments.filter(comment => (status === "all" || (status === "complete" ? isComplete(comment) : !isComplete(comment))) && `${comment.body} ${comment.author_name}`.toLowerCase().includes(term)).sort((a,b) => sort === "newest" ? Number(b.created_at) - Number(a.created_at) : (hasTimestamp(a.timestamp_seconds) ? Number(a.timestamp_seconds) : Infinity) - (hasTimestamp(b.timestamp_seconds) ? Number(b.timestamp_seconds) : Infinity));
}
export function reviewSummary(comments) {
  const complete = comments.filter(isComplete).length;
  return { total:comments.length, complete, open:comments.length - complete, percent:comments.length ? Math.round(complete / comments.length * 100) : 0 };
}
export function workspacePulse(files, comments) {
  const summary = reviewSummary(comments);
  return `<section class="sx-pulse" aria-label="Project overview"><div class="sx-pulse-intro"><span class="sx-overline">PRODUCTION ROOM</span><h2>One place.<br><em>Every next cut.</em></h2><p>Files, versions and feedback. In focus.</p></div><div class="sx-pulse-metrics"><article><span>Latest assets</span><strong>${files.length.toString().padStart(2,"0")}</strong><small>In this project</small></article><article><span>Open feedback</span><strong>${summary.open.toString().padStart(2,"0")}</strong><small>${summary.complete} completed</small></article><article><span>Version stacks</span><strong>${files.filter(file => Number(file.version_count) > 1).length.toString().padStart(2,"0")}</strong><small>Every cut stays together</small></article></div></section>`;
}
export function fileToolbar() {
  return `<div class="sx-library-tools"><div class="sx-tool-menu"><button type="button" data-appearance-button>▦ <b>Appearance</b></button><div class="sx-control-popover" data-appearance-panel hidden><h3>Appearance</h3><label><span>Layout</span><span class="sx-segment"><button class="active" type="button" data-pref-view="grid">Grid</button><button type="button" data-pref-view="list">List</button></span></label><label><span>Card size</span><span class="sx-segment"><button type="button" data-pref-size="small">S</button><button class="active" type="button" data-pref-size="medium">M</button><button type="button" data-pref-size="large">L</button></span></label><label><span>Thumbnail scale</span><select data-pref-scale><option value="fit">Fit</option><option value="fill">Fill</option></select></label><label><span>Show card info</span><input type="checkbox" data-pref-info checked></label></div></div><div class="sx-tool-menu"><button type="button" data-fields-button>✣ <b>Fields</b> <small data-field-count>4 visible</small></button><div class="sx-control-popover sx-fields-popover" data-fields-panel hidden><h3>Visible card fields</h3><label><input type="checkbox" data-card-field-toggle="size" checked><span>File size</span></label><label><input type="checkbox" data-card-field-toggle="date" checked><span>Updated date</span></label><label><input type="checkbox" data-card-field-toggle="versions" checked><span>Versions</span></label><label><input type="checkbox" data-card-field-toggle="status" checked><span>Status</span></label></div></div><label class="sx-sort">≡ <b>Sorted by</b><select data-file-sort><option value="newest">Newest</option><option value="name">Name</option><option value="size">Size</option></select></label><label class="sx-filter"><span>Show</span><select data-file-type><option value="all">All files</option><option value="video">Video</option><option value="image">Images</option><option value="audio">Audio</option><option value="feedback">Open feedback</option><option value="versions">Version stacks</option></select></label><label class="sx-search"><span aria-hidden="true">⌕</span><input type="search" data-file-search placeholder="Search assets" aria-label="Search project files"></label><span data-file-results role="status"></span></div><p class="sx-no-results" data-file-empty hidden>No matching files. Try a different search or filter.</p>`;
}
export function enhanceFileLibrary(root, files, comments) {
  const grid = root.querySelector(".workspace-file-grid");
  if (!grid) return;
  const cards = new Map([...grid.querySelectorAll("[data-file-card]")].map(card => [card.dataset.fileId, card]));
  const search = root.querySelector("[data-file-search]"), type = root.querySelector("[data-file-type]"), sort = root.querySelector("[data-file-sort]");
  const update = () => {
    const activeFolder = grid.dataset.activeFolder || "";
    const selected = filterFiles(files, { query:search.value, type:type.value, sort:sort.value }, comments).filter(file => String(file.folder_id || "") === activeFolder);
    cards.forEach(card => { card.hidden = true; });
    selected.forEach(file => { const card = cards.get(file.id); if (card) { card.hidden = false; grid.append(card); } });
    root.querySelector("[data-file-results]").textContent = `${selected.length} of ${files.length} files`;
    root.querySelector("[data-file-empty]").hidden = selected.length > 0 || !files.length;
  };
  [search, type, sort].forEach(control => control.addEventListener(control === search ? "input" : "change", update));
  root.querySelectorAll("[data-file-view]").forEach(button => button.addEventListener("click", () => {
    grid.classList.toggle("sx-list", button.dataset.fileView === "list");
    root.querySelectorAll("[data-file-view]").forEach(item => { item.classList.toggle("active", item === button); item.setAttribute("aria-pressed", String(item === button)); });
  }));
  const preferenceKey = "cx_workspace_appearance";
  const defaults = { view:"grid", size:"medium", scale:"fit", info:true, fields:{ size:true, date:true, versions:true, status:true } };
  let preferences = defaults;
  try { preferences = { ...defaults, ...JSON.parse(localStorage.getItem(preferenceKey) || "{}"), fields:{ ...defaults.fields, ...(JSON.parse(localStorage.getItem(preferenceKey) || "{}").fields || {}) } }; } catch {}
  const applyPreferences = () => {
    grid.classList.toggle("sx-list", preferences.view === "list");
    grid.classList.remove("cards-small", "cards-medium", "cards-large", "thumb-fill");
    grid.classList.add(`cards-${preferences.size}`);
    grid.classList.toggle("thumb-fill", preferences.scale === "fill");
    grid.classList.toggle("hide-card-info", !preferences.info);
    Object.entries(preferences.fields).forEach(([field,visible]) => grid.classList.toggle(`hide-field-${field}`, !visible));
    root.querySelectorAll("[data-pref-view]").forEach(button => button.classList.toggle("active", button.dataset.prefView === preferences.view));
    root.querySelectorAll("[data-pref-size]").forEach(button => button.classList.toggle("active", button.dataset.prefSize === preferences.size));
    const scale = root.querySelector("[data-pref-scale]"); if (scale) scale.value = preferences.scale;
    const info = root.querySelector("[data-pref-info]"); if (info) info.checked = preferences.info;
    root.querySelectorAll("[data-card-field-toggle]").forEach(input => { input.checked = preferences.fields[input.dataset.cardFieldToggle] !== false; });
    const count = Object.values(preferences.fields).filter(Boolean).length;
    const countLabel = root.querySelector("[data-field-count]"); if (countLabel) countLabel.textContent = `${count} visible`;
    localStorage.setItem(preferenceKey, JSON.stringify(preferences));
  };
  const closePopovers = except => root.querySelectorAll(".sx-control-popover").forEach(panel => { if (panel !== except) panel.hidden = true; });
  [["[data-appearance-button]","[data-appearance-panel]"],["[data-fields-button]","[data-fields-panel]"]].forEach(([buttonSelector,panelSelector]) => root.querySelector(buttonSelector)?.addEventListener("click", event => { event.stopPropagation(); const panel = root.querySelector(panelSelector); const opening = panel.hidden; closePopovers(panel); panel.hidden = !opening; }));
  root.querySelectorAll(".sx-control-popover").forEach(panel => panel.addEventListener("click", event => event.stopPropagation()));
  root.querySelector(".workspace-main")?.addEventListener("click", () => closePopovers());
  root.querySelectorAll("[data-pref-view]").forEach(button => button.addEventListener("click", () => { preferences.view = button.dataset.prefView; applyPreferences(); }));
  root.querySelectorAll("[data-pref-size]").forEach(button => button.addEventListener("click", () => { preferences.size = button.dataset.prefSize; applyPreferences(); }));
  root.querySelector("[data-pref-scale]")?.addEventListener("change", event => { preferences.scale = event.currentTarget.value; applyPreferences(); });
  root.querySelector("[data-pref-info]")?.addEventListener("change", event => { preferences.info = event.currentTarget.checked; applyPreferences(); });
  root.querySelectorAll("[data-card-field-toggle]").forEach(input => input.addEventListener("change", () => { preferences.fields[input.dataset.cardFieldToggle] = input.checked; applyPreferences(); }));
  applyPreferences();
  update();
}

// The signed-out dashboard is explicitly a sample-data view. Preserve its actions.
export function enhanceStudioDashboard(root) {
  const grid = root.querySelector(".project-grid");
  if (!grid || root.dataset.dashboardEnhanced === "true") return;
  root.dataset.dashboardEnhanced = "true";
  const cards = [...grid.querySelectorAll(".project-card")];
  cards.forEach(card => {
    card.setAttribute("tabindex", "0"); card.setAttribute("role", "group");
    card.setAttribute("aria-label", card.querySelector("h3")?.textContent || "Project");
    card.addEventListener("keydown", event => { if (event.target === card && ["Enter", " "].includes(event.key)) { event.preventDefault(); card.click(); } });
  });
  const section = root.querySelector(".project-section");
  section.insertAdjacentHTML("beforeend", `<p class="sx-no-results" data-project-empty hidden>No projects match your search.</p>`);
  const search = root.querySelector(".cx-product-topbar input");
  let filter = "active";
  const update = () => {
    let count = 0;
    cards.forEach(card => { card.hidden = !card.textContent.toLowerCase().includes(search.value.trim().toLowerCase()) || (filter === "active" && card.querySelector(".status")?.textContent.trim() === "Approved"); if (!card.hidden) count++; });
    root.querySelector("[data-project-empty]").hidden = count > 0;
  };
  search.addEventListener("input", update);
  root.querySelectorAll(".cx-filter").forEach((button,index) => button.addEventListener("click", () => { filter = index ? "all" : "active"; root.querySelectorAll(".cx-filter").forEach(item => item.classList.toggle("active", item === button)); update(); }));
  root.querySelectorAll(".view-switch button").forEach((button,index) => { button.setAttribute("aria-pressed", String(index === 0)); button.addEventListener("click", () => { grid.classList.toggle("cx-list-view", index === 1); root.querySelectorAll(".view-switch button").forEach(item => { item.classList.toggle("active", item === button); item.setAttribute("aria-pressed", String(item === button)); }); }); });
  update();
}
