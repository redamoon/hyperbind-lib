type Callback = () => void;
type CallbackWithEvent = (event?: KeyboardEvent) => void;

export interface KeybindConfig {
  id: string;
  keyCombo: string;
  callback: Callback | CallbackWithEvent;
  enabled: boolean;
  preventDefault: boolean;
}

export class KeybindManager {
  private bindings: Map<string, Callback> = new Map();
  private bindingsById: Map<string, KeybindConfig> = new Map();
  private enabled = true;

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

  handleKey(event: KeyboardEvent) {
    if (!this.enabled) return;
    
    // 特殊キーや機能キーのみを処理（Enter, Escape, F1-F12, Arrow keys, etc）
    // 通常の入力キー（英数字、ひらがな、漢字など）は無視
    const specialKeys = [
      "Enter", "Escape", "Tab", "Backspace", "Delete", "ArrowUp", "ArrowDown",
      "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown",
      "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"
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
    const metaKey = event.metaKey || event.ctrlKey;
    if (event.metaKey) parts.push("cmd");
    if (event.ctrlKey) parts.push("ctrl");
    if (event.shiftKey) parts.push("shift");
    if (event.altKey) parts.push("alt");
    
    parts.push(event.key.toLowerCase());
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

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  isEnabled() {
    return this.enabled;
  }

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

  unregisterById(id: string) {
    this.bindingsById.delete(id);
  }

  enableById(id: string) {
    const config = this.bindingsById.get(id);
    if (config) {
      config.enabled = true;
    }
  }

  disableById(id: string) {
    const config = this.bindingsById.get(id);
    if (config) {
      config.enabled = false;
    }
  }

  setPreventDefault(id: string, prevent: boolean) {
    const config = this.bindingsById.get(id);
    if (config) {
      config.preventDefault = prevent;
    }
  }

  getBinding(id: string): KeybindConfig | undefined {
    return this.bindingsById.get(id);
  }

  getAllBindings(): KeybindConfig[] {
    return Array.from(this.bindingsById.values());
  }
}

export const binder = new KeybindManager();
if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => binder.handleKey(e));
}
