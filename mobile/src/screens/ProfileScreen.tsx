import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Btn, HDivider } from "../components/ui";
import FloatingNav from "../components/FloatingNav";
import { getInitials } from "../constants";
import type { AppTheme, AppUser, AppClass, Screen, ActivityStatus } from "../types";

interface Props {
  user: AppUser;
  classes: AppClass[];
  statuses: Record<string, ActivityStatus>;
  onNav: (s: Screen) => void;
  onSettings: () => void;
  onAbout: () => void;
  onLogout: () => void;
  th: AppTheme;
}

export default function ProfileScreen({
  user, classes, statuses, onNav, onSettings, onAbout, onLogout, th,
}: Props) {
  const insets = useSafeAreaInsets();
  const totalActs = classes.reduce((s, c) => s + c.activities.length, 0);
  const done      = Object.values(statuses).filter(v => v === "done").length;
  const pct       = totalActs > 0 ? Math.round(done / totalActs * 100) : 0;

  const links = [
    { icon: "settings-outline",         label: "Configurações",      onPress: onSettings },
    { icon: "information-circle-outline",label: "Sobre o ANOT",      onPress: onAbout },
  ];

  return (
    <View style={[S.safe, { backgroundColor: th.bg }]}>
      <View style={[S.header, { backgroundColor: th.headerBg, paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <Text style={S.hTitle}>Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Avatar section */}
        <View style={[S.avatarSection, { backgroundColor: th.headerBg }]}>
          <View style={[S.avatar, { backgroundColor: "rgba(228,130,46,0.25)" }]}>
            <Text style={S.avatarText}>{getInitials(user.name)}</Text>
          </View>
          <Text style={S.name}>{user.name}</Text>
          <Text style={S.email}>{user.email}</Text>
        </View>

        {/* Stats */}
        <View style={[S.statsRow, { backgroundColor: th.card, borderColor: th.border }]}>
          {[
            { val: String(classes.length), label: "Turmas" },
            { val: `${pct}%`,              label: "Progresso" },
            { val: String(done),           label: "Concluídas" },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              <View style={S.statCol}>
                <Text style={[S.statVal, { color: th.orange }]}>{s.val}</Text>
                <Text style={[S.statLabel, { color: th.muted }]}>{s.label}</Text>
              </View>
              {i < 2 && <View style={[S.statDiv, { backgroundColor: th.border }]}/>}
            </React.Fragment>
          ))}
        </View>

        {/* Progress bar */}
        <View style={[S.progCard, { backgroundColor: th.card, borderColor: th.border }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={[S.progLabel, { color: th.fg }]}>Progresso geral</Text>
            <Text style={[S.progPct, { color: th.orange }]}>{pct}%</Text>
          </View>
          <View style={[S.progTrack, { backgroundColor: th.border }]}>
            <View style={[S.progFill, { width: `${pct}%`, backgroundColor: th.orange }]}/>
          </View>
          <Text style={[S.progSub, { color: th.muted }]}>{done} de {totalActs} atividades concluídas</Text>
        </View>

        {/* Links */}
        <View style={[S.menuCard, { backgroundColor: th.card, borderColor: th.border }]}>
          {links.map((l, i) => (
            <React.Fragment key={l.label}>
              <TouchableOpacity onPress={l.onPress} style={S.menuRow}>
                <View style={[S.menuIcon, { backgroundColor: th.navyLight }]}>
                  <Ionicons name={l.icon as any} size={16} color={th.navy}/>
                </View>
                <Text style={[S.menuLabel, { color: th.fg }]}>{l.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={th.muted}/>
              </TouchableOpacity>
              {i < links.length - 1 && <HDivider th={th}/>}
            </React.Fragment>
          ))}
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <Btn th={th} variant="danger" onPress={onLogout} full iconName="log-out-outline">Sair da conta</Btn>
        </View>
      </ScrollView>

      <FloatingNav current="profile" onNav={onNav} th={th}/>
    </View>
  );
}

const S = StyleSheet.create({
  safe:         { flex: 1 },
  header:       { paddingHorizontal: 20, paddingVertical: 16 },
  hTitle:       { fontSize: 20, fontWeight: "800", color: "#fff" },
  avatarSection:{ alignItems: "center", paddingTop: 4, paddingBottom: 28, gap: 6 },
  avatar:       { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  avatarText:   { fontSize: 28, fontWeight: "900", color: "#fff" },
  name:         { fontSize: 20, fontWeight: "800", color: "#fff" },
  email:        { fontSize: 13, color: "rgba(255,255,255,0.65)" },
  statsRow:     { margin: 16, borderRadius: 16, borderWidth: 1, flexDirection: "row",
                  padding: 20, alignItems: "center" },
  statCol:      { flex: 1, alignItems: "center", gap: 4 },
  statVal:      { fontSize: 22, fontWeight: "900" },
  statLabel:    { fontSize: 11, fontWeight: "600" },
  statDiv:      { width: 1, height: 36 },
  progCard:     { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, borderWidth: 1, padding: 16, gap: 6 },
  progLabel:    { fontSize: 14, fontWeight: "700" },
  progPct:      { fontSize: 14, fontWeight: "800" },
  progTrack:    { height: 8, borderRadius: 4, overflow: "hidden" },
  progFill:     { height: 8, borderRadius: 4 },
  progSub:      { fontSize: 12 },
  menuCard:     { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  menuRow:      { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  menuIcon:     { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  menuLabel:    { flex: 1, fontSize: 14, fontWeight: "600" },
});
