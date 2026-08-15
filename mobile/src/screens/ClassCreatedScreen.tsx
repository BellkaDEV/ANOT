import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Btn } from "../components/ui";
import type { AppTheme, AppClass } from "../types";

interface Props { cls: AppClass; onGo: () => void; onDash: () => void; th: AppTheme }

export default function ClassCreatedScreen({ cls, onGo, onDash, th }: Props) {
  return (
    <SafeAreaView style={[S.safe, { backgroundColor: th.bg }]}>
      <ScrollView contentContainerStyle={S.body}>
        {/* Success icon */}
        <View style={[S.successCircle, { backgroundColor: "rgba(16,185,129,0.08)" }]}>
          <View style={[S.innerCircle, { backgroundColor: "rgba(16,185,129,0.15)" }]}>
            <Ionicons name="checkmark-circle" size={52} color="#10b981"/>
          </View>
        </View>

        <Text style={[S.title, { color: th.fg }]}>Turma criada!</Text>
        <Text style={[S.sub, { color: th.muted }]}>Sua turma foi criada com sucesso. Compartilhe o código abaixo.</Text>

        {/* Code card */}
        <View style={[S.codeCard, { backgroundColor: th.card, borderColor: th.border }]}>
          <Text style={[S.codeLabel, { color: th.muted }]}>CÓDIGO DA TURMA</Text>
          <Text style={[S.code, { color: th.orange }]} selectable>{cls.code}</Text>
          <Text style={[S.codeSub, { color: th.muted }]}>Compartilhe com seus colegas para que entrem na turma</Text>
        </View>

        {/* Class info */}
        <View style={[S.infoCard, { backgroundColor: th.card, borderColor: th.border }]}>
          {[
            { icon: "book-outline",     label: "Turma",       val: cls.name },
            { icon: "school-outline",   label: "Curso",       val: cls.course },
            { icon: "business-outline", label: "Instituição", val: cls.institution },
            { icon: "calendar-outline", label: "Período",     val: cls.period },
          ].map(row => (
            <View key={row.label} style={[S.infoRow, { borderColor: th.border }]}>
              <View style={[S.infoIcon, { backgroundColor: th.navyLight }]}>
                <Ionicons name={row.icon as any} size={14} color={th.navy}/>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[S.infoLabel, { color: th.muted }]}>{row.label}</Text>
                <Text style={[S.infoVal, { color: th.fg }]}>{row.val}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ gap: 12, width: "100%" }}>
          <Btn th={th} onPress={onGo} full iconName="arrow-forward">Ir para a turma</Btn>
          <Btn th={th} variant="secondary" onPress={onDash} full>Voltar ao início</Btn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:          { flex: 1 },
  body:          { alignItems: "center", padding: 24, gap: 20, paddingBottom: 40 },
  successCircle: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center", marginTop: 20 },
  innerCircle:   { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center" },
  title:         { fontSize: 26, fontWeight: "900", textAlign: "center" },
  sub:           { fontSize: 14, textAlign: "center", lineHeight: 21, maxWidth: 260 },
  codeCard:      { width: "100%", borderRadius: 20, borderWidth: 1, padding: 20, alignItems: "center", gap: 8 },
  codeLabel:     { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  code:          { fontSize: 26, fontWeight: "900", letterSpacing: 3 },
  codeSub:       { fontSize: 12, textAlign: "center" },
  infoCard:      { width: "100%", borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  infoRow:       { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: 1 },
  infoIcon:      { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  infoLabel:     { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  infoVal:       { fontSize: 14, fontWeight: "600", marginTop: 2 },
});
