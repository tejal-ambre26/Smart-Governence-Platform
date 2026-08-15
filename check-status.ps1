$ports = @(
    @{ p = 5173; name = "Citizen Frontend" },
    @{ p = 8080; name = "API Gateway" },
    @{ p = 8761; name = "Eureka Server" },
    @{ p = 8180; name = "Keycloak IAM" },
    @{ p = 9092; name = "Kafka Event Stream" },
    @{ p = 8081; name = "User Service" },
    @{ p = 8082; name = "Citizen Service" },
    @{ p = 8083; name = "Grievance Service" },
    @{ p = 8084; name = "Notification Service" },
    @{ p = 8085; name = "Service Management" },
    @{ p = 8086; name = "Welfare Service" },
    @{ p = 8087; name = "Reporting Service" }
)

Write-Host "=== System Service Status ==="
$allListen = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue

foreach ($item in $ports) {
    $targetPort = $item.p
    $match = $allListen | Where-Object { $_.LocalPort -eq $targetPort }
    if ($match) {
        $first = $match[0]
        Write-Host "  [ONLINE]  Port $($item.p) - $($item.name) (PID $($first.OwningProcess))"
    } else {
        Write-Host "  [OFFLINE] Port $($item.p) - $($item.name)"
    }
}
