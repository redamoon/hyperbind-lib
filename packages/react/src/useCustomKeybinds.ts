import { useState, useEffect, useCallback } from "react";
import {
  createCustomKeybindId,
  loadCustomKeybinds,
  registerCustomKeybinds,
  saveCustomKeybinds,
  unregisterCustomKeybinds,
  DEFAULT_CUSTOM_KEYBINDS_STORAGE_KEY,
  type CustomKeybind,
  type CustomKeybindsOptions,
} from "@hyperbind-lib/core";

export type { CustomKeybind };

/**
 * useCustomKeybindsフックのオプション設定
 */
export type UseCustomKeybindsOptions = CustomKeybindsOptions;

/**
 * localStorageからの読み込み結果
 *
 * `null`は「まだ読み込んでいない」ことを表し、読み込み前の保存
 * （localStorageを空配列で上書きしてしまう）を防ぐために使用します。
 * `storageKey`を保持しているのは、storageKeyが変わった直後に
 * 前のキーのデータを新しいキーへ書き込まないようにするためです。
 */
interface LoadedKeybinds {
  storageKey: string;
  keybinds: CustomKeybind[];
}

/** 読み込み前に返す空配列（参照を固定して不要な再登録を避ける） */
const EMPTY_KEYBINDS: CustomKeybind[] = [];

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
  const { storageKey = DEFAULT_CUSTOM_KEYBINDS_STORAGE_KEY, onTrigger } = options;
  
  const [loaded, setLoaded] = useState<LoadedKeybinds | null>(null);

  // 読み込み前（および別のstorageKeyの読み込み待ち）は空配列を返す
  const keybinds =
    loaded !== null && loaded.storageKey === storageKey
      ? loaded.keybinds
      : EMPTY_KEYBINDS;

  // LocalStorageから読み込み
  useEffect(() => {
    setLoaded({ storageKey, keybinds: loadCustomKeybinds(storageKey) });
  }, [storageKey]);

  // LocalStorageに保存（読み込み完了後のみ）
  useEffect(() => {
    if (loaded === null || loaded.storageKey !== storageKey) return;
    saveCustomKeybinds(storageKey, loaded.keybinds);
  }, [loaded, storageKey]);

  // KeybindManagerに登録
  // enabled / preventDefault はこの登録処理がkeybindsから再現するため、
  // 各操作関数はstateの更新だけを行う（updater内で副作用を起こさない）
  useEffect(() => {
    registerCustomKeybinds(keybinds, onTrigger);
    return () => unregisterCustomKeybinds(keybinds);
  }, [keybinds, onTrigger]);

  const setKeybinds = useCallback(
    (updater: (prev: CustomKeybind[]) => CustomKeybind[]) => {
      setLoaded((prev) =>
        prev === null ? prev : { ...prev, keybinds: updater(prev.keybinds) }
      );
    },
    []
  );

  const addKeybind = useCallback((keybind: Omit<CustomKeybind, "id">) => {
    const newKeybind: CustomKeybind = {
      ...keybind,
      id: createCustomKeybindId(),
    };
    setKeybinds((prev) => [...prev, newKeybind]);
    return newKeybind.id;
  }, [setKeybinds]);

  const removeKeybind = useCallback((id: string) => {
    setKeybinds((prev) => prev.filter((kb) => kb.id !== id));
  }, [setKeybinds]);

  const updateKeybind = useCallback((id: string, updates: Partial<CustomKeybind>) => {
    setKeybinds((prev) =>
      prev.map((kb) => (kb.id === id ? { ...kb, ...updates } : kb))
    );
  }, [setKeybinds]);

  const toggleKeybind = useCallback((id: string) => {
    setKeybinds((prev) =>
      prev.map((kb) => (kb.id === id ? { ...kb, enabled: !kb.enabled } : kb))
    );
  }, [setKeybinds]);

  const togglePreventDefault = useCallback((id: string) => {
    setKeybinds((prev) =>
      prev.map((kb) =>
        kb.id === id ? { ...kb, preventDefault: !kb.preventDefault } : kb
      )
    );
  }, [setKeybinds]);

  return {
    keybinds,
    addKeybind,
    removeKeybind,
    updateKeybind,
    toggleKeybind,
    togglePreventDefault,
  };
};
