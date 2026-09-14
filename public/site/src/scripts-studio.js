// Content X Script Writing Studio — Full-Screen Studio & Teleprompter
// Features: Full-screen workspace surface, Scene/Shot headings, formatting, color highlights,
// production cues ([HOOK], [VO], [B-ROLL], [TALENT], [SFX], [GRAPHIC], [TRANSITION], [CTA]),
// viral hook matrix library (16 formulas), multi-script templates (PAS, Myth-Buster, 3-Step, etc.),
// full-screen hardware-ready teleprompter with WPM speed/mirror mode/guideline,
// attached video cuts & workspace asset linking with side-by-side review player,
// retention pacing diagnostics, and publish to website showcase.

const SCRIPTS_KEY_PREFIX = "cx_scripts_";

export function getStorageScripts(projectId) {
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
          publishedAt: s.publishedAt || null,
          targetPacing: s.targetPacing || "reel_60",
          targetWpm: Number(s.targetWpm) || 135
        }));
      }
    }
  } catch {}
  return defaultStarterScripts(projectId);
}

export function saveStorageScripts(projectId, scripts) {
  try {
    localStorage.setItem(`${SCRIPTS_KEY_PREFIX}${projectId}`, JSON.stringify(scripts));
  } catch {}
}

export function getProjectScriptsCount(projectId) {
  return getStorageScripts(projectId).length;
}

export function defaultStarterScripts(projectId) {
  const now = Date.now();
  return [
    {
      id: `script_${projectId}_1`,
      projectId,
      folderId: "",
      title: "Launch Reel 01 — 3-Second Hook & Retention Curve",
      status: "Review",
      targetPacing: "reel_60",
      targetWpm: 135,
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
<p><span class="cx-cue cue-hook">[HOOK]</span> <mark class="cx-hl-orange">Stop editing short-form videos like it is 2020.</mark></p>
<p><span class="cx-cue cue-vo">[VO]</span> Here is why that is killing your audience retention in the first 3 seconds.</p>
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
<p><span class="cx-cue cue-talent">[TALENT]</span> Drop a comment with your niche below, and our team will build your custom 3-second hook framework.</p>
<p><span class="cx-cue cue-cta">[CTA]</span> Save this cut and follow for daily retention breakdowns.</p>`,
      createdAt: now - 86400000,
      updatedAt: now - 3600000,
    },
    {
      id: `script_${projectId}_2`,
      projectId,
      folderId: "",
      title: "Product Teaser — Behind The Scenes Cut",
      status: "Draft",
      targetPacing: "reel_60",
      targetWpm: 135,
      attachedAssets: [],
      videoLinks: [],
      published: false,
      publishedAt: null,
      content: `<h1>Scene 1 · Studio Atmosphere</h1>
<p><span class="cx-cue cue-hook">[HOOK]</span> What does it actually take to produce high-impact short-form videos every day without burning out?</p>
<p><span class="cx-cue cue-broll">[B-ROLL]</span> Macro close-up of high-speed camera gimbal setup, ambient studio lighting turning orange.</p>
<p><span class="cx-cue cue-sfx">[SFX]</span> Ambient studio tone + low frequency drone.</p>

<h2>Shot 2 · Workflow Breakdown</h2>
<p><span class="cx-cue cue-talent">[TALENT]</span> You don't need more hours. You need an editing pipeline that takes raw footage and turns it into publish-ready retention cuts in 48 hours.</p>
<p><span class="cx-cue cue-graphic">[GRAPHIC]</span> 48-Hour Turnaround badge with animated checkmark.</p>
<p><span class="cx-cue cue-cta">[CTA]</span> Claim your private workspace at contentx.co.in.</p>`,
      createdAt: now - 172800000,
      updatedAt: now - 7200000,
    }
  ];
}

export const SCRIPT_TEMPLATES = [
  {
    id: "blank",
    name: "Blank Canvas",
    category: "Standard",
    desc: "Start with an empty script document and write from scratch.",
    template: `<h1>Scene 1 · Hook</h1>\n<p><span class="cx-cue cue-hook">[HOOK]</span> Enter your opening line here...</p>\n<p><span class="cx-cue cue-vo">[VO]</span> Voiceover explanation...</p>`
  },
  {
    id: "pas",
    name: "Problem - Agitate - Solve (PAS)",
    category: "Viral Hook",
    desc: "The classic short-form formula for pattern interrupt, pain point agitation, and immediate solution.",
    template: `<h1>Scene 1 · Scroll-Stopping Hook</h1>
<p><span class="cx-cue cue-hook">[HOOK]</span> <mark class="cx-hl-orange">Stop doing [Common Mistake] if you want [Desired Outcome].</mark></p>
<p><span class="cx-cue cue-vo">[VO]</span> Here is why that strategy is costing you thousands of views in the first 3 seconds.</p>
<p><span class="cx-cue cue-sfx">[SFX]</span> Sub-bass drop + vinyl brake impact.</p>

<h1>Scene 2 · The Agitation</h1>
<p><span class="cx-cue cue-broll">[B-ROLL]</span> Rapid swipe-away montage on mobile feed showing instant drop-off analytics.</p>
<p><span class="cx-cue cue-talent">[TALENT]</span> When you open with small talk, over 70% of viewers scroll before you even introduce your topic.</p>

<h2>Shot 2 · The Solution Framework</h2>
<p><span class="cx-cue cue-vo">[VO]</span> Instead, lead with the transformation first. Watch what happens when we flip the timeline.</p>
<p><span class="cx-cue cue-graphic">[GRAPHIC]</span> Side-by-side timeline retention curve showing 68% complete watch-through.</p>

<h2>Shot 3 · The Call to Action</h2>
<p><span class="cx-cue cue-talent">[TALENT]</span> Drop a comment below and our team will build your tailored hook structure.</p>
<p><span class="cx-cue cue-cta">[CTA]</span> Save this cut and follow for daily retention frameworks.</p>`
  },
  {
    id: "myth",
    name: "Contrarian Myth-Buster",
    category: "Authority",
    desc: "Call out outdated industry advice and position your unique method as the true secret.",
    template: `<h1>Scene 1 · The Myth Callout</h1>
<p><span class="cx-cue cue-hook">[HOOK]</span> Most advice about [Niche Topic] is completely backwards.</p>
<p><span class="cx-cue cue-talent">[TALENT]</span> You’ve been told that you need [Common Myth]. But here is the truth no one is talking about.</p>
<p><span class="cx-cue cue-sfx">[SFX]</span> Sharp record scratch into digital riser.</p>

<h1>Scene 2 · The Proof</h1>
<p><span class="cx-cue cue-broll">[B-ROLL]</span> Screen recording of real timeline data and analytics comparison.</p>
<p><span class="cx-cue cue-graphic">[GRAPHIC]</span> "MYTH VS REALITY" split callout cards.</p>

<h2>Shot 2 · The New Rule</h2>
<p><span class="cx-cue cue-vo">[VO]</span> The creators actually winning in 2026 focus on one thing: immediate pacing velocity.</p>

<h2>Shot 3 · Actionable Takeaway</h2>
<p><span class="cx-cue cue-talent">[TALENT]</span> Save this video and test this formula on your very next upload.</p>
<p><span class="cx-cue cue-cta">[CTA]</span> Bookmark for your next shoot.</p>`
  },
  {
    id: "three_step",
    name: "3-Step Value Stack",
    category: "Educational",
    desc: "Rapid-fire 3 tips with visual cues engineered for high save and share rates.",
    template: `<h1>Scene 1 · The High-Value Hook</h1>
<p><span class="cx-cue cue-hook">[HOOK]</span> 3 editing secrets that will instantly double your video retention.</p>
<p><span class="cx-cue cue-vo">[VO]</span> Number 3 is something 95% of editors forget to do.</p>

<h2>Shot 1 · Step One</h2>
<p><span class="cx-cue cue-talent">[TALENT]</span> First: Cut every single breath and dead air pause under 0.2 seconds.</p>
<p><span class="cx-cue cue-broll">[B-ROLL]</span> Timeline waveform ripple edit demonstration.</p>

<h2>Shot 2 · Step Two</h2>
<p><span class="cx-cue cue-talent">[TALENT]</span> Second: Change the visual frame every 2.5 seconds using dynamic zoom cuts or b-roll punch-ins.</p>
<p><span class="cx-cue cue-graphic">[GRAPHIC]</span> Kinetic zoom in/out with sound effect marker.</p>

<h2>Shot 3 · Step Three (The Secret)</h2>
<p><span class="cx-cue cue-talent">[TALENT]</span> Third: Layer subtle ambient sound design underneath your speech so there is never silent audio.</p>
<p><span class="cx-cue cue-sfx">[SFX]</span> Subtle warm synth drone riser.</p>

<h1>Scene 2 · Save Call To Action</h1>
<p><span class="cx-cue cue-talent">[TALENT]</span> Which of these 3 are you adding to your workflow today?</p>
<p><span class="cx-cue cue-cta">[CTA]</span> Save this post and share with your editor.</p>`
  },
  {
    id: "product_demo",
    name: "Product Teaser & Showcase",
    category: "Commercial",
    desc: "Highlight pain point, feature reveal, fast b-roll rhythm, and conversion CTA.",
    template: `<h1>Scene 1 · Visual Hook</h1>
<p><span class="cx-cue cue-hook">[HOOK]</span> What if video editing didn’t take 14 hours of back-and-forth revisions?</p>
<p><span class="cx-cue cue-broll">[B-ROLL]</span> Cinematic macro shots of raw footage turning into polished 4K cuts in seconds.</p>
<p><span class="cx-cue cue-sfx">[SFX]</span> Crisp mechanical click + bass drop.</p>

<h1>Scene 2 · Friction vs Flow</h1>
<p><span class="cx-cue cue-talent">[TALENT]</span> Meet Content X: Private review rooms, timestamped frame feedback, and 48-hour delivery.</p>
<p><span class="cx-cue cue-graphic">[GRAPHIC]</span> Interactive UI mockup showing timestamped comments and version slider.</p>

<h2>Shot 2 · The Results</h2>
<p><span class="cx-cue cue-vo">[VO]</span> Upload your raw footage once, review directly on the timeline, and approve with a click.</p>

<h1>Scene 3 · Offer & Invitation</h1>
<p><span class="cx-cue cue-talent">[TALENT]</span> Claim your free workspace today at contentx.co.in.</p>
<p><span class="cx-cue cue-cta">[CTA]</span> Link in bio to start your first project.</p>`
  },
  {
    id: "story_arc",
    name: "Before vs After Transformation",
    category: "Storytelling",
    desc: "Vulnerable personal or client story tracing the breakdown to the breakthrough.",
    template: `<h1>Scene 1 · The Painful Beginning</h1>
<p><span class="cx-cue cue-hook">[HOOK]</span> 6 months ago, our videos were stuck at 400 views per reel.</p>
<p><span class="cx-cue cue-broll">[B-ROLL]</span> Slow moody footage showing flatline analytics graph and tired creator.</p>
<p><span class="cx-cue cue-sfx">[SFX]</span> Low heartbeat bass pulse.</p>

<h1>Scene 2 · The Turning Point</h1>
<p><span class="cx-cue cue-talent">[TALENT]</span> We realized the problem wasn't the content—it was the first 3 seconds of timeline editing.</p>
<p><span class="cx-cue cue-graphic">[GRAPHIC]</span> Hook comparison overlay: "Vague intro" vs "Pattern disrupt".</p>

<h2>Shot 2 · The Transformation</h2>
<p><span class="cx-cue cue-vo">[VO]</span> We stripped out 10 seconds of fluff and tested high-contrast pattern disruptions.</p>
<p><span class="cx-cue cue-sfx">[SFX]</span> Upbeat transition whoosh into rhythmic beat.</p>

<h1>Scene 3 · The Breakthrough</h1>
<p><span class="cx-cue cue-broll">[B-ROLL]</span> Spiking analytics curve reaching 250K+ views with surging engagement.</p>
<p><span class="cx-cue cue-talent">[TALENT]</span> Pacing beats perfection every single time.</p>
<p><span class="cx-cue cue-cta">[CTA]</span> Drop "HOOK" in comments to get the full timeline preset.</p>`
  }
];

export const VIRAL_HOOK_LIBRARY = [
  {
    category: "Contrarian & Pattern Disrupt",
    title: "The Stop-Doing Hook",
    formula: "Stop doing [Common Habit] if you want [Desired Outcome].",
    example: "Stop doing 15-second intros if you want to grow on Reels. Here is what actually holds attention in 2026."
  },
  {
    category: "Contrarian & Pattern Disrupt",
    title: "The Industry Lie",
    formula: "Everyone is lying to you about [Topic]. Here is the real reason...",
    example: "Everyone is lying to you about camera gear. Here is the real reason your videos aren't converting."
  },
  {
    category: "Contrarian & Pattern Disrupt",
    title: "The Unpopular Truth",
    formula: "This might make some people angry, but [Bold Statement].",
    example: "This might make some editors angry, but fancy transitions never saved a boring script."
  },
  {
    category: "Curiosity & Value Gap",
    title: "The Hidden Setting",
    formula: "This 1 hidden setting in [Tool/Platform] literally doubled our [Metric].",
    example: "This 1 hidden pacing rule in Premiere literally doubled our average view duration."
  },
  {
    category: "Curiosity & Value Gap",
    title: "The 99% Rule",
    formula: "99% of creators are doing [Action] completely wrong. Watch this.",
    example: "99% of creators frame their talking head completely wrong. Here is the 2-inch rule."
  },
  {
    category: "Curiosity & Value Gap",
    title: "The Secret Weapon",
    formula: "If I lost everything and had to rebuild [Goal] from zero, this is what I would do.",
    example: "If I lost all my followers and had to reach 100K in 90 days, here is my exact 3-reel script framework."
  },
  {
    category: "High Stakes & Warning",
    title: "The Retention Warning",
    formula: "If your retention drops before second 3, your video is dead. Fix it here.",
    example: "If your audience drops off in the first 3 seconds, the algorithm kills your reach. Here is the 1-frame fix."
  },
  {
    category: "High Stakes & Warning",
    title: "The Costly Mistake",
    formula: "This single mistake is costing you thousands of dollars / views.",
    example: "This single audio mistake is driving 60% of your viewers away before you finish sentence one."
  },
  {
    category: "High Stakes & Warning",
    title: "The Launch Blunder",
    formula: "Do NOT publish your next [Asset/Video] until you check this one thing.",
    example: "Do NOT export your final cut until you test this mobile audio loudness threshold."
  },
  {
    category: "Data & Proof-Led",
    title: "The 500-Video Analysis",
    formula: "We analyzed [Number] high-performing videos. Here are the 3 patterns.",
    example: "We analyzed 500 viral shorts last month. Here are the 3 timeline cuts they all have in common."
  },
  {
    category: "Data & Proof-Led",
    title: "The Zero-Ad Breakdown",
    formula: "How [Subject] generated [Big Result] with zero ad spend.",
    example: "How this founder gained 45,000 email subscribers with just 12 short-form videos."
  },
  {
    category: "Data & Proof-Led",
    title: "The Metric Split",
    formula: "Look at the difference between Cut A and Cut B. Notice this one change.",
    example: "Look at this retention graph: Cut A dropped at 32%, but Cut B sustained 74% watch time."
  },
  {
    category: "Speed & Actionable How-To",
    title: "The Painless Shortcut",
    formula: "How to get [Desirable Result] in [Short Time] without [Painful Obstacle].",
    example: "How to script 10 high-retention videos in 45 minutes without staring at a blank screen."
  },
  {
    category: "Speed & Actionable How-To",
    title: "The Blueprint Steal",
    formula: "Steal this exact [Framework/Timeline] for your next [Project].",
    example: "Steal this 4-step hook formula for your next TikTok or Instagram Reel."
  },
  {
    category: "Speed & Actionable How-To",
    title: "The 30-Second Checklist",
    formula: "The 5-point checklist our lead editors check before delivering any video.",
    example: "The 5-point quality checklist we run before any video leaves our workspace."
  },
  {
    category: "Speed & Actionable How-To",
    title: "The Immediate Upgrade",
    formula: "Change this one word in your hook and watch what happens.",
    example: "Replace 'In this video I will show you' with this 4-word pattern disrupt."
  }
];

export function calculateSpeechMetrics(text, wpm = 135) {
  const clean = text.replace(/\[[A-Z-]+\]/g, "").replace(/\s+/g, " ").trim();
  const words = clean ? clean.split(/\s+/).length : 0;
  const chars = clean.length;
  const targetWpm = Math.max(80, Math.min(260, Number(wpm) || 135));
  const totalSeconds = Math.round((words / targetWpm) * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const durationFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  let pacingRating = "Optimal Short-Form (<45s)";
  let pacingClass = "pacing-optimal";
  if (totalSeconds > 90) {
    pacingRating = "Long-Form / YouTube (>90s)";
    pacingClass = "pacing-longform";
  } else if (totalSeconds > 60) {
    pacingRating = "Extended Cut (60-90s)";
    pacingClass = "pacing-extended";
  } else if (totalSeconds >= 45) {
    pacingRating = "Short-Form Sweet Spot (45-60s)";
    pacingClass = "pacing-standard";
  }

  return { words, chars, totalSeconds, durationFormatted, pacingRating, pacingClass, targetWpm };
}

export function parseProductionCues(html = "") {
  const cues = {
    HOOK: 0,
    VO: 0,
    BROLL: 0,
    TALENT: 0,
    SFX: 0,
    GRAPHIC: 0,
    TRANSITION: 0,
    CTA: 0
  };
  const str = String(html || "");
  const cueMatches = str.match(/\[([A-Z-]+)\]/g) || [];
  for (const match of cueMatches) {
    const key = match.replace(/[\[\]]/g, "").replace("-", "");
    if (key === "BROLL") cues.BROLL++;
    else if (cues[key] !== undefined) cues[key]++;
  }
  return cues;
}

export function detectVideoPlatform(url) {
  const u = String(url || "").toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "YouTube";
  if (u.includes("vimeo.com")) return "Vimeo";
  if (u.includes("loom.com")) return "Loom";
  if (u.includes("drive.google.com")) return "Google Drive";
  if (u.includes("frame.io")) return "Frame.io";
  if (/\.(mp4|mov|webm|m4v)($|\?)/.test(u)) return "Direct MP4";
  return "Web Video";
}

export function getVideoEmbedUrl(url) {
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

export function htmlToMarkdown(html) {
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

function escapeHTML(str = "") {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
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

// -------------------------------------------------------------
// FULL-SCREEN SCRIPTS STUDIO SURFACE
// Renders seamlessly inside <section class="workspace-scripts-surface">
// -------------------------------------------------------------
export async function renderScriptStudioSurface(container, {
  project = null,
  projects = [],
  files = [],
  folders = [],
  actions = {},
  params = null
} = {}) {
  if (!container) return;

  let activeProject = project || (projects && projects.length ? {
    id: projects[0].project_id || projects[0].id,
    name: projects[0].name,
    clientName: projects[0].clientName
  } : { id: "default_project", name: "Default Project" });

  let projectId = activeProject.id || activeProject.project_id || "default_project";
  let scripts = getStorageScripts(projectId);
  let activeScriptId = params?.get("script") || scripts[0]?.id || null;
  let activeTab = "editor"; // "editor" | "hooks" | "cuts" | "cues"
  let currentFilter = "all"; // "all" | "draft" | "review" | "approved" | "recording"
  let searchQuery = "";
  let focusMode = false;
  let autoSaveTimeout = null;

  // Handle new script request via URL action
  if (params?.get("action") === "new") {
    const newScript = {
      id: `script_${projectId}_${Date.now()}`,
      projectId,
      folderId: "",
      title: `New Script ${scripts.length + 1}`,
      status: "Draft",
      targetPacing: "reel_60",
      targetWpm: 135,
      attachedAssets: [],
      videoLinks: [],
      published: false,
      publishedAt: null,
      content: `<h1>Scene 1 · Scroll-Stopping Hook</h1>\n<p><span class="cx-cue cue-hook">[HOOK]</span> Enter opening hook line...</p>\n<p><span class="cx-cue cue-vo">[VO]</span> Voiceover explanation...</p>`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    scripts.unshift(newScript);
    saveStorageScripts(projectId, scripts);
    activeScriptId = newScript.id;
  }

  // Shell Layout
  container.innerHTML = `
    <div class="scripts-surface-wrapper">
      <!-- Sub-navigation & Tools Ribbon -->
      <header class="scripts-surface-subnav" role="toolbar" aria-label="Scripts Studio Controls">
        <div class="scripts-subnav-left">
          <span class="scripts-studio-tag">SCRIPTS STUDIO</span>
          <div class="scripts-project-selector-group">
            <label for="scripts-active-proj">Project:</label>
            <select id="scripts-active-proj" class="scripts-proj-select" data-active-project-select>
              ${projects && projects.length ? projects.map(p => {
                const pid = p.project_id || p.id;
                return \`<option value="\${escapeHTML(pid)}" \${pid === projectId ? "selected" : ""}>\${escapeHTML(p.name)}</option>\`;
              }).join("") : \`<option value="\${escapeHTML(projectId)}">\${escapeHTML(activeProject.name)}</option>\`}
            </select>
          </div>
          <div class="scripts-pacing-goal-group">
            <label for="scripts-pacing-goal">Goal:</label>
            <select id="scripts-pacing-goal" class="scripts-pacing-select" data-pacing-goal-select title="Target duration benchmark">
              <option value="reel_60">Reel / TikTok (&lt;60s)</option>
              <option value="reel_45">High-Retention Viral (&lt;45s)</option>
              <option value="short_60">YouTube Shorts (60s)</option>
              <option value="explainer_90">Explainer / BTS (&gt;90s)</option>
            </select>
          </div>
        </div>

        <nav class="scripts-subnav-tabs" aria-label="Studio Modes">
          <button type="button" class="scripts-mode-tab active" data-studio-tab="editor">
            Editor
          </button>
          <button type="button" class="scripts-mode-tab" data-studio-tab="hooks">
            Viral Hooks <b class="tab-count-pill">\${VIRAL_HOOK_LIBRARY.length}</b>
          </button>
          <button type="button" class="scripts-mode-tab" data-studio-tab="cuts">
            Video Cuts <b class="tab-count-pill" data-cuts-count-pill>0</b>
          </button>
          <button type="button" class="scripts-mode-tab" data-studio-tab="cues">
            Shot List
          </button>
        </nav>

        <div class="scripts-subnav-actions">
          <button type="button" class="scripts-action-button scripts-prompter-launch-btn" data-launch-teleprompter title="Launch Hardware-Ready Teleprompter">
            <span>▶</span> Teleprompter
          </button>
          <button type="button" class="scripts-action-button subtle" data-toggle-focus title="Toggle Distraction-Free Focus Mode">
            <span data-focus-icon>⤢</span> <span data-focus-text>Focus</span>
          </button>
          <div class="scripts-dropdown-wrap">
            <button type="button" class="scripts-action-button subtle" data-toggle-export-menu title="Export Script">
              Export ▾
            </button>
            <div class="scripts-menu-popover" data-export-menu hidden>
              <button type="button" data-export-md>Export as Markdown (.md)</button>
              <button type="button" data-export-txt>Export as Plain Text (.txt)</button>
              <button type="button" data-copy-formatted>Copy Script to Clipboard</button>
              <button type="button" data-print-script>Print / PDF Preview</button>
            </div>
          </div>
          <button type="button" class="scripts-publish-btn" data-toggle-publish title="Publish script & attached cut to website showcase">
            Publish to Website
          </button>
        </div>
      </header>

      <!-- Main Surface Grid: Sidebar (Explorer) + Studio Stage -->
      <div class="scripts-surface-main">
        <!-- Sidebar: Scripts Explorer & Directory -->
        <aside class="scripts-explorer-sidebar" data-scripts-sidebar>
          <div class="scripts-explorer-head">
            <div class="scripts-search-wrap">
              
              <input type="search" placeholder="Search scripts..." aria-label="Search scripts" data-scripts-search>
            </div>
            <button type="button" class="scripts-new-script-trigger" data-new-script-btn title="Create new script from template or blank">
              ＋ New Script
            </button>
          </div>

          <!-- Status Filters -->
          <div class="scripts-filter-pills" role="tablist" aria-label="Filter by Status">
            <button type="button" class="filter-pill active" data-filter-status="all">All</button>
            <button type="button" class="filter-pill" data-filter-status="Draft">Draft</button>
            <button type="button" class="filter-pill" data-filter-status="Review">Review</button>
            <button type="button" class="filter-pill" data-filter-status="Approved">Approved</button>
            <button type="button" class="filter-pill" data-filter-status="Recording">Recording</button>
          </div>

          <!-- Scripts List -->
          <div class="scripts-nav-list" data-scripts-list role="listbox" aria-label="Available Scripts"></div>

          <!-- Explorer Footer Stats -->
          <footer class="scripts-explorer-footer">
            <small><b data-scripts-count>0</b> scripts in <span data-proj-name-label>\${escapeHTML(activeProject.name)}</span></small>
            <small class="scripts-total-runtime" data-total-runtime>0m 00s speech total</small>
          </footer>
        </aside>

        <!-- Main Studio Stage Area -->
        <main class="scripts-stage-area" data-scripts-stage>
          <!-- PANEL 1: SCRIPT EDITOR (DEFAULT) -->
          <section class="scripts-panel-view scripts-editor-view" data-panel-view="editor">
            <div class="scripts-editor-meta-strip">
              <div class="scripts-title-row">
                <input type="text" class="scripts-main-title-input" data-script-title-input placeholder="Untitled Script" value="" aria-label="Script title">
                <div class="scripts-status-badge-wrap">
                  <label for="script-status-select">Status:</label>
                  <select id="script-status-select" class="scripts-status-select" data-script-status-select>
                    <option value="Draft">Draft</option>
                    <option value="Review">In Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Recording">Recording</option>
                  </select>
                </div>
                <div class="scripts-folder-badge-wrap">
                  <label for="script-folder-select">Folder:</label>
                  <select id="script-folder-select" class="scripts-folder-select" data-script-folder-select>
                    <option value="">Project root</option>
                    \${folders.map(f => \`<option value="\${escapeHTML(f.id)}">\${escapeHTML(f.name)}</option>\`).join("")}
                  </select>
                </div>
              </div>
              <div class="scripts-save-badge" data-save-indicator>Saved ✓</div>
            </div>

            <!-- Formatting & Cue Ribbon -->
            <div class="scripts-format-ribbon" role="toolbar" aria-label="Text Formatting & Cues">
              <div class="format-group">
                <button type="button" data-cmd="formatBlock" data-val="H1" title="Scene Heading (H1)"><b>H1</b> Scene</button>
                <button type="button" data-cmd="formatBlock" data-val="H2" title="Shot/Beat Heading (H2)"><b>H2</b> Shot</button>
                <button type="button" data-cmd="formatBlock" data-val="H3" title="Sub-shot Heading (H3)"><b>H3</b> Sub-shot</button>
                <button type="button" data-cmd="formatBlock" data-val="P" title="Normal Paragraph">¶ Body</button>
              </div>

              <div class="format-sep"></div>

              <div class="format-group">
                <button type="button" data-cmd="bold" title="Bold (Ctrl+B)"><b>B</b></button>
                <button type="button" data-cmd="italic" title="Italic (Ctrl+I)"><i>I</i></button>
                <button type="button" data-cmd="underline" title="Underline (Ctrl+U)"><u>U</u></button>
                <button type="button" data-cmd="strikeThrough" title="Strikethrough"><s>S</s></button>
              </div>

              <div class="format-sep"></div>

              <div class="format-group">
                <span class="ribbon-label">Highlight:</span>
                <button type="button" class="hl-btn hl-orange" data-highlight="orange" title="Content X Orange"></button>
                <button type="button" class="hl-btn hl-yellow" data-highlight="yellow" title="Attention Yellow"></button>
                <button type="button" class="hl-btn hl-green" data-highlight="green" title="Emerald Green"></button>
                <button type="button" class="hl-btn hl-cyan" data-highlight="cyan" title="Sky Cyan"></button>
                <button type="button" class="hl-btn hl-purple" data-highlight="purple" title="Electric Purple"></button>
                <button type="button" class="hl-btn hl-clear" data-highlight="clear" title="Remove Highlight">✕</button>
              </div>

              <div class="format-sep"></div>

              <div class="format-group">
                <span class="ribbon-label">Insert Cue:</span>
                <button type="button" class="cue-btn cue-hook" data-insert-cue="HOOK" title="Insert Scroll-Stopping Hook Cue">[HOOK]</button>
                <button type="button" class="cue-btn cue-vo" data-insert-cue="VO" title="Insert Voiceover Cue">[VO]</button>
                <button type="button" class="cue-btn cue-broll" data-insert-cue="B-ROLL" title="Insert B-Roll Cutaway Cue">[B-ROLL]</button>
                <button type="button" class="cue-btn cue-talent" data-insert-cue="TALENT" title="Insert On-Camera Talent Cue">[TALENT]</button>
                <button type="button" class="cue-btn cue-sfx" data-insert-cue="SFX" title="Insert Sound FX Cue">[SFX]</button>
                <button type="button" class="cue-btn cue-graphic" data-insert-cue="GRAPHIC" title="Insert Graphic/Callout Cue">[GRAPHIC]</button>
                <button type="button" class="cue-btn cue-transition" data-insert-cue="TRANSITION" title="Insert Transition Cue">[TRANSITION]</button>
                <button type="button" class="cue-btn cue-cta" data-insert-cue="CTA" title="Insert Call-To-Action Cue">[CTA]</button>
              </div>

              <div class="format-sep"></div>

              <div class="format-group">
                <button type="button" class="cue-btn cue-divider" data-insert-divider title="Insert Visual Scene Break Divider">── Break</button>
              </div>
            </div>

            <!-- Editor Editable Surface -->
            <div class="scripts-canvas-container" data-canvas-container>
              <div class="scripts-canvas-content" contenteditable="true" spellcheck="true" role="textbox" aria-multiline="true" data-editor-surface placeholder="Type your script, hook breakdown, or paste text here…"></div>
            </div>

            <!-- Diagnostics & Pacing Teleprompter Footer -->
            <footer class="scripts-pacing-bar">
              <div class="pacing-metrics-left">
                <div class="pacing-timer-box">
                  <span class="pacing-icon"></span>
                  <strong class="pacing-duration" data-speech-duration>00:00</strong>
                  <small class="pacing-wpm-label">Est. duration at <b data-current-wpm-label>135</b> WPM</small>
                </div>
                <div class="pacing-rating-pill" data-pacing-rating-pill>Optimal Short-Form (&lt;45s)</div>
              </div>

              <div class="pacing-metrics-center" data-cues-summary-strip>
                <span class="cue-sum-item" data-cue-sum="HOOK">0 Hook</span>
                <span class="cue-sum-dot">·</span>
                <span class="cue-sum-item" data-cue-sum="VO">0 VO</span>
                <span class="cue-sum-dot">·</span>
                <span class="cue-sum-item" data-cue-sum="BROLL">0 B-Roll</span>
                <span class="cue-sum-dot">·</span>
                <span class="cue-sum-item" data-cue-sum="TALENT">0 Talent</span>
                <span class="cue-sum-dot">·</span>
                <span class="cue-sum-item" data-cue-sum="SFX">0 SFX</span>
              </div>

              <div class="pacing-metrics-right">
                <span data-word-count>0 words</span>
                <span class="pacing-dot">·</span>
                <span data-char-count>0 characters</span>
                <button type="button" class="scripts-footer-prompter-btn" data-launch-teleprompter title="Open Full-Screen Teleprompter">
                  Launch Prompter (F)
                </button>
              </div>
            </footer>
          </section>

          <!-- PANEL 2: VIRAL HOOK MATRIX -->
          <section class="scripts-panel-view scripts-hooks-view" data-panel-view="hooks" hidden>
            <div class="hooks-view-head">
              <div>
                <h3>Viral Hook & Formula Library</h3>
                <p>16 battle-tested short-form hook formulas engineered for maximum 3-second retention. Click <b>Insert into Script</b> to drop any hook directly into your document.</p>
              </div>
              <div class="hooks-filter-row">
                <button type="button" class="hook-cat-btn active" data-hook-filter="all">All Formulas</button>
                <button type="button" class="hook-cat-btn" data-hook-filter="Contrarian & Pattern Disrupt">Contrarian</button>
                <button type="button" class="hook-cat-btn" data-hook-filter="Curiosity & Value Gap">Curiosity Gap</button>
                <button type="button" class="hook-cat-btn" data-hook-filter="High Stakes & Warning">High Stakes</button>
                <button type="button" class="hook-cat-btn" data-hook-filter="Data & Proof-Led">Data & Proof</button>
                <button type="button" class="hook-cat-btn" data-hook-filter="Speed & Actionable How-To">Speed / How-To</button>
              </div>
            </div>
            <div class="hooks-grid" data-hooks-grid>
              \${VIRAL_HOOK_LIBRARY.map((hook, idx) => \`
                <article class="hook-card" data-hook-category="\${escapeHTML(hook.category)}" data-hook-index="\${idx}">
                  <header class="hook-card-header">
                    <span class="hook-category-badge">\${escapeHTML(hook.category)}</span>
                    <strong class="hook-card-title">\${escapeHTML(hook.title)}</strong>
                  </header>
                  <div class="hook-card-body">
                    <div class="hook-formula-box">
                      <small>STRUCTURE</small>
                      <p>\${escapeHTML(hook.formula)}</p>
                    </div>
                    <div class="hook-example-box">
                      <small>EXAMPLE</small>
                      <p>“\${escapeHTML(hook.example)}”</p>
                    </div>
                  </div>
                  <footer class="hook-card-footer">
                    <button type="button" class="hook-insert-btn" data-insert-hook="\${idx}">
                      ＋ Insert into Script
                    </button>
                  </footer>
                </article>
              \`).join("")}
            </div>
          </section>

          <!-- PANEL 3: ATTACHED VIDEO CUTS & ASSETS -->
          <section class="scripts-panel-view scripts-cuts-view" data-panel-view="cuts" hidden>
            <div class="cuts-view-head">
              <div>
                <h3>Attached Video Cuts & Workspace Assets</h3>
                <p>Attach project cuts or paste external video links (YouTube, Vimeo, Loom, Google Drive) to review timeline edits directly alongside your script.</p>
              </div>
              <div class="cuts-attach-inputs">
                \${files && files.length ? \`
                  <select class="cuts-file-select" data-select-project-file>
                    <option value="">＋ Link Project File...</option>
                    \${files.map(f => \`<option value="\${escapeHTML(f.id)}" data-file-name="\${escapeHTML(f.name)}" data-file-size="\${f.size || 0}" data-file-type="\${escapeHTML(f.type || "")}">\${escapeHTML(f.name)} (\${formatBytes(f.size || 0)})</option>\`).join("")}
                  </select>
                  <button type="button" class="cuts-attach-btn" data-attach-file-btn>Attach File</button>
                \` : ""}
                <input type="url" class="cuts-url-input" data-video-url-input placeholder="Paste YouTube, Vimeo, Loom, or Drive video URL…">
                <button type="button" class="cuts-attach-btn primary" data-add-url-btn>Add Link</button>
              </div>
            </div>

            <!-- Split Workspace: Attached Cuts List + Live Player & Script Side-by-Side -->
            <div class="cuts-split-workspace">
              <div class="cuts-list-column">
                <h4>Linked Attachments (<span data-cuts-count-inner>0</span>)</h4>
                <div class="cuts-items-list" data-cuts-items-list></div>
              </div>
              <div class="cuts-player-column" data-cuts-player-column>
                <div class="cuts-player-empty" data-player-empty>
                  <span>▶</span>
                  <strong>No video cut selected</strong>
                  <small>Select an attached video cut or paste a video link on the left to preview it side-by-side with your script.</small>
                </div>
                <div class="cuts-active-player" data-active-player hidden>
                  <div class="cuts-player-header">
                    <strong data-active-cut-title>Video Title</strong>
                    <button type="button" class="cuts-close-player" data-close-player>✕ Close Player</button>
                  </div>
                  <div class="cuts-player-frame" data-active-player-frame></div>
                </div>
              </div>
            </div>
          </section>

          <!-- PANEL 4: SHOT LIST & PRODUCTION CUES -->
          <section class="scripts-panel-view scripts-cues-view" data-panel-view="cues" hidden>
            <div class="cues-view-head">
              <div>
                <h3>Production Cue Checklist & Shot List</h3>
                <p>Automated breakdown of all Voiceover, B-Roll, Talent, SFX, and Graphic cues extracted from the active script. Use this checklist during shoot day and timeline assembly.</p>
              </div>
              <div class="cues-head-actions">
                <button type="button" class="scripts-action-button subtle" data-copy-shot-list>Copy Shot List</button>
                <button type="button" class="scripts-action-button subtle" data-print-shot-list>Print Checklist</button>
              </div>
            </div>
            <div class="cues-breakdown-grid" data-cues-breakdown-grid></div>
          </section>
        </main>
      </div>

      <!-- New Script Template Picker Modal Backdrop -->
      <div class="scripts-modal-backdrop" data-template-modal hidden>
        <div class="scripts-template-dialog" role="dialog" aria-labelledby="template-dialog-title">
          <header class="template-dialog-header">
            <div>
              <span class="scripts-studio-tag">TEMPLATE SELECTOR</span>
              <h3 id="template-dialog-title">Create New Script</h3>
              <small>Choose a proven short-form retention structure or start with a clean blank canvas.</small>
            </div>
            <button type="button" class="template-dialog-close" data-close-template-modal aria-label="Close">✕</button>
          </header>
          <div class="template-cards-grid">
            \${SCRIPT_TEMPLATES.map(t => \`
              <div class="template-pick-card" data-pick-template="\${t.id}">
                <div class="template-pick-head">
                  <span class="template-cat-pill">\${escapeHTML(t.category)}</span>
                  <strong>\${escapeHTML(t.name)}</strong>
                </div>
                <p>\${escapeHTML(t.desc)}</p>
                <button type="button" class="template-use-btn">Use Template →</button>
              </div>
            \`).join("")}
          </div>
        </div>
      </div>
    </div>
  `;

  // -------------------------------------------------------------
  // DOM ELEMENT REFERENCES
  // -------------------------------------------------------------
  const scriptsList = container.querySelector("[data-scripts-list]");
  const editorSurface = container.querySelector("[data-editor-surface]");
  const titleInput = container.querySelector("[data-script-title-input]");
  const statusSelect = container.querySelector("[data-script-status-select]");
  const folderSelect = container.querySelector("[data-script-folder-select]");
  const pacingGoalSelect = container.querySelector("[data-pacing-goal-select]");
  const saveIndicator = container.querySelector("[data-save-indicator]");
  const speechDuration = container.querySelector("[data-speech-duration]");
  const currentWpmLabel = container.querySelector("[data-current-wpm-label]");
  const pacingRatingPill = container.querySelector("[data-pacing-rating-pill]");
  const wordCountEl = container.querySelector("[data-word-count]");
  const charCountEl = container.querySelector("[data-char-count]");
  const scriptsCountEl = container.querySelector("[data-scripts-count]");
  const totalRuntimeEl = container.querySelector("[data-total-runtime]");
  const projNameLabel = container.querySelector("[data-proj-name-label]");
  const publishBtn = container.querySelector("[data-toggle-publish]");
  const searchInput = container.querySelector("[data-scripts-search]");
  const exportMenu = container.querySelector("[data-export-menu]");
  const templateModal = container.querySelector("[data-template-modal]");
  const cutsItemsList = container.querySelector("[data-cuts-items-list]");
  const cutsCountInner = container.querySelector("[data-cuts-count-inner]");
  const cutsCountPill = container.querySelector("[data-cuts-count-pill]");
  const activePlayer = container.querySelector("[data-active-player]");
  const playerEmpty = container.querySelector("[data-player-empty]");
  const activePlayerFrame = container.querySelector("[data-active-player-frame]");
  const activeCutTitle = container.querySelector("[data-active-cut-title]");

  // -------------------------------------------------------------
  // SCRIPTS MANAGEMENT & AUTO-SAVE
  // -------------------------------------------------------------
  function getActiveScript() {
    return scripts.find(s => s.id === activeScriptId) || scripts[0] || null;
  }

  function triggerAutoSave() {
    clearTimeout(autoSaveTimeout);
    saveIndicator.textContent = "Saving…";
    saveIndicator.classList.add("saving");

    autoSaveTimeout = setTimeout(() => {
      const active = getActiveScript();
      if (active) {
        active.title = titleInput.value.trim() || "Untitled Script";
        active.content = editorSurface.innerHTML;
        active.status = statusSelect.value;
        active.folderId = folderSelect.value;
        active.targetPacing = pacingGoalSelect.value;
        active.updatedAt = Date.now();
        saveStorageScripts(projectId, scripts);
        renderScriptsList();
        updateCuesSummary(active.content);
      }
      saveIndicator.textContent = "Saved ✓";
      saveIndicator.classList.remove("saving");
    }, 400);
  }

  function updateMetrics(content = "") {
    const text = (editorSurface.innerText || "").trim();
    const active = getActiveScript();
    const wpm = active?.targetWpm || 135;
    const metrics = calculateSpeechMetrics(text, wpm);

    speechDuration.textContent = metrics.durationFormatted;
    currentWpmLabel.textContent = metrics.targetWpm;
    pacingRatingPill.textContent = metrics.pacingRating;
    pacingRatingPill.className = `pacing-rating-pill \${metrics.pacingClass}`;
    wordCountEl.textContent = `\${metrics.words} word\${metrics.words === 1 ? "" : "s"}`;
    charCountEl.textContent = `\${metrics.chars} character\${metrics.chars === 1 ? "" : "s"}`;

    updateCuesSummary(editorSurface.innerHTML);
    updateExplorerTotalRuntime();
  }

  function updateCuesSummary(html) {
    const cues = parseProductionCues(html);
    const strip = container.querySelector("[data-cues-summary-strip]");
    if (!strip) return;
    strip.innerHTML = `
      <span class="cue-sum-item \${cues.HOOK ? "active" : ""}"><b>\${cues.HOOK}</b> Hook</span>
      <span class="cue-sum-dot">·</span>
      <span class="cue-sum-item \${cues.VO ? "active" : ""}"><b>\${cues.VO}</b> VO</span>
      <span class="cue-sum-dot">·</span>
      <span class="cue-sum-item \${cues.BROLL ? "active" : ""}"><b>\${cues.BROLL}</b> B-Roll</span>
      <span class="cue-sum-dot">·</span>
      <span class="cue-sum-item \${cues.TALENT ? "active" : ""}"><b>\${cues.TALENT}</b> Talent</span>
      <span class="cue-sum-dot">·</span>
      <span class="cue-sum-item \${cues.SFX ? "active" : ""}"><b>\${cues.SFX}</b> SFX</span>
      <span class="cue-sum-dot">·</span>
      <span class="cue-sum-item \${cues.GRAPHIC ? "active" : ""}"><b>\${cues.GRAPHIC}</b> Graphic</span>
      <span class="cue-sum-dot">·</span>
      <span class="cue-sum-item \${cues.CTA ? "active" : ""}"><b>\${cues.CTA}</b> CTA</span>
    `;
  }

  function updateExplorerTotalRuntime() {
    let totalSecs = 0;
    for (const s of scripts) {
      const text = s.content.replace(/<[^>]*>/g, "");
      const m = calculateSpeechMetrics(text, s.targetWpm || 135);
      totalSecs += m.totalSeconds;
    }
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (totalRuntimeEl) {
      totalRuntimeEl.textContent = `\${mins}m \${String(secs).padStart(2, "0")}s speech total`;
    }
  }

  function renderScriptsList() {
    const active = getActiveScript();
    let filtered = scripts;

    // Filter by status
    if (currentFilter !== "all") {
      filtered = filtered.filter(s => s.status.toLowerCase() === currentFilter.toLowerCase());
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q));
    }

    if (scriptsCountEl) scriptsCountEl.textContent = scripts.length;

    if (!filtered.length) {
      scriptsList.innerHTML = `
        <div class="scripts-empty-state">
          <p>No scripts found \${currentFilter !== "all" ? \`in "\${currentFilter}"\` : ""}.</p>
          <button type="button" class="scripts-empty-new-btn" data-new-script-btn>＋ Create Script</button>
        </div>
      `;
      scriptsList.querySelector("[data-new-script-btn]")?.addEventListener("click", () => {
        templateModal.hidden = false;
      });
      return;
    }

    scriptsList.innerHTML = filtered.map(s => {
      const isActive = active && s.id === active.id;
      const text = s.content.replace(/<[^>]*>/g, "");
      const metrics = calculateSpeechMetrics(text, s.targetWpm || 135);
      const totalAttached = (s.attachedAssets?.length || 0) + (s.videoLinks?.length || 0);

      return `
        <article class="script-card-item \${isActive ? "active" : ""}" data-script-id="\${escapeHTML(s.id)}" role="option" aria-selected="\${isActive}">
          <div class="script-card-head">
            <span class="script-status-pill status-\${s.status.toLowerCase()}">\${escapeHTML(s.status)}</span>
            \${s.published ? \`<span class="script-live-tag">● LIVE</span>\` : ""}
            <div class="script-card-actions">
              <button type="button" class="script-action-icon-btn" data-dup-script="\${escapeHTML(s.id)}" title="Duplicate Script">⎘</button>
              <button type="button" class="script-action-icon-btn danger" data-del-script="\${escapeHTML(s.id)}" title="Delete Script">✕</button>
            </div>
          </div>
          <strong class="script-card-title">\${escapeHTML(s.title || "Untitled Script")}</strong>
          <div class="script-card-foot">
            <small class="script-duration-tag">\${metrics.durationFormatted} prompter</small>
            \${totalAttached > 0 ? \`<small class="script-video-badge">\${totalAttached} cut\${totalAttached === 1 ? "" : "s"}</small>\` : ""}
          </div>
        </article>
      `;
    }).join("");

    // Bind card clicks
    scriptsList.querySelectorAll(".script-card-item").forEach(item => {
      item.addEventListener("click", e => {
        if (e.target.closest(".script-action-icon-btn")) return;
        loadScript(item.dataset.scriptId);
      });
    });

    // Bind duplicate
    scriptsList.querySelectorAll("[data-dup-script]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        duplicateScript(btn.dataset.dupScript);
      });
    });

    // Bind delete
    scriptsList.querySelectorAll("[data-del-script]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        deleteScript(btn.dataset.delScript);
      });
    });
  }

  function loadScript(id) {
    activeScriptId = id;
    const active = getActiveScript();
    if (!active) return;

    activeScriptId = active.id;
    titleInput.value = active.title || "";
    statusSelect.value = active.status || "Draft";
    folderSelect.value = active.folderId || "";
    pacingGoalSelect.value = active.targetPacing || "reel_60";
    editorSurface.innerHTML = active.content || "<p></p>";

    updatePublishBtn(active);
    updateMetrics(active.content);
    renderScriptsList();
    renderCutsPanel(active);
    renderShotListPanel(active);
  }

  function duplicateScript(id) {
    const orig = scripts.find(s => s.id === id);
    if (!orig) return;
    const copy = {
      ...orig,
      id: `script_\${projectId}_\${Date.now()}`,
      title: `\${orig.title} (Copy)`,
      published: false,
      publishedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    scripts.unshift(copy);
    saveStorageScripts(projectId, scripts);
    loadScript(copy.id);
  }

  function deleteScript(id) {
    if (scripts.length <= 1) {
      alert("You must keep at least one script in this project.");
      return;
    }
    const target = scripts.find(s => s.id === id);
    if (!confirm(\`Delete "\${target?.title || "this script"}" permanently?\`)) return;
    scripts = scripts.filter(s => s.id !== id);
    saveStorageScripts(projectId, scripts);
    loadScript(scripts[0]?.id);
  }

  function updatePublishBtn(script) {
    if (!script) return;
    const isPub = Boolean(script.published);
    publishBtn.classList.toggle("is-published", isPub);
    publishBtn.textContent = isPub ? "● Published to Showcase" : "Publish to Website";
  }

  // -------------------------------------------------------------
  // PANEL 3: ATTACHED CUTS RENDERING & PLAYER
  // -------------------------------------------------------------
  function renderCutsPanel(script) {
    if (!script) return;
    const attached = script.attachedAssets || [];
    const links = script.videoLinks || [];
    const total = attached.length + links.length;

    if (cutsCountInner) cutsCountInner.textContent = total;
    if (cutsCountPill) cutsCountPill.textContent = total;

    if (!total) {
      cutsItemsList.innerHTML = \`<p class="cuts-empty-note">No video cut or asset attached to this script yet. Use the controls above to attach a project file or external video link.</p>\`;
      if (playerEmpty) playerEmpty.hidden = false;
      if (activePlayer) activePlayer.hidden = true;
      return;
    }

    cutsItemsList.innerHTML = [
      ...attached.map(a => \`
        <div class="cut-item-card" data-cut-type="asset" data-cut-id="\${escapeHTML(a.id)}">
          <span class="cut-icon">Video</span>
          <div class="cut-info">
            <strong title="\${escapeHTML(a.name)}">\${escapeHTML(a.name)}</strong>
            <small>Project Asset · \${formatBytes(a.size)}</small>
          </div>
          <div class="cut-actions">
            \${a.url ? \`<button type="button" class="cut-btn play" data-play-asset="\${escapeHTML(a.id)}">▶ Play</button>\` : ""}
            <button type="button" class="cut-btn del" data-del-asset="\${escapeHTML(a.id)}">✕</button>
          </div>
        </div>
      \`),
      ...links.map(l => \`
        <div class="cut-item-card" data-cut-type="link" data-cut-id="\${escapeHTML(l.id)}">
          <span class="cut-icon">Link</span>
          <div class="cut-info">
            <strong title="\${escapeHTML(l.title || l.url)}">\${escapeHTML(l.title || l.url)}</strong>
            <small>\${escapeHTML(l.platform || "Web Video")}</small>
          </div>
          <div class="cut-actions">
            <button type="button" class="cut-btn play" data-play-link="\${escapeHTML(l.id)}">▶ Play</button>
            <button type="button" class="cut-btn del" data-del-link="\${escapeHTML(l.id)}">✕</button>
          </div>
        </div>
      \`)
    ].join("");

    // Bind item removals
    cutsItemsList.querySelectorAll("[data-del-asset]").forEach(btn => {
      btn.addEventListener("click", () => {
        script.attachedAssets = (script.attachedAssets || []).filter(a => a.id !== btn.dataset.delAsset);
        saveStorageScripts(projectId, scripts);
        renderCutsPanel(script);
        renderScriptsList();
      });
    });

    cutsItemsList.querySelectorAll("[data-del-link]").forEach(btn => {
      btn.addEventListener("click", () => {
        script.videoLinks = (script.videoLinks || []).filter(l => l.id !== btn.dataset.delLink);
        saveStorageScripts(projectId, scripts);
        renderCutsPanel(script);
        renderScriptsList();
      });
    });

    // Bind playback inside side-by-side player column
    cutsItemsList.querySelectorAll("[data-play-asset]").forEach(btn => {
      btn.addEventListener("click", () => {
        const asset = (script.attachedAssets || []).find(a => a.id === btn.dataset.playAsset);
        if (!asset) return;
        playInSidePlayer(asset.name, null, asset.url);
      });
    });

    cutsItemsList.querySelectorAll("[data-play-link]").forEach(btn => {
      btn.addEventListener("click", () => {
        const link = (script.videoLinks || []).find(l => l.id === btn.dataset.playLink);
        if (!link) return;
        const embed = getVideoEmbedUrl(link.url);
        if (embed) {
          playInSidePlayer(link.title || "Video Preview", embed, null);
        } else {
          window.open(link.url, "_blank", "noopener,noreferrer");
        }
      });
    });
  }

  function playInSidePlayer(title, embedUrl, directUrl) {
    if (playerEmpty) playerEmpty.hidden = true;
    if (activePlayer) activePlayer.hidden = false;
    if (activeCutTitle) activeCutTitle.textContent = title;

    if (embedUrl) {
      activePlayerFrame.innerHTML = \`<iframe src="\${embedUrl}?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>\`;
    } else if (directUrl) {
      activePlayerFrame.innerHTML = \`<video controls autoplay playsinline src="\${escapeHTML(directUrl)}"></video>\`;
    }
  }

  container.querySelector("[data-close-player]")?.addEventListener("click", () => {
    if (activePlayer) activePlayer.hidden = true;
    if (playerEmpty) playerEmpty.hidden = false;
    if (activePlayerFrame) activePlayerFrame.innerHTML = "";
  });

  // Attach Project File handler
  container.querySelector("[data-attach-file-btn]")?.addEventListener("click", () => {
    const sel = container.querySelector("[data-select-project-file]");
    const fileId = sel?.value;
    if (!fileId) return;
    const opt = sel.selectedOptions[0];
    const fileName = opt.dataset.fileName || opt.textContent;
    const fileSize = Number(opt.dataset.fileSize || 0);
    const fileType = opt.dataset.fileType || "video";

    const active = getActiveScript();
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
      url: \`/api/uploads?action=download&fileId=\${encodeURIComponent(fileId)}\`
    });
    saveStorageScripts(projectId, scripts);
    renderCutsPanel(active);
    renderScriptsList();
    sel.value = "";
  });

  // Add External Video Link handler
  container.querySelector("[data-add-url-btn]")?.addEventListener("click", () => {
    const input = container.querySelector("[data-video-url-input]");
    const url = input?.value.trim();
    if (!url) return;
    try { new URL(url); } catch {
      alert("Please enter a valid video link (e.g. https://youtube.com/...)");
      return;
    }
    const active = getActiveScript();
    if (!active) return;
    active.videoLinks = active.videoLinks || [];
    const platform = detectVideoPlatform(url);
    active.videoLinks.push({
      id: \`link_\${Date.now()}\`,
      title: \`\${platform} Cut\`,
      url,
      platform
    });
    saveStorageScripts(projectId, scripts);
    renderCutsPanel(active);
    renderScriptsList();
    if (input) input.value = "";
  });

  // -------------------------------------------------------------
  // PANEL 4: SHOT LIST & PRODUCTION CUES RENDERING
  // -------------------------------------------------------------
  function renderShotListPanel(script) {
    const grid = container.querySelector("[data-cues-breakdown-grid]");
    if (!grid || !script) return;

    // Parse scenes and shots
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = script.content;

    const sections = [];
    let currentScene = { title: "Introduction", items: [] };

    for (const child of tempDiv.childNodes) {
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const tag = child.tagName.toLowerCase();
      if (tag === "h1" || tag === "h2") {
        if (currentScene.items.length) {
          sections.push(currentScene);
        }
        currentScene = { title: child.textContent || "Scene", items: [] };
      } else {
        const text = child.textContent.trim();
        if (text) {
          currentScene.items.push({
            html: child.innerHTML,
            text,
            isCue: child.querySelector(".cx-cue") !== null
          });
        }
      }
    }
    if (currentScene.items.length) sections.push(currentScene);

    if (!sections.length) {
      grid.innerHTML = \`<p class="cues-empty-note">No scene headings or cue items found. Use H1 / H2 headings and [VO], [B-ROLL], [TALENT] cue tags in the editor to populate this checklist.</p>\`;
      return;
    }

    grid.innerHTML = sections.map((sec, sIdx) => \`
      <div class="cue-scene-group">
        <header class="cue-scene-head">
          <strong>\${escapeHTML(sec.title)}</strong>
          <small>\${sec.items.length} item\${sec.items.length === 1 ? "" : "s"}</small>
        </header>
        <ul class="cue-scene-checklist">
          \${sec.items.map((it, iIdx) => \`
            <li class="cue-check-item">
              <label class="cue-item-label">
                <input type="checkbox" data-cue-check="\${sIdx}_\${iIdx}">
                <div class="cue-item-snippet">\${it.html}</div>
              </label>
            </li>
          \`).join("")}
        </ul>
      </div>
    \`).join("");
  }

  // Copy Shot List
  container.querySelector("[data-copy-shot-list]")?.addEventListener("click", async e => {
    const active = getActiveScript();
    if (!active) return;
    const text = htmlToMarkdown(active.content);
    try {
      await navigator.clipboard.writeText(\`SHOT LIST CHECKLIST — \${active.title}\\n\\n\${text}\`);
      const btn = e.currentTarget;
      const orig = btn.textContent;
      btn.textContent = "Copied ✓";
      setTimeout(() => { if (btn.isConnected) btn.textContent = orig; }, 1800);
    } catch {
      alert("Could not copy automatically.");
    }
  });

  // Print Checklist
  container.querySelector("[data-print-shot-list]")?.addEventListener("click", () => {
    window.print();
  });

  // -------------------------------------------------------------
  // TAB NAVIGATION
  // -------------------------------------------------------------
  container.querySelectorAll("[data-studio-tab]").forEach(tabBtn => {
    tabBtn.addEventListener("click", () => {
      activeTab = tabBtn.dataset.studioTab;
      container.querySelectorAll("[data-studio-tab]").forEach(b => b.classList.toggle("active", b === tabBtn));
      container.querySelectorAll("[data-panel-view]").forEach(panel => {
        panel.hidden = panel.dataset.panelView !== activeTab;
      });

      // Refresh specific tab contents
      const active = getActiveScript();
      if (activeTab === "cuts") renderCutsPanel(active);
      if (activeTab === "cues") renderShotListPanel(active);
    });
  });

  // -------------------------------------------------------------
  // VIRAL HOOKS INSERTION & FILTERING
  // -------------------------------------------------------------
  container.querySelectorAll("[data-hook-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll("[data-hook-filter]").forEach(b => b.classList.toggle("active", b === btn));
      const cat = btn.dataset.hookFilter;
      container.querySelectorAll("[data-hook-category]").forEach(card => {
        card.hidden = cat !== "all" && card.dataset.hookCategory !== cat;
      });
    });
  });

  container.querySelectorAll("[data-insert-hook]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.insertHook);
      const hook = VIRAL_HOOK_LIBRARY[idx];
      if (!hook) return;

      const hookHtml = \`<h1>Scene 1 · Scroll-Stopping Hook</h1>\\n<p><span class="cx-cue cue-hook">[HOOK]</span> <mark class="cx-hl-orange">\${escapeHTML(hook.example)}</mark></p>\\n\`;

      // Switch back to editor tab
      const editorTabBtn = container.querySelector('[data-studio-tab="editor"]');
      if (editorTabBtn) editorTabBtn.click();

      // Prepend or insert at cursor
      editorSurface.focus();
      try {
        document.execCommand("insertHTML", false, hookHtml);
      } catch {
        editorSurface.innerHTML = hookHtml + editorSurface.innerHTML;
      }
      updateMetrics();
      triggerAutoSave();
    });
  });

  // -------------------------------------------------------------
  // STATUS FILTER PILLS IN EXPLORER
  // -------------------------------------------------------------
  container.querySelectorAll("[data-filter-status]").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll("[data-filter-status]").forEach(b => b.classList.toggle("active", b === btn));
      currentFilter = btn.dataset.filterStatus;
      renderScriptsList();
    });
  });

  // Search filter
  searchInput?.addEventListener("input", () => {
    searchQuery = searchInput.value.trim();
    renderScriptsList();
  });

  // -------------------------------------------------------------
  // TEMPLATE SELECTOR & NEW SCRIPT
  // -------------------------------------------------------------
  const openTemplateModal = () => { templateModal.hidden = false; };
  const closeTemplateModal = () => { templateModal.hidden = true; };

  container.querySelectorAll("[data-new-script-btn]").forEach(b => b.addEventListener("click", openTemplateModal));
  container.querySelector("[data-close-template-modal]")?.addEventListener("click", closeTemplateModal);
  templateModal.addEventListener("click", e => { if (e.target === templateModal) closeTemplateModal(); });

  container.querySelectorAll("[data-pick-template]").forEach(card => {
    card.addEventListener("click", () => {
      const tid = card.dataset.pickTemplate;
      const t = SCRIPT_TEMPLATES.find(x => x.id === tid) || SCRIPT_TEMPLATES[0];

      const newScript = {
        id: \`script_\${projectId}_\${Date.now()}\`,
        projectId,
        folderId: "",
        title: \`\${t.name} Draft\`,
        status: "Draft",
        targetPacing: "reel_60",
        targetWpm: 135,
        attachedAssets: [],
        videoLinks: [],
        published: false,
        publishedAt: null,
        content: t.template,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      scripts.unshift(newScript);
      saveStorageScripts(projectId, scripts);
      closeTemplateModal();

      // Switch back to editor tab
      const editorTabBtn = container.querySelector('[data-studio-tab="editor"]');
      if (editorTabBtn) editorTabBtn.click();

      loadScript(newScript.id);
    });
  });

  // -------------------------------------------------------------
  // SWITCH ACTIVE PROJECT
  // -------------------------------------------------------------
  const projectSelect = container.querySelector("[data-active-project-select]");
  projectSelect?.addEventListener("change", () => {
    const newProjectId = projectSelect.value;
    if (newProjectId === projectId) return;

    const matched = projects.find(p => (p.project_id || p.id) === newProjectId);
    if (!matched) return;

    activeProject = {
      id: matched.project_id || matched.id,
      name: matched.name,
      clientName: matched.clientName
    };
    projectId = activeProject.id;
    if (projNameLabel) projNameLabel.textContent = activeProject.name;

    scripts = getStorageScripts(projectId);
    activeScriptId = scripts[0]?.id || null;
    loadScript(activeScriptId);

    // Update location hash silently so URL reflects project
    if (history.replaceState) {
      history.replaceState(null, "", \`#workspace?project=\${encodeURIComponent(projectId)}&panel=scripts\`);
    }
  });

  // -------------------------------------------------------------
  // FORMATTING TOOLBAR
  // -------------------------------------------------------------
  container.querySelectorAll("[data-cmd]").forEach(btn => {
    btn.addEventListener("click", () => {
      const cmd = btn.dataset.cmd;
      const val = btn.dataset.val || null;
      document.execCommand(cmd, false, val);
      editorSurface.focus();
      updateMetrics();
      triggerAutoSave();
    });
  });

  container.querySelectorAll("[data-highlight]").forEach(btn => {
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
        mark.className = \`cx-hl-\${color}\`;
        try {
          range.surroundContents(mark);
        } catch {
          document.execCommand("hiliteColor", false, color === "orange" ? "#ffedd5" : color === "yellow" ? "#fef08a" : "#bbf7d0");
        }
      }
      editorSurface.focus();
      triggerAutoSave();
    });
  });

  container.querySelectorAll("[data-insert-cue]").forEach(btn => {
    btn.addEventListener("click", () => {
      const cueType = btn.dataset.insertCue;
      const cueClass = \`cue-\${cueType.toLowerCase().replace(/[^a-z]/g, "")}\`;
      const badgeHtml = \`&nbsp;<span class="cx-cue \${cueClass}">[\${cueType}]</span>&nbsp;\`;
      document.execCommand("insertHTML", false, badgeHtml);
      editorSurface.focus();
      updateMetrics();
      triggerAutoSave();
    });
  });

  container.querySelector("[data-insert-divider]")?.addEventListener("click", () => {
    const hrHtml = \`<hr class="script-scene-divider"><br>\`;
    document.execCommand("insertHTML", false, hrHtml);
    editorSurface.focus();
    triggerAutoSave();
  });

  // -------------------------------------------------------------
  // EDITOR EVENT LISTENERS
  // -------------------------------------------------------------
  editorSurface.addEventListener("input", () => {
    updateMetrics();
    triggerAutoSave();
  });
  titleInput.addEventListener("input", triggerAutoSave);
  statusSelect.addEventListener("change", triggerAutoSave);
  folderSelect.addEventListener("change", triggerAutoSave);
  pacingGoalSelect.addEventListener("change", triggerAutoSave);

  // -------------------------------------------------------------
  // FOCUS MODE TOGGLE
  // -------------------------------------------------------------
  const toggleFocusBtn = container.querySelector("[data-toggle-focus]");
  toggleFocusBtn?.addEventListener("click", () => {
    focusMode = !focusMode;
    container.classList.toggle("is-focus-mode", focusMode);
    const icon = container.querySelector("[data-focus-icon]");
    const text = container.querySelector("[data-focus-text]");
    if (icon) icon.textContent = focusMode ? "⤦" : "⤢";
    if (text) text.textContent = focusMode ? "Exit Focus" : "Focus";
  });

  // -------------------------------------------------------------
  // EXPORT MENU & ACTIONS
  // -------------------------------------------------------------
  const toggleExportBtn = container.querySelector("[data-toggle-export-menu]");
  toggleExportBtn?.addEventListener("click", e => {
    e.stopPropagation();
    exportMenu.hidden = !exportMenu.hidden;
  });
  document.addEventListener("click", () => { if (exportMenu) exportMenu.hidden = true; });

  container.querySelector("[data-export-md]")?.addEventListener("click", () => {
    const active = getActiveScript();
    const title = active?.title || "script";
    const md = \`# \${title}\\n\\n\` + htmlToMarkdown(editorSurface.innerHTML);
    downloadBlob(new Blob([md], { type: "text/markdown;charset=utf-8" }), \`\${slugify(title)}.md\`);
  });

  container.querySelector("[data-export-txt]")?.addEventListener("click", () => {
    const active = getActiveScript();
    const title = active?.title || "script";
    const text = \`\${title}\\n\\n\` + (editorSurface.innerText || "");
    downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), \`\${slugify(title)}.txt\`);
  });

  container.querySelector("[data-copy-formatted]")?.addEventListener("click", async e => {
    const text = editorSurface.innerText || "";
    try {
      await navigator.clipboard.writeText(text);
      alert("Script copied to clipboard!");
    } catch {
      alert("Could not copy automatically.");
    }
  });

  container.querySelector("[data-print-script]")?.addEventListener("click", () => {
    window.print();
  });

  // -------------------------------------------------------------
  // PUBLISH TO WEBSITE SHOWCASE
  // -------------------------------------------------------------
  publishBtn.addEventListener("click", () => {
    const active = getActiveScript();
    if (!active) return;
    active.published = !active.published;
    active.publishedAt = active.published ? Date.now() : null;
    saveStorageScripts(projectId, scripts);
    updatePublishBtn(active);
    renderScriptsList();

    if (active.published) {
      openShowcaseModal(active, activeProject);
    }
  });

  // -------------------------------------------------------------
  // TELEPROMPTER LAUNCHER
  // -------------------------------------------------------------
  container.querySelectorAll("[data-launch-teleprompter]").forEach(btn => {
    btn.addEventListener("click", () => {
      const active = getActiveScript();
      if (!active) return;
      openFullscreenTeleprompter(active, (updatedWpm) => {
        active.targetWpm = updatedWpm;
        saveStorageScripts(projectId, scripts);
        updateMetrics();
      });
    });
  });

  // Keyboard shortcut 'F' to launch prompter when not editing text
  const keyHandler = e => {
    if (e.key === "f" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName) && !document.activeElement.isContentEditable) {
      e.preventDefault();
      container.querySelector("[data-launch-teleprompter]")?.click();
    }
  };
  document.addEventListener("keydown", keyHandler);

  // Initial Load
  loadScript(activeScriptId);
}

// -------------------------------------------------------------
// FULLSCREEN HARDWARE-READY TELEPROMPTER
// -------------------------------------------------------------
export function openFullscreenTeleprompter(script, onWpmChange = () => {}) {
  let wpm = Number(script.targetWpm) || 135;
  let fontSize = 42; // px
  let isMirrored = false;
  let isPlaying = false;
  let animFrame = null;
  let lastTimestamp = null;
  let scrollAccumulator = 0;
  let countdownTimer = null;

  const prompter = document.createElement("div");
  prompter.className = "scripts-teleprompter-fullscreen";
  prompter.setAttribute("role", "dialog");
  prompter.setAttribute("aria-label", "Teleprompter");

  // Clean raw text into readable prompter blocks
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = script.content;

  const readableBlocks = [];
  for (const node of tempDiv.childNodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      const text = node.textContent.trim();
      if (!text) continue;
      if (tag === "h1" || tag === "h2") {
        readableBlocks.push(\`<h2 class="prompter-heading">\${escapeHTML(text)}</h2>\`);
      } else {
        readableBlocks.push(\`<p class="prompter-para">\${node.innerHTML}</p>\`);
      }
    }
  }

  prompter.innerHTML = `
    <!-- Top Control Bar -->
    <header class="prompter-control-bar">
      <div class="prompter-bar-left">
        <button type="button" class="prompter-bar-btn close-btn" data-close-prompter title="Exit Teleprompter (Esc)">
          ✕ Exit
        </button>
        <span class="prompter-script-title">\${escapeHTML(script.title)}</span>
      </div>

      <div class="prompter-bar-center">
        <!-- WPM Speed Controller -->
        <div class="prompter-wpm-control">
          <label for="prompter-wpm-slider">Speed: <b data-prompter-wpm-val>\${wpm}</b> WPM</label>
          <input type="range" id="prompter-wpm-slider" min="90" max="240" step="5" value="\${wpm}" data-wpm-slider>
        </div>

        <!-- Font Size Slider -->
        <div class="prompter-font-control">
          <label for="prompter-font-slider">Size: <b data-font-val>\${fontSize}px</b></label>
          <input type="range" id="prompter-font-slider" min="26" max="72" step="2" value="\${fontSize}" data-font-slider>
        </div>

        <!-- Mirror / Glass Mode Toggle -->
        <button type="button" class="prompter-bar-btn toggle-btn" data-toggle-mirror title="Flip text horizontally for teleprompter glass hardware">
          Mirror Mode
        </button>
      </div>

      <div class="prompter-bar-right">
        <div class="prompter-live-timer" data-prompter-timer>00:00</div>
        <button type="button" class="prompter-play-btn" data-toggle-play>
          <span data-play-icon>▶</span> <span data-play-label>Start (Space)</span>
        </button>
        <button type="button" class="prompter-bar-btn" data-restart-prompter title="Restart from Top (R)">
          ↺ Restart
        </button>
      </div>
    </header>

    <!-- Reading Eye-Line Focus Bar -->
    <div class="prompter-eyeline-guide" aria-hidden="true">
      <div class="eyeline-marker left">▲ Focus Eye-Line</div>
      <div class="eyeline-marker right">▲</div>
    </div>

    <!-- Scrolling Text Canvas -->
    <div class="prompter-scroll-viewport" data-prompter-viewport>
      <div class="prompter-scroll-track" data-prompter-track style="font-size:\${fontSize}px;">
        <div class="prompter-padding-top"></div>
        \${readableBlocks.join("")}
        <div class="prompter-padding-bottom"></div>
      </div>
    </div>

    <!-- 3-2-1 Countdown Overlay -->
    <div class="prompter-countdown-overlay" data-countdown-overlay hidden>
      <span class="countdown-number" data-countdown-num>3</span>
    </div>
  `;

  document.body.append(prompter);

  // Elements
  const viewport = prompter.querySelector("[data-prompter-viewport]");
  const track = prompter.querySelector("[data-prompter-track]");
  const playBtn = prompter.querySelector("[data-toggle-play]");
  const playIcon = prompter.querySelector("[data-play-icon]");
  const playLabel = prompter.querySelector("[data-play-label]");
  const wpmSlider = prompter.querySelector("[data-wpm-slider]");
  const wpmVal = prompter.querySelector("[data-prompter-wpm-val]");
  const fontSlider = prompter.querySelector("[data-font-slider]");
  const fontVal = prompter.querySelector("[data-font-val]");
  const mirrorBtn = prompter.querySelector("[data-toggle-mirror]");
  const timerEl = prompter.querySelector("[data-prompter-timer]");
  const countdownOverlay = prompter.querySelector("[data-countdown-overlay]");
  const countdownNum = prompter.querySelector("[data-countdown-num]");

  let startTime = null;
  let elapsedSeconds = 0;
  let timerInterval = null;

  function closePrompter() {
    stopScroll();
    clearInterval(timerInterval);
    clearTimeout(countdownTimer);
    window.removeEventListener("keydown", keyListener);
    prompter.remove();
  }

  prompter.querySelector("[data-close-prompter]").addEventListener("click", closePrompter);

  // WPM Slider
  wpmSlider.addEventListener("input", () => {
    wpm = Number(wpmSlider.value);
    wpmVal.textContent = wpm;
    onWpmChange(wpm);
  });

  // Font Slider
  fontSlider.addEventListener("input", () => {
    fontSize = Number(fontSlider.value);
    fontVal.textContent = `\${fontSize}px`;
    track.style.fontSize = `\${fontSize}px`;
  });

  // Mirror Mode Toggle
  mirrorBtn.addEventListener("click", () => {
    isMirrored = !isMirrored;
    viewport.classList.toggle("is-mirrored", isMirrored);
    mirrorBtn.classList.toggle("active", isMirrored);
  });

  // Auto-scroll loop
  function stepScroll(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const delta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    if (isPlaying) {
      // Calculate speed in px per ms:
      const pxPerSec = (wpm / 60) * (fontSize * 0.72);
      scrollAccumulator += (pxPerSec * delta) / 1000;

      if (scrollAccumulator >= 1) {
        const toScroll = Math.floor(scrollAccumulator);
        viewport.scrollTop += toScroll;
        scrollAccumulator -= toScroll;
      }

      // Stop if reached end
      if (viewport.scrollTop >= viewport.scrollHeight - viewport.clientHeight) {
        pauseScroll();
        return;
      }

      animFrame = requestAnimationFrame(stepScroll);
    }
  }

  function startScroll() {
    isPlaying = true;
    playIcon.textContent = "⏸";
    playLabel.textContent = "Pause (Space)";
    lastTimestamp = null;
    scrollAccumulator = 0;

    if (!timerInterval) {
      startTime = Date.now() - elapsedSeconds * 1000;
      timerInterval = setInterval(() => {
        elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const m = Math.floor(elapsedSeconds / 60);
        const s = elapsedSeconds % 60;
        timerEl.textContent = `\${String(m).padStart(2, "0")}:\${String(s).padStart(2, "0")}`;
      }, 500);
    }

    animFrame = requestAnimationFrame(stepScroll);
  }

  function pauseScroll() {
    isPlaying = false;
    playIcon.textContent = "▶";
    playLabel.textContent = "Resume (Space)";
    cancelAnimationFrame(animFrame);
    clearInterval(timerInterval);
    timerInterval = null;
  }

  function stopScroll() {
    pauseScroll();
    playLabel.textContent = "Start (Space)";
  }

  function restartPrompter() {
    stopScroll();
    viewport.scrollTop = 0;
    elapsedSeconds = 0;
    timerEl.textContent = "00:00";
  }

  prompter.querySelector("[data-restart-prompter]").addEventListener("click", restartPrompter);

  // Play button with 3-2-1 Countdown
  playBtn.addEventListener("click", () => {
    if (isPlaying) {
      pauseScroll();
    } else {
      if (viewport.scrollTop === 0) {
        runCountdown(startScroll);
      } else {
        startScroll();
      }
    }
  });

  function runCountdown(callback) {
    countdownOverlay.hidden = false;
    let count = 3;
    countdownNum.textContent = count;

    countdownTimer = setInterval(() => {
      count--;
      if (count > 0) {
        countdownNum.textContent = count;
      } else {
        clearInterval(countdownTimer);
        countdownOverlay.hidden = true;
        callback();
      }
    }, 700);
  }

  // Keyboard controls
  const keyListener = e => {
    if (e.key === "Escape") {
      e.preventDefault();
      closePrompter();
    } else if (e.code === "Space") {
      e.preventDefault();
      playBtn.click();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      wpm = Math.min(240, wpm + 5);
      wpmSlider.value = wpm;
      wpmVal.textContent = wpm;
      onWpmChange(wpm);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      wpm = Math.max(90, wpm - 5);
      wpmSlider.value = wpm;
      wpmVal.textContent = wpm;
      onWpmChange(wpm);
    } else if (e.key.toLowerCase() === "r") {
      e.preventDefault();
      restartPrompter();
    }
  };
  window.addEventListener("keydown", keyListener);
}

// -------------------------------------------------------------
// BACKWARD COMPATIBLE MODAL WRAPPER
// Keeps legacy openScriptStudioModal working if called elsewhere
// -------------------------------------------------------------
export function openScriptStudioModal(root, initialProject, folders = [], actions = {}, files = [], allProjects = []) {
  const pid = initialProject?.id || initialProject?.project_id || (allProjects && allProjects[0]?.project_id);
  const targetUrl = pid ? `#workspace?project=\${encodeURIComponent(pid)}&panel=scripts` : "#workspace?panel=scripts";
  window.location.hash = targetUrl;
}

// -------------------------------------------------------------
// PUBLIC WEBSITE SHOWCASE MODAL
// -------------------------------------------------------------
export function openShowcaseModal(script, project) {
  const modal = document.createElement("div");
  modal.className = "workspace-modal-backdrop script-showcase-layer";
  const metrics = calculateSpeechMetrics(script.content.replace(/<[^>]*>/g, ""), script.targetWpm || 135);
  const primaryLink = (script.videoLinks || [])[0];
  const primaryAsset = (script.attachedAssets || [])[0];
  const primaryVideoUrl = primaryLink?.url || primaryAsset?.url || null;
  const embedUrl = primaryVideoUrl ? getVideoEmbedUrl(primaryVideoUrl) : null;
  const showcaseLink = `\${window.location.origin}\${window.location.pathname}#workspace?panel=showcase&script=\${encodeURIComponent(script.id)}&project=\${encodeURIComponent(project.id || project.project_id || "default")}`;

  modal.innerHTML = `
    <div class="script-showcase-modal">
      <header class="showcase-header">
        <div class="showcase-header-tag">
          <span class="cx-showcase-pill">CONTENT X · PUBLIC SHOWCASE</span>
          <span class="cx-verified-pill">✓ Verified Production</span>
        </div>
        <button type="button" class="script-studio-close" data-close-showcase aria-label="Close">✕</button>
      </header>
      <div class="showcase-body">
        <div class="showcase-hero">
          <span class="showcase-project-name">Project: \${escapeHTML(project.name)}</span>
          <h2>\${escapeHTML(script.title)}</h2>
          <div class="showcase-meta-row">
            <span><b>\${metrics.durationFormatted}</b> Teleprompter Speaking Duration</span>
            <span><b>\${metrics.words}</b> Words (~\${metrics.targetWpm} WPM)</span>
            <span class="showcase-live-badge">● Published on Website</span>
          </div>
        </div>

        \${primaryVideoUrl ? \`
          <div class="showcase-media-frame">
            \${embedUrl ? \`<iframe src="\${embedUrl}" allowfullscreen></iframe>\` : \`
              <div class="showcase-external-video-card">
                <span class="showcase-play-icon">▶</span>
                <div class="showcase-video-info">
                  <strong>\${escapeHTML(primaryLink?.title || primaryAsset?.name || "Attached Video Cut")}</strong>
                  <small>\${escapeHTML(primaryLink?.platform || "Direct Video")}: \${escapeHTML(primaryVideoUrl)}</small>
                </div>
                <a href="\${escapeHTML(primaryVideoUrl)}" target="_blank" rel="noopener noreferrer" class="workspace-button primary">Watch Cut ↗</a>
              </div>
            \`}
          </div>
        \` : \`
          <div class="showcase-no-media-note">
            <small>Attach a project cut or paste a YouTube / Loom link in Script Studio to embed the video player directly here.</small>
          </div>
        \`}

        <div class="showcase-script-card">
          <div class="showcase-script-head">
            <strong>Hook Breakdown & Production Cues</strong>
            <button type="button" class="workspace-button subtle" data-copy-showcase-text>Copy Script</button>
          </div>
          <div class="showcase-script-content">
            \${script.content}
          </div>
        </div>

        <div class="showcase-share-footer">
          <div class="showcase-share-input-group">
            <input type="text" readonly value="\${showcaseLink}" data-showcase-url-input>
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
