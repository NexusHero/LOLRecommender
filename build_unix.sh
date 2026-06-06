#!/bin/bash
set -e

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

echo -e "\n--- Step 1: Building Bridge ---"
cd bridge
if [[ "$OS_NAME" == "macos" ]]; then
    npm run build:exe:macos
else
    npm run build:exe:linux
fi
cd ..

echo -e "\n--- Step 2: Building Flutter App ---"
cd flutter_app
if [[ "$OS_NAME" == "macos" ]]; then
    flutter build macos --release
else
    flutter build linux --release
fi
cd ..

echo -e "\n--- Step 3: Packaging ---"
mkdir -p dist

if [[ "$OS_NAME" == "macos" ]]; then
    # Copy bridge into the .app bundle
    cp bridge/dist/bridge flutter_app/build/macos/Build/Products/Release/lol_coach.app/Contents/MacOS/
    # Zip the .app
    cd flutter_app/build/macos/Build/Products/Release
    zip -r ../../../../../../dist/LoLCoach-Mac.zip lol_coach.app
    cd ../../../../../../
    echo "Created dist/LoLCoach-Mac.zip"
elif [[ "$OS_NAME" == "linux" ]]; then
    # Copy bridge into the bundle directory
    # Flutter linux build outputs to flutter_app/build/linux/x64/release/bundle
    cp bridge/dist/bridge flutter_app/build/linux/x64/release/bundle/
    # Tar it
    cd flutter_app/build/linux/x64/release
    tar -czvf ../../../../../dist/LoLCoach-Linux.tar.gz bundle/
    cd ../../../../../
    echo "Created dist/LoLCoach-Linux.tar.gz"
fi
