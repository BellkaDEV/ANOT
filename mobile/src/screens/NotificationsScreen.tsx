import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Badge, Empty } from "../components/ui";
import FloatingNav from "../components/FloatingNav";
import { PRIORITY_META, isExpired } from "../constants";
import type { AppTheme, AppClass, AppUser, Screen, Announcement } from "../types";

interface Props {
  cls: AppClass;
  user: AppUser;
  readSet: Set<string>;
  onMarkRead: (id: string) => void;
  onNav: (s: Screen) => void;
  th: AppTheme;
}

export default function NotificationsScreen({ cls, user, readSet, onMarkRead, onNav, th }: Props) {
  const insets = useSafeAreaInsets();
  const [showExpired, setShowExpired] = useState(false);

  const active  = cls.announcements.filter(a => !isExpired(a.createdAt));
  const expired = cls.announcements.filter(a => isExpired(a.createdAt));
  const shown   = showExpired ? [...active, ...expired] : active;
  const unread  = active.filter(a => !readSet.has(a.id)).length;

  function AnnCard({ ann }: { ann: Announcement }) {
    const pm = PRIORITY_META[ann.priority];
    const exp = isExpired(ann.createdAt);
    const isNew = !readSet.has(ann.id) && !exp;
    return (
      <TouchableOpacity onPress={() => !readSet.has(ann.id) && onMarkRead(ann.id)}
        style={[S.annCard, { backgroundColor: th.card, borderColor: th.border, borderLeftColor: pm.dot,
          opacity: exp ? 0.55 : 1 }]}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
          {isNew && <View style={[S.newDot, { backgroundColor: th.orange }]}/>}
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
              <Text style={[S.annTitle, { color: th.fg, flex: 1 }]} numberOfLines={2}>{ann.title}</Text>
              <Badge color={pm.text} bg={pm.bg}>{pm.label}</Badge>
            </View>
            <Text style={[S.annDesc, { color: th.muted }]}>{ann.desc}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
              <Ionicons name="person-outline" size={11} color={th.muted}/>
              <Text style={[S.annMeta, { color: th.muted }]}>{ann.authorName}</Text>
              <View style={[S.dot, { backgroundColor: th.border }]}/>
              <Text style={[S.annMeta, { color: th.muted }]}>{ann.date}</Text>
              {exp && <Badge color="#9ca3af" bg="rgba(156,163,175,0.1)">Expirado</Badge>}
              {readSet.has(ann.id) && !exp && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="checkmark-done" size={11} color={th.muted}/>
                  <Text style={[S.annMeta, { color: th.muted }]}>Lido</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[S.safe, { backgroundColor: th.bg }]}>
      <View style={[S.header, { backgroundColor: th.headerBg, paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <Text style={S.hTitle}>Avisos</Text>
        {unread > 0 && (
          <View style={S.badge}><Text style={S.badgeText}>{unread} novos</Text></View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={S.body}>
          {shown.length === 0 ? (
            <Empty th={th} icon="notifications-off-outline" title="Nenhum aviso" sub="Fique de olho, novos avisos aparecerão aqui"/>
          ) : (
            shown.map(a => <AnnCard key={a.id} ann={a}/>)
          )}

          {expired.length > 0 && (
            <TouchableOpacity onPress={() => setShowExpired(!showExpired)}
              style={[S.expiredBtn, { borderColor: th.border }]}>
              <Ionicons name={showExpired ? "chevron-up" : "chevron-down"} size={14} color={th.muted}/>
              <Text style={[S.expiredText, { color: th.muted }]}>
                {showExpired ? "Ocultar" : `Mostrar ${expired.length} expirado${expired.length > 1 ? "s" : ""}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <FloatingNav current="notifications" onNav={onNav} th={th} unread={unread}/>
    </View>
  );
}

const S = StyleSheet.create({
  safe:     { flex: 1 },
  header:   { paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  hTitle:   { fontSize: 20, fontWeight: "800", color: "#fff" },
  badge:    { backgroundColor: "#e4822e", paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20 },
  badgeText:{ fontSize: 12, fontWeight: "700", color: "#fff" },
  body:     { padding: 16, gap: 10 },
  annCard:  { borderRadius: 14, borderWidth: 1, borderLeftWidth: 3, padding: 14,
              shadowColor: "#0e2f5a", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  newDot:   { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
  annTitle: { fontSize: 14, fontWeight: "700", lineHeight: 20 },
  annDesc:  { fontSize: 13, lineHeight: 18 },
  annMeta:  { fontSize: 11 },
  dot:      { width: 3, height: 3, borderRadius: 2 },
  expiredBtn:{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
              borderWidth: 1, borderRadius: 10, paddingVertical: 10 },
  expiredText:{ fontSize: 13 },
});
