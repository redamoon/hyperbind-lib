import { describe, expect, it } from "vitest";
import {
  keyFromCode,
  normalizeKeyCombo,
  normalizeKeyName,
  swapCmdCtrl,
} from "../normalizeKeyCombo";
import { buildKeyComboFromEvent, isModifierKey, resolveEventKey } from "../keyCombo";

describe("normalizeKeyCombo", () => {
  it("修飾キーを正準順序（cmd → ctrl → shift → alt）に並べ替える", () => {
    expect(normalizeKeyCombo("alt+shift+n")).toBe("shift+alt+n");
    expect(normalizeKeyCombo("shift+ctrl+s")).toBe("ctrl+shift+s");
    expect(normalizeKeyCombo("alt+ctrl+cmd+shift+k")).toBe("cmd+ctrl+shift+alt+k");
  });

  it("順序違いの表記が同じ正準形になる", () => {
    expect(normalizeKeyCombo("alt+shift+n")).toBe(normalizeKeyCombo("shift+alt+n"));
    expect(normalizeKeyCombo("shift+ctrl+s")).toBe(normalizeKeyCombo("ctrl+shift+s"));
  });

  it("修飾キーの別名を統一する", () => {
    expect(normalizeKeyCombo("cmd+option+i")).toBe("cmd+alt+i");
    expect(normalizeKeyCombo("meta+s")).toBe("cmd+s");
    expect(normalizeKeyCombo("Command+S")).toBe("cmd+s");
    expect(normalizeKeyCombo("control+shift+j")).toBe("ctrl+shift+j");
  });

  it("大文字・空白を吸収する", () => {
    expect(normalizeKeyCombo("  CTRL+S  ")).toBe("ctrl+s");
  });

  it("重複した修飾キーを取り除く", () => {
    expect(normalizeKeyCombo("ctrl+control+s")).toBe("ctrl+s");
  });

  it("キー名の別名を解決する", () => {
    expect(normalizeKeyCombo("ctrl+esc")).toBe("ctrl+escape");
    expect(normalizeKeyCombo("ctrl+up")).toBe("ctrl+arrowup");
    expect(normalizeKeyCombo(" ")).toBe("space");
    expect(normalizeKeyCombo("ctrl+ ")).toBe("ctrl+space");
    expect(normalizeKeyCombo("ctrl+space")).toBe("ctrl+space");
  });

  it('"+" 自体をキーとして扱える', () => {
    expect(normalizeKeyCombo("ctrl++")).toBe("ctrl++");
  });

  it("空文字列を安全に扱う", () => {
    expect(normalizeKeyCombo("")).toBe("");
  });
});

describe("normalizeKeyName", () => {
  it("修飾キーの別名を解決する", () => {
    expect(normalizeKeyName("Option")).toBe("alt");
    expect(normalizeKeyName("Meta")).toBe("cmd");
    expect(normalizeKeyName("Control")).toBe("ctrl");
  });

  it("スペースを space に正規化する", () => {
    expect(normalizeKeyName(" ")).toBe("space");
  });
});

describe("keyFromCode", () => {
  it("Digit / Numpad / Key を論理キー名に変換する", () => {
    expect(keyFromCode("Digit1")).toBe("1");
    expect(keyFromCode("Numpad7")).toBe("7");
    expect(keyFromCode("KeyA")).toBe("a");
  });

  it("変換できない場合は null を返す", () => {
    expect(keyFromCode("Enter")).toBeNull();
    expect(keyFromCode(undefined)).toBeNull();
  });
});

describe("swapCmdCtrl", () => {
  it("cmd と ctrl を入れ替える", () => {
    expect(swapCmdCtrl("cmd+s")).toBe("ctrl+s");
    expect(swapCmdCtrl("ctrl+shift+s")).toBe("cmd+shift+s");
  });

  it("両方または片方も含まない場合は null を返す", () => {
    expect(swapCmdCtrl("cmd+ctrl+s")).toBeNull();
    expect(swapCmdCtrl("shift+alt+n")).toBeNull();
  });
});

describe("buildKeyComboFromEvent", () => {
  const evt = (overrides: Partial<KeyboardEvent>) =>
    ({
      key: "a",
      code: "KeyA",
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      ...overrides,
    }) as KeyboardEvent;

  it("押されたキーを正準形で返す", () => {
    expect(
      buildKeyComboFromEvent(evt({ key: "n", code: "KeyN", shiftKey: true, altKey: true }))
    ).toBe("shift+alt+n");
  });

  it("修飾キーの順序を正準順序に揃える", () => {
    expect(
      buildKeyComboFromEvent(evt({ key: "s", code: "KeyS", ctrlKey: true, shiftKey: true }))
    ).toBe("ctrl+shift+s");
  });

  it("Shift + 数字を記号ではなく数字として組み立てる", () => {
    expect(buildKeyComboFromEvent(evt({ key: "!", code: "Digit1", shiftKey: true }))).toBe(
      "shift+1"
    );
  });

  it("スペースキーを space に正規化する", () => {
    expect(buildKeyComboFromEvent(evt({ key: " ", code: "Space", ctrlKey: true }))).toBe(
      "ctrl+space"
    );
  });

  it("修飾キー単体の押下では修飾キーのみを返す", () => {
    expect(buildKeyComboFromEvent(evt({ key: "Shift", code: "ShiftLeft", shiftKey: true }))).toBe(
      "shift"
    );
    expect(
      buildKeyComboFromEvent(
        evt({ key: "Control", code: "ControlLeft", ctrlKey: true, shiftKey: true })
      )
    ).toBe("ctrl+shift");
  });
});

describe("resolveEventKey", () => {
  const evt = (overrides: Partial<KeyboardEvent>) =>
    ({
      key: "a",
      code: "KeyA",
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      ...overrides,
    }) as KeyboardEvent;

  it("Shift + 数字を数字に読み替える", () => {
    expect(resolveEventKey(evt({ key: "!", code: "Digit1", shiftKey: true }))).toBe("1");
  });

  it("event.key が判別できない場合は event.code にフォールバックする", () => {
    expect(resolveEventKey(evt({ key: "Unidentified", code: "KeyA" }))).toBe("a");
  });
});

describe("isModifierKey", () => {
  it("修飾キーそのものを判定する", () => {
    expect(isModifierKey("Shift")).toBe(true);
    expect(isModifierKey("Meta")).toBe(true);
    expect(isModifierKey("CapsLock")).toBe(true);
    expect(isModifierKey("s")).toBe(false);
  });
});
