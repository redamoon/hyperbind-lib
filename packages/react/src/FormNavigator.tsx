import React, { useEffect } from "react";
import { binder } from "@hyperbind/core";

export const FormNavigator = ({
  inputRefs,
}: {
  inputRefs: React.RefObject<HTMLInputElement>[];
}) => {
  useEffect(() => {
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
    
    // Enter キーは preventDefault: true でブラウザのデフォルト動作を無効化
    // useInputKeybindの処理より優先するために、登録前に処理
    const handleEnter = () => {
      // IME入力中は既にCheck済みなので、この時点では無視
      
      // 入力フィールドにのみフォーカス移動を適用
      const active = document.activeElement;
      if (active instanceof HTMLInputElement && active !== document.body) {
        const nextIndex = (inputRefs.findIndex((ref) => ref.current === active) + 1) % inputRefs.length;
        inputRefs[nextIndex].current?.focus();
      }
    };

    const idEnter = `form-navigator-enter-${Date.now()}`;
    binder.registerWithId(idEnter, "enter", handleEnter, { preventDefault: true });

    return () => {
      binder.unregisterById(idTab);
      binder.unregisterById(idTab + "-shift");
      binder.unregisterById(idEnter);
    };
  }, [inputRefs]);

  return null;
};
