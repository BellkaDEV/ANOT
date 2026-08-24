import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { AppTheme } from "../types";
import { LIGHT } from "../constants";

interface AnnouncementCardProps {
  announcement: {
    id: number | string;
    title: string;
    content: string;
    priority: string;
    created_at: string;
    author?: {
      name: string;
    };
  };
  th?: AppTheme;
}

export default function AnnouncementCard({ announcement, th = LIGHT }: AnnouncementCardProps) {
  const getPriorityMeta = (priority: string) => {
    switch (priority) {
      case "alta":
        return { label: "Alta", color: th.error, bg: th.errorBg };
      case "media":
        return { label: "Média", color: th.warning, bg: th.warningBg };
      default:
        return { label: "Baixa", color: th.success, bg: th.successBg };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return dateString;
    }
  };

  const pm = getPriorityMeta(announcement.priority);

  return (
    <View style={[styles.card, { backgroundColor: th.card, borderColor: th.border }]}>
      <View style={[styles.accentLine, { backgroundColor: pm.color }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: th.fg }]} numberOfLines={1}>{announcement.title}</Text>
          <View style={[styles.badge, { backgroundColor: pm.bg }]}>
            <View style={[styles.badgeDot, { backgroundColor: pm.color }]} />
            <Text style={[styles.badgeText, { color: pm.color }]}>{pm.label}</Text>
          </View>
        </View>

        <Text style={[styles.desc, { color: th.muted }]}>{announcement.content}</Text>

        <View style={styles.footer}>
          <Text style={[styles.author, { color: th.orange }]}>{announcement.author?.name || "Sistema"}</Text>
          <Text style={[styles.date, { color: th.muted }]}>{formatDate(announcement.created_at)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    overflow: "hidden",
    flexDirection: "row",
  },
  accentLine: {
    width: 3,
    height: "100%",
  },
  content: {
    flex: 1,
    padding: 13,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  desc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  author: {
    fontSize: 11,
    fontWeight: "700",
  },
  date: {
    fontSize: 11,
  },
});
