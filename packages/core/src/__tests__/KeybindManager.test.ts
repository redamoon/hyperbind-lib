import { beforeEach, describe, expect, it, vi } from "vitest";
import { KeybindManager } from "../KeybindManager";
import { createKeyEvent, type KeyEventOptions } from "./testUtils";

describe("KeybindManager", () => {
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
  // 修飾キーの順序
  // ---------------------------------------------------------------------------
  describe("修飾キーの順序", () => {
    it("[既知の不具合] 'shift+ctrl+s' で登録して ctrl+shift+S を押しても発火しない", () => {
      // handleKey は必ず cmd → ctrl → shift → alt の順で combo 文字列を組み立て、
      // 登録側の keyCombo を並べ替えずに文字列比較するため、
      // 修飾キーの記述順が違うだけでマッチしなくなる。
      // 本来は順序に関係なく発火するのが期待挙動。修正時はこのテストを
      // `expect(callback).toHaveBeenCalledTimes(1)` に変更すること。
      const callback = vi.fn();
      manager.registerWithId("save", "shift+ctrl+s", callback);

      press({ key: "S", ctrlKey: true, shiftKey: true });

      expect(callback).not.toHaveBeenCalled();
    });

    it("[既知の不具合] register（レガシー API）でも修飾キーの順序違いで発火しない", () => {
      const callback = vi.fn();
      manager.register("shift+ctrl+s", callback);

      press({ key: "S", ctrlKey: true, shiftKey: true });

      expect(callback).not.toHaveBeenCalled();
    });

    it("[既知の不具合] 'ctrl+alt+x' は alt が shift より前のため発火しない", () => {
      // 正規化順は shift → alt。'ctrl+alt+shift+x' ではなく
      // 'ctrl+shift+alt+x' と書く必要がある。
      const wrongOrder = vi.fn();
      const correctOrder = vi.fn();
      manager.registerWithId("x1", "ctrl+alt+shift+x", wrongOrder, { preventDefault: false });
      manager.registerWithId("x2", "ctrl+shift+alt+x", correctOrder, { preventDefault: false });

      press({ key: "x", ctrlKey: true, shiftKey: true, altKey: true });

      expect(wrongOrder).not.toHaveBeenCalled();
      expect(correctOrder).toHaveBeenCalledTimes(1);
    });

    it("正規化順（cmd → ctrl → shift → alt → key）で登録すればマッチする", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "ctrl+shift+s", callback);

      press({ key: "S", ctrlKey: true, shiftKey: true });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("キー名の大文字小文字は無視される（'S' でも 's' にマッチ）", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "ctrl+shift+s", callback);

      press({ key: "S", ctrlKey: true, shiftKey: true });
      press({ key: "s", ctrlKey: true, shiftKey: true });

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it("keyCombo 側の大文字は登録時に小文字化される", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "CTRL+SHIFT+S", callback);

      press({ key: "S", ctrlKey: true, shiftKey: true });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(manager.getBinding("save")?.keyCombo).toBe("ctrl+shift+s");
    });
  });

  // ---------------------------------------------------------------------------
  // cmd / ctrl のクロスプラットフォーム相互変換
  // ---------------------------------------------------------------------------
  describe("cmd / ctrl のクロスプラットフォーム相互変換", () => {
    describe("registerWithId 経由", () => {
      it("'ctrl+s' で登録して cmd+s を押しても発火する（Mac 想定）", () => {
        const callback = vi.fn();
        manager.registerWithId("save", "ctrl+s", callback);

        press({ key: "s", metaKey: true });

        expect(callback).toHaveBeenCalledTimes(1);
      });

      it("'cmd+k' で登録して ctrl+k を押しても発火する（Windows/Linux 想定）", () => {
        const callback = vi.fn();
        manager.registerWithId("palette", "cmd+k", callback);

        press({ key: "k", ctrlKey: true });

        expect(callback).toHaveBeenCalledTimes(1);
      });

      it("同じ修飾キーの組み合わせであればそのままマッチする", () => {
        const callback = vi.fn();
        manager.registerWithId("save", "ctrl+s", callback);

        press({ key: "s", ctrlKey: true });

        expect(callback).toHaveBeenCalledTimes(1);
      });

      it("修飾キーなしで押しても発火しない", () => {
        const callback = vi.fn();
        manager.registerWithId("save", "ctrl+s", callback);

        press({ key: "s" });

        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe("register（レガシー API）経由", () => {
      it("'cmd+k' で登録すると ctrl+k でも発火する", () => {
        const callback = vi.fn();
        manager.register("cmd+k", callback);

        press({ key: "k", ctrlKey: true });

        expect(callback).toHaveBeenCalledTimes(1);
      });

      it("'ctrl+s' で登録すると cmd+s でも発火する", () => {
        const callback = vi.fn();
        manager.register("ctrl+s", callback);

        press({ key: "s", metaKey: true });

        expect(callback).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // IME 変換中
  // ---------------------------------------------------------------------------
  describe("IME 変換中（isComposing: true）", () => {
    it("変換中の通常入力キー（修飾キーなし）では発火しない", () => {
      const callback = vi.fn();
      manager.registerWithId("a-key", "a", callback);

      press({ key: "a", isComposing: true });

      expect(callback).not.toHaveBeenCalled();
    });

    it("[既知の不具合] 変換中の Enter でも発火してしまう", () => {
      // handleKey は event.isComposing を一切参照していないため、
      // IME 変換確定の Enter がショートカットとして誤発火する。
      // 本来は発火しないのが期待挙動。修正時はこのテストを
      // `expect(callback).not.toHaveBeenCalled()` に変更すること。
      const callback = vi.fn();
      manager.registerWithId("submit", "enter", callback);

      press({ key: "Enter", isComposing: true });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("[既知の不具合] 変換中の Space でも発火してしまう", () => {
      const callback = vi.fn();
      manager.registerWithId("reference", "space", callback);

      press({ key: " ", isComposing: true });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("変換中でない Enter は発火する", () => {
      const callback = vi.fn();
      manager.registerWithId("submit", "enter", callback);

      press({ key: "Enter", isComposing: false });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // preventDefault
  // ---------------------------------------------------------------------------
  describe("preventDefault", () => {
    it("デフォルトでは preventDefault: true になる", () => {
      manager.registerWithId("save", "ctrl+s", vi.fn());

      expect(manager.getBinding("save")?.preventDefault).toBe(true);
    });

    it("preventDefault: true のとき event.preventDefault() が呼ばれる", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "ctrl+s", callback, { preventDefault: true });

      const event = press({ key: "s", ctrlKey: true });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it("preventDefault: false のとき event.preventDefault() は呼ばれない", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "ctrl+s", callback, { preventDefault: false });

      const event = press({ key: "s", ctrlKey: true });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(false);
    });

    it("setPreventDefault で後から設定を変更できる", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "ctrl+s", callback, { preventDefault: true });
      manager.setPreventDefault("save", false);

      const event = press({ key: "s", ctrlKey: true });

      expect(event.defaultPrevented).toBe(false);
    });

    describe("他ハンドラへの伝播", () => {
      it("preventDefault: false 同士なら同じキーの全ハンドラが実行される", () => {
        const first = vi.fn();
        const second = vi.fn();
        manager.registerWithId("first", "ctrl+s", first, { preventDefault: false });
        manager.registerWithId("second", "ctrl+s", second, { preventDefault: false });

        const event = press({ key: "s", ctrlKey: true });

        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
        expect(event.defaultPrevented).toBe(false);
      });

      it("preventDefault: true のハンドラは後続ハンドラをブロックする", () => {
        const first = vi.fn();
        const second = vi.fn();
        manager.registerWithId("first", "ctrl+s", first, { preventDefault: true });
        manager.registerWithId("second", "ctrl+s", second, { preventDefault: false });

        press({ key: "s", ctrlKey: true });

        expect(first).toHaveBeenCalledTimes(1);
        expect(second).not.toHaveBeenCalled();
      });

      it("ブロックは登録順に依存する（preventDefault: false が先なら両方実行される）", () => {
        const first = vi.fn();
        const second = vi.fn();
        manager.registerWithId("first", "ctrl+s", first, { preventDefault: false });
        manager.registerWithId("second", "ctrl+s", second, { preventDefault: true });

        const event = press({ key: "s", ctrlKey: true });

        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
        expect(event.defaultPrevented).toBe(true);
      });

      it("ID 付きバインドが一致した場合、同じキーのレガシーバインドは実行されない", () => {
        const byId = vi.fn();
        const legacy = vi.fn();
        manager.registerWithId("byId", "ctrl+s", byId, { preventDefault: false });
        manager.register("ctrl+s", legacy);

        press({ key: "s", ctrlKey: true });

        expect(byId).toHaveBeenCalledTimes(1);
        expect(legacy).not.toHaveBeenCalled();
      });

      it("ID 付きバインドが一致しない場合はレガシーバインドが実行される", () => {
        const byId = vi.fn();
        const legacy = vi.fn();
        manager.registerWithId("byId", "ctrl+p", byId);
        manager.register("ctrl+s", legacy);

        const event = press({ key: "s", ctrlKey: true });

        expect(byId).not.toHaveBeenCalled();
        expect(legacy).toHaveBeenCalledTimes(1);
        // レガシーバインドは常に preventDefault する
        expect(event.defaultPrevented).toBe(true);
      });
    });

    describe("コールバックへの event 引数", () => {
      it("引数を宣言したコールバックには KeyboardEvent が渡される", () => {
        const received: Array<KeyboardEvent | undefined> = [];
        // vi.fn() のラッパーは arity を保持しないため素の関数を使う
        // （KeybindManager は callback.length で分岐している）
        const callback = (event?: KeyboardEvent) => {
          received.push(event);
        };
        manager.registerWithId("save", "ctrl+s", callback);

        const event = press({ key: "s", ctrlKey: true });

        expect(received).toHaveLength(1);
        expect(received[0]).toBe(event);
      });

      it("引数を宣言していないコールバックは引数なしで呼ばれる", () => {
        const received: unknown[][] = [];
        const callback = function () {
          // eslint-disable-next-line prefer-rest-params
          received.push(Array.from(arguments));
        };
        manager.registerWithId("save", "ctrl+s", callback);

        press({ key: "s", ctrlKey: true });

        expect(received).toEqual([[]]);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // enable / disable
  // ---------------------------------------------------------------------------
  describe("enable / disable", () => {
    it("初期状態は有効", () => {
      expect(manager.isEnabled()).toBe(true);
    });

    it("disable 中は発火しない", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "ctrl+s", callback);

      manager.disable();
      press({ key: "s", ctrlKey: true });

      expect(manager.isEnabled()).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });

    it("enable で再び発火する", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "ctrl+s", callback);

      manager.disable();
      manager.enable();
      press({ key: "s", ctrlKey: true });

      expect(manager.isEnabled()).toBe(true);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("disable 中は preventDefault も行われない", () => {
      manager.registerWithId("save", "ctrl+s", vi.fn(), { preventDefault: true });

      manager.disable();
      const event = press({ key: "s", ctrlKey: true });

      expect(event.defaultPrevented).toBe(false);
    });

    it("[既知の制約] disable の入れ子は参照カウントされず、1 回の enable で解除される", () => {
      // enabled は boolean フラグのため、モーダルの入れ子などで
      // disable が複数回呼ばれても enable 1 回で全て有効化されてしまう。
      // 参照カウント化する場合はこのテストを修正すること。
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

    describe("enableById / disableById", () => {
      it("disableById で該当バインドのみ無効化される", () => {
        const disabled = vi.fn();
        const other = vi.fn();
        manager.registerWithId("disabled", "ctrl+s", disabled, { preventDefault: false });
        manager.registerWithId("other", "ctrl+s", other, { preventDefault: false });

        manager.disableById("disabled");
        press({ key: "s", ctrlKey: true });

        expect(disabled).not.toHaveBeenCalled();
        expect(other).toHaveBeenCalledTimes(1);
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
    });
  });

  // ---------------------------------------------------------------------------
  // registerWithId の ID 重複
  // ---------------------------------------------------------------------------
  describe("registerWithId の ID 重複", () => {
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

    it("unregister は cmd / ctrl の両方のエイリアスを削除する", () => {
      const callback = vi.fn();
      manager.register("ctrl+s", callback);
      manager.unregister("ctrl+s");

      press({ key: "s", metaKey: true });

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
  // キーのフィルタリング
  // ---------------------------------------------------------------------------
  describe("キーのフィルタリング", () => {
    it("修飾キーなしの 1 文字キーは無視される", () => {
      const callback = vi.fn();
      manager.registerWithId("a-key", "a", callback);

      press({ key: "a" });

      expect(callback).not.toHaveBeenCalled();
    });

    it("修飾キーなしでもファンクションキーは処理される", () => {
      const callback = vi.fn();
      manager.registerWithId("new", "f2", callback);

      press({ key: "F2" });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("Space は 'space' に正規化される", () => {
      const callback = vi.fn();
      manager.registerWithId("reference", "space", callback);

      press({ key: " " });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("矢印キーは処理される", () => {
      const callback = vi.fn();
      manager.registerWithId("down", "arrowdown", callback);

      press({ key: "ArrowDown" });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("shift のみの 1 文字キーは無視される", () => {
      const callback = vi.fn();
      manager.registerWithId("upper-a", "shift+a", callback);

      press({ key: "A", shiftKey: true });

      expect(callback).not.toHaveBeenCalled();
    });

    it("alt 付きの 1 文字キーは処理される", () => {
      const callback = vi.fn();
      manager.registerWithId("alt-a", "alt+a", callback);

      press({ key: "a", altKey: true });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 参照系 API
  // ---------------------------------------------------------------------------
  describe("getBinding / getAllBindings", () => {
    it("登録した設定を取得できる", () => {
      const callback = vi.fn();
      manager.registerWithId("save", "Ctrl+S", callback, { preventDefault: false });

      expect(manager.getBinding("save")).toEqual({
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
