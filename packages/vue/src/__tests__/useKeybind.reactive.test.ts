import { mount } from "@vue/test-utils";
import { binder } from "@hyperbind-lib/core";
import { computed, defineComponent, h, nextTick, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useKeybind } from "../useKeybind";

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

describe("useKeybind のリアクティブな keyCombo", () => {
  const mountWith = (keyCombo: Parameters<typeof useKeybind>[0], callback: () => void) =>
    mount(
      defineComponent({
        setup() {
          useKeybind(keyCombo, callback);
          return () => h("div");
        },
      })
    );

  it("ref の変更に追従して登録し直す", async () => {
    const callback = vi.fn();
    const keyCombo = ref("f2");
    const wrapper = mountWith(keyCombo, callback);

    dispatch({ key: "F2" });
    expect(callback).toHaveBeenCalledTimes(1);

    keyCombo.value = "f3";
    await nextTick();

    dispatch({ key: "F3" });
    expect(callback).toHaveBeenCalledTimes(2);

    // 古いキーでは発火しない
    dispatch({ key: "F2" });
    expect(callback).toHaveBeenCalledTimes(2);

    wrapper.unmount();
  });

  it("ゲッターの変更に追従する", async () => {
    const callback = vi.fn();
    const keyCombo = ref("f6");
    const wrapper = mountWith(() => keyCombo.value, callback);

    dispatch({ key: "F6" });
    expect(callback).toHaveBeenCalledTimes(1);

    keyCombo.value = "f7";
    await nextTick();
    dispatch({ key: "F7" });

    expect(callback).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  it("computed も指定できる", () => {
    const callback = vi.fn();
    const base = ref("f8");
    const wrapper = mountWith(
      computed(() => base.value),
      callback
    );

    dispatch({ key: "F8" });

    expect(callback).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it("キーを変更したあとアンマウントしても、変更後のキーが解除される", async () => {
    const callback = vi.fn();
    const keyCombo = ref("f2");
    const wrapper = mountWith(keyCombo, callback);

    keyCombo.value = "f3";
    await nextTick();
    wrapper.unmount();

    dispatch({ key: "F3" });

    expect(callback).not.toHaveBeenCalled();
  });
});
