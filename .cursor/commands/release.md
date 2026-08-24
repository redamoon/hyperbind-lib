# リリースコマンド

`packages/*/package.json` のバージョンを上げてコミットし、タグを打って push します。
実際の npm publish は、タグ push をトリガーに GitHub Actions（`.github/workflows/publish.yml`）が行います。

## 使用方法

```bash
./scripts/release.sh patch            # 0.2.10 -> 0.2.11
./scripts/release.sh minor            # 0.2.10 -> 0.3.0
./scripts/release.sh major            # 0.2.10 -> 1.0.0
./scripts/release.sh 0.3.0            # 明示的なバージョン指定
./scripts/release.sh patch --dry-run  # 何もせず実行内容だけ表示
```

または、Cursorコマンドパレットから`release`を実行してください（patch リリースになります）。

## 実行フロー

1. `main` ブランチかどうか確認（別ブランチの場合は中断。`RELEASE_ALLOW_BRANCH=1` で回避可能）
2. 追跡済みファイルに未コミットの変更がないか確認（ある場合は中断）
3. `git fetch --tags origin` でリモートの状態を取得し、ローカルが遅れていないか確認
4. `packages/{core,react,vue}/package.json` のバージョンが一致しているか確認
5. 次のバージョンとタグ名を決定
6. 同名タグがローカル・リモートに存在しないか確認（存在する場合は中断）
7. `pnpm install` とパッケージのビルド（`test` スクリプトがあれば実行）
8. 3 つの `package.json` のバージョンを書き換え、そのファイルだけをステージしてコミット
9. 注釈付きタグを作成
10. 確認プロンプトのうえでブランチとタグを push

## 注意事項

- バージョンは必ず引数で指定します（`patch` / `minor` / `major` / `x.y.z`）
- リポジトリの `package.json` が唯一の正です。CI はタグとの一致を検証するだけで、バージョンを書き換えません
- 既存タグの付け替え（削除して打ち直し）は行いません。公開済みバージョンを上書きしないためです
- コミット対象は 3 つの `package.json` のみです。他の変更は事前にコミットしてください
- 未追跡ファイルは警告されるだけで、リリースには含まれません
- push 前に確認プロンプトが出ます。キャンセルした場合の巻き戻し方法も表示されます

## 例

```bash
# パッチリリース（まず dry-run で確認）
./scripts/release.sh patch --dry-run
./scripts/release.sh patch
```
