import React from "react";
import { StyleSheet, View, Text, TextInput } from "react-native";
import AppIcon from "./AppIcon";
import type { AppTheme } from "../types";

interface Props {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  th: AppTheme;
}

export default function TimeField({ label, value, onChange, error, th }: Props) {
  const handleChangeText = (text: string) => {
    // Manter apenas números e dois pontos
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length === 0) {
      onChange("");
      return;
    }

    if (cleaned.length <= 2) {
      onChange(cleaned);
      return;
    }

    const hh = cleaned.slice(0, 2);
    const mm = cleaned.slice(2, 4);

    const validHh = Math.min(23, parseInt(hh, 10));
    const validMm = Math.min(59, parseInt(mm, 10));

    const formattedHh = String(validHh).padStart(2, "0");
    const formattedMm = String(validMm).padStart(2, "0");

    if (cleaned.length >= 4) {
      onChange(`${formattedHh}:${formattedMm}`);
    } else {
      onChange(`${hh}:${mm}`);
    }
  };

  return (
    <View style={S.container}>
      {Boolean(label) && <Text style={[S.label, { color: th.muted }]}>{label}</Text>}

      <View
        style={[
          S.inputWrap,
          {
            backgroundColor: th.inputBg,
            borderColor: error ? th.error : th.border,
          },
        ]}
      >
        <AppIcon name="time-outline" size={18} color={error ? th.error : th.muted} />
        <TextInput
          value={value}
          onChangeText={handleChangeText}
          placeholder="HH:MM (Ex.: 23:59)"
          placeholderTextColor={th.muted}
          keyboardType="numeric"
          maxLength={5}
          style={[S.input, { color: th.fg }]}
          selectionColor={th.orange}
          accessibilityLabel={label || "Horário"}
          accessibilityHint="Informe o horário no formato HH:MM"
        />
      </View>

      {Boolean(error) && <Text style={[S.errText, { color: th.error }]}>{error}</Text>}
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
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    padding: 0,
  },
  errText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
});
