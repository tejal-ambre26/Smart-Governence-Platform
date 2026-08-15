$officers = @(
    "healthofficer.org",
    "revenueofficer.org",
    "municipalofficer.org",
    "waterofficer.org",
    "roadsofficer.org",
    "electricityofficer.org",
    "socialwelfareofficer.org",
    "urbanofficer.org",
    "educationofficer.org"
)

Write-Host "=== 1. Testing NEW Department Officer Logins ==="
foreach ($u in $officers) {
    try {
        $body = @{
            client_id = 'civicpulse-frontend'
            username = $u
            password = 'Password123'
            grant_type = 'password'
        }
        $resp = Invoke-RestMethod -Uri 'http://localhost:8180/realms/civicpulse/protocol/openid-connect/token' -Method Post -Body $body
        Write-Host "  [PASS] $u -> Authenticated successfully!" -ForegroundColor Green
    } catch {
        Write-Host "  [FAIL] $u -> Login failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== 2. Verifying OLD Usernames are INVALID ==="
$oldUsers = @("john", "mark", "ryan", "chris", "ethan", "jack", "david", "will", "emily")
foreach ($old in $oldUsers) {
    try {
        $body = @{
            client_id = 'civicpulse-frontend'
            username = $old
            password = 'Password123'
            grant_type = 'password'
        }
        $resp = Invoke-RestMethod -Uri 'http://localhost:8180/realms/civicpulse/protocol/openid-connect/token' -Method Post -Body $body
        Write-Host "  [FAIL] Old user '$old' STILL EXISTS!" -ForegroundColor Red
    } catch {
        Write-Host "  [PASS] Old user '$old' is INVALID (as expected)." -ForegroundColor Green
    }
}
