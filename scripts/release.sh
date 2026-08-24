#!/usr/bin/env bash
#
# リリーススクリプト
#
# packages/*/package.json のバージョンを上げてコミットし、タグを打って push します。
# 実際の npm publish は、タグ push をトリガーに .github/workflows/publish.yml が行います。
#
# 使い方:
#   ./scripts/release.sh patch            # 0.2.10 -> 0.2.11
#   ./scripts/release.sh minor            # 0.2.10 -> 0.3.0
#   ./scripts/release.sh major            # 0.2.10 -> 1.0.0
#   ./scripts/release.sh 0.3.0            # 明示的なバージョン指定
#   ./scripts/release.sh patch --dry-run  # 何もせず実行内容だけ表示
#
# 前提:
#   - main ブランチであること（RELEASE_ALLOW_BRANCH=1 で回避可能）
#   - 作業ツリーがクリーンであること（このスクリプトはバージョン変更のみをコミットします）
#

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}$*${NC}"; }
warn() { echo -e "${YELLOW}$*${NC}"; }
err() { echo -e "${RED}$*${NC}" >&2; }

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PACKAGES=(core react vue)
RELEASE_BRANCH="main"
DRY_RUN=0
BUMP=""

# ---------------------------------------------------------------- 引数の解析
for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=1
      ;;
    -h | --help)
      sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    -*)
      err "❌ 不明なオプション: $arg"
      exit 1
      ;;
    *)
      if [ -n "$BUMP" ]; then
        err "❌ 引数が多すぎます: $arg"
        exit 1
      fi
      BUMP="$arg"
      ;;
  esac
done

if [ -z "$BUMP" ]; then
  err "❌ バージョンを指定してください（patch / minor / major / x.y.z）"
  err "   例: ./scripts/release.sh patch"
  exit 1
fi

run() {
  if [ "$DRY_RUN" -eq 1 ]; then
    echo -e "${YELLOW}[dry-run]${NC} $*"
  else
    "$@"
  fi
}

if [ "$DRY_RUN" -eq 1 ]; then
  warn "🧪 dry-run モード: リポジトリへの変更・push は行いません"
fi

# ------------------------------------------------------------ 事前チェック
info "🔍 リリース前チェック中..."

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" != "$RELEASE_BRANCH" ]; then
  if [ "${RELEASE_ALLOW_BRANCH:-0}" = "1" ]; then
    warn "⚠️  $RELEASE_BRANCH 以外のブランチ ($CURRENT_BRANCH) からリリースします（RELEASE_ALLOW_BRANCH=1）"
  else
    err "❌ 現在のブランチは $CURRENT_BRANCH です。リリースは $RELEASE_BRANCH から行ってください"
    err "   意図的に別ブランチからリリースする場合: RELEASE_ALLOW_BRANCH=1 ./scripts/release.sh $BUMP"
    exit 1
  fi
fi

# 追跡済みファイルに変更があると、意図しない差分がリリースに混ざるため中断する
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  err "❌ 作業ツリーに未コミットの変更があります"
  err "   このスクリプトはバージョン変更のみをコミットします。先に変更をコミットしてください"
  git status --short --untracked-files=no >&2
  exit 1
fi

# 未追跡ファイルはコミットされない（git add . はしない）ので警告のみ
UNTRACKED="$(git ls-files --others --exclude-standard)"
if [ -n "$UNTRACKED" ]; then
  warn "⚠️  未追跡ファイルがあります（リリースには含まれません）:"
  echo "$UNTRACKED" | sed 's/^/     /'
fi

info "📡 リモートの状態を取得中..."
git fetch --tags origin

UPSTREAM="origin/$CURRENT_BRANCH"
if git rev-parse --verify --quiet "$UPSTREAM" >/dev/null; then
  BEHIND="$(git rev-list --count "HEAD..$UPSTREAM")"
  if [ "$BEHIND" != "0" ]; then
    err "❌ ローカルが $UPSTREAM より $BEHIND コミット遅れています。git pull してから再実行してください"
    exit 1
  fi
fi

# -------------------------------------------------- 現在のバージョンを取得
read_version() {
  node -p "require('./packages/$1/package.json').version"
}

CURRENT_VERSION="$(read_version core)"
for pkg in "${PACKAGES[@]}"; do
  V="$(read_version "$pkg")"
  if [ "$V" != "$CURRENT_VERSION" ]; then
    err "❌ パッケージ間でバージョンが一致していません: core=$CURRENT_VERSION, $pkg=$V"
    exit 1
  fi
done
info "📌 現在のバージョン: $CURRENT_VERSION"

# ---------------------------------------------- 次のバージョンを組み立てる
if [[ ! "$CURRENT_VERSION" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
  err "❌ 現在のバージョンが semver ではありません: $CURRENT_VERSION"
  exit 1
fi
MAJOR="${BASH_REMATCH[1]}"
MINOR="${BASH_REMATCH[2]}"
PATCH="${BASH_REMATCH[3]}"

case "$BUMP" in
  major) NEW_VERSION="$((MAJOR + 1)).0.0" ;;
  minor) NEW_VERSION="$MAJOR.$((MINOR + 1)).0" ;;
  patch) NEW_VERSION="$MAJOR.$MINOR.$((PATCH + 1))" ;;
  *)
    if [[ ! "$BUMP" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
      err "❌ バージョン指定が不正です: $BUMP（patch / minor / major / x.y.z）"
      exit 1
    fi
    NEW_VERSION="$BUMP"
    ;;
esac

TAG="v$NEW_VERSION"
info "📦 新しいバージョン: $CURRENT_VERSION -> $NEW_VERSION ($TAG)"

# ------------------------------------------------------ タグの重複チェック
if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  err "❌ タグ $TAG はローカルに既に存在します"
  err "   公開済みバージョンのタグを付け替えるのは危険です。新しいバージョンを指定してください"
  exit 1
fi
if [ -n "$(git ls-remote --tags origin "refs/tags/$TAG")" ]; then
  err "❌ タグ $TAG はリモートに既に存在します（そのバージョンは公開済みの可能性があります）"
  err "   新しいバージョンを指定してください"
  exit 1
fi

# -------------------------------------------------------- ビルドとテスト
info "📥 依存関係をインストール中..."
run pnpm install --frozen-lockfile

info "🔨 パッケージをビルド中..."
for pkg in "${PACKAGES[@]}"; do
  run pnpm --filter "@hyperbind-lib/$pkg" build
done

for pkg in "${PACKAGES[@]}"; do
  if node -e "process.exit(require('./packages/$pkg/package.json').scripts?.test ? 0 : 1)"; then
    info "🧪 @hyperbind-lib/$pkg のテストを実行中..."
    run pnpm --filter "@hyperbind-lib/$pkg" test
  fi
done

# ------------------------------------------------ バージョンの書き換え
info "✏️  package.json のバージョンを更新中..."
if [ "$DRY_RUN" -eq 1 ]; then
  for pkg in "${PACKAGES[@]}"; do
    echo -e "${YELLOW}[dry-run]${NC} packages/$pkg/package.json: $CURRENT_VERSION -> $NEW_VERSION"
  done
else
  NEW_VERSION="$NEW_VERSION" node -e "
    const fs = require('fs');
    const version = process.env.NEW_VERSION;
    for (const name of ['core', 'react', 'vue']) {
      const path = 'packages/' + name + '/package.json';
      const raw = fs.readFileSync(path, 'utf8');
      const updated = raw.replace(/^(\s*\"version\":\s*\")[^\"]+(\")/m, '\$1' + version + '\$2');
      if (updated === raw) {
        console.error('バージョンを書き換えられませんでした: ' + path);
        process.exit(1);
      }
      fs.writeFileSync(path, updated);
      console.log('updated ' + path);
    }
  "
fi

# ------------------------------------------------------ コミットとタグ
# git add . は使わず、バージョンを書き換えたファイルだけをステージする
VERSION_FILES=()
for pkg in "${PACKAGES[@]}"; do
  VERSION_FILES+=("packages/$pkg/package.json")
done

info "💾 コミット中..."
run git add -- "${VERSION_FILES[@]}"
run git commit -m "chore(release): $TAG"

info "🏷️  タグ $TAG を作成中..."
run git tag -a "$TAG" -m "Release $TAG"

# ---------------------------------------------------------------- push
if [ "$DRY_RUN" -eq 0 ]; then
  echo
  warn "以下を push します（タグ push で npm publish が実行されます）:"
  echo "  - $CURRENT_BRANCH ($(git rev-parse --short HEAD))"
  echo "  - $TAG"
  # 非対話実行（read が失敗する）場合はキャンセル扱いにして push しない
  if ! read -r -p "続行しますか? (y/N): " REPLY; then
    REPLY=""
    echo
  fi
  if [[ ! "$REPLY" =~ ^[Yy]$ ]]; then
    warn "❌ push をキャンセルしました。ローカルの変更を戻すには:"
    echo "  git tag -d $TAG && git reset --hard HEAD~1"
    exit 1
  fi
fi

info "📤 $CURRENT_BRANCH を push 中..."
run git push origin "$CURRENT_BRANCH"

info "📤 タグを push 中..."
run git push origin "refs/tags/$TAG"

info "✅ リリースが完了しました！"
info "   Version: $NEW_VERSION"
info "   Tag: $TAG"
info "   https://github.com/redamoon/hyperbind-lib/actions"
