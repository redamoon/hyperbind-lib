/**
 * keyCombo.ts のうち、normalizeKeyCombo.test.ts が扱っていない部分のテスト
 *
 * buildKeyComboFromEvent / resolveEventKey / isModifierKey の主要な振る舞いは
 * normalizeKeyCombo.test.ts が担当します。こちらは
 * - MODIFIER_KEY_NAMES と isModifierKey の整合性（定数の追加漏れ検出）
 * - getModifierParts
 * を対象にします。
 */
import { describe, expect, it } from "vitest";
import { MODIFIER_KEY_NAMES, getModifierParts, isModifierKey } from "../keyCombo";

describe("MODIFIER_KEY_NAMES と isModifierKey の整合性", () => {
  it("定数に並ぶキーはすべて修飾キーと判定される", () => {
    for (const key of MODIFIER_KEY_NAMES) {
      expect(isModifierKey(key), `修飾キー扱いにならない: ${key}`).toBe(true);
    }
  });

  it("通常のキーは修飾キーと判定されない", () => {
    for (const key of ["a", "S", "Enter", " ", "F2", "ArrowDown", "1", "!"]) {
      expect(isModifierKey(key), `修飾キー扱いになっている: ${key}`).toBe(false);
    }
  });

  it("大文字小文字を区別しない", () => {
    expect(isModifierKey("shift")).toBe(true);
    expect(isModifierKey("CONTROL")).toBe(true);
    expect(isModifierKey("aLt")).toBe(true);
  });
});

describe("getModifierParts", () => {
  it("cmd → ctrl → shift → alt の正準順序で返す", () => {
    expect(
      getModifierParts({ metaKey: true, ctrlKey: true, shiftKey: true, altKey: true })
    ).toEqual(["cmd", "ctrl", "shift", "alt"]);
  });

  it("押されている修飾キーのみを返す", () => {
    expect(
      getModifierParts({ metaKey: false, ctrlKey: true, shiftKey: true, altKey: false })
    ).toEqual(["ctrl", "shift"]);
    expect(
      getModifierParts({ metaKey: true, ctrlKey: false, shiftKey: false, altKey: true })
    ).toEqual(["cmd", "alt"]);
  });

  it("修飾キーが無ければ空配列を返す", () => {
    expect(
      getModifierParts({ metaKey: false, ctrlKey: false, shiftKey: false, altKey: false })
    ).toEqual([]);
  });
});
