import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppIcon from "../components/AppIcon";
import KeyboardAwareScreen from "../components/KeyboardAwareScreen";
import { Btn, FInput } from "../components/ui";
import { isValidEmail } from "../constants";
import type { AppTheme } from "../types";

interface Props {
  onRegister: (name: string, email: string, pw: string) => void;
  onBack: () => void;
  loading?: boolean;
  th: AppTheme;
}

export default function RegisterScreen({ onRegister, onBack, loading = false, th }: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; pw?: string; confirmPw?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Nome completo obrigatório";
    if (!email.trim()) e.email = "E-mail obrigatório";
    else if (!isValidEmail(email)) e.email = "E-mail inválido";
    if (!pw) e.pw = "Senha obrigatória";
    else if (pw.length < 12) e.pw = "A senha deve conter no mínimo 12 caracteres";
    else if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) e.pw = "A senha deve conter pelo menos uma letra e um número";
    if (pw !== confirmPw) e.confirmPw = "As senhas não coincidem";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    onRegister(name.trim(), email.trim(), pw);
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
      <Text style={S.hTitle}>Criar Conta</Text>
      <View style={{ width: 22 }} />
    </View>
  );

  return (
    <KeyboardAwareScreen header={header} th={th} contentContainerStyle={S.body}>
      <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
        <View style={S.cardTop}>
          <View style={[S.iconWrap, { backgroundColor: th.orangeLight }]}>
            <AppIcon name="person-add" size={22} color={th.orange} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[S.cardTitle, { color: th.fg }]}>Nova Conta ANOT</Text>
            <Text style={[S.cardSub, { color: th.muted }]}>Organize sua rotina acadêmica</Text>
          </View>
        </View>

        <View style={{ gap: 14 }}>
          <FInput
            th={th}
            label="Nome Completo *"
            value={name}
            onChange={setName}
            placeholder="Ex.: Maria Silva"
            leftIcon="person-outline"
            autoCapitalize="words"
            error={errors.name}
          />
          <FInput
            th={th}
            label="E-mail *"
            value={email}
            onChange={setEmail}
            placeholder="seu.nome@universidade.edu.br"
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <FInput
            th={th}
            label="Senha *"
            value={pw}
            onChange={setPw}
            placeholder="Mínimo 6 caracteres"
            secure={!showPw}
            leftIcon="lock-closed-outline"
            rightIcon={showPw ? "eye-off-outline" : "eye-outline"}
            onRightPress={() => setShowPw(!showPw)}
            error={errors.pw}
          />
          <FInput
            th={th}
            label="Confirmar Senha *"
            value={confirmPw}
            onChange={setConfirmPw}
            placeholder="Repita sua senha"
            secure={!showPw}
            leftIcon="shield-checkmark-outline"
            error={errors.confirmPw}
          />
        </View>

        <Btn th={th} onPress={submit} loading={loading} full iconName="checkmark-circle-outline">
          Finalizar Cadastro
        </Btn>
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
  body: { padding: 20, gap: 20 },
  card: { borderRadius: 20, borderWidth: 1, padding: 24, gap: 18 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 18, fontWeight: "800" },
  cardSub: { fontSize: 13, marginTop: 2 },
});
