import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from "react-native";
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
  onBack: () => void;
  th: AppTheme;
}

export default function SettingsScreen({
  themeMode,
  onSelectThemeMode,
  reduceMotion,
  onToggleReduceMotion,
  onClearCache,
  onBack,
  th,
}: Props) {
  const insets = useSafeAreaInsets();
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [confirmClearCache, setConfirmClearCache] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState<{ title: string; desc: string } | null>(null);

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
            onPress={() => showInfo("Alterar senha", "O fluxo seguro de alteração de senha pode ser solicitado diretamente no suporte ou portal web.")}
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
});
