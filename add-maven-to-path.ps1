$mvnBin = Join-Path $PSScriptRoot ".tools\apache-maven-3.9.6\bin"
$userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$mvnBin*") {
    $newPath = "$mvnBin;$userPath"
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "Added $mvnBin to User Path."
} else {
    Write-Host "Maven is already in User Path."
}
[System.Environment]::SetEnvironmentVariable("Path", "$mvnBin;" + [System.Environment]::GetEnvironmentVariable("Path", "Process"), "Process")
Write-Host "Updated current Process Path."
