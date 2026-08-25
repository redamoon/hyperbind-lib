import { mount } from "@vue/test-utils";
import { binder } from "@hyperbind-lib/core";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useInputKeybind } from "../useInputKeybind";

/**
 * binder は window の keydown を購読しているため、
 * 実際にイベントを飛ばして登録状態を検証する。
 */
const dispatch = (init: KeyboardEventInit & { key: string }) => {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
  window.dispatchEvent(event);
  return event;
};

afterEach(() => {
  // テスト間で binder のグローバル状態を持ち越さない
  for (const config of binder.getAllBindings()) {
    binder.unregisterById(config.id);
  }
  binder.enable();
});

describe("useInputKeybind", () => {
  it("elementRef の要素にフォーカスがあるときだけ発火する", () => {
    const onTrigger = vi.fn();
    const inputRef = ref<HTMLInputElement | null>(null);
    const otherRef = ref<HTMLInputElement | null>(null);

    const wrapper = mount(
      defineComponent({
        setup() {
          useInputKeybind({ elementRef: inputRef, keyCombo: "Enter", onTrigger });
          return () => h("div", [h("input", { ref: inputRef }), h("input", { ref: otherRef })]);
        },
      }),
      { attachTo: document.body }
    );

    // 未フォーカス
    dispatch({ key: "Enter" });
    expect(onTrigger).not.toHaveBeenCalled();

    // 対象要素にフォーカス
    inputRef.value!.focus();
    const focused = dispatch({ key: "Enter" });
    expect(onTrigger).toHaveBeenCalledTimes(1);
    expect(focused.defaultPrevented).toBe(true);

    // 別の要素にフォーカス
    otherRef.value!.focus();
    dispatch({ key: "Enter" });
    expect(onTrigger).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it("elementRef を指定しない場合はフォーカス判定せず常に発火する", () => {
    const onTrigger = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup() {
          useInputKeybind({ keyCombo: "Enter", onTrigger, preventDefault: false });
          return () => h("div");
        },
      }),
      { attachTo: document.body }
    );

    const event = dispatch({ key: "Enter" });

    expect(onTrigger).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(false);

    wrapper.unmount();
  });

  it("enabled: false では登録されない", () => {
    const onTrigger = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup() {
          useInputKeybind({ keyCombo: "Enter", onTrigger, enabled: false });
          return () => h("div");
        },
      })
    );

    dispatch({ key: "Enter" });

    expect(onTrigger).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("アンマウント時に解除される", () => {
    const onTrigger = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup() {
          useInputKeybind({ keyCombo: "Enter", onTrigger });
          return () => h("div");
        },
      })
    );

    wrapper.unmount();
    dispatch({ key: "Enter" });

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("フォーカス外では preventDefault せず、他のキーバインドを妨げない", () => {
    const inputTrigger = vi.fn();
    const otherTrigger = vi.fn();
    const inputRef = ref<HTMLInputElement | null>(null);

    const wrapper = mount(
      defineComponent({
        setup() {
          useInputKeybind({ elementRef: inputRef, keyCombo: "Enter", onTrigger: inputTrigger });
          return () => h("input", { ref: inputRef });
        },
      }),
      { attachTo: document.body }
    );
    binder.registerWithId("other", "Enter", otherTrigger);

    dispatch({ key: "Enter" });

    expect(inputTrigger).not.toHaveBeenCalled();
    expect(otherTrigger).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });
});
