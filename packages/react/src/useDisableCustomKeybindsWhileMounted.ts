import { useEffect } from "react";
import { binder, DEFAULT_CUSTOM_KEYBINDS_STORAGE_KEY } from "@hyperbind-lib/core";

/**
 * useDisableCustomKeybindsWhileMountedフックのオプション設定
 */
export interface UseDisableCustomKeybindsWhileMountedOptions {
  /** localStorageのキー名（デフォルト: "hyperbind_custom_keybinds"） */
  storageKey?: string;
}

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
 * `useCustomKeybinds` で `storageKey` を変更している場合は、
 * このフックにも同じ `storageKey` を渡してください。
 *
 * @param options - オプション設定
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
 *
 * @example
 * ```tsx
 * // useCustomKeybinds で storageKey を変更している場合
 * useDisableCustomKeybindsWhileMounted({ storageKey: "my_app_keybinds" });
 * ```
 */
export const useDisableCustomKeybindsWhileMounted = (
  options: UseDisableCustomKeybindsWhileMountedOptions = {}
) => {
  const { storageKey = DEFAULT_CUSTOM_KEYBINDS_STORAGE_KEY } = options;

  useEffect(() => {
    // localStorageからカスタムキーバインドを取得
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
  }, [storageKey]);
};
