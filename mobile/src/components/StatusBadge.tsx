import React from "react";
import { View, Text, StyleSheet } from "react-native";
import AppIcon from "./AppIcon";
import { ACT_META, STATUS_META, PRIORITY_META, ROLE_META } from "../constants";
import type { AppTheme, ActivityType, ActivityStatus, Priority, ClassRole } from "../types";

export interface StatusBadgeProps {
  type?: "activity" | "status" | "priority" | "role" | "openStatus";
  value: ActivityType | ActivityStatus | Priority | ClassRole | boolean;
  th: AppTheme;
  size?: "sm" | "md";
}

export default function StatusBadge({ type = "activity", value, th, size = "md" }: StatusBadgeProps) {
  let label = "";
  let iconName = "";
  let color = th.fg;
  let bg = th.card2;

  if (type === "openStatus") {
    const isOpen = value !== false;
    label = isOpen ? "Turma Aberta" : "Turma Fechada";
    iconName = isOpen ? "checkmark-circle-outline" : "lock-closed-outline";
    color = isOpen ? (th.isDark ? "#34D399" : "#065f46") : (th.isDark ? "#F87171" : "#991b1b");
    bg = isOpen ? (th.isDark ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5") : (th.isDark ? "rgba(239, 68, 68, 0.15)" : "#fef2f2");
  } else if (type === "activity") {
    const meta = ACT_META[value as ActivityType] || ACT_META.dever;
    label = meta.label;
    iconName = meta.icon;
    color = meta.color;
    bg = th.isDark ? `${meta.color}25` : `${meta.color}15`;
  } else if (type === "status") {
    const meta = STATUS_META[value as ActivityStatus] || STATUS_META.todo;
    label = meta.label;
    color = meta.color;
    bg = meta.bg;
    if (value === "done") iconName = "checkmark-circle-outline";
    else if (value === "in_progress") iconName = "time-outline";
    else iconName = "alert-circle-outline";
  } else if (type === "priority") {
    const meta = PRIORITY_META[value as Priority] || PRIORITY_META.media;
    label = meta.label;
    color = th.isDark ? meta.dot : meta.text;
    bg = th.isDark ? `${meta.dot}20` : meta.bg;
    if (value === "alta") iconName = "alert-circle-outline";
    else if (value === "media") iconName = "remove-circle-outline";
    else iconName = "arrow-down-circle-outline";
  } else if (type === "role") {
    const meta = ROLE_META[value as ClassRole] || ROLE_META.student;
    label = meta.label;
    color = meta.color;
    bg = meta.bg;
    if (value === "owner") iconName = "key-outline";
    else if (value === "rep") iconName = "shield-checkmark-outline";
    else iconName = "person-outline";
  }

  const isSm = size === "sm";

  return (
    <View style={[S.badge, { backgroundColor: bg }, isSm && S.badgeSm]}>
      {Boolean(iconName) && (
        <AppIcon name={iconName} size={isSm ? 12 : 14} color={color} style={S.icon} />
      )}
      <Text style={[S.text, { color }, isSm && S.textSm]}>{label}</Text>
    </View>
  );
}

const S = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 5,
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  icon: {
    marginRight: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
  textSm: {
    fontSize: 11,
  },
});
