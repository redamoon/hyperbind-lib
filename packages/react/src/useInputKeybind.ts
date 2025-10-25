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
  const elementRefRef = useRef(elementRef);
  callbackRef.current = onTrigger;
  elementRefRef.current = elementRef;

  useEffect(() => {
    if (!enabled) return;

    const id = `input-keybind-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // キーバインドを登録（遅延なし）
    const handleKey = () => {
      // elementRefが指定されている場合、その要素がフォーカスされている場合のみ実行
      // elementRefが指定されていない場合（全要素で発火）は常に実行
      const ref = elementRefRef.current;
      if (ref) {
        const currentElement = ref.current;
        if (currentElement && currentElement === document.activeElement) {
          callbackRef.current();
        }
        // フォーカスされていない場合は何もしない（FormNavigatorなどの他の処理に委ねる）
      } else {
        // elementRefが指定されていない場合は常に実行
        callbackRef.current();
      }
    };

    binder.registerWithId(id, keyCombo, handleKey, { preventDefault });

    return () => {
      binder.unregisterById(id);
    };
  }, [keyCombo, enabled, preventDefault]);
};
