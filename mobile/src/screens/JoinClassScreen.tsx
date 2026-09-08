import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppIcon from "../components/AppIcon";
import KeyboardAwareScreen from "../components/KeyboardAwareScreen";
import { Btn, FInput } from "../components/ui";
import type { AppTheme } from "../types";

interface Props {
  onJoin: (code: string) => void;
  onBack: () => void;
  loading?: boolean;
  th: AppTheme;
}

export default function JoinClassScreen({ onJoin, onBack, loading = false, th }: Props) {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setError("Código de acesso obrigatório");
      return;
    }
    setError("");
    onJoin(clean);
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
      <Text style={S.hTitle}>Entrar em Turma</Text>
      <View style={{ width: 22 }} />
    </View>
  );

  return (
    <KeyboardAwareScreen header={header} th={th} contentContainerStyle={S.body}>
      <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
        <View style={S.cardTop}>
          <View style={[S.iconWrap, { backgroundColor: th.orangeLight }]}>
            <AppIcon name="key" size={22} color={th.orange} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[S.cardTitle, { color: th.fg }]}>Código de Acesso</Text>
            <Text style={[S.cardSub, { color: th.muted }]}>Peça o código ao representante da turma</Text>
          </View>
        </View>

        <FInput
          th={th}
          label="Código da Turma"
          value={code}
          onChange={(v) => {
            setCode(v.toUpperCase());
            if (error) setError("");
          }}
          placeholder="Ex.: ABC-1234"
          leftIcon="qr-code-outline"
          autoCapitalize="characters"
          error={error}
          hint="Digite o código com ou sem hífen"
        />

        <Btn th={th} onPress={submit} loading={loading} full iconName="enter-outline">
          Entrar na Turma
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
  card: { borderRadius: 20, borderWidth: 1, padding: 24, gap: 20 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 18, fontWeight: "800" },
  cardSub: { fontSize: 13, marginTop: 2 },
});
