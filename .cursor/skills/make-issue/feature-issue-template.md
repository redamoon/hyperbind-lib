# 機能Issue作成テンプレート

一般的な機能issueを作成する際のテンプレートです。

## Issue本文のフォーマット

```markdown
## Description

[機能の詳細な説明]

## Implementation Plan

- [ ] [実装ステップ1]
- [ ] [実装ステップ2]
- [ ] [実装ステップ3]

## Related Files

- `path/to/file1.tsx`
- `path/to/file2.tsx`

## Acceptance Criteria

- [ ] [受け入れ基準1]
- [ ] [受け入れ基準2]
- [ ] [受け入れ基準3]

## Notes

[追加の注意事項や参考情報]
```

## 使用例

### 例1: 新機能追加

```markdown
## Description

カレンダーコンポーネントを追加します。日付選択機能を提供し、既存のフォームと統合します。

## Implementation Plan

- [ ] `CalendarModal.tsx`を拡張して日付選択機能を追加
- [ ] `OrderForm.tsx`にカレンダーコンポーネントを統合
- [ ] キーバインド（Space、Alt+ArrowDown）でカレンダーを開く機能を追加
- [ ] テストを追加

## Related Files

- `examples/react/src/CalendarModal.tsx`
- `examples/react/src/OrderForm.tsx`

## Acceptance Criteria

- [ ] Spaceキーでカレンダーが開く
- [ ] 日付を選択するとフォームに反映される
- [ ] キーボード操作で日付を選択できる
- [ ] アクセシビリティ要件を満たしている

## Notes

- Base UIの`Calendar`コンポーネントを検討
- 既存の`CalendarModal`コンポーネントを拡張
```

### 例2: バグ修正

```markdown
## Description

サジェストドロップダウンの位置がスクロール時に正しく更新されない問題を修正します。

## Implementation Plan

- [ ] スクロールイベントリスナーの実装を確認
- [ ] `calculatePosition`関数の修正
- [ ] パフォーマンス最適化（デバウンスの追加）
- [ ] テストを追加

## Related Files

- `examples/react/src/OrderForm.tsx`
- `examples/react/src/CustomerForm.tsx`
- `examples/react/src/ProductForm.tsx`

## Acceptance Criteria

- [ ] スクロール時にサジェストの位置が正しく更新される
- [ ] パフォーマンスに影響がない
- [ ] すべてのフォームで動作する

## Notes

- `useEffect`の依存配列を確認
- スクロールイベントの最適化を検討
```

### 例3: リファクタリング

```markdown
## Description

インラインスタイルをTailwindクラスに置き換えて、コードの保守性を向上させます。

## Implementation Plan

- [ ] `pages/Home.tsx`のインラインスタイルをTailwindクラスに置き換え
- [ ] `pages/SalesDashboard.tsx`のインラインスタイルをTailwindクラスに置き換え
- [ ] `pages/AccountingDashboard.tsx`のインラインスタイルをTailwindクラスに置き換え
- [ ] その他のファイルを順次置き換え
- [ ] スタイルの一貫性を確認

## Related Files

- `examples/react/src/pages/Home.tsx`
- `examples/react/src/pages/SalesDashboard.tsx`
- `examples/react/src/pages/AccountingDashboard.tsx`
- その他23ファイル

## Acceptance Criteria

- [ ] すべてのインラインスタイルがTailwindクラスに置き換えられている
- [ ] 見た目が変更されていない
- [ ] コードの可読性が向上している

## Notes

- Tailwind CSSのデフォルト値を使用
- カスタム値が必要な場合は`tailwind.config.js`で定義
```

## 実行手順

1. 会話内容から機能要件を抽出
2. 実装計画と関連ファイルを特定
3. Issue本文を生成
4. `gh issue create`コマンドを実行

```bash
gh issue create \
  --title "[機能名または改善内容]" \
  --body "$(cat feature-issue-body.md)" \
  --label "enhancement"
```
