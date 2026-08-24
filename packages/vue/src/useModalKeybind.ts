import { watch, onUnmounted, toValue, type MaybeRefOrGetter } from "vue";
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
  /**
   * モーダルが現在開いているかどうか。
   *
   * `ref` / `computed` / ゲッター関数を渡すと、キー押下のたびに最新の値が読み取られ、
   * トグル動作が現在の状態を正しく反映します。
   * 素の `boolean` も受け付けますが、その場合は値が固定されるため
   * 開閉が切り替わらない点に注意してください。
   */
  isOpen?: MaybeRefOrGetter<boolean>;
  /** デフォルトのブラウザ動作を防ぐか（デフォルト: true） */
  preventDefault?: boolean;
}

/**
 * モーダルやダイアログの開閉をキーバインドで制御するVue Composable
 * 
 * 同じキーで開閉を切り替えるトグル動作を提供します。
 * モーダルが開いているときは`onClose`、閉じているときは`onOpen`が実行されます。
 * 
 * `isOpen`は`ref`・`computed`・ゲッター関数のいずれでも渡せます。
 * キー押下時に`toValue()`で最新の値を読み取るため、状態の変化がそのままトグルに反映されます。
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
  let id: string | null = null;

  watch(
    [() => keyCombo, () => onOpen, () => onClose, () => preventDefault],
    ([newKeyCombo, newOnOpen, newOnClose, newPreventDefault]) => {
      if (id) {
        binder.unregisterById(id);
        id = null;
      }

      id = `modal-${newKeyCombo}-${Date.now()}`;
      
      binder.registerWithId(
        id,
        newKeyCombo,
        () => {
          // 登録時ではなくキー押下時に読み取ることで、常に最新の開閉状態でトグルする
          if (toValue(isOpen) && newOnClose) {
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

