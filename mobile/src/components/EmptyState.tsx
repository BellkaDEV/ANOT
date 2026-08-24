import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import AppIcon from "./AppIcon";
import type { AppTheme } from "../types";

export interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  th: AppTheme;
}

export default function EmptyState({
  icon = "clipboard-outline",
  title,
  subtitle,
  actionLabel,
  onAction,
  th,
}: EmptyStateProps) {
  return (
    <View style={[S.container, { backgroundColor: th.card, borderColor: th.border }]}>
      <View style={[S.iconWrap, { backgroundColor: th.card2 }]}>
        <AppIcon name={icon} size={32} color={th.muted} />
      </View>
      <Text style={[S.title, { color: th.fg }]}>{title}</Text>
      {Boolean(subtitle) && <Text style={[S.subtitle, { color: th.muted }]}>{subtitle}</Text>}
      {Boolean(actionLabel && onAction) && (
        <TouchableOpacity
          style={[S.actionBtn, { backgroundColor: th.orange }]}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={S.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const S = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  actionBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
