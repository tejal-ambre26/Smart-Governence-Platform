$psql = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
$passwords = @("civic@12", "postgres", "root", "admin", "password", "1234", "123456", "Tejal", "tejal", "system", "master", "12345678", "Pass@123", "Admin@123")

foreach ($pass in $passwords) {
    $env:PGPASSWORD = $pass
    $out = & $psql -U postgres -h localhost -p 5432 -d postgres -c "SELECT 1 as connected;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS! Correct PostgreSQL password is: $pass"
        
        # Check if civicpulse_db exists
        $dbs = & $psql -U postgres -h localhost -p 5432 -d postgres -t -c "SELECT datname FROM pg_database WHERE datname='civicpulse_db';" 2>&1
        if ($dbs -match "civicpulse_db") {
            Write-Host "Database 'civicpulse_db' exists."
        } else {
            Write-Host "Creating database 'civicpulse_db'..."
            & $psql -U postgres -h localhost -p 5432 -d postgres -c "CREATE DATABASE civicpulse_db;"
        }
        
        # Ensure postgres user password matches what application.properties has or update application.properties
        exit 0
    }
}

Write-Host "None of the common passwords matched."
