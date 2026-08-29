import { escapeText as esc, commentsForVersion, filterComments, hasTimestamp, isComplete, reviewSummary, timecode } from "./studio-workspace.js?v=review-studio-1";

export function reviewCommentMarkup(comment, canManage) {
  return `<article class="sx-review-note ${isComplete(comment) ? "is-complete" : ""}"><header><span>${esc((comment.author_name || "?").slice(0,1))}</span><strong>${esc(comment.author_name || "Reviewer")}</strong><small>${isComplete(comment) ? "Completed" : "Open"}</small></header>${hasTimestamp(comment.timestamp_seconds) ? `<button type="button" class="sx-timecode" data-seek="${Number(comment.timestamp_seconds)}">▶ ${timecode(comment.timestamp_seconds)}</button>` : ""}<p>${esc(comment.body)}</p>${canManage ? `<button type="button" class="sx-resolve" data-review-resolve="${esc(comment.id)}">${isComplete(comment) ? "↶ Reopen" : "✓ Mark complete"}</button>` : ""}</article>`;
}

export function exportReviewText(name, version, comments) {
  return [`CONTENT X — REVIEW NOTES`, name, `Version ${version}`, "", ...comments.map(comment => `[${isComplete(comment) ? "DONE" : "OPEN"}] ${hasTimestamp(comment.timestamp_seconds) ? timecode(comment.timestamp_seconds) : "General"} — ${comment.author_name}\n${comment.body}\n`)].join("\n");
}

export async function openReviewRoom({ layer, api, headers, projectId, assetId, canManage = false, onChange = () => {} }) {
  const dialog = document.createElement("dialog"); dialog.className = "sx-review-room";
  dialog.setAttribute("aria-label", "File review room");
  dialog.innerHTML = '<header class="sx-room-header"><span class="sx-overline">CONTENT X / REVIEW ROOM</span><button type="button" data-room-close aria-label="Close review">×</button></header><p class="sx-room-loading" role="status">Opening versions and feedback…</p>';
  layer.replaceChildren(dialog); dialog.showModal();
  let active = true, changed = false, request = 0;
  const routeAtOpen = location.hash;
  const lifecycle = new AbortController();
  const close = () => { if (!active) return; active = false; request++; lifecycle.abort(); dialog.querySelectorAll("video,audio").forEach(media => { media.pause(); media.removeAttribute("src"); media.load(); }); dialog.remove(); if (changed && location.hash === routeAtOpen) onChange(); };
  dialog.addEventListener("close", close);
  window.addEventListener("hashchange", close, { signal:lifecycle.signal });
  dialog.addEventListener("click", event => { if (event.target.closest("[data-room-close]")) dialog.close(); });
  try {
    const [history, feedback] = await Promise.all([
      api(`/api/uploads?action=versions&projectId=${encodeURIComponent(projectId)}&assetId=${encodeURIComponent(assetId)}`, { headers:headers(), cache:"no-store" }),
      api(`/api/uploads?action=comments&projectId=${encodeURIComponent(projectId)}`, { headers:headers(), cache:"no-store" }),
    ]);
    if (!active || !dialog.isConnected) return;
    const versions = [...history.versions].sort((a,b) => Number(b.version_number) - Number(a.version_number));
    if (!versions.length) throw new Error("No versions are available for this file.");
    let comments = feedback.comments || [], selected = versions[0], comparison = false, pinnedTime = 0;
    dialog.innerHTML = `<header class="sx-room-header"><div><span class="sx-overline">CONTENT X / REVIEW ROOM</span><h2>${esc(selected.original_name)}</h2></div><button type="button" data-room-close aria-label="Close review">×</button></header><div class="sx-room-body"><section class="sx-room-stage"><div class="sx-room-toolbar"><label>Review version<select data-review-version>${versions.map(version => `<option value="${esc(version.id)}">V${Number(version.version_number)} · ${esc(version.original_name)}</option>`).join("")}</select></label><button type="button" data-compare aria-pressed="false" ${versions.length < 2 ? "disabled title=\"Upload another version to compare\"" : ""}>Compare versions</button><button type="button" data-version-download>Download</button></div><div class="sx-compare-choice" hidden><label>Compare against<select data-compare-version></select></label><p>Playback follows the review version. Comparison audio is muted.</p></div><div class="sx-media-grid"><figure><figcaption data-primary-caption></figcaption><div data-primary-media class="sx-media-slot"></div></figure><figure data-comparison hidden><figcaption data-compare-caption></figcaption><div data-compare-media class="sx-media-slot"></div></figure></div><p class="sx-player-help">Use the player controls to pause and seek. Capture the playhead to attach a precise timestamp.</p><p data-room-error role="alert" hidden></p><section class="sx-version-strip" aria-label="Version history">${versions.map(version => `<button type="button" data-pick-version="${esc(version.id)}"><span>V${Number(version.version_number)}</span><small>${Number(version.version_number) === Number(versions[0].version_number) ? "Latest cut" : "Earlier cut"}</small></button>`).join("")}</section><div class="sx-review-progress"><span data-feedback-progress></span><progress max="100" value="0" aria-label="Feedback completion"></progress><small>Completed feedback is not a final approval.</small></div></section><aside class="sx-room-feedback"><header><h3>Feedback <span data-note-count></span></h3><button type="button" data-export-notes>Export notes</button></header><div class="sx-note-filters"><input type="search" data-note-search aria-label="Search review comments" placeholder="Search feedback…"><select data-note-status aria-label="Filter review comments"><option value="all">All notes</option><option value="open">Open</option><option value="complete">Completed</option></select><select data-note-sort aria-label="Sort review comments"><option value="time">Timecode</option><option value="newest">Newest</option></select></div><div class="sx-room-notes" data-room-notes></div><form class="sx-note-form"><label>Your name<input name="authorName" required minlength="2" maxlength="100" autocomplete="name"></label><label>Email (optional)<input name="authorEmail" type="email" maxlength="254" autocomplete="email"></label><label>Feedback<textarea name="body" required maxlength="2000" rows="3" placeholder="What should change in this cut?"></textarea></label><div class="sx-capture-row"><label><input type="checkbox" data-attach-time checked>At <output data-pinned-time>00:00</output></label><button type="button" data-capture-time>Use playhead</button></div><button class="workspace-button primary" type="submit">Send feedback ↗</button><p role="alert" hidden></p></form></aside></div>`;
    const errorBox = dialog.querySelector("[data-room-error]");
    const fail = error => { if (!active) return; errorBox.hidden = false; errorBox.textContent = error.message || "This request could not be completed."; };
    const versionSelect = dialog.querySelector("[data-review-version]"), compareSelect = dialog.querySelector("[data-compare-version]");
    const primarySlot = dialog.querySelector("[data-primary-media]"), compareSlot = dialog.querySelector("[data-compare-media]");
    const form = dialog.querySelector("form"), attachTime = dialog.querySelector("[data-attach-time]");
    const capture = () => { const media = primarySlot.querySelector("video,audio"); if (media) { media.pause(); pinnedTime = Math.min(86400, Math.floor(media.currentTime || 0)); dialog.querySelector("[data-pinned-time]").textContent = timecode(pinnedTime); } };
    const renderNotes = () => {
      const versionComments = commentsForVersion(comments, selected);
      const filtered = filterComments(versionComments, { query:dialog.querySelector("[data-note-search]").value, status:dialog.querySelector("[data-note-status]").value, sort:dialog.querySelector("[data-note-sort]").value });
      dialog.querySelector("[data-room-notes]").innerHTML = filtered.length ? filtered.map(comment => reviewCommentMarkup(comment, canManage)).join("") : '<p class="sx-note-empty">No matching feedback for this version.</p>';
      dialog.querySelector("[data-note-count]").textContent = versionComments.length;
      const summary = reviewSummary(versionComments);
      dialog.querySelector("[data-feedback-progress]").textContent = `${summary.complete} of ${summary.total} notes completed · ${summary.open} open`;
      dialog.querySelector("progress").value = summary.percent;
    };
    const signedUrl = async version => {
      const data = await api("/api/uploads", { method:"POST", headers:headers(true), body:JSON.stringify({ action:"project-download-link", projectId, fileId:version.id }) });
      const url = new URL(data.downloadUrl, location.origin);
      if (url.origin !== location.origin || url.pathname !== "/api/uploads") throw new Error("The file service returned an invalid preview URL.");
      return url.href;
    };
    const mountMedia = async (slot, version, secondary, ticket) => {
      slot.replaceChildren();
      const type = version.content_type || "";
      if (!/^(video|audio|image)\//.test(type)) { slot.textContent = "Preview is available for video, audio and images. Download this file to open it."; return; }
      slot.textContent = "Preparing private preview…";
      const url = await signedUrl(version);
      if (!active || !dialog.isConnected || ticket !== request) return;
      const media = document.createElement(type.startsWith("video/") ? "video" : type.startsWith("audio/") ? "audio" : "img");
      if (media.tagName === "IMG") media.alt = `${secondary ? "Comparison" : "Review"} version: ${version.original_name}`;
      else { media.controls = true; media.preload = "metadata"; media.playsInline = true; media.muted = secondary; }
      media.addEventListener("error", () => { if (active && ticket === request) { slot.replaceChildren(document.createTextNode("Preview unavailable or expired. Reselect the version to retry, or download the original.")); } });
      media.src = url; slot.replaceChildren(media);
      if (!secondary && media.tagName !== "IMG") {
        const sync = event => {
          const other = compareSlot.querySelector("video,audio"); if (!other || !comparison) return;
          if (event.type === "pause") other.pause();
          if (Number.isFinite(other.duration) && Math.abs(other.currentTime - media.currentTime) > .25) other.currentTime = Math.min(media.currentTime, Math.max(0,other.duration - .01));
          other.playbackRate = media.playbackRate;
          if (event.type === "play" && media.currentTime < other.duration) other.play().catch(() => {});
        };
        ["play", "pause", "seeked", "ratechange", "timeupdate"].forEach(type => media.addEventListener(type, sync));
      }
    };
    const load = async () => {
      const ticket = ++request; errorBox.hidden = true;
      dialog.querySelectorAll("video,audio").forEach(media => { media.pause(); media.removeAttribute("src"); media.load(); });
      dialog.querySelector("h2").textContent = selected.original_name;
      dialog.querySelector("[data-primary-caption]").textContent = `REVIEW · V${selected.version_number}`;
      dialog.querySelector("[data-comparison]").hidden = !comparison;
      dialog.querySelector(".sx-compare-choice").hidden = !comparison;
      dialog.querySelector(".sx-media-grid").classList.toggle("is-comparing", comparison);
      dialog.querySelectorAll("[data-pick-version]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.pickVersion === selected.id)));
      const timed = /^(video|audio)\//.test(selected.content_type || "");
      attachTime.disabled = !timed; attachTime.checked = timed;
      dialog.querySelector("[data-capture-time]").disabled = !timed;
      pinnedTime = 0; dialog.querySelector("[data-pinned-time]").textContent = "00:00";
      renderNotes();
      try {
        const tasks = [mountMedia(primarySlot, selected, false, ticket)];
        if (comparison) {
          const other = versions.find(version => version.id === compareSelect.value);
          dialog.querySelector("[data-compare-caption]").textContent = `COMPARE · V${other.version_number}`;
          tasks.push(mountMedia(compareSlot, other, true, ticket));
        } else compareSlot.replaceChildren();
        await Promise.all(tasks);
      } catch (error) { if (ticket === request) fail(error); }
    };
    const choose = () => {
      selected = versions.find(version => version.id === versionSelect.value) || versions[0];
      compareSelect.innerHTML = versions.filter(version => version.id !== selected.id).map(version => `<option value="${esc(version.id)}">V${Number(version.version_number)} · ${esc(version.original_name)}</option>`).join("");
      load();
    };
    versionSelect.addEventListener("change", choose);
    compareSelect.addEventListener("change", load);
    dialog.querySelector("[data-compare]").addEventListener("click", event => { comparison = !comparison; event.currentTarget.setAttribute("aria-pressed", String(comparison)); load(); });
    dialog.querySelectorAll("[data-pick-version]").forEach(button => button.addEventListener("click", () => { versionSelect.value = button.dataset.pickVersion; choose(); }));
    dialog.querySelector("[data-capture-time]").addEventListener("click", capture);
    form.elements.body.addEventListener("focus", capture);
    ["[data-note-search]", "[data-note-status]", "[data-note-sort]"].forEach(selector => dialog.querySelector(selector).addEventListener(selector.includes("search") ? "input" : "change", renderNotes));
    dialog.querySelector("[data-room-notes]").addEventListener("click", async event => {
      const seek = event.target.closest("[data-seek]");
      if (seek) { const media = primarySlot.querySelector("video,audio"); if (media && Number.isFinite(media.duration)) { media.pause(); media.currentTime = Math.min(Number(seek.dataset.seek), media.duration); capture(); } }
      const button = event.target.closest("[data-review-resolve]"); if (!button || !canManage) return;
      const comment = comments.find(item => item.id === button.dataset.reviewResolve); if (!comment) return;
      const status = isComplete(comment) ? "open" : "completed";
      button.disabled = true;
      try { await api("/api/uploads", { method:"PATCH", headers:headers(true), body:JSON.stringify({ action:"comment-status", projectId, commentId:comment.id, status }) }); changed = true; comment.status = status; if (active) renderNotes(); }
      catch (error) { fail(error); if (button.isConnected) button.disabled = false; }
    });
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const version = selected, timestampSeconds = attachTime.checked && !attachTime.disabled ? pinnedTime : null;
      const button = form.querySelector('[type="submit"]'), alert = form.querySelector('[role="alert"]');
      button.disabled = true; alert.hidden = true;
      try {
        const result = await api("/api/uploads", { method:"POST", headers:headers(true), body:JSON.stringify({ action:"create-comment", projectId, fileId:version.id, assetId:version.asset_id || assetId, timestampSeconds, ...Object.fromEntries(new FormData(form)) }) });
        changed = true;
        const saved = result.comment;
        comments.unshift({ id:saved.id, file_id:version.id, asset_id:version.asset_id || assetId, author_name:saved.authorName, body:saved.body, timestamp_seconds:saved.timestampSeconds, status:saved.status, created_at:saved.createdAt });
        if (active) { form.elements.body.value = ""; renderNotes(); }
      } catch (error) { if (active) { alert.textContent = error.message; alert.hidden = false; } }
      finally { button.disabled = false; }
    });
    dialog.querySelector("[data-version-download]").addEventListener("click", async event => {
      const button = event.currentTarget; button.disabled = true;
      try { const url = await signedUrl(selected); if (active) { const link = document.createElement("a"); link.href = url; link.download = selected.original_name; link.click(); } } catch (error) { fail(error); } finally { button.disabled = false; }
    });
    dialog.querySelector("[data-export-notes]").addEventListener("click", () => {
      const url = URL.createObjectURL(new Blob([exportReviewText(selected.original_name, selected.version_number, commentsForVersion(comments,selected))], { type:"text/plain;charset=utf-8" }));
      const link = document.createElement("a"); link.href = url; link.download = `review-v${selected.version_number}.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    choose();
  } catch (error) { if (active && dialog.isConnected) { const target = dialog.querySelector(".sx-room-loading") || dialog.querySelector("[data-room-error]"); if (target) { target.textContent = error.message; target.hidden = false; } } }
}
