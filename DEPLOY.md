# Publishing Content X

Your complete website code is in this folder. GitHub is your backup and change history; Cloudflare is where the live website runs.

## Normal publishing

1. Make your website changes in this folder.
2. If the change includes a new file in `drizzle/`, inspect and apply that unapplied migration to the production D1 database first. Never edit a migration that has already been applied.
3. Commit and push the changes to the `main` branch on GitHub.
4. Cloudflare automatically builds and publishes that commit to `contentx.co.in`.
5. Open `https://contentx.co.in/?version=latest` and confirm the change.

The Cloudflare project is connected to `abhinavvrai/contentx`, and `main` is the production branch. Both `contentx.co.in` and `www.contentx.co.in` use the same Worker; `www` redirects to the main domain.

## Manual fallback

If an automatic build is delayed:

1. Install Node.js 22 or newer.
2. Run `npx wrangler login` once on the computer.
3. Run `npm run deploy:cloudflare` from this folder.

Secrets stay in `.env.local` and Cloudflare Worker Secrets. They are excluded from GitHub and must never be pasted into source files or commits.

## Login and notification email setup

For Google login, OTP login, forgot-password links and notification emails, configure these as Cloudflare Worker secrets or environment variables:

- `GOOGLE_CLIENT_ID`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
- `CONTENTX_EMAIL_FROM`
- `CONTENTX_OWNER_EMAIL`

Do not expose Google client secrets, Supabase service-role keys, Resend keys, OTPs, reset links or user passwords in frontend files, screenshots, GitHub commits or docs. Passwords are stored only as hashes; owner/admin screens must use reset/revoke controls instead of showing real passwords.

## File-storage setup

The project upload service uses the private R2 bucket bound as `UPLOADS` and D1 metadata tables created by the checked-in migration.

Before the first file-storage deployment:

1. Confirm the private Cloudflare R2 bucket named `contentx` exists.
2. Add a long, random Worker secret named `CONTENTX_OWNER_TOKEN`.
3. Apply the latest D1 migrations to `contentx-payments`.
4. Deploy the Worker, open Owner workspace → Project files, and enter the owner token.

Client upload links contain a high-entropy project token. Creating a new link invalidates the previous link. Never put the owner token inside a link or frontend source.

## Client accounts

Client accounts, sessions, paid-order links, and project briefs use the same D1 database. Apply each new checked-in migration whenever these tables change. Production schema changes are migration-owned; runtime guards may verify the expected schema but must not replace the migration step.

`frame-native-17` requires `drizzle/0009_share_permissions.sql` before the application commit is deployed. This adds password, exact permission, selected-file scope and link-activity columns to existing share links without exposing any secret values.

Passwords are never encrypted and stored for later recovery. They are salted and irreversibly hashed with PBKDF2-SHA-256 at 310,000 iterations. Session cookies are HTTP-only, secure on HTTPS, and mapped to token hashes stored in D1.
