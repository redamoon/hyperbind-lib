import { watch, onMounted, onUnmounted } from "vue";
import { binder } from "@hyperbind-lib/core";

/**
 * useModalKeybind Composableのオプション設定
 */
export interface UseModalKeybindOptions {
  /** キーの組み合わせ（例: "f5", "escape"） */
  keyCombo: string;
  /** モーダルを開くときに実行される関数 */
  onOpen: () => void;
  /** モーダルを閉じるときに実行される関数（省略可能） */
  onClose?: () => void;
  /** モーダルが現在開いているかどうか */
  isOpen?: boolean;
  /** デフォルトのブラウザ動作を防ぐか（デフォルト: true） */
  preventDefault?: boolean;
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
  let id: string | null = null;

  watch(
    [() => keyCombo, () => onOpen, () => onClose, () => isOpen, () => preventDefault],
    ([newKeyCombo, newOnOpen, newOnClose, newIsOpen, newPreventDefault]) => {
      if (id) {
        binder.unregisterById(id);
        id = null;
      }

      id = `modal-${newKeyCombo}-${Date.now()}`;
      
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
    if (id) {
      binder.unregisterById(id);
    }
  });
};

