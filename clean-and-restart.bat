@echo off
echo.
echo ========================================
echo   Cleaning Next.js Cache
echo ========================================
echo.

REM Remove .next directory
if exist .next (
    echo Removing .next directory...
    rmdir /s /q .next
    echo [OK] Removed .next directory
) else (
    echo [INFO] .next directory not found
)

REM Remove node_modules cache
if exist node_modules\.cache (
    echo Removing node_modules cache...
    rmdir /s /q node_modules\.cache
    echo [OK] Removed node_modules cache
)

echo.
echo ========================================
echo   Starting Development Server
echo ========================================
echo.

npm run dev
