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

### カスタムキーバインド管理

複数のキーバインドを動的に追加・削除・管理できます。

```tsx
import { useCustomKeybinds, KeybindList } from "@hyperbind/react";

function App() {
  const {
    keybinds,
    addKeybind,
    removeKeybind,
    updateKeybind,
    toggleKeybind,
    togglePreventDefault,
  } = useCustomKeybinds({
    onTrigger: (id) => {
      console.log(`Keybind ${id} triggered!`);
    },
  });

  return (
    <>
      <button onClick={() => addKeybind({
        label: "新しいアクション",
        keyCombo: "ctrl+k",
        enabled: true,
        preventDefault: true,
      })}>
        キーバインド追加
      </button>
      
      <KeybindList
        keybinds={keybinds}
        onToggle={toggleKeybind}
        onTogglePreventDefault={togglePreventDefault}
        onRemove={removeKeybind}
        onUpdate={updateKeybind}
      />
    </>
  );
}
```

**機能:**
- 個別のオン/オフ切り替え
- `preventDefault` の制御（ブラウザデフォルト動作の有効/無効）
- localStorage への自動保存
- キー組み合わせの動的変更
- 予約されたキーの警告表示（Ctrl+S、F5、Ctrl+R など）

### モーダル起動用ヘルパー

F5などのキーでモーダルを開閉できます。

```tsx
import { useModalKeybind } from "@hyperbind/react";

function App() {
  const [showModal, setShowModal] = useState(false);
  
  useModalKeybind({
    keyCombo: "f5",
    onOpen: () => setShowModal(true),
    onClose: () => setShowModal(false),
    isOpen: showModal,
  });
  
  return showModal ? <Modal /> : null;
}
```

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

### グローバルなON/OFF切り替え

すべてのキーバインドをグローバルに有効/無効化できます。

```tsx
import { useGlobalKeybindToggle } from "@hyperbind/react";

function App() {
  const { isEnabled, enable, disable, toggle } = useGlobalKeybindToggle();
  
  return (
    <div>
      <button onClick={toggle}>
        キーバインド: {isEnabled ? "ON" : "OFF"}
      </button>
      {!isEnabled && <p>⚠️ すべてのキーバインドが無効化されています</p>}
    </div>
  );
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

### `useGlobalKeybindToggle()`

すべてのキーバインドをグローバルにON/OFFするフック。

**戻り値:**
- `isEnabled`: キーバインドが有効かどうか（boolean）
- `enable`: キーバインドを有効化する関数
- `disable`: キーバインドを無効化する関数
- `toggle`: キーバインドの有効/無効を切り替える関数

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

### `useCustomKeybinds(options)`

複数のカスタムキーバインドを管理するフック。

**オプション:**
- `storageKey`: localStorage のキー（デフォルト: `"hyperbind_custom_keybinds"`）
- `onTrigger`: キーバインドが実行されたときのコールバック

**戻り値:**
- `keybinds`: 登録されているキーバインドの配列
- `addKeybind`: 新しいキーバインドを追加
- `removeKeybind`: キーバインドを削除
- `updateKeybind`: キーバインドを更新
- `toggleKeybind`: 有効/無効を切り替え
- `togglePreventDefault`: preventDefault を切り替え

### `useModalKeybind(options)`

モーダル開閉用のキーバインドを設定するフック。

**オプション:**
- `keyCombo`: キー組み合わせ
- `onOpen`: モーダルを開く関数
- `onClose`: モーダルを閉じる関数
- `isOpen`: モーダルが開いているか
- `preventDefault`: デフォルト動作を防止するか（デフォルト: `true`）

### `<KeybindList />`

キーバインドのリストを表示し、管理するコンポーネント。

**Props:**
- `keybinds`: キーバインドの配列
- `onToggle`: 有効/無効切り替えのハンドラ
- `onTogglePreventDefault`: preventDefault 切り替えのハンドラ
- `onRemove`: 削除のハンドラ
- `onUpdate`: 更新のハンドラ

**特徴:**
- 予約されたキー（Ctrl+S、F5など）を使用すると警告を表示
- 予約キーはオレンジ色の枠で強調表示

### 予約されたキーの警告

`@hyperbind/react` では、ブラウザや一般的なアプリケーションで使用されるキーバインド（Ctrl+S、F5、Ctrl+R など）を予約キーとして定義しています。

```tsx
import { isReservedKey, getReservedKeyWarning } from "@hyperbind/react";

if (isReservedKey("ctrl+s")) {
  console.log("このキーは予約されています");
}

const warning = getReservedKeyWarning("ctrl+s");
// "このキーは一般的にブラウザやアプリケーションで使用されています..."
```

### 入力フィールド専用キーバインド

特定の入力フィールドに個別のキーバインドを設定できます。

#### `useInputKeybind` フック

```tsx
import { useInputKeybind } from "@hyperbind/react";

function SearchInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useInputKeybind({
    elementRef: inputRef,
    keyCombo: "Enter",
    onTrigger: () => {
      console.log("Enterキーが押されました");
      // 検索処理など
    },
  });

  return <input ref={inputRef} type="text" />;
}
```

#### `InputWithKeybind` コンポーネント

```tsx
import { InputWithKeybind } from "@hyperbind/react";

<InputWithKeybind
  triggerKey="cmd+k"
  onKeyPress={() => console.log("⌘Kが押されました")}
  placeholder="⌘Kを押してください"
/>
```

## ⌨️ キーバインド一覧

### 受注伝票入力画面

| キー | 機能 | 説明 |
|------|------|------|
| **F2** | 新規作成 | 伝票をクリアし、新規入力状態にする |
| **F8** | 参照 | 取引先・商品の一覧を表示（フォーカス中の入力に応じる） |
| **F9** | 削除 | 最後に追加した明細を削除 |
| **F12** | 登録 | 伝票を登録（取引先と明細の存在チェック付き） |
| **Ctrl+F** | 検索 | 伝票番号や日付で検索（デモ版） |
| **Ctrl+Insert** | 行挿入 | 商品コード入力欄にフォーカス |
| **Ctrl+Delete** | 行削除 | 最後の明細行を削除 |
| **⌘+Enter** <br> **Ctrl+Enter** | 取引先検索 | 取引先コード入力後、取引先情報を表示 |
| **Enter** <br> **⌘+Enter** | 商品参照 | 商品コード入力後、商品情報を表示し数量入力へ移動 |
| **Enter** <br> **⌘+Enter** | 明細追加 | 数量入力後、明細一覧に追加 |
| **Enter** | 次の入力へ | 入力フィールド間を移動 |
| **Tab** | 次の項目へ | 順方向にフォーカス移動 |
| **Shift+Tab** | 前の項目へ | 逆方向にフォーカス移動 |

### フォーム入力デモ

| キー | 機能 |
|------|------|
| **Enter** | 次の入力フィールドへ移動 |
| **Tab** | 次の入力フィールドへ移動 |
| **Shift+Tab** | 前の入力フィールドへ移動 |

### カスタムキーバインド管理

| キー | 機能 |
|------|------|
| **F5** | ヘルプダイアログの開閉 |
| **⌘+S** <br> **Ctrl+S** | 保存（デモ） |
| **カスタム** | ユーザー定義のキーバインド |

### 予約されたキー（警告表示）

以下のキーは、ブラウザやOSで一般的に使用されているため、使用時に警告が表示されます：

| カテゴリ | キー |
|----------|------|
| **リロード** | F5, Ctrl+R, ⌘+R, Ctrl+Shift+R, ⌘+Shift+R, Ctrl+F5 |
| **タブ管理** | Ctrl+T, ⌘+T, Ctrl+W, ⌘+W, Ctrl+Shift+T, ⌘+Shift+T |
| **アドレスバー** | Ctrl+L, ⌘+L |
| **保存** | Ctrl+S, ⌘+S |
| **新規ウィンドウ** | Ctrl+N, ⌘+N, Ctrl+Shift+N, ⌘+Shift+N |
| **全画面** | F11, Escape |
| **検索** | Ctrl+F, ⌘+F, Ctrl+G, ⌘+G, F3 |
| **履歴** | Ctrl+H, ⌘+H |
| **ダウンロード** | Ctrl+J, ⌘+J |
| **ブックマーク** | Ctrl+Shift+D |
| **開発者ツール** | F12, Ctrl+Shift+I, ⌘+Option+I, Ctrl+Shift+J, ⌘+Option+J |
| **印刷** | Ctrl+P, ⌘+P |
| **編集** | Ctrl+A, ⌘+A, Ctrl+C, ⌘+C, Ctrl+V, ⌘+V, Ctrl+X, ⌘+X, Ctrl+Z, ⌘+Z, Ctrl+Y, ⌘+Shift+Z |

## 🛠 実装例

より詳細な実装例は `examples/react-demo` を参照してください。

- **受注伝票入力**: `examples/react-demo/src/OrderForm.tsx`
- **フォーム入力**: `examples/react-demo/src/App.tsx`（form-demoタブ）
- **カスタムキーバインド**: `examples/react-demo/src/App.tsx`（custom-keybindタブ）
- **スタンドアロン版**: `examples/react-demo/order-form.html`, `examples/react-demo/keybind-settings.html`

詳細な仕様は `examples/react-demo/README.md` を参照してください。

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
