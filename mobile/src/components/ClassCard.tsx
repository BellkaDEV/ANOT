import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import type { AppTheme } from "../types";
import { LIGHT } from "../constants";

interface ClassCardProps {
  schoolClass: {
    id: number | string;
    code: string;
    name: string;
    course?: string;
    institution?: string;
    period?: string;
    modality?: string;
  };
  onPress: () => void;
  th?: AppTheme;
}

export default function ClassCard({ schoolClass, onPress, th = LIGHT }: ClassCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: th.card, borderColor: th.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={[styles.className, { color: th.fg }]} numberOfLines={1}>{schoolClass.name}</Text>
        <View style={[styles.codeBadge, { backgroundColor: th.navyLight }]}>
          <Text style={[styles.codeText, { color: th.navy }]}>{schoolClass.code}</Text>
        </View>
      </View>

      {Boolean(schoolClass.course) && (
        <Text style={[styles.course, { color: th.muted }]} numberOfLines={1}>Curso: {schoolClass.course}</Text>
      )}

      <View style={[styles.footer, { borderTopColor: th.border }]}>
        {Boolean(schoolClass.institution) && (
          <Text style={[styles.info, { color: th.muted }]} numberOfLines={1}>{schoolClass.institution}</Text>
        )}
        {Boolean(schoolClass.period) && (
          <Text style={[styles.periodBadge, { color: th.orange, backgroundColor: th.orangeLight }]}>{schoolClass.period}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  className: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  course: {
    fontSize: 14,
    marginBottom: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 8,
  },
  info: {
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  periodBadge: {
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
});
