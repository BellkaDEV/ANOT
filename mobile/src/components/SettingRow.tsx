import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import AppIcon from "./AppIcon";
import type { AppTheme } from "../types";

export interface SettingRowProps {
  icon?: string;
  label: string;
  sub?: string;
  badge?: string;
  rightText?: string;
  value?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  isDestructive?: boolean;
  disabled?: boolean;
  th: AppTheme;
}

export default function SettingRow({
  icon,
  label,
  sub,
  badge,
  rightText,
  value,
  onToggle,
  onPress,
  isDestructive = false,
  disabled = false,
  th,
}: SettingRowProps) {
  const textColor = isDestructive ? (th.error || "#ef4444") : th.fg;
  const iconColor = isDestructive ? (th.error || "#ef4444") : th.navy;

  const content = (
    <View style={[S.row, disabled && S.disabledRow]}>
      {Boolean(icon) && (
        <View style={[S.iconWrap, { backgroundColor: isDestructive ? (th.errorBg || "rgba(239,68,68,0.1)") : th.navyLight }]}>
          <AppIcon name={icon!} size={18} color={iconColor} />
        </View>
      )}

      <View style={S.textCol}>
        <View style={S.labelRow}>
          <Text style={[S.label, { color: textColor }]}>{label}</Text>
          {Boolean(badge) && (
            <View style={[S.badge, { backgroundColor: th.card2 }]}>
              <Text style={[S.badgeText, { color: th.muted }]}>{badge}</Text>
            </View>
          )}
        </View>
        {Boolean(sub) && <Text style={[S.sub, { color: th.muted }]}>{sub}</Text>}
      </View>

      {Boolean(rightText) && (
        <Text style={[S.rightText, { color: th.muted }]}>{rightText}</Text>
      )}

      {onToggle !== undefined && value !== undefined && (
        <Switch
          value={value}
          onValueChange={onToggle}
          disabled={disabled}
          trackColor={{ false: th.border, true: th.orange }}
          thumbColor="#FFFFFF"
        />
      )}

      {Boolean(onPress && !onToggle) && (
        <AppIcon name="chevron-forward" size={16} color={th.muted} />
      )}
    </View>
  );

  if (onPress && !disabled && onToggle === undefined) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityLabel={label}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const S = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 52,
    gap: 12,
  },
  disabledRow: {
    opacity: 0.6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  sub: {
    fontSize: 12,
    lineHeight: 16,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  rightText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
