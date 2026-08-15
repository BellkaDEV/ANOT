import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { AppTheme } from "../types";

interface Props { onBack: () => void; th: AppTheme }

export default function AboutScreen({ onBack, th }: Props) {
  const features = [
    { icon: "people-outline",       title: "Gestão de turmas",     desc: "Crie ou entre em turmas com um código único" },
    { icon: "notifications-outline",title: "Avisos em tempo real", desc: "Representantes postam, alunos recebem notificações" },
    { icon: "calendar-outline",     title: "Calendário acadêmico", desc: "Visualize provas, entregas e eventos no calendário" },
    { icon: "checkmark-circle-outline",title: "Controle de progresso", desc: "Marque atividades e acompanhe seu andamento" },
    { icon: "moon-outline",         title: "Tema claro e escuro",  desc: "Interface adaptável ao seu ambiente e preferência" },
  ];

  return (
    <SafeAreaView style={[S.safe, { backgroundColor: th.bg }]}>
      <View style={[S.header, { backgroundColor: th.headerBg }]}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#fff"/>
        </TouchableOpacity>
        <Text style={S.hTitle}>Sobre o ANOT</Text>
        <View style={{ width: 22 }}/>
      </View>

      <ScrollView contentContainerStyle={S.body}>
        {/* Hero */}
        <View style={[S.hero, { backgroundColor: th.card, borderColor: th.border }]}>
          <View style={[S.logoWrap, { backgroundColor: th.orangeLight }]}>
            <Ionicons name="school" size={36} color={th.orange}/>
          </View>
          <Text style={[S.appName, { color: th.fg }]}>ANOT</Text>
          <Text style={[S.version, { color: th.muted }]}>Versão 1.0.0 — Expo SDK 54</Text>
          <Text style={[S.tagline, { color: th.muted }]}>
            Organize sua turma. Acompanhe seu progresso.
          </Text>
        </View>

        {/* Features */}
        <Text style={[S.sLabel, { color: th.muted }]}>FUNCIONALIDADES</Text>
        <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
          {features.map((f, i) => (
            <React.Fragment key={f.title}>
              <View style={S.featureRow}>
                <View style={[S.fIcon, { backgroundColor: th.orangeLight }]}>
                  <Ionicons name={f.icon as any} size={18} color={th.orange}/>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[S.fTitle, { color: th.fg }]}>{f.title}</Text>
                  <Text style={[S.fDesc, { color: th.muted }]}>{f.desc}</Text>
                </View>
              </View>
              {i < features.length - 1 && <View style={[S.div, { backgroundColor: th.border }]}/>}
            </React.Fragment>
          ))}
        </View>

        {/* Tech stack */}
        <Text style={[S.sLabel, { color: th.muted }]}>TECNOLOGIA</Text>
        <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
          {[
            { k: "Framework",   v: "React Native (Expo SDK 54)" },
            { k: "Linguagem",   v: "TypeScript" },
            { k: "Ícones",      v: "@expo/vector-icons" },
            { k: "Navegação",   v: "State-based (sem React Navigation)" },
          ].map((r, i, arr) => (
            <React.Fragment key={r.k}>
              <View style={S.techRow}>
                <Text style={[S.techKey, { color: th.muted }]}>{r.k}</Text>
                <Text style={[S.techVal, { color: th.fg }]}>{r.v}</Text>
              </View>
              {i < arr.length - 1 && <View style={[S.div, { backgroundColor: th.border }]}/>}
            </React.Fragment>
          ))}
        </View>

        <View style={[S.footer, { borderColor: th.border }]}>
          <Text style={[S.footerText, { color: th.muted }]}>
            Feito com ❤️ para universitários brasileiros
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:       { flex: 1 },
  header:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                paddingHorizontal: 20, paddingVertical: 14 },
  hTitle:     { fontSize: 17, fontWeight: "700", color: "#fff" },
  body:       { padding: 16, gap: 12, paddingBottom: 40 },
  hero:       { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: "center", gap: 8, marginBottom: 8 },
  logoWrap:   { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  appName:    { fontSize: 28, fontWeight: "900", letterSpacing: 2 },
  version:    { fontSize: 12 },
  tagline:    { fontSize: 14, textAlign: "center", lineHeight: 21 },
  sLabel:     { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.9, marginLeft: 4 },
  card:       { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  fIcon:      { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  fTitle:     { fontSize: 14, fontWeight: "700" },
  fDesc:      { fontSize: 13, lineHeight: 18, marginTop: 2 },
  div:        { height: 1 },
  techRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 },
  techKey:    { fontSize: 13, fontWeight: "600" },
  techVal:    { fontSize: 13 },
  footer:     { borderTopWidth: 1, paddingTop: 16, alignItems: "center" },
  footerText: { fontSize: 13, textAlign: "center" },
});
