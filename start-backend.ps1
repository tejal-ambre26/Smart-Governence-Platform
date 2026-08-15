$logDir = Join-Path $PSScriptRoot "logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

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

Write-Host "All Spring Boot backend services initiated."
