import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { AppTheme } from "../types";

interface Props { code: string; visible: boolean; onClose: () => void; th: AppTheme }

// Simple SVG-free QR placeholder — replace with expo-barcode-generator or similar
function QRPlaceholder({ code, size = 200 }: { code: string; size?: number }) {
  const rows = 10;
  const cell = Math.floor(size / rows);
  // Deterministic pseudo-random grid seeded by code characters
  const grid: boolean[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: rows }, (_, c) => {
      const ch = code.charCodeAt((r * rows + c) % code.length) ?? 65;
      return (ch + r * 7 + c * 11) % 3 !== 0;
    })
  );
  // Force finder patterns (corners)
  const corner = (r: number, c: number) => r < 3 && c < 3 || r < 3 && c >= rows - 3 || r >= rows - 3 && c < 3;
  return (
    <View style={{ width: size, height: size, flexDirection: "column", backgroundColor: "#fff",
      borderRadius: 8, padding: 8 }}>
      {grid.map((row, ri) => (
        <View key={ri} style={{ flexDirection: "row" }}>
          {row.map((on, ci) => (
            <View key={ci} style={{
              width: cell, height: cell,
              backgroundColor: corner(ri, ci) || on ? "#0e2f5a" : "#fff",
            }}/>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function QRModal({ code, visible, onClose, th }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={S.overlay}>
        <View style={[S.card, { backgroundColor: th.card }]}>
          <View style={S.closeRow}>
            <Text style={[S.title, { color: th.fg }]}>QR Code da Turma</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close-circle" size={28} color={th.muted}/>
            </TouchableOpacity>
          </View>

          <View style={S.qrWrap}>
            <QRPlaceholder code={code} size={200}/>
          </View>

          <Text style={[S.codeLabel, { color: th.muted }]}>CÓDIGO DA TURMA</Text>
          <Text style={[S.code, { color: th.orange }]} selectable>{code}</Text>
          <Text style={[S.hint, { color: th.muted }]}>
            Peça para seus colegas escanear ou digitar o código acima para entrar na turma.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  card:     { width: "100%", borderRadius: 24, padding: 24, alignItems: "center", gap: 12,
              shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 16 },
  closeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" },
  title:    { fontSize: 17, fontWeight: "800" },
  qrWrap:   { marginVertical: 8, padding: 16, backgroundColor: "#fff", borderRadius: 16,
              shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  codeLabel:{ fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  code:     { fontSize: 22, fontWeight: "900", letterSpacing: 3 },
  hint:     { fontSize: 12, textAlign: "center", lineHeight: 18, maxWidth: 240 },
});
