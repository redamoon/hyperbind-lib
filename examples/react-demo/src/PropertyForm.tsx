import React, { useState, useRef, useCallback, useEffect } from "react";
import { FormNavigator } from "@hyperbind-lib/react";
import { usePresetKeybind } from "@hyperbind-lib/react";
import { useKeybind } from "@hyperbind-lib/react";
import { useModalKeybind } from "@hyperbind-lib/react";
import { useDisableCustomKeybindsWhileMounted } from "@hyperbind-lib/react";
import { PropertyMaster, searchProperty } from "./masters";

/**
 * 物件入力フォームのデータ型
 */
interface PropertyFormData {
  code: string;
  name: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine: string;
  rent: string;
  managementFee: string;
  deposit: string;
  keyMoney: string;
  age: string;
  layout: string;
  registrationDate: string;
  remarks: string;
}

interface PropertyFormProps {
  isActive?: boolean;
}

/**
 * 物件入力画面コンポーネント
 */
export const PropertyForm = ({ isActive = true }: PropertyFormProps) => {
  // フォームデータ
  const [formData, setFormData] = useState<PropertyFormData>({
    code: "",
    name: "",
    postalCode: "",
    prefecture: "",
    city: "",
    addressLine: "",
    rent: "",
    managementFee: "",
    deposit: "",
    keyMoney: "",
    age: "",
    layout: "",
    registrationDate: new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\//g, "/"),
    remarks: "",
  });

  // 付箋機能：前回入力した日付を保持
  const [stickyDate, setStickyDate] = useState<string>(formData.registrationDate);

  // 選択中の物件（サジェストから選択された場合）
  const [selectedProperty, setSelectedProperty] = useState<PropertyMaster | null>(null);

  // サジェスト機能の状態管理
  const [suggestions, setSuggestions] = useState<{
    type: "property";
    field: string;
    items: PropertyMaster[];
    selectedIndex: number;
    position?: { top: number; left: number; width: number };
  } | null>(null);

  // ヘルプダイアログの表示状態
  const [showHelp, setShowHelp] = useState(false);

  // 入力フィールドの参照（FormNavigator用）
  const codeInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const postalCodeInputRef = useRef<HTMLInputElement>(null);
  const prefectureInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const addressLineInputRef = useRef<HTMLInputElement>(null);
  const rentInputRef = useRef<HTMLInputElement>(null);
  const managementFeeInputRef = useRef<HTMLInputElement>(null);
  const depositInputRef = useRef<HTMLInputElement>(null);
  const keyMoneyInputRef = useRef<HTMLInputElement>(null);
  const ageInputRef = useRef<HTMLInputElement>(null);
  const layoutInputRef = useRef<HTMLInputElement>(null);
  const registrationDateInputRef = useRef<HTMLInputElement>(null);
  const remarksInputRef = useRef<HTMLInputElement>(null);

  // すべての入力フィールドの参照を収集（FormNavigator用）
  const allInputRefs = React.useMemo(() => {
    return [
      codeInputRef,
      nameInputRef,
      postalCodeInputRef,
      prefectureInputRef,
      cityInputRef,
      addressLineInputRef,
      rentInputRef,
      managementFeeInputRef,
      depositInputRef,
      keyMoneyInputRef,
      ageInputRef,
      layoutInputRef,
      registrationDateInputRef,
      remarksInputRef,
    ] as React.RefObject<HTMLInputElement>[];
  }, []);

  // サジェストドロップダウンを外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestions && !(e.target as Element).closest('.suggestions-container')) {
        setSuggestions(null);
      }
    };
    if (suggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [suggestions]);

  // スクロール時にサジェストの位置を再計算
  useEffect(() => {
    if (!suggestions) return;

    const handleScroll = () => {
      if (suggestions && suggestions.position) {
        if (suggestions.field === "code") {
          const inputElement = codeInputRef.current;
          if (inputElement) {
            const position = calculatePosition(inputElement);
            if (position) {
              setSuggestions((prev) => prev ? { ...prev, position } : null);
            }
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [suggestions]);

  // 要素の位置を計算するヘルパー関数
  const calculatePosition = (element: HTMLElement | null): { top: number; left: number; width: number } | undefined => {
    if (!element) return undefined;
    const rect = element.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
    };
  };

  // 月の日数を取得する関数
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate();
  };

  // 日付変換ロジック
  const parseDateInput = (input: string): string => {
    // 既にYYYY/MM/DD形式の場合はそのまま返す
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(input)) {
      return input;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // 数字のみの入力を処理
    const numericInput = input.replace(/\D/g, "");

    if (numericInput.length === 1) {
      // 1桁: 今月のその日
      const day = parseInt(numericInput, 10);
      const daysInMonth = getDaysInMonth(currentYear, currentMonth);
      if (day >= 1 && day <= daysInMonth) {
        const monthStr = currentMonth.toString().padStart(2, "0");
        const dayStr = day.toString().padStart(2, "0");
        return `${currentYear}/${monthStr}/${dayStr}`;
      }
    } else if (numericInput.length === 2) {
      // 2桁: 今月のその日
      const day = parseInt(numericInput, 10);
      const daysInMonth = getDaysInMonth(currentYear, currentMonth);
      if (day >= 1 && day <= daysInMonth) {
        const monthStr = currentMonth.toString().padStart(2, "0");
        const dayStr = day.toString().padStart(2, "0");
        return `${currentYear}/${monthStr}/${dayStr}`;
      }
    } else if (numericInput.length === 4) {
      // 4桁: MMDD形式として解釈
      const month = parseInt(numericInput.substring(0, 2), 10);
      const day = parseInt(numericInput.substring(2, 4), 10);
      if (month >= 1 && month <= 12) {
        const daysInMonth = getDaysInMonth(currentYear, month);
        if (day >= 1 && day <= daysInMonth) {
          const monthStr = month.toString().padStart(2, "0");
          const dayStr = day.toString().padStart(2, "0");
          return `${currentYear}/${monthStr}/${dayStr}`;
        }
      }
    }

    // 変換できない場合はそのまま返す
    return input;
  };

  // 新規作成
  const handleNew = useCallback(() => {
    const newDate = stickyDate || new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\//g, "/");
    setFormData({
      code: "",
      name: "",
      postalCode: "",
      prefecture: "",
      city: "",
      addressLine: "",
      rent: "",
      managementFee: "",
      deposit: "",
      keyMoney: "",
      age: "",
      layout: "",
      registrationDate: newDate,
      remarks: "",
    });
    setSelectedProperty(null);
    codeInputRef.current?.focus();
  }, [stickyDate]);

  // 登録
  const handleRegister = useCallback(() => {
    // バリデーション
    if (!formData.code.trim()) {
      alert("物件コードを入力してください。");
      codeInputRef.current?.focus();
      return;
    }

    if (!formData.name.trim()) {
      alert("物件名を入力してください。");
      nameInputRef.current?.focus();
      return;
    }

    // 日付を付箋に保存
    setStickyDate(formData.registrationDate);

    alert(
      `物件を登録しました。\n物件コード: ${formData.code}\n物件名: ${formData.name}\n登録日: ${formData.registrationDate}`
    );
  }, [formData]);

  // 削除
  const handleDelete = useCallback(() => {
    if (!formData.code.trim()) {
      alert("削除する物件を選択してください。");
      return;
    }
    if (confirm(`物件「${formData.code} - ${formData.name}」を削除しますか？`)) {
      handleNew();
    }
  }, [formData, handleNew]);

  // キーバインド登録
  usePresetKeybind("voucher-entry-new", handleNew);
  usePresetKeybind("voucher-entry-register", handleRegister);
  usePresetKeybind("voucher-entry-delete", handleDelete);
  usePresetKeybind("voucher-entry-date", () => {
    registrationDateInputRef.current?.focus();
  });

  // Ctrl+S: 登録
  useKeybind("ctrl+s", handleRegister);

  // F1: ヘルプ表示
  useModalKeybind({
    keyCombo: "f1",
    onOpen: () => setShowHelp(true),
    onClose: () => setShowHelp(false),
    isOpen: showHelp,
  });

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🏠 物件台帳</h2>
        <button
          onClick={() => setShowHelp(true)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-semibold shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          title="F1: ヘルプを表示"
        >
          ❓ ヘルプ (F1)
        </button>
      </div>

      {/* 入力フォーム */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        {/* 物件コード */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            物件コード <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              ref={codeInputRef}
              type="text"
              value={formData.code}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({ ...prev, code: value }));
                setSelectedProperty(null);
                if (value) {
                  const properties = searchProperty(value);
                  const inputElement = e.target as HTMLInputElement;
                  const position = calculatePosition(inputElement);
                  setSuggestions({
                    type: "property",
                    field: "code",
                    items: properties,
                    selectedIndex: 0,
                    position,
                  });
                } else {
                  setSuggestions(null);
                }
              }}
              onBlur={() => setTimeout(() => setSuggestions(null), 200)}
              onKeyDown={(e) => {
                if (suggestions && suggestions.field === "code") {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSuggestions((prev) =>
                      prev
                        ? {
                            ...prev,
                            selectedIndex: Math.min(
                              prev.selectedIndex + 1,
                              prev.items.length - 1
                            ),
                          }
                        : null
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSuggestions((prev) =>
                      prev
                        ? {
                            ...prev,
                            selectedIndex: Math.max(prev.selectedIndex - 1, 0),
                          }
                        : null
                    );
                  } else if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                    e.preventDefault();
                    e.stopPropagation();
                    const selected = suggestions.items[suggestions.selectedIndex];
                    if (selected) {
                      setFormData({
                        code: selected.code,
                        name: selected.name || "",
                        postalCode: selected.postalCode || "",
                        prefecture: selected.prefecture || "",
                        city: selected.city || "",
                        addressLine: selected.addressLine || "",
                        rent: selected.rent?.toString() || "",
                        managementFee: selected.managementFee?.toString() || "",
                        deposit: selected.deposit?.toString() || "",
                        keyMoney: selected.keyMoney?.toString() || "",
                        age: selected.age?.toString() || "",
                        layout: selected.layout || "",
                        registrationDate: selected.registrationDate || formData.registrationDate,
                        remarks: selected.remarks || "",
                      });
                      setSelectedProperty(selected);
                      setSuggestions(null);
                      nameInputRef.current?.focus();
                    }
                  }
                } else if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                  // サジェストが表示されていない場合、マスタを検索して完全一致するコードがあれば読み込む
                  e.preventDefault();
                  e.stopPropagation();
                  const code = formData.code.trim();
                  if (code) {
                    // マスタから完全一致するコードを検索
                    const properties = searchProperty(code);
                    const exactMatch = properties.find(p => p.code === code);
                    if (exactMatch) {
                      // 既存の物件が見つかった場合、データを読み込む
                      setFormData({
                        code: exactMatch.code,
                        name: exactMatch.name || "",
                        postalCode: exactMatch.postalCode || "",
                        prefecture: exactMatch.prefecture || "",
                        city: exactMatch.city || "",
                        addressLine: exactMatch.addressLine || "",
                        rent: exactMatch.rent?.toString() || "",
                        managementFee: exactMatch.managementFee?.toString() || "",
                        deposit: exactMatch.deposit?.toString() || "",
                        keyMoney: exactMatch.keyMoney?.toString() || "",
                        age: exactMatch.age?.toString() || "",
                        layout: exactMatch.layout || "",
                        registrationDate: exactMatch.registrationDate || formData.registrationDate,
                        remarks: exactMatch.remarks || "",
                      });
                      setSelectedProperty(exactMatch);
                      setSuggestions(null);
                      nameInputRef.current?.focus();
                    } else {
                      // 新規の物件コードの場合、次のフィールドへ移動
                      setSelectedProperty(null);
                      setSuggestions(null);
                      nameInputRef.current?.focus();
                    }
                  } else {
                    // コードが空の場合は次のフィールドへ移動
                    nameInputRef.current?.focus();
                  }
                }
              }}
              placeholder="例: P001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
            />
            {suggestions &&
              suggestions.field === "code" &&
              suggestions.items.length > 0 &&
              suggestions.position && (
                <div
                  className="fixed bg-white border border-gray-300 rounded max-h-[150px] overflow-y-auto z-[1000] shadow-lg mt-1 suggestions-container"
                  style={{
                    top: `${suggestions.position.top}px`,
                    left: `${suggestions.position.left}px`,
                    width: `${suggestions.position.width}px`,
                  }}
                >
                  {suggestions.items.map((item, index) => {
                    return (
                      <div
                        key={item.code}
                        onClick={() => {
                          setFormData({
                            code: item.code,
                            name: item.name || "",
                            postalCode: item.postalCode || "",
                            prefecture: item.prefecture || "",
                            city: item.city || "",
                            addressLine: item.addressLine || "",
                            rent: item.rent?.toString() || "",
                            managementFee: item.managementFee?.toString() || "",
                            deposit: item.deposit?.toString() || "",
                            keyMoney: item.keyMoney?.toString() || "",
                            age: item.age?.toString() || "",
                            layout: item.layout || "",
                            registrationDate: item.registrationDate || formData.registrationDate,
                            remarks: item.remarks || "",
                          });
                          setSelectedProperty(item);
                          setSuggestions(null);
                          nameInputRef.current?.focus();
                        }}
                        className={`p-2 cursor-pointer text-xs ${
                          index === suggestions.selectedIndex
                            ? "bg-blue-50"
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        {item.code} - {item.name}
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        </div>

        {/* 物件名 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            物件名 <span className="text-red-500">*</span>
          </label>
          <input
            ref={nameInputRef}
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                postalCodeInputRef.current?.focus();
              }
            }}
            placeholder="例: サンライズマンション101"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 郵便番号 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            郵便番号
          </label>
          <input
            ref={postalCodeInputRef}
            type="text"
            value={formData.postalCode}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, postalCode: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                prefectureInputRef.current?.focus();
              }
            }}
            placeholder="例: 100-0001"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 都道府県 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            都道府県
          </label>
          <input
            ref={prefectureInputRef}
            type="text"
            value={formData.prefecture}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, prefecture: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                cityInputRef.current?.focus();
              }
            }}
            placeholder="例: 東京都"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 市区町村 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            市区町村
          </label>
          <input
            ref={cityInputRef}
            type="text"
            value={formData.city}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, city: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                addressLineInputRef.current?.focus();
              }
            }}
            placeholder="例: 千代田区"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 番地・建物名 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            番地・建物名
          </label>
          <input
            ref={addressLineInputRef}
            type="text"
            value={formData.addressLine}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, addressLine: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                rentInputRef.current?.focus();
              }
            }}
            placeholder="例: 千代田1-1-1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 家賃 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            家賃
          </label>
          <input
            ref={rentInputRef}
            type="text"
            value={formData.rent}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, rent: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                managementFeeInputRef.current?.focus();
              }
            }}
            placeholder="例: 80000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 管理費 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            管理費
          </label>
          <input
            ref={managementFeeInputRef}
            type="text"
            value={formData.managementFee}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, managementFee: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                depositInputRef.current?.focus();
              }
            }}
            placeholder="例: 5000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 敷金 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            敷金
          </label>
          <input
            ref={depositInputRef}
            type="text"
            value={formData.deposit}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, deposit: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                keyMoneyInputRef.current?.focus();
              }
            }}
            placeholder="例: 160000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 礼金 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            礼金
          </label>
          <input
            ref={keyMoneyInputRef}
            type="text"
            value={formData.keyMoney}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, keyMoney: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                ageInputRef.current?.focus();
              }
            }}
            placeholder="例: 80000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 築年数 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            築年数
          </label>
          <input
            ref={ageInputRef}
            type="text"
            value={formData.age}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, age: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                layoutInputRef.current?.focus();
              }
            }}
            placeholder="例: 5"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 間取り */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            間取り
          </label>
          <input
            ref={layoutInputRef}
            type="text"
            value={formData.layout}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, layout: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                registrationDateInputRef.current?.focus();
              }
            }}
            placeholder="例: 1LDK"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 登録日 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            登録日
          </label>
          <input
            ref={registrationDateInputRef}
            type="text"
            value={formData.registrationDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, registrationDate: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                if (/^\d{4}\/\d{2}\/\d{2}$/.test(formData.registrationDate)) {
                  remarksInputRef.current?.focus();
                } else {
                  const convertedDate = parseDateInput(formData.registrationDate);
                  setFormData((prev) => ({ ...prev, registrationDate: convertedDate }));
                  setTimeout(() => {
                    remarksInputRef.current?.focus();
                  }, 0);
                }
              }
            }}
            placeholder="YYYY/MM/DD または 1, 20, 30 (今月のその日) または 0101 (1月1日)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 備考 */}
        <div className="col-span-2">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            備考
          </label>
          <input
            ref={remarksInputRef}
            type="text"
            value={formData.remarks}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, remarks: e.target.value }))
            }
            placeholder="備考を入力"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>
      </div>

      {/* フッター部 */}
      <div className="flex justify-end gap-2 p-4 bg-gray-50 rounded-lg mb-4 border border-gray-200 shadow-sm">
        <button
          onClick={handleNew}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm"
        >
          新規 (F2)
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-semibold shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
        >
          削除 (F9)
        </button>
        <button
          onClick={handleRegister}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-semibold shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        >
          保存 (F12 / Ctrl+S)
        </button>
      </div>

      {/* FormNavigator */}
      <FormNavigator inputRefs={allInputRefs} />

      {/* ヘルプダイアログ */}
      {showHelp && <PropertyFormHelpDialog onClose={() => setShowHelp(false)} />}
    </div>
  );
};

/**
 * 物件入力画面のヘルプダイアログ
 */
const PropertyFormHelpDialog = ({ onClose }: { onClose: () => void }) => {
  useDisableCustomKeybindsWhileMounted();

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()} tabIndex={-1}>
        <h3>❓ 物件台帳 - ヘルプ</h3>
        
        <div style={{ textAlign: "left", marginTop: "1rem" }}>
          {/* 入力の流れ */}
          <section style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>📋 入力の流れ</h4>
            <ol style={{ paddingLeft: "1.5rem", lineHeight: "1.8" }}>
              <li><strong>物件コード</strong> → コードを入力するとサジェストが表示されます（必須）</li>
              <li><strong>物件名</strong> → 物件名を入力（必須）</li>
              <li><strong>郵便番号</strong> → 郵便番号を入力</li>
              <li><strong>都道府県</strong> → 都道府県を入力</li>
              <li><strong>市区町村</strong> → 市区町村を入力</li>
              <li><strong>番地・建物名</strong> → 番地・建物名を入力</li>
              <li><strong>家賃</strong> → 家賃を入力</li>
              <li><strong>管理費</strong> → 管理費を入力</li>
              <li><strong>敷金</strong> → 敷金を入力</li>
              <li><strong>礼金</strong> → 礼金を入力</li>
              <li><strong>築年数</strong> → 築年数を入力</li>
              <li><strong>間取り</strong> → 間取りを入力</li>
              <li><strong>登録日</strong> → 日付を入力（例: "5" → 今月5日、 "1225" → 12月25日）</li>
              <li><strong>備考</strong> → 備考を入力</li>
            </ol>
          </section>

          {/* キーボードショートカット */}
          <section style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>⌨️ キーボードショートカット</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem", fontSize: "0.9rem" }}>
              <div>
                <div><strong>F1</strong>: ヘルプ表示</div>
                <div><strong>F2</strong> / <strong>Shift+F8</strong>: 新規作成</div>
                <div><strong>F9</strong>: 削除</div>
                <div><strong>F12</strong> / <strong>Ctrl+S</strong>: 登録</div>
                <div><strong>Alt+D</strong>: 登録日へ移動</div>
              </div>
              <div>
                <div><strong>Tab</strong> / <strong>Enter</strong>: 次のフィールドへ移動</div>
                <div><strong>Shift+Tab</strong>: 前のフィールドへ移動</div>
                <div><strong>↑↓</strong>: サジェスト内で移動</div>
                <div><strong>Esc</strong>: ダイアログを閉じる</div>
              </div>
            </div>
          </section>

          {/* 便利な機能 */}
          <section style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>💡 便利な機能</h4>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: "1.8" }}>
              <li><strong>サジェスト機能</strong>: 物件コードを入力すると、候補が表示されます</li>
              <li><strong>日付の簡易入力</strong>: "5"（今月5日）、"1225"（12月25日）など、短い形式で入力できます</li>
              <li><strong>自動入力</strong>: サジェストから物件を選択すると、関連情報が自動入力されます</li>
            </ul>
          </section>

          {/* 注意事項 */}
          <section>
            <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>⚠️ 注意事項</h4>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: "1.8" }}>
              <li>物件コードと物件名は必須項目です</li>
              <li>登録時には必須項目の入力が必須です</li>
            </ul>
          </section>
        </div>

        <button 
          onClick={onClose}
          style={{
            padding: "0.5rem 1.5rem",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            marginTop: "1rem",
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.3)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  background: "#fff",
  padding: "2rem",
  borderRadius: "8px",
  minWidth: "400px",
  maxWidth: "800px",
  maxHeight: "90vh",
  overflowY: "auto",
};

