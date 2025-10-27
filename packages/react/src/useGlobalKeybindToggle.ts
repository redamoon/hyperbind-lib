import { useState, useCallback } from "react";
import { binder } from "@hyperbind/core";

/**
 * グローバルでキーバインドのON/OFFを切り替えるフック
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { isEnabled, enable, disable, toggle } = useGlobalKeybindToggle();
 *   
 *   return (
 *     <button onClick={toggle}>
 *       キーバインド: {isEnabled ? "ON" : "OFF"}
 *     </button>
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

