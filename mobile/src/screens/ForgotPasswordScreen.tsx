import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppIcon from "../components/AppIcon";
import KeyboardAwareScreen from "../components/KeyboardAwareScreen";
import { Btn, FInput } from "../components/ui";
import { isValidEmail } from "../constants";
import type { AppTheme } from "../types";

interface Props {
  onSubmit: (email: string) => Promise<boolean>;
  onBack: () => void;
  loading?: boolean;
  th: AppTheme;
}

export default function ForgotPasswordScreen({ onSubmit, onBack, loading = false, th }: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!email.trim()) return setError("E-mail obrigatório");
    if (!isValidEmail(email)) return setError("E-mail inválido");
    setError(undefined);
    if (await onSubmit(email.trim())) setSent(true);
  }

  const header = (
    <View style={[S.header, { backgroundColor: th.headerBg, paddingTop: Math.max(insets.top, 12) + 6 }]}>
      <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={S.backBtn} accessibilityLabel="Voltar">
        <AppIcon name="arrow-back" size={22} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={S.hTitle}>Recuperar senha</Text>
      <View style={{ width: 22 }} />
    </View>
  );

  return (
    <KeyboardAwareScreen header={header} th={th} contentContainerStyle={S.body}>
      <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
        <View style={S.cardTop}>
          <View style={[S.iconWrap, { backgroundColor: th.orangeLight }]}><AppIcon name="key-outline" size={22} color={th.orange} /></View>
          <View style={{ flex: 1 }}><Text style={[S.cardTitle, { color: th.fg }]}>Redefina sua senha</Text><Text style={[S.cardSub, { color: th.muted }]}>Enviaremos instruções para o e-mail informado.</Text></View>
        </View>
        {sent ? (
          <View style={[S.successBox, { backgroundColor: th.successBg }]}><Text style={[S.successText, { color: th.success }]}>Se o e-mail estiver cadastrado, você receberá as instruções em instantes. Verifique também a caixa de spam.</Text></View>
        ) : (
          <>
            <FInput th={th} label="E-mail cadastrado" value={email} onChange={setEmail} placeholder="seu@email.edu.br" leftIcon="mail-outline" keyboardType="email-address" autoCapitalize="none" error={error} />
            <Btn th={th} onPress={submit} loading={loading} full iconName="send-outline">Enviar instruções</Btn>
          </>
        )}
      </View>
      {sent && <Btn th={th} variant="secondary" onPress={onBack} full>Voltar para o login</Btn>}
    </KeyboardAwareScreen>
  );
}

const S = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  hTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  body: { padding: 20, gap: 20, justifyContent: "center" },
  card: { borderRadius: 20, borderWidth: 1, padding: 24, gap: 20 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 18, fontWeight: "800" },
  cardSub: { fontSize: 13, marginTop: 2, lineHeight: 19 },
  successBox: { borderRadius: 12, padding: 14 },
  successText: { fontSize: 14, lineHeight: 21 },
});
