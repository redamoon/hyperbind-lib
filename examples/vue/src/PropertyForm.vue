<template>
  <div class="p-6 max-w-[1800px] mx-auto">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">🏠 物件入力</h2>
    <div class="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">物件コード <span class="text-red-500">*</span></label>
        <input ref="codeInputRef" type="text" v-model="formData.code" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
      </div>
      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">物件名 <span class="text-red-500">*</span></label>
        <input ref="nameInputRef" type="text" v-model="formData.name" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
      </div>
    </div>
    <FormNavigator :inputRefs="allInputRefs" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { FormNavigator } from "@hyperbind-lib/vue";

const formData = ref({
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
  registrationDate: new Date().toLocaleDateString("ja-JP").replace(/\//g, "/"),
  remarks: "",
});

const codeInputRef = ref<HTMLInputElement | null>(null);
const nameInputRef = ref<HTMLInputElement | null>(null);

const allInputRefs = computed(() => [codeInputRef, nameInputRef]);
</script>

