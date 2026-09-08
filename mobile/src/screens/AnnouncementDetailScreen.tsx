import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppIcon from "../components/AppIcon";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import { isExpired } from "../constants";
import type { AppTheme, Announcement, AppUser, ClassRole } from "../types";

interface Props {
  announcement?: Announcement | null;
  user: AppUser;
  myRole: ClassRole;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onBack: () => void;
  th: AppTheme;
}

export default function AnnouncementDetailScreen({
  announcement,
  user,
  myRole,
  onEdit,
  onDelete,
  onBack,
  th,
}: Props) {
  const insets = useSafeAreaInsets();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canManage = myRole === "owner" || myRole === "rep";

  if (!announcement) {
    return (
      <View style={[S.safe, { backgroundColor: th.bg }]}>
        <View style={[S.header, { backgroundColor: th.headerBg, paddingTop: Math.max(insets.top, 12) + 6 }]}>
          <TouchableOpacity onPress={onBack} style={S.backBtn} accessibilityLabel="Voltar">
            <AppIcon name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={S.hTitle}>Aviso</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={S.emptyPadding}>
          <EmptyState
            icon="alert-circle-outline"
            title="Aviso não encontrado"
            subtitle="Este aviso pode ter sido removido ou não está mais disponível."
            actionLabel="Voltar"
            onAction={onBack}
            th={th}
          />
        </View>
      </View>
    );
  }

  const textContent = announcement.content || announcement.desc || "";
  const expired = isExpired(announcement.createdAt);

  const handleOpenUrl = async (url: string) => {
    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      Alert.alert("Link inválido", "Apenas links com protocolo HTTP ou HTTPS podem ser abertos por segurança.");
      return;
    }
    try {
      const supported = await Linking.canOpenURL(cleanUrl);
      if (supported) {
        await Linking.openURL(cleanUrl);
      } else {
        Alert.alert("Erro ao abrir link", "Não foi possível abrir o endereço informado.");
      }
    } catch {
      Alert.alert("Erro ao abrir link", "Ocorreu um erro ao abrir a página.");
    }
  };

  // Helper para renderizar texto com links HTTP/HTTPS interativos
  const renderFormattedText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return (
      <Text style={[S.bodyText, { color: th.fg }]}>
        {parts.map((part, index) => {
          if (part.match(urlRegex)) {
            return (
              <Text
                key={index}
                style={[S.linkText, { color: th.orange }]}
                onPress={() => handleOpenUrl(part)}
              >
                {part}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  return (
    <View style={[S.safe, { backgroundColor: th.bg }]}>
      {/* Header */}
      <View style={[S.header, { backgroundColor: th.headerBg, paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <TouchableOpacity onPress={onBack} style={S.backBtn} accessibilityLabel="Voltar">
          <AppIcon name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={S.hTitle}>Detalhes do Aviso</Text>
        {canManage && (onEdit || onDelete) ? (
          <View style={S.headerActions}>
            {Boolean(onEdit) && (
              <TouchableOpacity onPress={() => onEdit!(announcement.id)} style={S.iconBtn} accessibilityLabel="Editar aviso">
                <AppIcon name="create-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {Boolean(onDelete) && (
              <TouchableOpacity onPress={() => setConfirmDelete(true)} style={S.iconBtn} accessibilityLabel="Excluir aviso">
                <AppIcon name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={S.body} showsVerticalScrollIndicator={false}>
        {/* Main Card */}
        <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
          <View style={S.metaRow}>
            <StatusBadge type="priority" value={announcement.priority} th={th} />
            {expired && (
              <View style={[S.expiredBadge, { backgroundColor: th.card2 }]}>
                <Text style={[S.expiredText, { color: th.muted }]}>Expirado</Text>
              </View>
            )}
          </View>

          <Text style={[S.title, { color: th.fg }]}>{announcement.title}</Text>

          <View style={S.authorSection}>
            <View style={[S.authorIcon, { backgroundColor: th.navyLight }]}>
              <AppIcon name="person-outline" size={16} color={th.navy} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.authorName, { color: th.fg }]}>{announcement.authorName}</Text>
              <Text style={[S.dateText, { color: th.muted }]}>Publicado em {announcement.date}</Text>
            </View>
          </View>

          <View style={[S.divider, { backgroundColor: th.border }]} />

          {/* Full content */}
          <View style={S.contentContainer}>
            {renderFormattedText(textContent)}
          </View>
        </View>
      </ScrollView>

      {/* Delete confirmation */}
      {canManage && onDelete && (
        <ConfirmDialog
          visible={confirmDelete}
          title="Excluir aviso?"
          message="Esta ação não pode ser desfeita e removerá o aviso para todos os alunos da turma."
          confirmLabel="Excluir"
          isDestructive
          onConfirm={() => {
            setConfirmDelete(false);
            onDelete(announcement.id);
          }}
          onCancel={() => setConfirmDelete(false)}
          th={th}
        />
      )}
    </View>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  hTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  emptyPadding: { padding: 20 },
  body: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  expiredBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  expiredText: { fontSize: 11, fontWeight: "700" },
  title: { fontSize: 20, fontWeight: "800", lineHeight: 26 },
  authorSection: { flexDirection: "row", alignItems: "center", gap: 12 },
  authorIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  authorName: { fontSize: 14, fontWeight: "700" },
  dateText: { fontSize: 12, marginTop: 1 },
  divider: { height: 1, width: "100%" },
  contentContainer: { gap: 12 },
  bodyText: { fontSize: 15, lineHeight: 24 },
  linkText: { fontWeight: "700", textDecorationLine: "underline" },
});
