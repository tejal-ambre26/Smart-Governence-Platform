$mvnCmd = "D:\Smart-Governence-Platform-main\.tools\apache-maven-3.9.6\bin\mvn.cmd"
$eurekaDir = "D:\Smart-Governence-Platform-main\eureka-server"
$logDir = "D:\Smart-Governence-Platform-main\logs"

$outLog = Join-Path $logDir "eureka-server.out.log"
$errLog = Join-Path $logDir "eureka-server.err.log"

$cmdLine = "call `"$mvnCmd`" spring-boot:run -Dspring-boot.run.jvmArguments=`"-Xmx192m -XX:TieredStopAtLevel=1`" > `"$outLog`" 2> `"$errLog`""

Start-Process -FilePath "cmd.exe" `
              -ArgumentList "/c", $cmdLine `
              -WorkingDirectory $eurekaDir `
              -WindowStyle Hidden

Write-Host "Launched Eureka Server via cmd.exe call."
