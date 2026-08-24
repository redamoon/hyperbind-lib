<template>
  <div class="p-6 max-w-[1800px] mx-auto">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">🏢 取引先入力</h2>
      <button
        @click="showHelp = true"
        class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-semibold shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        title="F1: ヘルプを表示"
      >
        ❓ ヘルプ (F1)
      </button>
    </div>

    <!-- 入力フォーム -->
    <div class="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <!-- 取引先コード -->
      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">
          取引先コード <span class="text-red-500">*</span>
        </label>
        <input
          ref="codeInputRef"
          type="text"
          v-model="formData.code"
          @input="handleCodeInput"
          @keydown="handleCodeKeyDown"
          @blur="handleSuggestionsBlur"
          placeholder="例: C001"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
        />
        <div
          v-if="suggestions && suggestions.field === 'code' && suggestions.items.length > 0 && suggestions.position"
          class="fixed bg-white border border-gray-300 rounded max-h-[150px] overflow-y-auto z-[1000] shadow-lg mt-1 suggestions-container"
          :style="{
            top: `${suggestions.position.top}px`,
            left: `${suggestions.position.left}px`,
            width: `${suggestions.position.width}px`,
          }"
        >
          <div
            v-for="(item, index) in suggestions.items"
            :key="item.code"
            @click="selectCustomer(item)"
            :class="`p-2 cursor-pointer text-xs ${index === suggestions.selectedIndex ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`"
          >
            {{ item.code }} - {{ item.name }}
          </div>
        </div>
      </div>

      <!-- その他のフィールド -->
      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">
          取引先名 <span class="text-red-500">*</span>
        </label>
        <input
          ref="nameInputRef"
          type="text"
          v-model="formData.name"
          @keydown="handleEnterKey($event, postalCodeInputRef)"
          placeholder="例: 株式会社ABC"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
        />
      </div>

      <!-- 他のフィールドも同様に実装 -->
      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">郵便番号</label>
        <input
          ref="postalCodeInputRef"
          type="text"
          v-model="formData.postalCode"
          @keydown="handleEnterKey($event, prefectureInputRef)"
          placeholder="例: 100-0001"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
        />
      </div>

      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">都道府県</label>
        <input
          ref="prefectureInputRef"
          type="text"
          v-model="formData.prefecture"
          @keydown="handleEnterKey($event, cityInputRef)"
          placeholder="例: 東京都"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
        />
      </div>

      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">市区町村</label>
        <input
          ref="cityInputRef"
          type="text"
          v-model="formData.city"
          @keydown="handleEnterKey($event, addressLineInputRef)"
          placeholder="例: 千代田区"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
        />
      </div>

      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">番地・建物名</label>
        <input
          ref="addressLineInputRef"
          type="text"
          v-model="formData.addressLine"
          @keydown="handleEnterKey($event, phoneInputRef)"
          placeholder="例: 千代田1-1-1"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
        />
      </div>

      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">電話番号</label>
        <input
          ref="phoneInputRef"
          type="text"
          v-model="formData.phone"
          @keydown="handleEnterKey($event, faxInputRef)"
          placeholder="例: 03-1234-5678"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
        />
      </div>

      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">FAX番号</label>
        <input
          ref="faxInputRef"
          type="text"
          v-model="formData.fax"
          @keydown="handleEnterKey($event, emailInputRef)"
          placeholder="例: 03-1234-5679"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
        />
      </div>

      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">メールアドレス</label>
        <input
          ref="emailInputRef"
          type="email"
          v-model="formData.email"
          @keydown="handleEnterKey($event, representativeInputRef)"
          placeholder="例: info@example.co.jp"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
        />
      </div>

      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">代表者名</label>
        <input
          ref="representativeInputRef"
          type="text"
          v-model="formData.representative"
          @keydown="handleEnterKey($event, contactPersonInputRef)"
          placeholder="例: 山田太郎"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
        />
      </div>

      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">担当者名</label>
        <input
          ref="contactPersonInputRef"
          type="text"
          v-model="formData.contactPerson"
          @keydown="handleEnterKey($event, startDateInputRef)"
          placeholder="例: 佐藤花子"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
        />
      </div>

      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">取引開始日</label>
        <input
          ref="startDateInputRef"
          type="text"
          v-model="formData.startDate"
          @keydown="handleDateKeyDown"
          placeholder="YYYY/MM/DD"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
        />
      </div>

      <div class="col-span-2">
        <label class="block mb-2 text-sm font-medium text-gray-700">備考</label>
        <input
          ref="remarksInputRef"
          type="text"
          v-model="formData.remarks"
          placeholder="備考を入力"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
        />
      </div>
    </div>

    <!-- フッター部 -->
    <div class="flex justify-end gap-2 p-4 bg-gray-50 rounded-lg mb-4 border border-gray-200 shadow-sm">
      <button
        @click="handleNew"
        class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm"
      >
        新規 (F2)
      </button>
      <button
        @click="handleDelete"
        class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-semibold shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
      >
        削除 (F9)
      </button>
      <button
        @click="handleRegister"
        class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-semibold shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
      >
        保存 (F12 / Ctrl+S)
      </button>
    </div>

    <!-- FormNavigator -->
    <FormNavigator :inputRefs="allInputRefs" />

    <!-- ヘルプダイアログ -->
    <HelpDialog v-if="showHelp" @close="showHelp = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { FormNavigator, usePresetKeybind, useKeybind, useModalKeybind } from "@hyperbind-lib/vue";
import { CustomerMaster, searchCustomer } from "./masters";
import HelpDialog from "./HelpDialog.vue";

interface Props {
  isActive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isActive: true,
});

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

const formData = ref<CustomerFormData>({
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

const stickyDate = ref<string>(formData.value.startDate);
const selectedCustomer = ref<CustomerMaster | null>(null);
const showHelp = ref(false);

const suggestions = ref<{
  type: "customer";
  field: string;
  items: CustomerMaster[];
  selectedIndex: number;
  position?: { top: number; left: number; width: number };
} | null>(null);

const codeInputRef = ref<HTMLInputElement | null>(null);
const nameInputRef = ref<HTMLInputElement | null>(null);
const postalCodeInputRef = ref<HTMLInputElement | null>(null);
const prefectureInputRef = ref<HTMLInputElement | null>(null);
const cityInputRef = ref<HTMLInputElement | null>(null);
const addressLineInputRef = ref<HTMLInputElement | null>(null);
const phoneInputRef = ref<HTMLInputElement | null>(null);
const faxInputRef = ref<HTMLInputElement | null>(null);
const emailInputRef = ref<HTMLInputElement | null>(null);
const representativeInputRef = ref<HTMLInputElement | null>(null);
const contactPersonInputRef = ref<HTMLInputElement | null>(null);
const startDateInputRef = ref<HTMLInputElement | null>(null);
const remarksInputRef = ref<HTMLInputElement | null>(null);

const allInputRefs = computed(() => [
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
]);

const calculatePosition = (element: HTMLElement | null) => {
  if (!element) return undefined;
  const rect = element.getBoundingClientRect();
  return {
    top: rect.bottom + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
  };
};

const handleCodeInput = (e: Event) => {
  const value = (e.target as HTMLInputElement).value;
  formData.value.code = value;
  selectedCustomer.value = null;
  if (value) {
    const customers = searchCustomer(value);
    const inputElement = e.target as HTMLInputElement;
    const position = calculatePosition(inputElement);
    suggestions.value = {
      type: "customer",
      field: "code",
      items: customers,
      selectedIndex: 0,
      position,
    };
  } else {
    suggestions.value = null;
  }
};

const handleCodeKeyDown = (e: KeyboardEvent) => {
  if (suggestions.value && suggestions.value.field === "code") {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      suggestions.value.selectedIndex = Math.min(
        suggestions.value.selectedIndex + 1,
        suggestions.value.items.length - 1
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      suggestions.value.selectedIndex = Math.max(suggestions.value.selectedIndex - 1, 0);
    } else if (e.key === "Enter" && !e.isComposing) {
      e.preventDefault();
      e.stopPropagation();
      const selected = suggestions.value.items[suggestions.value.selectedIndex];
      if (selected) {
        selectCustomer(selected);
      }
    }
  } else if (e.key === "Enter" && !e.isComposing) {
    e.preventDefault();
    e.stopPropagation();
    const code = formData.value.code.trim();
    if (code) {
      const customers = searchCustomer(code);
      const exactMatch = customers.find((c) => c.code === code);
      if (exactMatch) {
        selectCustomer(exactMatch);
      } else {
        nameInputRef.value?.focus();
      }
    } else {
      nameInputRef.value?.focus();
    }
  }
};

const selectCustomer = (customer: CustomerMaster) => {
  formData.value = {
    code: customer.code,
    name: customer.name || "",
    postalCode: customer.postalCode || "",
    prefecture: customer.prefecture || "",
    city: customer.city || "",
    addressLine: customer.addressLine || "",
    phone: customer.phone || "",
    fax: customer.fax || "",
    email: customer.email || "",
    representative: customer.representative || "",
    contactPerson: customer.contactPerson || "",
    startDate: customer.startDate || formData.value.startDate,
    remarks: customer.remarks || "",
  };
  selectedCustomer.value = customer;
  suggestions.value = null;
  nameInputRef.value?.focus();
};

// サジェスト内のクリックを拾えるように、閉じるのを少し遅らせる
const handleSuggestionsBlur = () => {
  setTimeout(() => {
    suggestions.value = null;
  }, 200);
};

const handleEnterKey = (e: KeyboardEvent, nextInput: HTMLInputElement | null) => {
  if (e.key === "Enter" && !e.isComposing) {
    e.preventDefault();
    e.stopPropagation();
    nextInput?.focus();
  }
};

const handleDateKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.isComposing) {
    e.preventDefault();
    e.stopPropagation();
    remarksInputRef.value?.focus();
  }
};

const handleNew = () => {
  const newDate = stickyDate.value || new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\//g, "/");
  formData.value = {
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
  };
  selectedCustomer.value = null;
  codeInputRef.value?.focus();
};

const handleRegister = () => {
  if (!formData.value.code.trim()) {
    alert("取引先コードを入力してください。");
    codeInputRef.value?.focus();
    return;
  }
  if (!formData.value.name.trim()) {
    alert("取引先名を入力してください。");
    nameInputRef.value?.focus();
    return;
  }
  stickyDate.value = formData.value.startDate;
  alert(
    `取引先を登録しました。\n取引先コード: ${formData.value.code}\n取引先名: ${formData.value.name}\n取引開始日: ${formData.value.startDate}`
  );
};

const handleDelete = () => {
  if (!formData.value.code.trim()) {
    alert("削除する取引先を選択してください。");
    return;
  }
  if (confirm(`取引先「${formData.value.code} - ${formData.value.name}」を削除しますか？`)) {
    handleNew();
  }
};

// キーバインド登録
usePresetKeybind("voucher-entry-new", handleNew);
usePresetKeybind("voucher-entry-register", handleRegister);
usePresetKeybind("voucher-entry-delete", handleDelete);
usePresetKeybind("voucher-entry-date", () => {
  startDateInputRef.value?.focus();
});

useKeybind("ctrl+s", handleRegister);

useModalKeybind({
  keyCombo: "f1",
  onOpen: () => (showHelp.value = true),
  onClose: () => (showHelp.value = false),
  isOpen: computed(() => showHelp.value),
});

onMounted(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if (suggestions.value && !(e.target as Element).closest(".suggestions-container")) {
      suggestions.value = null;
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  onUnmounted(() => {
    document.removeEventListener("mousedown", handleClickOutside);
  });
});
</script>

