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
$env:CLOUDFLARE_ACCOUNT_ID = "5b0625a24349c5f1565eef651e2b2128"

$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
$bundledNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if ($nodeCommand) {
  $nodeExecutable = $nodeCommand.Source
}
elseif (Test-Path -LiteralPath $bundledNode) {
  $nodeExecutable = $bundledNode
}
else {
  throw "Install Node.js 22 or newer before publishing."
}

Push-Location $projectRoot
try {
  & $nodeExecutable .\node_modules\vinext\dist\cli.js build
  if ($LASTEXITCODE -eq 0) {
    & $nodeExecutable .\scripts\copy-site.mjs
  }
  if ($LASTEXITCODE -ne 0) {
    throw "The website build failed, so nothing was published."
  }

  & $nodeExecutable .\node_modules\wrangler\bin\wrangler.js deploy
  if ($LASTEXITCODE -ne 0) {
    throw "Cloudflare could not publish the website."
  }
}
finally {
  Remove-Item Env:CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue
  Remove-Item Env:CLOUDFLARE_ACCOUNT_ID -ErrorAction SilentlyContinue
  Pop-Location
}
