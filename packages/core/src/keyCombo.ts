/**
 * 修飾キーそのものを表す KeyboardEvent.key の値
 *
 * Shift や Control などを単独で押した場合、KeyboardEvent.key には
 * これらの値が入ります。キーバインドとしては成立しないため、
 * 記録時には確定させずに判定する用途で使います。
 */
export const MODIFIER_KEY_NAMES = [
  "Shift",
  "Control",
  "Alt",
  "AltGraph",
  "Meta",
  "OS",
  "Super",
  "Hyper",
  "CapsLock",
  "NumLock",
  "ScrollLock",
  "Fn",
  "FnLock",
  "Symbol",
  "SymbolLock",
] as const;

const MODIFIER_KEY_SET = new Set<string>(
  MODIFIER_KEY_NAMES.map((key) => key.toLowerCase())
);

/**
 * 指定された KeyboardEvent.key が修飾キーそのものかどうかを判定します
 *
 * @param key - KeyboardEvent.key の値（例: "Shift", "a"）
 * @returns 修飾キーそのものの場合はtrue
 *
 * @example
 * ```typescript
 * isModifierKey("Shift"); // true
 * isModifierKey("s");     // false
 * ```
 */
export function isModifierKey(key: string): boolean {
  return MODIFIER_KEY_SET.has(key.toLowerCase());
}

/**
 * KeyboardEvent.key をキーバインド文字列で使う表記に正規化します
 *
 * スペースキーは "space"、それ以外は小文字に変換します。
 *
 * @param key - KeyboardEvent.key の値
 * @returns 正規化されたキー名
 *
 * @example
 * ```typescript
 * normalizeKeyName(" ");     // "space"
 * normalizeKeyName("Enter"); // "enter"
 * ```
 */
export function normalizeKeyName(key: string): string {
  return key === " " ? "space" : key.toLowerCase();
}

/**
 * 押下されている修飾キーを cmd → ctrl → shift → alt の順で返します
 *
 * @param event - キーボードイベント
 * @returns 修飾キー名の配列（例: ["cmd", "shift"]）
 *
 * @example
 * ```typescript
 * getModifierParts(event); // ["ctrl", "shift"]
 * ```
 */
export function getModifierParts(
  event: Pick<KeyboardEvent, "metaKey" | "ctrlKey" | "shiftKey" | "altKey">
): string[] {
  const parts: string[] = [];
  // Macの場合はmetaKey（Cmd）、Windows/Linuxの場合はctrlKey
  // どちらも登録時に相互変換されるため、ここでは押下されたまま並べる
  if (event.metaKey) parts.push("cmd");
  if (event.ctrlKey) parts.push("ctrl");
  if (event.shiftKey) parts.push("shift");
  if (event.altKey) parts.push("alt");
  return parts;
}

/**
 * キーボードイベントからキーバインド文字列を組み立てます
 *
 * KeybindManager の照合とキー記録UIで同じ文字列が得られるように、
 * 修飾キーの順序（cmd → ctrl → shift → alt）とキー名の正規化を共通化します。
 * 修飾キー単独の押下では修飾キーのみの文字列（例: "ctrl+shift"）を返します。
 *
 * @param event - キーボードイベント
 * @returns キーバインド文字列（例: "cmd+shift+s"）
 *
 * @example
 * ```typescript
 * buildKeyComboFromEvent(event); // "ctrl+s"
 * ```
 */
export function buildKeyComboFromEvent(event: KeyboardEvent): string {
  const parts = getModifierParts(event);

  if (!isModifierKey(event.key)) {
    parts.push(normalizeKeyName(event.key));
  }

  return parts.join("+");
}
