import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';

interface ActivityItemProps {
  activity: {
    id: number;
    title: string;
    type: string; // dever, trabalho, teste, outros
    subject?: string;
    due_date: string;
    due_time?: string;
    description?: string;
    user_progress?: {
      status: string; // todo, in_progress, done
    } | null;
  };
  onPress: () => void;
  onStatusChange?: (newStatus: 'todo' | 'in_progress' | 'done') => void;
}

export default function ActivityItem({ activity, onPress, onStatusChange }: ActivityItemProps) {
  const currentStatus = activity.user_progress?.status || 'todo';

  const getStatusMeta = (status: string) => {
    switch (status) {
      case 'done':
        return { label: 'Pronto', color: theme.colors.success, bg: 'rgba(16, 185, 129, 0.12)' };
      case 'in_progress':
        return { label: 'Em andamento', color: theme.colors.secondary, bg: 'rgba(228, 130, 46, 0.12)' };
      default:
        return { label: 'Não feito', color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.12)' };
    }
  };

  const getTypeMeta = (type: string) => {
    switch (type) {
      case 'teste':
        return { label: 'Teste/Prova', color: theme.colors.error };
      case 'trabalho':
        return { label: 'Trabalho', color: '#3b82f6' };
      case 'dever':
        return { label: 'Dever', color: theme.colors.secondary };
      default:
        return { label: 'Outros', color: '#8b5cf6' };
    }
  };

  const sm = getStatusMeta(currentStatus);
  const tm = getTypeMeta(activity.type);

  const handleCycleStatus = () => {
    if (!onStatusChange) return;

    if (currentStatus === 'todo') {
      onStatusChange('in_progress');
    } else if (currentStatus === 'in_progress') {
      onStatusChange('done');
    } else {
      onStatusChange('todo');
    }
  };

  const formatDateLabel = (dateString: string) => {
    try {
      const parts = dateString.split('-');
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const day = parseInt(parts[2], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      return `${day} ${months[monthIdx]}`;
    } catch {
      return dateString;
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.accentLine, { backgroundColor: sm.color }]} />
      <View style={styles.content}>
        <View style={styles.mainInfo}>
          <View style={styles.typeRow}>
            <Text style={[styles.typeLabel, { color: tm.color }]}>
              {tm.label.toUpperCase()}
            </Text>
            {activity.due_time && (
              <Text style={styles.timeLabel}>· {activity.due_time}</Text>
            )}
          </View>
          <Text style={styles.title} numberOfLines={1}>{activity.title}</Text>
          <Text style={styles.subtext}>
            {activity.subject || 'Sem matéria'} · {formatDateLabel(activity.due_date)}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.badge, { backgroundColor: sm.bg }]}
          onPress={handleCycleStatus}
          disabled={!onStatusChange}
          activeOpacity={0.7}
        >
          <View style={[styles.badgeDot, { backgroundColor: sm.color }]} />
          <Text style={[styles.badgeText, { color: sm.color }]}>{sm.label}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accentLine: {
    width: 3,
    height: '100%',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  mainInfo: {
    flex: 1,
    minWidth: 0,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtext: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
});
