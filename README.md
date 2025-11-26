# HyperBind

キーボードショートカットを簡単に実装するためのライブラリ。

## 📦 パッケージ

このプロジェクトは2つのパッケージで構成されています：

- **[@hyperbind-lib/core](./packages/core/README.md)**: キーバインド管理のコアライブラリ（React以外の環境でも使用可能）
- **[@hyperbind-lib/react](./packages/react/README.md)**: React 用フックとコンポーネント

各パッケージの詳細なドキュメントは、それぞれのREADMEを参照してください。

## 📝 開発

### セットアップ

```bash
# 依存関係のインストール
pnpm install

# パッケージのビルド
pnpm -r build

# デモアプリケーションの起動
cd examples/react-demo
pnpm dev
```

### ワークスペース構成

```
hyperbind-lib/
├── packages/
│   ├── core/          # コアライブラリ
│   └── react/         # React ラッパー
└── examples/
    └── react-demo/    # デモアプリケーション
```

### Cursor Hooks（README自動更新）

このプロジェクトには、Cursorエージェントが自動的にREADMEを更新するHooksが設定されています。

**有効化方法:**
プロジェクトルートの`.cursor/hooks.json`が自動的に適用されます（チーム全体で共有されます）。

**機能:**
- **ファイル変更時**: `reservedKeys.ts`や`PresetKeybinds.ts`を変更すると、自動的に`pnpm update-readme`が実行されます
- **コミット前**: コミット前にREADMEが自動更新され、変更ファイルがステージングされます
- **手動実行**: Cursorで`docs:update`コマンドを実行すると、手動でREADMEを更新できます

**手動でREADMEを更新する場合:**
```bash
pnpm update-readme
# または
pnpm docs:update
```

**参考リンク:**
- [Cursor Hooks ドキュメント](https://cursor.com/ja/docs/agent/hooks)

## 📦 npm への公開

### 公開手順

```bash
# Core パッケージをビルドして公開
cd packages/core
pnpm build
npm publish --access public

# React パッケージをビルドして公開
cd ../react
pnpm build
npm publish --access public
```

### バージョン管理

パッケージのバージョンを上げる場合は `packages/*/package.json` を更新してください。

## 📄 ライセンス

MIT


<!-- AUTO:RESERVED_KEYS_START -->

- `+`
- `cmd+a`
- `cmd+c`
- `cmd+f`
- `cmd+g`
- `cmd+h`
- `cmd+j`
- `cmd+l`
- `cmd+n`
- `cmd+option+i`
- `cmd+option+j`
- `cmd+p`
- `cmd+r`
- `cmd+s`
- `cmd+shift+n`
- `cmd+shift+r`
- `cmd+shift+t`
- `cmd+shift+z`
- `cmd+t`
- `cmd+v`
- `cmd+w`
- `cmd+x`
- `cmd+z`
- `ctrl+a`
- `ctrl+c`
- `ctrl+f`
- `ctrl+f5`
- `ctrl+g`
- `ctrl+h`
- `ctrl+j`
- `ctrl+l`
- `ctrl+n`
- `ctrl+p`
- `ctrl+r`
- `ctrl+s`
- `ctrl+shift+d`
- `ctrl+shift+i`
- `ctrl+shift+j`
- `ctrl+shift+n`
- `ctrl+shift+r`
- `ctrl+shift+t`
- `ctrl+t`
- `ctrl+v`
- `ctrl+w`
- `ctrl+x`
- `ctrl+y`
- `ctrl+z`
- `escape`
- `f11`
- `f12`
- `f3`
- `f5`

<!-- AUTO:RESERVED_KEYS_END -->
