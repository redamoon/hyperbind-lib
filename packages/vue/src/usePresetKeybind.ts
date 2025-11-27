import { watch, onMounted, onUnmounted } from "vue";
import { binder, getKeybindById } from "@hyperbind-lib/core";

/**
 * プリセットキーバインドを使用するVue Composable
 * 
 * プリセットIDを指定して、処理（callback）だけを定義できます。
 * キーの組み合わせとpreventDefault設定は、プリセット定義から自動的に取得されます。
 * 
 * @param presetId - プリセットキーバインドのID（例: 'common-help', 'search-show'）
 * @param callback - キー押下時に実行される関数
 * 
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { usePresetKeybind } from '@hyperbind-lib/vue';
 * 
 * // プリセットIDを指定して、処理だけを定義
 * usePresetKeybind('common-help', () => {
 *   // F1キーが押された時の処理
 *   showHelpDialog();
 * });
 * 
 * usePresetKeybind('search-show', () => {
 *   // F3キーが押された時の処理
 *   openSearchDialog();
 * });
 * </script>
 * ```
 */
export const usePresetKeybind = (presetId: string, callback: () => void) => {
  let id: string | null = null;

  watch(
    [() => presetId, () => callback],
    ([newPresetId, newCallback]) => {
      if (id) {
        binder.unregisterById(id);
        id = null;
      }

      const preset = getKeybindById(newPresetId);
      
      if (!preset) {
        console.warn(`Preset keybind with id "${newPresetId}" not found.`);
        return;
      }

      id = `preset-${newPresetId}`;
      
      binder.registerWithId(
        id,
        preset.keyCombo,
        newCallback,
        { preventDefault: preset.preventDefault }
      );
    },
    { immediate: true }
  );

  onUnmounted(() => {
    if (id) {
      binder.unregisterById(id);
    }
  });
};

