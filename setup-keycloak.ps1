$ProgressPreference = 'SilentlyContinue'
$kcZip = Join-Path $PSScriptRoot "keycloak.zip"
$kcDir = Join-Path $PSScriptRoot "keycloak-26.6.4"

if (Test-Path (Join-Path $kcDir "bin\kc.bat")) {
    Write-Host "Keycloak already present at $kcDir"
    exit 0
}

Write-Host "Downloading Keycloak..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$url = "https://github.com/keycloak/keycloak/releases/download/26.0.8/keycloak-26.0.8.zip"
Invoke-WebRequest -Uri $url -OutFile $kcZip -UseBasicParsing

Write-Host "Extracting Keycloak..."
Expand-Archive -Path $kcZip -DestinationPath $PSScriptRoot -Force
Remove-Item -Path $kcZip -Force

# Rename extracted folder if needed to keycloak-26.6.4
if (Test-Path (Join-Path $PSScriptRoot "keycloak-26.0.8")) {
    Rename-Item -Path (Join-Path $PSScriptRoot "keycloak-26.0.8") -NewName "keycloak-26.6.4" -Force
}

Write-Host "Keycloak successfully installed!"
