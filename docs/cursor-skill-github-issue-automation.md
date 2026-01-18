# Cursor SkillでGitHub Issue自動作成機能を実装

## 背景

UIコードレビューで見つかった違反をGitHubのissueとして管理したいという要望から、CursorのSkill機能を活用して、レビュー結果から自動的にissueを作成する機能を実装しました。

## 実装内容

### 1. ui-skillsレビューの実行

まず、`examples/react`ディレクトリに対してui-skillsレビューを実行しました。ui-skillsは、Tailwind CSSの使用、アクセシビリティ、パフォーマンスなど、UI開発のベストプラクティスをチェックするSkillです。

レビュー結果として、以下の7つのカテゴリで違反が見つかりました：

- **Layout**: z-indexの任意値使用（14箇所）
- **Stack**: インラインスタイルの多用（23ファイル）、cnユーティリティ未使用
- **Components**: アイコンのみボタンにaria-labelがない
- **Interaction**: 破壊的アクションにAlertDialogを使用していない（81箇所）
- **Typography**: text-balance/text-pretty/tabular-nums未適用
- **Performance**: useEffectでレンダーロジックを表現できる可能性

#### レビュー出力の詳細

実際のレビュー出力では、各違反について以下の情報が提供されました：

**Layout (Priority: Medium)**

```
#### z-indexの任意値使用
- **Files**: 14 locations
  - `examples/react/src/ContractForm.tsx:449`
  - `examples/react/src/OrderForm.tsx:743, 900`
  - その他12ファイル
- **Issue**: 固定のz-indexスケールを使うべきです。任意値（`z-[1000]`, `z-[9999]`）は保守性を下げます。
- **Fix**: Tailwindの固定スケール（`z-10`, `z-20`, `z-30`, `z-40`, `z-50`）を使用してください。
```

**Stack (Priority: Medium)**

```
#### インラインスタイルの多用
- **Files**: 23 files
  - `examples/react/src/pages/Home.tsx`
  - `examples/react/src/pages/SalesDashboard.tsx`
  - その他21ファイル
- **Issue**: Tailwind CSSのデフォルトを使うべきです。インラインスタイルは保守性と一貫性を下げます。
- **Fix**: インラインスタイルをTailwindクラスに置き換えてください。
```

**Components (Priority: High)**

```
#### アイコンのみボタンにaria-labelがない
- **Files**: 
  - `examples/react/src/pages/SalesDashboard.tsx:471-472`
  - `examples/react/src/OrderForm.tsx:1088-1094`
- **Issue**: アイコンのみボタンには`aria-label`が必要です。スクリーンリーダーで意味が伝わりません。
- **Fix**: `aria-label`属性を追加してください。
```

**Interaction (Priority: High)**

```
#### 破壊的アクションにAlertDialogを使用していない
- **Files**: 81 locations (`alert()`, `confirm()`使用)
  - `examples/react/src/ContractForm.tsx:271`
  - `examples/react/src/OrderForm.tsx:396`
  - その他79箇所
- **Issue**: 破壊的・不可逆的なアクションには`AlertDialog`を使うべきです。
- **Fix**: Base UIやRadix UIの`AlertDialog`を使用してください。
```

**Typography (Priority: Low)**

```
#### text-balance/text-pretty/tabular-nums未適用
- **Files**: Multiple locations
- **Issue**: 見出しには`text-balance`、本文には`text-pretty`、数値データには`tabular-nums`が必要です。
- **Fix**: 適切なTailwindクラスを追加してください。
```

**Performance (Priority: Low)**

```
#### useEffectでレンダーロジックを表現できる可能性
- **Files**: `examples/react/src/OrderForm.tsx:117-121`
- **Issue**: 空のuseEffectは不要です。`useMemo`で計算済みなら削除してください。
- **Fix**: このuseEffectは削除してください。
```

各違反には、ファイルパス、行番号、問題の説明、具体的な修正案が含まれており、すぐに修正作業に取り組める形式になっています。

### 2. make-issueコマンドとSkillの作成

レビュー結果をGitHubのissueとして管理するため、`make-issue`コマンドとSkillを作成しました。

#### 2つのモードを実装

1. **UI Skillsレビュー結果モード**
   - 会話履歴からui-skillsレビュー結果を抽出
   - 違反をカテゴリと優先度で分類
   - GitHubのissueを自動作成

2. **機能Issueモード**
   - 会話内容から機能要件を抽出
   - 実装計画とチェックリストを生成
   - 一般的な機能issueを作成

#### ファイル構成

```
.cursor/
├── commands/
│   └── make-issue.md          # コマンドの説明
└── skills/
    └── make-issue/
        ├── SKILL.md                    # Skill実装詳細
        ├── create-issue.md            # UI Skillsレビュー専用ガイド
        ├── feature-issue-template.md   # 機能issueテンプレート
        └── issue-body.md               # 実際のissue本文テンプレート
```

### 3. GitHub Issueの自動作成

実際に`/make-issue`コマンドを実行し、GitHub CLI（`gh`）を使用してissueを作成しました。

作成されたissue（[Issue #4](https://github.com/redamoon/hyperbind-lib/issues/4)）には、以下の内容が含まれています：

- **タイトル**: "Fix UI Skills violations in examples/react"
- **本文**: 
  - 違反のサマリー
  - カテゴリ別の違反詳細（ファイルパス、行番号、修正案を含む）
  - 優先度別のチェックリスト
- **ラベル**: 既存のラベル（`enhancement`など）を使用

### 4. 実装のポイント

#### 会話履歴からの情報抽出

Cursorの会話履歴から、ui-skillsレビュー結果を自動的に抽出します。違反のカテゴリ、ファイルパス、行番号、修正案などを構造化してissue本文に反映します。

#### 2つのモードによる柔軟性

- **UI Skillsレビュー結果モード**: コードレビュー結果をissue化
- **機能Issueモード**: 一般的な機能追加や改善のissue作成

これにより、コードレビューだけでなく、機能開発のissue作成にも活用できます。

#### GitHub CLIとの統合

`gh issue create`コマンドを使用して、コマンドラインから直接GitHubのissueを作成します。これにより、Cursor内で完結したワークフローを実現しました。

## 成果

- **自動化**: レビュー結果からissue作成まで自動化
- **構造化**: 違反をカテゴリと優先度で整理
- **再現性**: Skillとして定義することで、他のプロジェクトでも再利用可能
- **効率化**: 手動でのissue作成作業を削減

## 今後の展開

- 他のレビューツールとの統合
- issue作成時の自動ラベル付けの改善
- テンプレートの拡充

この実装により、コードレビューからissue管理まで、より効率的な開発フローを実現できました。
