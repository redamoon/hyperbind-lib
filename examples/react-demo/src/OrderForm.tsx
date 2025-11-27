import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { FormNavigator } from "@hyperbind-lib/react";
import { usePresetKeybind } from "@hyperbind-lib/react";
import { useKeybind } from "@hyperbind-lib/react";
import { useModalKeybind } from "@hyperbind-lib/react";
import { useDisableCustomKeybindsWhileMounted } from "@hyperbind-lib/react";

/**
 * 取引先のデータ型
 */
interface Customer {
  code: string;
  name: string;
  address: string;
}

/**
 * 商品のデータ型
 */
interface Product {
  code: string;
  name: string;
  price: number;
}

/**
 * 受注伝票ヘッダーのデータ型
 */
interface OrderHeader {
  date: string; // YYYY/MM/DD
  orderNumber: string;
  customerCode: string;
  customer: Customer | null;
}

/**
 * 明細行のデータ型
 */
interface OrderRow {
  id: string;
  productCode: string;
  product: Product | null;
  quantity: number;
  unitPrice: number;
  amount: number;
  remarks: string; // 備考
}

/**
 * 取引先マスタ
 */
const CUSTOMERS: Customer[] = [
  { code: "C001", name: "株式会社ABC", address: "東京都千代田区1-1-1" },
  { code: "C002", name: "株式会社XYZ", address: "大阪府大阪市2-2-2" },
  { code: "C003", name: "株式会社DEF", address: "福岡県福岡市3-3-3" },
];

/**
 * 商品マスタ
 */
const PRODUCTS: Product[] = [
  { code: "P001", name: "ノートPC", price: 98000 },
  { code: "P002", name: "マウス", price: 2500 },
  { code: "P003", name: "キーボード", price: 5800 },
  { code: "P004", name: "モニター", price: 28000 },
];

/**
 * 商品を検索（コード・名称で検索可能）
 */
function searchProduct(query: string): Product[] {
  if (!query) return PRODUCTS;
  const lowerQuery = query.toLowerCase();
  return PRODUCTS.filter(
    (product) =>
      product.code.toLowerCase().includes(lowerQuery) ||
      product.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 取引先を検索（コード・名称で検索可能）
 */
function searchCustomer(query: string): Customer[] {
  if (!query) return CUSTOMERS;
  const lowerQuery = query.toLowerCase();
  return CUSTOMERS.filter(
    (customer) =>
      customer.code.toLowerCase().includes(lowerQuery) ||
      customer.name.toLowerCase().includes(lowerQuery)
  );
}

interface OrderFormProps {
  isActive?: boolean;
}

/**
 * 受注伝票入力画面コンポーネント
 */
export const OrderForm = ({ isActive = true }: OrderFormProps) => {
  // ヘッダー情報
  const [header, setHeader] = useState<OrderHeader>({
    date: new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\//g, "/"),
    orderNumber: "",
    customerCode: "",
    customer: null,
  });

  // 付箋機能：前回入力した日付を保持
  const [stickyDate, setStickyDate] = useState<string>(header.date);

  // 明細行
  const [rows, setRows] = useState<OrderRow[]>([
    {
      id: "1",
      productCode: "",
      product: null,
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      remarks: "",
    },
  ]);

  // クリップボード（行コピー用）
  const [clipboard, setClipboard] = useState<OrderRow | null>(null);

  // サジェスト機能の状態管理
  const [suggestions, setSuggestions] = useState<{
    type: "product" | "customer";
    field: string; // rowId-fieldName または "header-customerCode"
    items: (Product | Customer)[];
    selectedIndex: number;
    position?: { top: number; left: number; width: number }; // ドロップダウンの位置
  } | null>(null);

  // ヘルプダイアログの表示状態
  const [showHelp, setShowHelp] = useState(false);

  // 入力フィールドの参照（FormNavigator用）
  const dateInputRef = useRef<HTMLInputElement>(null);
  const orderNumberInputRef = useRef<HTMLInputElement>(null);
  const customerCodeInputRef = useRef<HTMLInputElement>(null);
  
  // 各行の各フィールドのrefを管理するMap
  const rowInputRefsMap = useRef<Map<string, React.MutableRefObject<HTMLElement | null>[]>>(new Map());

  // 行のrefを取得または作成
  const getRowInputRefs = useCallback((rowId: string): React.MutableRefObject<HTMLElement | null>[] => {
    if (!rowInputRefsMap.current.has(rowId)) {
      rowInputRefsMap.current.set(rowId, [
        { current: null } as React.MutableRefObject<HTMLInputElement | null>, // productCode
        { current: null } as React.MutableRefObject<HTMLInputElement | null>, // quantity
        { current: null } as React.MutableRefObject<HTMLInputElement | null>, // unitPrice
        { current: null } as React.MutableRefObject<HTMLInputElement | null>, // remarks
      ]);
    }
    return rowInputRefsMap.current.get(rowId)!;
  }, []);

  // 不要なrefをクリーンアップ
  useEffect(() => {
    const currentRowIds = new Set(rows.map((r) => r.id));
    for (const [rowId] of rowInputRefsMap.current) {
      if (!currentRowIds.has(rowId)) {
        rowInputRefsMap.current.delete(rowId);
      }
    }
  }, [rows]);

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
        if (suggestions.field === "header-customerCode") {
          const inputElement = customerCodeInputRef.current;
          if (inputElement) {
            const position = calculatePosition(inputElement);
            if (position) {
              setSuggestions((prev) => prev ? { ...prev, position } : null);
            }
          }
        } else {
          const fieldParts = suggestions.field.split('-');
          const rowId = fieldParts[0];
          const fieldName = fieldParts[1];
          const row = rows.find((r) => r.id === rowId);
          if (row) {
            const rowRefs = getRowInputRefs(rowId);
            let targetElement: HTMLElement | null = null;
            if (fieldName === "productCode") {
              targetElement = rowRefs[0].current;
            }
            if (targetElement) {
              const position = calculatePosition(targetElement);
              if (position) {
                setSuggestions((prev) => prev ? { ...prev, position } : null);
              }
            }
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    const tableContainer = document.querySelector('.overflow-x-auto');
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      if (tableContainer) {
        tableContainer.removeEventListener('scroll', handleScroll, true);
      }
    };
  }, [suggestions, rows, getRowInputRefs]);

  // すべての入力フィールドの参照を収集（FormNavigator用）
  const allInputRefs = React.useMemo(() => {
    const refs: React.RefObject<HTMLElement>[] = [
      dateInputRef as React.RefObject<HTMLElement>,
      orderNumberInputRef as React.RefObject<HTMLElement>,
      customerCodeInputRef as React.RefObject<HTMLElement>,
    ].map(ref => ref as React.RefObject<HTMLElement>);
    rows.forEach((row) => {
      const rowRefs = getRowInputRefs(row.id);
      refs.push(rowRefs[0]); // productCode
      refs.push(rowRefs[1]); // quantity
      refs.push(rowRefs[2]); // unitPrice
      refs.push(rowRefs[3]); // remarks
    });
    return refs as React.RefObject<HTMLInputElement>[];
  }, [rows, getRowInputRefs]);

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

  // 金額フォーマット（3桁カンマ）
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString("ja-JP");
  };

  // 金額のパース（カンマを除去）
  const parseAmount = (value: string): number => {
    return parseInt(value.replace(/,/g, "")) || 0;
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

  // 合計計算
  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);

  // 新規伝票
  const handleNew = useCallback(() => {
    const newDate = stickyDate || new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\//g, "/");
    setHeader({
      date: newDate,
      orderNumber: "",
      customerCode: "",
      customer: null,
    });
    setRows([
      {
        id: "1",
        productCode: "",
        product: null,
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        remarks: "",
      },
    ]);
    dateInputRef.current?.focus();
  }, [stickyDate]);

  // 伝票登録
  const handleRegister = useCallback(() => {
    // バリデーション
    if (!header.customer) {
      alert("取引先を選択してください。");
      return;
    }

    const hasInvalidRow = rows.some(
      (row) => row.amount > 0 && !row.product
    );

    if (hasInvalidRow) {
      alert("金額が入力されている行で、商品が未選択です。");
      return;
    }

    if (rows.length === 0 || rows.every((row) => row.amount === 0)) {
      alert("受注明細を追加してください。");
      return;
    }

    // 日付を付箋に保存
    setStickyDate(header.date);

    alert(
      `受注伝票を登録しました。\n伝票番号: ${header.orderNumber || "（自動採番）"}\n日付: ${header.date}\n取引先: ${header.customer.name}\n合計金額: ${formatAmount(totalAmount)}`
    );
  }, [rows, totalAmount, header]);

  // 伝票削除
  const handleDelete = useCallback(() => {
    if (confirm("伝票を削除しますか？")) {
      handleNew();
    }
  }, [handleNew]);

  // 行挿入
  const handleInsertRow = useCallback(() => {
    const newRow: OrderRow = {
      id: `row-${Date.now()}`,
      productCode: "",
      product: null,
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      remarks: "",
    };
    setRows((prev) => [...prev, newRow]);
    // 新しい行の最初のフィールド（商品コード）にフォーカス
    setTimeout(() => {
      const newRowRefs = getRowInputRefs(newRow.id);
      newRowRefs[0].current?.focus();
    }, 0);
  }, [getRowInputRefs]);

  // 行削除
  const handleDeleteRow = useCallback(
    (rowId: string) => {
      if (rows.length === 1) {
        alert("最低1行は必要です。");
        return;
      }
      const deletedIndex = rows.findIndex((r) => r.id === rowId);
      setRows((prev) => {
        const newRows = prev.filter((row) => row.id !== rowId);
        // 削除後にフォーカスを移動
        setTimeout(() => {
          if (newRows.length > 0) {
            // 削除された行が最後の行だった場合は前の行に、そうでなければ次の行にフォーカス
            const focusIndex = deletedIndex >= newRows.length ? newRows.length - 1 : deletedIndex;
            const focusRowId = newRows[focusIndex].id;
            const focusRowRefs = getRowInputRefs(focusRowId);
            focusRowRefs[0].current?.focus(); // 商品コードフィールドにフォーカス
          }
        }, 0);
        return newRows;
      });
    },
    [rows, getRowInputRefs]
  );

  // 現在フォーカスされている行を取得
  const getFocusedRowId = useCallback((): string | null => {
    const activeElement = document.activeElement;
    if (!activeElement) return null;

    // すべての行をチェックして、activeElementがどの行のrefに属しているかを確認
    for (const row of rows) {
      const rowRefs = getRowInputRefs(row.id);
      for (const ref of rowRefs) {
        if (ref.current === activeElement) {
          return row.id;
        }
      }
    }
    return null;
  }, [rows, getRowInputRefs]);

  // 行切り取り
  const handleCutRow = useCallback((rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (row) {
      setClipboard({ ...row });
      setRows((prev) => prev.filter((r) => r.id !== rowId));
    }
  }, [rows]);

  // 行コピー
  const handleCopyRow = useCallback((rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (row) {
      setClipboard({ ...row });
    }
  }, [rows]);

  // 行貼り付け
  const handlePasteRow = useCallback(
    (rowId: string) => {
      if (!clipboard) return;
      const newRow: OrderRow = {
        ...clipboard,
        id: `row-${Date.now()}`,
      };
      const index = rows.findIndex((r) => r.id === rowId);
      if (index >= 0) {
        setRows((prev) => {
          const newRows = [...prev];
          newRows.splice(index + 1, 0, newRow);
          return newRows;
        });
      }
    },
    [clipboard, rows]
  );

  // 前行項目複写
  const handleCopyPrevRow = useCallback(
    (rowId: string) => {
      const index = rows.findIndex((r) => r.id === rowId);
      if (index > 0) {
        const prevRow = rows[index - 1];
        setRows((prev) =>
          prev.map((row) => (row.id === rowId ? { ...prevRow, id: rowId } : row))
        );
      }
    },
    [rows]
  );

  // 摘要のコピー（F5キー用）- 前行の摘要をコピー
  const handleCopyDescription = useCallback(
    (rowId: string) => {
      const index = rows.findIndex((r) => r.id === rowId);
      if (index > 0) {
        const prevRemarks = rows[index - 1].remarks;
        setRows((prev) =>
          prev.map((row) =>
            row.id === rowId ? { ...row, remarks: prevRemarks } : row
          )
        );
      }
    },
    [rows]
  );

  // キーバインド登録
  usePresetKeybind("voucher-entry-new", handleNew);
  usePresetKeybind("voucher-entry-register", handleRegister);
  usePresetKeybind("voucher-entry-delete", handleDelete);
  usePresetKeybind("voucher-entry-row-insert", handleInsertRow);
  usePresetKeybind("voucher-entry-row-cut", () => {
    if (rows.length > 0) {
      handleCutRow(rows[rows.length - 1].id);
    }
  });
  usePresetKeybind("voucher-entry-row-copy", () => {
    if (rows.length > 0) {
      handleCopyRow(rows[rows.length - 1].id);
    }
  });
  usePresetKeybind("voucher-entry-row-paste", () => {
    if (rows.length > 0) {
      handlePasteRow(rows[rows.length - 1].id);
    }
  });
  usePresetKeybind("voucher-entry-row-delete", () => {
    const focusedRowId = getFocusedRowId();
    if (focusedRowId) {
      handleDeleteRow(focusedRowId);
    } else if (rows.length > 0) {
      // フォーカスされている行がない場合は最後の行を削除
      handleDeleteRow(rows[rows.length - 1].id);
    }
  });
  usePresetKeybind("voucher-entry-row-copy-prev", () => {
    if (rows.length > 0) {
      handleCopyPrevRow(rows[rows.length - 1].id);
    }
  });

  // Ctrl+S: 登録
  useKeybind("ctrl+s", handleRegister);

  // Ctrl+Delete: 現在フォーカスされている行を削除
  useKeybind("ctrl+delete", () => {
    const focusedRowId = getFocusedRowId();
    if (focusedRowId) {
      handleDeleteRow(focusedRowId);
    } else if (rows.length > 0) {
      // フォーカスされている行がない場合は最後の行を削除
      handleDeleteRow(rows[rows.length - 1].id);
    }
  });

  // Alt+D: 日付へ移動
  usePresetKeybind("voucher-entry-date", () => {
    dateInputRef.current?.focus();
  });

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
        <h2 className="text-2xl font-bold text-gray-800">📋 受注伝票入力</h2>
        <button
          onClick={() => setShowHelp(true)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-semibold shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          title="F1: ヘルプを表示"
        >
          ❓ ヘルプ (F1)
        </button>
      </div>

      {/* ヘッダー部 */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            受注日
          </label>
          <input
            ref={dateInputRef}
            type="text"
            value={header.date}
            onChange={(e) =>
              setHeader((prev) => ({ ...prev, date: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                if (/^\d{4}\/\d{2}\/\d{2}$/.test(header.date)) {
                  orderNumberInputRef.current?.focus();
                } else {
                  const convertedDate = parseDateInput(header.date);
                  setHeader((prev) => ({ ...prev, date: convertedDate }));
                  setTimeout(() => {
                    orderNumberInputRef.current?.focus();
                  }, 0);
                }
              }
            }}
            placeholder="YYYY/MM/DD または 1, 20, 30 (今月のその日) または 0101 (1月1日)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            伝票番号
          </label>
          <input
            ref={orderNumberInputRef}
            type="text"
            value={header.orderNumber}
            onChange={(e) =>
              setHeader((prev) => ({ ...prev, orderNumber: e.target.value }))
            }
            placeholder="自動採番または手入力"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            取引先コード
          </label>
          <div className="relative">
            <input
              ref={customerCodeInputRef}
              type="text"
              value={header.customerCode}
              onChange={(e) => {
                const value = e.target.value;
                setHeader((prev) => ({ ...prev, customerCode: value }));
                if (value) {
                  const customers = searchCustomer(value);
                  const inputElement = e.target as HTMLInputElement;
                  const position = calculatePosition(inputElement);
                  setSuggestions({
                    type: "customer",
                    field: "header-customerCode",
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
                if (suggestions && suggestions.field === "header-customerCode") {
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
                    const selected = suggestions.items[suggestions.selectedIndex] as Customer;
                    if (selected) {
                      setHeader((prev) => ({
                        ...prev,
                        customerCode: selected.code,
                        customer: selected,
                      }));
                      setSuggestions(null);
                      // 最初の行の商品コードフィールドにフォーカス
                      setTimeout(() => {
                        if (rows.length > 0) {
                          const firstRowRefs = getRowInputRefs(rows[0].id);
                          firstRowRefs[0].current?.focus();
                        }
                      }, 0);
                    }
                  }
                } else if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                  // サジェストが表示されていない場合もEnterキーで次のフィールドへ移動
                  e.preventDefault();
                  e.stopPropagation();
                  if (rows.length > 0) {
                    const firstRowRefs = getRowInputRefs(rows[0].id);
                    firstRowRefs[0].current?.focus();
                  }
                }
              }}
              placeholder="例: C001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
            />
            {suggestions &&
              suggestions.field === "header-customerCode" &&
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
                    const customer = item as Customer;
                    return (
                      <div
                        key={customer.code}
                        onClick={() => {
                          setHeader((prev) => ({
                            ...prev,
                            customerCode: customer.code,
                            customer: customer,
                          }));
                          setSuggestions(null);
                          if (rows.length > 0) {
                            const firstRowRefs = getRowInputRefs(rows[0].id);
                            firstRowRefs[0].current?.focus();
                          }
                        }}
                        className={`p-2 cursor-pointer text-xs ${
                          index === suggestions.selectedIndex
                            ? "bg-blue-50"
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        {customer.code} - {customer.name}
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
          {header.customer && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
              <div><strong>会社名:</strong> {header.customer.name}</div>
              <div><strong>住所:</strong> {header.customer.address}</div>
            </div>
          )}
        </div>
      </div>

      {/* 明細グリッド部 */}
      <div className="overflow-x-auto mb-4 shadow-sm rounded-lg border border-gray-200">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">商品コード</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">商品名</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">数量</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">単価</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">金額</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">備考</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const rowRefs = getRowInputRefs(row.id);
              return (
                <tr key={row.id} data-row-id={row.id} className="hover:bg-gray-50 border-b border-gray-200 transition-colors">
                  {/* 商品コード */}
                  <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                    <div className="relative">
                      <input
                        ref={rowRefs[0] as React.RefObject<HTMLInputElement>}
                        type="text"
                        value={row.productCode}
                        onChange={(e) => {
                          const value = e.target.value;
                          setRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, productCode: value, product: null, unitPrice: 0, amount: 0 } : r
                            )
                          );
                          if (value) {
                            const products = searchProduct(value);
                            const inputElement = e.target as HTMLInputElement;
                            const position = calculatePosition(inputElement);
                            setSuggestions({
                              type: "product",
                              field: `${row.id}-productCode`,
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
                          if (suggestions && suggestions.field === `${row.id}-productCode`) {
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
                              const selected = suggestions.items[suggestions.selectedIndex] as Product;
                              if (selected) {
                                setRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id
                                      ? {
                                          ...r,
                                          productCode: selected.code,
                                          product: selected,
                                          unitPrice: selected.price,
                                          amount: selected.price * r.quantity,
                                        }
                                      : r
                                  )
                                );
                                setSuggestions(null);
                                rowRefs[1].current?.focus(); // 数量へ移動
                              }
                            }
                          } else if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                            // サジェストが表示されていない場合もEnterキーで次のフィールドへ移動
                            e.preventDefault();
                            e.stopPropagation();
                            rowRefs[1].current?.focus(); // 数量へ移動
                          }
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                        placeholder="商品コード"
                      />
                      {suggestions &&
                        suggestions.field === `${row.id}-productCode` &&
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
                              const product = item as Product;
                              return (
                                <div
                                  key={product.code}
                                  onClick={() => {
                                    setRows((prev) =>
                                      prev.map((r) =>
                                        r.id === row.id
                                          ? {
                                              ...r,
                                              productCode: product.code,
                                              product: product,
                                              unitPrice: product.price,
                                              amount: product.price * r.quantity,
                                            }
                                          : r
                                      )
                                    );
                                    setSuggestions(null);
                                    rowRefs[1].current?.focus(); // 数量へ移動
                                  }}
                                  className={`p-2 cursor-pointer text-xs ${
                                    index === suggestions.selectedIndex
                                      ? "bg-blue-50"
                                      : "bg-white hover:bg-gray-50"
                                  }`}
                                >
                                  {product.code} - {product.name} (¥{formatAmount(product.price)})
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </div>
                  </td>
                  {/* 商品名 */}
                  <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                    <div className="text-sm text-gray-700">
                      {row.product ? row.product.name : "-"}
                    </div>
                  </td>
                  {/* 数量 */}
                  <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                    <input
                      ref={rowRefs[1] as React.RefObject<HTMLInputElement>}
                      type="number"
                      value={row.quantity}
                      onChange={(e) => {
                        const quantity = parseInt(e.target.value) || 1;
                        setRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id
                              ? {
                                  ...r,
                                  quantity,
                                  amount: r.unitPrice * quantity,
                                }
                              : r
                          )
                        );
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                          e.preventDefault();
                          e.stopPropagation();
                          rowRefs[2].current?.focus(); // 単価へ移動
                        }
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                      min="1"
                    />
                  </td>
                  {/* 単価 */}
                  <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                    <input
                      ref={rowRefs[2] as React.RefObject<HTMLInputElement>}
                      type="text"
                      value={row.unitPrice > 0 ? formatAmount(row.unitPrice) : ""}
                      onChange={(e) => {
                        const unitPrice = parseAmount(e.target.value);
                        setRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id
                              ? {
                                  ...r,
                                  unitPrice,
                                  amount: unitPrice * r.quantity,
                                }
                              : r
                          )
                        );
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                          e.preventDefault();
                          e.stopPropagation();
                          rowRefs[3].current?.focus(); // 備考へ移動
                        }
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                      placeholder="単価"
                    />
                  </td>
                  {/* 金額 */}
                  <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                    <div className="text-right text-sm font-semibold text-gray-800">
                      {row.amount > 0 ? formatAmount(row.amount) : "-"}
                    </div>
                  </td>
                  {/* 備考 */}
                  <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                    <input
                      ref={rowRefs[3] as React.RefObject<HTMLInputElement>}
                      type="text"
                      value={row.remarks}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id ? { ...r, remarks: e.target.value } : r
                          )
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                          e.preventDefault();
                          e.stopPropagation();
                          const isLastRow = rowIndex === rows.length - 1;
                          if (isLastRow) {
                            // 最後の行の場合は新しい行を追加
                            handleInsertRow();
                          } else {
                            // 次の行の最初のフィールド（商品コード）にフォーカス
                            const nextRowIndex = rowIndex + 1;
                            if (nextRowIndex < rows.length) {
                              const nextRowId = rows[nextRowIndex].id;
                              const nextRowRefs = getRowInputRefs(nextRowId);
                              nextRowRefs[0].current?.focus();
                            }
                          }
                        }
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                      placeholder="備考"
                    />
                  </td>
                  {/* 操作 */}
                  <td className="p-2 overflow-hidden align-top">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                      title="この行を削除"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* 合計行 */}
          <tfoot>
            <tr className="bg-gray-100 border-t-2 border-gray-400 font-semibold">
              <td colSpan={4} className="p-3 border-r border-gray-300 text-right text-gray-700">
                合計
              </td>
              <td className="p-3 border-r border-gray-300 text-right text-gray-800">
                {formatAmount(totalAmount)}
              </td>
              <td colSpan={2} className="p-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* フッター部 */}
      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg mb-4 border border-gray-200 shadow-sm">
        <div className="font-semibold text-lg">
          合計金額: {formatAmount(totalAmount)}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleInsertRow}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-lg font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm"
            title="行を追加"
          >
            +
          </button>
          <button
            onClick={handleRegister}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-semibold shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            保存 (F12 / Ctrl+S)
          </button>
        </div>
      </div>

      {/* FormNavigator */}
      <FormNavigator inputRefs={allInputRefs} />

      {/* ヘルプダイアログ */}
      {showHelp && <OrderFormHelpDialog onClose={() => setShowHelp(false)} />}
    </div>
  );
};

/**
 * 受注伝票入力画面のヘルプダイアログ
 */
const OrderFormHelpDialog = ({ onClose }: { onClose: () => void }) => {
  useDisableCustomKeybindsWhileMounted();

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()} tabIndex={-1}>
        <h3>❓ 受注伝票入力 - ヘルプ</h3>
        
        <div style={{ textAlign: "left", marginTop: "1rem" }}>
          {/* 移動の流れ */}
          <section style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>📋 入力の流れ</h4>
            <ol style={{ paddingLeft: "1.5rem", lineHeight: "1.8" }}>
              <li><strong>受注日</strong> → 日付を入力（例: "5" → 今月5日、 "1225" → 12月25日）</li>
              <li><strong>伝票番号</strong> → 自動採番または手入力</li>
              <li><strong>取引先コード</strong> → コードを入力するとサジェストが表示されます</li>
              <li><strong>商品コード</strong> → コードを入力するとサジェストが表示されます</li>
              <li><strong>数量</strong> → 数量を入力（自動的に金額が計算されます）</li>
              <li><strong>単価</strong> → 単価を入力（自動的に金額が計算されます）</li>
              <li><strong>備考</strong> → 備考を入力後、Enterキーで次の行へ</li>
            </ol>
          </section>

          {/* キーボードショートカット */}
          <section style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>⌨️ キーボードショートカット</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem", fontSize: "0.9rem" }}>
              <div>
                <div><strong>F1</strong>: ヘルプ表示</div>
                <div><strong>F2</strong> / <strong>Shift+F8</strong>: 新規作成</div>
                <div><strong>F8</strong>: 参照</div>
                <div><strong>F9</strong>: 伝票削除</div>
                <div><strong>F12</strong> / <strong>Ctrl+S</strong>: 登録</div>
                <div><strong>Alt+D</strong>: 日付へ移動</div>
              </div>
              <div>
                <div><strong>Ctrl+Insert</strong>: 行挿入</div>
                <div><strong>Ctrl+Delete</strong>: 現在の行を削除</div>
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
              <li><strong>サジェスト機能</strong>: 取引先コードや商品コードを入力すると、候補が表示されます</li>
              <li><strong>自動計算</strong>: 数量と単価を入力すると、自動的に金額が計算されます</li>
              <li><strong>日付の簡易入力</strong>: "5"（今月5日）、"1225"（12月25日）など、短い形式で入力できます</li>
              <li><strong>行の追加</strong>: 備考フィールドでEnterキーを押すと、自動的に次の行が追加されます</li>
              <li><strong>行の削除</strong>: 削除ボタンをクリックするか、Ctrl+Deleteキーで行を削除できます</li>
            </ul>
          </section>

          {/* 注意事項 */}
          <section>
            <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>⚠️ 注意事項</h4>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: "1.8" }}>
              <li>最低1行の明細が必要です</li>
              <li>登録時には取引先の選択が必須です</li>
              <li>金額が入力されている行では、商品の選択が必須です</li>
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
