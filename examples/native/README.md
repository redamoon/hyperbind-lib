# HyperBind VanillaJS Demo

HyperBindライブラリのVanillaJS（純粋なJavaScript）デモアプリケーションです。フレームワークを使わずに、HTMLとJavaScriptだけでキーバインド機能を実装する例を提供します。

## 🚀 起動方法

### 方法1: Python HTTPサーバーを使用

```bash
cd examples/native
pnpm dev
```

ブラウザで `http://localhost:8080/examples/native/` にアクセスしてください。

**注意**: サーバーはプロジェクトルートから起動されるため、`/examples/native/`のパスでアクセスします。

### 方法2: serveパッケージを使用

```bash
cd examples/native
pnpm install
pnpm serve
```

ブラウザで `http://localhost:3000/examples/native/` にアクセスしてください（ポート番号はserveの出力を確認してください）。

### 方法3: 直接ファイルを開く

`index.html` をブラウザで直接開くこともできますが、ES Modulesを使用しているため、ローカルサーバー経由でのアクセスを推奨します。

## 📁 プロジェクト構成

```
examples/native/
├── index.html          # メインHTMLファイル
├── package.json        # 依存関係
└── README.md          # このファイル
```

## 🎯 デモ機能

### 基本的なキーバインド

- `Ctrl+S / Cmd+S`: 保存
- `Ctrl+K / Cmd+K`: 検索
- `F1`: ヘルプ
- `F2`: 新規作成
- `F3`: 検索画面

### グローバルキーバインドのON/OFF

画面右上のボタンで、すべてのキーバインドを一括でON/OFFできます。

### フォーム入力のデモ

入力フィールドでEnterキーを押すと、次のフィールドに自動的に移動します。

### プリセットキーバインド

HyperBind Coreのプリセットキーバインドの一覧を表示し、実際に動作を確認できます。

## 💡 実装のポイント

### ES Modulesの使用

```javascript
import { binder, ALL_PRESET_KEYBINDS } from '../../packages/core/dist/index.js';
```

### キーバインドの登録

```javascript
binder.register('ctrl+s', () => {
  console.log('保存が実行されました');
});
```

### ID付きキーバインドの登録

```javascript
binder.registerWithId(
  'my-keybind',
  'f1',
  () => {
    console.log('F1が押されました');
  },
  { preventDefault: true }
);
```

### グローバルなON/OFF

```javascript
binder.disable(); // すべてのキーバインドを無効化
binder.enable();  // すべてのキーバインドを有効化
```

## 📝 注意事項

- ES Modulesを使用しているため、ローカルサーバー経由でアクセスする必要があります
- ファイルを直接開く（`file://`プロトコル）では動作しません
- ブラウザの開発者ツールでエラーが表示される場合は、コンソールを確認してください

## 🔗 関連リンク

- [HyperBind Core API](../../packages/core/README.md)
- [HyperBind React API](../../packages/react/README.md)
- [HyperBind Vue API](../../packages/vue/README.md)
