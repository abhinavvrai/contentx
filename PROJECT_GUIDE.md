# Content X Project Guide

Last updated: 28 August 2026
Production URL: https://contentx.co.in/  
GitHub repository: https://github.com/abhinavvrai/contentx  
Production branch: `main`  
Last verified feature checkpoint: `9b77b93`

## 1. What This Project Is

Content X is a video-production website and client-review workspace for short-form editing, scripts, podcasts, SaaS animation, managed creative services, project feedback, approvals, and payments.

The public website includes:

- The Content X landing page and portfolio.
- A unified Video/Podcast pricing builder with monthly and per-project options.
- Five short-form editing tiers plus service-specific scripts, covers, revisions, clips, and delivery add-ons.
- Creator tools such as Roman Hinglish captions, hook planning, smart review checks, and support prompts.
- A managed-services marketplace and private provider onboarding experience.
- Client workspace, project, review, version, feedback, and owner-dashboard demos.
- Razorpay checkout backed by Cloudflare APIs and a D1 payment database.
- Durable project upload spaces backed by R2, with D1 file metadata and private client links.
- D1-backed client accounts, secure sessions, paid-order history, and post-payment project briefs.
- Owner-only finance tracking with refund status controls for incomplete paid orders.
- Server-backed notification preferences, transactional email hooks, forgot-password links and bundled review-comment digests.

## 2. Production Architecture

The project has two connected application layers.

### Cloudflare application shell

- `app/page.tsx` renders the full website inside an iframe at `/site/index.html`.
- `app/api/` contains server-side caption and Razorpay endpoints.
- `worker/index.ts` is the Cloudflare Worker entry point and redirects `www.contentx.co.in` to `contentx.co.in`.
- `wrangler.jsonc` defines the Worker routes, static assets, D1, and private R2 upload binding.

### Full website experience

The canonical website source is `public/site/`.

- `public/site/index.html` loads the website styles and JavaScript.
- `public/site/src/main.js` controls routes and enables feature modules.
- `public/site/src/ui.js` contains the base landing page and workspace UI.
- `public/site/src/features.js` contains pricing, checkout, client workspace, and owner features.
- `public/site/src/creator-tools.js` contains creator tools and the restored SaaS-era pricing experience.
- `public/site/src/marketplace.js` contains managed-service and provider flows.
- `public/site/src/advanced.js` contains advanced project and review interactions.
- `public/site/src/polish.js` contains UI polish and accessibility behavior.
- `public/site/src/uploads.js` contains client project uploads and owner file management.
- `public/site/src/cinematic.js` and `cinematic.css` add homepage-only, Frame.io-inspired visual depth using original CSS geometry and existing Content X footage. The optional module adds a pointer-reactive hero, a scroll-led workflow illustration, and entrance reveals; it does not change account or payment behavior. Motion can be paused, respects reduced-motion preferences, and uses a static mobile layout. Observers, listeners, and video playback are cleaned up on route changes. These local changes are not yet production-verified.
- `public/site/src/noir.css` is the final shared design layer: permanent near-black surfaces, warm copper accents, accessible primary/button text colors, and consistent form, workspace, review, owner and provider styling. The HTML starts with `data-theme="dark"`; theme toggle controls and legacy preference reads are removed. Review comments, version workflow and shareable-link marketing cards use original layered CSS illustrations and existing local footage. Local preview release: `noir-studio-1` (not yet production-verified).
- `public/site/src/studio-workspace.js`, `studio-workspace.css`, and `review-room.js` extend that dark palette into the product. The demo dashboard has original CSS project artwork, project search/status filtering, grid/list layouts and a next-review shortcut. Real account/shared workspaces have file search/type/sort/open-feedback/version-stack filters, record-derived metrics, and a native-dialog review room with media preview, version selection, side-by-side synchronized video/audio comparison, timestamped version-scoped comments, manager-only complete/reopen, and text export of review notes. Comments use the existing authorized D1 API, not browser storage. Private media supports single HTTP byte ranges for seeking; `lib/media-range.ts` validates ranges. Comment writes validate file/asset ownership within the authorized project. Native preview depends on browser codec support; unsupported formats retain original-file downloads. This is not adaptive transcoding, frame-accurate playback, real-time presence or a final-approval system. Current local release: `review-studio-1`; not yet production-verified or visually browser-tested.
- `public/site/src/frame-workspace.css` is the compact product-density layer derived from the 30 August 2026 read-only Frame.io audit in `docs/FRAME_IO_FEATURE_INVENTORY.md`. It adds an original Content X global rail, contextual project directory and project search, compact sticky toolbar, lower-copy status surfaces, denser asset cards, 100–180 ms interaction transitions, and reduced-motion fallbacks. Successful sign-in returns to the real workspace instead of pausing on an onboarding page. Account, notification, order and payment functionality now lives in the same workspace shell under Profile / Notifications / Orders & billing instead of opening a second dashboard. Share creation returns opaque `/s/<token>` URLs while preserving token hashing, expiry, revocation and upload permissions. The `frame-contrast-1` pass fixes dark-theme search fields and muted project/review text, removes duplicate project toolbar actions, and keeps destructive comment controls hidden until the comment is engaged. The `frame-flow-1` pass preserves the workspace shell during project changes, replaces the disruptive spinner with an aligned first-load skeleton, ignores stale route responses, and brings project/review controls onto consistent responsive gutters. The `frame-unified-1` pass merges account and dashboard navigation into one persistent workspace page. The `frame-native-1` pass replaces sample-dashboard marketing blocks with a production-tool layout, adds an original SVG icon system, media-led project cards, compact search/filter/list controls, and a persistent split review viewer with Comments and Details tabs. The `frame-native-2` pass adds durable nested project folders, a compact folder tree and breadcrumbs, folder cards, and authenticated drag-and-drop movement for assets and folders with cycle prevention. The `frame-native-3` pass fixes password-reset and notification-test event lifetimes by retaining stable element references across asynchronous requests. The `frame-native-4` pass makes password registration atomic and gives all account requests a 20-second recovery timeout so account creation cannot remain indefinitely pending. The `frame-native-5` pass adds owner-verified project deletion with typed confirmation, R2 cleanup, related-record cleanup, and preserved payment history. The `frame-native-6` pass adds compact project settings, client-detail editing, archive/reactivate controls, folder renaming, and safe folder removal that reparents media instead of deleting it. The `frame-native-7` pass makes the signed-in landing screen use the same project-dashboard language as the signed-out preview, adds persistent appearance and field controls, richer folder previews and menus, top-level search, and live share-link navigation. The `frame-native-8` pass corrects a signed-in layout collision caused by a legacy two-column rule, locks the desktop shell to one compact rail, one focused project sidebar and one flexible content canvas, removes repeated project/upload controls, and replaces the oversized empty-project interface with one clear upload action. The `frame-native-9` pass adds a Ctrl/Cmd+K command menu for projects and common actions, `/` search focus, device-local recent-project ordering, an unresolved-feedback attention cue, and an open-first comment queue with Open/All filters. Current release: `frame-native-13`.
- CSS is split across `styles.css`, `advanced.css`, `creator-tools.css`, `polish.css`, `services.css`, and `uploads.css`.
- `ember.css` restores the vivid orange-to-amber brand gradient while retaining black surfaces and dark, contrast-checked primary-button text. The optional `ambient-scenes.js` adds original CSS signal bars, floating edit planes and light ribbons in spare creator-tools, FAQ, contact, marketplace, provider and sign-in columns, plus restrained movement on existing dashboard art. Its observers pause offscreen/background motion, respect reduced-motion settings and clean up on navigation. A shared in-memory pause preference follows the user between the homepage and secondary pages. No extra animations are added to media players or payment forms. Current local appearance release: `ember-flow-1`; not published or visually browser-verified.

Do not treat the root-level `index.html`, `src/`, `videos/`, `vendor/`, or temporary folders as the live website unless the architecture is intentionally changed. The production website currently comes from `public/site/`.

## 3. Generated Files

Do not manually edit these folders:

- `dist/`
- `.vinext/`
- `.next/`
- `.wrangler/`

`npm run build` regenerates the production output. `scripts/copy-site.mjs` copies `public/site/` into both `dist/client/site` and `dist/client/site-v2`. The duplicate asset path is intentional deployment protection and should not be removed casually.

## 4. Hosting and Publishing

The live website is hosted by the Cloudflare Worker named `contentx`, not by R2 and not directly by GitHub Pages.

Normal publishing flow:

1. Edit the source files in this repository.
2. Run `npm run build`.
3. Commit only the intended files.
4. Push the commit to GitHub `main`.
5. Cloudflare automatically builds and deploys that commit.
6. Verify the real domain in a browser after the Cloudflare build completes.

Cloudflare configuration:

- `contentx.co.in` is the Worker custom domain.
- `www.contentx.co.in/*` redirects permanently to the root domain.
- Static assets are served from `dist/client` through the `ASSETS` binding.
- Payment records use the D1 binding `DB`, connected to `contentx-payments`.
- Refund status is stored with payment records in D1 and should be treated as private payment data.

Manual fallback instructions are in `DEPLOY.md`.

## 5. Environment Variables and Secrets

Required variable names are documented in `.env.example`:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- `CONTENTX_OWNER_TOKEN`
- `GOOGLE_CLIENT_ID`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
- `CONTENTX_EMAIL_FROM`
- `CONTENTX_OWNER_EMAIL`

Rules:

- Keep local values in `.env.local`.
- Keep production values in Cloudflare Worker Secrets.
- Never commit real keys, secrets, webhook secrets, customer data, or payment data.
- Only the Razorpay key ID may be returned to the browser. The key secret must stay server-side.

## 6. Current Pricing

Pricing appears in more than one source file. When pricing changes, update every relevant location and verify the checkout amount.

### Reels and animation

| Service | Base price |
| --- | ---: |
| Captions Only | ₹1,500 |
| Clean Edit | ₹2,000 |
| Social Pro | ₹2,500 |
| Motion Plus | ₹3,500 |
| Signature Edit | ₹5,000 |
| SaaS Animation, up to 30 seconds | ₹9,000 |

- Monthly reel production starts at 10 videos.
- Monthly long-form production starts at 4 videos.
- Monthly podcast production starts at 2 episodes.
- Video and podcast package totals use the displayed base rate; there is no hidden one-off premium.

### Add-ons

| Service | Price per item |
| --- | ---: |
| Instagram Reel Script | ₹500 |
| Cover / Thumbnail | ₹500 |
| Extra Revision Round | ₹300 |
| Priority Delivery | ₹1,000 |
| Podcast Episode Script | ₹1,500 |
| Podcast Show Notes & Chapters | ₹500 |
| Two Podcast Social Clips | ₹1,500 |
| Podcast Episode Cover | ₹500 |

### Podcast editing

| Service | Displayed starting price |
| --- | ---: |
| Up to 30 minutes | From ₹5,000 |
| Approximately 45–60 minutes | From ₹7,000 |
| More than 60 minutes | Custom scope |

Exact backend service entries currently include ₹5,000 for 30 minutes, ₹7,500 for 45 minutes, and ₹10,000 for 60 minutes.

Pricing sources that must remain synchronized:

- `public/site/src/creator-tools.js`
- `public/site/src/ui.js`
- `public/site/src/features.js`
- `lib/razorpay.ts`

## 7. Confirmed Working

The following were verified on the production domain after commit `9b77b93`:

- Homepage loads and the preloader becomes hidden.
- SaaS-era navigation and premium landing-page design are active.
- Managed marketplace section and marketplace route load.
- Creator tools section loads.
- Video and podcast pricing display with the five requested short-form tiers.
- SaaS Animation displays ₹9,000.
- SaaS monthly checkout correctly shows ₹90,000 for 10 items.
- Visible package prices and Razorpay base totals match without a hidden one-off premium.
- Browser console shows no website errors during the verified flows.
- Razorpay config, order, signature verification, and webhook endpoints exist.
- Razorpay orders and verification state use the D1 payment database.
- GitHub `main` automatically deploys through Cloudflare.
- Root and `www` domains route through the same Worker.

## 8. Partial, Demo, or Not Production-Ready

These areas look functional in the interface but are not yet complete production systems:

### File storage

- The dedicated project-upload portal stores file bytes in the private `UPLOADS` R2 bucket and searchable metadata in D1.
- Owner-created client links support chunked uploads up to 50 GB per file and 250 GB per project, project file listings, protected downloads, link rotation, upload pausing, and permanent removal.
- Server-backed uploads allowlist business-needed formats only: video, audio, image, PDF, text, CSV, SRT, and VTT. Executables, scripts, HTML/SVG, archives, installers, and dangerous filenames are blocked before storage; first upload chunks are checked for common file signatures.
- Paid clients can submit a D1-backed project brief and receive a session-authorized R2 upload space without handling a separate project token.
- The owner file area requires the server-side `CONTENTX_OWNER_TOKEN`; client links use separate high-entropy project tokens stored only as hashes.
- Legacy workspace attachments, review-comment attachments, provider portfolios, and marketplace upload controls still store only file metadata in browser `localStorage` and are not yet connected to R2.
- The wider marketplace, provider, review, and owner workspace still needs complete role-based authorization before it can be described as a fully secure multi-user collaboration system.
- The upload service does not yet run a dedicated antivirus or sandbox scan. Add a private malware-scanning service before accepting higher-risk document/archive formats or advertising malware scanning.

### Authentication and permissions

- Client sign-up, sign-in, paid-order ownership, project briefs, and upload authorization are server-side and stored in D1.
- Passwords are salted and hashed with PBKDF2-SHA-256 at 100,000 iterations; plaintext passwords are never stored.
- Session tokens are random, stored only as SHA-256 hashes in D1, and sent through secure HTTP-only SameSite cookies.
- Repeated failed logins are rate-limited and temporarily blocked.
- The account screen defaults signed-in users into the workspace/account area and offers Google, email OTP, or password access. OTP requests are rate-limited through the server.
- Forgot-password recovery uses short-lived email links and stores only hashed reset tokens in D1. Owners must not be given a plaintext password viewer.
- Provider, marketplace, review-demo, and visible owner-preview permissions still include browser-local demonstration behavior and need role-based server authorization before being treated as production multi-user collaboration.

### Project and marketplace data

- Comments, projects, messages, provider listings, applications, shares, and most notifications are browser-local demo data.
- They do not yet synchronize across devices or users.
- Provider privacy is represented in the UI but must be enforced server-side before real customer use.

### Contact and notifications

- Website enquiry forms currently save demo records locally.
- Logged-in account notification preferences and recent in-app notifications are server-backed.
- Upload completion, review comments, approvals, delivery/version events, payments and security-style events can queue/send transactional email when `RESEND_API_KEY`, `CONTENTX_EMAIL_FROM` and `CONTENTX_OWNER_EMAIL` are configured.
- Review comment email defaults to digest mode at 9+ comments to avoid noisy one-email-per-comment behavior.
- Website enquiry/contact forms still need a complete server-side email workflow if they should notify the team automatically.

### Caption generation

- The caption API is implemented and requires `OPENAI_API_KEY`.
- It accepts supported audio/video files up to 25 MB and sends them to the OpenAI transcription API.
- Production use still needs user authentication, rate limits, quotas, privacy disclosures, and usage monitoring.

### Payments

- Razorpay order creation, signature verification, webhook verification, and D1 records are implemented.
- A real charge should never be triggered during automated testing.
- The Razorpay dashboard webhook URL and production webhook secret must remain configured manually.
- Package and allowlisted add-on totals are recalculated by the server before Razorpay creates an order.
- Detailed titles, descriptions, creative instructions, and reference links are collected after verified payment, then connected to the client's private upload project.
- Clients see only their own payment history and refund status after login.
- Owner finance controls can record refund states for incomplete orders: none, requested, processing, refunded, or cancelled.
- Refund controls update Content X records only. Actual money movement should be completed inside Razorpay until a separate backend Razorpay refund endpoint with second owner confirmation is added.
- Refunded payments are blocked from starting or continuing the post-payment brief/upload flow.

## 9. Critical Editing Rules

1. Read this file and `AGENTS.md` before changing code.
2. Preserve the current SaaS-era design and feature set unless the user explicitly requests removal.
3. Do not replace the full website with a simplified landing page.
4. Do not remove marketplace, creator tools, client review, support, pricing, or payment features as an unrelated cleanup.
5. Edit `public/site/`, not generated copies in `dist/`.
6. Keep the iframe shell in `app/page.tsx` unless a deliberate migration is planned and tested.
7. Keep the loader fail-safe in `public/site/src/main.js`; noncritical feature errors must never leave the website stuck on loading.
8. Bump the query-string version in `public/site/index.html` or module imports when changing cache-sensitive static JavaScript or CSS.
9. Keep all pricing sources and Razorpay calculations synchronized.
10. Never expose secrets to frontend code.
11. Do not modify unrelated dirty or untracked files.
12. Never use destructive Git recovery such as `git reset --hard` to solve a deployment issue.

## 10. Verification Checklist

Before publishing:

1. Run `npm run build`.
2. Confirm `dist/client/site` contains the updated source.
3. Check `git diff --check`.
4. Test the homepage and confirm the loader becomes hidden.
5. Confirm the browser console has no errors.
6. Confirm the Video/Podcast toggle, five video tiers, service-specific script add-ons, podcast tiers, and SaaS managed-service card.
7. Test checkout selection without submitting a real payment.
8. Test any route changed by the work.

After pushing:

1. Wait for the Cloudflare Git build to finish.
2. Open `https://contentx.co.in/?release=<commit>`.
3. Verify the live DOM and browser console.
4. Confirm `https://www.contentx.co.in/` redirects to the root domain.
5. Do not consider a task finished only because Cloudflare shows a green build tick.

## 11. Recovery and History

Useful known checkpoints:

- `9b77b93` — restored SaaS-era features and pricing.
- `9f49e27` — fixed the homepage loading state.
- `cf12e64` — kept the full Content X site as the homepage.
- `c3f7c36` — original SaaS-era feature checkpoint with Razorpay checkout.

Use targeted Git diffs or a normal revert when recovering behavior. Preserve later hosting, security, database, and payment fixes rather than rolling the entire repository backward.

## 12. When This Guide Must Be Updated

Update this guide whenever any of these change:

- Hosting provider, domain routes, or production branch.
- Main source directory or build process.
- Pricing or Razorpay calculation rules.
- Cloudflare bindings, D1 schema, or R2 integration.
- Authentication model.
- A listed limitation becomes fully implemented.
- A major feature is added, removed, or renamed.

## 13. Current Profile Release

`frame-native-10` adds persistent display name, optional mobile/company/role fields, private R2-backed JPG/PNG/WebP profile photos with signature and size validation, profile completion cues, and name/photo propagation through the workspace. Mobile is contact data only until a verified SMS provider is configured; Google, email-code and password sign-in are preserved.

## 14. Navigation and Password-Reset Reliability

`frame-native-11` fixes the 5–6 second dead-click symptom caused by synchronously checking Supabase health during every account session read. `/api/auth` now returns configured provider availability immediately; the real OTP request still validates Supabase and returns a safe error when unavailable. D1 account, upload, payment and notification schema guards use one read-only sentinel batch on a normal deployment, then run the complete idempotent bootstrap only if a required table or column is absent. Client route renders are generation-guarded, repeated same-route actions explicitly refresh, and a non-blocking two-pixel progress line gives immediate feedback.

Forgot-password requests remain account-enumeration safe: the browser receives the same response for known and unknown addresses. Resend calls have an 8-second timeout and failures are logged only on the server. The success panel says the request is queued, explains that mailbox delivery may take up to 10 minutes, and enables resend after the server's existing 60-second cooldown. Never change the response to reveal whether an email address is registered.

## 15. Fast Controls and Private Hover Preview

`frame-native-12` standardizes short pointer, keyboard-focus and pressed-state feedback across the signed-in workspace. Video asset cards request their existing authenticated five-minute media URL only when a mouse/pen hover or keyboard focus expresses preview intent. The muted, looping inline video is created at that point, never before; touch continues to open the review room directly, and reduced-motion users receive a still preview frame instead of autoplay. Never expose the R2 object key, share token or signed media URL in static card markup or browser storage.

## 16. Multi-format Review and Voice Feedback

Current release: `frame-native-13`.

`frame-native-13` keeps Home, Projects, Review, Search and Account navigation wired on every product screen, including the project viewer and review viewer. Marketing loads only the small hero preview eagerly; lower-page videos wake near the viewport and fade over a designed fallback. Review playback supports click/Space pause and resume, premium SVG controls, full screen and a clearer back path.

The secure review room accepts video, audio, images, PDFs and safe text/script formats. Text selection can be quoted into feedback; PDF feedback stores a page-number prefix. Voice notes are microphone-permission based, capped at 60 seconds and 1.25 MB, stored in the private project R2 bucket, referenced from D1 comments and delivered only through an authorized five-minute link. Project deletion must remove those voice objects and database rows. Never put raw object keys or permanent audio URLs in comment payloads.
