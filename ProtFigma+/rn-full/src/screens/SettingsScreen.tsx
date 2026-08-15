import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FToggle, HDivider } from "../components/ui";
import type { AppTheme } from "../types";

interface Props { dark: boolean; onToggleDark: (v: boolean) => void; onBack: () => void; th: AppTheme }

export default function SettingsScreen({ dark, onToggleDark, onBack, th }: Props) {
  const sections = [
    {
      title: "Aparência",
      rows: [
        {
          type: "toggle" as const,
          icon: "moon-outline",
          label: "Tema escuro",
          sub: "Adaptar a interface para ambientes com pouca luz",
          value: dark,
          onChange: onToggleDark,
        },
      ],
    },
    {
      title: "Notificações",
      rows: [
        { type: "toggle" as const, icon: "notifications-outline", label: "Avisos da turma", sub: "Receber notificações de novos avisos", value: true, onChange: () => {} },
        { type: "toggle" as const, icon: "alarm-outline", label: "Lembretes de prazo", sub: "Lembrar 1 dia antes da entrega", value: true, onChange: () => {} },
      ],
    },
    {
      title: "Conta",
      rows: [
        { type: "link" as const, icon: "lock-closed-outline", label: "Alterar senha", sub: "Atualizar credenciais de acesso" },
        { type: "link" as const, icon: "mail-outline",        label: "Alterar e-mail",  sub: "Atualizar seu e-mail institucional" },
      ],
    },
  ];

  return (
    <SafeAreaView style={[S.safe, { backgroundColor: th.bg }]}>
      <View style={[S.header, { backgroundColor: th.headerBg }]}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#fff"/>
        </TouchableOpacity>
        <Text style={S.hTitle}>Configurações</Text>
        <View style={{ width: 22 }}/>
      </View>

      <ScrollView contentContainerStyle={S.body}>
        {sections.map(sec => (
          <View key={sec.title}>
            <Text style={[S.sLabel, { color: th.muted }]}>{sec.title.toUpperCase()}</Text>
            <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
              {sec.rows.map((row, i) => (
                <React.Fragment key={row.label}>
                  <View style={S.row}>
                    <View style={[S.iconWrap, { backgroundColor: th.navyLight }]}>
                      <Ionicons name={row.icon as any} size={16} color={th.navy}/>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[S.rowLabel, { color: th.fg }]}>{row.label}</Text>
                      <Text style={[S.rowSub, { color: th.muted }]}>{row.sub}</Text>
                    </View>
                    {row.type === "toggle"
                      ? <FToggle th={th} checked={row.value!} onChange={row.onChange!}/>
                      : <Ionicons name="chevron-forward" size={16} color={th.muted}/>}
                  </View>
                  {i < sec.rows.length - 1 && <HDivider th={th}/>}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1 },
  header:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
             paddingHorizontal: 20, paddingVertical: 14 },
  hTitle:  { fontSize: 17, fontWeight: "700", color: "#fff" },
  body:    { padding: 16, gap: 12, paddingBottom: 40 },
  sLabel:  { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.9, marginBottom: 6, marginLeft: 4 },
  card:    { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 8 },
  row:     { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  iconWrap:{ width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowLabel:{ fontSize: 14, fontWeight: "600" },
  rowSub:  { fontSize: 12, marginTop: 1 },
});
