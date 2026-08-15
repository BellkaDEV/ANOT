import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Btn, FInput, FTextarea } from "../components/ui";
import { PRIORITY_META } from "../constants";
import type { AppTheme, Announcement, Priority } from "../types";

interface Props {
  existing?: Announcement;
  onSave: (data: Omit<Announcement, "id" | "authorId" | "authorName" | "date" | "createdAt">) => void;
  onDelete?: () => void;
  onBack: () => void;
  th: AppTheme;
}

const PRIORITIES: Priority[] = ["alta", "media", "baixa"];

export default function AnnouncementFormScreen({ existing, onSave, onDelete, onBack, th }: Props) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [desc, setDesc] = useState(existing?.desc ?? "");
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? "media");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Título do aviso é obrigatório";
    if (!desc.trim()) e.desc = "Descrição é obrigatória";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSave({
        title: title.trim(),
        desc: desc.trim(),
        priority,
      });
    }, 400);
  }

  return (
    <View style={[S.safe, { backgroundColor: th.bg }]}>
      <View style={[S.header, { backgroundColor: th.headerBg, paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#fff"/>
        </TouchableOpacity>
        <Text style={S.hTitle}>{existing ? "Editar aviso" : "Novo aviso"}</Text>
        {existing && onDelete ? (
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="trash-outline" size={20} color="#ef9090"/>
          </TouchableOpacity>
        ) : <View style={{ width: 22 }}/>}
      </View>

      <ScrollView contentContainerStyle={S.body} keyboardShouldPersistTaps="handled">
        <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
          <FInput th={th} label="Título do Aviso *" value={title} onChange={setTitle}
            placeholder="Ex.: Prova de Cálculo II — Remarcada" leftIcon="notifications-outline"
            error={errors.title} maxLen={80}/>

          {/* Priority picker */}
          <View style={{ gap: 8 }}>
            <Text style={[S.label, { color: th.muted }]}>PRIORIDADE</Text>
            <View style={S.prioRow}>
              {PRIORITIES.map(p => {
                const pm = PRIORITY_META[p];
                const active = p === priority;
                return (
                  <TouchableOpacity key={p} onPress={() => setPriority(p)}
                    style={[S.prioChip, { borderColor: active ? pm.dot : th.border,
                      backgroundColor: active ? pm.bg : "transparent" }]}>
                    <View style={[S.prioDot, { backgroundColor: pm.dot }]}/>
                    <Text style={[S.prioLabel, { color: active ? pm.text : th.muted,
                      fontWeight: active ? "700" : "500" }]}>{pm.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <FTextarea th={th} label="Descrição do Aviso *" value={desc} onChange={setDesc}
            placeholder="Escreva os detalhes importantes aqui..." rows={5} maxLen={500}/>
        </View>

        <View style={{ paddingHorizontal: 0, gap: 10 }}>
          <Btn th={th} onPress={submit} full loading={loading}
            iconName={existing ? "checkmark-circle" : "add-circle"}>
            {existing ? "Salvar alterações" : "Publicar aviso"}
          </Btn>
          <Btn th={th} variant="secondary" onPress={onBack} full>Cancelar</Btn>
        </View>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14 },
  hTitle: { fontSize: 17, fontWeight: "700", color: "#fff", flex: 1, textAlign: "center" },
  body: { padding: 16, gap: 14, paddingBottom: 40 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 16 },
  label: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  prioRow: { flexDirection: "row", gap: 8 },
  prioChip: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  prioDot: { width: 8, height: 8, borderRadius: 4 },
  prioLabel: { fontSize: 13 },
});
