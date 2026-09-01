import { escapeText as esc, commentsForVersion, filterComments, hasTimestamp, isComplete, reviewSummary, timecode } from "./studio-workspace.js?v=frame-workspace-1";

export function reviewCommentMarkup(comment, canManage) {
  return `<article class="sx-review-note ${isComplete(comment) ? "is-complete" : ""}"><header><span>${esc((comment.author_name || "?").slice(0,1))}</span><strong>${esc(comment.author_name || "Reviewer")}</strong><small>${isComplete(comment) ? "Completed" : "Open"}</small></header>${hasTimestamp(comment.timestamp_seconds) ? `<button type="button" class="sx-timecode" data-seek="${Number(comment.timestamp_seconds)}">▶ ${timecode(comment.timestamp_seconds)}</button>` : ""}<p>${esc(comment.body)}</p>${comment.voice_note_id ? `<button type="button" class="sx-play-voice" data-play-voice="${esc(comment.voice_note_id)}">Play voice note</button><div data-voice-player="${esc(comment.voice_note_id)}"></div>` : ""}${canManage ? `<button type="button" class="sx-resolve" data-review-resolve="${esc(comment.id)}">${isComplete(comment) ? "↶ Reopen" : "✓ Mark complete"}</button>` : ""}</article>`;
}

export function exportReviewText(name, version, comments) {
  return [`CONTENT X — REVIEW NOTES`, name, `Version ${version}`, "", ...comments.map(comment => `[${isComplete(comment) ? "DONE" : "OPEN"}] ${hasTimestamp(comment.timestamp_seconds) ? timecode(comment.timestamp_seconds) : "General"} — ${comment.author_name}\n${comment.body}\n`)].join("\n");
}

function safeCsvValue(value) {
  let text = String(value ?? "").replace(/\r?\n/g, " ");
  if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function exportReviewCsv(name, version, comments) {
  const rows = [["Project file", "Version", "Timecode", "Status", "Author", "Comment"], ...comments.map(comment => [name, `V${version}`, hasTimestamp(comment.timestamp_seconds) ? timecode(comment.timestamp_seconds) : "General", isComplete(comment) ? "Completed" : "Open", comment.author_name || "Reviewer", comment.body])];
  return rows.map(row => row.map(safeCsvValue).join(",")).join("\r\n");
}

function edlTimecode(value, fps = 30) {
  const frames = Math.max(0, Math.round(Number(value || 0) * fps));
  const frame = frames % fps, seconds = Math.floor(frames / fps) % 60, minutes = Math.floor(frames / (fps * 60)) % 60, hours = Math.floor(frames / (fps * 3600));
  return [hours, minutes, seconds, frame].map(part => String(part).padStart(2, "0")).join(":");
}

export function exportReviewEdl(name, version, comments) {
  const timed = comments.filter(comment => hasTimestamp(comment.timestamp_seconds)).sort((a,b) => Number(a.timestamp_seconds) - Number(b.timestamp_seconds));
  const events = timed.flatMap((comment, index) => {
    const start = edlTimecode(comment.timestamp_seconds), end = edlTimecode(Number(comment.timestamp_seconds) + 1), number = String(index + 1).padStart(3, "0");
    const note = String(comment.body || "").replace(/\r?\n/g, " ").replace(/[\u0000-\u001f]/g, " ").slice(0, 500);
    return [`${number}  AX       V     C        ${start} ${end} ${start} ${end}`, `* FROM CLIP NAME: ${name}`, `* COMMENT: [${isComplete(comment) ? "DONE" : "OPEN"}] ${comment.author_name || "Reviewer"}: ${note}`, ""];
  });
  return [`TITLE: Content X - ${name} - V${version}`, "FCM: NON-DROP FRAME", "", ...events].join("\n");
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
    dialog.innerHTML = `<header class="sx-room-header"><div><span class="sx-overline">CONTENT X / REVIEW ROOM</span><h2>${esc(selected.original_name)}</h2></div><button type="button" data-room-close aria-label="Close review">×</button></header><div class="sx-room-body"><section class="sx-room-stage"><div class="sx-room-toolbar"><label>Review version<select data-review-version>${versions.map(version => `<option value="${esc(version.id)}">V${Number(version.version_number)} · ${esc(version.original_name)}</option>`).join("")}</select></label><button type="button" data-compare aria-pressed="false" ${versions.length < 2 ? "disabled title=\"Upload another version to compare\"" : ""}>Compare versions</button><button type="button" data-version-download>Download</button></div><div class="sx-compare-choice" hidden><label>Compare against<select data-compare-version></select></label><p>Playback follows the review version. Comparison audio is muted.</p></div><div class="sx-media-grid"><figure><figcaption data-primary-caption></figcaption><div data-primary-media class="sx-media-slot" tabindex="0"></div></figure><figure data-comparison hidden><figcaption data-compare-caption></figcaption><div data-compare-media class="sx-media-slot"></div></figure></div><p class="sx-player-help">Click video to pause or resume. For scripts, select text and add it as a quote. PDF notes can include a page number.</p><div class="sx-document-tools" data-document-tools hidden><label>PDF page <input type="number" min="1" max="9999" value="1" data-document-page></label><button type="button" data-quote-selection>Quote selected text</button></div><p data-room-error role="alert" hidden></p><section class="sx-version-strip" aria-label="Version history">${versions.map(version => `<button type="button" data-pick-version="${esc(version.id)}"><span>V${Number(version.version_number)}</span><small>${Number(version.version_number) === Number(versions[0].version_number) ? "Latest cut" : "Earlier cut"}</small></button>`).join("")}</section><div class="sx-review-progress"><span data-feedback-progress></span><progress max="100" value="0" aria-label="Feedback completion"></progress><small>Completed feedback is not a final approval.</small></div></section><aside class="sx-room-feedback"><header><h3>Feedback <span data-note-count></span></h3><div class="sx-export-notes"><select data-export-format aria-label="Export format"><option value="text">TXT</option><option value="csv">CSV</option><option value="edl">EDL</option></select><button type="button" data-export-notes>Export</button></div></header><div class="sx-note-filters"><input type="search" data-note-search aria-label="Search review comments" placeholder="Search feedback…"><select data-note-status aria-label="Filter review comments"><option value="all">All notes</option><option value="open">Open</option><option value="complete">Completed</option></select><select data-note-sort aria-label="Sort review comments"><option value="time">Timecode</option><option value="newest">Newest</option></select></div><div class="sx-room-notes" data-room-notes></div><form class="sx-note-form"><label>Your name<input name="authorName" required minlength="2" maxlength="100" autocomplete="name"></label><label>Email (optional)<input name="authorEmail" type="email" maxlength="254" autocomplete="email"></label><label>Feedback<textarea name="body" required maxlength="2000" rows="3" placeholder="What should change in this file?"></textarea></label><div class="sx-capture-row"><label><input type="checkbox" data-attach-time checked>At <output data-pinned-time>00:00</output></label><button type="button" data-capture-time>Use playhead</button></div><button class="workspace-button primary" type="submit">Send feedback ↗</button><p role="alert" hidden></p></form></aside></div>`;
    const errorBox = dialog.querySelector("[data-room-error]");
    const fail = error => { if (!active) return; errorBox.hidden = false; errorBox.textContent = error.message || "This request could not be completed."; };
    const versionSelect = dialog.querySelector("[data-review-version]"), compareSelect = dialog.querySelector("[data-compare-version]");
    const primarySlot = dialog.querySelector("[data-primary-media]"), compareSlot = dialog.querySelector("[data-compare-media]");
    const form = dialog.querySelector("form"), attachTime = dialog.querySelector("[data-attach-time]");
    form.elements.body.required = false;
    form.querySelector(".sx-capture-row").insertAdjacentHTML("beforebegin", '<div class="sx-voice-row"><button type="button" data-record-voice>Record voice note</button><span data-voice-status>Up to 60 seconds</span></div>');
    let voiceRecorder = null, voiceStream = null, voiceChunks = [], voiceBlob = null, voiceDuration = 0, voiceTimer = null, voiceStarted = 0;
    const stopTracks = () => { clearTimeout(voiceTimer); voiceStream?.getTracks().forEach(track => track.stop()); voiceStream = null; };
    const stopRecording = () => { if (voiceRecorder?.state === "recording") voiceRecorder.stop(); };
    form.querySelector("[data-record-voice]").addEventListener("click", async event => {
      if (voiceRecorder?.state === "recording") return stopRecording();
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return fail(new Error("Voice notes are not supported by this browser."));
      try {
        voiceStream = await navigator.mediaDevices.getUserMedia({ audio:{ echoCancellation:true, noiseSuppression:true } });
        const mimeType = ["audio/webm;codecs=opus","audio/mp4","audio/ogg"].find(type => MediaRecorder.isTypeSupported?.(type)) || "";
        voiceRecorder = new MediaRecorder(voiceStream, mimeType ? { mimeType } : undefined); voiceChunks = []; voiceStarted = Date.now();
        voiceRecorder.addEventListener("dataavailable", item => { if (item.data.size) voiceChunks.push(item.data); });
        voiceRecorder.addEventListener("stop", () => { voiceDuration = Math.max(1,Math.round((Date.now()-voiceStarted)/1000)); voiceBlob = new Blob(voiceChunks,{type:(voiceRecorder?.mimeType || "audio/webm").split(";")[0]}); stopTracks(); event.currentTarget.classList.remove("is-recording"); event.currentTarget.textContent = "Record again"; form.querySelector("[data-voice-status]").textContent = `${voiceDuration}s voice note ready`; }, { once:true });
        voiceRecorder.start(250); event.currentTarget.classList.add("is-recording"); event.currentTarget.textContent = "Stop recording"; form.querySelector("[data-voice-status]").textContent = "Recording…"; voiceTimer = setTimeout(stopRecording,60_000);
      } catch (error) { stopTracks(); fail(new Error(error?.name === "NotAllowedError" ? "Microphone permission was not allowed." : "The microphone could not be started.")); }
    });
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
      const isPdf = type === "application/pdf" || /\.pdf$/i.test(version.original_name || "");
      const isText = /^(text\/(plain|markdown|csv)|application\/(json|javascript))/.test(type) || /\.(txt|md|csv|json|js|ts|jsx|tsx|srt|vtt)$/i.test(version.original_name || "");
      if (!/^(video|audio|image)\//.test(type) && !isPdf && !isText) { slot.textContent = "Preview is available for video, audio, images, PDFs and text scripts. Download this file to open it in its original app."; return; }
      slot.textContent = "Preparing private preview…";
      const url = new URL(await signedUrl(version));
      if (isPdf || isText) url.searchParams.set("inline", "1");
      if (!active || !dialog.isConnected || ticket !== request) return;
      if (isPdf) { const frame = document.createElement("iframe"); frame.className = "sx-document-frame"; frame.title = `${secondary ? "Comparison" : "Review"} PDF: ${version.original_name}`; frame.src = url.href; slot.replaceChildren(frame); return; }
      if (isText) { const response = await fetch(url.href, { cache:"no-store" }); if (!response.ok) throw new Error("The script preview could not be loaded."); const text = (await response.text()).slice(0,250_000); const pre = document.createElement("pre"); pre.className = "sx-script-preview"; pre.textContent = text; slot.replaceChildren(pre); return; }
      const media = document.createElement(type.startsWith("video/") ? "video" : type.startsWith("audio/") ? "audio" : "img");
      if (media.tagName === "IMG") media.alt = `${secondary ? "Comparison" : "Review"} version: ${version.original_name}`;
      else { media.controls = true; media.preload = "metadata"; media.playsInline = true; media.muted = secondary; }
      media.addEventListener("error", () => { if (active && ticket === request) { slot.replaceChildren(document.createTextNode("Preview unavailable or expired. Reselect the version to retry, or download the original.")); } });
      media.src = url.href; slot.replaceChildren(media);
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
      const documentReview = selected.content_type === "application/pdf" || /^text\//.test(selected.content_type || "") || /\.(pdf|txt|md|csv|json|js|ts|jsx|tsx|srt|vtt)$/i.test(selected.original_name || "");
      dialog.querySelector("[data-document-tools]").hidden = !documentReview;
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
    primarySlot.addEventListener("click", event => { const media = event.target.closest("video"); if (media) media.paused ? media.play().catch(() => {}) : media.pause(); });
    dialog.querySelector("[data-quote-selection]").addEventListener("click", () => { const text = String(window.getSelection?.() || "").trim().slice(0,600); if (!text) return fail(new Error("Select text in the script preview first.")); form.elements.body.value = `${form.elements.body.value ? `${form.elements.body.value}\n\n` : ""}> ${text.replace(/\n+/g,"\n> ")}\n`; form.elements.body.focus(); });
    form.elements.body.addEventListener("focus", capture);
    ["[data-note-search]", "[data-note-status]", "[data-note-sort]"].forEach(selector => dialog.querySelector(selector).addEventListener(selector.includes("search") ? "input" : "change", renderNotes));
    dialog.querySelector("[data-room-notes]").addEventListener("click", async event => {
      const voiceButton = event.target.closest("[data-play-voice]");
      if (voiceButton) {
        voiceButton.disabled = true;
        try { const data = await api("/api/uploads", { method:"POST", headers:headers(true), body:JSON.stringify({ action:"comment-voice-link", projectId, voiceNoteId:voiceButton.dataset.playVoice }) }); const player = dialog.querySelector(`[data-voice-player="${CSS.escape(voiceButton.dataset.playVoice)}"]`); if (player) { const audio = document.createElement("audio"); audio.controls = true; audio.autoplay = true; audio.src = data.downloadUrl; player.replaceChildren(audio); } } catch (error) { fail(error); } finally { voiceButton.disabled = false; }
      }
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
      const page = Number(dialog.querySelector("[data-document-page]").value || 0); if (version.content_type === "application/pdf" && page > 0 && !/^Page \d+ —/.test(form.elements.body.value)) form.elements.body.value = `Page ${page} — ${form.elements.body.value}`;
      const button = form.querySelector('[type="submit"]'), alert = form.querySelector('[role="alert"]');
      button.disabled = true; alert.hidden = true;
      try {
        let voiceNoteId = null;
        if (voiceBlob) { if (voiceBlob.size > 1_250_000) throw new Error("Voice note is too large. Keep it under 60 seconds."); const dataUrl = await new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(voiceBlob); }); const savedVoice = await api("/api/uploads", { method:"POST", headers:headers(true), body:JSON.stringify({ action:"create-comment-voice", projectId, dataUrl, durationSeconds:voiceDuration }) }); voiceNoteId = savedVoice.voiceNoteId; }
        const result = await api("/api/uploads", { method:"POST", headers:headers(true), body:JSON.stringify({ action:"create-comment", projectId, fileId:version.id, assetId:version.asset_id || assetId, voiceNoteId, timestampSeconds, ...Object.fromEntries(new FormData(form)) }) });
        changed = true;
        const saved = result.comment;
        comments.unshift({ id:saved.id, file_id:version.id, asset_id:version.asset_id || assetId, voice_note_id:saved.voiceNoteId, author_name:saved.authorName, body:saved.body, timestamp_seconds:saved.timestampSeconds, status:saved.status, created_at:saved.createdAt });
        if (active) { form.elements.body.value = ""; voiceBlob = null; voiceDuration = 0; form.querySelector("[data-record-voice]").textContent = "Record voice note"; form.querySelector("[data-voice-status]").textContent = "Up to 60 seconds"; renderNotes(); }
      } catch (error) { if (active) { alert.textContent = error.message; alert.hidden = false; } }
      finally { button.disabled = false; }
    });
    dialog.querySelector("[data-version-download]").addEventListener("click", async event => {
      const button = event.currentTarget; button.disabled = true;
      try { const url = await signedUrl(selected); if (active) { const link = document.createElement("a"); link.href = url; link.download = selected.original_name; link.click(); } } catch (error) { fail(error); } finally { button.disabled = false; }
    });
    dialog.querySelector("[data-export-notes]").addEventListener("click", () => {
      const format = dialog.querySelector("[data-export-format]").value, notes = commentsForVersion(comments,selected);
      if (format === "edl" && !notes.some(comment => hasTimestamp(comment.timestamp_seconds))) return fail(new Error("EDL export needs at least one timecoded note."));
      const exporters = { text:exportReviewText, csv:exportReviewCsv, edl:exportReviewEdl }, extensions = { text:"txt", csv:"csv", edl:"edl" }, types = { text:"text/plain;charset=utf-8", csv:"text/csv;charset=utf-8", edl:"text/plain;charset=utf-8" };
      const url = URL.createObjectURL(new Blob([exporters[format](selected.original_name, selected.version_number, notes)], { type:types[format] }));
      const link = document.createElement("a"); link.href = url; link.download = `review-v${selected.version_number}.${extensions[format]}`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    dialog.addEventListener("keydown", event => { if (event.code === "Space" && !event.target.closest("input,textarea,select,button")) { const media = primarySlot.querySelector("video"); if (media) { event.preventDefault(); media.paused ? media.play().catch(() => {}) : media.pause(); } } });
    choose();
    lifecycle.signal.addEventListener("abort", () => { stopRecording(); stopTracks(); }, { once:true });
  } catch (error) { if (active && dialog.isConnected) { const target = dialog.querySelector(".sx-room-loading") || dialog.querySelector("[data-room-error]"); if (target) { target.textContent = error.message; target.hidden = false; } } }
}
