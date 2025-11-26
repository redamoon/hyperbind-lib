import { useEffect } from "react";
import { binder } from "hyperbind-core";

/**
 * useModalKeybindフックのオプション設定
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
  useEffect(() => {
    const id = `modal-${keyCombo}-${Date.now()}`;
    
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
  }, [keyCombo, onOpen, onClose, isOpen, preventDefault]);
};

