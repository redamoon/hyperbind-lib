# @hyperbind-lib/react

Reactアプリケーションでキーボードショートカットを簡単に実装するためのフックとコンポーネントライブラリ。

## インストール

```bash
npm install @hyperbind-lib/react
```

**前提条件:**
- React 18.0.0以上
- `@hyperbind-lib/core`（自動的にインストールされます）

## クイックスタート

```tsx
import { useKeybind } from "@hyperbind-lib/react";

function App() {
  useKeybind("ctrl+s", () => {
    console.log("保存しました！");
  });

  return <div>Ctrl+S で保存</div>;
}
```

## 機能一覧

### フック（Hooks）

#### `useKeybind(keyCombo: string, callback: () => void)`

シンプルなキーバインドを登録するフック。コンポーネントのマウント時に登録し、アンマウント時に自動的に解除します。

```tsx
import { useKeybind } from "@hyperbind-lib/react";

function MyComponent() {
  useKeybind("ctrl+s", () => {
    saveDocument();
  });

  return <div>Ctrl+Sで保存</div>;
}
```

**引数:**
- `keyCombo`: キーの組み合わせ（例: `"ctrl+s"`, `"cmd+k"`, `"f1"`）
- `callback`: キー押下時に実行される関数

#### `usePresetKeybind(presetId: string, callback: () => void)`

プリセットキーバインドを使用するフック。プリセットIDを指定するだけで、キーの組み合わせとpreventDefault設定が自動的に適用されます。

```tsx
import { usePresetKeybind } from "@hyperbind-lib/react";

function MyComponent() {
  // F1キーでヘルプを表示（プリセット定義から自動取得）
  usePresetKeybind("common-help", () => {
    showHelpDialog();
  });

  // F3キーで検索を開く
  usePresetKeybind("search-show", () => {
    openSearchDialog();
  });

  return <div>...</div>;
}
```

**引数:**
- `presetId`: プリセットキーバインドのID（例: `"common-help"`, `"search-show"`）
- `callback`: キー押下時に実行される関数

**利用可能なプリセット:**
- `common-help`: F1 - ヘルプ表示
- `common-palette`: F2 - パレットを表示
- `search-show`: F3 - 検索
- `common-reference`: F4 - 項目の参照
- その他多数（`@hyperbind-lib/core`の`ALL_PRESET_KEYBINDS`を参照）

#### `useInputKeybind(options: UseInputKeybindOptions)`

入力フィールド専用のキーバインドフック。特定の入力要素にフォーカスがある場合のみ実行されます。

```tsx
import { useInputKeybind } from "@hyperbind-lib/react";
import { useRef } from "react";

function SearchInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useInputKeybind({
    elementRef: inputRef,
    keyCombo: "cmd+enter",
    onTrigger: () => {
      console.log("検索実行");
    },
  });

  return <input ref={inputRef} placeholder="検索..." />;
}
```

**オプション:**
- `elementRef`: 対象となる入力要素への参照
- `keyCombo`: キーの組み合わせ（デフォルト: `"Enter"`）
- `onTrigger`: キー押下時に実行される関数
- `enabled`: キーバインドを有効にするか（デフォルト: `true`）
- `preventDefault`: デフォルトのブラウザ動作を防ぐか（デフォルト: `true`）

#### `useCustomKeybinds(options?: UseCustomKeybindsOptions)`

カスタムキーバインドを管理するフック。ユーザーが定義したキーバインドの追加、削除、更新、有効/無効の切り替えを提供します。localStorageへの自動保存も行います。

```tsx
import { useCustomKeybinds, KeybindList } from "@hyperbind-lib/react";

function KeybindSettings() {
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
    <div>
      <button
        onClick={() =>
          addKeybind({
            label: "新しいアクション",
            keyCombo: "ctrl+k",
            enabled: true,
            preventDefault: true,
          })
        }
      >
        キーバインド追加
      </button>

      <KeybindList
        keybinds={keybinds}
        onToggle={toggleKeybind}
        onTogglePreventDefault={togglePreventDefault}
        onRemove={removeKeybind}
        onUpdate={updateKeybind}
      />
    </div>
  );
}
```

**戻り値:**
- `keybinds`: キーバインドの配列
- `addKeybind`: キーバインドを追加する関数
- `removeKeybind`: キーバインドを削除する関数
- `updateKeybind`: キーバインドを更新する関数
- `toggleKeybind`: キーバインドの有効/無効を切り替える関数
- `togglePreventDefault`: preventDefaultの有効/無効を切り替える関数

**オプション:**
- `storageKey`: localStorageのキー名（デフォルト: `"hyperbind_custom_keybinds"`）
- `onTrigger`: キーバインドが実行されたときに呼ばれる関数

#### `useModalKeybind(options: UseModalKeybindOptions)`

モーダルやダイアログの開閉をキーバインドで制御するフック。同じキーで開閉を切り替えるトグル動作を提供します。

```tsx
import { useModalKeybind } from "@hyperbind-lib/react";
import { useState } from "react";

function HelpDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useModalKeybind({
    keyCombo: "f1",
    onOpen: () => setIsOpen(true),
    onClose: () => setIsOpen(false),
    isOpen: isOpen,
  });

  if (!isOpen) return null;

  return (
    <dialog open>
      <h2>ヘルプ</h2>
      <p>F1キーで開閉できます</p>
      <button onClick={() => setIsOpen(false)}>閉じる</button>
    </dialog>
  );
}
```

**オプション:**
- `keyCombo`: キーの組み合わせ（例: `"f1"`, `"escape"`）
- `onOpen`: モーダルを開くときに実行される関数
- `onClose`: モーダルを閉じるときに実行される関数（省略可能）
- `isOpen`: モーダルが現在開いているかどうか（デフォルト: `false`）
- `preventDefault`: デフォルトのブラウザ動作を防ぐか（デフォルト: `true`）

#### `useGlobalKeybindToggle()`

すべてのキーバインドをグローバルにON/OFFするフック。

```tsx
import { useGlobalKeybindToggle } from "@hyperbind-lib/react";

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

**戻り値:**
- `isEnabled`: キーバインドが有効かどうか（boolean）
- `enable`: キーバインドを有効化する関数
- `disable`: キーバインドを無効化する関数
- `toggle`: キーバインドの有効/無効を切り替える関数

#### `useDisableKeyBindsWhileMounted()`

コンポーネントがマウントされている間、すべてのキーバインドを無効化するフック。モーダルやフォームで、キーバインドの干渉を防ぎたい場合に使用します。

```tsx
import { useDisableKeyBindsWhileMounted } from "@hyperbind-lib/react";

function ComplexForm() {
  // このコンポーネントがマウントされている間、
  // すべてのキーバインドが無効化される
  useDisableKeyBindsWhileMounted();

  return (
    <form>
      <input placeholder="キーバインドは無効です" />
      <button type="submit">送信</button>
    </form>
  );
}
```

#### `useDisableCustomKeybindsWhileMounted()`

コンポーネントがマウントされている間、カスタムキーバインドのみを無効化するフック。タブ移動などの標準的なキーバインドは有効のままです。モーダルやダイアログで、カスタムキーバインドの干渉を防ぎたい場合に使用します。

```tsx
import { useDisableCustomKeybindsWhileMounted } from "@hyperbind-lib/react";

function Modal() {
  // このコンポーネントがマウントされている間、
  // カスタムキーバインドのみが無効化される（タブ移動は有効）
  useDisableCustomKeybindsWhileMounted();

  return (
    <div>
      <input placeholder="タブ移動は可能" />
      <button>閉じる</button>
    </div>
  );
}
```

### コンポーネント

#### `<FormNavigator inputRefs={React.RefObject<HTMLInputElement>[]} />`

フォーム内の入力フィールド間を自動的にナビゲートするコンポーネント。Tab/Shift+TabとEnterキーで、指定された入力フィールド間を循環的に移動できます。IME入力中の動作も適切に処理します。

```tsx
import { FormNavigator } from "@hyperbind-lib/react";
import { useRef } from "react";

function MyForm() {
  const input1 = useRef<HTMLInputElement>(null);
  const input2 = useRef<HTMLInputElement>(null);
  const input3 = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input ref={input1} placeholder="名前" />
      <input ref={input2} placeholder="メール" />
      <input ref={input3} placeholder="電話" />
      <FormNavigator inputRefs={[input1, input2, input3]} />
    </div>
  );
}
```

**プロパティ:**
- `inputRefs`: フォーム内の入力要素への参照の配列

**動作:**
- `Tab`キー: 次のフィールドへ移動
- `Shift+Tab`キー: 前のフィールドへ移動
- `Enter`キー: 次のフィールドへ移動（テキストエリアの場合は無効）

#### `<KeyRecorder value={string} onChange={(key: string) => void} />`

キーボード入力を記録するコンポーネント。ユーザーがキーを押すと、その組み合わせ（"ctrl+s"など）を記録します。予約キー（ブラウザやOSで使用されるキー）の使用時には警告を表示します。

```tsx
import { KeyRecorder } from "@hyperbind-lib/react";
import { useState } from "react";

function KeybindSettings() {
  const [keyCombo, setKeyCombo] = useState("ctrl+s");

  return (
    <div>
      <label>
        キーバインド:
        <KeyRecorder
          value={keyCombo}
          onChange={setKeyCombo}
          showWarning={true}
          onWarning={(warning) => {
            if (warning) {
              console.warn(warning);
            }
          }}
        />
      </label>
    </div>
  );
}
```

**プロパティ:**
- `value`: 現在のキーの組み合わせ
- `onChange`: キーが記録されたときに呼ばれる関数
- `showWarning`: 警告メッセージを表示するかどうか（デフォルト: `false`）
- `onWarning`: 警告状態が変化したときに呼ばれる関数

#### `<KeybindList keybinds={CustomKeybind[]} ... />`

カスタムキーバインドの一覧を表示・編集するコンポーネント。各キーバインドに対して以下の操作が可能です：
- 有効/無効の切り替え
- ラベルとキーの組み合わせの編集
- preventDefaultの切り替え
- 削除

予約キーを使用している場合は、視覚的に警告を表示します。

```tsx
import { KeybindList } from "@hyperbind-lib/react";
import { useCustomKeybinds } from "@hyperbind-lib/react";

function KeybindSettings() {
  const {
    keybinds,
    toggleKeybind,
    togglePreventDefault,
    removeKeybind,
    updateKeybind,
  } = useCustomKeybinds();

  return (
    <KeybindList
      keybinds={keybinds}
      onToggle={toggleKeybind}
      onTogglePreventDefault={togglePreventDefault}
      onRemove={removeKeybind}
      onUpdate={updateKeybind}
    />
  );
}
```

**プロパティ:**
- `keybinds`: 表示するキーバインドの配列
- `onToggle`: キーバインドの有効/無効を切り替えるときに呼ばれる関数
- `onTogglePreventDefault`: preventDefaultの有効/無効を切り替えるときに呼ばれる関数
- `onRemove`: キーバインドを削除するときに呼ばれる関数
- `onUpdate`: キーバインドを更新するときに呼ばれる関数

#### `<InputWithKeybind ... />`

キーバインド機能付きの入力フィールドコンポーネント。標準のHTML input要素に、カスタムキーバインド機能を追加したコンポーネントです。通常のinputプロパティ（placeholder、value、onChangeなど）もすべて使用可能です。

```tsx
import { InputWithKeybind } from "@hyperbind-lib/react";
import { useState } from "react";

function SearchBox() {
  const [query, setQuery] = useState("");

  return (
    <InputWithKeybind
      placeholder="検索ワードを入力"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      triggerKey="cmd+enter"
      onKeyPress={() => {
        console.log("検索実行:", query);
      }}
    />
  );
}
```

**プロパティ:**
- すべての標準的な`<input>`要素のプロパティ
- `triggerKey`: キーの組み合わせ（デフォルト: `"Enter"`）
- `onKeyPress`: キーが押されたときに実行されるコールバック関数
- `keybindEnabled`: キーバインドを有効にするか（デフォルト: `true`）
- `preventDefault`: デフォルトのブラウザ動作を防ぐか（デフォルト: `true`）

### ユーティリティ

#### `isReservedKey(keyCombo: string): boolean`

指定されたキーの組み合わせが予約キーかどうかを判定します。

```tsx
import { isReservedKey } from "@hyperbind-lib/react";

if (isReservedKey("ctrl+s")) {
  console.log("このキーは予約されています");
}
```

#### `getReservedKeyWarning(keyCombo: string): string | null`

指定されたキーの組み合わせが予約キーの場合、警告メッセージを返します。

```tsx
import { getReservedKeyWarning } from "@hyperbind-lib/react";

const warning = getReservedKeyWarning("ctrl+s");
if (warning) {
  console.warn(warning); // "Ctrl+S はブラウザの保存機能で使用されています"
}
```

## 使用例

### 基本的なキーバインド

```tsx
import { useKeybind } from "@hyperbind-lib/react";

function App() {
  useKeybind("ctrl+s", () => {
    saveDocument();
  });

  useKeybind("ctrl+f", () => {
    openSearchDialog();
  });

  return <div>アプリケーション</div>;
}
```

### プリセットキーバインドの使用

```tsx
import { usePresetKeybind } from "@hyperbind-lib/react";

function App() {
  usePresetKeybind("common-help", () => {
    showHelpDialog();
  });

  usePresetKeybind("search-show", () => {
    openSearchDialog();
  });

  return <div>アプリケーション</div>;
}
```

### フォーム入力の効率化

```tsx
import { FormNavigator } from "@hyperbind-lib/react";
import { useRef } from "react";

function ContactForm() {
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  return (
    <form>
      <input ref={nameRef} placeholder="名前" />
      <input ref={emailRef} placeholder="メール" />
      <input ref={phoneRef} placeholder="電話" />
      <FormNavigator inputRefs={[nameRef, emailRef, phoneRef]} />
    </form>
  );
}
```

### モーダルのキーバインド制御

```tsx
import { useModalKeybind, useDisableCustomKeybindsWhileMounted } from "@hyperbind-lib/react";
import { useState } from "react";

function HelpModal() {
  const [isOpen, setIsOpen] = useState(false);

  useModalKeybind({
    keyCombo: "f1",
    onOpen: () => setIsOpen(true),
    onClose: () => setIsOpen(false),
    isOpen: isOpen,
  });

  if (!isOpen) return null;

  return <HelpDialogContent />;
}

function HelpDialogContent() {
  // モーダル内ではカスタムキーバインドを無効化（タブ移動は有効）
  useDisableCustomKeybindsWhileMounted();

  return (
    <div>
      <h2>ヘルプ</h2>
      <input placeholder="タブ移動可能" />
      <button>閉じる</button>
    </div>
  );
}
```

### カスタムキーバインド管理

```tsx
import { useCustomKeybinds, KeybindList } from "@hyperbind-lib/react";

function KeybindSettings() {
  const {
    keybinds,
    addKeybind,
    toggleKeybind,
    removeKeybind,
    updateKeybind,
  } = useCustomKeybinds({
    onTrigger: (id) => {
      console.log(`Keybind ${id} triggered!`);
    },
  });

  return (
    <div>
      <button
        onClick={() =>
          addKeybind({
            label: "カスタムアクション",
            keyCombo: "ctrl+k",
            enabled: true,
            preventDefault: true,
          })
        }
      >
        キーバインド追加
      </button>

      <KeybindList
        keybinds={keybinds}
        onToggle={toggleKeybind}
        onRemove={removeKeybind}
        onUpdate={updateKeybind}
      />
    </div>
  );
}
```

### グローバルなON/OFF切り替え

```tsx
import { useGlobalKeybindToggle } from "@hyperbind-lib/react";

function App() {
  const { isEnabled, toggle } = useGlobalKeybindToggle();

  return (
    <div>
      <button onClick={toggle}>
        {isEnabled ? "✓ キーバインド: ON" : "✗ キーバインド: OFF"}
      </button>
      {!isEnabled && (
        <div className="warning">
          ⚠️ すべてのキーバインドが無効化されています
        </div>
      )}
    </div>
  );
}
```

## クロスプラットフォーム対応

Mac と Windows/Linux のキーボードの違いを自動的に吸収します：

- Mac の `Cmd` キー（⌘）と Windows/Linux の `Ctrl` キーを統一的に扱えます
- `"ctrl+s"` または `"cmd+s"` のどちらで登録しても、両方のプラットフォームで動作します

```tsx
// "cmd+s" または "ctrl+s" のどちらでも動作
useKeybind("cmd+s", () => {
  saveDocument();
});
```

## 予約キー

ブラウザやOSで使用されるキーは予約キーとして扱われ、使用時に警告が表示されます：

- `Ctrl+S`: ブラウザの保存機能
- `Ctrl+R`, `F5`: ページのリロード
- `Ctrl+F`: ブラウザの検索機能
- `Ctrl+P`: 印刷
- その他多数

予約キーを使用する場合は、`preventDefault: true`を設定してブラウザのデフォルト動作を防ぐことを推奨します。

## ライセンス

MIT

