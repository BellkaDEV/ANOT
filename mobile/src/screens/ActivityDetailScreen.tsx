import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppIcon from "../components/AppIcon";
import KeyboardAwareScreen from "../components/KeyboardAwareScreen";
import { Badge, Btn, FTextarea, HDivider } from "../components/ui";
import { STATUS_META, ACT_META } from "../constants";
import type { AppTheme, Activity, ActivityStatus, AppUser, ClassRole } from "../types";

interface Props {
  activity: Activity;
  status: ActivityStatus;
  notes: string;
  user: AppUser;
  myRole: ClassRole;
  onSaveStatus: (id: string, s: ActivityStatus) => void;
  onSaveNotes: (id: string, n: string) => void;
  onBack: () => void;
  th: AppTheme;
}

export default function ActivityDetailScreen({
  activity,
  status,
  notes,
  user,
  myRole,
  onSaveStatus,
  onSaveNotes,
  onBack,
  th,
}: Props) {
  const insets = useSafeAreaInsets();
  const [localNotes, setLocalNotes] = useState(notes);
  const [saved, setSaved] = useState(false);

  const am = ACT_META[activity.type];
  const sm = STATUS_META[status];
  const STATUSES: ActivityStatus[] = ["todo", "in_progress", "done"];

  const formatLabels: Record<string, string> = {
    fechada: "Fechada",
    aberta: "Aberta",
    mista: "Mista",
    nao_informado: "Não informado",
  };

  function saveNotes() {
    onSaveNotes(activity.id, localNotes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
      <Text style={S.hTitle} numberOfLines={1}>{activity.title}</Text>
      <View style={{ width: 22 }} />
    </View>
  );

  return (
    <KeyboardAwareScreen header={header} th={th} contentContainerStyle={S.body}>
      {/* Card Principal */}
      <View style={[S.card, { backgroundColor: th.card, borderColor: am.color + "40", borderLeftColor: am.color }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View importantForAccessibility="no">
            <AppIcon name={am.icon} size={28} color={am.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[S.actTitle, { color: th.fg }]} accessibilityRole="header">{activity.title}</Text>
            <Text style={[S.actSubject, { color: th.muted }]}>{activity.subject}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Badge color={am.color} bg={am.color + "18"}>{am.label}</Badge>
          <Badge color={sm.color} bg={sm.bg}>{sm.label}</Badge>
        </View>
      </View>

      {/* Detalhes de Teste / Prova */}
      {activity.type === "teste" && (
        <View style={[S.infoCard, { backgroundColor: th.card, borderColor: th.border }]}>
          <Text style={[S.sectionTitle, { color: th.muted }]} accessibilityRole="header">INFORMAÇÕES DA AVALIAÇÃO</Text>

          <View style={S.infoRow}>
            <View style={[S.infoIconWrap, { backgroundColor: th.navyLight }]} importantForAccessibility="no">
              <AppIcon name="help-circle-outline" size={16} color={th.navy} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.infoLabel, { color: th.muted }]}>Formato da avaliação</Text>
              <Text style={[S.infoVal, { color: th.fg }]}>
                {formatLabels[activity.assessmentFormat || "nao_informado"]}
              </Text>
            </View>
          </View>

          <HDivider th={th} />

          <View style={S.infoRow}>
            <View style={[S.infoIconWrap, { backgroundColor: th.orangeLight }]} importantForAccessibility="no">
              <AppIcon name="calculator-outline" size={16} color={th.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.infoLabel, { color: th.muted }]}>Valor em pontos</Text>
              <Text style={[S.infoVal, { color: th.fg }]}>
                {activity.pointsValue !== null && activity.pointsValue !== undefined
                  ? `${activity.pointsValue} pontos`
                  : "Valor não informado"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Info grid */}
      <View style={[S.infoCard, { backgroundColor: th.card, borderColor: th.border }]}>
        {[
          { icon: "calendar-outline", label: "Prazo", val: activity.dueLabel + (activity.dueTime ? ` às ${activity.dueTime}` : "") },
          { icon: "person-outline", label: "Criado por", val: activity.createdByName },
        ].map((row, idx) => (
          <React.Fragment key={row.label}>
            <View style={S.infoRow}>
              <View style={[S.infoIconWrap, { backgroundColor: th.navyLight }]} importantForAccessibility="no">
                <AppIcon name={row.icon} size={16} color={th.navy} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[S.infoLabel, { color: th.muted }]}>{row.label}</Text>
                <Text style={[S.infoVal, { color: th.fg }]}>{row.val}</Text>
              </View>
            </View>
            {idx < 1 && <HDivider th={th} />}
          </React.Fragment>
        ))}
      </View>

      {/* Descrição */}
      {Boolean(activity.description) && (
        <View style={[S.infoCard, { backgroundColor: th.card, borderColor: th.border }]}>
          <Text style={[S.sectionTitle, { color: th.muted }]} accessibilityRole="header">INSTRUÇÕES / DESCRIÇÃO</Text>
          <Text style={[S.descText, { color: th.fg }]}>{activity.description}</Text>
        </View>
      )}

      {/* Update progress */}
      <View style={[S.infoCard, { backgroundColor: th.card, borderColor: th.border }]}>
        <Text style={[S.sectionTitle, { color: th.muted }]} accessibilityRole="header">MEU STATUS</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {STATUSES.map((st) => {
            const meta = STATUS_META[st];
            const active = st === status;
            return (
              <TouchableOpacity
                key={st}
                onPress={() => onSaveStatus(activity.id, st)}
                style={[
                  S.stChip,
                  {
                    borderColor: active ? meta.color : th.border,
                    backgroundColor: active ? meta.bg : th.card2,
                  },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Status: ${meta.label}`}
                accessibilityState={{ selected: active }}
                accessibilityHint={`Toque para definir o status como ${meta.label}`}
              >
                <Text style={[S.stText, { color: active ? meta.color : th.muted }]}>{meta.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Notes */}
      <View style={[S.infoCard, { backgroundColor: th.card, borderColor: th.border }]}>
        <Text style={[S.sectionTitle, { color: th.muted }]} accessibilityRole="header">ANOTAÇÕES PESSOAIS</Text>
        <FTextarea
          th={th}
          value={localNotes}
          onChange={setLocalNotes}
          placeholder="Apenas você pode ver estas anotações..."
          rows={3}
          maxLen={500}
        />
        <Btn
          th={th}
          variant="secondary"
          size="sm"
          onPress={saveNotes}
        >
          {saved ? "Salvo ✓" : "Salvar anotações"}
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
  hTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF", flex: 1, textAlign: "center" },
  body: { padding: 20, gap: 16, paddingBottom: 40 },
  card: { borderRadius: 16, borderWidth: 1, borderLeftWidth: 4, padding: 18, gap: 12 },
  actTitle: { fontSize: 18, fontWeight: "800" },
  actSubject: { fontSize: 13, marginTop: 2 },
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 11, fontWeight: "600" },
  infoVal: { fontSize: 14, fontWeight: "700", marginTop: 1 },
  descText: { fontSize: 14, lineHeight: 20 },
  stChip: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stText: { fontSize: 12, fontWeight: "700" },
});
