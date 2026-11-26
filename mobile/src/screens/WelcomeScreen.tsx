import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Btn } from "../components/ui";
import type { AppTheme } from "../types";

interface Props { onLogin: () => void; onRegister: () => void; th: AppTheme }

export default function WelcomeScreen({ onLogin, onRegister, th }: Props) {
  return (
    <SafeAreaView style={[S.safe, { backgroundColor: th.navy }]}>
      <View style={[S.root, { backgroundColor: th.navy }]}>
        {/* Top section */}
        <View style={S.top}>
          <View style={S.logoWrap}>
            <Image
              source={require("../../assets/brand-icon.png")}
              style={S.logoImage}
              resizeMode="cover"
              accessibilityLabel="Ícone do aplicativo ANOT"
            />
          </View>
          <Text style={S.appName}>ANOT</Text>
          <Text style={[S.tagline, { color: "rgba(255,255,255,0.72)" }]}>
            Organize sua turma.{"\n"}Acompanhe seu progresso.
          </Text>
          <View style={S.dots}>
            {["#e4822e","rgba(255,255,255,0.3)","rgba(255,255,255,0.3)"].map((c,i)=>(
              <View key={i} style={[S.dot,{backgroundColor:c,width:i===0?22:6}]}/>
            ))}
          </View>
        </View>

        {/* Bottom card */}
        <View style={[S.card, { backgroundColor: th.card }]}>
          <Text style={[S.cardTitle, { color: th.fg }]}>Bem-vindo ao ANOT</Text>
          <Text style={[S.cardSub, { color: th.muted }]}>
            A plataforma de gestão acadêmica feita para alunos.
          </Text>
          <View style={{ gap: 12, marginTop: 8 }}>
            <Btn th={th} onPress={onLogin} full>Entrar na conta</Btn>
            <Btn th={th} variant="secondary" onPress={onRegister} full>Criar conta grátis</Btn>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1 },
  root:    { flex: 1, justifyContent: "space-between", paddingBottom: 0 },
  top:     { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 16 },
  logoWrap:{ width: 88, height: 88, borderRadius: 26, overflow: "hidden", alignItems: "center", justifyContent: "center",
             borderWidth: 1.5, borderColor: "rgba(255,255,255,0.22)",
             shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  logoImage: { width: "100%", height: "100%" },
  appName: { fontSize: 40, fontWeight: "900", color: "#fff", letterSpacing: 2 },
  tagline: { fontSize: 17, textAlign: "center", lineHeight: 26 },
  dots:    { flexDirection: "row", gap: 6, marginTop: 8 },
  dot:     { height: 6, borderRadius: 3 },
  card:    { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: 40, gap: 4,
             shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 10 },
  cardTitle: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  cardSub:   { fontSize: 14, lineHeight: 21, marginBottom: 12 },
});
