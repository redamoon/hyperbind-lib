import { mount } from "@vue/test-utils";
import { render, cleanup } from "@testing-library/vue";
import { binder } from "@hyperbind-lib/core";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useKeybind } from "../useKeybind";
import { usePresetKeybind } from "../usePresetKeybind";

/**
 * binder は window の keydown を購読しているため、
 * 実際にイベントを飛ばして登録状態を検証する。
 */
const dispatch = (init: KeyboardEventInit & { key: string }) => {
  window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }));
};

afterEach(() => {
  cleanup();
  // テスト間で binder のグローバル状態を持ち越さない
  for (const config of binder.getAllBindings()) {
    binder.unregisterById(config.id);
  }
  binder.enable();
});

describe("useKeybind", () => {
  const createComponent = (keyCombo: string, callback: () => void) =>
    defineComponent({
      setup() {
        useKeybind(keyCombo, callback);
        return () => h("div");
      },
    });

  it("マウント時に登録され、キー押下でコールバックが呼ばれる", () => {
    const callback = vi.fn();
    const wrapper = mount(createComponent("ctrl+s", callback));

    dispatch({ key: "s", ctrlKey: true });

    expect(callback).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it("アンマウント時に解除され、以降は呼ばれない", () => {
    const callback = vi.fn();
    const wrapper = mount(createComponent("ctrl+s", callback));

    wrapper.unmount();
    dispatch({ key: "s", ctrlKey: true });

    expect(callback).not.toHaveBeenCalled();
  });

  it("cmd で登録すると ctrl でも発火する", () => {
    const callback = vi.fn();
    const wrapper = mount(createComponent("cmd+k", callback));

    dispatch({ key: "k", ctrlKey: true });

    expect(callback).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });
});

describe("usePresetKeybind", () => {
  const createComponent = (presetId: string, callback: () => void) =>
    defineComponent({
      setup() {
        usePresetKeybind(presetId, callback);
        return () => h("div");
      },
    });

  /** プリセット ID を含むバインドを探す（実 ID はインスタンスごとに一意なため） */
  const findByPreset = (presetId: string) =>
    binder.getAllBindings().filter((config) => config.id.includes(presetId));

  it("マウント時にプリセット定義で登録される", () => {
    const callback = vi.fn();
    render(createComponent("ledger-new", callback));

    expect(findByPreset("ledger-new")).toHaveLength(1);
    expect(findByPreset("ledger-new")[0]).toMatchObject({
      keyCombo: "f2",
      enabled: true,
      preventDefault: true,
    });

    dispatch({ key: "F2" });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("アンマウント時に解除される", () => {
    const callback = vi.fn();
    const { unmount } = render(createComponent("ledger-new", callback));

    expect(findByPreset("ledger-new")).toHaveLength(1);

    unmount();

    expect(findByPreset("ledger-new")).toHaveLength(0);

    dispatch({ key: "F2" });
    expect(callback).not.toHaveBeenCalled();
  });

  it("同じプリセットを複数マウントしても ID が衝突しない", () => {
    const first = vi.fn();
    const second = vi.fn();
    mount(createComponent("ledger-new", first));
    mount(createComponent("ledger-new", second));

    const registered = findByPreset("ledger-new");
    expect(registered).toHaveLength(2);
    expect(new Set(registered.map((config) => config.id)).size).toBe(2);
  });

  it("存在しないプリセット ID では警告を出し、登録しない", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(createComponent("does-not-exist", vi.fn()));

    expect(warn).toHaveBeenCalledOnce();
    expect(findByPreset("does-not-exist")).toHaveLength(0);
  });
});
