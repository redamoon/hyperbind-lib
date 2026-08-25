import { ref, onMounted, onUnmounted, watch } from "vue";
import { binder } from "@hyperbind-lib/core";
import { useKeybindId } from "./useKeybindId";

/**
 * useInputKeybind Composableのオプション設定
 */
export interface UseInputKeybindOptions {
  /** キーの組み合わせ（デフォルト: "Enter"） */
  keyCombo?: string;
  /** キー押下時に実行される関数 */
  onTrigger: () => void;
  /** キーバインドを有効にするか（デフォルト: true） */
  enabled?: boolean;
  /** デフォルトのブラウザ動作を防ぐか（デフォルト: true） */
  preventDefault?: boolean;
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
  const callbackRef = ref(onTrigger);
  const elementRefRef = ref(elementRef);

  watch(() => onTrigger, (newCallback) => {
    callbackRef.value = newCallback;
  }, { immediate: true });

  watch(() => elementRef, (newRef) => {
    elementRefRef.value = newRef;
  }, { immediate: true });

  // コンポーネントインスタンスごとに一意で、watchの再実行をまたいで安定したID
  const id = useKeybindId("input-keybind");

  watch(
    [() => keyCombo, () => enabled, () => preventDefault],
    ([newKeyCombo, newEnabled, newPreventDefault]) => {
      binder.unregisterById(id);

      if (!newEnabled) return;
      
      // キーバインドを登録（遅延なし）
      const handleKey = (event: KeyboardEvent) => {
        // elementRefが指定されている場合、その要素がフォーカスされている場合のみ実行
        // elementRefが指定されていない場合（全要素で発火）は常に実行
        const ref = elementRefRef.value;
        if (ref) {
          const currentElement = ref.value;
          const activeElement = document.activeElement;
          if (currentElement && currentElement === activeElement) {
            // フォーカスが一致した場合のみpreventDefaultを実行
            if (newPreventDefault) {
              event.preventDefault();
            }
            callbackRef.value();
          }
          // フォーカスされていない場合は何もしない（FormNavigatorなどの他の処理に委ねる）
        } else {
          // elementRefが指定されていない場合は常に実行
          if (newPreventDefault) {
            event.preventDefault();
          }
          callbackRef.value();
        }
      };

      // preventDefault: false で登録し、ハンドラー内で条件付きでpreventDefaultを実行
      binder.registerWithId(id, newKeyCombo, handleKey, { preventDefault: false });
    },
    { immediate: true }
  );

  onUnmounted(() => {
    binder.unregisterById(id);
  });
};

