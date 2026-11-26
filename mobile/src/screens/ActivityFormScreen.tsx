import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppIcon from "../components/AppIcon";
import KeyboardAwareScreen from "../components/KeyboardAwareScreen";
import DateField from "../components/DateField";
import TimeField from "../components/TimeField";
import { Btn, FInput, FTextarea } from "../components/ui";
import { ACT_META, TODAY_ISO, fmtDueLabel } from "../constants";
import type { AppTheme, Activity, ActivityType, AssessmentFormat } from "../types";

interface Props {
  existing?: Activity;
  onSave: (data: Omit<Activity, "id" | "createdById" | "createdByName">) => void;
  onDelete?: () => void;
  onBack: () => void;
  th: AppTheme;
}

const TYPES: ActivityType[] = ["dever", "trabalho", "teste", "outros"];

const ASSESSMENT_FORMATS: { key: AssessmentFormat; label: string }[] = [
  { key: "fechada", label: "Fechada" },
  { key: "aberta", label: "Aberta" },
  { key: "mista", label: "Mista" },
  { key: "nao_informado", label: "Não informado" },
];

export default function ActivityFormScreen({ existing, onSave, onDelete, onBack, th }: Props) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [subject, setSubject] = useState(existing?.subject ?? "");
  const [type, setType] = useState<ActivityType>(existing?.type ?? "dever");

  // Campos de Teste / Prova
  const [assessmentFormat, setAssessmentFormat] = useState<AssessmentFormat>(existing?.assessmentFormat ?? "nao_informado");
  const [hasPoints, setHasPoints] = useState<boolean>(existing?.pointsValue !== null && existing?.pointsValue !== undefined);
  const [pointsValue, setPointsValue] = useState<string>(existing?.pointsValue !== null && existing?.pointsValue !== undefined ? String(existing.pointsValue) : "10");

  const [dueDate, setDueDate] = useState(existing?.dueDate ?? TODAY_ISO);
  const [dueTime, setDueTime] = useState(existing?.dueTime ?? "");
  const [desc, setDesc] = useState(existing?.description ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Título obrigatório";
    if (!subject.trim()) e.subject = "Matéria obrigatória";
    if (!dueDate) e.dueDate = "Data de entrega obrigatória";
    if (dueTime.trim() && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(dueTime.trim())) {
      e.dueTime = "Horário inválido. Use o formato HH:MM (ex.: 14:00)";
    }

    if (type === "teste" && hasPoints) {
      const pts = parseFloat(pointsValue.replace(",", "."));
      if (isNaN(pts) || pts < 0) {
        e.pointsValue = "Informe um valor numérico válido";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;

    let finalAssessmentFormat: AssessmentFormat | undefined = undefined;
    let finalPointsValue: number | undefined = undefined;

    if (type === "teste") {
      finalAssessmentFormat = assessmentFormat;
      finalPointsValue = hasPoints ? parseFloat(pointsValue.replace(",", ".")) : undefined;
    }

    onSave({
      title: title.trim(),
      subject: subject.trim(),
      type,
      assessmentFormat: finalAssessmentFormat,
      pointsValue: finalPointsValue,
      dueDate,
      dueTime: dueTime || undefined,
      dueLabel: fmtDueLabel(dueDate),
      description: desc.trim() || undefined,
    });
  }

  const header = (
    <View style={[S.header, { backgroundColor: th.headerBg, paddingTop: Math.max(insets.top, 12) + 6 }]}>
      <TouchableOpacity
        onPress={onBack}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        accessibilityHint="Toque para voltar à tela anterior"
      >
        <AppIcon name="arrow-back" size={22} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={S.hTitle}>{existing ? "Editar atividade" : "Nova atividade"}</Text>
      {existing && onDelete ? (
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Excluir atividade"
          accessibilityHint="Toque para excluir esta atividade"
        >
          <AppIcon name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 22 }} />
      )}
    </View>
  );

  return (
    <KeyboardAwareScreen header={header} th={th} contentContainerStyle={S.body}>
      <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
        <FInput
          th={th}
          label="Título *"
          value={title}
          onChange={setTitle}
          placeholder="Ex.: Lista de Exercícios — Cálculo II"
          leftIcon="document-text-outline"
          error={errors.title}
          maxLen={80}
        />

        <FInput
          th={th}
          label="Matéria / Disciplina *"
          value={subject}
          onChange={setSubject}
          placeholder="Ex.: Cálculo II"
          leftIcon="book-outline"
          error={errors.subject}
        />

        {/* Type picker */}
        <View style={{ gap: 8 }}>
          <Text style={[S.label, { color: th.muted }]} accessibilityRole="header">TIPO</Text>
          <View style={S.typeRow}>
            {TYPES.map((t) => {
              const am = ACT_META[t];
              const active = t === type;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  style={[
                    S.typeChip,
                    {
                      borderColor: active ? am.color : th.border,
                      backgroundColor: active ? am.color + "18" : "transparent",
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Tipo: ${am.label}`}
                  accessibilityState={{ selected: active }}
                  accessibilityHint={`Toque para definir o tipo como ${am.label}`}
                >
                  <View importantForAccessibility="no">
                    <AppIcon name={am.icon} size={16} color={active ? am.color : th.muted} />
                  </View>
                  <Text
                    style={[
                      S.typeLabel,
                      {
                        color: active ? am.color : th.muted,
                        fontWeight: active ? "700" : "500",
                      },
                    ]}
                  >
                    {am.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Configurações de Teste / Prova */}
        {type === "teste" && (
          <View style={[S.subBox, { backgroundColor: th.card2, borderColor: th.border }]}>
            <Text style={[S.label, { color: th.fg }]} accessibilityRole="header">FORMATO DA AVALIAÇÃO</Text>
            <View style={S.typeRow}>
              {ASSESSMENT_FORMATS.map((fmt) => {
                const active = assessmentFormat === fmt.key;
                return (
                  <TouchableOpacity
                    key={fmt.key}
                    onPress={() => setAssessmentFormat(fmt.key)}
                    style={[
                      S.optChipSmall,
                      {
                        borderColor: active ? th.navy : th.border,
                        backgroundColor: active ? th.navyLight : th.card,
                      },
                    ]}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Formato: ${fmt.label}`}
                    accessibilityState={{ selected: active }}
                    accessibilityHint={`Toque para selecionar o formato ${fmt.label}`}
                  >
                    <Text style={[S.optText, { color: active ? th.navy : th.fg, fontWeight: active ? "700" : "500" }]}>
                      {fmt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[S.label, { color: th.fg, marginTop: 12 }]} accessibilityRole="header">VALOR EM PONTOS</Text>
            <View style={S.typeRow}>
              <TouchableOpacity
                onPress={() => setHasPoints(false)}
                style={[
                  S.optChip,
                  {
                    borderColor: !hasPoints ? th.orange : th.border,
                    backgroundColor: !hasPoints ? th.orangeLight : th.card,
                  },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Pontuação não informada"
                accessibilityState={{ selected: !hasPoints }}
                accessibilityHint="Toque para não definir valor em pontos"
              >
                <Text style={[S.optText, { color: !hasPoints ? th.orange : th.fg }]}>Não informado</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setHasPoints(true)}
                style={[
                  S.optChip,
                  {
                    borderColor: hasPoints ? th.orange : th.border,
                    backgroundColor: hasPoints ? th.orangeLight : th.card,
                  },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Pontuação definida"
                accessibilityState={{ selected: hasPoints }}
                accessibilityHint="Toque para definir um valor em pontos para a avaliação"
              >
                <Text style={[S.optText, { color: hasPoints ? th.orange : th.fg }]}>Pontuação definida</Text>
              </TouchableOpacity>
            </View>

            {hasPoints && (
              <FInput
                th={th}
                label="Valor da nota (Ex: 10.0)"
                value={pointsValue}
                onChange={setPointsValue}
                placeholder="10.0"
                leftIcon="calculator-outline"
                keyboardType="numeric"
                error={errors.pointsValue}
              />
            )}
          </View>
        )}

        {/* Data de entrega via DateField */}
        <DateField
          label="DATA DE ENTREGA *"
          value={dueDate}
          onChange={setDueDate}
          error={errors.dueDate}
          th={th}
        />

        {/* Horário via TimeField */}
        <TimeField
          label="HORÁRIO DE ENTREGA (OPCIONAL)"
          value={dueTime}
          onChange={setDueTime}
          error={errors.dueTime}
          th={th}
        />

        <FTextarea
          th={th}
          label="Instruções / Descrição (opcional)"
          value={desc}
          onChange={setDesc}
          placeholder="Capítulos cobrados, links para envio..."
          maxLen={500}
          rows={4}
        />

        <Btn th={th} onPress={submit} full iconName="checkmark-circle-outline">
          {existing ? "Salvar alterações" : "Criar atividade"}
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
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  hTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  body: { padding: 20, paddingBottom: 40 },
  card: { borderRadius: 16, borderWidth: 1, padding: 20, gap: 18 },
  label: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  typeLabel: { fontSize: 13 },
  subBox: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  optChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  optChipSmall: {
    paddingHorizontal: 10,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1.5,
  },
  optText: { fontSize: 13, fontWeight: "600" },
});
