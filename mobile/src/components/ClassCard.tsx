import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';

interface ClassCardProps {
  schoolClass: {
    id: number;
    code: string;
    name: string;
    course?: string;
    institution?: string;
    period?: string;
    modality?: string;
  };
  onPress: () => void;
}

export default function ClassCard({ schoolClass, onPress }: ClassCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.className} numberOfLines={1}>{schoolClass.name}</Text>
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{schoolClass.code}</Text>
        </View>
      </View>

      {schoolClass.course && (
        <Text style={styles.course} numberOfLines={1}>Curso: {schoolClass.course}</Text>
      )}

      <View style={styles.footer}>
        {schoolClass.institution && (
          <Text style={styles.info} numberOfLines={1}>{schoolClass.institution}</Text>
        )}
        {schoolClass.period && (
          <Text style={styles.periodBadge}>{schoolClass.period}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  className: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  codeBadge: {
    backgroundColor: 'rgba(14, 47, 90, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  codeText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  course: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: theme.spacing.sm,
  },
  info: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  periodBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.secondary,
    backgroundColor: 'rgba(228, 130, 46, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
});
