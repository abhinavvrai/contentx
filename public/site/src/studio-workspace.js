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
  return `<div class="sx-library-tools"><label class="sx-search"><span aria-hidden="true">⌕</span><input type="search" data-file-search placeholder="Find a file…" aria-label="Search project files"></label><label>Show<select data-file-type><option value="all">All files</option><option value="video">Video</option><option value="image">Images</option><option value="audio">Audio</option><option value="feedback">Open feedback</option><option value="versions">Version stacks</option></select></label><label>Sort<select data-file-sort><option value="newest">Newest first</option><option value="name">Name A–Z</option><option value="size">Largest first</option></select></label><span data-file-results role="status"></span></div><p class="sx-no-results" data-file-empty hidden>No matching files. Try a different search or filter.</p>`;
}
export function enhanceFileLibrary(root, files, comments) {
  const grid = root.querySelector(".workspace-file-grid");
  if (!grid) return;
  const cards = new Map([...grid.querySelectorAll("[data-file-card]")].map(card => [card.dataset.fileId, card]));
  const search = root.querySelector("[data-file-search]"), type = root.querySelector("[data-file-type]"), sort = root.querySelector("[data-file-sort]");
  const update = () => {
    const selected = filterFiles(files, { query:search.value, type:type.value, sort:sort.value }, comments);
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
  update();
}

// The signed-out dashboard is explicitly a sample-data view. Preserve its actions.
export function enhanceStudioDashboard(root) {
  const grid = root.querySelector(".project-grid");
  if (!grid || root.querySelector(".sx-dashboard-tools")) return;
  const cards = [...grid.querySelectorAll(".project-card")];
  const heading = root.querySelector(".dash-header h1");
  if (heading) heading.innerHTML = 'Make room<br>for <em>great work.</em>';
  root.querySelector(".demo-workspace-banner p")?.replaceChildren(document.createTextNode("Sample projects and activity. Sign in for your real free workspace, uploads and client feedback."));
  cards.forEach((card, index) => {
    const top = card.querySelector(".project-card-top");
    top?.insertAdjacentHTML("afterbegin", `<div class="sx-project-art sx-art-${index % 3}" aria-hidden="true"><i></i><i></i><i></i><span>${String(index+1).padStart(2,"0")}</span></div>`);
    card.setAttribute("tabindex", "0"); card.setAttribute("role", "group");
    card.setAttribute("aria-label", card.querySelector("h3")?.textContent || "Project");
    card.addEventListener("keydown", event => { if (event.target === card && ["Enter", " "].includes(event.key)) { event.preventDefault(); card.click(); } });
  });
  const section = root.querySelector(".project-section");
  section.querySelector(".dash-section-head").insertAdjacentHTML("afterend", `<div class="sx-dashboard-tools"><label class="sx-search"><span aria-hidden="true">⌕</span><input type="search" data-project-search placeholder="Search your projects…" aria-label="Search your projects"></label><label>Status<select data-project-filter><option value="all">All projects</option><option value="In review">In review</option><option value="Editing">Editing</option><option value="Briefing">Briefing</option><option value="Approved">Approved</option></select></label><span data-project-results role="status"></span></div><p class="sx-no-results" data-project-empty hidden>No projects match. Clear your search or choose another status.</p>`);
  const search = root.querySelector("[data-project-search]"), filter = root.querySelector("[data-project-filter]");
  const update = () => {
    let count = 0;
    cards.forEach(card => { card.hidden = !card.textContent.toLowerCase().includes(search.value.trim().toLowerCase()) || (filter.value !== "all" && card.querySelector(".status")?.textContent.trim() !== filter.value); if (!card.hidden) count++; });
    root.querySelector("[data-project-results]").textContent = `${count} of ${cards.length} projects`;
    root.querySelector("[data-project-empty]").hidden = count > 0;
  };
  search.addEventListener("input", update); filter.addEventListener("change", update);
  root.querySelectorAll(".view-switch button").forEach((button,index) => { button.setAttribute("aria-label", index ? "List view" : "Grid view"); button.setAttribute("aria-pressed", String(index === 0)); button.addEventListener("click", () => root.querySelectorAll(".view-switch button").forEach(item => item.setAttribute("aria-pressed", String(item === button)))); });
  const firstReview = cards.find(card => card.querySelector(".status")?.textContent.includes("review"));
  const focus = document.createElement("section"); focus.className = "sx-focus-card";
  focus.innerHTML = `<div><span class="sx-overline">YOUR NEXT MOVE · DEMO</span><h2>${firstReview ? "A fresh cut is waiting." : "Keep your next cut moving."}</h2><p>${firstReview ? escapeText(firstReview.querySelector("h3").textContent) : "Open a project to organize your files and feedback."}</p></div><button class="pill pill-hot" type="button">${firstReview ? "Open review project ↗" : "Browse projects ↓"}</button><div class="sx-focus-orbits" aria-hidden="true"><i></i><i></i><span>↗</span></div>`;
  root.querySelector(".dash-summary")?.insertAdjacentElement("afterend", focus);
  focus.querySelector("button").addEventListener("click", () => firstReview ? firstReview.click() : search.focus());
  update();
}
