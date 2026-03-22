#!/bin/bash

# 自动安装到应用程序文件夹脚本

APP_NAME="YesCode状态栏小工具.app"
TARGET_DIR="/Applications"
LATEST_RELEASE_DIR=$(find release -mindepth 1 -maxdepth 1 -type d | sort | tail -n 1)

if [ -z "$LATEST_RELEASE_DIR" ]; then
  echo "❌ 未找到 release 目录下的打包产物"
  echo "请先运行 npm run build"
  exit 1
fi

BUILD_DIR="$LATEST_RELEASE_DIR/mac-arm64"

echo "正在查找应用..."
echo "使用最新构建目录: $BUILD_DIR"

if [ -d "$BUILD_DIR/$APP_NAME" ]; then
  echo "找到应用: $BUILD_DIR/$APP_NAME"

  # 如果 Applications 中已存在，先删除旧版本
  if [ -d "$TARGET_DIR/$APP_NAME" ]; then
    echo "删除旧版本..."
    rm -rf "$TARGET_DIR/$APP_NAME"
  fi

  # 复制新版本到 Applications
  echo "正在复制到应用程序文件夹..."
  cp -R "$BUILD_DIR/$APP_NAME" "$TARGET_DIR/"

  if [ $? -eq 0 ]; then
    echo "✅ 安装成功！"
    echo "应用已安装到: $TARGET_DIR/$APP_NAME"
    echo "可以从启动台或应用程序文件夹启动"
  else
    echo "❌ 安装失败"
    exit 1
  fi
else
  echo "❌ 未找到打包文件: $BUILD_DIR/$APP_NAME"
  echo "请先运行 npm run build"
  exit 1
fi
