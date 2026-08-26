import { mount } from "@vue/test-utils";
import { binder } from "@hyperbind-lib/core";
import { defineComponent, h, nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCustomKeybinds } from "../useCustomKeybinds";
import type { CustomKeybind } from "../useCustomKeybinds";

/**
 * binder は window の keydown を購読しているため、
 * 実際にイベントを飛ばして登録状態を検証する。
 */
const dispatch = (init: KeyboardEventInit & { key: string }) => {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
  window.dispatchEvent(event);
  return event;
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

/** composable の戻り値を取り出しつつマウントする */
const mountComposable = (onTrigger?: (id: string) => void) => {
  let api!: ReturnType<typeof useCustomKeybinds>;
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useCustomKeybinds({ storageKey: STORAGE_KEY, onTrigger });
        return () => h("div");
      },
    })
  );
  return { wrapper, api: () => api };
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  for (const config of binder.getAllBindings()) {
    binder.unregisterById(config.id);
  }
  binder.enable();
  localStorage.clear();
});

describe("useCustomKeybinds", () => {
  it("localStorage から読み込み、保存内容を空配列で上書きしない", async () => {
    const saved = [keybind(), keybind({ id: "kb-2", keyCombo: "f3" })];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

    const { wrapper, api } = mountComposable();
    await nextTick();

    expect(api().keybinds.value).toEqual(saved);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(saved);

    wrapper.unmount();
  });

  it("enabled の状態が binder に反映される", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([keybind(), keybind({ id: "kb-2", keyCombo: "f3", enabled: false })])
    );
    const onTrigger = vi.fn();
    const { wrapper } = mountComposable(onTrigger);
    await nextTick();

    dispatch({ key: "F2" });
    expect(onTrigger).toHaveBeenCalledWith("kb-1");

    onTrigger.mockClear();
    dispatch({ key: "F3" });
    expect(onTrigger).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it("toggleKeybind の結果が binder と localStorage に反映される", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([keybind({ enabled: false })]));
    const onTrigger = vi.fn();
    const { wrapper, api } = mountComposable(onTrigger);
    await nextTick();

    api().toggleKeybind("kb-1");
    await nextTick();

    expect(api().keybinds.value[0].enabled).toBe(true);
    expect(binder.getBinding("kb-1")?.enabled).toBe(true);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)[0].enabled).toBe(true);

    dispatch({ key: "F2" });
    expect(onTrigger).toHaveBeenCalledWith("kb-1");

    wrapper.unmount();
  });

  it("togglePreventDefault の結果が binder に反映される", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([keybind({ preventDefault: true })]));
    const { wrapper, api } = mountComposable(vi.fn());
    await nextTick();

    expect(dispatch({ key: "F2" }).defaultPrevented).toBe(true);

    api().togglePreventDefault("kb-1");
    await nextTick();

    expect(binder.getBinding("kb-1")?.preventDefault).toBe(false);
    expect(dispatch({ key: "F2" }).defaultPrevented).toBe(false);

    wrapper.unmount();
  });

  it("addKeybind / removeKeybind が binder と localStorage に反映される", async () => {
    const onTrigger = vi.fn();
    const { wrapper, api } = mountComposable(onTrigger);
    await nextTick();

    const id = api().addKeybind({
      label: "追加",
      keyCombo: "f4",
      enabled: true,
      preventDefault: true,
    });
    await nextTick();

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toHaveLength(1);
    dispatch({ key: "F4" });
    expect(onTrigger).toHaveBeenCalledWith(id);

    onTrigger.mockClear();
    api().removeKeybind(id);
    await nextTick();

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([]);
    dispatch({ key: "F4" });
    expect(onTrigger).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it("アンマウントで binder から解除される", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([keybind()]));
    const { wrapper } = mountComposable();
    await nextTick();

    expect(binder.getBinding("kb-1")).toBeDefined();

    wrapper.unmount();

    expect(binder.getBinding("kb-1")).toBeUndefined();
  });
});
