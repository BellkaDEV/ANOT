import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
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
  loadError?: boolean;
  onRetry?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  th: AppTheme;
}

export default function DashboardScreen({
  user,
  classes,
  onSelectClass,
  onCreateClass,
  onJoinClass,
  onProfile,
  onSettings,
  loading,
  loadError,
  onRetry,
  onRefresh,
  refreshing,
  th,
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
          <TouchableOpacity
            onPress={onSettings}
            style={[S.iconBtn, { backgroundColor: "rgba(255,255,255,0.12)" }]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Configurações do aplicativo"
            accessibilityHint="Toque para abrir configurações"
          >
            <Ionicons name="settings-outline" size={18} color="#fff"/>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onProfile}
            style={[S.iconBtn, { backgroundColor: "rgba(255,255,255,0.12)" }]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Meu perfil"
            accessibilityHint="Toque para abrir seu perfil"
          >
            <Ionicons name="person-circle-outline" size={20} color="#fff"/>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={S.body}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={onRefresh}
              tintColor={th.orange}
              colors={[th.orange]}
            />
          ) : undefined
        }
      >
        {/* Quick actions */}
        <View style={S.actionRow}>
          <TouchableOpacity
            onPress={onCreateClass}
            style={[S.actionCard, { backgroundColor: th.card, borderColor: th.border }]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Criar turma como representante"
            accessibilityHint="Toque para criar uma nova turma"
          >
            <View style={[S.actionIcon, { backgroundColor: th.orangeLight }]} importantForAccessibility="no">
              <Ionicons name="add-circle" size={22} color={th.orange}/>
            </View>
            <Text style={[S.actionLabel, { color: th.fg }]}>Criar turma</Text>
            <Text style={[S.actionSub, { color: th.muted }]}>Como representante</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onJoinClass}
            style={[S.actionCard, { backgroundColor: th.card, borderColor: th.border }]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Entrar em turma via código ou link"
            accessibilityHint="Toque para entrar em uma turma existente"
          >
            <View style={[S.actionIcon, { backgroundColor: th.navyLight }]} importantForAccessibility="no">
              <Ionicons name="enter" size={22} color={th.navy}/>
            </View>
            <Text style={[S.actionLabel, { color: th.fg }]}>Entrar em turma</Text>
            <Text style={[S.actionSub, { color: th.muted }]}>Via código ou link</Text>
          </TouchableOpacity>
        </View>

        {/* Classes */}
        <Text style={[S.sectionTitle, { color: th.muted }]} accessibilityRole="header">SUAS TURMAS</Text>

        {/* Inline error when refreshing fails but cached classes exist */}
        {loadError && classes.length > 0 && (
          <View
            style={[S.inlineError, { backgroundColor: th.card, borderColor: th.border }]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <Ionicons name="alert-circle-outline" size={20} color={th.error || "#ef4444"} />
              <Text style={[S.inlineErrorText, { color: th.fg, flex: 1 }]}>
                Não foi possível atualizar as turmas.
              </Text>
            </View>
            {Boolean(onRetry) && (
              <TouchableOpacity
                onPress={onRetry}
                style={[S.retryBtn, { backgroundColor: th.orange }]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Tentar novamente atualizar turmas"
                accessibilityHint="Toque para recarregar as turmas"
              >
                <Text style={S.retryBtnText}>Tentar novamente</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {loading ? (
          [1, 2].map(i => <SkelCard key={i} th={th}/>)
        ) : loadError && classes.length === 0 ? (
          <Empty th={th} icon="cloud-offline-outline" title="Não foi possível carregar as turmas"
            sub="Verifique sua conexão e tente novamente." cta="Tentar novamente" onCta={onRetry}/>
        ) : classes.length === 0 ? (
          <Empty th={th} icon="school-outline" title="Nenhuma turma ainda"
            sub="Crie ou entre em uma turma para começar"/>
        ) : (
          classes.map(cls => {
            const myRole = cls.members.find(m => m.userId === user.id)?.classRole;
            const pending = cls.activities.length;
            const roleLabel = myRole === "owner" ? "Criador" : myRole === "rep" ? "Representante" : "";
            const accessibilityLabel = `${cls.name}, instituição ${cls.institution}, período ${cls.period}, ${cls.members.length} ${cls.members.length === 1 ? "membro" : "membros"}${pending > 0 ? `, ${pending} ${pending === 1 ? "atividade" : "atividades"}` : ""}${roleLabel ? `, seu papel: ${roleLabel}` : ""}`;

            return (
              <TouchableOpacity
                key={cls.id}
                onPress={() => onSelectClass(cls.id)}
                style={[S.clsCard, { backgroundColor: th.card, borderColor: th.border, borderLeftColor: th.orange }]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                accessibilityHint="Toque para ver os detalhes da turma"
              >
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                  <View style={[S.clsIcon, { backgroundColor: th.orangeLight }]} importantForAccessibility="no">
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
  inlineError:{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 8 },
  inlineErrorText:{ fontSize: 13, fontWeight: "600" },
  retryBtn:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  retryBtnText:{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
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
