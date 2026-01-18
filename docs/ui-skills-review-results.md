# UI Skills レビュー結果: examples/react

## 概要

`examples/react`ディレクトリに対してui-skillsレビューを実行した結果、7つのカテゴリで違反が見つかりました。

## 違反の詳細

### 1. z-indexの任意値使用（Layout違反）

**違反箇所（14箇所）:**
- `z-[1000]` が10箇所
- `z-[9999]` が4箇所

**例:**
```tsx
// OrderForm.tsx
// Lines 743-743
className="fixed bg-white border border-gray-300 rounded max-h-[150px] overflow-y-auto z-[1000] shadow-lg mt-1 suggestions-container"
```

**理由:** 固定のz-indexスケールを使うべきです。任意値は保守性を下げます。

**修正案:** Tailwindの固定スケール（`z-10`, `z-20`, `z-30`, `z-40`, `z-50`）を使用するか、`tailwind.config.js`で固定スケールを定義してください。

```tsx
// 修正例
className="fixed bg-white border border-gray-300 rounded max-h-[150px] overflow-y-auto z-50 shadow-lg mt-1 suggestions-container"
```

---

### 2. インラインスタイルの多用（Stack違反）

**違反箇所（23ファイル）:**
すべてのファイルでインラインスタイルが使用されています。

**例:**
```tsx
// Home.tsx
// Lines 9-38
<div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
  <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "1rem", justifyContent: "flex-end" }}>
    <button 
      onClick={toggle}
      style={{
        backgroundColor: isEnabled ? "#4CAF50" : "#f44336",
        color: "white",
        border: "none",
        padding: "0.5rem 1rem",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
```

**理由:** Tailwind CSSのデフォルトを使うべきです。インラインスタイルは保守性と一貫性を下げます。

**修正案:**
```tsx
// 修正例
<div className="p-8 max-w-[1200px] mx-auto">
  <div className="mb-4 flex items-center gap-4 justify-end">
    <button 
      onClick={toggle}
      className={`px-4 py-2 text-white border-none rounded cursor-pointer font-bold ${
        isEnabled ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
      }`}
      aria-label={isEnabled ? "キーバインドを無効化" : "キーバインドを有効化"}
    >
```

---

### 3. アイコンのみボタンにaria-labelがない（Components違反）

**違反箇所:**

```tsx
// SalesDashboard.tsx
// Lines 471-472
<button onClick={() => setShowCalendar(true)}>📅 カレンダー</button>
<button onClick={() => setShowHelp(true)}>❓ ヘルプ</button>
```

```tsx
// OrderForm.tsx
// Lines 1088-1094
<button
  onClick={handleInsertRow}
  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-lg font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm"
  title="行を追加"
>
  +
</button>
```

**理由:** アイコンのみボタンには`aria-label`が必要です。スクリーンリーダーで意味が伝わりません。

**修正案:**
```tsx
// 修正例
<button 
  onClick={() => setShowCalendar(true)}
  aria-label="カレンダーを開く"
  className="..."
>
  📅 カレンダー
</button>

<button
  onClick={handleInsertRow}
  aria-label="行を追加"
  title="行を追加"
  className="..."
>
  +
</button>
```

---

### 4. 破壊的アクションにAlertDialogを使用していない（Interaction違反）

**違反箇所（81箇所）:**
`alert()`と`confirm()`が多数使用されています。

**例:**
```tsx
// ContractForm.tsx
// Lines 271-271
if (confirm(`契約「${formData.contractNumber} - ${formData.tenantName}」を削除しますか？`)) {
```

```tsx
// OrderForm.tsx
// Lines 396-396
if (confirm("伝票を削除しますか？")) {
```

**理由:** 破壊的・不可逆的なアクションには`AlertDialog`を使うべきです。`confirm()`はアクセシビリティとUXが劣ります。

**修正案:** Base UIやRadix UIの`AlertDialog`を使用してください。

```tsx
// 修正例（Base UIを使用）
import { AlertDialog } from '@base-ui/react/AlertDialog';

const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

<AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
  <AlertDialog.Trigger>削除</AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Title>削除の確認</AlertDialog.Title>
    <AlertDialog.Description>
      契約「{formData.contractNumber} - {formData.tenantName}」を削除しますか？
    </AlertDialog.Description>
    <AlertDialog.Actions>
      <button onClick={() => setShowDeleteConfirm(false)}>キャンセル</button>
      <button onClick={handleDelete}>削除</button>
    </AlertDialog.Actions>
  </AlertDialog.Content>
</AlertDialog>
```

---

### 5. Typographyのベストプラクティス未適用（Typography違反）

**違反箇所:**

```tsx
// Home.tsx
// Lines 26-26
<h1>🎹 HyperBind デモ</h1>
```

```tsx
// OrderForm.tsx
// Lines 1074-1074
{formatAmount(totalAmount)}
```

**理由:**
- 見出しには`text-balance`が必要
- 本文には`text-pretty`が必要
- 数値データには`tabular-nums`が必要

**修正案:**
```tsx
// 見出し
<h1 className="text-balance">🎹 HyperBind デモ</h1>

// 本文
<p className="text-pretty">...</p>

// 数値データ
<td className="p-3 border-r border-gray-300 text-right text-gray-800 tabular-nums">
  {formatAmount(totalAmount)}
</td>
```

---

### 6. useEffectでレンダーロジックを表現できる可能性（Performance違反）

**違反箇所:**

```tsx
// OrderForm.tsx
// Lines 117-121
// selectedDayが変更されたときにselectedDateを更新
useEffect(() => {
  const dateStr = formatDate(selectedDay);
  // この時点ではselectedDateはuseMemoで計算されているので、直接更新は不要
}, [selectedDay]);
```

**理由:** 空の`useEffect`は不要です。`useMemo`で計算済みなら削除してください。

**修正案:** この`useEffect`は削除してください。

---

### 7. cnユーティリティが使用されていない（Stack違反）

**違反箇所:**
条件付きクラス名の結合で`cn`ユーティリティが使用されていません。

**例:**
```tsx
// OrderForm.tsx
// Lines 1090-1090
className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-lg font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm"
```

**理由:** `clsx` + `tailwind-merge`の`cn`ユーティリティを使うべきです。クラス名の競合を適切に処理できます。

**修正案:**
```tsx
import { cn } from '@/lib/utils'; // または適切なパス

<button
  className={cn(
    "px-4 py-2 rounded-md text-lg font-bold transition-colors",
    "bg-gray-200 hover:bg-gray-300 text-gray-700",
    "focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm"
  )}
>
```

---

## 優先度別まとめ

### 高優先度（アクセシビリティ・UX）

- [ ] アイコンのみボタンに`aria-label`を追加（全ファイル）
- [ ] 破壊的アクションに`AlertDialog`を使用（81箇所の`alert()`/`confirm()`を置き換え）

### 中優先度（保守性・一貫性）

- [ ] z-indexの任意値を固定スケールに置き換え（14箇所）
- [ ] インラインスタイルをTailwindクラスに置き換え（23ファイル）
- [ ] `cn`ユーティリティの導入と使用

### 低優先度（ベストプラクティス）

- [ ] Typographyに`text-balance`/`text-pretty`/`tabular-nums`を適用
- [ ] 不要な`useEffect`を削除

---

これらの修正により、アクセシビリティ、保守性、一貫性が向上します。
