@echo off
echo Testing direct login with citizen1@gmail.com...
curl -s --max-time 10 -X POST "http://localhost:8180/realms/civicpulse/protocol/openid-connect/token" ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  --data-urlencode "grant_type=password" ^
  --data-urlencode "client_id=civicpulse-frontend" ^
  --data-urlencode "username=citizen1@gmail.com" ^
  --data-urlencode "password=Password123"
echo.
echo.
echo Testing with a newly created test user (if any)...
curl -s --max-time 10 -X POST "http://localhost:8180/realms/civicpulse/protocol/openid-connect/token" ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  --data-urlencode "grant_type=password" ^
  --data-urlencode "client_id=civicpulse-frontend" ^
  --data-urlencode "username=citizen2@gmail.com" ^
  --data-urlencode "password=Password123"
echo.
echo.
echo Done!
