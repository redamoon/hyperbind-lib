import { onUnmounted, watch } from "vue";
import { binder } from "@hyperbind-lib/core";

/**
 * シンプルなキーバインドを登録するVue Composable
 *
 * コンポーネントのマウント時にキーバインドを登録し、
 * アンマウント時に自動的に解除します。
 *
 * @param keyCombo - キーの組み合わせ（例: "ctrl+s", "cmd+k"）
 * @param callback - キー押下時に実行される関数
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useKeybind } from '@hyperbind-lib/vue';
 *
 * useKeybind('ctrl+s', () => {
 *   console.log('保存処理');
 * });
 * </script>
 * ```
 */
export const useKeybind = (keyCombo: string, callback: () => void) => {
  watch(
    [() => keyCombo, () => callback],
    ([newKeyCombo, newCallback], [oldKeyCombo]) => {
      if (oldKeyCombo) {
        binder.unregister(oldKeyCombo);
      }
      binder.register(newKeyCombo, newCallback);
    },
    { immediate: true }
  );

  onUnmounted(() => {
    binder.unregister(keyCombo);
  });
};
