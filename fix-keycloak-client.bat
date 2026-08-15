@echo off
echo ============================================
echo  Fix: Enable Direct Access Grants in Keycloak
echo  for civicpulse-frontend client
echo ============================================
echo.

echo [1] Getting admin token from Keycloak...
curl -s --max-time 10 -X POST "http://localhost:8180/realms/master/protocol/openid-connect/token" ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  --data-urlencode "grant_type=password" ^
  --data-urlencode "client_id=admin-cli" ^
  --data-urlencode "username=admin" ^
  --data-urlencode "password=admin" ^
  -o "%TEMP%\kc_admin_token.json"
echo   Done.

echo.
echo [2] Extracting token using PowerShell...
for /f "delims=" %%a in ('powershell -Command "(Get-Content '%TEMP%\kc_admin_token.json' | ConvertFrom-Json).access_token"') do set ADMIN_TOKEN=%%a
echo   Token obtained: %ADMIN_TOKEN:~0,20%...

echo.
echo [3] Getting client ID (internal UUID) for civicpulse-frontend...
curl -s --max-time 10 "http://localhost:8180/admin/realms/civicpulse/clients?clientId=civicpulse-frontend" ^
  -H "Authorization: Bearer %ADMIN_TOKEN%" ^
  -o "%TEMP%\kc_client.json"

for /f "delims=" %%a in ('powershell -Command "(Get-Content '%TEMP%\kc_client.json' | ConvertFrom-Json)[0].id"') do set CLIENT_UUID=%%a
echo   Client UUID: %CLIENT_UUID%

echo.
echo [4] Enabling directAccessGrantsEnabled on the client...
curl -s --max-time 10 -X PUT "http://localhost:8180/admin/realms/civicpulse/clients/%CLIENT_UUID%" ^
  -H "Authorization: Bearer %ADMIN_TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"clientId\":\"civicpulse-frontend\",\"publicClient\":true,\"directAccessGrantsEnabled\":true,\"standardFlowEnabled\":true,\"implicitFlowEnabled\":false}"
echo   Update sent.

echo.
echo [5] Verifying the change...
curl -s --max-time 10 "http://localhost:8180/admin/realms/civicpulse/clients/%CLIENT_UUID%" ^
  -H "Authorization: Bearer %ADMIN_TOKEN%" ^
  | powershell -Command "$j = $input | ConvertFrom-Json; Write-Host ('directAccessGrantsEnabled = ' + $j.directAccessGrantsEnabled); Write-Host ('publicClient = ' + $j.publicClient)"

echo.
echo [6] Now testing login again...
curl -s --max-time 10 -X POST "http://localhost:8180/realms/civicpulse/protocol/openid-connect/token" ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  --data-urlencode "grant_type=password" ^
  --data-urlencode "client_id=civicpulse-frontend" ^
  --data-urlencode "username=citizen1@gmail.com" ^
  --data-urlencode "password=Password123"
echo.

echo.
echo ============================================
echo  Done! If step 6 shows access_token, login works.
echo ============================================
pause
