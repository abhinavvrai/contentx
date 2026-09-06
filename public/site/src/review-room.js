import { escapeText as esc, commentsForVersion, filterComments, hasTimestamp, isComplete, reviewSummary, timecode } from "./studio-workspace.js?v=frame-workspace-1";

export function reviewCommentMarkup(comment, canManage) {
  const status = comment.status === "in_progress" ? "In progress" : isComplete(comment) ? "Completed" : "Open";
  const priority = ["low","normal","high","urgent"].includes(comment.priority) ? comment.priority : "normal";
  const dueValue = comment.due_at ? new Date(Number(comment.due_at)).toISOString().slice(0,10) : "";
  const metadata = [priority !== "normal" ? `<span class="priority ${priority}">${esc(priority)}</span>` : "", comment.assignee ? `<span>Assigned · ${esc(comment.assignee)}</span>` : "", comment.due_at ? `<span>Due · ${esc(new Date(Number(comment.due_at)).toLocaleDateString([], { dateStyle:"medium" }))}</span>` : "", comment.visibility === "internal" ? `<span class="internal">Internal team</span>` : ""].filter(Boolean).join("");
  const timeLabel = hasTimestamp(comment.timestamp_seconds) ? `${timecode(comment.timestamp_seconds)}${Number(comment.range_end_seconds) > Number(comment.timestamp_seconds) ? `–${timecode(comment.range_end_seconds)}` : ""}` : "";
  const workflow = canManage ? `<details class="sx-note-workflow"><summary>Manage</summary><div><label>Status<select data-workflow-status><option value="open" ${comment.status === "open" ? "selected" : ""}>Open</option><option value="in_progress" ${comment.status === "in_progress" ? "selected" : ""}>In progress</option><option value="completed" ${isComplete(comment) ? "selected" : ""}>Completed</option></select></label><label>Priority<select data-workflow-priority><option value="low" ${priority === "low" ? "selected" : ""}>Low</option><option value="normal" ${priority === "normal" ? "selected" : ""}>Normal</option><option value="high" ${priority === "high" ? "selected" : ""}>High</option><option value="urgent" ${priority === "urgent" ? "selected" : ""}>Urgent</option></select></label><label>Assignee<input data-workflow-assignee maxlength="100" value="${esc(comment.assignee || "")}" placeholder="Name or role"></label><label>Due date<input data-workflow-due type="date" value="${dueValue}"></label><label>Visibility<select data-workflow-visibility><option value="project" ${comment.visibility !== "internal" ? "selected" : ""}>Everyone with access</option><option value="internal" ${comment.visibility === "internal" ? "selected" : ""}>Internal team only</option></select></label><button type="button" data-save-workflow="${esc(comment.id)}">Save</button></div></details>` : "";
  return `<article class="sx-review-note ${isComplete(comment) ? "is-complete" : ""} ${comment.parent_comment_id ? "is-reply" : ""}" data-note-id="${esc(comment.id)}"><header><span>${esc((comment.author_name || "?").slice(0,1))}</span><strong>${esc(comment.author_name || "Reviewer")}</strong><small>${status}</small></header>${timeLabel ? `<button type="button" class="sx-timecode" data-seek="${Number(comment.timestamp_seconds)}">▶ ${timeLabel}</button>` : ""}${metadata ? `<div class="sx-note-meta">${metadata}</div>` : ""}<p>${esc(comment.body)}</p>${comment.voice_note_id ? `<button type="button" class="sx-play-voice" data-play-voice="${esc(comment.voice_note_id)}">Play voice note</button><div data-voice-player="${esc(comment.voice_note_id)}"></div>` : ""}<div class="sx-note-actions"><button type="button" data-reply-note="${esc(comment.id)}">Reply</button>${canManage ? `<button type="button" class="sx-resolve" data-review-resolve="${esc(comment.id)}">${isComplete(comment) ? "↶ Reopen" : "✓ Mark complete"}</button>` : ""}</div>${workflow}</article>`;
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

export function chooseVoiceMimeType(recorder = globalThis.MediaRecorder) {
  if (!recorder?.isTypeSupported) return "";
  return ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus", "audio/webm", "audio/ogg"].find(type => recorder.isTypeSupported(type)) || "";
}

const voiceClock = seconds => `${String(Math.floor(seconds / 60)).padStart(2,"0")}:${String(Math.floor(seconds % 60)).padStart(2,"0")}`;
const voiceSize = bytes => bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;

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
    let comments = feedback.comments || [], decisions = history.decisions || [], selected = versions[0], comparison = false, pinnedTime = 0, openNoteIndex = -1;
    dialog.innerHTML = `<header class="sx-room-header"><div><span class="sx-overline">CONTENT X / REVIEW ROOM</span><h2>${esc(selected.original_name)}</h2></div><button type="button" data-room-close aria-label="Close review">×</button></header><div class="sx-room-body"><section class="sx-room-stage"><div class="sx-room-toolbar"><label>Review version<select data-review-version>${versions.map(version => `<option value="${esc(version.id)}">V${Number(version.version_number)} · ${esc(version.original_name)}</option>`).join("")}</select></label><button type="button" data-compare aria-pressed="false" ${versions.length < 2 ? "disabled title=\"Upload another version to compare\"" : ""}>Compare versions</button><button type="button" data-version-download>Download</button></div><div class="sx-compare-choice" hidden><label>Compare against<select data-compare-version></select></label><p>Playback follows the review version. Comparison audio is muted.</p></div><div class="sx-media-grid"><figure><figcaption data-primary-caption></figcaption><div data-primary-media class="sx-media-slot" tabindex="0"></div></figure><figure data-comparison hidden><figcaption data-compare-caption></figcaption><div data-compare-media class="sx-media-slot"></div></figure></div><p class="sx-player-help">Click video to pause or resume. For scripts, select text and add it as a quote. PDF notes can include a page number.</p><div class="sx-document-tools" data-document-tools hidden><label>PDF page <input type="number" min="1" max="9999" value="1" data-document-page></label><button type="button" data-quote-selection>Quote selected text</button></div><p data-room-error role="alert" hidden></p><section class="sx-version-strip" aria-label="Version history">${versions.map(version => `<button type="button" data-pick-version="${esc(version.id)}"><span>V${Number(version.version_number)}</span><small>${Number(version.version_number) === Number(versions[0].version_number) ? "Latest cut" : "Earlier cut"}</small></button>`).join("")}</section><div class="sx-review-progress"><span data-feedback-progress></span><progress max="100" value="0" aria-label="Feedback completion"></progress><small>Completed feedback is not a final approval.</small></div></section><aside class="sx-room-feedback"><header><h3>Feedback <span data-note-count></span></h3><div class="sx-export-notes"><select data-export-format aria-label="Export format"><option value="text">TXT</option><option value="csv">CSV</option><option value="edl">EDL</option></select><button type="button" data-export-notes>Export</button></div></header><div class="sx-note-filters"><input type="search" data-note-search aria-label="Search review comments" placeholder="Search feedback…"><select data-note-status aria-label="Filter review comments"><option value="all">All notes</option><option value="open">Open</option><option value="complete">Completed</option></select><select data-note-sort aria-label="Sort review comments"><option value="time">Timecode</option><option value="newest">Newest</option></select></div><div class="sx-room-notes" data-room-notes></div><form class="sx-note-form"><label>Your name<input name="authorName" required minlength="2" maxlength="100" autocomplete="name"></label><label>Email (optional)<input name="authorEmail" type="email" maxlength="254" autocomplete="email"></label><label>Feedback<textarea name="body" required maxlength="2000" rows="3" placeholder="What should change in this file?"></textarea></label><div class="sx-capture-row"><label><input type="checkbox" data-attach-time checked>At <output data-pinned-time>00:00</output></label><button type="button" data-capture-time>Use playhead</button></div><button class="workspace-button primary" type="submit">Send feedback ↗</button><p role="alert" hidden></p></form></aside></div>`;
    const roomToolbar = dialog.querySelector(".sx-room-toolbar");
    roomToolbar.querySelector("[data-version-download]").insertAdjacentHTML("beforebegin", `<label class="sx-playback-rate">Speed<select data-playback-rate aria-label="Playback speed"><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label><button type="button" data-capture-frame>Capture frame</button><button type="button" data-pip>Picture in picture</button><button type="button" data-fullscreen>Fullscreen</button><button type="button" data-review-help aria-expanded="false">Shortcuts</button>`);
    roomToolbar.insertAdjacentHTML("afterend", `<div class="sx-shortcuts" data-shortcuts hidden><span><kbd>Space</kbd> play/pause</span><span><kbd>←</kbd><kbd>→</kbd> seek 5s</span><span><kbd>,</kbd><kbd>.</kbd> step frame</span><span><kbd>J</kbd><kbd>K</kbd> open note</span><span><kbd>M</kbd> mute</span><span><kbd>F</kbd> fullscreen</span></div>`);
    dialog.querySelector(".sx-version-strip").insertAdjacentHTML("afterend", `<section class="sx-version-decision"><header><div><small>VERSION DECISION</small><strong data-decision-status>Not decided</strong></div><span data-decision-by>Choose when this cut is ready.</span></header><label>Optional decision note<input type="text" data-decision-note maxlength="500" placeholder="Final approved, or what should happen next"></label><div class="sx-decision-actions"><button type="button" data-version-decision="changes_requested">Request changes</button><button type="button" data-version-decision="approved">Approve version</button></div><details><summary>Decision history</summary><div data-decision-history></div></details></section>`);
    dialog.querySelector(".sx-room-feedback>header h3").insertAdjacentHTML("afterend", `<div class="sx-open-note-nav"><button type="button" data-open-note-prev aria-label="Previous open note">↑</button><button type="button" data-open-note-next>Next open ↓</button></div>`);
    if (canManage) dialog.querySelector(".sx-note-filters").insertAdjacentHTML("afterend", `<button class="sx-bulk-comments" type="button" data-bulk-comments disabled>Complete visible</button>`);
    const errorBox = dialog.querySelector("[data-room-error]");
    const fail = error => { if (!active) return; errorBox.hidden = false; errorBox.textContent = error.message || "This request could not be completed."; };
    const versionSelect = dialog.querySelector("[data-review-version]"), compareSelect = dialog.querySelector("[data-compare-version]");
    const primarySlot = dialog.querySelector("[data-primary-media]"), compareSlot = dialog.querySelector("[data-compare-media]");
    const form = dialog.querySelector("form"), attachTime = dialog.querySelector("[data-attach-time]");
    form.elements.body.required = false;
    form.querySelector(".sx-capture-row").insertAdjacentHTML("beforebegin", `<div class="sx-reply-target" data-reply-target hidden><span>Replying in thread</span><button type="button" data-cancel-reply>Cancel</button><input type="hidden" name="parentCommentId"></div>${canManage ? `<div class="sx-comment-meta-compose"><label>Priority<select name="priority"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option><option value="low">Low</option></select></label><label>Assignee<input name="assignee" maxlength="100" placeholder="Name or role"></label><label>Due date<input name="dueDate" type="date"></label><label>Visibility<select name="visibility"><option value="project">Everyone with access</option><option value="internal">Internal team only</option></select></label></div>` : ""}`);
    form.querySelector(".sx-capture-row").insertAdjacentHTML("beforeend", `<button type="button" data-range-end>Set range end</button><output data-range-label hidden></output>`);
    form.querySelector(".sx-capture-row").insertAdjacentHTML("beforebegin", `<section class="sx-voice-composer" data-voice-composer><header><button type="button" data-record-voice>Record voice note</button><button type="button" data-test-mic>Test mic</button><select data-mic-device aria-label="Microphone" hidden></select></header><div class="sx-voice-live" data-voice-live hidden><div class="sx-voice-wave" data-voice-wave aria-hidden="true">${Array.from({length:24},(_,index) => `<i style="--bar:${index}"></i>`).join("")}</div><output data-voice-timer>00:00 / 01:00</output></div><div class="sx-voice-actions" data-voice-actions hidden><button type="button" data-pause-voice>Pause</button><button type="button" data-stop-voice>Finish</button><button type="button" data-cancel-voice>Cancel</button></div><div class="sx-voice-preview" data-voice-preview hidden><audio controls preload="metadata" data-voice-preview-audio></audio><div><label>Speed <select data-voice-speed><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label><button type="button" data-rerecord-voice>Record again</button><button type="button" data-discard-voice>Discard</button></div></div><p data-voice-status role="status">Up to 60 seconds · nothing uploads until you send feedback</p></section>`);
    const voiceComposer = form.querySelector("[data-voice-composer]"), recordVoice = voiceComposer.querySelector("[data-record-voice]"), testMic = voiceComposer.querySelector("[data-test-mic]"), micDevice = voiceComposer.querySelector("[data-mic-device]");
    const voiceLive = voiceComposer.querySelector("[data-voice-live]"), voiceActions = voiceComposer.querySelector("[data-voice-actions]"), voicePreview = voiceComposer.querySelector("[data-voice-preview]"), voiceAudio = voiceComposer.querySelector("[data-voice-preview-audio]"), voiceStatus = voiceComposer.querySelector("[data-voice-status]"), voiceTimerOutput = voiceComposer.querySelector("[data-voice-timer]");
    let voiceRecorder = null, voiceStream = null, voiceTestStream = null, voiceChunks = [], voiceBlob = null, voiceDuration = 0, voiceStopTimer = null, voiceTestTimer = null, voiceTick = null, voiceStarted = 0, voicePausedAt = 0, voicePausedMs = 0, voiceCancelled = false, voiceObjectUrl = "", uploadedVoiceNoteId = null, stopMeter = () => {};
    const setVoiceStatus = (message, state = "idle") => { voiceStatus.textContent = message; voiceComposer.dataset.state = state; };
    const stopTracks = () => { clearTimeout(voiceStopTimer); clearTimeout(voiceTestTimer); clearInterval(voiceTick); voiceStopTimer = voiceTestTimer = voiceTick = null; stopMeter(); stopMeter = () => {}; voiceStream?.getTracks().forEach(track => track.stop()); voiceStream = null; voiceTestStream?.getTracks().forEach(track => track.stop()); voiceTestStream = null; };
    const clearVoiceUrl = () => { if (voiceObjectUrl) URL.revokeObjectURL(voiceObjectUrl); voiceObjectUrl = ""; voiceAudio.pause(); voiceAudio.removeAttribute("src"); voiceAudio.load(); };
    const resetVoiceDraft = (message = "Up to 60 seconds · nothing uploads until you send feedback") => { stopTracks(); clearVoiceUrl(); voiceRecorder = null; voiceChunks = []; voiceBlob = null; voiceDuration = 0; voicePausedAt = voicePausedMs = 0; voiceCancelled = false; uploadedVoiceNoteId = null; voiceLive.hidden = voiceActions.hidden = voicePreview.hidden = true; recordVoice.hidden = testMic.hidden = false; recordVoice.disabled = testMic.disabled = false; recordVoice.textContent = "Record voice note"; setVoiceStatus(message); };
    const voiceElapsed = () => Math.max(0, Math.min(60, (Date.now() - voiceStarted - voicePausedMs - (voicePausedAt ? Date.now() - voicePausedAt : 0)) / 1000));
    const updateVoiceClock = () => { voiceTimerOutput.textContent = `${voiceClock(voiceElapsed())} / 01:00`; };
    const startVoiceMeter = stream => {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext; if (!AudioContextClass) return () => {};
      const context = new AudioContextClass(), analyser = context.createAnalyser(), source = context.createMediaStreamSource(stream), data = new Uint8Array(64), bars = [...voiceComposer.querySelectorAll("[data-voice-wave] i")]; analyser.fftSize = 128; source.connect(analyser); let frame = 0, stopped = false;
      const draw = () => { if (stopped) return; analyser.getByteTimeDomainData(data); const level = Math.min(1, Math.sqrt(data.reduce((sum,value) => sum + ((value-128)/128) ** 2,0) / data.length) * 4.5); bars.forEach((bar,index) => bar.style.setProperty("--level", String(Math.max(.08, Math.min(1, level * (.55 + ((index * 17) % 10) / 10)))))); frame = requestAnimationFrame(draw); }; draw();
      return () => { stopped = true; cancelAnimationFrame(frame); source.disconnect(); context.close().catch(() => {}); };
    };
    const listMicrophones = async selectedId => { const devices = (await navigator.mediaDevices.enumerateDevices()).filter(device => device.kind === "audioinput"); micDevice.innerHTML = devices.map((device,index) => `<option value="${esc(device.deviceId)}" ${device.deviceId === selectedId ? "selected" : ""}>${esc(device.label || `Microphone ${index + 1}`)}</option>`).join(""); micDevice.hidden = devices.length < 2; };
    const microphoneConstraints = () => ({ audio:{ deviceId:micDevice.value ? { exact:micDevice.value } : undefined, echoCancellation:true, noiseSuppression:true, autoGainControl:true, channelCount:1 } });
    const microphoneError = error => error?.name === "NotAllowedError" ? "Microphone access is blocked. Allow it in your browser's site settings, then try again." : error?.name === "NotFoundError" ? "No microphone was found. Connect one and try again." : error?.name === "NotReadableError" ? "Your microphone is busy in another app." : "The microphone could not be started. Try another input or browser.";
    const finishRecording = () => { if (["recording","paused"].includes(voiceRecorder?.state)) voiceRecorder.stop(); };
    const startRecording = async () => {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return fail(new Error("Voice notes are not supported by this browser."));
      recordVoice.disabled = testMic.disabled = true; setVoiceStatus("Waiting for microphone permission…", "permission");
      try {
        clearVoiceUrl(); voiceBlob = null; uploadedVoiceNoteId = null; voiceStream = await navigator.mediaDevices.getUserMedia(microphoneConstraints()); const selectedId = voiceStream.getAudioTracks()[0]?.getSettings?.().deviceId || ""; await listMicrophones(selectedId).catch(() => {});
        const mimeType = chooseVoiceMimeType(); voiceRecorder = new MediaRecorder(voiceStream, mimeType ? { mimeType } : undefined); voiceChunks = []; voiceStarted = Date.now(); voicePausedAt = voicePausedMs = 0; voiceCancelled = false;
        const recorder = voiceRecorder;
        recorder.addEventListener("dataavailable", item => { if (item.data.size) voiceChunks.push(item.data); });
        recorder.addEventListener("error", () => { stopTracks(); resetVoiceDraft("Recording stopped because the browser reported an audio error. Please try again."); }, { once:true });
        recorder.addEventListener("stop", () => { const cancelled = voiceCancelled; voiceDuration = Math.max(1,Math.round(voiceElapsed())); const blob = new Blob(voiceChunks,{type:(recorder.mimeType || voiceChunks[0]?.type || "audio/webm").split(";")[0]}); stopTracks(); voiceActions.hidden = voiceLive.hidden = true; recordVoice.disabled = testMic.disabled = false; if (cancelled) return resetVoiceDraft("Recording cancelled. Nothing was uploaded."); if (!blob.size) return resetVoiceDraft("No audio was captured. Check your microphone and try again."); voiceBlob = blob; voiceObjectUrl = URL.createObjectURL(blob); voiceAudio.src = voiceObjectUrl; voicePreview.hidden = false; recordVoice.hidden = testMic.hidden = true; setVoiceStatus(blob.size > 1_250_000 ? "This recording is too large to send. Record a shorter voice note." : `${voiceClock(voiceDuration)} ready · ${voiceSize(blob.size)} · preview before sending`, blob.size > 1_250_000 ? "error" : "ready"); }, { once:true });
        recorder.start(250); voiceLive.hidden = voiceActions.hidden = false; voicePreview.hidden = true; recordVoice.hidden = testMic.hidden = true; voiceComposer.querySelector("[data-pause-voice]").textContent = "Pause"; updateVoiceClock(); voiceTick = setInterval(updateVoiceClock,250); voiceStopTimer = setTimeout(finishRecording,60_000); stopMeter = startVoiceMeter(voiceStream); setVoiceStatus("Recording securely on this device…", "recording");
      } catch (error) { stopTracks(); recordVoice.disabled = testMic.disabled = false; setVoiceStatus(microphoneError(error), "error"); }
    };
    recordVoice.addEventListener("click", startRecording);
    voiceComposer.querySelector("[data-stop-voice]").addEventListener("click", finishRecording);
    voiceComposer.querySelector("[data-pause-voice]").addEventListener("click", event => { if (voiceRecorder?.state === "recording") { voiceRecorder.pause(); voicePausedAt = Date.now(); event.currentTarget.textContent = "Resume"; setVoiceStatus("Recording paused. Resume or finish when ready.", "paused"); } else if (voiceRecorder?.state === "paused") { voicePausedMs += Date.now() - voicePausedAt; voicePausedAt = 0; voiceRecorder.resume(); event.currentTarget.textContent = "Pause"; setVoiceStatus("Recording securely on this device…", "recording"); } });
    voiceComposer.querySelector("[data-cancel-voice]").addEventListener("click", () => { voiceCancelled = true; finishRecording(); });
    voiceComposer.querySelector("[data-rerecord-voice]").addEventListener("click", startRecording);
    voiceComposer.querySelector("[data-discard-voice]").addEventListener("click", () => resetVoiceDraft("Voice note discarded. Nothing was uploaded."));
    voiceComposer.querySelector("[data-voice-speed]").addEventListener("change", event => { voiceAudio.playbackRate = Number(event.target.value); });
    testMic.addEventListener("click", async () => { if (!navigator.mediaDevices?.getUserMedia) return fail(new Error("Microphone testing is not supported by this browser.")); recordVoice.disabled = testMic.disabled = true; setVoiceStatus("Listening for 3 seconds… speak normally.", "testing"); try { voiceTestStream = await navigator.mediaDevices.getUserMedia(microphoneConstraints()); const selectedId = voiceTestStream.getAudioTracks()[0]?.getSettings?.().deviceId || ""; await listMicrophones(selectedId).catch(() => {}); voiceLive.hidden = false; voiceTimerOutput.textContent = "MIC TEST"; stopMeter = startVoiceMeter(voiceTestStream); voiceTestTimer = setTimeout(() => { if (!voiceTestStream || !active) return; stopTracks(); voiceLive.hidden = true; recordVoice.disabled = testMic.disabled = false; setVoiceStatus("Microphone is responding. You can record now.", "ready"); },3000); } catch (error) { stopTracks(); recordVoice.disabled = testMic.disabled = false; setVoiceStatus(microphoneError(error), "error"); } });
    const draftKey = `cx-review-draft:${projectId}:${assetId}`;
    try { form.elements.body.value = sessionStorage.getItem(draftKey) || ""; } catch {}
    form.elements.body.addEventListener("input", () => { try { const value = form.elements.body.value; value ? sessionStorage.setItem(draftKey,value) : sessionStorage.removeItem(draftKey); } catch {} });
    let rangeEnd = null, visibleBulkIds = [], visibleBulkStatus = "completed";
    const capture = () => { const media = primarySlot.querySelector("video,audio"); if (media) { media.pause(); pinnedTime = Math.min(86400, Math.floor(media.currentTime || 0)); rangeEnd = null; dialog.querySelector("[data-pinned-time]").textContent = timecode(pinnedTime); dialog.querySelector("[data-range-label]").hidden = true; } };
    const renderNotes = () => {
      const versionComments = commentsForVersion(comments, selected);
      const filtered = filterComments(versionComments, { query:dialog.querySelector("[data-note-search]").value, status:dialog.querySelector("[data-note-status]").value, sort:dialog.querySelector("[data-note-sort]").value });
      dialog.querySelector("[data-room-notes]").innerHTML = filtered.length ? filtered.map(comment => reviewCommentMarkup(comment, canManage)).join("") : '<p class="sx-note-empty">No matching feedback for this version.</p>';
      dialog.querySelector("[data-note-count]").textContent = versionComments.length;
      const summary = reviewSummary(versionComments);
      dialog.querySelector("[data-feedback-progress]").textContent = `${summary.complete} of ${summary.total} notes completed · ${summary.open} open`;
      dialog.querySelector("progress").value = summary.percent;
      dialog.querySelectorAll("[data-open-note-prev],[data-open-note-next]").forEach(button => { button.disabled = summary.open === 0; });
      const bulk = dialog.querySelector("[data-bulk-comments]");
      if (bulk) {
        visibleBulkStatus = dialog.querySelector("[data-note-status]").value === "complete" ? "open" : "completed";
        visibleBulkIds = filtered.filter(comment => visibleBulkStatus === "open" ? isComplete(comment) : !isComplete(comment)).map(comment => comment.id);
        bulk.disabled = visibleBulkIds.length === 0;
        bulk.textContent = `${visibleBulkStatus === "open" ? "Reopen" : "Complete"} ${visibleBulkIds.length} visible note${visibleBulkIds.length === 1 ? "" : "s"}`;
      }
      renderDecision();
    };
    const renderDecision = () => {
      const versionDecisions = decisions.filter(item => item.file_id === selected.id).sort((a,b) => Number(b.created_at) - Number(a.created_at));
      const latest = versionDecisions[0];
      const openCount = commentsForVersion(comments, selected).filter(comment => !isComplete(comment)).length;
      const status = dialog.querySelector("[data-decision-status]"), byline = dialog.querySelector("[data-decision-by]"), historyList = dialog.querySelector("[data-decision-history]");
      const newerFeedback = latest && commentsForVersion(comments, selected).some(comment => !isComplete(comment) && Number(comment.created_at) > Number(latest.created_at));
      status.className = latest?.decision === "approved" && !newerFeedback ? "is-approved" : latest?.decision === "changes_requested" || newerFeedback ? "is-changes" : "";
      status.textContent = latest?.decision === "approved" && !newerFeedback ? "Approved" : latest?.decision === "changes_requested" || newerFeedback ? "Changes requested" : "Not decided";
      byline.textContent = latest ? `${latest.actor_name || "Reviewer"} · ${new Date(Number(latest.created_at)).toLocaleString()}${newerFeedback ? " · newer feedback added" : ""}` : "Choose when this cut is ready.";
      const approve = dialog.querySelector('[data-version-decision="approved"]');
      approve.disabled = openCount > 0;
      approve.title = openCount ? `Complete ${openCount} open note${openCount === 1 ? "" : "s"} before approval` : "Record final approval for this version";
      historyList.innerHTML = versionDecisions.length ? versionDecisions.map(item => `<article><span class="${item.decision === "approved" ? "approved" : "changes"}">${item.decision === "approved" ? "Approved" : "Changes requested"}</span><div><b>${esc(item.actor_name || "Reviewer")}</b><small>${esc(new Date(Number(item.created_at)).toLocaleString())}</small>${item.note ? `<p>${esc(item.note)}</p>` : ""}</div></article>`).join("") : `<p>No decision has been recorded for this version.</p>`;
    };
    const currentMedia = () => primarySlot.querySelector("video,audio");
    const openNotes = () => commentsForVersion(comments, selected).filter(comment => !isComplete(comment)).sort((a,b) => Number(a.timestamp_seconds ?? Infinity) - Number(b.timestamp_seconds ?? Infinity));
    const jumpOpenNote = direction => {
      const notes = openNotes(); if (!notes.length) return fail(new Error("This version has no open feedback."));
      openNoteIndex = (openNoteIndex + direction + notes.length) % notes.length;
      const note = notes[openNoteIndex]; dialog.querySelector("[data-note-search]").value = ""; dialog.querySelector("[data-note-status]").value = "open"; dialog.querySelector("[data-note-sort]").value = "time"; renderNotes();
      if (hasTimestamp(note.timestamp_seconds)) { const media = currentMedia(); if (media && Number.isFinite(media.duration)) { media.pause(); media.currentTime = Math.min(Number(note.timestamp_seconds),Math.max(0,media.duration - .01)); capture(); } }
      const card = dialog.querySelector(`[data-note-id="${CSS.escape(String(note.id))}"]`); card?.scrollIntoView({ behavior:"smooth", block:"center" }); card?.classList.add("is-current"); setTimeout(() => card?.classList.remove("is-current"),900);
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
      else { media.controls = true; media.preload = "metadata"; media.playsInline = true; media.muted = secondary; media.playbackRate = Number(dialog.querySelector("[data-playback-rate]")?.value || 1); }
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
      pinnedTime = 0; rangeEnd = null; dialog.querySelector("[data-pinned-time]").textContent = "00:00"; dialog.querySelector("[data-range-label]").hidden = true; dialog.querySelector("[data-range-end]").disabled = !timed; dialog.querySelector("[data-capture-frame]").disabled = !String(selected.content_type || "").startsWith("video/");
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
    dialog.querySelectorAll("[data-version-decision]").forEach(button => button.addEventListener("click", async () => {
      const actorName = form.elements.authorName.value.trim(), actorEmail = form.elements.authorEmail.value.trim();
      if (!canManage && actorName.length < 2) { form.elements.authorName.focus(); return fail(new Error("Enter your name in the feedback panel before recording a decision.")); }
      const controls = [...dialog.querySelectorAll("[data-version-decision]")]; controls.forEach(control => { control.disabled = true; });
      errorBox.hidden = true;
      try {
        const result = await api("/api/uploads", { method:"POST", headers:headers(true), body:JSON.stringify({ action:"version-decision", projectId, assetId:selected.asset_id || assetId, fileId:selected.id, decision:button.dataset.versionDecision, note:dialog.querySelector("[data-decision-note]").value, actorName, actorEmail }) });
        const saved = result.decision;
        decisions.unshift({ id:saved.id, project_id:projectId, asset_id:saved.assetId, file_id:saved.fileId, decision:saved.decision, note:saved.note, actor_name:saved.actorName, actor_email:saved.actorEmail, created_at:saved.createdAt });
        dialog.querySelector("[data-decision-note]").value = ""; changed = true; renderDecision();
      } catch (error) { fail(error); renderDecision(); }
      finally { controls.forEach(control => { if (control.isConnected && control.dataset.versionDecision !== "approved") control.disabled = false; }); }
    }));
    dialog.querySelector("[data-capture-time]").addEventListener("click", capture);
    dialog.querySelector("[data-range-end]").addEventListener("click", () => { const media = currentMedia(); if (!media || !Number.isFinite(media.duration)) return fail(new Error("A time range is available for video and audio only.")); media.pause(); const end = Math.min(86400,Math.floor(media.currentTime || 0)); if (end <= pinnedTime) return fail(new Error("Move the playhead after the range start, then set the end.")); rangeEnd = end; const output = dialog.querySelector("[data-range-label]"); output.textContent = `${timecode(pinnedTime)}–${timecode(rangeEnd)}`; output.hidden = false; });
    primarySlot.addEventListener("click", event => { const media = event.target.closest("video"); if (media) media.paused ? media.play().catch(() => {}) : media.pause(); });
    dialog.querySelector("[data-quote-selection]").addEventListener("click", () => { const text = String(window.getSelection?.() || "").trim().slice(0,600); if (!text) return fail(new Error("Select text in the script preview first.")); form.elements.body.value = `${form.elements.body.value ? `${form.elements.body.value}\n\n` : ""}> ${text.replace(/\n+/g,"\n> ")}\n`; form.elements.body.focus(); });
    form.elements.body.addEventListener("focus", () => { if (rangeEnd === null) capture(); });
    ["[data-note-search]", "[data-note-status]", "[data-note-sort]"].forEach(selector => dialog.querySelector(selector).addEventListener(selector.includes("search") ? "input" : "change", renderNotes));
    dialog.querySelector("[data-bulk-comments]")?.addEventListener("click", async event => {
      const ids = [...visibleBulkIds], status = visibleBulkStatus;
      if (!ids.length || !confirm(`${status === "completed" ? "Complete" : "Reopen"} ${ids.length} visible note${ids.length === 1 ? "" : "s"}?`)) return;
      const button = event.currentTarget; button.disabled = true; button.textContent = "Updating…";
      try {
        await api("/api/uploads", { method:"PATCH", headers:headers(true), body:JSON.stringify({ action:"bulk-comment-status", projectId, fileId:selected.id, commentIds:ids, status }) });
        comments.forEach(comment => { if (ids.includes(comment.id)) comment.status = status; }); changed = true; renderNotes();
      } catch (error) { fail(error); if (button.isConnected) { button.disabled = false; button.textContent = "Try again"; } }
    });
    dialog.querySelector("[data-open-note-prev]").addEventListener("click", () => jumpOpenNote(-1));
    dialog.querySelector("[data-open-note-next]").addEventListener("click", () => jumpOpenNote(1));
    dialog.querySelector("[data-playback-rate]").addEventListener("change", event => { dialog.querySelectorAll(".sx-media-grid video,.sx-media-grid audio").forEach(media => { media.playbackRate = Number(event.target.value); }); });
    dialog.querySelector("[data-review-help]").addEventListener("click", event => { const panel = dialog.querySelector("[data-shortcuts]"); panel.hidden = !panel.hidden; event.currentTarget.setAttribute("aria-expanded", String(!panel.hidden)); });
    dialog.querySelector("[data-fullscreen]").addEventListener("click", () => { if (!primarySlot.requestFullscreen) return fail(new Error("Fullscreen is not supported in this browser.")); primarySlot.requestFullscreen().catch(() => fail(new Error("Fullscreen could not be opened."))); });
    dialog.querySelector("[data-pip]").addEventListener("click", async () => { const media = currentMedia(); if (!(media instanceof HTMLVideoElement) || !document.pictureInPictureEnabled || !media.requestPictureInPicture) return fail(new Error("Picture in picture is available for supported videos only.")); try { if (document.pictureInPictureElement) await document.exitPictureInPicture(); else await media.requestPictureInPicture(); } catch { fail(new Error("Picture in picture could not be opened.")); } });
    dialog.querySelector("[data-capture-frame]").addEventListener("click", async event => {
      const video = currentMedia();
      if (!(video instanceof HTMLVideoElement) || video.readyState < 2 || !video.videoWidth) return fail(new Error("Wait for a video frame to load before capturing it."));
      const button = event.currentTarget; button.disabled = true; button.textContent = "Capturing…";
      try {
        const scale = Math.min(1, 1920 / video.videoWidth), canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale)); canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        canvas.getContext("2d", { alpha:false }).drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise((resolve,reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("This frame could not be encoded.")), "image/png"));
        const url = URL.createObjectURL(blob), link = document.createElement("a"), base = selected.original_name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi,"-").slice(0,80) || "frame";
        link.href = url; link.download = `${base}-v${selected.version_number}-${timecode(video.currentTime).replace(":","-")}.png`; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
      } catch (error) { fail(error); }
      finally { if (button.isConnected) { button.disabled = false; button.textContent = "Capture frame"; } }
    });
    dialog.querySelector("[data-room-notes]").addEventListener("click", async event => {
      const replyButton = event.target.closest("[data-reply-note]");
      if (replyButton) { form.elements.parentCommentId.value = replyButton.dataset.replyNote; const target = form.querySelector("[data-reply-target]"); target.querySelector("span").textContent = `Replying to ${comments.find(item => item.id === replyButton.dataset.replyNote)?.author_name || "this note"}`; target.hidden = false; form.elements.body.focus(); return; }
      const workflowButton = event.target.closest("[data-save-workflow]");
      if (workflowButton && canManage) {
        const card = workflowButton.closest("[data-note-id]"), comment = comments.find(item => item.id === workflowButton.dataset.saveWorkflow); if (!card || !comment) return;
        const due = card.querySelector("[data-workflow-due]").value, dueAt = due ? Date.parse(`${due}T23:59:59`) : null;
        workflowButton.disabled = true; workflowButton.textContent = "Saving…";
        try { const result = await api("/api/uploads", { method:"PATCH", headers:headers(true), body:JSON.stringify({ action:"comment-workflow", projectId, commentId:comment.id, status:card.querySelector("[data-workflow-status]").value, priority:card.querySelector("[data-workflow-priority]").value, assignee:card.querySelector("[data-workflow-assignee]").value, dueAt, visibility:card.querySelector("[data-workflow-visibility]").value }) }); Object.assign(comment,{ status:result.status, priority:result.priority, assignee:result.assignee, due_at:result.dueAt, visibility:result.visibility }); changed = true; if (active) renderNotes(); }
        catch (error) { fail(error); if (workflowButton.isConnected) { workflowButton.disabled = false; workflowButton.textContent = "Save"; } }
        return;
      }
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
    form.querySelector("[data-cancel-reply]").addEventListener("click", () => { form.elements.parentCommentId.value = ""; form.querySelector("[data-reply-target]").hidden = true; });
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const version = selected, timestampSeconds = attachTime.checked && !attachTime.disabled ? pinnedTime : null;
      const page = Number(dialog.querySelector("[data-document-page]").value || 0); if (version.content_type === "application/pdf" && page > 0 && !/^Page \d+ —/.test(form.elements.body.value)) form.elements.body.value = `Page ${page} — ${form.elements.body.value}`;
      const button = form.querySelector('[type="submit"]'), alert = form.querySelector('[role="alert"]');
      button.disabled = true; alert.hidden = true;
      try {
        let voiceNoteId = uploadedVoiceNoteId;
        if (voiceBlob && !voiceNoteId) { if (voiceBlob.size > 1_250_000) throw new Error("Voice note is too large. Keep it under 60 seconds."); setVoiceStatus("Uploading voice note securely…", "uploading"); const dataUrl = await new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(voiceBlob); }); const savedVoice = await api("/api/uploads", { method:"POST", headers:headers(true), body:JSON.stringify({ action:"create-comment-voice", projectId, dataUrl, durationSeconds:voiceDuration }) }); uploadedVoiceNoteId = voiceNoteId = savedVoice.voiceNoteId; setVoiceStatus("Voice note uploaded securely. Adding it to your feedback…", "uploading"); }
        const values = Object.fromEntries(new FormData(form));
        const dueAt = values.dueDate ? Date.parse(`${values.dueDate}T23:59:59`) : null;
        const result = await api("/api/uploads", { method:"POST", headers:headers(true), body:JSON.stringify({ action:"create-comment", projectId, fileId:version.id, assetId:version.asset_id || assetId, voiceNoteId, timestampSeconds, rangeEndSeconds:rangeEnd, ...values, dueAt }) });
        changed = true;
        const saved = result.comment;
        comments.unshift({ id:saved.id, file_id:version.id, asset_id:version.asset_id || assetId, voice_note_id:saved.voiceNoteId, author_name:saved.authorName, body:saved.body, timestamp_seconds:saved.timestampSeconds, range_end_seconds:saved.rangeEndSeconds, priority:saved.priority, assignee:saved.assignee, due_at:saved.dueAt, visibility:saved.visibility, parent_comment_id:saved.parentCommentId, status:saved.status, created_at:saved.createdAt });
        if (active) { form.elements.body.value = ""; form.elements.parentCommentId.value = ""; form.querySelector("[data-reply-target]").hidden = true; if (form.elements.priority) form.elements.priority.value = "normal"; if (form.elements.assignee) form.elements.assignee.value = ""; if (form.elements.dueDate) form.elements.dueDate.value = ""; if (form.elements.visibility) form.elements.visibility.value = "project"; rangeEnd = null; dialog.querySelector("[data-range-label]").hidden = true; try { sessionStorage.removeItem(draftKey); } catch {} resetVoiceDraft(); renderNotes(); }
      } catch (error) { if (active) { alert.textContent = error.message; alert.hidden = false; if (voiceBlob) setVoiceStatus(uploadedVoiceNoteId ? "Your voice note is saved securely. Send feedback again to finish attaching it." : "Upload interrupted. Your recording is still here—send again to retry.", "error"); } }
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
    dialog.addEventListener("keydown", event => {
      if (event.target.closest("input,textarea,select,button")) return;
      const media = currentMedia(), key = event.key.toLowerCase();
      if (event.code === "Space" && media) { event.preventDefault(); media.paused ? media.play().catch(() => {}) : media.pause(); }
      else if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && media && Number.isFinite(media.duration)) { event.preventDefault(); media.pause(); media.currentTime = Math.max(0,Math.min(media.duration,media.currentTime + (event.key === "ArrowRight" ? 5 : -5))); capture(); }
      else if ((event.key === "," || event.key === ".") && media && Number.isFinite(media.duration)) { event.preventDefault(); media.pause(); media.currentTime = Math.max(0,Math.min(media.duration,media.currentTime + (event.key === "." ? 1/30 : -1/30))); capture(); }
      else if (key === "j") { event.preventDefault(); jumpOpenNote(-1); }
      else if (key === "k") { event.preventDefault(); jumpOpenNote(1); }
      else if (key === "m" && media) { event.preventDefault(); media.muted = !media.muted; }
      else if (key === "f") { event.preventDefault(); dialog.querySelector("[data-fullscreen]").click(); }
    });
    choose();
    lifecycle.signal.addEventListener("abort", () => { voiceCancelled = true; finishRecording(); stopTracks(); clearVoiceUrl(); }, { once:true });
  } catch (error) { if (active && dialog.isConnected) { const target = dialog.querySelector(".sx-room-loading") || dialog.querySelector("[data-room-error]"); if (target) { target.textContent = error.message; target.hidden = false; } } }
}
