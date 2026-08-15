import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Btn, FInput } from "../components/ui";
import { isValidEmail, DEMO_ACCOUNTS } from "../constants";
import type { AppTheme } from "../types";

interface Props { onLogin: (email: string, pw: string) => void; onBack: () => void; onRegister: () => void; th: AppTheme }

export default function LoginScreen({ onLogin, onBack, onRegister, th }: Props) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; pw?: string }>({});
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(email.trim(), pw); }, 800);
  }

  return (
    <SafeAreaView style={[S.safe, { backgroundColor: th.bg }]}>
      {/* Header */}
      <View style={[S.header, { backgroundColor: th.headerBg }]}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#fff"/>
        </TouchableOpacity>
        <Text style={S.hTitle}>Entrar</Text>
        <View style={{ width: 22 }}/>
      </View>

      <ScrollView contentContainerStyle={S.body} keyboardShouldPersistTaps="handled">
        <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
          <View style={S.cardTop}>
            <View style={[S.iconWrap, { backgroundColor: th.orangeLight }]}>
              <Ionicons name="log-in" size={22} color={th.orange}/>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.cardTitle, { color: th.fg }]}>Bem-vindo de volta</Text>
              <Text style={[S.cardSub, { color: th.muted }]}>Entre com sua conta ANOT</Text>
            </View>
          </View>

          <View style={{ gap: 16 }}>
            <FInput th={th} label="E-mail institucional" value={email} onChange={setEmail}
              placeholder="seu@email.edu.br" leftIcon="mail-outline" error={errors.email}
              hint="Use o e-mail da sua conta"/>
            <FInput th={th} label="Senha" value={pw} onChange={setPw}
              placeholder="••••••••" secure={!showPw} leftIcon="lock-closed-outline"
              rightIcon={showPw ? "eye-off-outline" : "eye-outline"}
              onRightPress={() => setShowPw(!showPw)} error={errors.pw}/>
          </View>

          <Btn th={th} onPress={submit} full loading={loading}>Entrar</Btn>

          <TouchableOpacity style={{ alignItems: "flex-end" }}>
            <Text style={[S.forgot, { color: th.orange }]}>Esqueceu a senha?</Text>
          </TouchableOpacity>
        </View>

        {/* Demo accounts */}
        <View style={[S.demoCard, { backgroundColor: th.card, borderColor: th.border }]}>
          <Text style={[S.demoTitle, { color: th.muted }]}>CONTAS DEMO RÁPIDO</Text>
          {Object.entries(DEMO_ACCOUNTS).map(([em, { name }]) => (
            <TouchableOpacity key={em} onPress={() => { setEmail(em); setPw("123456"); }}
              style={[S.demoRow, { borderColor: th.border }]}>
              <View style={[S.demoAvatar, { backgroundColor: th.orangeLight }]}>
                <Text style={[S.demoInit, { color: th.orange }]}>{name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[S.demoName, { color: th.fg }]}>{name}</Text>
                <Text style={[S.demoEmail, { color: th.muted }]}>{em}</Text>
              </View>
              <Ionicons name="arrow-forward-circle-outline" size={18} color={th.orange}/>
            </TouchableOpacity>
          ))}
        </View>

        <View style={S.signupRow}>
          <Text style={[S.signupText, { color: th.muted }]}>Não tem conta? </Text>
          <TouchableOpacity onPress={onRegister}>
            <Text style={[S.signupLink, { color: th.orange }]}>Criar conta grátis</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:     { flex: 1 },
  header:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
              paddingHorizontal: 20, paddingVertical: 14 },
  hTitle:   { fontSize: 17, fontWeight: "700", color: "#fff" },
  body:     { padding: 20, gap: 16, paddingBottom: 40 },
  card:     { borderRadius: 20, borderWidth: 1, padding: 20, gap: 18,
              shadowColor: "#0e2f5a", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop:  { flexDirection: "row", alignItems: "center", gap: 14 },
  iconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTitle:{ fontSize: 18, fontWeight: "800" },
  cardSub:  { fontSize: 13 },
  forgot:   { fontSize: 13, fontWeight: "600" },
  demoCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  demoTitle:{ fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  demoRow:  { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, borderTopWidth: 1 },
  demoAvatar:{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  demoInit: { fontSize: 14, fontWeight: "800" },
  demoName: { fontSize: 14, fontWeight: "700" },
  demoEmail:{ fontSize: 12 },
  signupRow:{ flexDirection: "row", justifyContent: "center" },
  signupText:{ fontSize: 14 },
  signupLink:{ fontSize: 14, fontWeight: "700" },
});
