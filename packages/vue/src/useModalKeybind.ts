import { onUnmounted } from "vue";
import { binder, createKeybindId, type ModalKeybindOptions } from "@hyperbind-lib/core";

/**
 * useModalKeybind Composableのオプション設定
 */
export type UseModalKeybindOptions = ModalKeybindOptions;

/**
 * モーダルやダイアログの開閉をキーバインドで制御するVue Composable
 * 
 * 同じキーで開閉を切り替えるトグル動作を提供します。
 * モーダルが開いているときは`onClose`、閉じているときは`onOpen`が実行されます。
 * 
 * `isOpen`はsetup時の値で固定されます。開閉状態をリアクティブに反映したい場合は、
 * `onOpen` / `onClose`の中で現在の状態を参照してトグルしてください。
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
 *   isOpen: isOpen.value,
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
  const id = createKeybindId(`modal-${keyCombo}`);

  binder.registerWithId(
    id,
    keyCombo,
    () => {
      if (isOpen && onClose) {
        onClose();
      } else {
        onOpen();
      }
    },
    { preventDefault }
  );

  onUnmounted(() => {
    binder.unregisterById(id);
  });
};
