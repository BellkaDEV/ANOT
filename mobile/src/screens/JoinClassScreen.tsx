import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppIcon from "../components/AppIcon";
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

  function submit() {
    const c = code.trim();
    if (!c) {
      setError("Código ou link é obrigatório");
      return;
    }
    if (c.length < 3) {
      setError("Código muito curto");
      return;
    }
    setError("");
    onJoin(c);
  }

  return (
    <View style={[S.safe, { backgroundColor: th.bg }]}>
      <View style={[S.header, { backgroundColor: th.headerBg, paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={S.backBtn}
          accessibilityLabel="Voltar"
        >
          <AppIcon name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={S.hTitle}>Entrar em turma</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={S.body} keyboardShouldPersistTaps="handled">
        {/* QR option — Presented disabled as "Em breve" */}
        <View style={[S.qrCardDisabled, { backgroundColor: th.card2, borderColor: th.border }]}>
          <AppIcon name="qr-code-outline" size={28} color={th.muted} />
          <View style={{ flex: 1 }}>
            <View style={S.qrTitleRow}>
              <Text style={[S.qrTitle, { color: th.muted }]}>Escanear QR Code</Text>
              <View style={[S.badge, { backgroundColor: th.card }]}>
                <Text style={[S.badgeText, { color: th.muted }]}>Em breve</Text>
              </View>
            </View>
            <Text style={[S.qrSub, { color: th.muted }]}>
              O escaneamento por câmera estará disponível na próxima atualização.
            </Text>
          </View>
        </View>

        <View style={S.divRow}>
          <View style={[S.divLine, { backgroundColor: th.border }]} />
          <Text style={[S.divText, { color: th.muted }]}>ou use o código manual</Text>
          <View style={[S.divLine, { backgroundColor: th.border }]} />
        </View>

        <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
          <View style={S.cardTop}>
            <View style={[S.iconWrap, { backgroundColor: th.navyLight }]}>
              <AppIcon name="enter-outline" size={22} color={th.navy} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.cardTitle, { color: th.fg }]}>Código da turma</Text>
              <Text style={[S.cardSub, { color: th.muted }]}>Digite o código fornecido pelo representante</Text>
            </View>
          </View>

          <FInput
            th={th}
            label="Código de Acesso"
            value={code}
            onChange={(t) => setCode(t.toUpperCase())}
            placeholder="Ex.: 7K9W2X"
            leftIcon="key-outline"
            error={error}
            hint="Digite o código único de 6 caracteres ou cole o link de entrada"
          />

          <Btn th={th} onPress={submit} full loading={loading} iconName="enter-outline">
            Entrar na turma
          </Btn>
        </View>

        <View style={[S.hintCard, { backgroundColor: th.card2, borderColor: th.border }]}>
          <AppIcon name="information-circle-outline" size={18} color={th.muted} />
          <Text style={[S.hintText, { color: th.muted }]}>
            O código possui 6 caracteres (ex: 7K9W2X). Você também pode colar o link direto enviado pelo representante.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  hTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  body: { padding: 20, gap: 16, paddingBottom: 40 },
  qrCardDisabled: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    opacity: 0.8,
  },
  qrTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  qrTitle: { fontSize: 15, fontWeight: "700" },
  qrSub: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  divRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  divLine: { flex: 1, height: 1 },
  divText: { fontSize: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 18,
    shadowColor: "#0e2f5a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconWrap: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 18, fontWeight: "800" },
  cardSub: { fontSize: 13 },
  hintCard: { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: "row", gap: 10, alignItems: "flex-start" },
  hintText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
