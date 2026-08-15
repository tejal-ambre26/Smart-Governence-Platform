# Start API Gateway (8080) and Reporting Service (8087) with standard I/O redirection
$gemKey = [System.Environment]::GetEnvironmentVariable("GEMINI_API_KEY","User")
$env:GEMINI_API_KEY = $gemKey

$gwJar = (Get-ChildItem "d:\civic plus milestone\api-gateway\target\*.jar" | Where-Object {$_.Name -notlike "*sources*"}).Name

Write-Host "Starting Reporting Service (8087)..."
Start-Process -FilePath "java" -ArgumentList "-Xmx256m", "-jar", ".\target\reporting-service-1.0.0.jar" `
              -WorkingDirectory "d:\civic plus milestone\reporting-service" `
              -RedirectStandardOutput "d:\civic plus milestone\logs\rep.out" `
              -RedirectStandardError "d:\civic plus milestone\logs\rep.err" `
              -WindowStyle Hidden

Write-Host "Starting API Gateway (8080)..."
Start-Process -FilePath "java" -ArgumentList "-Xmx256m", "-jar", ".\target\$gwJar" `
              -WorkingDirectory "d:\civic plus milestone\api-gateway" `
              -RedirectStandardOutput "d:\civic plus milestone\logs\gw.out" `
              -RedirectStandardError "d:\civic plus milestone\logs\gw.err" `
              -WindowStyle Hidden
