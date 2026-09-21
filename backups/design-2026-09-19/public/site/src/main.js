import { studio } from "./data.js?v=revision-bands-1";
import { renderDashboard, renderMarketing, renderProject, renderReview } from "./ui.js?v=frame-native-20";
import { enhanceDashboard, enhanceMarketing, enhanceProject, enhanceReview, initTheme, renderAdmin, renderCheckout, selectCheckoutPlan } from "./features.js?v=payment-region-1";
import { enhanceMarketplaceAdmin, enhanceMarketplaceDashboard, enhanceMarketplaceMarketing, renderMarketplace, renderProviderOnboarding, renderProviderWorkspace, renderTalentProfile } from "./marketplace.js?v=client-path-2";
import { enhanceAdminSuite, enhanceDashboardSuite, enhanceProjectSuite, enhanceReviewSuite, prepareClientRoute } from "./advanced.js?v=live-client-directory-1";
import { initProductPolish, polishRoute } from "./polish.js?v=admin-title-1";
import { enhanceCreatorTools } from "./creator-tools.js?v=frame-native-3";
import { enhanceUploadAdmin, renderClientUpload } from "./uploads.js?v=owner-session-files-1";
import { accountUser, refreshAccountSession, rememberProtectedRoute, renderAccountAccess, renderProjectBrief } from "./account.js?v=payment-region-1";
import { renderClientWorkspace, renderSharedWorkspace } from "./workspace.js?v=workspace-breadcrumb-1";
import { enhanceStudioDashboard } from "./studio-workspace.js?v=organize-access-2";

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
let routeRenderVersion = 0;

const root = document.getElementById("app");
const loader = document.querySelector("[data-loader]");
const canvas = document.getElementById("studio-canvas");
const overlay = document.querySelector(".scene-overlay");
const progress = document.querySelector("[data-progress]");

const go = route => {
  const current = location.hash.slice(1) || "home";
  if (current === route) void renderRoute();
  else location.hash = route;
};
const actions = {
  openMarketing: () => go("home"),
  openDashboard: () => go("workspace"),
  openProject: () => go("project"),
  openReview: () => go("review"),
  openAccess: route => { rememberProtectedRoute(route || "workspace"); go("access"); },
  openAccount: () => go("workspace?panel=account"),
  openScripts: () => go("workspace?panel=scripts"),
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
  const renderVersion = ++routeRenderVersion;
  const motionRender = ++cinematicRender;
  let route = location.hash.slice(1);
  if (!route) {
    const hasSavedSession = (() => {
      try {
        const raw = localStorage.getItem("cx_access");
        return Boolean(raw && JSON.parse(raw)?.account);
      } catch { return false; }
    })();
    if (hasSavedSession) {
      await Promise.race([refreshAccountSession(), new Promise(r => setTimeout(r, 1000))]);
      if (accountUser()) {
        route = "workspace";
        history.replaceState(null, "", `${location.pathname}${location.search}#workspace`);
      } else {
        route = "home";
      }
    } else {
      route = "home";
      refreshAccountSession().then(user => {
        if (user && !location.hash.slice(1)) {
          history.replaceState(null, "", `${location.pathname}${location.search}#workspace`);
          renderRoute();
        }
      }).catch(() => {});
    }
  }
  const stale = () => renderVersion !== routeRenderVersion;
  document.documentElement.classList.add("route-busy");
  try {
    loader?.classList.add("is-done");
    // These guards belong to the old DOM, not to the reusable route root.
    ["advancedDashboard", "advancedProject", "advancedReview", "advancedAdmin", "dashboardEnhanced"].forEach(key => delete root.dataset[key]);
    prepareClientRoute(route);
    window.scrollTo(0, 0);
    canvas.hidden = true;
    overlay.hidden = true;
    progress.hidden = route !== "home";
    const uploadRoute = route.startsWith("upload?");
    const uploadHasToken = uploadRoute && Boolean(new URLSearchParams(route.split("?")[1] || "").get("token"));
    const protectedRoute = ["account", "checkout"].includes(route) || route.startsWith("brief") || (uploadRoute && !uploadHasToken);
    if (protectedRoute || route.startsWith("access")) await Promise.race([refreshAccountSession(), new Promise(r => setTimeout(r, 1500))]);
    if (stale()) return;
    if (protectedRoute && !accountUser()) {
      rememberProtectedRoute(route);
      renderAccountAccess(root, actions);
    }
    else if (route.startsWith("share?")) await renderSharedWorkspace(root, actions, route);
    else if (uploadRoute && uploadHasToken) await renderClientUpload(root, actions, route);
    else if (uploadRoute) await renderClientWorkspace(root, actions, route.replace(/^upload/, "workspace"));
    else if (route.startsWith("workspace")) {
      await Promise.race([refreshAccountSession(), new Promise(r => setTimeout(r, 1200))]);
      if (stale()) return;
      if (accountUser() || route.includes("panel=scripts") || route.includes("panel=showcase")) {
        await renderClientWorkspace(root, actions, route);
      } else {
        renderDashboard(root, actions, { demo:true });
        enhanceDashboard(root, actions, { demo:true });
        enhanceDashboardSuite(root, actions);
      }
    }
    else if (route === "project") { renderProject(root, actions); enhanceProject(root, actions); enhanceProjectSuite(root, actions); }
    else if (route === "review") { renderReview(root, actions); enhanceReview(root, actions); enhanceReviewSuite(root, actions); }
    else if (route.startsWith("access")) {
      if (accountUser() && !route.includes("reset=")) {
        history.replaceState(null, "", `${location.pathname}${location.search}#workspace`);
        await renderClientWorkspace(root, actions, "workspace");
      } else renderAccountAccess(root, actions);
    }
    else if (route === "account") {
      history.replaceState(null, "", `${location.pathname}${location.search}#workspace?panel=account`);
      await renderClientWorkspace(root, actions, "workspace?panel=account");
    }
    else if (route.startsWith("brief")) await renderProjectBrief(root, actions, route);
    else if (route === "checkout") renderCheckout(root, actions);
    else if (route === "marketplace") renderMarketplace(root, actions);
    else if (route === "talent") renderTalentProfile(root, actions);
    else if (route === "offer-services") renderProviderOnboarding(root, actions);
    else if (route === "provider-workspace") renderProviderWorkspace(root, actions);
    else if (route === "owner") { await renderAdmin(root, actions); enhanceMarketplaceAdmin(root); enhanceAdminSuite(root); enhanceUploadAdmin(root); }
    else { renderMarketing(root, studio, actions); enhanceMarketing(root, actions, studio); enhanceMarketplaceMarketing(root, actions); }
    if (stale()) return;
    polishRoute(root, route);
    enhanceCreatorTools(root, route);
    try { enhanceStudioDashboard(root); }
    catch (error) { console.warn("Dashboard presentation was skipped", error); }
    const inPageTarget = document.getElementById(route);
    if (inPageTarget) {
      setTimeout(() => {
        inPageTarget.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    }
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
    if (!stale()) document.documentElement.classList.remove("route-busy");
  }
}

document.addEventListener("click", event => {
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor) return;
  const targetId = anchor.getAttribute("href").slice(1);
  if (["pricing", "workflow", "scripts", "faq", "creator-tools", "work", "top"].includes(targetId)) {
    const el = document.getElementById(targetId);
    if (el) {
      event.preventDefault();
      history.replaceState(null, "", `#${targetId}`);
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      event.preventDefault();
      location.hash = targetId;
    }
  }
});

window.addEventListener("hashchange", () => { void renderRoute(); });
window.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
}, { passive: true });
initTheme();
initProductPolish();
void renderRoute();
