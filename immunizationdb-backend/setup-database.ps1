# PostgreSQL Database Setup Script
# This script will create the immunizationdb database and user

Write-Host "PostgreSQL Database Setup for Immunization Management System" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""

# PostgreSQL path
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

# Check if psql exists
if (-not (Test-Path $psqlPath)) {
    Write-Host "Error: PostgreSQL psql.exe not found at: $psqlPath" -ForegroundColor Red
    Write-Host "Please update the path in this script." -ForegroundColor Yellow
    exit 1
}

Write-Host "Please enter your PostgreSQL superuser (postgres) password when prompted." -ForegroundColor Yellow
Write-Host ""

# Run setup commands
Write-Host "Creating database and user..." -ForegroundColor Green

& $psqlPath -U postgres -c "CREATE DATABASE immunizationdb;"
if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 1) {
    Write-Host "[OK] Database created or already exists" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Failed to create database" -ForegroundColor Red
}

& $psqlPath -U postgres -c "CREATE USER root WITH PASSWORD 'root';"
if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 1) {
    Write-Host "[OK] User created or already exists" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Failed to create user" -ForegroundColor Red
}

& $psqlPath -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE immunizationdb TO root;"
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Privileges granted" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Failed to grant privileges" -ForegroundColor Red
}

& $psqlPath -U postgres -d immunizationdb -c "GRANT ALL ON SCHEMA public TO root;"
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Schema access granted" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Failed to grant schema access" -ForegroundColor Red
}

& $psqlPath -U postgres -c "ALTER DATABASE immunizationdb OWNER TO root;"
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Database ownership transferred" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Failed to transfer ownership" -ForegroundColor Red
}

Write-Host ""
Write-Host "Database setup completed!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database Details:" -ForegroundColor Yellow
Write-Host "  Host:     localhost" -ForegroundColor White
Write-Host "  Port:     5432" -ForegroundColor White
Write-Host "  Database: immunizationdb" -ForegroundColor White
Write-Host "  Username: root" -ForegroundColor White
Write-Host "  Password: root" -ForegroundColor White
Write-Host ""
Write-Host "You can now start the backend application with: .\mvnw.cmd spring-boot:run" -ForegroundColor Green
