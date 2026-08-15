import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Badge, Btn, FTextarea, HDivider } from "../components/ui";
import { STATUS_META, ACT_META } from "../constants";
import type { AppTheme, Activity, ActivityStatus } from "../types";

interface Props {
  activity: Activity;
  status: ActivityStatus;
  notes: string;
  onSaveStatus: (id: string, s: ActivityStatus) => void;
  onSaveNotes: (id: string, n: string) => void;
  onBack: () => void;
  th: AppTheme;
}

export default function ActivityDetailScreen({
  activity, status, notes, onSaveStatus, onSaveNotes, onBack, th,
}: Props) {
  const insets = useSafeAreaInsets();
  const [localNotes, setLocalNotes] = useState(notes);
  const [saved, setSaved] = useState(false);
  const am = ACT_META[activity.type];
  const sm = STATUS_META[status];

  const STATUSES: ActivityStatus[] = ["todo", "in_progress", "done"];

  function saveNotes() {
    onSaveNotes(activity.id, localNotes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <View style={[S.safe, { backgroundColor: th.bg }]}>
      <View style={[S.header, { backgroundColor: th.headerBg, paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#fff"/>
        </TouchableOpacity>
        <Text style={S.hTitle} numberOfLines={1}>{activity.title}</Text>
        <View style={{ width: 22 }}/>
      </View>

      <ScrollView contentContainerStyle={S.body} keyboardShouldPersistTaps="handled">
        {/* Type & Status */}
        <View style={[S.card, { backgroundColor: th.card, borderColor: am.color + "40", borderLeftColor: am.color }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 28 }}>{am.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[S.actTitle, { color: th.fg }]}>{activity.title}</Text>
              <Text style={[S.actSubject, { color: th.muted }]}>{activity.subject}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Badge color={am.color} bg={am.color + "18"}>{am.label}</Badge>
            <Badge color={sm.color} bg={sm.bg}>{sm.label}</Badge>
          </View>
        </View>

        {/* Info grid */}
        <View style={[S.infoCard, { backgroundColor: th.card, borderColor: th.border }]}>
          {[
            { icon: "calendar-outline", label: "Prazo",        val: activity.dueLabel + (activity.dueTime ? ` às ${activity.dueTime}` : "") },
            { icon: "person-outline",   label: "Criado por",   val: activity.createdByName },
          ].map(row => (
            <React.Fragment key={row.label}>
              <View style={S.infoRow}>
                <View style={[S.infoIcon, { backgroundColor: th.navyLight }]}>
                  <Ionicons name={row.icon as any} size={14} color={th.navy}/>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[S.infoLabel, { color: th.muted }]}>{row.label}</Text>
                  <Text style={[S.infoVal, { color: th.fg }]}>{row.val}</Text>
                </View>
              </View>
              <HDivider th={th}/>
            </React.Fragment>
          ))}
          {activity.description && (
            <View style={S.infoRow}>
              <View style={[S.infoIcon, { backgroundColor: th.navyLight }]}>
                <Ionicons name="document-text-outline" size={14} color={th.navy}/>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[S.infoLabel, { color: th.muted }]}>Descrição</Text>
                <Text style={[S.infoVal, { color: th.fg }]}>{activity.description}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Status selector */}
        <View style={[S.statusCard, { backgroundColor: th.card, borderColor: th.border }]}>
          <Text style={[S.sLabel, { color: th.muted }]}>MEU PROGRESSO</Text>
          <View style={{ gap: 8 }}>
            {STATUSES.map(s => {
              const m = STATUS_META[s];
              const active = s === status;
              return (
                <TouchableOpacity key={s} onPress={() => onSaveStatus(activity.id, s)}
                  style={[S.statusRow, { borderColor: active ? m.color : th.border,
                    backgroundColor: active ? m.bg : "transparent" }]}>
                  <View style={[S.statusDot, { backgroundColor: m.color }]}/>
                  <Text style={[S.statusLabel, { color: active ? m.color : th.fg,
                    fontWeight: active ? "700" : "500" }]}>{m.label}</Text>
                  {active && <Ionicons name="checkmark-circle" size={16} color={m.color}/>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notes */}
        <View style={[S.notesCard, { backgroundColor: th.card, borderColor: th.border }]}>
          <Text style={[S.sLabel, { color: th.muted }]}>MINHAS ANOTAÇÕES</Text>
          <FTextarea th={th} value={localNotes} onChange={setLocalNotes}
            placeholder="Anote o que precisa, dúvidas, links..." rows={5} maxLen={500}/>
          <Btn th={th} variant={saved ? "ghost" : "secondary"} onPress={saveNotes}
            iconName={saved ? "checkmark-circle" : "save-outline"}>
            {saved ? "Salvo!" : "Salvar anotações"}
          </Btn>
        </View>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  safe:      { flex: 1 },
  header:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
               paddingHorizontal: 20, paddingVertical: 14 },
  hTitle:    { fontSize: 16, fontWeight: "700", color: "#fff", flex: 1, textAlign: "center" },
  body:      { padding: 16, gap: 14, paddingBottom: 40 },
  card:      { borderRadius: 16, borderWidth: 1, borderLeftWidth: 3, padding: 16, gap: 10 },
  actTitle:  { fontSize: 16, fontWeight: "800", lineHeight: 22 },
  actSubject:{ fontSize: 13 },
  infoCard:  { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  infoRow:   { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  infoIcon:  { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  infoVal:   { fontSize: 14, fontWeight: "600", marginTop: 2 },
  statusCard:{ borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  sLabel:    { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.9 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12,
               borderRadius: 10, borderWidth: 1.5 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel:{ flex: 1, fontSize: 14 },
  notesCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
});
