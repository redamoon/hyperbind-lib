import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDisableKeyBindsWhileMounted } from "@hyperbind-lib/react";

interface CalendarModalProps {
  onClose: () => void;
  onSelectDate?: (date: string) => void;
  onAfterSelect?: () => void; // 日付選択後の処理（次のinputへの移動など）
  initialDate?: string; // 初期日付（YYYY/MM/DD形式）
}

export const CalendarModal = ({ onClose, onSelectDate, onAfterSelect, initialDate }: CalendarModalProps) => {
  useDisableKeyBindsWhileMounted();
  
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // 初期日付から日を取得
  const getInitialDay = (): number => {
    if (initialDate) {
      const parts = initialDate.split("/");
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

  const [selectedDay, setSelectedDay] = useState<number>(getInitialDay());
  
  // 日付をフォーマットする関数
  const formatDate = useCallback((day: number): string => {
    const date = new Date(currentYear, currentMonth, day);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\//g, "/");
  }, [currentYear, currentMonth]);
  
  // selectedDayからselectedDateを計算
  const selectedDate = useMemo(() => {
    return formatDate(selectedDay);
  }, [selectedDay, formatDate]);

  const handleDateSelect = useCallback(() => {
    const dateStr = formatDate(selectedDay);
    if (dateStr && onSelectDate) {
      onSelectDate(dateStr);
      // モーダルを閉じた後、次のinputへ移動
      setTimeout(() => {
        if (onAfterSelect) {
          onAfterSelect();
        }
      }, 100);
    } else {
      onClose();
    }
  }, [selectedDay, formatDate, onSelectDate, onAfterSelect, onClose]);

  // キーバインド処理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          setSelectedDay((prev) => {
            const newDay = prev - 7;
            return newDay >= 1 ? newDay : prev;
          });
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedDay((prev) => {
            const newDay = prev + 7;
            return newDay <= daysInMonth ? newDay : prev;
          });
          break;
        case "ArrowLeft":
          e.preventDefault();
          setSelectedDay((prev) => {
            const newDay = prev - 1;
            return newDay >= 1 ? newDay : prev;
          });
          break;
        case "ArrowRight":
          e.preventDefault();
          setSelectedDay((prev) => {
            const newDay = prev + 1;
            return newDay <= daysInMonth ? newDay : prev;
          });
          break;
        case "Enter":
          e.preventDefault();
          handleDateSelect();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedDay, daysInMonth, handleDateSelect, onClose]);

  // selectedDayが変更されたときにselectedDateを更新
  useEffect(() => {
    const dateStr = formatDate(selectedDay);
    // この時点ではselectedDateはuseMemoで計算されているので、直接更新は不要
  }, [selectedDay]);

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3>📅 カレンダー</h3>
        <p style={{ marginBottom: "1rem" }}>
          {currentYear}年{currentMonth + 1}月
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.25rem", marginBottom: "1rem" }}>
          {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
            <div key={day} style={{ textAlign: "center", fontWeight: "bold", padding: "0.5rem" }}>
              {day}
            </div>
          ))}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dateStr = formatDate(day);
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => {
                  setSelectedDay(day);
                  const date = formatDate(day);
                  if (onSelectDate) {
                    onSelectDate(date);
                    setTimeout(() => {
                      if (onAfterSelect) {
                        onAfterSelect();
                      }
                    }, 100);
                  }
                }}
                style={{
                  padding: "0.5rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  backgroundColor: isSelected ? "#2196F3" : "white",
                  color: isSelected ? "white" : "black",
                  cursor: "pointer",
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button onClick={handleDateSelect} style={{ padding: "0.5rem 1rem", backgroundColor: "#2196F3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            選択
          </button>
          <button onClick={onClose} style={{ padding: "0.5rem 1rem", backgroundColor: "#666", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  background: "#fff",
  padding: "2rem",
  borderRadius: "8px",
  minWidth: "300px",
};
