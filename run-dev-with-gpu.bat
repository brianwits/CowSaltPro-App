@echo off
echo Starting CowSalt Pro in development mode with GPU acceleration flags...

:: Set environment variables
set ELECTRON_ENABLE_LOGGING=true
set ELECTRON_ENABLE_STACK_DUMPING=true
set NODE_ENV=development

:: Start the webpack server in the background
start cmd /c "npx webpack serve --config webpack.config.js"

:: Wait for webpack server to start
echo Waiting for webpack server to start...
timeout /t 5 /nobreak

:: Run with GPU flags
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