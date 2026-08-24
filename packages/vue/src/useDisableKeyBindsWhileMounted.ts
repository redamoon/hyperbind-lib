import { onMounted, onUnmounted } from "vue";
import { binder } from "@hyperbind-lib/core";

/**
 * コンポーネントがマウントされている間、すべてのキーバインドを無効化するVue Composable
 *
 * コンポーネントのマウント時にキーバインドを無効化し、
 * アンマウント時に自動的に再度有効化します。
 *
 * 特定のモーダルやフォームで、キーバインドの干渉を防ぎたい場合に使用します。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useDisableKeyBindsWhileMounted } from '@hyperbind-lib/vue';
 *
 * // このコンポーネントがマウントされている間、
 * // すべてのキーバインドが無効化される
 * useDisableKeyBindsWhileMounted();
 * </script>
 *
 * <template>
 *   <form>
 *     <input placeholder="キーバインドは無効です" />
 *     <button type="submit">送信</button>
 *   </form>
 * </template>
 * ```
 */
export const useDisableKeyBindsWhileMounted = () => {
  onMounted(() => {
    binder.disable();
  });

  onUnmounted(() => {
    binder.enable();
  });
};
