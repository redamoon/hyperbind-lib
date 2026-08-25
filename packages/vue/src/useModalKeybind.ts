import { onUnmounted, toValue, watch, type MaybeRefOrGetter } from "vue";
import { binder, type ModalKeybindOptionsBase } from "@hyperbind-lib/core";
import { useKeybindId } from "./useKeybindId";

/**
 * useModalKeybind Composableのオプション設定
 */
export interface UseModalKeybindOptions extends ModalKeybindOptionsBase {
  /** モーダルが現在開いているかどうか（ref / computed / ゲッターも指定可能） */
  isOpen?: MaybeRefOrGetter<boolean>;
}

/**
 * モーダルやダイアログの開閉をキーバインドで制御するVue Composable
 * 
 * 同じキーで開閉を切り替えるトグル動作を提供します。
 * モーダルが開いているときは`onClose`、閉じているときは`onOpen`が実行されます。
 * 
 * @param options - モーダルキーバインドのオプション設定
 * 
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue';
 * import { useModalKeybind } from '@hyperbind-lib/vue';
 * 
 * const isOpen = ref(false);
 * 
 * useModalKeybind({
 *   keyCombo: 'f5',
 *   onOpen: () => isOpen.value = true,
 *   onClose: () => isOpen.value = false,
 *   isOpen,
 * });
 * </script>
 * ```
 */
export const useModalKeybind = ({
  keyCombo,
  onOpen,
  onClose,
  isOpen = false,
  preventDefault = true,
}: UseModalKeybindOptions) => {
  // 同一ミリ秒内に複数マウントされてもIDが衝突しないよう、
  // コンポーネントインスタンスごとに一意な安定IDをsetup時に一度だけ生成する
  const id = useKeybindId("modal");

  watch(
    [() => keyCombo, () => onOpen, () => onClose, () => toValue(isOpen), () => preventDefault],
    ([newKeyCombo, newOnOpen, newOnClose, newIsOpen, newPreventDefault]) => {
      binder.unregisterById(id);

      binder.registerWithId(
        id,
        newKeyCombo,
        () => {
          if (newIsOpen && newOnClose) {
            newOnClose();
          } else {
            newOnOpen();
          }
        },
        { preventDefault: newPreventDefault }
      );
    },
    { immediate: true }
  );

  onUnmounted(() => {
    binder.unregisterById(id);
  });
};
