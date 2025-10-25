import { useRef, useEffect } from "react";
import { binder } from "@hyperbind/core";

export interface UseInputKeybindOptions {
  keyCombo?: string;
  onTrigger: () => void;
  enabled?: boolean;
  preventDefault?: boolean;
  elementRef?: React.RefObject<HTMLInputElement>;
}

/**
 * 入力フィールド専用のキーバインドフック
 * 指定されたキーが押されたときにコールバックを実行します
 * 
 * @example
 * ```tsx
 * function MyInput() {
 *   const inputRef = useRef<HTMLInputElement>(null);
 *   
 *   useInputKeybind({
 *     elementRef: inputRef,
 *     keyCombo: "Enter",
 *     onTrigger: () => {
 *       console.log("Enterが押されました！");
 *     },
 *   });
 *   
 *   return <input ref={inputRef} />;
 * }
 * ```
 */
export const useInputKeybind = ({
  keyCombo = "Enter",
  onTrigger,
  enabled = true,
  preventDefault = true,
  elementRef,
}: UseInputKeybindOptions) => {
  const callbackRef = useRef(onTrigger);
  callbackRef.current = onTrigger;

  useEffect(() => {
    if (!enabled) return;

    const id = `input-keybind-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // キーバインドを登録
    binder.registerWithId(
      id,
      keyCombo,
      () => {
        // 要素がフォーカスされている場合のみ実行
        if (!elementRef || elementRef.current === document.activeElement) {
          callbackRef.current();
        }
      },
      { preventDefault }
    );

    return () => {
      binder.unregisterById(id);
    };
  }, [keyCombo, enabled, preventDefault, elementRef]);
};
