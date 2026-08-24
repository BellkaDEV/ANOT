import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import AppIcon from "./AppIcon";
import type { AppTheme } from "../types";

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  th: AppTheme;
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isDestructive = false,
  onConfirm,
  onCancel,
  th,
}: ConfirmDialogProps) {
  if (!visible) return null;

  const confirmBg = isDestructive ? (th.error || "#ef4444") : th.orange;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={S.overlay}>
          <TouchableWithoutFeedback>
            <View style={[S.dialog, { backgroundColor: th.card, borderColor: th.border }]}>
              <View style={[S.iconWrap, { backgroundColor: isDestructive ? (th.errorBg || "rgba(239,68,68,0.1)") : th.orangeLight }]}>
                <AppIcon
                  name={isDestructive ? "alert-circle-outline" : "help-circle-outline"}
                  size={28}
                  color={isDestructive ? (th.error || "#ef4444") : th.orange}
                />
              </View>

              <Text style={[S.title, { color: th.fg }]}>{title}</Text>
              <Text style={[S.message, { color: th.muted }]}>{message}</Text>

              <View style={S.btnRow}>
                <TouchableOpacity
                  style={[S.btn, S.cancelBtn, { backgroundColor: th.card2, borderColor: th.border }]}
                  onPress={onCancel}
                  activeOpacity={0.8}
                >
                  <Text style={[S.btnText, { color: th.fg }]}>{cancelLabel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[S.btn, { backgroundColor: confirmBg }]}
                  onPress={onConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={[S.btnText, { color: "#FFFFFF" }]}>{confirmLabel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24, // 24px standard for modals
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    width: "100%",
  },
  btn: {
    flex: 1,
    height: 46, // Touch target > 44px
    borderRadius: 12, // 12px standard for controls
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    borderWidth: 1,
  },
  btnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
