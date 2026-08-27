import { studio } from "./data.js";
import { renderDashboard, renderMarketing, renderProject, renderReview } from "./ui.js?v=pricing-security-dashboard-1";
import { enhanceDashboard, enhanceMarketing, enhanceProject, enhanceReview, initTheme, renderAdmin, renderCheckout, selectCheckoutPlan } from "./features.js?v=pricing-security-dashboard-1";
import { enhanceMarketplaceAdmin, enhanceMarketplaceDashboard, enhanceMarketplaceMarketing, renderMarketplace, renderProviderOnboarding, renderProviderWorkspace, renderTalentProfile } from "./marketplace.js?v=restored-features-1";
import { enhanceAdminSuite, enhanceDashboardSuite, enhanceProjectSuite, enhanceReviewSuite, prepareClientRoute } from "./advanced.js";
import { initProductPolish, polishRoute } from "./polish.js?v=core-features-2";
import { enhanceCreatorTools } from "./creator-tools.js?v=pricing-security-dashboard-1";
import { enhanceUploadAdmin, renderClientUpload } from "./uploads.js?v=team-controls-1";
import { accountUser, refreshAccountSession, rememberProtectedRoute, renderAccountAccess, renderAccountDashboard, renderProjectBrief } from "./account.js?v=pricing-security-dashboard-1";
import { renderClientWorkspace, renderSharedWorkspace } from "./workspace.js?v=pricing-security-dashboard-1";

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
  const route = location.hash.slice(1) || "home";
  try {
    prepareClientRoute(route);
    window.scrollTo(0, 0);
    canvas.hidden = true;
    overlay.hidden = true;
    progress.hidden = route !== "home";
    const uploadRoute = route.startsWith("upload?");
    const uploadHasToken = uploadRoute && Boolean(new URLSearchParams(route.split("?")[1] || "").get("token"));
    const protectedRoute = ["project", "review", "account", "checkout"].includes(route) || route.startsWith("brief") || route.startsWith("workspace") || (uploadRoute && !uploadHasToken);
    if (protectedRoute || route === "access") await refreshAccountSession();
    if (protectedRoute && !accountUser()) {
      rememberProtectedRoute(route);
      renderAccountAccess(root, actions);
    }
    else if (route.startsWith("share?")) await renderSharedWorkspace(root, actions, route);
    else if (uploadRoute && uploadHasToken) await renderClientUpload(root, actions, route);
    else if (uploadRoute) await renderClientWorkspace(root, actions, route.replace(/^upload/, "workspace"));
    else if (route.startsWith("workspace")) await renderClientWorkspace(root, actions, route);
    else if (route === "project") { renderProject(root, actions); enhanceProject(root, actions); enhanceProjectSuite(root, actions); }
    else if (route === "review") { renderReview(root, actions); enhanceReview(root, actions); enhanceReviewSuite(root, actions); }
    else if (route === "access") { if (accountUser()) await renderAccountDashboard(root, actions); else renderAccountAccess(root, actions); }
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
