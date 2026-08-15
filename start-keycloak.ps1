$keycloakDir = Join-Path $PSScriptRoot "keycloak-26.6.4"
$binDir = Join-Path $keycloakDir "bin"
$logDir = Join-Path $PSScriptRoot "logs"

if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

$env:KEYCLOAK_ADMIN = "admin"
$env:KEYCLOAK_ADMIN_PASSWORD = "admin"
$env:JAVA_HOME = "C:\Program Files\Java\jdk-26.0.1"

Write-Host "Starting Keycloak server on port 8180..."
Start-Process -FilePath (Join-Path $binDir "kc.bat") `
              -ArgumentList "start-dev --http-port=8180" `
              -WorkingDirectory $binDir `
              -WindowStyle Hidden `
              -RedirectStandardOutput (Join-Path $logDir "keycloak.out.log") `
              -RedirectStandardError  (Join-Path $logDir "keycloak.err.log")
