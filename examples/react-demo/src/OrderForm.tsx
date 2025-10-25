import React, { useState, useRef, useCallback } from "react";
import { useInputKeybind, FormNavigator } from "@hyperbind/react";

interface Customer {
  code: string;
  name: string;
  address: string;
}

interface Product {
  code: string;
  name: string;
  price: number;
}

interface OrderItem {
  product: Product;
  quantity: number;
  amount: number;
}

const CUSTOMERS: Customer[] = [
  { code: "C001", name: "株式会社ABC", address: "東京都千代田区1-1-1" },
  { code: "C002", name: "株式会社XYZ", address: "大阪府大阪市2-2-2" },
  { code: "C003", name: "株式会社DEF", address: "福岡県福岡市3-3-3" },
];

const PRODUCTS: Product[] = [
  { code: "P001", name: "ノートPC", price: 98000 },
  { code: "P002", name: "マウス", price: 2500 },
  { code: "P003", name: "キーボード", price: 5800 },
  { code: "P004", name: "モニター", price: 28000 },
];

export const OrderForm = () => {
  const [customerCode, setCustomerCode] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [currentProductCode, setCurrentProductCode] = useState("");
  const [currentQuantity, setCurrentQuantity] = useState("1");

  const customerCodeRef = useRef<HTMLInputElement>(null);
  const productCodeRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);

  // 取引先コード入力でCmd+Enter (Mac) / Ctrl+Enter (Windows/Linux) を押すと取引先を検索
  const handleCustomerCodeEnter = useCallback(() => {
    const found = CUSTOMERS.find((c) => c.code === customerCode);
    if (found) {
      setCustomer(found);
    } else {
      alert("取引先が見つかりません");
      setCustomer(null);
    }
  }, [customerCode]);

  useInputKeybind({
    elementRef: customerCodeRef,
    keyCombo: "cmd+enter",
    onTrigger: handleCustomerCodeEnter,
  });

  // 商品コード入力でEnterを押すと数量に移動
  const handleProductCodeEnter = useCallback(() => {
    const found = PRODUCTS.find((p) => p.code === currentProductCode);
    if (found) {
      quantityRef.current?.focus();
    } else {
      alert("商品が見つかりません");
    }
  }, [currentProductCode]);

  useInputKeybind({
    elementRef: productCodeRef,
    keyCombo: "enter",
    onTrigger: handleProductCodeEnter,
  });

  // 数量入力でEnterを押すと受注明細に追加
  const handleQuantityEnter = useCallback(() => {
    const found = PRODUCTS.find((p) => p.code === currentProductCode);
    const qty = parseInt(currentQuantity) || 1;
    if (found) {
      const newItem: OrderItem = {
        product: found,
        quantity: qty,
        amount: found.price * qty,
      };
      setOrderItems((prev) => [...prev, newItem]);
      setCurrentProductCode("");
      setCurrentQuantity("1");
      productCodeRef.current?.focus();
    }
  }, [currentProductCode, currentQuantity]);

  useInputKeybind({
    elementRef: quantityRef,
    keyCombo: "enter",
    onTrigger: handleQuantityEnter,
  });

  const totalAmount = orderItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      <h1>📋 受注伝票入力画面</h1>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ marginTop: 0 }}>取引先情報</h2>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            取引先コード:
            <input
              ref={customerCodeRef}
              type="text"
              value={customerCode}
              onChange={(e) => setCustomerCode(e.target.value)}
              placeholder="例: C001"
              style={{
                marginLeft: "0.5rem",
                padding: "0.5rem",
                width: "150px",
              }}
            />
            <span style={{ marginLeft: "1rem", fontSize: "0.9rem", color: "#666" }}>
              ⌘+Enter: 検索
            </span>
          </label>
        </div>
        {customer && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
            }}
          >
            <div>
              <strong>会社名:</strong> {customer.name}
            </div>
            <div>
              <strong>住所:</strong> {customer.address}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ marginTop: 0 }}>受注明細入力</h2>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              商品コード:
              <input
                ref={productCodeRef}
                type="text"
                value={currentProductCode}
                onChange={(e) => setCurrentProductCode(e.target.value)}
                placeholder="例: P001"
                style={{
                  marginLeft: "0.5rem",
                  padding: "0.5rem",
                  width: "100%",
                }}
              />
            </label>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              数量:
              <input
                ref={quantityRef}
                type="number"
                value={currentQuantity}
                onChange={(e) => setCurrentQuantity(e.target.value)}
                style={{
                  marginLeft: "0.5rem",
                  padding: "0.5rem",
                  width: "100%",
                }}
              />
            </label>
          </div>
        </div>
        <p style={{ fontSize: "0.9rem", color: "#666" }}>
          商品コード入力 → Enter: 数量に移動 | 数量入力 → Enter: 明細に追加
        </p>

        {orderItems.length > 0 && (
          <div style={{ marginTop: "2rem" }}>
            <h3>受注明細一覧</h3>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "1rem",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <th style={{ padding: "0.5rem", border: "1px solid #ddd" }}>商品コード</th>
                  <th style={{ padding: "0.5rem", border: "1px solid #ddd" }}>商品名</th>
                  <th style={{ padding: "0.5rem", border: "1px solid #ddd", textAlign: "right" }}>単価</th>
                  <th style={{ padding: "0.5rem", border: "1px solid #ddd", textAlign: "right" }}>数量</th>
                  <th style={{ padding: "0.5rem", border: "1px solid #ddd", textAlign: "right" }}>金額</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item, index) => (
                  <tr key={index}>
                    <td style={{ padding: "0.5rem", border: "1px solid #ddd" }}>
                      {item.product.code}
                    </td>
                    <td style={{ padding: "0.5rem", border: "1px solid #ddd" }}>
                      {item.product.name}
                    </td>
                    <td style={{ padding: "0.5rem", border: "1px solid #ddd", textAlign: "right" }}>
                      ¥{item.product.price.toLocaleString()}
                    </td>
                    <td style={{ padding: "0.5rem", border: "1px solid #ddd", textAlign: "right" }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: "0.5rem", border: "1px solid #ddd", textAlign: "right" }}>
                      ¥{item.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
                  <td
                    colSpan={4}
                    style={{ padding: "0.5rem", border: "1px solid #ddd", textAlign: "right" }}
                  >
                    合計金額:
                  </td>
                  <td style={{ padding: "0.5rem", border: "1px solid #ddd", textAlign: "right" }}>
                    ¥{totalAmount.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <button
          onClick={() => {
            setCustomerCode("");
            setCustomer(null);
            setOrderItems([]);
            setCurrentProductCode("");
            setCurrentQuantity("1");
          }}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#f44336",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          クリア
        </button>
        <button
          onClick={() => {
            if (!customer) {
              alert("取引先を選択してください");
              return;
            }
            if (orderItems.length === 0) {
              alert("受注明細を追加してください");
              return;
            }
            alert(`受注伝票を登録しました！\n取引先: ${customer.name}\n合計金額: ¥${totalAmount.toLocaleString()}`);
          }}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#4CAF50",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          登録
        </button>
      </div>
    </div>
  );
};
