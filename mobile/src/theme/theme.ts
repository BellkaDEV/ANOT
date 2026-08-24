import type { AppTheme } from "../types";

export const theme = {
  colors: {
    primary: "#0e2f5a",
    secondary: "#e4822e",
    background: "#f4f6fb",
    card: "#ffffff",
    cardSecondary: "#edf1f8",
    text: "#0a1628",
    textSecondary: "#5a6a8a",
    border: "#e6ecf5",
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    orangeLight: "rgba(228,130,46,0.1)",
    navyLight: "rgba(14,47,90,0.07)",
    inputBg: "#edf1f8",
    white: "#ffffff",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },
};

export function getThemeColors(th: AppTheme) {
  return {
    primary: th.navy,
    secondary: th.orange,
    background: th.bg,
    card: th.card,
    cardSecondary: th.card2,
    text: th.fg,
    textSecondary: th.muted,
    border: th.border,
    success: th.success,
    error: th.error,
    warning: th.warning,
    orangeLight: th.orangeLight,
    navyLight: th.navyLight,
    inputBg: th.inputBg,
    white: th.isDark ? th.fg : "#ffffff",
  };
}
