import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ToastItem } from "../types";

interface Props { toasts: ToastItem[] }

const ICONS = { success: "checkmark-circle", error: "close-circle", info: "information-circle" };
const COLORS = { success: "#10b981", error: "#ef4444", info: "#3b82f6" };

function Toast({ item }: { item: ToastItem }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 15, stiffness: 120 }).start();
  }, [anim]);
  const color = COLORS[item.type];
  return (
    <Animated.View style={[S.toast, {
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }],
      opacity: anim,
    }]}>
      <Ionicons name={ICONS[item.type] as any} size={17} color={color}/>
      <Text style={[S.msg, { color: "#0a1628" }]}>{item.msg}</Text>
    </Animated.View>
  );
}

export default function ToastLayer({ toasts }: Props) {
  if (!toasts.length) return null;
  return (
    <View style={S.layer} pointerEvents="none">
      {toasts.map(t => <Toast key={t.id} item={t}/>)}
    </View>
  );
}

const S = StyleSheet.create({
  layer: { position: "absolute", bottom: 100, left: 20, right: 20, gap: 8, zIndex: 9999 },
  toast: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff",
           borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16,
           shadowColor: "#0e2f5a", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12,
           shadowRadius: 12, elevation: 8, borderWidth: 1, borderColor: "#e6ecf5" },
  msg:   { flex: 1, fontSize: 13, fontWeight: "600" },
});
