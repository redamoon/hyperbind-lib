# Make Issue コマンド

GitHubのissueを作成します。ui-skillsレビュー結果からissueを作成する場合と、一般的な機能issueを作成する場合の2つのモードがあります。

## 使用方法

### UI Skillsレビュー結果からIssue作成

```bash
/make-issue ui-skills
```

または、Cursorコマンドパレットから`make-issue`を実行し、ui-skillsレビュー結果がある場合は自動的に検出します。

### 一般的な機能Issue作成

```bash
/make-issue feature "機能のタイトル" "機能の説明"
```

または、会話の内容から機能issueを作成する場合は、通常の会話で「issueを作成してください」と依頼してください。

## 実行内容

### UI Skillsレビュー結果モード

1. 現在の会話で行われたui-skillsレビュー結果を収集
2. レビュー結果を基にGitHubのissueを作成
3. issueのタイトル、本文、ラベルを自動生成

### 機能Issueモード

1. 会話内容から機能要件を抽出
2. 機能の説明、実装方針、関連ファイルを整理
3. GitHubのissueを作成

## 前提条件

- GitHub CLI (`gh`)がインストールされていること
- GitHub CLIで認証済みであること
- リポジトリがGitHubに接続されていること

## 作成されるIssueの内容

### UI Skillsレビュー結果モード

- **タイトル**: ui-skillsレビュー結果の要約
- **本文**: 違反箇所の詳細リストと修正案
- **ラベル**: `enhancement`, `help wanted`など（既存のラベルを使用）

### 機能Issueモード

- **タイトル**: 機能名または改善内容
- **本文**: 機能の説明、実装方針、関連ファイル、チェックリスト
- **ラベル**: `enhancement`など（既存のラベルを使用）

## 例

### UI Skillsレビュー結果からIssue作成

```bash
# make-issueコマンドを実行（ui-skillsレビュー結果がある場合）
/make-issue

# レビュー結果を基にissueが作成されます
# Issue #123: Fix UI Skills violations in examples/react
```

### 機能Issue作成

```bash
# 機能issueを作成
/make-issue feature "カレンダーコンポーネントの追加" "日付選択用のカレンダーコンポーネントを追加します"

# または、会話で依頼
# 「カレンダーコンポーネントを追加するissueを作成してください」
```
