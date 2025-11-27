<template>
  <div :style="overlayStyle" @click="onClose">
    <div :style="modalStyle" @click.stop tabindex="-1">
      <h3>📅 カレンダー</h3>
      <p :style="{ marginBottom: '1rem' }">
        {{ currentYear }}年{{ currentMonth + 1 }}月
      </p>
      <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '1rem' }">
        <div
          v-for="day in ['日', '月', '火', '水', '木', '金', '土']"
          :key="day"
          :style="{ textAlign: 'center', fontWeight: 'bold', padding: '0.5rem' }"
        >
          {{ day }}
        </div>
        <div v-for="i in firstDayOfWeek" :key="`empty-${i}`" />
        <button
          v-for="day in daysInMonth"
          :key="day"
          @click="handleDayClick(day)"
          :style="{
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: selectedDay === day ? '#2196F3' : 'white',
            color: selectedDay === day ? 'white' : 'black',
            cursor: 'pointer',
          }"
        >
          {{ day }}
        </button>
      </div>
      <div :style="{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }">
        <button
          @click="handleDateSelect"
          :style="{ padding: '0.5rem 1rem', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }"
        >
          選択
        </button>
        <button
          @click="onClose"
          :style="{ padding: '0.5rem 1rem', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }"
        >
          閉じる
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useDisableCustomKeybindsWhileMounted } from "@hyperbind-lib/vue";

interface Props {
  onClose: () => void;
  onSelectDate?: (date: string) => void;
  onAfterSelect?: () => void; // 日付選択後の処理（次のinputへの移動など）
  initialDate?: string; // 初期日付（YYYY/MM/DD形式）
}

const props = defineProps<Props>();

useDisableCustomKeybindsWhileMounted();

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();
const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

// 初期日付から日を取得
const getInitialDay = (): number => {
  if (props.initialDate) {
    const parts = props.initialDate.split("/");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (year === currentYear && month === currentMonth + 1) {
        return day;
      }
    }
  }
  return today.getDate();
};

const selectedDay = ref<number>(getInitialDay());

// 日付をフォーマットする関数（YYYY/MM/DD形式）
const formatDate = (day: number): string => {
  const year = currentYear.toString();
  const month = (currentMonth + 1).toString().padStart(2, "0");
  const dayStr = day.toString().padStart(2, "0");
  return `${year}/${month}/${dayStr}`;
};

// selectedDayからselectedDateを計算
const selectedDate = computed(() => {
  return formatDate(selectedDay.value);
});

const handleDateSelect = () => {
  const dateStr = formatDate(selectedDay.value);
  if (dateStr && props.onSelectDate) {
    props.onSelectDate(dateStr);
    // モーダルを閉じた後、次のinputへ移動
    setTimeout(() => {
      if (props.onAfterSelect) {
        props.onAfterSelect();
      }
    }, 100);
  } else {
    props.onClose();
  }
};

const handleDayClick = (day: number) => {
  selectedDay.value = day;
  const date = formatDate(day);
  if (props.onSelectDate) {
    props.onSelectDate(date);
    setTimeout(() => {
      if (props.onAfterSelect) {
        props.onAfterSelect();
      }
    }, 100);
  }
};

// キーバインド処理
onMounted(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.isComposing) return;

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        selectedDay.value = Math.max(1, selectedDay.value - 7);
        break;
      case "ArrowDown":
        e.preventDefault();
        selectedDay.value = Math.min(daysInMonth, selectedDay.value + 7);
        break;
      case "ArrowLeft":
        e.preventDefault();
        selectedDay.value = Math.max(1, selectedDay.value - 1);
        break;
      case "ArrowRight":
        e.preventDefault();
        selectedDay.value = Math.min(daysInMonth, selectedDay.value + 1);
        break;
      case "Enter":
        e.preventDefault();
        handleDateSelect();
        break;
      case "Escape":
        e.preventDefault();
        props.onClose();
        break;
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
  });
});

const overlayStyle = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(0,0,0,0.3)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle = {
  background: "#fff",
  padding: "2rem",
  borderRadius: "8px",
  minWidth: "300px",
};
</script>

