$kafkaDir = Join-Path $PSScriptRoot "kafka_2.13-4.1.1"
$binDir = Join-Path $kafkaDir "bin\windows"
$kraftConfig = Join-Path $kafkaDir "config\kraft\server.properties"
$logDir = Join-Path $PSScriptRoot "logs"

if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

$env:JAVA_HOME = "C:\Program Files\Java\jdk-26.0.1"
$env:KAFKA_HEAP_OPTS = "-Xmx256m -Xms256m"

# Format storage for KRaft if needed
try {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "set JAVA_HOME=C:\Program Files\Java\jdk-26.0.1&& kafka-storage.bat format -t 4L622nShTUiBenA-P6x2QN -c `"$kraftConfig`" --ignore-formatted" -WorkingDirectory $binDir -Wait -WindowStyle Hidden
} catch {}

Write-Host "Starting Kafka Server on port 9092..."
Start-Process -FilePath "cmd.exe" `
              -ArgumentList "/c", "set JAVA_HOME=C:\Program Files\Java\jdk-26.0.1&& set KAFKA_HEAP_OPTS=-Xmx256m -Xms256m&& kafka-server-start.bat `"$kraftConfig`" > `"$logDir\kafka.out.log`" 2> `"$logDir\kafka.err.log`"" `
              -WorkingDirectory $binDir `
              -WindowStyle Hidden
