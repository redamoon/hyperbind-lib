/**
 * 修飾キーの正準順序
 *
 * 登録側・照合側の双方でこの順序に揃えることで、
 * `"alt+shift+n"` と `"shift+alt+n"` のような表記ゆれを同一視します。
 */
export const MODIFIER_ORDER = ["cmd", "ctrl", "shift", "alt"] as const;

/**
 * 修飾キーの別名テーブル
 *
 * `cmd` / `meta` / `command`、`ctrl` / `control`、`alt` / `option` を統一します。
 */
const MODIFIER_ALIASES: Record<string, string> = {
  cmd: "cmd",
  command: "cmd",
  meta: "cmd",
  super: "cmd",
  ctrl: "ctrl",
  control: "ctrl",
  shift: "shift",
  alt: "alt",
  option: "alt",
  opt: "alt",
};

/**
 * 通常キーの別名テーブル
 */
const KEY_ALIASES: Record<string, string> = {
  " ": "space",
  spacebar: "space",
  esc: "escape",
  del: "delete",
  ins: "insert",
  return: "enter",
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
  plus: "+",
};

/**
 * Shift + 数字で入力される記号 → 数字のマッピング（US配列）
 *
 * `event.key` は `"1"` ではなく `"!"` になるため、
 * `"shift+1"` のようなキーバインドを一致させるために使用します。
 */
export const SHIFT_SYMBOL_TO_DIGIT: Record<string, string> = {
  "!": "1",
  "@": "2",
  "#": "3",
  $: "4",
  "%": "5",
  "^": "6",
  "&": "7",
  "*": "8",
  "(": "9",
  ")": "0",
};

/**
 * `event.code` から論理キー名を求めます
 *
 * `"Digit1"` → `"1"`、`"KeyA"` → `"a"`、`"Numpad1"` → `"1"` のように変換します。
 * 対応するものがない場合は `null` を返します。
 *
 * @param code - `KeyboardEvent.code` の値
 * @returns 正規化されたキー名、変換できない場合は null
 */
export function keyFromCode(code: string | undefined): string | null {
  if (!code) return null;

  const digit = /^(?:Digit|Numpad)(\d)$/.exec(code);
  if (digit) return digit[1];

  const letter = /^Key([A-Z])$/.exec(code);
  if (letter) return letter[1].toLowerCase();

  return null;
}

/**
 * 単一のキー名を正規化します（修飾キーの別名も解決します）
 *
 * @param key - キー名（例: `"Option"`, `"ArrowUp"`, `" "`）
 * @returns 正規化されたキー名
 */
export function normalizeKeyName(key: string): string {
  const lower = key.toLowerCase();
  // スペースキー（" "）自体を潰さないよう、空白のみの場合はトリムしない
  const trimmed = lower.trim() === "" ? lower : lower.trim();
  return MODIFIER_ALIASES[trimmed] ?? KEY_ALIASES[trimmed] ?? trimmed;
}

/**
 * キーの組み合わせを正準形に正規化します
 *
 * - 小文字化し、前後の空白を除去します
 * - 修飾キーの別名（`meta`/`command` → `cmd`、`control` → `ctrl`、`option` → `alt`）を統一します
 * - 修飾キーを正準順序（cmd → ctrl → shift → alt）に並べ替え、重複を除去します
 * - 修飾キー以外のキーは最後に配置します
 *
 * @param keyCombo - キーの組み合わせ（例: `"alt+shift+n"`, `"cmd+option+i"`）
 * @returns 正規化されたキーの組み合わせ（例: `"shift+alt+n"`, `"cmd+alt+i"`）
 *
 * @example
 * ```typescript
 * normalizeKeyCombo("Alt+Shift+N");   // "shift+alt+n"
 * normalizeKeyCombo("cmd+option+i");  // "cmd+alt+i"
 * normalizeKeyCombo("shift+ctrl+s");  // "ctrl+shift+s"
 * ```
 */
export function normalizeKeyCombo(keyCombo: string): string {
  const lower = keyCombo.toLowerCase();
  if (lower === "") return "";

  // "ctrl++" のように "+" 自体がキーの場合や、"ctrl+ "（スペースキー）を考慮して分割する
  const tokens: string[] = [];
  const segments = lower.split("+");
  segments.forEach((segment, index) => {
    if (segment.trim() === "" && segment !== " ") {
      // 末尾の空セグメントは "+" キーを表す（"ctrl++" → ["ctrl", "", ""]）
      if (index === segments.length - 1 && tokens.length > 0) {
        tokens.push("+");
      }
      return;
    }
    tokens.push(segment);
  });

  // "+" 単体が渡された場合
  if (tokens.length === 0 && lower.includes("+")) {
    tokens.push("+");
  }

  const modifiers = new Set<string>();
  const keys: string[] = [];

  for (const token of tokens) {
    const normalized = normalizeKeyName(token);
    if ((MODIFIER_ORDER as readonly string[]).includes(normalized)) {
      modifiers.add(normalized);
    } else {
      keys.push(normalized);
    }
  }

  const orderedModifiers = MODIFIER_ORDER.filter((modifier) => modifiers.has(modifier));
  return [...orderedModifiers, ...keys].join("+");
}

/**
 * 正規化済みのキーの組み合わせから cmd / ctrl を入れ替えた別表現を返します
 *
 * クロスプラットフォーム対応（Mac の Cmd ↔ Windows/Linux の Ctrl）に使用します。
 * cmd と ctrl の両方を含む場合や、どちらも含まない場合は `null` を返します。
 *
 * @param normalizedCombo - `normalizeKeyCombo` で正規化済みのキーの組み合わせ
 * @returns 入れ替えた組み合わせ、入れ替えられない場合は null
 *
 * @example
 * ```typescript
 * swapCmdCtrl("cmd+s");        // "ctrl+s"
 * swapCmdCtrl("ctrl+shift+s"); // "cmd+shift+s"
 * swapCmdCtrl("cmd+ctrl+s");   // null
 * ```
 */
export function swapCmdCtrl(normalizedCombo: string): string | null {
  const parts = normalizedCombo.split("+");
  const hasCmd = parts.includes("cmd");
  const hasCtrl = parts.includes("ctrl");

  if (hasCmd === hasCtrl) return null;

  const swapped = parts.map((part) => {
    if (part === "cmd") return "ctrl";
    if (part === "ctrl") return "cmd";
    return part;
  });

  // 入れ替えによって順序が崩れるため再度正規化する
  return normalizeKeyCombo(swapped.join("+"));
}
