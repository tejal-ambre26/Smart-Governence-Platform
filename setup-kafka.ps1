$ProgressPreference = 'SilentlyContinue'
$kafkaZip = Join-Path $PSScriptRoot "kafka.tgz"
$kafkaDir = Join-Path $PSScriptRoot "kafka_2.13-4.1.1"

if (Test-Path (Join-Path $kafkaDir "bin\windows\kafka-server-start.bat")) {
    Write-Host "Kafka already present at $kafkaDir"
    exit 0
}

Write-Host "Downloading Apache Kafka..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$url = "https://archive.apache.org/dist/kafka/3.7.0/kafka_2.13-3.7.0.tgz"
Invoke-WebRequest -Uri $url -OutFile $kafkaZip -UseBasicParsing

Write-Host "Extracting Kafka..."
tar -xzf $kafkaZip -C $PSScriptRoot
Remove-Item -Path $kafkaZip -Force

if (Test-Path (Join-Path $PSScriptRoot "kafka_2.13-3.7.0")) {
    Rename-Item -Path (Join-Path $PSScriptRoot "kafka_2.13-3.7.0") -NewName "kafka_2.13-4.1.1" -Force
}

Write-Host "Kafka successfully installed!"
