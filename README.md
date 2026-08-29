# Content X Website

Content X is the live website for selling content editing packages and also a free Frame-style review workspace where creators/editors can create projects, upload files, manage versions, create share links and collect client comments.

Live site:

- Public website: https://contentx.co.in/
- Direct app route: https://contentx.co.in/site/
- Owner workspace route: https://contentx.co.in/site/#owner

Current live release label:

- `auth-health-1`

Important: do not write private passwords, OTPs, API keys, Razorpay secrets, Google client secrets, access codes or owner credentials in this file. Keep secrets in the proper environment variable system only.

## Production Deployment — Read Before Publishing

This section is the source of truth for every future developer, assistant and deployment. Read it together with `DEPLOY.md` before changing production.

### Canonical production architecture

- GitHub repository: `abhinavvrai/contentx`.
- Production branch: `main`.
- GitHub stores the code; a push to `main` starts Cloudflare Builds.
- Cloudflare Builds runs `npm run build` and deploys with `npx wrangler deploy`.
- The production Cloudflare Worker is named `contentx`.
- Both `contentx.co.in` and `www.contentx.co.in` must resolve to that same Worker. The Worker redirects `www` to the apex domain.
- Cloudflare is the only production runtime for the custom domain. Do not attach `contentx.co.in` to the OpenAI Sites project during a normal deployment.
- OpenAI Sites metadata may remain in `.openai/hosting.json` for development/preview compatibility, but it is not the production owner of the custom domain.
- Production secrets and bindings live in Cloudflare, not GitHub and not OpenAI Sites. Environment variables do not automatically move between deployment systems.
- Production data uses the Cloudflare D1 binding `DB` and R2 binding `UPLOADS`.

Required Cloudflare variable names (values must never be written here or committed):

- `CONTENTX_EMAIL_FROM`
- `CONTENTX_OWNER_EMAIL`
- `CONTENTX_OWNER_TOKEN`
- `GOOGLE_CLIENT_ID`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `SUPABASE_ANON_KEY`
- `SUPABASE_URL`

### Safe publishing checklist

1. Confirm the intended code is committed and that the local branch can be fast-forwarded to GitHub `main`. Never overwrite newer remote work.
2. Confirm the OpenAI Sites project has no `contentx.co.in` custom-domain attachment.
3. Confirm Cloudflare Worker `contentx` still has the required variable names, D1 `DB` binding and R2 `UPLOADS` binding. Inspect names and binding targets only; never reveal, copy or replace secret values unnecessarily.
4. Confirm `wrangler.jsonc` contains the apex custom domain and the `www` route.
5. Run `npm test` and `npm run build` locally.
6. Push the intended commit to GitHub `main`. Do not publish the custom domain separately through OpenAI Sites.
7. Watch the Cloudflare build until both the build and deploy steps report success. A successful Git push alone does not prove production was updated.
8. Open both `https://contentx.co.in/` and `https://www.contentx.co.in/`. The `www` address must redirect to the apex address.
9. Verify the current release/cache-buster in the root page and the direct `/site/` route so stale static assets are not mistaken for a failed deployment.
10. Verify `GET /api/auth` returns Google, email OTP and password reset as available. Verify `GET /api/payments/razorpay/config` returns HTTP 200.

Expected authentication availability:

```json
{
  "google": { "available": true },
  "emailOtp": { "available": true },
  "passwordReset": { "available": true }
}
```

Configuration checks do not send a real email and do not charge a payment method. Actual email delivery and payment flows require separate, intentional end-to-end tests.

Useful read-only production checks in PowerShell:

```powershell
Invoke-WebRequest https://contentx.co.in/ -UseBasicParsing
Invoke-WebRequest https://contentx.co.in/api/auth -UseBasicParsing
Invoke-WebRequest https://contentx.co.in/api/payments/razorpay/config -UseBasicParsing
```

### Never do this

- Never attach the same apex domain to both OpenAI Sites and the Cloudflare Worker.
- Never assume GitHub, Cloudflare and OpenAI Sites share environment variables or secrets.
- Never use OpenAI Sites to publish `contentx.co.in` during the normal production workflow.
- Never delete MX, SPF, DKIM, DMARC, Resend, Google Workspace or verification DNS records while fixing website routing.
- Never commit secret values, paste them into documentation or expose them in frontend code.
- Never replace the complete Cloudflare variable list to change one value. Update only the intended key and preserve every existing secret and binding.
- Never declare a deployment successful until the Cloudflare build succeeds and the live release plus API-provider checks pass.
- Never point production at a preview deployment merely because the preview looks correct.

### Incident record — 29 August 2026

Symptoms:

- Recent website changes were visible in one deployment but not consistently on `contentx.co.in`.
- Google login was missing.
- Password reset was unavailable.
- The live authentication check reported Google and password reset unavailable, while email OTP had different availability.

Root cause:

- Two independent deployments were serving the product. The apex domain was attached to an OpenAI Sites Worker, while Cloudflare Worker `contentx` had the GitHub integration and the complete production variables.
- The Sites runtime did not inherit the Cloudflare Google, Resend, Supabase or payment configuration. A deployment can contain the same code and still behave differently when its runtime variables and bindings differ.
- GitHub connectivity was not the problem; the custom domain was routed to the wrong runtime.

First recovery attempt and exact error:

- After the Sites custom domain was removed and GitHub `main` was updated, the Cloudflare deployment failed with API error `100117`:
  `Hostname 'contentx.co.in' already has externally managed DNS records (A, CNAME, etc). Delete them first or try a different hostname.`
- The conflict came from two obsolete apex A records left by the former Sites attachment: `172.66.3.26` and `162.159.143.30`.
- Only those two obsolete apex A records were deleted. Email, DKIM, SPF, DMARC, Resend, Google verification and other unrelated DNS records were preserved.

Resolution:

1. Removed the `contentx.co.in` custom domain from OpenAI Sites.
2. Confirmed the Cloudflare Worker contained the required secrets and D1/R2 bindings.
3. Fast-forwarded GitHub `main` to the validated website commit.
4. Deleted only the two obsolete Sites apex A records after confirming their exact names and values.
5. Retried the Cloudflare build and confirmed a successful Worker deployment.
6. Confirmed apex HTTP 200, the `www` redirect, the current release, all three authentication-provider flags, Razorpay configuration and the local test/build suite.

Successful recovery references:

- Git commit deployed: `94a88a49374ba0db86acfc43a3990bbe31f96b55`.
- Cloudflare build: `6e7a133a-4009-4920-ad2c-c7b1038b6c52`.
- Cloudflare Worker version: `717f517f-a204-4b8d-91e5-3af8b8c0b0cd`.

### Recovery and rollback

- If a future Cloudflare build fails, keep production on the last successful Worker version. Fix the failing commit or revert GitHub `main` to a known-good commit, then allow Cloudflare Builds to deploy it.
- Cloudflare can also promote a previously successful Worker version when an urgent rollback is needed.
- If a deliberate emergency migration back to Sites is ever required, first remove the Cloudflare custom-domain ownership, then attach the domain to Sites and use the DNS targets reported by Sites at that time.
- Do not blindly restore the old A-record IP addresses from this incident. They are recorded only for diagnosis and may become stale.
- After any rollback, repeat the live domain, release, `/api/auth` and Razorpay configuration checks above.

### Authentication UI incident — 29 August 2026

Symptoms:

- Submitting the normal Create account form showed the upstream message `Invalid API key`.
- The official Google sign-in control could appear clipped, doubled or visually unstable inside the dark account card.

Root cause:

- The password registration form incorrectly called the optional Supabase email-OTP endpoint whenever email OTP was marked available. This made ordinary password registration depend on the separate Supabase credential.
- The Google Identity Services iframe was placed inside a second element styled as a complete custom button. The competing borders, backgrounds, hover transforms and early width measurement made the control appear to glitch.

Resolution and prevention:

- Password registration now always uses the `register` action and the D1-backed account system. Email-code registration is used only when the visitor explicitly chooses **Continue with email code**.
- Authentication-provider failures no longer expose raw API-key messages. If the email-code provider rejects its credential, the interface explains that email-code sign-in is temporarily unavailable and directs the visitor to password registration.
- The Google control now renders into an unstyled, fixed-height host; only Google's official button is visible. Rendering is cancelled when a tab switch removes the host, and its width is measured only after the host is connected.
- Regression tests must keep password registration independent from `request_otp`, preserve the connected-host guard and keep the release label synchronized across the shell and static app.
- `/api/auth` now performs a cached, read-only Supabase Auth health request before advertising email OTP as available. It also performs a D1 `SELECT 1` connectivity check and returns only availability booleans—never credentials.

Credential placement rule:

- Supabase, Google, Resend and Razorpay credentials belong in Cloudflare's encrypted runtime variables. Do not copy them into D1 tables, user records, browser storage or frontend JavaScript.
- D1 stores Content X account, session, project and workflow data. It is not a secret manager.
- `SUPABASE_URL` must identify the same Supabase project as `SUPABASE_ANON_KEY`. Use either that project's publishable key (`sb_publishable_...`) or its legacy `anon` key—not a key copied from another project and never a `service_role`/secret key.
- A green provider health result proves that Supabase accepts the configured project URL/key pair. End-to-end OTP delivery still requires an intentional test to a real inbox.

## Main Website Areas

- Public homepage and pricing
- Free creator/editor workspace with 50 GB storage per account
- Package checkout flow
- Login/account dashboard
- Google login, email OTP login and forgot-password recovery
- Email/in-site notification preferences with bundled comment digests
- After-payment project brief form
- Client upload workspace
- Versioned files and share links for paid and free projects
- No-login client feedback through private share links
- Owner workspace/admin dashboard
- Enquiries, payments, clients, approval queue and managed review controls
- Private client payment history and owner-only refund tracking
- Team roles, client/project access scopes and permission templates
- File analytics such as size, FPS, bitrate, views and download history
- Review controls for downloads, comments and image/video comment uploads
- Review comments with owner-controlled edit/delete permissions and editor completion ticks
- Muted autoplay preview videos on public/demo screens, without center play/pause overlays blocking the visuals
- The pre-payment workflow preview uses polished visual cards instead of fake video placeholders

## Owner/Admin Management

Use the owner workspace route:

https://contentx.co.in/site/#owner

The normal route `https://contentx.co.in/#owner` only changes the outer site shell and may not open the real app route. Use `/site/#owner` for owner access.

The owner area is meant for managing:

- Clients and workspace access
- Project/payment records
- Lead enquiries
- Talent/applicant submissions
- Review approvals
- Managed review settings
- Team/workflow views
- Upload and file management controls
- Internal company roles and permissions
- Which team members can see specific clients or projects
- Whether reviewers can comment, download or attach image/video references

Security note: the current owner gate is a preview-style gate. Before relying on it for real production operations, owner access should be upgraded to server-side role-based authentication so only approved admin accounts can access owner data.

## Company Team Controls

The owner workspace includes a team access control surface for assigning:

- Role templates such as Owner, Project Manager, Editor and Reviewer
- Client/project visibility scopes
- Permission toggles for viewing client posts, viewing files, commenting, uploading versions, downloading files, approving versions, viewing payments and managing team members

Any UI permission toggle that protects private data must also be enforced on the server before production use. Front-end toggles are useful for workflow design, but the backend must remain the source of truth.

## Login and Free Workspace

Accounts support:

- Email and password account creation
- Email/password login
- Email OTP login when the OTP provider is configured
- Google login when Google identity is configured
- Forgot-password email links when transactional email is configured

Signed-in users can open a free workspace, create projects, upload files, create private share links and collect review comments. Every account currently gets a 50 GB storage quota while the product is free.

Client/reviewer feedback can be submitted from a private share link without forcing the reviewer to create an account.

Passwords are not stored in readable text and the owner should not be able to view them. The system uses salted password hashes, hashed reset tokens and server-side sessions. Private login, OTP, email-provider and identity-provider secrets must stay on the backend or in deployment environment variables, never in frontend JavaScript or README files.

Normal login is separate from owner/admin access. If a screen asks for a 10-character password, that is the account login/create-account screen, not the owner preview access screen.

## Free Workspace Flow

The current free-workspace flow is:

1. User creates an account or signs in.
2. The backend creates a default review project if the account has no project yet.
3. User can create more projects for their own clients.
4. User uploads videos, images, audio, documents or references into the project.
5. User can upload a replacement version to keep V1, V2, V3 and final files together.
6. User creates a private share link.
7. Client opens the share link, enters their name/email if requested, and leaves feedback without login.
8. Owner/editor can mark comments as completed/resolved.

Storage:

- Free account quota: 50 GB per account.
- The quota is checked on the backend before upload.
- Owner-created project links can still use their configured project/file limits.

## Email Notifications

The account dashboard includes notification controls for:

- Email updates.
- Website/in-app notifications.
- Uploads and new versions.
- Approvals and delivery changes.
- Payments and refund status.
- Security/account changes.
- Review comments.

Comment emails default to digest mode at 9+ comments so one busy review thread does not spam the client or owner with every single note.

Email sending uses backend-only transactional email variables:

- `RESEND_API_KEY`
- `CONTENTX_EMAIL_FROM`
- `CONTENTX_OWNER_EMAIL`

The sender domain must be verified in Resend before real production email can be delivered reliably. Do not put the Resend API key in frontend JavaScript.

## Payment and Project Flow

The paid customer flow is:

1. Choose a package.
2. Select quantity, format and any package-specific add-ons.
3. Continue to secure payment.
4. After successful verified payment, collect the project brief.
5. Let the client upload files and references.
6. Manage files, versions, revisions and share links from the workspace.

Payment status should be verified before moving a paid client to the paid brief/upload step.

For now, the website can also be used free as a review workspace. Free workspace access does not require payment.

## Payment History and Refund Tracking

- Clients can see only their own payment history and refund status inside their logged-in account.
- The owner can open `Payments` in the owner workspace to view all client payments, refund queue status and recorded refund notes.
- Live finance records require the server-side owner token. Local/test checkout records can still appear in the owner preview for testing.
- Refund controls currently update Content X records: requested, processing, refunded or cancelled. Complete the real payout inside Razorpay until a separate second-confirmation Razorpay refund API is connected.
- Refunded payments remain visible for history, but they do not continue as active brief/upload projects.

## Pricing Structure

Video packages currently use:

- Basic: starts at ₹1,500
  - Clean edit, captions, stickers/emojis and light sound effects.
  - No B-roll add-on shown inside Basic.
- Standard: ₹2,000–₹2,500
  - B-roll, sound effects, custom text/typography and colour grading.
  - Motion graphics add-on can take the package to ₹2,500.
- Premium: ₹3,500–₹5,000
  - Premium edit, stronger structure, richer sound/B-roll and advanced motion options.

Add-ons should stay package-specific and appear inside the selected package so the pricing page remains simple.

Monthly minimums:

- Short-form/reels: 10 videos.
- Long-form videos: 4 videos.
- Podcast episodes: 2 episodes.

Currency behavior:

- India visitors should see INR pricing by default.
- Visitors outside India should see USD pricing by default.
- USD prices should use clean rounded numbers, not direct messy exchange-rate decimals.
- Keep server-side Razorpay/payment totals synchronized with visible pricing before accepting real payments.

## Public Video Preview Behavior

Marketing/demo videos should behave like clean previews:

- Autoplay automatically.
- Stay muted by default.
- Loop continuously.
- Use inline playback on mobile.
- Avoid visible center play/pause overlays that cover the video.

Do not remove the real review-player controls that users need for timestamped feedback, scrubbing, frame navigation, comments or approvals. The design rule is: decorative previews should be passive and clean; actual review tools should remain controllable.

## File Upload and Workspace Rules

The site is designed for Frame-style file management:

- Users can upload project files inside their free account workspace.
- Paid clients can upload project files after payment/brief setup.
- Re-uploading to the same file can become a new version.
- Share links can be created for review or upload access.
- Share-link reviewers can comment without logging in.
- Clients can provide Google Drive, Dropbox, WeTransfer or other source/reference links before uploading directly.
- Multiple source links/takes should be collected in a structured way instead of forcing everything through WhatsApp.
- Deleted files should support a recycle-bin/backup flow.
- Users should never access another client’s files without proper authentication and ownership checks.
- File details should expose useful production metadata such as resolution, FPS, bitrate, size, codec, last viewed time, view count, download count and download history.
- Owners should be able to restrict downloads, comments and high-quality image/video comment attachments per file or share link.
- Review comments should support a clear completion tick after an editor finishes the note, plus edit/delete controls that respect ownership and owner-granted permissions.

Current backend reality:

- Account projects are backed by D1 metadata.
- File bytes are stored in the private R2 `UPLOADS` bucket.
- Review comments created from project/share-link flows are stored in D1.
- Account storage quota is enforced server-side.
- Some older demo surfaces still use browser-local sample data and should not be treated as complete production collaboration until converted to the same backend model.

## Security Rules

Keep these rules in mind when changing the site:

- Never commit private passwords, access codes, secrets or API keys.
- Keep account sessions server-side.
- Keep password storage hashed, not readable.
- Never add an owner screen that reveals actual user passwords.
- Store forgot-password tokens as hashes and expire them quickly.
- Verify payment ownership before opening brief/upload access.
- Keep private uploads behind authenticated/authorized routes.
- Use short-lived download links for protected files.
- Keep admin/owner features protected by server-side roles before production use.
- Keep team and file permissions enforced server-side, not only through UI switches.
- Validate uploaded file names, types and sizes on the server.
- Enforce storage limits on the server, not only in the interface.
- Block dangerous executable/script/archive formats unless a proper scanning and sandboxing pipeline is added.
- Do not advertise antivirus/malware scanning until a real malware-scanning service is connected.
- Keep OTP and Google login configuration backend-only.
- Keep email provider API keys backend-only.
- Bundle comment emails into digests unless a user explicitly chooses instant comment email.
- Use cache-busting version labels when changing static `/site/` assets so the live site does not show stale files.

## Development

Required runtime:

- Node.js 22.13 or newer

Useful commands:

```bash
npm install
npm run dev
npm run build
npm test
```

This project uses vinext and Cloudflare-style bindings for the deployed app.

## Deployment Notes

The custom domain is served only through Cloudflare Worker `contentx`. OpenAI Sites is not part of the normal production publishing path.

When deploying changes:

1. Run tests/build locally.
2. Push the intended commit to GitHub `main`.
3. Let Cloudflare Builds build and deploy the Worker, and confirm the deployment succeeds.
4. Open the live domain with a fresh cache-buster query.
5. Verify the actual user-facing page, including the `/site/` iframe route when relevant.
6. Run the authentication-provider and Razorpay configuration checks described in the production checklist above.

If the live site appears stale, check both:

- The outer shell route: `https://contentx.co.in/`
- The direct app route: `https://contentx.co.in/site/`

The direct app route is the best place to verify app-specific hashes such as `#owner`.

Most recent deployment verification:

- Release query used: `https://contentx.co.in/?verify=no-video-placeholders-1`
- Removed fake video placeholder cards from the pre-payment workflow section.
- Replaced placeholders with polished workflow cards for review comments, version workflow and shareable links.
- Confirmed the live domain serves the updated cache-busted release.
- Confirmed old “Coming soon” / “Demo video placeholder” text is not present in the live creator-tools asset.
- Previous foundation added free account workspaces, 50 GB account quota, account-created projects, share-link comments and server-backed review comments.
- Previous foundation added server-backed notification preferences, upload/approval/comment notification events, comment email digesting and forgot-password recovery wiring.
- Confirmed live shell serves the new release label.
- Confirmed monthly podcast minimum is 2 episodes.
- Confirmed monthly long-form minimum is 4 videos.
- Confirmed review comments include editor completion, own-comment edit/delete, permission-aware delete controls, and cleaner compact comment tools.
- Confirmed the demo dashboard uses a generic greeting and removes the unclear unused action icon.
