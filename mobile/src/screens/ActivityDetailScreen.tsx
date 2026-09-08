import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppIcon from "../components/AppIcon";
import StatusBadge from "../components/StatusBadge";
import ConfirmDialog from "../components/ConfirmDialog";
import KeyboardAwareScreen from "../components/KeyboardAwareScreen";
import { Badge, Btn, FInput, FTextarea, HDivider } from "../components/ui";
import { STATUS_META, ACT_META } from "../constants";
import type {
  AppTheme, Activity, ActivityStatus, AppUser, ClassRole, Member, ActivityGroup, ActivityGroupMember, ActivityGroupInvitation,
} from "../types";

interface Props {
  activity: Activity;
  status: ActivityStatus;
  notes: string;
  user: AppUser;
  myRole: ClassRole;
  classMembers?: Member[];
  onSaveStatus: (id: string, s: ActivityStatus) => void;
  onSaveNotes: (id: string, n: string) => void;
  onJoinGroup?: (groupId: string) => void;
  onLeaveGroup?: (groupId: string) => void;
  onUpdateGroupDesc?: (groupId: string, desc: string) => void;
  onInviteMember?: (groupId: string, userId: string) => void;
  onRespondInvitation?: (invitationId: string, action: "accept" | "decline") => void;
  onRemoveGroupMember?: (groupId: string, userId: string) => void;
  onBack: () => void;
  th: AppTheme;
}

export default function ActivityDetailScreen({
  activity,
  status,
  notes,
  user,
  myRole,
  classMembers = [],
  onSaveStatus,
  onSaveNotes,
  onJoinGroup,
  onLeaveGroup,
  onUpdateGroupDesc,
  onInviteMember,
  onRespondInvitation,
  onRemoveGroupMember,
  onBack,
  th,
}: Props) {
  const insets = useSafeAreaInsets();
  const [localNotes, setLocalNotes] = useState(notes);
  const [saved, setSaved] = useState(false);
  const [confirmLeaveGroup, setConfirmLeaveGroup] = useState<string | null>(null);

  // Modais de Líder
  const [editDescGroupId, setEditDescGroupId] = useState<string | null>(null);
  const [groupDescText, setGroupDescText] = useState("");
  const [inviteModalGroupId, setInviteModalGroupId] = useState<string | null>(null);

  const am = ACT_META[activity.type];
  const sm = STATUS_META[status];
  const STATUSES: ActivityStatus[] = ["todo", "in_progress", "done"];

  const formatLabels: Record<string, string> = {
    fechada: "Fechada",
    aberta: "Aberta",
    mista: "Mista",
    nao_informado: "Não informado",
  };

  // Grupos
  const groups = activity.groups || [];
  const myGroup = groups.find((g) => g.members.some((m) => m.userId === user.id));
  const isLeaderOfMyGroup = myGroup ? myGroup.leaderUserId === user.id : false;
  const isClassOwner = myRole === "owner";

  // Convites pendentes do usuário atual
  const myPendingInvitations: { inv: ActivityGroupInvitation; groupName: string }[] = [];
  groups.forEach((g) => {
    (g.invitations || []).forEach((inv) => {
      if (inv.invitedUserId === user.id && inv.status === "pending") {
        myPendingInvitations.push({ inv, groupName: g.name });
      }
    });
  });

  // Membros da turma elegíveis para convite (exclui criador da turma, alunos já em grupo no trabalho)
  const usersInAnyGroup = new Set<string>();
  groups.forEach((g) => g.members.forEach((m) => usersInAnyGroup.add(m.userId)));

  const eligibleForInvite = classMembers.filter(
    (m) => m.classRole !== "owner" && !usersInAnyGroup.has(m.userId)
  );

  function saveNotes() {
    onSaveNotes(activity.id, localNotes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const header = (
    <View style={[S.header, { backgroundColor: th.headerBg, paddingTop: Math.max(insets.top, 12) + 6 }]}>
      <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityLabel="Voltar">
        <AppIcon name="arrow-back" size={22} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={S.hTitle} numberOfLines={1}>{activity.title}</Text>
      <View style={{ width: 22 }} />
    </View>
  );

  return (
    <KeyboardAwareScreen header={header} th={th} contentContainerStyle={S.body}>
      {/* Card Principal */}
      <View style={[S.card, { backgroundColor: th.card, borderColor: am.color + "40", borderLeftColor: am.color }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <AppIcon name={am.icon} size={28} color={am.color} />
          <View style={{ flex: 1 }}>
            <Text style={[S.actTitle, { color: th.fg }]}>{activity.title}</Text>
            <Text style={[S.actSubject, { color: th.muted }]}>{activity.subject}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Badge color={am.color} bg={am.color + "18"}>{am.label}</Badge>
          <Badge color={sm.color} bg={sm.bg}>{sm.label}</Badge>
        </View>
      </View>

      {/* Detalhes de Teste / Prova */}
      {activity.type === "teste" && (
        <View style={[S.infoCard, { backgroundColor: th.card, borderColor: th.border }]}>
          <Text style={[S.sectionTitle, { color: th.muted }]}>INFORMAÇÕES DA AVALIAÇÃO</Text>

          <View style={S.infoRow}>
            <View style={[S.infoIconWrap, { backgroundColor: th.navyLight }]}>
              <AppIcon name="help-circle-outline" size={16} color={th.navy} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.infoLabel, { color: th.muted }]}>Formato da avaliação</Text>
              <Text style={[S.infoVal, { color: th.fg }]}>
                {formatLabels[activity.assessmentFormat || "nao_informado"]}
              </Text>
            </View>
          </View>

          <HDivider th={th} />

          <View style={S.infoRow}>
            <View style={[S.infoIconWrap, { backgroundColor: th.orangeLight }]}>
              <AppIcon name="calculator-outline" size={16} color={th.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.infoLabel, { color: th.muted }]}>Valor em pontos</Text>
              <Text style={[S.infoVal, { color: th.fg }]}>
                {activity.pointsValue !== null && activity.pointsValue !== undefined
                  ? `${activity.pointsValue} pontos`
                  : "Valor não informado"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Info grid */}
      <View style={[S.infoCard, { backgroundColor: th.card, borderColor: th.border }]}>
        {[
          { icon: "calendar-outline", label: "Prazo", val: activity.dueLabel + (activity.dueTime ? ` às ${activity.dueTime}` : "") },
          { icon: "person-outline", label: "Criado por", val: activity.createdByName },
          ...(activity.workMode === "individual"
            ? [{ icon: "person-outline", label: "Modalidade", val: "Trabalho Individual" }]
            : []),
        ].map((row, idx) => (
          <React.Fragment key={row.label}>
            <View style={S.infoRow}>
              <View style={[S.infoIconWrap, { backgroundColor: th.navyLight }]}>
                <AppIcon name={row.icon} size={16} color={th.navy} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[S.infoLabel, { color: th.muted }]}>{row.label}</Text>
                <Text style={[S.infoVal, { color: th.fg }]}>{row.val}</Text>
              </View>
            </View>
            {idx < 1 && <HDivider th={th} />}
          </React.Fragment>
        ))}
      </View>

      {/* Descrição */}
      {Boolean(activity.description) && (
        <View style={[S.infoCard, { backgroundColor: th.card, borderColor: th.border }]}>
          <Text style={[S.sectionTitle, { color: th.muted }]}>INSTRUÇÕES / DESCRIÇÃO</Text>
          <Text style={[S.descText, { color: th.fg }]}>{activity.description}</Text>
        </View>
      )}

      {/* Seção de Grupos para Trabalho em Grupo */}
      {activity.type === "trabalho" && activity.workMode === "groups" && (
        <View style={{ gap: 12 }}>
          <Text style={[S.sectionTitle, { color: th.muted, marginLeft: 4 }]}>DIVISÃO EM GRUPOS</Text>

          {/* Convites pendentes do usuário */}
          {myPendingInvitations.length > 0 && (
            <View style={[S.infoCard, { backgroundColor: th.orangeLight, borderColor: th.orange }]}>
              <Text style={[S.sectionTitle, { color: th.orange }]}>CONVITES RECEBIDOS</Text>
              {myPendingInvitations.map(({ inv, groupName }) => (
                <View key={inv.id} style={S.inviteRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.inviteText, { color: th.fg }]}>
                      Convite para o <Text style={{ fontWeight: "800" }}>{groupName}</Text>
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <TouchableOpacity
                      style={[S.smallBtn, { backgroundColor: th.card2 }]}
                      onPress={() => onRespondInvitation && onRespondInvitation(inv.id, "decline")}
                    >
                      <Text style={[S.smallBtnText, { color: th.fg }]}>Recusar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[S.smallBtn, { backgroundColor: th.orange }]}
                      onPress={() => onRespondInvitation && onRespondInvitation(inv.id, "accept")}
                    >
                      <Text style={[S.smallBtnText, { color: "#FFFFFF" }]}>Aceitar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Aviso para Criador/Owner */}
          {isClassOwner && (
            <View style={[S.infoCard, { backgroundColor: th.card2, borderColor: th.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <AppIcon name="information-circle-outline" size={18} color={th.muted} />
                <Text style={[S.helpText, { color: th.muted }]}>
                  Você é o coordenador/criador desta turma e gerencia a atividade sem pertencer a grupos.
                </Text>
              </View>
            </View>
          )}

          {/* Lista de Grupos */}
          {groups.length === 0 ? (
            <View style={[S.infoCard, { backgroundColor: th.card, borderColor: th.border }]}>
              <Text style={[S.descText, { color: th.muted }]}>Nenhum grupo gerado para esta atividade.</Text>
            </View>
          ) : (
            groups.map((grp) => {
              const isMemberOfThisGroup = grp.members.some((m) => m.userId === user.id);
              const isLeaderOfThisGroup = grp.leaderUserId === user.id;
              const isFull = grp.members.length >= grp.capacity;

              return (
                <View
                  key={grp.id}
                  style={[
                    S.groupCard,
                    {
                      backgroundColor: th.card,
                      borderColor: isMemberOfThisGroup ? th.orange : th.border,
                    },
                  ]}
                >
                  <View style={S.groupHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={[S.groupName, { color: th.fg }]}>{grp.name}</Text>
                        {isMemberOfThisGroup && (
                          <View style={[S.myGroupBadge, { backgroundColor: th.orangeLight }]}>
                            <Text style={[S.myGroupBadgeText, { color: th.orange }]}>Meu Grupo</Text>
                          </View>
                        )}
                      </View>
                      {Boolean(grp.description) && (
                        <Text style={[S.groupDesc, { color: th.muted }]}>{grp.description}</Text>
                      )}
                    </View>

                    <View style={[S.capBadge, { backgroundColor: isFull ? th.card2 : th.navyLight }]}>
                      <AppIcon name="people-outline" size={14} color={isFull ? th.muted : th.navy} />
                      <Text style={[S.capText, { color: isFull ? th.muted : th.navy }]}>
                        {grp.members.length}/{grp.capacity}
                      </Text>
                    </View>
                  </View>

                  {/* Membros do Grupo */}
                  <View style={S.memberList}>
                    {grp.members.length === 0 ? (
                      <Text style={[S.emptyGroupText, { color: th.muted }]}>Grupo ainda sem alunos</Text>
                    ) : (
                      grp.members.map((m) => {
                        const isLeader = grp.leaderUserId === m.userId;
                        const memberName = m.user?.name || "Aluno";
                        return (
                          <View key={m.id} style={S.memberRow}>
                            <View style={[S.avatarMini, { backgroundColor: isLeader ? th.orange : th.navy }]}>
                              <Text style={S.avatarTextMini}>{memberName.charAt(0).toUpperCase()}</Text>
                            </View>
                            <Text style={[S.memberName, { color: th.fg }]}>{memberName}</Text>
                            {isLeader && (
                              <View style={[S.leaderBadge, { backgroundColor: th.orangeLight }]}>
                                <AppIcon name="star-outline" size={10} color={th.orange} />
                                <Text style={[S.leaderText, { color: th.orange }]}>Líder</Text>
                              </View>
                            )}

                            {/* Remover membro pelo Líder ou Criador da Turma */}
                            {(isLeaderOfThisGroup || isClassOwner || myRole === "rep") && m.userId !== user.id && (
                              <TouchableOpacity
                                onPress={() => onRemoveGroupMember && onRemoveGroupMember(grp.id, m.userId)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <AppIcon name="close-circle-outline" size={16} color={th.muted} />
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })
                    )}
                  </View>

                  {/* Ações do Grupo */}
                  <View style={S.groupFooter}>
                    {!myGroup && !isClassOwner && !isFull && (
                      <Btn th={th} size="sm" variant="primary" onPress={() => onJoinGroup && onJoinGroup(grp.id)}>
                        Entrar no grupo
                      </Btn>
                    )}

                    {isMemberOfThisGroup && (
                      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", width: "100%" }}>
                        {isLeaderOfThisGroup && (
                          <>
                            <Btn
                              th={th}
                              size="sm"
                              variant="secondary"
                              iconName="create-outline"
                              onPress={() => {
                                setEditDescGroupId(grp.id);
                                setGroupDescText(grp.description || "");
                              }}
                            >
                              Tema do Grupo
                            </Btn>
                            <Btn
                              th={th}
                              size="sm"
                              variant="ghost"
                              iconName="person-add-outline"
                              onPress={() => setInviteModalGroupId(grp.id)}
                            >
                              Convidar
                            </Btn>
                          </>
                        )}

                        <Btn
                          th={th}
                          size="sm"
                          variant="danger"
                          iconName="log-out-outline"
                          onPress={() => setConfirmLeaveGroup(grp.id)}
                        >
                          Sair
                        </Btn>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Update progress */}
      <View style={[S.infoCard, { backgroundColor: th.card, borderColor: th.border }]}>
        <Text style={[S.sectionTitle, { color: th.muted }]}>MEU STATUS</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {STATUSES.map((st) => {
            const meta = STATUS_META[st];
            const active = st === status;
            return (
              <TouchableOpacity
                key={st}
                onPress={() => onSaveStatus(activity.id, st)}
                style={[
                  S.stChip,
                  {
                    borderColor: active ? meta.color : th.border,
                    backgroundColor: active ? meta.bg : th.card2,
                  },
                ]}
              >
                <Text style={[S.stText, { color: active ? meta.color : th.muted }]}>{meta.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Notes */}
      <View style={[S.infoCard, { backgroundColor: th.card, borderColor: th.border }]}>
        <Text style={[S.sectionTitle, { color: th.muted }]}>ANOTAÇÕES PESSOAIS</Text>
        <FTextarea
          th={th}
          value={localNotes}
          onChange={setLocalNotes}
          placeholder="Apenas você pode ver estas anotações..."
          rows={3}
          maxLen={500}
        />
        <Btn th={th} variant="secondary" size="sm" onPress={saveNotes}>
          {saved ? "Salvo ✓" : "Salvar anotações"}
        </Btn>
      </View>

      {/* Modal Editar Tema do Grupo */}
      <Modal visible={editDescGroupId !== null} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={S.modalOverlay}
        >
          <TouchableOpacity style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center" }} activeOpacity={1} onPress={() => setEditDescGroupId(null)}>
            <View style={[S.modalCard, { backgroundColor: th.card, borderColor: th.border }]}>
              <Text style={[S.modalTitle, { color: th.fg }]}>Tema / Descrição do Grupo</Text>
              <Text style={[S.modalSub, { color: th.muted }]}>Como líder, defina o tema do seu grupo:</Text>

              <FInput
                th={th}
                value={groupDescText}
                onChange={setGroupDescText}
                placeholder="Ex.: Foco na Parte 1 e Simulação"
                maxLen={100}
              />

              <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                <Btn th={th} variant="secondary" size="sm" onPress={() => setEditDescGroupId(null)}>
                  Cancelar
                </Btn>
                <Btn
                  th={th}
                  size="sm"
                  onPress={() => {
                    if (editDescGroupId && onUpdateGroupDesc) {
                      onUpdateGroupDesc(editDescGroupId, groupDescText.trim());
                    }
                    setEditDescGroupId(null);
                  }}
                >
                  Salvar
                </Btn>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Convidar Aluno */}
      <Modal visible={inviteModalGroupId !== null} transparent animationType="fade">
        <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={() => setInviteModalGroupId(null)}>
          <View style={[S.modalCard, { backgroundColor: th.card, borderColor: th.border }]}>
            <Text style={[S.modalTitle, { color: th.fg }]}>Convidar Aluno</Text>
            <Text style={[S.modalSub, { color: th.muted }]}>Selecione um aluno elegível da turma:</Text>

            {eligibleForInvite.length === 0 ? (
              <Text style={[S.emptyGroupText, { color: th.muted, marginVertical: 12 }]}>
                Nenhum aluno disponível para convite no momento.
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 200, width: "100%" }}>
                {eligibleForInvite.map((mem) => (
                  <TouchableOpacity
                    key={mem.id}
                    style={[S.inviteSelectRow, { borderColor: th.border }]}
                    onPress={() => {
                      if (inviteModalGroupId && onInviteMember) {
                        onInviteMember(inviteModalGroupId, mem.userId);
                      }
                      setInviteModalGroupId(null);
                    }}
                  >
                    <Text style={[S.memberName, { color: th.fg }]}>{mem.name}</Text>
                    <AppIcon name="add-circle-outline" size={18} color={th.orange} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={{ marginTop: 16 }}>
              <Btn th={th} variant="secondary" size="sm" onPress={() => setInviteModalGroupId(null)}>
                Fechar
              </Btn>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Confirmação de Sair do Grupo */}
      <ConfirmDialog
        visible={confirmLeaveGroup !== null}
        title="Sair do grupo?"
        message="Se você for o líder, a liderança será transferida para o membro mais antigo do grupo."
        confirmLabel="Sair do grupo"
        isDestructive
        onConfirm={() => {
          if (confirmLeaveGroup && onLeaveGroup) {
            onLeaveGroup(confirmLeaveGroup);
          }
          setConfirmLeaveGroup(null);
        }}
        onCancel={() => setConfirmLeaveGroup(null)}
        th={th}
      />
    </KeyboardAwareScreen>
  );
}

const S = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  hTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF", flex: 1, textAlign: "center" },
  body: { padding: 20, gap: 16, paddingBottom: 40 },
  card: { borderRadius: 16, borderWidth: 1, borderLeftWidth: 4, padding: 18, gap: 12 },
  actTitle: { fontSize: 18, fontWeight: "800" },
  actSubject: { fontSize: 13, marginTop: 2 },
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 11, fontWeight: "600" },
  infoVal: { fontSize: 14, fontWeight: "700", marginTop: 1 },
  descText: { fontSize: 14, lineHeight: 20 },
  stChip: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stText: { fontSize: 12, fontWeight: "700" },

  // Grupos
  groupCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  groupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  groupName: { fontSize: 16, fontWeight: "800" },
  groupDesc: { fontSize: 12, marginTop: 2 },
  myGroupBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  myGroupBadgeText: { fontSize: 10, fontWeight: "700" },
  capBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  capText: { fontSize: 12, fontWeight: "700" },
  memberList: { gap: 8 },
  emptyGroupText: { fontSize: 12, fontStyle: "italic" },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatarMini: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  avatarTextMini: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  memberName: { fontSize: 13, flex: 1 },
  leaderBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  leaderText: { fontSize: 10, fontWeight: "700" },
  groupFooter: { flexDirection: "row", justifyContent: "flex-end" },
  inviteRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  inviteText: { fontSize: 13 },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  smallBtnText: { fontSize: 12, fontWeight: "700" },
  helpText: { flex: 1, fontSize: 12, lineHeight: 17 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", maxWidth: 340, borderRadius: 24, borderWidth: 1, padding: 20, alignItems: "center" },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  modalSub: { fontSize: 12, marginTop: 4, marginBottom: 14, textAlign: "center" },
  inviteSelectRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, width: "100%" },
});
