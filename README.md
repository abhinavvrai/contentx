# Content X Website

Content X is the live website for selling content editing packages and also a free Frame-style review workspace where creators/editors can create projects, upload files, manage versions, create share links and collect client comments.

Live site:

- Public website: https://contentx.co.in/
- Direct app route: https://contentx.co.in/site/
- Owner workspace route: https://contentx.co.in/site/#owner

Current live release label:

- `no-video-placeholders-1`

Important: do not write private passwords, OTPs, API keys, Razorpay secrets, Google client secrets, access codes or owner credentials in this file. Keep secrets in the proper environment variable system only.

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

The custom domain is served through Cloudflare.

When deploying changes:

1. Run tests/build locally.
2. Push the intended commit to GitHub.
3. Deploy the built output through Cloudflare/Sites.
4. Open the live domain with a fresh cache-buster query.
5. Verify the actual user-facing page, including the `/site/` iframe route when relevant.

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
