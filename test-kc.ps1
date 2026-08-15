$env:JAVA_HOME = "C:\Program Files\Java\jdk-26.0.1"
$env:KEYCLOAK_ADMIN = "admin"
$env:KEYCLOAK_ADMIN_PASSWORD = "admin"
$env:JAVA_OPTS = "-Xms64m -Xmx256m -Dnet.bytebuddy.experimental=true"

& ".\keycloak-26.6.4\bin\kc.bat" start-dev --http-port=8180
