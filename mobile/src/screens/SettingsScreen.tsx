import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppIcon from "../components/AppIcon";
import SettingRow from "../components/SettingRow";
import ConfirmDialog from "../components/ConfirmDialog";
import { HDivider } from "../components/ui";
import type { AppTheme } from "../types";

export type ThemeMode = "system" | "light" | "dark";

interface Props {
  themeMode: ThemeMode;
  onSelectThemeMode: (mode: ThemeMode) => void;
  reduceMotion: boolean;
  onToggleReduceMotion: (v: boolean) => void;
  onClearCache: () => void;
  onDeleteAccount: (password: string) => Promise<void>;
  onChangePassword: (currentPassword: string, password: string) => Promise<void>;
  email?: string;
  emailVerifiedAt?: string | null;
  onResendEmailVerification: () => Promise<void>;
  onBack: () => void;
  th: AppTheme;
}

export default function SettingsScreen({
  themeMode,
  onSelectThemeMode,
  reduceMotion,
  onToggleReduceMotion,
  onClearCache,
  onDeleteAccount,
  onChangePassword,
  email,
  emailVerifiedAt,
  onResendEmailVerification,
  onBack,
  th,
}: Props) {
  const insets = useSafeAreaInsets();
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [confirmClearCache, setConfirmClearCache] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState<{ title: string; desc: string } | null>(null);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSubmitting, setChangePasswordSubmitting] = useState(false);
  const [verificationSubmitting, setVerificationSubmitting] = useState(false);

  const themeLabelMap: Record<ThemeMode, string> = {
    system: "Sistema",
    light: "Claro",
    dark: "Escuro",
  };

  const showInfo = (title: string, desc: string) => {
    setInfoModalContent({ title, desc });
  };

  return (
    <View style={[S.safe, { backgroundColor: th.bg }]}>
      {/* Header */}
      <View style={[S.header, { backgroundColor: th.headerBg, paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Voltar"
          style={S.backBtn}
        >
          <AppIcon name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={S.hTitle}>Configurações</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={S.body} showsVerticalScrollIndicator={false}>
        {/* Aparência */}
        <Text style={[S.sLabel, { color: th.muted }]}>APARÊNCIA</Text>
        <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
          {email && !emailVerifiedAt && <>
            <SettingRow
              icon="mail-unread-outline"
              label="Confirmar e-mail"
              sub={`Reenviar confirmação para ${email}`}
              badge="Pendente"
              onPress={async () => {
                setVerificationSubmitting(true);
                try {
                  await onResendEmailVerification();
                  showInfo("E-mail enviado", "Confira sua caixa de entrada e a pasta de spam para confirmar seu endereço.");
                } catch (error: any) {
                  showInfo("Não foi possível enviar", error.message || "Tente novamente em alguns instantes.");
                } finally {
                  setVerificationSubmitting(false);
                }
              }}
              disabled={verificationSubmitting}
              th={th}
            />
            <HDivider th={th} />
          </>}
          <SettingRow
            icon="color-palette-outline"
            label="Tema do aplicativo"
            sub="Escolha o esquema de cores visual"
            rightText={themeLabelMap[themeMode]}
            onPress={() => setThemeModalVisible(true)}
            th={th}
          />
          <HDivider th={th} />
          <SettingRow
            icon="options-outline"
            label="Reduzir animações"
            sub="Diminui efeitos de transição visual"
            value={reduceMotion}
            onToggle={onToggleReduceMotion}
            th={th}
          />
          <HDivider th={th} />
          <SettingRow
            icon="trash-outline"
            label="Excluir minha conta"
            sub="Remove sua conta e os dados associados permanentemente"
            isDestructive
            onPress={() => {
              setDeletePassword("");
              setDeleteError(null);
              setDeleteAccountVisible(true);
            }}
            th={th}
          />
        </View>

        {/* Notificações */}
        <Text style={[S.sLabel, { color: th.muted }]}>NOTIFICAÇÕES</Text>
        <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
          <SettingRow
            icon="notifications-outline"
            label="Notificações push"
            sub="Receba avisos e lembretes de tarefas diretamente no seu aparelho"
            badge="Em breve"
            disabled
            th={th}
          />
        </View>

        {/* Acessibilidade */}
        <Text style={[S.sLabel, { color: th.muted }]}>ACESSIBILIDADE</Text>
        <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
          <SettingRow
            icon="text-outline"
            label="Tamanho do texto"
            sub="Ajustar o tamanho das fontes no aplicativo"
            badge="Em breve"
            onPress={() => showInfo("Tamanho do texto", "O ajuste dinâmico de fontes estará disponível em breve nas próximas atualizações.")}
            th={th}
          />
          <HDivider th={th} />
          <SettingRow
            icon="hand-left-outline"
            label="Feedback háptico"
            sub="Vibrações sutis ao tocar em botões"
            badge="Em breve"
            onPress={() => showInfo("Feedback háptico", "As resposta por vibração tátil serão disponibilizadas em breve.")}
            th={th}
          />
        </View>

        {/* Dados */}
        <Text style={[S.sLabel, { color: th.muted }]}>DADOS & ARMAZENAMENTO</Text>
        <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
          <SettingRow
            icon="cloud-done-outline"
            label="Estado da sincronização"
            sub="Conexão com os servidores da API ANOT"
            rightText="Online"
            disabled
            th={th}
          />
          <HDivider th={th} />
          <SettingRow
            icon="trash-outline"
            label="Limpar cache local"
            sub="Apaga dados temporários armazenados no dispositivo"
            isDestructive
            onPress={() => setConfirmClearCache(true)}
            th={th}
          />
        </View>

        {/* Conta */}
        <Text style={[S.sLabel, { color: th.muted }]}>CONTA</Text>
        <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
          <SettingRow
            icon="lock-closed-outline"
            label="Alterar senha"
            sub="Atualizar suas credenciais de segurança"
            onPress={() => {
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
              setChangePasswordError(null);
              setChangePasswordVisible(true);
            }}
            th={th}
          />
          <HDivider th={th} />
          <SettingRow
            icon="mail-outline"
            label="Alterar e-mail"
            sub="Atualizar seu endereço de e-mail institucional"
            onPress={() => showInfo("Alterar e-mail", "Para alterar seu e-mail cadastrado, entre em contato com o administrador da sua instituição.")}
            th={th}
          />
          <HDivider th={th} />
          <SettingRow
            icon="hardware-chip-outline"
            label="Dispositivos conectados"
            sub="Gerenciar sessões ativas no aplicativo"
            onPress={() => showInfo("Dispositivos conectados", "Sua sessão atual está ativa neste aparelho com criptografia Sanctum.")}
            th={th}
          />
        </View>

        {/* Privacidade e Suporte */}
        <Text style={[S.sLabel, { color: th.muted }]}>PRIVACIDADE & SUPORTE</Text>
        <View style={[S.card, { backgroundColor: th.card, borderColor: th.border }]}>
          <SettingRow
            icon="shield-outline"
            label="Política de privacidade"
            sub="Como protegemos seus dados acadêmicos"
            onPress={() => showInfo("Política de privacidade", "O ANOT respeita sua privacidade e cumpre com a LGPD. Seus dados não são compartilhados com terceiros.")}
            th={th}
          />
          <HDivider th={th} />
          <SettingRow
            icon="document-text-outline"
            label="Termos de uso"
            sub="Regras de utilização do serviço"
            onPress={() => showInfo("Termos de uso", "Termos e diretrizes de uso acadêmico do aplicativo ANOT.")}
            th={th}
          />
          <HDivider th={th} />
          <SettingRow
            icon="help-circle-outline"
            label="Ajuda & Perguntas frequentes"
            sub="Tire dúvidas sobre turmas, avisos e atividades"
            onPress={() => showInfo("Ajuda & FAQ", "Dúvida comum: Peça o código de 6 dígitos da turma ao seu representante para ingressar.")}
            th={th}
          />
          <HDivider th={th} />
          <SettingRow
            icon="bug-outline"
            label="Reportar um problema"
            sub="Envie feedbacks ou relatórios de erros"
            onPress={() => showInfo("Reportar um problema", "Obrigado por nos ajudar a melhorar o ANOT! Envie um e-mail para suporte@anot.edu.br.")}
            th={th}
          />
          <HDivider th={th} />
          <SettingRow
            icon="information-circle-outline"
            label="Versão do aplicativo"
            rightText="1.0.0"
            disabled
            th={th}
          />
        </View>
      </ScrollView>

      {/* Modal de Escolha de Tema */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <TouchableOpacity
          style={S.modalOverlay}
          activeOpacity={1}
          onPress={() => setThemeModalVisible(false)}
        >
          <View style={[S.modalCard, { backgroundColor: th.card, borderColor: th.border }]}>
            <Text style={[S.modalTitle, { color: th.fg }]}>Tema do Aplicativo</Text>
            <Text style={[S.modalSub, { color: th.muted }]}>Escolha o modo de exibição preferido:</Text>

            {(["system", "light", "dark"] as ThemeMode[]).map((mode) => {
              const selected = themeMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    S.themeOption,
                    {
                      borderColor: selected ? th.orange : th.border,
                      backgroundColor: selected ? th.orangeLight : th.card2,
                    },
                  ]}
                  onPress={() => {
                    onSelectThemeMode(mode);
                    setThemeModalVisible(false);
                  }}
                  activeOpacity={0.8}
                >
                  <AppIcon
                    name={
                      mode === "system"
                        ? "desktop-outline"
                        : mode === "light"
                        ? "sunny-outline"
                        : "moon-outline"
                    }
                    size={20}
                    color={selected ? th.orange : th.muted}
                  />
                  <Text style={[S.themeOptionText, { color: selected ? th.orange : th.fg }]}>
                    {themeLabelMap[mode]}
                  </Text>
                  {selected && <AppIcon name="checkmark" size={18} color={th.orange} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Informativo "Em breve" */}
      <Modal
        visible={infoModalContent !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModalContent(null)}
      >
        <TouchableOpacity
          style={S.modalOverlay}
          activeOpacity={1}
          onPress={() => setInfoModalContent(null)}
        >
          <View style={[S.modalCard, { backgroundColor: th.card, borderColor: th.border }]}>
            <View style={[S.infoIconWrap, { backgroundColor: th.navyLight }]}>
              <AppIcon name="information-circle-outline" size={32} color={th.navy} />
            </View>
            <Text style={[S.modalTitle, { color: th.fg }]}>{infoModalContent?.title}</Text>
            <Text style={[S.modalSub, { color: th.muted, marginTop: 8, textAlign: "center" }]}>
              {infoModalContent?.desc}
            </Text>
            <TouchableOpacity
              style={[S.closeBtn, { backgroundColor: th.orange }]}
              onPress={() => setInfoModalContent(null)}
              activeOpacity={0.8}
            >
              <Text style={S.closeBtnText}>Entendi</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Diálogo de Confirmação para Limpar Cache */}
      <ConfirmDialog
        visible={confirmClearCache}
        title="Limpar Cache Local?"
        message="Isso apagará dados temporários em cache neste aparelho. Suas turmas e notas continuarão salvas com segurança na nuvem."
        confirmLabel="Limpar Cache"
        isDestructive
        onConfirm={() => {
          setConfirmClearCache(false);
          onClearCache();
        }}
        onCancel={() => setConfirmClearCache(false)}
        th={th}
      />

      <Modal
        visible={changePasswordVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !changePasswordSubmitting && setChangePasswordVisible(false)}
      >
        <View style={S.modalOverlay}>
          <View style={[S.modalCard, { backgroundColor: th.card, borderColor: th.border }]}>
            <Text style={[S.modalTitle, { color: th.fg }]}>Alterar senha</Text>
            <Text style={[S.modalSub, { color: th.muted, textAlign: "center" }]}>Você sairá da conta em todos os dispositivos.</Text>
            <TextInput value={currentPassword} onChangeText={setCurrentPassword} placeholder="Senha atual" placeholderTextColor={th.muted} secureTextEntry style={[S.deleteInput, { color: th.fg, borderColor: changePasswordError ? "#dc2626" : th.border, backgroundColor: th.card2 }]} accessibilityLabel="Senha atual" />
            <TextInput value={newPassword} onChangeText={setNewPassword} placeholder="Nova senha" placeholderTextColor={th.muted} secureTextEntry style={[S.deleteInput, { color: th.fg, borderColor: changePasswordError ? "#dc2626" : th.border, backgroundColor: th.card2 }]} accessibilityLabel="Nova senha" />
            <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirmar nova senha" placeholderTextColor={th.muted} secureTextEntry style={[S.deleteInput, { color: th.fg, borderColor: changePasswordError ? "#dc2626" : th.border, backgroundColor: th.card2 }]} accessibilityLabel="Confirmar nova senha" />
            {changePasswordError && <Text style={S.deleteError}>{changePasswordError}</Text>}
            <TouchableOpacity
              style={[S.closeBtn, { backgroundColor: th.orange, opacity: changePasswordSubmitting || !currentPassword || !newPassword || !confirmPassword ? 0.55 : 1 }]}
              disabled={changePasswordSubmitting || !currentPassword || !newPassword || !confirmPassword}
              onPress={async () => {
                if (newPassword !== confirmPassword) {
                  setChangePasswordError("A confirmação da nova senha não confere.");
                  return;
                }
                setChangePasswordSubmitting(true);
                try {
                  await onChangePassword(currentPassword, newPassword);
                  setChangePasswordVisible(false);
                } catch (error: any) {
                  setChangePasswordError(error.message || "Não foi possível alterar a senha.");
                } finally {
                  setChangePasswordSubmitting(false);
                }
              }}
            >
              {changePasswordSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={S.closeBtnText}>Alterar senha</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[S.cancelBtn, { borderColor: th.border }]} onPress={() => setChangePasswordVisible(false)} disabled={changePasswordSubmitting}>
              <Text style={[S.cancelBtnText, { color: th.fg }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteAccountVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !deleteSubmitting && setDeleteAccountVisible(false)}
      >
        <View style={S.modalOverlay}>
          <View style={[S.modalCard, { backgroundColor: th.card, borderColor: th.border }]}>
            <View style={[S.infoIconWrap, { backgroundColor: "rgba(220, 38, 38, 0.12)" }]}>
              <AppIcon name="warning-outline" size={32} color="#dc2626" />
            </View>
            <Text style={[S.modalTitle, { color: th.fg }]}>Excluir conta?</Text>
            <Text style={[S.modalSub, { color: th.muted, textAlign: "center" }]}>
              Esta ação é permanente e removerá sua conta e os dados associados. Digite sua senha para confirmar.
            </Text>
            <TextInput
              value={deletePassword}
              onChangeText={(value) => {
                setDeletePassword(value);
                setDeleteError(null);
              }}
              placeholder="Senha atual"
              placeholderTextColor={th.muted}
              secureTextEntry
              autoCapitalize="none"
              style={[S.deleteInput, { color: th.fg, borderColor: deleteError ? "#dc2626" : th.border, backgroundColor: th.card2 }]}
              accessibilityLabel="Senha atual para excluir a conta"
            />
            {deleteError && <Text style={S.deleteError}>{deleteError}</Text>}
            <TouchableOpacity
              style={[S.closeBtn, { backgroundColor: "#dc2626", opacity: deleteSubmitting || !deletePassword ? 0.55 : 1 }]}
              disabled={deleteSubmitting || !deletePassword}
              onPress={async () => {
                setDeleteSubmitting(true);
                try {
                  await onDeleteAccount(deletePassword);
                  setDeleteAccountVisible(false);
                } catch (error: any) {
                  setDeleteError(error.message || "Não foi possível excluir a conta.");
                } finally {
                  setDeleteSubmitting(false);
                }
              }}
              activeOpacity={0.8}
            >
              {deleteSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={S.closeBtnText}>Excluir permanentemente</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.cancelBtn, { borderColor: th.border }]}
              onPress={() => setDeleteAccountVisible(false)}
              disabled={deleteSubmitting}
            >
              <Text style={[S.cancelBtnText, { color: th.fg }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  hTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  backBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 16,
    gap: 10,
    paddingBottom: 40,
  },
  sLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginTop: 8,
    marginBottom: 4,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16, // 16px standard for cards
    borderWidth: 1,
    overflow: "hidden",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24, // 24px standard for modals
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalSub: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 48, // min touch target >= 44px
    borderRadius: 12, // 12px standard for controls
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 12,
  },
  themeOptionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  infoIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  closeBtn: {
    marginTop: 20,
    width: "100%",
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  deleteInput: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    fontSize: 15,
  },
  deleteError: {
    color: "#dc2626",
    fontSize: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  cancelBtn: {
    marginTop: 10,
    width: "100%",
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
