# リリースコマンド

変更をpushしてタグを打ってリリースするまでの一連の操作を実行します。

## 実行内容

1. 変更をステージング
2. コミット（メッセージを入力）
3. push
4. バージョンに基づいてタグを作成
5. タグをpush

## 使用方法

```bash
./scripts/release.sh
```

または、Cursorコマンドパレットから`release`を実行してください。

## 実行フロー

1. 変更があるか確認
2. すべての変更をステージング
3. コミットメッセージの入力を求める
4. コミットを実行
5. `packages/core/package.json`と`packages/react/package.json`からバージョンを取得
6. バージョンの一致を確認
7. 変更をpush
8. タグを作成（既存の場合は上書き確認）
9. タグをpush

## 注意事項

- タグは`packages/core/package.json`と`packages/react/package.json`のバージョンに基づいて作成されます
- 両方のパッケージのバージョンが一致している必要があります
- 既に同じバージョンのタグが存在する場合は、上書きするか確認されます
- コミットメッセージが空の場合はエラーになります

## 例

```bash
# リリーススクリプトを実行
./scripts/release.sh

# コミットメッセージを入力
💬 コミットメッセージを入力してください:
> Add new feature: useDisableCustomKeybindsWhileMounted

# 自動的にpushとタグ作成が実行されます
```

