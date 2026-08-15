$frontendPath = Join-Path $PSScriptRoot "citizen-frontend"
$logDir = Join-Path $PSScriptRoot "logs"

if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

$viteJs = Join-Path $frontendPath "node_modules\vite\bin\vite.js"
$outLog = Join-Path $logDir "citizen-frontend.out.log"
$errLog = Join-Path $logDir "citizen-frontend.err.log"

Write-Host "Starting citizen-frontend Vite dev server on http://localhost:5173..."
Start-Process -FilePath "node.exe" `
              -ArgumentList "`"$viteJs`"", "--host", "0.0.0.0", "--port", "5173" `
              -WorkingDirectory $frontendPath `
              -WindowStyle Hidden `
              -RedirectStandardOutput $outLog `
              -RedirectStandardError $errLog
