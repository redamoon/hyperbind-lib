import React, { useEffect } from "react";
import { binder } from "@hyperbind/core";

export const FormNavigator = ({
  inputRefs,
}: {
  inputRefs: React.RefObject<HTMLInputElement>[];
}) => {
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
    
    // Enter キーは preventDefault: true でブラウザのデフォルト動作を無効化
    // すべての入力フィールドでEnterを処理（useInputKeybindは特定の要素にのみ反応）
    const handleEnter = () => {
      const active = document.activeElement;
      
      // FormNavigatorで管理されている入力フィールドの場合のみ処理
      if (active instanceof HTMLInputElement && active !== document.body) {
        const currentIndex = inputRefs.findIndex((ref) => ref.current === active);
        if (currentIndex >= 0) {
          // FormNavigatorで管理されている要素なので移動
          const nextIndex = (currentIndex + 1) % inputRefs.length;
          inputRefs[nextIndex].current?.focus();
        }
        // FormNavigatorで管理されていない要素（searchInputなど）の場合は何もしない
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
