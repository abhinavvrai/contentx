import { studio } from "./data.js";
import { renderDashboard, renderMarketing, renderProject, renderReview } from "./ui.js";
import { canAccessWorkspace, enhanceDashboard, enhanceProject, enhanceReview, initTheme, renderAccess, renderAdmin, renderCheckout, selectCheckoutPlan } from "./features.js";
import { enhanceAdminSuite, enhanceDashboardSuite, enhanceProjectSuite, enhanceReviewSuite, prepareClientRoute } from "./advanced.js";
import { initProductPolish, polishRoute } from "./polish.js?v=core-features-2";
import { enhanceCreatorTools } from "./creator-tools.js?v=services-groups-1";

const root = document.getElementById("app");
const loader = document.querySelector("[data-loader]");
const canvas = document.getElementById("studio-canvas");
const overlay = document.querySelector(".scene-overlay");
const progress = document.querySelector("[data-progress]");

const go = route => { location.hash = route; };
const actions = {
  openMarketing: () => go("home"),
  openDashboard: (force = false) => go(force || canAccessWorkspace() ? "workspace" : "access"),
  openProject: () => go("project"),
  openReview: () => go("review"),
  openAccess: () => go("access"),
  openAdmin: () => go("owner"),
  openMarketplace: () => go("marketplace"),
  openProviderOnboarding: () => go("offer-services"),
  openProviderWorkspace: () => go("provider-workspace"),
  openTalentProfile: () => go("talent"),
  openCheckout: plan => { selectCheckoutPlan(plan); go("checkout"); },
  refreshRoute: () => renderRoute()
};

function renderRoute() {
  const route = location.hash.slice(1) || "home";
  prepareClientRoute(route);
  window.scrollTo(0, 0);
  canvas.hidden = true;
  overlay.hidden = true;
  progress.hidden = route !== "home";
  if (route === "workspace") { if (!canAccessWorkspace()) renderAccess(root, actions); else { renderDashboard(root, actions); enhanceDashboard(root, actions); enhanceDashboardSuite(root, actions); } }
  else if (route === "project") { if (!canAccessWorkspace()) renderAccess(root, actions); else { renderProject(root, actions); enhanceProject(root, actions); enhanceProjectSuite(root, actions); } }
  else if (route === "review") { if (!canAccessWorkspace()) renderAccess(root, actions); else { renderReview(root, actions); enhanceReview(root, actions); enhanceReviewSuite(root, actions); } }
  else if (route === "access") renderAccess(root, actions);
  else if (route === "checkout") renderCheckout(root, actions);
  else if (route === "owner") { renderAdmin(root, actions); enhanceAdminSuite(root, actions); }
  else { renderMarketing(root, studio, actions); }
  polishRoute(root, route);
  enhanceCreatorTools(root, route);
  loader.classList.add("is-done");
}

window.addEventListener("hashchange", renderRoute);
window.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
}, { passive: true });
initTheme();
initProductPolish();
renderRoute();
