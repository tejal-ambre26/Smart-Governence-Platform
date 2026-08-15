$psql = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
$env:PGPASSWORD = "tejal"
& $psql -U postgres -h localhost -p 5432 -d postgres -c "ALTER USER postgres WITH PASSWORD 'civic@12';"

$env:PGPASSWORD = "civic@12"
$test = & $psql -U postgres -h localhost -p 5432 -d civicpulse_db -c "SELECT 1 as connected;" 2>&1
Write-Host "PostgreSQL verification with civic@12:"
Write-Host $test
