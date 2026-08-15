import React, { useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import type {
  Screen, AppUser, AppClass, Activity, ActivityStatus, Announcement, Member,
} from "./types";
import {
  LIGHT, DARK, DEMO_CLASS, DEMO_ACCOUNTS,
  nid, makeCode, TODAY_ISO,
} from "./constants";

import ToastLayer from "./components/ToastLayer";
import MemberSheet from "./components/MemberSheet";
import QRModal from "./components/QRModal";

import WelcomeScreen      from "./screens/WelcomeScreen";
import LoginScreen        from "./screens/LoginScreen";
import RegisterScreen     from "./screens/RegisterScreen";
import DashboardScreen    from "./screens/DashboardScreen";
import CreateClassScreen  from "./screens/CreateClassScreen";
import ClassCreatedScreen from "./screens/ClassCreatedScreen";
import JoinClassScreen    from "./screens/JoinClassScreen";
import ClassHomeScreen    from "./screens/ClassHomeScreen";
import ActivityDetailScreen from "./screens/ActivityDetailScreen";
import NotificationsScreen  from "./screens/NotificationsScreen";
import EventsScreen         from "./screens/EventsScreen";
import ProfileScreen        from "./screens/ProfileScreen";
import SettingsScreen       from "./screens/SettingsScreen";
import AboutScreen          from "./screens/AboutScreen";
import RepPanelScreen       from "./screens/RepPanelScreen";
import ActivityFormScreen   from "./screens/ActivityFormScreen";

// ── App State ─────────────────────────────────────────────────────────────────
type ToastItem = { id: number; msg: string; type: "success" | "error" | "info" };

export default function App() {
  const [dark,     setDark]     = useState(false);
  const [screen,   setScreen]   = useState<Screen>("welcome");
  const [user,     setUser]     = useState<AppUser | null>(null);
  const [classes,  setClasses]  = useState<AppClass[]>([DEMO_CLASS]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ActivityStatus>>({});
  const [notes,    setNotes]    = useState<Record<string, string>>({});
  const [readSet,  setReadSet]  = useState<Set<string>>(new Set());
  const [viewActId,setViewActId]= useState<string | null>(null);
  const [editActId,setEditActId]= useState<string | null>(null);
  const [createdCls, setCreatedCls] = useState<AppClass | null>(null);
  const [toasts,   setToasts]   = useState<ToastItem[]>([]);
  const [memberSheet, setMemberSheet] = useState<Member | null>(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [formMode,  setFormMode]  = useState<"ann" | "activity" | null>(null);
  const [editAnnId, setEditAnnId] = useState<string | null>(null);

  const th = dark ? DARK : LIGHT;
  const activeClass = classes.find(c => c.id === activeId) ?? null;

  // ── Toast ──────────────────────────────────────────────────────────────────
  function toast(msg: string, type: "success" | "error" | "info" = "success") {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }

  // ── Setters ────────────────────────────────────────────────────────────────
  function updateClass(id: string, fn: (c: AppClass) => AppClass) {
    setClasses(prev => prev.map(c => c.id === id ? fn(c) : c));
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
  function doLogin(email: string, _pw: string) {
    const acc = DEMO_ACCOUNTS[email];
    if (!acc) { toast("Conta não encontrada", "error"); return; }
    setUser({ id: email, name: acc.name, email });
    setScreen("dashboard");
    toast(`Bem-vindo(a), ${acc.name.split(" ")[0]}!`);
  }

  function doRegister(name: string, email: string, _pw: string) {
    setUser({ id: email, name, email });
    setScreen("dashboard");
    toast("Conta criada com sucesso!");
  }

  function doLogout() {
    setUser(null);
    setScreen("welcome");
    setActiveId(null);
  }

  // ── Class CRUD ──────────────────────────────────────────────────────────────
  function doCreateClass(data: { name: string; course: string; institution: string; period: string; modality: "presencial" | "ead" | "hibrido" }) {
    if (!user) return;
    const code = makeCode(data.course, data.period);
    const cls: AppClass = {
      id: nid(), code, ...data,
      ownerId: user.id,
      members: [{ id: nid(), userId: user.id, name: user.name, email: user.email, classRole: "owner", joinedAt: TODAY_ISO }],
      announcements: [], events: [], activities: [],
    };
    setClasses(prev => [...prev, cls]);
    setCreatedCls(cls);
    setActiveId(cls.id);
    setScreen("classCreated");
    toast("Turma criada com sucesso!");
  }

  function doJoin(code: string) {
    if (!user) return;
    const cls = classes.find(c => c.code.toUpperCase() === code.toUpperCase());
    if (!cls) { toast("Código inválido ou turma não encontrada", "error"); return; }
    const already = cls.members.find(m => m.userId === user.id);
    if (already) { setActiveId(cls.id); setScreen("classHome"); toast("Você já está nesta turma"); return; }
    updateClass(cls.id, c => ({
      ...c,
      members: [...c.members, { id: nid(), userId: user.id, name: user.name, email: user.email, classRole: "student", joinedAt: TODAY_ISO }],
    }));
    setActiveId(cls.id);
    setScreen("classHome");
    toast("Entrou na turma com sucesso!");
  }

  function doDeleteClass() {
    if (!activeId) return;
    setClasses(prev => prev.filter(c => c.id !== activeId));
    setActiveId(null);
    setScreen("dashboard");
    toast("Turma excluída");
  }

  // ── Announcements ──────────────────────────────────────────────────────────
  function doAddAnn(cls: AppClass, data: Omit<Announcement, "id" | "authorId" | "authorName" | "date" | "createdAt">) {
    if (!user) return;
    const ann: Announcement = {
      id: nid(), ...data,
      authorId: user.id, authorName: user.name,
      date: "Agora", createdAt: new Date().toISOString(),
    };
    updateClass(cls.id, c => ({ ...c, announcements: [ann, ...c.announcements] }));
    toast("Aviso publicado!");
  }

  function doEditAnn(cls: AppClass, id: string, data: Partial<Announcement>) {
    updateClass(cls.id, c => ({
      ...c, announcements: c.announcements.map(a => a.id === id ? { ...a, ...data } : a),
    }));
    toast("Aviso atualizado!");
  }

  function doDelAnn(cls: AppClass, id: string) {
    updateClass(cls.id, c => ({ ...c, announcements: c.announcements.filter(a => a.id !== id) }));
    toast("Aviso removido");
  }

  // ── Activities ─────────────────────────────────────────────────────────────
  function doSaveActivity(cls: AppClass, data: Omit<Activity, "id" | "createdById" | "createdByName">, existingId?: string) {
    if (!user) return;
    if (existingId) {
      updateClass(cls.id, c => ({
        ...c, activities: c.activities.map(a => a.id === existingId ? { ...a, ...data } : a),
      }));
      toast("Atividade atualizada!");
    } else {
      const act: Activity = { id: nid(), ...data, createdById: user.id, createdByName: user.name };
      updateClass(cls.id, c => ({ ...c, activities: [...c.activities, act] }));
      toast("Atividade criada!");
    }
  }

  function doDelActivity(cls: AppClass, id: string) {
    updateClass(cls.id, c => ({ ...c, activities: c.activities.filter(a => a.id !== id) }));
    toast("Atividade removida");
  }

  // ── Members ────────────────────────────────────────────────────────────────
  function doPromote(cls: AppClass, memberId: string) {
    updateClass(cls.id, c => ({
      ...c, members: c.members.map(m => m.id === memberId ? { ...m, classRole: "rep" } : m),
    }));
    toast("Membro promovido a representante!");
  }

  function doExpel(cls: AppClass, memberId: string) {
    updateClass(cls.id, c => ({ ...c, members: c.members.filter(m => m.id !== memberId) }));
    toast("Membro removido da turma");
  }

  function doDemote(cls: AppClass, memberId: string) {
    updateClass(cls.id, c => ({
      ...c, members: c.members.map(m => m.id === memberId ? { ...m, classRole: "student" } : m),
    }));
    toast("Membro rebaixado para aluno");
  }

  // ── Progress ───────────────────────────────────────────────────────────────
  function doSaveStatus(actId: string, s: ActivityStatus) {
    setStatuses(prev => ({ ...prev, [actId]: s }));
  }

  function doSaveNotes(actId: string, n: string) {
    setNotes(prev => ({ ...prev, [actId]: n }));
  }

  function doMarkRead(annId: string) {
    setReadSet(prev => new Set(prev).add(annId));
  }

  // ── Nav ────────────────────────────────────────────────────────────────────
  function nav(s: Screen) { setScreen(s); }

  function goClassHome() {
    if (activeId) setScreen("classHome");
    else setScreen("dashboard");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  function renderInner(): React.ReactElement | null {
    if (screen === "welcome")  return <WelcomeScreen onLogin={() => nav("login")} onRegister={() => nav("register")} th={th}/>;
    if (screen === "login")    return <LoginScreen onLogin={doLogin} onBack={() => nav("welcome")} onRegister={() => nav("register")} th={th}/>;
    if (screen === "register") return <RegisterScreen onRegister={doRegister} onBack={() => nav("login")} th={th}/>;

    if (!user) return null;

    if (screen === "dashboard") return (
      <DashboardScreen user={user} classes={classes}
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
      <ProfileScreen user={user} classes={classes} statuses={statuses}
        onNav={nav} onSettings={() => nav("settings")} onAbout={() => nav("about")}
        onLogout={doLogout} th={th}/>
    );

    if (screen === "settings") return (
      <SettingsScreen dark={dark} onToggleDark={v => setDark(v)} onBack={() => nav("profile")} th={th}/>
    );

    if (screen === "about") return <AboutScreen onBack={() => nav("profile")} th={th}/>;

    if (!activeClass) return null;

    const myRole = activeClass.members.find(m => m.userId === user.id)?.classRole ?? "student";

    if (screen === "classHome") return (
      <>
        <ClassHomeScreen cls={activeClass} user={user} statuses={statuses} readSet={readSet}
          onNav={nav} onViewActivity={id => { setViewActId(id); nav("activityDetail"); }}
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
      <NotificationsScreen cls={activeClass} user={user} readSet={readSet}
        onMarkRead={doMarkRead} onNav={nav} th={th}/>
    );

    if (screen === "events") return (
      <EventsScreen cls={activeClass} user={user} onNav={nav} th={th}/>
    );

    if (screen === "repPanel") return (
      <>
        <RepPanelScreen cls={activeClass} user={user}
          onAddAnn={() => { setEditAnnId(null); setFormMode("ann"); nav("repPanel"); }}
          onEditAnn={id => { setEditAnnId(id); setFormMode("ann"); }}
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

    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: th.bg }}>
        {renderInner()}
        <ToastLayer toasts={toasts}/>
      </View>
    </SafeAreaProvider>
  );
}
