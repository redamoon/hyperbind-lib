/**
 * キーバインドの一意なIDを生成します
 *
 * React / Vue の各フックが登録用のIDを生成する際に共通で使用します。
 *
 * @param prefix - IDの接頭辞（例: "kb", "input-keybind"）
 * @returns 接頭辞・生成時刻・乱数を組み合わせたID
 *
 * @example
 * ```typescript
 * const id = createKeybindId("input-keybind");
 * // => "input-keybind-1717029600000-k3n1p8dq2"
 * ```
 */
export function createKeybindId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
