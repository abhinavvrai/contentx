# Publishing Content X

Your complete website code is in this folder. GitHub is your backup and change history; Cloudflare is where the live website runs.

## First-time setup

1. Install Node.js 22 or newer.
2. From this folder, run `npx wrangler login` once and approve Cloudflare's secure sign-in page.

This stores Cloudflare's secure deployment access on your computer. No Cloudflare token is committed to GitHub.

## Publish a change

1. Make your code changes locally or with Codex.
2. Run `npm run deploy:cloudflare` from this folder.
3. Open `https://contentx.co.in/?version=latest` and confirm the change.

The publishing command always makes a clean build first, then deploys it directly to your Cloudflare Worker and custom domain. This avoids the outdated Cloudflare Build cache that caused the old page to remain visible.
