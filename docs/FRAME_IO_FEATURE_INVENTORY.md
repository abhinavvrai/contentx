# Frame.io Feature Inventory and Content X Adaptation Plan

Last audited: 30 August 2026
Source: the signed-in `next.frame.io` workspace supplied by the user
Method: read-only inspection; no files, comments, invitations, settings, projects, or links were created, edited, or deleted.

## Scope and limits

This is an inventory of the features and controls visible to the current account and plan. Frame.io can expose additional enterprise, admin, integration, camera-to-cloud, and plan-gated controls that were not visible in this workspace. The inventory should therefore be treated as a strong product reference, not a claim that every hidden Frame.io capability has been discovered.

Content X should learn from Frame.io's information architecture and interaction patterns, but it should not reproduce Frame.io branding, proprietary artwork, copy, or pixel-for-pixel trade dress. The goal is an original Content X product with the same clarity and professional density.

## Design lessons for Content X

- Use a compact, persistent app rail and contextual project sidebar instead of large explanatory sections.
- Keep the workspace dark and neutral, reserving Content X orange for primary actions, active states, progress, and focus.
- Use thumbnails, status chips, timestamps, avatars, and icons as the primary information carriers.
- Put secondary actions in hover/context menus and reveal advanced settings only when requested.
- Use split panes: project tree on the left, assets/viewer in the center, comments or metadata on the right.
- Keep body copy to one line where possible. Move explanations into tooltips, empty states, and help panels.
- Preserve keyboard-first workflows and show shortcuts in tooltips and menus.
- Make grid/list density, thumbnail ratio, card size, and visible metadata user-configurable.

## Observed global navigation

- Home/workspace overview.
- Global search, including the `Ctrl/Cmd + K` quick-search shortcut.
- Notifications with unread count.
- Upload activity/status panel.
- What's New, support, and product-feedback entries.
- Adobe app switcher.
- Account menu with profile, settings, language, keyboard shortcuts, theme, and logout.
- Account settings navigation: Profile, Notifications, Usage, Storage, Plan, Billing, Branding, Labs, Users, Projects, Fields, Content Security, Actions, and Webhooks.

## Workspace and project management

- Workspace identity, workspace invitation, workspace settings, workspace project notifications, and workspace deletion.
- New project action and project cards with workspace name and last-updated time.
- Grid/list project appearance.
- Active-project filtering and name sorting.
- Project notifications, duplicate project, mark inactive, project settings, and delete.
- Project member count and invite-to-project action.
- Breadcrumbs and a project switcher/back-to-projects control.
- Frame.io Drive desktop mounting/open-on-desktop promotion.

## Project library and organization

- Expandable asset tree with nested folders.
- Assets, Collections, Camera-to-Cloud connections, and Share Links as separate project areas.
- Folder and asset grouping with item counts, total storage, uploader, upload date, duration, version badge, and workflow status.
- Create folder, upload asset, and upload folder actions.
- Multi-select, select all, range selection, quick look, open in a new tab, and carousel/folder navigation.
- Search within a project.
- Grid/list layout, small/medium/large cards, 16:9/1:1/9:16 ratios, fit/fill thumbnails, card information visibility, title-line count, and flattened folders.
- Configurable visible fields and custom sorting.
- Folder/asset context menus.

## Asset actions

- Create a share link or add an asset to an existing share link.
- Open on desktop or in a new browser tab.
- Version history and version comparison.
- Generate transcripts and upload caption files.
- Download and copy the asset URL.
- Copy to, move to, duplicate, rename, and delete.
- Status and rating fields.
- Selection action bar with file count, combined size/runtime, download, version history, compare, and more actions.

## Review viewer

- Large media viewer with a compact top bar and collapsible surrounding panels.
- Play/pause, reverse/forward playback, multiple speeds, incremental speeds, volume, mute, fullscreen, loop, and quality selection.
- Timecode input and selectable time display format.
- Timeline playhead, hover preview, in/out points, range marking, and range clearing.
- Frame-by-frame and ten-frame navigation.
- Fit, fill, 100% zoom, zoom in/out, marquee zoom, and pan.
- Viewer guides.
- Transcript/captions panel and transcript search.
- Set current frame as thumbnail and download a still.
- Document page navigation and document search are included in the shortcut model.

## Comments, annotations, and approvals

- Timestamped comments tied to the playhead.
- Anchored comments and frame annotations/drawing.
- Attachments, emoji, public visibility, replies, and comment completion state.
- Comment search, timecode sorting, and filters for annotations, attachments, completed, incomplete, unread, mentions/reactions, hashtag, and person.
- Copy, paste, print, and export of the currently visible/filtered comments.
- Comments from other versions can be surfaced and viewed.
- Version comparison and version history are first-class actions.
- Status fields such as `Needs Review` provide workflow state.
- Keyboard shortcuts exist for adding/replying to comments, annotations, undo/redo, version comparison, and asset navigation.

## Asset metadata and custom fields

- Core technical metadata: format, codec, frame rate, resolution, duration, bit rate, dynamic range, audio properties, size, dates, source filename, and uploader.
- Seen-by activity.
- Status, assignee, keywords, tags, notes, rating, transcript, and custom field groups.
- Search and filtering across available fields.
- Support for media-specific and 3D metadata fields was visible, including physical size, materials, poly count, meshes, and textures.

## Search

- Global search across assets, folders, and projects.
- Search location can be narrowed to selected projects.
- The interface advertises structured search for status, assignee, keywords, and more.
- Results and item details use separate panes so browsing does not lose context.

## Account and notifications

- Account settings retain the narrow global rail, then add a dedicated settings sidebar and one focused content pane.
- Personal settings expose Profile and Notifications separately; account-level areas include Usage, Storage, Plan, Billing, Branding and Labs.
- Notifications are grouped by Comments, Assets and Access Requests rather than presented as one long stream.
- Visible event controls include general comments, replies, mentions, the user's uploads, other uploads, status changes, assignments and transcription activity.
- Delivery choices are compact per-event selectors such as All On, All Off or In-App. Content X should keep its existing server-backed email/website preferences while adopting the clearer grouping.

## Share links

- A project-level Share Links area lists all links and provides filtering/sorting.
- An existing share exposes a compact `f.io/<token>` URL, copy action, link visibility, access mode, invite field, settings summary, advanced settings, and activity tab.
- Public access is visible to anyone with the link. Secure/member-specific access is plan-gated in the inspected account.
- Permissions include comments, downloads, all versions, available transcripts, and available captions.
- Security includes passphrase and expiration date (plan-gated in the inspected account).
- Share appearance includes grid/list/reel layouts, open-in-viewer behavior, theme, accent color, card size, aspect ratio, thumbnail fit/fill, card information, and title-line count.
- Share pages can choose visible fields and sorting.
- Header branding/settings are available as a plan-gated option.
- Share activity is tracked, with a personal privacy preference controlling whether creators can see views/downloads.

## Content X short-link proposal

Use an original short route such as `https://contentx.co.in/s/7Kp3Qa` or an optional human-readable slug such as `https://contentx.co.in/s/apex-v3`.

Required implementation properties:

- Store an internal share record and resolve an opaque, collision-resistant token server-side.
- Never expose a project ID, file key, email, or sequential database ID in the URL.
- Allow token rotation/revocation without deleting the project or asset.
- Support expiration, optional passphrase, comments, downloads, uploads, version visibility, transcript/caption visibility, and viewer-only access as independent permissions.
- Record link opens/downloads only after displaying an appropriate privacy notice and respecting the user's activity preference.
- Add rate limiting, authorization checks, audit records, and a safe expired/revoked-link screen.
- Keep the existing long link working during migration and redirect it to the canonical short route.

## High-value Content X adaptation matrix

| Frame.io pattern observed | Original Content X adaptation | Priority |
| --- | --- | --- |
| Compact global rail | Content X rail for Home, Projects, Reviews, Shares, Uploads, Notifications | P0 |
| Project tree + asset grid | Client/project tree with compact media cards and orange status accents | P0 |
| Three-pane review view | Asset navigator, player, and comments/fields inspector | P0 |
| Progressive menus | Icon buttons with tooltips and context menus; remove repeated explanatory cards | P0 |
| Version stack and compare | Existing Content X versions promoted into a clear stack with side-by-side compare | P0 |
| Timestamped comments | Existing server-backed comments shown in a dense review rail | P0 |
| Short share URLs | `/s/<token>` redirect and permission-backed share record | P0 |
| Share permissions | View, comment, download, upload, versions, captions, expiry, passphrase | P1 |
| Configurable asset views | Grid/list, density, thumbnail ratio, visible fields, sorting | P1 |
| Search and filters | Global command search plus project/type/status/assignee filters | P1 |
| Metadata/fields | Technical metadata, assignee, status, tags, notes, rating | P1 |
| Activity and seen-by | Privacy-aware views, downloads, comments, and approvals log | P2 |
| Keyboard shortcuts | Command palette and shortcut reference for review power users | P2 |
| Branding controls | Content X share themes and client-specific accents without copying Frame.io | P2 |
| Desktop mounting/integrations | Future desktop sync and webhook/action integrations | P3 |

## Phased implementation plan

### Part 1 — Premium dashboard shell

Status: expanded locally as `frame-account-1`. The signed-in flow now lands in the real workspace, project search is available in the contextual sidebar, and Profile / Notifications / Orders use a compact settings shell. Visual production review is still required before publishing.

- Replace text-heavy dashboard sections with the compact rail, project header, filters, and media-first project grid.
- Reuse Content X's black/copper system and orange gradient rather than Frame.io colors.
- Keep current functionality connected; change presentation before changing data behavior.
- Add responsive grid/list states, status chips, concise empty states, and accessible tooltips.

### Part 2 — Project asset browser

- Build folder tree, asset grouping, selection bar, search, sort, field visibility, and compact context menus.
- Connect the UI only to real server-backed project/file records; label remaining prototype data honestly.

### Part 3 — Review room

- Consolidate the existing viewer, versions, timestamped comments, annotations, compare, statuses, captions, and metadata into a three-pane review experience.
- Preserve codec fallbacks, authorization, and range-request safeguards.

### Part 4 — Short share links

Status: implemented locally as `frame-suite-1` with opaque `/s/<token>` URLs, server-side token hashing, expiry/revocation enforcement, upload permissions, and compatibility with existing long links.

- Add the server-side share model and `/s/<token>` resolver.
- Add permissions, expiry, passphrase, revocation, activity privacy, and a minimal branded viewer.
- Migrate existing share links without breaking old URLs.

### Part 5 — Team and operations

- Add notifications, member/role management, custom fields, activity, storage/usage, webhooks, and integrations in stages.

## Guardrails for future work

- Do not remove working Content X marketplace, pricing, payment, upload, authentication, or owner features while redesigning the dashboard.
- Do not describe browser-local prototype behavior as secure or multi-user.
- Do not copy Frame.io logos, icons, artwork, text, screenshots, or exact layouts.
- Do not add a short URL that merely hides an insecure public file path; permissions must be enforced at resolution and media-delivery time.
- Implement one part at a time, browser-test it, and publish only after the user reviews the local result.
