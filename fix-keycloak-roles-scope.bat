@echo off
echo ============================================
echo  Fix 2: Add "roles" scope to civicpulse-frontend
echo  (so CITIZEN role appears in JWT tokens)
echo ============================================
echo.

echo [1] Getting admin token...
curl -s --max-time 10 -X POST "http://localhost:8180/realms/master/protocol/openid-connect/token" ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  --data-urlencode "grant_type=password" ^
  --data-urlencode "client_id=admin-cli" ^
  --data-urlencode "username=admin" ^
  --data-urlencode "password=admin" ^
  -o "%TEMP%\kc_admin_token.json"

for /f "delims=" %%a in ('powershell -Command "(Get-Content '%TEMP%\kc_admin_token.json' | ConvertFrom-Json).access_token"') do set ADMIN_TOKEN=%%a
echo   Token obtained.

echo.
echo [2] Getting client UUID...
curl -s --max-time 10 "http://localhost:8180/admin/realms/civicpulse/clients?clientId=civicpulse-frontend" ^
  -H "Authorization: Bearer %ADMIN_TOKEN%" ^
  -o "%TEMP%\kc_client.json"

for /f "delims=" %%a in ('powershell -Command "(Get-Content '%TEMP%\kc_client.json' | ConvertFrom-Json)[0].id"') do set CLIENT_UUID=%%a
echo   Client UUID: %CLIENT_UUID%

echo.
echo [3] Getting "roles" scope ID...
curl -s --max-time 10 "http://localhost:8180/admin/realms/civicpulse/client-scopes" ^
  -H "Authorization: Bearer %ADMIN_TOKEN%" ^
  -o "%TEMP%\kc_scopes.json"

for /f "delims=" %%a in ('powershell -Command "$scopes = Get-Content '%TEMP%\kc_scopes.json' | ConvertFrom-Json; ($scopes | Where-Object { $_.name -eq 'roles' }).id"') do set ROLES_SCOPE_ID=%%a
echo   Roles scope ID: %ROLES_SCOPE_ID%

echo.
echo [4] Adding "roles" scope as default scope for civicpulse-frontend...
curl -s --max-time 10 -X PUT "http://localhost:8180/admin/realms/civicpulse/clients/%CLIENT_UUID%/default-client-scopes/%ROLES_SCOPE_ID%" ^
  -H "Authorization: Bearer %ADMIN_TOKEN%"
echo   Done.

echo.
echo [5] Testing login - should now show CITIZEN in realm_access.roles...
curl -s --max-time 10 -X POST "http://localhost:8180/realms/civicpulse/protocol/openid-connect/token" ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  --data-urlencode "grant_type=password" ^
  --data-urlencode "client_id=civicpulse-frontend" ^
  --data-urlencode "username=citizen1@gmail.com" ^
  --data-urlencode "password=Password123" ^
  -o "%TEMP%\kc_token_response.json"

powershell -Command "$t = (Get-Content '%TEMP%\kc_token_response.json' | ConvertFrom-Json).access_token; if ($t) { $payload = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($t.Split('.')[1] + '==')); $json = $payload | ConvertFrom-Json; Write-Host ('Roles in token: ' + ($json.realm_access.roles -join ', ')) } else { Write-Host 'Login failed'; Get-Content '%TEMP%\kc_token_response.json' }"

echo.
echo ============================================
echo Done!
echo ============================================
pause
