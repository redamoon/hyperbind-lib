<template>
  <div class="p-6 max-w-[1800px] mx-auto">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">📋 受注伝票入力</h2>
      <button
        @click="showHelp = true"
        class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-semibold shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        title="F1: ヘルプを表示"
      >
        ❓ ヘルプ (F1)
      </button>
    </div>

    <!-- ヘッダー部 -->
    <div class="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">
          受注日
        </label>
        <input
          ref="dateInputRef"
          type="text"
          :value="header.date"
          @input="(e) => (header.date = (e.target as HTMLInputElement).value)"
          @keydown="handleDateKeyDown"
          placeholder="YYYY/MM/DD または 1, 20, 30 (今月のその日) または 0101 (1月1日)"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
        />
      </div>
      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">
          伝票番号
        </label>
        <input
          ref="orderNumberInputRef"
          type="text"
          :value="header.orderNumber"
          @input="(e) => (header.orderNumber = (e.target as HTMLInputElement).value)"
          placeholder="自動採番または手入力"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
        />
      </div>
      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">
          取引先コード
        </label>
        <div class="relative">
          <input
            ref="customerCodeInputRef"
            type="text"
            :value="header.customerCode"
            @input="handleCustomerCodeInput"
            @blur="handleSuggestionsBlur"
            @keydown="handleCustomerCodeKeyDown"
            placeholder="例: C001"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
          <div
            v-if="suggestions && suggestions.field === 'header-customerCode' && suggestions.items.length > 0 && suggestions.position"
            class="fixed bg-white border border-gray-300 rounded max-h-[150px] overflow-y-auto z-[1000] shadow-lg mt-1 suggestions-container"
            :style="{
              top: `${suggestions.position.top}px`,
              left: `${suggestions.position.left}px`,
              width: `${suggestions.position.width}px`,
            }"
          >
            <div
              v-for="(item, index) in suggestions.items"
              :key="(item as Customer).code"
              @click="selectCustomer(item as Customer)"
              :class="[
                'p-2 cursor-pointer text-xs',
                index === suggestions.selectedIndex ? 'bg-blue-50' : 'bg-white hover:bg-gray-50',
              ]"
            >
              {{ (item as Customer).code }} - {{ (item as Customer).name }}
            </div>
          </div>
        </div>
        <div v-if="header.customer" class="mt-2 p-2 bg-gray-100 rounded text-xs">
          <div><strong>会社名:</strong> {{ header.customer.name }}</div>
          <div><strong>住所:</strong> {{ header.customer.address }}</div>
        </div>
      </div>
    </div>

    <!-- 明細グリッド部 -->
    <div class="overflow-x-auto mb-4 shadow-sm rounded-lg border border-gray-200">
      <table class="w-full border-collapse bg-white">
        <thead>
          <tr class="bg-gray-100 border-b-2 border-gray-300">
            <th class="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">商品コード</th>
            <th class="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">商品名</th>
            <th class="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">数量</th>
            <th class="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">単価</th>
            <th class="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">金額</th>
            <th class="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">備考</th>
            <th class="p-3 text-left text-sm font-semibold text-gray-700">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, rowIndex) in rows"
            :key="row.id"
            :data-row-id="row.id"
            class="hover:bg-gray-50 border-b border-gray-200 transition-colors"
          >
            <!-- 商品コード -->
            <td class="p-2 border-r border-gray-300 overflow-hidden align-top">
              <div class="relative">
                <input
                  :ref="(el) => setRowInputRef(row.id, 0, el)"
                  type="text"
                  :value="row.productCode"
                  @input="(e) => handleProductCodeInput(row.id, (e.target as HTMLInputElement).value)"
                  @blur="handleSuggestionsBlur"
                  @keydown="(e) => handleProductCodeKeyDown(e, row.id)"
                  class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                  placeholder="商品コード"
                />
                <div
                  v-if="suggestions && suggestions.field === `${row.id}-productCode` && suggestions.items.length > 0 && suggestions.position"
                  class="fixed bg-white border border-gray-300 rounded max-h-[150px] overflow-y-auto z-[1000] shadow-lg mt-1 suggestions-container"
                  :style="{
                    top: `${suggestions.position.top}px`,
                    left: `${suggestions.position.left}px`,
                    width: `${suggestions.position.width}px`,
                  }"
                >
                  <div
                    v-for="(item, index) in suggestions.items"
                    :key="(item as Product).code"
                    @click="selectProduct(row.id, item as Product)"
                    :class="[
                      'p-2 cursor-pointer text-xs',
                      index === suggestions.selectedIndex ? 'bg-blue-50' : 'bg-white hover:bg-gray-50',
                    ]"
                  >
                    {{ (item as Product).code }} - {{ (item as Product).name }} (¥{{ formatAmount((item as Product).price) }})
                  </div>
                </div>
              </div>
            </td>
            <!-- 商品名 -->
            <td class="p-2 border-r border-gray-300 overflow-hidden align-top">
              <div class="text-sm text-gray-700">
                {{ row.product ? row.product.name : "-" }}
              </div>
            </td>
            <!-- 数量 -->
            <td class="p-2 border-r border-gray-300 overflow-hidden align-top">
              <input
                :ref="(el) => setRowInputRef(row.id, 1, el)"
                type="number"
                :value="row.quantity"
                @input="(e) => handleQuantityInput(row.id, parseInt((e.target as HTMLInputElement).value) || 1)"
                @keydown="(e) => handleQuantityKeyDown(e, row.id)"
                class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                min="1"
              />
            </td>
            <!-- 単価 -->
            <td class="p-2 border-r border-gray-300 overflow-hidden align-top">
              <input
                :ref="(el) => setRowInputRef(row.id, 2, el)"
                type="text"
                :value="row.unitPrice > 0 ? formatAmount(row.unitPrice) : ''"
                @input="(e) => handleUnitPriceInput(row.id, parseAmount((e.target as HTMLInputElement).value))"
                @keydown="(e) => handleUnitPriceKeyDown(e, row.id)"
                class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                placeholder="単価"
              />
            </td>
            <!-- 金額 -->
            <td class="p-2 border-r border-gray-300 overflow-hidden align-top">
              <div class="text-right text-sm font-semibold text-gray-800">
                {{ row.amount > 0 ? formatAmount(row.amount) : "-" }}
              </div>
            </td>
            <!-- 備考 -->
            <td class="p-2 border-r border-gray-300 overflow-hidden align-top">
              <input
                :ref="(el) => setRowInputRef(row.id, 3, el)"
                type="text"
                :value="row.remarks"
                @input="(e) => (row.remarks = (e.target as HTMLInputElement).value)"
                @keydown="(e) => handleRemarksKeyDown(e, row.id, rowIndex)"
                class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                placeholder="備考"
              />
            </td>
            <!-- 操作 -->
            <td class="p-2 overflow-hidden align-top">
              <button
                @click="handleDeleteRow(row.id)"
                class="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                title="この行を削除"
              >
                削除
              </button>
            </td>
          </tr>
        </tbody>
        <!-- 合計行 -->
        <tfoot>
          <tr class="bg-gray-100 border-t-2 border-gray-400 font-semibold">
            <td colSpan="4" class="p-3 border-r border-gray-300 text-right text-gray-700">
              合計
            </td>
            <td class="p-3 border-r border-gray-300 text-right text-gray-800">
              {{ formatAmount(totalAmount) }}
            </td>
            <td colSpan="2" class="p-3"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- フッター部 -->
    <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg mb-4 border border-gray-200 shadow-sm">
      <div class="font-semibold text-lg">
        合計金額: {{ formatAmount(totalAmount) }}
      </div>
      <div class="flex gap-2">
        <button
          @click="handleInsertRow"
          class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-lg font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm"
          title="行を追加"
        >
          +
        </button>
        <button
          @click="handleRegister"
          class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-semibold shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        >
          保存 (F12 / Ctrl+S)
        </button>
      </div>
    </div>

    <!-- FormNavigator -->
    <FormNavigator :inputRefs="allInputRefs" />

    <!-- ヘルプダイアログ -->
    <OrderFormHelpDialog v-if="showHelp" @close="showHelp = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, type ComponentPublicInstance } from "vue";
import { FormNavigator } from "@hyperbind-lib/vue";
import { usePresetKeybind, useKeybind, useModalKeybind } from "@hyperbind-lib/vue";
import { CUSTOMER_MASTERS, PRODUCT_MASTERS, type CustomerMaster, type ProductMaster } from "./masters";
import OrderFormHelpDialog from "./OrderFormHelpDialog.vue";

interface Props {
  isActive?: boolean;
}

withDefaults(defineProps<Props>(), {
  isActive: true,
});

// 型定義
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

interface OrderHeader {
  date: string;
  orderNumber: string;
  customerCode: string;
  customer: Customer | null;
}

interface OrderRow {
  id: string;
  productCode: string;
  product: Product | null;
  quantity: number;
  unitPrice: number;
  amount: number;
  remarks: string;
}

// マスタデータの変換
const CUSTOMERS: Customer[] = CUSTOMER_MASTERS.map((c) => ({
  code: c.code,
  name: c.name,
  address: `${c.prefecture || ""}${c.city || ""}${c.addressLine || ""}`.trim() || c.addressLine || "",
}));

const PRODUCTS: Product[] = PRODUCT_MASTERS.map((p) => ({
  code: p.code,
  name: p.name,
  price: p.sellingPrice,
}));

// 検索関数
function searchCustomer(query: string): Customer[] {
  if (!query) return CUSTOMERS;
  const lowerQuery = query.toLowerCase();
  return CUSTOMERS.filter(
    (customer) =>
      customer.code.toLowerCase().includes(lowerQuery) ||
      customer.name.toLowerCase().includes(lowerQuery)
  );
}

function searchProduct(query: string): Product[] {
  if (!query) return PRODUCTS;
  const lowerQuery = query.toLowerCase();
  return PRODUCTS.filter(
    (product) =>
      product.code.toLowerCase().includes(lowerQuery) ||
      product.name.toLowerCase().includes(lowerQuery)
  );
}

// 状態管理
const header = ref<OrderHeader>({
  date: new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\//g, "/"),
  orderNumber: "",
  customerCode: "",
  customer: null,
});

const stickyDate = ref<string>(header.value.date);

const rows = ref<OrderRow[]>([
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

const showHelp = ref(false);

// サジェスト機能の状態管理
const suggestions = ref<{
  type: "product" | "customer";
  field: string;
  items: (Product | Customer)[];
  selectedIndex: number;
  position?: { top: number; left: number; width: number };
} | null>(null);

// 入力フィールドの参照
const dateInputRef = ref<HTMLInputElement | null>(null);
const orderNumberInputRef = ref<HTMLInputElement | null>(null);
const customerCodeInputRef = ref<HTMLInputElement | null>(null);

// 各行の各フィールドのrefを管理するMap
const rowInputRefsMap = new Map<string, (HTMLInputElement | null)[][]>();

// 行のrefを取得または作成
const getRowInputRefs = (rowId: string): (HTMLInputElement | null)[][] => {
  if (!rowInputRefsMap.has(rowId)) {
    rowInputRefsMap.set(rowId, [[null], [null], [null], [null]]);
  }
  return rowInputRefsMap.get(rowId)!;
};

// refを設定するヘルパー関数
const setRowInputRef = (
  rowId: string,
  fieldIndex: number,
  el: Element | ComponentPublicInstance | null,
) => {
  const rowRefs = getRowInputRefs(rowId);
  if (rowRefs[fieldIndex]) {
    rowRefs[fieldIndex][0] = el instanceof HTMLInputElement ? el : null;
  }
};

// サジェスト内のクリックを拾えるように、閉じるのを少し遅らせる
const handleSuggestionsBlur = () => {
  setTimeout(() => {
    suggestions.value = null;
  }, 200);
};

// 不要なrefをクリーンアップ
watch(rows, (newRows) => {
  const currentRowIds = new Set(newRows.map((r) => r.id));
  for (const [rowId] of rowInputRefsMap) {
    if (!currentRowIds.has(rowId)) {
      rowInputRefsMap.delete(rowId);
    }
  }
});

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

// 金額フォーマット
const formatAmount = (amount: number): string => {
  return amount.toLocaleString("ja-JP");
};

// 金額のパース
const parseAmount = (value: string): number => {
  return parseInt(value.replace(/,/g, "")) || 0;
};

// 月の日数を取得
const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

// 日付変換ロジック
const parseDateInput = (input: string): string => {
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(input)) {
    return input;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const numericInput = input.replace(/\D/g, "");

  if (numericInput.length === 1) {
    const day = parseInt(numericInput, 10);
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    if (day >= 1 && day <= daysInMonth) {
      const monthStr = currentMonth.toString().padStart(2, "0");
      const dayStr = day.toString().padStart(2, "0");
      return `${currentYear}/${monthStr}/${dayStr}`;
    }
  } else if (numericInput.length === 2) {
    const day = parseInt(numericInput, 10);
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    if (day >= 1 && day <= daysInMonth) {
      const monthStr = currentMonth.toString().padStart(2, "0");
      const dayStr = day.toString().padStart(2, "0");
      return `${currentYear}/${monthStr}/${dayStr}`;
    }
  } else if (numericInput.length === 4) {
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

  return input;
};

// 合計計算
const totalAmount = computed(() => {
  return rows.value.reduce((sum, row) => sum + row.amount, 0);
});

// すべての入力フィールドの参照を収集
const allInputRefs = computed(() => {
  const refs: (HTMLInputElement | null)[] = [
    dateInputRef.value,
    orderNumberInputRef.value,
    customerCodeInputRef.value,
  ];
  rows.value.forEach((row) => {
    const rowRefs = getRowInputRefs(row.id);
    refs.push(rowRefs[0][0]); // productCode
    refs.push(rowRefs[1][0]); // quantity
    refs.push(rowRefs[2][0]); // unitPrice
    refs.push(rowRefs[3][0]); // remarks
  });
  return refs
    .filter((el): el is HTMLInputElement => el !== null)
    .map((el) => ({ value: el }));
});

// イベントハンドラ
const handleDateKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.isComposing) {
    e.preventDefault();
    e.stopPropagation();
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(header.value.date)) {
      orderNumberInputRef.value?.focus();
    } else {
      const convertedDate = parseDateInput(header.value.date);
      header.value.date = convertedDate;
      setTimeout(() => {
        orderNumberInputRef.value?.focus();
      }, 0);
    }
  }
};

const handleCustomerCodeInput = (e: Event) => {
  const value = (e.target as HTMLInputElement).value;
  header.value.customerCode = value;
  if (value) {
    const customers = searchCustomer(value);
    const inputElement = e.target as HTMLInputElement;
    const position = calculatePosition(inputElement);
    suggestions.value = {
      type: "customer",
      field: "header-customerCode",
      items: customers,
      selectedIndex: 0,
      position,
    };
  } else {
    suggestions.value = null;
  }
};

const handleCustomerCodeKeyDown = (e: KeyboardEvent) => {
  if (suggestions.value && suggestions.value.field === "header-customerCode") {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.value) {
        suggestions.value.selectedIndex = Math.min(
          suggestions.value.selectedIndex + 1,
          suggestions.value.items.length - 1
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.value) {
        suggestions.value.selectedIndex = Math.max(suggestions.value.selectedIndex - 1, 0);
      }
    } else if (e.key === "Enter" && !e.isComposing) {
      e.preventDefault();
      e.stopPropagation();
      if (suggestions.value) {
        const selected = suggestions.value.items[suggestions.value.selectedIndex] as Customer;
        if (selected) {
          header.value.customerCode = selected.code;
          header.value.customer = selected;
          suggestions.value = null;
          setTimeout(() => {
            if (rows.value.length > 0) {
              const firstRowRefs = getRowInputRefs(rows.value[0].id);
              firstRowRefs[0][0]?.focus();
            }
          }, 0);
        }
      }
    }
  } else if (e.key === "Enter" && !e.isComposing) {
    e.preventDefault();
    e.stopPropagation();
    if (rows.value.length > 0) {
      const firstRowRefs = getRowInputRefs(rows.value[0].id);
      firstRowRefs[0][0]?.focus();
    }
  }
};

const selectCustomer = (customer: Customer) => {
  header.value.customerCode = customer.code;
  header.value.customer = customer;
  suggestions.value = null;
  if (rows.value.length > 0) {
    const firstRowRefs = getRowInputRefs(rows.value[0].id);
    firstRowRefs[0][0]?.focus();
  }
};

const handleProductCodeInput = (rowId: string, value: string) => {
  const row = rows.value.find((r) => r.id === rowId);
  if (row) {
    row.productCode = value;
    row.product = null;
    row.unitPrice = 0;
    row.amount = 0;
    if (value) {
      const products = searchProduct(value);
      const rowRefs = getRowInputRefs(rowId);
      const inputElement = rowRefs[0][0];
      const position = calculatePosition(inputElement);
      suggestions.value = {
        type: "product",
        field: `${rowId}-productCode`,
        items: products,
        selectedIndex: 0,
        position,
      };
    } else {
      suggestions.value = null;
    }
  }
};

const handleProductCodeKeyDown = (e: KeyboardEvent, rowId: string) => {
  if (suggestions.value && suggestions.value.field === `${rowId}-productCode`) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.value) {
        suggestions.value.selectedIndex = Math.min(
          suggestions.value.selectedIndex + 1,
          suggestions.value.items.length - 1
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.value) {
        suggestions.value.selectedIndex = Math.max(suggestions.value.selectedIndex - 1, 0);
      }
    } else if (e.key === "Enter" && !e.isComposing) {
      e.preventDefault();
      e.stopPropagation();
      if (suggestions.value) {
        const selected = suggestions.value.items[suggestions.value.selectedIndex] as Product;
        if (selected) {
          const row = rows.value.find((r) => r.id === rowId);
          if (row) {
            row.productCode = selected.code;
            row.product = selected;
            row.unitPrice = selected.price;
            row.amount = selected.price * row.quantity;
          }
          suggestions.value = null;
          const rowRefs = getRowInputRefs(rowId);
          rowRefs[1][0]?.focus();
        }
      }
    }
  } else if (e.key === "Enter" && !e.isComposing) {
    e.preventDefault();
    e.stopPropagation();
    const rowRefs = getRowInputRefs(rowId);
    rowRefs[1][0]?.focus();
  }
};

const selectProduct = (rowId: string, product: Product) => {
  const row = rows.value.find((r) => r.id === rowId);
  if (row) {
    row.productCode = product.code;
    row.product = product;
    row.unitPrice = product.price;
    row.amount = product.price * row.quantity;
  }
  suggestions.value = null;
  const rowRefs = getRowInputRefs(rowId);
  rowRefs[1][0]?.focus();
};

const handleQuantityInput = (rowId: string, quantity: number) => {
  const row = rows.value.find((r) => r.id === rowId);
  if (row) {
    row.quantity = quantity;
    row.amount = row.unitPrice * quantity;
  }
};

const handleQuantityKeyDown = (e: KeyboardEvent, rowId: string) => {
  if (e.key === "Enter" && !e.isComposing) {
    e.preventDefault();
    e.stopPropagation();
    const rowRefs = getRowInputRefs(rowId);
    rowRefs[2][0]?.focus();
  }
};

const handleUnitPriceInput = (rowId: string, unitPrice: number) => {
  const row = rows.value.find((r) => r.id === rowId);
  if (row) {
    row.unitPrice = unitPrice;
    row.amount = unitPrice * row.quantity;
  }
};

const handleUnitPriceKeyDown = (e: KeyboardEvent, rowId: string) => {
  if (e.key === "Enter" && !e.isComposing) {
    e.preventDefault();
    e.stopPropagation();
    const rowRefs = getRowInputRefs(rowId);
    rowRefs[3][0]?.focus();
  }
};

const handleRemarksKeyDown = (e: KeyboardEvent, rowId: string, rowIndex: number) => {
  if (e.key === "Enter" && !e.isComposing) {
    e.preventDefault();
    e.stopPropagation();
    const isLastRow = rowIndex === rows.value.length - 1;
    if (isLastRow) {
      handleInsertRow();
    } else {
      const nextRowIndex = rowIndex + 1;
      if (nextRowIndex < rows.value.length) {
        const nextRowId = rows.value[nextRowIndex].id;
        const nextRowRefs = getRowInputRefs(nextRowId);
        nextRowRefs[0][0]?.focus();
      }
    }
  }
};

// アクション
const handleNew = () => {
  const newDate = stickyDate.value || new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\//g, "/");
  header.value = {
    date: newDate,
    orderNumber: "",
    customerCode: "",
    customer: null,
  };
  rows.value = [
    {
      id: "1",
      productCode: "",
      product: null,
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      remarks: "",
    },
  ];
  dateInputRef.value?.focus();
};

const handleRegister = () => {
  if (!header.value.customer) {
    alert("取引先を選択してください。");
    return;
  }

  const hasInvalidRow = rows.value.some(
    (row) => row.amount > 0 && !row.product
  );

  if (hasInvalidRow) {
    alert("金額が入力されている行で、商品が未選択です。");
    return;
  }

  if (rows.value.length === 0 || rows.value.every((row) => row.amount === 0)) {
    alert("受注明細を追加してください。");
    return;
  }

  stickyDate.value = header.value.date;

  alert(
    `受注伝票を登録しました。\n伝票番号: ${header.value.orderNumber || "（自動採番）"}\n日付: ${header.value.date}\n取引先: ${header.value.customer.name}\n合計金額: ${formatAmount(totalAmount.value)}`
  );
};

const handleDelete = () => {
  if (confirm("伝票を削除しますか？")) {
    handleNew();
  }
};

const handleInsertRow = () => {
  const newRow: OrderRow = {
    id: `row-${Date.now()}`,
    productCode: "",
    product: null,
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    remarks: "",
  };
  rows.value.push(newRow);
  setTimeout(() => {
    const newRowRefs = getRowInputRefs(newRow.id);
    newRowRefs[0][0]?.focus();
  }, 0);
};

const handleDeleteRow = (rowId: string) => {
  if (rows.value.length === 1) {
    alert("最低1行は必要です。");
    return;
  }
  const deletedIndex = rows.value.findIndex((r) => r.id === rowId);
  rows.value = rows.value.filter((row) => row.id !== rowId);
  setTimeout(() => {
    if (rows.value.length > 0) {
      const focusIndex = deletedIndex >= rows.value.length ? rows.value.length - 1 : deletedIndex;
      const focusRowId = rows.value[focusIndex].id;
      const focusRowRefs = getRowInputRefs(focusRowId);
      focusRowRefs[0][0]?.focus();
    }
  }, 0);
};

const getFocusedRowId = (): string | null => {
  const activeElement = document.activeElement;
  if (!activeElement) return null;

  for (const row of rows.value) {
    const rowRefs = getRowInputRefs(row.id);
    for (const refArray of rowRefs) {
      if (refArray[0] === activeElement) {
        return row.id;
      }
    }
  }
  return null;
};

// サジェストドロップダウンを外側クリックで閉じる
const handleClickOutside = (e: MouseEvent) => {
  if (suggestions.value && !(e.target as Element).closest('.suggestions-container')) {
    suggestions.value = null;
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

// スクロール時にサジェストの位置を再計算
let scrollHandlers: (() => void)[] = [];

watch(suggestions, (newSuggestions) => {
  // 既存のハンドラをクリーンアップ
  scrollHandlers.forEach((cleanup) => cleanup());
  scrollHandlers = [];

  if (!newSuggestions) return;

  const handleScroll = () => {
    if (newSuggestions && newSuggestions.position) {
      if (newSuggestions.field === "header-customerCode") {
        const position = calculatePosition(customerCodeInputRef.value);
        if (position) {
          suggestions.value = { ...newSuggestions, position };
        }
      } else {
        const fieldParts = newSuggestions.field.split('-');
        const rowId = fieldParts[0];
        const fieldName = fieldParts[1];
        const row = rows.value.find((r) => r.id === rowId);
        if (row && fieldName === "productCode") {
          const rowRefs = getRowInputRefs(rowId);
          const targetElement = rowRefs[0][0];
          const position = calculatePosition(targetElement);
          if (position) {
            suggestions.value = { ...newSuggestions, position };
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

  scrollHandlers.push(() => {
    window.removeEventListener('scroll', handleScroll, true);
    if (tableContainer) {
      tableContainer.removeEventListener('scroll', handleScroll, true);
    }
  });
});

onUnmounted(() => {
  scrollHandlers.forEach((cleanup) => cleanup());
});

// キーバインド登録
usePresetKeybind("voucher-entry-new", handleNew);
usePresetKeybind("voucher-entry-register", handleRegister);
usePresetKeybind("voucher-entry-delete", handleDelete);
usePresetKeybind("voucher-entry-row-insert", handleInsertRow);
usePresetKeybind("voucher-entry-row-delete", () => {
  const focusedRowId = getFocusedRowId();
  if (focusedRowId) {
    handleDeleteRow(focusedRowId);
  } else if (rows.value.length > 0) {
    handleDeleteRow(rows.value[rows.value.length - 1].id);
  }
});
usePresetKeybind("voucher-entry-date", () => {
  dateInputRef.value?.focus();
});

useKeybind("ctrl+s", handleRegister);
useKeybind("ctrl+delete", () => {
  const focusedRowId = getFocusedRowId();
  if (focusedRowId) {
    handleDeleteRow(focusedRowId);
  } else if (rows.value.length > 0) {
    handleDeleteRow(rows.value[rows.value.length - 1].id);
  }
});

useModalKeybind({
  keyCombo: "f1",
  onOpen: () => (showHelp.value = true),
  onClose: () => (showHelp.value = false),
  isOpen: showHelp,
});
</script>
