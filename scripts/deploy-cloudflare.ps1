$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$environmentFile = Join-Path $projectRoot ".env.local"

if (-not (Test-Path -LiteralPath $environmentFile)) {
  throw "Create .env.local and add CLOUDFLARE_API_TOKEN before publishing."
}

$tokenLine = Get-Content -LiteralPath $environmentFile |
  Where-Object { $_ -match '^CLOUDFLARE_API_TOKEN=' } |
  Select-Object -First 1

if ([string]::IsNullOrWhiteSpace($tokenLine)) {
  throw "Add CLOUDFLARE_API_TOKEN to .env.local before publishing."
}

$env:CLOUDFLARE_API_TOKEN = $tokenLine.Substring("CLOUDFLARE_API_TOKEN=".Length).Trim()

Push-Location $projectRoot
try {
  npm run build
  if ($LASTEXITCODE -ne 0) {
    throw "The website build failed, so nothing was published."
  }

  npx wrangler deploy
  if ($LASTEXITCODE -ne 0) {
    throw "Cloudflare could not publish the website."
  }
}
finally {
  Remove-Item Env:CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue
  Pop-Location
}
