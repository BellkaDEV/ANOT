import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Screen, AppTheme } from "../types";

type NavTab = { key: Screen; label: string; icon: string; activeIcon: string };

const TABS: NavTab[] = [
  { key: "classHome",     label: "Início",     icon: "home-outline",         activeIcon: "home" },
  { key: "events",        label: "Calendário", icon: "calendar-outline",     activeIcon: "calendar" },
  { key: "notifications", label: "Avisos",     icon: "notifications-outline",activeIcon: "notifications" },
  { key: "profile",       label: "Perfil",     icon: "person-outline",       activeIcon: "person" },
];

interface Props {
  current: Screen;
  onNav: (s: Screen) => void;
  th: AppTheme;
  unread?: number;
}

export default function FloatingNav({ current, onNav, th, unread = 0 }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[S.shell, { bottom: Math.max(insets.bottom, 12) + 4 }]}>
      <View style={[S.pill, { backgroundColor: th.card,
        shadowColor: th.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 20, elevation: 12 }]}>
        {TABS.map(t => {
          const active = current === t.key;
          return (
            <TouchableOpacity key={t.key} onPress={() => onNav(t.key)}
              activeOpacity={0.75} style={S.tab}>
              <View style={{ position: "relative" }}>
                <Ionicons
                  name={(active ? t.activeIcon : t.icon) as any}
                  size={22}
                  color={active ? th.orange : th.muted}/>
                {t.key === "notifications" && unread > 0 && (
                  <View style={S.dot}>
                    <Text style={S.dotText}>{unread > 9 ? "9+" : String(unread)}</Text>
                  </View>
                )}
              </View>
              <Text style={[S.label, { color: active ? th.orange : th.muted, fontWeight: active ? "700" : "500" }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  shell: { position: "absolute", left: 20, right: 20, alignItems: "center" },
  pill:  { flexDirection: "row", borderRadius: 28, paddingVertical: 10, paddingHorizontal: 6, width: "100%" },
  tab:   { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  label: { fontSize: 10, letterSpacing: 0.2 },
  dot:   { position: "absolute", top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 8,
           backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center", paddingHorizontal: 3,
           borderWidth: 1.5, borderColor: "#fff" },
  dotText: { fontSize: 9, fontWeight: "800", color: "#fff" },
});
