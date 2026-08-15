$pids = (Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)
foreach ($p in $pids) {
    if ($p -and $p -ne 0) {
        Write-Host "Killing process $p on port 8080"
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Seconds 2

Write-Host "Starting API Gateway..."
Start-Process -FilePath "java" -ArgumentList "-Xmx256m", "-jar", ".\target\api-gateway-0.0.1-SNAPSHOT.jar" `
              -WorkingDirectory "d:\civic plus milestone\api-gateway" `
              -RedirectStandardOutput "d:\civic plus milestone\logs\gw.out" `
              -RedirectStandardError "d:\civic plus milestone\logs\gw.err" `
              -WindowStyle Hidden

Write-Host "API Gateway process launched."
