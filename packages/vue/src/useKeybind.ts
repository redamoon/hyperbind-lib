import { onUnmounted, toValue, watch, type MaybeRefOrGetter } from "vue";
import { binder } from "@hyperbind-lib/core";

/**
 * シンプルなキーバインドを登録するVue Composable
 * 
 * コンポーネントのマウント時にキーバインドを登録し、
 * アンマウント時に自動的に解除します。
 * 
 * `keyCombo`にref / computed / ゲッターを渡した場合は、値の変更に追従して
 * 古いキーバインドを解除し、新しいキーバインドを登録し直します。
 * 
 * @param keyCombo - キーの組み合わせ（例: "ctrl+s", "cmd+k"）。ref / computed / ゲッターも指定可能
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
export const useKeybind = (
  keyCombo: MaybeRefOrGetter<string>,
  callback: () => void
) => {
  // 実際に登録したキーを保持し、キーが変わった場合も確実に解除できるようにする
  let registeredKeyCombo: string | null = null;

  watch(
    () => toValue(keyCombo),
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
