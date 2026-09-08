import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, ActivityIndicator, StyleSheet, useColorScheme, Linking } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import api from "./src/services/api";
import ErrorBoundary from "./src/components/ErrorBoundary";
import OfflineBanner from "./src/components/OfflineBanner";

import type {
  Screen, AppUser, AppClass, Activity, ActivityStatus, Announcement, Member, ToastItem, AppTheme
} from "./src/types";
import {
  LIGHT, DARK,
  nid, makeCode, TODAY_ISO, fmtDueLabel
} from "./src/constants";

import ToastLayer from "./src/components/ToastLayer";
import MemberSheet from "./src/components/MemberSheet";
import { extractInviteCode } from "./src/utils/inviteLinks";

import WelcomeScreen      from "./src/screens/WelcomeScreen";
import LoginScreen        from "./src/screens/LoginScreen";
import RegisterScreen     from "./src/screens/RegisterScreen";
import DashboardScreen    from "./src/screens/DashboardScreen";
import CreateClassScreen  from "./src/screens/CreateClassScreen";
import ClassCreatedScreen from "./src/screens/ClassCreatedScreen";
import JoinClassScreen    from "./src/screens/JoinClassScreen";
import ClassHomeScreen    from "./src/screens/ClassHomeScreen";
import ActivityDetailScreen from "./src/screens/ActivityDetailScreen";
import AnnouncementDetailScreen from "./src/screens/AnnouncementDetailScreen";
import NotificationsScreen  from "./src/screens/NotificationsScreen";
import EventsScreen         from "./src/screens/EventsScreen";
import ProfileScreen        from "./src/screens/ProfileScreen";
import SettingsScreen, { ThemeMode } from "./src/screens/SettingsScreen";
import AboutScreen          from "./src/screens/AboutScreen";
import RepPanelScreen       from "./src/screens/RepPanelScreen";
import ActivityFormScreen   from "./src/screens/ActivityFormScreen";
import AnnouncementFormScreen from "./src/screens/AnnouncementFormScreen";

function mapBackendClass(c: any): AppClass {
  return {
    id: String(c.id),
    code: c.code || "",
    name: c.name || "",
    course: c.course || "",
    institution: c.institution || "",
    period: c.period || "",
    modality: c.modality || "presencial",
    isOpen: c.is_open !== undefined ? Boolean(c.is_open) : true,
    ownerId: String(c.owner_id || c.user_id || ""),
    members: (c.members || []).map((m: any) => ({
      id: String(m.id),
      userId: String(m.user_id || m.user?.id || m.id),
      name: m.user?.name || m.name || "Membro",
      email: m.user?.email || m.email || "",
      classRole: m.role || m.classRole || "student",
      joinedAt: m.joined_at ? String(m.joined_at).slice(0, 10) : TODAY_ISO,
    })),
    announcements: (c.announcements || []).map((a: any) => ({
      id: String(a.id),
      title: a.title || "",
      desc: a.content || a.description || a.desc || "",
      content: a.content || a.description || a.desc || "",
      priority: a.priority || "media",
      authorId: String(a.author_id || a.user_id || ""),
      authorName: a.author?.name || a.authorName || "Representante",
      date: a.created_at ? new Date(a.created_at).toLocaleDateString("pt-BR") : "Hoje",
      createdAt: a.created_at || new Date().toISOString(),
      expiresAt: a.expires_at || a.expiresAt || null,
    })),
    activities: (c.activities || []).map((act: any) => ({
      id: String(act.id),
      title: act.title || "",
      type: act.type || "dever",
      workMode: act.work_mode || undefined,
      groupSize: act.group_size ? Number(act.group_size) : undefined,
      assessmentFormat: act.assessment_format || undefined,
      pointsValue: act.points_value !== null && act.points_value !== undefined ? Number(act.points_value) : undefined,
      subject: act.subject || "",
      dueDate: act.due_date || TODAY_ISO,
      dueTime: act.due_time || undefined,
      dueLabel: fmtDueLabel(act.due_date || TODAY_ISO),
      description: act.description || "",
      createdById: String(act.created_by_id || act.created_by || ""),
      createdByName: act.creator?.name || act.createdByName || "Criador",
      groups: (act.groups || []).map((g: any) => ({
        id: String(g.id),
        activityId: String(g.activity_id),
        name: g.name || "",
        capacity: Number(g.capacity || 2),
        leaderUserId: g.leader_user_id ? String(g.leader_user_id) : null,
        description: g.description || null,
        leader: g.leader ? { id: String(g.leader.id), name: g.leader.name, email: g.leader.email } : null,
        members: (g.members || []).map((m: any) => ({
          id: String(m.id),
          activityGroupId: String(m.activity_group_id),
          userId: String(m.user_id),
          joinedAt: String(m.joined_at || ""),
          user: m.user ? { id: String(m.user.id), name: m.user.name, email: m.user.email } : undefined,
        })),
        invitations: (g.invitations || []).map((inv: any) => ({
          id: String(inv.id),
          activityGroupId: String(inv.activity_group_id),
          invitedUserId: String(inv.invited_user_id),
          invitedByUserId: String(inv.invited_by_user_id),
          status: inv.status || "pending",
          invitedUser: inv.invited_user ? { id: String(inv.invited_user.id), name: inv.invited_user.name, email: inv.invited_user.email } : undefined,
          invitedBy: inv.invited_by ? { id: String(inv.invited_by.id), name: inv.invited_by.name, email: inv.invited_by.email } : undefined,
        })),
      })),
    })),
    events: (c.events || []).map((e: any) => {
      const parts = (e.event_date || TODAY_ISO).split("-");
      return {
        id: String(e.id),
        title: e.title || "",
        day: parseInt(parts[2] || "28", 10),
        month: parseInt(parts[1] || "5", 10),
        type: e.type || "entrega",
        subject: e.subject || undefined,
        room: e.room || undefined,
      };
    }),
  };
}

function MainApp() {
  const { user: authUser, login: authLogin, register: authRegister, logout: authLogout, signed } = useAuth();
  const systemScheme = useColorScheme();

  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [reduceMotion, setReduceMotionState] = useState<boolean>(false);

  const [screen, setScreen] = useState<Screen>("welcome");
  const [classes, setClasses] = useState<AppClass[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ActivityStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [readSet, setReadSet] = useState<Set<string>>(new Set());
  const [viewActId, setViewActId] = useState<string | null>(null);
  const [viewAnnId, setViewAnnId] = useState<string | null>(null);
  const [editActId, setEditActId] = useState<string | null>(null);
  const [createdCls, setCreatedCls] = useState<AppClass | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [memberSheet, setMemberSheet] = useState<Member | null>(null);
  const [editAnnId, setEditAnnId] = useState<string | null>(null);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [pendingJoinCode, setPendingJoinCode] = useState<string | null>(null);

  const receiveInviteUrl = useCallback((url: string) => {
    const code = extractInviteCode(url);
    if (code) setPendingJoinCode(code);
  }, []);

  useEffect(() => {
    let mounted = true;
    Linking.getInitialURL().then((url) => {
      if (mounted && url) receiveInviteUrl(url);
    }).catch(() => {});

    const subscription = Linking.addEventListener("url", ({ url }) => receiveInviteUrl(url));
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [receiveInviteUrl]);

  useEffect(() => {
    if (signed && pendingJoinCode) setScreen("joinClass");
  }, [signed, pendingJoinCode]);

  // Load preferences from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem("@anot_theme_pref").then(val => {
      if (val === "system" || val === "light" || val === "dark") {
        setThemeModeState(val as ThemeMode);
      }
    }).catch(() => {});

    AsyncStorage.getItem("@anot_reduce_motion").then(val => {
      if (val !== null) setReduceMotionState(val === "true");
    }).catch(() => {});
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem("@anot_theme_pref", mode).catch(() => {});
  }, []);

  const setReduceMotion = useCallback((val: boolean) => {
    setReduceMotionState(val);
    AsyncStorage.setItem("@anot_reduce_motion", String(val)).catch(() => {});
  }, []);

  const th: AppTheme = useMemo(() => {
    if (themeMode === "system") {
      return systemScheme === "dark" ? DARK : LIGHT;
    }
    return themeMode === "dark" ? DARK : LIGHT;
  }, [themeMode, systemScheme]);

  const activeClass = classes.find(c => c.id === activeId) ?? null;

  const appUser: AppUser | null = useMemo(() => authUser ? {
    id: String(authUser.id),
    name: authUser.name,
    email: authUser.email
  } : null, [authUser?.id, authUser?.name, authUser?.email]);

  // Toast Function
  const toast = useCallback((msg: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-2), { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2800);
  }, []);

  const handleClearCache = useCallback(() => {
    AsyncStorage.clear().then(() => {
      toast("Cache local limpo com sucesso!");
    }).catch(() => {
      toast("Erro ao limpar cache local", "error");
    });
  }, [toast]);

  // Sync auth state to initial screen
  useEffect(() => {
    if (signed && screen === "welcome") {
      setScreen("dashboard");
    }
  }, [signed]);

  // Load Classes from API when signed in or user changes
  const fetchClassesFromApi = useCallback(async () => {
    if (!signed) return;
    setIsLoadingClasses(true);

    try {
      const response = await api.get('/classes');
      const backendClasses = Array.isArray(response.data) ? response.data : (response.data.classes || []);
      const mapped = backendClasses.map(mapBackendClass);
      setClasses(mapped);
    } catch (err: any) {
      console.log('Error fetching classes:', err);
      toast("Erro ao carregar turmas", "error");
    } finally {
      setIsLoadingClasses(false);
    }
  }, [signed, toast]);

  useEffect(() => {
    if (signed) {
      fetchClassesFromApi();
    } else {
      setClasses([]);
      setActiveId(null);
    }
  }, [signed, fetchClassesFromApi]);

  // Standardized API error handler
  const handleApiError = useCallback((err: any, defaultMsg: string) => {
    if (err.response?.status === 401) {
      authLogout();
      setClasses([]);
      setActiveId(null);
      setScreen("welcome");
      toast("Sua sessão expirou. Por favor, faça login novamente.", "error");
      return;
    }

    let msg = defaultMsg;
    if (err.response?.status === 422) {
      if (err.response.data?.errors) {
        const firstKey = Object.keys(err.response.data.errors)[0];
        const firstErr = err.response.data.errors[firstKey];
        msg = Array.isArray(firstErr) ? firstErr[0] : String(firstErr);
      } else if (err.response.data?.message) {
        msg = err.response.data.message;
      }
    } else if (err.response?.status >= 500) {
      msg = "Ocorreu um erro no servidor. Tente novamente mais tarde.";
    } else if (err.response?.data?.message) {
      msg = err.response.data.message;
    }
    toast(msg, "error");
  }, [authLogout, toast]);

  // Auth wrappers
  async function doLogin(email: string, pw: string) {
    setIsSubmittingForm(true);
    try {
      await authLogin(email, pw);
      setScreen("dashboard");
      toast("Bem-vindo(a) ao ANOT!");
    } catch (err: any) {
      handleApiError(err, "Usuário ou senha inválidos.");
    } finally {
      setIsSubmittingForm(false);
    }
  }

  async function doRegister(name: string, email: string, pw: string) {
    setIsSubmittingForm(true);
    try {
      await authRegister(name, email, pw);
      setScreen("dashboard");
      toast("Conta criada com sucesso!");
    } catch (err: any) {
      handleApiError(err, "Erro ao criar conta. Verifique os dados.");
    } finally {
      setIsSubmittingForm(false);
    }
  }

  function doLogout() {
    authLogout();
    setClasses([]);
    setActiveId(null);
    setScreen("welcome");
    toast("Você saiu da conta.");
  }

  // Class CRUD Handlers
  async function doCreateClass(data: { name: string; course: string; institution: string; period: string; modality: "presencial" | "ead" | "hibrido" }) {
    if (!appUser) return;
    setIsSubmittingForm(true);
    try {
      const response = await api.post('/classes', data);
      const newBackendCls = response.data.class;
      const newCls = mapBackendClass(newBackendCls);
      setClasses(prev => [newCls, ...prev]);
      setCreatedCls(newCls);
      setActiveId(newCls.id);
      setScreen("classCreated");
      toast("Turma criada com sucesso!");
    } catch (err: any) {
      handleApiError(err, "Erro ao criar turma no servidor.");
    } finally {
      setIsSubmittingForm(false);
    }
  }

  async function doJoin(code: string) {
    if (!appUser) return;
    setIsSubmittingForm(true);
    try {
      const response = await api.post('/classes/join', { code });
      const joinedBackendCls = response.data.class;
      const mapped = mapBackendClass(joinedBackendCls);
      setClasses(prev => {
        const exists = prev.some(c => c.id === mapped.id);
        return exists ? prev.map(c => c.id === mapped.id ? mapped : c) : [mapped, ...prev];
      });
      setActiveId(mapped.id);
      setScreen("classHome");
      toast("Entrou na turma com sucesso!");
    } catch (err: any) {
      handleApiError(err, "Código inválido ou turma não encontrada.");
    } finally {
      setIsSubmittingForm(false);
    }
  }

  async function doDeleteClass() {
    if (!activeId) return;
    try {
      await api.delete(`/classes/${activeId}`);
      setClasses(prev => prev.filter(c => c.id !== activeId));
      setActiveId(null);
      setScreen("dashboard");
      toast("Turma excluída com sucesso.");
    } catch (err: any) {
      handleApiError(err, "Erro ao excluir turma.");
    }
  }

  // Announcements Handlers
  async function doAddAnn(cls: AppClass, data: Omit<Announcement, "id" | "authorId" | "authorName" | "date" | "createdAt">): Promise<boolean> {
    if (!appUser) return false;
    try {
      await api.post(`/classes/${cls.id}/announcements`, {
        title: data.title,
        content: data.desc || data.content,
        priority: data.priority,
      });
      await fetchClassesFromApi();
      toast("Aviso publicado!");
      return true;
    } catch (err: any) {
      handleApiError(err, "Erro ao publicar aviso.");
      return false;
    }
  }

  async function doEditAnn(cls: AppClass, id: string, data: Partial<Announcement>): Promise<boolean> {
    try {
      await api.put(`/announcements/${id}`, {
        title: data.title,
        content: data.desc || data.content,
        priority: data.priority,
      });
      await fetchClassesFromApi();
      toast("Aviso atualizado!");
      return true;
    } catch (err: any) {
      handleApiError(err, "Erro ao atualizar aviso.");
      return false;
    }
  }

  async function doDelAnn(cls: AppClass, id: string): Promise<boolean> {
    try {
      await api.delete(`/announcements/${id}`);
      await fetchClassesFromApi();
      toast("Aviso removido.");
      return true;
    } catch (err: any) {
      handleApiError(err, "Erro ao remover aviso.");
      return false;
    }
  }

  // Activities Handlers
  async function doSaveActivity(cls: AppClass, data: Omit<Activity, "id" | "createdById" | "createdByName">, existingId?: string): Promise<boolean> {
    if (!appUser) return false;
    try {
      if (existingId) {
        await api.put(`/activities/${existingId}`, {
          title: data.title,
          type: data.type,
          work_mode: data.workMode,
          group_size: data.groupSize,
          assessment_format: data.assessmentFormat,
          points_value: data.pointsValue,
          subject: data.subject,
          due_date: data.dueDate,
          due_time: data.dueTime,
          description: data.description,
        });
      } else {
        await api.post(`/classes/${cls.id}/activities`, {
          title: data.title,
          type: data.type,
          work_mode: data.workMode,
          group_size: data.groupSize,
          assessment_format: data.assessmentFormat,
          points_value: data.pointsValue,
          subject: data.subject,
          due_date: data.dueDate,
          due_time: data.dueTime,
          description: data.description,
        });
      }
      await fetchClassesFromApi();
      toast(existingId ? "Atividade atualizada!" : "Atividade criada!");
      return true;
    } catch (err: any) {
      handleApiError(err, "Não foi possível salvar a atividade. Tente novamente.");
      return false;
    }
  }

  async function doDelActivity(cls: AppClass, id: string): Promise<boolean> {
    try {
      await api.delete(`/activities/${id}`);
      await fetchClassesFromApi();
      toast("Atividade removida.");
      return true;
    } catch (err: any) {
      handleApiError(err, "Erro ao remover atividade.");
      return false;
    }
  }

  // Activity Groups Handlers
  async function doJoinGroup(groupId: string) {
    try {
      const res = await api.post(`/activity-groups/${groupId}/join`);
      await fetchClassesFromApi();
      toast(res.data?.message || "Você entrou no grupo!");
    } catch (err: any) {
      handleApiError(err, "Erro ao entrar no grupo.");
    }
  }

  async function doLeaveGroup(groupId: string) {
    try {
      const res = await api.post(`/activity-groups/${groupId}/leave`);
      await fetchClassesFromApi();
      toast(res.data?.message || "Você saiu do grupo.");
    } catch (err: any) {
      handleApiError(err, "Erro ao sair do grupo.");
    }
  }

  async function doUpdateGroupDesc(groupId: string, description: string) {
    try {
      const res = await api.put(`/activity-groups/${groupId}/description`, { description });
      await fetchClassesFromApi();
      toast(res.data?.message || "Tema do grupo atualizado!");
    } catch (err: any) {
      handleApiError(err, "Erro ao atualizar descrição do grupo.");
    }
  }

  async function doInviteMember(groupId: string, invitedUserId: string) {
    try {
      const res = await api.post(`/activity-groups/${groupId}/invite`, { invited_user_id: invitedUserId });
      await fetchClassesFromApi();
      toast(res.data?.message || "Convite enviado com sucesso!");
    } catch (err: any) {
      handleApiError(err, "Erro ao enviar convite.");
    }
  }

  async function doRespondInvitation(invitationId: string, action: "accept" | "decline") {
    try {
      const res = await api.post(`/group-invitations/${invitationId}/respond`, { action });
      await fetchClassesFromApi();
      toast(res.data?.message || (action === "accept" ? "Convite aceito!" : "Convite recusado."));
    } catch (err: any) {
      handleApiError(err, "Erro ao responder convite.");
    }
  }

  async function doRemoveGroupMember(groupId: string, targetUserId: string) {
    try {
      const res = await api.delete(`/activity-groups/${groupId}/members/${targetUserId}`);
      await fetchClassesFromApi();
      toast(res.data?.message || "Membro removido do grupo.");
    } catch (err: any) {
      handleApiError(err, "Erro ao remover membro do grupo.");
    }
  }

  // Member Moderation Handlers
  async function doPromote(cls: AppClass, memberId: string) {
    try {
      const m = cls.members.find(mem => mem.id === memberId);
      if (m) await api.put(`/classes/${cls.id}/members/${m.userId}/promote`);
      await fetchClassesFromApi();
      toast("Membro promovido a representante!");
    } catch (err: any) {
      handleApiError(err, "Erro ao promover membro.");
    }
  }

  async function doDemote(cls: AppClass, memberId: string) {
    try {
      const m = cls.members.find(mem => mem.id === memberId);
      if (m) await api.put(`/classes/${cls.id}/members/${m.userId}/demote`);
      await fetchClassesFromApi();
      toast("Membro rebaixado para aluno.");
    } catch (err: any) {
      handleApiError(err, "Erro ao rebaixar membro.");
    }
  }

  async function doExpel(cls: AppClass, memberId: string) {
    try {
      const m = cls.members.find(mem => mem.id === memberId);
      if (m) await api.delete(`/classes/${cls.id}/members/${m.userId}`);
      await fetchClassesFromApi();
      toast("Membro removido da turma.");
    } catch (err: any) {
      handleApiError(err, "Erro ao remover membro.");
    }
  }

  // Progress & Notes (Persisted to API)
  async function doSaveStatus(actId: string, s: ActivityStatus) {
    try {
      await api.put(`/activities/${actId}/progress`, { status: s, personal_notes: notes[actId] ?? "" });
      setStatuses(prev => ({ ...prev, [actId]: s }));
    } catch (err: any) {
      handleApiError(err, "Erro ao salvar status da atividade.");
    }
  }

  async function doSaveNotes(actId: string, n: string) {
    try {
      await api.put(`/activities/${actId}/progress`, { status: statuses[actId] ?? "todo", personal_notes: n });
      setNotes(prev => ({ ...prev, [actId]: n }));
    } catch (err: any) {
      handleApiError(err, "Erro ao salvar anotações.");
    }
  }

  // Read announcements tracking
  function doMarkRead(annId: string) {
    setReadSet(prev => new Set(prev).add(annId));
  }

  // Navigation helpers
  function nav(s: Screen) { setScreen(s); }
  function goClassHome()  { setScreen("classHome"); }

  // Screen Rendering Router
  function renderInner(): React.ReactElement | null {
    if (screen === "welcome")  return <WelcomeScreen onLogin={() => nav("login")} onRegister={() => nav("register")} th={th}/>;
    if (screen === "login")    return <LoginScreen onLogin={doLogin} onBack={() => nav("welcome")} onRegister={() => nav("register")} loading={isSubmittingForm} th={th}/>;
    if (screen === "register") return <RegisterScreen onRegister={doRegister} onBack={() => nav("login")} loading={isSubmittingForm} th={th}/>;

    if (!appUser) return <WelcomeScreen onLogin={() => nav("login")} onRegister={() => nav("register")} th={th}/>;

    if (screen === "dashboard") return (
      <DashboardScreen user={appUser} classes={classes} loading={isLoadingClasses}
        onSelectClass={id => { setActiveId(id); nav("classHome"); }}
        onCreateClass={() => nav("createClass")} onJoinClass={() => nav("joinClass")}
        onProfile={() => nav("profile")} onSettings={() => nav("settings")} th={th}/>
    );

    if (screen === "createClass") return (
      <CreateClassScreen onSubmit={doCreateClass} onBack={() => nav("dashboard")} loading={isSubmittingForm} th={th}/>
    );

    if (screen === "classCreated" && createdCls) return (
      <ClassCreatedScreen cls={createdCls}
        onGo={() => { setActiveId(createdCls.id); nav("classHome"); }}
        onDash={() => nav("dashboard")} th={th}/>
    );

    if (screen === "joinClass") return (
      <JoinClassScreen
        onJoin={doJoin}
        onBack={() => nav("dashboard")}
        loading={isSubmittingForm}
        th={th}
        initialCode={pendingJoinCode ?? undefined}
        onInitialCodeApplied={() => setPendingJoinCode(null)}
      />
    );

    if (screen === "profile") return (
      <ProfileScreen user={appUser} classes={classes} statuses={statuses}
        onNav={nav} onSettings={() => nav("settings")} onAbout={() => nav("about")}
        onLogout={doLogout} th={th}/>
    );

    if (screen === "settings") return (
      <SettingsScreen
        themeMode={themeMode}
        onSelectThemeMode={setThemeMode}
        reduceMotion={reduceMotion}
        onToggleReduceMotion={setReduceMotion}
        onClearCache={handleClearCache}
        onBack={() => nav("profile")}
        th={th}
      />
    );

    if (screen === "about") return <AboutScreen onBack={() => nav("profile")} th={th}/>;

    if (!activeClass) return (
      <DashboardScreen user={appUser} classes={classes} loading={isLoadingClasses}
        onSelectClass={id => { setActiveId(id); nav("classHome"); }}
        onCreateClass={() => nav("createClass")} onJoinClass={() => nav("joinClass")}
        onProfile={() => nav("profile")} onSettings={() => nav("settings")} th={th}/>
    );

    const myRole = activeClass.members.find(m => m.userId === appUser.id)?.classRole ?? "student";

    async function doToggleOpenClass(cls: AppClass) {
      try {
        const response = await api.put(`/classes/${cls.id}/toggle-open`);
        fetchClassesFromApi();
        toast(response.data?.message || "Status da turma atualizado!");
      } catch (err: any) {
        const msg = err.response?.data?.message || "Erro ao alterar status da turma";
        toast(msg, "error");
      }
    }

    async function doRegenerateCode(cls: AppClass) {
      try {
        const response = await api.put(`/classes/${cls.id}/regenerate-code`);
        fetchClassesFromApi();
        toast(response.data?.message || "Novo código de acesso gerado com sucesso!");
      } catch (err: any) {
        const msg = err.response?.data?.message || "Erro ao regerar código de acesso";
        toast(msg, "error");
      }
    }

    if (screen === "classHome") return (
      <ClassHomeScreen cls={activeClass} user={appUser} statuses={statuses} readSet={readSet}
        onNav={nav}
        onViewActivity={id => { setViewActId(id); nav("activityDetail"); }}
        onViewAnnouncement={id => { setViewAnnId(id); nav("announcementDetail"); }}
        onCopyCode={() => toast("Código copiado!")}
        onToggleOpen={() => doToggleOpenClass(activeClass)}
        onRepPanel={() => nav("repPanel")} onBack={() => nav("dashboard")} th={th}/>
    );

    if (screen === "announcementDetail" && viewAnnId) {
      const ann = activeClass.announcements.find(a => a.id === viewAnnId);
      return (
        <AnnouncementDetailScreen
          announcement={ann}
          user={appUser}
          myRole={myRole}
          onEdit={id => { setEditAnnId(id); nav("announcementForm"); }}
          onDelete={async id => { if (await doDelAnn(activeClass, id)) nav("classHome"); }}
          onBack={() => nav("classHome")}
          th={th}
        />
      );
    }

    if (screen === "activityDetail" && viewActId) {
      const act = activeClass.activities.find(a => a.id === viewActId);
      if (!act) return null;
      return (
        <ActivityDetailScreen
          activity={act}
          status={statuses[act.id] ?? "todo"}
          notes={notes[act.id] ?? ""}
          user={appUser}
          myRole={myRole}
          classMembers={activeClass.members}
          onSaveStatus={doSaveStatus}
          onSaveNotes={doSaveNotes}
          onJoinGroup={doJoinGroup}
          onLeaveGroup={doLeaveGroup}
          onUpdateGroupDesc={doUpdateGroupDesc}
          onInviteMember={doInviteMember}
          onRespondInvitation={doRespondInvitation}
          onRemoveGroupMember={doRemoveGroupMember}
          onBack={() => nav("classHome")}
          th={th}
        />
      );
    }

    if (screen === "notifications") return (
      <NotificationsScreen cls={activeClass} user={appUser} readSet={readSet}
        onMarkRead={doMarkRead}
        onViewAnnouncement={id => { setViewAnnId(id); nav("announcementDetail"); }}
        onNav={nav} th={th}/>
    );

    if (screen === "events") return (
      <EventsScreen cls={activeClass} user={appUser} onNav={nav} th={th}/>
    );

    if (screen === "repPanel") return (
      <>
        <RepPanelScreen cls={activeClass} user={appUser}
          onAddAnn={() => { setEditAnnId(null); nav("announcementForm"); }}
          onEditAnn={id => { setEditAnnId(id); nav("announcementForm"); }}
          onDelAnn={id => doDelAnn(activeClass, id)}
          onViewAnn={id => { setViewAnnId(id); nav("announcementDetail"); }}
          onAddActivity={() => { setEditActId(null); nav("activityForm"); }}
          onEditActivity={id => { setEditActId(id); nav("activityForm"); }}
          onDelActivity={id => doDelActivity(activeClass, id)}
          onPromote={id => doPromote(activeClass, id)}
          onDemote={id => doDemote(activeClass, id)}
          onExpel={id => doExpel(activeClass, id)}
          onViewMember={m => setMemberSheet(m)}
          onUpdateClass={() => {}}
          onDeleteClass={doDeleteClass}
          onCopyCode={() => toast("Código copiado!")}
          onToggleOpen={() => doToggleOpenClass(activeClass)}
          onRegenerateCode={() => doRegenerateCode(activeClass)}
          onBack={goClassHome} th={th}/>
        <MemberSheet
          member={memberSheet} visible={!!memberSheet}
          onClose={() => setMemberSheet(null)}
          onPromote={id => { doPromote(activeClass, id); setMemberSheet(null); }}
          onDemote={id  => { doDemote(activeClass, id);  setMemberSheet(null); }}
          onExpel={id   => { doExpel(activeClass, id);   setMemberSheet(null); }}
          myRole={myRole} th={th}/>
      </>
    );

    if (screen === "activityForm") {
      const existing = editActId ? activeClass.activities.find(a => a.id === editActId) : undefined;
      return (
        <ActivityFormScreen existing={existing}
          onSave={async data => {
            const ok = await doSaveActivity(activeClass, data, editActId ?? undefined);
            if (ok) nav("repPanel");
          }}
          onDelete={existing ? async () => { if (await doDelActivity(activeClass, existing.id)) nav("repPanel"); } : undefined}
          onBack={() => nav("repPanel")} th={th}/>
      );
    }

    if (screen === "announcementForm") {
      const existing = editAnnId ? activeClass.announcements.find(a => a.id === editAnnId) : undefined;
      return (
        <AnnouncementFormScreen existing={existing}
          onSave={async data => {
            const ok = editAnnId
              ? await doEditAnn(activeClass, editAnnId, data)
              : await doAddAnn(activeClass, data);
            if (ok) nav("repPanel");
          }}
          onDelete={existing ? async () => { if (await doDelAnn(activeClass, existing.id)) nav("repPanel"); } : undefined}
          onBack={() => nav("repPanel")} th={th}/>
      );
    }

    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" animated />
      <View style={{ flex: 1, backgroundColor: th.bg }}>
        {renderInner()}
        <ToastLayer toasts={toasts}/>
      </View>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <OfflineBanner />
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
