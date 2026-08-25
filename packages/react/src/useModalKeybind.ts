import { useEffect, useId } from "react";
import { binder, type ModalKeybindOptionsBase } from "@hyperbind-lib/core";

/**
 * useModalKeybindフックのオプション設定
 */
export interface UseModalKeybindOptions extends ModalKeybindOptionsBase {
  /** モーダルが現在開いているかどうか */
  isOpen?: boolean;
}

/**
 * モーダルやダイアログの開閉をキーバインドで制御するReactフック
 * 
 * 同じキーで開閉を切り替えるトグル動作を提供します。
 * モーダルが開いているときは`onClose`、閉じているときは`onOpen`が実行されます。
 * 
 * @param options - モーダルキーバインドのオプション設定
 * 
 * @example
 * ```tsx
 * function HelpDialog() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   
 *   useModalKeybind({
 *     keyCombo: 'f5',
 *     onOpen: () => setIsOpen(true),
 *     onClose: () => setIsOpen(false),
 *     isOpen: isOpen,
 *   });
 *   
 *   if (!isOpen) return null;
 *   
 *   return (
 *     <dialog open>
 *       <h2>ヘルプ</h2>
 *       <p>F5キーで開閉できます</p>
 *     </dialog>
 *   );
 * }
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
  // コンポーネントインスタンスごとに一意なuseId()を使う
  const uid = useId();

  useEffect(() => {
    const id = `modal-${uid}`;
    
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

    return () => {
      binder.unregisterById(id);
    };
  }, [keyCombo, onOpen, onClose, isOpen, preventDefault, uid]);
};
