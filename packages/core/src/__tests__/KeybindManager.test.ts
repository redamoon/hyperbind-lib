import { beforeEach, describe, expect, it, vi } from "vitest";
import { KeybindManager } from "../KeybindManager";

/**
 * テスト用の KeyboardEvent 相当のオブジェクトを作ります
 *
 * jsdom を導入せずに済むよう、`handleKey` が参照するプロパティだけを持つ
 * プレーンオブジェクトを使用します。
 */
const createEvent = (
  key: string,
  options: {
    code?: string;
    metaKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    isComposing?: boolean;
    keyCode?: number;
  } = {}
) => {
  const event = {
    key,
    code: options.code ?? "",
    metaKey: options.metaKey ?? false,
    ctrlKey: options.ctrlKey ?? false,
    shiftKey: options.shiftKey ?? false,
    altKey: options.altKey ?? false,
    isComposing: options.isComposing ?? false,
    keyCode: options.keyCode ?? 0,
    preventDefault: vi.fn(),
  };
  return event as unknown as KeyboardEvent & { preventDefault: ReturnType<typeof vi.fn> };
};

describe("KeybindManager", () => {
  let manager: KeybindManager;

  beforeEach(() => {
    manager = new KeybindManager();
  });

  describe("修飾キーの順序依存", () => {
    it("登録順が正準順序でなくても一致する（alt+shift+n）", () => {
      const callback = vi.fn();
      manager.registerWithId("a", "alt+shift+n", callback);

      manager.handleKey(createEvent("n", { code: "KeyN", altKey: true, shiftKey: true }));

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("登録順が正準順序でなくても一致する（shift+ctrl+s）", () => {
      const callback = vi.fn();
      manager.registerWithId("s", "shift+ctrl+s", callback);

      manager.handleKey(createEvent("S", { code: "KeyS", ctrlKey: true, shiftKey: true }));

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("修飾キーの別名（option / meta / control）を統一して照合する", () => {
      const callback = vi.fn();
      // reservedKeys.ts に含まれる表記
      manager.registerWithId("devtools", "cmd+option+i", callback);

      manager.handleKey(createEvent("i", { code: "KeyI", metaKey: true, altKey: true }));

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("旧 API（register）でも順序に依存しない", () => {
      const callback = vi.fn();
      manager.register("alt+shift+n", callback);

      manager.handleKey(createEvent("n", { code: "KeyN", altKey: true, shiftKey: true }));

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("クロスプラットフォーム対応", () => {
    it("ctrl で登録したキーバインドが cmd でも発火する", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "ctrl+s", callback);

      manager.handleKey(createEvent("s", { code: "KeyS", metaKey: true }));

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("cmd で登録したキーバインドが ctrl でも発火する", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "cmd+shift+s", callback);

      manager.handleKey(createEvent("S", { code: "KeyS", ctrlKey: true, shiftKey: true }));

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("cmd と ctrl を同時に含む場合は入れ替えない", () => {
      const callback = vi.fn();
      manager.registerWithId("both", "cmd+ctrl+s", callback);

      manager.handleKey(createEvent("s", { code: "KeyS", metaKey: true }));
      expect(callback).not.toHaveBeenCalled();

      manager.handleKey(createEvent("s", { code: "KeyS", metaKey: true, ctrlKey: true }));
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("IME（日本語入力）中のガード", () => {
    it("isComposing が true の場合は発火しない", () => {
      const callback = vi.fn();
      manager.registerWithId("enter", "enter", callback, { preventDefault: false });

      manager.handleKey(createEvent("Enter", { code: "Enter", isComposing: true }));

      expect(callback).not.toHaveBeenCalled();
    });

    it("keyCode が 229 の場合は発火しない", () => {
      const callback = vi.fn();
      manager.registerWithId("enter", "enter", callback, { preventDefault: false });

      manager.handleKey(createEvent("Enter", { code: "Enter", keyCode: 229 }));

      expect(callback).not.toHaveBeenCalled();
    });

    it("変換中でない Enter は発火する", () => {
      const callback = vi.fn();
      manager.registerWithId("enter", "enter", callback, { preventDefault: false });

      manager.handleKey(createEvent("Enter", { code: "Enter" }));

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("コールバックへの event の受け渡し", () => {
    it("引数を宣言しないコールバックにも event を渡す", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "ctrl+s", callback);

      const event = createEvent("s", { code: "KeyS", ctrlKey: true });
      manager.handleKey(event);

      expect(callback).toHaveBeenCalledWith(event);
    });

    it("デフォルト引数を使うコールバックにも event を渡す", () => {
      const received: unknown[] = [];
      const callback = (event: KeyboardEvent = undefined as unknown as KeyboardEvent) => {
        received.push(event);
      };
      manager.registerWithId("save", "ctrl+s", callback);

      const event = createEvent("s", { code: "KeyS", ctrlKey: true });
      manager.handleKey(event);

      expect(received).toEqual([event]);
    });

    it("rest 引数を使うコールバックにも event を渡す", () => {
      const received: unknown[][] = [];
      const callback = (...args: unknown[]) => {
        received.push(args);
      };
      manager.registerWithId("save", "ctrl+s", callback);

      const event = createEvent("s", { code: "KeyS", ctrlKey: true });
      manager.handleKey(event);

      expect(received).toEqual([[event]]);
    });

    it("旧 API（register）のコールバックにも event を渡す", () => {
      const callback = vi.fn();
      manager.register("ctrl+s", callback);

      const event = createEvent("s", { code: "KeyS", ctrlKey: true });
      manager.handleKey(event);

      expect(callback).toHaveBeenCalledWith(event);
    });
  });

  describe("shift + 数字", () => {
    it("event.key が記号でも shift+1 に一致する", () => {
      const callback = vi.fn();
      manager.registerWithId("one", "shift+1", callback);

      manager.handleKey(createEvent("!", { code: "Digit1", shiftKey: true }));

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("shift + 英字も一致する", () => {
      const callback = vi.fn();
      manager.registerWithId("upper", "shift+a", callback);

      manager.handleKey(createEvent("A", { code: "KeyA", shiftKey: true }));

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("event.code のフォールバックで一致する（記号マッピング外のレイアウト）", () => {
      const callback = vi.fn();
      manager.registerWithId("two", "shift+2", callback);

      // JIS配列などで event.key が '"' になるケース
      manager.handleKey(createEvent('"', { code: "Digit2", shiftKey: true }));

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("preventDefault の一貫性", () => {
    it("register は既定で preventDefault を呼ぶ", () => {
      manager.register("ctrl+s", vi.fn());

      const event = createEvent("s", { code: "KeyS", ctrlKey: true });
      manager.handleKey(event);

      expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });

    it("register でも preventDefault: false を指定できる", () => {
      manager.register("ctrl+s", vi.fn(), { preventDefault: false });

      const event = createEvent("s", { code: "KeyS", ctrlKey: true });
      manager.handleKey(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it("registerWithId は既定で preventDefault を呼ぶ", () => {
      manager.registerWithId("save", "ctrl+s", vi.fn());

      const event = createEvent("s", { code: "KeyS", ctrlKey: true });
      manager.handleKey(event);

      expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });

    it("registerWithId で preventDefault: false を指定すると呼ばれない", () => {
      manager.registerWithId("save", "ctrl+s", vi.fn(), { preventDefault: false });

      const event = createEvent("s", { code: "KeyS", ctrlKey: true });
      manager.handleKey(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe("単独キーの扱い", () => {
    it("既定では修飾キーなしの1文字キーは発火しない", () => {
      const callback = vi.fn();
      manager.registerWithId("a", "a", callback);

      manager.handleKey(createEvent("a", { code: "KeyA" }));

      expect(callback).not.toHaveBeenCalled();
    });

    it("allowSingleKeyBindings を有効にすると発火する", () => {
      const callback = vi.fn();
      manager.setOptions({ allowSingleKeyBindings: true });
      manager.registerWithId("a", "a", callback);

      manager.handleKey(createEvent("a", { code: "KeyA" }));

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("コンストラクタでも有効にできる", () => {
      const single = new KeybindManager({ allowSingleKeyBindings: true });
      expect(single.isSingleKeyBindingAllowed()).toBe(true);
      expect(new KeybindManager().isSingleKeyBindingAllowed()).toBe(false);
    });

    it("スペースキーは既定でも発火する", () => {
      const callback = vi.fn();
      manager.registerWithId("space", "space", callback);

      manager.handleKey(createEvent(" ", { code: "Space" }));

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("特殊キー（Escape など）は既定でも発火する", () => {
      const callback = vi.fn();
      manager.registerWithId("esc", "escape", callback);

      manager.handleKey(createEvent("Escape", { code: "Escape" }));

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("有効/無効の切り替え", () => {
    it("disable 中は発火しない", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "ctrl+s", callback);
      manager.disable();

      manager.handleKey(createEvent("s", { code: "KeyS", ctrlKey: true }));

      expect(callback).not.toHaveBeenCalled();
      expect(manager.isEnabled()).toBe(false);
    });

    it("disableById で個別に無効化できる", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "ctrl+s", callback);
      manager.disableById("save");

      manager.handleKey(createEvent("s", { code: "KeyS", ctrlKey: true }));

      expect(callback).not.toHaveBeenCalled();
    });

    it("unregister で旧 API のキーバインドを解除できる（cmd/ctrl 両方）", () => {
      const callback = vi.fn();
      manager.register("ctrl+s", callback);
      manager.unregister("ctrl+s");

      manager.handleKey(createEvent("s", { code: "KeyS", ctrlKey: true }));
      manager.handleKey(createEvent("s", { code: "KeyS", metaKey: true }));

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("登録内容の取得", () => {
    it("keyCombo は正規化された形で保持される", () => {
      manager.registerWithId("dev", "cmd+option+i", vi.fn());

      expect(manager.getBinding("dev")?.keyCombo).toBe("cmd+alt+i");
      expect(manager.getAllBindings()).toHaveLength(1);
    });
  });

  describe("ハンドラーの実行順序", () => {
    it("preventDefault: false のハンドラーは後続も実行される", () => {
      const first = vi.fn();
      const second = vi.fn();
      manager.registerWithId("first", "ctrl+s", first, { preventDefault: false });
      manager.registerWithId("second", "ctrl+s", second, { preventDefault: false });

      manager.handleKey(createEvent("s", { code: "KeyS", ctrlKey: true }));

      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
    });

    it("preventDefault: true のハンドラーは後続をブロックする", () => {
      const first = vi.fn();
      const second = vi.fn();
      manager.registerWithId("first", "ctrl+s", first, { preventDefault: true });
      manager.registerWithId("second", "ctrl+s", second, { preventDefault: true });

      manager.handleKey(createEvent("s", { code: "KeyS", ctrlKey: true }));

      expect(first).toHaveBeenCalledTimes(1);
      expect(second).not.toHaveBeenCalled();
    });

    it("ID付きバインディングが実行された場合は旧 API 側は実行されない", () => {
      const byId = vi.fn();
      const legacy = vi.fn();
      manager.registerWithId("save", "ctrl+s", byId, { preventDefault: false });
      manager.register("ctrl+s", legacy);

      manager.handleKey(createEvent("s", { code: "KeyS", ctrlKey: true }));

      expect(byId).toHaveBeenCalledTimes(1);
      expect(legacy).not.toHaveBeenCalled();
    });
  });
});
