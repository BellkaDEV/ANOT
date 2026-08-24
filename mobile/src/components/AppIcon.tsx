import React from "react";
import { ViewStyle, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface AppIconProps {
  name: keyof typeof Ionicons.glyphMap | string;
  size?: number;
  color?: string;
  style?: ViewStyle | TextStyle;
  accessibilityLabel?: string;
}

export default function AppIcon({
  name,
  size = 20,
  color,
  style,
  accessibilityLabel,
}: AppIconProps) {
  return (
    <Ionicons
      name={name as any}
      size={size}
      color={color}
      style={style}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
