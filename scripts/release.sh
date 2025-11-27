#!/bin/bash

# リリーススクリプト
# 変更をpushしてタグを打ってリリースするまでの一連の操作を実行します

set -e

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 リリースプロセスを開始します${NC}"

# 1. 変更があるか確認
if [ -z "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}⚠️  変更がありません${NC}"
  exit 0
fi

# 2. 変更をステージング
echo -e "${GREEN}📦 変更をステージング中...${NC}"
git add .

# 3. コミットメッセージの入力
if [ -n "$1" ]; then
  # 引数でコミットメッセージが指定されている場合
  COMMIT_MESSAGE="$1"
else
  # 対話的に入力
  echo -e "${GREEN}💬 コミットメッセージを入力してください:${NC}"
  read -r COMMIT_MESSAGE
fi

if [ -z "$COMMIT_MESSAGE" ]; then
  echo -e "${RED}❌ コミットメッセージが空です${NC}"
  exit 1
fi

# 4. コミット
echo -e "${GREEN}💾 コミット中...${NC}"
git commit -m "$COMMIT_MESSAGE"

# 5. バージョンを取得（coreとreactの両方から）
if command -v jq &> /dev/null; then
  CORE_VERSION=$(jq -r '.version' packages/core/package.json)
  REACT_VERSION=$(jq -r '.version' packages/react/package.json)
else
  # jqがない場合はgrepを使用
  CORE_VERSION=$(grep -o '"version": "[^"]*"' packages/core/package.json | head -1 | cut -d'"' -f4)
  REACT_VERSION=$(grep -o '"version": "[^"]*"' packages/react/package.json | head -1 | cut -d'"' -f4)
fi

if [ "$CORE_VERSION" != "$REACT_VERSION" ]; then
  echo -e "${RED}❌ バージョンが一致しません: core=$CORE_VERSION, react=$REACT_VERSION${NC}"
  exit 1
fi

VERSION="v$CORE_VERSION"
echo -e "${GREEN}📌 バージョン: $VERSION${NC}"

# 6. push
echo -e "${GREEN}📤 push中...${NC}"
git push

# 7. タグが既に存在するか確認
if git rev-parse "$VERSION" >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  タグ $VERSION は既に存在します${NC}"
  read -p "上書きしますか? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ キャンセルしました${NC}"
    exit 1
  fi
  git tag -d "$VERSION" || true
  git push origin ":refs/tags/$VERSION" || true
fi

# 8. タグを作成
echo -e "${GREEN}🏷️  タグ $VERSION を作成中...${NC}"
git tag -a "$VERSION" -m "Release $VERSION"

# 9. タグをpush
echo -e "${GREEN}📤 タグをpush中...${NC}"
git push origin "$VERSION"

echo -e "${GREEN}✅ リリースが完了しました！${NC}"
echo -e "${GREEN}   Version: $VERSION${NC}"
echo -e "${GREEN}   Tag: $VERSION${NC}"

