# HyperBind

キーボードショートカットを簡単に実装するための React ライブラリ。

## 📦 パッケージ

- **@hyperbind/core**: キーバインド管理のコアライブラリ
- **@hyperbind/react**: React 用フックとコンポーネント

## 🚀 クイックスタート

### インストール

```bash
npm install @hyperbind/core @hyperbind/react
```

### 基本的な使い方

```tsx
import { useKeybind } from "@hyperbind/react";

function App() {
  useKeybind("ctrl+s", () => {
    alert("保存しました！");
  });

  return <div>Ctrl+S で保存</div>;
}
```

## 🎯 機能

### クロスプラットフォーム対応

Mac と Windows/Linux のキーボードの違いを自動的に吸収します：
- Mac の `Cmd` キー（⌘）と Windows/Linux の `Ctrl` キーを統一的に扱えます
- `"ctrl+s"` または `"cmd+s"` のどちらで登録しても、両方のプラットフォームで動作します
- KeyRecorder コンポーネントは、押されたキーに応じて自動的に適切な表現を記録します

```tsx
import { useKeybind } from "@hyperbind/react";

function App() {
  // "cmd+s" または "ctrl+s" のどちらでも動作
  useKeybind("cmd+s", () => {
    saveData();
  });
  
  return <div>保存: Cmd+S (Mac) / Ctrl+S (Windows/Linux)</div>;
}
```

### キーバインドの登録

`useKeybind` フックでキーボードショートカットを登録できます。

```tsx
import { useKeybind } from "@hyperbind/react";

function SaveButton() {
  useKeybind("ctrl+s", () => {
    saveData();
  });
  
  return <button onClick={saveData}>保存</button>;
}
```

### キー入力記録

`KeyRecorder` コンポーネントでユーザーにキー入力を記録してもらいます。

```tsx
import { KeyRecorder } from "@hyperbind/react";

function KeySettings() {
  const [key, setKey] = useState("ctrl+s");
  
  return (
    <label>
      保存キー:
      <KeyRecorder value={key} onChange={setKey} />
    </label>
  );
}
```

### フォームナビゲーション

`FormNavigator` コンポーネントで Enter/Tab によるフィールド間移動を実装します。

```tsx
import { FormNavigator } from "@hyperbind/react";

function ContactForm() {
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  
  return (
    <>
      <input ref={nameRef} type="text" />
      <input ref={emailRef} type="email" />
      <FormNavigator inputRefs={[nameRef, emailRef]} />
    </>
  );
}
```

### 一時的な無効化

モーダルなどでキーバインドを一時的に無効化します。

```tsx
import { useDisableKeyBindsWhileMounted } from "@hyperbind/react";

function Modal() {
  useDisableKeyBindsWhileMounted();
  
  return <div>モーダル中はキーバインドが無効化されます</div>;
}
```

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

## 📚 API リファレンス

### `useKeybind(keyCombo: string, callback: () => void)`

キーバインドを登録するフック。

**引数:**
- `keyCombo`: キーの組み合わせ（例: `"ctrl+s"`, `"shift+alt+k"`）
- `callback`: 実行される関数

### `useDisableKeyBindsWhileMounted()`

コンポーネントのマウント中にキーバインドを無効化するフック。

### `<KeyRecorder value={string} onChange={(key: string) => void} />`

キー入力を記録するコンポーネント。

**Props:**
- `value`: 現在のキー組み合わせ
- `onChange`: キーが記録されたときに呼ばれるコールバック

### `<FormNavigator inputRefs={RefObject[]} />`

フォームフィールド間のナビゲーションを提供するコンポーネント。

**Props:**
- `inputRefs`: 入力フィールドの参照の配列

**動作:**
- `Enter` / `Tab`: 次のフィールドへ移動
- `Shift+Enter` / `Shift+Tab`: 前のフィールドへ移動

## 🛠 実装例

より詳細な実装例は `examples/react-demo` または `../hyperbind-sample-project` を参照してください。

## 📄 ライセンス

MIT
