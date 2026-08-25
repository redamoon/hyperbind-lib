import { describe, expect, it } from "vitest";
import { RESERVED_KEYS, getReservedKeyWarning, isReservedKey } from "../reservedKeys";

describe("isReservedKey", () => {
  it("予約キーを検出する", () => {
    expect(isReservedKey("ctrl+s")).toBe(true);
    expect(isReservedKey("cmd+s")).toBe(true);
    expect(isReservedKey("f5")).toBe(true);
  });

  it("大文字や前後の空白を吸収する", () => {
    expect(isReservedKey("  CTRL+S  ")).toBe(true);
  });

  it("修飾キーの順序や別名の違いを吸収する", () => {
    expect(isReservedKey("shift+ctrl+r")).toBe(true);
    expect(isReservedKey("cmd+option+i")).toBe(true);
    expect(isReservedKey("cmd+alt+i")).toBe(true);
    expect(isReservedKey("meta+s")).toBe(true);
  });

  it("予約されていないキーはfalseを返す", () => {
    expect(isReservedKey("ctrl+alt+9")).toBe(false);
    expect(isReservedKey("f7")).toBe(false);
  });

  it("RESERVED_KEYS に含まれるキーはすべて予約キーと判定される", () => {
    for (const key of RESERVED_KEYS) {
      expect(isReservedKey(key), key).toBe(true);
    }
  });
});

describe("getReservedKeyWarning", () => {
  it("予約キーには警告メッセージを返す", () => {
    expect(getReservedKeyWarning("ctrl+s")).toContain("ブラウザ");
  });

  it("予約キーでない場合はnullを返す", () => {
    expect(getReservedKeyWarning("ctrl+alt+9")).toBeNull();
  });
});
