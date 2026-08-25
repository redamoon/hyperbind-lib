import { useRef, useEffect, useId } from "react";
import { binder } from "@hyperbind-lib/core";

/**
 * useInputKeybindフックのオプション設定
 */
export interface UseInputKeybindOptions {
  /** キーの組み合わせ（デフォルト: "Enter"） */
  keyCombo?: string;
  /** キー押下時に実行される関数 */
  onTrigger: () => void;
  /** キーバインドを有効にするか（デフォルト: true） */
  enabled?: boolean;
  /** デフォルトのブラウザ動作を防ぐか（デフォルト: true） */
  preventDefault?: boolean;
  /** 対象となる入力要素への参照 */
  elementRef?: React.RefObject<HTMLInputElement>;
}

/**
 * 入力フィールド専用のキーバインドフック
 * 
 * 特定の入力要素にフォーカスがある場合のみ、
 * 指定されたキーが押されたときにコールバックを実行します。
 * 
 * フォーカスされている要素のハンドラーのみが実行されるため、
 * 複数の入力要素で同じキーバインドを使用できます。
 * 
 * @param options - キーバインドのオプション設定
 * 
 * @example
 * ```tsx
 * function SearchInput() {
 *   const inputRef = useRef<HTMLInputElement>(null);
 *   
 *   useInputKeybind({
 *     elementRef: inputRef,
 *     keyCombo: "cmd+enter",
 *     onTrigger: () => {
 *       console.log("検索実行");
 *     },
 *   });
 *   
 *   return <input ref={inputRef} placeholder="検索..." />;
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

  // コンポーネントインスタンスごとに一意で、再レンダリングをまたいで安定したID
  const uid = useId();

  useEffect(() => {
    if (!enabled) return;

    const id = `input-keybind-${uid}`;
    
    // キーバインドを登録（遅延なし）
    const handleKey = (event: KeyboardEvent) => {
      // elementRefが指定されている場合、その要素がフォーカスされている場合のみ実行
      // elementRefが指定されていない場合（全要素で発火）は常に実行
      const ref = elementRefRef.current;
      if (ref) {
        const currentElement = ref.current;
        const activeElement = document.activeElement;
        if (currentElement && currentElement === activeElement) {
          // フォーカスが一致した場合のみpreventDefaultを実行
          if (preventDefault) {
            event.preventDefault();
          }
          callbackRef.current();
        }
        // フォーカスされていない場合は何もしない（FormNavigatorなどの他の処理に委ねる）
      } else {
        // elementRefが指定されていない場合は常に実行
        if (preventDefault) {
          event.preventDefault();
        }
        callbackRef.current();
      }
    };

    // preventDefault: false で登録し、ハンドラー内で条件付きでpreventDefaultを実行
    binder.registerWithId(id, keyCombo, handleKey, { preventDefault: false });

    return () => {
      binder.unregisterById(id);
    };
  }, [keyCombo, enabled, preventDefault, uid]);
};
