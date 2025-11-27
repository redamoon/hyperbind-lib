<template>
  <div class="p-6 max-w-[1800px] mx-auto">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">📊 営業日報入力</h2>
    <div class="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">日付 <span class="text-red-500">*</span></label>
        <input ref="dateInputRef" type="text" v-model="formData.date" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
      </div>
      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">訪問件数</label>
        <input ref="visitCountInputRef" type="text" v-model="formData.visitCount" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
      </div>
    </div>
    <FormNavigator :inputRefs="allInputRefs" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { FormNavigator } from "@hyperbind-lib/vue";

interface Props {
  isActive?: boolean;
}

withDefaults(defineProps<Props>(), {
  isActive: true,
});

const formData = ref({
  date: new Date().toLocaleDateString("ja-JP").replace(/\//g, "/"),
  visitCount: "0",
});

const dateInputRef = ref<HTMLInputElement | null>(null);
const visitCountInputRef = ref<HTMLInputElement | null>(null);

const allInputRefs = computed(() => [dateInputRef, visitCountInputRef]);
</script>

