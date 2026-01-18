## Summary

ui-skillsレビューでexamples/reactディレクトリをレビューした結果、7つの主要なカテゴリで違反が見つかりました。

## Violations by Category

### Layout (Priority: Medium)

#### z-indexの任意値使用
- **Files**: 14 locations
  - `examples/react/src/ContractForm.tsx:449`
  - `examples/react/src/DailyReportForm.tsx:577`
  - `examples/react/src/ExpenseForm.tsx:666, 831, 905`
  - `examples/react/src/PropertyForm.tsx:444`
  - `examples/react/src/ProductForm.tsx:419`
  - `examples/react/src/CustomerForm.tsx:437`
  - `examples/react/src/OrderForm.tsx:743, 900`
  - `examples/react/src/TransferVoucher.tsx:938, 1145, 1418, 1625`
- **Issue**: 固定のz-indexスケールを使うべきです。任意値（`z-[1000]`, `z-[9999]`）は保守性を下げます。
- **Fix**: Tailwindの固定スケール（`z-10`, `z-20`, `z-30`, `z-40`, `z-50`）を使用するか、`tailwind.config.js`で固定スケールを定義してください。

```tsx
// 修正例
className="fixed bg-white border border-gray-300 rounded max-h-[150px] overflow-y-auto z-50 shadow-lg mt-1 suggestions-container"
```

### Stack (Priority: Medium)

#### インラインスタイルの多用
- **Files**: 23 files
  - `examples/react/src/pages/Home.tsx`
  - `examples/react/src/pages/SalesDashboard.tsx`
  - `examples/react/src/pages/AccountingDashboard.tsx`
  - `examples/react/src/CalendarModal.tsx`
  - `examples/react/src/HelpDialog.tsx`
  - `examples/react/src/OrderForm.tsx`
  - その他17ファイル
- **Issue**: Tailwind CSSのデフォルトを使うべきです。インラインスタイルは保守性と一貫性を下げます。
- **Fix**: インラインスタイルをTailwindクラスに置き換えてください。

```tsx
// 修正例
<div className="p-8 max-w-[1200px] mx-auto">
  <div className="mb-4 flex items-center gap-4 justify-end">
    <button 
      onClick={toggle}
      className={`px-4 py-2 text-white border-none rounded cursor-pointer font-bold ${
        isEnabled ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
      }`}
    >
```

#### cnユーティリティが使用されていない
- **Files**: Multiple locations
- **Issue**: `clsx` + `tailwind-merge`の`cn`ユーティリティを使うべきです。クラス名の競合を適切に処理できます。
- **Fix**: `cn`ユーティリティを導入し、条件付きクラス名の結合に使用してください。

```tsx
import { cn } from '@/lib/utils';

<button
  className={cn(
    "px-4 py-2 rounded-md text-lg font-bold transition-colors",
    "bg-gray-200 hover:bg-gray-300 text-gray-700",
    "focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm"
  )}
>
```

### Components (Priority: High)

#### アイコンのみボタンにaria-labelがない
- **Files**: 
  - `examples/react/src/pages/SalesDashboard.tsx:471-472`
  - `examples/react/src/pages/AccountingDashboard.tsx:122-123`
  - `examples/react/src/OrderForm.tsx:1088-1094`
- **Issue**: アイコンのみボタンには`aria-label`が必要です。スクリーンリーダーで意味が伝わりません。
- **Fix**: 
```tsx
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

### Interaction (Priority: High)

#### 破壊的アクションにAlertDialogを使用していない
- **Files**: 81 locations (`alert()`, `confirm()`使用)
  - `examples/react/src/ContractForm.tsx:271`
  - `examples/react/src/OrderForm.tsx:396`
  - `examples/react/src/JournalTab.tsx:227, 239`
  - `examples/react/src/DailyReportForm.tsx:290`
  - `examples/react/src/ExpenseForm.tsx:329`
  - `examples/react/src/PropertyForm.tsx:274`
  - `examples/react/src/ProductForm.tsx:259`
  - `examples/react/src/CustomerForm.tsx:269`
  - `examples/react/src/TransferVoucher.tsx:446`
  - その他多数
- **Issue**: 破壊的・不可逆的なアクションには`AlertDialog`を使うべきです。`confirm()`はアクセシビリティとUXが劣ります。
- **Fix**: Base UIやRadix UIの`AlertDialog`を使用してください。

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

### Typography (Priority: Low)

#### text-balance/text-pretty/tabular-nums未適用
- **Files**: Multiple locations
  - `examples/react/src/pages/Home.tsx:26`
  - `examples/react/src/OrderForm.tsx:1074`
  - その他多数
- **Issue**: 
  - 見出しには`text-balance`が必要
  - 本文には`text-pretty`が必要
  - 数値データには`tabular-nums`が必要
- **Fix**: 
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

### Performance (Priority: Low)

#### useEffectでレンダーロジックを表現できる可能性
- **Files**: `examples/react/src/OrderForm.tsx:117-121`
- **Issue**: 空のuseEffectは不要です。`useMemo`で計算済みなら削除してください。
- **Fix**: このuseEffectは削除してください。

```tsx
// 削除すべきコード
// selectedDayが変更されたときにselectedDateを更新
useEffect(() => {
  const dateStr = formatDate(selectedDay);
  // この時点ではselectedDateはuseMemoで計算されているので、直接更新は不要
}, [selectedDay]);
```

## Priority Summary

### High Priority
- [ ] アイコンのみボタンに`aria-label`を追加（全ファイル）
- [ ] 破壊的アクションに`AlertDialog`を使用（81箇所の`alert()`/`confirm()`を置き換え）

### Medium Priority
- [ ] z-indexの任意値を固定スケールに置き換え（14箇所）
- [ ] インラインスタイルをTailwindクラスに置き換え（23ファイル）
- [ ] `cn`ユーティリティの導入と使用

### Low Priority
- [ ] Typographyに`text-balance`/`text-pretty`/`tabular-nums`を適用
- [ ] 不要な`useEffect`を削除

## Related

- UI Skills: `.cursor/skills/ui-skills/SKILL.md`
- Make Issue Skill: `.cursor/skills/make-issue/SKILL.md`
