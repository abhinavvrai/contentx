# Content X Project Guide

Last updated: 21 August 2026  
Production URL: https://contentx.co.in/  
GitHub repository: https://github.com/abhinavvrai/contentx  
Production branch: `main`  
Last verified feature checkpoint: `9b77b93`

## 1. What This Project Is

Content X is a video-production website and client-review workspace for short-form editing, scripts, podcasts, SaaS animation, managed creative services, project feedback, approvals, and payments.

The public website includes:

- The Content X landing page and portfolio.
- Short-form reel, scriptwriting, podcast, and SaaS animation pricing.
- A reel pricing calculator with monthly and one-off options.
- Creator tools such as Roman Hinglish captions, hook planning, smart review checks, and support prompts.
- A managed-services marketplace and private provider onboarding experience.
- Client workspace, project, review, version, feedback, and owner-dashboard demos.
- Razorpay checkout backed by Cloudflare APIs and a D1 payment database.
- Durable project upload spaces backed by R2, with D1 file metadata and private client links.

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
- CSS is split across `styles.css`, `advanced.css`, `creator-tools.css`, `polish.css`, `services.css`, and `uploads.css`.

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

Manual fallback instructions are in `DEPLOY.md`.

## 5. Environment Variables and Secrets

Required variable names are documented in `.env.example`:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- `CONTENTX_OWNER_TOKEN`

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
| Basic reel | ₹1,500 |
| Better Edit | ₹2,000 |
| Growth / Graphics Lite | ₹2,500 |
| Premium Motion | ₹3,500 |
| Advanced Reel | ₹5,000 |
| SaaS Animation, up to 30 seconds | ₹9,000 |

- Monthly reel production starts at 10 videos.
- One-off reel and animation work is 20% above the base rate.

### Scriptwriting

| Service | Price |
| --- | ---: |
| Hook and outline | ₹1,000 |
| Creator-ready full reel script | ₹1,500 |
| Research-led script | ₹2,000 |

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
- Reel, scriptwriting, and podcast pricing display.
- SaaS Animation displays ₹9,000.
- SaaS monthly checkout correctly shows ₹90,000 for 10 items.
- One-off reel and animation calculations apply the 20% premium.
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
- The owner file area requires the server-side `CONTENTX_OWNER_TOKEN`; client links use separate high-entropy project tokens stored only as hashes.
- Legacy workspace attachments, review-comment attachments, provider portfolios, and marketplace upload controls still store only file metadata in browser `localStorage` and are not yet connected to R2.
- Production still needs user accounts and role-based authorization before the wider workspace can be described as a fully secure multi-user collaboration system.

### Authentication and permissions

- Client, provider, and owner flows are primarily browser-side demonstrations.
- Access state and demo records are stored in `localStorage` on the current device.
- The visible owner preview code is not secure authentication.
- Production use requires server-side identity, sessions, roles, and authorization checks.

### Project and marketplace data

- Comments, projects, messages, provider listings, applications, shares, and most notifications are browser-local demo data.
- They do not yet synchronize across devices or users.
- Provider privacy is represented in the UI but must be enforced server-side before real customer use.

### Contact and notifications

- Website enquiry forms currently save demo records locally.
- They do not send email, WhatsApp, or server-side notifications.

### Caption generation

- The caption API is implemented and requires `OPENAI_API_KEY`.
- It accepts supported audio/video files up to 25 MB and sends them to the OpenAI transcription API.
- Production use still needs user authentication, rate limits, quotas, privacy disclosures, and usage monitoring.

### Payments

- Razorpay order creation, signature verification, webhook verification, and D1 records are implemented.
- A real charge should never be triggered during automated testing.
- The Razorpay dashboard webhook URL and production webhook secret must remain configured manually.
- Script and podcast prices are visible in the restored pricing summary; direct payment-entry UX should be rechecked whenever the pricing layout changes.

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
6. Confirm reels, scripts, podcasts, and SaaS pricing.
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
