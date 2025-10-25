import React, { useEffect } from "react";
import { binder } from "@hyperbind/core";

export const FormNavigator = ({
  inputRefs,
}: {
  inputRefs: React.RefObject<HTMLInputElement>[];
}) => {
  useEffect(() => {
    const moveNext = (e?: KeyboardEvent) => {
      const active = document.activeElement;
      const index = inputRefs.findIndex((ref) => ref.current === active);
      
      // テキストエリアや複数行入力の場合は何もしない
      if (active instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (index >= 0) {
        const nextIndex = (index + 1) % inputRefs.length;
        inputRefs[nextIndex].current?.focus();
        if (e) {
          e.preventDefault();
        }
      }
    };

    const movePrev = (e?: KeyboardEvent) => {
      const active = document.activeElement;
      const index = inputRefs.findIndex((ref) => ref.current === active);
      
      // テキストエリアや複数行入力の場合は何もしない
      if (active instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (index >= 0) {
        const prevIndex = (index - 1 + inputRefs.length) % inputRefs.length;
        inputRefs[prevIndex].current?.focus();
        if (e) {
          e.preventDefault();
        }
      }
    };

    // Tab キーは通常の動作（フォーカス移動）
    binder.register("tab", () => moveNext());
    binder.register("shift+tab", () => movePrev());
    
    // Enter キーは既にID付きバインディングがない場合のみ処理
    const handleEnter = () => {
      // 入力フィールドにのみフォーカス移動を適用
      const active = document.activeElement;
      if (active instanceof HTMLInputElement && active !== document.body) {
        const nextIndex = (inputRefs.findIndex((ref) => ref.current === active) + 1) % inputRefs.length;
        inputRefs[nextIndex].current?.focus();
      }
    };

    // registerWithIdを使って、preventDefault: false で登録
    const id = `form-navigator-enter-${Date.now()}`;
    binder.registerWithId(id, "enter", handleEnter, { preventDefault: false });
    binder.registerWithId(id + "-shift", "shift+enter", handleEnter, { preventDefault: false });

    return () => {
      binder.unregister("tab");
      binder.unregister("shift+tab");
      binder.unregisterById(id);
      binder.unregisterById(id + "-shift");
    };
  }, [inputRefs]);

  return null;
};
