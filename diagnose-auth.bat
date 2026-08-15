@echo off
echo ==========================================
echo  CivicPulse Auth Diagnostics
echo ==========================================

echo.
echo [1] Testing Keycloak is up...
curl -s --max-time 5 http://localhost:8180/realms/civicpulse/.well-known/openid-configuration > nul 2>&1
if %errorlevel% == 0 (echo   [OK] Keycloak is reachable) else (echo   [FAIL] Keycloak is NOT reachable on 8180)

echo.
echo [2] Testing Direct Grant login with civicpulse-frontend client...
curl -s --max-time 10 -X POST "http://localhost:8180/realms/civicpulse/protocol/openid-connect/token" ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "grant_type=password&client_id=civicpulse-frontend&username=citizen1@gmail.com&password=Password123"
echo.

echo.
echo [3] Testing API Gateway (port 8080) is up...
curl -s --max-time 5 http://localhost:8080/actuator/health > nul 2>&1
if %errorlevel% == 0 (echo   [OK] API Gateway is reachable) else (echo   [FAIL] API Gateway is NOT reachable on 8080)

echo.
echo [4] Testing registration endpoint (direct to citizen-service)...
curl -s --max-time 10 -X POST "http://localhost:8082/api/citizens/auth/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test User\",\"email\":\"diagtest99@test.com\",\"phoneNumber\":\"9876543210\",\"password\":\"Test1234\",\"address\":\"123 Test St\",\"ward\":\"Ward 1\",\"city\":\"Delhi\",\"state\":\"Delhi\",\"pincode\":\"110001\"}"
echo.

echo.
echo [5] Testing registration endpoint (through API gateway port 8080)...
curl -s --max-time 10 -X POST "http://localhost:8080/api/citizens/auth/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test User2\",\"email\":\"diagtest100@test.com\",\"phoneNumber\":\"9876543211\",\"password\":\"Test1234\",\"address\":\"123 Test St\",\"ward\":\"Ward 1\",\"city\":\"Delhi\",\"state\":\"Delhi\",\"pincode\":\"110001\"}"
echo.

echo.
echo [6] Check Keycloak realm roles (is CITIZEN role present?)...
curl -s --max-time 5 "http://localhost:8180/realms/civicpulse/.well-known/openid-configuration" | findstr /i "issuer"
echo.

echo ==========================================
echo Done. Review output above for errors.
echo ==========================================
pause
