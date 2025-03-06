@echo off
echo.
echo [32m====================================================[0m
echo [32m    CowSaltPro - Starting with Improved Rendering    [0m
echo [32m====================================================[0m
echo.

echo [36mKilling any existing Node/Electron processes...[0m
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im electron.exe >nul 2>&1

echo [36mClearing cache...[0m
if exist "node_modules\.cache" (
  rmdir /s /q "node_modules\.cache"
)

echo [36mSetting optimal environment variables...[0m
set NODE_ENV=production
set FORCE_GPU_ACCELERATION=true
set DISABLE_FRAME_RATE_LIMIT=true
set ENABLE_HARDWARE_ACCELERATION=true

echo [36mBuilding application...[0m
call npm run build

echo [36mStarting application with improved rendering...[0m
echo.
start electron . --disable-http-cache --force-gpu-acceleration --ignore-gpu-blacklist --disable-gpu-vsync --no-sandbox

echo.
echo [32m====================================================[0m
echo [32m    Application started with improved rendering      [0m
echo [32m====================================================[0m

echo.
echo [33mIf the application doesn't appear, check the logs.[0m
echo [33mPress any key to exit this window...[0m
pause > nul 