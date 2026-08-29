const routeTitles = {
  home: "Content X | Managed Content Production",
  marketplace: "Start a Project | Content X",
  talent: "Private Matching | Content X",
  "offer-services": "Private Provider Listing | Content X",
  "provider-workspace": "Provider Portal | Content X",
  access: "Client Access | Content X",
  checkout: "Complete Your Order | Content X",
  owner: "Owner Operations | Content X",
  workspace: "Client Workspace | Content X",
  project: "Project Workspace | Content X",
  review: "Video Review | Content X"
};

let observer;

function enhanceModal(layer) {
  if (!(layer instanceof HTMLElement) || layer.dataset.dialogReady) return;
  layer.dataset.dialogReady = "true";
  const dialog = layer.matches('[role="dialog"]') ? layer : layer.querySelector('[role="dialog"], form, section, article, div');
  if (!dialog) return;
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  const heading = dialog.querySelector("h1, h2, h3");
  if (heading) {
    heading.id ||= `dialog-title-${Date.now()}`;
    dialog.setAttribute("aria-labelledby", heading.id);
  }
  const previousFocus = document.activeElement;
  const close = () => {
    const closeButton = layer.querySelector(".modal-close, .advanced-close, [data-close-brief]");
    if (closeButton) closeButton.click(); else layer.remove();
    if (previousFocus instanceof HTMLElement && document.contains(previousFocus)) previousFocus.focus();
  };
  layer.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); close(); } });
  requestAnimationFrame(() => {
    const autofocus = dialog.querySelector("[autofocus]") || dialog.querySelector("input:not([type='hidden']), textarea, select") || dialog.querySelector("button");
    if (autofocus instanceof HTMLElement) autofocus.focus();
  });
}

function labelInteractiveControls(root) {
  root.querySelectorAll("button").forEach(button => {
    const text = (button.textContent || "").trim();
    if (!button.getAttribute("aria-label") && /^[+×−•••⌕◦⚙⛶↗↑↓←→✓◇◷]+$/.test(text)) button.setAttribute("aria-label", button.title || "Action");
  });
}

export function polishRoute(root, requestedRoute) {
  const renderedRoute = root.classList.contains("access-app") ? "access" : root.classList.contains("owner-access-app") ? "owner" : requestedRoute;
  document.title = routeTitles[renderedRoute] || routeTitles.home;
  root.dataset.route = renderedRoute;
  root.querySelectorAll('a[href^="#"]').forEach(link => {
    const active = link.getAttribute("href") === `#${requestedRoute}`;
    if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
  });
  labelInteractiveControls(root);
  const announcer = document.querySelector("[data-route-announcer]");
  if (announcer) announcer.textContent = `${document.querySelector("h1")?.textContent?.trim() || "Content X"} loaded`;
}

export function initProductPolish() {
  if (observer) return;
  const announcer = document.createElement("div");
  announcer.className = "sr-only";
  announcer.dataset.routeAnnouncer = "true";
  announcer.setAttribute("aria-live", "polite");
  document.body.append(announcer);

  const connection = document.createElement("div");
  connection.className = "connection-status";
  connection.setAttribute("role", "status");
  connection.setAttribute("aria-live", "polite");
  document.body.append(connection);
  const updateConnection = () => {
    connection.textContent = navigator.onLine ? "Back online — changes can sync" : "You’re offline — drafts remain on this device";
    connection.classList.toggle("show", !navigator.onLine);
    if (navigator.onLine && connection.dataset.wasOffline) {
      connection.classList.add("show", "online");
      setTimeout(() => connection.classList.remove("show", "online"), 2200);
    }
    if (!navigator.onLine) connection.dataset.wasOffline = "true";
  };
  window.addEventListener("online", updateConnection);
  window.addEventListener("offline", updateConnection);
  updateConnection();

  document.querySelectorAll(".modal-layer").forEach(enhanceModal);
  document.querySelectorAll(".global-toast").forEach(toast => { toast.setAttribute("role", "status"); toast.setAttribute("aria-live", "polite"); });
  observer = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
    if (!(node instanceof HTMLElement)) return;
    if (node.matches(".modal-layer")) enhanceModal(node);
    node.querySelectorAll?.(".modal-layer").forEach(enhanceModal);
    if (node.matches(".global-toast")) { node.setAttribute("role", "status"); node.setAttribute("aria-live", "polite"); }
  })));
  observer.observe(document.body, { childList: true, subtree: true });
}
