import { renderHook } from "@testing-library/react";
import { binder } from "@hyperbind-lib/core";
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
  // テスト間で binder のグローバル状態を持ち越さない
  for (const config of binder.getAllBindings()) {
    binder.unregisterById(config.id);
  }
  binder.enable();
});

describe("useKeybind", () => {
  it("マウント時に登録され、キー押下でコールバックが呼ばれる", () => {
    const callback = vi.fn();
    renderHook(() => useKeybind("ctrl+s", callback));

    dispatch({ key: "s", ctrlKey: true });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("アンマウント時に解除され、以降は呼ばれない", () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useKeybind("ctrl+s", callback));

    unmount();
    dispatch({ key: "s", ctrlKey: true });

    expect(callback).not.toHaveBeenCalled();
  });

  it("keyCombo が変わると新しいキーで登録し直される", () => {
    const callback = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ combo }: { combo: string }) => useKeybind(combo, callback),
      { initialProps: { combo: "ctrl+s" } }
    );

    rerender({ combo: "ctrl+p" });

    dispatch({ key: "s", ctrlKey: true });
    expect(callback).not.toHaveBeenCalled();

    dispatch({ key: "p", ctrlKey: true });
    expect(callback).toHaveBeenCalledTimes(1);

    unmount();
  });

  it("cmd で登録すると ctrl でも発火する", () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useKeybind("cmd+k", callback));

    dispatch({ key: "k", ctrlKey: true });

    expect(callback).toHaveBeenCalledTimes(1);
    unmount();
  });
});

describe("usePresetKeybind", () => {
  it("マウント時にプリセット定義で登録される", () => {
    const callback = vi.fn();
    renderHook(() => usePresetKeybind("ledger-new", callback));

    expect(binder.getBinding("preset-ledger-new")).toMatchObject({
      keyCombo: "f2",
      enabled: true,
    });

    dispatch({ key: "F2" });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("アンマウント時に解除される", () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => usePresetKeybind("ledger-new", callback));

    unmount();

    expect(binder.getBinding("preset-ledger-new")).toBeUndefined();

    dispatch({ key: "F2" });
    expect(callback).not.toHaveBeenCalled();
  });

  it("存在しないプリセット ID では警告を出し、登録しない", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderHook(() => usePresetKeybind("does-not-exist", vi.fn()));

    expect(warn).toHaveBeenCalledOnce();
    expect(binder.getBinding("preset-does-not-exist")).toBeUndefined();
  });
});
