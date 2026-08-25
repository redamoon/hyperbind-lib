/**
 * KeybindManager のうち、登録・解除・ライフサイクル周りのテスト
 *
 * キー照合そのもの（修飾キーの正規化、IME ガード、単独キーの扱いなど）は
 * KeybindManager.test.ts が担当し、こちらは以下を対象にします。
 * - registerWithId の ID 重複時の挙動
 * - unregister / unregisterById
 * - suspend / enable の相互作用と境界ケース
 * - start / stop / destroy
 * - 参照系 API
 *
 * イベントは jsdom の実物の KeyboardEvent を使い、
 * defaultPrevented の伝播まで確認します。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KeybindManager } from "../KeybindManager";
import { createKeyEvent, type KeyEventOptions } from "./testUtils";

describe("KeybindManager（登録とライフサイクル）", () => {
  let manager: KeybindManager;

  beforeEach(() => {
    manager = new KeybindManager();
  });

  /** キーイベントを生成して manager に流し込み、そのイベントを返す */
  const press = (options: KeyEventOptions): KeyboardEvent => {
    const event = createKeyEvent(options);
    manager.handleKey(event);
    return event;
  };

  // ---------------------------------------------------------------------------
  // registerWithId の ID 重複
  // ---------------------------------------------------------------------------
  describe("registerWithId の ID 重複", () => {
    /** 重複登録は開発モードで警告するため、既定で握りつぶす */
    let warn: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      warn.mockRestore();
    });

    it("同じ ID で再登録すると上書きされ、バインド数は増えない", () => {
      manager.registerWithId("save", "ctrl+s", vi.fn());
      manager.registerWithId("save", "ctrl+p", vi.fn());

      expect(manager.getAllBindings()).toHaveLength(1);
      expect(manager.getBinding("save")?.keyCombo).toBe("ctrl+p");
    });

    it("上書き後は古いコールバックが呼ばれない", () => {
      const oldCallback = vi.fn();
      const newCallback = vi.fn();
      manager.registerWithId("save", "ctrl+s", oldCallback);
      manager.registerWithId("save", "ctrl+s", newCallback);

      press({ key: "s", ctrlKey: true });

      expect(oldCallback).not.toHaveBeenCalled();
      expect(newCallback).toHaveBeenCalledTimes(1);
    });

    it("上書き後は古い keyCombo では発火しない", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "ctrl+s", callback);
      manager.registerWithId("save", "ctrl+p", callback);

      press({ key: "s", ctrlKey: true });

      expect(callback).not.toHaveBeenCalled();
    });

    it("上書きすると enabled / preventDefault もリセットされる", () => {
      manager.registerWithId("save", "ctrl+s", vi.fn(), { preventDefault: false });
      manager.disableById("save");

      manager.registerWithId("save", "ctrl+s", vi.fn());

      expect(manager.getBinding("save")).toMatchObject({
        enabled: true,
        preventDefault: true,
      });
    });

    it("意図しない上書きは警告される", () => {
      manager.registerWithId("save", "ctrl+s", vi.fn());
      expect(warn).not.toHaveBeenCalled();

      manager.registerWithId("save", "ctrl+p", vi.fn());

      expect(warn).toHaveBeenCalledOnce();
      const message = String(warn.mock.calls[0][0]);
      expect(message).toContain("save");
      expect(message).toContain("ctrl+s");
      expect(message).toContain("ctrl+p");
    });

    it("allowOverwrite: true なら警告されない", () => {
      manager.registerWithId("save", "ctrl+s", vi.fn());
      manager.registerWithId("save", "ctrl+p", vi.fn(), { allowOverwrite: true });

      expect(warn).not.toHaveBeenCalled();
      expect(manager.getBinding("save")?.keyCombo).toBe("ctrl+p");
    });

    it("別 ID なら警告されない", () => {
      manager.registerWithId("save", "ctrl+s", vi.fn());
      manager.registerWithId("print", "ctrl+p", vi.fn());

      expect(warn).not.toHaveBeenCalled();
      expect(manager.getAllBindings()).toHaveLength(2);
    });

    it("unregisterById 後の同 ID 再登録は警告されない", () => {
      manager.registerWithId("save", "ctrl+s", vi.fn());
      manager.unregisterById("save");
      manager.registerWithId("save", "ctrl+s", vi.fn());

      expect(warn).not.toHaveBeenCalled();
    });

    it("登録した ID を返す", () => {
      expect(manager.registerWithId("save", "ctrl+s", vi.fn())).toBe("save");
    });
  });

  // ---------------------------------------------------------------------------
  // unregister / unregisterById
  // ---------------------------------------------------------------------------
  describe("unregister / unregisterById", () => {
    it("unregister 後は発火しない", () => {
      const callback = vi.fn();
      manager.register("ctrl+s", callback);
      manager.unregister("ctrl+s");

      press({ key: "s", ctrlKey: true });

      expect(callback).not.toHaveBeenCalled();
    });

    it("cmd で登録したものを ctrl 表記で unregister しても解除される", () => {
      const callback = vi.fn();
      manager.register("cmd+k", callback);
      manager.unregister("ctrl+k");

      press({ key: "k", metaKey: true });
      press({ key: "k", ctrlKey: true });

      expect(callback).not.toHaveBeenCalled();
    });

    it("修飾キーの順序が違っても unregister できる", () => {
      const callback = vi.fn();
      manager.register("ctrl+shift+s", callback);
      manager.unregister("shift+ctrl+s");

      press({ key: "S", ctrlKey: true, shiftKey: true });

      expect(callback).not.toHaveBeenCalled();
    });

    it("unregisterById 後は発火せず、一覧からも消える", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "ctrl+s", callback);
      manager.unregisterById("save");

      press({ key: "s", ctrlKey: true });

      expect(callback).not.toHaveBeenCalled();
      expect(manager.getBinding("save")).toBeUndefined();
      expect(manager.getAllBindings()).toHaveLength(0);
    });

    it("unregisterById は他のバインドに影響しない", () => {
      const removed = vi.fn();
      const kept = vi.fn();
      manager.registerWithId("removed", "ctrl+s", removed, { preventDefault: false });
      manager.registerWithId("kept", "ctrl+s", kept, { preventDefault: false });

      manager.unregisterById("removed");
      press({ key: "s", ctrlKey: true });

      expect(removed).not.toHaveBeenCalled();
      expect(kept).toHaveBeenCalledTimes(1);
    });

    it("存在しないキー / ID の解除は例外にならない", () => {
      expect(() => manager.unregister("ctrl+s")).not.toThrow();
      expect(() => manager.unregisterById("missing")).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // enable / disable の境界
  // ---------------------------------------------------------------------------
  describe("enable / disable の境界", () => {
    it("初期状態は有効", () => {
      expect(manager.isEnabled()).toBe(true);
      expect(manager.isActive()).toBe(true);
    });

    it("disable 中は preventDefault も行われない", () => {
      manager.registerWithId("save", "ctrl+s", vi.fn(), { preventDefault: true });

      manager.disable();
      const event = press({ key: "s", ctrlKey: true });

      expect(event.defaultPrevented).toBe(false);
    });

    it("disable はマスタースイッチであり参照カウントされない", () => {
      // 入れ子になりうる一時無効化には参照カウント方式の suspend() を使う
      const callback = vi.fn();
      manager.registerWithId("save", "ctrl+s", callback);

      manager.disable();
      manager.disable();
      manager.enable();
      press({ key: "s", ctrlKey: true });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("enable を複数回呼んでも冪等", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "ctrl+s", callback);

      manager.enable();
      manager.enable();
      press({ key: "s", ctrlKey: true });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("enableById で再度有効化される", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "ctrl+s", callback);

      manager.disableById("save");
      manager.enableById("save");
      press({ key: "s", ctrlKey: true });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("存在しない ID を指定しても例外にならない", () => {
      expect(() => manager.enableById("missing")).not.toThrow();
      expect(() => manager.disableById("missing")).not.toThrow();
      expect(() => manager.setPreventDefault("missing", false)).not.toThrow();
    });

    it("setPreventDefault で後から設定を変更できる", () => {
      manager.registerWithId("save", "ctrl+s", vi.fn(), { preventDefault: true });
      manager.setPreventDefault("save", false);

      const event = press({ key: "s", ctrlKey: true });

      expect(event.defaultPrevented).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // suspend の境界ケース
  // ---------------------------------------------------------------------------
  describe("suspend の境界ケース", () => {
    it("解除関数を複数回呼んでもカウントが壊れない", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "ctrl+s", callback);

      const releaseOuter = manager.suspend();
      const releaseInner = manager.suspend();

      releaseInner();
      releaseInner();
      releaseInner();

      // 二重解除でカウントが負に落ちていれば、ここで誤って発火してしまう
      expect(manager.isSuspended()).toBe(true);
      press({ key: "s", ctrlKey: true });
      expect(callback).not.toHaveBeenCalled();

      releaseOuter();
      expect(manager.isSuspended()).toBe(false);
    });

    it("suspend 中は preventDefault も行われない", () => {
      manager.registerWithId("save", "ctrl+s", vi.fn(), { preventDefault: true });
      manager.suspend();

      const event = press({ key: "s", ctrlKey: true });

      expect(event.defaultPrevented).toBe(false);
    });

    it("suspend 中に enable() を呼んでも復活しない", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "ctrl+s", callback);

      manager.suspend();
      manager.enable();

      expect(manager.isEnabled()).toBe(true);
      expect(manager.isActive()).toBe(false);
      press({ key: "s", ctrlKey: true });
      expect(callback).not.toHaveBeenCalled();
    });

    it("disable と suspend は独立して評価される", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "ctrl+s", callback);

      manager.disable();
      const release = manager.suspend();
      release();

      // suspend は解除されたが、マスタースイッチが切れたまま
      expect(manager.isSuspended()).toBe(false);
      expect(manager.isActive()).toBe(false);
      press({ key: "s", ctrlKey: true });
      expect(callback).not.toHaveBeenCalled();

      manager.enable();
      press({ key: "s", ctrlKey: true });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("destroy 後は古い解除関数がカウントを壊さない", () => {
      const callback = vi.fn();
      const staleRelease = manager.suspend();

      manager.destroy();
      expect(manager.isSuspended()).toBe(false);

      // destroy でカウントはリセット済み。世代違いの解除関数を呼んでも
      // カウントが負に落ちてはならない
      staleRelease();

      manager.registerWithId("save", "ctrl+s", callback);
      const release = manager.suspend();
      expect(manager.isSuspended()).toBe(true);
      press({ key: "s", ctrlKey: true });
      expect(callback).not.toHaveBeenCalled();

      release();
      press({ key: "s", ctrlKey: true });
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // start / stop の境界ケース
  // ---------------------------------------------------------------------------
  describe("start / stop の境界ケース", () => {
    it("start() の多重呼び出しでも二重登録されない", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "ctrl+s", callback, { preventDefault: false });
      manager.start();
      manager.start();

      window.dispatchEvent(createKeyEvent({ key: "s", ctrlKey: true }));

      expect(callback).toHaveBeenCalledTimes(1);
      manager.stop();
    });

    it("別の target を指定すると購読先が張り替わる", () => {
      const callback = vi.fn();
      const target = new EventTarget();
      manager.registerWithId("save", "ctrl+s", callback, { preventDefault: false });

      manager.start(window);
      manager.start(target);

      window.dispatchEvent(createKeyEvent({ key: "s", ctrlKey: true }));
      expect(callback).not.toHaveBeenCalled();

      target.dispatchEvent(createKeyEvent({ key: "s", ctrlKey: true }));
      expect(callback).toHaveBeenCalledTimes(1);

      manager.stop();
    });

    it("stop() は未購読でも例外にならない", () => {
      expect(() => manager.stop()).not.toThrow();
    });

    it("destroy() は enabled と suspend もリセットする", () => {
      manager.registerWithId("save", "ctrl+s", vi.fn());
      manager.register("ctrl+p", vi.fn());
      manager.disable();
      manager.start();

      manager.destroy();

      expect(manager.isListening()).toBe(false);
      expect(manager.getAllBindings()).toHaveLength(0);
      expect(manager.isEnabled()).toBe(true);
      expect(manager.isSuspended()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 参照系 API
  // ---------------------------------------------------------------------------
  describe("getBinding / getAllBindings", () => {
    it("登録した設定を取得できる", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "Ctrl+S", callback, { preventDefault: false });

      expect(manager.getBinding("save")).toMatchObject({
        id: "save",
        keyCombo: "ctrl+s",
        callback,
        enabled: true,
        preventDefault: false,
      });
    });

    it("未登録の ID には undefined を返す", () => {
      expect(manager.getBinding("missing")).toBeUndefined();
    });

    it("getAllBindings は登録順に全件返す", () => {
      manager.registerWithId("first", "ctrl+s", vi.fn());
      manager.registerWithId("second", "ctrl+p", vi.fn());

      expect(manager.getAllBindings().map((b) => b.id)).toEqual(["first", "second"]);
    });

    it("register（レガシー API）は getAllBindings に含まれない", () => {
      manager.register("ctrl+s", vi.fn());

      expect(manager.getAllBindings()).toHaveLength(0);
    });
  });
});
