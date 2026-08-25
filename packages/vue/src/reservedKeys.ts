import { normalizeKeyCombo } from "@hyperbind-lib/core";

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
 * 指定されたキーの組み合わせが予約キーかどうかをチェックします
 * 
 * ブラウザやOSで一般的に使用されているキーバインドと
 * 照合して、競合の可能性があるかを判定します。
 * 
 * @param keyCombo - チェックするキーの組み合わせ（例: "ctrl+s", "f5"）
 * @returns 予約キーの場合はtrue
 * 
 * @example
 * ```typescript
 * if (isReservedKey('ctrl+s')) {
 *   console.log('このキーはブラウザの保存機能と競合する可能性があります');
 * }
 * ```
 */
export function isReservedKey(keyCombo: string): boolean {
  // 修飾キーの順序・別名の違いを吸収するため、双方を正規化して比較する
  // （例: "cmd+option+i" と "cmd+alt+i" は同じキーバインド）
  const normalized = normalizeKeyCombo(keyCombo);
  const reservedKeys = RESERVED_KEYS.map(normalizeKeyCombo);
  
  // 完全一致をチェック
  if (reservedKeys.includes(normalized)) {
    return true;
  }
  
  // パターンマッチング（例: cmd+r は cmd+shift+r でも一致）
  const parts = normalized.split("+");
  if (parts.length >= 2) {
    const lastKey = parts[parts.length - 1];
    const modifiers = parts.slice(0, -1).sort().join("+");
    
    // 同じ修飾キーとラストキーの組み合わせをチェック
    for (const reserved of reservedKeys) {
      if (reserved.includes(lastKey) && reserved.includes(modifiers)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * 予約キーに対して警告メッセージを返します
 * 
 * 指定されたキーの組み合わせが予約キーの場合、
 * ユーザーに表示するための警告メッセージを生成します。
 * 
 * @param keyCombo - チェックするキーの組み合わせ
 * @returns 予約キーの場合は警告メッセージ、そうでない場合はnull
 * 
 * @example
 * ```typescript
 * const warning = getReservedKeyWarning('ctrl+s');
 * if (warning) {
 *   alert(warning);
 * }
 * ```
 */
export function getReservedKeyWarning(keyCombo: string): string | null {
  if (isReservedKey(keyCombo)) {
    return `このキーは一般的にブラウザやアプリケーションで使用されています（例: 保存、リロード、コピーなど）。使用する場合は注意してください。`;
  }
  return null;
}

