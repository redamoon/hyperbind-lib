import React, { useState, useRef, useCallback, useEffect } from "react";
import { FormNavigator } from "@hyperbind-lib/react";
import { usePresetKeybind } from "@hyperbind-lib/react";
import { useKeybind } from "@hyperbind-lib/react";
import { useModalKeybind } from "@hyperbind-lib/react";
import { useDisableCustomKeybindsWhileMounted } from "@hyperbind-lib/react";
import { CustomerMaster, searchCustomer } from "./masters";

/**
 * 取引先入力フォームのデータ型
 */
interface CustomerFormData {
  code: string;
  name: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine: string;
  phone: string;
  fax: string;
  email: string;
  representative: string;
  contactPerson: string;
  startDate: string;
  remarks: string;
}

interface CustomerFormProps {
  isActive?: boolean;
}

/**
 * 取引先入力画面コンポーネント
 */
export const CustomerForm = ({ isActive = true }: CustomerFormProps) => {
  // フォームデータ
  const [formData, setFormData] = useState<CustomerFormData>({
    code: "",
    name: "",
    postalCode: "",
    prefecture: "",
    city: "",
    addressLine: "",
    phone: "",
    fax: "",
    email: "",
    representative: "",
    contactPerson: "",
    startDate: new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\//g, "/"),
    remarks: "",
  });

  // 付箋機能：前回入力した日付を保持
  const [stickyDate, setStickyDate] = useState<string>(formData.startDate);

  // 選択中の取引先（サジェストから選択された場合）
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerMaster | null>(null);

  // サジェスト機能の状態管理
  const [suggestions, setSuggestions] = useState<{
    type: "customer";
    field: string;
    items: CustomerMaster[];
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
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const faxInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const representativeInputRef = useRef<HTMLInputElement>(null);
  const contactPersonInputRef = useRef<HTMLInputElement>(null);
  const startDateInputRef = useRef<HTMLInputElement>(null);
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
      phoneInputRef,
      faxInputRef,
      emailInputRef,
      representativeInputRef,
      contactPersonInputRef,
      startDateInputRef,
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
      phone: "",
      fax: "",
      email: "",
      representative: "",
      contactPerson: "",
      startDate: newDate,
      remarks: "",
    });
    setSelectedCustomer(null);
    codeInputRef.current?.focus();
  }, [stickyDate]);

  // 登録
  const handleRegister = useCallback(() => {
    // バリデーション
    if (!formData.code.trim()) {
      alert("取引先コードを入力してください。");
      codeInputRef.current?.focus();
      return;
    }

    if (!formData.name.trim()) {
      alert("取引先名を入力してください。");
      nameInputRef.current?.focus();
      return;
    }

    // 日付を付箋に保存
    setStickyDate(formData.startDate);

    alert(
      `取引先を登録しました。\n取引先コード: ${formData.code}\n取引先名: ${formData.name}\n取引開始日: ${formData.startDate}`
    );
  }, [formData]);

  // 削除
  const handleDelete = useCallback(() => {
    if (!formData.code.trim()) {
      alert("削除する取引先を選択してください。");
      return;
    }
    if (confirm(`取引先「${formData.code} - ${formData.name}」を削除しますか？`)) {
      handleNew();
    }
  }, [formData, handleNew]);

  // キーバインド登録
  usePresetKeybind("voucher-entry-new", handleNew);
  usePresetKeybind("voucher-entry-register", handleRegister);
  usePresetKeybind("voucher-entry-delete", handleDelete);
  usePresetKeybind("voucher-entry-date", () => {
    startDateInputRef.current?.focus();
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
        <h2 className="text-2xl font-bold text-gray-800">🏢 取引先入力</h2>
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
        {/* 取引先コード */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            取引先コード <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              ref={codeInputRef}
              type="text"
              value={formData.code}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({ ...prev, code: value }));
                setSelectedCustomer(null);
                if (value) {
                  const customers = searchCustomer(value);
                  const inputElement = e.target as HTMLInputElement;
                  const position = calculatePosition(inputElement);
                  setSuggestions({
                    type: "customer",
                    field: "code",
                    items: customers,
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
                        phone: selected.phone || "",
                        fax: selected.fax || "",
                        email: selected.email || "",
                        representative: selected.representative || "",
                        contactPerson: selected.contactPerson || "",
                        startDate: selected.startDate || formData.startDate,
                        remarks: selected.remarks || "",
                      });
                      setSelectedCustomer(selected);
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
                    const customers = searchCustomer(code);
                    const exactMatch = customers.find(c => c.code === code);
                    if (exactMatch) {
                      // 既存の取引先が見つかった場合、データを読み込む
                      setFormData({
                        code: exactMatch.code,
                        name: exactMatch.name || "",
                        postalCode: exactMatch.postalCode || "",
                        prefecture: exactMatch.prefecture || "",
                        city: exactMatch.city || "",
                        addressLine: exactMatch.addressLine || "",
                        phone: exactMatch.phone || "",
                        fax: exactMatch.fax || "",
                        email: exactMatch.email || "",
                        representative: exactMatch.representative || "",
                        contactPerson: exactMatch.contactPerson || "",
                        startDate: exactMatch.startDate || formData.startDate,
                        remarks: exactMatch.remarks || "",
                      });
                      setSelectedCustomer(exactMatch);
                      setSuggestions(null);
                      nameInputRef.current?.focus();
                    } else {
                      // 新規の取引先コードの場合、次のフィールドへ移動
                      setSelectedCustomer(null);
                      setSuggestions(null);
                      nameInputRef.current?.focus();
                    }
                  } else {
                    // コードが空の場合は次のフィールドへ移動
                    nameInputRef.current?.focus();
                  }
                }
              }}
              placeholder="例: C001"
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
                            phone: item.phone || "",
                            fax: item.fax || "",
                            email: item.email || "",
                            representative: item.representative || "",
                            contactPerson: item.contactPerson || "",
                            startDate: item.startDate || formData.startDate,
                            remarks: item.remarks || "",
                          });
                          setSelectedCustomer(item);
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

        {/* 取引先名 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            取引先名 <span className="text-red-500">*</span>
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
            placeholder="例: 株式会社ABC"
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
                phoneInputRef.current?.focus();
              }
            }}
            placeholder="例: 千代田1-1-1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 電話番号 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            電話番号
          </label>
          <input
            ref={phoneInputRef}
            type="text"
            value={formData.phone}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phone: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                faxInputRef.current?.focus();
              }
            }}
            placeholder="例: 03-1234-5678"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* FAX番号 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            FAX番号
          </label>
          <input
            ref={faxInputRef}
            type="text"
            value={formData.fax}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, fax: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                emailInputRef.current?.focus();
              }
            }}
            placeholder="例: 03-1234-5679"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* メールアドレス */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            メールアドレス
          </label>
          <input
            ref={emailInputRef}
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                representativeInputRef.current?.focus();
              }
            }}
            placeholder="例: info@example.co.jp"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 代表者名 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            代表者名
          </label>
          <input
            ref={representativeInputRef}
            type="text"
            value={formData.representative}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, representative: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                contactPersonInputRef.current?.focus();
              }
            }}
            placeholder="例: 山田太郎"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 担当者名 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            担当者名
          </label>
          <input
            ref={contactPersonInputRef}
            type="text"
            value={formData.contactPerson}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, contactPerson: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                startDateInputRef.current?.focus();
              }
            }}
            placeholder="例: 佐藤花子"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 取引開始日 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            取引開始日
          </label>
          <input
            ref={startDateInputRef}
            type="text"
            value={formData.startDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, startDate: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                if (/^\d{4}\/\d{2}\/\d{2}$/.test(formData.startDate)) {
                  remarksInputRef.current?.focus();
                } else {
                  const convertedDate = parseDateInput(formData.startDate);
                  setFormData((prev) => ({ ...prev, startDate: convertedDate }));
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
      {showHelp && <CustomerFormHelpDialog onClose={() => setShowHelp(false)} />}
    </div>
  );
};

/**
 * 取引先入力画面のヘルプダイアログ
 */
const CustomerFormHelpDialog = ({ onClose }: { onClose: () => void }) => {
  useDisableCustomKeybindsWhileMounted();

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()} tabIndex={-1}>
        <h3>❓ 取引先入力 - ヘルプ</h3>
        
        <div style={{ textAlign: "left", marginTop: "1rem" }}>
          {/* 入力の流れ */}
          <section style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>📋 入力の流れ</h4>
            <ol style={{ paddingLeft: "1.5rem", lineHeight: "1.8" }}>
              <li><strong>取引先コード</strong> → コードを入力するとサジェストが表示されます（必須）</li>
              <li><strong>取引先名</strong> → 取引先名を入力（必須）</li>
              <li><strong>郵便番号</strong> → 郵便番号を入力</li>
              <li><strong>都道府県</strong> → 都道府県を入力</li>
              <li><strong>市区町村</strong> → 市区町村を入力</li>
              <li><strong>番地・建物名</strong> → 番地・建物名を入力</li>
              <li><strong>電話番号</strong> → 電話番号を入力</li>
              <li><strong>FAX番号</strong> → FAX番号を入力</li>
              <li><strong>メールアドレス</strong> → メールアドレスを入力</li>
              <li><strong>代表者名</strong> → 代表者名を入力</li>
              <li><strong>担当者名</strong> → 担当者名を入力</li>
              <li><strong>取引開始日</strong> → 日付を入力（例: "5" → 今月5日、 "1225" → 12月25日）</li>
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
                <div><strong>Alt+D</strong>: 取引開始日へ移動</div>
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
              <li><strong>サジェスト機能</strong>: 取引先コードを入力すると、候補が表示されます</li>
              <li><strong>日付の簡易入力</strong>: "5"（今月5日）、"1225"（12月25日）など、短い形式で入力できます</li>
              <li><strong>自動入力</strong>: サジェストから取引先を選択すると、関連情報が自動入力されます</li>
            </ul>
          </section>

          {/* 注意事項 */}
          <section>
            <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>⚠️ 注意事項</h4>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: "1.8" }}>
              <li>取引先コードと取引先名は必須項目です</li>
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

