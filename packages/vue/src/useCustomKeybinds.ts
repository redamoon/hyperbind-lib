import { ref, watch, onMounted, onUnmounted } from "vue";
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
 * useCustomKeybinds Composableのオプション設定
 */
export interface UseCustomKeybindsOptions {
  /** localStorageのキー名（デフォルト: "hyperbind_custom_keybinds"） */
  storageKey?: string;
  /** キーバインドが実行されたときに呼ばれる関数 */
  onTrigger?: (id: string) => void;
}

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
  const { storageKey = "hyperbind_custom_keybinds", onTrigger } = options;

  const keybinds = ref<CustomKeybind[]>([]);

  // LocalStorageから読み込み
  onMounted(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        keybinds.value = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load keybinds from localStorage", e);
      }
    }
  });

  // LocalStorageに保存
  watch(
    keybinds,
    (newKeybinds) => {
      localStorage.setItem(storageKey, JSON.stringify(newKeybinds));
    },
    { deep: true }
  );

  // KeybindManagerに登録
  let previousKeybinds: CustomKeybind[] = [];
  watch(
    [keybinds, () => onTrigger],
    ([newKeybinds, triggerFn], [_oldKeybinds]) => {
      // 前回のキーバインドをクリーンアップ
      previousKeybinds.forEach((kb) => {
        binder.unregisterById(kb.id);
      });

      // 新しいキーバインドを登録
      newKeybinds.forEach((kb) => {
        binder.registerWithId(
          kb.id,
          kb.keyCombo,
          () => {
            if (triggerFn) {
              triggerFn(kb.id);
            }
          },
          { preventDefault: kb.preventDefault }
        );

        if (!kb.enabled) {
          binder.disableById(kb.id);
        }
      });

      previousKeybinds = [...newKeybinds];
    },
    { immediate: true, deep: true }
  );

  // クリーンアップ
  onUnmounted(() => {
    keybinds.value.forEach((kb) => {
      binder.unregisterById(kb.id);
    });
  });

  const addKeybind = (keybind: Omit<CustomKeybind, "id">) => {
    const newKeybind: CustomKeybind = {
      ...keybind,
      id: createKeybindId("kb"),
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
    keybinds.value = keybinds.value.map((kb) => {
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
    });
  };

  const togglePreventDefault = (id: string) => {
    keybinds.value = keybinds.value.map((kb) => {
      if (kb.id === id) {
        const newPreventDefault = !kb.preventDefault;
        binder.setPreventDefault(id, newPreventDefault);
        return { ...kb, preventDefault: newPreventDefault };
      }
      return kb;
    });
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
