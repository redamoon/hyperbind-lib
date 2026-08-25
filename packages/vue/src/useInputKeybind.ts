import { onUnmounted, watch } from "vue";
import {
  binder,
  registerFocusGuardedKeybind,
  type InputKeybindOptionsBase,
} from "@hyperbind-lib/core";
import { useKeybindId } from "./useKeybindId";

/**
 * useInputKeybind Composableのオプション設定
 */
export interface UseInputKeybindOptions extends InputKeybindOptionsBase {
  /** 対象となる入力要素への参照 */
  elementRef?: { value: HTMLInputElement | null };
}

/**
 * 入力フィールド専用のキーバインドComposable
 * 
 * 特定の入力要素にフォーカスがある場合のみ、
 * 指定されたキーが押されたときにコールバックを実行します。
 * 
 * フォーカスされている要素のハンドラーのみが実行されるため、
 * 複数の入力要素で同じキーバインドを使用できます。
 * 
 * @param options - キーバインドのオプション設定
 * 
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue';
 * import { useInputKeybind } from '@hyperbind-lib/vue';
 * 
 * const inputRef = ref<HTMLInputElement | null>(null);
 * 
 * useInputKeybind({
 *   elementRef: inputRef,
 *   keyCombo: "cmd+enter",
 *   onTrigger: () => {
 *     console.log("検索実行");
 *   },
 * });
 * </script>
 * 
 * <template>
 *   <input ref="inputRef" placeholder="検索..." />
 * </template>
 * ```
 */
export const useInputKeybind = ({
  keyCombo = "Enter",
  onTrigger,
  enabled = true,
  preventDefault = true,
  elementRef,
}: UseInputKeybindOptions) => {
  // コンポーネントインスタンスごとに一意で、watchの再実行をまたいで安定したID
  const id = useKeybindId("input-keybind");

  watch(
    [() => keyCombo, () => enabled, () => preventDefault],
    ([newKeyCombo, newEnabled, newPreventDefault]) => {
      binder.unregisterById(id);

      if (!newEnabled) return;

      registerFocusGuardedKeybind(id, newKeyCombo, {
        // elementRefが指定されていない場合はundefinedを返し、フォーカス判定なしで実行する
        // （elementRefをref()でラップしないこと。ref(aRef)は同じrefを返すため、
        //   .valueが要素そのものになり、フォーカス判定が成立しなくなる）
        resolveElement: () => (elementRef ? elementRef.value : undefined),
        shouldPreventDefault: () => newPreventDefault,
        resolveCallback: () => onTrigger,
      });
    },
    { immediate: true }
  );

  onUnmounted(() => {
    binder.unregisterById(id);
  });
};
