import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/theme';

interface AnnouncementCardProps {
  announcement: {
    id: number;
    title: string;
    content: string;
    priority: string; // baixa, media, alta
    created_at: string;
    author?: {
      name: string;
    };
  };
}

export default function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const getPriorityMeta = (priority: string) => {
    switch (priority) {
      case 'alta':
        return { label: 'Alta', color: theme.colors.error, bg: '#fef2f2' };
      case 'media':
        return { label: 'Média', color: '#b45309', bg: '#fffbeb' };
      default:
        return { label: 'Baixa', color: '#065f46', bg: '#ecfdf5' };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const pm = getPriorityMeta(announcement.priority);

  return (
    <View style={styles.card}>
      <View style={[styles.accentLine, { backgroundColor: pm.color }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{announcement.title}</Text>
          <View style={[styles.badge, { backgroundColor: pm.bg }]}>
            <View style={[styles.badgeDot, { backgroundColor: pm.color }]} />
            <Text style={[styles.badgeText, { color: pm.color }]}>{pm.label}</Text>
          </View>
        </View>

        <Text style={styles.desc}>{announcement.content}</Text>

        <View style={styles.footer}>
          <Text style={styles.author}>{announcement.author?.name || 'Sistema'}</Text>
          <Text style={styles.date}>{formatDate(announcement.created_at)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accentLine: {
    width: 3,
    height: '100%',
  },
  content: {
    flex: 1,
    padding: 13,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '700',
  },
  desc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  author: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  date: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
});
