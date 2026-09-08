import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import AppIcon from "./AppIcon";
import type { AppTheme } from "../types";

interface Props {
  visible: boolean;
  initialDate?: string; // Formato YYYY-MM-DD
  onSelect: (dateISO: string) => void;
  onClose: () => void;
  th: AppTheme;
}

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Parsing limpo sem timezone shift
function parseISODate(isoStr?: string): { year: number; month: number; day: number } {
  const today = new Date();
  if (!isoStr || !/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) {
    return {
      year: today.getFullYear(),
      month: today.getMonth(),
      day: today.getDate(),
    };
  }
  const parts = isoStr.split("-").map((n) => parseInt(n, 10));
  return {
    year: parts[0],
    month: Math.max(0, Math.min(11, parts[1] - 1)),
    day: Math.max(1, Math.min(31, parts[2])),
  };
}

function formatISODate(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, "0");
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function CalendarPickerModal({
  visible,
  initialDate,
  onSelect,
  onClose,
  th,
}: Props) {
  const parsed = parseISODate(initialDate);
  const [viewYear, setViewYear] = useState<number>(parsed.year);
  const [viewMonth, setViewMonth] = useState<number>(parsed.month);
  const [selectedDay, setSelectedDay] = useState<number>(parsed.day);

  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
      const p = parseISODate(initialDate);
      setViewYear(p.year);
      setViewMonth(p.month);
      setSelectedDay(p.day);
    }
  }, [visible, initialDate]);

  const today = new Date();
  const isTodayMonth =
    today.getFullYear() === viewYear && today.getMonth() === viewMonth;
  const todayDay = today.getDate();

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleConfirm = () => {
    const finalDay = Math.min(selectedDay, daysInMonth);
    const dateISO = formatISODate(viewYear, viewMonth, finalDay);
    onSelect(dateISO);
    onClose();
  };

  // Gerar grade de dias
  const gridCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    gridCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    gridCells.push(d);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={S.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
              {/* Header do Mês */}
              <View style={S.monthHeader}>
                <TouchableOpacity
                  onPress={handlePrevMonth}
                  style={[S.navBtn, { backgroundColor: th.card2 }]}
                  accessibilityLabel="Mês anterior"
                >
                  <AppIcon name="chevron-back" size={20} color={th.fg} />
                </TouchableOpacity>

                <Text style={[S.monthTitle, { color: th.fg }]}>
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </Text>

                <TouchableOpacity
                  onPress={handleNextMonth}
                  style={[S.navBtn, { backgroundColor: th.card2 }]}
                  accessibilityLabel="Próximo mês"
                >
                  <AppIcon name="chevron-forward" size={20} color={th.fg} />
                </TouchableOpacity>
              </View>

              {/* Dias da semana */}
              <View style={S.weekRow}>
                {WEEK_DAYS.map((w, idx) => (
                  <Text key={idx} style={[S.weekDayText, { color: th.muted }]}>
                    {w}
                  </Text>
                ))}
              </View>

              {/* Grade de dias */}
              <View style={S.grid}>
                {gridCells.map((day, idx) => {
                  if (day === null) {
                    return <View key={idx} style={S.dayCell} />;
                  }

                  const isSelected = day === selectedDay;
                  const isToday = isTodayMonth && day === todayDay;

                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => setSelectedDay(day)}
                      style={[
                        S.dayCell,
                        isSelected && { backgroundColor: th.orange },
                        isToday && !isSelected && { borderWidth: 1.5, borderColor: th.orange },
                      ]}
                    >
                      <Text
                        style={[
                          S.dayText,
                          { color: isSelected ? "#FFFFFF" : isToday ? th.orange : th.fg },
                          isSelected && { fontWeight: "800" },
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Botões de Ação */}
              <View style={S.actionRow}>
                <TouchableOpacity
                  onPress={onClose}
                  style={[S.btn, { backgroundColor: th.card2 }]}
                  accessibilityLabel="Cancelar"
                >
                  <Text style={[S.btnText, { color: th.fg }]}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirm}
                  style={[S.btn, { backgroundColor: th.orange }]}
                  accessibilityLabel="Confirmar data"
                >
                  <Text style={[S.btnText, { color: "#FFFFFF", fontWeight: "800" }]}>
                    Confirmar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  weekDayText: {
    width: 40,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 4,
  },
  btn: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
