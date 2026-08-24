/**
 * コールバック関数の型定義（引数なし）
 */
type Callback = () => void;

/**
 * イベントを受け取るコールバック関数の型定義
 */
type CallbackWithEvent = (event?: KeyboardEvent) => void;

/**
 * キーバインドの設定情報
 */
export interface KeybindConfig {
  /** キーバインドの一意識別子 */
  id: string;
  /** キーの組み合わせ（例: "ctrl+s", "cmd+k"） */
  keyCombo: string;
  /** キー押下時に実行されるコールバック関数 */
  callback: Callback | CallbackWithEvent;
  /** キーバインドの有効/無効状態 */
  enabled: boolean;
  /** デフォルトのブラウザ動作を防ぐかどうか */
  preventDefault: boolean;
}

/**
 * キーバインドを管理するクラス
 *
 * グローバルなキーボードショートカットの登録、解除、実行を管理します。
 * Mac（Command）とWindows/Linux（Ctrl）のクロスプラットフォーム対応を提供します。
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
  private bindings: Map<string, Callback> = new Map();
  private bindingsById: Map<string, KeybindConfig> = new Map();
  private enabled = true;

  /**
   * キーバインドを登録します（シンプルな登録方法）
   *
   * @param keyCombo - キーの組み合わせ（例: "ctrl+s", "cmd+k"）
   * @param callback - キー押下時に実行される関数
   *
   * @example
   * ```typescript
   * binder.register('ctrl+s', () => {
   *   console.log('保存処理');
   * });
   * ```
   */
  register(keyCombo: string, callback: Callback) {
    const normalized = keyCombo.toLowerCase();
    this.bindings.set(normalized, callback);

    // クロスプラットフォーム対応: cmdとctrlを相互登録
    if (normalized.includes("cmd")) {
      const ctrlVersion = normalized.replace("cmd", "ctrl");
      this.bindings.set(ctrlVersion, callback);
    } else if (normalized.includes("ctrl")) {
      const cmdVersion = normalized.replace("ctrl", "cmd");
      this.bindings.set(cmdVersion, callback);
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
    const normalized = keyCombo.toLowerCase();
    this.bindings.delete(normalized);

    // クロスプラットフォーム対応: cmdとctrlを両方削除
    if (normalized.includes("cmd")) {
      this.bindings.delete(normalized.replace("cmd", "ctrl"));
    } else if (normalized.includes("ctrl")) {
      this.bindings.delete(normalized.replace("ctrl", "cmd"));
    }
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

    // 特殊キーや機能キーのみを処理（Enter, Escape, F1-F12, Arrow keys, etc）
    // 通常の入力キー（英数字、ひらがな、漢字など）は無視
    const specialKeys = [
      "Enter",
      "Escape",
      "Tab",
      "Backspace",
      "Delete",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
      "PageUp",
      "PageDown",
      "F1",
      "F2",
      "F3",
      "F4",
      "F5",
      "F6",
      "F7",
      "F8",
      "F9",
      "F10",
      "F11",
      "F12",
      " ", // Space key
    ];

    // 修飾キーが押されている場合は処理
    // または特殊キーの場合は処理
    // 通常の入力キー（key.length > 1でない、つまり1文字のキー）で修飾キーがない場合は無視
    const isModifierPressed = event.metaKey || event.ctrlKey || event.altKey;
    const isSpecialKey = specialKeys.includes(event.key);

    if (!isModifierPressed && !isSpecialKey) {
      // key.length > 1 の場合は特殊キー（ArrowRight など）
      // key.length === 1 の場合は通常の入力キー（英数字など）
      if (event.key.length === 1) {
        return;
      }
    }

    const parts: string[] = [];

    // Macの場合はmetaKey（Cmdキー）、Windows/Linuxの場合はctrlKeyに対応
    if (event.metaKey) parts.push("cmd");
    if (event.ctrlKey) parts.push("ctrl");
    if (event.shiftKey) parts.push("shift");
    if (event.altKey) parts.push("alt");

    // スペースキーを"space"に正規化
    const key = event.key === " " ? "space" : event.key.toLowerCase();
    parts.push(key);
    const combo = parts.join("+");

    // ID付きバインディングを優先的にチェック
    let handled = false;
    for (const config of this.bindingsById.values()) {
      if (!config.enabled) continue;

      const normalizedCombo = config.keyCombo.toLowerCase();
      let matches = combo === normalizedCombo;

      // クロスプラットフォーム対応
      if (!matches && event.metaKey && normalizedCombo.includes("ctrl")) {
        matches = combo === normalizedCombo.replace("ctrl", "cmd");
      } else if (!matches && event.ctrlKey && normalizedCombo.includes("cmd")) {
        matches = combo === normalizedCombo.replace("cmd", "ctrl");
      }

      if (matches) {
        if (config.preventDefault) {
          event.preventDefault();
        }
        // callbackがイベントを受け取る場合と受け取らない場合の両方に対応
        if (config.callback.length > 0) {
          (config.callback as CallbackWithEvent)(event);
        } else {
          (config.callback as Callback)();
        }
        handled = true;
        // preventDefault: true の場合のみreturn（他のハンドラーをブロック）
        if (config.preventDefault) {
          return;
        }
        // preventDefault: false の場合は続行（他のハンドラーも実行可能）
      }
    }

    // いずれかのハンドラーが実行された場合、従来のバインディングはスキップ
    if (handled) {
      return;
    }

    // 従来のバインディングもチェック（後方互換性）
    let cb = this.bindings.get(combo);
    if (!cb && event.metaKey) {
      const altCombo = combo.replace("cmd", "ctrl");
      cb = this.bindings.get(altCombo);
    } else if (!cb && event.ctrlKey) {
      const altCombo = combo.replace("ctrl", "cmd");
      cb = this.bindings.get(altCombo);
    }

    if (cb) {
      event.preventDefault();
      cb();
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
   * @param callback - キー押下時に実行される関数
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
      keyCombo: keyCombo.toLowerCase(),
      callback,
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
 * グローバルなKeybindManagerインスタンス
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
