<template>
  <div class="p-6 max-w-[1800px] mx-auto">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">📄 契約入力</h2>
    <div class="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">契約番号 <span class="text-red-500">*</span></label>
        <input ref="contractNumberInputRef" type="text" v-model="formData.contractNumber" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
      </div>
      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">物件コード <span class="text-red-500">*</span></label>
        <input ref="propertyCodeInputRef" type="text" v-model="formData.propertyCode" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
      </div>
    </div>
    <FormNavigator :inputRefs="allInputRefs" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { FormNavigator } from "@hyperbind-lib/vue";

const formData = ref({
  contractNumber: "",
  propertyCode: "",
  tenantName: "",
  startDate: new Date().toLocaleDateString("ja-JP").replace(/\//g, "/"),
  endDate: "",
  rent: "",
  managementFee: "",
  deposit: "",
  keyMoney: "",
  renewalDate: "",
  remarks: "",
});

const contractNumberInputRef = ref<HTMLInputElement | null>(null);
const propertyCodeInputRef = ref<HTMLInputElement | null>(null);

const allInputRefs = computed(() => [contractNumberInputRef, propertyCodeInputRef]);
</script>

