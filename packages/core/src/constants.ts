/**
 * カスタムキーバインドの保存に使われる localStorage の既定キー名
 *
 * `useCustomKeybinds` の `storageKey` オプションの既定値であり、
 * `useDisableCustomKeybindsWhileMounted` の既定値でもあります。
 *
 * @example
 * ```typescript
 * import { DEFAULT_CUSTOM_KEYBINDS_STORAGE_KEY } from '@hyperbind-lib/core';
 *
 * localStorage.getItem(DEFAULT_CUSTOM_KEYBINDS_STORAGE_KEY);
 * ```
 */
export const DEFAULT_CUSTOM_KEYBINDS_STORAGE_KEY = "hyperbind_custom_keybinds";
