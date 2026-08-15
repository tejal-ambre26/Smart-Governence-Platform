[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Java\jdk-26.0.1', 'User')
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Java\jdk-26.0.1', 'Process')
Write-Host "JAVA_HOME set to: $([System.Environment]::GetEnvironmentVariable('JAVA_HOME', 'Process'))"
