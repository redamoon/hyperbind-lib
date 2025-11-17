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

### 会計処理キーバインド

#### 共通操作

| キー | 機能 | 説明 |
|------|------|------|
| **F1** | ヘルプ | 現在のウィンドウのサポートページを表示 |
| **F2** | パレットを表示 | パレットを表示 |
| **F4** | 項目の参照 | ドロップダウン・カレンダー・電卓の表示 |
| **F6** | 勘定科目欄と補助科目欄のカーソル移動 | 勘定科目欄と補助科目欄のカーソル移動 |
| **F11** / **Ctrl+P** | 印刷 | 印刷 |
| **Alt+←** / **Alt+→** | 開いているウィンドウを切り替え | 開いているウィンドウを切り替え |
| **Alt+F1** | ナビゲーションバーの表示 | ナビゲーションバーの表示 |

#### 印刷・エクスポート関連

| キー | 機能 | 説明 |
|------|------|------|
| **Ctrl+A** | すべて選択 | すべて選択（科目や部門のドロップダウン選択時） |
| **Ctrl+R** | 選択状態の反転 | 選択状態の反転（科目や部門のドロップダウン選択時） |
| **Ctrl+D** | すべて解除 | すべて解除（科目や部門のドロップダウン選択時） |

#### 検索

| キー | 機能 | 説明 |
|------|------|------|
| **F3** | 検索画面を表示 | 検索画面を表示 |
| **Shift+F3** | 検索解除 | 検索解除 |

#### （科目・部門）作成／編集／削除

| キー | 機能 | 説明 |
|------|------|------|
| **F7** | 編集 | 編集（勘定科目・部門項目） |
| **F8** | 新規作成 | 新規作成（勘定科目・部門項目） |
| **F9** | 削除 | 削除（勘定科目・部門項目） |
| **Shift+F8** | 補助科目新規作成 | 補助科目新規作成 |
| **Ctrl+H** | 補助科目コピー | 補助科目コピー |
| **Ctrl+Y** | 補助科目貼り付け | 補助科目貼り付け |
| **Shift+F12** | 複写 | 複写（固定資産一覧・不動産所得収入の内訳のみ） |

#### 仕訳入力

| キー | 機能 | 説明 |
|------|------|------|
| **F9** / **Ctrl+Del** | 仕訳削除 | 仕訳削除 |
| **F12** | 仕訳登録 | 仕訳登録 |
| **Shift+F11** | 借方項目の固定/解除 | 借方項目の固定/解除 |
| **Shift+F12** | 貸方項目の固定/解除 | 貸方項目の固定/解除 |
| **Ctrl+K** | 行切り取り | 行切り取り |
| **Ctrl+L** | 行コピー | 行コピー |
| **Ctrl+Y** | 行貼り付け | 行貼り付け |
| **Ctrl+Ins** | 新規行挿入 | 新規行挿入 |

#### 仕訳日記帳・帳簿

| キー | 機能 | 説明 |
|------|------|------|
| **Alt+1** | 絞り込み ON/OFF | 絞り込み ON/OFF |
| **F6** | 絞り込み行と編集行の移動 | 絞り込み行と編集行の移動 |
| **F8** | ズーム（伝票表示） | ズーム（伝票表示） |
| **F9** / **Ctrl+Del** | 仕訳削除 | 仕訳削除 |
| **Shift+F5** | 証憑ビューアー | 証憑ビューアー |
| **Shift+F7** | 付箋1を外す | 付箋1を外す |
| **Shift+F8** | 付箋2を外す | 付箋2を外す |
| **Shift+F11** | 借方項目固定/解除 | 借方項目固定/解除 |
| **Shift+F12** | 貸方項目固定/解除 | 貸方項目固定/解除 |
| **Ctrl+F** | 前行項目複写 | 前行項目複写 |
| **Ctrl+K** | 行切り取り | 行切り取り |
| **Ctrl+L** | 行コピー | 行コピー |
| **Ctrl+Y** | 行貼り付け | 行貼り付け |
| **Ctrl+Q** | 借方税区分へ移動 | 借方税区分へ移動 |
| **Ctrl+W** | 貸方税区分へ移動 | 貸方税区分へ移動 |
| **Ctrl+I** | 請求書区分へ移動 | 請求書区分へ移動 |
| **Ctrl+J** | 仕入税額控除項目へ | 仕入税額控除項目へ |
| **Ctrl+Ins** | 行挿入 | 行挿入 |

#### 伝票入力

| キー | 機能 | 説明 |
|------|------|------|
| **Alt+D** | 日付へ移動 | 日付へ移動 |
| **F6** | 前の伝票へ | 前の伝票へ |
| **F7** | 次の伝票へ | 次の伝票へ |
| **F8** | 伝票辞書の参照 | 伝票辞書の参照 |
| **F9** | 伝票削除 | 伝票削除 |
| **F12** | 伝票登録 | 伝票登録 |
| **Shift+F5** | 振替伝票 | 振替伝票 |
| **Shift+F6** | 入金伝票 | 入金伝票 |
| **Shift+F7** | 出金伝票 | 出金伝票 |
| **Shift+F8** | 新規伝票 | 新規伝票 |
| **Shift+F12** / **Ctrl+R** | 伝票複製 | 伝票複製 |
| **Shift+=** | 貸借バランス0の金額・相手金額を入力 | 貸借バランス0の金額・相手金額を入力 |
| **Ctrl+F** | 前行項目複写 | 前行項目複写 |
| **Ctrl+K** | 行切り取り | 行切り取り |
| **Ctrl+L** | 行コピー | 行コピー |
| **Ctrl+Y** | 行貼り付け | 行貼り付け |
| **Ctrl+Q** | 借方税区分へ | 借方税区分へ |
| **Ctrl+W** | 貸方税区分へ | 貸方税区分へ |
| **Ctrl+I** | 請求書区分へ | 請求書区分へ |
| **Ctrl+J** | 仕入税額控除へ | 仕入税額控除へ |
| **Ctrl+Del** | 行削除 | 行削除 |
| **Ctrl+Ins** | 行挿入 | 行挿入 |

#### 集計表

| キー | 機能 | 説明 |
|------|------|------|
| **F4** | 部門の選択 | 部門の選択（残高試算表など） |
| **F5** | 集計 | 集計 |
| **F8** | ジャンプ / ズーム | ジャンプ / ズーム |

#### 決算書設定（法人）

| キー | 機能 | 説明 |
|------|------|------|
| **F5** | 事業所情報の取り込み | 事業所情報の取り込み |
| **Shift+F2** | ひな形挿入 | ひな形挿入 |
| **F8** | 株主資本等変動計算書を表示 | 株主資本等変動計算書を表示 |
| **F12** | 決算書の作成 | 決算書の作成（印刷/エクスポート） |

#### 勘定科目内訳書

| キー | 機能 | 説明 |
|------|------|------|
| **F8** | 内訳書科目設定 | 内訳書科目設定 |
| **F12** | データ設定 | データ設定 |
| **F5** | データ取り込み | データ取り込み |
| **Shift+F2** | 明細行挿入 | 明細行挿入 |
| **Shift+F3** | メモ行挿入 | メモ行挿入 |
| **Shift+F4** | 小計行挿入 | 小計行挿入 |
| **Shift+F5** | 行切り取り | 行切り取り |
| **Shift+F6** | 行コピー | 行コピー |
| **Shift+F7** | 行貼り付け | 行貼り付け |
| **Shift+F11** | 行を上へ | 行を上へ |
| **Shift+F12** | 行を下へ | 行を下へ |

#### 消費税申告書

| キー | 機能 | 説明 |
|------|------|------|
| **F8** | 上書きON/OFF | 上書きON/OFF |
| **F12** | プレビュー | プレビュー |

#### 取引予定表

| キー | 機能 | 説明 |
|------|------|------|
| **F7** | 編集 | 編集 |
| **F8** | 新規作成 | 新規作成 |
| **F9** | 削除 | 削除 |
| **F12** | 実行 | 実行 |

#### その他

| キー | 機能 | 説明 |
|------|------|------|
| **F12** | 仕訳書き出し | 仕訳書き出し |

## 🛠 実装例

より詳細な実装例は `examples/react-demo` を参照してください。

- **受注伝票入力**: `examples/react-demo/src/OrderForm.tsx`
- **フォーム入力**: `examples/react-demo/src/App.tsx`（form-demoタブ）
- **カスタムキーバインド**: `examples/react-demo/src/App.tsx`（custom-keybindタブ）
- **スタンドアロン版**: `examples/react-demo/order-form.html`, `examples/react-demo/keybind-settings.html`

詳細な仕様は `examples/react-demo/README.md` を参照してください。

## 📄 ライセンス

MIT
