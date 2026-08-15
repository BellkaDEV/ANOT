import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ToastItem } from "../types";

interface Props {
  toasts: ToastItem[];
}

const ICONS = {
  success: "checkmark-circle" as const,
  error: "alert-circle" as const,
  info: "information-circle" as const,
};

const COLORS = {
  success: "#10b981",
  error: "#ef4444",
  info: "#3b82f6",
};

const BG_ACCENT = {
  success: "rgba(16, 185, 129, 0.08)",
  error: "rgba(239, 68, 68, 0.08)",
  info: "rgba(59, 130, 246, 0.08)",
};

function ToastCard({ item, index, total }: { item: ToastItem; index: number; total: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 16,
      stiffness: 140,
    }).start();
  }, [anim]);

  const color = COLORS[item.type] || COLORS.info;
  const iconName = (ICONS[item.type] || ICONS.info) as any;
  const bgAccent = BG_ACCENT[item.type] || BG_ACCENT.info;

  // Stacking deck effect (ficheiro animation):
  // Older toast (index 0 when total === 2) is scaled down & pushed up slightly
  const isBackCard = total === 2 && index === 0;
  
  const scale = isBackCard ? 0.94 : 1;
  const translateYOffset = isBackCard ? -8 : 0;
  const opacityVal = isBackCard ? 0.75 : 1;

  return (
    <Animated.View
      style={[
        S.toastCard,
        {
          backgroundColor: "#ffffff",
          borderColor: color + "40",
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, translateYOffset],
              }),
            },
            { scale },
          ],
          opacity: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, opacityVal],
          }),
          zIndex: index + 1,
        },
      ]}
    >
      <View style={[S.iconWrap, { backgroundColor: bgAccent }]}>
        <Ionicons name={iconName} size={20} color={color} />
      </View>
      <Text style={S.msgText} numberOfLines={2}>
        {item.msg}
      </Text>
    </Animated.View>
  );
}

export default function ToastLayer({ toasts }: Props) {
  // Limitar rigidamente a no máximo 2 notificações simultâneas
  const visibleToasts = toasts.slice(-2);

  if (!visibleToasts.length) return null;

  return (
    <View style={S.container} pointerEvents="none">
      <View style={S.stackWrap}>
        {visibleToasts.map((t, idx) => (
          <ToastCard key={t.id} item={t} index={idx} total={visibleToasts.length} />
        ))}
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 85, // Posicionamento seguro acima da navegação inferior
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 9999,
  },
  stackWrap: {
    width: "100%",
    maxWidth: 420,
    gap: -12, // Leve sobreposição clean tipo ficheiro/baralho
  },
  toastCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1.5,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  msgText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 18,
  },
});
