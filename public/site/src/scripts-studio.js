// Content X Script Writing Studio — Notion & Docs-style collaborative scriptwriter
// Features: Scene/Shot headings, formatting, color highlights, production cues, live teleprompter duration, multi-script manager, project-asset linking, video previews, and Publish to Website showcase

const SCRIPTS_KEY_PREFIX = "cx_scripts_";

function getStorageScripts(projectId) {
  try {
    const raw = localStorage.getItem(`${SCRIPTS_KEY_PREFIX}${projectId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map(s => ({
          ...s,
          attachedAssets: Array.isArray(s.attachedAssets) ? s.attachedAssets : [],
          videoLinks: Array.isArray(s.videoLinks) ? s.videoLinks : [],
          published: Boolean(s.published),
          publishedAt: s.publishedAt || null
        }));
      }
    }
  } catch {}
  return defaultStarterScripts(projectId);
}

function saveStorageScripts(projectId, scripts) {
  try {
    localStorage.setItem(`${SCRIPTS_KEY_PREFIX}${projectId}`, JSON.stringify(scripts));
  } catch {}
}

function defaultStarterScripts(projectId) {
  const now = Date.now();
  return [
    {
      id: `script_${projectId}_1`,
      projectId,
      folderId: "",
      title: "Launch Reel 01 — 3-Second Hook & Retention Curve",
      status: "Review",
      attachedAssets: [],
      videoLinks: [
        {
          id: "vl_demo",
          title: "Rough Cut Draft — Vertical 9:16",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          platform: "YouTube"
        }
      ],
      published: true,
      publishedAt: now - 3600000,
      content: `<h1>Scene 1 · The Scroll-Stopping Hook</h1>
<p><span class="cx-cue cue-vo">[VO]</span> Most creators edit videos like it's 2020. <mark class="cx-hl-orange">Here is why that is killing your retention in the first 3 seconds.</mark></p>
<p><span class="cx-cue cue-broll">[B-ROLL]</span> Rapid fast-cut timeline montage of swipe-aways on mobile feed with motion blur whip pan.</p>
<p><span class="cx-cue cue-sfx">[SFX]</span> Sharp vinyl record stop + sub-bass drop impact.</p>

<h2>Shot 2 · The Pattern Disruption</h2>
<p><span class="cx-cue cue-talent">[TALENT]</span> If you don't establish a pattern interrupt in frame 1, over 70% of viewers scroll before you even finish your first sentence.</p>
<p><span class="cx-cue cue-graphic">[GRAPHIC]</span> Kinetic bold typography: <strong>"70% DROP-OFF IN 3 SECONDS"</strong> with flame highlight accent.</p>

<h1>Scene 2 · The Solution Framework</h1>
<p><span class="cx-cue cue-vo">[VO]</span> Watch how changing the opening cut transforms an average retention curve into a <mark class="cx-hl-green">65% complete watch-through</mark>.</p>
<p><span class="cx-cue cue-broll">[B-ROLL]</span> Side-by-side split screen showing retention graph analytics and timeline cuts.</p>
<p><span class="cx-cue cue-sfx">[SFX]</span> Clean digital interface riser swell into chime.</p>

<h2>Shot 3 · The CTA & Closing Beat</h2>
<p><span class="cx-cue cue-talent">[TALENT]</span> Drop a comment with your niche below, and our team will build your custom 3-second hook framework.</p>`,
      createdAt: now - 86400000,
      updatedAt: now - 3600000,
    },
    {
      id: `script_${projectId}_2`,
      projectId,
      folderId: "",
      title: "Product Teaser — Behind The Scenes Cut",
      status: "Draft",
      attachedAssets: [],
      videoLinks: [],
      published: false,
      publishedAt: null,
      content: `<h1>Scene 1 · Studio Atmosphere</h1>
<p><span class="cx-cue cue-broll">[B-ROLL]</span> Macro close-up of high-speed camera gimbal setup, ambient studio lighting turning orange.</p>
<p><span class="cx-cue cue-vo">[VO]</span> What does it actually take to produce high-impact short-form videos every single day without burning out?</p>
<p><span class="cx-cue cue-sfx">[SFX]</span> Ambient studio tone + low frequency drone.</p>

<h2>Shot 2 · Workflow Breakdown</h2>
<p><span class="cx-cue cue-talent">[TALENT]</span> You don't need more hours. You need an editing pipeline that takes raw footage and turns it into publish-ready retention cuts in 48 hours.</p>`,
      createdAt: now - 172800000,
      updatedAt: now - 7200000,
    }
  ];
}

function calculateSpeechMetrics(text) {
  const clean = text.replace(/\[[A-Z-]+\]/g, "").replace(/\s+/g, " ").trim();
  const words = clean ? clean.split(/\s+/).length : 0;
  const chars = clean.length;
  // Standard conversational teleprompter speaking rate: ~135 words per minute
  const totalSeconds = Math.round((words / 135) * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const durationFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return { words, chars, totalSeconds, durationFormatted };
}

function detectVideoPlatform(url) {
  const u = String(url || "").toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "YouTube";
  if (u.includes("vimeo.com")) return "Vimeo";
  if (u.includes("loom.com")) return "Loom";
  if (u.includes("drive.google.com")) return "Google Drive";
  if (u.includes("frame.io")) return "Frame.io";
  if (/\.(mp4|mov|webm|m4v)($|\?)/.test(u)) return "Direct MP4";
  return "Web Video";
}

function getVideoEmbedUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube-nocookie.com/embed/${v}`;
    }
    if (u.hostname.includes("youtu.be")) {
      const v = u.pathname.slice(1);
      if (v) return `https://www.youtube-nocookie.com/embed/${v}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const v = u.pathname.split("/").filter(Boolean).pop();
      if (v && /^\d+$/.test(v)) return `https://player.vimeo.com/video/${v}`;
    }
    if (u.hostname.includes("loom.com")) {
      const v = u.pathname.split("/").filter(Boolean).pop();
      if (v) return `https://www.loom.com/embed/${v}`;
    }
  } catch {}
  return null;
}

function htmlToMarkdown(html) {
  const container = document.createElement("div");
  container.innerHTML = html;
  let md = "";
  for (const node of container.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      md += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      const text = node.textContent;
      if (tag === "h1") md += `\n\n# ${text}\n\n`;
      else if (tag === "h2") md += `\n\n## ${text}\n\n`;
      else if (tag === "h3") md += `\n\n### ${text}\n\n`;
      else if (tag === "p") md += `${node.innerText || text}\n\n`;
      else if (tag === "blockquote") md += `> ${text}\n\n`;
      else md += `${text}\n`;
    }
  }
  return md.trim();
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(1)} GB`;
  if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  if (value >= 1024) return `${Math.round(value / 1024)} KB`;
  return `${value} B`;
}

export function openScriptStudioModal(root, initialProject, folders = [], actions = {}, files = [], allProjects = []) {
  let activeProject = initialProject || (allProjects && allProjects.length ? {
    id: allProjects[0].project_id || allProjects[0].id,
    name: allProjects[0].name,
    clientName: allProjects[0].clientName
  } : { id: "default_project", name: "Default Project" });

  let projectId = activeProject.id || activeProject.project_id;
  const availableProjects = (allProjects && allProjects.length) ? allProjects : [
    { project_id: projectId, name: activeProject.name || "Default Project" }
  ];

  let scripts = getStorageScripts(projectId);
  let activeScriptId = scripts[0]?.id || null;

  const layer = document.createElement("div");
  layer.className = "workspace-modal-backdrop script-studio-layer";
  layer.innerHTML = `
    <section class="script-studio-modal" aria-labelledby="studio-script-title">
      <header class="script-studio-header">
        <div class="script-studio-title-group">
          <span class="script-studio-badge">NOTION STUDIO · CONTENT X</span>
          <h2 id="studio-script-title">Script Writing & Teleprompter Studio</h2>
          <small>Linked Project: <b class="script-active-proj-name">${escapeHTML(activeProject.name)}</b> · Scene breakdown, production cues, live teleprompter & video attachments</small>
        </div>
        <div class="script-studio-head-actions">
          <button type="button" class="script-publish-toggle" data-toggle-publish title="Publish script and cut to website showcase">Publish to Website</button>
          <button type="button" class="workspace-button subtle script-showcase-btn" data-preview-showcase title="Preview live public showcase">Preview Showcase</button>
          <button type="button" class="workspace-button subtle script-showcase-btn" data-copy-showcase-link title="Copy public showcase link">Copy Link</button>
          <button type="button" class="workspace-button subtle" data-export-md title="Download as Markdown">Export .md</button>
          <button type="button" class="workspace-button subtle" data-export-txt title="Download Plain Text">Export .txt</button>
          <button type="button" class="workspace-button" data-copy-script title="Copy Script to Clipboard">Copy to Clipboard</button>
          <button type="button" class="script-studio-close" data-close-studio aria-label="Close">×</button>
        </div>
      </header>

      <div class="script-studio-body">
        <!-- Sidebar Script Browser -->
        <aside class="script-studio-sidebar">
          <div class="script-studio-sidebar-header">
            <strong>Scripts (<span data-scripts-count>${scripts.length}</span>)</strong>
            <button type="button" class="script-new-btn" data-new-script title="Create new script">＋ New</button>
          </div>
          <div class="script-studio-list" data-script-list></div>
        </aside>

        <!-- Main Notion/Docs Editor Surface -->
        <main class="script-studio-main">
          <div class="script-meta-bar">
            <div class="script-meta-left">
              <input type="text" class="script-title-input" data-script-title placeholder="Untitled Script" value="">
              <div class="script-project-wrap">
                <label>Project:</label>
                <select class="script-project-select" data-script-project title="Link script to project">
                  ${availableProjects.map(p => {
                    const pid = p.project_id || p.id;
                    return `<option value="${escapeHTML(pid)}" ${pid === projectId ? "selected" : ""}>${escapeHTML(p.name)}</option>`;
                  }).join("")}
                </select>
              </div>
              <div class="script-status-dropdown-wrap">
                <label>Status:</label>
                <select class="script-status-select" data-script-status>
                  <option value="Draft">Draft</option>
                  <option value="Review">In Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Recording">Recording</option>
                </select>
              </div>
              <div class="script-folder-wrap">
                <label>Folder:</label>
                <select class="script-folder-select" data-script-folder>
                  <option value="">Project root</option>
                  ${folders.map(f => `<option value="${escapeHTML(f.id)}">${escapeHTML(f.name)}</option>`).join("")}
                </select>
              </div>
            </div>
            <div class="script-save-indicator" data-save-status>Saved ✓</div>
          </div>

          <!-- Formatting & Production Cue Toolbar -->
          <div class="script-editor-toolbar" role="toolbar" aria-label="Script formatting toolbar">
            <div class="toolbar-group">
              <button type="button" data-cmd="formatBlock" data-val="H1" title="Scene Heading (H1)"><b>H1</b> Scene</button>
              <button type="button" data-cmd="formatBlock" data-val="H2" title="Shot/Beat Heading (H2)"><b>H2</b> Shot</button>
              <button type="button" data-cmd="formatBlock" data-val="P" title="Normal Paragraph">¶ Text</button>
            </div>

            <div class="toolbar-sep"></div>

            <div class="toolbar-group">
              <button type="button" data-cmd="bold" title="Bold (Ctrl+B)"><b>B</b></button>
              <button type="button" data-cmd="italic" title="Italic (Ctrl+I)"><i>I</i></button>
              <button type="button" data-cmd="underline" title="Underline (Ctrl+U)"><u>U</u></button>
              <button type="button" data-cmd="strikeThrough" title="Strikethrough"><s>S</s></button>
            </div>

            <div class="toolbar-sep"></div>

            <div class="toolbar-group toolbar-highlights">
              <span class="toolbar-label">Highlight:</span>
              <button type="button" class="hl-btn hl-orange" data-highlight="orange" title="Content X Orange Highlight"></button>
              <button type="button" class="hl-btn hl-yellow" data-highlight="yellow" title="Studio Yellow Highlight"></button>
              <button type="button" class="hl-btn hl-green" data-highlight="green" title="Emerald Green Highlight"></button>
              <button type="button" class="hl-btn hl-cyan" data-highlight="cyan" title="Sky Cyan Highlight"></button>
              <button type="button" class="hl-btn hl-purple" data-highlight="purple" title="Electric Purple Highlight"></button>
              <button type="button" class="hl-btn hl-clear" data-highlight="clear" title="Remove Highlight">✕</button>
            </div>

            <div class="toolbar-sep"></div>

            <div class="toolbar-group toolbar-cues">
              <span class="toolbar-label">Insert Cue:</span>
              <button type="button" class="cue-btn cue-vo" data-insert-cue="VO" title="Insert Voiceover cue">[VO]</button>
              <button type="button" class="cue-btn cue-broll" data-insert-cue="B-ROLL" title="Insert B-Roll cutaway cue">[B-ROLL]</button>
              <button type="button" class="cue-btn cue-talent" data-insert-cue="TALENT" title="Insert On-camera talent cue">[TALENT]</button>
              <button type="button" class="cue-btn cue-sfx" data-insert-cue="SFX" title="Insert Sound Effects cue">[SFX]</button>
              <button type="button" class="cue-btn cue-graphic" data-insert-cue="GRAPHIC" title="Insert Graphic/Callout cue">[GRAPHIC]</button>
            </div>
          </div>

          <!-- Attached Video & Project Assets Panel -->
          <div class="script-attachments-panel">
            <div class="script-attachments-head">
              <div class="attachments-label-group">
                <span class="attachments-icon"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg></span>
                <strong>Attached Video Cuts & Project Assets</strong>
                <small data-attached-count>(0 items)</small>
              </div>
              <div class="attachments-inputs-group">
                ${files && files.length ? `
                  <select class="script-attach-select" data-select-project-file>
                    <option value="">＋ Attach project file...</option>
                    ${files.map(f => `<option value="${escapeHTML(f.id)}" data-file-name="${escapeHTML(f.name)}" data-file-size="${f.size || 0}" data-file-type="${escapeHTML(f.type || "")}">${escapeHTML(f.name)} (${formatBytes(f.size || 0)})</option>`).join("")}
                  </select>
                  <button type="button" class="script-attach-btn" data-attach-file-btn>Attach File</button>
                ` : ""}
                <input type="url" class="script-video-url-input" data-video-url-input placeholder="Paste YouTube, Vimeo, Loom, or Drive link…">
                <button type="button" class="script-attach-btn" data-add-url-btn>Add Link</button>
              </div>
            </div>
            <div class="script-attachments-chips" data-attachments-chips></div>
          </div>

          <!-- Document Content Editable Area -->
          <div class="script-editor-container">
            <div class="script-editor-content" contenteditable="true" spellcheck="true" role="textbox" aria-multiline="true" data-editor-surface placeholder="Type your scene breakdown, hooks, and dialogue here…"></div>
          </div>

          <!-- Live Teleprompter Duration & Metrics Footer -->
          <footer class="script-teleprompter-footer">
            <div class="teleprompter-timer">
              <span class="teleprompter-icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M10 2h4"/><path d="m18 6 1.5-1.5"/></svg></span>
              <strong data-speech-duration>00:00</strong>
              <small>Est. speaking duration (~135 WPM teleprompter standard)</small>
            </div>
            <div class="teleprompter-stats">
              <span data-word-count>0 words</span>
              <span class="teleprompter-dot">·</span>
              <span data-char-count>0 characters</span>
            </div>
          </footer>
        </main>
      </div>
    </section>
  `;

  document.body.append(layer);

  // Element selections
  const scriptList = layer.querySelector("[data-script-list]");
  const editorSurface = layer.querySelector("[data-editor-surface]");
  const titleInput = layer.querySelector("[data-script-title]");
  const statusSelect = layer.querySelector("[data-script-status]");
  const folderSelect = layer.querySelector("[data-script-folder]");
  const projectSelect = layer.querySelector("[data-script-project]");
  const saveIndicator = layer.querySelector("[data-save-status]");
  const speechDuration = layer.querySelector("[data-speech-duration]");
  const wordCountEl = layer.querySelector("[data-word-count]");
  const charCountEl = layer.querySelector("[data-char-count]");
  const publishToggle = layer.querySelector("[data-toggle-publish]");
  const previewShowcaseBtn = layer.querySelector("[data-preview-showcase]");
  const copyShowcaseBtn = layer.querySelector("[data-copy-showcase-link]");
  const attachmentsChips = layer.querySelector("[data-attachments-chips]");
  const attachedCount = layer.querySelector("[data-attached-count]");
  const selectProjectFile = layer.querySelector("[data-select-project-file]");
  const attachFileBtn = layer.querySelector("[data-attach-file-btn]");
  const videoUrlInput = layer.querySelector("[data-video-url-input]");
  const addUrlBtn = layer.querySelector("[data-add-url-btn]");
  const scriptsCountSpan = layer.querySelector("[data-scripts-count]");

  const close = () => {
    layer.remove();
    if (actions.refreshRoute) actions.refreshRoute();
  };

  layer.querySelector("[data-close-studio]").addEventListener("click", close);
  layer.addEventListener("click", event => {
    if (event.target === layer) close();
  });

  let saveTimer = null;
  function triggerAutoSave() {
    clearTimeout(saveTimer);
    saveIndicator.textContent = "Saving…";
    saveIndicator.classList.add("saving");
    saveTimer = setTimeout(() => {
      const active = scripts.find(s => s.id === activeScriptId);
      if (active) {
        active.title = titleInput.value.trim() || "Untitled Script";
        active.content = editorSurface.innerHTML;
        active.status = statusSelect.value;
        active.folderId = folderSelect.value;
        active.updatedAt = Date.now();
        saveStorageScripts(projectId, scripts);
        renderScriptList();
      }
      saveIndicator.textContent = "Saved ✓";
      saveIndicator.classList.remove("saving");
    }, 450);
  }

  function updateMetrics() {
    const text = editorSurface.innerText || "";
    const metrics = calculateSpeechMetrics(text);
    speechDuration.textContent = metrics.durationFormatted;
    wordCountEl.textContent = `${metrics.words} word${metrics.words === 1 ? "" : "s"}`;
    charCountEl.textContent = `${metrics.chars} character${metrics.chars === 1 ? "" : "s"}`;
  }

  function renderAttachments(script) {
    if (!script) return;
    const attached = script.attachedAssets || [];
    const links = script.videoLinks || [];
    const total = attached.length + links.length;
    attachedCount.textContent = `(${total} item${total === 1 ? "" : "s"})`;

    if (total === 0) {
      attachmentsChips.innerHTML = `<p class="attachments-empty-hint">No video cut or asset attached yet. Select a project file or paste a video link above to review side-by-side with your script.</p>`;
      return;
    }

    attachmentsChips.innerHTML = [
      ...attached.map(asset => `
        <div class="attachment-chip chip-file" data-chip-id="${escapeHTML(asset.id)}">
          <span class="chip-glyph">Video</span>
          <div class="chip-info">
            <strong title="${escapeHTML(asset.name)}">${escapeHTML(asset.name)}</strong>
            <small>Project Asset · ${formatBytes(asset.size)}</small>
          </div>
          <div class="chip-actions">
            ${asset.url ? `<button type="button" class="chip-action-btn chip-preview" data-preview-file="${escapeHTML(asset.id)}" title="Preview Video">▶ Play</button>` : ""}
            <button type="button" class="chip-action-btn chip-remove" data-remove-asset="${escapeHTML(asset.id)}" title="Remove Attachment">✕</button>
          </div>
        </div>
      `),
      ...links.map(link => `
        <div class="attachment-chip chip-link" data-link-id="${escapeHTML(link.id)}">
          <span class="chip-glyph">Link</span>
          <div class="chip-info">
            <strong title="${escapeHTML(link.title || link.url)}">${escapeHTML(link.title || link.url)}</strong>
            <small>${escapeHTML(link.platform || "Web Video")}</small>
          </div>
          <div class="chip-actions">
            <button type="button" class="chip-action-btn chip-preview" data-preview-link="${escapeHTML(link.id)}" title="Watch / Open">▶ Play</button>
            <button type="button" class="chip-action-btn chip-remove" data-remove-link="${escapeHTML(link.id)}" title="Remove Link">✕</button>
          </div>
        </div>
      `)
    ].join("");

    // Bind chip removals
    attachmentsChips.querySelectorAll("[data-remove-asset]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idToRemove = btn.dataset.removeAsset;
        script.attachedAssets = (script.attachedAssets || []).filter(a => a.id !== idToRemove);
        saveStorageScripts(projectId, scripts);
        renderAttachments(script);
      });
    });

    attachmentsChips.querySelectorAll("[data-remove-link]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idToRemove = btn.dataset.removeLink;
        script.videoLinks = (script.videoLinks || []).filter(l => l.id !== idToRemove);
        saveStorageScripts(projectId, scripts);
        renderAttachments(script);
      });
    });

    // Bind chip previews
    attachmentsChips.querySelectorAll("[data-preview-file]").forEach(btn => {
      btn.addEventListener("click", () => {
        const asset = (script.attachedAssets || []).find(a => a.id === btn.dataset.previewFile);
        if (asset && asset.url) {
          openVideoPreviewModal(asset.name, null, asset.url);
        }
      });
    });

    attachmentsChips.querySelectorAll("[data-preview-link]").forEach(btn => {
      btn.addEventListener("click", () => {
        const link = (script.videoLinks || []).find(l => l.id === btn.dataset.previewLink);
        if (link && link.url) {
          const embed = getVideoEmbedUrl(link.url);
          if (embed) {
            openVideoPreviewModal(link.title || "Video Preview", embed, null);
          } else {
            window.open(link.url, "_blank", "noopener,noreferrer");
          }
        }
      });
    });
  }

  function updatePublishUI(script) {
    if (!script) return;
    const isPub = Boolean(script.published);
    publishToggle.classList.toggle("is-published", isPub);
    publishToggle.textContent = isPub ? "● Published to Website" : "Publish to Website";
    if (previewShowcaseBtn) previewShowcaseBtn.hidden = !isPub;
    if (copyShowcaseBtn) copyShowcaseBtn.hidden = !isPub;
  }

  function loadActiveScript(id) {
    activeScriptId = id;
    const script = scripts.find(s => s.id === id) || scripts[0];
    if (!script) return;
    activeScriptId = script.id;
    titleInput.value = script.title || "";
    statusSelect.value = script.status || "Draft";
    folderSelect.value = script.folderId || "";
    editorSurface.innerHTML = script.content || "<p></p>";
    renderScriptList();
    renderAttachments(script);
    updatePublishUI(script);
    updateMetrics();
  }

  function renderScriptList() {
    if (scriptsCountSpan) scriptsCountSpan.textContent = scripts.length;
    scriptList.innerHTML = scripts.map(s => `
      <article class="script-item ${s.id === activeScriptId ? "active" : ""}" data-script-id="${escapeHTML(s.id)}">
        <div class="script-item-head">
          <span class="script-status-pill status-${s.status.toLowerCase()}">${escapeHTML(s.status)}</span>
          ${s.published ? `<span class="script-item-live-dot" title="Published to website showcase">● LIVE</span>` : ""}
          <button type="button" class="script-item-delete" data-delete-script="${escapeHTML(s.id)}" title="Delete script">×</button>
        </div>
        <strong class="script-item-title">${escapeHTML(s.title || "Untitled Script")}</strong>
        <div class="script-item-meta">
          <small>${calculateSpeechMetrics(s.content.replace(/<[^>]*>/g, "")).durationFormatted} teleprompter</small>
          ${(s.videoLinks?.length || 0) + (s.attachedAssets?.length || 0) > 0 ? `<small class="script-item-has-video">Video attached</small>` : ""}
        </div>
      </article>
    `).join("");

    scriptList.querySelectorAll(".script-item").forEach(item => {
      item.addEventListener("click", e => {
        if (e.target.closest("[data-delete-script]")) return;
        loadActiveScript(item.dataset.scriptId);
      });
    });

    scriptList.querySelectorAll("[data-delete-script]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const idToDelete = btn.dataset.deleteScript;
        if (scripts.length <= 1) {
          alert("A project must keep at least one script draft.");
          return;
        }
        if (!confirm("Delete this script permanently?")) return;
        scripts = scripts.filter(s => s.id !== idToDelete);
        saveStorageScripts(projectId, scripts);
        loadActiveScript(scripts[0]?.id);
      });
    });
  }

  // Create new script
  layer.querySelector("[data-new-script]").addEventListener("click", () => {
    const newScript = {
      id: `script_${projectId}_${Date.now()}`,
      projectId,
      folderId: "",
      title: `New Script ${scripts.length + 1}`,
      status: "Draft",
      attachedAssets: [],
      videoLinks: [],
      published: false,
      publishedAt: null,
      content: `<h1>Scene 1 · Hook</h1>\n<p><span class="cx-cue cue-vo">[VO]</span> Enter your opening hook here...</p>`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    scripts.unshift(newScript);
    saveStorageScripts(projectId, scripts);
    loadActiveScript(newScript.id);
  });

  // Switch / Link Project
  projectSelect?.addEventListener("change", () => {
    const newProjectId = projectSelect.value;
    if (newProjectId === projectId) return;
    const selectedProj = availableProjects.find(p => (p.project_id || p.id) === newProjectId);
    if (!selectedProj) return;

    // Switch active project context
    activeProject = {
      id: selectedProj.project_id || selectedProj.id,
      name: selectedProj.name,
      clientName: selectedProj.clientName
    };
    projectId = activeProject.id;
    const nameLabel = layer.querySelector(".script-active-proj-name");
    if (nameLabel) nameLabel.textContent = activeProject.name;

    scripts = getStorageScripts(projectId);
    activeScriptId = scripts[0]?.id || null;
    loadActiveScript(activeScriptId);
  });

  // Attach Project File
  attachFileBtn?.addEventListener("click", () => {
    const fileId = selectProjectFile?.value;
    if (!fileId) return;
    const opt = selectProjectFile.selectedOptions[0];
    const fileName = opt.dataset.fileName || opt.textContent;
    const fileSize = Number(opt.dataset.fileSize || 0);
    const fileType = opt.dataset.fileType || "video";

    const active = scripts.find(s => s.id === activeScriptId);
    if (!active) return;
    active.attachedAssets = active.attachedAssets || [];
    if (active.attachedAssets.some(a => a.id === fileId)) {
      alert("This project asset is already attached.");
      return;
    }
    active.attachedAssets.push({
      id: fileId,
      name: fileName,
      size: fileSize,
      type: fileType,
      url: `/api/uploads?action=download&fileId=${encodeURIComponent(fileId)}`
    });
    saveStorageScripts(projectId, scripts);
    renderAttachments(active);
    selectProjectFile.value = "";
  });

  // Add External Video Link
  addUrlBtn?.addEventListener("click", () => {
    const url = videoUrlInput?.value.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      alert("Please enter a valid video URL (e.g. https://youtube.com/...)");
      return;
    }

    const active = scripts.find(s => s.id === activeScriptId);
    if (!active) return;
    active.videoLinks = active.videoLinks || [];
    const platform = detectVideoPlatform(url);
    active.videoLinks.push({
      id: `link_${Date.now()}`,
      title: `${platform} Cut`,
      url,
      platform
    });
    saveStorageScripts(projectId, scripts);
    renderAttachments(active);
    if (videoUrlInput) videoUrlInput.value = "";
  });

  // Publish to Website Toggle
  publishToggle.addEventListener("click", () => {
    const active = scripts.find(s => s.id === activeScriptId);
    if (!active) return;
    active.published = !active.published;
    active.publishedAt = active.published ? Date.now() : null;
    saveStorageScripts(projectId, scripts);
    updatePublishUI(active);
    renderScriptList();

    if (active.published) {
      openShowcaseModal(active, activeProject);
    }
  });

  // Preview Showcase
  previewShowcaseBtn.addEventListener("click", () => {
    const active = scripts.find(s => s.id === activeScriptId);
    if (active) openShowcaseModal(active, activeProject);
  });

  // Copy Showcase Link
  copyShowcaseBtn.addEventListener("click", async () => {
    const active = scripts.find(s => s.id === activeScriptId);
    if (!active) return;
    const link = `${window.location.origin}${window.location.pathname}#workspace?panel=showcase&script=${encodeURIComponent(active.id)}&project=${encodeURIComponent(projectId)}`;
    try {
      await navigator.clipboard.writeText(link);
      const old = copyShowcaseBtn.textContent;
      copyShowcaseBtn.textContent = "Copied! ✓";
      setTimeout(() => { if (copyShowcaseBtn.isConnected) copyShowcaseBtn.textContent = old; }, 1800);
    } catch {
      alert(`Showcase link: ${link}`);
    }
  });

  // Editor inputs
  editorSurface.addEventListener("input", () => {
    updateMetrics();
    triggerAutoSave();
  });
  titleInput.addEventListener("input", triggerAutoSave);
  statusSelect.addEventListener("change", triggerAutoSave);
  folderSelect.addEventListener("change", triggerAutoSave);

  // Toolbar actions
  layer.querySelectorAll("[data-cmd]").forEach(btn => {
    btn.addEventListener("click", () => {
      const cmd = btn.dataset.cmd;
      const val = btn.dataset.val || null;
      document.execCommand(cmd, false, val);
      editorSurface.focus();
      updateMetrics();
      triggerAutoSave();
    });
  });

  // Highlighters
  layer.querySelectorAll("[data-highlight]").forEach(btn => {
    btn.addEventListener("click", () => {
      const color = btn.dataset.highlight;
      const sel = window.getSelection();
      if (!sel.rangeCount || sel.isCollapsed) {
        editorSurface.focus();
        return;
      }
      const range = sel.getRangeAt(0);
      if (color === "clear") {
        document.execCommand("removeFormat", false, null);
      } else {
        const mark = document.createElement("mark");
        mark.className = `cx-hl-${color}`;
        try {
          range.surroundContents(mark);
        } catch {
          document.execCommand("hiliteColor", false, color === "orange" ? "#ffedd5" : color === "yellow" ? "#fef08a" : color === "green" ? "#bbf7d0" : color === "cyan" ? "#cffafe" : "#ede9fe");
        }
      }
      editorSurface.focus();
      triggerAutoSave();
    });
  });

  // Production cues insertion
  layer.querySelectorAll("[data-insert-cue]").forEach(btn => {
    btn.addEventListener("click", () => {
      const cueType = btn.dataset.insertCue;
      const cueClass = `cue-${cueType.toLowerCase().replace(/[^a-z]/g, "")}`;
      const badgeHtml = `&nbsp;<span class="cx-cue ${cueClass}">[${cueType}]</span>&nbsp;`;
      document.execCommand("insertHTML", false, badgeHtml);
      editorSurface.focus();
      triggerAutoSave();
    });
  });

  // Copy to clipboard
  layer.querySelector("[data-copy-script]").addEventListener("click", async e => {
    const text = editorSurface.innerText || "";
    try {
      await navigator.clipboard.writeText(text);
      const btn = e.currentTarget;
      const orig = btn.textContent;
      btn.textContent = "Copied to clipboard ✓";
      setTimeout(() => { if (btn.isConnected) btn.textContent = orig; }, 1800);
    } catch {
      alert("Script text could not be copied automatically.");
    }
  });

  // Export Markdown
  layer.querySelector("[data-export-md]").addEventListener("click", () => {
    const active = scripts.find(s => s.id === activeScriptId);
    const title = active?.title || "script";
    const md = `# ${title}\n\n` + htmlToMarkdown(editorSurface.innerHTML);
    downloadBlob(new Blob([md], { type:"text/markdown;charset=utf-8" }), `${slugify(title)}.md`);
  });

  // Export Plain Text
  layer.querySelector("[data-export-txt]").addEventListener("click", () => {
    const active = scripts.find(s => s.id === activeScriptId);
    const title = active?.title || "script";
    const text = `${title}\n\n` + (editorSurface.innerText || "");
    downloadBlob(new Blob([text], { type:"text/plain;charset=utf-8" }), `${slugify(title)}.txt`);
  });

  // Initial load
  loadActiveScript(activeScriptId);
}

function openVideoPreviewModal(title, embedUrl, directUrl) {
  const modal = document.createElement("div");
  modal.className = "workspace-modal-backdrop script-video-preview-layer";
  modal.innerHTML = `
    <div class="script-video-preview-modal">
      <header class="video-preview-header">
        <strong>${escapeHTML(title)}</strong>
        <button type="button" class="script-studio-close" data-close-preview aria-label="Close">×</button>
      </header>
      <div class="video-preview-content">
        ${embedUrl ? `<iframe src="${embedUrl}?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` : `<video controls autoplay playsinline src="${escapeHTML(directUrl)}"></video>`}
      </div>
    </div>
  `;
  document.body.append(modal);
  const close = () => modal.remove();
  modal.querySelector("[data-close-preview]").addEventListener("click", close);
  modal.addEventListener("click", e => { if (e.target === modal) close(); });
}

function openShowcaseModal(script, project) {
  const modal = document.createElement("div");
  modal.className = "workspace-modal-backdrop script-showcase-layer";
  const metrics = calculateSpeechMetrics(script.content.replace(/<[^>]*>/g, ""));
  const primaryLink = (script.videoLinks || [])[0];
  const primaryAsset = (script.attachedAssets || [])[0];
  const primaryVideoUrl = primaryLink?.url || primaryAsset?.url || null;
  const embedUrl = primaryVideoUrl ? getVideoEmbedUrl(primaryVideoUrl) : null;
  const showcaseLink = `${window.location.origin}${window.location.pathname}#workspace?panel=showcase&script=${encodeURIComponent(script.id)}&project=${encodeURIComponent(project.id)}`;

  modal.innerHTML = `
    <div class="script-showcase-modal">
      <header class="showcase-header">
        <div class="showcase-header-tag">
          <span class="cx-showcase-pill">CONTENT X · PUBLIC SHOWCASE</span>
          <span class="cx-verified-pill">✓ Verified Production</span>
        </div>
        <button type="button" class="script-studio-close" data-close-showcase aria-label="Close">×</button>
      </header>
      <div class="showcase-body">
        <div class="showcase-hero">
          <span class="showcase-project-name">Project: ${escapeHTML(project.name)}</span>
          <h2>${escapeHTML(script.title)}</h2>
          <div class="showcase-meta-row">
            <span><b>${metrics.durationFormatted}</b> Teleprompter Speaking Duration</span>
            <span><b>${metrics.words}</b> Words (~135 WPM standard)</span>
            <span class="showcase-live-badge">● Published on Website</span>
          </div>
        </div>

        ${primaryVideoUrl ? `
          <div class="showcase-media-frame">
            ${embedUrl ? `<iframe src="${embedUrl}" allowfullscreen></iframe>` : `
              <div class="showcase-external-video-card">
                <span class="showcase-play-icon">▶</span>
                <div class="showcase-video-info">
                  <strong>${escapeHTML(primaryLink?.title || primaryAsset?.name || "Attached Video Cut")}</strong>
                  <small>${escapeHTML(primaryLink?.platform || "Direct Video")}: ${escapeHTML(primaryVideoUrl)}</small>
                </div>
                <a href="${escapeHTML(primaryVideoUrl)}" target="_blank" rel="noopener noreferrer" class="workspace-button primary">Watch Cut ↗</a>
              </div>
            `}
          </div>
        ` : `
          <div class="showcase-no-media-note">
            <small>Attach a project cut or paste a YouTube / Loom link in Script Studio to embed the video player directly here.</small>
          </div>
        `}

        <div class="showcase-script-card">
          <div class="showcase-script-head">
            <strong>Hook Breakdown & Production Cues</strong>
            <button type="button" class="workspace-button subtle" data-copy-showcase-text>Copy Script</button>
          </div>
          <div class="showcase-script-content">
            ${script.content}
          </div>
        </div>

        <div class="showcase-share-footer">
          <div class="showcase-share-input-group">
            <input type="text" readonly value="${showcaseLink}" data-showcase-url-input>
            <button type="button" class="workspace-button primary" data-btn-copy-url>Copy Public Link</button>
          </div>
          <div class="showcase-cta-strip">
            <span>Want retention-led short-form videos edited like this?</span>
            <a href="#pricing" class="workspace-button subtle" data-close-to-pricing>View Content X Plans →</a>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.append(modal);

  const close = () => modal.remove();
  modal.querySelector("[data-close-showcase]").addEventListener("click", close);
  modal.querySelectorAll("[data-close-to-pricing]").forEach(b => b.addEventListener("click", close));
  modal.addEventListener("click", e => { if (e.target === modal) close(); });

  modal.querySelector("[data-btn-copy-url]").addEventListener("click", async e => {
    try {
      await navigator.clipboard.writeText(showcaseLink);
      const btn = e.currentTarget;
      const old = btn.textContent;
      btn.textContent = "Copied! ✓";
      setTimeout(() => { if (btn.isConnected) btn.textContent = old; }, 1800);
    } catch {
      modal.querySelector("[data-showcase-url-input]")?.select();
    }
  });

  modal.querySelector("[data-copy-showcase-text]")?.addEventListener("click", async e => {
    const text = modal.querySelector(".showcase-script-content")?.innerText || "";
    try {
      await navigator.clipboard.writeText(text);
      const btn = e.currentTarget;
      const old = btn.textContent;
      btn.textContent = "Copied ✓";
      setTimeout(() => { if (btn.isConnected) btn.textContent = old; }, 1800);
    } catch {}
  });
}

export function getProjectScriptsCount(projectId) {
  return getStorageScripts(projectId).length;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function slugify(text) {
  return String(text || "script").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "script";
}

function escapeHTML(str = "") {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}
