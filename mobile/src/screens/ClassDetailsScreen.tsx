import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { theme } from '../theme/theme';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ActivityItem from '../components/ActivityItem';
import AnnouncementCard from '../components/AnnouncementCard';

export default function ClassDetailsScreen({ route, navigation }: any) {
  const { classId, className } = route.params;
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'activities' | 'announcements' | 'members'>('activities');
  const [classDetails, setClassDetails] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [myRole, setMyRole] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const classRes = await api.get(`/classes/${classId}`);
      setClassDetails(classRes.data.class);
      setMyRole(classRes.data.class.my_role || 'student');

      const actRes = await api.get(`/classes/${classId}/activities`);
      setActivities(actRes.data.activities || []);

      const annRes = await api.get(`/classes/${classId}/announcements`);
      setAnnouncements(annRes.data.announcements || []);

      const memRes = await api.get(`/classes/${classId}/members`);
      setMembers(memRes.data.members || []);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível carregar os dados desta turma.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  const handleStatusChange = async (activityId: number, newStatus: 'todo' | 'in_progress' | 'done') => {
    setActivities((prev) =>
      prev.map((act) => {
        if (act.id === activityId) {
          return {
            ...act,
            user_progress: {
              ...act.user_progress,
              status: newStatus,
            },
          };
        }
        return act;
      })
    );

    try {
      await api.put(`/activities/${activityId}/progress`, {
        status: newStatus,
      });
    } catch (err) {
      console.error('Erro ao atualizar progresso:', err);
      Alert.alert('Erro', 'Não foi possível salvar o progresso no servidor.');
      fetchData();
    }
  };

  const handleMemberAction = (targetUser: any, action: 'promote' | 'demote' | 'kick') => {
    let actionUrl = `/classes/${classId}/members/${targetUser.id}`;
    let method: 'put' | 'delete' = 'put';
    let title = '';
    let message = '';

    if (action === 'promote') {
      actionUrl += '/promote';
      title = 'Promover Membro';
      message = `Deseja promover ${targetUser.name} a Representante?`;
    } else if (action === 'demote') {
      actionUrl += '/demote';
      title = 'Rebaixar Membro';
      message = `Deseja rebaixar o representante ${targetUser.name} a Aluno comum?`;
    } else {
      method = 'delete';
      title = 'Expulsar Membro';
      message = `Tem certeza que deseja expulsar ${targetUser.name} desta turma?`;
    }

    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        style: action === 'kick' ? 'destructive' : 'default',
        onPress: async () => {
          try {
            if (method === 'put') {
              await api.put(actionUrl);
            } else {
              await api.delete(actionUrl);
            }
            Alert.alert('Sucesso', 'Operação realizada com sucesso.');
            fetchData();
          } catch (err: any) {
            const msg = err.response?.data?.message || 'Erro ao processar ação.';
            Alert.alert('Erro', msg);
          }
        },
      },
    ]);
  };

  const getMemberInitials = (name: string) => {
    return name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
  };

  const getMemberAvatarBg = (role: string) => {
    switch (role) {
      case 'owner':
        return theme.colors.secondary; // Orange accent
      case 'rep':
        return theme.colors.primary; // Navy accent
      default:
        return '#6b7a9a'; // Student slate
    }
  };

  const isModerator = myRole === 'owner' || myRole === 'rep';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Area */}
      <View style={styles.headerBackground}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        
        <Text style={styles.classSubtitle}>
          {classDetails?.period || 'Sem Período'} · {classDetails?.course || 'Sem Curso'}
        </Text>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle} numberOfLines={1}>{className}</Text>
          {isModerator && (
            <TouchableOpacity
              style={styles.panelButton}
              onPress={() => navigation.navigate('RepPanel', { classId })}
            >
              <Text style={styles.panelButtonText}>★ Painel</Text>
            </TouchableOpacity>
          )}
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {myRole === 'owner' ? 'CRIADOR' : myRole === 'rep' ? 'REPRESENTANTE' : 'ALUNO'}
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs Selector */}
      <View style={styles.tabsContainer}>
        {(['activities', 'announcements', 'members'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'activities' ? 'Atividades' : tab === 'announcements' ? 'Avisos' : 'Membros'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <View style={styles.content}>
          {activeTab === 'activities' && (
            <View style={{ flex: 1 }}>
              {isModerator && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => navigation.navigate('CreateActivity', { classId })}
                >
                  <Text style={styles.addButtonText}>+ Criar Atividade</Text>
                </TouchableOpacity>
              )}
              <FlatList
                data={activities}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <ActivityItem
                    activity={item}
                    onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id, isModerator })}
                    onStatusChange={(newStatus) => handleStatusChange(item.id, newStatus)}
                  />
                )}
                ListEmptyComponent={
                  <View style={styles.emptyView}>
                    <Text style={styles.emptyIcon}>📚</Text>
                    <Text style={styles.emptyText}>Nenhuma atividade cadastrada nesta turma.</Text>
                  </View>
                }
              />
            </View>
          )}

          {activeTab === 'announcements' && (
            <View style={{ flex: 1 }}>
              {isModerator && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => navigation.navigate('CreateAnnouncement', { classId })}
                >
                  <Text style={styles.addButtonText}>+ Criar Aviso</Text>
                </TouchableOpacity>
              )}
              <FlatList
                data={announcements}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <AnnouncementCard announcement={item} />}
                ListEmptyComponent={
                  <View style={styles.emptyView}>
                    <Text style={styles.emptyIcon}>📢</Text>
                    <Text style={styles.emptyText}>Nenhum aviso ativo por aqui.</Text>
                  </View>
                }
              />
            </View>
          )}

          {activeTab === 'members' && (
            <View style={{ flex: 1 }}>
              {classDetails?.code && (
                <View style={styles.codeShareCard}>
                  <Text style={styles.codeShareTitle}>Código de Convite da Turma</Text>
                  <Text style={styles.codeShareText}>{classDetails.code}</Text>
                </View>
              )}
              <FlatList
                data={members}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                  const memberUser = item.user;
                  const isTargetOwner = item.role === 'owner';
                  const isTargetRep = item.role === 'rep';
                  const isMe = memberUser.id === user?.id;

                  return (
                    <View style={styles.memberCard}>
                      <View style={styles.memberLeftInfo}>
                        <View style={[styles.avatarCircle, { backgroundColor: getMemberAvatarBg(item.role) }]}>
                          <Text style={styles.avatarText}>{getMemberInitials(memberUser.name)}</Text>
                          {item.role !== 'student' && (
                            <View style={[styles.avatarBadge, { backgroundColor: isTargetOwner ? theme.colors.secondary : theme.colors.primary }]}>
                              <Text style={styles.avatarBadgeText}>★</Text>
                            </View>
                          )}
                        </View>
                        <View>
                          <Text style={styles.memberName}>{memberUser.name} {isMe && '(Você)'}</Text>
                          <Text style={styles.memberRole}>
                            {isTargetOwner ? 'Criador' : isTargetRep ? 'Representante' : 'Aluno'}
                          </Text>
                        </View>
                      </View>

                      {/* Moderator Controls */}
                      {isModerator && !isMe && !isTargetOwner && (
                        <View style={styles.actionsRow}>
                          {myRole === 'owner' && isTargetRep && (
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.btnDemote]}
                              onPress={() => handleMemberAction(memberUser, 'demote')}
                            >
                              <Text style={styles.actionBtnText}>Rebaixar</Text>
                            </TouchableOpacity>
                          )}
                          {!isTargetRep && (
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.btnPromote]}
                              onPress={() => handleMemberAction(memberUser, 'promote')}
                            >
                              <Text style={styles.actionBtnText}>Promover</Text>
                            </TouchableOpacity>
                          )}
                          {(myRole === 'owner' || !isTargetRep) && (
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.btnKick]}
                              onPress={() => handleMemberAction(memberUser, 'kick')}
                            >
                              <Text style={styles.actionBtnText}>Expulsar</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  );
                }}
              />
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerBackground: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: theme.spacing.sm,
  },
  backButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  classSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    flex: 1,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.secondary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.secondary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyView: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: '#e4822e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 2,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  codeShareCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    marginBottom: 14,
  },
  codeShareTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  codeShareText: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  memberLeftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  avatarBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  memberRole: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 6,
  },
  btnPromote: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  btnDemote: {
    backgroundColor: 'rgba(228, 130, 46, 0.08)',
    borderWidth: 1,
    borderColor: theme.colors.secondary,
  },
  btnKick: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text,
  },
  panelButton: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 6,
  },
  panelButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
