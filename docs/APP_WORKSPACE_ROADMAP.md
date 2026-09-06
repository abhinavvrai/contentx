# Content X App & Workspace Upgrade Ledger

This ledger is the accepted product scope for the signed-in app, private review links, uploads, account area, notifications, pricing clarity inside the app, reliability and security. The public marketing website and conversion experiments are intentionally out of scope.

## Product rules

- Build real workflows, not buttons that only look functional.
- Keep unfinished provider-dependent features hidden until credentials, abuse protection and monitoring are ready.
- Preserve the compact dark Content X interface, orange-gradient primary actions and white action labels.
- Keep account, projects, search, notifications and review navigation inside one persistent workspace shell.
- Keep media private in R2 and metadata in D1. Never expose object keys, permanent media URLs, access tokens or secrets in browser storage.
- Every release must update the release label, automated checks, README and PROJECT_GUIDE.

## Shipped foundation

- Account: Google, email-code and password access; password reset; profile name, optional phone/company/role and private profile photo.
- Workspace: project overview, project search, recent projects, command menu, compact account area and storage usage.
- Organisation: nested folders, breadcrumbs, drag-and-drop movement, rename, safe folder removal, project archive and protected deletion.
- Files: private multipart upload, type/size/duration validation, replacement versions, grid/list views, field visibility, sorting and lazy private video hover preview.
- Review: video, audio, image, PDF and text/script preview; timestamped comments; PDF page references; selected-text quotes; comment completion; version history and comparison.
- Precision review: In/Out loops, timeline pins, synchronized side-by-side/wipe comparison and TXT/CSV/EDL export.
- Sharing: opaque short links, exact expiry, optional passwords, selected-file scope, independent upload/download/comment/approval/version-history permissions, revocation, analytics and social/email copy actions.
- Notifications: in-app activity, per-event email/in-app controls, comment digest preference and test notification.
- Commerce inside the app: package-linked revision counters and extra-round purchase actions.

## Current release work — frame-native-17

- Per-link password protection using a unique salt and PBKDF2-SHA-256 derivation; readable passwords never enter D1, URLs or browser storage.
- Exact expiry date and time plus immediate Active/Disabled control.
- Independent permissions for uploads, original downloads, comments, approval and previous-version access.
- Whole-project or selected-file sharing, with server-side scope checks on lists, history, comments, decisions, previews, downloads and replacements.
- Preview-only signatures are cryptographically distinct from original-download signatures.
- Shared review pages show a concise permission summary and remove unavailable comment, approval and download actions.
- Link-level view, download, comment and approval counts in the share manager.
- Manager-only project activity for uploads, feedback, approvals/changes requested and share creation.
- Automatic one-time refresh for expired private media and voice-note playback links.
- Browser warning before closing or refreshing while a multipart upload is active.
- Production migration: `drizzle/0009_share_permissions.sql` must run before the application release.

## Approved next releases

### Review, comments and approval

- Anchored image/PDF regions and draggable time-range handles.
- Reply reactions, mentions and richer thread grouping.
- Unresolved-only autoplay queue and expanded review summaries per version.
- Delivery lock states and approval reminders built on the persistent per-version decision history.
- Version labels, version notes, compare defaults and restore-as-new-version.
- Captions/subtitle track selection, safe frame capture and colour-managed preview guidance.

### Workspace and organisation

- Collections that reference assets without duplicating storage.
- Starred/pinned projects and assets, recent files and richer archive views.
- Bulk download/tag/status and keyboard range selection on top of the shipped multi-select move/removal controls.
- Saved views and filters, custom metadata fields, card-density presets and list columns.
- Duplicate project/folder templates, client contacts, member roles and restricted-folder permissions.
- Expand the shipped activity history with moves, restores, downloads and share-setting changes.

### Search and discovery

- Unified search across projects, folders, filenames, comment text, people and metadata.
- Search chips for type, owner, date, status, version, open feedback and approval.
- Saved searches, recent searches, keyboard result navigation and highlighted matches.
- Optional transcript/visual AI search only after a real indexing provider, consent controls and deletion flow exist.

### Share links and client review

- Watermark option, link templates and default expiry rules on top of the shipped password, file-scope and permission controls.
- Recipient identity, completed-review state and link activity export on top of the shipped counters.
- Client-friendly decision mode, approval reminders and clear expired/revoked pages.
- Branded link title/cover and a compact mobile review composer.

### Uploads and media performance

- Concurrent queue with a safe bandwidth limit and visible remaining time.
- Resume after refresh using recoverable multipart session metadata without storing account credentials.
- Duplicate detection, checksum verification, failed-part retry and upload diagnostics.
- Background thumbnail/proxy/transcode generation only after a managed media worker is configured.
- Malware scanning quarantine only after a verified scanning provider is configured; never label an unscanned file as safe.

### Notifications and account

- Workspace notification inbox in the global rail, unread badge, mark-all-read and deep links.
- Quiet hours, daily/weekly digest, per-project mute and assignment/due-date reminders.
- Login/session history, active-device sign-out, backup recovery options and optional multi-factor authentication.
- Phone-number sign-in remains hidden until a verified SMS provider, rate limits, cost controls and delivery monitoring are configured.

### Billing and client clarity inside the app

- Plain-language package comparison attached to project creation and checkout return states.
- Clear included revision count, extra revision price, quick-delivery entitlement and add-on explanation on every paid project.
- Invoice/receipt download, payment-failure recovery, refund timeline and support handoff linked to the order.

### UX, accessibility and reliability

- Replace remaining low-level folder/file action glyphs with the existing original SVG icon system.
- Consistent focus rings, larger touch targets, accessible labels, contrast verification and full keyboard navigation.
- Optimistic controls with rollback, skeletons only on first load and stale-request cancellation for more write actions.
- Explicit offline detection and reconnect status on top of the shell-preserving route recovery.
- Performance budgets for route response, media preview, JavaScript size and layout shift.

### Security and operations

- Role and permission audit for every write endpoint, plus CSRF/origin enforcement and rate limits.
- Share-token rotation, session revocation, audit logs, signed-link expiry checks and export/delete account flows.
- Content Security Policy, dependency checks, structured server errors and privacy-safe observability.
- Backup/restore rehearsal for D1 and R2 metadata, data-retention rules and documented incident recovery.

## Provider-gated capabilities

The following must not appear as active until the named dependency is operational: phone/SMS login, WhatsApp automation, speech transcription, AI media search, malware scanning, adaptive streaming/transcoding, real-time multi-user presence and external analytics. Each requires provider credentials, privacy terms, rate/cost limits, failure monitoring, deletion handling and an end-to-end production test.
