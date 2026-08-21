# Content X Agent Instructions

These instructions apply to the entire repository.

## Required Reading

Before editing any file:

1. Read `PROJECT_GUIDE.md` completely.
2. Read `DEPLOY.md` before changing hosting, domains, builds, or deployment files.
3. Inspect `git status` and do not touch unrelated user changes.

## Canonical Source

- The live full website source is `public/site/`.
- `app/page.tsx` is the Cloudflare application shell that loads `/site/index.html`.
- Server APIs live in `app/api/` and shared server logic lives in `lib/`.
- Never manually edit generated output in `dist/`, `.vinext/`, `.next/`, or `.wrangler/`.
- Root-level legacy or experimental website files are not production source unless the user explicitly changes the architecture.

## Product Preservation

- Preserve the restored SaaS-era premium design and its feature set.
- Do not simplify the website or remove features without explicit user approval.
- Preserve the managed marketplace, creator tools, client workspace, review tools, support, pricing, and Razorpay flows.
- Keep support and AI tools opt-in; do not add distracting automatic popups to the public homepage.
- Keep the homepage loader fail-safe. A feature error must never leave visitors stuck on loading.

## Pricing and Payments

When changing pricing, inspect and synchronize:

- `public/site/src/creator-tools.js`
- `public/site/src/ui.js`
- `public/site/src/features.js`
- `lib/razorpay.ts`

Current base pricing is documented in `PROJECT_GUIDE.md`. Never trust a visible price until the corresponding server-calculated Razorpay amount has been checked.

Never hardcode or commit real credentials. Razorpay secrets and the OpenAI key must remain server-side.

## Data Reality

- D1 currently stores payment records.
- R2 is not connected to website uploads yet.
- Most workspace, marketplace, owner, share, comment, and upload behavior is a browser-local prototype using `localStorage`.
- Do not describe these prototype flows as secure, persistent, multi-user production features until server-side storage and authorization are implemented.

## Safe Workflow

1. Make minimal, focused source changes.
2. Use `apply_patch` for file edits.
3. Run the most specific validation first.
4. Run `npm run build` before publishing.
5. Test the actual affected UI in a browser.
6. Check the loader state and console errors.
7. Commit only files related to the user request.
8. Push to GitHub `main` and wait for Cloudflare auto-deployment.
9. Verify the real production domain after deployment.

Do not use destructive Git commands, remove deployment safeguards, edit DNS records, rotate credentials, or submit a real payment unless the user explicitly requests that exact action.

