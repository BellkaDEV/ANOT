import React, { useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MemberAvatar, Btn, Badge } from "./ui";
import { ROLE_META } from "../constants";
import type { AppTheme, Member, ClassRole } from "../types";

interface Props {
  member: Member | null;
  visible: boolean;
  onClose: () => void;
  onPromote: (id: string) => void;
  onDemote: (id: string) => void;
  onExpel: (id: string) => void;
  myRole: ClassRole;
  th: AppTheme;
}

export default function MemberSheet({
  member, visible, onClose, onPromote, onDemote, onExpel, myRole, th,
}: Props) {
  const slide = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 160 }).start();
    } else {
      Animated.timing(slide, { toValue: 300, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible, slide]);

  if (!member) return null;
  const rm = ROLE_META[member.classRole];
  const canPromote = myRole === "owner" && member.classRole === "student";
  const canDemote  = myRole === "owner" && member.classRole === "rep";
  const canExpel   = myRole === "owner" && member.classRole !== "owner";

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={S.backdrop}/>
      </TouchableWithoutFeedback>
      <Animated.View style={[S.sheet, { backgroundColor: th.card, transform: [{ translateY: slide }] }]}>
        {/* Handle */}
        <View style={[S.handle, { backgroundColor: th.border }]}/>

        {/* Member info */}
        <View style={S.header}>
          <MemberAvatar member={member} size={52} th={th}/>
          <View style={{ flex: 1 }}>
            <Text style={[S.name, { color: th.fg }]}>{member.name}</Text>
            <Text style={[S.email, { color: th.muted }]}>{member.email}</Text>
          </View>
          <Badge color={rm.color} bg={rm.bg}>{rm.label}</Badge>
        </View>

        <View style={[S.divider, { backgroundColor: th.border }]}/>

        <View style={{ gap: 8 }}>
          {canPromote && (
            <Btn th={th} variant="secondary" onPress={() => { onPromote(member.id); onClose(); }}
              iconName="arrow-up-circle-outline" full>
              Promover a Representante
            </Btn>
          )}
          {canDemote && (
            <Btn th={th} variant="secondary" onPress={() => { onDemote(member.id); onClose(); }}
              iconName="arrow-down-circle-outline" full>
              Rebaixar para Aluno
            </Btn>
          )}
          {canExpel && (
            <Btn th={th} variant="danger" onPress={() => { onExpel(member.id); onClose(); }}
              iconName="person-remove-outline" full>
              Remover da turma
            </Btn>
          )}
          <Btn th={th} variant="ghost" onPress={onClose} full>Fechar</Btn>
        </View>
      </Animated.View>
    </Modal>
  );
}

const S = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet:    { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, gap: 14,
              shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 20 },
  handle:   { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  header:   { flexDirection: "row", alignItems: "center", gap: 12 },
  name:     { fontSize: 16, fontWeight: "800" },
  email:    { fontSize: 13 },
  divider:  { height: 1 },
});
