#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "Building LoL Coach for Unix ($OSTYPE)..."

OS_NAME=""
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS_NAME="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS_NAME="linux"
else
    echo "Unsupported OS: $OSTYPE"
    exit 1
fi

echo -e "\n--- Step 1: Building core ---"
cd core
if [[ "$OS_NAME" == "macos" ]]; then
    npm run build:exe:macos
else
    npm run build:exe:linux
fi
cd ..

echo -e "\n--- Step 2: Building Flutter App ---"
cd app
if [[ "$OS_NAME" == "macos" ]]; then
    flutter build macos --release
else
    flutter build linux --release
fi
cd ..

echo -e "\n--- Step 3: Packaging ---"
DIST_DIR="$(pwd)/dist"
mkdir -p "$DIST_DIR"

if [[ "$OS_NAME" == "macos" ]]; then
    # Copy core into the .app bundle
    cp core/dist/core app/build/macos/Build/Products/Release/lol_coach.app/Contents/MacOS/
    # Zip the .app
    cd app/build/macos/Build/Products/Release
    zip -r "$DIST_DIR/LoLCoach-Mac.zip" lol_coach.app
    cd -
    echo "Created $DIST_DIR/LoLCoach-Mac.zip"
elif [[ "$OS_NAME" == "linux" ]]; then
    # Copy core into the bundle directory
    # Flutter linux build outputs to app/build/linux/x64/release/bundle
    cp core/dist/core app/build/linux/x64/release/bundle/
    # Tar it
    cd app/build/linux/x64/release
    tar -czvf "$DIST_DIR/LoLCoach-Linux.tar.gz" bundle/
    cd -
    echo "Created $DIST_DIR/LoLCoach-Linux.tar.gz"
fi

