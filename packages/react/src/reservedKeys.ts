/**
 * ブラウザや一般的なアプリケーションで予約されているキーバインド
 * これらのキーを使用すると、予期しない動作が発生する可能性があります
 */
export const RESERVED_KEYS = [
  // ブラウザのページ操作
  "f5", // リロード
  "ctrl+r", // リロード (Windows/Linux)
  "cmd+r", // リロード (Mac)
  "ctrl+shift+r", // ハードリロード
  "cmd+shift+r", // ハードリロード
  "ctrl+f5", // ハードリロード
  
  // ナビゲーション
  "ctrl+t", // 新しいタブ
  "cmd+t", // 新しいタブ
  "ctrl+w", // タブを閉じる
  "cmd+w", // タブを閉じる
  "ctrl+shift+t", // 閉じたタブを復元
  "cmd+shift+t", // 閉じたタブを復元
  "ctrl+l", // アドレスバーにフォーカス
  "cmd+l", // アドレスバーにフォーカス
  
  // フォーム操作
  "ctrl+s", // 保存
  "cmd+s", // 保存
  
  // ページ操作
  "ctrl+n", // 新しいウィンドウ
  "cmd+n", // 新しいウィンドウ
  "ctrl+shift+n", // シークレットウィンドウ
  "cmd+shift+n", // シークレットウィンドウ
  "f11", // フルスクリーン
  "escape", // キャンセル/閉じる
  
  // 検索
  "ctrl+f", // ページ内検索
  "cmd+f", // ページ内検索
  "ctrl+g", // 検索の次へ
  "cmd+g", // 検索の次へ
  "f3", // 検索
  
  // 履歴
  "ctrl+h", // 履歴
  "cmd+h", // 履歴
  "ctrl+j", // ダウンロード
  "cmd+j", // ダウンロード
  "ctrl+shift+d", // ブックマークを表示
  
  // 開発者ツール
  "f12", // 開発者ツール
  "ctrl+shift+i", // 開発者ツール
  "cmd+option+i", // 開発者ツール
  "ctrl+shift+j", // コンソール
  "cmd+option+j", // コンソール
  
  // 印刷
  "ctrl+p", // 印刷
  "cmd+p", // 印刷
  
  // コピー/ペースト
  "ctrl+a", // 全選択
  "cmd+a", // 全選択
  "ctrl+c", // コピー
  "cmd+c", // コピー
  "ctrl+v", // ペースト
  "cmd+v", // ペースト
  "ctrl+x", // 切り取り
  "cmd+x", // 切り取り
  "ctrl+z", // 元に戻す
  "cmd+z", // 元に戻す
  "ctrl+y", // やり直し
  "cmd+shift+z", // やり直し
  
  // フォールバック（既にキーバインドが登録されている場合の確認用）
];

/**
 * キーが予約されているかチェック
 */
export function isReservedKey(keyCombo: string): boolean {
  const normalized = keyCombo.toLowerCase().trim();
  
  // 完全一致をチェック
  if (RESERVED_KEYS.includes(normalized)) {
    return true;
  }
  
  // パターンマッチング（例: cmd+r は cmd+shift+r でも一致）
  const parts = normalized.split("+");
  if (parts.length >= 2) {
    const lastKey = parts[parts.length - 1];
    const modifiers = parts.slice(0, -1).sort().join("+");
    
    // 同じ修飾キーとラストキーの組み合わせをチェック
    for (const reserved of RESERVED_KEYS) {
      if (reserved.includes(lastKey) && reserved.includes(modifiers)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * 予約されたキーに対して警告メッセージを返す
 */
export function getReservedKeyWarning(keyCombo: string): string | null {
  if (isReservedKey(keyCombo)) {
    return `このキーは一般的にブラウザやアプリケーションで使用されています（例: 保存、リロード、コピーなど）。使用する場合は注意してください。`;
  }
  return null;
}
