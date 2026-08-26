# Content X Website

Content X is the live website for selling content editing packages, collecting project briefs after verified payment, and giving clients a private workspace for uploads, file versions, review links and project communication.

Live site:

- Public website: https://contentx.co.in/
- Direct app route: https://contentx.co.in/site/
- Owner workspace route: https://contentx.co.in/site/#owner

Important: do not write private passwords, OTPs, API keys, Razorpay secrets, Google client secrets, access codes or owner credentials in this file. Keep secrets in the proper environment variable system only.

## Main Website Areas

- Public homepage and pricing
- Package checkout flow
- Client account login and dashboard
- After-payment project brief form
- Client upload workspace
- Versioned files and share links
- Owner workspace/admin dashboard
- Enquiries, payments, clients, approval queue and managed review controls
- Team roles, client/project access scopes and permission templates
- File analytics such as size, FPS, bitrate, views and download history
- Review controls for downloads, comments and image/video comment uploads

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

## Client Login

Client accounts support:

- Email and password account creation
- Email/password login
- Email OTP login when the OTP provider is configured
- Google login when Google identity is configured

Client passwords are not stored in readable text. The system uses salted password hashes and server-side sessions.

Client login is separate from owner/admin access. If a screen asks for a 10-character password, that is the client account login/create-account screen, not the owner preview access screen.

## Payment and Project Flow

The intended customer flow is:

1. Choose a package.
2. Select quantity, format and any package-specific add-ons.
3. Continue to secure payment.
4. After successful verified payment, collect the project brief.
5. Let the client upload files and references.
6. Manage files, versions, revisions and share links from the workspace.

Payment status should be verified before moving the client to the brief/upload step.

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

## File Upload and Workspace Rules

The site is designed for Frame-style file management:

- Clients upload project files after payment/brief setup.
- Re-uploading to the same file can become a new version.
- Share links can be created for review or upload access.
- Deleted files should support a recycle-bin/backup flow.
- Users should never access another client’s files without proper authentication and ownership checks.
- File details should expose useful production metadata such as resolution, FPS, bitrate, size, codec, last viewed time, view count, download count and download history.
- Owners should be able to restrict downloads, comments and high-quality image/video comment attachments per file or share link.

## Security Rules

Keep these rules in mind when changing the site:

- Never commit private passwords, access codes, secrets or API keys.
- Keep account sessions server-side.
- Keep password storage hashed, not readable.
- Verify payment ownership before opening brief/upload access.
- Keep private uploads behind authenticated/authorized routes.
- Use short-lived download links for protected files.
- Keep admin/owner features protected by server-side roles before production use.
- Keep team and file permissions enforced server-side, not only through UI switches.
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
3. Deploy the built output.
4. Open the live domain with a fresh cache-buster query.
5. Verify the actual user-facing page, including the `/site/` iframe route when relevant.

If the live site appears stale, check both:

- The outer shell route: `https://contentx.co.in/`
- The direct app route: `https://contentx.co.in/site/`

The direct app route is the best place to verify app-specific hashes such as `#owner`.
