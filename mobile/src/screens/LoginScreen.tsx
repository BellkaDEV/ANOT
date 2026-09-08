import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppIcon from "../components/AppIcon";
import KeyboardAwareScreen from "../components/KeyboardAwareScreen";
import { Btn, FInput } from "../components/ui";
import { isValidEmail } from "../constants";
import type { AppTheme } from "../types";

interface Props {
  onLogin: (email: string, pw: string) => void;
  onBack: () => void;
  onRegister: () => void;
  loading?: boolean;
  th: AppTheme;
}

export default function LoginScreen({ onLogin, onBack, onRegister, loading = false, th }: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; pw?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "E-mail obrigatório";
    else if (!isValidEmail(email)) e.email = "E-mail inválido";
    if (!pw) e.pw = "Senha obrigatória";
    else if (pw.length < 6) e.pw = "Mínimo 6 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    onLogin(email.trim(), pw);
  }

  const header = (
    <View style={[S.header, { backgroundColor: th.headerBg, paddingTop: Math.max(insets.top, 12) + 6 }]}>
      <TouchableOpacity
        onPress={onBack}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={S.backBtn}
        accessibilityLabel="Voltar"
      >
        <AppIcon name="arrow-back" size={22} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={S.hTitle}>Entrar</Text>
      <View style={{ width: 22 }} />
    </View>
  );

  return (
    <KeyboardAwareScreen header={header} th={th} contentContainerStyle={S.body}>
      <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
        <View style={S.cardTop}>
          <View style={[S.iconWrap, { backgroundColor: th.orangeLight }]}>
            <AppIcon name="log-in" size={22} color={th.orange} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[S.cardTitle, { color: th.fg }]}>Bem-vindo de volta</Text>
            <Text style={[S.cardSub, { color: th.muted }]}>Entre com sua conta ANOT</Text>
          </View>
        </View>

        <View style={{ gap: 16 }}>
          <FInput
            th={th}
            label="E-mail institucional"
            value={email}
            onChange={setEmail}
            placeholder="seu@email.edu.br"
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            hint="Use o e-mail cadastrado na sua conta"
          />
          <FInput
            th={th}
            label="Senha"
            value={pw}
            onChange={setPw}
            placeholder="••••••••"
            secure={!showPw}
            leftIcon="lock-closed-outline"
            rightIcon={showPw ? "eye-off-outline" : "eye-outline"}
            onRightPress={() => setShowPw(!showPw)}
            error={errors.pw}
          />
        </View>

        <Btn th={th} onPress={submit} loading={loading} full iconName="log-in-outline">
          Entrar na conta
        </Btn>
      </View>

      <View style={S.footerRow}>
        <Text style={[S.footerText, { color: th.muted }]}>Ainda não tem uma conta?</Text>
        <TouchableOpacity onPress={onRegister} accessibilityLabel="Criar conta">
          <Text style={[S.registerLink, { color: th.orange }]}> Criar conta</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScreen>
  );
}

const S = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  hTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  body: { padding: 20, gap: 20, justifyContent: "center" },
  card: { borderRadius: 20, borderWidth: 1, padding: 24, gap: 20 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 18, fontWeight: "800" },
  cardSub: { fontSize: 13, marginTop: 2 },
  footerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 10 },
  footerText: { fontSize: 14 },
  registerLink: { fontSize: 14, fontWeight: "700" },
});
