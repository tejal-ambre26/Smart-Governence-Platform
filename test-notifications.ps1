function Get-Token($u) {
    $body = @{
        client_id = 'civicpulse-frontend'
        username = $u
        password = 'Password123'
        grant_type = 'password'
    }
    $resp = Invoke-RestMethod -Uri 'http://localhost:8180/realms/civicpulse/protocol/openid-connect/token' -Method Post -Body $body
    return $resp.access_token
}

$recipients = @("citizen1@gmail.com", "socialwelfareofficer.org", "admin_user")

foreach ($r in $recipients) {
    try {
        $token = Get-Token $r
        $headers = @{ Authorization = "Bearer $token" }
        $url = "http://localhost:8080/notification-service/api/notifications/recipient/$r?username=$r"
        $res = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
        Write-Host "  [PASS] Recipient '$r' has $($res.Count) notifications!" -ForegroundColor Green
        foreach ($n in $res) {
            Write-Host "    • [$($n.eventType)] $($n.title) - $($n.message)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  [FAIL] Failed to fetch for '$r': $($_.Exception.Message)" -ForegroundColor Red
    }
}
