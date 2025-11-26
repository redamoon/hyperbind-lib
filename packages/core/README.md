# @hyperbind-lib/core

キーボードショートカットを管理するコアライブラリ。React以外の環境でも使用できます。

## インストール

```bash
npm install @hyperbind-lib/core
```

## クイックスタート

```typescript
import { binder } from '@hyperbind-lib/core';

// シンプルなキーバインド登録
binder.register('ctrl+s', () => {
  console.log('保存しました！');
});

// ID付き登録（有効/無効の切り替えが可能）
binder.registerWithId('save', 'ctrl+s', () => {
  console.log('保存しました！');
}, { preventDefault: true });
```

## 機能

### クロスプラットフォーム対応

Mac と Windows/Linux のキーボードの違いを自動的に吸収します：

- Mac の `Cmd` キー（⌘）と Windows/Linux の `Ctrl` キーを統一的に扱えます
- `"ctrl+s"` または `"cmd+s"` のどちらで登録しても、両方のプラットフォームで動作します

```typescript
// "cmd+s" または "ctrl+s" のどちらでも動作
binder.register('cmd+s', () => {
  saveData();
});
```

### プリセットキーバインド

会計処理や伝票入力など、一般的な業務アプリケーションで使用されるキーバインドのプリセットを提供します。

```typescript
import { getKeybindById, ALL_PRESET_KEYBINDS } from '@hyperbind-lib/core';

// IDでプリセットを取得
const helpKeybind = getKeybindById('common-help');
// { id: 'common-help', keyCombo: 'f1', label: 'ヘルプ', ... }

// すべてのプリセットを取得
const allPresets = ALL_PRESET_KEYBINDS;
```

## API リファレンス

### `KeybindManager`

キーバインドを管理するクラス。

#### `binder` (グローバルインスタンス)

アプリケーション全体で共有される `KeybindManager` のインスタンス。ブラウザ環境では自動的に `keydown` イベントをリスンします。

```typescript
import { binder } from '@hyperbind-lib/core';
```

#### `register(keyCombo: string, callback: () => void)`

キーバインドを登録します（シンプルな登録方法）。

**引数:**
- `keyCombo`: キーの組み合わせ（例: `"ctrl+s"`, `"cmd+k"`）
- `callback`: キー押下時に実行される関数

**例:**
```typescript
binder.register('ctrl+s', () => {
  console.log('保存処理');
});
```

#### `unregister(keyCombo: string)`

キーバインドの登録を解除します。

**引数:**
- `keyCombo`: 解除するキーの組み合わせ

**例:**
```typescript
binder.unregister('ctrl+s');
```

#### `registerWithId(id: string, keyCombo: string, callback: Callback | CallbackWithEvent, options?: { preventDefault?: boolean })`

ID付きでキーバインドを登録します（高度な登録方法）。後から有効/無効の切り替えや、`preventDefault`設定の変更が可能になります。

**引数:**
- `id`: キーバインドの一意識別子
- `keyCombo`: キーの組み合わせ（例: `"ctrl+s"`, `"cmd+k"`）
- `callback`: キー押下時に実行される関数（イベントを受け取ることも可能）
- `options.preventDefault`: デフォルトのブラウザ動作を防ぐか（デフォルト: `true`）

**戻り値:** 登録されたキーバインドのID

**例:**
```typescript
binder.registerWithId(
  'save-action',
  'ctrl+s',
  () => console.log('保存'),
  { preventDefault: true }
);

// 後から無効化
binder.disableById('save-action');
```

#### `unregisterById(id: string)`

IDを指定してキーバインドの登録を解除します。

**引数:**
- `id`: 解除するキーバインドのID

#### `enableById(id: string)`

IDを指定してキーバインドを有効化します。

#### `disableById(id: string)`

IDを指定してキーバインドを無効化します。

#### `setPreventDefault(id: string, prevent: boolean)`

IDを指定して`preventDefault`設定を変更します。

#### `getBinding(id: string): KeybindConfig | undefined`

IDを指定してキーバインド設定を取得します。

**戻り値:** キーバインド設定、見つからない場合は`undefined`

#### `getAllBindings(): KeybindConfig[]`

登録されているすべてのキーバインド設定を取得します。

**戻り値:** すべてのキーバインド設定の配列

#### `enable()`

すべてのキーバインドを有効化します。

#### `disable()`

すべてのキーバインドを無効化します。

#### `isEnabled(): boolean`

キーバインドが有効かどうかを返します。

**戻り値:** キーバインドが有効な場合は`true`

### `KeybindConfig`

キーバインドの設定情報を表すインターフェース。

```typescript
interface KeybindConfig {
  /** キーバインドの一意識別子 */
  id: string;
  /** キーの組み合わせ（例: "ctrl+s", "cmd+k"） */
  keyCombo: string;
  /** キー押下時に実行されるコールバック関数 */
  callback: Callback | CallbackWithEvent;
  /** キーバインドの有効/無効状態 */
  enabled: boolean;
  /** デフォルトのブラウザ動作を防ぐかどうか */
  preventDefault: boolean;
}
```

### プリセットキーバインド

#### `PresetKeybind`

プリセットキーバインドの型定義。

```typescript
interface PresetKeybind {
  id: string;
  keyCombo: string;
  label: string;
  category: 'ledger' | 'invoice' | 'report' | 'general' | 'common' | ...;
  description: string;
  preventDefault: boolean;
}
```

#### `ALL_PRESET_KEYBINDS: PresetKeybind[]`

すべてのプリセットキーバインドの配列。

#### `getKeybindById(id: string): PresetKeybind | undefined`

IDでプリセットキーバインドを取得します。

**引数:**
- `id`: プリセットキーバインドのID

**戻り値:** プリセットキーバインド、見つからない場合は`undefined`

#### `getKeybindsByCategory(category: PresetKeybind['category']): PresetKeybind[]`

カテゴリ別にキーバインドを取得します。

**引数:**
- `category`: カテゴリ名

**戻り値:** 指定されたカテゴリのキーバインドの配列

## 使用例

### 基本的な使用

```typescript
import { binder } from '@hyperbind-lib/core';

// 保存機能
binder.register('ctrl+s', () => {
  saveDocument();
});

// 検索機能
binder.register('ctrl+f', () => {
  openSearchDialog();
});
```

### ID付き登録と動的制御

```typescript
import { binder } from '@hyperbind-lib/core';

// ID付きで登録
const saveId = binder.registerWithId(
  'save',
  'ctrl+s',
  () => saveDocument(),
  { preventDefault: true }
);

// 一時的に無効化
binder.disableById('save');

// 再度有効化
binder.enableById('save');

// preventDefaultを変更
binder.setPreventDefault('save', false);

// 設定を取得
const config = binder.getBinding('save');
console.log(config?.enabled); // true or false
```

### プリセットキーバインドの使用

```typescript
import { binder, getKeybindById } from '@hyperbind-lib/core';

// プリセットを取得
const helpPreset = getKeybindById('common-help');
if (helpPreset) {
  // プリセットの設定で登録
  binder.registerWithId(
    'help',
    helpPreset.keyCombo,
    () => showHelpDialog(),
    { preventDefault: helpPreset.preventDefault }
  );
}
```

### グローバルな有効/無効制御

```typescript
import { binder } from '@hyperbind-lib/core';

// すべてのキーバインドを無効化（モーダル表示時など）
binder.disable();

// 再度有効化
binder.enable();

// 状態を確認
if (binder.isEnabled()) {
  console.log('キーバインドは有効です');
}
```

## ライセンス

MIT

