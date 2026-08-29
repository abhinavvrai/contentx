// Optional, homepage-only motion. Nothing here gates navigation or the loader.
let disposeMotion = () => {};
let motionPaused = false;

export function storyProgress(top, height, viewportHeight) {
  return Math.min(1, Math.max(0, (76 - top) / Math.max(1, height - viewportHeight + 76)));
}

export function enhanceCinematic(root) {
  disposeMotion();
  disposeMotion = () => {};
  if (!root.classList.contains("marketing-app")) return;
  const hero = root.querySelector(".hero");
  const stats = root.querySelector(".stat-strip");
  if (!hero || !stats) return;

  root.classList.add("cx-cinematic");
  hero.insertAdjacentHTML("afterbegin", `<div class="cx-atmosphere" aria-hidden="true"><div class="cx-orbit"><i></i><i></i><i></i><i></i></div><span class="cx-satellite"></span></div>`);
  hero.querySelector(".hero-content").insertAdjacentHTML("beforeend", `<div class="cx-motion-tools"><span>SCROLL TO SEE THE FLOW <span aria-hidden="true">↓</span></span><button type="button" class="cx-motion-toggle" aria-pressed="false">Pause motion</button></div>`);
  stats.insertAdjacentHTML("afterend", `
    <section class="cx-story" aria-labelledby="cx-story-title">
      <div class="cx-story-pin section-shell">
        <div class="cx-story-copy">
          <p class="eyebrow"><span></span>One connected creative flow</p>
          <h2 id="cx-story-title">Great work.<br><em>Less friction.</em></h2>
          <p class="cx-story-intro">From the first upload to the final yes. Keep the work moving, and everyone on the same page.</p>
          <ol class="cx-story-steps">
            <li data-cx-step="0"><span>01</span><div><h3>Bring it together.</h3><p>Footage, references and your brief. One home for the next great idea.</p></div></li>
            <li data-cx-step="1"><span>02</span><div><h3>Make every note count.</h3><p>Feedback belongs on the frame. Keep revisions clear and versions together.</p></div></li>
            <li data-cx-step="2"><span>03</span><div><h3>Get to the final yes.</h3><p>Review the latest cut, resolve the notes and share the work you're proud of.</p></div></li>
          </ol>
          <a class="pill pill-hot" href="#workspace">Explore the workspace <span aria-hidden="true">↗</span></a>
        </div>
        <div class="cx-story-visual" aria-hidden="true">
          <div class="cx-story-halo"></div>
          <div class="cx-story-deck">
            <div class="cx-story-card" data-cx-card="0"><div class="cx-card-bar"><b>CX</b><span>Your next big idea</span><small>01 / UPLOAD</small></div><div class="cx-film"><video src="videos/landscape3.mp4" muted loop playsinline preload="metadata" tabindex="-1"></video><span class="cx-film-label">APEX / CAMPAIGN FILM</span></div><div class="cx-file-row"><span>↗</span><div><strong>Everything starts here.</strong><small>Footage · Brand assets · References</small></div><b>3 folders</b></div></div>
            <div class="cx-story-card" data-cx-card="1"><div class="cx-card-bar"><b>CX</b><span>Every detail, in focus</span><small>02 / REVIEW</small></div><div class="cx-review-art"><div class="cx-timecode">00:12:08</div><div class="cx-wave">${Array.from({length:32}, (_, i) => `<i style="--bar:${16 + (i * 17 % 53)}px"></i>`).join("")}</div><div class="cx-timeline"><i></i><span></span></div></div><div class="cx-feedback"><b>MK</b><p><strong>00:12</strong> Let's bring the music up here.<small>One precise note. No back-and-forth.</small></p><span>✓</span></div><div class="cx-version-row"><span>V1</span><span>V2</span><strong>V3 · Ready for review</strong></div></div>
            <div class="cx-story-card" data-cx-card="2"><div class="cx-card-bar"><b>CX</b><span>The version that feels right</span><small>03 / DELIVER</small></div><div class="cx-approved"><div>✓</div><p>That's the one.</p><span>Notes resolved. Ready to share.</span></div><div class="cx-delivery"><span>APEX_CAMPAIGN_FINAL.mp4</span><strong>Approved ↗</strong></div></div>
          </div>
          <p class="cx-scene-caption">CONTENT X WORKFLOW / ILLUSTRATIVE PREVIEW</p>
        </div>
      </div>
    </section>`);

  const story = root.querySelector(".cx-story");
  const deck = story.querySelector(".cx-story-deck");
  const cards = [...story.querySelectorAll("[data-cx-card]")];
  const steps = [...story.querySelectorAll("[data-cx-step]")];
  const toggle = hero.querySelector(".cx-motion-toggle");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const compact = matchMedia("(max-width: 800px), (max-height: 650px)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const controller = new AbortController();
  const { signal } = controller;
  const reveals = new Set();
  let frame = 0;
  let active = -1;
  let enabled = false;
  let pointerX = 0;
  let pointerY = 0;
  let videoObserver;
  let revealObserver;
  const previews = [...root.querySelectorAll("video[data-preview-autoplay], .cx-film video")];
  const visibleVideos = new Set();

  const updateVideos = () => previews.forEach(video => {
    const behindAnotherCard = video.closest(".cx-story-card") && !compact.matches && active !== 0;
    if (enabled && !document.hidden && visibleVideos.has(video) && !behindAnotherCard) video.play()?.catch(() => {});
    else video.pause();
  });
  const selectStep = index => {
    if (index === active) return;
    active = index;
    cards.forEach((card, i) => { card.dataset.active = String(i === index); });
    steps.forEach((step, i) => { step.dataset.active = String(i === index); });
    updateVideos();
  };
  const paint = () => {
    frame = 0;
    if (!enabled || document.hidden) return;
    const heroBox = hero.getBoundingClientRect();
    if (heroBox.bottom > 0 && heroBox.top < innerHeight) {
      const exit = Math.min(1, Math.max(0, -heroBox.top / heroBox.height));
      hero.style.setProperty("--cx-tilt-x", `${(-pointerY * 2.5 + exit * 3).toFixed(2)}deg`);
      hero.style.setProperty("--cx-tilt-y", `${(pointerX * 4 - 4 + exit * 4).toFixed(2)}deg`);
      hero.style.setProperty("--cx-orbit-turn", `${(exit * 22 + pointerX * 3).toFixed(2)}deg`);
    }
    if (!compact.matches) {
      const box = story.getBoundingClientRect();
      if (box.bottom > 0 && box.top < innerHeight) {
        const progress = storyProgress(box.top, box.height, innerHeight);
        selectStep(Math.min(2, Math.floor(progress * 3)));
        deck.style.setProperty("--cx-deck-turn", `${((progress - .5) * -6).toFixed(2)}deg`);
      }
    }
  };
  const schedule = () => {
    if (!frame && enabled && !document.hidden) frame = requestAnimationFrame(paint);
  };
  const configure = () => {
    motionPaused = document.documentElement.dataset.cxMotionPaused === "true";
    enabled = !motionPaused && !reduced.matches;
    root.dataset.cxMotion = enabled ? "on" : "off";
    toggle.textContent = reduced.matches ? "Reduced motion" : motionPaused ? "Enable motion" : "Pause motion";
    toggle.setAttribute("aria-pressed", String(!enabled));
    toggle.disabled = reduced.matches;
    root.dataset.cxCompact = String(compact.matches);
    if (!enabled || compact.matches) {
      hero.style.removeProperty("--cx-tilt-x");
      hero.style.removeProperty("--cx-tilt-y");
      hero.style.removeProperty("--cx-orbit-turn");
      deck.style.removeProperty("--cx-deck-turn");
      selectStep(0);
    }
    if (!enabled) {
      cancelAnimationFrame(frame);
      frame = 0;
      reveals.forEach(animation => animation.cancel());
      reveals.clear();
    }
    updateVideos();
    schedule();
    window.dispatchEvent(new Event("cx:motion"));
  };

  // Install teardown before observers: a failed optional enhancement stays recoverable.
  disposeMotion = () => {
    controller.abort();
    cancelAnimationFrame(frame);
    videoObserver?.disconnect();
    revealObserver?.disconnect();
    reduced.removeEventListener("change", configure);
    compact.removeEventListener("change", configure);
    reveals.forEach(animation => animation.cancel());
    previews.forEach(video => video.pause());
    story.remove();
    hero.querySelector(".cx-atmosphere")?.remove();
    hero.querySelector(".cx-motion-tools")?.remove();
    ["--cx-tilt-x", "--cx-tilt-y", "--cx-orbit-turn"].forEach(name => hero.style.removeProperty(name));
    root.classList.remove("cx-cinematic");
    delete root.dataset.cxMotion;
    delete root.dataset.cxCompact;
  };

  toggle.addEventListener("click", () => { document.documentElement.dataset.cxMotionPaused = String(!motionPaused); configure(); }, { signal });
  window.addEventListener("scroll", schedule, { passive: true, signal });
  window.addEventListener("resize", schedule, { passive: true, signal });
  document.addEventListener("visibilitychange", () => { updateVideos(); schedule(); }, { signal });
  hero.addEventListener("pointermove", event => {
    if (!enabled || compact.matches || !finePointer.matches) return;
    const box = hero.getBoundingClientRect();
    pointerX = (event.clientX - box.left) / box.width * 2 - 1;
    pointerY = (event.clientY - box.top) / box.height * 2 - 1;
    schedule();
  }, { passive: true, signal });
  hero.addEventListener("pointerleave", () => { pointerX = 0; pointerY = 0; schedule(); }, { signal });
  reduced.addEventListener("change", configure);
  compact.addEventListener("change", configure);

  if (typeof IntersectionObserver !== "undefined") {
    videoObserver = new IntersectionObserver(entries => {
      entries.forEach(({target, isIntersecting}) => {
        if (isIntersecting) visibleVideos.add(target); else visibleVideos.delete(target);
      });
      updateVideos();
    }, { threshold: .1 });
    previews.forEach(video => videoObserver.observe(video));
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(({target, isIntersecting}) => {
        if (!isIntersecting) return;
        revealObserver.unobserve(target);
        if (!enabled || typeof target.animate !== "function") return;
        const animation = target.animate([
          { opacity: .25, transform: "translateY(24px)" },
          { opacity: 1, transform: "translateY(0)" }
        ], { duration: 750, easing: "cubic-bezier(.16,1,.3,1)" });
        reveals.add(animation);
        animation.finished.then(() => reveals.delete(animation)).catch(() => {});
      });
    }, { threshold: .12 });
    root.querySelectorAll(".section-heading, .work-card, .creator-card, .tutorial-video-grid > article, .market-teaser-grid > article, .workflow-grid > article").forEach(element => revealObserver.observe(element));
  }
  configure();
  selectStep(0);
}
