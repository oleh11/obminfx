#!/bin/bash
# ObminFX release build script
# Run this from the project root after npm install

set -e

echo "=== Building ObminFX release AAB ==="

# Build web assets
echo "[1/3] Building web assets..."
npm run build

# Sync to Capacitor
echo "[2/3] Syncing to Capacitor..."
npx cap sync android

# Build release AAB
echo "[3/3] Building Android release bundle..."
cd android
./gradlew bundleRelease

echo ""
echo "=== Build complete! ==="
echo "AAB: android/app/build/outputs/bundle/release/app-release.aab"
echo ""
echo "For Play Store upload, you need to sign the AAB with a keystore."
echo "If you don't have one yet, generate it with:"
echo "  keytool -genkey -v -keystore obminfx-release-key.keystore \\"
echo "    -alias obminfx -keyalg RSA -keysize 2048 -validity 10000"
echo ""
echo "Then sign with:"
echo "  jarsigner -keystore obminfx-release-key.keystore \\"
echo "    android/app/build/outputs/bundle/release/app-release.aab obminfx"
echo ""
echo "Or use Android Studio's Build > Generate Signed Bundle / APK"