import { onMounted, onUnmounted } from "vue";
import { binder } from "@hyperbind-lib/core";

/**
 * コンポーネントがマウントされている間、すべてのキーバインドを無効化するVue Composable
 * 
 * コンポーネントのマウント時にキーバインドを一時無効化し、
 * アンマウント時に自動的に解除します。
 * 
 * 参照カウント方式（binder.suspend()）を使用しているため、
 * 複数のコンポーネントが同時にこのComposableを使っていても、
 * すべてがアンマウントされるまでキーバインドは復活しません。
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
  let release: (() => void) | null = null;

  onMounted(() => {
    release = binder.suspend();
  });

  onUnmounted(() => {
    release?.();
    release = null;
  });
};
