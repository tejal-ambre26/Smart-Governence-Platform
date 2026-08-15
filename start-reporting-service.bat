@echo off
REM Start reporting-service with Gemini AI key
REM This reads GEMINI_API_KEY from Windows User environment variables

echo Starting reporting-service on port 8087 with AI Governance Intelligence...
cd /d "d:\civic plus milestone\reporting-service"
java -Xmx256m -jar "d:\civic plus milestone\reporting-service\target\reporting-service-1.0.0.jar"
