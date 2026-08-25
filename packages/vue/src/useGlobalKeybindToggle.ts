import { ref } from "vue";
import { binder } from "@hyperbind-lib/core";

/**
 * グローバルなキーバインドの有効/無効を切り替えるVue Composable
 *
 * アプリケーション全体のキーバインドを一括でON/OFFできます。
 * KeybindManagerのenable/disableメソッドをラップし、
 * Vueの状態管理と統合します。
 *
 * @returns キーバインドの状態と操作関数
 * @returns isEnabled - キーバインドが有効かどうか
 * @returns enable - すべてのキーバインドを有効化する関数
 * @returns disable - すべてのキーバインドを無効化する関数
 * @returns toggle - キーバインドの有効/無効を切り替える関数
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useGlobalKeybindToggle } from '@hyperbind-lib/vue';
 *
 * const { isEnabled, toggle } = useGlobalKeybindToggle();
 * </script>
 *
 * <template>
 *   <div>
 *     <button @click="toggle">
 *       キーバインド: {{ isEnabled ? 'ON' : 'OFF' }}
 *     </button>
 *     <div v-if="!isEnabled" class="warning">
 *       キーバインドが無効化されています
 *     </div>
 *   </div>
 * </template>
 * ```
 */
export const useGlobalKeybindToggle = () => {
  const isEnabled = ref(binder.isEnabled());

  const enable = () => {
    binder.enable();
    isEnabled.value = true;
  };

  const disable = () => {
    binder.disable();
    isEnabled.value = false;
  };

  const toggle = () => {
    if (binder.isEnabled()) {
      binder.disable();
      isEnabled.value = false;
    } else {
      binder.enable();
      isEnabled.value = true;
    }
  };

  return {
    isEnabled,
    enable,
    disable,
    toggle,
  };
};
