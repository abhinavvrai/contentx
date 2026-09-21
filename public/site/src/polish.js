const routeTitles = {
  home: "Content X | Managed Content Production",
  marketplace: "Start a Project | Content X",
  talent: "Private Matching | Content X",
  "offer-services": "Private Provider Listing | Content X",
  "provider-workspace": "Provider Portal | Content X",
  access: "Client Access | Content X",
  checkout: "Complete Your Order | Content X",
  owner: "Content X Admin | Content X",
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

const esc = text => String(text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function showToast(message, type = "info") {
  let toast = document.querySelector(".cx-global-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "cx-global-toast global-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.append(toast);
  }
  const icon = type === "success" ? "✓" : type === "action" ? "⚡" : "ℹ";
  toast.innerHTML = `<span class="toast-badge">${icon}</span><span class="toast-text">${esc(message)}</span>`;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2800);
}

export function openCommandPalette() {
  const existing = document.getElementById("cx-command-layer");
  if (existing) { existing.remove(); return; }

  const layer = document.createElement("div");
  layer.id = "cx-command-layer";
  layer.className = "modal-layer cx-command-layer";

  const commands = [
    { group: "Navigation", icon: "⌂", title: "Workspace Overview", desc: "View video projects, cuts, and storage", badge: "G W", action: () => { location.hash = "workspace"; } },
    { group: "Navigation", icon: "▶", title: "Video Review Room", desc: "Frame-accurate video playback & notes", badge: "G R", action: () => { location.hash = "review"; } },
    { group: "Navigation", icon: "📁", title: "Project Directory", desc: "Manage assets, cuts, and revisions", badge: "G P", action: () => { location.hash = "project"; } },
    { group: "Navigation", icon: "✍", title: "Scripts & Hooks Studio", desc: "Caption hooks, Hinglish workflow & scripts", badge: "G S", action: () => { location.hash = "workspace?panel=scripts"; } },
    { group: "Navigation", icon: "👥", title: "Talent Marketplace", desc: "Vetted video editors & motion designers", badge: "G M", action: () => { location.hash = "marketplace"; } },
    { group: "Navigation", icon: "💳", title: "Pricing & Production Plans", desc: "4, 8, 12 video monthly tiers with 48h turnaround", badge: "G $", action: () => { location.hash = "checkout"; } },
    { group: "Navigation", icon: "⚙", title: "Account & Preferences", desc: "Profile, storage quota, appearance & billing", badge: "G A", action: () => { location.hash = "workspace?panel=account"; } },
    { group: "Actions", icon: "🔗", title: "Copy Page Link", desc: "Copy direct link to current workspace view", badge: "⌘C", action: () => { navigator.clipboard?.writeText?.(location.href); showToast("Link copied to clipboard!", "success"); } },
    { group: "Actions", icon: "⌨", title: "Keyboard Shortcuts", desc: "View full playback and navigation hotkeys", badge: "?", action: () => { setTimeout(openShortcutsGuide, 120); } },
    { group: "Appearance", icon: "☀", title: "Switch to Light Mode", desc: "Crisp paper canvas with dark typography (Default)", badge: "☀", action: () => { document.querySelector('[data-set-theme="light"]')?.click() || (document.documentElement.dataset.theme = "light", localStorage.setItem("cx_theme", "light")); showToast("Interface theme set to Light Mode", "action"); } },
    { group: "Appearance", icon: "☾", title: "Switch to Dark Mode", desc: "Obsidian low-light canvas for color grading", badge: "☾", action: () => { document.querySelector('[data-set-theme="dark"]')?.click() || (document.documentElement.dataset.theme = "dark", localStorage.setItem("cx_theme", "dark")); showToast("Interface theme set to Dark Mode", "action"); } }
  ];

  layer.innerHTML = `
    <div class="cx-command-dialog" role="dialog" aria-modal="true" aria-label="Command Palette">
      <div class="cx-command-input-wrap">
        <span class="cx-cmd-search-icon">⌕</span>
        <input type="search" class="cx-command-input" placeholder="Type a command or search (e.g. review, scripts, light)..." autofocus autocomplete="off" spellcheck="false">
        <kbd class="cx-cmd-esc-badge">ESC</kbd>
      </div>
      <div class="cx-command-list" role="listbox"></div>
      <footer class="cx-command-footer">
        <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
        <span><kbd>↵</kbd> Select</span>
        <span><kbd>ESC</kbd> Dismiss</span>
      </footer>
    </div>
  `;

  document.body.append(layer);

  const input = layer.querySelector(".cx-command-input");
  const list = layer.querySelector(".cx-command-list");
  let selectedIndex = 0;
  let filtered = commands;

  function renderList() {
    if (!filtered.length) {
      list.innerHTML = `<div class="cx-command-empty">No matching commands found for &ldquo;${esc(input.value)}&rdquo;</div>`;
      return;
    }

    let html = "";
    let currentGroup = "";
    filtered.forEach((cmd, idx) => {
      if (cmd.group !== currentGroup) {
        currentGroup = cmd.group;
        html += `<div class="cx-command-group-title">${esc(currentGroup)}</div>`;
      }
      const isSelected = idx === selectedIndex;
      html += `
        <div class="cx-command-item ${isSelected ? "is-selected" : ""}" role="option" aria-selected="${isSelected}" data-cmd-index="${idx}">
          <span class="cx-cmd-icon">${cmd.icon}</span>
          <div class="cx-cmd-details">
            <strong>${esc(cmd.title)}</strong>
            <small>${esc(cmd.desc)}</small>
          </div>
          ${cmd.badge ? `<kbd class="cx-cmd-badge">${esc(cmd.badge)}</kbd>` : ""}
        </div>
      `;
    });
    list.innerHTML = html;

    const selectedEl = list.querySelector(".cx-command-item.is-selected");
    selectedEl?.scrollIntoView({ block: "nearest" });
  }

  function executeItem(index) {
    const cmd = filtered[index];
    if (cmd) {
      layer.remove();
      cmd.action();
    }
  }

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    filtered = query
      ? commands.filter(c => c.title.toLowerCase().includes(query) || c.desc.toLowerCase().includes(query) || c.group.toLowerCase().includes(query))
      : commands;
    selectedIndex = 0;
    renderList();
  });

  input.addEventListener("keydown", event => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (filtered.length) {
        selectedIndex = (selectedIndex + 1) % filtered.length;
        renderList();
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (filtered.length) {
        selectedIndex = (selectedIndex - 1 + filtered.length) % filtered.length;
        renderList();
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      executeItem(selectedIndex);
    } else if (event.key === "Escape") {
      event.preventDefault();
      layer.remove();
    }
  });

  list.addEventListener("click", event => {
    const item = event.target.closest("[data-cmd-index]");
    if (item) {
      const idx = Number(item.dataset.cmdIndex);
      executeItem(idx);
    }
  });

  layer.addEventListener("click", event => {
    if (event.target === layer) layer.remove();
  });

  renderList();
  input.focus();
}

export function openShortcutsGuide() {
  const existing = document.getElementById("cx-shortcuts-layer");
  if (existing) { existing.remove(); return; }

  const layer = document.createElement("div");
  layer.id = "cx-shortcuts-layer";
  layer.className = "modal-layer cx-shortcuts-layer";

  layer.innerHTML = `
    <div class="cx-shortcuts-dialog" role="dialog" aria-modal="true" aria-label="Keyboard Shortcuts">
      <header class="cx-shortcuts-head">
        <div>
          <h2>Keyboard Shortcuts</h2>
          <p>Productivity hotkeys for video review and workspace navigation</p>
        </div>
        <button type="button" class="modal-close" aria-label="Close shortcuts">&times;</button>
      </header>
      <div class="cx-shortcuts-body">
        <section class="cx-shortcut-category">
          <h3>🎬 Video Review &amp; Playback</h3>
          <div class="cx-shortcut-row"><span class="shortcut-desc">Play / Pause video playback</span><div class="shortcut-keys"><kbd>Space</kbd></div></div>
          <div class="cx-shortcut-row"><span class="shortcut-desc">Step 1 second backward / forward</span><div class="shortcut-keys"><kbd>J</kbd><kbd>L</kbd></div></div>
          <div class="cx-shortcut-row"><span class="shortcut-desc">Step exact frame backward / forward</span><div class="shortcut-keys"><kbd>←</kbd><kbd>→</kbd></div></div>
          <div class="cx-shortcut-row"><span class="shortcut-desc">Capture timestamp &amp; open comment</span><div class="shortcut-keys"><kbd>C</kbd></div></div>
          <div class="cx-shortcut-row"><span class="shortcut-desc">Toggle fullscreen mode</span><div class="shortcut-keys"><kbd>F</kbd></div></div>
          <div class="cx-shortcut-row"><span class="shortcut-desc">Toggle mute audio</span><div class="shortcut-keys"><kbd>M</kbd></div></div>
        </section>
        <section class="cx-shortcut-category">
          <h3>⚡ Global Navigation &amp; Commands</h3>
          <div class="cx-shortcut-row"><span class="shortcut-desc">Open Command Palette</span><div class="shortcut-keys"><kbd>⌘</kbd><kbd>K</kbd> / <kbd>Ctrl</kbd><kbd>K</kbd></div></div>
          <div class="cx-shortcut-row"><span class="shortcut-desc">Open Keyboard Shortcuts guide</span><div class="shortcut-keys"><kbd>?</kbd></div></div>
          <div class="cx-shortcut-row"><span class="shortcut-desc">Close open dialog or drawer</span><div class="shortcut-keys"><kbd>Esc</kbd></div></div>
        </section>
      </div>
      <footer class="cx-shortcuts-foot">
        <p>Press <kbd>Esc</kbd> anytime to close this cheat sheet</p>
      </footer>
    </div>
  `;

  document.body.append(layer);

  layer.querySelector(".modal-close")?.addEventListener("click", () => layer.remove());
  layer.addEventListener("click", event => {
    if (event.target === layer) layer.remove();
  });
  layer.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      layer.remove();
    }
  });
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

  // Global hotkeys (Cmd+K for Command Palette, ? for Shortcuts Guide)
  window.addEventListener("keydown", event => {
    const activeTag = document.activeElement?.tagName;
    const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(activeTag) || document.activeElement?.isContentEditable;

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openCommandPalette();
      return;
    }

    if (event.key === "?" && !isInput && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      openShortcutsGuide();
      return;
    }
  });

  // Global click delegations
  document.addEventListener("click", event => {
    const cmdTrigger = event.target.closest('[data-action="command-palette"], .nav-cmd-trigger');
    if (cmdTrigger) {
      event.preventDefault();
      openCommandPalette();
      return;
    }

    const shortcutTrigger = event.target.closest('[data-action="shortcuts-guide"]');
    if (shortcutTrigger) {
      event.preventDefault();
      openShortcutsGuide();
      return;
    }
  });

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
