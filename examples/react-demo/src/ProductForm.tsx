import React, { useState, useRef, useCallback, useEffect } from "react";
import { FormNavigator } from "@hyperbind-lib/react";
import { usePresetKeybind } from "@hyperbind-lib/react";
import { useKeybind } from "@hyperbind-lib/react";
import { useModalKeybind } from "@hyperbind-lib/react";
import { useDisableCustomKeybindsWhileMounted } from "@hyperbind-lib/react";
import { ProductMaster, searchProduct } from "./masters";

/**
 * 商品入力フォームのデータ型
 */
interface ProductFormData {
  code: string;
  name: string;
  unit: string;
  category: string;
  purchasePrice: string;
  sellingPrice: string;
  stock: string;
  startDate: string;
  remarks: string;
}

interface ProductFormProps {
  isActive?: boolean;
}

/**
 * 商品入力画面コンポーネント
 */
export const ProductForm = ({ isActive = true }: ProductFormProps) => {
  // フォームデータ
  const [formData, setFormData] = useState<ProductFormData>({
    code: "",
    name: "",
    unit: "",
    category: "",
    purchasePrice: "",
    sellingPrice: "",
    stock: "",
    startDate: new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\//g, "/"),
    remarks: "",
  });

  // 付箋機能：前回入力した日付を保持
  const [stickyDate, setStickyDate] = useState<string>(formData.startDate);

  // 選択中の商品（サジェストから選択された場合）
  const [selectedProduct, setSelectedProduct] = useState<ProductMaster | null>(null);

  // サジェスト機能の状態管理
  const [suggestions, setSuggestions] = useState<{
    type: "product";
    field: string;
    items: ProductMaster[];
    selectedIndex: number;
    position?: { top: number; left: number; width: number };
  } | null>(null);

  // ヘルプダイアログの表示状態
  const [showHelp, setShowHelp] = useState(false);

  // 入力フィールドの参照（FormNavigator用）
  const codeInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const unitInputRef = useRef<HTMLInputElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const purchasePriceInputRef = useRef<HTMLInputElement>(null);
  const sellingPriceInputRef = useRef<HTMLInputElement>(null);
  const stockInputRef = useRef<HTMLInputElement>(null);
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const remarksInputRef = useRef<HTMLInputElement>(null);

  // すべての入力フィールドの参照を収集（FormNavigator用）
  const allInputRefs = React.useMemo(() => {
    return [
      codeInputRef,
      nameInputRef,
      unitInputRef,
      categoryInputRef,
      purchasePriceInputRef,
      sellingPriceInputRef,
      stockInputRef,
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

  // 金額フォーマット（3桁カンマ）
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString("ja-JP");
  };

  // 金額のパース（カンマを除去）
  const parseAmount = (value: string): number => {
    return parseInt(value.replace(/,/g, "")) || 0;
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
      unit: "",
      category: "",
      purchasePrice: "",
      sellingPrice: "",
      stock: "",
      startDate: newDate,
      remarks: "",
    });
    setSelectedProduct(null);
    codeInputRef.current?.focus();
  }, [stickyDate]);

  // 登録
  const handleRegister = useCallback(() => {
    // バリデーション
    if (!formData.code.trim()) {
      alert("商品コードを入力してください。");
      codeInputRef.current?.focus();
      return;
    }

    if (!formData.name.trim()) {
      alert("商品名を入力してください。");
      nameInputRef.current?.focus();
      return;
    }

    // 日付を付箋に保存
    setStickyDate(formData.startDate);

    alert(
      `商品を登録しました。\n商品コード: ${formData.code}\n商品名: ${formData.name}\n販売単価: ${formData.sellingPrice ? formatAmount(parseAmount(formData.sellingPrice)) : "-"}`
    );
  }, [formData]);

  // 削除
  const handleDelete = useCallback(() => {
    if (!formData.code.trim()) {
      alert("削除する商品を選択してください。");
      return;
    }
    if (confirm(`商品「${formData.code} - ${formData.name}」を削除しますか？`)) {
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
        <h2 className="text-2xl font-bold text-gray-800">📦 商品入力</h2>
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
        {/* 商品コード */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            商品コード <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              ref={codeInputRef}
              type="text"
              value={formData.code}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({ ...prev, code: value }));
                setSelectedProduct(null);
                if (value) {
                  const products = searchProduct(value);
                  const inputElement = e.target as HTMLInputElement;
                  const position = calculatePosition(inputElement);
                  setSuggestions({
                    type: "product",
                    field: "code",
                    items: products,
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
                        unit: selected.unit || "",
                        category: selected.category || "",
                        purchasePrice: selected.purchasePrice ? formatAmount(selected.purchasePrice) : "",
                        sellingPrice: selected.sellingPrice ? formatAmount(selected.sellingPrice) : "",
                        stock: selected.stock?.toString() || "",
                        startDate: selected.startDate || formData.startDate,
                        remarks: selected.remarks || "",
                      });
                      setSelectedProduct(selected);
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
                    const products = searchProduct(code);
                    const exactMatch = products.find(p => p.code === code);
                    if (exactMatch) {
                      // 既存の商品が見つかった場合、データを読み込む
                      setFormData({
                        code: exactMatch.code,
                        name: exactMatch.name || "",
                        unit: exactMatch.unit || "",
                        category: exactMatch.category || "",
                        purchasePrice: exactMatch.purchasePrice ? formatAmount(exactMatch.purchasePrice) : "",
                        sellingPrice: exactMatch.sellingPrice ? formatAmount(exactMatch.sellingPrice) : "",
                        stock: exactMatch.stock?.toString() || "",
                        startDate: exactMatch.startDate || formData.startDate,
                        remarks: exactMatch.remarks || "",
                      });
                      setSelectedProduct(exactMatch);
                      setSuggestions(null);
                      nameInputRef.current?.focus();
                    } else {
                      // 新規の商品コードの場合、次のフィールドへ移動
                      setSelectedProduct(null);
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
                            unit: item.unit || "",
                            category: item.category || "",
                            purchasePrice: item.purchasePrice ? formatAmount(item.purchasePrice) : "",
                            sellingPrice: item.sellingPrice ? formatAmount(item.sellingPrice) : "",
                            stock: item.stock?.toString() || "",
                            startDate: item.startDate || formData.startDate,
                            remarks: item.remarks || "",
                          });
                          setSelectedProduct(item);
                          setSuggestions(null);
                          nameInputRef.current?.focus();
                        }}
                        className={`p-2 cursor-pointer text-xs ${
                          index === suggestions.selectedIndex
                            ? "bg-blue-50"
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        {item.code} - {item.name} (¥{formatAmount(item.sellingPrice)})
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        </div>

        {/* 商品名 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            商品名 <span className="text-red-500">*</span>
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
                unitInputRef.current?.focus();
              }
            }}
            placeholder="例: ノートPC"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 単位 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            単位
          </label>
          <input
            ref={unitInputRef}
            type="text"
            value={formData.unit}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, unit: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                categoryInputRef.current?.focus();
              }
            }}
            placeholder="例: 台、個、箱"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* カテゴリ */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            カテゴリ
          </label>
          <input
            ref={categoryInputRef}
            type="text"
            value={formData.category}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, category: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                purchasePriceInputRef.current?.focus();
              }
            }}
            placeholder="例: PC、周辺機器"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 仕入単価 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            仕入単価
          </label>
          <input
            ref={purchasePriceInputRef}
            type="text"
            value={formData.purchasePrice}
            onChange={(e) => {
              const value = e.target.value;
              setFormData((prev) => ({ ...prev, purchasePrice: value }));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                sellingPriceInputRef.current?.focus();
              }
            }}
            placeholder="例: 80,000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 販売単価 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            販売単価
          </label>
          <input
            ref={sellingPriceInputRef}
            type="text"
            value={formData.sellingPrice}
            onChange={(e) => {
              const value = e.target.value;
              setFormData((prev) => ({ ...prev, sellingPrice: value }));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                stockInputRef.current?.focus();
              }
            }}
            placeholder="例: 98,000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 在庫数 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            在庫数
          </label>
          <input
            ref={stockInputRef}
            type="text"
            value={formData.stock}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, stock: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                startDateInputRef.current?.focus();
              }
            }}
            placeholder="例: 10"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>

        {/* 登録日 */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            登録日
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
      {showHelp && <ProductFormHelpDialog onClose={() => setShowHelp(false)} />}
    </div>
  );
};

/**
 * 商品入力画面のヘルプダイアログ
 */
const ProductFormHelpDialog = ({ onClose }: { onClose: () => void }) => {
  useDisableCustomKeybindsWhileMounted();

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()} tabIndex={-1}>
        <h3>❓ 商品入力 - ヘルプ</h3>
        
        <div style={{ textAlign: "left", marginTop: "1rem" }}>
          {/* 入力の流れ */}
          <section style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>📋 入力の流れ</h4>
            <ol style={{ paddingLeft: "1.5rem", lineHeight: "1.8" }}>
              <li><strong>商品コード</strong> → コードを入力するとサジェストが表示されます（必須）</li>
              <li><strong>商品名</strong> → 商品名を入力（必須）</li>
              <li><strong>単位</strong> → 単位を入力（例: 台、個、箱）</li>
              <li><strong>カテゴリ</strong> → カテゴリを入力</li>
              <li><strong>仕入単価</strong> → 仕入単価を入力</li>
              <li><strong>販売単価</strong> → 販売単価を入力</li>
              <li><strong>在庫数</strong> → 在庫数を入力</li>
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
              <li><strong>サジェスト機能</strong>: 商品コードを入力すると、候補が表示されます</li>
              <li><strong>日付の簡易入力</strong>: "5"（今月5日）、"1225"（12月25日）など、短い形式で入力できます</li>
              <li><strong>自動入力</strong>: サジェストから商品を選択すると、関連情報が自動入力されます</li>
            </ul>
          </section>

          {/* 注意事項 */}
          <section>
            <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>⚠️ 注意事項</h4>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: "1.8" }}>
              <li>商品コードと商品名は必須項目です</li>
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

