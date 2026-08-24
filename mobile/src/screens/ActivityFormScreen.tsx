import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Btn, FInput, FTextarea } from "../components/ui";
import { ACT_META, QUICK_DATES, addDays, TODAY_ISO, fmtDueLabel } from "../constants";
import type { AppTheme, Activity, ActivityType } from "../types";

interface Props {
  existing?: Activity;
  onSave: (data: Omit<Activity, "id" | "createdById" | "createdByName">) => void;
  onDelete?: () => void;
  onBack: () => void;
  th: AppTheme;
}

const TYPES: ActivityType[] = ["dever", "trabalho", "teste", "outros"];

export default function ActivityFormScreen({ existing, onSave, onDelete, onBack, th }: Props) {
  const insets = useSafeAreaInsets();
  const [title,    setTitle]    = useState(existing?.title    ?? "");
  const [subject,  setSubject]  = useState(existing?.subject  ?? "");
  const [type,     setType]     = useState<ActivityType>(existing?.type ?? "dever");
  const [dueDate,  setDueDate]  = useState(existing?.dueDate  ?? "");
  const [dueTime,  setDueTime]  = useState(existing?.dueTime  ?? "");
  const [desc,     setDesc]     = useState(existing?.description ?? "");
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim())   e.title   = "Título obrigatório";
    if (!subject.trim()) e.subject = "Matéria obrigatória";
    if (!dueDate)        e.dueDate = "Data de entrega obrigatória";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    onSave({
      title: title.trim(), subject: subject.trim(), type, dueDate,
      dueTime: dueTime || undefined, dueLabel: fmtDueLabel(dueDate),
      description: desc.trim() || undefined,
    });
  }

  return (
    <View style={[S.safe, { backgroundColor: th.bg }]}>
      <View style={[S.header, { backgroundColor: th.headerBg, paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#fff"/>
        </TouchableOpacity>
        <Text style={S.hTitle}>{existing ? "Editar atividade" : "Nova atividade"}</Text>
        {existing && onDelete ? (
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="trash-outline" size={20} color="#ef9090"/>
          </TouchableOpacity>
        ) : <View style={{ width: 22 }}/>}
      </View>

      <ScrollView contentContainerStyle={S.body} keyboardShouldPersistTaps="handled">
        <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
          <FInput th={th} label="Título" value={title} onChange={setTitle}
            placeholder="Ex.: Lista de Exercícios — Cálculo II" leftIcon="document-text-outline"
            error={errors.title} maxLen={80}/>

          <FInput th={th} label="Matéria / Disciplina" value={subject} onChange={setSubject}
            placeholder="Ex.: Cálculo II" leftIcon="book-outline" error={errors.subject}/>

          {/* Type picker */}
          <View style={{ gap: 8 }}>
            <Text style={[S.label, { color: th.muted }]}>TIPO</Text>
            <View style={S.typeRow}>
              {TYPES.map(t => {
                const am = ACT_META[t];
                const active = t === type;
                return (
                  <TouchableOpacity key={t} onPress={() => setType(t)}
                    style={[S.typeChip, { borderColor: active ? am.color : th.border,
                      backgroundColor: active ? am.color + "18" : "transparent" }]}>
                    <Ionicons name={am.icon as any} size={16} color={active ? am.color : th.muted}/>
                    <Text style={[S.typeLabel, { color: active ? am.color : th.muted,
                      fontWeight: active ? "700" : "500" }]}>{am.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Due date */}
          <View style={{ gap: 8 }}>
            <Text style={[S.label, { color: th.muted }]}>DATA DE ENTREGA</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {QUICK_DATES.map(qd => {
                const d = addDays(TODAY_ISO, qd.offset);
                const active = d === dueDate;
                return (
                  <TouchableOpacity key={qd.label} onPress={() => setDueDate(d)}
                    style={[S.quickChip, { borderColor: active ? th.orange : th.border,
                      backgroundColor: active ? th.orangeLight : "transparent" }]}>
                    <Text style={[S.quickText, { color: active ? th.orange : th.muted,
                      fontWeight: active ? "700" : "500" }]}>{qd.label}</Text>
                    <Text style={[S.quickDate, { color: active ? th.orange : th.muted }]}>{fmtDueLabel(d)}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <FInput th={th} label="" value={dueDate} onChange={setDueDate}
              placeholder="AAAA-MM-DD" leftIcon="calendar-outline" error={errors.dueDate}
              hint="Formato: 2026-05-28"/>
          </View>

          <FInput th={th} label="Horário (opcional)" value={dueTime} onChange={setDueTime}
            placeholder="Ex.: 23:59" leftIcon="time-outline" hint="Formato: HH:MM"/>

          <FTextarea th={th} label="Descrição (opcional)" value={desc} onChange={setDesc}
            placeholder="Adicione detalhes, links, instruções..." rows={4} maxLen={500}/>
        </View>

        <View style={{ paddingHorizontal: 0, gap: 10 }}>
          <Btn th={th} onPress={submit} full loading={loading}
            iconName={existing ? "checkmark-circle" : "add-circle"}>
            {existing ? "Salvar alterações" : "Criar atividade"}
          </Btn>
          <Btn th={th} variant="secondary" onPress={onBack} full>Cancelar</Btn>
        </View>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  safe:     { flex: 1 },
  header:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
              paddingHorizontal: 20, paddingVertical: 14 },
  hTitle:   { fontSize: 17, fontWeight: "700", color: "#fff", flex: 1, textAlign: "center" },
  body:     { padding: 16, gap: 14, paddingBottom: 40 },
  card:     { borderRadius: 20, borderWidth: 1, padding: 20, gap: 16 },
  label:    { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  typeRow:  { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8,
              paddingHorizontal: 12, borderRadius: 10, borderWidth: 1.5 },
  typeLabel:{ fontSize: 12 },
  quickChip:{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1.5,
              alignItems: "center" },
  quickText:{ fontSize: 12 },
  quickDate:{ fontSize: 11 },
});
