import { act, renderHook } from "@testing-library/react";
import { binder } from "@hyperbind-lib/core";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCustomKeybinds, type CustomKeybind } from "../useCustomKeybinds";

/**
 * binder は window の keydown を購読しているため、
 * 実際にイベントを飛ばして登録状態を検証する。
 */
const dispatch = (init: KeyboardEventInit & { key: string }) => {
  window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }));
};

const STORAGE_KEY = "test_custom_keybinds";

const keybind = (overrides: Partial<CustomKeybind> = {}): CustomKeybind => ({
  id: "kb-1",
  label: "テスト",
  keyCombo: "f2",
  enabled: true,
  preventDefault: true,
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  // テスト間で binder のグローバル状態を持ち越さない
  for (const config of binder.getAllBindings()) {
    binder.unregisterById(config.id);
  }
  binder.enable();
  localStorage.clear();
});

describe("useCustomKeybinds の localStorage 読み書き", () => {
  it("読み込み前に空配列で上書きしない（マウント直後にアンマウントしても保存内容が残る）", () => {
    const saved = [keybind()];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

    const { unmount } = renderHook(() => useCustomKeybinds({ storageKey: STORAGE_KEY }));
    unmount();

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(saved);
  });

  it("StrictMode でも保存内容が壊れない", () => {
    const saved = [keybind(), keybind({ id: "kb-2", keyCombo: "f3" })];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

    const { result } = renderHook(() => useCustomKeybinds({ storageKey: STORAGE_KEY }), {
      wrapper: StrictMode,
    });

    expect(result.current.keybinds).toEqual(saved);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(saved);
  });

  it("storageKey が変わったとき、前のキーのデータを新しいキーへ書き込まない", () => {
    const forKeyA = [keybind()];
    const forKeyB = [keybind({ id: "kb-b", keyCombo: "f4" })];
    localStorage.setItem("keyA", JSON.stringify(forKeyA));
    localStorage.setItem("keyB", JSON.stringify(forKeyB));

    const { result, rerender } = renderHook(
      ({ storageKey }: { storageKey: string }) => useCustomKeybinds({ storageKey }),
      { initialProps: { storageKey: "keyA" } }
    );
    expect(result.current.keybinds).toEqual(forKeyA);

    rerender({ storageKey: "keyB" });

    expect(result.current.keybinds).toEqual(forKeyB);
    expect(JSON.parse(localStorage.getItem("keyB")!)).toEqual(forKeyB);
    expect(JSON.parse(localStorage.getItem("keyA")!)).toEqual(forKeyA);
  });

  it("保存された値が無い場合は空配列から始まる", () => {
    const { result } = renderHook(() => useCustomKeybinds({ storageKey: STORAGE_KEY }));

    expect(result.current.keybinds).toEqual([]);
  });
});

describe("useCustomKeybinds の操作", () => {
  it("addKeybind で登録・保存され、キー押下で onTrigger が呼ばれる", () => {
    const onTrigger = vi.fn();
    const { result } = renderHook(() => useCustomKeybinds({ storageKey: STORAGE_KEY, onTrigger }));

    let id = "";
    act(() => {
      id = result.current.addKeybind({
        label: "追加",
        keyCombo: "f2",
        enabled: true,
        preventDefault: true,
      });
    });

    expect(result.current.keybinds).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toHaveLength(1);

    dispatch({ key: "F2" });
    expect(onTrigger).toHaveBeenCalledWith(id);
  });

  it("removeKeybind で解除・保存される", () => {
    const onTrigger = vi.fn();
    const { result } = renderHook(() => useCustomKeybinds({ storageKey: STORAGE_KEY, onTrigger }));

    let id = "";
    act(() => {
      id = result.current.addKeybind({
        label: "追加",
        keyCombo: "f2",
        enabled: true,
        preventDefault: true,
      });
    });
    act(() => {
      result.current.removeKeybind(id);
    });

    expect(result.current.keybinds).toEqual([]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([]);

    dispatch({ key: "F2" });
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("toggleKeybind の結果が binder にも反映される（StrictMode でも二重反転しない）", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([keybind()]));
    const onTrigger = vi.fn();
    const { result } = renderHook(() => useCustomKeybinds({ storageKey: STORAGE_KEY, onTrigger }), {
      wrapper: StrictMode,
    });

    dispatch({ key: "F2" });
    expect(onTrigger).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.toggleKeybind("kb-1");
    });

    expect(result.current.keybinds[0].enabled).toBe(false);
    expect(binder.getBinding("kb-1")?.enabled).toBe(false);
    dispatch({ key: "F2" });
    expect(onTrigger).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.toggleKeybind("kb-1");
    });

    expect(result.current.keybinds[0].enabled).toBe(true);
    expect(binder.getBinding("kb-1")?.enabled).toBe(true);
    dispatch({ key: "F2" });
    expect(onTrigger).toHaveBeenCalledTimes(2);
  });

  it("togglePreventDefault の結果が binder にも反映される", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([keybind({ preventDefault: true })]));
    const { result } = renderHook(
      () => useCustomKeybinds({ storageKey: STORAGE_KEY, onTrigger: vi.fn() }),
      { wrapper: StrictMode }
    );

    expect(binder.getBinding("kb-1")?.preventDefault).toBe(true);

    act(() => {
      result.current.togglePreventDefault("kb-1");
    });

    expect(result.current.keybinds[0].preventDefault).toBe(false);
    expect(binder.getBinding("kb-1")?.preventDefault).toBe(false);
  });

  it("updateKeybind の変更が保存される", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([keybind()]));
    const { result } = renderHook(() => useCustomKeybinds({ storageKey: STORAGE_KEY }));

    act(() => {
      result.current.updateKeybind("kb-1", { label: "変更後" });
    });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)[0].label).toBe("変更後");
  });

  it("アンマウントで binder から解除される", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([keybind()]));
    const { unmount } = renderHook(() => useCustomKeybinds({ storageKey: STORAGE_KEY }));

    expect(binder.getBinding("kb-1")).toBeDefined();

    unmount();

    expect(binder.getBinding("kb-1")).toBeUndefined();
  });
});
