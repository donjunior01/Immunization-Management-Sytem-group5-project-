@echo off
echo Exporting PostgreSQL database...
echo.
echo Make sure PostgreSQL is running and you have the correct credentials
echo.
set /p DB_HOST="Enter database host (default: localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT="Enter database port (default: 5432): "
if "%DB_PORT%"=="" set DB_PORT=5432

set /p DB_NAME="Enter database name (default: immunizationdb): "
if "%DB_NAME%"=="" set DB_NAME=immunizationdb

set /p DB_USER="Enter database username (default: root): "
if "%DB_USER%"=="" set DB_USER=root

echo.
echo Exporting database to immunizationdb_backup.sql...
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% --no-owner --no-privileges > immunizationdb_backup.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Database exported successfully to immunizationdb_backup.sql
    echo You can now import this file to your Render PostgreSQL database
) else (
    echo.
    echo ❌ Export failed. Please check your database connection details.
)

pause