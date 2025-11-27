import React, { useState, useRef, useCallback, useEffect } from "react";
import { FormNavigator } from "@hyperbind-lib/react";
import { usePresetKeybind } from "@hyperbind-lib/react";
import { useKeybind } from "@hyperbind-lib/react";
import { useModalKeybind } from "@hyperbind-lib/react";
import { useDisableCustomKeybindsWhileMounted } from "@hyperbind-lib/react";
import { PropertyMaster, searchProperty, ContractMaster, searchContract } from "./masters";

/**
 * 契約入力フォームのデータ型
 */
interface ContractFormData {
  contractNumber: string;
  propertyCode: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  rent: string;
  managementFee: string;
  deposit: string;
  keyMoney: string;
  renewalDate: string;
  remarks: string;
}

interface ContractFormProps {
  isActive?: boolean;
}

/**
 * 契約入力画面コンポーネント
 */
export const ContractForm = ({ isActive = true }: ContractFormProps) => {
  // フォームデータ
  const [formData, setFormData] = useState<ContractFormData>({
    contractNumber: "",
    propertyCode: "",
    tenantName: "",
    startDate: new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\//g, "/"),
    endDate: "",
    rent: "",
    managementFee: "",
    deposit: "",
    keyMoney: "",
    renewalDate: "",
    remarks: "",
  });

  // 付箋機能：前回入力した日付を保持
  const [stickyDate, setStickyDate] = useState<string>(formData.startDate);

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
  const contractNumberInputRef = useRef<HTMLInputElement>(null);
  const propertyCodeInputRef = useRef<HTMLInputElement>(null);
  const tenantNameInputRef = useRef<HTMLInputElement>(null);
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);
  const rentInputRef = useRef<HTMLInputElement>(null);
  const managementFeeInputRef = useRef<HTMLInputElement>(null);
  const depositInputRef = useRef<HTMLInputElement>(null);
  const keyMoneyInputRef = useRef<HTMLInputElement>(null);
  const renewalDateInputRef = useRef<HTMLInputElement>(null);
  const remarksInputRef = useRef<HTMLInputElement>(null);

  // すべての入力フィールドの参照を収集（FormNavigator用）
  const allInputRefs = React.useMemo(() => {
    return [
      contractNumberInputRef,
      propertyCodeInputRef,
      tenantNameInputRef,
      startDateInputRef,
      endDateInputRef,
      rentInputRef,
      managementFeeInputRef,
      depositInputRef,
      keyMoneyInputRef,
      renewalDateInputRef,
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
        if (suggestions.field === "propertyCode") {
          const inputElement = propertyCodeInputRef.current;
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
      contractNumber: "",
      propertyCode: "",
      tenantName: "",
      startDate: newDate,
      endDate: "",
      rent: "",
      managementFee: "",
      deposit: "",
      keyMoney: "",
      renewalDate: "",
      remarks: "",
    });
    setSelectedProperty(null);
    contractNumberInputRef.current?.focus();
  }, [stickyDate]);

  // 登録
  const handleRegister = useCallback(() => {
    // バリデーション
    if (!formData.contractNumber.trim()) {
      alert("契約番号を入力してください。");
      contractNumberInputRef.current?.focus();
      return;
    }

    if (!formData.propertyCode.trim()) {
      alert("物件コードを入力してください。");
      propertyCodeInputRef.current?.focus();
      return;
    }

    if (!formData.tenantName.trim()) {
      alert("入居者名を入力してください。");
      tenantNameInputRef.current?.focus();
      return;
    }

    if (!formData.startDate.trim()) {
      alert("契約開始日を入力してください。");
      startDateInputRef.current?.focus();
      return;
    }

    // 日付を付箋に保存
    setStickyDate(formData.startDate);

    alert(
      `契約を登録しました。\n契約番号: ${formData.contractNumber}\n物件コード: ${formData.propertyCode}\n入居者名: ${formData.tenantName}\n契約開始日: ${formData.startDate}`
    );
  }, [formData]);

  // 削除
  const handleDelete = useCallback(() => {
    if (!formData.contractNumber.trim()) {
      alert("削除する契約を選択してください。");
      return;
    }
    if (confirm(`契約「${formData.contractNumber} - ${formData.tenantName}」を削除しますか？`)) {
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
        <h2 className="text-2xl font-bold text-gray-800">📋 契約管理</h2>
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
        {/* 契約番号 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            契約番号 <span className="text-red-500">*</span>
          </label>
          <input
            ref={contractNumberInputRef}
            type="text"
            value={formData.contractNumber}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, contractNumber: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                propertyCodeInputRef.current?.focus();
              }
            }}
            placeholder="例: C001"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 物件コード */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            物件コード <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              ref={propertyCodeInputRef}
              type="text"
              value={formData.propertyCode}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({ ...prev, propertyCode: value }));
                setSelectedProperty(null);
                if (value) {
                  const properties = searchProperty(value);
                  const inputElement = e.target as HTMLInputElement;
                  const position = calculatePosition(inputElement);
                  setSuggestions({
                    type: "property",
                    field: "propertyCode",
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
                if (suggestions && suggestions.field === "propertyCode") {
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
                      setFormData((prev) => ({
                        ...prev,
                        propertyCode: selected.code,
                        rent: selected.rent?.toString() || prev.rent,
                        managementFee: selected.managementFee?.toString() || prev.managementFee,
                        deposit: selected.deposit?.toString() || prev.deposit,
                        keyMoney: selected.keyMoney?.toString() || prev.keyMoney,
                      }));
                      setSelectedProperty(selected);
                      setSuggestions(null);
                      tenantNameInputRef.current?.focus();
                    }
                  }
                } else if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                  // サジェストが表示されていない場合、マスタを検索して完全一致するコードがあれば読み込む
                  e.preventDefault();
                  e.stopPropagation();
                  const code = formData.propertyCode.trim();
                  if (code) {
                    // マスタから完全一致するコードを検索
                    const properties = searchProperty(code);
                    const exactMatch = properties.find(p => p.code === code);
                    if (exactMatch) {
                      // 既存の物件が見つかった場合、データを読み込む
                      setFormData((prev) => ({
                        ...prev,
                        propertyCode: exactMatch.code,
                        rent: exactMatch.rent?.toString() || prev.rent,
                        managementFee: exactMatch.managementFee?.toString() || prev.managementFee,
                        deposit: exactMatch.deposit?.toString() || prev.deposit,
                        keyMoney: exactMatch.keyMoney?.toString() || prev.keyMoney,
                      }));
                      setSelectedProperty(exactMatch);
                      setSuggestions(null);
                      tenantNameInputRef.current?.focus();
                    } else {
                      // 新規の物件コードの場合、次のフィールドへ移動
                      setSelectedProperty(null);
                      setSuggestions(null);
                      tenantNameInputRef.current?.focus();
                    }
                  } else {
                    // コードが空の場合は次のフィールドへ移動
                    tenantNameInputRef.current?.focus();
                  }
                }
              }}
              placeholder="例: P001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
            />
            {suggestions &&
              suggestions.field === "propertyCode" &&
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
                          setFormData((prev) => ({
                            ...prev,
                            propertyCode: item.code,
                            rent: item.rent?.toString() || prev.rent,
                            managementFee: item.managementFee?.toString() || prev.managementFee,
                            deposit: item.deposit?.toString() || prev.deposit,
                            keyMoney: item.keyMoney?.toString() || prev.keyMoney,
                          }));
                          setSelectedProperty(item);
                          setSuggestions(null);
                          tenantNameInputRef.current?.focus();
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

        {/* 入居者名 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            入居者名 <span className="text-red-500">*</span>
          </label>
          <input
            ref={tenantNameInputRef}
            type="text"
            value={formData.tenantName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, tenantName: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                startDateInputRef.current?.focus();
              }
            }}
            placeholder="例: 山田太郎"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 契約開始日 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            契約開始日 <span className="text-red-500">*</span>
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
                  endDateInputRef.current?.focus();
                } else {
                  const convertedDate = parseDateInput(formData.startDate);
                  setFormData((prev) => ({ ...prev, startDate: convertedDate }));
                  setTimeout(() => {
                    endDateInputRef.current?.focus();
                  }, 0);
                }
              }
            }}
            placeholder="YYYY/MM/DD または 1, 20, 30 (今月のその日) または 0101 (1月1日)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 契約終了日 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            契約終了日
          </label>
          <input
            ref={endDateInputRef}
            type="text"
            value={formData.endDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, endDate: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                if (/^\d{4}\/\d{2}\/\d{2}$/.test(formData.endDate) || !formData.endDate) {
                  rentInputRef.current?.focus();
                } else {
                  const convertedDate = parseDateInput(formData.endDate);
                  setFormData((prev) => ({ ...prev, endDate: convertedDate }));
                  setTimeout(() => {
                    rentInputRef.current?.focus();
                  }, 0);
                }
              }
            }}
            placeholder="YYYY/MM/DD または 1, 20, 30 (今月のその日) または 0101 (1月1日)"
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
                renewalDateInputRef.current?.focus();
              }
            }}
            placeholder="例: 80000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 更新日 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            更新日
          </label>
          <input
            ref={renewalDateInputRef}
            type="text"
            value={formData.renewalDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, renewalDate: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                if (/^\d{4}\/\d{2}\/\d{2}$/.test(formData.renewalDate) || !formData.renewalDate) {
                  remarksInputRef.current?.focus();
                } else {
                  const convertedDate = parseDateInput(formData.renewalDate);
                  setFormData((prev) => ({ ...prev, renewalDate: convertedDate }));
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
      {showHelp && <ContractFormHelpDialog onClose={() => setShowHelp(false)} />}
    </div>
  );
};

/**
 * 契約入力画面のヘルプダイアログ
 */
const ContractFormHelpDialog = ({ onClose }: { onClose: () => void }) => {
  useDisableCustomKeybindsWhileMounted();

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()} tabIndex={-1}>
        <h3>❓ 契約管理 - ヘルプ</h3>
        
        <div style={{ textAlign: "left", marginTop: "1rem" }}>
          {/* 入力の流れ */}
          <section style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>📋 入力の流れ</h4>
            <ol style={{ paddingLeft: "1.5rem", lineHeight: "1.8" }}>
              <li><strong>契約番号</strong> → 契約番号を入力（必須）</li>
              <li><strong>物件コード</strong> → コードを入力するとサジェストが表示されます（必須）</li>
              <li><strong>入居者名</strong> → 入居者名を入力（必須）</li>
              <li><strong>契約開始日</strong> → 日付を入力（必須、例: "5" → 今月5日、 "1225" → 12月25日）</li>
              <li><strong>契約終了日</strong> → 日付を入力</li>
              <li><strong>家賃</strong> → 家賃を入力</li>
              <li><strong>管理費</strong> → 管理費を入力</li>
              <li><strong>敷金</strong> → 敷金を入力</li>
              <li><strong>礼金</strong> → 礼金を入力</li>
              <li><strong>更新日</strong> → 日付を入力</li>
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
                <div><strong>Alt+D</strong>: 契約開始日へ移動</div>
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
              <li><strong>自動入力</strong>: サジェストから物件を選択すると、家賃・管理費・敷金・礼金が自動入力されます</li>
              <li><strong>日付の簡易入力</strong>: "5"（今月5日）、"1225"（12月25日）など、短い形式で入力できます</li>
            </ul>
          </section>

          {/* 注意事項 */}
          <section>
            <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>⚠️ 注意事項</h4>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: "1.8" }}>
              <li>契約番号、物件コード、入居者名、契約開始日は必須項目です</li>
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


