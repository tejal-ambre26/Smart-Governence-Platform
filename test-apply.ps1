$body = @{
    client_id = 'civicpulse-frontend'
    username = 'citizen1@gmail.com'
    password = 'Password123'
    grant_type = 'password'
}
$tokenResp = Invoke-RestMethod -Uri 'http://localhost:8180/realms/civicpulse/protocol/openid-connect/token' -Method Post -Body $body
$token = $tokenResp.access_token

$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

$payload = @{
    citizenId = "3e50d6a4-75cc-469f-8b37-7cf6b0ef81bf"
    serviceType = "INCOME_CERTIFICATE"
    applicantName = "citizen1 Citizen"
    aadhaarNumber = "1234-5678-9012"
    dynamicData = @{}
    documentsSubmitted = '[{"id":"Aadhaar Card","name":"aadhaar.pdf"},{"id":"Salary Slip OR Income Proof","name":"income.pdf"},{"id":"Bank Statement","name":"bank.pdf"},{"id":"Ration Card","name":"ration.pdf"}]'
} | ConvertTo-Json

$urls = @(
    "http://localhost:8085/api/services/apply",
    "http://localhost:8080/api/services/apply",
    "http://localhost:8080/service-management-service/api/services/apply"
)

foreach ($u in $urls) {
    try {
        Write-Host "Testing POST $u ..."
        $res = Invoke-RestMethod -Uri $u -Method Post -Headers $headers -Body $payload
        Write-Host "  SUCCESS! App No: $($res.applicationNumber), Status: $($res.status)" -ForegroundColor Green
    } catch {
        Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            Write-Host "  Response body: $($reader.ReadToEnd())"
        }
    }
}
