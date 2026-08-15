# ============================================================
#  Smart Governance Platform — Full Stack Startup Script
#  Starts: Kafka, Keycloak, all Spring Boot microservices,
#          and the citizen-frontend Vite dev server.
# ============================================================

# ── 0. Kill any processes already holding our ports ──────────
$ports = @(8761, 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8180, 9092, 9093, 5173)
foreach ($port in $ports) {
    $pids = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
             Select-Object -ExpandProperty OwningProcess -Unique)
    foreach ($p in $pids) {
        if ($p -and $p -ne 0) {
            Write-Host "Stopping process $p on port $port"
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
    }
}

# ── 1. Ensure logs directory exists ─────────────────────────
$logDir = Join-Path $PSScriptRoot "logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

$env:JAVA_HOME = "C:\Program Files\Java\jdk-26.0.1"
$mvnBin = Join-Path $PSScriptRoot ".tools\apache-maven-3.9.6\bin"
if (Test-Path $mvnBin) {
    $env:PATH = "$mvnBin;" + $env:PATH
}

# ── 2. Start Kafka ───────────────────────────────────────────
$kafkaDir = Join-Path $PSScriptRoot "kafka_2.13-4.1.1"
if (Test-Path $kafkaDir) {
    Write-Host "Starting Kafka (KRaft mode on port 9092)..."
    & (Join-Path $PSScriptRoot "start-kafka.ps1")
    Start-Sleep -Seconds 6
}

# ── 3. Start Keycloak ────────────────────────────────────────
$keycloakPath = Join-Path $PSScriptRoot "keycloak-26.6.4\bin\kc.bat"
if (Test-Path $keycloakPath) {
    Write-Host "Starting Keycloak IAM (port 8180)..."
    & (Join-Path $PSScriptRoot "start-keycloak.ps1")
    Start-Sleep -Seconds 12

    Write-Host "Verifying CivicPulse Keycloak realm..."
    try {
        & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "init-keycloak-realm.ps1")
    } catch {}
}

# ── 4. Start Spring Boot Microservices ───────────────────────
#   Order matters: eureka first, gateway second, then the rest.
$services = @(
    "eureka-server",
    "api-gateway",
    "user-service",
    "citizen-service",
    "grievance-service",
    "notification-service",
    "service-management-service",
    "welfare-service",
    "reporting-service"
)

Write-Host "Starting Spring Boot microservices..."
foreach ($svc in $services) {
    $svcPath = Join-Path $PSScriptRoot $svc
    if (Test-Path $svcPath) {
        Write-Host "  Starting $svc..."
        Start-Process -FilePath "cmd.exe" `
                      -ArgumentList "/c", "`"$PSScriptRoot\start-service.bat`" $svc" `
                      -WorkingDirectory $PSScriptRoot `
                      -WindowStyle Hidden
        Start-Sleep -Seconds 7
    }
}

# ── 5. Start Citizen Frontend (Vite dev server, port 5173) ───
$frontendPath = Join-Path $PSScriptRoot "citizen-frontend"
if (Test-Path $frontendPath) {
    & (Join-Path $PSScriptRoot "start-frontend.ps1")
}

Write-Host ""
Write-Host "=========================================================="
Write-Host "  All services started! Access points:"
Write-Host "    Frontend       -> http://localhost:5173"
Write-Host "    API Gateway    -> http://localhost:8080"
Write-Host "    Eureka Server  -> http://localhost:8761"
Write-Host "    Keycloak IAM   -> http://localhost:8180"
Write-Host ""
Write-Host "  Default Test Credentials:"
Write-Host "    Admin          : admin_user / Password123"
Write-Host "    Citizen        : citizen1@gmail.com / Password123"
Write-Host "    Officers       : john, mark, chris, ethan / Password123"
Write-Host ""
Write-Host "  Logs are in: .\logs\"
Write-Host "=========================================================="
Write-Host ""
Write-Host "Keeping process alive (Ctrl+C to stop all)..."

while ($true) {
    Start-Sleep -Seconds 10
}
