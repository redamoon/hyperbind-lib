# UI Skillsレビュー結果からIssue作成

**このドキュメントはui-skillsレビュー結果専用のissue作成ガイドです。**

会話履歴からui-skillsレビュー結果を抽出し、GitHubのissueを作成します。

## 注意

- このガイドは**ui-skillsレビュー結果専用**です
- 一般的な機能issueを作成する場合は、通常のissue作成プロセスを使用してください

## 抽出する情報

会話履歴から以下の情報を抽出してください：

1. **違反のカテゴリ**
   - Stack (Tailwind CSS, cn utility, etc.)
   - Components (aria-label, AlertDialog, etc.)
   - Interaction (AlertDialog, safe-area-inset, etc.)
   - Typography (text-balance, text-pretty, tabular-nums)
   - Layout (z-index scale, size-*)
   - Performance (useEffect, will-change)
   - Design (gradients, shadows)

2. **違反の詳細**
   - ファイルパス
   - 行番号
   - 違反コードのスニペット
   - 違反の理由
   - 修正案

3. **優先度**
   - High: アクセシビリティ・UX関連
   - Medium: 保守性・一貫性関連
   - Low: ベストプラクティス

## Issue本文のフォーマット

```markdown
## Summary

ui-skillsレビューで[件数]件の違反が見つかりました。

## Violations by Category

### Stack (Priority: Medium)

#### インラインスタイルの多用
- **Files**: 23 files
- **Issue**: Tailwind CSSのデフォルトを使うべきです。インラインスタイルは保守性と一貫性を下げます。
- **Fix**: インラインスタイルをTailwindクラスに置き換えてください。

#### z-indexの任意値使用
- **Files**: 14 locations
- **Issue**: 固定のz-indexスケールを使うべきです。任意値は保守性を下げます。
- **Fix**: Tailwindの固定スケール（z-10, z-20, z-30, z-40, z-50）を使用してください。

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
```

### Interaction (Priority: High)

#### 破壊的アクションにAlertDialogを使用していない
- **Files**: 81 locations (`alert()`, `confirm()`使用)
- **Issue**: 破壊的・不可逆的なアクションには`AlertDialog`を使うべきです。
- **Fix**: Base UIやRadix UIの`AlertDialog`を使用してください。

### Typography (Priority: Low)

#### text-balance/text-pretty/tabular-nums未適用
- **Files**: Multiple locations
- **Issue**: 見出しには`text-balance`、本文には`text-pretty`、数値データには`tabular-nums`が必要です。
- **Fix**: 適切なTailwindクラスを追加してください。

### Performance (Priority: Low)

#### useEffectでレンダーロジックを表現できる可能性
- **Files**: `examples/react/src/OrderForm.tsx:117-121`
- **Issue**: 空のuseEffectは不要です。
- **Fix**: このuseEffectは削除してください。

## Priority Summary

### High Priority
- [ ] アイコンのみボタンに`aria-label`を追加（全ファイル）
- [ ] 破壊的アクションに`AlertDialog`を使用（81箇所の`alert()`/`confirm()`を置き換え）

### Medium Priority
- [ ] z-indexの任意値を固定スケールに置き換え（14箇所）
- [ ] インラインスタイルをTailwindクラスに置き換え（23ファイル）

### Low Priority
- [ ] Typographyに`text-balance`/`text-pretty`/`tabular-nums`を適用
- [ ] `cn`ユーティリティの導入と使用
- [ ] 不要な`useEffect`を削除

## Related

- UI Skills: `.cursor/skills/ui-skills/SKILL.md`
```

## 実行手順

1. 会話履歴から違反を抽出
2. カテゴリと優先度で分類
3. Issue本文を生成
4. `gh issue create`コマンドを実行

```bash
gh issue create \
  --title "Fix UI Skills violations in examples/react" \
  --body "$(cat issue-body.md)" \
  --label "ui-skills,improvement,accessibility,refactoring"
```
