import { useState, useEffect, useCallback } from "react";
import { binder, createKeybindId } from "@hyperbind-lib/core";

/**
 * カスタムキーバインドの設定情報
 */
export interface CustomKeybind {
  /** キーバインドの一意識別子 */
  id: string;
  /** キーバインドの表示名 */
  label: string;
  /** キーの組み合わせ（例: "ctrl+k"） */
  keyCombo: string;
  /** キーバインドの有効/無効状態 */
  enabled: boolean;
  /** デフォルトのブラウザ動作を防ぐかどうか */
  preventDefault: boolean;
}

/**
 * useCustomKeybindsフックのオプション設定
 */
export interface UseCustomKeybindsOptions {
  /** localStorageのキー名（デフォルト: "hyperbind_custom_keybinds"） */
  storageKey?: string;
  /** キーバインドが実行されたときに呼ばれる関数 */
  onTrigger?: (id: string) => void;
}

/**
 * カスタムキーバインドを管理するReactフック
 *
 * ユーザーが定義したキーバインドの追加、削除、更新、有効/無効の切り替えを提供します。
 * localStorageへの自動保存と、KeybindManagerへの登録も行います。
 *
 * @param options - カスタムキーバインドのオプション設定
 * @returns キーバインドの配列と操作関数
 *
 * @example
 * ```tsx
 * function KeybindSettings() {
 *   const {
 *     keybinds,
 *     addKeybind,
 *     removeKeybind,
 *     updateKeybind,
 *     toggleKeybind,
 *     togglePreventDefault,
 *   } = useCustomKeybinds({
 *     onTrigger: (id) => {
 *       console.log(`Keybind ${id} triggered`);
 *     },
 *   });
 *
 *   return (
 *     <div>
 *       {keybinds.map(kb => (
 *         <div key={kb.id}>{kb.label}</div>
 *       ))}
 *       <button onClick={() => addKeybind({ label: '新規', keyCombo: 'ctrl+k' })}>
 *         追加
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useCustomKeybinds = (options: UseCustomKeybindsOptions = {}) => {
  const { storageKey = "hyperbind_custom_keybinds", onTrigger } = options;

  const [keybinds, setKeybinds] = useState<CustomKeybind[]>([]);

  // LocalStorageから読み込み
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setKeybinds(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load keybinds from localStorage", e);
      }
    }
  }, [storageKey]);

  // LocalStorageに保存
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(keybinds));
  }, [keybinds, storageKey]);

  // KeybindManagerに登録
  useEffect(() => {
    keybinds.forEach((kb) => {
      binder.registerWithId(
        kb.id,
        kb.keyCombo,
        () => {
          if (onTrigger) {
            onTrigger(kb.id);
          }
        },
        { preventDefault: kb.preventDefault }
      );

      if (!kb.enabled) {
        binder.disableById(kb.id);
      }
    });

    return () => {
      keybinds.forEach((kb) => {
        binder.unregisterById(kb.id);
      });
    };
  }, [keybinds, onTrigger]);

  const addKeybind = useCallback((keybind: Omit<CustomKeybind, "id">) => {
    const newKeybind: CustomKeybind = {
      ...keybind,
      id: createKeybindId("kb"),
    };
    setKeybinds((prev) => [...prev, newKeybind]);
    return newKeybind.id;
  }, []);

  const removeKeybind = useCallback((id: string) => {
    setKeybinds((prev) => prev.filter((kb) => kb.id !== id));
  }, []);

  const updateKeybind = useCallback((id: string, updates: Partial<CustomKeybind>) => {
    setKeybinds((prev) => prev.map((kb) => (kb.id === id ? { ...kb, ...updates } : kb)));
  }, []);

  const toggleKeybind = useCallback((id: string) => {
    setKeybinds((prev) =>
      prev.map((kb) => {
        if (kb.id === id) {
          const newEnabled = !kb.enabled;
          if (newEnabled) {
            binder.enableById(id);
          } else {
            binder.disableById(id);
          }
          return { ...kb, enabled: newEnabled };
        }
        return kb;
      })
    );
  }, []);

  const togglePreventDefault = useCallback((id: string) => {
    setKeybinds((prev) =>
      prev.map((kb) => {
        if (kb.id === id) {
          const newPreventDefault = !kb.preventDefault;
          binder.setPreventDefault(id, newPreventDefault);
          return { ...kb, preventDefault: newPreventDefault };
        }
        return kb;
      })
    );
  }, []);

  return {
    keybinds,
    addKeybind,
    removeKeybind,
    updateKeybind,
    toggleKeybind,
    togglePreventDefault,
  };
};
