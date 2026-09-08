import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Keyboard } from "react-native";
import AppIcon from "./AppIcon";
import CalendarPickerModal from "./CalendarPickerModal";
import type { AppTheme } from "../types";

interface Props {
  label?: string;
  value: string; // Formato esperado YYYY-MM-DD
  onChange: (valISO: string) => void;
  error?: string;
  th: AppTheme;
}

// Converte YYYY-MM-DD em DD/MM/AAAA para exibição amigável ao usuário
function formatBRDate(isoStr?: string): string {
  if (!isoStr || !/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) {
    return "Selecione uma data";
  }
  const parts = isoStr.split("-");
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function DateField({ label, value, onChange, error, th }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const displayDate = formatBRDate(value);

  const handleOpen = () => {
    Keyboard.dismiss();
    setModalOpen(true);
  };

  return (
    <View style={S.container}>
      {Boolean(label) && <Text style={[S.label, { color: th.muted }]}>{label}</Text>}

      <TouchableOpacity
        onPress={handleOpen}
        activeOpacity={0.7}
        style={[
          S.inputBtn,
          {
            backgroundColor: th.inputBg,
            borderColor: error ? th.error : th.border,
          },
        ]}
        accessibilityLabel={label || "Data de entrega"}
        accessibilityHint="Toque para abrir o calendário"
      >
        <AppIcon name="calendar-outline" size={18} color={error ? th.error : th.orange} />
        <Text
          style={[
            S.dateText,
            {
              color: value ? th.fg : th.muted,
            },
          ]}
        >
          {displayDate}
        </Text>
        <AppIcon name="chevron-down" size={16} color={th.muted} />
      </TouchableOpacity>

      {Boolean(error) && <Text style={[S.errText, { color: th.error }]}>{error}</Text>}

      <CalendarPickerModal
        visible={modalOpen}
        initialDate={value}
        onSelect={(newDateISO) => onChange(newDateISO)}
        onClose={() => setModalOpen(false)}
        th={th}
      />
    </View>
  );
}

const S = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  inputBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  errText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
});
