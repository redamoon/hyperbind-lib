import { describe, expect, it } from "vitest";
import {
  ALL_PRESET_KEYBINDS,
  COMMON_KEYBINDS,
  LEDGER_KEYBINDS,
  getKeybindById,
  getKeybindsByCategory,
  type PresetKeybind,
} from "../PresetKeybinds";

/** ALL_PRESET_KEYBINDS に含まれる全カテゴリ */
const ALL_CATEGORIES = Array.from(
  new Set(ALL_PRESET_KEYBINDS.map((keybind) => keybind.category))
) as PresetKeybind["category"][];

describe("ALL_PRESET_KEYBINDS", () => {
  it("空ではない", () => {
    expect(ALL_PRESET_KEYBINDS.length).toBeGreaterThan(0);
  });

  it("id が一意である", () => {
    const ids = ALL_PRESET_KEYBINDS.map((keybind) => keybind.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

    expect(Array.from(new Set(duplicates))).toEqual([]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("すべてのエントリが必須フィールドを持つ", () => {
    for (const keybind of ALL_PRESET_KEYBINDS) {
      expect(keybind.id, `id が空: ${JSON.stringify(keybind)}`).toBeTruthy();
      expect(keybind.keyCombo, `keyCombo が空: ${keybind.id}`).toBeTruthy();
      expect(keybind.label, `label が空: ${keybind.id}`).toBeTruthy();
      expect(keybind.description, `description が空: ${keybind.id}`).toBeTruthy();
      expect(keybind.category, `category が空: ${keybind.id}`).toBeTruthy();
      expect(typeof keybind.preventDefault, `preventDefault が boolean でない: ${keybind.id}`).toBe(
        "boolean"
      );
    }
  });

  it("keyCombo は小文字で、前後に空白を含まない", () => {
    for (const keybind of ALL_PRESET_KEYBINDS) {
      expect(keybind.keyCombo, `keyCombo が小文字でない: ${keybind.id}`).toBe(
        keybind.keyCombo.toLowerCase()
      );
      expect(keybind.keyCombo, `keyCombo に空白がある: ${keybind.id}`).toBe(
        keybind.keyCombo.trim()
      );
    }
  });

  it("各カテゴリ別定数の内容をすべて含む", () => {
    for (const keybind of [...LEDGER_KEYBINDS, ...COMMON_KEYBINDS]) {
      expect(ALL_PRESET_KEYBINDS).toContain(keybind);
    }
  });
});

describe("getKeybindById", () => {
  it("存在する id の定義を返す", () => {
    const expected = ALL_PRESET_KEYBINDS[0];

    expect(getKeybindById(expected.id)).toEqual(expected);
  });

  it("すべての id で該当する定義を引ける", () => {
    for (const keybind of ALL_PRESET_KEYBINDS) {
      expect(getKeybindById(keybind.id), `引けない id: ${keybind.id}`).toBe(keybind);
    }
  });

  it("存在しない id には undefined を返す", () => {
    expect(getKeybindById("does-not-exist")).toBeUndefined();
  });

  it("空文字には undefined を返す", () => {
    expect(getKeybindById("")).toBeUndefined();
  });

  it("id の大文字小文字は区別される", () => {
    const target = ALL_PRESET_KEYBINDS[0];

    expect(getKeybindById(target.id.toUpperCase())).toBeUndefined();
  });
});

describe("getKeybindsByCategory", () => {
  it("指定カテゴリの定義のみを返す", () => {
    const result = getKeybindsByCategory("ledger");

    expect(result.length).toBeGreaterThan(0);
    for (const keybind of result) {
      expect(keybind.category).toBe("ledger");
    }
  });

  it("該当カテゴリの定義を漏れなく返す", () => {
    expect(getKeybindsByCategory("ledger")).toEqual(LEDGER_KEYBINDS);
    expect(getKeybindsByCategory("common")).toEqual(COMMON_KEYBINDS);
  });

  it("全カテゴリの結果を合計すると ALL_PRESET_KEYBINDS の件数になる", () => {
    const total = ALL_CATEGORIES.reduce(
      (sum, category) => sum + getKeybindsByCategory(category).length,
      0
    );

    expect(total).toBe(ALL_PRESET_KEYBINDS.length);
  });

  it("どのカテゴリも空にならない（未使用カテゴリの検出）", () => {
    for (const category of ALL_CATEGORIES) {
      expect(getKeybindsByCategory(category).length, `空のカテゴリ: ${category}`).toBeGreaterThan(
        0
      );
    }
  });

  it("該当がないカテゴリには空配列を返す", () => {
    // 型上は存在するが定義が 1 件もないカテゴリを渡した場合
    const unusedCategory = "not-a-real-category" as PresetKeybind["category"];

    expect(getKeybindsByCategory(unusedCategory)).toEqual([]);
  });
});
