import { describe, expect, it } from "vitest";
import { createKeybindId } from "../createKeybindId";

describe("createKeybindId", () => {
  it("接頭辞から始まる ID を返す", () => {
    expect(createKeybindId("kb")).toMatch(/^kb-/);
  });

  it("呼び出しごとに異なる ID を返す", () => {
    const ids = Array.from({ length: 500 }, () => createKeybindId("kb"));

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("接頭辞が空でも ID を生成できる", () => {
    expect(createKeybindId("")).toMatch(/^-/);
  });

  it("crypto.randomUUID が無い環境でもフォールバックする", () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, "crypto");
    Object.defineProperty(globalThis, "crypto", { value: undefined, configurable: true });

    try {
      const id = createKeybindId("kb");
      expect(id).toMatch(/^kb-[0-9a-z]+-[0-9a-z]+$/);
    } finally {
      if (original) {
        Object.defineProperty(globalThis, "crypto", original);
      }
    }
  });
});
