# @hyperbind-lib/vue

Vue 3アプリケーションでキーボードショートカットを簡単に実装するためのComposablesとコンポーネントライブラリ。

## インストール

```bash
npm install @hyperbind-lib/vue
```

**前提条件:**
- Vue 3.0.0以上
- `@hyperbind-lib/core`（自動的にインストールされます）

## クイックスタート

```vue
<script setup lang="ts">
import { useKeybind } from "@hyperbind-lib/vue";

useKeybind("ctrl+s", () => {
  console.log("保存しました！");
});
</script>

<template>
  <div>Ctrl+S で保存</div>
</template>
```

## 機能一覧

### Composables

#### `useKeybind(keyCombo: string, callback: () => void)`

シンプルなキーバインドを登録するComposable。コンポーネントのマウント時に登録し、アンマウント時に自動的に解除します。

```vue
<script setup lang="ts">
import { useKeybind } from "@hyperbind-lib/vue";

useKeybind("ctrl+s", () => {
  saveDocument();
});
</script>
```

**引数:**
- `keyCombo`: キーの組み合わせ（例: `"ctrl+s"`, `"cmd+k"`, `"f1"`）
- `callback`: キー押下時に実行される関数

#### `usePresetKeybind(presetId: string, callback: () => void)`

プリセットキーバインドを使用するComposable。プリセットIDを指定するだけで、キーの組み合わせとpreventDefault設定が自動的に適用されます。

```vue
<script setup lang="ts">
import { usePresetKeybind } from "@hyperbind-lib/vue";

// F1キーでヘルプを表示（プリセット定義から自動取得）
usePresetKeybind("common-help", () => {
  showHelpDialog();
});

// F3キーで検索を開く
usePresetKeybind("search-show", () => {
  openSearchDialog();
});
</script>
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

入力フィールド専用のキーバインドComposable。特定の入力要素にフォーカスがある場合のみ実行されます。

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useInputKeybind } from "@hyperbind-lib/vue";

const inputRef = ref<HTMLInputElement | null>(null);

useInputKeybind({
  elementRef: inputRef,
  keyCombo: "cmd+enter",
  onTrigger: () => {
    console.log("検索実行");
  },
});
</script>

<template>
  <input ref="inputRef" placeholder="検索..." />
</template>
```

**オプション:**
- `elementRef`: 対象となる入力要素への参照
- `keyCombo`: キーの組み合わせ（デフォルト: `"Enter"`）
- `onTrigger`: キー押下時に実行される関数
- `enabled`: キーバインドを有効にするか（デフォルト: `true`）
- `preventDefault`: デフォルトのブラウザ動作を防ぐか（デフォルト: `true`）

#### `useCustomKeybinds(options?: UseCustomKeybindsOptions)`

カスタムキーバインドを管理するComposable。ユーザーが定義したキーバインドの追加、削除、更新、有効/無効の切り替えを提供します。localStorageへの自動保存も行います。

```vue
<script setup lang="ts">
import { useCustomKeybinds, KeybindList } from "@hyperbind-lib/vue";

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
</script>

<template>
  <div>
    <button
      @click="
        addKeybind({
          label: '新しいアクション',
          keyCombo: 'ctrl+k',
          enabled: true,
          preventDefault: true,
        })
      "
    >
      キーバインド追加
    </button>

    <KeybindList
      :keybinds="keybinds"
      :on-toggle="toggleKeybind"
      :on-toggle-prevent-default="togglePreventDefault"
      :on-remove="removeKeybind"
      :on-update="updateKeybind"
    />
  </div>
</template>
```

**戻り値:**
- `keybinds`: キーバインドの配列（ref）
- `addKeybind`: キーバインドを追加する関数
- `removeKeybind`: キーバインドを削除する関数
- `updateKeybind`: キーバインドを更新する関数
- `toggleKeybind`: キーバインドの有効/無効を切り替える関数
- `togglePreventDefault`: preventDefaultの有効/無効を切り替える関数

**オプション:**
- `storageKey`: localStorageのキー名（デフォルト: `"hyperbind_custom_keybinds"`）
- `onTrigger`: キーバインドが実行されたときに呼ばれる関数

#### `useModalKeybind(options: UseModalKeybindOptions)`

モーダルやダイアログの開閉をキーバインドで制御するComposable。同じキーで開閉を切り替えるトグル動作を提供します。

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useModalKeybind } from "@hyperbind-lib/vue";

const isOpen = ref(false);

useModalKeybind({
  keyCombo: "f1",
  onOpen: () => (isOpen.value = true),
  onClose: () => (isOpen.value = false),
  isOpen: isOpen.value,
});
</script>

<template>
  <dialog v-if="isOpen" open>
    <h2>ヘルプ</h2>
    <p>F1キーで開閉できます</p>
    <button @click="isOpen = false">閉じる</button>
  </dialog>
</template>
```

**オプション:**
- `keyCombo`: キーの組み合わせ（例: `"f1"`, `"escape"`）
- `onOpen`: モーダルを開くときに実行される関数
- `onClose`: モーダルを閉じるときに実行される関数（省略可能）
- `isOpen`: モーダルが現在開いているかどうか（デフォルト: `false`）
- `preventDefault`: デフォルトのブラウザ動作を防ぐか（デフォルト: `true`）

#### `useGlobalKeybindToggle()`

すべてのキーバインドをグローバルにON/OFFするComposable。

```vue
<script setup lang="ts">
import { useGlobalKeybindToggle } from "@hyperbind-lib/vue";

const { isEnabled, enable, disable, toggle } = useGlobalKeybindToggle();
</script>

<template>
  <div>
    <button @click="toggle">
      キーバインド: {{ isEnabled ? "ON" : "OFF" }}
    </button>
    <p v-if="!isEnabled">⚠️ すべてのキーバインドが無効化されています</p>
  </div>
</template>
```

**戻り値:**
- `isEnabled`: キーバインドが有効かどうか（ref）
- `enable`: キーバインドを有効化する関数
- `disable`: キーバインドを無効化する関数
- `toggle`: キーバインドの有効/無効を切り替える関数

#### `useDisableKeyBindsWhileMounted()`

コンポーネントがマウントされている間、すべてのキーバインドを無効化するComposable。モーダルやフォームで、キーバインドの干渉を防ぎたい場合に使用します。

```vue
<script setup lang="ts">
import { useDisableKeyBindsWhileMounted } from "@hyperbind-lib/vue";

// このコンポーネントがマウントされている間、
// すべてのキーバインドが無効化される
useDisableKeyBindsWhileMounted();
</script>

<template>
  <form>
    <input placeholder="キーバインドは無効です" />
    <button type="submit">送信</button>
  </form>
</template>
```

#### `useDisableCustomKeybindsWhileMounted()`

コンポーネントがマウントされている間、カスタムキーバインドのみを無効化するComposable。タブ移動などの標準的なキーバインドは有効のままです。モーダルやダイアログで、カスタムキーバインドの干渉を防ぎたい場合に使用します。

```vue
<script setup lang="ts">
import { useDisableCustomKeybindsWhileMounted } from "@hyperbind-lib/vue";

// このコンポーネントがマウントされている間、
// カスタムキーバインドのみが無効化される（タブ移動は有効）
useDisableCustomKeybindsWhileMounted();
</script>

<template>
  <div>
    <input placeholder="タブ移動は可能" />
    <button>閉じる</button>
  </div>
</template>
```

### コンポーネント

#### `<FormNavigator :input-refs="Ref<HTMLInputElement>[]" />`

フォーム内の入力フィールド間を自動的にナビゲートするコンポーネント。Tab/Shift+TabとEnterキーで、指定された入力フィールド間を循環的に移動できます。IME入力中の動作も適切に処理します。

```vue
<script setup lang="ts">
import { ref } from "vue";
import { FormNavigator } from "@hyperbind-lib/vue";

const input1 = ref<HTMLInputElement | null>(null);
const input2 = ref<HTMLInputElement | null>(null);
const input3 = ref<HTMLInputElement | null>(null);
</script>

<template>
  <div>
    <input ref="input1" placeholder="名前" />
    <input ref="input2" placeholder="メール" />
    <input ref="input3" placeholder="電話" />
    <FormNavigator :input-refs="[input1, input2, input3]" />
  </div>
</template>
```

**プロパティ:**
- `inputRefs`: フォーム内の入力要素への参照の配列

**動作:**
- `Tab`キー: 次のフィールドへ移動
- `Shift+Tab`キー: 前のフィールドへ移動
- `Enter`キー: 次のフィールドへ移動（テキストエリアの場合は無効）

#### `<KeyRecorder v-model="string" />`

キーボード入力を記録するコンポーネント。ユーザーがキーを押すと、その組み合わせ（"ctrl+s"など）を記録します。予約キー（ブラウザやOSで使用されるキー）の使用時には警告を表示します。

```vue
<script setup lang="ts">
import { ref } from "vue";
import { KeyRecorder } from "@hyperbind-lib/vue";

const keyCombo = ref("ctrl+s");
const warning = ref<string | null>(null);
</script>

<template>
  <div>
    <label>
      キーバインド:
      <KeyRecorder
        v-model="keyCombo"
        :show-warning="true"
        @warning="(w) => (warning = w)"
      />
    </label>
    <p v-if="warning" class="warning">{{ warning }}</p>
  </div>
</template>
```

**プロパティ:**
- `modelValue`: 現在のキーの組み合わせ（v-model）
- `showWarning`: 警告メッセージを表示するかどうか（デフォルト: `false`）
- `@warning`: 警告状態が変化したときに呼ばれるイベント

#### `<KeybindList :keybinds="CustomKeybind[]" ... />`

カスタムキーバインドの一覧を表示・編集するコンポーネント。各キーバインドに対して以下の操作が可能です：
- 有効/無効の切り替え
- ラベルとキーの組み合わせの編集
- preventDefaultの切り替え
- 削除

予約キーを使用している場合は、視覚的に警告を表示します。

```vue
<script setup lang="ts">
import { KeybindList, useCustomKeybinds } from "@hyperbind-lib/vue";

const {
  keybinds,
  toggleKeybind,
  togglePreventDefault,
  removeKeybind,
  updateKeybind,
} = useCustomKeybinds();
</script>

<template>
  <KeybindList
    :keybinds="keybinds"
    :on-toggle="toggleKeybind"
    :on-toggle-prevent-default="togglePreventDefault"
    :on-remove="removeKeybind"
    :on-update="updateKeybind"
  />
</template>
```

**プロパティ:**
- `keybinds`: 表示するキーバインドの配列
- `onToggle`: キーバインドの有効/無効を切り替えるときに呼ばれる関数
- `onTogglePreventDefault`: preventDefaultの有効/無効を切り替えるときに呼ばれる関数
- `onRemove`: キーバインドを削除するときに呼ばれる関数
- `onUpdate`: キーバインドを更新するときに呼ばれる関数

#### `<InputWithKeybind ... />`

キーバインド機能付きの入力フィールドコンポーネント。標準のHTML input要素に、カスタムキーバインド機能を追加したコンポーネントです。通常のinputプロパティ（placeholder、value、@inputなど）もすべて使用可能です。

```vue
<script setup lang="ts">
import { ref } from "vue";
import { InputWithKeybind } from "@hyperbind-lib/vue";

const query = ref("");
</script>

<template>
  <InputWithKeybind
    placeholder="検索ワードを入力"
    v-model="query"
    trigger-key="cmd+enter"
    @key-press="() => console.log('検索実行:', query)"
  />
</template>
```

**プロパティ:**
- すべての標準的な`<input>`要素のプロパティ
- `triggerKey`: キーの組み合わせ（デフォルト: `"Enter"`）
- `@keyPress`: キーが押されたときに実行されるイベント
- `keybindEnabled`: キーバインドを有効にするか（デフォルト: `true`）
- `preventDefault`: デフォルトのブラウザ動作を防ぐか（デフォルト: `true`）

### ユーティリティ

#### `isReservedKey(keyCombo: string): boolean`

指定されたキーの組み合わせが予約キーかどうかを判定します。

```typescript
import { isReservedKey } from "@hyperbind-lib/vue";

if (isReservedKey("ctrl+s")) {
  console.log("このキーは予約されています");
}
```

#### `getReservedKeyWarning(keyCombo: string): string | null`

指定されたキーの組み合わせが予約キーの場合、警告メッセージを返します。

```typescript
import { getReservedKeyWarning } from "@hyperbind-lib/vue";

const warning = getReservedKeyWarning("ctrl+s");
if (warning) {
  console.warn(warning); // "Ctrl+S はブラウザの保存機能で使用されています"
}
```

## 使用例

### 基本的なキーバインド

```vue
<script setup lang="ts">
import { useKeybind } from "@hyperbind-lib/vue";

useKeybind("ctrl+s", () => {
  saveDocument();
});

useKeybind("ctrl+f", () => {
  openSearchDialog();
});
</script>
```

### プリセットキーバインドの使用

```vue
<script setup lang="ts">
import { usePresetKeybind } from "@hyperbind-lib/vue";

usePresetKeybind("common-help", () => {
  showHelpDialog();
});

usePresetKeybind("search-show", () => {
  openSearchDialog();
});
</script>
```

### フォーム入力の効率化

```vue
<script setup lang="ts">
import { ref } from "vue";
import { FormNavigator } from "@hyperbind-lib/vue";

const nameRef = ref<HTMLInputElement | null>(null);
const emailRef = ref<HTMLInputElement | null>(null);
const phoneRef = ref<HTMLInputElement | null>(null);
</script>

<template>
  <form>
    <input ref="nameRef" placeholder="名前" />
    <input ref="emailRef" placeholder="メール" />
    <input ref="phoneRef" placeholder="電話" />
    <FormNavigator :input-refs="[nameRef, emailRef, phoneRef]" />
  </form>
</template>
```

### モーダルのキーバインド制御

```vue
<script setup lang="ts">
import { ref } from "vue";
import {
  useModalKeybind,
  useDisableCustomKeybindsWhileMounted,
} from "@hyperbind-lib/vue";

const isOpen = ref(false);

useModalKeybind({
  keyCombo: "f1",
  onOpen: () => (isOpen.value = true),
  onClose: () => (isOpen.value = false),
  isOpen: isOpen.value,
});
</script>

<template>
  <div v-if="isOpen">
    <HelpDialogContent />
  </div>
</template>
```

```vue
<!-- HelpDialogContent.vue -->
<script setup lang="ts">
import { useDisableCustomKeybindsWhileMounted } from "@hyperbind-lib/vue";

// モーダル内ではカスタムキーバインドを無効化（タブ移動は有効）
useDisableCustomKeybindsWhileMounted();
</script>

<template>
  <div>
    <h2>ヘルプ</h2>
    <input placeholder="タブ移動可能" />
    <button>閉じる</button>
  </div>
</template>
```

### カスタムキーバインド管理

```vue
<script setup lang="ts">
import { useCustomKeybinds, KeybindList } from "@hyperbind-lib/vue";

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
</script>

<template>
  <div>
    <button
      @click="
        addKeybind({
          label: 'カスタムアクション',
          keyCombo: 'ctrl+k',
          enabled: true,
          preventDefault: true,
        })
      "
    >
      キーバインド追加
    </button>

    <KeybindList
      :keybinds="keybinds"
      :on-toggle="toggleKeybind"
      :on-remove="removeKeybind"
      :on-update="updateKeybind"
    />
  </div>
</template>
```

### グローバルなON/OFF切り替え

```vue
<script setup lang="ts">
import { useGlobalKeybindToggle } from "@hyperbind-lib/vue";

const { isEnabled, toggle } = useGlobalKeybindToggle();
</script>

<template>
  <div>
    <button @click="toggle">
      {{ isEnabled ? "✓ キーバインド: ON" : "✗ キーバインド: OFF" }}
    </button>
    <div v-if="!isEnabled" class="warning">
      ⚠️ すべてのキーバインドが無効化されています
    </div>
  </div>
</template>
```

## クロスプラットフォーム対応

Mac と Windows/Linux のキーボードの違いを自動的に吸収します：

- Mac の `Cmd` キー（⌘）と Windows/Linux の `Ctrl` キーを統一的に扱えます
- `"ctrl+s"` または `"cmd+s"` のどちらで登録しても、両方のプラットフォームで動作します

```vue
<script setup lang="ts">
// "cmd+s" または "ctrl+s" のどちらでも動作
useKeybind("cmd+s", () => {
  saveDocument();
});
</script>
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

