import React, { useEffect } from "react";
import { binder } from "@hyperbind/core";

/**
 * FormNavigatorコンポーネントのプロパティ
 */
interface FormNavigatorProps {
  /** フォーム内の入力要素への参照の配列 */
  inputRefs: React.RefObject<HTMLInputElement>[];
}

/**
 * フォーム内の入力フィールド間を自動的にナビゲートするコンポーネント
 * 
 * Tab/Shift+TabとEnterキーで、指定された入力フィールド間を
 * 循環的に移動できます。IME入力中の動作も適切に処理します。
 * 
 * @param props - コンポーネントのプロパティ
 * 
 * @example
 * ```tsx
 * function MyForm() {
 *   const input1 = useRef<HTMLInputElement>(null);
 *   const input2 = useRef<HTMLInputElement>(null);
 *   const input3 = useRef<HTMLInputElement>(null);
 *   
 *   return (
 *     <div>
 *       <input ref={input1} placeholder="名前" />
 *       <input ref={input2} placeholder="メール" />
 *       <input ref={input3} placeholder="電話" />
 *       <FormNavigator inputRefs={[input1, input2, input3]} />
 *     </div>
 *   );
 * }
 * ```
 */
export const FormNavigator = ({
  inputRefs,
}: FormNavigatorProps) => {
  useEffect(() => {
    // FormNavigatorは即座に登録（他のキーバインドより先）
    const moveNext = () => {
      const active = document.activeElement;
      const index = inputRefs.findIndex((ref) => ref.current === active);
      
      // テキストエリアや複数行入力の場合は何もしない
      if (active instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (index >= 0) {
        const nextIndex = (index + 1) % inputRefs.length;
        inputRefs[nextIndex].current?.focus();
      }
    };

    const movePrev = () => {
      const active = document.activeElement;
      const index = inputRefs.findIndex((ref) => ref.current === active);
      
      // テキストエリアや複数行入力の場合は何もしない
      if (active instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (index >= 0) {
        const prevIndex = (index - 1 + inputRefs.length) % inputRefs.length;
        inputRefs[prevIndex].current?.focus();
      }
    };

    // Tab キーは通常の動作（フォーカス移動）
    const idTab = `form-navigator-tab-${Date.now()}`;
    binder.registerWithId(idTab, "tab", moveNext, { preventDefault: true });
    binder.registerWithId(idTab + "-shift", "shift+tab", movePrev, { preventDefault: true });
    
    // Enter キーは管理されている要素でのみ preventDefault
    // すべての入力フィールドでEnterを処理（useInputKeybindは特定の要素にのみ反応）
    const handleEnter = (event?: KeyboardEvent) => {
      // IME入力中の場合は何もしない
      if (event && event.isComposing) {
        return;
      }
      
      const active = document.activeElement;
      
      // FormNavigatorで管理されている入力フィールドの場合のみ処理
      if (active instanceof HTMLInputElement && active !== document.body) {
        const currentIndex = inputRefs.findIndex((ref) => ref.current === active);
        if (currentIndex >= 0) {
          // FormNavigatorで管理されている要素なので移動
          if (event) {
            event.preventDefault();
          }
          const nextIndex = (currentIndex + 1) % inputRefs.length;
          inputRefs[nextIndex].current?.focus();
        }
        // FormNavigatorで管理されていない要素（searchInputなど）の場合は何もしない
      }
    };

    const idEnter = `form-navigator-enter-${Date.now()}`;
    binder.registerWithId(idEnter, "enter", handleEnter as any, { preventDefault: false });

    return () => {
      binder.unregisterById(idTab);
      binder.unregisterById(idTab + "-shift");
      binder.unregisterById(idEnter);
    };
  }, [inputRefs]);

  return null;
};
