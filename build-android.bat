@echo off
REM =============================================================
REM  一键编译 Android APK（Windows .bat 批处理版）
REM  前置依赖：Node.js 16+、Android SDK、JDK 17+（通过 Gradle Wrapper 自动下载 Gradle）
REM  产出：android\app\build\outputs\apk\debug\app-debug.apk
REM =============================================================
setlocal EnableDelayedExpansion
cd /d "%~dp0"

REM 1. 检查 Node
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo [错误] 未检测到 Node.js，请先安装 Node.js 16+ 并加入 PATH
  pause
  exit /b 1
)

REM 2. 安装依赖
if not exist "node_modules" (
  echo [1/5] 安装 Capacitor 依赖（npm install）...
  call npm install --no-audit --no-fund --loglevel=error
  if %ERRORLEVEL% NEQ 0 ( echo npm install 失败 & pause & exit /b 2 )
)

REM 3. 初始化 Android 工程
if not exist "android" (
  echo [2/5] 首次初始化 Capacitor Android 工程...
  call npx cap add android
  if %ERRORLEVEL% NEQ 0 ( echo cap add android 失败 & pause & exit /b 3 )
) else (
  echo [2/5] android 工程已存在，跳过初始化
)

REM 4. 强制 AndroidManifest 横屏
set MANIFEST=android\app\src\main\AndroidManifest.xml
if exist "%MANIFEST%" (
  echo [3/5] 写入横屏配置 (screenOrientation=userLandscape)...
  REM 优先用 powershell 做文本替换（避免 sed 依赖）
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$p='%MANIFEST%'; $s=Get-Content -Raw $p -Encoding UTF8; " ^
    "if ($s -match 'android:screenOrientation=""') { " ^
    "  $s = [regex]::Replace($s, 'android:screenOrientation=""[^""]*""', 'android:screenOrientation=""userLandscape""') " ^
    "} else { " ^
    "  $s = $s -replace 'android:name=""""\\.MainActivity""""', 'android:name=""""\\.MainActivity"""" android:screenOrientation=""userLandscape"" android:configChanges=""orientation|keyboard|keyboardHidden|screenSize|smallestScreenSize|screenLayout|uiMode"""' " ^
    "} Set-Content -Path $p -Value $s -Encoding UTF8"
)

REM 5. 同步资源
echo [4/5] 同步 H5 资源到 Android 工程 (cap sync android)...
call npx cap sync android

REM 6. 构建
echo [5/5] Gradle 构建 Debug APK（首次会自动下载 Gradle wrapper，请保持联网）...
if exist "android\gradlew.bat" (
  cd android
  call gradlew.bat assembleDebug --no-daemon
  set GRC=%ERRORLEVEL%
  cd ..
  if %GRC% NEQ 0 ( echo gradlew assembleDebug 失败，退出码=%GRC% & pause & exit /b 5 )
  set APK=android\app\build\outputs\apk\debug\app-debug.apk
  if exist "%APK%" (
    echo.
    echo ================================================================
    echo   构建成功！APK 输出路径：
    echo   %cd%\%APK%
    echo ================================================================
    echo 提示：执行  adb install -r "%cd%\%APK%"  即可安装到已连接手机
  ) else (
    echo [错误] 未找到 %APK%，请检查构建输出
    pause & exit /b 6
  )
) else (
  echo [错误] android\gradlew.bat 不存在，请先删除 android 目录后重新运行本脚本
  pause & exit /b 4
)
pause
endlocal
