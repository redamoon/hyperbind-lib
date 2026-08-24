import { onUnmounted, unref, watch, type Ref } from "vue";
import { binder } from "@hyperbind-lib/core";

/**
 * リアクティブな値・getter・素の値のいずれかを受け取れるキーの組み合わせ
 */
export type MaybeRefKeyCombo = string | Ref<string> | (() => string);

const resolveKeyCombo = (keyCombo: MaybeRefKeyCombo): string =>
  typeof keyCombo === "function" ? keyCombo() : unref(keyCombo);

/**
 * シンプルなキーバインドを登録するVue Composable
 * 
 * コンポーネントのマウント時にキーバインドを登録し、
 * アンマウント時に自動的に解除します。
 * 
 * `keyCombo`にrefまたはgetterを渡した場合は、値の変更に追従して
 * 古いキーバインドを解除し、新しいキーバインドを登録し直します。
 * 
 * @param keyCombo - キーの組み合わせ（例: "ctrl+s", "cmd+k"）。refやgetterも指定可能
 * @param callback - キー押下時に実行される関数
 * 
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue';
 * import { useKeybind } from '@hyperbind-lib/vue';
 * 
 * useKeybind('ctrl+s', () => {
 *   console.log('保存処理');
 * });
 * 
 * // リアクティブなキーの組み合わせ
 * const saveKey = ref('ctrl+s');
 * useKeybind(saveKey, () => {
 *   console.log('保存処理');
 * });
 * </script>
 * ```
 */
export const useKeybind = (keyCombo: MaybeRefKeyCombo, callback: () => void) => {
  // 実際に登録済みのキーを保持し、キーが変わった場合も確実に解除できるようにする
  let registeredKeyCombo: string | null = null;

  watch(
    () => resolveKeyCombo(keyCombo),
    (newKeyCombo) => {
      if (registeredKeyCombo) {
        binder.unregister(registeredKeyCombo);
      }
      binder.register(newKeyCombo, callback);
      registeredKeyCombo = newKeyCombo;
    },
    { immediate: true }
  );

  onUnmounted(() => {
    if (registeredKeyCombo) {
      binder.unregister(registeredKeyCombo);
      registeredKeyCombo = null;
    }
  });
};
