import { useEffect } from "react";
import { binder } from "@hyperbind/core";

/**
 * シンプルなキーバインドを登録するReactフック
 * 
 * コンポーネントのマウント時にキーバインドを登録し、
 * アンマウント時に自動的に解除します。
 * 
 * @param keyCombo - キーの組み合わせ（例: "ctrl+s", "cmd+k"）
 * @param callback - キー押下時に実行される関数
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   useKeybind('ctrl+s', () => {
 *     console.log('保存処理');
 *   });
 *   
 *   return <div>Ctrl+Sで保存</div>;
 * }
 * ```
 */
export const useKeybind = (keyCombo: string, callback: () => void) => {
  useEffect(() => {
    binder.register(keyCombo, callback);
    return () => binder.unregister(keyCombo);
  }, [keyCombo, callback]);
};
