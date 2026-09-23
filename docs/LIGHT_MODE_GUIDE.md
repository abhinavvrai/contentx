# Content X — Light Mode & Theme Architecture Reference

This document serves as the permanent source of truth for the **Light Theme (`html[data-theme="light"]`)** and **Blue Theme (`[data-accent="blue"]`)** conversion across Content X. It documents every modified element, selector, component, rationale, and guideline to prevent visual and behavioral regressions in future updates.

---

## 1. Theme Architecture & Cascade

Content X supports both Dark and Light themes, driven by the root `<html>` attribute:
- `html[data-theme="dark"]`: Dark near-black studio aesthetic (`#0c0d12`, `#12131a`, `#181920`).
- `html[data-theme="light"]`: Modern crisp editorial light palette (`#ffffff`, `#f8fafc`, `#f1f5f9`, `#0f172a`).
- `html[data-accent="blue"]` or `html:not([data-accent="orange"])`: Electric blue brand accent (`#2563eb`, `#38bdf8`, `#1d4ed8`, `#eff6ff`).

### Primary Style Files Involved:
1. **`public/site/src/theme-blue.css`**: Master theme override stylesheet loaded after legacy styles; contains authoritative rules for light mode components, badges, modals, video player controls, and Scripts Studio.
2. **`public/site/src/theme.css`**: Core theme tokens, CSS custom properties (`--bg-primary`, `--text-primary`, etc.), and base light mode overrides.
3. **`public/site/src/advanced.css`**: Advanced project review controls, comparison modals, and command bar styling.
4. **`public/site/src/frame-workspace.css`**: Workspace shell, canvas layouts, cue tags, and asset linking markups.
5. **`public/site/src/creator-tools.css`**: Bento grid creator tools, meter cards, and action buttons.

---

## 2. Review Page (`?route=review`) Light Mode Conversions

### 2.1 Media Format Badges
- **Selector**: `.media-format-chip`
- **Issue**: Showed white text on dark background in light mode.
- **Light Theme Rule**:
  ```css
  html[data-theme="light"] #app .media-format-chip {
    background: #f1f5f9 !important;
    border: 1px solid #cbd5e1 !important;
    color: #0f172a !important;
  }
  ```

### 2.2 Review Command Bar Buttons
- **Selector**: `.review-command-bar button`, `[data-open-scan]`, `[data-open-shortcuts]`
- **Buttons Affected**: `Compare`, `Transcribe`, `Checklist`, `Smart scan`.
- **Light Theme Rule**:
  ```css
  html[data-theme="light"] #app .review-command-bar button {
    background: #ffffff !important;
    color: #1e293b !important;
    border: 1px solid #cbd5e1 !important;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05) !important;
  }
  html[data-theme="light"] #app .review-command-bar button:hover {
    background: #eff6ff !important;
    border-color: #3b82f6 !important;
    color: #1d4ed8 !important;
  }
  ```

### 2.3 Video Player Controls (Play / Pause Button)
- **Selector**: `.player-play-toggle`
- **Issue**: Was stuck in dark mode styling (`#000` background with white text).
- **Light Theme Rule**:
  ```css
  html[data-theme="light"] #app .player-play-toggle {
    background: #ffffff !important;
    border: 1px solid #cbd5e1 !important;
    color: #0f172a !important;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08) !important;
  }
  html[data-theme="light"] #app .player-play-toggle:hover {
    background: #f8fafc !important;
    border-color: #94a3b8 !important;
  }
  /* Dark mode is cleanly preserved */
  html[data-theme="dark"] #app .player-play-toggle {
    background: #1e293b !important;
    color: #f8fafc !important;
    border-color: #334155 !important;
  }
  ```

### 2.4 Fast Review Guide Modal
- **Selector**: `.shortcut-grid`, `.shortcut-card`, `.shortcut-key`
- **Light Theme Rule**:
  ```css
  html[data-theme="light"] #app .shortcut-grid {
    background: #f8fafc !important;
    border-color: #e2e8f0 !important;
  }
  html[data-theme="light"] #app .shortcut-card {
    background: #ffffff !important;
    border: 1px solid #e2e8f0 !important;
    color: #1e293b !important;
  }
  ```

### 2.5 Version Comparison Section
- **Selectors**: `.comparison-modal`, `.comparison-feedback`, `.comparison-feedback-list article`, `.comparison-mode`
- **Light Theme Rule**:
  ```css
  html[data-theme="light"] #app .comparison-modal,
  html[data-theme="light"] #app .comparison-feedback {
    background: #ffffff !important;
    border-color: #cbd5e1 !important;
    color: #0f172a !important;
  }
  html[data-theme="light"] #app .comparison-feedback-list article {
    background: #f8fafc !important;
    border: 1px solid #e2e8f0 !important;
    color: #1e293b !important;
  }
  ```

---

## 3. Scripts Studio (`?route=workspace&panel=scripts`) Light Mode & Blue Theme

### 3.1 Topbar & Header
- **Breadcrumb Root & Saved Badge**: `.scripts-breadcrumb-topbar`, `.scripts-breadcrumb-root`, `.scripts-breadcrumb-sep`, `.scripts-save-badge`
  - Rendered with `#f8fafc` background, slate text (`#475569`), and subtle `#e2e8f0` dividers.
- **Project Selector & Actions**: `.scripts-project-btn`, `.scripts-main-title-input`, `.scripts-topbar-action-btn`
  - Styled with `#ffffff` backgrounds, `#0f172a` text, and blue focus/hover highlights.

### 3.2 Sidebar Footer & Workspace Storage
- **Script Count & Total Speech Runtime**:
  - Selector: `.scripts-sidebar-footer`, `.scripts-count-label`, `.scripts-total-runtime`
  - Light mode: `#ffffff` background, top border `#e2e8f0`, label `#64748b`.
  - `.scripts-total-runtime` uses `#0284c7` (cyan/blue accent) instead of orange.
- **Workspace Storage Card**:
  - Selector: `.workspace-storage`, `.workspace-storage-copy`
  - Light mode: `#f8fafc` background, `#e2e8f0` border, `#0f172a` header, `#64748b` metadata text.

### 3.3 Footage & Assets Sidebar
- **Selectors**: `.scripts-linked-sidebar`, `.linked-sidebar-head`, `.linked-tab-btn`, `.linked-sidebar-tabs`
- **Light Theme Rule**: Light `#ffffff` card surfaces, subtle slate borders (`#cbd5e1`), active tab highlighted in blue (`#2563eb` with `#eff6ff` background).

### 3.4 Hook Score Circular Gauge
- **Selectors**: `.scripts-circular-hook-meter`, `.hook-score-val`, `.hook-score-label`, `.cx-gauge-bg`, `.cx-gauge-fill`
- **Conversion**:
  - Meter background: `#e2e8f0` in light mode.
  - Gauge SVG fill stroke: `#2563eb` (Blue theme) instead of `#ff5c20` (Orange).
  - Score value: `#0f172a` in light mode.

---

## 4. Asset Linking & De-linking Fixes

### 4.1 De-linking Bug Fixed
- **Problem**: When de-linking an asset, the script line remained highlighted because only `.cx-script-asset-chip` was removed, leaving the enclosing `<mark class="cx-linked-asset-phrase">` element wrapped around the text.
- **Solution**:
  - Implemented `unwrapElement(el)` in `src/scripts-studio.js`.
  - In `unlinkAssetFromScript(assetId)` and the chip delete button click handler (`.asset-chip-del`), any enclosing or associated `mark.cx-linked-asset-phrase` elements are systematically unwrapped.
  - The phrase highlight disappears immediately while preserving the user's text without character loss.

### 4.2 Asset Hover Preview Popover
- **Feature**: When hovering over linked text (`.cx-linked-asset-phrase`) or asset chip (`.cx-script-asset-chip`), a floating preview card `.cx-asset-hover-popover` appears:
  - Embeds looped autoplay muted video footage if URL is available.
  - Displays asset name, file size/tags, and "Project Footage" badge.
  - Includes **"Preview Video"** (plays in sidebar) and **"Unlink"** (de-links and unmarks text).
  - Designed with hover delay / grace timeout so users can click actions inside the card.
  - Fully styled for both light and dark themes.

---

## 5. Script Continuous Flow vs. Divided Sections

- **Requirement**: Scripts should not force rigid section divisions; user must have full control to toggle sections on or off.
- **Implementation**:
  - Added a `Sections: Continuous / Divided` toggle in the formatting ribbon (`[data-toggle-sections]`) and overflow menu.
  - State persisted in `localStorage` under `cx_scripts_sections_mode` (default: `"continuous"`).
  - When continuous flow is active:
    - Editor receives `.is-continuous-flow`.
    - `h1` and `h2` dividing bottom borders are removed; margins are compact.
    - `<hr class="script-scene-divider">` elements are hidden.
    - Script flows as a unified editorial document.
  - Users can toggle back to "Divided" anytime to show scene sections.
  - Users can insert a section break at any point via the "Insert Section Break" command.

---

## 6. Creator Tools & Ratio Planner Layout

- **Issue**: Button placement in `creator-card--planner` was awkward because the bento meter was placed below the button.
- **Solution**:
  - In `src/creator-tools.js`, swapped `.bento-meter` to sit above the action button.
  - In `src/creator-tools.css`, added `margin-top: auto` on `.creator-card :is(button, a, .creator-card-status)` so action buttons consistently anchor at the bottom of every card.

---

---

## 7. Default Light Mode & Settings Theme Switcher

- **Default Theme Behavior**:
  - `public/site/index.html` initializes `localStorage.getItem("cx_theme") || "light"` and sets `document.documentElement.dataset.theme = "light"` when no preference is saved.
  - `public/site/src/features.js` defaults `getAppTheme()` to `"light"`.
  - When visitors load Content X for the first time, Light Mode is rendered automatically.
  - Test suites (`tests/noir.test.mjs`, etc.) remain 100% green.

- **Settings Option to Change Theme**:
  - Located in the workspace settings rail (`#workspace?panel=account`) or direct route `#account`.
  - **Tabs Available**:
    1. **Profile**: Includes the quick "Interface Theme" toggle with Dark Mode (`☾`) and Light Mode (`☀`) pills.
    2. **Appearance & Theme** (`data-account-view="appearance"`): Dedicated full-feature appearance panel with rich interactive preview cards for Dark Mode and Light Mode, and accent selection between Obsidian & Ice Cyan (Default) and Sunset Orange (Saved Backup).
  - Theme switches apply in real-time across the app using `setAppTheme()` and `setAppAccent()` with seamless CSS transitions and persistence in `localStorage`.

---

## 8. Golden Rules for Future Modifications

1. **Always Test Light Mode First**: Before pushing any CSS or HTML changes, verify appearance with `data-theme="light"` at:
   - `?route=review` (Review Room)
   - `?route=workspace&panel=scripts` (Scripts Studio)
   - `?route=creator-tools` (Creator Tools)
   - `?route=home` (Homepage & pricing)
2. **Never Hardcode `#000` / `#fff` without Theme Scoping**:
   - Use CSS custom variables or scope using `html[data-theme="light"]` and `html[data-theme="dark"]`.
3. **Keep Accent Blue as Default**:
   - Unless `data-accent="orange"` is explicitly present, always style active indicators, gauges, buttons, and highlights with `#2563eb` / `#38bdf8` / `#eff6ff`.
4. **Preserve DOM Element Unwrapping**:
   - Whenever removing chips or inline tags from contenteditable surfaces, always unwrap any `<mark>` wrappers so user text is never permanently marked.

---

## 9. Workspace Dashboard Alignment (Real Dashboard ⟷ Demo Workspace)

To ensure the production real dashboard (`#workspace`) has the exact same visual appeal, layout, typography, cards, poster art, and color scheme as the demo workspace (`renderDashboard`), the following components are unified:

### 9.1 Unified Header & Project Cards
- **Header**: Dual-classed `.dash-header` with section tag `<p>Workspace</p><h1>Projects</h1>` and primary call-to-action button `<button class="pill pill-hot workspace-button primary">+ New project</button>`.
- **Tools Bar**: `.dash-section-head.workspace-overview-tools` containing `<h2>All projects</h2>`, active project count, search box (`.workspace-overview-search-wrap`), active/all filter pills, name sorting toggle, and grid/list switch.
- **Card Design**: Uses `.project-card.workspace-overview-card` with `.project-card-top.workspace-overview-art` rendering the signature radial gradient `.cx-project-poster` with monogram, lock icon (`⌁`), hover arrow (`Open →`), title, client name, and a bottom status bar with asset count and `•••` settings trigger.
- **Dashed Creation Card**: `.new-project-card.workspace-overview-new` styled with plus glyph, bold label, and caption.

### 9.2 Sidebar Structure & Theme Consistency
- **Brand/Workspace Widget**: `.dash-workspace` with CX avatar badge, `Content X`, client name (`Apex Fitness`), and menu trigger.
- **Navigation Sections**:
  - `WORKSPACE`: Home, Projects (with active count badge), Scripts, Needs review (with review count badge).
  - `LIBRARY`: All assets, Share links.
- **Storage & User Widgets**: Storage meter with percentage bar and `Manage plan` button, plus user footer with monogram avatar and profile details.
- Works identically in both light mode (`html[data-theme="light"]`) and dark mode (`html[data-theme="dark"]`).

---

## 10. Historical Design Backup (19 September 2026)

- The full design and website assets as of 19 September 2026 are archived at:
  `backups/design-2026-09-19/`
- This includes the complete `public/site/` directory (`assets/`, `src/`, `videos/`, `index.html`).
- Never delete or overwrite this directory.


