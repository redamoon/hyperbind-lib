import { binder } from "./KeybindManager";
import { createKeybindId } from "./keybindId";

/**
 * カスタムキーバインドの設定情報
 */
export interface CustomKeybind {
  /** キーバインドの一意識別子 */
  id: string;
  /** キーバインドの表示名 */
  label: string;
  /** キーの組み合わせ（例: "ctrl+k"） */
  keyCombo: string;
  /** キーバインドの有効/無効状態 */
  enabled: boolean;
  /** デフォルトのブラウザ動作を防ぐかどうか */
  preventDefault: boolean;
}

/**
 * カスタムキーバインドのオプション設定（フレームワーク非依存）
 */
export interface CustomKeybindsOptions {
  /** localStorageのキー名（デフォルト: {@link DEFAULT_CUSTOM_KEYBINDS_STORAGE_KEY}） */
  storageKey?: string;
  /** キーバインドが実行されたときに呼ばれる関数 */
  onTrigger?: (id: string) => void;
}

/**
 * カスタムキーバインドの保存先として使用するlocalStorageの既定キー名
 */
export const DEFAULT_CUSTOM_KEYBINDS_STORAGE_KEY = "hyperbind_custom_keybinds";

/**
 * カスタムキーバインド用のIDを生成します
 *
 * @returns `kb-` から始まる一意なID
 */
export function createCustomKeybindId(): string {
  return createKeybindId("kb");
}

/**
 * localStorageからカスタムキーバインドを読み込みます
 *
 * 保存値が無い場合やJSONとして解釈できない場合は空配列を返します。
 *
 * @param storageKey - localStorageのキー名
 * @returns 読み込んだカスタムキーバインドの配列
 */
export function loadCustomKeybinds(
  storageKey: string = DEFAULT_CUSTOM_KEYBINDS_STORAGE_KEY
): CustomKeybind[] {
  if (typeof localStorage === "undefined") return [];

  const saved = localStorage.getItem(storageKey);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as CustomKeybind[]) : [];
  } catch (e) {
    console.error("Failed to load keybinds from localStorage", e);
    return [];
  }
}

/**
 * カスタムキーバインドをlocalStorageに保存します
 *
 * @param storageKey - localStorageのキー名
 * @param keybinds - 保存するカスタムキーバインドの配列
 */
export function saveCustomKeybinds(
  storageKey: string,
  keybinds: CustomKeybind[]
): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(storageKey, JSON.stringify(keybinds));
}

/**
 * カスタムキーバインドをKeybindManagerに登録します
 *
 * `enabled: false` のキーバインドは登録直後に無効化されます。
 *
 * @param keybinds - 登録するカスタムキーバインドの配列
 * @param onTrigger - キーバインドが実行されたときに呼ばれる関数
 */
export function registerCustomKeybinds(
  keybinds: CustomKeybind[],
  onTrigger?: (id: string) => void
): void {
  keybinds.forEach((kb) => {
    binder.registerWithId(
      kb.id,
      kb.keyCombo,
      () => {
        if (onTrigger) {
          onTrigger(kb.id);
        }
      },
      { preventDefault: kb.preventDefault }
    );

    if (!kb.enabled) {
      binder.disableById(kb.id);
    }
  });
}

/**
 * カスタムキーバインドの登録を解除します
 *
 * @param keybinds - 解除するカスタムキーバインドの配列
 */
export function unregisterCustomKeybinds(keybinds: CustomKeybind[]): void {
  keybinds.forEach((kb) => {
    binder.unregisterById(kb.id);
  });
}
