import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppIcon from "../components/AppIcon";
import KeyboardAwareScreen from "../components/KeyboardAwareScreen";
import { Btn, FInput } from "../components/ui";
import type { AppTheme, Modality } from "../types";

interface Props {
  onSubmit: (data: {
    name: string;
    course: string;
    institution: string;
    period: string;
    modality: Modality;
  }) => void;
  onBack: () => void;
  loading?: boolean;
  th: AppTheme;
}

const MODALITIES: { key: Modality; label: string }[] = [
  { key: "presencial", label: "Presencial" },
  { key: "ead", label: "EAD" },
  { key: "hibrido", label: "Híbrido" },
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

  const header = (
    <View style={[S.header, { backgroundColor: th.headerBg, paddingTop: Math.max(insets.top, 12) + 6 }]}>
      <TouchableOpacity
        onPress={onBack}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={S.backBtn}
        accessibilityLabel="Voltar"
      >
        <AppIcon name="arrow-back" size={22} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={S.hTitle}>Criar Turma</Text>
      <View style={{ width: 22 }} />
    </View>
  );

  return (
    <KeyboardAwareScreen header={header} th={th} contentContainerStyle={S.body}>
      <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
        <View style={S.cardTop}>
          <View style={[S.iconWrap, { backgroundColor: th.orangeLight }]}>
            <AppIcon name="school" size={22} color={th.orange} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[S.cardTitle, { color: th.fg }]}>Dados da Turma</Text>
            <Text style={[S.cardSub, { color: th.muted }]}>Você será o Criador/Representante</Text>
          </View>
        </View>

        <View style={{ gap: 14 }}>
          <FInput
            th={th}
            label="Nome da Turma *"
            value={name}
            onChange={setName}
            placeholder="Ex.: Engenharia de Software 2026.1"
            leftIcon="book-outline"
            error={errors.name}
            maxLen={60}
          />

          <FInput
            th={th}
            label="Curso *"
            value={course}
            onChange={setCourse}
            placeholder="Ex.: Ciência da Computação"
            leftIcon="school-outline"
            error={errors.course}
          />

          <FInput
            th={th}
            label="Instituição *"
            value={inst}
            onChange={setInst}
            placeholder="Ex.: UFRJ / USP / PUC"
            leftIcon="business-outline"
            error={errors.inst}
          />

          <FInput
            th={th}
            label="Período / Semestre *"
            value={period}
            onChange={setPeriod}
            placeholder="Ex.: 2026.1 ou 5º Semestre"
            leftIcon="calendar-outline"
            error={errors.period}
          />

          <View style={{ gap: 8 }}>
            <Text style={[S.label, { color: th.muted }]}>MODALIDADE</Text>
            <View style={S.modalityRow}>
              {MODALITIES.map((m) => {
                const active = m.key === modality;
                return (
                  <TouchableOpacity
                    key={m.key}
                    onPress={() => setModality(m.key)}
                    style={[
                      S.modChip,
                      {
                        borderColor: active ? th.orange : th.border,
                        backgroundColor: active ? th.orangeLight : th.card2,
                      },
                    ]}
                  >
                    <Text style={[S.modText, { color: active ? th.orange : th.muted, fontWeight: active ? "700" : "500" }]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <Btn th={th} onPress={submit} loading={loading} full iconName="checkmark-circle-outline">
          Criar Turma
        </Btn>
      </View>
    </KeyboardAwareScreen>
  );
}

const S = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  hTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  body: { padding: 20, gap: 20 },
  card: { borderRadius: 20, borderWidth: 1, padding: 24, gap: 18 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 18, fontWeight: "800" },
  cardSub: { fontSize: 13, marginTop: 2 },
  label: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  modalityRow: { flexDirection: "row", gap: 8 },
  modChip: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  modText: { fontSize: 13 },
});
