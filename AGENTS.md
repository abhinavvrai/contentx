# Content X Agent Instructions

These instructions apply to the entire repository.

## Required Reading

Before editing any file:

1. Read `PROJECT_GUIDE.md` completely.
2. Read `DEPLOY.md` before changing hosting, domains, builds, or deployment files.
3. Read `docs/LIGHT_MODE_GUIDE.md` before making any styling, theme, or workspace changes.
4. Inspect `git status` and do not touch unrelated user changes.

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

## Theme Architecture & Defaults

- **Default Theme**: Light Mode (`html[data-theme="light"]`) is the default theme across the entire website and client workspace.
- **Theme Switching**: Users can change their theme between Light and Dark mode in Settings (`#workspace?panel=account` -> Appearance). Both themes must be maintained with 100% visual parity and zero unstyled or low-contrast elements.
- **Color Accent**: Electric Blue (`[data-accent="blue"]` / `html:not([data-accent="orange"])`) is the canonical primary accent, with Sunset Orange preserved as an alternate.
- Consult `docs/LIGHT_MODE_GUIDE.md` for specific component selectors and design tokens.

## Workspace Dashboard Alignment

- The real client dashboard (`#workspace` / `renderClientWorkspace` in `public/site/src/workspace.js`) must remain visually and functionally identical to the demo workspace (`renderDashboard` in `public/site/src/ui.js`).
- Cards must use dual classes `.project-card.workspace-overview-card` with `.project-card-top.workspace-overview-art` containing radial poster art (`.cx-project-poster`), monogram, lock badge (`⌁`), hover arrow (`Open →`), title, client name, and status footer with `•••` action button.
- Sidebar must include the `.dash-workspace` brand header, `WORKSPACE` & `LIBRARY` grouped navigation links with count badges, storage meter with "Manage plan", and the `dash-user` profile footer.
- Default to sample projects (*Apex Fitness Launch*, *Founder Story Series*, *Product Walkthrough*) when no account projects exist.

## Design Backups

- The complete website design backup from 19 September 2026 is preserved in `backups/design-2026-09-19/`.
- Never delete or overwrite this directory. Use it as a historical reference whenever evaluating rollbacks or legacy design components.

## Pricing and Payments

When changing pricing, inspect and synchronize:

- `public/site/src/creator-tools.js`
- `public/site/src/ui.js`
- `public/site/src/features.js`
- `lib/razorpay.ts`

Current base pricing is documented in `PROJECT_GUIDE.md`. Never trust a visible price until the corresponding server-calculated Razorpay amount has been checked.

Never hardcode or commit real credentials. Razorpay secrets and the OpenAI key must remain server-side.

## Data Reality

- D1 stores accounts/sessions, payments, real upload projects, folders, share permissions, feedback, version decisions and workspace records. Private file and voice bytes use the `UPLOADS` R2 binding.
- The signed-in `workspace.js` / `review-room.js` API-backed flows are separate from legacy browser-local marketplace, provider and demo experiences. Do not use a demo screen as evidence that the real feature works.
- Server-backed does not mean the entire product is complete. Read `docs/APP_IMPROVEMENT_CHECKLIST.md` for all 186 agreed app items and their explicit gaps; public website/conversion items remain excluded.
- Never claim provider delivery, malware scanning, transcoding, full team roles or device compatibility without the corresponding implementation and verification.

## Safe Workflow

1. Make minimal, focused source changes.
2. Use precise edits (`replace_file_content` / targeted tools).
3. Run `npm run test:unit` — all 106 automated tests must pass.
4. Run `npm run build` before publishing.
5. Test the actual affected UI in both Light and Dark modes.
6. Check the loader state and console errors.
7. Commit only files related to the user request.
8. Push to GitHub `main` and wait for Cloudflare auto-deployment.
9. Verify the real production domain after deployment.

Do not use destructive Git commands, remove deployment safeguards, edit DNS records, rotate credentials, or submit a real payment unless the user explicitly requests that exact action.
