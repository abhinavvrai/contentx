// Content X Script Writing Studio — Full-Screen Studio & Teleprompter
// Features: Full-screen workspace surface, Scene/Shot headings, formatting, color highlights,
// production cues ([HOOK], [VO], [B-ROLL], [TALENT], [SFX], [GRAPHIC], [TRANSITION], [CTA]),
// viral hook matrix library (16 formulas), multi-script templates (PAS, Myth-Buster, 3-Step, etc.),
// full-screen hardware-ready teleprompter with WPM speed/mirror mode/guideline,
// attached video cuts & workspace asset linking with side-by-side review player,
// retention pacing diagnostics, and publish to website showcase.

const SCRIPTS_KEY_PREFIX = "cx_scripts_";

const ICONS = {
  film: `<svg class="studio-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18"/><line x1="7" x2="7" y1="2" y2="22"/><line x1="17" x2="17" y1="2" y2="22"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="2" x2="7" y1="7" y2="7"/><line x1="2" x2="7" y1="17" y2="17"/><line x1="17" x2="22" y1="17" y2="17"/><line x1="17" x2="22" y1="7" y2="7"/></svg>`,
  paperclip: `<svg class="studio-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`,
  link: `<svg class="studio-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  folder: `<svg class="studio-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`,
  sidebar: `<svg class="studio-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/></svg>`,
  play: `<svg class="studio-svg-icon studio-svg-play" viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>`,
  pause: `<svg class="studio-svg-icon" viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
  focusExpand: `<svg class="studio-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>`,
  focusExit: `<svg class="studio-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M10 14l-7 7"/></svg>`,
  locate: `<svg class="studio-svg-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg>`,
  close: `<svg class="studio-svg-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  search: `<svg class="studio-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  moreVertical: `<svg class="studio-svg-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="5" r="1.3" fill="currentColor"/><circle cx="12" cy="19" r="1.3" fill="currentColor"/></svg>`,
  check: `<svg class="studio-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
};

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
  },
  {
    id: "founder_authority",
    name: "60-Second Founder Authority",
    category: "Authority",
    desc: "Build instant domain authority, share an unconventional founder lesson, and drive qualified profile views.",
    template: `<h1>Scene 1 · The Uncomfortable Truth</h1>
<p><span class="cx-cue cue-hook">[HOOK]</span> Most founders waste 20 hours a week on tasks that should be automated or delegated.</p>
<p><span class="cx-cue cue-talent">[TALENT]</span> When we started scaling Content X, I thought doing everything myself was a badge of honour.</p>
<p><span class="cx-cue cue-sfx">[SFX]</span> Sub-bass drop + clock ticking sound.</p>

<h1>Scene 2 · The Pivot Point</h1>
<p><span class="cx-cue cue-broll">[B-ROLL]</span> Split screen showing messy desktop tabs vs clean automated project pipeline.</p>
<p><span class="cx-cue cue-vo">[VO]</span> The second we built a dedicated review workflow, our turnaround dropped from 7 days to 48 hours.</p>

<h2>Shot 2 · The 1 Actionable Takeaway</h2>
<p><span class="cx-cue cue-graphic">[GRAPHIC]</span> "3 Rules of Leverage: Systems > Raw Effort".</p>
<p><span class="cx-cue cue-talent">[TALENT]</span> Build systems before you hire people. Protect your creative focus at all costs.</p>

<h1>Scene 3 · Authority CTA</h1>
<p><span class="cx-cue cue-cta">[CTA]</span> Follow for weekly insights on creative operations and founder workflows.</p>`
  },
  {
    id: "steal_system",
    name: "The 'Steal My System' Blueprint",
    category: "Educational",
    desc: "Give away an entire high-value workflow step-by-step for massive bookmark and share velocity.",
    template: `<h1>Scene 1 · The Generous Hook</h1>
<p><span class="cx-cue cue-hook">[HOOK]</span> <mark class="cx-hl-orange">Steal our exact short-form video workflow that produces 30 reels a month.</mark></p>
<p><span class="cx-cue cue-vo">[VO]</span> We spent 18 months optimizing this so you can set it up in 10 minutes.</p>
<p><span class="cx-cue cue-sfx">[SFX]</span> Whoosh into paper slam.</p>

<h1>Scene 2 · The 4-Part System</h1>
<p><span class="cx-cue cue-graphic">[GRAPHIC]</span> 4-stage pipeline: Ideation → Scripting → Batch Shoot → Edit.</p>
<p><span class="cx-cue cue-talent">[TALENT]</span> Step 1: Never write one script at a time. Batch 8 hooks using our formula matrix on Sunday morning.</p>
<p><span class="cx-cue cue-broll">[B-ROLL]</span> Teleprompter mode scrolling smoothly on phone screen.</p>
<p><span class="cx-cue cue-talent">[TALENT]</span> Step 2: Use an in-browser teleprompter locked at 135 words per minute. Zero memorization required.</p>
<p><span class="cx-cue cue-talent">[TALENT]</span> Step 3: Upload raw files directly to a timestamped review room for 48-hour delivery.</p>

<h1>Scene 3 · Share CTA</h1>
<p><span class="cx-cue cue-cta">[CTA]</span> Save this video so you have the blueprint ready for your next recording day.</p>`
  },
  {
    id: "case_study",
    name: "High-Ticket Client Proof",
    category: "Proof & Case Study",
    desc: "Break down real client metrics, timeline interventions, and tangible revenue outcomes.",
    template: `<h1>Scene 1 · Proof-Led Hook</h1>
<p><span class="cx-cue cue-hook">[HOOK]</span> How this SaaS brand generated 1.2M views with zero paid ads in 60 days.</p>
<p><span class="cx-cue cue-broll">[B-ROLL]</span> Analytics dashboard screen capture with verified engagement figures.</p>
<p><span class="cx-cue cue-sfx">[SFX]</span> Camera shutter + bass pulse.</p>

<h1>Scene 2 · The Baseline Problem</h1>
<p><span class="cx-cue cue-talent">[TALENT]</span> Before working with us, their videos had an average view duration of just 4 seconds.</p>
<p><span class="cx-cue cue-graphic">[GRAPHIC]</span> Old retention graph dropping at 2.4s vs New retention graph holding at 78%.</p>

<h2>Shot 2 · The Strategic Fix</h2>
<p><span class="cx-cue cue-vo">[VO]</span> We removed their 5-second branded intro, replaced talking-head pauses with motion B-roll, and cut pacing to 0.2s transitions.</p>

<h1>Scene 3 · The Conversion CTA</h1>
<p><span class="cx-cue cue-talent">[TALENT]</span> If you want your short-form content to look and convert like this, check the link in our bio.</p>
<p><span class="cx-cue cue-cta">[CTA]</span> Visit contentx.co.in to view our packages.</p>`
  },
  {
    id: "expensive_mistake",
    name: "The Expensive Mistake Teardown",
    category: "Warning & Contrarian",
    desc: "Expose an invisible technical mistake that ruins content reach, with an immediate visual fix.",
    template: `<h1>Scene 1 · High-Stakes Warning</h1>
<p><span class="cx-cue cue-hook">[HOOK]</span> This single audio mistake is driving 60% of your audience away before sentence one.</p>
<p><span class="cx-cue cue-sfx">[SFX]</span> Distorted clipping sound followed by crisp warm voice.</p>

<h1>Scene 2 · The Comparison</h1>
<p><span class="cx-cue cue-broll">[B-ROLL]</span> Audio waveform comparison showing blown out peaks vs balanced -14 LUFS mastering.</p>
<p><span class="cx-cue cue-talent">[TALENT]</span> Viewers will forgive average camera quality, but bad phone audio makes them swipe away instantly.</p>

<h2>Shot 2 · The 2-Click Fix</h2>
<p><span class="cx-cue cue-graphic">[GRAPHIC]</span> Audio equalizer preset overlay: Voice Isolation + Dynamic Compression.</p>
<p><span class="cx-cue cue-vo">[VO]</span> Always normalize your mobile audio to -14 LUFS and roll off frequencies below 80Hz.</p>

<h1>Scene 3 · Bookmark CTA</h1>
<p><span class="cx-cue cue-cta">[CTA]</span> Bookmark this for your next video export so your audio sounds studio-grade.</p>`
  },
  {
    id: "lead_magnet",
    name: "Viral Lead Magnet & Comment Funnel",
    category: "Conversion",
    desc: "Present an irresistible free asset, demonstrate tangible utility, and drive dozens of comment triggers.",
    template: `<h1>Scene 1 · The Asset Tease</h1>
<p><span class="cx-cue cue-hook">[HOOK]</span> Stop paying $99 for viral hook packs. I am giving away our entire internal matrix for free.</p>
<p><span class="cx-cue cue-broll">[B-ROLL]</span> Quick scroll through our 48 categorized hook formulas with examples.</p>
<p><span class="cx-cue cue-sfx">[SFX]</span> Paper slide + chime sound.</p>

<h1>Scene 2 · What's Inside</h1>
<p><span class="cx-cue cue-talent">[TALENT]</span> 48 formulas, retention cues, and the exact teleprompter speeds top creators use to hit 100K+ views.</p>
<p><span class="cx-cue cue-graphic">[GRAPHIC]</span> "48 HOOK FORMULAS · FREE CREATOR DOWNLOAD".</p>

<h2>Shot 2 · Instant Delivery</h2>
<p><span class="cx-cue cue-vo">[VO]</span> Everything is formatted and ready to copy-paste directly into your next video script.</p>

<h1>Scene 3 · The Keyword Trigger</h1>
<p><span class="cx-cue cue-talent">[TALENT]</span> Just comment "SCRIPT" below and my automation will send you the direct link right now.</p>
<p><span class="cx-cue cue-cta">[CTA]</span> Comment "SCRIPT" for instant access.</p>`
  },
  {
    id: "trend_reaction",
    name: "Trend Commentary & Hot Take",
    category: "Viral Hook",
    desc: "Ride an active platform update or industry conversation with a fast, defensible perspective.",
    template: `<h1>Scene 1 · The News Hook</h1>
<p><span class="cx-cue cue-hook">[HOOK]</span> Everyone is freaking out over [Platform/Algorithm Change], but here is what nobody is noticing.</p>
<p><span class="cx-cue cue-sfx">[SFX]</span> News flash ping + digital riser.</p>

<h1>Scene 2 · The Real Meaning</h1>
<p><span class="cx-cue cue-talent">[TALENT]</span> While everyone complains about lower reach, the algorithm is secretly rewarding this 1 format.</p>
<p><span class="cx-cue cue-broll">[B-ROLL]</span> Fast headline overlay montage from tech and creator publications.</p>

<h2>Shot 2 · How To Capitalize</h2>
<p><span class="cx-cue cue-graphic">[GRAPHIC]</span> 30-day trend pivot blueprint.</p>
<p><span class="cx-cue cue-vo">[VO]</span> If you pivot your first 3 seconds right now, you can capture the traffic everyone else is losing.</p>

<h1>Scene 3 · The Debate CTA</h1>
<p><span class="cx-cue cue-talent">[TALENT]</span> Do you think this update helps or hurts creators? Let me know in the comments.</p>
<p><span class="cx-cue cue-cta">[CTA]</span> Share your take below.</p>`
  }
];

export const VIRAL_HOOK_LIBRARY = [
  // 1. CONTRARIAN & PATTERN DISRUPT
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
    category: "Contrarian & Pattern Disrupt",
    title: "The Delete Button",
    formula: "If you still have [Tool/Habit] in your workflow, delete it today.",
    example: "If you still use auto-captions without customizing fonts and safe zones, delete that preset today."
  },
  {
    category: "Contrarian & Pattern Disrupt",
    title: "The Overrated Shortcut",
    formula: "Stop spending $[Amount] on [Hype Solution]. Here is the $0 fix.",
    example: "Stop spending $500 on viral courses. Here is the exact 3-second pacing framework we use for free."
  },
  {
    category: "Contrarian & Pattern Disrupt",
    title: "The Reverse Rule",
    formula: "Do NOT watch this video if you're happy with [Average Result].",
    example: "Do NOT watch this video if you're comfortable getting 300 views per reel for the next 6 months."
  },

  // 2. CURIOSITY & VALUE GAP
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
    example: "99% of creators frame their talking head completely wrong. Here is the 2-inch eye-line rule."
  },
  {
    category: "Curiosity & Value Gap",
    title: "The Secret Weapon",
    formula: "If I lost everything and had to rebuild [Goal] from zero, this is what I would do.",
    example: "If I lost all my followers and had to reach 100K in 90 days, here is my exact 3-reel script framework."
  },
  {
    category: "Curiosity & Value Gap",
    title: "The 3-Second Loop",
    formula: "Watch this video to the end, then watch the first 2 seconds again.",
    example: "Watch this seamless loop until the end, then see if you can spot the hidden frame cut."
  },
  {
    category: "Curiosity & Value Gap",
    title: "The Unfair Advantage",
    formula: "Top [Niche] creators will hate me for exposing this, but...",
    example: "Top video agencies will hate me for exposing this, but here is how we cut edit turnaround down to 48 hours."
  },
  {
    category: "Curiosity & Value Gap",
    title: "The Bookmark Hook",
    formula: "You are going to want to save this video before [Platform] hides it.",
    example: "You are going to want to save this video before you shoot your next 5 talking-head reels."
  },

  // 3. HIGH STAKES & WARNING
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
    category: "High Stakes & Warning",
    title: "The Shadow Drop",
    formula: "If your views suddenly crashed from 20k to 200, check this setting.",
    example: "If your reels suddenly stopped hitting the explore feed, you probably triggered this audio copyright flag."
  },
  {
    category: "High Stakes & Warning",
    title: "The Zero-Conversion Warning",
    formula: "You can get 1 Million views and make $0 if you forget this step.",
    example: "You can get 1 Million views and make zero revenue if your bio CTA isn't anchored in second 45."
  },
  {
    category: "High Stakes & Warning",
    title: "The Algorithm Trap",
    formula: "The algorithm just penalized this 1 common short-form tactic.",
    example: "The algorithm is aggressively downranking repetitive loop bait. Here is the retention structure working now."
  },

  // 4. DATA & PROOF-LED
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
    category: "Data & Proof-Led",
    title: "The $0 to $100K Case Study",
    formula: "The exact [Number]-reel content sequence that generated $[Revenue].",
    example: "The exact 8-reel sequence that generated $120,000 in agency pipeline with organic video."
  },
  {
    category: "Data & Proof-Led",
    title: "The 87% Drop-off Stat",
    formula: "87% of viewers click away at second 4. Here is the waveform fix.",
    example: "Data shows 87% of viewers drop off during breathing pauses. Ripple-delete them to save the cut."
  },
  {
    category: "Data & Proof-Led",
    title: "The Retention A/B Test",
    formula: "We tested the exact same video with 2 different hooks. Here are the numbers.",
    example: "Hook A got 1,400 views. Hook B got 480,000 views. The only difference was 4 words in sentence one."
  },

  // 5. SPEED & ACTIONABLE HOW-TO
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
  },
  {
    category: "Speed & Actionable How-To",
    title: "The 3-Step Velocity Fix",
    formula: "3 quick edits to fix [Common Flaw] in under 60 seconds.",
    example: "3 quick edits in CapCut or Premiere to make flat iPhone video look like cinema glass."
  },
  {
    category: "Speed & Actionable How-To",
    title: "The 5-Minute Scripting Sprint",
    formula: "How to outline an entire week of video content on Sunday morning.",
    example: "Use this 3-cue breakdown to script 7 days of high-retention reels in under 20 minutes."
  },

  // 6. STORY & VULNERABILITY
  {
    category: "Story & Vulnerability",
    title: "The Rock Bottom Confession",
    formula: "6 months ago, I was completely burnt out and ready to quit [Domain].",
    example: "6 months ago, I spent 40 hours editing 1 reel that got 82 views. Here is what I had to unlearn."
  },
  {
    category: "Story & Vulnerability",
    title: "The $10,000 Mistake",
    formula: "I wasted $[Large Amount] on [Asset] so you don't have to.",
    example: "I spent $10,000 on studio cameras and lighting before realizing good audio and hooks drive 90% of views."
  },
  {
    category: "Story & Vulnerability",
    title: "The Uncomfortable Lesson",
    formula: "The hardest lesson I learned after producing [Number] short-form videos.",
    example: "The hardest lesson I learned after editing 1,200 reels: nobody cares about your brand until you solve their problem."
  },
  {
    category: "Story & Vulnerability",
    title: "The 2 AM Realization",
    formula: "It was 2 in the morning when I realized why our content was failing.",
    example: "It was 2 in the morning when I finally saw why our videos were flatlining: we were burying the lead every time."
  },
  {
    category: "Story & Vulnerability",
    title: "The Client Who Was Stuck",
    formula: "This creator was stuck at [Low Metric] for 2 years. Then we changed 1 thing.",
    example: "This founder had 900 followers for 2 years straight. After changing their hook pacing, they hit 50K in 90 days."
  },
  {
    category: "Story & Vulnerability",
    title: "The 'Nobody Believed Me' Arc",
    formula: "Everyone told me [Strategy] was dead. Then we did [Huge Result].",
    example: "Everyone told me talking-head videos were dead in 2026. Then we generated 3.4M views with this format."
  },

  // 7. AUDIENCE CALLOUT & NICHE
  {
    category: "Audience Callout & Niche",
    title: "The Under-10K Creator Hook",
    formula: "If you have under 10,000 followers and want to monetize fast, listen to this.",
    example: "If you have under 10k followers on Instagram, stop trying to go viral and do this high-intent sequence instead."
  },
  {
    category: "Audience Callout & Niche",
    title: "The Solo Founder Hook",
    formula: "If you run a business and film your own content, stop making this pacing error.",
    example: "If you're a founder recording reels on your phone, stop introducing yourself in the first 5 seconds."
  },
  {
    category: "Audience Callout & Niche",
    title: "The Agency / Freelancer Filter",
    formula: "If you charge under $[Amount] for [Service], you need to hear this.",
    example: "If you're charging under $500 for video editing, you're competing in the wrong market. Here is the pivot."
  },
  {
    category: "Audience Callout & Niche",
    title: "The B2B / SaaS Callout",
    formula: "B2B videos do not have to be boring corporate slop. Watch this.",
    example: "B2B SaaS videos don't have to look like a generic webinar. Here is how we make software look addictive."
  },
  {
    category: "Audience Callout & Niche",
    title: "The iPhone Filmmaker Hook",
    formula: "If you shoot your videos on an iPhone, turn off this 1 default setting.",
    example: "If you shoot video on an iPhone, toggle off HDR video right now. Here is why it ruins social uploads."
  },
  {
    category: "Audience Callout & Niche",
    title: "The Local Business Dominator",
    formula: "If you own a local business, you only need [Number] reels to dominate your city.",
    example: "If you run a local clinic or gym, you only need 3 specific videos to outrank every competitor in your town."
  },

  // 8. TRANSFORMATION & TEARDOWN
  {
    category: "Transformation & Teardown",
    title: "The Before vs After Cut",
    formula: "Watch this raw unedited clip... now look at the Content X cut.",
    example: "Here is the raw footage unedited... now watch what happens when we apply retention pacing and sound design."
  },
  {
    category: "Transformation & Teardown",
    title: "The Amateur vs Pro Teardown",
    formula: "Why amateur reels feel slow vs why high-retention reels feel effortless.",
    example: "Amateur editors add random transitions. Pro editors cut on physical action. Watch the side-by-side."
  },
  {
    category: "Transformation & Teardown",
    title: "The $50 vs $500 Reel",
    formula: "What is the actual difference between a cheap edit and a premium motion reel?",
    example: "A $50 edit slaps on generic captions. A $500 edit animates branded typography and curates custom B-roll."
  },
  {
    category: "Transformation & Teardown",
    title: "The Timeline Teardown",
    formula: "Let's deconstruct the highest-performing video in [Niche] second-by-second.",
    example: "Let's deconstruct this 4-million view reel second-by-second: notice the pattern disruption at 00:03."
  },
  {
    category: "Transformation & Teardown",
    title: "The Old Way vs The 2026 Way",
    formula: "The old way: [Outdated Method]. The 2026 way: [Modern Framework].",
    example: "The old way: intro, logo sting, thesis. The 2026 way: micro-pattern disrupt, direct proof, tight rhythm."
  },
  {
    category: "Transformation & Teardown",
    title: "The Retention Curve Save",
    formula: "How we took a video dying at 20% retention and revived it to [Metric]%.",
    example: "How we took a client's cut stuck at 22% watch time and boosted it to 78% completion by cutting the first 4 seconds."
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
                return `<option value="${escapeHTML(pid)}" ${pid === projectId ? "selected" : ""}>${escapeHTML(p.name)}</option>`;
              }).join("") : `<option value="${escapeHTML(projectId)}">${escapeHTML(activeProject.name)}</option>`}
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
            Viral Hooks <b class="tab-count-pill">${VIRAL_HOOK_LIBRARY.length}</b>
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
            <span class="studio-btn-icon">${ICONS.play}</span> Teleprompter
          </button>
          <button type="button" class="scripts-publish-btn" data-toggle-publish title="Publish script & attached cut to website showcase">
            Publish
          </button>

          <div class="scripts-dropdown-wrap scripts-overflow-wrap">
            <button type="button" class="scripts-action-button subtle scripts-overflow-btn" data-toggle-overflow-menu title="More actions" aria-label="More actions">
              <span class="studio-btn-icon">${ICONS.moreVertical}</span>
            </button>
            <div class="scripts-menu-popover scripts-overflow-popover" data-overflow-menu hidden>
              <button type="button" class="scripts-overflow-item" data-toggle-focus title="Toggle Distraction-Free Focus Mode">
                <span data-focus-icon class="studio-btn-icon">${ICONS.focusExpand}</span>
                <span data-focus-text>Focus Mode</span>
              </button>
              <button type="button" class="scripts-overflow-item" data-toggle-top-asset-linker title="Attach or link project footage to script">
                <span class="studio-btn-icon">${ICONS.paperclip}</span>
                <span>Attach Asset…</span>
              </button>
              <button type="button" class="scripts-overflow-item scripts-toggle-assets-panel-btn" data-toggle-linked-panel title="Toggle Linked Footage Panel">
                <span class="studio-btn-icon">${ICONS.film}</span>
                <span>Footage Panel</span>
                <span class="linked-count-badge" data-top-linked-badge>0</span>
              </button>
              <button type="button" class="scripts-overflow-item" data-share-script-link title="Copy public share link to clipboard">
                <span class="studio-btn-icon">${ICONS.link}</span>
                <span>Share Link</span>
              </button>
              <button type="button" class="scripts-overflow-item" data-send-to-project title="Send or link script to a project">
                <span class="studio-btn-icon">${ICONS.folder}</span>
                <span>Send to Project…</span>
              </button>
              <div class="scripts-overflow-divider"></div>
              <div class="scripts-overflow-section-label">EXPORT SCRIPT</div>
              <button type="button" class="scripts-overflow-item" data-export-md><span class="export-badge">.MD</span> <b>Markdown Document</b></button>
              <button type="button" class="scripts-overflow-item" data-export-txt><span class="export-badge">.TXT</span> <b>Plain Text File</b></button>
              <button type="button" class="scripts-overflow-item" data-copy-formatted><span class="export-badge">COPY</span> <b>Copy to Clipboard</b></button>
              <button type="button" class="scripts-overflow-item" data-print-script><span class="export-badge">PDF</span> <b>Print / PDF Export</b></button>
            </div>
          </div>

          <div class="scripts-menu-popover scripts-assets-popover scripts-top-assets-popover" data-top-assets-popover hidden>
            <div class="assets-popover-head">
              <div class="assets-head-title-row">
                <small>PROJECT FOOTAGE &amp; FOLDERS</small>
              </div>
              <input type="search" placeholder="Search all project files…" class="assets-filter-input" data-top-assets-filter-input>
              <div class="assets-breadcrumb-bar" data-top-assets-breadcrumbs>
                <span class="crumb-active"><span class="studio-inline-svg">${ICONS.folder}</span> All Files</span>
              </div>
            </div>
            <div class="assets-popover-list scripts-assets-popover-list" data-top-assets-popover-list></div>
          </div>
        </div>
      </header>

      <!-- Main Surface Grid: Studio Stage -->
      <div class="scripts-surface-main">
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
                    ${folders.map(f => `<option value="${escapeHTML(f.id)}">${escapeHTML(f.name)}</option>`).join("")}
                  </select>
                </div>
              </div>
              <div class="scripts-save-badge" data-save-indicator>Saved ✓</div>
            </div>

            <!-- Formatting & Cue Ribbon -->
            <div class="scripts-format-ribbon" role="toolbar" aria-label="Text Formatting & Cues">
              <div class="format-group">
                <select class="scripts-ribbon-select" data-format-block-select aria-label="Text style">
                  <option value="P">¶ Body Text</option>
                  <option value="H1">H1 Scene Heading</option>
                  <option value="H2">H2 Shot / Beat</option>
                  <option value="H3">H3 Sub-shot</option>
                </select>
              </div>

              <div class="format-group">
                <select class="scripts-ribbon-select scripts-font-select" data-format-font-select aria-label="Font family" title="Change font for selection or heading">
                  <option value="inherit">Font: Default</option>
                  <option value="'Geist', -apple-system, sans-serif">Geist Sans</option>
                  <option value="'Instrument Serif', Georgia, serif">Instrument Serif</option>
                  <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                  <option value="'Syne', sans-serif">Syne Display</option>
                  <option value="'Inter', -apple-system, sans-serif">Inter</option>
                </select>
              </div>

              <div class="format-sep"></div>

              <div class="format-group">
                <button type="button" class="scripts-format-btn" data-cmd="bold" title="Bold (Ctrl+B)"><b>B</b></button>
                <button type="button" class="scripts-format-btn" data-cmd="italic" title="Italic (Ctrl+I)"><i>I</i></button>
              </div>

              <div class="format-sep"></div>

              <div class="format-group">
                <div class="scripts-dropdown-wrap">
                  <button type="button" class="scripts-ribbon-btn scripts-attach-asset-btn" data-toggle-asset-linker title="Link uploaded project footage or file to selected line">
                    <span class="studio-btn-icon">${ICONS.paperclip}</span> <span>Link Asset ▾</span>
                  </button>
                  <div class="scripts-menu-popover scripts-assets-popover" data-assets-popover hidden>
                    <div class="assets-popover-head">
                      <div class="assets-head-title-row">
                        <small>PROJECT FOOTAGE &amp; FOLDERS</small>
                      </div>
                      <input type="search" placeholder="Search all project files…" class="assets-filter-input" data-assets-filter-input>
                      <div class="assets-breadcrumb-bar" data-assets-breadcrumbs>
                        <span class="crumb-active"><span class="studio-inline-svg">${ICONS.folder}</span> All Files</span>
                      </div>
                    </div>
                    <div class="assets-popover-list scripts-assets-popover-list" data-assets-popover-list></div>
                  </div>
                </div>
                <button type="button" class="scripts-format-btn" data-cmd-link title="Attach URL Link (Ctrl+K)">
                  <span class="studio-btn-icon">${ICONS.link}</span>
                </button>
              </div>

              <div class="format-sep"></div>

              <div class="format-group scripts-cue-chips-row" role="group" aria-label="Production Cues">
                <button type="button" class="cue-btn cue-hook" data-insert-cue="HOOK" title="Insert Scroll-Stopping Hook Cue">＋ Hook</button>
                <button type="button" class="cue-chip-btn cue-vo" data-insert-cue="VO" title="Insert Voiceover Cue">[VO]</button>
                <button type="button" class="cue-chip-btn cue-broll" data-insert-cue="B-ROLL" title="Insert B-Roll Cut">[B-ROLL]</button>
                <button type="button" class="cue-chip-btn cue-talent" data-insert-cue="TALENT" title="Insert On-Camera Talent">[TALENT]</button>
                <button type="button" class="cue-chip-btn cue-sfx" data-insert-cue="SFX" title="Insert Sound FX Cue">[SFX]</button>
                <button type="button" class="cue-chip-btn cue-graphic" data-insert-cue="GRAPHIC" title="Insert Motion Graphic Cue">[GRAPHIC]</button>
                <button type="button" class="cue-chip-btn cue-cta" data-insert-cue="CTA" title="Insert Call-To-Action">[CTA]</button>
              </div>

              <div class="format-sep"></div>

              <!-- More Options Dropdown Menu -->
              <div class="format-group">
                <div class="scripts-dropdown-wrap">
                  <button type="button" class="scripts-ribbon-btn scripts-more-btn" data-toggle-more-menu title="More formatting tools & cues">
                    <span>••• More ▾</span>
                  </button>
                  <div class="scripts-menu-popover scripts-more-popover" data-more-menu hidden>
                    <div class="more-popover-section">
                      <small>TEXT FORMATTING</small>
                      <button type="button" class="more-item-btn" data-cmd="underline">
                        <u>U</u> <span>Underline (Ctrl+U)</span>
                      </button>
                    </div>

                    <div class="more-popover-section">
                      <small>HIGHLIGHT COLOR</small>
                      <div class="hl-popover-colors">
                        <button type="button" class="hl-btn hl-orange" data-highlight="orange" title="Orange Highlight"></button>
                        <button type="button" class="hl-btn hl-yellow" data-highlight="yellow" title="Attention Yellow"></button>
                        <button type="button" class="hl-btn hl-green" data-highlight="green" title="Emerald Green"></button>
                        <button type="button" class="hl-btn hl-cyan" data-highlight="cyan" title="Sky Cyan"></button>
                        <button type="button" class="hl-btn hl-purple" data-highlight="purple" title="Electric Purple"></button>
                      </div>
                      <button type="button" class="hl-clear-btn" data-highlight="clear">Clear Highlight</button>
                    </div>

                    <div class="more-popover-section">
                      <small>PRODUCTION CUES</small>
                      <div class="more-cues-grid">
                        <button type="button" data-insert-cue="VO"><span class="cx-cue cue-vo">[VO]</span> Voiceover</button>
                        <button type="button" data-insert-cue="B-ROLL"><span class="cx-cue cue-broll">[B-ROLL]</span> B-Roll Cut</button>
                        <button type="button" data-insert-cue="TALENT"><span class="cx-cue cue-talent">[TALENT]</span> Talent</button>
                        <button type="button" data-insert-cue="SFX"><span class="cx-cue cue-sfx">[SFX]</span> Sound FX</button>
                        <button type="button" data-insert-cue="GRAPHIC"><span class="cx-cue cue-graphic">[GRAPHIC]</span> Graphic</button>
                        <button type="button" data-insert-cue="TRANSITION"><span class="cx-cue cue-transition">[TRANSITION]</span> Wipe/Cut</button>
                        <button type="button" data-insert-cue="CTA"><span class="cx-cue cue-cta">[CTA]</span> Call-To-Action</button>
                      </div>
                    </div>

                    <div class="more-popover-section">
                      <button type="button" class="more-item-btn" data-insert-divider>
                        <span>──</span> <span>Insert Scene Break Divider</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Editor & Linked Footage Workspace -->
            <div class="scripts-editor-workspace" data-editor-workspace>
              <!-- Editable Surface -->
              <div class="scripts-canvas-container" data-canvas-container>
                <div class="scripts-canvas-content" contenteditable="true" spellcheck="true" role="textbox" aria-multiline="true" data-editor-surface placeholder="Type your script, hook breakdown, or paste text here…"></div>
              </div>

              <!-- Right-Side Linked Assets Preview Sidebar -->
              <aside class="scripts-linked-sidebar" data-linked-assets-sidebar>
                <header class="linked-sidebar-head">
                  <div class="linked-sidebar-title">
                    <span class="linked-title-icon">${ICONS.film}</span>
                    <strong>Linked Footage</strong>
                    <span class="linked-count-badge" data-linked-badge>0</span>
                  </div>
                  <button type="button" class="linked-collapse-btn" data-toggle-linked-panel title="Toggle linked assets sidebar">${ICONS.sidebar}</button>
                </header>

                <!-- Embedded Video Preview Screen -->
                <div class="linked-preview-container" data-linked-preview-container hidden>
                  <div class="linked-preview-head">
                    <span class="preview-dot">●</span>
                    <span class="preview-cut-name" data-linked-preview-name>Preview</span>
                    <button type="button" class="preview-close-icon" data-close-linked-preview title="Close preview">${ICONS.close}</button>
                  </div>
                  <div class="linked-preview-screen" data-linked-preview-screen></div>
                </div>

                <!-- Linked Assets Items List -->
                <div class="linked-sidebar-list" data-linked-sidebar-list>
                  <div class="linked-assets-empty">
                    <span class="linked-empty-icon">${ICONS.film}</span>
                    <p>No project footage linked</p>
                    <small>Place your cursor anywhere in the script and click <b>Attach Asset</b> above to attach footage directly to script lines.</small>
                  </div>
                </div>
              </aside>
            </div>

            <!-- Diagnostics & Pacing Teleprompter Footer -->
            <footer class="scripts-pacing-bar">
              <div class="pacing-metrics-left">
                <div class="pacing-timer-box">
                  <span class="pacing-icon"></span>
                  <strong class="pacing-duration" data-speech-duration>00:00</strong>
                  <span class="pacing-sep">·</span>
                  <span class="pacing-stat" data-word-count>0 words</span>
                  <span class="pacing-sep">·</span>
                  <span class="pacing-wpm" data-current-wpm-label>135 WPM</span>
                </div>
                <div class="pacing-rating-pill" data-pacing-rating-pill>Optimal Short-Form (&lt;45s)</div>

                <!-- Visual Retention Timeline Funnel -->
                <div class="pacing-timeline-funnel" data-pacing-funnel title="Viewer retention pacing zones (0-3s hook, 3-15s setup, 15-45s value, 45s+ cta)">
                  <div class="funnel-segment seg-hook" style="width: 20%;" title="0-3s Hook Zone: Immediate retention hook"><span>0-3s Hook</span></div>
                  <div class="funnel-segment seg-setup" style="width: 35%;" title="3-15s Setup: Core premise"><span>3-15s Setup</span></div>
                  <div class="funnel-segment seg-payoff" style="width: 30%;" title="15-45s Payoff: Demonstration"><span>15-45s Value</span></div>
                  <div class="funnel-segment seg-cta" style="width: 15%;" title="45s+ CTA: Call to action"><span>CTA</span></div>
                  <div class="funnel-needle" data-funnel-needle style="left: 0%;"></div>
                </div>

                <!-- Live Hook Strength Score Badge -->
                <div class="hook-score-badge score-empty" data-hook-score-badge title="First sentence hook score (0-100) based on brevity, power keywords, and curiosity punchiness">
                  <span class="hook-score-label">Hook Score:</span>
                  <strong class="hook-score-val" data-hook-score-val>--</strong>
                </div>
              </div>

              <div class="pacing-metrics-right">
                <div class="scripts-dropdown-wrap">
                  <button type="button" class="scripts-action-button subtle scripts-adjust-layout-btn" data-toggle-layout-menu title="Adjust Editor Layout & Display">
                    Adjust Layout ▾
                  </button>
                  <div class="scripts-menu-popover scripts-layout-popover" data-layout-menu hidden>
                    <div class="layout-popover-group">
                      <small>Editor Width</small>
                      <div class="layout-btn-row" role="group" aria-label="Editor Width">
                        <button type="button" data-set-width="680px">Compact</button>
                        <button type="button" class="active" data-set-width="820px">Standard</button>
                        <button type="button" data-set-width="1000px">Wide</button>
                        <button type="button" data-set-width="100%">Full</button>
                      </div>
                    </div>
                    <div class="layout-popover-group">
                      <small>Font Size</small>
                      <div class="layout-btn-row" role="group" aria-label="Font Size">
                        <button type="button" data-set-size="14px">Small</button>
                        <button type="button" class="active" data-set-size="15.5px">Normal</button>
                        <button type="button" data-set-size="18px">Large</button>
                      </div>
                    </div>
                    <div class="layout-popover-group">
                      <small>Reading Speed</small>
                      <div class="layout-btn-row" role="group" aria-label="Reading Speed">
                        <button type="button" data-set-wpm="120">120 WPM</button>
                        <button type="button" class="active" data-set-wpm="135">135 WPM</button>
                        <button type="button" data-set-wpm="150">150 WPM</button>
                      </div>
                    </div>
                    <div class="layout-popover-group">
                      <small>Explorer Sidebar</small>
                      <div class="layout-btn-row" role="group" aria-label="Sidebar">
                        <button type="button" data-toggle-sidebar-view>Toggle Sidebar</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </section>

          <!-- PANEL 2: VIRAL HOOK MATRIX -->
          <section class="scripts-panel-view scripts-hooks-view" data-panel-view="hooks" hidden>
            <div class="hooks-view-head">
              <div class="hooks-head-intro">
                <h3>Viral Hook & Formula Library</h3>
                <p>48 battle-tested short-form hook formulas engineered for maximum 3-second retention. Click <b>Insert into Script</b> to drop any hook directly into your document, or <b>Copy</b> to use anywhere.</p>
              </div>

              <!-- Live Search & Match Counter -->
              <div class="hooks-search-row">
                <div class="hooks-search-input-wrap">
                  <span class="hooks-search-icon">${ICONS.search}</span>
                  <input type="search" class="hooks-search-input" data-hook-search-input placeholder="Search formulas, examples, or keywords (e.g., 'secret', 'stop', 'mistake', 'money')…">
                </div>
                <span class="hooks-match-count" data-hooks-match-count>${VIRAL_HOOK_LIBRARY.length} formulas available</span>
              </div>

              <!-- AI Smart Hook Generator Card -->
              <div class="smart-hook-generator-card" data-hook-generator>
                <div class="generator-card-left">
                  <span class="gen-sparkle-icon">✨</span>
                  <div>
                    <strong>Instant Viral Hook Generator</strong>
                    <small>Enter your video topic or niche to generate 3 tailored viral hook angles instantly.</small>
                  </div>
                </div>
                <div class="generator-card-inputs">
                  <input type="text" class="gen-topic-input" data-gen-topic-input placeholder="e.g., Real Estate investing, B2B SaaS, Fitness fat loss…">
                  <button type="button" class="scripts-action-button primary gen-submit-btn" data-gen-submit-btn>Generate Hooks ⚡</button>
                </div>
                <div class="generator-results" data-gen-results-area hidden></div>
              </div>
              <div class="hooks-filter-row">
                <button type="button" class="hook-cat-btn active" data-hook-filter="all">All Formulas (${VIRAL_HOOK_LIBRARY.length})</button>
                <button type="button" class="hook-cat-btn" data-hook-filter="Contrarian & Pattern Disrupt">Contrarian</button>
                <button type="button" class="hook-cat-btn" data-hook-filter="Curiosity & Value Gap">Curiosity Gap</button>
                <button type="button" class="hook-cat-btn" data-hook-filter="High Stakes & Warning">High Stakes</button>
                <button type="button" class="hook-cat-btn" data-hook-filter="Data & Proof-Led">Data & Proof</button>
                <button type="button" class="hook-cat-btn" data-hook-filter="Speed & Actionable How-To">Speed / How-To</button>
                <button type="button" class="hook-cat-btn" data-hook-filter="Story & Vulnerability">Story</button>
                <button type="button" class="hook-cat-btn" data-hook-filter="Audience Callout & Niche">Audience Callout</button>
                <button type="button" class="hook-cat-btn" data-hook-filter="Transformation & Teardown">Transformation</button>
              </div>
            </div>
            <div class="hooks-grid" data-hooks-grid>
              ${VIRAL_HOOK_LIBRARY.map((hook, idx) => `
                <article class="hook-card" data-hook-category="${escapeHTML(hook.category)}" data-hook-index="${idx}">
                  <header class="hook-card-header">
                    <span class="hook-category-badge">${escapeHTML(hook.category)}</span>
                    <strong class="hook-card-title">${escapeHTML(hook.title)}</strong>
                  </header>
                  <div class="hook-card-body">
                    <div class="hook-formula-box">
                      <small>STRUCTURE</small>
                      <p>${escapeHTML(hook.formula)}</p>
                    </div>
                    <div class="hook-example-box">
                      <small>EXAMPLE</small>
                      <p>“${escapeHTML(hook.example)}”</p>
                    </div>
                  </div>
                  <footer class="hook-card-footer">
                    <button type="button" class="hook-copy-btn" data-copy-hook="${idx}" title="Copy formula and example">
                      📋 Copy
                    </button>
                    <button type="button" class="hook-insert-btn" data-insert-hook="${idx}">
                      ＋ Insert into Script
                    </button>
                  </footer>
                </article>
              `).join("")}
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
                ${files && files.length ? `
                  <select class="cuts-file-select" data-select-project-file>
                    <option value="">＋ Link Project File...</option>
                    ${files.map(f => `<option value="${escapeHTML(f.id)}" data-file-name="${escapeHTML(f.name)}" data-file-size="${f.size || 0}" data-file-type="${escapeHTML(f.type || "")}">${escapeHTML(f.name)} (${formatBytes(f.size || 0)})</option>`).join("")}
                  </select>
                  <button type="button" class="cuts-attach-btn" data-attach-file-btn>Attach File</button>
                ` : ""}
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
                  <span class="studio-btn-icon">${ICONS.play}</span>
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
                <button type="button" class="scripts-action-button subtle" data-reset-cues-check title="Reset all checklist checkmarks">Reset Checks</button>
                <button type="button" class="scripts-action-button subtle" data-copy-shot-list>Copy Shot List</button>
                <button type="button" class="scripts-action-button subtle" data-print-shot-list>Print Checklist</button>
              </div>
            </div>

            <!-- Shooting Progress & Category Filter -->
            <div class="cues-progress-card">
              <div class="cues-progress-info">
                <span class="cues-progress-label">Shooting Progress:</span>
                <strong class="cues-progress-counter" data-cues-progress-counter>0 of 0 cues filmed (0%)</strong>
              </div>
              <div class="cues-progress-bar-track">
                <div class="cues-progress-bar-fill" data-cues-progress-bar style="width: 0%;"></div>
              </div>
              <div class="cues-filter-pills" role="group" aria-label="Filter cues by type">
                <button type="button" class="cue-filter-pill active" data-cues-filter="all">All Items</button>
                <button type="button" class="cue-filter-pill" data-cues-filter="HOOK">Hook</button>
                <button type="button" class="cue-filter-pill" data-cues-filter="VO">VO</button>
                <button type="button" class="cue-filter-pill" data-cues-filter="B-ROLL">B-Roll</button>
                <button type="button" class="cue-filter-pill" data-cues-filter="TALENT">Talent</button>
                <button type="button" class="cue-filter-pill" data-cues-filter="SFX">SFX</button>
                <button type="button" class="cue-filter-pill" data-cues-filter="GRAPHIC">Graphic</button>
                <button type="button" class="cue-filter-pill" data-cues-filter="CTA">CTA</button>
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
            ${SCRIPT_TEMPLATES.map(t => `
              <div class="template-pick-card" data-pick-template="${t.id}">
                <div class="template-pick-head">
                  <span class="template-cat-pill">${escapeHTML(t.category)}</span>
                  <strong>${escapeHTML(t.name)}</strong>
                </div>
                <p>${escapeHTML(t.desc)}</p>
                <button type="button" class="template-use-btn">Use Template →</button>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    </div>
  `;

  // -------------------------------------------------------------
  // DOM ELEMENT REFERENCES
  // -------------------------------------------------------------
  const shell = container.closest(".workspace-shell") || document;
  const scriptsList = shell.querySelector("[data-scripts-list], [data-workspace-scripts-list], .workspace-scripts-list, .scripts-nav-list") || container.querySelector("[data-scripts-list], [data-workspace-scripts-list], .workspace-scripts-list, .scripts-nav-list");
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
  const scriptsCountEl = shell.querySelector("[data-scripts-count], [data-scripts-count-label], .scripts-count-label") || container.querySelector("[data-scripts-count], [data-scripts-count-label], .scripts-count-label");
  const totalRuntimeEl = shell.querySelector("[data-total-runtime], .scripts-total-runtime") || container.querySelector("[data-total-runtime], .scripts-total-runtime");
  const projNameLabel = shell.querySelector("[data-proj-name-label]") || container.querySelector("[data-proj-name-label]");
  const publishBtn = container.querySelector("[data-toggle-publish]");
  const searchInput = shell.querySelector("[data-scripts-search]") || container.querySelector("[data-scripts-search]");
  const exportMenu = container.querySelector("[data-export-menu]");
  const templateModal = container.querySelector("[data-template-modal]");
  const cutsItemsList = container.querySelector("[data-cuts-items-list]");
  const cutsCountInner = container.querySelector("[data-cuts-count-inner]");
  const cutsCountPill = container.querySelector("[data-cuts-count-pill]");
  const activePlayer = container.querySelector("[data-active-player]");
  const playerEmpty = container.querySelector("[data-player-empty]");
  const activePlayerFrame = container.querySelector("[data-active-player-frame]");
  const activeCutTitle = container.querySelector("[data-active-cut-title]");
  const fontSelect = container.querySelector("[data-format-font-select]");
  const cmdLinkBtn = container.querySelector("[data-cmd-link]");
  const assetLinkerBtn = container.querySelector("[data-toggle-asset-linker]");
  const assetsPopover = container.querySelector("[data-assets-popover]");
  const assetsFilterInput = container.querySelector("[data-assets-filter-input]");
  const assetsList = container.querySelector("[data-assets-popover-list]");
  const assetsBreadcrumbs = container.querySelector("[data-assets-breadcrumbs]");

  const topAssetLinkerBtn = container.querySelector("[data-toggle-top-asset-linker]");
  const topAssetsPopover = container.querySelector("[data-top-assets-popover]");
  const topAssetsFilterInput = container.querySelector("[data-top-assets-filter-input]");
  const topAssetsList = container.querySelector("[data-top-assets-popover-list]");
  const topAssetsBreadcrumbs = container.querySelector("[data-top-assets-breadcrumbs]");

  const moreMenuBtn = container.querySelector("[data-toggle-more-menu]");
  const moreMenu = container.querySelector("[data-more-menu]");
  const overflowMenuBtn = container.querySelector("[data-toggle-overflow-menu]");
  const overflowMenu = container.querySelector("[data-overflow-menu]");
  const shareScriptLinkBtn = container.querySelector("[data-share-script-link]");
  const sendToProjectBtn = container.querySelector("[data-send-to-project]");
  const linkedSidebar = container.querySelector("[data-linked-assets-sidebar]");
  const linkedBadge = container.querySelector("[data-linked-badge]");
  const topLinkedBadge = container.querySelector("[data-top-linked-badge]");
  const linkedPreviewContainer = container.querySelector("[data-linked-preview-container]");
  const linkedPreviewScreen = container.querySelector("[data-linked-preview-screen]");
  const linkedPreviewName = container.querySelector("[data-linked-preview-name]");
  const linkedClosePreview = container.querySelector("[data-close-linked-preview]");
  const linkedSidebarList = container.querySelector("[data-linked-sidebar-list]");
  const toggleLinkedPanelBtns = container.querySelectorAll("[data-toggle-linked-panel]");

  if (typeof window !== "undefined" && window.innerWidth <= 768 && linkedSidebar) {
    linkedSidebar.classList.add("is-collapsed");
    toggleLinkedPanelBtns.forEach(btn => btn.classList.add("is-collapsed"));
  }

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
        renderLinkedAssetsSidebar(active);
        updateCuesSummary(active.content);
      }
      saveIndicator.textContent = "Saved ✓";
      saveIndicator.classList.remove("saving");
    }, 400);
  }

  function calculateHookScore(text = "") {
    if (!text.trim()) return { score: 0, rating: "Empty", class: "score-empty", firstSentence: "" };
    const firstSentence = text.split(/[.!?\n]/)[0]?.trim() || "";
    const words = firstSentence.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    if (wordCount === 0) return { score: 0, rating: "Empty", class: "score-empty", firstSentence: "" };

    let score = 50;
    if (wordCount >= 4 && wordCount <= 14) score += 25;
    else if (wordCount > 14 && wordCount <= 22) score += 10;
    else if (wordCount > 22) score -= 15;
    else if (wordCount < 4) score -= 10;

    const hookPowerKeywords = [
      "stop", "secret", "never", "nobody", "why", "how", "warning", "mistake", "truth",
      "hack", "trick", "worst", "best", "revealed", "proof", "insane", "million", "dollar",
      "money", "don't", "before", "instead", "real reason", "this is why", "if you", "you need"
    ];
    const lowerFirst = firstSentence.toLowerCase();
    let matchedPower = 0;
    for (const kw of hookPowerKeywords) {
      if (lowerFirst.includes(kw)) matchedPower++;
    }
    score += Math.min(25, matchedPower * 10);
    if (firstSentence.includes("?") || firstSentence.includes("!")) score += 5;

    score = Math.max(15, Math.min(99, score));
    let rating = "Fair";
    let cls = "score-fair";
    if (score >= 80) { rating = "Viral Tier 🔥"; cls = "score-high"; }
    else if (score >= 60) { rating = "Strong ⚡"; cls = "score-good"; }
    else { rating = "Weak Hook"; cls = "score-weak"; }

    return { score, rating, class: cls, firstSentence };
  }

  function updateMetrics(content = "") {
    const text = (editorSurface.innerText || "").trim();
    const active = getActiveScript();
    const wpm = active?.targetWpm || 135;
    const metrics = calculateSpeechMetrics(text, wpm);

    if (speechDuration) speechDuration.textContent = metrics.durationFormatted;
    if (currentWpmLabel) currentWpmLabel.textContent = `${metrics.targetWpm} WPM`;
    if (pacingRatingPill) {
      pacingRatingPill.textContent = metrics.pacingRating;
      pacingRatingPill.className = `pacing-rating-pill ${metrics.pacingClass}`;
    }
    if (wordCountEl) wordCountEl.textContent = `${metrics.words} word${metrics.words === 1 ? "" : "s"}`;
    if (charCountEl) charCountEl.textContent = `${metrics.chars} character${metrics.chars === 1 ? "" : "s"}`;

    const hookScoreEl = container.querySelector("[data-hook-score-val]");
    const hookBadge = container.querySelector("[data-hook-score-badge]");
    const funnelNeedle = container.querySelector("[data-funnel-needle]");
    if (hookScoreEl) {
      const hookData = calculateHookScore(text);
      hookScoreEl.textContent = hookData.score ? `${hookData.score}/100` : "--";
      if (hookBadge) {
        hookBadge.className = `hook-score-badge ${hookData.class}`;
        hookBadge.title = hookData.firstSentence ? `Hook: "${hookData.firstSentence}" — Rating: ${hookData.rating}` : "No hook detected";
      }
    }
    if (funnelNeedle) {
      const pct = Math.min(100, Math.max(0, (metrics.seconds / 60) * 100));
      funnelNeedle.style.left = `${pct}%`;
    }

    updateCuesSummary(editorSurface.innerHTML);
    updateExplorerTotalRuntime();
  }

  function updateCuesSummary(html) {
    const cues = parseProductionCues(html);
    const strip = container.querySelector("[data-cues-summary-strip]");
    if (!strip) return;
    strip.innerHTML = `
      <span class="cue-sum-item ${cues.HOOK ? "active" : ""}"><b>${cues.HOOK}</b> Hook</span>
      <span class="cue-sum-dot">·</span>
      <span class="cue-sum-item ${cues.VO ? "active" : ""}"><b>${cues.VO}</b> VO</span>
      <span class="cue-sum-dot">·</span>
      <span class="cue-sum-item ${cues.BROLL ? "active" : ""}"><b>${cues.BROLL}</b> B-Roll</span>
      <span class="cue-sum-dot">·</span>
      <span class="cue-sum-item ${cues.TALENT ? "active" : ""}"><b>${cues.TALENT}</b> Talent</span>
      <span class="cue-sum-dot">·</span>
      <span class="cue-sum-item ${cues.SFX ? "active" : ""}"><b>${cues.SFX}</b> SFX</span>
      <span class="cue-sum-dot">·</span>
      <span class="cue-sum-item ${cues.GRAPHIC ? "active" : ""}"><b>${cues.GRAPHIC}</b> Graphic</span>
      <span class="cue-sum-dot">·</span>
      <span class="cue-sum-item ${cues.CTA ? "active" : ""}"><b>${cues.CTA}</b> CTA</span>
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
      totalRuntimeEl.textContent = `${mins}m ${String(secs).padStart(2, "0")}s speech total`;
    }
  }

  function renderScriptsList() {
    if (!scriptsList) return;
    const active = getActiveScript();
    let filtered = scripts;

    // Filter by status
    if (currentFilter !== "all") {
      filtered = filtered.filter(s => (s.status || "draft").toLowerCase() === currentFilter.toLowerCase());
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => (s.title || "").toLowerCase().includes(q) || (s.content || "").toLowerCase().includes(q));
    }

    if (scriptsCountEl) {
      const count = scripts.length;
      scriptsCountEl.textContent = `${count} script${count === 1 ? "" : "s"}`;
    }

    if (!filtered.length) {
      scriptsList.innerHTML = `
        <div class="scripts-empty-state">
          <p>No scripts found ${currentFilter !== "all" ? `in "${currentFilter}"` : ""}.</p>
          <button type="button" class="scripts-empty-new-btn" data-new-script-btn>＋ Create Script</button>
        </div>
      `;
      scriptsList.querySelector("[data-new-script-btn]")?.addEventListener("click", () => {
        if (templateModal) templateModal.hidden = false;
      });
      return;
    }

    scriptsList.innerHTML = filtered.map(s => {
      const isActive = active && s.id === active.id;
      const text = (s.content || "").replace(/<[^>]*>/g, "");
      const metrics = calculateSpeechMetrics(text, s.targetWpm || 135);
      const totalAttached = (s.attachedAssets?.length || 0) + (s.videoLinks?.length || 0);

      return `
        <article class="script-card-item ${isActive ? "active" : ""}" data-script-id="${escapeHTML(s.id)}" role="option" aria-selected="${isActive}">
          <div class="script-card-head">
            <span class="script-status-pill status-${(s.status || "draft").toLowerCase()}">${escapeHTML(s.status || "Draft")}</span>
            ${s.published ? `<span class="script-live-tag">● LIVE</span>` : ""}
            <div class="script-card-actions">
              <button type="button" class="script-action-icon-btn" data-dup-script="${escapeHTML(s.id)}" title="Duplicate Script">⎘</button>
              <button type="button" class="script-action-icon-btn danger" data-del-script="${escapeHTML(s.id)}" title="Delete Script">✕</button>
            </div>
          </div>
          <strong class="script-card-title">${escapeHTML(s.title || "Untitled Script")}</strong>
          <div class="script-card-foot">
            <small class="script-duration-tag">${metrics.durationFormatted} prompter</small>
            ${totalAttached > 0 ? `<small class="script-video-badge">${totalAttached} cut${totalAttached === 1 ? "" : "s"}</small>` : ""}
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
    if (titleInput) titleInput.value = active.title || "";
    if (statusSelect) statusSelect.value = active.status || "Draft";
    if (folderSelect) folderSelect.value = active.folderId || "";
    if (pacingGoalSelect) pacingGoalSelect.value = active.targetPacing || "reel_60";
    if (editorSurface) editorSurface.innerHTML = active.content || "<p></p>";

    updatePublishBtn(active);
    updateMetrics(active.content);
    renderScriptsList();
    renderCutsPanel(active);
    renderShotListPanel(active);
    renderLinkedAssetsSidebar(active);
  }

  function duplicateScript(id) {
    const orig = scripts.find(s => s.id === id);
    if (!orig) return;
    const copy = {
      ...orig,
      id: `script_${projectId}_${Date.now()}`,
      title: `${orig.title} (Copy)`,
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
    if (!confirm(`Delete "${target?.title || "this script"}" permanently?`)) return;
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
      cutsItemsList.innerHTML = `<p class="cuts-empty-note">No video cut or asset attached to this script yet. Use the controls above to attach a project file or external video link.</p>`;
      if (playerEmpty) playerEmpty.hidden = false;
      if (activePlayer) activePlayer.hidden = true;
      return;
    }

    cutsItemsList.innerHTML = [
      ...attached.map(a => `
        <div class="cut-item-card" data-cut-type="asset" data-cut-id="${escapeHTML(a.id)}">
          <span class="cut-icon">Video</span>
          <div class="cut-info">
            <strong title="${escapeHTML(a.name)}">${escapeHTML(a.name)}</strong>
            <small>Project Asset · ${formatBytes(a.size)}</small>
          </div>
          <div class="cut-actions">
            ${a.url ? `<button type="button" class="cut-btn play" data-play-asset="${escapeHTML(a.id)}"><span class="studio-btn-icon">${ICONS.play}</span> Play</button>` : ""}
            <button type="button" class="cut-btn del" data-del-asset="${escapeHTML(a.id)}">✕</button>
          </div>
        </div>
      `),
      ...links.map(l => `
        <div class="cut-item-card" data-cut-type="link" data-cut-id="${escapeHTML(l.id)}">
          <span class="cut-icon">Link</span>
          <div class="cut-info">
            <strong title="${escapeHTML(l.title || l.url)}">${escapeHTML(l.title || l.url)}</strong>
            <small>${escapeHTML(l.platform || "Web Video")}</small>
          </div>
          <div class="cut-actions">
            <button type="button" class="cut-btn play" data-play-link="${escapeHTML(l.id)}"><span class="studio-btn-icon">${ICONS.play}</span> Play</button>
            <button type="button" class="cut-btn del" data-del-link="${escapeHTML(l.id)}">✕</button>
          </div>
        </div>
      `)
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
      activePlayerFrame.innerHTML = `<iframe src="${embedUrl}?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else if (directUrl) {
      activePlayerFrame.innerHTML = `<video controls autoplay playsinline src="${escapeHTML(directUrl)}"></video>`;
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
      url: `/api/uploads?action=download&fileId=${encodeURIComponent(fileId)}`
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
      id: `link_${Date.now()}`,
      title: `${platform} Cut`,
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
  function updateCuesProgress(checked, total) {
    const counter = container.querySelector("[data-cues-progress-counter]");
    const bar = container.querySelector("[data-cues-progress-bar]");
    const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
    if (counter) counter.textContent = `${checked} of ${total} cues filmed (${pct}%)`;
    if (bar) bar.style.width = `${pct}%`;
  }

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
          const cueEl = child.querySelector(".cx-cue");
          const cueType = cueEl ? cueEl.textContent.replace(/[\[\]]/g, "").trim().toUpperCase() : "";
          currentScene.items.push({
            html: child.innerHTML,
            text,
            isCue: cueEl !== null,
            cueType
          });
        }
      }
    }
    if (currentScene.items.length) sections.push(currentScene);

    if (!sections.length) {
      grid.innerHTML = `<p class="cues-empty-note">No scene headings or cue items found. Use H1 / H2 headings and [VO], [B-ROLL], [TALENT] cue tags in the editor to populate this checklist.</p>`;
      updateCuesProgress(0, 0);
      return;
    }

    let checkedMap = {};
    try {
      checkedMap = JSON.parse(localStorage.getItem(`cx_shotlist_${script.id}`) || "{}");
    } catch {}

    const activeFilterBtn = container.querySelector("[data-cues-filter].active");
    const activeFilter = activeFilterBtn?.dataset.cuesFilter || "all";

    let totalItems = 0;
    let checkedItems = 0;

    grid.innerHTML = sections.map((sec, sIdx) => {
      const filteredItems = sec.items.filter(it => {
        if (activeFilter === "all") return true;
        return it.cueType === activeFilter;
      });

      if (!filteredItems.length && activeFilter !== "all") return "";

      return `
        <div class="cue-scene-group">
          <header class="cue-scene-head">
            <strong>${escapeHTML(sec.title)}</strong>
            <small>${filteredItems.length} item${filteredItems.length === 1 ? "" : "s"}</small>
          </header>
          <ul class="cue-scene-checklist">
            ${filteredItems.map((it, iIdx) => {
              const key = `${sIdx}_${iIdx}`;
              const isChecked = Boolean(checkedMap[key]);
              totalItems++;
              if (isChecked) checkedItems++;
              return `
                <li class="cue-check-item ${isChecked ? "is-checked" : ""}">
                  <label class="cue-item-label">
                    <input type="checkbox" data-cue-check="${key}" ${isChecked ? "checked" : ""}>
                    <div class="cue-item-snippet">${it.html}</div>
                  </label>
                </li>
              `;
            }).join("")}
          </ul>
        </div>
      `;
    }).join("");

    updateCuesProgress(checkedItems, totalItems);

    grid.querySelectorAll("[data-cue-check]").forEach(chk => {
      chk.addEventListener("change", () => {
        const key = chk.dataset.cueCheck;
        const itemLi = chk.closest(".cue-check-item");
        if (chk.checked) {
          checkedMap[key] = true;
          itemLi?.classList.add("is-checked");
        } else {
          delete checkedMap[key];
          itemLi?.classList.remove("is-checked");
        }
        try {
          localStorage.setItem(`cx_shotlist_${script.id}`, JSON.stringify(checkedMap));
        } catch {}

        const allCheckboxes = grid.querySelectorAll("[data-cue-check]");
        const curChecked = grid.querySelectorAll("[data-cue-check]:checked").length;
        updateCuesProgress(curChecked, allCheckboxes.length);
      });
    });
  }

  // Reset checks
  container.querySelector("[data-reset-cues-check]")?.addEventListener("click", () => {
    const active = getActiveScript();
    if (!active) return;
    try {
      localStorage.removeItem(`cx_shotlist_${active.id}`);
    } catch {}
    renderShotListPanel(active);
  });

  // Filter pills
  container.querySelectorAll("[data-cues-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll("[data-cues-filter]").forEach(b => b.classList.toggle("active", b === btn));
      const active = getActiveScript();
      if (active) renderShotListPanel(active);
    });
  });

  // Copy Shot List
  container.querySelector("[data-copy-shot-list]")?.addEventListener("click", async e => {
    const active = getActiveScript();
    if (!active) return;
    const text = htmlToMarkdown(active.content);
    try {
      await navigator.clipboard.writeText(`SHOT LIST CHECKLIST — ${active.title}\n\n${text}`);
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
  // VIRAL HOOKS SEARCH, GENERATOR & FILTERING
  // -------------------------------------------------------------
  function filterHooks() {
    const activeCatBtn = container.querySelector("[data-hook-filter].active");
    const cat = activeCatBtn ? activeCatBtn.dataset.hookFilter : "all";
    const searchInput = container.querySelector("[data-hook-search-input]");
    const query = (searchInput?.value || "").toLowerCase().trim();
    const countEl = container.querySelector("[data-hooks-match-count]");

    let visibleCount = 0;
    container.querySelectorAll("[data-hook-category]").forEach(card => {
      const cardCat = card.dataset.hookCategory;
      const catMatch = cat === "all" || cardCat === cat;
      const textMatch = !query || card.textContent.toLowerCase().includes(query);
      const isVisible = catMatch && textMatch;
      card.hidden = !isVisible;
      if (isVisible) visibleCount++;
    });

    if (countEl) {
      countEl.textContent = `${visibleCount} formula${visibleCount === 1 ? "" : "s"} found`;
    }
  }

  container.querySelectorAll("[data-hook-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll("[data-hook-filter]").forEach(b => b.classList.toggle("active", b === btn));
      filterHooks();
    });
  });

  const hookSearchInput = container.querySelector("[data-hook-search-input]");
  if (hookSearchInput) {
    hookSearchInput.addEventListener("input", filterHooks);
  }

  // AI Hook Generator
  const genSubmitBtn = container.querySelector("[data-gen-submit-btn]");
  const genTopicInput = container.querySelector("[data-gen-topic-input]");
  const genResultsArea = container.querySelector("[data-gen-results-area]");

  if (genSubmitBtn && genTopicInput && genResultsArea) {
    genSubmitBtn.addEventListener("click", () => {
      const topic = genTopicInput.value.trim() || "Content Creation";
      const generated = [
        {
          badge: "Contrarian Disrupt",
          formula: `Stop [common approach] for ${topic}. Here's the counter-intuitive method top 1% use:`,
          example: `Stop doing ${topic} the traditional way. 90% of creators fail because they ignore this 1 simple shift.`
        },
        {
          badge: "Curiosity & High Stakes",
          formula: `The brutal truth about ${topic} nobody is talking about:`,
          example: `If you are doing ${topic} in 2026 without this framework, you are burning 80% of your growth.`
        },
        {
          badge: "Actionable Speed / Proof",
          formula: `How to master ${topic} in 30 seconds (Steal my 3-step cheat sheet):`,
          example: `Here's how I scaled ${topic} in record time using this 3-step blueprint. Steal it before your competition does.`
        }
      ];

      genResultsArea.hidden = false;
      genResultsArea.innerHTML = `
        <div class="gen-results-title">
          <strong>3 Generated Angles for "${escapeHTML(topic)}"</strong>
          <button type="button" class="gen-clear-btn" data-gen-clear>✕ Clear</button>
        </div>
        <div class="gen-cards-grid">
          ${generated.map((g, i) => `
            <div class="gen-card">
              <div class="gen-card-top">
                <span class="gen-badge">${escapeHTML(g.badge)}</span>
              </div>
              <p class="gen-text">“${escapeHTML(g.example)}”</p>
              <div class="gen-card-actions">
                <button type="button" class="gen-copy-btn" data-gen-copy="${i}">📋 Copy</button>
                <button type="button" class="gen-insert-btn" data-gen-insert="${i}">＋ Insert into Script</button>
              </div>
            </div>
          `).join("")}
        </div>
      `;

      genResultsArea.querySelector("[data-gen-clear]")?.addEventListener("click", () => {
        genResultsArea.hidden = true;
        genResultsArea.innerHTML = "";
      });

      genResultsArea.querySelectorAll("[data-gen-insert]").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.dataset.genInsert);
          const item = generated[idx];
          if (!item) return;

          const hookHtml = `<h1>Scene 1 · Scroll-Stopping Hook</h1>\n<p><span class="cx-cue cue-hook">[HOOK]</span> <mark class="cx-hl-orange">${escapeHTML(item.example)}</mark></p>\n`;
          const editorTabBtn = container.querySelector('[data-studio-tab="editor"]');
          if (editorTabBtn) editorTabBtn.click();
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

      genResultsArea.querySelectorAll("[data-gen-copy]").forEach(btn => {
        btn.addEventListener("click", async () => {
          const idx = Number(btn.dataset.genCopy);
          const item = generated[idx];
          if (!item) return;
          try {
            await navigator.clipboard.writeText(item.example);
            btn.textContent = "Copied ✓";
            setTimeout(() => { if (btn.isConnected) btn.textContent = "📋 Copy"; }, 1600);
          } catch {}
        });
      });
    });

    genTopicInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        genSubmitBtn.click();
      }
    });
  }

  container.querySelectorAll("[data-insert-hook]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.insertHook);
      const hook = VIRAL_HOOK_LIBRARY[idx];
      if (!hook) return;

      const hookHtml = `<h1>Scene 1 · Scroll-Stopping Hook</h1>\\n<p><span class="cx-cue cue-hook">[HOOK]</span> <mark class="cx-hl-orange">${escapeHTML(hook.example)}</mark></p>\\n`;

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

  container.querySelectorAll("[data-copy-hook]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const idx = Number(btn.dataset.copyHook);
      const hook = VIRAL_HOOK_LIBRARY[idx];
      if (!hook) return;
      const textToCopy = `${hook.formula}\n\nExample: "${hook.example}"`;
      try {
        await navigator.clipboard.writeText(textToCopy);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = textToCopy;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      const prevText = btn.textContent;
      btn.textContent = "✓ Copied!";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = prevText;
        btn.classList.remove("copied");
      }, 1800);
    });
  });

  // -------------------------------------------------------------
  // STATUS FILTER PILLS IN EXPLORER
  // -------------------------------------------------------------
  shell.querySelectorAll("[data-filter-status]").forEach(btn => {
    btn.addEventListener("click", () => {
      shell.querySelectorAll("[data-filter-status]").forEach(b => b.classList.toggle("active", b === btn));
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
  const openTemplateModal = () => { if (templateModal) templateModal.hidden = false; };
  const closeTemplateModal = () => { if (templateModal) templateModal.hidden = true; };

  shell.querySelectorAll("[data-new-script-btn]").forEach(b => b.addEventListener("click", openTemplateModal));
  container.querySelector("[data-close-template-modal]")?.addEventListener("click", closeTemplateModal);
  templateModal?.addEventListener("click", e => { if (e.target === templateModal) closeTemplateModal(); });

  container.querySelectorAll("[data-pick-template]").forEach(card => {
    card.addEventListener("click", () => {
      const tid = card.dataset.pickTemplate;
      const t = SCRIPT_TEMPLATES.find(x => x.id === tid) || SCRIPT_TEMPLATES[0];

      const newScript = {
        id: `script_${projectId}_${Date.now()}`,
        projectId,
        folderId: "",
        title: `${t.name} Draft`,
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
      history.replaceState(null, "", `#workspace?project=${encodeURIComponent(projectId)}&panel=scripts`);
    }
  });

  // -------------------------------------------------------------
  // FORMATTING TOOLBAR
  // -------------------------------------------------------------
  const styleSelect = container.querySelector("[data-format-block-select]");
  styleSelect?.addEventListener("change", () => {
    document.execCommand("formatBlock", false, styleSelect.value);
    editorSurface.focus();
    updateMetrics();
    triggerAutoSave();
  });

  // Font Family Selector
  fontSelect?.addEventListener("change", () => {
    const chosenFont = fontSelect.value;
    const sel = window.getSelection();
    if (sel && sel.rangeCount && !sel.isCollapsed && editorSurface.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      const span = document.createElement("span");
      if (chosenFont !== "inherit") {
        span.style.fontFamily = chosenFont;
      }
      try {
        range.surroundContents(span);
      } catch {
        const frag = range.extractContents();
        span.appendChild(frag);
        range.insertNode(span);
      }
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.addRange(newRange);
    } else {
      let node = sel?.anchorNode;
      if (node && node.nodeType === 3) node = node.parentElement;
      if (node && editorSurface.contains(node)) {
        const block = node.closest("h1, h2, h3, h4, p, div, blockquote");
        if (block && editorSurface.contains(block)) {
          block.style.fontFamily = chosenFont === "inherit" ? "" : chosenFont;
        }
      }
    }
    editorSurface.focus();
    triggerAutoSave();
  });

  const syncActiveFormat = () => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    let node = sel.anchorNode;
    if (node && node.nodeType === 3) node = node.parentElement;
    if (!node || !editorSurface.contains(node)) return;

    if (styleSelect) {
      const heading = node.closest("h1, h2, h3, p");
      if (heading) {
        const tag = heading.tagName.toUpperCase();
        if (["H1", "H2", "H3", "P"].includes(tag) && styleSelect.value !== tag) {
          styleSelect.value = tag;
        }
      }
    }

    if (fontSelect) {
      const elWithFont = node.closest("[style*='font-family']");
      if (elWithFont && elWithFont.style.fontFamily) {
        const ff = elWithFont.style.fontFamily.replace(/["']/g, "").toLowerCase();
        let matched = false;
        for (const opt of fontSelect.options) {
          const optVal = opt.value.replace(/["']/g, "").toLowerCase();
          if (opt.value !== "inherit" && (ff.includes(optVal.split(",")[0].trim()) || optVal.includes(ff.split(",")[0].trim()))) {
            fontSelect.value = opt.value;
            matched = true;
            break;
          }
        }
        if (!matched) fontSelect.value = "inherit";
      } else {
        fontSelect.value = "inherit";
      }
    }
  };

  editorSurface.addEventListener("keyup", syncActiveFormat);
  editorSurface.addEventListener("mouseup", syncActiveFormat);

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

  // External Link Handler
  const insertExternalLink = () => {
    const sel = window.getSelection();
    let range = null;
    if (sel && sel.rangeCount && editorSurface.contains(sel.anchorNode)) {
      range = sel.getRangeAt(0);
    }
    const rawUrl = prompt("Enter external URL (e.g. https://example.com):", "https://");
    if (!rawUrl || !rawUrl.trim() || rawUrl.trim() === "https://") return;
    const cleanUrl = rawUrl.trim();

    if (range && !range.collapsed) {
      const a = document.createElement("a");
      a.href = cleanUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "cx-script-ext-link";
      try {
        range.surroundContents(a);
      } catch {
        const frag = range.extractContents();
        a.appendChild(frag);
        range.insertNode(a);
      }
    } else {
      const a = document.createElement("a");
      a.href = cleanUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "cx-script-ext-link";
      a.textContent = cleanUrl;
      if (range) {
        range.insertNode(a);
      } else {
        editorSurface.appendChild(a);
      }
      editorSurface.appendChild(document.createTextNode("\u00A0"));
    }
    editorSurface.focus();
    updateMetrics();
    triggerAutoSave();
  };

  cmdLinkBtn?.addEventListener("click", insertExternalLink);

  // Project Asset Linker Popovers & Chip insertion
  let currentLinkerFolderId = null;

  function renderAssetLinkerInstance(filterQuery, targetList, targetBreadcrumbs, targetFilterInput) {
    if (!targetList) return;
    const projectFiles = Array.isArray(files) ? files : [];
    const projectFolders = Array.isArray(folders) ? folders : [];

    // Folder map for quick lookup
    const folderMap = new Map();
    projectFolders.forEach(f => {
      const id = f.id || f.folder_id;
      if (id) folderMap.set(id, f.name || "Untitled Folder");
    });

    const isSearching = Boolean(filterQuery && filterQuery.trim());
    const query = (filterQuery || "").trim().toLowerCase();

    // Render breadcrumb bar
    if (targetBreadcrumbs) {
      if (isSearching) {
        targetBreadcrumbs.innerHTML = `
          <button type="button" class="assets-crumb-btn" data-crumb-root><span class="studio-inline-svg">${ICONS.folder}</span> All Files</button>
          <span class="assets-crumb-sep">/</span>
          <span class="assets-crumb-cur">Search: "${escapeHTML(query)}"</span>
        `;
      } else if (currentLinkerFolderId) {
        const curFolder = projectFolders.find(f => (f.id || f.folder_id) === currentLinkerFolderId);
        const folderTitle = curFolder?.name || "Folder";
        targetBreadcrumbs.innerHTML = `
          <button type="button" class="assets-crumb-btn" data-crumb-root><span class="studio-inline-svg">${ICONS.folder}</span> All Files</button>
          <span class="assets-crumb-sep">/</span>
          <span class="assets-crumb-cur">${escapeHTML(folderTitle)}</span>
        `;
      } else {
        targetBreadcrumbs.innerHTML = `
          <span class="assets-crumb-cur"><span class="studio-inline-svg">${ICONS.folder}</span> Project Folders &amp; Files</span>
        `;
      }

      targetBreadcrumbs.querySelector("[data-crumb-root]")?.addEventListener("click", () => {
        currentLinkerFolderId = null;
        if (targetFilterInput) targetFilterInput.value = "";
        renderAllAssetLinkers("");
      });
    }

    if (isSearching) {
      // Global search across all project files
      const matchedFiles = projectFiles.filter(f => {
        const name = (f.name || f.original_name || "").toLowerCase();
        return name.includes(query);
      });

      if (!matchedFiles.length) {
        targetList.innerHTML = `<div class="assets-picker-empty">No assets matching "${escapeHTML(query)}" found.</div>`;
        return;
      }

      targetList.innerHTML = matchedFiles.map(f => {
        const fileId = f.id || f.asset_id;
        const fileName = f.name || f.original_name || "Unnamed File";
        const fileSize = formatBytes(f.size || f.size_bytes || 0);
        const fileUrl = f.url || `/api/uploads?action=download&fileId=${encodeURIComponent(fileId)}`;
        const parentFolderId = f.folder_id || f.folderId;
        const parentFolderName = parentFolderId && folderMap.has(parentFolderId) ? folderMap.get(parentFolderId) : null;
        return `
          <button type="button" class="asset-picker-item" data-link-file-id="${escapeHTML(fileId)}" data-link-file-name="${escapeHTML(fileName)}" data-link-file-url="${escapeHTML(fileUrl)}" data-link-file-size="${f.size || f.size_bytes || 0}">
            <span class="picker-item-icon">${ICONS.film}</span>
            <div class="picker-item-info">
              <strong class="picker-item-name" title="${escapeHTML(fileName)}">${escapeHTML(fileName)}</strong>
              <div class="picker-item-subline">
                <span class="picker-item-meta">${fileSize}</span>
                ${parentFolderName ? `<span class="picker-item-folder-tag"><span class="studio-inline-svg">${ICONS.folder}</span> ${escapeHTML(parentFolderName)}</span>` : ""}
              </div>
            </div>
            <span class="picker-item-action">+ Link</span>
          </button>
        `;
      }).join("");

      wireAssetPickerItemsInList(targetList);
      return;
    }

    if (currentLinkerFolderId) {
      // Inside a specific folder
      const folderFiles = projectFiles.filter(f => (f.folder_id || f.folderId) === currentLinkerFolderId);
      let html = `
        <button type="button" class="asset-picker-back-btn" data-back-to-root>
          <span class="back-arrow">←</span>
          <span>Back to all folders</span>
        </button>
      `;

      if (!folderFiles.length) {
        html += `<div class="assets-picker-empty">This folder is empty. Upload footage in this folder from the workspace files tab.</div>`;
      } else {
        html += folderFiles.map(f => {
          const fileId = f.id || f.asset_id;
          const fileName = f.name || f.original_name || "Unnamed File";
          const fileSize = formatBytes(f.size || f.size_bytes || 0);
          const fileUrl = f.url || `/api/uploads?action=download&fileId=${encodeURIComponent(fileId)}`;
          return `
            <button type="button" class="asset-picker-item" data-link-file-id="${escapeHTML(fileId)}" data-link-file-name="${escapeHTML(fileName)}" data-link-file-url="${escapeHTML(fileUrl)}" data-link-file-size="${f.size || f.size_bytes || 0}">
              <span class="picker-item-icon">${ICONS.film}</span>
              <div class="picker-item-info">
                <strong class="picker-item-name" title="${escapeHTML(fileName)}">${escapeHTML(fileName)}</strong>
                <span class="picker-item-meta">${fileSize}</span>
              </div>
              <span class="picker-item-action">+ Link</span>
            </button>
          `;
        }).join("");
      }

      targetList.innerHTML = html;
      targetList.querySelector("[data-back-to-root]")?.addEventListener("click", () => {
        currentLinkerFolderId = null;
        renderAllAssetLinkers("");
      });
      wireAssetPickerItemsInList(targetList);
      return;
    }

    // Top-level / Root view: show folders first, then root files
    const rootFiles = projectFiles.filter(f => !f.folder_id && !f.folderId);
    let html = "";

    if (projectFolders.length > 0) {
      html += `<div class="asset-picker-section-label">FOLDERS</div>`;
      html += projectFolders.map(folder => {
        const folderId = folder.id || folder.folder_id;
        const count = projectFiles.filter(f => (f.folder_id || f.folderId) === folderId).length;
        return `
          <button type="button" class="asset-folder-picker-card" data-enter-folder-id="${escapeHTML(folderId)}">
            <span class="folder-picker-icon">${ICONS.folder}</span>
            <div class="folder-picker-info">
              <strong class="folder-picker-title">${escapeHTML(folder.name || "Untitled Folder")}</strong>
              <span class="folder-picker-count">${count} ${count === 1 ? "asset" : "assets"}</span>
            </div>
            <span class="folder-picker-arrow">→</span>
          </button>
        `;
      }).join("");
    }

    if (rootFiles.length > 0) {
      if (projectFolders.length > 0) {
        html += `<div class="asset-picker-section-label">FILES</div>`;
      }
      html += rootFiles.map(f => {
        const fileId = f.id || f.asset_id;
        const fileName = f.name || f.original_name || "Unnamed File";
        const fileSize = formatBytes(f.size || f.size_bytes || 0);
        const fileUrl = f.url || `/api/uploads?action=download&fileId=${encodeURIComponent(fileId)}`;
        return `
          <button type="button" class="asset-picker-item" data-link-file-id="${escapeHTML(fileId)}" data-link-file-name="${escapeHTML(fileName)}" data-link-file-url="${escapeHTML(fileUrl)}" data-link-file-size="${f.size || f.size_bytes || 0}">
            <span class="picker-item-icon">${ICONS.film}</span>
            <div class="picker-item-info">
              <strong class="picker-item-name" title="${escapeHTML(fileName)}">${escapeHTML(fileName)}</strong>
              <span class="picker-item-meta">${fileSize}</span>
            </div>
            <span class="picker-item-action">+ Link</span>
          </button>
        `;
      }).join("");
    }

    if (projectFolders.length === 0 && rootFiles.length === 0) {
      html = `<div class="assets-picker-empty">No uploaded assets in this project yet. Upload footage in the project files view to link them to your script beats.</div>`;
    }

    targetList.innerHTML = html;

    targetList.querySelectorAll("[data-enter-folder-id]").forEach(card => {
      card.addEventListener("click", e => {
        e.stopPropagation();
        currentLinkerFolderId = card.dataset.enterFolderId;
        renderAllAssetLinkers("");
      });
    });

    wireAssetPickerItemsInList(targetList);
  }

  function wireAssetPickerItemsInList(targetList) {
    targetList.querySelectorAll("[data-link-file-id]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const fileId = btn.dataset.linkFileId;
        const fileName = btn.dataset.linkFileName;
        const fileUrl = btn.dataset.linkFileUrl;
        const fileSize = Number(btn.dataset.linkFileSize || 0);
        insertAssetChipIntoEditor(fileId, fileName, fileUrl, fileSize);
        if (assetsPopover) assetsPopover.hidden = true;
        if (topAssetsPopover) topAssetsPopover.hidden = true;
      });
    });
  }

  function renderAllAssetLinkers(query = "") {
    if (assetsList) renderAssetLinkerInstance(query, assetsList, assetsBreadcrumbs, assetsFilterInput);
    if (topAssetsList) renderAssetLinkerInstance(query, topAssetsList, topAssetsBreadcrumbs, topAssetsFilterInput);
  }

  function insertAssetChipIntoEditor(fileId, fileName, fileUrl, fileSize) {
    editorSurface.focus();
    const chip = document.createElement("span");
    chip.className = "cx-script-asset-chip";
    chip.dataset.assetId = fileId;
    chip.dataset.assetName = fileName;
    chip.dataset.assetUrl = fileUrl;
    chip.dataset.assetSize = String(fileSize || 0);
    chip.contentEditable = "false";
    chip.title = `Project Asset: ${fileName} (Click to preview)`;
    chip.innerHTML = `<span class="asset-chip-icon">${ICONS.film}</span><span class="asset-chip-label">${escapeHTML(fileName)}</span><button type="button" class="asset-chip-del" title="Remove asset link" aria-label="Remove asset link">×</button>`;

    const sel = window.getSelection();
    if (sel && sel.rangeCount && editorSurface.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      range.collapse(false);
      range.insertNode(chip);
      const space = document.createTextNode("\u00A0");
      chip.after(space);
      const newRange = document.createRange();
      newRange.setStartAfter(space);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    } else {
      editorSurface.appendChild(chip);
      editorSurface.appendChild(document.createTextNode("\u00A0"));
    }

    const active = getActiveScript();
    if (active) {
      active.attachedAssets = active.attachedAssets || [];
      if (!active.attachedAssets.some(a => a.id === fileId)) {
        active.attachedAssets.push({
          id: fileId,
          name: fileName,
          size: fileSize,
          type: "video",
          url: fileUrl
        });
      }
      renderCutsPanel(active);
      renderScriptsList();
      renderLinkedAssetsSidebar(active);
    }

    triggerAutoSave();
    updateMetrics();

    // Directly preview in right-side sidebar
    playInLinkedSidebar(fileName, fileUrl);
  }

  // -------------------------------------------------------------
  // RIGHT-SIDE LINKED ASSETS SIDEBAR & PREVIEW PLAYER
  // -------------------------------------------------------------
  function renderLinkedAssetsSidebar(script) {
    if (!linkedSidebarList) return;
    const active = script || getActiveScript();
    if (!active) return;

    // Discover all chips currently present in the script editor
    const chips = Array.from(editorSurface.querySelectorAll(".cx-script-asset-chip"));
    const chipCounts = new Map();
    const discoveredAssets = new Map();

    chips.forEach(chip => {
      const id = chip.dataset.assetId;
      const name = chip.dataset.assetName || "Asset";
      const url = chip.dataset.assetUrl || "";
      const size = Number(chip.dataset.assetSize || 0);
      if (id) {
        chipCounts.set(id, (chipCounts.get(id) || 0) + 1);
        if (!discoveredAssets.has(id)) {
          discoveredAssets.set(id, { id, name, url, size });
        }
      }
    });

    // Also include any attached assets from script metadata
    const attached = Array.isArray(active.attachedAssets) ? active.attachedAssets : [];
    attached.forEach(a => {
      if (a.id && !discoveredAssets.has(a.id)) {
        discoveredAssets.set(a.id, {
          id: a.id,
          name: a.name || a.title || "Asset",
          url: a.url || "",
          size: a.size || 0
        });
      }
    });

    const uniqueAssets = Array.from(discoveredAssets.values());
    if (linkedBadge) {
      linkedBadge.textContent = String(uniqueAssets.length);
    }
    if (topLinkedBadge) {
      topLinkedBadge.textContent = String(uniqueAssets.length);
    }

    if (!uniqueAssets.length) {
      linkedSidebarList.innerHTML = `
        <div class="linked-assets-empty">
          <span class="linked-empty-icon">${ICONS.film}</span>
          <p>No project footage linked</p>
          <small>Place your cursor anywhere in the script and click <b>Attach Asset</b> above to attach footage directly to script lines.</small>
        </div>
      `;
      return;
    }

    linkedSidebarList.innerHTML = uniqueAssets.map(asset => {
      const occurrences = chipCounts.get(asset.id) || 0;
      const occBadge = occurrences > 0
        ? `<span class="linked-occ-tag" title="Used in ${occurrences} place(s) in this script">Tagged ${occurrences}x</span>`
        : `<span class="linked-occ-tag unlinked" title="Attached to script project file">In project</span>`;
      return `
        <div class="linked-asset-card" data-asset-card-id="${escapeHTML(asset.id)}">
          <div class="linked-card-head">
            <span class="linked-card-icon">${ICONS.film}</span>
            <div class="linked-card-titles">
              <strong class="linked-card-name" title="${escapeHTML(asset.name)}">${escapeHTML(asset.name)}</strong>
              <div class="linked-card-meta">
                <span>${formatBytes(asset.size || 0)}</span>
                ${occBadge}
              </div>
            </div>
          </div>
          <div class="linked-card-actions">
            <button type="button" class="linked-btn primary" data-play-linked="${escapeHTML(asset.id)}" data-play-name="${escapeHTML(asset.name)}" data-play-url="${escapeHTML(asset.url)}">
              <span class="studio-btn-icon">${ICONS.play}</span> <span>Preview</span>
            </button>
            ${occurrences > 0 ? `
              <button type="button" class="linked-btn" data-locate-chip="${escapeHTML(asset.id)}" title="Scroll to first mention in script">
                <span class="studio-btn-icon">${ICONS.locate}</span> <span>Locate</span>
              </button>
            ` : ""}
            <button type="button" class="linked-btn danger" data-unlink-asset="${escapeHTML(asset.id)}" title="Remove all tags for this footage">
              <span class="studio-btn-icon">${ICONS.close}</span>
            </button>
          </div>
        </div>
      `;
    }).join("");

    // Wire actions
    linkedSidebarList.querySelectorAll("[data-play-linked]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const name = btn.dataset.playName;
        const url = btn.dataset.playUrl;
        playInLinkedSidebar(name, url);
        linkedSidebarList.querySelectorAll(".linked-asset-card").forEach(c => c.classList.remove("is-active"));
        btn.closest(".linked-asset-card")?.classList.add("is-active");
      });
    });

    linkedSidebarList.querySelectorAll("[data-locate-chip]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const assetId = btn.dataset.locateChip;
        locateChipInScript(assetId);
      });
    });

    linkedSidebarList.querySelectorAll("[data-unlink-asset]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const assetId = btn.dataset.unlinkAsset;
        unlinkAssetFromScript(assetId);
      });
    });
  }

  function playInLinkedSidebar(name, url) {
    if (!linkedPreviewContainer || !linkedPreviewScreen) return;
    if (!url) return;

    linkedPreviewContainer.hidden = false;
    if (linkedPreviewName) linkedPreviewName.textContent = name || "Footage Preview";

    linkedPreviewScreen.innerHTML = `
      <video class="linked-media-video" controls autoplay playsinline src="${escapeHTML(url)}">
        Your browser does not support video playback.
      </video>
    `;

    if (linkedSidebar && linkedSidebar.classList.contains("is-collapsed")) {
      linkedSidebar.classList.remove("is-collapsed");
      toggleLinkedPanelBtns.forEach(b => b.classList.remove("is-collapsed"));
    }
  }

  function closeLinkedSidebarPreview() {
    if (!linkedPreviewContainer || !linkedPreviewScreen) return;
    const vid = linkedPreviewScreen.querySelector("video");
    if (vid) {
      vid.pause();
      vid.removeAttribute("src");
      vid.load();
    }
    linkedPreviewScreen.innerHTML = "";
    linkedPreviewContainer.hidden = true;
    if (linkedSidebarList) {
      linkedSidebarList.querySelectorAll(".linked-asset-card").forEach(c => c.classList.remove("is-active"));
    }
  }

  linkedClosePreview?.addEventListener("click", e => {
    e.stopPropagation();
    closeLinkedSidebarPreview();
  });

  toggleLinkedPanelBtns.forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      if (linkedSidebar) {
        linkedSidebar.classList.toggle("is-collapsed");
        const isCollapsed = linkedSidebar.classList.contains("is-collapsed");
        toggleLinkedPanelBtns.forEach(b => b.classList.toggle("is-collapsed", isCollapsed));
      }
    });
  });

  function locateChipInScript(assetId) {
    const targetChip = editorSurface.querySelector(`.cx-script-asset-chip[data-asset-id="${assetId}"]`);
    if (targetChip) {
      targetChip.scrollIntoView({ behavior: "smooth", block: "center" });
      targetChip.classList.remove("cx-chip-locate-pulse");
      void targetChip.offsetWidth;
      targetChip.classList.add("cx-chip-locate-pulse");
      setTimeout(() => {
        targetChip.classList.remove("cx-chip-locate-pulse");
      }, 2400);
    }
  }

  function unlinkAssetFromScript(assetId) {
    editorSurface.querySelectorAll(`.cx-script-asset-chip[data-asset-id="${assetId}"]`).forEach(chip => {
      chip.remove();
    });

    const active = getActiveScript();
    if (active && Array.isArray(active.attachedAssets)) {
      active.attachedAssets = active.attachedAssets.filter(a => a.id !== assetId);
    }

    triggerAutoSave();
    updateMetrics();
    renderLinkedAssetsSidebar(active);
    renderCutsPanel(active);
  }

  topAssetLinkerBtn?.addEventListener("click", e => {
    e.stopPropagation();
    const wasHidden = topAssetsPopover ? topAssetsPopover.hidden : true;
    container.querySelectorAll(".scripts-menu-popover").forEach(m => m.hidden = true);
    if (topAssetsPopover) {
      topAssetsPopover.hidden = !wasHidden;
      if (!topAssetsPopover.hidden) {
        currentLinkerFolderId = null;
        if (topAssetsFilterInput) topAssetsFilterInput.value = "";
        renderAllAssetLinkers("");
        topAssetsFilterInput?.focus();
      }
    }
  });

  topAssetsPopover?.addEventListener("click", e => e.stopPropagation());

  topAssetsFilterInput?.addEventListener("input", () => {
    renderAllAssetLinkers(topAssetsFilterInput.value.trim().toLowerCase());
  });

  assetLinkerBtn?.addEventListener("click", e => {
    e.stopPropagation();
    const wasHidden = assetsPopover.hidden;
    container.querySelectorAll(".scripts-menu-popover").forEach(m => m.hidden = true);
    assetsPopover.hidden = !wasHidden;
    if (!assetsPopover.hidden) {
      currentLinkerFolderId = null;
      if (assetsFilterInput) assetsFilterInput.value = "";
      renderAllAssetLinkers("");
      assetsFilterInput?.focus();
    }
  });

  assetsPopover?.addEventListener("click", e => e.stopPropagation());

  assetsFilterInput?.addEventListener("input", () => {
    renderAllAssetLinkers(assetsFilterInput.value.trim().toLowerCase());
  });

  // More Menu Popover
  moreMenuBtn?.addEventListener("click", e => {
    e.stopPropagation();
    const wasHidden = moreMenu.hidden;
    container.querySelectorAll(".scripts-menu-popover").forEach(m => m.hidden = true);
    moreMenu.hidden = !wasHidden;
  });

  moreMenu?.addEventListener("click", e => e.stopPropagation());

  // Overflow Menu (Three-dot Header Menu)
  overflowMenuBtn?.addEventListener("click", e => {
    e.stopPropagation();
    const wasHidden = overflowMenu ? overflowMenu.hidden : true;
    container.querySelectorAll(".scripts-menu-popover").forEach(m => m.hidden = true);
    if (overflowMenu) overflowMenu.hidden = !wasHidden;
  });

  overflowMenu?.addEventListener("click", e => {
    e.stopPropagation();
    const btn = e.target.closest("button");
    if (btn && !btn.matches("[data-toggle-top-asset-linker]")) {
      if (overflowMenu) overflowMenu.hidden = true;
    }
  });

  // Share Script Link action
  shareScriptLinkBtn?.addEventListener("click", async e => {
    e.stopPropagation();
    if (overflowMenu) overflowMenu.hidden = true;
    const active = getActiveScript();
    if (!active) return;
    const showcaseLink = `${window.location.origin}${window.location.pathname}#workspace?panel=showcase&script=${encodeURIComponent(active.id)}&project=${encodeURIComponent(projectId || "default")}`;
    try {
      await navigator.clipboard.writeText(showcaseLink);
      notify("Share link copied to clipboard! ✓");
    } catch {
      notify(`Share link: ${showcaseLink}`);
    }
  });

  // Send Script to Project Modal & Action
  function openSendToProjectModal(script) {
    if (!script) return;
    const otherProjects = (projects || []).filter(p => (p.project_id || p.id) !== projectId);
    if (!otherProjects.length) {
      notify("No other projects available in this account.");
      return;
    }

    const modal = document.createElement("div");
    modal.className = "workspace-modal-backdrop send-project-layer";
    modal.innerHTML = `
      <div class="workspace-modal send-script-dialog">
        <header class="workspace-modal-head">
          <h3>Send Script to Project</h3>
          <button type="button" class="workspace-modal-close" data-close-send-modal aria-label="Close">${ICONS.close}</button>
        </header>
        <div class="workspace-modal-body">
          <p class="send-script-prompt">Copy and link <strong>"${escapeHTML(script.title || "Untitled Script")}"</strong> to another project:</p>
          <div class="send-project-list">
            ${otherProjects.map(p => {
              const pid = p.project_id || p.id;
              return `
                <button type="button" class="send-project-row" data-target-pid="${escapeHTML(pid)}">
                  <span class="send-project-icon">${ICONS.folder}</span>
                  <div class="send-project-info">
                    <strong>${escapeHTML(p.name)}</strong>
                    <small>${escapeHTML(p.clientName || "Workspace project")}</small>
                  </div>
                  <span class="send-project-arrow">Link &amp; Send →</span>
                </button>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    `;
    document.body.append(modal);
    const close = () => modal.remove();
    modal.querySelector("[data-close-send-modal]").addEventListener("click", close);
    modal.addEventListener("click", ev => { if (ev.target === modal) close(); });

    modal.querySelectorAll("[data-target-pid]").forEach(row => {
      row.addEventListener("click", () => {
        const targetPid = row.dataset.targetPid;
        const targetProject = otherProjects.find(p => (p.project_id || p.id) === targetPid);
        if (!targetProject) return;

        const targetScripts = getStorageScripts(targetPid);
        const scriptClone = {
          ...script,
          id: `script_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          title: script.title ? `${script.title} (Linked)` : "Untitled Script",
          linkedFromProjectId: projectId,
          linkedFromProjectName: activeProject.name,
          updatedAt: Date.now()
        };
        targetScripts.unshift(scriptClone);
        saveStorageScripts(targetPid, targetScripts);
        close();
        notify(`Script linked and sent to "${targetProject.name}"! ✓`);
      });
    });
  }

  sendToProjectBtn?.addEventListener("click", e => {
    e.stopPropagation();
    if (overflowMenu) overflowMenu.hidden = true;
    const active = getActiveScript();
    if (active) openSendToProjectModal(active);
  });

  // Highlight Dropdown Popover
  const hlTrigger = container.querySelector("[data-toggle-hl-menu]");
  const hlMenu = container.querySelector("[data-hl-menu]");
  hlTrigger?.addEventListener("click", e => {
    e.stopPropagation();
    const wasHidden = hlMenu.hidden;
    container.querySelectorAll(".scripts-menu-popover").forEach(m => m.hidden = true);
    hlMenu.hidden = !wasHidden;
  });

  // Cue Dropdown Popover
  const cueTrigger = container.querySelector("[data-toggle-cue-menu]");
  const cueMenu = container.querySelector("[data-cue-menu]");
  cueTrigger?.addEventListener("click", e => {
    e.stopPropagation();
    const wasHidden = cueMenu.hidden;
    container.querySelectorAll(".scripts-menu-popover").forEach(m => m.hidden = true);
    cueMenu.hidden = !wasHidden;
  });

  document.addEventListener("click", () => {
    if (hlMenu) hlMenu.hidden = true;
    if (cueMenu) cueMenu.hidden = true;
    if (assetsPopover) assetsPopover.hidden = true;
    if (topAssetsPopover) topAssetsPopover.hidden = true;
    if (moreMenu) moreMenu.hidden = true;
    if (overflowMenu) overflowMenu.hidden = true;
  });

  container.querySelectorAll("[data-highlight]").forEach(btn => {
    btn.addEventListener("click", () => {
      const color = btn.dataset.highlight;
      if (hlMenu) hlMenu.hidden = true;
      if (moreMenu) moreMenu.hidden = true;
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
      if (cueMenu) cueMenu.hidden = true;
      if (moreMenu) moreMenu.hidden = true;
      const cueClass = `cue-${cueType.toLowerCase().replace(/[^a-z]/g, "")}`;
      const badgeHtml = `&nbsp;<span class="cx-cue ${cueClass}">[${cueType}]</span>&nbsp;`;
      document.execCommand("insertHTML", false, badgeHtml);
      editorSurface.focus();
      updateMetrics();
      triggerAutoSave();
    });
  });

  container.querySelector("[data-insert-divider]")?.addEventListener("click", () => {
    if (moreMenu) moreMenu.hidden = true;
    const hrHtml = `<hr class="script-scene-divider"><br>`;
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

  editorSurface.addEventListener("click", e => {
    const delBtn = e.target.closest(".asset-chip-del");
    if (delBtn) {
      e.stopPropagation();
      e.preventDefault();
      const chip = delBtn.closest(".cx-script-asset-chip");
      if (chip) {
        chip.remove();
        triggerAutoSave();
        updateMetrics();
        renderLinkedAssetsSidebar(getActiveScript());
      }
      return;
    }

    const chip = e.target.closest(".cx-script-asset-chip");
    if (chip) {
      e.stopPropagation();
      e.preventDefault();
      const assetName = chip.dataset.assetName;
      const assetUrl = chip.dataset.assetUrl;
      const assetId = chip.dataset.assetId;
      playInLinkedSidebar(assetName, assetUrl);
      if (linkedSidebarList && assetId) {
        linkedSidebarList.querySelectorAll(".linked-asset-card").forEach(c => {
          c.classList.toggle("is-active", c.dataset.assetCardId === assetId);
        });
      }
    }
  });

  editorSurface.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      insertExternalLink();
    }
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
    if (icon) icon.innerHTML = focusMode ? ICONS.focusExit : ICONS.focusExpand;
    if (text) text.textContent = focusMode ? "Exit Focus" : "Focus";
  });

  // -------------------------------------------------------------
  // EXPORT MENU & ACTIONS
  // -------------------------------------------------------------
  const toggleExportBtn = container.querySelector("[data-toggle-export-menu]");
  toggleExportBtn?.addEventListener("click", e => {
    e.stopPropagation();
    if (exportMenu) exportMenu.hidden = !exportMenu.hidden;
  });
  document.addEventListener("click", () => {
    if (exportMenu) exportMenu.hidden = true;
    if (layoutMenu) layoutMenu.hidden = true;
  });

  container.querySelector("[data-export-md]")?.addEventListener("click", () => {
    const active = getActiveScript();
    const title = active?.title || "script";
    const md = `# ${title}\n\n` + htmlToMarkdown(editorSurface.innerHTML);
    downloadBlob(new Blob([md], { type: "text/markdown;charset=utf-8" }), `${slugify(title)}.md`);
  });

  container.querySelector("[data-export-txt]")?.addEventListener("click", () => {
    const active = getActiveScript();
    const title = active?.title || "script";
    const text = `${title}\n\n` + (editorSurface.innerText || "");
    downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), `${slugify(title)}.txt`);
  });

  container.querySelector("[data-copy-formatted]")?.addEventListener("click", async () => {
    const text = editorSurface.innerText || "";
    try {
      await navigator.clipboard.writeText(text);
      notify("Script copied to clipboard!");
    } catch {
      notify("Could not copy automatically.");
    }
  });

  container.querySelector("[data-print-script]")?.addEventListener("click", () => {
    window.print();
  });

  // -------------------------------------------------------------
  // LAYOUT ADJUSTER CONTROLS
  // -------------------------------------------------------------
  const layoutMenu = container.querySelector("[data-layout-menu]");
  const toggleLayoutBtn = container.querySelector("[data-toggle-layout-menu]");
  toggleLayoutBtn?.addEventListener("click", e => {
    e.stopPropagation();
    if (layoutMenu) layoutMenu.hidden = !layoutMenu.hidden;
  });

  let savedLayout = { width: "820px", size: "15.5px", wpm: 135 };
  try {
    const raw = localStorage.getItem("cx_scripts_layout");
    if (raw) savedLayout = { ...savedLayout, ...JSON.parse(raw) };
  } catch {}

  function applyLayoutPrefs() {
    container.style.setProperty("--scripts-editor-width", savedLayout.width);
    container.style.setProperty("--scripts-editor-size", savedLayout.size);
    layoutMenu?.querySelectorAll("[data-set-width]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.setWidth === savedLayout.width);
    });
    layoutMenu?.querySelectorAll("[data-set-size]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.setSize === savedLayout.size);
    });
    layoutMenu?.querySelectorAll("[data-set-wpm]").forEach(btn => {
      btn.classList.toggle("active", Number(btn.dataset.setWpm) === Number(savedLayout.wpm));
    });
  }
  applyLayoutPrefs();

  layoutMenu?.querySelectorAll("[data-set-width]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      savedLayout.width = btn.dataset.setWidth;
      try { localStorage.setItem("cx_scripts_layout", JSON.stringify(savedLayout)); } catch {}
      applyLayoutPrefs();
    });
  });

  layoutMenu?.querySelectorAll("[data-set-size]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      savedLayout.size = btn.dataset.setSize;
      try { localStorage.setItem("cx_scripts_layout", JSON.stringify(savedLayout)); } catch {}
      applyLayoutPrefs();
    });
  });

  layoutMenu?.querySelectorAll("[data-set-wpm]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      savedLayout.wpm = Number(btn.dataset.setWpm);
      try { localStorage.setItem("cx_scripts_layout", JSON.stringify(savedLayout)); } catch {}
      applyLayoutPrefs();
      const active = getActiveScript();
      if (active) {
        active.targetWpm = savedLayout.wpm;
        triggerAutoSave();
        updateMetrics();
      }
    });
  });

  layoutMenu?.querySelector("[data-toggle-sidebar-view]")?.addEventListener("click", e => {
    e.stopPropagation();
    container.classList.toggle("hide-explorer");
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
        readableBlocks.push(`<h2 class="prompter-heading">${escapeHTML(text)}</h2>`);
      } else {
        readableBlocks.push(`<p class="prompter-para">${node.innerHTML}</p>`);
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
        <span class="prompter-script-title">${escapeHTML(script.title)}</span>
      </div>

      <div class="prompter-bar-center">
        <!-- WPM Speed Controller -->
        <div class="prompter-wpm-control">
          <div class="prompter-wpm-label-row">
            <label for="prompter-wpm-slider">Speed: <b data-prompter-wpm-val>${wpm}</b> WPM</label>
            <div class="prompter-speed-presets" role="group" aria-label="Speed Presets">
              <button type="button" class="prompter-preset-btn ${wpm === 115 ? "active" : ""}" data-set-prompter-wpm="115">115</button>
              <button type="button" class="prompter-preset-btn ${wpm === 135 ? "active" : ""}" data-set-prompter-wpm="135">135</button>
              <button type="button" class="prompter-preset-btn ${wpm === 160 ? "active" : ""}" data-set-prompter-wpm="160">160</button>
              <button type="button" class="prompter-preset-btn ${wpm === 185 ? "active" : ""}" data-set-prompter-wpm="185">185</button>
            </div>
          </div>
          <input type="range" id="prompter-wpm-slider" min="90" max="240" step="5" value="${wpm}" data-wpm-slider>
        </div>

        <!-- Font Size Slider -->
        <div class="prompter-font-control">
          <label for="prompter-font-slider">Size: <b data-font-val>${fontSize}px</b></label>
          <input type="range" id="prompter-font-slider" min="26" max="72" step="2" value="${fontSize}" data-font-slider>
        </div>

        <!-- Mirror / Glass Mode Toggle -->
        <button type="button" class="prompter-bar-btn toggle-btn" data-toggle-mirror title="Flip text horizontally for teleprompter glass hardware">
          Mirror Mode
        </button>
      </div>

      <div class="prompter-bar-right">
        <div class="prompter-live-timer" data-prompter-timer>00:00</div>
        <button type="button" class="prompter-play-btn" data-toggle-play>
          <span data-play-icon class="studio-inline-svg">${ICONS.play}</span> <span data-play-label>Start (Space)</span>
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
      <div class="prompter-scroll-track" data-prompter-track style="font-size:${fontSize}px;">
        <div class="prompter-padding-top"></div>
        ${readableBlocks.join("")}
        <div class="prompter-padding-bottom"></div>
      </div>
    </div>

    <!-- Shortcuts Hint Bar -->
    <footer class="prompter-shortcuts-hint-bar" aria-label="Teleprompter Shortcuts">
      <span><kbd>Space</kbd> Play / Pause</span>
      <span class="hint-sep">·</span>
      <span><kbd>R</kbd> Restart</span>
      <span class="hint-sep">·</span>
      <span><kbd>↑</kbd> <kbd>↓</kbd> Adjust Speed</span>
      <span class="hint-sep">·</span>
      <span><kbd>Esc</kbd> Exit</span>
    </footer>

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

  // WPM Speed Presets
  prompter.querySelectorAll("[data-set-prompter-wpm]").forEach(btn => {
    btn.addEventListener("click", () => {
      wpm = Number(btn.dataset.setPrompterWpm);
      wpmSlider.value = wpm;
      wpmVal.textContent = wpm;
      prompter.querySelectorAll("[data-set-prompter-wpm]").forEach(b => b.classList.toggle("active", b === btn));
      onWpmChange(wpm);
    });
  });

  // WPM Slider
  wpmSlider.addEventListener("input", () => {
    wpm = Number(wpmSlider.value);
    wpmVal.textContent = wpm;
    prompter.querySelectorAll("[data-set-prompter-wpm]").forEach(b => {
      b.classList.toggle("active", Number(b.dataset.setPrompterWpm) === wpm);
    });
    onWpmChange(wpm);
  });

  // Font Slider
  fontSlider.addEventListener("input", () => {
    fontSize = Number(fontSlider.value);
    fontVal.textContent = `${fontSize}px`;
    track.style.fontSize = `${fontSize}px`;
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
    playIcon.innerHTML = ICONS.pause;
    playLabel.textContent = "Pause (Space)";
    lastTimestamp = null;
    scrollAccumulator = 0;

    if (!timerInterval) {
      startTime = Date.now() - elapsedSeconds * 1000;
      timerInterval = setInterval(() => {
        elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const m = Math.floor(elapsedSeconds / 60);
        const s = elapsedSeconds % 60;
        timerEl.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      }, 500);
    }

    animFrame = requestAnimationFrame(stepScroll);
  }

  function pauseScroll() {
    isPlaying = false;
    playIcon.innerHTML = ICONS.play;
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
  const targetUrl = pid ? `#workspace?project=${encodeURIComponent(pid)}&panel=scripts` : "#workspace?panel=scripts";
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
  const showcaseLink = `${window.location.origin}${window.location.pathname}#workspace?panel=showcase&script=${encodeURIComponent(script.id)}&project=${encodeURIComponent(project.id || project.project_id || "default")}`;

  modal.innerHTML = `
    <div class="script-showcase-modal">
      <header class="showcase-header">
        <div class="showcase-header-tag">
          <span class="cx-showcase-pill">CONTENT X · PUBLIC SHOWCASE</span>
          <span class="cx-verified-pill">${ICONS.check} Verified Production</span>
        </div>
        <button type="button" class="script-studio-close" data-close-showcase aria-label="Close">${ICONS.close}</button>
      </header>
      <div class="showcase-body">
        <div class="showcase-hero">
          <span class="showcase-project-name">Project: ${escapeHTML(project.name)}</span>
          <h2>${escapeHTML(script.title)}</h2>
          <div class="showcase-meta-row">
            <span><b>${metrics.durationFormatted}</b> Teleprompter Speaking Duration</span>
            <span><b>${metrics.words}</b> Words (~${metrics.targetWpm} WPM)</span>
            <span class="showcase-live-badge"><span class="cx-live-pulse-dot"></span> Published on Website</span>
          </div>
        </div>

        ${primaryVideoUrl ? `
          <div class="showcase-media-frame">
            ${embedUrl ? `<iframe src="${embedUrl}" allowfullscreen></iframe>` : `
              <div class="showcase-external-video-card">
                <span class="showcase-play-icon">${ICONS.play}</span>
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

// -------------------------------------------------------------
// STANDALONE PUBLIC/CLIENT SHOWCASE VIEW
// Renders inside the workspace surface for #workspace?panel=showcase
// -------------------------------------------------------------
export async function renderScriptShowcaseSurface(container, { project, projects = [], files = [], actions = {}, params = null } = {}) {
  const scriptId = params?.get("script");
  const projectId = project?.id || project?.project_id || params?.get("project") || (projects[0]?.project_id || projects[0]?.id);
  const scripts = getStorageScripts(projectId);
  const script = scriptId ? scripts.find(s => s.id === scriptId) || scripts[0] : scripts[0];

  if (!script) {
    container.innerHTML = `
      <div class="showcase-empty-state">
        <span class="studio-empty-icon">${ICONS.film}</span>
        <h3>No Published Script Found</h3>
        <p>This script may not have been published yet or is being edited.</p>
        <a class="workspace-button primary" href="${projectId ? `#workspace?project=${encodeURIComponent(projectId)}&panel=scripts` : "#workspace?panel=scripts"}">Open in Scripts Studio</a>
      </div>
    `;
    return;
  }

  const metrics = calculateSpeechMetrics(script.content ? script.content.replace(/<[^>]*>/g, "") : "", script.targetWpm || 135);
  const primaryLink = (script.videoLinks || [])[0];
  const primaryAsset = (script.attachedAssets || [])[0];
  const primaryVideoUrl = primaryLink?.url || primaryAsset?.url || null;
  const embedUrl = primaryVideoUrl ? getVideoEmbedUrl(primaryVideoUrl) : null;
  const showcaseLink = window.location.href;

  container.innerHTML = `
    <div class="workspace-showcase-container">
      <header class="showcase-page-header">
        <div class="showcase-header-left">
          <a class="workspace-button subtle" href="#workspace?project=${encodeURIComponent(projectId)}&panel=scripts">← Back to Editor</a>
          <span class="cx-showcase-pill">CONTENT X · PUBLIC SHOWCASE</span>
          <span class="cx-verified-pill">${ICONS.check} Verified Production</span>
        </div>
        <div class="showcase-header-actions">
          <button type="button" class="workspace-button subtle" data-copy-showcase-link>
            <span class="studio-inline-svg">${ICONS.link}</span> Copy Share Link
          </button>
          <a class="workspace-button primary" href="#pricing">Get Video Editing →</a>
        </div>
      </header>

      <div class="showcase-surface-body">
        <div class="showcase-hero-banner">
          <div class="showcase-proj-tag">Project: ${escapeHTML(project?.name || "Content X Workspace")}</div>
          <h1 class="showcase-main-title">${escapeHTML(script.title || "Untitled Script")}</h1>
          <div class="showcase-meta-row">
            <span><b>${metrics.durationFormatted}</b> Speaking Duration</span>
            <span><b>${metrics.words}</b> Words (~${metrics.targetWpm} WPM)</span>
            <span class="showcase-live-badge"><span class="cx-live-pulse-dot"></span> Published Live on Website</span>
            <span class="showcase-realtime-badge">Real-time sync</span>
          </div>
        </div>

        <div class="showcase-content-split ${primaryVideoUrl ? "has-video" : "no-video"}">
          ${primaryVideoUrl ? `
            <div class="showcase-media-column">
              <div class="showcase-media-frame">
                ${embedUrl ? `<iframe src="${embedUrl}" allowfullscreen></iframe>` : `
                  <div class="showcase-external-video-card">
                    <span class="showcase-play-icon">${ICONS.play}</span>
                    <div class="showcase-video-info">
                      <strong>${escapeHTML(primaryLink?.title || primaryAsset?.name || "Attached Video Cut")}</strong>
                      <small>${escapeHTML(primaryLink?.platform || "Direct Video")}: ${escapeHTML(primaryVideoUrl)}</small>
                    </div>
                    <a href="${escapeHTML(primaryVideoUrl)}" target="_blank" rel="noopener noreferrer" class="workspace-button primary">Watch Cut ↗</a>
                  </div>
                `}
              </div>
            </div>
          ` : ""}

          <div class="showcase-script-column">
            <div class="showcase-script-card">
              <div class="showcase-script-head">
                <strong>Hook Breakdown &amp; Production Cues</strong>
                <button type="button" class="workspace-button subtle" data-copy-showcase-text>Copy Script</button>
              </div>
              <div class="showcase-script-content">
                ${script.content || "<p><em>No script content yet.</em></p>"}
              </div>
            </div>
          </div>
        </div>

        <div class="showcase-page-footer">
          <div class="showcase-share-input-group">
            <input type="text" readonly value="${escapeHTML(showcaseLink)}" data-showcase-page-url>
            <button type="button" class="workspace-button primary" data-copy-page-url>Copy Public Link</button>
          </div>
          <div class="showcase-cta-strip">
            <span>Want retention-led short-form videos edited like this?</span>
            <a href="#pricing" class="workspace-button primary">View Content X Plans →</a>
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelector("[data-copy-showcase-link]")?.addEventListener("click", async e => {
    try {
      await navigator.clipboard.writeText(showcaseLink);
      const btn = e.currentTarget;
      const old = btn.innerHTML;
      btn.innerHTML = `${ICONS.check} Copied!`;
      setTimeout(() => { if (btn.isConnected) btn.innerHTML = old; }, 1800);
    } catch {}
  });

  container.querySelector("[data-copy-page-url]")?.addEventListener("click", async e => {
    try {
      await navigator.clipboard.writeText(showcaseLink);
      const btn = e.currentTarget;
      const old = btn.textContent;
      btn.textContent = "Copied! ✓";
      setTimeout(() => { if (btn.isConnected) btn.textContent = old; }, 1800);
    } catch {}
  });

  container.querySelector("[data-copy-showcase-text]")?.addEventListener("click", async e => {
    const text = container.querySelector(".showcase-script-content")?.innerText || "";
    try {
      await navigator.clipboard.writeText(text);
      const btn = e.currentTarget;
      const old = btn.textContent;
      btn.textContent = "Copied ✓";
      setTimeout(() => { if (btn.isConnected) btn.textContent = old; }, 1800);
    } catch {}
  });
}
