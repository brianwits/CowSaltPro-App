@echo off
echo Starting CowSalt Pro with GPU acceleration flags...

:: Set environment variables
set ELECTRON_ENABLE_LOGGING=true
set ELECTRON_ENABLE_STACK_DUMPING=true

:: Run with GPU flags using local electron
npx electron . ^
  --enable-gpu-rasterization ^
  --enable-zero-copy ^
  --ignore-gpu-blacklist ^
  --enable-webgl ^
  --enable-accelerated-video-decode ^
  --use-gl=swiftshader ^
  --disable-gpu-driver-bug-workarounds ^
  --disable-frame-rate-limit

:: If the app crashes, pause to see the error
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Application exited with error code %ERRORLEVEL%
  echo.
  pause
) 