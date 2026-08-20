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
