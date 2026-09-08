# Agreed improvement checklist

Scope: the user's original 201-item list, excluding **M1–M15 (public website and conversion)**. There are **186 in-scope items**. This document supersedes vague “all features complete” statements. The full backlog is **not complete**.

Status meanings:

- **Implemented**: the stated bounded capability exists in the production-source app. This is not a claim of exhaustive device/provider testing. Release 18 items must not be called live until deployment verification is recorded in README.
- **Partial**: a working subset exists; the gap is explicitly named.
- **Remaining**: implementation or verification still required; not a decorative button to be shown as working.
- **Dependency**: requires a provider, operational setup, privacy/cost choice, or real external verification.

Source of scope: user attachment `39dd4d61-f9a9-4aea-9009-09b174d227b1/pasted-text.txt`. No credentials or private customer data belong in this ledger.

## Voice notes

Evidence: `public/site/src/review-room.js`, `app/api/uploads/route.ts`, `tests/review-studio.test.mjs`. Hardware/cross-browser recording acceptance remains a separate test; release 18 repairs the Worker microphone policy.

| ID | Improvement | Status / remaining acceptance |
|---|---|---|
| V1 | Microphone test | Implemented; live input meter and timed test |
| V2 | Microphone selector | Implemented after permission reveals devices |
| V3 | Permission guidance | Implemented; browser-specific wording can improve |
| V4 | Live waveform | Implemented input-level visualization |
| V5 | Timer and remaining limit | Implemented, 60-second limit |
| V6 | Pause/resume | Implemented |
| V7 | Cancel | Implemented; stops tracks without sending |
| V8 | Preview before sending | Implemented |
| V9 | Re-record | Implemented |
| V10 | Trim silence | Remaining |
| V11 | Upload progress | Partial; state messages, not byte-level progress |
| V12 | Retry failed send | Implemented while room remains open; keeps blob and uploaded ID |
| V13 | Format fallback | Partial; MIME negotiation exists; Safari/iPhone/Android matrix not completed |
| V14 | Secure-link refresh | Implemented; bounded automatic retry |
| V15 | Transcription | Dependency; provider, consent, retention and indexing |
| V16 | Playback controls | Partial; native seek/volume, preview speed; no waveform scrubbing |
| V17 | Keyboard access | Partial; native controls; full recorder keyboard audit remains |
| V18 | Voice replies | Implemented via comment thread parent |
| V19 | Preserve draft on closing room | Remaining; blob is currently room-local |
| V20 | Understandable diagnostics | Implemented; permission/busy/format/send errors |

## Review player

Evidence: `review-room.js`, `review-pro.js`, `studio-workspace.js`, uploads API. Older `features.js` demo tools alone are not proof of signed-in implementation.

| ID | Improvement | Status / remaining acceptance |
|---|---|---|
| R1 | Range comments | Implemented start/end timestamps; draggable handles remain polish |
| R2 | Picture-anchored comments | Remaining in server-backed review room |
| R3 | Annotation shapes | Remaining in server-backed review room |
| R4 | Annotation undo/redo | Remaining |
| R5 | Annotation colour/thickness | Remaining |
| R6 | Comment attachments | Partial; text links/voice only; binary reference attachments remain |
| R7 | Comment drafts | Implemented session-local text draft |
| R8 | Mentions | Remaining; typed names are not verified member mentions |
| R9 | Reactions | Remaining |
| R10 | Assignment | Partial; saved editor label, not verified member assignment |
| R11 | Comment due dates | Implemented |
| R12 | Comment statuses | Implemented open/completed/rejected/reopened workflow |
| R13 | Comment filters | Partial; version/search/status/sort; explicit person/range filters remain |
| R14 | Next unresolved note | Implemented previous/next navigation |
| R15 | Read receipts | Remaining; requires reviewer identity semantics |
| R16 | Internal comments | Implemented server-side exclusion from shares |
| R17 | Before/after annotations | Remaining |
| R18 | Fullscreen comments | Partial; fullscreen player exists, persistent full-room layout needs testing |
| R19 | Picture in picture | Implemented where browser supports it |
| R20 | Subtitle tracks | Remaining |
| R21 | Audio waveform/markers | Partial; time pins exist; decoded waveform remains |
| R22 | Quality selector/auto | Dependency; alternate encoded renditions are not configured |
| R23 | Frame-rate-aware timecodes | Partial; frame stepping/export exists, source FPS detection remains |
| R24 | Slow-network quality reduction | Dependency; requires alternate renditions |

## Versions and approval

Evidence: `project_version_decisions`, uploads API, review room, release-18 metadata checks.

| ID | Improvement | Status / remaining acceptance |
|---|---|---|
| A1 | Review stages | Implemented in file details; Approved validated against latest cut |
| A2 | Multi-step approval | Remaining |
| A3 | Required reviewers | Remaining; real member identity/roles first |
| A4 | Approval deadlines/reminders | Partial; due dates exist, reminder delivery not implemented |
| A5 | Waiting-on indicator | Partial; attention queue and assignee; reviewer gates remain |
| A6 | Approval history | Implemented immutable version decisions |
| A7 | Lock approved replacement | Implemented release 18 |
| A8 | Reopen with reason | Implemented server-enforced release 18 |
| A9 | Restore older version as new | Remaining; recycle restore is a different feature |
| A10 | Version change summary | Partial; decision note exists, upload/version summary remains |
| A11 | Separate version feedback | Implemented |
| A12 | Image overlay/pixel diff | Partial; wipe compare exists, pixel diff remains |
| A13 | Linked zoom/pan | Remaining |
| A14 | Audio A/B | Partial; synced comparison is muted; explicit A/B selector remains |
| A15 | Automatic naming/stacking | Implemented version numbers and asset stacks |

## Dashboard and organization

Evidence: `workspace.js`, `workspace-organizer.js`, `/api/workspace`, `workspace_records`, integration tests.

| ID | Improvement | Status / remaining acceptance |
|---|---|---|
| W1 | Name/profile picture | Implemented |
| W2 | Attention queue | Implemented release 18; open notes ordered by deadline |
| W3 | Recent projects | Implemented browser-local order |
| W4 | Upcoming deadlines | Partial; queue and card dates; calendar view remains |
| W5 | Waiting client/editor sections | Partial; review-stage filter, not separate home sections |
| W6 | Saved views | Implemented release 18; deletion/management polish remains |
| W7 | Collections | Implemented references, not copied media |
| W8 | Custom metadata | Implemented platform/campaign/editor/date/stage/tags/custom fields |
| W9 | Metadata on cards | Partial; stage/platform/date shown; arbitrary field selection remains |
| W10 | Grid/list/table | Partial; grid/list exist; full table remains |
| W11 | Size/aspect ratio | Partial; card sizes/fit-fill; aspect-ratio selector remains |
| W12 | Bulk actions | Partial; select/move/trash/selected sharing; bulk download/archive remain |
| W13 | Undo move/delete | Partial; recycle restore exists, immediate undo toast remains |
| W14 | Recycle bin | Implemented 30-day asset restore; verify scheduled cleanup separately |
| W15 | Viewed/modified filters | Partial; newest sort/recent projects; recent-files filter remains |
| W16 | Favourite projects/folders | Implemented release 18; file favourites also saved |
| W17 | Project templates | Implemented reels/podcast/long-form/advert folders |
| W18 | Duplicate structure | Implemented owned-project folder structure only; no media copy |
| W19 | Activity feed | Implemented uploads/comments/decisions/share creation; broader audit remains |
| W20 | Simple empty states | Implemented; release 18 fixes empty-project control crash |

## Search

| ID | Improvement | Status / remaining acceptance |
|---|---|---|
| F1 | Unified search | Partial; projects/folders/files/comments/metadata; no transcript index |
| F2 | Advanced filters | Partial; type/stage/folder; uploader/date/duration/resolution remain |
| F3 | Suggestions while typing | Partial; debounced live results, no autocomplete suggestions |
| F4 | Recent searches | Remaining |
| F5 | Saved searches | Implemented release 18; management polish remains |
| F6 | Folder-scoped search | Implemented project library |
| F7 | PDF/script text search | Remaining server-side indexing |
| F8 | Voice transcript search | Dependency; transcription/indexing |
| F9 | Natural-language search | Dependency; index/provider/cost and privacy choices |
| F10 | Search preview pane | Remaining |
| F11 | Jump to comment/timecode | Partial; release 18 opens matching version/comment; transcript jump depends on index |

## Share links

Evidence: release 17 permission model plus release 18 direct-version and private-voice enforcement; in-memory SQL and local workerd tests.

| ID | Improvement | Status / remaining acceptance |
|---|---|---|
| S1 | Password links | Implemented; workerd-compatible hashing repaired in release 18 |
| S2 | Exact expiry | Implemented |
| S3 | Instant disable | Implemented for new authorization; already-issued media signatures last at most five minutes |
| S4 | Download permission | Implemented original-download action; previews are not DRM |
| S5 | Comment without approval | Implemented |
| S6 | Approval without download | Implemented |
| S7 | Previous-version permission | Implemented; release 18 closes direct-file bypass |
| S8 | Client logo/colour | Remaining |
| S9 | Folder/selected sharing | Partial; selected assets implemented; dynamic folder scope remains |
| S10 | Multiple permission sets | Implemented |
| S11 | Viewer analytics | Partial; counters/last-used exist; unique viewers/completed review remain |
| S12 | Require name/email | Partial; action name required, optional unverified email; access identity gate remains |
| S13 | Restricted email domain | Dependency; verified recipient authentication required, not a text-field check |
| S14 | Viewer watermark | Remaining after verified identity; not DRM |
| S15 | Short custom names | Partial; opaque short URLs and labels; custom URL aliases remain |
| S16 | QR code | Remaining |
| S17 | Copy confirmation/summary | Implemented |

## Uploads and performance

| ID | Improvement | Status / remaining acceptance |
|---|---|---|
| P1 | Resumable uploads | Partial; multipart session remains within page; refresh recovery remains |
| P2 | Pause/resume | Implemented between upload parts |
| P3 | Retry failed portion | Implemented bounded retry/backoff |
| P4 | Background queue | Partial; per-page queue, not a durable worker |
| P5 | Duplicate detection | Remaining |
| P6 | Folder upload structure | Remaining |
| P7 | Cloud-drive import | Dependency; provider OAuth and permission setup |
| P8 | Lightweight proxies | Dependency; media processing pipeline |
| P9 | Background thumbnails/waveforms | Partial; lazy client preview, no background rendering service |
| P10 | Processing progress | Partial; upload state exists; transcode stage depends on pipeline |
| P11 | Navigate during processing | Partial; current page usable; durable queue across route teardown remains |
| P12 | Immediate navigation feedback | Implemented shell preservation, generation guards and retry |
| P13 | Safe recent cache | Partial; in-memory routes/lazy previews; explicit bounded thumbnail cache remains |
| P14 | Virtualized large lists | Remaining |
| P15 | Slow-network mode | Partial; lazy previews; explicit mode/alternate media remains |
| P16 | Offline comment drafts | Partial; session text draft; durable sync/conflict queue remains |
| P17 | Mobile file picker | Partial; native picker works; dedicated camera flow/device tests remain |
| P18 | Upload navigation warning | Partial; browser unload warning exists; SPA route changes need durable queue/guard |

## Notifications

Evidence: account notification panel and `lib/notifications.ts`. Configured delivery is not proof of inbox arrival.

| ID | Improvement | Status / remaining acceptance |
|---|---|---|
| N1 | Notification centre | Implemented inside account/workspace |
| N2 | Unread badge | Implemented |
| N3 | Mark read/all read | Implemented |
| N4 | Digest frequencies | Partial; limited comment digest, not full hourly/daily/weekly scheduler |
| N5 | Mention/assignment-only | Remaining; member mentions required |
| N6 | Per-project controls | Remaining |
| N7 | Approval/deadline reminders | Remaining scheduling and deduplication |
| N8 | WhatsApp notifications | Dependency; approved business integration/cost/consent |
| N9 | Browser push | Dependency; push subscription/key/consent lifecycle |
| N10 | Quiet hours/timezone | Remaining |
| N11 | Exact notification deep links | Partial; project links; every event needs asset/comment mapping |
| N12 | Prevent duplicate emails | Partial; stored delivery state; retry-idempotency audit remains |

## Pricing clarity inside app only

Evidence: account/order selection, checkout and server-calculated Razorpay orders. Do not invent tax rates, new discounts or delivery guarantees. No marketing-page work is authorized.

| ID | Improvement | Status / remaining acceptance |
|---|---|---|
| B1 | Package comparison | Partial; scope/price selection exists; dedicated app comparison remains |
| B2 | Deliverable examples | Dependency; approved examples per package needed |
| B3 | Premium vs add-on | Implemented scope copy; user validation of clarity remains |
| B4 | Live extras total | Implemented with server allowlist |
| B5 | Turnaround estimator | Remaining; capacity/calendar rules required |
| B6 | Revision counter | Implemented package-linked |
| B7 | Buy another round | Implemented per asset, verified payment required |
| B8 | Explain revision round | Implemented package-aligned wording |
| B9 | Raw footage calculator | Implemented long-form bands; preserve approved rates |
| B10 | Quick delivery | Partial; option exists; actual dated capacity preview remains |
| B11 | Volume discounts | Dependency; owner-approved discount rules |
| B12 | Quotes/invoices | Partial; private payment history; downloadable legally correct invoices remain |
| B13 | Tax display | Dependency; owner tax registration/treatment must be specified |
| B14 | Standard/Premium examples | Dependency; approved sample assets |

## Premium polish

| ID | Improvement | Status / remaining acceptance |
|---|---|---|
| U1 | Consistent icons | Partial; SVG rail/player; remaining glyph cleanup |
| U2 | Tooltips | Partial; core controls have titles; complete audit remains |
| U3 | Every-click feedback | Partial; key forms/requests covered, universal audit remains |
| U4 | Fast transitions | Partial; app CSS improved, timing audit remains |
| U5 | Content-shaped skeletons | Implemented workspace opening shell |
| U6 | Restore review scroll | Partial; modal preserves underlying page, cross-route restoration remains |
| U7 | Remember view/sort | Partial; appearance persists; saved views restore sort |
| U8 | Alignment | Partial; desktop/mobile shell fixed; populated-screen regression coverage remains |
| U9 | Truncation/tooltips | Implemented file/project names; check new custom fields |
| U10 | Context menus | Partial; folder/options menus; universal right-click actions remain |
| U11 | Shortcuts panel | Implemented review controls |
| U12 | Command palette | Implemented Ctrl/Cmd K; links to global search |
| U13 | Breadcrumbs/Back | Implemented shell links/folders/modal close; release 18 empty-project fix |
| U14 | Reduced motion | Implemented system preference/motion toggle |
| U15 | Focus indicators | Partial; new dialogs/controls covered; full audit remains |
| U16 | Mobile bottom nav | Implemented |
| U17 | Touch-friendly player | Partial; native controls/responsive layout, device audit remains |
| U18 | Non-blocking toasts | Partial; organizer toasts; legacy alerts remain |
| U19 | Destructive confirmations only | Partial; core flows; legacy prompt/confirm cleanup remains |
| U20 | Empty-state illustration | Partial; concise upload action; bespoke real-project illustration remains |

## Security and operations

| ID | Improvement | Status / remaining acceptance |
|---|---|---|
| Q1 | Server permissions | Partial; ownership/share scope tested; full member-role model remains |
| Q2 | Two-factor authentication | Dependency; recovery policy and authenticator/provider integration |
| Q3 | Active devices | Implemented release 18; revoke owned sessions only, no auth hashes returned |
| Q4 | Login/action audit | Partial; active sessions and activity; immutable audit history remains |
| Q5 | Rate limiting | Partial; login/OTP/comments/voice/protected shares covered; distributed abuse audit remains |
| Q6 | Malware scanning | Dependency; scanner/quarantine/monitoring; do not label validation as scanning |
| Q7 | Retention settings | Partial; fixed recycle period; configurable policy remains |
| Q8 | Data export | Partial; release 18 JSON profile/project/folder/file metadata/comments; archive of original media remains |
| Q9 | Backups/restore test | Dependency; operational backup configuration and isolated restore rehearsal |
| Q10 | System-status page | Remaining; operational page, not marketing/conversion |
| Q11 | Monitoring | Partial; errors/retry UI; privacy-safe production monitoring not configured |
| Q12 | Request idempotency | Partial; disabled-submit/reused voice upload; durable request deduplication remains |
| Q13 | WCAG audit | Partial; specific contrast/focus tests; no WCAG conformance claim |
| Q14 | Privacy/account deletion | Remaining; retention/export/paid-order policy required |
| Q15 | Automated browser tests | Partial; SQL integration + workerd smoke + manual browser checks; automated login/upload/review/payment browser suite remains |

## Release-18 verification record

- SQL integration tests use two isolated accounts: foreign-project access, collection ownership, references without media duplication, search scope, safe export, session revocation, cross-origin writes, rate limits, version visibility and approval reopening.
- Local workerd test (`scripts/qa-local-workspace.mjs`) exercises actual multipart R2 upload, completion, private retrieval, metadata, collections, protected-share hashing and search using synthetic content only.
- Browser checks: signed-in empty project, template folder creation, collection creation, favourites, and responsive layout. Further browser evidence belongs in README as completed, not assumed.
- Build no longer erases `.wrangler` local databases/storage. Only generated output/cache directories are cleaned.
- Email inbox arrival, microphone hardware, Safari/iPhone and paid checkout were **not** certified by these tests.

## Next implementation order

1. Finish review annotation persistence, binary attachments, voice trimming/draft retention and accessible playback controls.
2. Durable upload queue/recovery and idempotent comments; folder upload and virtualized large projects.
3. Verified project members/roles, required reviewers and multi-step approvals.
4. Notification scheduler, delivery monitoring and exact event deep links.
5. Remaining organization/search controls, share branding and operational privacy/export/delete flows.
6. Provider-dependent capabilities only after configuration, cost/privacy choices and end-to-end validation.

Keep M1–M15 excluded. Do not reset credentials or change hosting/DNS to make a preview look live.
