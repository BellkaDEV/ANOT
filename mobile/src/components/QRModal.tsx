import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import AppIcon from "./AppIcon";
import type { AppTheme } from "../types";

interface Props { code: string; visible: boolean; onClose: () => void; th: AppTheme }

export default function QRModal({ code, visible, onClose, th }: Props) {
  const deepLink = `anot://join?code=${encodeURIComponent(code)}`;
  const fallbackLink = `https://app.anot.com/join?code=${encodeURIComponent(code)}`;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={S.overlay}>
        <View style={[S.card, { backgroundColor: th.card }]}>
          <View style={S.closeRow}>
            <Text style={[S.title, { color: th.fg }]}>QR Code da Turma</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityLabel="Fechar QR Code">
              <AppIcon name="close-circle" size={28} color={th.muted}/>
            </TouchableOpacity>
          </View>
          <View style={S.qrWrap}>
            <QRCode value={deepLink} size={220} color="#0e2f5a" backgroundColor="#ffffff" />
          </View>
          <Text style={[S.codeLabel, { color: th.muted }]}>CÓDIGO DA TURMA</Text>
          <Text style={[S.code, { color: th.orange }]} selectable>{code}</Text>
          <Text style={[S.hint, { color: th.muted }]}>Peça para seus colegas escanearem ou digitarem o código acima para entrar na turma.</Text>
          <TouchableOpacity style={[S.shareButton, { backgroundColor: th.orange }]} onPress={() => Share.share({ message: `Entre na turma pelo ANOT: ${fallbackLink}` })} accessibilityRole="button">
            <AppIcon name="share-social-outline" size={18} color="#fff" />
            <Text style={S.shareText}>Compartilhar convite</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", borderRadius: 24, padding: 24, alignItems: "center", gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 16 },
  closeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" },
  title: { fontSize: 17, fontWeight: "800" },
  qrWrap: { marginVertical: 8, padding: 16, backgroundColor: "#fff", borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  codeLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  code: { fontSize: 22, fontWeight: "900", letterSpacing: 3 },
  hint: { fontSize: 12, textAlign: "center", lineHeight: 18, maxWidth: 240 },
  shareButton: { minHeight: 44, borderRadius: 12, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8 },
  shareText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
