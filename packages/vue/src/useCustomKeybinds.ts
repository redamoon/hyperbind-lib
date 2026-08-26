import { ref, watch, onMounted, onUnmounted } from "vue";
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
 * useCustomKeybinds Composableのオプション設定
 */
export type UseCustomKeybindsOptions = CustomKeybindsOptions;

/**
 * カスタムキーバインドを管理するVue Composable
 *
 * ユーザーが定義したキーバインドの追加、削除、更新、有効/無効の切り替えを提供します。
 * localStorageへの自動保存と、KeybindManagerへの登録も行います。
 *
 * @param options - カスタムキーバインドのオプション設定
 * @returns キーバインドの配列と操作関数
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useCustomKeybinds } from '@hyperbind-lib/vue';
 *
 * const {
 *   keybinds,
 *   addKeybind,
 *   removeKeybind,
 *   updateKeybind,
 *   toggleKeybind,
 *   togglePreventDefault,
 * } = useCustomKeybinds({
 *   onTrigger: (id) => {
 *     console.log(`Keybind ${id} triggered`);
 *   },
 * });
 * </script>
 * ```
 */
export const useCustomKeybinds = (options: UseCustomKeybindsOptions = {}) => {
  const { storageKey = DEFAULT_CUSTOM_KEYBINDS_STORAGE_KEY, onTrigger } = options;

  const keybinds = ref<CustomKeybind[]>([]);
  // 読み込み前に保存してしまうとlocalStorageを空配列で上書きしてしまうため、
  // 読み込み完了を待ってから保存する
  let loaded = false;

  // LocalStorageから読み込み
  onMounted(() => {
    keybinds.value = loadCustomKeybinds(storageKey);
    loaded = true;
  });

  // LocalStorageに保存（読み込み完了後のみ）
  watch(
    keybinds,
    (newKeybinds) => {
      if (!loaded) return;
      saveCustomKeybinds(storageKey, newKeybinds);
    },
    { deep: true }
  );

  // KeybindManagerに登録
  // enabled / preventDefault はこの登録処理がkeybindsから再現するため、
  // 各操作関数はkeybindsの更新だけを行う
  let previousKeybinds: CustomKeybind[] = [];
  watch(
    keybinds,
    (newKeybinds) => {
      // 前回のキーバインドをクリーンアップ
      unregisterCustomKeybinds(previousKeybinds);
      registerCustomKeybinds(newKeybinds, onTrigger);
      previousKeybinds = [...newKeybinds];
    },
    { immediate: true, deep: true }
  );

  // クリーンアップ
  onUnmounted(() => {
    unregisterCustomKeybinds(previousKeybinds);
    previousKeybinds = [];
  });

  const addKeybind = (keybind: Omit<CustomKeybind, "id">) => {
    const newKeybind: CustomKeybind = {
      ...keybind,
      id: createCustomKeybindId(),
    };
    keybinds.value = [...keybinds.value, newKeybind];
    return newKeybind.id;
  };

  const removeKeybind = (id: string) => {
    keybinds.value = keybinds.value.filter((kb) => kb.id !== id);
  };

  const updateKeybind = (id: string, updates: Partial<CustomKeybind>) => {
    keybinds.value = keybinds.value.map((kb) => (kb.id === id ? { ...kb, ...updates } : kb));
  };

  const toggleKeybind = (id: string) => {
    keybinds.value = keybinds.value.map((kb) =>
      kb.id === id ? { ...kb, enabled: !kb.enabled } : kb
    );
  };

  const togglePreventDefault = (id: string) => {
    keybinds.value = keybinds.value.map((kb) =>
      kb.id === id ? { ...kb, preventDefault: !kb.preventDefault } : kb
    );
  };

  return {
    keybinds,
    addKeybind,
    removeKeybind,
    updateKeybind,
    toggleKeybind,
    togglePreventDefault,
  };
};
