@echo off
set "SVC=%~1"
set "LOGDIR=%~dp0logs"
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
set "MVN=%~dp0.tools\apache-maven-3.9.6\bin\mvn.cmd"
set "JAVA_HOME=C:\Program Files\Java\jdk-26.0.1"

cd /d "%~dp0%SVC%"
call "%MVN%" spring-boot:run -Dspring-boot.run.jvmArguments="-Xmx192m -XX:TieredStopAtLevel=1" > "%LOGDIR%\%SVC%.out.log" 2> "%LOGDIR%\%SVC%.err.log"
