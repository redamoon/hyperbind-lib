import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { binder } from "../KeybindManager";
import {
  createCustomKeybindId,
  loadCustomKeybinds,
  registerCustomKeybinds,
  saveCustomKeybinds,
  unregisterCustomKeybinds,
  type CustomKeybind,
} from "../CustomKeybinds";
import { DEFAULT_CUSTOM_KEYBINDS_STORAGE_KEY } from "../constants";

/**
 * テスト用の localStorage 相当のオブジェクトを作ります
 *
 * jsdom を導入せずに済むよう、使用するメソッドだけを持つ実装を使用します。
 */
const createStorageStub = () => {
  const store = new Map<string, string>();
  return {
    store,
    stub: {
      getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
      setItem: (key: string, value: string) => store.set(key, String(value)),
      removeItem: (key: string) => store.delete(key),
    },
  };
};

/**
 * テスト用の KeyboardEvent 相当のオブジェクトを作ります
 */
const createEvent = (key: string) =>
  ({
    key,
    code: "",
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    isComposing: false,
    keyCode: 0,
    preventDefault: vi.fn(),
  }) as unknown as KeyboardEvent & { preventDefault: ReturnType<typeof vi.fn> };

const keybind = (overrides: Partial<CustomKeybind> = {}): CustomKeybind => ({
  id: "kb-1",
  label: "テスト",
  keyCombo: "f2",
  enabled: true,
  preventDefault: true,
  ...overrides,
});

describe("loadCustomKeybinds / saveCustomKeybinds", () => {
  let storage: ReturnType<typeof createStorageStub>;

  beforeEach(() => {
    storage = createStorageStub();
    vi.stubGlobal("localStorage", storage.stub);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("保存された値が無い場合は空配列を返す", () => {
    expect(loadCustomKeybinds("empty")).toEqual([]);
  });

  it("保存した内容をそのまま読み込める", () => {
    const keybinds = [keybind(), keybind({ id: "kb-2", keyCombo: "f3" })];
    saveCustomKeybinds("k", keybinds);

    expect(loadCustomKeybinds("k")).toEqual(keybinds);
  });

  it("JSONとして解釈できない値は空配列を返す", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    storage.store.set("broken", "{not json");

    expect(loadCustomKeybinds("broken")).toEqual([]);
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it("配列以外が保存されていた場合は空配列を返す", () => {
    storage.store.set("object", '{"a":1}');

    expect(loadCustomKeybinds("object")).toEqual([]);
  });

  it("storageKeyを省略すると既定のキー名を使う", () => {
    const keybinds = [keybind()];
    saveCustomKeybinds(DEFAULT_CUSTOM_KEYBINDS_STORAGE_KEY, keybinds);

    expect(loadCustomKeybinds()).toEqual(keybinds);
  });

  it("localStorageが無い環境では読み書きしても例外にならない", () => {
    vi.stubGlobal("localStorage", undefined);

    expect(loadCustomKeybinds("k")).toEqual([]);
    expect(() => saveCustomKeybinds("k", [keybind()])).not.toThrow();
  });
});

describe("createCustomKeybindId", () => {
  it('"kb-" で始まるIDを生成する', () => {
    expect(createCustomKeybindId()).toMatch(/^kb-/);
  });

  it("呼び出しごとに異なるIDを生成する", () => {
    const ids = new Set([
      createCustomKeybindId(),
      createCustomKeybindId(),
      createCustomKeybindId(),
    ]);

    expect(ids.size).toBe(3);
  });
});

describe("registerCustomKeybinds / unregisterCustomKeybinds", () => {
  afterEach(() => {
    binder.destroy();
  });

  it("enabled:true のキーバインドが発火する", () => {
    const onTrigger = vi.fn();
    registerCustomKeybinds([keybind()], onTrigger);

    binder.handleKey(createEvent("F2"));

    expect(onTrigger).toHaveBeenCalledWith("kb-1");
  });

  it("enabled:false のキーバインドは発火しない", () => {
    const onTrigger = vi.fn();
    registerCustomKeybinds([keybind({ enabled: false })], onTrigger);

    binder.handleKey(createEvent("F2"));

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("onTriggerを渡さなくても例外にならない", () => {
    registerCustomKeybinds([keybind()]);

    expect(() => binder.handleKey(createEvent("F2"))).not.toThrow();
  });

  it("preventDefault の指定がbinderに反映される", () => {
    registerCustomKeybinds([keybind({ preventDefault: true })], vi.fn());
    const prevented = createEvent("F2");
    binder.handleKey(prevented);
    expect(prevented.preventDefault).toHaveBeenCalled();

    binder.destroy();

    registerCustomKeybinds([keybind({ preventDefault: false })], vi.fn());
    const notPrevented = createEvent("F2");
    binder.handleKey(notPrevented);
    expect(notPrevented.preventDefault).not.toHaveBeenCalled();
  });

  it("再登録すると enabled / preventDefault の変更が反映される（stateを唯一の源にできる）", () => {
    const onTrigger = vi.fn();
    registerCustomKeybinds([keybind({ enabled: false })], onTrigger);
    binder.handleKey(createEvent("F2"));
    expect(onTrigger).not.toHaveBeenCalled();

    // 有効化したキーバインドで登録し直す
    unregisterCustomKeybinds([keybind({ enabled: false })]);
    registerCustomKeybinds([keybind({ enabled: true })], onTrigger);
    binder.handleKey(createEvent("F2"));

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("解除したキーバインドは発火しない", () => {
    const onTrigger = vi.fn();
    const keybinds = [keybind()];
    registerCustomKeybinds(keybinds, onTrigger);
    unregisterCustomKeybinds(keybinds);

    binder.handleKey(createEvent("F2"));

    expect(onTrigger).not.toHaveBeenCalled();
  });
});
