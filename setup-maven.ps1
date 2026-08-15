$ProgressPreference = 'SilentlyContinue'
$mavenZip = Join-Path $PSScriptRoot "apache-maven.zip"
$mavenDir = Join-Path $PSScriptRoot ".tools"

if (-not (Test-Path $mavenDir)) {
    New-Item -ItemType Directory -Path $mavenDir | Out-Null
}

$mvnExe = Get-ChildItem -Path $mavenDir -Filter "mvn.cmd" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
if ($mvnExe) {
    Write-Host "Maven already present at: $($mvnExe.FullName)"
    exit 0
}

Write-Host "Downloading Apache Maven..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri "https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip" -OutFile $mavenZip -UseBasicParsing

Write-Host "Extracting Apache Maven..."
Expand-Archive -Path $mavenZip -DestinationPath $mavenDir -Force
Remove-Item -Path $mavenZip -Force

$mvnExe = Get-ChildItem -Path $mavenDir -Filter "mvn.cmd" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
Write-Host "Maven successfully installed at: $($mvnExe.FullName)"
