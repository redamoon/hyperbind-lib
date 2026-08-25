import { describe, expect, it } from "vitest";
import {
  MODIFIER_KEY_NAMES,
  buildKeyComboFromEvent,
  getModifierParts,
  isModifierKey,
  normalizeKeyName,
} from "../keyCombo";
import { createKeyEvent } from "./testUtils";

describe("isModifierKey", () => {
  it("修飾キーそのものを true と判定する", () => {
    for (const key of MODIFIER_KEY_NAMES) {
      expect(isModifierKey(key), `修飾キー扱いにならない: ${key}`).toBe(true);
    }
  });

  it("通常のキーは false と判定する", () => {
    for (const key of ["a", "S", "Enter", " ", "F2", "ArrowDown"]) {
      expect(isModifierKey(key), `修飾キー扱いになっている: ${key}`).toBe(false);
    }
  });

  it("大文字小文字を区別しない", () => {
    expect(isModifierKey("shift")).toBe(true);
    expect(isModifierKey("CONTROL")).toBe(true);
  });
});

describe("normalizeKeyName", () => {
  it("スペースを 'space' に正規化する", () => {
    expect(normalizeKeyName(" ")).toBe("space");
  });

  it("それ以外は小文字化する", () => {
    expect(normalizeKeyName("Enter")).toBe("enter");
    expect(normalizeKeyName("S")).toBe("s");
    expect(normalizeKeyName("ArrowDown")).toBe("arrowdown");
  });
});

describe("getModifierParts", () => {
  it("cmd → ctrl → shift → alt の順で返す", () => {
    expect(
      getModifierParts({ metaKey: true, ctrlKey: true, shiftKey: true, altKey: true })
    ).toEqual(["cmd", "ctrl", "shift", "alt"]);
  });

  it("押されている修飾キーのみを返す", () => {
    expect(
      getModifierParts({ metaKey: false, ctrlKey: true, shiftKey: true, altKey: false })
    ).toEqual(["ctrl", "shift"]);
  });

  it("修飾キーが無ければ空配列を返す", () => {
    expect(
      getModifierParts({ metaKey: false, ctrlKey: false, shiftKey: false, altKey: false })
    ).toEqual([]);
  });
});

describe("buildKeyComboFromEvent", () => {
  it("修飾キーとキー名を連結する", () => {
    expect(buildKeyComboFromEvent(createKeyEvent({ key: "s", ctrlKey: true }))).toBe("ctrl+s");
  });

  it("修飾キーは押下順によらず cmd → ctrl → shift → alt になる", () => {
    const combo = buildKeyComboFromEvent(
      createKeyEvent({ key: "x", altKey: true, shiftKey: true, ctrlKey: true, metaKey: true })
    );

    expect(combo).toBe("cmd+ctrl+shift+alt+x");
  });

  it("キー名は小文字化される", () => {
    expect(buildKeyComboFromEvent(createKeyEvent({ key: "S", ctrlKey: true }))).toBe("ctrl+s");
  });

  it("スペースは 'space' になる", () => {
    expect(buildKeyComboFromEvent(createKeyEvent({ key: " " }))).toBe("space");
  });

  it("修飾キー単独の押下では修飾キーのみを返す", () => {
    // Shift を単独で押すと key は "Shift" になる。
    // "ctrl+shift+shift" のような二重表記にならないことを確認する
    expect(buildKeyComboFromEvent(createKeyEvent({ key: "Shift", shiftKey: true }))).toBe("shift");
    expect(
      buildKeyComboFromEvent(createKeyEvent({ key: "Control", ctrlKey: true, shiftKey: true }))
    ).toBe("ctrl+shift");
  });

  it("修飾キーなしの通常キーはキー名のみを返す", () => {
    expect(buildKeyComboFromEvent(createKeyEvent({ key: "Enter" }))).toBe("enter");
  });
});
