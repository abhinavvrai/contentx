import { studio } from "./data.js?v=revision-bands-1";
import { renderDashboard, renderMarketing, renderProject, renderReview } from "./ui.js?v=revision-bands-1";
import { enhanceDashboard, enhanceMarketing, enhanceProject, enhanceReview, initTheme, renderAdmin, renderCheckout, selectCheckoutPlan } from "./features.js?v=revision-bands-1";
import { enhanceMarketplaceAdmin, enhanceMarketplaceDashboard, enhanceMarketplaceMarketing, renderMarketplace, renderProviderOnboarding, renderProviderWorkspace, renderTalentProfile } from "./marketplace.js?v=revision-bands-1";
import { enhanceAdminSuite, enhanceDashboardSuite, enhanceProjectSuite, enhanceReviewSuite, prepareClientRoute } from "./advanced.js?v=no-video-placeholders-1";
import { initProductPolish, polishRoute } from "./polish.js?v=noir-studio-1";
import { enhanceCreatorTools } from "./creator-tools.js?v=revision-bands-1";
import { enhanceUploadAdmin, renderClientUpload } from "./uploads.js?v=no-video-placeholders-1";
import { accountUser, refreshAccountSession, rememberProtectedRoute, renderAccountAccess, renderAccountDashboard, renderProjectBrief } from "./account.js?v=no-video-placeholders-1";
import { renderClientWorkspace, renderSharedWorkspace } from "./workspace.js?v=review-studio-1";
import { enhanceStudioDashboard } from "./studio-workspace.js?v=review-studio-1";

// Load decorative motion independently so a missing effect cannot block the app.
let cinematic;
const cinematicReady = import("./cinematic.js?v=ring-moved-1")
  .then(module => { cinematic = module; })
  .catch(error => console.warn("Content X motion is unavailable", error));
let ambient;
const ambientReady = import("./ambient-scenes.js?v=hero-restored-2")
  .then(module => { ambient = module; })
  .catch(error => console.warn("Content X atmosphere is unavailable", error));
let cinematicRender = 0;

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
  openReview: () => go("review"),
  openAccess: () => { rememberProtectedRoute("account"); go("access"); },
  openAccount: () => go("account"),
  openBrief: orderId => go(`brief${orderId ? `?order=${encodeURIComponent(orderId)}` : ""}`),
  openAdmin: () => go("owner"),
  openMarketplace: () => go("marketplace"),
  openProviderOnboarding: () => go("offer-services"),
  openProviderWorkspace: () => go("provider-workspace"),
  openTalentProfile: () => go("talent"),
  openCheckout: plan => { selectCheckoutPlan(plan); go("checkout"); },
  refreshRoute: () => renderRoute()
};

async function renderRoute() {
  const motionRender = ++cinematicRender;
  const route = location.hash.slice(1) || "home";
  try {
    // These guards belong to the old DOM, not to the reusable route root.
    ["advancedDashboard", "advancedProject", "advancedReview", "advancedAdmin"].forEach(key => delete root.dataset[key]);
    prepareClientRoute(route);
    window.scrollTo(0, 0);
    canvas.hidden = true;
    overlay.hidden = true;
    progress.hidden = route !== "home";
    const uploadRoute = route.startsWith("upload?");
    const uploadHasToken = uploadRoute && Boolean(new URLSearchParams(route.split("?")[1] || "").get("token"));
    const protectedRoute = ["account", "checkout"].includes(route) || route.startsWith("brief") || (uploadRoute && !uploadHasToken);
    if (protectedRoute || route.startsWith("access")) await refreshAccountSession();
    if (protectedRoute && !accountUser()) {
      rememberProtectedRoute(route);
      renderAccountAccess(root, actions);
    }
    else if (route.startsWith("share?")) await renderSharedWorkspace(root, actions, route);
    else if (uploadRoute && uploadHasToken) await renderClientUpload(root, actions, route);
    else if (uploadRoute) await renderClientWorkspace(root, actions, route.replace(/^upload/, "workspace"));
    else if (route.startsWith("workspace")) {
      await refreshAccountSession();
      if (accountUser()) await renderClientWorkspace(root, actions, route);
      else { renderDashboard(root, actions, { demo:true }); enhanceDashboard(root, actions, { demo:true }); enhanceDashboardSuite(root, actions); }
    }
    else if (route === "project") { renderProject(root, actions); enhanceProject(root, actions); enhanceProjectSuite(root, actions); }
    else if (route === "review") { renderReview(root, actions); enhanceReview(root, actions); enhanceReviewSuite(root, actions); }
    else if (route.startsWith("access")) { if (accountUser() && !route.includes("reset=")) await renderAccountDashboard(root, actions); else renderAccountAccess(root, actions); }
    else if (route === "account") await renderAccountDashboard(root, actions);
    else if (route.startsWith("brief")) await renderProjectBrief(root, actions, route);
    else if (route === "checkout") renderCheckout(root, actions);
    else if (route === "marketplace") renderMarketplace(root, actions);
    else if (route === "talent") renderTalentProfile(root, actions);
    else if (route === "offer-services") renderProviderOnboarding(root, actions);
    else if (route === "provider-workspace") renderProviderWorkspace(root, actions);
    else if (route === "owner") { renderAdmin(root, actions); enhanceMarketplaceAdmin(root); enhanceAdminSuite(root, actions); enhanceUploadAdmin(root); }
    else { renderMarketing(root, studio, actions); enhanceMarketing(root, actions, studio); enhanceMarketplaceMarketing(root, actions); }
    polishRoute(root, route);
    enhanceCreatorTools(root, route);
    try { enhanceStudioDashboard(root); }
    catch (error) { console.warn("Dashboard presentation was skipped", error); }
    Promise.all([cinematicReady, ambientReady]).then(() => {
      if (motionRender !== cinematicRender) return;
      try { cinematic?.enhanceCinematic(root); }
      catch (error) { console.warn("Content X motion was skipped", error); }
      try { ambient?.enhanceAmbientScenes(root); }
      catch (error) { console.warn("Content X atmosphere was skipped", error); }
    });
  } catch (error) {
    console.error("Content X route rendering failed", error);
  } finally {
    loader?.classList.add("is-done");
  }
}

window.addEventListener("hashchange", () => { renderRoute(); });
window.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
}, { passive: true });
initTheme();
initProductPolish();
renderRoute();
