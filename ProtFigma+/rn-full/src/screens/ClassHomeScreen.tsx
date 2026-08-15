import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge, SkelCard, Empty, AccentCard, SLabel } from "../components/ui";
import FloatingNav from "../components/FloatingNav";
import {
  STATUS_META, ACT_META, PRIORITY_META, isExpired, TODAY_ISO,
} from "../constants";
import type { AppTheme, AppClass, AppUser, Screen, Activity, ActivityStatus } from "../types";

type ActFilter = "todos" | "dever" | "trabalho" | "teste" | "outros";

interface Props {
  cls: AppClass;
  user: AppUser;
  statuses: Record<string, ActivityStatus>;
  readSet: Set<string>;
  onNav: (s: Screen) => void;
  onViewActivity: (id: string) => void;
  onRepPanel: () => void;
  onBack: () => void;
  loading?: boolean;
  th: AppTheme;
}

export default function ClassHomeScreen({
  cls, user, statuses, readSet, onNav, onViewActivity, onRepPanel, onBack, loading, th,
}: Props) {
  const [filter, setFilter] = useState<ActFilter>("todos");
  const [search, setSearch] = useState("");
  const myRole = cls.members.find(m => m.userId === user.id)?.classRole ?? "student";
  const isRep  = myRole === "owner" || myRole === "rep";

  const unread = cls.announcements.filter(a => !readSet.has(a.id) && !isExpired(a.createdAt)).length;
  const filtered: Activity[] = cls.activities.filter(a =>
    (filter === "todos" || a.type === filter) &&
    (!search || a.title.toLowerCase().includes(search.toLowerCase()) || a.subject.toLowerCase().includes(search.toLowerCase()))
  );

  // Upcoming: activities due from today sorted ascending
  const upcoming = cls.activities
    .filter(a => a.dueDate >= TODAY_ISO && (statuses[a.id] ?? "todo") !== "done")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  const FILTERS: { key: ActFilter; label: string }[] = [
    { key: "todos",    label: "Todas" },
    { key: "dever",    label: "Deveres" },
    { key: "trabalho", label: "Trabalhos" },
    { key: "teste",    label: "Provas" },
    { key: "outros",   label: "Outros" },
  ];

  return (
    <SafeAreaView style={[S.safe, { backgroundColor: th.bg }]}>
      {/* Header */}
      <View style={[S.header, { backgroundColor: th.headerBg }]}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color="#fff"/>
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={S.hTitle} numberOfLines={1}>{cls.name}</Text>
          <Text style={S.hSub}>{cls.institution} · {cls.period}</Text>
        </View>
        {isRep && (
          <TouchableOpacity onPress={onRepPanel} style={[S.repBtn, { backgroundColor: th.orange }]}>
            <Ionicons name="shield-checkmark" size={14} color="#fff"/>
            <Text style={S.repBtnText}>Painel</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Announcements */}
        {cls.announcements.filter(a => !isExpired(a.createdAt)).length > 0 && (
          <View style={[S.section, { borderBottomColor: th.border }]}>
            <SLabel th={th} action="Ver todos" onAction={() => onNav("notifications")}>
              AVISOS RECENTES
            </SLabel>
            {loading ? (
              [1, 2].map(i => <SkelCard key={i} th={th}/>)
            ) : (
              cls.announcements.filter(a => !isExpired(a.createdAt)).slice(0, 2).map(ann => {
                const pm = PRIORITY_META[ann.priority];
                const isNew = !readSet.has(ann.id);
                return (
                  <AccentCard key={ann.id} th={th} accent={pm.dot} onPress={() => onNav("notifications")}>
                    <View style={{ padding: 14, gap: 6 }}>
                      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                        {isNew && <View style={[S.newDot, { backgroundColor: th.orange }]}/>}
                        <Text style={[S.annTitle, { color: th.fg, flex: 1 }]} numberOfLines={2}>{ann.title}</Text>
                        <Badge color={pm.text} bg={pm.bg}>{pm.label}</Badge>
                      </View>
                      <Text style={[S.annDesc, { color: th.muted }]} numberOfLines={2}>{ann.desc}</Text>
                      <Text style={[S.annDate, { color: th.muted }]}>{ann.date}</Text>
                    </View>
                  </AccentCard>
                );
              })
            )}
          </View>
        )}

        {/* Upcoming exams */}
        {upcoming.length > 0 && (
          <View style={[S.section, { borderBottomColor: th.border }]}>
            <SLabel th={th}>PRÓXIMAS ENTREGAS</SLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {upcoming.map(act => {
                const am = ACT_META[act.type];
                const status = statuses[act.id] ?? "todo";
                const sm = STATUS_META[status];
                return (
                  <TouchableOpacity key={act.id} onPress={() => onViewActivity(act.id)}
                    style={[S.upCard, { backgroundColor: th.card, borderColor: am.color + "40" }]}>
                    <Text style={{ fontSize: 20 }}>{am.emoji}</Text>
                    <Text style={[S.upLabel, { color: am.color }]}>{am.label}</Text>
                    <Text style={[S.upTitle, { color: th.fg }]} numberOfLines={2}>{act.title}</Text>
                    <Text style={[S.upSubject, { color: th.muted }]}>{act.subject}</Text>
                    <View style={[S.upDue, { backgroundColor: sm.bg }]}>
                      <Text style={[S.upDueText, { color: sm.color }]}>{act.dueLabel}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Activity list */}
        <View style={S.section}>
          <SLabel th={th}>ATIVIDADES</SLabel>
          {/* Search */}
          <View style={[S.searchWrap, { backgroundColor: th.inputBg, borderColor: th.border }]}>
            <Ionicons name="search-outline" size={16} color={th.muted}/>
            <TextInput value={search} onChangeText={setSearch} placeholder="Buscar atividade..."
              placeholderTextColor={th.muted}
              style={[S.searchInput, { color: th.fg }]}/>
            {search ? (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color={th.muted}/>
              </TouchableOpacity>
            ) : null}
          </View>
          {/* Filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            {FILTERS.map(f => (
              <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)}
                style={[S.chip, {
                  backgroundColor: filter === f.key ? th.orange : th.card,
                  borderColor: filter === f.key ? th.orange : th.border,
                }]}>
                <Text style={[S.chipText, { color: filter === f.key ? "#fff" : th.muted,
                  fontWeight: filter === f.key ? "700" : "500" }]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading ? (
            [1, 2, 3].map(i => <SkelCard key={i} th={th}/>)
          ) : filtered.length === 0 ? (
            <Empty th={th} icon="📋" title="Nenhuma atividade" sub="Ajuste os filtros ou aguarde novos cadastros"/>
          ) : (
            filtered.map(act => {
              const am = ACT_META[act.type];
              const status = statuses[act.id] ?? "todo";
              const sm = STATUS_META[status];
              return (
                <TouchableOpacity key={act.id} onPress={() => onViewActivity(act.id)}
                  style={[S.actCard, { backgroundColor: th.card, borderColor: th.border, borderLeftColor: am.color }]}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <Text style={{ fontSize: 14 }}>{am.emoji}</Text>
                      <Text style={[S.actTitle, { color: th.fg }]} numberOfLines={2}>{act.title}</Text>
                    </View>
                    <Text style={[S.actSubject, { color: th.muted }]}>{act.subject}</Text>
                    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                      <Badge color={am.color} bg={am.color + "18"}>{am.label}</Badge>
                      <View style={[S.dueBadge, { backgroundColor: sm.bg }]}>
                        <Ionicons name="calendar-outline" size={10} color={sm.color}/>
                        <Text style={[S.dueBadgeText, { color: sm.color }]}>{act.dueLabel}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <Badge color={sm.color} bg={sm.bg}>{sm.label}</Badge>
                    <Ionicons name="chevron-forward" size={14} color={th.muted}/>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <FloatingNav current="classHome" onNav={onNav} th={th} unread={unread}/>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1 },
  header:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14,
             gap: 4 },
  hTitle:  { fontSize: 16, fontWeight: "800", color: "#fff" },
  hSub:    { fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 1 },
  repBtn:  { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 7,
             paddingHorizontal: 12, borderRadius: 20 },
  repBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  section: { paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1 },
  newDot:  { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
  annTitle:{ fontSize: 14, fontWeight: "700", lineHeight: 20 },
  annDesc: { fontSize: 13, lineHeight: 18 },
  annDate: { fontSize: 11 },
  upCard:  { width: 140, borderRadius: 14, borderWidth: 1.5, padding: 12, gap: 4 },
  upLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  upTitle: { fontSize: 13, fontWeight: "700" },
  upSubject:{ fontSize: 11 },
  upDue:   { borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8, alignSelf: "flex-start", marginTop: 4 },
  upDueText:{ fontSize: 11, fontWeight: "700" },
  searchWrap:{ flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1,
              borderRadius: 12, paddingHorizontal: 12, height: 40, marginBottom: 10 },
  searchInput:{ flex: 1, fontSize: 14 },
  chip:    { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5 },
  chipText:{ fontSize: 13 },
  actCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 3, padding: 14,
             flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 8,
             shadowColor: "#0e2f5a", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  actTitle:{ fontSize: 14, fontWeight: "700", flex: 1, lineHeight: 20 },
  actSubject:{ fontSize: 12 },
  dueBadge:{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 2,
             paddingHorizontal: 7, borderRadius: 20 },
  dueBadgeText:{ fontSize: 11, fontWeight: "600" },
});
