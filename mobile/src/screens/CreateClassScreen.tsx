import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppIcon from "../components/AppIcon";
import { Btn, FInput } from "../components/ui";
import type { AppTheme, Modality } from "../types";

interface Props {
  onSubmit: (data: { name: string; course: string; institution: string; period: string; modality: Modality }) => void;
  onBack: () => void;
  loading?: boolean;
  th: AppTheme;
}

const MODALITIES: { key: Modality; label: string; icon: string }[] = [
  { key: "presencial", label: "Presencial", icon: "school-outline" },
  { key: "ead", label: "EAD", icon: "desktop-outline" },
  { key: "hibrido", label: "Híbrido", icon: "git-merge-outline" },
];

export default function CreateClassScreen({ onSubmit, onBack, loading = false, th }: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [inst, setInst] = useState("");
  const [period, setPeriod] = useState("");
  const [modality, setModality] = useState<Modality>("presencial");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Nome da turma obrigatório";
    if (!course.trim()) e.course = "Curso obrigatório";
    if (!inst.trim()) e.inst = "Instituição obrigatória";
    if (!period.trim()) e.period = "Período obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    onSubmit({
      name: name.trim(),
      course: course.trim(),
      institution: inst.trim(),
      period: period.trim(),
      modality,
    });
  }

  return (
    <View style={[S.safe, { backgroundColor: th.bg }]}>
      <View style={[S.header, { backgroundColor: th.headerBg, paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={S.backBtn}
          accessibilityLabel="Voltar"
        >
          <AppIcon name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={S.hTitle}>Nova turma</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={S.body} keyboardShouldPersistTaps="handled">
        <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
          <View style={S.cardTop}>
            <View style={[S.iconWrap, { backgroundColor: th.orangeLight }]}>
              <AppIcon name="add-circle-outline" size={22} color={th.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.cardTitle, { color: th.fg }]}>Criar turma</Text>
              <Text style={[S.cardSub, { color: th.muted }]}>Você será o representante</Text>
            </View>
          </View>

          <View style={{ gap: 16 }}>
            <FInput
              th={th}
              label="Nome da turma"
              value={name}
              onChange={setName}
              placeholder="Ex.: Engenharia Civil — Turma A"
              leftIcon="book-outline"
              error={errors.name}
              maxLen={80}
            />
            <FInput
              th={th}
              label="Curso"
              value={course}
              onChange={setCourse}
              placeholder="Ex.: Engenharia Civil"
              leftIcon="school-outline"
              error={errors.course}
            />
            <FInput
              th={th}
              label="Instituição"
              value={inst}
              onChange={setInst}
              placeholder="Ex.: Universidade Federal do Brasil"
              leftIcon="business-outline"
              error={errors.inst}
            />
            <FInput
              th={th}
              label="Período"
              value={period}
              onChange={setPeriod}
              placeholder="Ex.: 2025.1"
              leftIcon="calendar-outline"
              error={errors.period}
            />

            <View style={{ gap: 8 }}>
              <Text style={[S.mLabel, { color: th.muted }]}>MODALIDADE</Text>
              <View style={S.mRow}>
                {MODALITIES.map((m) => (
                  <TouchableOpacity
                    key={m.key}
                    onPress={() => setModality(m.key)}
                    style={[
                      S.mChip,
                      {
                        borderColor: modality === m.key ? th.orange : th.border,
                        backgroundColor: modality === m.key ? th.orangeLight : th.card2,
                      },
                    ]}
                  >
                    <AppIcon name={m.icon} size={14} color={modality === m.key ? th.orange : th.muted} />
                    <Text
                      style={[
                        S.mChipText,
                        {
                          color: modality === m.key ? th.orange : th.muted,
                          fontWeight: modality === m.key ? "700" : "500",
                        },
                      ]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          <Btn th={th} onPress={submit} full loading={loading} iconName="checkmark-circle-outline">
            Criar turma
          </Btn>
        </View>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  hTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  body: { padding: 20, paddingBottom: 40 },
  card: {
    borderRadius: 16, // 16px standard for cards
    borderWidth: 1,
    padding: 20,
    gap: 18,
    shadowColor: "#0e2f5a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconWrap: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 18, fontWeight: "800" },
  cardSub: { fontSize: 13 },
  mLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  mRow: { flexDirection: "row", gap: 8 },
  mChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44, // min touch target
    borderRadius: 12, // 12px for controls
    borderWidth: 1.5,
  },
  mChipText: { fontSize: 13 },
});
