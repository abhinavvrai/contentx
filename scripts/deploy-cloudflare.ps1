$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$deploymentRoot = Split-Path -Parent $projectRoot
$deploymentConfig = Join-Path $projectRoot "dist\server\wrangler.json"
$wranglerExecutable = Join-Path $projectRoot "node_modules\wrangler\bin\wrangler.js"

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

}
finally {
  Pop-Location
}

Push-Location $deploymentRoot
try {
  Remove-Item Env:CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue
  & $nodeExecutable $wranglerExecutable deploy --config $deploymentConfig
  if ($LASTEXITCODE -ne 0) {
    throw "Cloudflare could not publish the website."
  }
}
finally {
  Pop-Location
}
