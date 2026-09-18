import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppIcon from "../components/AppIcon";
import KeyboardAwareScreen from "../components/KeyboardAwareScreen";
import { Btn, FInput } from "../components/ui";
import type { AppTheme } from "../types";

interface Props {
  email: string;
  onSubmit: (password: string) => Promise<boolean>;
  onBack: () => void;
  loading?: boolean;
  th: AppTheme;
}

export default function ResetPasswordScreen({ email, onSubmit, onBack, loading = false, th }: Props) {
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);

  async function submit() {
    if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return setError("Use pelo menos 8 caracteres, maiúsculas, minúsculas e números.");
    }
    if (password !== confirmation) return setError("As senhas não coincidem.");
    setError(undefined);
    if (await onSubmit(password)) setDone(true);
  }

  const header = (
    <View style={[S.header, { backgroundColor: th.headerBg, paddingTop: Math.max(insets.top, 12) + 6 }]}>
      <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={S.backBtn} accessibilityLabel="Voltar">
        <AppIcon name="arrow-back" size={22} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={S.hTitle}>Nova senha</Text>
      <View style={{ width: 22 }} />
    </View>
  );

  return (
    <KeyboardAwareScreen header={header} th={th} contentContainerStyle={S.body}>
      <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
        <View style={S.cardTop}>
          <View style={[S.iconWrap, { backgroundColor: th.orangeLight }]}><AppIcon name="lock-closed-outline" size={22} color={th.orange} /></View>
          <View style={{ flex: 1 }}><Text style={[S.cardTitle, { color: th.fg }]}>Crie uma nova senha</Text><Text style={[S.cardSub, { color: th.muted }]}>{email}</Text></View>
        </View>
        {done ? (
          <View style={[S.successBox, { backgroundColor: th.successBg }]}><Text style={[S.successText, { color: th.success }]}>Senha redefinida. Você já pode entrar novamente no ANOT.</Text></View>
        ) : (
          <>
            <FInput th={th} label="Nova senha" value={password} onChange={setPassword} placeholder="••••••••" secure={!showPassword} leftIcon="lock-closed-outline" rightIcon={showPassword ? "eye-off-outline" : "eye-outline"} onRightPress={() => setShowPassword(!showPassword)} hint="Mínimo de 8 caracteres, maiúscula, minúscula e número" />
            <FInput th={th} label="Confirme a senha" value={confirmation} onChange={setConfirmation} placeholder="••••••••" secure={!showPassword} leftIcon="shield-checkmark-outline" error={error} />
            <Btn th={th} onPress={submit} loading={loading} full iconName="checkmark-circle-outline">Salvar nova senha</Btn>
          </>
        )}
      </View>
      {done && <Btn th={th} variant="secondary" onPress={onBack} full>Voltar para o login</Btn>}
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
  cardSub: { fontSize: 13, marginTop: 2 },
  successBox: { borderRadius: 12, padding: 14 },
  successText: { fontSize: 14, lineHeight: 21 },
});
