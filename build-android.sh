#!/usr/bin/env bash
# =============================================================
# 一键编译 Android APK 脚本（Linux / macOS / Git Bash on Windows）
# 前置依赖：Node.js 16+、Android SDK、JDK 17+、Gradle（通过 Gradle Wrapper 自动下载）
# 产出：android/app/build/outputs/apk/debug/app-debug.apk
# =============================================================
set -e

cd "$(dirname "$0")"

# 1. 检测 Node
if ! command -v node >/dev/null 2>&1; then
  echo "[错误] 未检测到 Node.js，请先安装 Node.js 16+" >&2
  exit 1
fi

# 2. 安装依赖（若 node_modules 不存在）
if [ ! -d "node_modules" ]; then
  echo "[1/5] 安装 Capacitor 依赖..."
  npm install --no-audit --no-fund --loglevel=error
fi

# 3. 若 android 工程不存在则初始化
if [ ! -d "android" ]; then
  echo "[2/5] 首次初始化 Capacitor Android 工程..."
  npx cap add android
else
  echo "[2/5] android 工程已存在，跳过初始化"
fi

# 4. 强制横屏：将 AndroidManifest 中的 orientation 设置为 userLandscape
MANIFEST="android/app/src/main/AndroidManifest.xml"
if [ -f "$MANIFEST" ]; then
  echo "[3/5] 写入 AndroidManifest 横屏配置 (screenOrientation=userLandscape)..."
  # 注意：不同 Capacitor 版本 activity 节点命名略有差异，这里做两种替换兜底
  if grep -q 'android:screenOrientation' "$MANIFEST"; then
    sed -i 's/android:screenOrientation="[^"]*"/android:screenOrientation="userLandscape"/g' "$MANIFEST"
  else
    # 用 python (3.8+) 做更可靠的 XML 属性注入
    python3 - <<'PY' 2>/dev/null || true
import sys
from pathlib import Path
p = Path("android/app/src/main/AndroidManifest.xml")
s = p.read_text(encoding="utf-8")
if 'android:screenOrientation' not in s:
    s = s.replace('android:name=".MainActivity"',
                  'android:name=".MainActivity" android:screenOrientation="userLandscape" android:configChanges="orientation|keyboard|keyboardHidden|screenSize|smallestScreenSize|screenLayout|uiMode"')
    p.write_text(s, encoding="utf-8")
    print("  [OK] 注入横屏属性成功")
PY
  fi
  # 强制 theme 全屏无标题（横屏沉浸）
  if ! grep -q 'android:theme="@style/AppTheme.NoActionBar"' "$MANIFEST"; then
    sed -i 's|android:theme="@[^"]*"|android:theme="@style/AppTheme.NoActionBar"|' "$MANIFEST" 2>/dev/null || true
  fi
fi

# 5. 同步资源
echo "[4/5] 同步 H5 资源到 Android 工程 (cap sync)..."
npx cap sync android

# 6. 构建 Debug APK
echo "[5/5] 开始 Gradle 构建 Debug APK（首次会下载 Gradle wrapper + 依赖，需要联网）..."
if [ -f "android/gradlew" ]; then
  cd android
  chmod +x gradlew
  if command -v bash >/dev/null 2>&1; then
    bash ./gradlew assembleDebug --no-daemon
  else
    ./gradlew assembleDebug --no-daemon
  fi
  cd ..
  APK="android/app/build/outputs/apk/debug/app-debug.apk"
  if [ -f "$APK" ]; then
    echo ""
    echo "================================================================"
    echo "✅ 构建成功！ APK 输出路径："
    echo "   $(pwd)/$APK"
    echo " 大小：$(du -h $APK | cut -f1)"
    echo "================================================================"
    echo "提示：使用 adb install -r $APK 即可安装到已连接的 Android 设备"
    exit 0
  else
    echo "[错误] 未找到 $APK，构建可能失败" >&2
    exit 1
  fi
else
  echo "[错误] android/gradlew 不存在，请先手动执行 npx cap add android" >&2
  exit 1
fi
