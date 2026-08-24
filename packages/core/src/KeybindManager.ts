import {
  MODIFIER_ORDER,
  SHIFT_SYMBOL_TO_DIGIT,
  keyFromCode,
  normalizeKeyCombo,
  normalizeKeyName,
  swapCmdCtrl,
} from "./normalizeKeyCombo";

/**
 * コールバック関数の型定義（引数なし）
 */
export type Callback = () => void;

/**
 * イベントを受け取るコールバック関数の型定義
 *
 * コールバックには常に `KeyboardEvent` が渡されます。
 * 引数を宣言しないコールバック（`() => void`）もそのまま登録できます。
 */
export type CallbackWithEvent = (event: KeyboardEvent) => void;

/**
 * キーバインドの設定情報
 */
export interface KeybindConfig {
  /** キーバインドの一意識別子 */
  id: string;
  /** キーの組み合わせ（正規化済み。例: "ctrl+s", "cmd+k"） */
  keyCombo: string;
  /** キー押下時に実行されるコールバック関数 */
  callback: CallbackWithEvent;
  /** キーバインドの有効/無効状態 */
  enabled: boolean;
  /** デフォルトのブラウザ動作を防ぐかどうか */
  preventDefault: boolean;
}

/**
 * KeybindManager の動作オプション
 */
export interface KeybindManagerOptions {
  /**
   * 修飾キーなしの単独キー（`"a"` や `"1"` など）のキーバインドを許可するか
   *
   * デフォルトは `false` です。`false` の場合、修飾キーを伴わない
   * 1文字キーの入力は無視されます（通常のテキスト入力を妨げないため）。
   * Enter / Escape / Tab / 矢印キーなどの特殊キーはこの制限を受けません。
   */
  allowSingleKeyBindings?: boolean;
}

/**
 * 旧 API（`register`）で登録されたキーバインドの内部表現
 */
interface LegacyBinding {
  callback: CallbackWithEvent;
  preventDefault: boolean;
}

/**
 * 修飾キーなしでも処理される特殊キー（正規化済みの名前）
 */
const SPECIAL_KEYS = [
  "enter",
  "escape",
  "tab",
  "backspace",
  "delete",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "home",
  "end",
  "pageup",
  "pagedown",
  "f1",
  "f2",
  "f3",
  "f4",
  "f5",
  "f6",
  "f7",
  "f8",
  "f9",
  "f10",
  "f11",
  "f12",
  "space",
];

/**
 * キーバインドを管理するクラス
 * 
 * グローバルなキーボードショートカットの登録、解除、実行を管理します。
 * Mac（Command）とWindows/Linux（Ctrl）のクロスプラットフォーム対応を提供します。
 * 
 * キーの組み合わせは登録時・照合時の双方で正規化されるため、
 * `"alt+shift+n"` と `"shift+alt+n"`、`"cmd+option+i"` と `"cmd+alt+i"` は
 * 同じキーバインドとして扱われます。
 * 
 * @example
 * ```typescript
 * import { binder } from '@hyperbind/core';
 * 
 * // シンプルな登録
 * binder.register('ctrl+s', () => console.log('保存'));
 * 
 * // ID付き登録（有効/無効の切り替えが可能）
 * binder.registerWithId('save', 'ctrl+s', () => console.log('保存'), { preventDefault: true });
 * ```
 */
export class KeybindManager {
  private bindings: Map<string, LegacyBinding> = new Map();
  private bindingsById: Map<string, KeybindConfig> = new Map();
  private enabled = true;
  private allowSingleKeyBindings: boolean;

  /**
   * @param options - 動作オプション
   */
  constructor(options: KeybindManagerOptions = {}) {
    this.allowSingleKeyBindings = options.allowSingleKeyBindings === true;
  }

  /**
   * 動作オプションを更新します
   * 
   * @param options - 更新するオプション（指定されたものだけが反映されます）
   * 
   * @example
   * ```typescript
   * // 修飾キーなしの単独キー（'a' など）のバインドを許可する
   * binder.setOptions({ allowSingleKeyBindings: true });
   * ```
   */
  setOptions(options: KeybindManagerOptions) {
    if (options.allowSingleKeyBindings !== undefined) {
      this.allowSingleKeyBindings = options.allowSingleKeyBindings === true;
    }
  }

  /**
   * 修飾キーなしの単独キーのキーバインドが許可されているかを返します
   * 
   * @returns 許可されている場合はtrue
   */
  isSingleKeyBindingAllowed(): boolean {
    return this.allowSingleKeyBindings;
  }

  /**
   * キーバインドを登録します（シンプルな登録方法）
   * 
   * @param keyCombo - キーの組み合わせ（例: "ctrl+s", "cmd+k"）
   * @param callback - キー押下時に実行される関数（`KeyboardEvent` が渡されます）
   * @param options - オプション設定
   * @param options.preventDefault - デフォルトのブラウザ動作を防ぐか（デフォルト: true）
   * 
   * @example
   * ```typescript
   * binder.register('ctrl+s', () => {
   *   console.log('保存処理');
   * });
   * 
   * // デフォルト動作を維持したまま登録
   * binder.register('enter', (event) => console.log(event), { preventDefault: false });
   * ```
   */
  register(
    keyCombo: string,
    callback: Callback | CallbackWithEvent,
    options: { preventDefault?: boolean } = {}
  ) {
    const normalized = normalizeKeyCombo(keyCombo);
    const binding: LegacyBinding = {
      callback: callback as CallbackWithEvent,
      preventDefault: options.preventDefault !== false,
    };
    this.bindings.set(normalized, binding);

    // クロスプラットフォーム対応: cmdとctrlを相互登録
    const swapped = swapCmdCtrl(normalized);
    if (swapped) {
      this.bindings.set(swapped, binding);
    }
  }

  /**
   * キーバインドの登録を解除します
   * 
   * @param keyCombo - 解除するキーの組み合わせ
   * 
   * @example
   * ```typescript
   * binder.unregister('ctrl+s');
   * ```
   */
  unregister(keyCombo: string) {
    const normalized = normalizeKeyCombo(keyCombo);
    this.bindings.delete(normalized);

    // クロスプラットフォーム対応: cmdとctrlを両方削除
    const swapped = swapCmdCtrl(normalized);
    if (swapped) {
      this.bindings.delete(swapped);
    }
  }

  /**
   * キーボードイベントから照合対象となるキーの組み合わせの候補を生成します
   * 
   * `event.key` に加えて `event.code` や Shift+数字の記号（`"!"` → `"1"`）も
   * 候補に含めることで、キーボードレイアウトの差異を吸収します。
   * 
   * @param event - キーボードイベント
   * @returns 正規化されたキーの組み合わせの候補
   */
  private buildComboCandidates(event: KeyboardEvent): Set<string> {
    const modifiers: string[] = [];
    if (event.metaKey) modifiers.push("cmd");
    if (event.ctrlKey) modifiers.push("ctrl");
    if (event.shiftKey) modifiers.push("shift");
    if (event.altKey) modifiers.push("alt");

    const keyCandidates: string[] = [];
    const addKey = (key: string | null | undefined) => {
      if (!key) return;
      const normalized = normalizeKeyName(key);
      if (normalized && !keyCandidates.includes(normalized)) {
        keyCandidates.push(normalized);
      }
    };

    addKey(event.key);
    // Shift + 数字は event.key が "!" などになるため、数字にも読み替える
    if (event.shiftKey) {
      addKey(SHIFT_SYMBOL_TO_DIGIT[event.key]);
    }
    // レイアウト非依存のフォールバック（"Digit1" → "1", "KeyA" → "a"）
    addKey(keyFromCode(event.code));

    const candidates = new Set<string>();
    for (const key of keyCandidates) {
      // 修飾キー自体の押下（Shift単体など）は組み合わせとして扱わない
      if ((MODIFIER_ORDER as readonly string[]).includes(key)) continue;

      const combo = normalizeKeyCombo([...modifiers, key].join("+"));
      candidates.add(combo);

      // クロスプラットフォーム対応（Mac の Cmd ↔ Windows/Linux の Ctrl）
      const swapped = swapCmdCtrl(combo);
      if (swapped) {
        candidates.add(swapped);
      }
    }

    return candidates;
  }

  /**
   * キーボードイベントを処理し、登録されたキーバインドを実行します
   * 
   * このメソッドは通常、内部で自動的に呼ばれます（window.addEventListener）。
   * 手動で呼び出す必要はありません。
   * 
   * @param event - キーボードイベント
   * @internal
   */
  handleKey(event: KeyboardEvent) {
    if (!this.enabled) return;

    // IME（日本語入力など）変換中のキーは無視する
    // 変換確定の Enter がキーバインドとして発火するのを防ぐ
    if (event.isComposing || event.keyCode === 229) return;

    // Shift も修飾キーとして扱う（"shift+1" のようなキーバインドを成立させるため）
    const isModifierPressed =
      event.metaKey || event.ctrlKey || event.altKey || event.shiftKey;
    const normalizedKey = normalizeKeyName(event.key);
    const isSpecialKey = SPECIAL_KEYS.includes(normalizedKey);

    // 通常の入力キー（1文字のキー）で修飾キーがない場合は、
    // allowSingleKeyBindings が有効でない限り無視する（テキスト入力を妨げないため）
    if (
      !isModifierPressed &&
      !isSpecialKey &&
      !this.allowSingleKeyBindings &&
      event.key.length === 1
    ) {
      return;
    }

    const candidates = this.buildComboCandidates(event);
    if (candidates.size === 0) return;

    // ID付きバインディングを優先的にチェック
    let handled = false;
    for (const config of this.bindingsById.values()) {
      if (!config.enabled) continue;
      if (!candidates.has(config.keyCombo)) continue;

      if (config.preventDefault) {
        event.preventDefault();
      }
      config.callback(event);
      handled = true;
      // preventDefault: true の場合のみreturn（他のハンドラーをブロック）
      if (config.preventDefault) {
        return;
      }
      // preventDefault: false の場合は続行（他のハンドラーも実行可能）
    }

    // いずれかのハンドラーが実行された場合、従来のバインディングはスキップ
    if (handled) {
      return;
    }

    // 従来のバインディングもチェック（後方互換性）
    for (const candidate of candidates) {
      const binding = this.bindings.get(candidate);
      if (!binding) continue;

      if (binding.preventDefault) {
        event.preventDefault();
      }
      binding.callback(event);
      return;
    }
  }

  /**
   * すべてのキーバインドを有効化します
   * 
   * @example
   * ```typescript
   * binder.enable();
   * ```
   */
  enable() {
    this.enabled = true;
  }

  /**
   * すべてのキーバインドを無効化します
   * 
   * @example
   * ```typescript
   * binder.disable();
   * ```
   */
  disable() {
    this.enabled = false;
  }

  /**
   * キーバインドが有効かどうかを返します
   * 
   * @returns キーバインドが有効な場合はtrue
   * 
   * @example
   * ```typescript
   * if (binder.isEnabled()) {
   *   console.log('キーバインドは有効です');
   * }
   * ```
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * ID付きでキーバインドを登録します（高度な登録方法）
   * 
   * ID付き登録により、後から有効/無効の切り替えや、
   * preventDefault設定の変更が可能になります。
   * 
   * @param id - キーバインドの一意識別子
   * @param keyCombo - キーの組み合わせ（例: "ctrl+s", "cmd+k"）
   * @param callback - キー押下時に実行される関数（`KeyboardEvent` が渡されます）
   * @param options - オプション設定
   * @param options.preventDefault - デフォルトのブラウザ動作を防ぐか（デフォルト: true）
   * @returns 登録されたキーバインドのID
   * 
   * @example
   * ```typescript
   * binder.registerWithId(
   *   'save-action',
   *   'ctrl+s',
   *   () => console.log('保存'),
   *   { preventDefault: true }
   * );
   * 
   * // 後から無効化
   * binder.disableById('save-action');
   * ```
   */
  registerWithId(
    id: string,
    keyCombo: string,
    callback: Callback | CallbackWithEvent,
    options: { preventDefault?: boolean } = {}
  ): string {
    const config: KeybindConfig = {
      id,
      keyCombo: normalizeKeyCombo(keyCombo),
      callback: callback as CallbackWithEvent,
      enabled: true,
      preventDefault: options.preventDefault !== false,
    };
    
    this.bindingsById.set(id, config);
    return id;
  }

  /**
   * IDを指定してキーバインドの登録を解除します
   * 
   * @param id - 解除するキーバインドのID
   * 
   * @example
   * ```typescript
   * binder.unregisterById('save-action');
   * ```
   */
  unregisterById(id: string) {
    this.bindingsById.delete(id);
  }

  /**
   * IDを指定してキーバインドを有効化します
   * 
   * @param id - 有効化するキーバインドのID
   * 
   * @example
   * ```typescript
   * binder.enableById('save-action');
   * ```
   */
  enableById(id: string) {
    const config = this.bindingsById.get(id);
    if (config) {
      config.enabled = true;
    }
  }

  /**
   * IDを指定してキーバインドを無効化します
   * 
   * @param id - 無効化するキーバインドのID
   * 
   * @example
   * ```typescript
   * binder.disableById('save-action');
   * ```
   */
  disableById(id: string) {
    const config = this.bindingsById.get(id);
    if (config) {
      config.enabled = false;
    }
  }

  /**
   * IDを指定してpreventDefault設定を変更します
   * 
   * @param id - 設定を変更するキーバインドのID
   * @param prevent - デフォルト動作を防ぐか
   * 
   * @example
   * ```typescript
   * binder.setPreventDefault('save-action', false);
   * ```
   */
  setPreventDefault(id: string, prevent: boolean) {
    const config = this.bindingsById.get(id);
    if (config) {
      config.preventDefault = prevent;
    }
  }

  /**
   * IDを指定してキーバインド設定を取得します
   * 
   * @param id - 取得するキーバインドのID
   * @returns キーバインド設定、見つからない場合はundefined
   * 
   * @example
   * ```typescript
   * const config = binder.getBinding('save-action');
   * if (config) {
   *   console.log(`Key: ${config.keyCombo}, Enabled: ${config.enabled}`);
   * }
   * ```
   */
  getBinding(id: string): KeybindConfig | undefined {
    return this.bindingsById.get(id);
  }

  /**
   * 登録されているすべてのキーバインド設定を取得します
   * 
   * @returns すべてのキーバインド設定の配列
   * 
   * @example
   * ```typescript
   * const allBindings = binder.getAllBindings();
   * allBindings.forEach(config => {
   *   console.log(`${config.id}: ${config.keyCombo}`);
   * });
   * ```
   */
  getAllBindings(): KeybindConfig[] {
    return Array.from(this.bindingsById.values());
  }
}

/**
 * グローバルなKeyb​indManagerインスタンス
 * 
 * アプリケーション全体で共有されるキーバインドマネージャーです。
 * ブラウザ環境では自動的にkeydownイベントをリスンします。
 * 
 * @example
 * ```typescript
 * import { binder } from '@hyperbind/core';
 * 
 * binder.register('ctrl+s', () => {
 *   console.log('保存処理');
 * });
 * ```
 */
export const binder = new KeybindManager();
if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => binder.handleKey(e));
}
