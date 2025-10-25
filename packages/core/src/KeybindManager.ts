type Callback = () => void;

export class KeybindManager {
  private bindings: Map<string, Callback> = new Map();
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
    const parts: string[] = [];
    
    // Macの場合はmetaKey（Cmdキー）、Windows/Linuxの場合はctrlKeyに対応
    const metaKey = event.metaKey || event.ctrlKey;
    if (event.metaKey) parts.push("cmd");
    if (event.ctrlKey) parts.push("ctrl");
    if (event.shiftKey) parts.push("shift");
    if (event.altKey) parts.push("alt");
    
    parts.push(event.key.toLowerCase());
    const combo = parts.join("+");
    
    // cmd+s と ctrl+s を統一的に扱う
    // cmd+sで登録されている場合、ctrl+sでも反応する
    let cb = this.bindings.get(combo);
    if (!cb && event.metaKey) {
      // Mac用: cmd を ctrl に変換して検索
      const altCombo = combo.replace("cmd", "ctrl");
      cb = this.bindings.get(altCombo);
    } else if (!cb && event.ctrlKey) {
      // Windows/Linux用: ctrl を cmd に変換して検索
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
}

export const binder = new KeybindManager();
if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => binder.handleKey(e));
}
