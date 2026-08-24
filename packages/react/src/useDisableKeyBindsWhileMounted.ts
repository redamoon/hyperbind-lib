import { useEffect } from "react";
import { binder } from "@hyperbind-lib/core";

/**
 * コンポーネントがマウントされている間、すべてのキーバインドを無効化するReactフック
 *
 * コンポーネントのマウント時にキーバインドを無効化し、
 * アンマウント時に自動的に再度有効化します。
 *
 * 特定のモーダルやフォームで、キーバインドの干渉を防ぎたい場合に使用します。
 *
 * @example
 * ```tsx
 * function ComplexForm() {
 *   // このコンポーネントがマウントされている間、
 *   // すべてのキーバインドが無効化される
 *   useDisableKeyBindsWhileMounted();
 *
 *   return (
 *     <form>
 *       <input placeholder="キーバインドは無効です" />
 *       <button type="submit">送信</button>
 *     </form>
 *   );
 * }
 * ```
 */
export const useDisableKeyBindsWhileMounted = () => {
  useEffect(() => {
    binder.disable();
    return () => binder.enable();
  }, []);
};
