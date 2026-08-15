$body = @{
    client_id = 'civicpulse-frontend'
    username = 'citizen1@gmail.com'
    password = 'Password123'
    grant_type = 'password'
}
$resp = Invoke-RestMethod -Uri 'http://localhost:8180/realms/civicpulse/protocol/openid-connect/token' -Method Post -Body $body
$token = $resp.access_token
$parts = $token.Split('.')
$rawB64 = $parts[1]
while ($rawB64.Length % 4 -ne 0) { $rawB64 += "=" }
$jsonBytes = [System.Convert]::FromBase64String($rawB64)
$json = [System.Text.Encoding]::UTF8.GetString($jsonBytes)
Write-Host "Decoded JWT Payload:"
Write-Host $json
