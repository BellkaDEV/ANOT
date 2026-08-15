import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge, Btn, Empty, MemberAvatar, SLabel } from "../components/ui";
import { PRIORITY_META, ACT_META, ROLE_META, isExpired } from "../constants";
import type {
  AppTheme, AppClass, AppUser, Announcement, Activity, Member, ClassRole,
} from "../types";

type RepTab = "avisos" | "atividades" | "membros" | "turma";

interface Props {
  cls: AppClass;
  user: AppUser;
  onAddAnn: () => void;
  onEditAnn: (id: string) => void;
  onDelAnn: (id: string) => void;
  onAddActivity: () => void;
  onEditActivity: (id: string) => void;
  onDelActivity: (id: string) => void;
  onPromote: (id: string) => void;
  onDemote: (id: string) => void;
  onExpel: (id: string) => void;
  onViewMember: (m: Member) => void;
  onUpdateClass: (data: Partial<AppClass>) => void;
  onDeleteClass: () => void;
  onBack: () => void;
  th: AppTheme;
}

export default function RepPanelScreen({
  cls, user, onAddAnn, onEditAnn, onDelAnn,
  onAddActivity, onEditActivity, onDelActivity,
  onPromote, onDemote, onExpel, onViewMember,
  onDeleteClass, onBack, th,
}: Props) {
  const [tab, setTab] = useState<RepTab>("avisos");
  const myRole = cls.members.find(m => m.userId === user.id)?.classRole ?? "student";
  const isOwner = myRole === "owner";

  const TABS: { key: RepTab; label: string; icon: string }[] = [
    { key: "avisos",     label: "Avisos",     icon: "notifications-outline" },
    { key: "atividades", label: "Atividades", icon: "list-outline" },
    { key: "membros",    label: "Membros",    icon: "people-outline" },
    { key: "turma",      label: "Turma",      icon: "settings-outline" },
  ];

  // ── AVISOS TAB ─────────────────────────────────────────────────────────────
  function TabAvisos() {
    return (
      <View style={{ gap: 10 }}>
        <Btn th={th} onPress={onAddAnn} iconName="add-circle" full>Novo aviso</Btn>
        {cls.announcements.length === 0 ? (
          <Empty th={th} icon="🔔" title="Nenhum aviso" cta="Criar primeiro aviso" onCta={onAddAnn}/>
        ) : (
          cls.announcements.map(ann => {
            const pm = PRIORITY_META[ann.priority];
            const exp = isExpired(ann.createdAt);
            return (
              <View key={ann.id} style={[S.itemCard, { backgroundColor: th.card, borderColor: th.border,
                borderLeftColor: pm.dot, opacity: exp ? 0.6 : 1 }]}>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                    <Badge color={pm.text} bg={pm.bg}>{pm.label}</Badge>
                    {exp && <Badge color="#9ca3af" bg="rgba(156,163,175,0.1)">Expirado</Badge>}
                  </View>
                  <Text style={[S.itemTitle, { color: th.fg }]} numberOfLines={2}>{ann.title}</Text>
                  <Text style={[S.itemSub, { color: th.muted }]} numberOfLines={2}>{ann.desc}</Text>
                  <Text style={[S.itemMeta, { color: th.muted }]}>{ann.date} · {ann.authorName}</Text>
                </View>
                <View style={{ gap: 6 }}>
                  <TouchableOpacity onPress={() => onEditAnn(ann.id)} style={[S.iconBtn, { backgroundColor: th.navyLight }]}>
                    <Ionicons name="pencil-outline" size={14} color={th.navy}/>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelAnn(ann.id)} style={[S.iconBtn, { backgroundColor: "rgba(239,68,68,0.1)" }]}>
                    <Ionicons name="trash-outline" size={14} color="#ef4444"/>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>
    );
  }

  // ── ATIVIDADES TAB ──────────────────────────────────────────────────────────
  function TabAtividades() {
    return (
      <View style={{ gap: 10 }}>
        <Btn th={th} onPress={onAddActivity} iconName="add-circle" full>Nova atividade</Btn>
        {cls.activities.length === 0 ? (
          <Empty th={th} icon="📋" title="Nenhuma atividade" cta="Criar primeira atividade" onCta={onAddActivity}/>
        ) : (
          cls.activities.map(act => {
            const am = ACT_META[act.type];
            return (
              <View key={act.id} style={[S.itemCard, { backgroundColor: th.card, borderColor: th.border,
                borderLeftColor: am.color }]}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Badge color={am.color} bg={am.color + "18"}>{am.label}</Badge>
                  <Text style={[S.itemTitle, { color: th.fg }]} numberOfLines={2}>{act.title}</Text>
                  <Text style={[S.itemMeta, { color: th.muted }]}>{act.subject} · {act.dueLabel}</Text>
                </View>
                <View style={{ gap: 6 }}>
                  <TouchableOpacity onPress={() => onEditActivity(act.id)} style={[S.iconBtn, { backgroundColor: th.navyLight }]}>
                    <Ionicons name="pencil-outline" size={14} color={th.navy}/>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelActivity(act.id)} style={[S.iconBtn, { backgroundColor: "rgba(239,68,68,0.1)" }]}>
                    <Ionicons name="trash-outline" size={14} color="#ef4444"/>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>
    );
  }

  // ── MEMBROS TAB ─────────────────────────────────────────────────────────────
  function TabMembros() {
    const byRole: Record<ClassRole, Member[]> = { owner: [], rep: [], student: [] };
    cls.members.forEach(m => byRole[m.classRole].push(m));
    const groups: { role: ClassRole; label: string }[] = [
      { role: "owner",   label: "Criador" },
      { role: "rep",     label: "Representantes" },
      { role: "student", label: `Alunos (${byRole.student.length})` },
    ];
    return (
      <View style={{ gap: 12 }}>
        {groups.map(g => byRole[g.role].length > 0 && (
          <View key={g.role}>
            <SLabel th={th}>{g.label.toUpperCase()}</SLabel>
            {byRole[g.role].map(m => {
              const rm = ROLE_META[m.classRole];
              const isSelf = m.userId === user.id;
              return (
                <TouchableOpacity key={m.id} onPress={() => !isSelf && onViewMember(m)}
                  style={[S.memberRow, { backgroundColor: th.card, borderColor: th.border }]}>
                  <MemberAvatar member={m} th={th}/>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.memberName, { color: th.fg }]}>{m.name}{isSelf ? " (você)" : ""}</Text>
                    <Text style={[S.memberEmail, { color: th.muted }]}>{m.email}</Text>
                  </View>
                  <Badge color={rm.color} bg={rm.bg}>{rm.label}</Badge>
                  {!isSelf && <Ionicons name="chevron-forward" size={14} color={th.muted}/>}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  }

  // ── TURMA TAB ───────────────────────────────────────────────────────────────
  function TabTurma() {
    return (
      <View style={{ gap: 10 }}>
        <View style={[S.infoCard, { backgroundColor: th.card, borderColor: th.border }]}>
          {[
            { label: "Turma",       val: cls.name },
            { label: "Código",      val: cls.code },
            { label: "Curso",       val: cls.course },
            { label: "Instituição", val: cls.institution },
            { label: "Período",     val: cls.period },
            { label: "Modalidade",  val: cls.modality },
          ].map(r => (
            <View key={r.label} style={[S.infoRow, { borderColor: th.border }]}>
              <Text style={[S.infoKey, { color: th.muted }]}>{r.label}</Text>
              <Text style={[S.infoVal, { color: th.fg }]} selectable>{r.val}</Text>
            </View>
          ))}
        </View>
        {isOwner && (
          <Btn th={th} variant="danger" onPress={onDeleteClass} full iconName="trash-outline">
            Excluir turma
          </Btn>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={[S.safe, { backgroundColor: th.bg }]}>
      <View style={[S.header, { backgroundColor: th.headerBg }]}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#fff"/>
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={S.hTitle}>Painel do Rep.</Text>
          <Text style={S.hSub} numberOfLines={1}>{cls.name}</Text>
        </View>
        <View style={[S.roleBadge, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <Ionicons name="shield-checkmark" size={12} color="#fff"/>
          <Text style={S.roleBadgeText}>{myRole === "owner" ? "Criador" : "Rep."}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[S.tabBar, { backgroundColor: th.card, borderColor: th.border }]}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)}
            style={[S.tabBtn, tab === t.key && { borderBottomColor: th.orange, borderBottomWidth: 2 }]}>
            <Ionicons name={t.icon as any} size={15} color={tab === t.key ? th.orange : th.muted}/>
            <Text style={[S.tabLabel, { color: tab === t.key ? th.orange : th.muted,
              fontWeight: tab === t.key ? "700" : "500" }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={S.body}>
        {tab === "avisos"     && <TabAvisos/>}
        {tab === "atividades" && <TabAtividades/>}
        {tab === "membros"    && <TabMembros/>}
        {tab === "turma"      && <TabTurma/>}
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:     { flex: 1 },
  header:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  hTitle:   { fontSize: 16, fontWeight: "800", color: "#fff" },
  hSub:     { fontSize: 11, color: "rgba(255,255,255,0.65)" },
  roleBadge:{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20 },
  roleBadgeText:{ fontSize: 11, fontWeight: "700", color: "#fff" },
  tabBar:   { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn:   { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 10 },
  tabLabel: { fontSize: 11 },
  body:     { padding: 16, paddingBottom: 40 },
  itemCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 3, padding: 14,
              flexDirection: "row", gap: 10, alignItems: "flex-start" },
  itemTitle:{ fontSize: 14, fontWeight: "700" },
  itemSub:  { fontSize: 13 },
  itemMeta: { fontSize: 11 },
  iconBtn:  { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  memberRow:{ flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14,
              borderWidth: 1, padding: 12, marginBottom: 6 },
  memberName:{ fontSize: 14, fontWeight: "700" },
  memberEmail:{ fontSize: 12 },
  infoCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  infoRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center",
              padding: 12, borderBottomWidth: 1 },
  infoKey:  { fontSize: 12, fontWeight: "600" },
  infoVal:  { fontSize: 13, fontWeight: "700", maxWidth: "55%", textAlign: "right" },
});
