import { studio } from "./data.js";
import { renderDashboard, renderMarketing, renderProject, renderReview } from "./ui.js";

const root = document.getElementById("app");
const loader = document.querySelector("[data-loader]");
const canvas = document.getElementById("studio-canvas");
const overlay = document.querySelector(".scene-overlay");
const progress = document.querySelector("[data-progress]");

const go = route => { location.hash = route; };
const actions = {
  openMarketing: () => go("home"),
  openDashboard: () => go("workspace"),
  openProject: () => go("project"),
  openReview: () => go("review")
};

function renderRoute() {
  const route = location.hash.slice(1) || "home";
  window.scrollTo(0, 0);
  canvas.hidden = true;
  overlay.hidden = true;
  progress.hidden = route !== "home";
  if (route === "workspace") renderDashboard(root, actions);
  else if (route === "project") renderProject(root, actions);
  else if (route === "review") renderReview(root, actions);
  else renderMarketing(root, studio, actions);
  loader.classList.add("is-done");
}

window.addEventListener("hashchange", renderRoute);
window.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
}, { passive: true });
renderRoute();
