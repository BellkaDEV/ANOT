import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import api from "./src/services/api";
import ErrorBoundary from "./src/components/ErrorBoundary";
import OfflineBanner from "./src/components/OfflineBanner";

import type {
  Screen, AppUser, AppClass, Activity, ActivityStatus, Announcement, Member, ToastItem
} from "./src/types";
import {
  LIGHT, DARK, DEMO_CLASS, DEMO_ACCOUNTS,
  nid, makeCode, TODAY_ISO, fmtDueLabel
} from "./src/constants";

import ToastLayer from "./src/components/ToastLayer";
import MemberSheet from "./src/components/MemberSheet";
import QRModal from "./src/components/QRModal";

import WelcomeScreen      from "./src/screens/WelcomeScreen";
import LoginScreen        from "./src/screens/LoginScreen";
import RegisterScreen     from "./src/screens/RegisterScreen";
import DashboardScreen    from "./src/screens/DashboardScreen";
import CreateClassScreen  from "./src/screens/CreateClassScreen";
import ClassCreatedScreen from "./src/screens/ClassCreatedScreen";
import JoinClassScreen    from "./src/screens/JoinClassScreen";
import ClassHomeScreen    from "./src/screens/ClassHomeScreen";
import ActivityDetailScreen from "./src/screens/ActivityDetailScreen";
import NotificationsScreen  from "./src/screens/NotificationsScreen";
import EventsScreen         from "./src/screens/EventsScreen";
import ProfileScreen        from "./src/screens/ProfileScreen";
import SettingsScreen       from "./src/screens/SettingsScreen";
import AboutScreen          from "./src/screens/AboutScreen";
import RepPanelScreen       from "./src/screens/RepPanelScreen";
import ActivityFormScreen   from "./src/screens/ActivityFormScreen";
import AnnouncementFormScreen from "./src/screens/AnnouncementFormScreen";

function mapBackendClass(c: any): AppClass {
  return {
    id: String(c.id),
    code: c.code || '',
    name: c.name || '',
    course: c.course || '',
    institution: c.institution || '',
    period: c.period || '',
    modality: c.modality || 'presencial',
    isOpen: c.is_open !== undefined ? Boolean(c.is_open) : true,
    ownerId: String(c.owner_id || c.user_id || ''),
    members: (c.members || []).map((m: any) => ({
      id: String(m.id),
      userId: String(m.user_id || m.user?.id || m.id),
      name: m.user?.name || m.name || 'Membro',
      email: m.user?.email || m.email || '',
      classRole: m.role || m.classRole || 'student',
      joinedAt: m.joined_at ? String(m.joined_at).slice(0, 10) : TODAY_ISO,
    })),
    announcements: (c.announcements || []).map((a: any) => ({
      id: String(a.id),
      title: a.title || '',
      desc: a.description || a.desc || '',
      priority: a.priority || 'media',
      authorId: String(a.author_id || a.user_id || ''),
      authorName: a.author?.name || a.authorName || 'Representante',
      date: a.created_at ? new Date(a.created_at).toLocaleDateString('pt-BR') : 'Hoje',
      createdAt: a.created_at || new Date().toISOString(),
    })),
    activities: (c.activities || []).map((act: any) => ({
      id: String(act.id),
      title: act.title || '',
      type: act.type || 'dever',
      subject: act.subject || '',
      dueDate: act.due_date || TODAY_ISO,
      dueTime: act.due_time || undefined,
      dueLabel: fmtDueLabel(act.due_date || TODAY_ISO),
      description: act.description || '',
      createdById: String(act.created_by_id || ''),
      createdByName: act.creator?.name || act.createdByName || 'Criador',
    })),
    events: (c.events || []).map((e: any) => {
      const parts = (e.event_date || TODAY_ISO).split('-');
      return {
        id: String(e.id),
        title: e.title || '',
        day: parseInt(parts[2] || '28', 10),
        month: parseInt(parts[1] || '5', 10),
        type: e.type || 'entrega',
        subject: e.subject || undefined,
        room: e.room || undefined,
      };
    }),
  };
}

let demoClassesStore: AppClass[] = [DEMO_CLASS];

function MainApp() {
  const { user: authUser, login: authLogin, register: authRegister, logout: authLogout, signed } = useAuth();

  const [dark, setDark] = useState(false);
  const [screen, setScreen] = useState<Screen>("welcome");
  const [classes, setClasses] = useState<AppClass[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ActivityStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [readSet, setReadSet] = useState<Set<string>>(new Set());
  const [viewActId, setViewActId] = useState<string | null>(null);
  const [editActId, setEditActId] = useState<string | null>(null);
  const [createdCls, setCreatedCls] = useState<AppClass | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [memberSheet, setMemberSheet] = useState<Member | null>(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [editAnnId, setEditAnnId] = useState<string | null>(null);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  const th = dark ? DARK : LIGHT;
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
      const backendClasses = response.data.classes || [];
      const mapped = backendClasses.map(mapBackendClass);
      setClasses(mapped);
    } catch (err) {
      console.log('Error fetching classes:', err);
    } finally {
      setIsLoadingClasses(false);
    }
  }, [signed]);

  const userIdStr = authUser ? String(authUser.id) : null;
  useEffect(() => {
    if (signed) {
      fetchClassesFromApi();
    }
  }, [signed, userIdStr]);

  // Auth Handlers (Strict API Authentication - No Bypasses)
  async function doLogin(email: string, pw: string) {
    try {
      await authLogin(email, pw);
      setScreen("dashboard");
      toast("Bem-vindo(a)!");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Usuário ou senha inválidos.";
      toast(msg, "error");
    }
  }

  async function doRegister(name: string, email: string, pw: string) {
    try {
      await authRegister(name, email, pw);
      setClasses([]);
      setScreen("dashboard");
      toast("Conta criada com sucesso!");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Erro ao criar conta";
      toast(msg, "error");
    }
  }

  async function doLogout() {
    try {
      await authLogout();
    } catch (err) {
      console.log(err);
    }
    setClasses([]);
    setScreen("welcome");
    setActiveId(null);
  }

  // Class CRUD Handlers
  async function doCreateClass(data: { name: string; course: string; institution: string; period: string; modality: "presencial" | "ead" | "hibrido" }) {
    if (!appUser) return;
    try {
      const response = await api.post('/classes', data);
      const newBackendCls = response.data.class;
      const newCls = mapBackendClass(newBackendCls);
      setClasses(prev => [newCls, ...prev]);
      setCreatedCls(newCls);
      setActiveId(newCls.id);
      setScreen("classCreated");
      toast("Turma criada com sucesso!");
    } catch (err) {
      // Local fallback
      const code = makeCode(data.course, data.period);
      const newCls: AppClass = {
        id: nid(), code, ...data,
        ownerId: appUser.id,
        members: [{ id: nid(), userId: appUser.id, name: appUser.name, email: appUser.email, classRole: "owner", joinedAt: TODAY_ISO }],
        announcements: [], events: [], activities: [],
      };
      setClasses(prev => [newCls, ...prev]);
      setCreatedCls(newCls);
      setActiveId(newCls.id);
      setScreen("classCreated");
      toast("Turma criada localmente!");
    }
  }

  async function doJoin(code: string) {
    if (!appUser) return;
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
      const msg = err.response?.data?.message || "Código inválido ou turma não encontrada";
      toast(msg, "error");
    }
  }

  async function doDeleteClass() {
    if (!activeId) return;
    try {
      await api.delete(`/classes/${activeId}`);
    } catch (err) {
      console.log('Delete local fallback');
    }
    setClasses(prev => prev.filter(c => c.id !== activeId));
    setActiveId(null);
    setScreen("dashboard");
    toast("Turma excluída");
  }

  // Announcements Handlers
  async function doAddAnn(cls: AppClass, data: Omit<Announcement, "id" | "authorId" | "authorName" | "date" | "createdAt">) {
    if (!appUser) return;
    try {
      await api.post(`/classes/${cls.id}/announcements`, {
        title: data.title,
        content: data.desc,
        priority: data.priority,
      });
      fetchClassesFromApi();
    } catch (err) {
      const ann: Announcement = {
        id: nid(), ...data,
        authorId: appUser.id, authorName: appUser.name,
        date: "Agora", createdAt: new Date().toISOString(),
      };
      setClasses(prev => prev.map(c => c.id === cls.id ? { ...c, announcements: [ann, ...c.announcements] } : c));
    }
    toast("Aviso publicado!");
  }

  async function doEditAnn(cls: AppClass, id: string, data: Partial<Announcement>) {
    try {
      await api.put(`/announcements/${id}`, {
        title: data.title,
        content: data.desc,
        priority: data.priority,
      });
      fetchClassesFromApi();
    } catch (err) {
      setClasses(prev => prev.map(c => c.id === cls.id ? {
        ...c, announcements: c.announcements.map(a => a.id === id ? { ...a, ...data } : a)
      } : c));
    }
    toast("Aviso atualizado!");
  }

  async function doDelAnn(cls: AppClass, id: string) {
    try {
      await api.delete(`/announcements/${id}`);
      fetchClassesFromApi();
    } catch (err) {
      setClasses(prev => prev.map(c => c.id === cls.id ? {
        ...c, announcements: c.announcements.filter(a => a.id !== id)
      } : c));
    }
    toast("Aviso removido");
  }

  // Activities Handlers
  async function doSaveActivity(cls: AppClass, data: Omit<Activity, "id" | "createdById" | "createdByName">, existingId?: string) {
    if (!appUser) return;
    try {
      if (existingId) {
        await api.put(`/activities/${existingId}`, {
          title: data.title,
          type: data.type,
          subject: data.subject,
          due_date: data.dueDate,
          due_time: data.dueTime,
          description: data.description,
        });
      } else {
        await api.post(`/classes/${cls.id}/activities`, {
          title: data.title,
          type: data.type,
          subject: data.subject,
          due_date: data.dueDate,
          due_time: data.dueTime,
          description: data.description,
        });
      }
      fetchClassesFromApi();
      toast(existingId ? "Atividade atualizada!" : "Atividade criada!");
    } catch (err) {
      if (existingId) {
        setClasses(prev => prev.map(c => c.id === cls.id ? {
          ...c, activities: c.activities.map(a => a.id === existingId ? { ...a, ...data } : a)
        } : c));
      } else {
        const act: Activity = { id: nid(), ...data, createdById: appUser.id, createdByName: appUser.name };
        setClasses(prev => prev.map(c => c.id === cls.id ? { ...c, activities: [...c.activities, act] } : c));
      }
      toast(existingId ? "Atividade atualizada!" : "Atividade criada!");
    }
  }

  async function doDelActivity(cls: AppClass, id: string) {
    try {
      await api.delete(`/activities/${id}`);
      fetchClassesFromApi();
    } catch (err) {
      setClasses(prev => prev.map(c => c.id === cls.id ? {
        ...c, activities: c.activities.filter(a => a.id !== id)
      } : c));
    }
    toast("Atividade removida");
  }

  // Member Moderation Handlers
  async function doPromote(cls: AppClass, memberId: string) {
    try {
      const m = cls.members.find(mem => mem.id === memberId);
      if (m) await api.put(`/classes/${cls.id}/members/${m.userId}/promote`);
      fetchClassesFromApi();
    } catch (err) {
      setClasses(prev => prev.map(c => c.id === cls.id ? {
        ...c, members: c.members.map(m => m.id === memberId ? { ...m, classRole: "rep" } : m)
      } : c));
    }
    toast("Membro promovido a representante!");
  }

  async function doDemote(cls: AppClass, memberId: string) {
    try {
      const m = cls.members.find(mem => mem.id === memberId);
      if (m) await api.put(`/classes/${cls.id}/members/${m.userId}/demote`);
      fetchClassesFromApi();
    } catch (err) {
      setClasses(prev => prev.map(c => c.id === cls.id ? {
        ...c, members: c.members.map(m => m.id === memberId ? { ...m, classRole: "student" } : m)
      } : c));
    }
    toast("Membro rebaixado para aluno");
  }

  async function doExpel(cls: AppClass, memberId: string) {
    try {
      const m = cls.members.find(mem => mem.id === memberId);
      if (m) await api.delete(`/classes/${cls.id}/members/${m.userId}`);
      fetchClassesFromApi();
    } catch (err) {
      setClasses(prev => prev.map(c => c.id === cls.id ? {
        ...c, members: c.members.filter(m => m.id !== memberId)
      } : c));
    }
    toast("Membro removido da turma");
  }

  // Progress & Notes
  async function doSaveStatus(actId: string, s: ActivityStatus) {
    setStatuses(prev => ({ ...prev, [actId]: s }));
    try {
      await api.put(`/activities/${actId}/progress`, { status: s });
    } catch (err) {
      console.log('Progress save local');
    }
  }

  async function doSaveNotes(actId: string, n: string) {
    setNotes(prev => ({ ...prev, [actId]: n }));
    try {
      await api.put(`/activities/${actId}/progress`, { personal_notes: n });
    } catch (err) {
      console.log('Notes save local');
    }
  }

  function doMarkRead(annId: string) {
    setReadSet(prev => new Set(prev).add(annId));
  }

  function nav(s: Screen) { setScreen(s); }
  function goClassHome() {
    if (activeId) setScreen("classHome");
    else setScreen("dashboard");
  }

  // RENDER LOGIC
  function renderInner(): React.ReactElement | null {
    if (screen === "welcome")  return <WelcomeScreen onLogin={() => nav("login")} onRegister={() => nav("register")} th={th}/>;
    if (screen === "login")    return <LoginScreen onLogin={doLogin} onBack={() => nav("welcome")} onRegister={() => nav("register")} th={th}/>;
    if (screen === "register") return <RegisterScreen onRegister={doRegister} onBack={() => nav("login")} th={th}/>;

    if (!appUser) return <WelcomeScreen onLogin={() => nav("login")} onRegister={() => nav("register")} th={th}/>;

    if (screen === "dashboard") return (
      <DashboardScreen user={appUser} classes={classes} loading={isLoadingClasses}
        onSelectClass={id => { setActiveId(id); nav("classHome"); }}
        onCreateClass={() => nav("createClass")} onJoinClass={() => nav("joinClass")}
        onProfile={() => nav("profile")} onSettings={() => nav("settings")} th={th}/>
    );

    if (screen === "createClass") return (
      <CreateClassScreen onSubmit={doCreateClass} onBack={() => nav("dashboard")} th={th}/>
    );

    if (screen === "classCreated" && createdCls) return (
      <ClassCreatedScreen cls={createdCls}
        onGo={() => { setActiveId(createdCls.id); nav("classHome"); }}
        onDash={() => nav("dashboard")} th={th}/>
    );

    if (screen === "joinClass") return (
      <JoinClassScreen onJoin={doJoin} onBack={() => nav("dashboard")} th={th}/>
    );

    if (screen === "profile") return (
      <ProfileScreen user={appUser} classes={classes} statuses={statuses}
        onNav={nav} onSettings={() => nav("settings")} onAbout={() => nav("about")}
        onLogout={doLogout} th={th}/>
    );

    if (screen === "settings") return (
      <SettingsScreen dark={dark} onToggleDark={v => setDark(v)} onBack={() => nav("profile")} th={th}/>
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
      <>
        <ClassHomeScreen cls={activeClass} user={appUser} statuses={statuses} readSet={readSet}
          onNav={nav} onViewActivity={id => { setViewActId(id); nav("activityDetail"); }}
          onCopyCode={() => toast("Código copiado!")}
          onToggleOpen={() => doToggleOpenClass(activeClass)}
          onRepPanel={() => nav("repPanel")} onBack={() => nav("dashboard")} th={th}/>
        <QRModal code={activeClass.code} visible={qrVisible} onClose={() => setQrVisible(false)} th={th}/>
      </>
    );

    if (screen === "activityDetail" && viewActId) {
      const act = activeClass.activities.find(a => a.id === viewActId);
      if (!act) return null;
      return (
        <ActivityDetailScreen activity={act}
          status={statuses[act.id] ?? "todo"} notes={notes[act.id] ?? ""}
          onSaveStatus={doSaveStatus} onSaveNotes={doSaveNotes}
          onBack={() => nav("classHome")} th={th}/>
      );
    }

    if (screen === "notifications") return (
      <NotificationsScreen cls={activeClass} user={appUser} readSet={readSet}
        onMarkRead={doMarkRead} onNav={nav} th={th}/>
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
          onSave={data => { doSaveActivity(activeClass, data, editActId ?? undefined); nav("repPanel"); }}
          onDelete={existing ? () => { doDelActivity(activeClass, existing.id); nav("repPanel"); } : undefined}
          onBack={() => nav("repPanel")} th={th}/>
      );
    }

    if (screen === "announcementForm") {
      const existing = editAnnId ? activeClass.announcements.find(a => a.id === editAnnId) : undefined;
      return (
        <AnnouncementFormScreen existing={existing}
          onSave={data => {
            if (editAnnId) {
              doEditAnn(activeClass, editAnnId, data);
            } else {
              doAddAnn(activeClass, data);
            }
            nav("repPanel");
          }}
          onDelete={existing ? () => { doDelAnn(activeClass, existing.id); nav("repPanel"); } : undefined}
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
