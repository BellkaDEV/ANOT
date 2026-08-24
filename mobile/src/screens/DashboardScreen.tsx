import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Btn, SkelCard, Empty } from "../components/ui";
import type { AppTheme, AppClass, AppUser } from "../types";

interface Props {
  user: AppUser;
  classes: AppClass[];
  onSelectClass: (id: string) => void;
  onCreateClass: () => void;
  onJoinClass: () => void;
  onProfile: () => void;
  onSettings: () => void;
  loading?: boolean;
  th: AppTheme;
}

export default function DashboardScreen({
  user, classes, onSelectClass, onCreateClass, onJoinClass, onProfile, onSettings, loading, th,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[S.safe, { backgroundColor: th.bg }]}>
      {/* Header */}
      <View style={[S.header, { backgroundColor: th.headerBg, paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <View>
          <Text style={S.hGreet}>Olá, {user.name.split(" ")[0]} 👋</Text>
          <Text style={S.hSub}>{classes.length} {classes.length === 1 ? "turma" : "turmas"} ativas</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity onPress={onSettings} style={[S.iconBtn, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
            <Ionicons name="settings-outline" size={18} color="#fff"/>
          </TouchableOpacity>
          <TouchableOpacity onPress={onProfile} style={[S.iconBtn, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
            <Ionicons name="person-circle-outline" size={20} color="#fff"/>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={S.body}>
        {/* Quick actions */}
        <View style={S.actionRow}>
          <TouchableOpacity onPress={onCreateClass} style={[S.actionCard, { backgroundColor: th.card, borderColor: th.border }]}>
            <View style={[S.actionIcon, { backgroundColor: th.orangeLight }]}>
              <Ionicons name="add-circle" size={22} color={th.orange}/>
            </View>
            <Text style={[S.actionLabel, { color: th.fg }]}>Criar turma</Text>
            <Text style={[S.actionSub, { color: th.muted }]}>Como representante</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onJoinClass} style={[S.actionCard, { backgroundColor: th.card, borderColor: th.border }]}>
            <View style={[S.actionIcon, { backgroundColor: th.navyLight }]}>
              <Ionicons name="enter" size={22} color={th.navy}/>
            </View>
            <Text style={[S.actionLabel, { color: th.fg }]}>Entrar em turma</Text>
            <Text style={[S.actionSub, { color: th.muted }]}>Via código ou link</Text>
          </TouchableOpacity>
        </View>

        {/* Classes */}
        <Text style={[S.sectionTitle, { color: th.muted }]}>SUAS TURMAS</Text>
        {loading ? (
          [1, 2].map(i => <SkelCard key={i} th={th}/>)
        ) : classes.length === 0 ? (
          <Empty th={th} icon="school-outline" title="Nenhuma turma ainda"
            sub="Crie ou entre em uma turma para começar"/>
        ) : (
          classes.map(cls => {
            const myRole = cls.members.find(m => m.userId === user.id)?.classRole;
            const pending = cls.activities.length;
            return (
              <TouchableOpacity key={cls.id} onPress={() => onSelectClass(cls.id)}
                style={[S.clsCard, { backgroundColor: th.card, borderColor: th.border, borderLeftColor: th.orange }]}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                  <View style={[S.clsIcon, { backgroundColor: th.orangeLight }]}>
                    <Ionicons name="school" size={20} color={th.orange}/>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.clsName, { color: th.fg }]} numberOfLines={2}>{cls.name}</Text>
                    <Text style={[S.clsInst, { color: th.muted }]}>{cls.institution}</Text>
                    <View style={S.clsMeta}>
                      <Text style={[S.clsMetaText, { color: th.muted }]}>
                        <Ionicons name="people-outline" size={11}/> {cls.members.length} membros
                      </Text>
                      <Text style={[S.clsMetaText, { color: th.muted }]}>
                        <Ionicons name="calendar-outline" size={11}/> {cls.period}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    {myRole && myRole !== "student" && (
                      <View style={[S.roleBadge, { backgroundColor: th.orangeLight }]}>
                        <Text style={[S.roleText, { color: th.orange }]}>
                          {myRole === "owner" ? "Criador" : "Rep."}
                        </Text>
                      </View>
                    )}
                    {pending > 0 && (
                      <View style={S.pendBadge}>
                        <Text style={S.pendText}>{pending} ativ.</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  safe:       { flex: 1 },
  header:     { paddingHorizontal: 20, paddingVertical: 18, flexDirection: "row",
                alignItems: "center", justifyContent: "space-between" },
  hGreet:     { fontSize: 20, fontWeight: "800", color: "#fff" },
  hSub:       { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  iconBtn:    { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  body:       { padding: 20, gap: 8, paddingBottom: 40 },
  actionRow:  { flexDirection: "row", gap: 12, marginBottom: 8 },
  actionCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 16, gap: 8,
                shadowColor: "#0e2f5a", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionLabel:{ fontSize: 14, fontWeight: "700" },
  actionSub:  { fontSize: 12 },
  sectionTitle:{ fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.9, marginTop: 8, marginBottom: 6 },
  clsCard:    { borderRadius: 16, borderWidth: 1, borderLeftWidth: 3, padding: 14, marginBottom: 4,
                shadowColor: "#0e2f5a", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  clsIcon:    { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  clsName:    { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  clsInst:    { fontSize: 12, marginBottom: 6 },
  clsMeta:    { flexDirection: "row", gap: 12 },
  clsMetaText:{ fontSize: 11 },
  roleBadge:  { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 20 },
  roleText:   { fontSize: 11, fontWeight: "700" },
  pendBadge:  { backgroundColor: "rgba(14,47,90,0.08)", paddingVertical: 2, paddingHorizontal: 8, borderRadius: 20 },
  pendText:   { fontSize: 11, fontWeight: "600", color: "#0e2f5a" },
});
