import { recordNotification } from "./features.js";

const marketStore = {
  get(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  remove(key) { localStorage.removeItem(key); }
};

const roleOptions = [
  "Video Editor",
  "Scriptwriter",
  "Social Media Manager",
  "Content Strategist",
  "Thumbnail Designer",
  "Video Idea Creator"
];

const seedTalent = [
  {
    id: "arjun-editor", initials: "AM", name: "Arjun Mehta", role: "Video Editor", city: "Mumbai",
    headline: "Retention-first reels with cinematic pacing", rating: 4.9, reviews: 38, jobs: 64, delivery: "2–3 days", verified: true,
    bio: "I edit founder, fitness and education content for viewers who decide in the first three seconds. Every cut is built around clarity, rhythm and a strong visual hook.",
    skills: ["Short-form", "Motion graphics", "Sound design", "Captions"],
    samples: [
      { title: "Fitness launch reel", kind: "video", src: "videos/premium1.mp4", tag: "Premium edit" },
      { title: "Founder story", kind: "video", src: "videos/premium2.mp4", tag: "Narrative" },
      { title: "Product reveal", kind: "video", src: "videos/standard3.mp4", tag: "Motion" }
    ],
    packages: [
      { name: "Starter", price: 2200, delivery: "3 days", description: "One polished reel with captions", features: ["Up to 60 seconds", "Clean captions", "2 revisions"] },
      { name: "Growth", price: 3500, delivery: "3 days", description: "High-retention edit with visual layers", features: ["Advanced captions", "B-roll + sound design", "2 revisions"] },
      { name: "Signature", price: 5200, delivery: "4 days", description: "Premium edit with creative direction", features: ["Motion graphics", "Hook consultation", "Priority support"] }
    ]
  },
  {
    id: "sara-writer", initials: "SK", name: "Sara Khan", role: "Scriptwriter", city: "Delhi",
    headline: "Natural scripts engineered for watch time", rating: 4.8, reviews: 29, jobs: 51, delivery: "1–2 days", verified: true,
    bio: "I turn expertise into scripts people want to finish. My work is research-backed, conversational and structured for Reels, Shorts and founder-led content.",
    skills: ["Hooks", "Research", "Reels", "Founder voice"],
    samples: [
      { title: "The 3-second fitness myth", kind: "copy", copy: "You do not need more motivation. You need a plan that still works on your worst day.", tag: "Fitness" },
      { title: "Founder authority series", kind: "copy", copy: "Most founders explain what they sell. The memorable ones explain what they believe.", tag: "Founder" },
      { title: "Product education hook", kind: "copy", copy: "Before you buy another tool, ask whether it removes work—or simply moves it somewhere else.", tag: "SaaS" }
    ],
    packages: [
      { name: "Starter", price: 900, delivery: "2 days", description: "One ready-to-shoot short script", features: ["Hook + body + CTA", "Up to 60 seconds", "2 revisions"] },
      { name: "Series", price: 4000, delivery: "4 days", description: "Five connected short-form scripts", features: ["Topic research", "5 distinct hooks", "Brand voice notes"] },
      { name: "Authority", price: 7500, delivery: "6 days", description: "Ten-script thought leadership system", features: ["Content research", "10 scripts", "Series strategy"] }
    ]
  },
  {
    id: "ravi-social", initials: "RV", name: "Ravi Verma", role: "Social Media Manager", city: "Bengaluru",
    headline: "Calm, consistent social systems for growing brands", rating: 4.9, reviews: 21, jobs: 32, delivery: "Monthly", verified: true,
    bio: "I manage the complete publishing loop—calendar, captions, scheduling, community and reporting—so content does not disappear after it is edited.",
    skills: ["Instagram", "Calendars", "Community", "Reporting"],
    samples: [
      { title: "30-day creator calendar", kind: "metric", metric: "+42%", copy: "Profile reach", tag: "Strategy" },
      { title: "Fitness community sprint", kind: "metric", metric: "3.1×", copy: "More saves", tag: "Growth" },
      { title: "Founder launch month", kind: "metric", metric: "28", copy: "Posts shipped", tag: "Operations" }
    ],
    packages: [
      { name: "Essential", price: 12000, delivery: "Monthly", description: "Reliable publishing for one channel", features: ["12 posts/month", "Scheduling", "Monthly report"] },
      { name: "Growth", price: 20000, delivery: "Monthly", description: "Planning, publishing and community", features: ["20 posts/month", "Community replies", "Content calendar"] },
      { name: "Managed", price: 32000, delivery: "Monthly", description: "Full social media operation", features: ["30 posts/month", "Two channels", "Weekly reporting"] }
    ]
  },
  {
    id: "naina-strategy", initials: "NK", name: "Naina Kapoor", role: "Content Strategist", city: "Pune",
    headline: "Content systems built around a real business goal", rating: 4.8, reviews: 18, jobs: 27, delivery: "3–5 days", verified: true,
    bio: "I translate positioning, audience insight and business goals into content pillars, repeatable formats and a practical publishing roadmap.",
    skills: ["Positioning", "Content pillars", "Research", "Campaigns"],
    samples: [
      { title: "Founder positioning map", kind: "metric", metric: "4", copy: "Repeatable series", tag: "B2B" },
      { title: "90-day launch roadmap", kind: "metric", metric: "90", copy: "Days planned", tag: "Launch" },
      { title: "Audience insight sprint", kind: "metric", metric: "26", copy: "Hooks validated", tag: "Research" }
    ],
    packages: [
      { name: "Clarity", price: 4500, delivery: "3 days", description: "Focused strategy audit", features: ["Channel review", "3 content pillars", "30-minute handoff"] },
      { name: "Roadmap", price: 9000, delivery: "5 days", description: "One-month content roadmap", features: ["Audience research", "20 content ideas", "Publishing plan"] },
      { name: "Partner", price: 18000, delivery: "Monthly", description: "Ongoing strategy partnership", features: ["Monthly roadmap", "Weekly review", "Performance insights"] }
    ]
  },
  {
    id: "priya-design", initials: "PD", name: "Priya Das", role: "Thumbnail Designer", city: "Kolkata",
    headline: "High-clarity covers that earn the click", rating: 4.9, reviews: 44, jobs: 79, delivery: "1–2 days", verified: true,
    bio: "I design expressive YouTube thumbnails and Instagram covers that make the promise of the content instantly clear without looking like clickbait.",
    skills: ["YouTube", "Reel covers", "Photo compositing", "Brand systems"],
    samples: [
      { title: "Founder playbook", kind: "poster", tone: "orange", copy: "THE GROWTH PLAYBOOK", tag: "YouTube" },
      { title: "Fitness reset", kind: "poster", tone: "violet", copy: "30 DAYS. START NOW.", tag: "Fitness" },
      { title: "Creator systems", kind: "poster", tone: "green", copy: "POST LESS. GROW MORE.", tag: "Education" }
    ],
    packages: [
      { name: "Single", price: 800, delivery: "2 days", description: "One custom thumbnail or cover", features: ["2 concepts", "High-resolution export", "2 revisions"] },
      { name: "Series", price: 3500, delivery: "4 days", description: "Five coordinated designs", features: ["5 covers", "Consistent visual system", "Editable text"] },
      { name: "Channel", price: 6500, delivery: "6 days", description: "Ten designs and reusable style", features: ["10 covers", "Visual direction", "Template handoff"] }
    ]
  },
  {
    id: "kabir-ideas", initials: "KS", name: "Kabir Shah", role: "Video Idea Creator", city: "Ahmedabad",
    headline: "Fresh repeatable video ideas—not trend copies", rating: 4.7, reviews: 16, jobs: 24, delivery: "2–4 days", verified: true,
    bio: "I research audiences and adjacent categories to create original hooks, formats and series that a creator can repeat without becoming predictable.",
    skills: ["Idea research", "Formats", "Trend analysis", "Series"],
    samples: [
      { title: "Expert reacts—without reacting", kind: "copy", copy: "Take a popular claim, test it live, and show the evidence before revealing your conclusion.", tag: "Format" },
      { title: "One mistake, three budgets", kind: "copy", copy: "Solve the same audience problem at starter, standard and premium budgets.", tag: "Series" },
      { title: "The invisible before-and-after", kind: "copy", copy: "Show the workflow change instead of the final result; the process becomes the proof.", tag: "Idea" }
    ],
    packages: [
      { name: "Spark", price: 1200, delivery: "2 days", description: "Five tailored video ideas", features: ["5 hooks", "Format notes", "Audience fit"] },
      { name: "Series", price: 3500, delivery: "4 days", description: "Fifteen ideas across three series", features: ["15 ideas", "3 repeatable formats", "Reference research"] },
      { name: "Idea Bank", price: 6500, delivery: "6 days", description: "Thirty-day idea bank", features: ["30 ideas", "Priority ranking", "Monthly themes"] }
    ]
  }
];

function escapeHTML(value = "") {
  const div = document.createElement("div");
  div.textContent = String(value);
  return div.innerHTML;
}

function money(value) { return `₹${Number(value).toLocaleString("en-IN")}`; }

function toast(message) {
  let element = document.querySelector(".global-toast");
  if (!element) { element = document.createElement("div"); element.className = "global-toast"; document.body.append(element); }
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(element._timer);
  element._timer = setTimeout(() => element.classList.remove("show"), 2600);
}

function getTalent() {
  // Provider-submitted listings and portfolios stay private. Only the curated
  // demo directory is public; owner-reviewed applicants are matched manually.
  return [...seedTalent];
}

function renderSample(sample) {
  if (sample.kind === "video") return `<div class="market-sample-media"><video src="${escapeHTML(sample.src)}" muted loop playsinline preload="metadata"></video><button type="button" data-preview-video aria-label="Play ${escapeHTML(sample.title)}">▶</button></div>`;
  if (sample.kind === "poster") return `<div class="market-poster ${escapeHTML(sample.tone)}"><span>${escapeHTML(sample.copy)}</span></div>`;
  if (sample.kind === "metric") return `<div class="market-metric"><strong>${escapeHTML(sample.metric)}</strong><span>${escapeHTML(sample.copy)}</span></div>`;
  return `<blockquote>“${escapeHTML(sample.copy || sample.url || "Portfolio sample") }”</blockquote>`;
}

function marketplaceHeader(active = "hire") {
  if (active === "offer") return `<header class="market-header"><a class="brand" href="#home"><span class="brand-mark">CX</span><span>Content X</span></a><nav><a href="#offer-services" class="active">Private service listing</a><a href="#provider-workspace">Assigned work</a><span class="provider-private-nav">⌾ Owner-only portfolio</span></nav><div><button class="theme-toggle" data-market-theme aria-label="Toggle theme">${document.documentElement.dataset.theme === "dark" ? "☀" : "☾"}</button><a class="pill pill-hot" href="#provider-workspace">Provider portal</a></div></header>`;
  return `<header class="market-header"><a class="brand" href="#home"><span class="brand-mark">CX</span><span>Content X</span></a><nav><a href="#marketplace" class="${active === "hire" ? "active" : ""}">Start a project</a><a href="#offer-services">Offer services</a><a href="#workspace">Client workspace</a></nav><div><button class="theme-toggle" data-market-theme aria-label="Toggle theme">${document.documentElement.dataset.theme === "dark" ? "☀" : "☾"}</button><button class="pill pill-hot" type="button" data-header-brief>Submit private brief</button></div></header>`;
}

function bindMarketHeader(root, actions) {
  root.querySelector("[data-market-theme]")?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("cx_theme", next);
    root.querySelector("[data-market-theme]").textContent = next === "dark" ? "☀" : "☾";
  });
  root.querySelector('.market-header .brand')?.addEventListener("click", event => { event.preventDefault(); actions.openMarketing(); });
}

export function renderMarketplace(root, actions) {
  root.className = "marketplace-app";
  root.innerHTML = `${marketplaceHeader("hire")}<main class="market-main">
    <section class="market-hero managed-market-hero"><div><p class="eyebrow light"><span></span>Managed creative network</p><h1>Tell us the outcome.<br><em>We assemble the team.</em></h1><p>You work with one accountable Content X lead. We privately select the right editor, scriptwriter or specialist, manage quality, and keep delivery moving.</p><div><button class="pill pill-light" type="button" data-market-brief>Submit a private brief →</button><a class="pill pill-outline" href="#managed-specialties">See what we manage ↓</a></div></div><aside><span>ONE MANAGED SERVICE</span><ul><li><b>✓</b> One scope and one invoice</li><li><b>✓</b> Private specialist matching</li><li><b>✓</b> Content X quality control</li><li><b>✓</b> Versioned delivery & review</li></ul><small>Providers never see unassigned client posts or another provider’s listing.</small></aside></section>
    <section class="market-trust managed-trust"><span><b>6</b> specialist capabilities</span><span><b>1</b> accountable project lead</span><span><b>Private</b> briefs and portfolios</span><span><b>2 rounds</b> of revisions by default</span></section>
    <section id="managed-specialties" class="managed-specialties"><div class="market-results-head"><div><p class="eyebrow"><span></span>Built around your outcome</p><h2>The right capability, selected behind the scenes.</h2><p>Clients do not need to compare freelancers or manage multiple contracts. Content X creates the team and remains responsible for the result.</p></div><span class="managed-private-chip">⌾ PRIVATE MATCHING</span></div><div class="managed-role-grid">${[
      ["VE", "Video editing", "Retention-led edits, captions, motion, sound and platform-ready exports.", "Video Editor"],
      ["SW", "Scriptwriting", "Research-backed hooks and scripts shaped around your natural voice.", "Scriptwriter"],
      ["CS", "Content strategy", "Positioning, content pillars and a practical roadmap tied to a business goal.", "Content Strategist"],
      ["SM", "Social management", "Calendars, publishing, community and clear performance reporting.", "Social Media Manager"],
      ["TD", "Thumbnails & covers", "High-clarity visual packaging designed to earn the click.", "Thumbnail Designer"],
      ["IC", "Ideas & formats", "Original, repeatable content concepts—not copied trend lists.", "Video Idea Creator"]
    ].map(([mark, title, copy, role]) => `<article><span>${mark}</span><h3>${title}</h3><p>${copy}</p><button type="button" data-role-brief="${role}">Include in my brief →</button></article>`).join("")}</div></section>
    <section class="market-how managed-how"><div><p class="eyebrow light"><span></span>How it works</p><h2>One protected path from brief to approval.</h2><p>Content X stays between the client and provider network, so responsibility never becomes unclear.</p></div><ol><li><span>01</span><h3>Share the goal</h3><p>Submit the outcome, scope, budget and deadline in a private brief.</p></li><li><span>02</span><h3>Approve the plan</h3><p>We recommend the package and privately select qualified specialists.</p></li><li><span>03</span><h3>Review the result</h3><p>Track versions, leave timestamped feedback and approve in one workspace.</p></li></ol></section>
    <section class="managed-value"><div><p class="eyebrow"><span></span>Your Content X layer</p><h2>You buy the result—not a freelancer’s hours.</h2></div><div class="managed-value-grid"><article><strong>01</strong><h3>Scope control</h3><p>Deliverables, revision limits, deadlines and acceptance criteria are clear before work begins.</p></article><article><strong>02</strong><h3>Quality ownership</h3><p>Content X reviews work, consolidates feedback and can replace a provider without disrupting the client.</p></article><article><strong>03</strong><h3>Commercial simplicity</h3><p>Clients see one Content X price. Provider rates, commissions and payouts remain private.</p></article></div></section>
    <section class="market-provider-cta"><div><p class="eyebrow"><span></span>For creative professionals</p><h2>List privately. Get matched deliberately.</h2><p>Submit your services, pricing and portfolio privately. Only the Content X owner and admin team can review it, then choose who fits each project.</p></div><button class="pill pill-hot" data-offer-services>Create a private service listing →</button></section>
  </main><footer class="market-footer"><span>© 2026 Content X</span><p>Private matching · One accountable team · Managed delivery</p><a href="#home">Back to agency website ↑</a></footer>`;
  bindMarketHeader(root, actions);
  root.querySelector("[data-offer-services]").addEventListener("click", actions.openProviderOnboarding);
  root.querySelectorAll("[data-market-brief], [data-header-brief]").forEach(button => button.addEventListener("click", () => openBriefModal()));
  root.querySelectorAll("[data-role-brief]").forEach(button => button.addEventListener("click", () => openBriefModal(button.dataset.roleBrief)));
}

export function renderTalentProfile(root, actions) {
  root.className = "marketplace-app talent-profile-app";
  root.innerHTML = `${marketplaceHeader("hire")}<main class="private-route-note"><span>⌾</span><p class="eyebrow"><span></span>Private matching is active</p><h1>Individual provider profiles are not public.</h1><p>Content X reviews portfolios, pricing and availability privately, then selects the right specialist after understanding your project. You receive one managed proposal and one accountable point of contact.</p><div><button class="pill pill-hot" type="button" data-private-route-brief>Submit a private brief →</button><button class="pill pill-dark" type="button" data-private-route-back>Back to managed services</button></div></main>`;
  bindMarketHeader(root, actions);
  root.querySelectorAll("[data-private-route-brief], [data-header-brief]").forEach(button => button.addEventListener("click", () => openBriefModal()));
  root.querySelector("[data-private-route-back]").addEventListener("click", actions.openMarketplace);
  return;
  const talent = getTalent();
  const selectedId = marketStore.get("cx_selected_talent", talent[0]?.id);
  const profile = talent.find(item => item.id === selectedId) || talent[0];
  if (!profile) return actions.openMarketplace();
  root.className = "marketplace-app talent-profile-app";
  root.innerHTML = `${marketplaceHeader("hire")}<main class="profile-main"><button class="market-back" data-back-market>← Back to all specialists</button>
    <section class="profile-hero"><div class="profile-person"><span>${escapeHTML(profile.initials)}</span><div><p>${escapeHTML(profile.role)} · ${escapeHTML(profile.city || "Remote")}</p><h1>${escapeHTML(profile.name)} <i>✓</i></h1><h2>${escapeHTML(profile.headline)}</h2><div><b>★ ${profile.rating}</b><span>${profile.reviews} reviews</span><span>${profile.jobs} projects</span><span>Replies within 4 hours</span></div></div></div><aside><span>CONTENT X VERIFIED</span><p>Identity, portfolio and service details reviewed by the Content X team.</p><button class="pill pill-dark" data-message-provider>Ask a question →</button></aside></section>
    <section class="profile-work"><div class="section-heading split"><div><p class="eyebrow"><span></span>Selected work</p><h2>Three samples. <em>No filler.</em></h2></div><p>Every specialist leads with the work that best represents the quality you can expect.</p></div><div class="profile-samples">${profile.samples.slice(0, 3).map((sample, index) => `<article>${renderSample(sample)}<div><span>0${index + 1} · ${escapeHTML(sample.tag || profile.role)}</span><h3>${escapeHTML(sample.title)}</h3></div></article>`).join("")}</div></section>
    <section class="profile-details"><div><p class="eyebrow"><span></span>About</p><h2>${escapeHTML(profile.headline)}</h2><p>${escapeHTML(profile.bio)}</p><div class="profile-skills">${profile.skills.map(skill => `<span>${escapeHTML(skill)}</span>`).join("")}</div><div class="profile-process"><h3>Working with ${escapeHTML(profile.name.split(" ")[0])}</h3><ol><li><b>1</b><span><strong>Share the brief</strong><small>Goals, references and source files stay in your Content X workspace.</small></span></li><li><b>2</b><span><strong>Review the first delivery</strong><small>Add clear timestamped comments and visual annotations.</small></span></li><li><b>3</b><span><strong>Approve and download</strong><small>Content X releases the final files after approval.</small></span></li></ol></div></div>
    <aside class="profile-packages"><div class="profile-package-tabs">${profile.packages.map((item, index) => `<button class="${index === 1 ? "active" : ""}" data-package-index="${index}">${escapeHTML(item.name)}</button>`).join("")}</div><div data-package-panel></div><div class="package-protection"><span>⌾</span><p><strong>Content X order protection</strong><small>Payment, communication, review and delivery are managed inside the platform.</small></p></div></aside></section>
  </main>`;
  bindMarketHeader(root, actions);
  root.querySelector("[data-back-market]").addEventListener("click", actions.openMarketplace);
  const panel = root.querySelector("[data-package-panel]");
  const showPackage = index => {
    const item = profile.packages[index];
    panel.innerHTML = `<p>${escapeHTML(item.description)}</p><div><strong>${money(item.price)}</strong><span>Delivery: ${escapeHTML(item.delivery)}</span></div><ul>${item.features.map(feature => `<li><b>✓</b>${escapeHTML(feature)}</li>`).join("")}</ul><button class="pill pill-hot" data-order-package>Choose ${escapeHTML(item.name)} →</button><small>Two revision rounds included unless stated otherwise.</small>`;
    panel.querySelector("[data-order-package]").addEventListener("click", () => {
      const commissionRate = Number(marketStore.get("cx_commission_rate", 20));
      actions.openCheckout({
        id: `market-${profile.id}-${item.name.toLowerCase()}`,
        name: `${profile.name} · ${item.name}`,
        price: Number(item.price), unit: item.delivery === "Monthly" ? "month" : "project",
        badge: "Content X protected order",
        features: [profile.role, item.description, ...item.features, `Delivery: ${item.delivery}`],
        marketplace: true, providerId: profile.id, providerName: profile.name, providerRole: profile.role,
        packageName: item.name, commissionRate
      });
    });
  };
  root.querySelectorAll("[data-package-index]").forEach(button => button.addEventListener("click", () => { root.querySelectorAll("[data-package-index]").forEach(item => item.classList.toggle("active", item === button)); showPackage(Number(button.dataset.packageIndex)); }));
  showPackage(Math.min(1, profile.packages.length - 1));
  root.querySelector("[data-message-provider]").addEventListener("click", () => openQuestionModal(profile));
  root.querySelectorAll("[data-preview-video]").forEach(button => button.addEventListener("click", () => { const video = button.parentElement.querySelector("video"); if (video.paused) { video.play(); button.textContent = "Ⅱ"; } else { video.pause(); button.textContent = "▶"; } }));
}

export function renderProviderOnboarding(root, actions) {
  return renderPrivateProviderOnboarding(root, actions);
  root.className = "marketplace-app provider-app";
  root.innerHTML = `${marketplaceHeader("offer")}<main class="provider-main"><section class="provider-intro"><p class="eyebrow light"><span></span>Offer services through Content X</p><h1>Show your best work.<br><em>Find better-fit clients.</em></h1><p>Build a focused public profile with three samples and clear package prices. Content X reviews the application, brings the client, manages payment and keeps the project organised.</p><div class="provider-points"><span><b>01</b> Submit a focused profile</span><span><b>02</b> Pass Content X review</span><span><b>03</b> Receive protected orders</span></div><div class="commission-note"><strong>Platform commission: 15–20%</strong><p>The current rate is shown before you accept an order and is deducted from your payout. There are no upfront listing fees in this prototype.</p></div><button class="provider-preview-link" type="button" data-provider-preview>Preview the provider workspace →</button></section>
    <section class="provider-form-wrap"><div class="provider-stepper"><span class="active" data-provider-step-dot="1">1</span><i></i><span data-provider-step-dot="2">2</span><i></i><span data-provider-step-dot="3">3</span></div><form class="provider-form"><section data-provider-step="1"><p class="eyebrow"><span></span>Step 1 of 3</p><h2>Your specialist profile</h2><p>Keep this specific. Clients should understand what you do in a few seconds.</p><div class="field-pair"><label>Full name<input name="name" required placeholder="Your full name"></label><label>Primary role<select name="role">${roleOptions.map(role => `<option>${role}</option>`).join("")}</select></label></div><label>Professional headline<input name="headline" required maxlength="90" placeholder="Example: Retention-first reels for coaches"></label><label>About your work<textarea name="bio" required minlength="80" placeholder="What do you specialise in, who do you help and how do you work?"></textarea></label><label>Core skills<input name="skills" required placeholder="Captions, motion graphics, sound design"></label><div class="field-pair"><label>Private email<input name="email" type="email" required></label><label>Private WhatsApp<input name="phone" required></label></div><small class="private-field-note">Contact details are visible only to the Content X owner, never on your public profile.</small><button type="button" class="pill pill-hot" data-provider-next>Continue to portfolio →</button></section>
      <section data-provider-step="2" hidden><p class="eyebrow"><span></span>Step 2 of 3</p><h2>Your strongest three samples</h2><p>Quality matters more than quantity. Add public portfolio or media links; the owner will review them before publication.</p>${[1,2,3].map(number => `<div class="sample-input"><span>0${number}</span><div><label>Sample title<input name="sampleTitle${number}" required placeholder="What was this project?"></label><label>Portfolio / media link<input name="sampleUrl${number}" type="url" required placeholder="https://…"></label></div></div>`).join("")}<div class="provider-buttons"><button type="button" data-provider-back>← Back</button><button type="button" class="pill pill-hot" data-provider-next>Continue to packages →</button></div></section>
      <section data-provider-step="3" hidden><p class="eyebrow"><span></span>Step 3 of 3</p><h2>Packages and pricing</h2><p>Give clients three clear choices. You can refine scope with the Content X owner before publishing.</p><div class="provider-package-fields">${["Starter", "Standard", "Premium"].map((name, index) => `<article><span>0${index + 1}</span><h3>${name}</h3><label>Package name<input name="packageName${index + 1}" required value="${name}"></label><label>Price (₹)<input name="packagePrice${index + 1}" type="number" min="300" required value="${[1200, 3000, 6000][index]}"></label><label>What is included<textarea name="packageDescription${index + 1}" required placeholder="Deliverables, length and revisions"></textarea></label></article>`).join("")}</div><label class="provider-agreement"><input name="agreement" type="checkbox" required><span>I understand that Content X manages the client relationship, protected payment and project workspace, and deducts the displayed 15–20% commission from completed orders.</span></label><div class="provider-buttons"><button type="button" data-provider-back>← Back</button><button class="pill pill-hot" type="submit">Submit for review →</button></div></section>
    </form></section></main>`;
  bindMarketHeader(root, actions);
  root.querySelector("[data-provider-preview]").addEventListener("click", actions.openProviderWorkspace);
  const form = root.querySelector(".provider-form");
  let step = 1;
  const showStep = next => {
    step = next;
    form.querySelectorAll("[data-provider-step]").forEach(section => section.hidden = Number(section.dataset.providerStep) !== step);
    root.querySelectorAll("[data-provider-step-dot]").forEach(dot => dot.classList.toggle("active", Number(dot.dataset.providerStepDot) <= step));
    root.querySelector(".provider-form-wrap").scrollIntoView({ behavior: "smooth", block: "start" });
  };
  form.querySelectorAll("[data-provider-next]").forEach(button => button.addEventListener("click", () => {
    const section = form.querySelector(`[data-provider-step="${step}"]`);
    if (![...section.querySelectorAll("input,textarea,select")].every(field => field.reportValidity())) return;
    showStep(Math.min(3, step + 1));
  }));
  form.querySelectorAll("[data-provider-back]").forEach(button => button.addEventListener("click", () => showStep(Math.max(1, step - 1))));
  form.addEventListener("submit", event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const profiles = marketStore.get("cx_market_providers", []);
    const profile = {
      id: Date.now(), name: data.name, role: data.role, headline: data.headline, bio: data.bio, skills: data.skills,
      email: data.email, phone: data.phone, status: "Pending review", created: new Date().toLocaleString(),
      samples: [1,2,3].map(number => ({ title: data[`sampleTitle${number}`], url: data[`sampleUrl${number}`], copy: data[`sampleUrl${number}`], kind: "copy", tag: "Submitted sample" })),
      packages: [1,2,3].map(number => ({ name: data[`packageName${number}`], price: Number(data[`packagePrice${number}`]), delivery: "To confirm", description: data[`packageDescription${number}`], features: [data[`packageDescription${number}`], "Content X protected delivery"] }))
    };
    profiles.unshift(profile);
    marketStore.set("cx_market_providers", profiles);
    root.querySelector(".provider-form-wrap").innerHTML = `<div class="provider-success"><span>✓</span><p class="eyebrow"><span></span>Application received</p><h2>Your profile is now in owner review.</h2><p>Content X will check your three samples, service clarity and pricing before anything becomes public.</p><dl><div><dt>Application</dt><dd>#CX-${String(profile.id).slice(-6)}</dd></div><div><dt>Status</dt><dd>Pending review</dd></div><div><dt>Role</dt><dd>${escapeHTML(profile.role)}</dd></div></dl><div class="provider-success-actions"><button class="pill pill-dark" data-back-marketplace>Browse marketplace</button><button class="pill pill-hot" data-open-provider-portal>Preview provider portal →</button></div></div>`;
    root.querySelector("[data-back-marketplace]").addEventListener("click", actions.openMarketplace);
    root.querySelector("[data-open-provider-portal]").addEventListener("click", actions.openProviderWorkspace);
    toast("Provider application added to Owner view.");
  });
}

export function renderProviderWorkspace(root, actions) {
  return renderPrivateProviderWorkspace(root, actions);
  const orders = marketStore.get("cx_market_orders", []);
  const payout = orders.reduce((total, order) => total + Number(order.providerPayout || 0), 0);
  const inProgress = orders.filter(order => !["Completed", "Approved"].includes(order.status)).length;
  root.className = "marketplace-app provider-workspace-app";
  root.innerHTML = `${marketplaceHeader("offer")}<main class="provider-workspace"><section class="provider-workspace-head"><div><p class="eyebrow"><span></span>Provider portal · local preview</p><h1>Your work, orders and <em>payouts.</em></h1><p>Accepted clients, protected messages, delivery status and earnings stay connected to each order.</p></div><button class="pill pill-dark" data-edit-provider-profile>Edit service profile →</button></section><div class="provider-dashboard-grid"><aside><div class="provider-portal-profile"><span>AM</span><h2>Arjun Mehta</h2><p>Video Editor · Verified provider</p><em>✓ Public profile active</em></div><nav><button class="active">⌂ Overview</button><button>▱ Active orders <b>${inProgress}</b></button><button>↗ Messages</button><button>₹ Payouts</button><button data-provider-public>◇ Public profile</button></nav><div class="provider-portal-rule"><strong>Content X managed</strong><p>Client contact details stay private. Keep every conversation and delivery inside the order room.</p></div></aside><section class="provider-workspace-content"><div class="provider-stats"><article><span>▱</span><strong>${orders.length}</strong><small>Total orders</small></article><article><span>◷</span><strong>${inProgress}</strong><small>Needs action</small></article><article><span>₹</span><strong>${money(payout)}</strong><small>Provider earnings</small></article><article><span>✦</span><strong>${Number(marketStore.get("cx_commission_rate", 20))}%</strong><small>Current commission</small></article></div><div class="dash-section-head"><div><h2>Protected orders</h2><p>Open an order to message the client, receive files and submit work.</p></div></div>${orders.length ? `<div class="provider-order-list">${orders.map(order => `<article><div><span>${escapeHTML((order.clientName || "Client").split(/\s+/).map(part => part[0]).join("").slice(0,2))}</span><p><strong>${escapeHTML(order.clientName || "Marketplace client")}</strong><small>${escapeHTML(order.packageName)} · ${escapeHTML(order.providerRole)}</small></p></div><em>${escapeHTML(order.status)}</em><p><small>Gross</small>${money(order.amount)}</p><p><small>Your payout</small>${money(order.providerPayout)}</p><button data-provider-order="${order.id}">Open order →</button></article>`).join("")}</div>` : '<div class="empty-state"><span>▱</span><h3>No assigned orders yet</h3><p>Paid client orders will appear here after the Content X owner confirms the match.</p></div>'}</section></div></main>`;
  bindMarketHeader(root, actions);
  root.querySelector("[data-edit-provider-profile]").addEventListener("click", actions.openProviderOnboarding);
  root.querySelector("[data-provider-public]").addEventListener("click", () => { marketStore.set("cx_selected_talent", "arjun-editor"); actions.openTalentProfile(); });
  root.querySelectorAll("[data-provider-order]").forEach(button => button.addEventListener("click", () => renderProviderOrderRoom(root, actions, Number(button.dataset.providerOrder))));
}

function renderProviderOrderRoom(root, actions, orderId) {
  const orders = marketStore.get("cx_market_orders", []);
  const order = orders.find(item => item.id === orderId);
  if (!order) return renderProviderWorkspace(root, actions);
  const allMessages = marketStore.get("cx_market_messages", {});
  const messages = allMessages[order.id] || [{ author: order.providerName, role: order.providerRole, text: "Thanks for the order. Please upload the brief and references when you are ready.", time: "Just now" }];
  root.className = "marketplace-app provider-workspace-app";
  root.innerHTML = `${marketplaceHeader("offer")}<main class="provider-order-page"><button class="market-back" data-provider-orders-back>← Back to provider orders</button><section class="provider-order-head"><div><p>Protected order · ${escapeHTML(order.code)}</p><h1>${escapeHTML(order.clientName || "Marketplace client")} · ${escapeHTML(order.packageName)}</h1><span class="status editing"><i></i>${escapeHTML(order.status)}</span></div><dl><div><dt>Gross value</dt><dd>${money(order.amount)}</dd></div><div><dt>Content X fee</dt><dd>−${money(order.commissionAmount)}</dd></div><div><dt>Your payout</dt><dd>${money(order.providerPayout)}</dd></div></dl></section><div class="provider-order-layout"><section class="order-room"><header><div><strong>Client conversation</strong><small>${escapeHTML(order.clientName || "Client")} · ${escapeHTML(order.providerName)} · Content X manager</small></div><span>Contact protected</span></header><div class="order-messages">${messages.map(message => `<article class="${message.author === order.providerName ? "mine" : ""}"><span>${escapeHTML(message.author.split(/\s+/).map(part => part[0]).join("").slice(0,2))}</span><div><strong>${escapeHTML(message.author)} <small>${escapeHTML(message.role)} · ${escapeHTML(message.time)}</small></strong><p>${escapeHTML(message.text)}</p></div></article>`).join("")}</div><form><input name="message" required placeholder="Reply to the client inside Content X…"><button type="submit">Send ↑</button></form></section><aside class="provider-delivery-card"><p class="eyebrow"><span></span>Delivery</p><h2>Submit work safely.</h2><p>Upload a draft or final file. The client will review it with timestamped comments and Content X protection.</p><button class="pill pill-hot" data-provider-delivery>↑ Upload delivery</button><input type="file" hidden multiple accept="video/*,image/*,.pdf,.doc,.docx"><label>Update order status<select data-provider-order-status>${["Paid · Brief needed","In progress","In review","Approved","Completed"].map(status => `<option ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}</select></label><div><strong>Included by default</strong><span>✓ Two revision rounds</span><span>✓ Version history</span><span>✓ Timestamped feedback</span><span>✓ Managed final approval</span></div></aside></div></main>`;
  bindMarketHeader(root, actions);
  root.querySelector("[data-provider-orders-back]").addEventListener("click", () => renderProviderWorkspace(root, actions));
  const picker = root.querySelector('.provider-delivery-card input[type="file"]');
  root.querySelector("[data-provider-delivery]").addEventListener("click", () => picker.click());
  picker.addEventListener("change", () => { const deliveries = marketStore.get("cx_market_deliveries", []); [...picker.files].forEach(file => deliveries.unshift({ id: Date.now() + Math.random(), orderId: order.id, name: file.name, size: file.size, type: file.type, status: "In review", created: new Date().toLocaleString() })); marketStore.set("cx_market_deliveries", deliveries); order.status = "In review"; marketStore.set("cx_market_orders", orders); recordNotification("delivery", "New specialist delivery", `${picker.files.length} protected delivery file${picker.files.length === 1 ? "" : "s"} uploaded for ${order.packageName}.`, { email: order.clientEmail, orderId: order.id }); toast(`${picker.files.length} protected delivery file${picker.files.length === 1 ? "" : "s"} uploaded.`); });
  root.querySelector("[data-provider-order-status]").addEventListener("change", event => { order.status = event.target.value; marketStore.set("cx_market_orders", orders); recordNotification(order.status === "Approved" || order.status === "Completed" ? "approval" : "feedback", "Specialist order updated", `${order.providerName} moved ${order.packageName} to ${order.status}.`, { email: order.clientEmail, orderId: order.id }); toast("Order status updated for the client and owner."); });
  root.querySelector(".order-room form").addEventListener("submit", event => {
    event.preventDefault();
    const input = event.currentTarget.elements.message;
    const result = screenMarketMessage(input.value);
    if (result.state === "blocked") return toast(result.message);
    if (result.state === "review") { const moderation = marketStore.get("cx_moderation", []); moderation.unshift({ id: Date.now(), orderId: order.id, text: input.value, source: "marketplace", author: order.providerName, status: "Pending", created: new Date().toLocaleString() }); marketStore.set("cx_moderation", moderation); input.value = ""; return toast("Provider link sent to the Content X owner for approval."); }
    messages.push({ author: order.providerName, role: order.providerRole, text: input.value, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) });
    allMessages[order.id] = messages;
    marketStore.set("cx_market_messages", allMessages);
    recordNotification("reply", `Message from ${order.providerName}`, input.value, { email: order.clientEmail, orderId: order.id });
    renderProviderOrderRoom(root, actions, order.id);
  });
}

function openBriefModal(preferredRole = "") {
  const draft = marketStore.get("cx_brief_draft", {});
  const minimumDate = new Date();
  minimumDate.setDate(minimumDate.getDate() + 1);
  const minDeadline = minimumDate.toISOString().slice(0, 10);
  const option = (value, label = value, selectedValue = preferredRole || draft.role) => `<option value="${escapeHTML(value)}" ${String(selectedValue) === value ? "selected" : ""}>${escapeHTML(label)}</option>`;
  const layer = document.createElement("div");
  layer.className = "modal-layer";
  layer.innerHTML = `<form class="market-modal managed-brief-modal" role="dialog" aria-modal="true" aria-labelledby="managed-brief-title"><button type="button" class="modal-close" aria-label="Close project brief">×</button><div class="brief-progress" aria-hidden="true"><span data-brief-progress></span></div><p class="eyebrow"><span></span>Private project brief</p><h2 id="managed-brief-title">Tell us the outcome.</h2><p>Content X will price and manage the complete service. Provider identities, rates and portfolios stay private.</p><div class="brief-privacy"><span>⌾</span><p><strong>Visible only to Content X</strong><small>Specialists see a brief only after the owner assigns it to them.</small></p></div><div class="field-pair"><label>Your name<input name="name" required autocomplete="name" value="${escapeHTML(draft.name || "")}" placeholder="Your name"></label><label>Work email<input name="email" type="email" required autocomplete="email" value="${escapeHTML(draft.email || "")}" placeholder="you@company.com"></label></div><label>What capability do you need?<select name="role">${option("Not sure yet")}${roleOptions.map(role => option(role)).join("")}</select></label><label>What should this project achieve?<textarea name="goal" required minlength="30" maxlength="600" placeholder="Describe the audience, goal and what success should look like…">${escapeHTML(draft.goal || "")}</textarea><small class="field-assist"><span>Include the audience and desired result.</span><b data-goal-count>0 / 600</b></small></label><label>Expected deliverables<textarea name="deliverables" maxlength="400" placeholder="Example: 12 reels, scripts, captions and monthly reporting">${escapeHTML(draft.deliverables || "")}</textarea></label><div class="field-pair"><label>Working budget<select name="budget" required>${["₹5,000–₹10,000","₹10,000–₹25,000","₹25,000–₹50,000","₹50,000+","Need a recommendation"].map(value => option(value, value, draft.budget)).join("")}</select></label><label>Needed by<input name="deadline" type="date" min="${minDeadline}" required value="${escapeHTML(draft.deadline || "")}"></label></div><label class="brief-consent"><input name="consent" type="checkbox" required ${draft.consent ? "checked" : ""}><span>I understand that Content X will manage the project and privately select the delivery team.</span></label><div class="brief-submit-row"><small data-draft-status>Draft saved on this device</small><button class="pill pill-hot" type="submit">Send private brief →</button></div></form>`;
  document.body.append(layer);
  const close = () => layer.remove();
  layer.querySelector(".modal-close").addEventListener("click", close);
  layer.addEventListener("click", event => { if (event.target === layer) close(); });
  const form = layer.querySelector("form"), goal = form.elements.goal, progress = form.querySelector("[data-brief-progress]"), count = form.querySelector("[data-goal-count]");
  const update = (persist = true) => {
    const fields = [...form.querySelectorAll("[required]")];
    const complete = fields.filter(field => field.type === "checkbox" ? field.checked : field.validity.valid).length;
    progress.style.width = `${Math.round((complete / fields.length) * 100)}%`;
    count.textContent = `${goal.value.length} / 600`;
    const data = Object.fromEntries(new FormData(form));
    data.consent = form.elements.consent.checked;
    if (persist) marketStore.set("cx_brief_draft", data);
  };
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update(false);
  form.addEventListener("submit", event => {
    event.preventDefault();
    const briefs = marketStore.get("cx_market_briefs", []);
    const id = Date.now(), data = Object.fromEntries(new FormData(event.currentTarget));
    briefs.unshift({ id, code: `CXB-${String(id).slice(-6)}`, ...data, status: "Owner review", visibility: "Owner and assigned provider only", created: new Date().toLocaleString() });
    marketStore.set("cx_market_briefs", briefs);
    marketStore.remove("cx_brief_draft");
    recordNotification("brief", "New private project brief", `${data.role}: ${data.goal}`, { email: data.email, briefId: id });
    layer.innerHTML = `<section class="market-modal brief-success" role="dialog" aria-modal="true" aria-labelledby="brief-success-title"><span>✓</span><p class="eyebrow"><span></span>Brief received</p><h2 id="brief-success-title">Content X will take it from here.</h2><p>We will review the scope, choose the right delivery structure and reply with one managed recommendation.</p><dl><div><dt>Reference</dt><dd>#CXB-${String(id).slice(-6)}</dd></div><div><dt>Visibility</dt><dd>Private</dd></div><div><dt>Status</dt><dd>Owner review</dd></div></dl><button class="pill pill-hot" type="button" data-close-brief>Done</button></section>`;
    layer.querySelector("[data-close-brief]").addEventListener("click", close);
    toast("Private brief saved for owner review.");
  });
}

function screenMarketMessage(text = "") {
  const contact = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text) || /(?:\+?\d[\s().-]*){9,}/.test(text) || /(^|\s)@[a-z0-9_.]{2,}/i.test(text) || /\b(whatsapp|telegram|instagram|insta|snapchat|phone number|email me|username)\b/i.test(text);
  const links = text.match(/https?:\/\/[^\s]+/gi) || [];
  if (contact) return { state: "blocked", message: "Direct contact details and social handles are not allowed. Please keep communication inside Content X." };
  if (links.length) return { state: "review", message: "This link was sent to the Content X manager for approval." };
  return { state: "allowed" };
}

function openQuestionModal(profile) {
  const layer = document.createElement("div");
  layer.className = "modal-layer";
  layer.innerHTML = `<form class="market-modal"><button type="button" class="modal-close">×</button><p class="eyebrow"><span></span>Protected question</p><h2>Ask ${escapeHTML(profile.name)} about the service.</h2><div class="communication-rule"><span>⌾</span><p><strong>Content X managed communication</strong><small>Contact details and social handles are blocked. Links require manager approval.</small></p></div><label>Your question<textarea name="message" required placeholder="Share the scope, style or delivery question…"></textarea></label><label>Your email<input type="email" name="email" required></label><button class="pill pill-hot" type="submit">Send through Content X →</button></form>`;
  document.body.append(layer);
  const close = () => layer.remove();
  layer.querySelector(".modal-close").addEventListener("click", close);
  layer.addEventListener("click", event => { if (event.target === layer) close(); });
  layer.querySelector("form").addEventListener("submit", event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const result = screenMarketMessage(data.message);
    if (result.state === "blocked") return toast(result.message);
    const questions = marketStore.get("cx_market_questions", []);
    const question = { id: Date.now(), ...data, providerId: profile.id, providerName: profile.name, status: result.state === "review" ? "Awaiting link approval" : "Sent", created: new Date().toLocaleString() };
    questions.unshift(question);
    marketStore.set("cx_market_questions", questions);
    if (result.state === "review") {
      const moderation = marketStore.get("cx_moderation", []);
      moderation.unshift({ id: question.id, text: data.message, source: "marketplace", author: "Marketplace client", status: "Pending", created: question.created });
      marketStore.set("cx_moderation", moderation);
    }
    close();
    toast(result.state === "review" ? result.message : "Question sent inside Content X.");
  });
}

export function enhanceMarketplaceMarketing(root, actions) {
  root.querySelector(".work-with-us")?.remove();
  const navActions = root.querySelector(".nav-actions");
  if (navActions && !navActions.querySelector("[data-hire-talent]")) {
    navActions.querySelector('a[target="_blank"]')?.remove();
    const login = navActions.querySelector('[data-action="login"]');
    login?.insertAdjacentHTML("beforebegin", '<button class="text-button" data-hire-talent>Build my team</button><button class="text-button" data-offer-market>Offer services</button>');
    navActions.insertAdjacentHTML("beforeend", '<button class="pill pill-hot" data-start-project>Start a project <span>↗</span></button>');
    navActions.querySelector("[data-hire-talent]").addEventListener("click", actions.openMarketplace);
    navActions.querySelector("[data-offer-market]").addEventListener("click", actions.openProviderOnboarding);
    navActions.querySelector("[data-start-project]").addEventListener("click", () => document.querySelector("#pricing")?.scrollIntoView({ behavior: "smooth" }));
  }
  const nav = root.querySelector(".site-nav nav");
  if (nav && !nav.querySelector('[href="#marketplace"]')) nav.insertAdjacentHTML("beforeend", '<a href="#marketplace">Managed team</a>');
  const existing = root.querySelector("#network");
  if (existing) existing.outerHTML = `<section id="network" class="market-teaser block-section"><div class="section-shell"><div class="section-heading split"><div><p class="eyebrow"><span></span>Content X marketplace</p><h2>Hire a specialist.<br><em>Or become one.</em></h2></div><p>A managed place for clients and creative professionals to work through Content X—with protected briefs, private portfolios and owner-controlled assignments.</p></div><div class="market-teaser-grid"><article><span>FOR CLIENTS</span><h3>Let Content X assemble the right team.</h3><p>Submit a private brief and the owner will review suitable specialists before assigning anyone to the project.</p><div>${["Video editors", "Scriptwriters", "Social managers", "Strategists", "Thumbnail designers", "Idea creators"].map(item => `<small>✓ ${item}</small>`).join("")}</div><button class="pill pill-light" data-teaser-hire>Submit a project brief →</button></article><article><span>FOR SPECIALISTS</span><h3>List your services privately.</h3><p>Your pricing and portfolio are visible only to Content X admins. Other providers cannot browse your submission or unassigned projects.</p><ul><li>Owner-only portfolio access</li><li>15–20% commission on completed work</li><li>Only assigned projects appear in your portal</li></ul><button class="pill pill-dark" data-teaser-offer>Create private listing →</button></article></div><div class="market-teaser-foot"><span>Submit</span><i>→</i><span>Owner review</span><i>→</i><span>Assign</span><i>→</i><span>Collaborate</span><i>→</i><span>Approve</span></div></div></section>`;
  root.querySelector("[data-teaser-hire]")?.addEventListener("click", actions.openMarketplace);
  root.querySelector("[data-teaser-offer]")?.addEventListener("click", actions.openProviderOnboarding);
}

export function enhanceMarketplaceDashboard(root, actions) {
  const nav = root.querySelector(".dash-sidebar nav");
  if (nav && !nav.querySelector('[data-dash="marketplace"]')) nav.insertAdjacentHTML("beforeend", '<button data-dash="marketplace"><span>✦</span>Request managed team</button><button data-dash="market-orders"><span>₹</span>Service orders <b></b></button>');
  const orders = marketStore.get("cx_market_orders", []);
  const badge = nav?.querySelector('[data-dash="market-orders"] b');
  if (badge) badge.textContent = orders.length;
  nav?.querySelector('[data-dash="marketplace"]')?.addEventListener("click", actions.openMarketplace);
  nav?.querySelector('[data-dash="market-orders"]')?.addEventListener("click", () => renderClientMarketOrders(root, actions));
}

function renderClientMarketOrders(root, actions) {
  const main = root.querySelector(".dash-main");
  const orders = marketStore.get("cx_market_orders", []);
  main.innerHTML = `<header class="dash-header"><div><p>Managed services</p><h1>Your Content X orders</h1></div><button class="pill pill-hot" data-find-specialist>Start another project →</button></header><div class="communication-rule"><span>⌾</span><p><strong>Managed by Content X</strong><small>Payment, messages, file delivery and approvals remain connected while provider rates and identities stay private.</small></p></div>${orders.length ? `<div class="client-market-orders">${orders.map(order => `<article><div><span>CX</span><div><strong>Content X delivery team</strong><small>${escapeHTML(order.providerRole)} · ${escapeHTML(order.packageName)}</small></div></div><p>${escapeHTML(order.status)}</p><strong>${money(order.amount)}</strong><button data-order-message="${order.id}">Open order →</button></article>`).join("")}</div>` : '<div class="empty-state"><span>✦</span><h3>No managed service orders yet</h3><p>Submit a private brief and Content X will recommend the right package and team.</p></div>'}`;
  main.querySelector("[data-find-specialist]").addEventListener("click", actions.openMarketplace);
  main.querySelectorAll("[data-order-message]").forEach(button => button.addEventListener("click", () => { marketStore.set("cx_selected_order", Number(button.dataset.orderMessage)); renderOrderRoom(main, actions); }));
}

function renderOrderRoom(main, actions) {
  const orders = marketStore.get("cx_market_orders", []);
  const order = orders.find(item => item.id === marketStore.get("cx_selected_order")) || orders[0];
  if (!order) return actions.openMarketplace();
  const allMessages = marketStore.get("cx_market_messages", {});
  const messages = allMessages[order.id] || [{ author: order.providerName, role: order.providerRole, text: "Thanks for the order. Please upload the brief and references when you are ready.", time: "Just now" }];
  const linkReviews = marketStore.get("cx_moderation", []).filter(item => item.source === "marketplace" && item.orderId === order.id);
  main.innerHTML = `<header class="dash-header"><div><p>Protected managed-service order</p><h1>Content X · ${escapeHTML(order.packageName)}</h1></div><button class="pill pill-dark" data-all-orders>← All orders</button></header><div class="order-room-summary"><span class="status editing"><i></i>${escapeHTML(order.status)}</span><p>${escapeHTML(order.providerRole)}</p><strong>${money(order.amount)}</strong><button data-order-upload>↑ Upload brief or assets</button><input type="file" hidden multiple accept="video/*,image/*,.pdf,.doc,.docx"></div><section class="order-room"><header><div><strong>Order conversation</strong><small>Client · Content X delivery team</small></div><span>Managed by Content X</span></header><div class="order-messages">${messages.map(message => { const providerMessage = message.author === order.providerName; const author = providerMessage ? "Content X delivery team" : message.author; const role = providerMessage ? "Managed specialist" : message.role; return `<article class="${message.author === "You" ? "mine" : ""}"><span>${escapeHTML(author.split(/\s+/).map(part => part[0]).join("").slice(0,2))}</span><div><strong>${escapeHTML(author)} <small>${escapeHTML(role)} · ${escapeHTML(message.time)}</small></strong><p>${escapeHTML(message.text)}</p></div></article>`; }).join("")}${linkReviews.map(item => `<article class="mine"><span>↗</span><div><strong>Media link <small>Content X review</small></strong><p>External link submitted securely</p><em class="moderation-status ${item.status.toLowerCase()}">${item.status === "Pending" ? "◷ Awaiting manager approval" : item.status === "Approved" ? "✓ Link approved" : "× Link not approved"}</em></div></article>`).join("")}</div><form><input name="message" required placeholder="Keep the conversation inside Content X…"><button type="submit">Send ↑</button></form></section>`;
  main.querySelector("[data-all-orders]").addEventListener("click", () => renderClientMarketOrders({ querySelector: selector => selector === ".dash-main" ? main : null }, actions));
  const picker = main.querySelector('input[type="file"]');
  main.querySelector("[data-order-upload]").addEventListener("click", () => picker.click());
  picker.addEventListener("change", () => { recordNotification("upload", "Marketplace files uploaded", `${picker.files.length} brief or asset file${picker.files.length === 1 ? "" : "s"} added to ${order.packageName}.`, { email: order.clientEmail, orderId: order.id }); toast(`${picker.files.length} file${picker.files.length === 1 ? "" : "s"} added to the protected order.`); });
  main.querySelector(".order-room form").addEventListener("submit", event => {
    event.preventDefault();
    const input = event.currentTarget.elements.message;
    const result = screenMarketMessage(input.value);
    if (result.state === "blocked") return toast(result.message);
    if (result.state === "review") {
      const moderation = marketStore.get("cx_moderation", []);
      moderation.unshift({ id: Date.now(), orderId: order.id, text: input.value, source: "marketplace", author: "Marketplace client", status: "Pending", created: new Date().toLocaleString() });
      marketStore.set("cx_moderation", moderation);
      toast(result.message);
      input.value = "";
      return;
    }
    messages.push({ author: "You", role: "Client", text: input.value, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) });
    allMessages[order.id] = messages;
    marketStore.set("cx_market_messages", allMessages);
    recordNotification("comment", "New marketplace message", input.value, { email: order.clientEmail, orderId: order.id });
    renderOrderRoom(main, actions);
  });
}

function getActivePrivateProvider() {
  const profiles = marketStore.get("cx_market_providers", []);
  const activeId = marketStore.get("cx_active_provider_id", null);
  if (!activeId) return null;
  return profiles.find(profile => String(profile.id) === String(activeId)) || null;
}

function renderPrivateProviderOnboarding(root, actions) {
  const current = getActivePrivateProvider();
  const value = (key, fallback = "") => escapeHTML(current?.[key] ?? fallback);
  const samples = current?.samples || [];
  const packages = current?.packages || [];
  let portfolioFiles = [...(current?.portfolioFiles || [])];
  root.className = "marketplace-app provider-app";
  root.innerHTML = `${marketplaceHeader("offer")}<main class="provider-main"><section class="provider-intro"><p class="eyebrow light"><span></span>Private provider onboarding</p><h1>List your services.<br><em>Stay private.</em></h1><p>Your services, pricing, contact details and portfolio are submitted directly to Content X. Other providers and clients cannot browse them. The owner reviews every submission and decides who is assigned to each project.</p><div class="provider-points"><span><b>01</b> Create your private service listing</span><span><b>02</b> Upload owner-only portfolio work</span><span><b>03</b> Wait for a suitable assignment</span></div><div class="commission-note"><strong>Private matching · 15–20% commission</strong><p>No public provider posts, no open project feed and no direct client contact. Only work assigned by Content X appears in your portal.</p></div><button class="provider-preview-link" type="button" data-provider-preview>Open my private provider portal →</button></section>
    <section class="provider-form-wrap"><div class="provider-stepper"><span class="active" data-provider-step-dot="1">1</span><i></i><span data-provider-step-dot="2">2</span><i></i><span data-provider-step-dot="3">3</span></div><form class="provider-form"><section data-provider-step="1"><p class="eyebrow"><span></span>Step 1 of 3 · private listing</p><h2>Services you can provide</h2><p>Tell the Content X team exactly what work you want to be considered for.</p><div class="field-pair"><label>Full name<input name="name" required value="${value("name")}" placeholder="Your full name"></label><label>Primary role<select name="role">${roleOptions.map(role => `<option ${current?.role === role ? "selected" : ""}>${role}</option>`).join("")}</select></label></div><label>Services offered<textarea name="services" required placeholder="Example: short-form reel editing, YouTube editing, captions, thumbnails">${value("services", current?.skills || "")}</textarea></label><label>Professional headline<input name="headline" required maxlength="90" value="${value("headline")}" placeholder="Example: Retention-first reels for coaches"></label><label>Experience and working style<textarea name="bio" required minlength="50" placeholder="What do you specialise in and how do you work?">${value("bio")}</textarea></label><div class="field-pair"><label>Availability<select name="availability">${["Available now","Part-time capacity","Selected projects only","Currently unavailable"].map(item => `<option ${current?.availability === item ? "selected" : ""}>${item}</option>`).join("")}</select></label><label>Typical turnaround<input name="turnaround" required value="${value("turnaround", "3–5 business days")}"></label></div><div class="field-pair"><label>Private email<input name="email" type="email" required value="${value("email")}"></label><label>Private WhatsApp<input name="phone" required value="${value("phone")}"></label></div><div class="provider-private-notice"><span>⌾</span><p><strong>Owner and admin access only</strong><small>Nothing entered here will appear on another provider’s screen or a public profile.</small></p></div><button type="button" class="pill pill-hot" data-provider-next>Continue to private portfolio →</button></section>
      <section data-provider-step="2" hidden><p class="eyebrow"><span></span>Step 2 of 3 · owner-only portfolio</p><h2>Upload your strongest work</h2><p>Upload videos, images, PDFs or documents. These filenames and portfolio links are visible only to Content X admins and you.</p><div class="private-portfolio-upload"><span>↑</span><h3>Private portfolio upload</h3><p>Up to 12 files · video, image, PDF or document</p><button type="button" data-private-portfolio-picker>Choose portfolio files</button><input type="file" hidden multiple accept="video/*,image/*,.pdf,.doc,.docx"></div><div class="private-portfolio-files" data-private-portfolio-files>${portfolioFiles.length ? portfolioFiles.map(file => `<span><b>${escapeHTML(file.name)}</b><small>${Math.max(1, Math.round(file.size / 1024))} KB · owner only</small></span>`).join("") : '<p>No private portfolio files selected yet.</p>'}</div>${[1,2,3].map((number, index) => `<div class="sample-input"><span>0${number}</span><div><label>Sample title<input name="sampleTitle${number}" value="${escapeHTML(samples[index]?.title || "")}" placeholder="What was this project?"></label><label>Optional private portfolio link<input name="sampleUrl${number}" type="url" value="${escapeHTML(samples[index]?.url || "")}" placeholder="https://…"></label></div></div>`).join("")}<div class="provider-buttons"><button type="button" data-provider-back>← Back</button><button type="button" class="pill pill-hot" data-provider-next>Continue to pricing →</button></div></section>
      <section data-provider-step="3" hidden><p class="eyebrow"><span></span>Step 3 of 3 · service pricing</p><h2>Your private price guide</h2><p>These prices help the owner match the right budget. They are not published automatically.</p><div class="provider-package-fields">${["Starter","Standard","Premium"].map((name, index) => `<article><span>0${index + 1}</span><h3>${name}</h3><label>Package name<input name="packageName${index + 1}" required value="${escapeHTML(packages[index]?.name || name)}"></label><label>Price (₹)<input name="packagePrice${index + 1}" type="number" min="300" required value="${Number(packages[index]?.price || [1200,3000,6000][index])}"></label><label>What is included<textarea name="packageDescription${index + 1}" required placeholder="Deliverables, length and revisions">${escapeHTML(packages[index]?.description || "")}</textarea></label></article>`).join("")}</div><label class="provider-agreement"><input name="agreement" type="checkbox" required><span>I understand that this listing is private, Content X chooses assignments, and the displayed commission is deducted only from completed work.</span></label><div class="provider-buttons"><button type="button" data-provider-back>← Back</button><button class="pill pill-hot" type="submit">Submit private listing →</button></div></section></form></section></main>`;
  bindMarketHeader(root, actions);
  root.querySelector("[data-provider-preview]").addEventListener("click", actions.openProviderWorkspace);
  const form = root.querySelector(".provider-form"), picker = root.querySelector('.private-portfolio-upload input[type="file"]'), fileList = root.querySelector("[data-private-portfolio-files]");
  root.querySelector("[data-private-portfolio-picker]").addEventListener("click", () => picker.click());
  picker.addEventListener("change", () => { portfolioFiles = [...picker.files].slice(0, 12).map(file => ({ id: Date.now() + Math.random(), name: file.name, size: file.size, type: file.type, visibility: "owner-only" })); fileList.innerHTML = portfolioFiles.length ? portfolioFiles.map(file => `<span><b>${escapeHTML(file.name)}</b><small>${Math.max(1, Math.round(file.size / 1024))} KB · owner only</small></span>`).join("") : '<p>No private portfolio files selected yet.</p>'; });
  let step = 1;
  const showStep = next => { step = next; form.querySelectorAll("[data-provider-step]").forEach(section => section.hidden = Number(section.dataset.providerStep) !== step); root.querySelectorAll("[data-provider-step-dot]").forEach(dot => dot.classList.toggle("active", Number(dot.dataset.providerStepDot) <= step)); root.querySelector(".provider-form-wrap").scrollIntoView({ behavior: "smooth", block: "start" }); };
  form.querySelectorAll("[data-provider-next]").forEach(button => button.addEventListener("click", () => { const section = form.querySelector(`[data-provider-step="${step}"]`); if (![...section.querySelectorAll("input,textarea,select")].every(field => field.reportValidity())) return; showStep(Math.min(3, step + 1)); }));
  form.querySelectorAll("[data-provider-back]").forEach(button => button.addEventListener("click", () => showStep(Math.max(1, step - 1))));
  form.addEventListener("submit", event => { event.preventDefault(); const data = Object.fromEntries(new FormData(form)); const profiles = marketStore.get("cx_market_providers", []); const record = current ? profiles.find(profile => String(profile.id) === String(current.id)) : null; const profile = { ...(record || {}), id: record?.id || Date.now(), name:data.name, role:data.role, services:data.services, headline:data.headline, bio:data.bio, availability:data.availability, turnaround:data.turnaround, email:data.email, phone:data.phone, portfolioFiles, visibility:"Owner and admins only", status:"Private · Pending review", assignmentStatus:record?.assignmentStatus || "Not assigned", created:record?.created || new Date().toLocaleString(), updated:new Date().toLocaleString(), samples:[1,2,3].map(number => ({ title:data[`sampleTitle${number}`], url:data[`sampleUrl${number}`], kind:"private-link", tag:"Owner-only sample" })).filter(sample => sample.title || sample.url), packages:[1,2,3].map(number => ({ name:data[`packageName${number}`], price:Number(data[`packagePrice${number}`]), delivery:data.turnaround, description:data[`packageDescription${number}`], features:[data[`packageDescription${number}`],"Content X protected delivery"] })) }; if (record) Object.assign(record, profile); else profiles.unshift(profile); marketStore.set("cx_market_providers", profiles); marketStore.set("cx_active_provider_id", profile.id); marketStore.set("cx_portal_role", "provider"); root.querySelector(".provider-form-wrap").innerHTML = `<div class="provider-success"><span>⌾</span><p class="eyebrow"><span></span>Private listing received</p><h2>Only Content X can review it.</h2><p>Your services, pricing, contact details and portfolio remain hidden from clients and other providers. You will only see projects after the owner assigns one to you.</p><dl><div><dt>Listing</dt><dd>#CX-${String(profile.id).slice(-6)}</dd></div><div><dt>Visibility</dt><dd>Owner only</dd></div><div><dt>Status</dt><dd>Pending review</dd></div></dl><div class="provider-success-actions"><button class="pill pill-hot" data-open-provider-portal>Open my private portal →</button></div></div>`; root.querySelector("[data-open-provider-portal]").addEventListener("click", actions.openProviderWorkspace); toast("Private provider listing added to Owner view."); });
}

function renderPrivateProviderWorkspace(root, actions) {
  const provider = getActivePrivateProvider();
  root.className = "marketplace-app provider-workspace-app";
  if (!provider) {
    const profiles = marketStore.get("cx_market_providers", []);
    root.innerHTML = `${marketplaceHeader("offer")}<main class="provider-access-page"><section class="provider-access-copy"><p class="eyebrow light"><span></span>Private provider portal</p><h1>No public feed.<br><em>Only your work.</em></h1><p>Provider accounts are isolated. Enter your own listing reference and private email to resume this device session.</p><ul><li><b>✓</b> No other provider listings</li><li><b>✓</b> No unassigned client briefs</li><li><b>✓</b> No public pricing or portfolio</li></ul></section><section class="provider-access-card"><span class="provider-lock-mark">⌾</span><p class="eyebrow"><span></span>Provider access</p><h2>${profiles.length ? "Open your private portal." : "Create your private listing."}</h2>${profiles.length ? `<p>Use the reference shown after submission and the same private email.</p><form data-provider-login><label>Listing reference<input name="reference" required autocomplete="off" placeholder="CX-123456"></label><label>Private email<input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></label><button class="pill pill-hot" type="submit">Open my portal →</button></form><small>Access lasts only on this device. Sign out when using a shared computer.</small>` : '<p>No provider listing exists on this device yet. Submit your services and owner-only portfolio to begin.</p>'}<button class="pill pill-dark" type="button" data-create-provider-listing>${profiles.length ? "Create a different listing" : "Create private listing"} →</button></section></main>`;
    bindMarketHeader(root, actions);
    root.querySelector("[data-create-provider-listing]").addEventListener("click", actions.openProviderOnboarding);
    root.querySelector("[data-provider-login]")?.addEventListener("submit", event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget));
      const reference = String(data.reference).replace(/^#?CX-?/i, "").trim();
      const match = profiles.find(profile => String(profile.id).endsWith(reference) && String(profile.email).toLowerCase() === String(data.email).trim().toLowerCase());
      if (!match) return toast("Those provider details do not match a private listing on this device.");
      marketStore.set("cx_active_provider_id", match.id);
      marketStore.set("cx_portal_role", "provider");
      renderPrivateProviderWorkspace(root, actions);
      toast(`Welcome back, ${match.name.split(" ")[0]}.`);
    });
    return;
  }
  const assignments = marketStore.get("cx_provider_assignments", []).filter(item => String(item.providerId) === String(provider.id));
  const orders = marketStore.get("cx_market_orders", []).filter(order => String(order.providerId) === String(provider.id) || String(order.providerId) === `provider-${provider.id}`);
  const payout = orders.reduce((total, order) => total + Number(order.providerPayout || 0), 0), inProgress = orders.filter(order => !["Completed","Approved"].includes(order.status)).length;
  const initials = provider.name.split(/\s+/).map(part => part[0]).join("").slice(0,2).toUpperCase();
  root.innerHTML = `${marketplaceHeader("offer")}<main class="provider-workspace"><section class="provider-workspace-head"><div><p class="eyebrow"><span></span>Private provider portal · device session</p><h1>Your listing and <em>assigned work.</em></h1><p>No marketplace feed and no other provider posts. Only your submission, owner feedback and projects assigned to you appear here.</p></div><div class="provider-head-actions"><button class="pill pill-dark" data-edit-provider-profile>Edit my private listing →</button><button type="button" data-provider-signout>Sign out</button></div></section><div class="provider-dashboard-grid"><aside><div class="provider-portal-profile"><span>${escapeHTML(initials)}</span><h2>${escapeHTML(provider.name)}</h2><p>${escapeHTML(provider.role)} · Private provider</p><em>⌾ ${escapeHTML(provider.status)}</em></div><nav><button class="active">⌂ My overview</button><button>▱ Assigned projects <b>${assignments.length + orders.length}</b></button><button>◇ My portfolio <b>${provider.portfolioFiles?.length || 0}</b></button><button>₹ My payouts</button></nav><div class="provider-portal-rule"><strong>Private by design</strong><p>You cannot view other providers, their services, portfolios or project posts. Content X controls every assignment.</p></div></aside><section class="provider-workspace-content"><div class="provider-stats"><article><span>▱</span><strong>${assignments.length}</strong><small>Owner assignments</small></article><article><span>◷</span><strong>${inProgress}</strong><small>Active paid orders</small></article><article><span>₹</span><strong>${money(payout)}</strong><small>Your earnings</small></article><article><span>✦</span><strong>${Number(marketStore.get("cx_commission_rate",20))}%</strong><small>Commission</small></article></div><section class="private-provider-listing"><div><p class="eyebrow"><span></span>My private service listing</p><h2>${escapeHTML(provider.headline)}</h2><p>${escapeHTML(provider.services || provider.role)}</p><small>${escapeHTML(provider.availability || "Availability not set")} · ${escapeHTML(provider.turnaround || "Turnaround to confirm")}</small></div><aside><strong>⌾ Owner-only portfolio</strong><span>${provider.portfolioFiles?.length || 0} uploaded file${provider.portfolioFiles?.length === 1 ? "" : "s"}</span><span>${provider.samples?.length || 0} private link${provider.samples?.length === 1 ? "" : "s"}</span></aside></section><div class="dash-section-head"><div><h2>Projects assigned by Content X</h2><p>Unassigned client briefs and other providers’ work are hidden.</p></div></div>${assignments.length ? `<div class="provider-assignment-list">${assignments.map(item => `<article><span>NEW</span><div><strong>${escapeHTML(item.projectTitle)}</strong><small>${escapeHTML(item.role)} · Assigned ${escapeHTML(item.created)}</small></div><em>${escapeHTML(item.status)}</em><button data-assignment-status="${item.id}">Review assignment →</button></article>`).join("")}</div>` : '<div class="empty-state"><span>▱</span><h3>No projects assigned yet</h3><p>The owner is reviewing matches. Nothing from another provider or unassigned client is visible here.</p></div>'}${orders.length ? `<div class="dash-section-head private-paid-head"><div><h2>Paid project rooms</h2><p>These orders are assigned specifically to your provider account.</p></div></div><div class="provider-order-list">${orders.map(order => `<article><div><span>${escapeHTML((order.clientName || "Client").split(/\s+/).map(part => part[0]).join("").slice(0,2))}</span><p><strong>${escapeHTML(order.clientName || "Marketplace client")}</strong><small>${escapeHTML(order.packageName)} · ${escapeHTML(order.providerRole)}</small></p></div><em>${escapeHTML(order.status)}</em><p><small>Gross</small>${money(order.amount)}</p><p><small>Your payout</small>${money(order.providerPayout)}</p><button data-provider-order="${order.id}">Open order →</button></article>`).join("")}</div>` : ""}</section></div></main>`;
  bindMarketHeader(root, actions); root.querySelector("[data-edit-provider-profile]").addEventListener("click", actions.openProviderOnboarding); root.querySelector("[data-provider-signout]").addEventListener("click", () => { marketStore.remove("cx_active_provider_id"); marketStore.remove("cx_portal_role"); renderPrivateProviderWorkspace(root, actions); toast("Provider session ended on this device."); }); root.querySelectorAll("[data-provider-order]").forEach(button => button.addEventListener("click", () => renderProviderOrderRoom(root, actions, Number(button.dataset.providerOrder)))); root.querySelectorAll("[data-assignment-status]").forEach(button => button.addEventListener("click", () => { const assignment = marketStore.get("cx_provider_assignments", []).find(item => item.id === Number(button.dataset.assignmentStatus)); if (assignment) { assignment.status = "Provider reviewing brief"; const all = marketStore.get("cx_provider_assignments", []); const saved = all.find(item => item.id === assignment.id); if (saved) saved.status = assignment.status; marketStore.set("cx_provider_assignments", all); button.textContent = "Provider reviewing brief ✓"; toast("Assignment status shared with the Content X owner."); } }));
}

function renderPrivateProviderReview(content, providers) {
  const assignments = marketStore.get("cx_provider_assignments", []);
  const cards = providers.map(profile => {
    const files = profile.portfolioFiles || [];
    const links = profile.samples || [];
    const assignedCount = assignments.filter(item => String(item.providerId) === String(profile.id)).length;
    const filesHTML = files.map((file, index) => `<div><b>F${index + 1}</b><span>${escapeHTML(file.name)}</span><small>${escapeHTML(file.type || "Portfolio file")} · owner only</small></div>`).join("");
    const linksHTML = links.map((sample, index) => sample.url ? `<a href="${escapeHTML(sample.url)}" target="_blank" rel="noreferrer"><b>L${index + 1}</b><span>${escapeHTML(sample.title || "Portfolio link")}</span><small>Open private link ↗</small></a>` : "").join("");
    const portfolioHTML = filesHTML || linksHTML ? `${filesHTML}${linksHTML}` : '<p>No portfolio files or links submitted.</p>';
    const priceHTML = (profile.packages || []).map(item => `<span><strong>${escapeHTML(item.name)}</strong>${money(item.price)}<small>${escapeHTML(item.description)}</small></span>`).join("");
    const statusClass = /Approved/.test(profile.status) ? "approved" : /Declined|Rejected/.test(profile.status) ? "rejected" : "";
    return `<article><header><span>${escapeHTML(profile.name.split(/\s+/).map(part => part[0]).join("").slice(0,2))}</span><div><h3>${escapeHTML(profile.name)}</h3><p>${escapeHTML(profile.role)} · ${escapeHTML(profile.headline)}</p></div><em class="moderation-status ${statusClass}">${escapeHTML(profile.status)}</em></header><div class="private-provider-meta"><span><strong>Services</strong>${escapeHTML(profile.services || profile.skills || profile.role)}</span><span><strong>Availability</strong>${escapeHTML(profile.availability || "Not provided")}</span><span><strong>Turnaround</strong>${escapeHTML(profile.turnaround || "To confirm")}</span><span><strong>Assignments</strong>${assignedCount}</span></div><p>${escapeHTML(profile.bio)}</p><div class="private-provider-contact"><span>✉ ${escapeHTML(profile.email)}</span><span>◉ ${escapeHTML(profile.phone)}</span><strong>Not visible outside Owner view</strong></div><div class="provider-review-samples private-samples">${portfolioHTML}</div><div class="private-price-guide">${priceHTML}</div><div class="provider-review-actions"><button data-private-provider-decision="Private · Approved for matching" data-provider-id="${profile.id}">Approve for matching</button><button data-private-provider-decision="Private · Changes requested" data-provider-id="${profile.id}">Request changes</button><button data-private-provider-decision="Private · Declined" data-provider-id="${profile.id}">Decline</button></div></article>`;
  }).join("");
  content.innerHTML = `<div class="private-provider-admin-head"><div><p class="eyebrow"><span></span>Owner-only talent vault</p><h2>Private provider listings</h2><p>Services, contact details, pricing and portfolios are visible only in this Owner view. Approval makes a provider eligible for matching, never public.</p></div><span>⌾ ADMIN ONLY</span></div>${providers.length ? `<div class="provider-review-list">${cards}</div>` : '<div class="empty-state"><span>⌾</span><h3>No private provider listings yet</h3><p>New service listings and owner-only portfolios will appear here.</p></div>'}`;
  content.querySelectorAll("[data-private-provider-decision]").forEach(button => button.addEventListener("click", () => { const profile = providers.find(item => String(item.id) === button.dataset.providerId); if (!profile) return; profile.status = button.dataset.privateProviderDecision; profile.reviewed = new Date().toLocaleString(); marketStore.set("cx_market_providers", providers); renderPrivateProviderReview(content, providers); toast(`${profile.name} is now ${profile.status.toLowerCase()}.`); }));
}

function openProviderAssignment(brief, briefs, trigger) {
  const providers = marketStore.get("cx_market_providers", []).filter(profile => /Approved for matching|Approved/i.test(profile.status) && !/Declined|Rejected/i.test(profile.status));
  const layer = document.createElement("div"); layer.className = "modal-layer";
  layer.innerHTML = `<form class="market-modal provider-assignment-modal"><button type="button" class="modal-close">×</button><p class="eyebrow"><span></span>Owner-controlled assignment</p><h2>Choose who receives this project.</h2><p>${escapeHTML(brief.goal)} · ${escapeHTML(brief.budget)}</p>${providers.length ? `<div class="assignment-provider-options">${providers.map((provider,index) => `<label><input type="radio" name="providerId" value="${provider.id}" ${index === 0 ? "checked" : ""}><span>${escapeHTML(provider.name.split(/\s+/).map(part => part[0]).join("").slice(0,2))}</span><p><strong>${escapeHTML(provider.name)}</strong><small>${escapeHTML(provider.role)} · ${escapeHTML(provider.services || provider.headline)}</small></p><em>${provider.portfolioFiles?.length || 0} files</em></label>`).join("")}</div><label>Assignment note<textarea name="note" placeholder="Scope, deadline or what to review first"></textarea></label><button class="pill pill-hot" type="submit">Assign selected provider →</button>` : '<div class="empty-state"><span>⌾</span><h3>No approved providers yet</h3><p>Approve a private provider for matching before assigning this brief.</p></div>'}</form>`;
  document.body.append(layer); const close = () => layer.remove(); layer.querySelector(".modal-close").addEventListener("click", close); layer.addEventListener("click", event => { if (event.target === layer) close(); });
  if (!providers.length) return;
  layer.querySelector("form").addEventListener("submit", event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)), provider = providers.find(item => String(item.id) === String(data.providerId)); if (!provider) return; const assignments = marketStore.get("cx_provider_assignments", []), existing = assignments.find(item => item.briefId === brief.id); const assignment = { id: existing?.id || Date.now(), briefId:brief.id, providerId:provider.id, providerName:provider.name, role:brief.role, projectTitle:brief.goal, budget:brief.budget, deadline:brief.deadline, clientEmail:brief.email, note:data.note || "Review the brief and wait for Content X instructions.", status:"Assigned by owner · Awaiting provider review", created:new Date().toLocaleString() }; if (existing) Object.assign(existing, assignment); else assignments.unshift(assignment); marketStore.set("cx_provider_assignments", assignments); brief.status = `Assigned to ${provider.name}`; brief.assignedProviderId = provider.id; marketStore.set("cx_market_briefs", briefs); provider.assignmentStatus = `Assigned · ${brief.goal}`; const allProviders = marketStore.get("cx_market_providers", []), savedProvider = allProviders.find(item => String(item.id) === String(provider.id)); if (savedProvider) savedProvider.assignmentStatus = provider.assignmentStatus; marketStore.set("cx_market_providers", allProviders); recordNotification("approval", "New private project assignment", `${brief.goal} was assigned by Content X.`, { email:provider.email, providerId:provider.id, briefId:brief.id }); trigger.textContent = `${provider.name} assigned ✓`; close(); toast(`Project assigned privately to ${provider.name}.`); });
}

export function enhanceMarketplaceAdmin(root) {
  const nav = root.querySelector(".admin-shell>aside nav");
  const content = root.querySelector(".admin-content");
  if (!nav || !content || nav.querySelector('[data-market-admin="marketplace"]')) return;
  const providers = marketStore.get("cx_market_providers", []);
  const orders = marketStore.get("cx_market_orders", []);
  const briefs = marketStore.get("cx_market_briefs", []);
  const questions = marketStore.get("cx_market_questions", []);
  nav.insertAdjacentHTML("beforeend", `<button data-market-admin="marketplace">✦ Managed network <b>${orders.length}</b></button><button data-market-admin="providers">✓ Private providers <b>${providers.length}</b></button>`);
  const setActive = button => root.querySelectorAll(".admin-shell>aside nav button").forEach(item => item.classList.toggle("active", item === button));
  nav.querySelector('[data-market-admin="marketplace"]').addEventListener("click", event => { setActive(event.currentTarget); renderAdminMarketplace(content, { orders, briefs, questions }); });
  nav.querySelector('[data-market-admin="providers"]').addEventListener("click", event => { setActive(event.currentTarget); renderProviderReview(content, providers); });
}

function renderAdminMarketplace(content, { orders, briefs, questions }) {
  const rate = Number(marketStore.get("cx_commission_rate", 20));
  const gross = orders.reduce((total, order) => total + Number(order.amount || 0), 0);
  const commission = orders.reduce((total, order) => total + Number(order.commissionAmount || 0), 0);
  content.innerHTML = `<div class="dash-section-head"><div><h2>Managed network operations</h2><p>Manage service orders, private matching briefs and provider commissions.</p></div><label class="commission-control">Commission <select data-commission-rate>${[15,17.5,20].map(value => `<option value="${value}" ${value === rate ? "selected" : ""}>${value}%</option>`).join("")}</select></label></div><div class="admin-stats market-admin-stats"><article><span>₹</span><div><strong>${money(gross)}</strong><small>Managed-service gross value</small></div></article><article><span>✦</span><div><strong>${money(commission)}</strong><small>Content X commission</small></div></article><article><span>↗</span><div><strong>${money(gross - commission)}</strong><small>Provider payouts</small></div></article><article><span>◷</span><div><strong>${briefs.length}</strong><small>Open client briefs</small></div></article></div><div class="market-admin-grid"><section><div class="dash-section-head"><div><h2>Orders</h2><p>Commission is deducted privately from the provider payout.</p></div></div>${orders.length ? `<div class="market-order-table"><div><span>Order</span><span>Gross</span><span>Commission</span><span>Payout</span><span>Status</span></div>${orders.map(order => `<article><strong>${escapeHTML(order.providerName)}<small>${escapeHTML(order.packageName)}</small></strong><span>${money(order.amount)}</span><span>${money(order.commissionAmount)}</span><span>${money(order.providerPayout)}</span><select data-market-order="${order.id}">${["Paid · Brief needed","In progress","In review","Approved","Completed"].map(status => `<option ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}</select></article>`).join("")}</div>` : '<div class="empty-state"><span>₹</span><h3>No managed service orders yet</h3><p>Paid Content X service packages assigned to providers will appear here.</p></div>'}</section><aside><div class="dash-section-head"><div><h2>Client briefs</h2><p>Match these privately with approved specialists.</p></div></div><div class="brief-admin-list">${briefs.length ? briefs.map(brief => `<article><span>${escapeHTML(brief.role)}</span><h3>${escapeHTML(brief.goal)}</h3><p>${escapeHTML(brief.budget)} · ${escapeHTML(brief.deadline)}</p><button data-match-brief="${brief.id}">${escapeHTML(brief.status)} →</button></article>`).join("") : '<div class="empty-state"><span>⌕</span><h3>No briefs yet</h3><p>Private client project requests will appear here.</p></div>'}</div>${questions.length ? `<div class="dash-section-head question-head"><div><h2>Pre-order questions</h2><p>${questions.length} managed conversation${questions.length === 1 ? "" : "s"}</p></div></div>` : ""}</aside></div>`;
  content.querySelector("[data-commission-rate]").addEventListener("change", event => { marketStore.set("cx_commission_rate", Number(event.target.value)); toast(`Marketplace commission updated to ${event.target.value}%.`); });
  content.querySelectorAll("[data-market-order]").forEach(select => select.addEventListener("change", () => { const order = orders.find(item => item.id === Number(select.dataset.marketOrder)); if (order) { order.status = select.value; marketStore.set("cx_market_orders", orders); toast("Order status updated."); } }));
  content.querySelectorAll("[data-match-brief]").forEach(button => button.addEventListener("click", () => { const brief = briefs.find(item => item.id === Number(button.dataset.matchBrief)); if (brief) openProviderAssignment(brief, briefs, button); }));
}

function renderProviderReview(content, providers) {
  return renderPrivateProviderReview(content, providers);
  content.innerHTML = `<div class="dash-section-head"><div><h2>Provider review</h2><p>Only approved profiles are added to the public marketplace.</p></div></div>${providers.length ? `<div class="provider-review-list">${providers.map(profile => `<article><header><span>${escapeHTML(profile.name.split(/\s+/).map(part => part[0]).join("").slice(0,2))}</span><div><h3>${escapeHTML(profile.name)}</h3><p>${escapeHTML(profile.role)} · ${escapeHTML(profile.headline)}</p></div><em class="moderation-status ${profile.status === "Approved" ? "approved" : profile.status === "Rejected" ? "rejected" : ""}">${escapeHTML(profile.status)}</em></header><p>${escapeHTML(profile.bio)}</p><div class="provider-review-samples">${profile.samples.map((sample, index) => `<a href="${escapeHTML(sample.url)}" target="_blank" rel="noreferrer"><b>0${index + 1}</b><span>${escapeHTML(sample.title)}</span><small>Review link ↗</small></a>`).join("")}</div><div class="provider-review-actions"><button data-provider-decision="Approved" data-provider-id="${profile.id}">Approve profile</button><button data-provider-decision="Changes requested" data-provider-id="${profile.id}">Request changes</button><button data-provider-decision="Rejected" data-provider-id="${profile.id}">Reject</button></div></article>`).join("")}</div>` : '<div class="empty-state"><span>✓</span><h3>No provider applications yet</h3><p>New applications with three samples will appear here.</p></div>'}`;
  content.querySelectorAll("[data-provider-decision]").forEach(button => button.addEventListener("click", () => {
    const profile = providers.find(item => item.id === Number(button.dataset.providerId));
    if (!profile) return;
    profile.status = button.dataset.providerDecision;
    profile.reviewed = new Date().toLocaleString();
    marketStore.set("cx_market_providers", providers);
    renderProviderReview(content, providers);
    toast(`Provider status updated to ${profile.status}.`);
  }));
}
