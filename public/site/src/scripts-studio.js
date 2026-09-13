// Content X Script Writing Studio — Notion & Docs-style collaborative scriptwriter
// Features: Scene/Shot headings, formatting, color highlights, production cues, live teleprompter duration, multi-script manager, export

const SCRIPTS_KEY_PREFIX = "cx_scripts_";

function getStorageScripts(projectId) {
  try {
    const raw = localStorage.getItem(`${SCRIPTS_KEY_PREFIX}${projectId}`);
    if (raw) return JSON.parse(raw);
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

export function openScriptStudioModal(root, project, folders = [], actions = {}) {
  const projectId = project.id;
  let scripts = getStorageScripts(projectId);
  let activeScriptId = scripts[0]?.id || null;

  const layer = document.createElement("div");
  layer.className = "workspace-modal-backdrop script-studio-layer";
  layer.innerHTML = `
    <section class="script-studio-modal" aria-labelledby="studio-script-title">
      <header class="script-studio-header">
        <div class="script-studio-title-group">
          <span class="script-studio-badge">NOTION STUDIO</span>
          <h2 id="studio-script-title">Script Writing & Teleprompter Studio</h2>
          <small>Project: ${escapeHTML(project.name)} · Write retention-led video scripts, add cues, and calculate live speech time.</small>
        </div>
        <div class="script-studio-head-actions">
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
            <strong>Scripts (<span>${scripts.length}</span>)</strong>
            <button type="button" class="script-new-btn" data-new-script title="Create new script">＋ New</button>
          </div>
          <div class="script-studio-list" data-script-list></div>
        </aside>

        <!-- Main Notion/Docs Editor Surface -->
        <main class="script-studio-main">
          <div class="script-meta-bar">
            <div class="script-meta-left">
              <input type="text" class="script-title-input" data-script-title placeholder="Untitled Script" value="">
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

          <!-- Document Content Editable Area -->
          <div class="script-editor-container">
            <div class="script-editor-content" contenteditable="true" spellcheck="true" role="textbox" aria-multiline="true" data-editor-surface placeholder="Type your scene breakdown, hooks, and dialogue here…"></div>
          </div>

          <!-- Live Teleprompter Duration & Metrics Footer -->
          <footer class="script-teleprompter-footer">
            <div class="teleprompter-timer">
              <span class="teleprompter-icon">⏱</span>
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
  const saveIndicator = layer.querySelector("[data-save-status]");
  const speechDuration = layer.querySelector("[data-speech-duration]");
  const wordCountEl = layer.querySelector("[data-word-count]");
  const charCountEl = layer.querySelector("[data-char-count]");

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
    updateMetrics();
  }

  function renderScriptList() {
    scriptList.innerHTML = scripts.map(s => `
      <article class="script-item ${s.id === activeScriptId ? "active" : ""}" data-script-id="${escapeHTML(s.id)}">
        <div class="script-item-head">
          <span class="script-status-pill status-${s.status.toLowerCase()}">${escapeHTML(s.status)}</span>
          <button type="button" class="script-item-delete" data-delete-script="${escapeHTML(s.id)}" title="Delete script">×</button>
        </div>
        <strong class="script-item-title">${escapeHTML(s.title || "Untitled Script")}</strong>
        <div class="script-item-meta">
          <small>${calculateSpeechMetrics(s.content.replace(/<[^>]*>/g, "")).durationFormatted} teleprompter</small>
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
      content: `<h1>Scene 1 · Hook</h1>\n<p><span class="cx-cue cue-vo">[VO]</span> Enter your opening hook here...</p>`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    scripts.unshift(newScript);
    saveStorageScripts(projectId, scripts);
    loadActiveScript(newScript.id);
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
