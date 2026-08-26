import { useRef, useEffect, useId, type RefObject } from "react";
import {
  binder,
  registerFocusGuardedKeybind,
  type InputKeybindOptionsBase,
} from "@hyperbind-lib/core";

/**
 * useInputKeybindフックのオプション設定
 */
export interface UseInputKeybindOptions extends InputKeybindOptionsBase {
  /** 対象となる入力要素への参照 */
  elementRef?: RefObject<HTMLInputElement>;
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

    registerFocusGuardedKeybind(id, keyCombo, {
      // elementRefが指定されていない場合はundefinedを返し、フォーカス判定なしで実行する
      resolveElement: () => {
        const ref = elementRefRef.current;
        return ref ? ref.current : undefined;
      },
      shouldPreventDefault: () => preventDefault,
      resolveCallback: () => callbackRef.current,
    });

    return () => {
      binder.unregisterById(id);
    };
  }, [keyCombo, enabled, preventDefault, uid]);
};
