import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Btn, FInput } from "../components/ui";
import { isValidEmail } from "../constants";
import type { AppTheme } from "../types";

interface Props { onRegister: (name: string, email: string, pw: string) => void; onBack: () => void; th: AppTheme }

export default function RegisterScreen({ onRegister, onBack, th }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().split(" ").length < 2) e.name = "Nome completo obrigatório";
    if (!email.trim()) e.email = "E-mail obrigatório";
    else if (!isValidEmail(email)) e.email = "E-mail inválido";
    if (!pw || pw.length < 6) e.pw = "Mínimo 6 caracteres";
    if (pw !== pw2) e.pw2 = "Senhas não conferem";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); onRegister(name.trim(), email.trim(), pw); }, 800);
  }

  return (
    <SafeAreaView style={[S.safe, { backgroundColor: th.bg }]}>
      <View style={[S.header, { backgroundColor: th.headerBg }]}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#fff"/>
        </TouchableOpacity>
        <Text style={S.hTitle}>Criar conta</Text>
        <View style={{ width: 22 }}/>
      </View>

      <ScrollView contentContainerStyle={S.body} keyboardShouldPersistTaps="handled">
        <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
          <View style={S.cardTop}>
            <View style={[S.iconWrap, { backgroundColor: th.orangeLight }]}>
              <Ionicons name="person-add" size={22} color={th.orange}/>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.cardTitle, { color: th.fg }]}>Crie sua conta</Text>
              <Text style={[S.cardSub, { color: th.muted }]}>Rápido, gratuito e seguro</Text>
            </View>
          </View>

          <View style={{ gap: 16 }}>
            <FInput th={th} label="Nome completo" value={name} onChange={setName}
              placeholder="Nome Sobrenome" leftIcon="person-outline" error={errors.name}
              hint="Como preferir ser chamado(a)"/>
            <FInput th={th} label="E-mail institucional" value={email} onChange={setEmail}
              placeholder="seu@email.edu.br" leftIcon="mail-outline" error={errors.email}/>
            <FInput th={th} label="Senha" value={pw} onChange={setPw}
              placeholder="Mínimo 6 caracteres" secure={!showPw} leftIcon="lock-closed-outline"
              rightIcon={showPw ? "eye-off-outline" : "eye-outline"}
              onRightPress={() => setShowPw(!showPw)} error={errors.pw}/>
            <FInput th={th} label="Confirmar senha" value={pw2} onChange={setPw2}
              placeholder="Repita a senha" secure={!showPw} leftIcon="shield-checkmark-outline" error={errors.pw2}/>
          </View>

          <Btn th={th} onPress={submit} full loading={loading}>Criar conta</Btn>
        </View>

        <View style={S.loginRow}>
          <Text style={[S.loginText, { color: th.muted }]}>Já tem conta? </Text>
          <TouchableOpacity onPress={onBack}>
            <Text style={[S.loginLink, { color: th.orange }]}>Entrar</Text>
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
  loginRow: { flexDirection: "row", justifyContent: "center" },
  loginText:{ fontSize: 14 },
  loginLink:{ fontSize: 14, fontWeight: "700" },
});
