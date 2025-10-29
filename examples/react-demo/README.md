# HyperBind React Demo

HyperBindライブラリの完全なデモアプリケーションです。受注伝票入力、フォーム入力、カスタムキーバインド管理など、実用的なキーバインドの使用例を提供します。

## 🚀 起動方法

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev

# ビルド
pnpm build
```

## 📁 プロジェクト構成

```
examples/react-demo/
├── src/
│   ├── App.tsx                    # メインアプリケーション（タブ管理）
│   ├── OrderForm.tsx              # 受注伝票入力コンポーネント
│   ├── KeyConfig.tsx              # キーバインド設定コンポーネント
│   ├── CalendarModal.tsx          # カレンダーモーダル
│   └── HelpDialog.tsx             # ヘルプダイアログ
├── order-form.html                # スタンドアロン受注伝票（Vanilla JS）
├── keybind-settings.html          # スタンドアロンキーバインド設定（Vanilla JS）
├── index.html                     # エントリーポイント
└── vite.config.ts                 # Vite設定
```

## 🎯 デモ機能

### 0. グローバルキーバインドON/OFF

画面右上に配置されたトグルボタンで、すべてのキーバインドを一括でON/OFFできます。

```tsx
const { isEnabled, toggle } = useGlobalKeybindToggle();

<button onClick={toggle}>
  {isEnabled ? "⌨️ キーバインド: ON" : "🚫 キーバインド: OFF"}
</button>
```

**機能:**
- ONの時: 緑色のボタン、すべてのキーバインドが動作
- OFFの時: 赤色のボタン、すべてのキーバインドが無効化
- OFFの時は警告バナーを表示

**使用例:**
- キーバインドが邪魔な場合に一時的に無効化
- 通常の入力作業をしたい時
- デバッグやテスト時

### 1. 受注伝票入力画面

業務システムでよく使用される受注伝票の入力画面です。キーバインドを活用した効率的な入力を実現しています。

#### 主要機能

- **取引先情報入力**: 取引先コードを入力し、⌘+Enterで検索・表示
- **商品情報入力**: 商品コードを入力し、Enterで商品情報を表示・数量入力へ移動
- **受注明細管理**: 数量を入力し、Enterで明細一覧に追加
- **ファンクションキー操作**: F2（新規）、F8（参照）、F9（削除）、F12（登録）

#### 実装のポイント

**`useInputKeybind`の使用**

特定の入力フィールドに個別のキーバインドを設定：

```tsx
const customerCodeRef = useRef<HTMLInputElement>(null);

useInputKeybind({
  elementRef: customerCodeRef,
  keyCombo: "cmd+enter",
  onTrigger: handleCustomerCodeEnter,
});
```

**ref.current.valueからの直接取得**

状態管理のタイミング問題を避けるため、`ref.current.value`から直接値を取得：

```tsx
const handleCustomerCodeEnter = useCallback(() => {
  if (customerCodeRef.current) {
    const code = customerCodeRef.current.value.trim();
    const found = CUSTOMERS.find((c) => c.code === code);
    if (found) {
      setCustomer(found);
    }
  }
}, []);
```

**クロスプラットフォーム対応**

`cmd+enter`で登録すると、MacではCommand+Enter、Windows/LinuxではCtrl+Enterで動作します。

#### データ構造

```tsx
interface Customer {
  code: string;
  name: string;
  address: string;
}

interface Product {
  code: string;
  name: string;
  price: number;
}

interface OrderItem {
  product: Product;
  quantity: number;
  amount: number;
}
```

### 2. フォーム入力デモ

`FormNavigator`を使用した入力フィールド間のスムーズな移動を実現します。

#### 実装例

```tsx
const input1 = useRef<HTMLInputElement>(null);
const input2 = useRef<HTMLInputElement>(null);
const input3 = useRef<HTMLInputElement>(null);

<FormNavigator inputRefs={[input1, input2, input3]} />
```

#### 注意点

- `FormNavigator`はEnterキーで次のフィールドへ移動します
- 管理されていないフィールドには影響しません（条件チェック付き）
- IME入力中（日本語変換中）は動作しません（`event.isComposing`チェック）

### 3. 入力専用キーバインドデモ

特定の入力フィールドにのみ反応するキーバインドのデモです。

#### `useInputKeybind`の特徴

```tsx
const searchInput = useRef<HTMLInputElement>(null);

useInputKeybind({
  elementRef: searchInput,
  keyCombo: "cmd+enter",
  onTrigger: handleSearch,
  enabled: activeTab === "keybind-demo", // タブ切り替え対応
});
```

- `elementRef`が指定されている場合、そのフィールドがフォーカスされている時のみ実行
- `enabled`オプションで動的に有効/無効を切り替え可能
- 複数のキーバインドが同じキーに登録されている場合の競合を回避

#### `InputWithKeybind`コンポーネント

`useInputKeybind`を内包したコンポーネント：

```tsx
<InputWithKeybind
  triggerKey="cmd+k"
  onKeyPress={() => console.log("⌘Kが押されました")}
  placeholder="⌘Kを押してください"
/>
```

### 4. カスタムキーバインド管理

ユーザーが独自のキーバインドを追加・管理できる機能です。

#### 実装例

```tsx
const {
  keybinds,
  addKeybind,
  removeKeybind,
  updateKeybind,
  toggleKeybind,
  togglePreventDefault,
} = useCustomKeybinds({
  storageKey: "hyperbind_demo_bindings",
  onTrigger: (id) => {
    const kb = keybinds.find((k) => k.id === id);
    alert(`${kb.label} が実行されました！`);
  },
});
```

#### 機能

- **追加**: 新しいキーバインドを動的に追加
- **削除**: 不要なキーバインドを削除
- **更新**: ラベルやキー組み合わせを変更
- **トグル**: 個別にオン/オフ切り替え
- **preventDefault制御**: ブラウザのデフォルト動作を許可/防止
- **永続化**: localStorageに自動保存
- **予約キー警告**: Ctrl+S、F5などの一般的なキーを使用すると警告表示

#### `KeybindList`コンポーネント

```tsx
<KeybindList
  keybinds={keybinds}
  onToggle={toggleKeybind}
  onTogglePreventDefault={togglePreventDefault}
  onRemove={removeKeybind}
  onUpdate={updateKeybind}
/>
```

- 各キーバインドを視覚的に表示
- 予約キーは橙色の枠で強調表示
- インラインで編集可能

### 5. モーダルキーバインド

F5キーでヘルプダイアログを開閉するデモです。

```tsx
useModalKeybind({
  keyCombo: "f5",
  onOpen: () => setShowHelp(true),
  onClose: () => setShowHelp(false),
  isOpen: showHelp,
});
```

モーダルが開いている間、他のキーバインドは自動的に無効化されます（`useDisableKeyBindsWhileMounted`）。

## 🔑 キーバインドの実装パターン

### パターン1: シンプルなグローバルキーバインド

```tsx
useKeybind("ctrl+s", () => {
  saveData();
});
```

### パターン2: 入力フィールド専用キーバインド

```tsx
const inputRef = useRef<HTMLInputElement>(null);

useInputKeybind({
  elementRef: inputRef,
  keyCombo: "enter",
  onTrigger: () => {
    // 処理
  },
});
```

### パターン3: 条件付きキーバインド

```tsx
useInputKeybind({
  elementRef: searchInput,
  keyCombo: "cmd+enter",
  onTrigger: handleSearch,
  enabled: activeTab === "search", // タブが"search"の時のみ有効
});
```

### パターン4: モーダル用キーバインド

```tsx
useModalKeybind({
  keyCombo: "f5",
  onOpen: () => setShowModal(true),
  onClose: () => setShowModal(false),
  isOpen: showModal,
});
```

### パターン5: フォームナビゲーション

```tsx
<FormNavigator inputRefs={[input1, input2, input3]} />
```

### パターン6: グローバルキーバインドON/OFF

```tsx
const { isEnabled, enable, disable, toggle } = useGlobalKeybindToggle();

// トグルボタン
<button onClick={toggle}>
  キーバインド: {isEnabled ? "ON" : "OFF"}
</button>

// 個別制御
<button onClick={enable}>有効化</button>
<button onClick={disable}>無効化</button>
```

## ⚠️ 注意事項と解決策

### 1. キーバインドの競合

**問題**: 複数のコンポーネントが同じキーに異なるアクションを登録すると、最初に登録されたものが優先される

**解決策**:
- `enabled`オプションで条件付き有効化
- `elementRef`で特定の要素にのみ反応させる
- タブやモーダルの状態に応じてキーバインドを動的に有効/無効化

### 2. IME入力との競合

**問題**: 日本語入力中にEnterキーがキーバインドとして発火してしまう

**解決策**: `event.isComposing`をチェック（`FormNavigator`で実装済み）

```tsx
if (event && event.isComposing) {
  return; // IME入力中は何もしない
}
```

### 3. 状態管理のタイミング

**問題**: `useCallback`の依存配列に状態を入れると、古い値を参照してしまう

**解決策**: `ref.current.value`から直接値を取得

```tsx
// ❌ 古い値を参照する可能性
const code = customerCode;

// ✅ 常に最新の値を取得
const code = customerCodeRef.current.value;
```

### 4. refの値と状態の同期

**問題**: 明細追加後、inputフィールドがクリアされない

**解決策**: 状態更新とref値の両方をクリア

```tsx
// 状態をクリア
setCurrentProductCode("");
setCurrentQuantity("1");

// ref値もクリア
if (productCodeRef.current) {
  productCodeRef.current.value = "";
}
if (quantityRef.current) {
  quantityRef.current.value = "1";
}
```

## 🎨 スタイリング

このデモでは、インラインスタイルを使用していますが、実際のプロジェクトでは以下のスタイリング手法を推奨します：

- CSS Modules
- Tailwind CSS
- Styled Components
- CSS-in-JS（Emotion、styled-jsx など）

## 📦 デプロイ

GitHub Pagesへのデプロイは、GitHub Actionsで自動化されています。

```yaml
# .github/workflows/deploy-demo.yml
on:
  push:
    branches:
      - main
    paths:
      - "examples/react-demo/**"
      - "packages/**"
```

`main`ブランチへのpush時、または手動トリガーでデプロイされます。

## 🔗 関連リンク

- [HyperBind Core API](../../packages/core/README.md)
- [HyperBind React API](../../packages/react/README.md)
- [GitHub Pages デモ](https://redamoon.github.io/hyperbind-lib/)

## 📝 ライセンス

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
