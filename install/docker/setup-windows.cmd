
@echo off
setlocal EnableExtensions

REM Get script directory and repository root
set "SCRIPT_DIR=%~dp0"

for %%I in ("%SCRIPT_DIR%..\..") do set "REPO_ROOT=%%~fI"

REM Check if Docker is installed
where docker >nul 2>&1
if errorlevel 1 (
    echo Docker is required but was not found in PATH.
    exit /b 1
)

REM Check if Docker Compose is available
docker compose version >nul 2>&1
if errorlevel 1 (
    echo Docker Compose is not available.
    exit /b 1
)

echo Preparing Squid Proxy Log UI build artifacts...

REM Create dist directory
if not exist "%REPO_ROOT%\dist" (
    mkdir "%REPO_ROOT%\dist"
)

REM Copy source files
xcopy "%REPO_ROOT%\src" "%REPO_ROOT%\dist\src\" /E /I /Y >nul
if errorlevel 1 goto :error

copy /Y "%REPO_ROOT%\package.json" "%REPO_ROOT%\dist\package.json" >nul
if errorlevel 1 goto :error

xcopy "%REPO_ROOT%\public" "%REPO_ROOT%\dist\public\" /E /I /Y >nul
if errorlevel 1 goto :error

REM Docker Compose configuration
set "COMPOSE_FILE=%REPO_ROOT%\install\docker\assets\docker-compose.yml"

echo Building and starting the Squid + log UI stack...

docker compose -f "%COMPOSE_FILE%" up --build -d
if errorlevel 1 goto :error

echo.
echo Setup complete.
echo Web UI: http://localhost:3000
echo Squid proxy: http://localhost:3128
echo Logs: docker compose -f "%COMPOSE_FILE%" logs -f
echo.

REM Change to dist directory
cd /d "%REPO_ROOT%\dist"
if errorlevel 1 goto :error

REM Run Docker Compose service
docker compose -f "%COMPOSE_FILE%" run --rm squid-proxy-log-ui
if errorlevel 1 goto :error

exit /b 0

:error
echo.
echo Setup failed.
exit /b 1
