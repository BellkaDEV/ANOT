import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import AppIcon from "../components/AppIcon";
import KeyboardAwareScreen from "../components/KeyboardAwareScreen";
import { Btn, FInput } from "../components/ui";
import type { AppTheme } from "../types";

interface Props {
  onJoin: (code: string) => void;
  onBack: () => void;
  loading?: boolean;
  th: AppTheme;
}

export default function JoinClassScreen({ onJoin, onBack, loading = false, th }: Props) {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  function submit() {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setError("Código de acesso obrigatório");
      return;
    }
    setError("");
    onJoin(clean);
  }

  async function openScanner() {
    setScannerError("");
    setScanned(false);
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setScannerError("Permita o acesso à câmera nas configurações do aparelho para escanear convites.");
        setScannerVisible(true);
        return;
      }
    }
    setScannerVisible(true);
  }

  function handleBarcodeScanned({ data }: { data: string }) {
    if (scanned) return;
    const match = data.trim().match(/^(?:anot:\/\/join\?code=|https:\/\/app\.anot\.com\/join\?code=)([^&]+)/i);
    if (!match?.[1]) {
      setScannerError("QR Code inválido. Use um convite gerado pelo ANOT.");
      return;
    }
    const scannedCode = decodeURIComponent(match[1]).trim().toUpperCase();
    if (!scannedCode) {
      setScannerError("QR Code inválido. O convite não contém um código de turma.");
      return;
    }
    setScanned(true);
    setScannerVisible(false);
    setCode(scannedCode);
    onJoin(scannedCode);
  }

  const header = (
    <View style={[S.header, { backgroundColor: th.headerBg, paddingTop: Math.max(insets.top, 12) + 6 }]}>
      <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={S.backBtn} accessibilityLabel="Voltar">
        <AppIcon name="arrow-back" size={22} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={S.hTitle}>Entrar em Turma</Text>
      <View style={{ width: 22 }} />
    </View>
  );

  return (
    <KeyboardAwareScreen header={header} th={th} contentContainerStyle={S.body}>
      <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
        <View style={S.cardTop}>
          <View style={[S.iconWrap, { backgroundColor: th.orangeLight }]}><AppIcon name="key" size={22} color={th.orange} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[S.cardTitle, { color: th.fg }]}>Código de Acesso</Text>
            <Text style={[S.cardSub, { color: th.muted }]}>Peça o código ao representante da turma</Text>
          </View>
        </View>

        <TouchableOpacity style={[S.scanCard, { borderColor: th.orange, backgroundColor: th.orangeLight }]} onPress={openScanner} accessibilityRole="button">
          <AppIcon name="scan-outline" size={28} color={th.orange} />
          <View style={{ flex: 1 }}>
            <Text style={[S.scanTitle, { color: th.fg }]}>Escanear QR Code</Text>
            <Text style={[S.scanSub, { color: th.muted }]}>Use a câmera para ler um convite ANOT</Text>
          </View>
          <AppIcon name="chevron-forward" size={20} color={th.orange} />
        </TouchableOpacity>

        <FInput th={th} label="Código da Turma" value={code} onChange={(v) => { setCode(v.toUpperCase()); if (error) setError(""); }} placeholder="Ex.: ABC-1234" leftIcon="qr-code-outline" autoCapitalize="characters" error={error} hint="Digite o código com ou sem hífen" />
        <Btn th={th} onPress={submit} loading={loading} full iconName="enter-outline">Entrar na Turma</Btn>
      </View>

      <Modal visible={scannerVisible} animationType="slide" onRequestClose={() => setScannerVisible(false)}>
        <View style={[S.scanner, { backgroundColor: "#000" }]}>
          {permission?.granted ? <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={handleBarcodeScanned} /> : null}
          <View style={S.scannerOverlay}>
            <TouchableOpacity style={S.closeScanner} onPress={() => setScannerVisible(false)} accessibilityLabel="Fechar scanner"><AppIcon name="close" size={28} color="#fff" /></TouchableOpacity>
            <View style={S.scanFrame} />
            <Text style={S.scannerText}>{scannerError || "Aponte a câmera para o QR Code do convite"}</Text>
            {!permission?.granted && <Btn th={{ ...th, orange: "#fff" }} variant="secondary" onPress={openScanner}>Permitir câmera</Btn>}
          </View>
        </View>
      </Modal>
    </KeyboardAwareScreen>
  );
}

const S = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  hTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  body: { padding: 20, gap: 20 },
  card: { borderRadius: 20, borderWidth: 1, padding: 24, gap: 20 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 18, fontWeight: "800" },
  cardSub: { fontSize: 13, marginTop: 2 },
  scanCard: { minHeight: 72, borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  scanTitle: { fontSize: 15, fontWeight: "700" },
  scanSub: { fontSize: 12, marginTop: 3 },
  scanner: { flex: 1 },
  scannerOverlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.3)" },
  closeScanner: { position: "absolute", top: 56, right: 24, minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  scanFrame: { width: 250, height: 250, borderColor: "#fff", borderWidth: 3, borderRadius: 20 },
  scannerText: { color: "#fff", textAlign: "center", fontSize: 15, marginTop: 24, marginBottom: 18, maxWidth: 300 },
});
