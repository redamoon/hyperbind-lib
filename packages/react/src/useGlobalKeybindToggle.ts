import { useState, useCallback } from "react";
import { binder } from "@hyperbind-lib/core";

/**
 * グローバルなキーバインドの有効/無効を切り替えるReactフック
 * 
 * アプリケーション全体のキーバインドを一括でON/OFFできます。
 * KeybindManagerのenable/disableメソッドをラップし、
 * Reactの状態管理と統合します。
 * 
 * @returns キーバインドの状態と操作関数
 * @returns isEnabled - キーバインドが有効かどうか
 * @returns enable - すべてのキーバインドを有効化する関数
 * @returns disable - すべてのキーバインドを無効化する関数
 * @returns toggle - キーバインドの有効/無効を切り替える関数
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { isEnabled, toggle } = useGlobalKeybindToggle();
 *   
 *   return (
 *     <div>
 *       <button onClick={toggle}>
 *         キーバインド: {isEnabled ? 'ON' : 'OFF'}
 *       </button>
 *       {!isEnabled && (
 *         <div className="warning">
 *           キーバインドが無効化されています
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export const useGlobalKeybindToggle = () => {
  const [isEnabled, setIsEnabled] = useState(() => binder.isEnabled());

  const enable = useCallback(() => {
    binder.enable();
    setIsEnabled(true);
  }, []);

  const disable = useCallback(() => {
    binder.disable();
    setIsEnabled(false);
  }, []);

  const toggle = useCallback(() => {
    if (binder.isEnabled()) {
      binder.disable();
      setIsEnabled(false);
    } else {
      binder.enable();
      setIsEnabled(true);
    }
  }, []);

  return {
    isEnabled,
    enable,
    disable,
    toggle,
  };
};

