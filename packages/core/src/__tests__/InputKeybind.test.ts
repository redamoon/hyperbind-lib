import { afterEach, describe, expect, it, vi } from "vitest";
import { binder } from "../KeybindManager";
import { createFocusGuardedKeyHandler, registerFocusGuardedKeybind } from "../InputKeybind";

/**
 * テスト用の KeyboardEvent 相当のオブジェクトを作ります
 */
const createEvent = (key = "Enter") =>
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

/** フォーカス判定用に document.activeElement だけを差し替えます */
const stubActiveElement = (activeElement: unknown) => {
  vi.stubGlobal("document", { activeElement });
};

describe("createFocusGuardedKeyHandler", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("対象要素にフォーカスがある場合はコールバックを実行しpreventDefaultする", () => {
    const element = { tagName: "INPUT" };
    const onTrigger = vi.fn();
    stubActiveElement(element);

    const handleKey = createFocusGuardedKeyHandler({
      resolveElement: () => element as unknown as Element,
      shouldPreventDefault: () => true,
      resolveCallback: () => onTrigger,
    });
    const event = createEvent();
    handleKey(event);

    expect(onTrigger).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("対象要素にフォーカスが無い場合は何もしない（他のハンドラーに委ねる）", () => {
    const element = { tagName: "INPUT" };
    const onTrigger = vi.fn();
    stubActiveElement({ tagName: "BODY" });

    const handleKey = createFocusGuardedKeyHandler({
      resolveElement: () => element as unknown as Element,
      shouldPreventDefault: () => true,
      resolveCallback: () => onTrigger,
    });
    const event = createEvent();
    handleKey(event);

    expect(onTrigger).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("対象要素が未マウント（null）の場合は何もしない", () => {
    const onTrigger = vi.fn();
    stubActiveElement(null);

    const handleKey = createFocusGuardedKeyHandler({
      resolveElement: () => null,
      shouldPreventDefault: () => true,
      resolveCallback: () => onTrigger,
    });
    const event = createEvent();
    handleKey(event);

    expect(onTrigger).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("対象要素の指定が無い（undefined）場合はフォーカス判定せず常に実行する", () => {
    const onTrigger = vi.fn();
    stubActiveElement({ tagName: "BODY" });

    const handleKey = createFocusGuardedKeyHandler({
      resolveElement: () => undefined,
      shouldPreventDefault: () => true,
      resolveCallback: () => onTrigger,
    });
    const event = createEvent();
    handleKey(event);

    expect(onTrigger).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("shouldPreventDefaultがfalseを返す場合はpreventDefaultしない", () => {
    const onTrigger = vi.fn();
    stubActiveElement(null);

    const handleKey = createFocusGuardedKeyHandler({
      resolveElement: () => undefined,
      shouldPreventDefault: () => false,
      resolveCallback: () => onTrigger,
    });
    const event = createEvent();
    handleKey(event);

    expect(onTrigger).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("呼び出しごとに最新のコールバックと要素・preventDefaultを解決する", () => {
    const first = vi.fn();
    const second = vi.fn();
    let callback = first;
    let preventDefault = false;
    stubActiveElement(null);

    const handleKey = createFocusGuardedKeyHandler({
      resolveElement: () => undefined,
      shouldPreventDefault: () => preventDefault,
      resolveCallback: () => callback,
    });

    const firstEvent = createEvent();
    handleKey(firstEvent);
    expect(first).toHaveBeenCalledTimes(1);
    expect(firstEvent.preventDefault).not.toHaveBeenCalled();

    callback = second;
    preventDefault = true;
    const secondEvent = createEvent();
    handleKey(secondEvent);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(secondEvent.preventDefault).toHaveBeenCalledTimes(1);
  });
});

describe("registerFocusGuardedKeybind", () => {
  afterEach(() => {
    binder.destroy();
    vi.unstubAllGlobals();
  });

  it("フォーカスが一致したときだけ発火する", () => {
    const element = { tagName: "INPUT" };
    const onTrigger = vi.fn();
    stubActiveElement({ tagName: "BODY" });

    registerFocusGuardedKeybind("input-keybind-1", "Enter", {
      resolveElement: () => element as unknown as Element,
      shouldPreventDefault: () => true,
      resolveCallback: () => onTrigger,
    });

    binder.handleKey(createEvent("Enter"));
    expect(onTrigger).not.toHaveBeenCalled();

    stubActiveElement(element);
    binder.handleKey(createEvent("Enter"));
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("preventDefault:false で登録されるため、フォーカス外では他のキーバインドを妨げない", () => {
    const element = { tagName: "INPUT" };
    const inputTrigger = vi.fn();
    const otherTrigger = vi.fn();
    stubActiveElement({ tagName: "BODY" });

    registerFocusGuardedKeybind("input-keybind-1", "Enter", {
      resolveElement: () => element as unknown as Element,
      shouldPreventDefault: () => true,
      resolveCallback: () => inputTrigger,
    });
    binder.registerWithId("other", "Enter", otherTrigger);

    binder.handleKey(createEvent("Enter"));

    expect(inputTrigger).not.toHaveBeenCalled();
    expect(otherTrigger).toHaveBeenCalledTimes(1);
  });

  it("unregisterByIdで解除できる", () => {
    const onTrigger = vi.fn();
    stubActiveElement(null);

    registerFocusGuardedKeybind("input-keybind-1", "Enter", {
      resolveElement: () => undefined,
      shouldPreventDefault: () => false,
      resolveCallback: () => onTrigger,
    });
    binder.unregisterById("input-keybind-1");

    binder.handleKey(createEvent("Enter"));

    expect(onTrigger).not.toHaveBeenCalled();
  });
});
