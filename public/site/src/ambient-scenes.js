// Original CSS-only scenery. Never touches forms, records, or review playback.
let disposeScenes = () => {};
export const sceneTargets = [
  [".creator-suite-copy", "signal"],
  [".faq-section > div:first-child", "ribbons"],
  [".contact-grid > div:first-child", "frames"],
  [".managed-market-hero > aside", "signal"],
  [".provider-intro", "ribbons"],
  [".account-story > div", "frames"],
];
export function sceneMarkup(kind) {
  const contents = kind === "signal"
    ? `<div class="em-signal">${Array.from({length:25},(_,i) => `<i style="--n:${i};--height:${20 + (i * 19 % 68)}%"></i>`).join("")}</div><div class="em-signal-path"><b></b><b></b><b></b></div>`
    : kind === "frames"
      ? '<div class="em-frame-deck"><i><b></b></i><i><b></b></i><i><b></b></i></div><span class="em-frame-spark"></span>'
      : '<div class="em-ribbons"><i></i><i></i><i></i><i></i><i></i></div><span class="em-ribbon-light"></span>';
  return `<div class="em-scene em-${kind}" aria-hidden="true"><div class="em-scene-glow"></div>${contents}</div>`;
}
export function enhanceAmbientScenes(root) {
  disposeScenes(); disposeScenes = () => {};
  // Keep functional review, payment, upload errors, and modal screens quiet.
  if (!root?.querySelector || root.classList.contains("review-app")) return;
  const hosts = [], scenes = [];
  for (const [selector, kind] of sceneTargets) {
    const host = root.querySelector(selector);
    if (!host) continue;
    host.classList.add("em-scene-host"); hosts.push(host);
    host.insertAdjacentHTML("beforeend", sceneMarkup(kind));
    scenes.push(host.querySelector(".em-scene"));
  }
  const surfaces = [...root.querySelectorAll(".sx-project-art, .sx-focus-orbits, .sx-pulse")];
  const targets = [...scenes, ...surfaces];
  if (!targets.length) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const controller = new AbortController();
  const visible = new Set();
  let observer, toggle;
  // Homepage uses its existing Pause motion control; other pages get one control.
  if (!root.querySelector(".cx-motion-toggle")) {
    const controlsHost = root.querySelector(".dash-header, .workspace-project-head, .market-hero > div, .provider-intro, .account-story");
    if (controlsHost) {
      toggle = document.createElement("button"); toggle.type = "button"; toggle.className = "em-motion-toggle";
      controlsHost.append(toggle);
      toggle.addEventListener("click", () => {
        document.documentElement.dataset.cxMotionPaused = String(document.documentElement.dataset.cxMotionPaused !== "true");
        window.dispatchEvent(new Event("cx:motion"));
      }, {signal:controller.signal});
    }
  }
  const sync = () => {
    const paused = document.documentElement.dataset.cxMotionPaused === "true";
    const enabled = !paused && !reduced.matches && !document.hidden;
    targets.forEach(target => target.classList.toggle("em-running", enabled && visible.has(target)));
    if (toggle) {
      toggle.textContent = reduced.matches ? "Reduced motion" : paused ? "Enable motion" : "Pause motion";
      toggle.setAttribute("aria-pressed", String(paused || reduced.matches));
      toggle.disabled = reduced.matches;
    }
  };
  disposeScenes = () => {
    controller.abort(); observer?.disconnect(); reduced.removeEventListener("change", sync);
    targets.forEach(target => target.classList.remove("em-running"));
    hosts.forEach(host => host.classList.remove("em-scene-host"));
    scenes.forEach(scene => scene.remove()); toggle?.remove();
  };
  if (typeof IntersectionObserver !== "undefined") {
    observer = new IntersectionObserver(entries => {
      entries.forEach(({target,isIntersecting}) => { if (isIntersecting) visible.add(target); else visible.delete(target); });
      sync();
    }, {threshold:.12});
    targets.forEach(target => observer.observe(target));
  }
  window.addEventListener("cx:motion", sync, {signal:controller.signal});
  document.addEventListener("visibilitychange", sync, {signal:controller.signal});
  reduced.addEventListener("change", sync);
  sync();
}
