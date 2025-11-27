import { useEffect } from "react";
import { binder } from "@hyperbind-lib/core";

/**
 * コンポーネントがマウントされている間、カスタムキーバインドのみを無効化するReactフック
 * 
 * コンポーネントのマウント時にカスタムキーバインド（localStorageに保存されているキーバインド）を無効化し、
 * アンマウント時に自動的に再度有効化します。
 * 
 * タブ移動などの標準的なキーバインドは有効のままです。
 * 
 * モーダルやダイアログで、カスタムキーバインドの干渉を防ぎたい場合に使用します。
 * 
 * @example
 * ```tsx
 * function Modal() {
 *   // このコンポーネントがマウントされている間、
 *   // カスタムキーバインドのみが無効化される（タブ移動は有効）
 *   useDisableCustomKeybindsWhileMounted();
 *   
 *   return (
 *     <div>
 *       <input placeholder="タブ移動は可能" />
 *       <button>閉じる</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useDisableCustomKeybindsWhileMounted = () => {
  useEffect(() => {
    // localStorageからカスタムキーバインドを取得
    const storageKey = "hyperbind_custom_keybinds";
    const saved = localStorage.getItem(storageKey);
    const disabledIds: string[] = [];
    
    if (saved) {
      try {
        const customKeybinds = JSON.parse(saved);
        // カスタムキーバインドのIDを収集して無効化
        customKeybinds.forEach((kb: { id: string; enabled: boolean }) => {
          if (kb.enabled) {
            binder.disableById(kb.id);
            disabledIds.push(kb.id);
          }
        });
      } catch (e) {
        console.error("Failed to load custom keybinds from localStorage", e);
      }
    }
    
    // アンマウント時に再度有効化
    return () => {
      disabledIds.forEach((id) => {
        binder.enableById(id);
      });
    };
  }, []);
};

