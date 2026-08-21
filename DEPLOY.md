# Publishing Content X

Your complete website code is in this folder. GitHub is your backup and change history; Cloudflare is where the live website runs.

## Normal publishing

1. Make your website changes in this folder.
2. Commit and push the changes to the `main` branch on GitHub.
3. Cloudflare automatically builds and publishes that commit to `contentx.co.in`.
4. Open `https://contentx.co.in/?version=latest` and confirm the change.

The Cloudflare project is connected to `abhinavvrai/contentx`, and `main` is the production branch. Both `contentx.co.in` and `www.contentx.co.in` use the same Worker; `www` redirects to the main domain.

## Manual fallback

If an automatic build is delayed:

1. Install Node.js 22 or newer.
2. Run `npx wrangler login` once on the computer.
3. Run `npm run deploy:cloudflare` from this folder.

Secrets stay in `.env.local` and Cloudflare Worker Secrets. They are excluded from GitHub and must never be pasted into source files or commits.

## File-storage setup

The project upload service uses the private R2 bucket bound as `UPLOADS` and D1 metadata tables created by the checked-in migration.

Before the first file-storage deployment:

1. Create the Cloudflare R2 bucket named `contentx-uploads` if it does not already exist.
2. Add a long, random Worker secret named `CONTENTX_OWNER_TOKEN`.
3. Apply the latest D1 migrations to `contentx-payments`.
4. Deploy the Worker, open Owner workspace → Project files, and enter the owner token.

Client upload links contain a high-entropy project token. Creating a new link invalidates the previous link. Never put the owner token inside a link or frontend source.
