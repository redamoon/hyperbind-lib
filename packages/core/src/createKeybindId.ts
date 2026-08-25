/**
 * 実行時に一意なキーバインドIDを生成します
 *
 * `crypto.randomUUID()`が利用できる環境ではそれを使用し、
 * 利用できない場合のみ時刻＋乱数のフォールバックを使用します。
 *
 * コンポーネントのライフサイクルに紐づくIDには、
 * React の `useId()` や Vue の `getCurrentInstance().uid` を使ってください。
 * この関数は、localStorageなどへ永続化する「データとしてのID」向けです。
 *
 * @param prefix - IDの接頭辞（例: "kb"）
 * @returns 生成されたID（例: "kb-3f2a...-..."）
 *
 * @example
 * ```typescript
 * import { createKeybindId } from '@hyperbind-lib/core';
 *
 * const id = createKeybindId('kb');
 * ```
 */
export const createKeybindId = (prefix: string): string => {
  const cryptoObj = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
    return `${prefix}-${cryptoObj.randomUUID()}`;
  }

  const random = Math.random().toString(36).slice(2, 11);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
};
