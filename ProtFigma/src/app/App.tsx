import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import logo from "../imports/logo_3_sem_fundo.png";
import {
  ArrowLeft, Bell, BookOpen, Calendar, ChevronRight, ChevronLeft, Check, Copy,
  Edit3, Eye, EyeOff, FileText, GraduationCap, Hash, Info, Layers,
  LogOut, Mail, Moon, Plus, Search, Settings, Shield, Star, Sun,
  Trash2, User, Users, X, Clock, Circle, Send, ChevronDown, AlertTriangle,
  Shield as Privacy, Download, Bell as BellIcon, Globe, Heart,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Screen =
  | "welcome" | "login" | "register" | "dashboard"
  | "createClass" | "classCreated" | "joinClass"
  | "classHome" | "activityDetail" | "notifications"
  | "events" | "profile" | "settings" | "about"
  | "repPanel" | "activityForm";

type ActivityStatus = "todo" | "in_progress" | "done";
type Priority       = "alta" | "media" | "baixa";
type EventKind      = "entrega" | "evento" | "periodo" | "prova";
type Modality       = "presencial" | "ead" | "hibrido";
type ClassRole      = "owner" | "rep" | "student";
type ActivityType   = "dever" | "trabalho" | "teste" | "outros";

interface AppTheme {
  bg: string; card: string; card2: string; headerBg: string;
  fg: string; muted: string; border: string;
  orange: string; orangeLight: string;
  navy: string; navyLight: string; inputBg: string; isDark: boolean;
}
interface AppUser  { id: string; name: string; email: string; }
interface Member   { id: string; userId: string; name: string; email: string; classRole: ClassRole; joinedAt: string; }
interface Announcement { id: string; title: string; desc: string; priority: Priority; authorId: string; authorName: string; date: string; createdAt: string; }
interface Activity { id: string; title: string; type: ActivityType; subject: string; dueDate: string; dueTime?: string; dueLabel: string; description?: string; createdById: string; createdByName: string; }
interface AppEvent { id: string; title: string; day: number; month: number; type: EventKind; subject?: string; room?: string; }
interface AppClass {
  id: string; code: string; name: string; course: string; institution: string; period: string; modality: Modality;
  ownerId: string; members: Member[];
  announcements: Announcement[]; events: AppEvent[]; activities: Activity[];
}

// ─── THEMES ───────────────────────────────────────────────────────────────────
const LIGHT: AppTheme = {
  bg:"#f4f6fb", card:"#ffffff", card2:"#edf1f8", headerBg:"#0e2f5a",
  fg:"#0a1628", muted:"#5a6a8a", border:"#e6ecf5",
  orange:"#e4822e", orangeLight:"rgba(228,130,46,0.1)",
  navy:"#0e2f5a", navyLight:"rgba(14,47,90,0.07)", inputBg:"#edf1f8", isDark:false,
};
const DARK: AppTheme = {
  bg:"#0d1829", card:"#142030", card2:"#1b2d42", headerBg:"#0a1220",
  fg:"#dce8f5", muted:"#6e85a8", border:"#1e3252",
  orange:"#e4822e", orangeLight:"rgba(228,130,46,0.12)",
  navy:"#1e4a8a", navyLight:"rgba(255,255,255,0.05)", inputBg:"#1a2d45", isDark:true,
};

const ThemeCtx = createContext<AppTheme>(LIGHT);
const useT = () => useContext(ThemeCtx);
type ToastFn = (msg: string, type?: "success"|"error"|"info") => void;
const ToastCtx = createContext<ToastFn>(() => {});
const useToast = () => useContext(ToastCtx);

// ─── METADATA ─────────────────────────────────────────────────────────────────
const PRIORITY_META: Record<Priority, {label:string;dot:string;text:string;bg:string}> = {
  alta:  {label:"Alta",  dot:"#ef4444", text:"#dc2626", bg:"#fef2f2"},
  media: {label:"Média", dot:"#f59e0b", text:"#b45309", bg:"#fffbeb"},
  baixa: {label:"Baixa", dot:"#10b981", text:"#065f46", bg:"#ecfdf5"},
};
const EVENT_META: Record<EventKind, {label:string;dot:string;text:string;bg:string}> = {
  prova:   {label:"Prova",   dot:"#ef4444", text:"#dc2626", bg:"#fef2f2"},
  entrega: {label:"Entrega", dot:"#f59e0b", text:"#b45309", bg:"#fffbeb"},
  evento:  {label:"Evento",  dot:"#8b5cf6", text:"#6d28d9", bg:"#f5f3ff"},
  periodo: {label:"Período", dot:"#3b82f6", text:"#1d4ed8", bg:"#eff6ff"},
};
const STATUS_META: Record<ActivityStatus, {label:string;color:string;bg:string}> = {
  todo:        {label:"Não feito",    color:"#9ca3af", bg:"rgba(156,163,175,0.12)"},
  in_progress: {label:"Em andamento", color:"#e4822e", bg:"rgba(228,130,46,0.12)"},
  done:        {label:"Pronto",       color:"#10b981", bg:"rgba(16,185,129,0.12)"},
};
const ACT_META: Record<ActivityType, {label:string;color:string}> = {
  dever:    {label:"Dever",    color:"#e4822e"},
  trabalho: {label:"Trabalho", color:"#3b82f6"},
  teste:    {label:"Teste/Prova", color:"#ef4444"},
  outros:   {label:"Outros",   color:"#8b5cf6"},
};
const ROLE_META: Record<ClassRole, {label:string;color:string;bg:string}> = {
  owner:   {label:"Criador",       color:"#e4822e", bg:"rgba(228,130,46,0.12)"},
  rep:     {label:"Representante", color:"#0e2f5a", bg:"rgba(14,47,90,0.1)"},
  student: {label:"Aluno",         color:"#5a6a8a", bg:"rgba(90,106,138,0.1)"},
};

// Calendar months: April–October 2026 (1 back + 5 forward from May)
const CAL_MONTHS = [
  {year:2026, month:4,  name:"Abril 2026",    short:"ABR", days:30, offset:2},
  {year:2026, month:5,  name:"Maio 2026",     short:"MAI", days:31, offset:4},
  {year:2026, month:6,  name:"Junho 2026",    short:"JUN", days:30, offset:0},
  {year:2026, month:7,  name:"Julho 2026",    short:"JUL", days:31, offset:2},
  {year:2026, month:8,  name:"Agosto 2026",   short:"AGO", days:31, offset:5},
  {year:2026, month:9,  name:"Setembro 2026", short:"SET", days:30, offset:1},
  {year:2026, month:10, name:"Outubro 2026",  short:"OUT", days:31, offset:3},
];

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const DEMO_ACCOUNTS: Record<string,{name:string}> = {
  "ana@univ.edu.br":   {name:"Ana Carolina Silva"},
  "lucas@univ.edu.br": {name:"Lucas Mendes"},
};

const TODAY_ISO = "2026-05-28"; // demo "today"

const DEMO_CLASS: AppClass = {
  id:"demo-1", code:"ENG-2025-7XK4",
  name:"Engenharia Civil — Turma A", course:"Engenharia Civil",
  institution:"Universidade Federal do Brasil", period:"2025.1", modality:"presencial",
  ownerId:"lucas@univ.edu.br",
  members:[
    {id:"m1", userId:"lucas@univ.edu.br", name:"Lucas Mendes",       email:"lucas@univ.edu.br",   classRole:"owner",   joinedAt:"2026-01-10"},
    {id:"m2", userId:"beatriz",           name:"Beatriz Souza",      email:"beatriz@univ.edu.br", classRole:"rep",     joinedAt:"2026-01-15"},
    {id:"m3", userId:"ana@univ.edu.br",   name:"Ana Carolina Silva", email:"ana@univ.edu.br",     classRole:"student", joinedAt:"2026-01-15"},
    {id:"m4", userId:"rafael",            name:"Rafael Pereira",     email:"rafael@univ.edu.br",  classRole:"student", joinedAt:"2026-01-20"},
    {id:"m5", userId:"carla",             name:"Carla Santos",       email:"carla@univ.edu.br",   classRole:"student", joinedAt:"2026-01-22"},
    {id:"m6", userId:"joao",              name:"João Ferreira",      email:"joao@univ.edu.br",    classRole:"student", joinedAt:"2026-01-25"},
    {id:"m7", userId:"mariana",           name:"Mariana Costa",      email:"mariana@univ.edu.br", classRole:"student", joinedAt:"2026-01-25"},
  ],
  announcements:[
    {id:"a1", title:"Prova de Cálculo II — Remarcada",  desc:"A prova foi remarcada para 28/05. Local: Sala 203. Conteúdo: capítulos 1–9.", priority:"alta",  authorId:"lucas@univ.edu.br", authorName:"Lucas Mendes · Rep.",  date:"Hoje, 14h22",  createdAt:"2026-05-21T14:22:00Z"},
    {id:"a2", title:"Material de Física Experimental",   desc:"Slides da aula prática disponíveis no drive da turma. Acessem pelo link no grupo.",     priority:"media", authorId:"lucas@univ.edu.br", authorName:"Lucas Mendes · Rep.",  date:"Ontem, 09h15", createdAt:"2026-05-20T09:15:00Z"},
    {id:"a3", title:"Reunião de Representantes",         desc:"Reunião com a coordenação na próxima terça, 12h, sala da administração.",               priority:"media", authorId:"beatriz",           authorName:"Beatriz Souza · Rep.", date:"22/05, 11h00", createdAt:"2026-05-19T11:00:00Z"},
    {id:"a4", title:"Formulário de Avaliação Docente",   desc:"Prazo para preenchimento encerra no dia 31/05. Sua participação é muito importante!",   priority:"baixa", authorId:"lucas@univ.edu.br", authorName:"Lucas Mendes · Rep.",  date:"21/05, 08h30", createdAt:"2026-05-18T08:30:00Z"},
  ],
  events:[
    // Activity-linked events (auto-managed)
    {id:"act_act1", title:"Lista — Cálculo II",         day:27, month:5,  type:"entrega", subject:"Cálculo II"},
    {id:"act_act2", title:"Relatório de Física",        day:30, month:5,  type:"entrega", subject:"Física Exp."},
    {id:"act_act3", title:"Resenha de Filosofia",       day:28, month:5,  type:"entrega", subject:"Filosofia"},
    {id:"act_act4", title:"Seminário de Materiais",     day:2,  month:6,  type:"evento",  subject:"Materiais", room:"Auditório"},
    {id:"act_act5", title:"Prova de Cálculo II",        day:28, month:5,  type:"prova",   subject:"Cálculo II", room:"Sala 203"},
    {id:"act_act6", title:"Prova de Física Exp.",        day:4,  month:6,  type:"prova",   subject:"Física Exp.", room:"Lab. Físico"},
    // Institutional events
    {id:"e6", title:"Início — Semana de Provas",        day:3,  month:6,  type:"periodo"},
    {id:"e8", title:"Defesa de TCC — Turmas Sênior",   day:10, month:6,  type:"evento"},
    {id:"e9", title:"Encerramento do Semestre",         day:28, month:6,  type:"periodo"},
    {id:"e10",title:"Recesso Inverno",                  day:13, month:7,  type:"periodo"},
    {id:"e11",title:"Retorno das Aulas",                day:3,  month:8,  type:"evento"},
  ],
  activities:[
    {id:"act1", title:"Lista de Exercícios — Cálculo II", type:"dever",    subject:"Cálculo II",  dueDate:"2026-05-27", dueLabel:"27 Mai", description:"Capítulos 7 e 8 — exercícios ímpares.", createdById:"lucas@univ.edu.br", createdByName:"Lucas Mendes"},
    {id:"act2", title:"Relatório de Física Experimental",  type:"trabalho", subject:"Física Exp.", dueDate:"2026-05-30", dueTime:"23:59",   dueLabel:"30 Mai", description:"Experimento 4 — Oscilações. Usar modelo do Moodle.", createdById:"lucas@univ.edu.br", createdByName:"Lucas Mendes"},
    {id:"act3", title:"Resenha — Filosofia da Ciência",    type:"outros",   subject:"Filosofia",   dueDate:"2026-05-28", dueLabel:"28 Mai", description:"Resenha crítica do artigo de Kuhn. 1–2 páginas.", createdById:"beatriz", createdByName:"Beatriz Souza"},
    {id:"act4", title:"Seminário de Materiais",            type:"outros",   subject:"Materiais",   dueDate:"2026-06-02", dueTime:"14:00",   dueLabel:"2 Jun",  description:"Apresentação de 15 min sobre ligas metálicas.", createdById:"lucas@univ.edu.br", createdByName:"Lucas Mendes"},
    {id:"act5", title:"Prova de Cálculo II",               type:"teste",    subject:"Cálculo II",  dueDate:"2026-05-28", dueLabel:"28 Mai", description:"Conteúdo: capítulos 1–9. Local: Sala 203.", createdById:"lucas@univ.edu.br", createdByName:"Lucas Mendes"},
    {id:"act6", title:"Prova de Física Experimental",      type:"teste",    subject:"Física Exp.", dueDate:"2026-06-04", dueLabel:"4 Jun",  description:"Experimentos 1–5. Local: Lab. Físico.", createdById:"lucas@univ.edu.br", createdByName:"Lucas Mendes"},
  ],
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
const nid = () => Math.random().toString(36).slice(2,9);
const isValidEmail = (e:string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const makeCode = (course:string, period:string) => {
  const pre = course.split(" ").map(w=>w[0]||"X").join("").toUpperCase().slice(0,3).padEnd(3,"X");
  const yr  = period.replace(/\D/g,"").slice(0,4).padEnd(4,"0");
  return `${pre}-${yr}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
};
const fmtDueLabel = (d:string):string => {
  if (!d) return "";
  const p=d.split("-");
  const months=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${parseInt(p[2]??"1")} ${months[parseInt(p[1]??"1")-1]??""}`;
};
const fmtDatePt = (iso:string) => new Date(iso+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"});
const getInitials = (name:string) => name.split(" ").slice(0,2).map(w=>w[0]??"").join("").toUpperCase();

// Announcements expire after 21 days
const isExpired = (createdAt:string):boolean => {
  const created = new Date(createdAt);
  const today   = new Date(TODAY_ISO);
  return (today.getTime() - created.getTime()) > 21*24*60*60*1000;
};

// Quick date options for activity form
const QUICK_DATES = [
  {label:"Hoje",       offset:0},
  {label:"Amanhã",     offset:1},
  {label:"+1 semana",  offset:7},
  {label:"+2 semanas", offset:14},
  {label:"+1 mês",     offset:30},
];
const addDays = (iso:string, days:number):string => {
  const d = new Date(iso+"T12:00:00"); d.setDate(d.getDate()+days);
  return d.toISOString().slice(0,10);
};

function useLoad(ms=650):boolean {
  const [l,setL]=useState(true);
  useEffect(()=>{const t=setTimeout(()=>setL(false),ms);return()=>clearTimeout(t);},[ms]);
  return l;
}

// ─── DESIGN SYSTEM ────────────────────────────────────────────────────────────

function Btn({children,variant="primary",size="md",onClick,disabled,loading,full,icon:Icon,style:xs}:{
  children?:React.ReactNode;variant?:"primary"|"secondary"|"ghost"|"danger";
  size?:"sm"|"md"|"lg";onClick?:()=>void;disabled?:boolean;loading?:boolean;
  full?:boolean;icon?:React.ElementType;style?:React.CSSProperties;
}) {
  const th=useT();
  const H={sm:34,md:46,lg:54}[size]; const FS={sm:13,md:14,lg:15}[size];
  const PX={sm:14,md:20,lg:24}[size]; const R={sm:10,md:14,lg:16}[size];
  const IS={sm:13,md:15,lg:16}[size];
  const vBg:Record<string,string>={primary:th.orange,secondary:th.card,ghost:th.orangeLight,danger:"rgba(239,68,68,0.08)"};
  const vC:Record<string,string>={primary:"#fff",secondary:th.fg,ghost:th.orange,danger:"#ef4444"};
  const vB:Record<string,string>={primary:"none",secondary:`1.5px solid ${th.border}`,ghost:`1.5px solid rgba(228,130,46,0.4)`,danger:"1px solid rgba(239,68,68,0.25)"};
  return (
    <button onClick={onClick} disabled={disabled||loading}
      style={{height:H,padding:`0 ${PX}px`,fontSize:FS,borderRadius:R,fontWeight:600,fontFamily:"'Plus Jakarta Sans',sans-serif",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,cursor:disabled||loading?"not-allowed":"pointer",opacity:disabled?.5:1,transition:"all 0.15s",width:full?"100%":"auto",whiteSpace:"nowrap",outline:"none",background:vBg[variant],color:disabled?th.muted:vC[variant],border:vB[variant],boxShadow:variant==="primary"&&!disabled?"0 2px 10px rgba(228,130,46,0.3)":"none",...xs}}>
      {loading?<span style={{width:16,height:16,border:"2px solid currentColor",borderTopColor:"transparent",borderRadius:"50%",display:"block",animation:"spin 0.8s linear infinite"}}/>:<>{Icon&&<Icon size={IS}/>}{children}</>}
    </button>
  );
}

function FInput({label,type="text",value,onChange,placeholder,error,icon:Icon,actionIcon:AIcon,onAction,maxLen,hint}:{
  label?:string;type?:string;value:string;onChange:(v:string)=>void;placeholder?:string;error?:string;
  icon?:React.ElementType;actionIcon?:React.ElementType;onAction?:()=>void;maxLen?:number;hint?:string;
}) {
  const th=useT(); const [f,setF]=useState(false);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {label&&<label style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:th.muted,fontFamily:"'Inter',sans-serif"}}>{label}</label>}
      <div style={{position:"relative",display:"flex",alignItems:"center"}}>
        {Icon&&<Icon size={15} style={{position:"absolute",left:14,color:f?th.orange:th.muted,pointerEvents:"none",transition:"color 0.15s"}}/>}
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} maxLength={maxLen}
          onFocus={()=>setF(true)} onBlur={()=>setF(false)}
          style={{width:"100%",background:th.inputBg,color:th.fg,border:`1.5px solid ${error?"#ef4444":f?th.orange:th.border}`,borderRadius:12,padding:`12px ${AIcon?44:16}px 12px ${Icon?42:16}px`,fontSize:14,fontFamily:"'Inter',sans-serif",outline:"none",transition:"border-color 0.15s,box-shadow 0.15s",boxShadow:f?`0 0 0 3px ${error?"#ef4444":th.orange}18`:"none",colorScheme:"light dark"}}/>
        {AIcon&&<button onClick={onAction} type="button" style={{position:"absolute",right:12,background:"none",border:"none",cursor:"pointer",color:th.muted,display:"flex",padding:4}}><AIcon size={15}/></button>}
      </div>
      {error&&<p style={{fontSize:12,color:"#ef4444",fontFamily:"'Inter',sans-serif"}}>⚠ {error}</p>}
      {hint&&!error&&<p style={{fontSize:12,color:th.muted,fontFamily:"'Inter',sans-serif"}}>{hint}</p>}
      {maxLen&&<span style={{fontSize:11,color:th.muted,textAlign:"right",fontFamily:"'Inter',sans-serif"}}>{value.length}/{maxLen}</span>}
    </div>
  );
}

function FTextarea({label,value,onChange,placeholder,rows=4,maxLen}:{label?:string;value:string;onChange:(v:string)=>void;placeholder?:string;rows?:number;maxLen?:number}) {
  const th=useT(); const [f,setF]=useState(false);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {label&&<label style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:th.muted,fontFamily:"'Inter',sans-serif"}}>{label}</label>}
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} maxLength={maxLen}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        style={{width:"100%",background:th.inputBg,color:th.fg,border:`1.5px solid ${f?th.orange:th.border}`,borderRadius:12,padding:"12px 16px",fontSize:14,fontFamily:"'Inter',sans-serif",outline:"none",resize:"none",transition:"border-color 0.15s,box-shadow 0.15s",boxShadow:f?`0 0 0 3px ${th.orange}18`:"none"}}/>
      {maxLen&&<span style={{fontSize:11,color:th.muted,textAlign:"right",fontFamily:"'Inter',sans-serif"}}>{value.length}/{maxLen}</span>}
    </div>
  );
}

function FToggle({checked,onChange,label}:{checked:boolean;onChange:(v:boolean)=>void;label?:string}) {
  const th=useT();
  return (
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      {label&&<span style={{flex:1,fontSize:14,color:th.fg,fontFamily:"'Inter',sans-serif"}}>{label}</span>}
      <button onClick={()=>onChange(!checked)} type="button" style={{width:44,height:24,borderRadius:12,padding:2,background:checked?th.orange:th.border,border:"none",cursor:"pointer",transition:"background 0.2s",display:"flex",alignItems:"center",justifyContent:checked?"flex-end":"flex-start",flexShrink:0}}>
        <div style={{width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.2)",transition:"all 0.2s"}}/>
      </button>
    </div>
  );
}

function AccentCard({accent,children,onClick}:{accent:string;children:React.ReactNode;onClick?:()=>void}) {
  const th=useT(); const [h,setH]=useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{background:th.card,borderRadius:16,border:`1px solid ${th.border}`,borderLeft:`3px solid ${accent}`,overflow:"hidden",cursor:onClick?"pointer":"default",transition:"transform 0.15s,box-shadow 0.15s",transform:h&&onClick?"translateY(-1px)":"none",boxShadow:h&&onClick?"0 4px 14px rgba(14,47,90,0.1)":"0 1px 4px rgba(14,47,90,0.05)"}}>
      {children}
    </div>
  );
}

function HDivider() { const th=useT(); return <div style={{height:1,background:th.border}}/>; }

function SLabel({children,action,onAction}:{children:string;action?:string;onAction?:()=>void}) {
  const th=useT();
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
      <span style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.09em",color:th.muted,fontFamily:"'Inter',sans-serif"}}>{children}</span>
      {action&&<button onClick={onAction} style={{fontSize:13,fontWeight:700,color:th.orange,background:"none",border:"none",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{action}</button>}
    </div>
  );
}

function Empty({icon,title,sub,cta,onCta}:{icon:string;title:string;sub?:string;cta?:string;onCta?:()=>void}) {
  const th=useT();
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"32px 20px",gap:10,textAlign:"center"}}>
      <div style={{width:50,height:50,borderRadius:15,background:th.card2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{icon}</div>
      <p style={{fontSize:15,fontWeight:700,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{title}</p>
      {sub&&<p style={{fontSize:13,color:th.muted,fontFamily:"'Inter',sans-serif",lineHeight:1.5,maxWidth:200}}>{sub}</p>}
      {cta&&<Btn variant="ghost" size="sm" onClick={onCta}>{cta}</Btn>}
    </div>
  );
}

function SkelCard() {
  const th=useT();
  const s={height:12,borderRadius:6,background:th.isDark?"#1a2d42":"#dde5f0",animation:"skeletonPulse 1.6s ease-in-out infinite"};
  return (
    <div style={{background:th.card,borderRadius:16,padding:16,display:"flex",gap:12,alignItems:"center",border:`1px solid ${th.border}`}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}><div style={{...s,width:"60%"}}/><div style={{...s,width:"38%"}}/></div>
      <div style={{...s,width:58,height:22,borderRadius:11}}/>
    </div>
  );
}

function Badge({color,bg,children}:{color:string;bg:string;children:React.ReactNode}) {
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:9999,background:bg,color,fontSize:11,fontWeight:700,fontFamily:"'Inter',sans-serif",whiteSpace:"nowrap",flexShrink:0}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:color,flexShrink:0}}/>{children}
    </span>
  );
}

function MemberAvatar({member,size=40}:{member:Member;size?:number}) {
  const th=useT();
  const bg:Record<ClassRole,string>={owner:`linear-gradient(135deg,${th.navy},${th.orange})`,rep:`linear-gradient(135deg,${th.navy},#1a4a80)`,student:"linear-gradient(135deg,#4a6080,#6b7a9a)"};
  return (
    <div style={{width:size,height:size,borderRadius:size*0.28,background:bg[member.classRole],display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,position:"relative"}}>
      <span style={{fontSize:size*0.34,fontWeight:800,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{getInitials(member.name)}</span>
      {member.classRole!=="student"&&(
        <div style={{position:"absolute",bottom:-2,right:-2,width:size*0.35,height:size*0.35,borderRadius:"50%",background:ROLE_META[member.classRole].color,border:"2px solid white",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Star size={size*0.18} style={{color:"#fff"}} fill="#fff"/>
        </div>
      )}
    </div>
  );
}

// Decorative QR (no external dependency)
function SimpleQR({value,size=160,color="#0e2f5a"}:{value:string;size?:number;color?:string}) {
  const n=21,cell=size/n;
  const hash=(s:string)=>s.split("").reduce((h,c)=>(((h<<5)-h+c.charCodeAt(0))|0),5381)>>>0;
  const v=hash(value);
  const finder=(r:number,c:number)=>{
    if(r<7&&c<7){const ri=r>3?6-r:r,ci=c>3?6-c:c;return ri===0||ci===0||(ri>=2&&ri<=4&&ci>=2&&ci<=4);}
    if(r<7&&c>13){const c2=c-14,ri=r>3?6-r:r,ci=c2>3?6-c2:c2;return ri===0||ci===0||ci===6||(ri>=2&&ri<=4&&ci>=2&&ci<=4);}
    if(r>13&&c<7){const r2=r-14,ri=r2>3?6-r2:r2,ci=c>3?6-c:c;return ri===0||ri===6||ci===0||(ri>=2&&ri<=4&&ci>=2&&ci<=4);}
    return false;
  };
  const cells:boolean[]=[];
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){
    if(finder(r,c))cells.push(true);
    else if(r===6)cells.push(c%2===0);
    else if(c===6)cells.push(r%2===0);
    else cells.push(((v>>((r*n+c)%31))&1)===1);
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={size} fill="white" rx="8"/>
      {cells.map((on,i)=>{if(!on)return null;const r=Math.floor(i/n),c=i%n;return <rect key={i} x={c*cell+0.5} y={r*cell+0.5} width={cell-1} height={cell-1} fill={color}/>;})}
    </svg>
  );
}

// ─── PHONE SHELL ──────────────────────────────────────────────────────────────
function PhoneShell({children}:{children:React.ReactNode}) {
  const th=useT();
  return (
    <div style={{width:390,height:844,borderRadius:"3rem",overflow:"hidden",display:"flex",flexDirection:"column",border:"6px solid #1a2a3a",boxShadow:"0 30px 80px rgba(0,0,0,0.6)",background:th.bg,flexShrink:0,position:"relative"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 24px 6px",background:th.bg,flexShrink:0,zIndex:10,position:"relative"}}>
        <span style={{fontSize:12,fontWeight:600,color:th.fg,fontFamily:"'Inter',sans-serif"}}>9:41</span>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          <div style={{display:"flex",gap:2,alignItems:"flex-end",height:12}}>
            {[3,5,7,9].map((h,i)=><div key={i} style={{width:4,height:h,background:th.fg,borderRadius:2}}/>)}
          </div>
          <svg width="14" height="10" viewBox="0 0 14 10" style={{marginLeft:4}}>
            <path d="M7 2C9.21 2 11.21 2.85 12.7 4.26L14 2.94C12.13 1.11 9.69 0 7 0C4.31 0 1.87 1.11 0 2.94L1.3 4.26C2.79 2.85 4.79 2 7 2ZM7 6C8.37 6 9.62 6.55 10.53 7.46L11.83 6.14C10.55 4.84 8.87 4 7 4C5.13 4 3.45 4.84 2.17 6.14L3.47 7.46C4.38 6.55 5.63 6 7 6ZM9 9.5L7 12L5 9.5C5.57 8.97 6.25 8.67 7 8.67C7.75 8.67 8.43 8.97 9 9.5Z" fill={th.fg}/>
          </svg>
          <div style={{marginLeft:4,display:"flex",alignItems:"center"}}>
            <div style={{width:20,height:10,borderRadius:3,border:`1.5px solid ${th.fg}`,padding:1.5,display:"flex",alignItems:"center"}}><div style={{width:"75%",height:"100%",background:th.fg,borderRadius:1}}/></div>
          </div>
        </div>
      </div>
      {/* Inner: overflow hidden so screens are clipped to phone bounds */}
      <div style={{flex:1,overflow:"hidden",position:"relative"}}>
        {children}
      </div>
    </div>
  );
}

// ─── FLOATING NAV ─────────────────────────────────────────────────────────────
// CRITICAL: position:absolute so it stays at the bottom regardless of scroll
function FloatingNav({active,onNav,unread,isRep,onManage}:{
  active:"home"|"events"|"notifs"|"profile"|"manage";
  onNav:(t:"home"|"events"|"notifs"|"profile")=>void;
  unread?:number;isRep?:boolean;onManage?:()=>void;
}) {
  const th=useT();

  type StdTab={id:"home"|"events"|"notifs"|"profile";label:string};
  const studentTabs:StdTab[]=[{id:"home",label:"Início"},{id:"events",label:"Eventos"},{id:"notifs",label:"Avisos"},{id:"profile",label:"Perfil"}];
  const repTabs:StdTab[]=[{id:"home",label:"Início"},{id:"events",label:"Eventos"}];
  const tabs=isRep?repTabs:studentTabs;

  const icons:Record<string,React.ElementType>={
    home:(p:any)=><svg {...p} width={p.size??20} height={p.size??20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth??1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    events:Calendar, notifs:Bell, profile:User,
  };

  return (
    // Absolutely positioned — sits above everything, always at bottom of phone
    <div style={{position:"absolute",bottom:0,left:0,right:0,display:"flex",justifyContent:"center",padding:"8px 0 14px",zIndex:200,pointerEvents:"none"}}>
      <div style={{pointerEvents:"all",display:"flex",gap:3,padding:"5px",borderRadius:9999,background:th.isDark?"rgba(20,32,48,0.96)":"rgba(255,255,255,0.96)",backdropFilter:"blur(24px)",border:`1px solid ${th.border}`,boxShadow:th.isDark?"0 8px 32px rgba(0,0,0,0.6)":"0 8px 32px rgba(14,47,90,0.2)",alignItems:"center"}}>
        {tabs.map(({id,label})=>{
          const isActive=active===id;
          const Icon=icons[id]??User;
          return (
            <button key={id} onClick={()=>onNav(id)} title={label}
              style={{width:46,height:46,borderRadius:9999,background:isActive?th.orange:"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.18s",position:"relative",flexShrink:0}}>
              <Icon size={19} style={{color:isActive?"#fff":th.muted}} strokeWidth={isActive?2.5:1.8}/>
              {id==="notifs"&&(unread??0)>0&&<span style={{position:"absolute",top:8,right:8,width:7,height:7,borderRadius:"50%",background:"#ef4444",border:`2px solid ${th.isDark?"#142030":"#fff"}`}}/>}
            </button>
          );
        })}
        {isRep&&(
          <>
            <div style={{width:1,height:28,background:th.border,margin:"0 2px",flexShrink:0}}/>
            <button onClick={onManage} title="Gerenciar turma"
              style={{width:46,height:46,borderRadius:9999,background:active==="manage"?th.navy:"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.18s",flexShrink:0}}>
              <Star size={18} style={{color:active==="manage"?"#fff":th.muted}} fill={active==="manage"?"#fff":"none"} strokeWidth={active==="manage"?2.5:1.8}/>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── TOAST (top of screen) ────────────────────────────────────────────────────
function ToastLayer({toasts}:{toasts:Array<{id:number;msg:string;type:"success"|"error"|"info"}>}) {
  const colors:Record<string,string>={success:"#10b981",error:"#ef4444",info:"#e4822e"};
  const icons:Record<string,string>={success:"✓",error:"✕",info:"·"};
  return (
    // Positioned at TOP of the phone inner area
    <div style={{position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",zIndex:9999,display:"flex",flexDirection:"column",gap:8,alignItems:"center",width:"calc(100% - 32px)",pointerEvents:"none"}}>
      {toasts.map(t=>(
        <div key={t.id} className="toast-in" style={{display:"flex",alignItems:"center",gap:10,background:colors[t.type],color:"#fff",padding:"11px 16px",borderRadius:14,boxShadow:"0 4px 20px rgba(0,0,0,0.25)",fontSize:13,fontWeight:600,fontFamily:"'Inter',sans-serif",width:"100%"}}>
          <span style={{width:20,height:20,borderRadius:"50%",background:"rgba(255,255,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{icons[t.type]}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── QR MODAL ─────────────────────────────────────────────────────────────────
function QRModal({link,code,onClose}:{link:string;code:string;onClose:()=>void}) {
  const th=useT(); const toast=useToast(); const [coped,setCoped]=useState(false);
  const copy=()=>{navigator.clipboard?.writeText(link).catch(()=>{});setCoped(true);toast("Link copiado!","success");setTimeout(()=>setCoped(false),2000);};
  return (
    <div style={{position:"absolute",inset:0,zIndex:300,display:"flex",flexDirection:"column",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} className="screen-enter"
        style={{background:th.card,borderRadius:28,padding:24,display:"flex",flexDirection:"column",alignItems:"center",gap:18,width:"100%",maxWidth:320,boxShadow:"0 24px 64px rgba(0,0,0,0.4)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%"}}>
          <div><p style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:th.muted,fontFamily:"'Inter',sans-serif"}}>QR de acesso</p><p style={{fontSize:15,fontWeight:800,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif",marginTop:2}}>Compartilhar turma</p></div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:"50%",background:th.card2,border:`1px solid ${th.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={15} style={{color:th.muted}}/></button>
        </div>
        <div style={{padding:14,background:"#fff",borderRadius:20,boxShadow:"0 4px 20px rgba(14,47,90,0.12)"}}><SimpleQR value={link} size={180} color="#0e2f5a"/></div>
        <div style={{textAlign:"center"}}>
          <p style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:th.muted,fontFamily:"'Inter',sans-serif",marginBottom:6}}>Código</p>
          <p style={{fontSize:22,fontWeight:800,letterSpacing:"0.08em",color:th.navy,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{code}</p>
        </div>
        <div style={{width:"100%",display:"flex",alignItems:"center",gap:8,background:th.card2,borderRadius:12,padding:"10px 14px",border:`1px solid ${th.border}`}}>
          <span style={{flex:1,fontSize:11,color:th.muted,fontFamily:"'Inter',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{link}</span>
          <button onClick={copy} style={{background:coped?"#ecfdf5":th.orangeLight,color:coped?"#059669":th.orange,border:"none",borderRadius:8,padding:"5px 10px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all 0.2s",flexShrink:0,display:"flex",alignItems:"center",gap:4}}>{coped?<Check size={12} strokeWidth={3}/>:<Copy size={12}/>}</button>
        </div>
        <div style={{display:"flex",gap:10,width:"100%"}}>
          <Btn full variant="secondary" size="sm" onClick={copy} icon={Copy}>Copiar link</Btn>
          <Btn full size="sm" onClick={async()=>{try{await navigator.share?.({title:"Entrar na turma — Anot",text:`Código: ${code}`,url:link});}catch{copy();}}} icon={Send}>Compartilhar</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── MEMBER SHEET ─────────────────────────────────────────────────────────────
function MemberSheet({member,isOwner,onClose,onPromote,onDemote,onExpel}:{member:Member;isOwner:boolean;onClose:()=>void;onPromote:()=>void;onDemote:()=>void;onExpel:()=>void}) {
  const th=useT(); const toast=useToast(); const [conf,setConf]=useState(false);
  const rm=ROLE_META[member.classRole];
  return (
    <div style={{position:"absolute",inset:0,zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{flex:1,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)"}}/>
      <div style={{background:th.card,borderRadius:"24px 24px 0 0",padding:24,display:"flex",flexDirection:"column",gap:16}}>
        <div style={{width:40,height:4,background:th.border,borderRadius:2,alignSelf:"center"}}/>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          <MemberAvatar member={member} size={52}/>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:17,fontWeight:800,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{member.name}</p>
            <p style={{fontSize:13,color:th.muted,fontFamily:"'Inter',sans-serif",marginTop:2}}>{member.email}</p>
            <div style={{marginTop:6}}><Badge color={rm.color} bg={rm.bg}>{rm.label}</Badge></div>
          </div>
        </div>
        <HDivider/>
        {[["Entrou em",fmtDatePt(member.joinedAt)],["Função",rm.label]].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
            <span style={{color:th.muted,fontFamily:"'Inter',sans-serif"}}>{k}</span>
            <span style={{color:th.fg,fontWeight:600,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{v}</span>
          </div>
        ))}
        <HDivider/>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {member.classRole==="student"&&<button onClick={()=>{onPromote();toast(`${member.name} é agora Representante!`,"success");onClose();}} style={{padding:"13px 16px",borderRadius:14,background:th.card2,border:`1px solid ${th.border}`,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12}}><Star size={16} style={{color:th.navy}}/><span style={{fontSize:14,fontWeight:600,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Promover a Representante</span></button>}
          {member.classRole==="rep"&&isOwner&&<button onClick={()=>{onDemote();toast(`${member.name} voltou a ser Aluno`,"info");onClose();}} style={{padding:"13px 16px",borderRadius:14,background:th.card2,border:`1px solid ${th.border}`,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12}}><ChevronDown size={16} style={{color:th.muted}}/><span style={{fontSize:14,fontWeight:600,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Remover cargo de Representante</span></button>}
          {member.classRole!=="owner"&&!conf&&<button onClick={()=>setConf(true)} style={{padding:"13px 16px",borderRadius:14,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12}}><AlertTriangle size={16} style={{color:"#ef4444"}}/><span style={{fontSize:14,fontWeight:600,color:"#ef4444",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Expulsar da turma</span></button>}
          {conf&&<div style={{background:"#fef2f2",borderRadius:14,padding:14,border:"1px solid #fecaca"}}><p style={{fontSize:13,color:"#dc2626",fontFamily:"'Inter',sans-serif",marginBottom:10}}>Confirma a expulsão?</p><div style={{display:"flex",gap:8}}><Btn variant="secondary" size="sm" full onClick={()=>setConf(false)}>Cancelar</Btn><Btn size="sm" full onClick={()=>{onExpel();toast(`${member.name} foi removido`,"error");onClose();}} style={{background:"#ef4444"}}>Confirmar</Btn></div></div>}
          <button onClick={onClose} style={{padding:"13px 16px",borderRadius:14,background:"transparent",border:`1px solid ${th.border}`,cursor:"pointer",textAlign:"center",fontSize:14,fontWeight:600,color:th.muted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

// Helper: screen wrapper with correct layout for absolute FloatingNav
function ScreenWrap({children,bg}:{children:React.ReactNode;bg?:string}) {
  const th=useT();
  return (
    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",background:bg??th.bg,overflow:"hidden"}}>
      {children}
    </div>
  );
}

// ═══ SCREENS ══════════════════════════════════════════════════════════════════

function WelcomeScreen({onNav}:{onNav:(s:Screen)=>void}) {
  const th=useT();
  return (
    <ScreenWrap bg="linear-gradient(175deg,#0e2f5a 0%,#071825 100%)">
      <div style={{flex:1,display:"flex",flexDirection:"column",padding:"0 24px"}}>
        <div style={{flex:1}}/>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:22}}>
          <div style={{width:96,height:96,borderRadius:28,background:"rgba(228,130,46,0.15)",border:"1px solid rgba(228,130,46,0.3)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 48px rgba(228,130,46,0.12)"}}>
            <img src={logo} alt="Anot" width={64} height={64} style={{objectFit:"contain",filter:"brightness(0) invert(1)"}}/>
          </div>
          <div style={{textAlign:"center"}}>
            <h1 style={{fontSize:50,fontWeight:800,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:"-0.03em",lineHeight:1,marginBottom:10}}>Anot</h1>
            <p style={{fontSize:14,color:"rgba(255,255,255,0.5)",fontFamily:"'Inter',sans-serif",lineHeight:1.6}}>Comunicação acadêmica entre alunos<br/>e representantes de turma</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8,alignSelf:"stretch"}}>
            {["Atividades com data, horário e matéria","Avisos e comunicados em tempo real","Gestão completa pelo representante"].map(f=>(
              <div key={f} style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:"rgba(228,130,46,0.2)",border:"1px solid rgba(228,130,46,0.4)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Check size={10} style={{color:th.orange}} strokeWidth={3}/></div>
                <span style={{fontSize:13,color:"rgba(255,255,255,0.55)",fontFamily:"'Inter',sans-serif"}}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{flex:1}}/>
        <div style={{paddingBottom:40,display:"flex",flexDirection:"column",gap:10}}>
          <Btn full size="lg" onClick={()=>onNav("login")}>Entrar na conta</Btn>
          <Btn full size="lg" variant="ghost" onClick={()=>onNav("register")}>Criar conta gratuita</Btn>
          <p style={{textAlign:"center",fontSize:12,color:"rgba(255,255,255,0.22)",fontFamily:"'Inter',sans-serif",marginTop:4}}>Demo: ana@univ.edu.br · lucas@univ.edu.br</p>
        </div>
      </div>
    </ScreenWrap>
  );
}

function LoginScreen({onNav,onLogin}:{onNav:(s:Screen)=>void;onLogin:(email:string)=>void}) {
  const th=useT();
  const [email,setEmail]=useState(""); const [pwd,setPwd]=useState(""); const [showPwd,setShowPwd]=useState(false);
  const [errors,setErrors]=useState<{email?:string;pwd?:string}>({}); const [loading,setLoading]=useState(false);
  const submit=async()=>{
    const e:{email?:string;pwd?:string}={};
    if(!email.trim())e.email="E-mail é obrigatório"; else if(!isValidEmail(email))e.email="Formato inválido";
    if(!pwd)e.pwd="Senha é obrigatória"; else if(pwd.length<6)e.pwd="Mínimo 6 caracteres";
    setErrors(e); if(Object.keys(e).length>0)return;
    setLoading(true); await new Promise(r=>setTimeout(r,700)); setLoading(false); onLogin(email.trim().toLowerCase());
  };
  return (
    <ScreenWrap>
      <div style={{overflowY:"auto"}} className="hide-scrollbar">
        <div style={{background:th.headerBg,padding:"16px 20px 30px"}}>
          <button onClick={()=>onNav("welcome")} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:16}}><ArrowLeft size={18} style={{color:"rgba(255,255,255,0.7)"}}/></button>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}><img src={logo} alt="Anot" width={20} height={20} style={{objectFit:"contain",filter:"brightness(0) invert(1)"}}/><span style={{color:"rgba(255,255,255,0.4)",fontSize:12,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600}}>Anot</span></div>
          <h1 style={{fontSize:24,fontWeight:800,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Entrar na conta</h1>
        </div>
        <div style={{padding:"0 20px",marginTop:-16,paddingBottom:24}}>
          <div style={{background:th.card,borderRadius:22,padding:22,boxShadow:"0 4px 20px rgba(14,47,90,0.1)",display:"flex",flexDirection:"column",gap:14}}>
            <FInput label="E-mail" type="email" value={email} onChange={setEmail} placeholder="seu@email.edu.br" error={errors.email} icon={Mail}/>
            <FInput label="Senha" type={showPwd?"text":"password"} value={pwd} onChange={setPwd} placeholder="••••••••" error={errors.pwd} icon={Shield} actionIcon={showPwd?EyeOff:Eye} onAction={()=>setShowPwd(p=>!p)}/>
            <button style={{alignSelf:"flex-end",fontSize:13,color:th.orange,fontWeight:600,background:"none",border:"none",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Esqueci minha senha</button>
            <Btn full size="lg" onClick={submit} loading={loading}>Entrar</Btn>
            <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{flex:1,height:1,background:th.border}}/><span style={{fontSize:11,color:th.muted,fontFamily:"'Inter',sans-serif"}}>acesso demo</span><div style={{flex:1,height:1,background:th.border}}/></div>
            <div style={{display:"flex",gap:8}}>
              {[{e:"ana@univ.edu.br",l:"Ana (aluno)"},{e:"lucas@univ.edu.br",l:"Lucas (rep)"}].map(({e,l})=>(
                <button key={e} onClick={()=>{setEmail(e);setPwd("demo123");setErrors({});}} style={{flex:1,padding:"8px 6px",borderRadius:10,background:th.card2,border:`1px solid ${th.border}`,cursor:"pointer",fontSize:11,color:th.muted,fontFamily:"'Inter',sans-serif",textAlign:"center"}}>{l}</button>
              ))}
            </div>
          </div>
          <p style={{textAlign:"center",marginTop:14,fontSize:14,color:th.muted,fontFamily:"'Inter',sans-serif"}}>Não tem conta? <button onClick={()=>onNav("register")} style={{color:th.navy,fontWeight:700,background:"none",border:"none",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14}}>Criar conta</button></p>
        </div>
      </div>
    </ScreenWrap>
  );
}

function RegisterScreen({onNav,onRegister}:{onNav:(s:Screen)=>void;onRegister:(name:string,email:string)=>void}) {
  const th=useT();
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [pwd,setPwd]=useState(""); const [cpwd,setCpwd]=useState("");
  const [showPwd,setShowPwd]=useState(false); const [terms,setTerms]=useState(false);
  const [errors,setErrors]=useState<Record<string,string>>({}); const [loading,setLoading]=useState(false);
  const submit=async()=>{
    const e:Record<string,string>={};
    if(!name.trim())e.name="Nome obrigatório"; if(!email.trim())e.email="E-mail obrigatório"; else if(!isValidEmail(email))e.email="Formato inválido";
    if(!pwd)e.pwd="Senha obrigatória"; else if(pwd.length<6)e.pwd="Mínimo 6 caracteres"; if(pwd!==cpwd)e.cpwd="Senhas não coincidem"; if(!terms)e.terms="Aceite os termos";
    setErrors(e); if(Object.keys(e).length>0)return;
    setLoading(true); await new Promise(r=>setTimeout(r,800)); setLoading(false); onRegister(name.trim(),email.trim().toLowerCase());
  };
  return (
    <ScreenWrap>
      <div style={{overflowY:"auto"}} className="hide-scrollbar">
        <div style={{background:th.headerBg,padding:"16px 20px 30px"}}>
          <button onClick={()=>onNav("welcome")} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:16}}><ArrowLeft size={18} style={{color:"rgba(255,255,255,0.7)"}}/></button>
          <h1 style={{fontSize:24,fontWeight:800,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Criar conta</h1>
        </div>
        <div style={{padding:"0 20px",marginTop:-16,paddingBottom:24}}>
          <div style={{background:th.card,borderRadius:22,padding:22,boxShadow:"0 4px 20px rgba(14,47,90,0.1)",display:"flex",flexDirection:"column",gap:13}}>
            <FInput label="Nome completo" value={name} onChange={setName} placeholder="Ana Carolina Silva" error={errors.name} icon={User}/>
            <FInput label="E-mail" type="email" value={email} onChange={setEmail} placeholder="seu@email.edu.br" error={errors.email} icon={Mail}/>
            <FInput label="Senha" type={showPwd?"text":"password"} value={pwd} onChange={setPwd} placeholder="Mínimo 6 caracteres" error={errors.pwd} icon={Shield} actionIcon={showPwd?EyeOff:Eye} onAction={()=>setShowPwd(p=>!p)}/>
            <FInput label="Confirmar senha" type={showPwd?"text":"password"} value={cpwd} onChange={setCpwd} placeholder="Repita a senha" error={errors.cpwd} icon={Shield}/>
            <button onClick={()=>setTerms(p=>!p)} style={{display:"flex",alignItems:"flex-start",gap:10,background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:0}}>
              <div style={{width:20,height:20,borderRadius:6,background:terms?th.orange:th.inputBg,border:`1.5px solid ${terms?th.orange:th.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,transition:"all 0.15s"}}>{terms&&<Check size={11} style={{color:"#fff"}} strokeWidth={3}/>}</div>
              <span style={{fontSize:13,color:th.muted,fontFamily:"'Inter',sans-serif",lineHeight:1.5}}>Aceito os <span style={{color:th.navy,fontWeight:600}}>Termos</span> e a <span style={{color:th.navy,fontWeight:600}}>Política de Privacidade</span></span>
            </button>
            {errors.terms&&<p style={{fontSize:12,color:"#ef4444",fontFamily:"'Inter',sans-serif"}}>⚠ {errors.terms}</p>}
            <Btn full size="lg" onClick={submit} loading={loading}>Criar conta</Btn>
          </div>
          <p style={{textAlign:"center",marginTop:14,fontSize:14,color:th.muted,fontFamily:"'Inter',sans-serif"}}>Já tem conta? <button onClick={()=>onNav("login")} style={{color:th.navy,fontWeight:700,background:"none",border:"none",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14}}>Entrar</button></p>
        </div>
      </div>
    </ScreenWrap>
  );
}

function DashboardScreen({user,userClasses,onNav}:{user:AppUser;userClasses:AppClass[];onNav:(s:Screen)=>void}) {
  const th=useT();
  return (
    <ScreenWrap>
      <div style={{overflowY:"auto"}} className="hide-scrollbar">
        <div style={{background:th.headerBg,padding:"18px 20px 26px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><img src={logo} alt="Anot" width={22} height={22} style={{objectFit:"contain",filter:"brightness(0) invert(1)"}}/><span style={{color:"rgba(255,255,255,0.4)",fontSize:12,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600}}>Anot</span></div>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.5)",fontFamily:"'Inter',sans-serif"}}>Olá, {user.name.split(" ")[0]} 👋</p>
          <h1 style={{fontSize:22,fontWeight:800,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif",marginTop:2}}>Minhas turmas</h1>
        </div>
        <div style={{padding:18,display:"flex",flexDirection:"column",gap:14}}>
          {userClasses.length>0&&userClasses.map(c=>(
            <AccentCard key={c.id} accent={th.orange} onClick={()=>onNav("classHome")}>
              <div style={{padding:16,display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:44,height:44,borderRadius:14,background:th.orangeLight,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><GraduationCap size={20} style={{color:th.orange}}/></div>
                <div style={{flex:1,minWidth:0}}><p style={{fontSize:14,fontWeight:700,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</p><p style={{fontSize:12,color:th.muted,fontFamily:"'Inter',sans-serif",marginTop:2}}>{c.period} · {c.members.length} membros</p></div>
                <ChevronRight size={16} style={{color:th.muted,flexShrink:0}}/>
              </div>
            </AccentCard>
          ))}
          <SLabel>Acessar uma turma</SLabel>
          {[{label:"Criar Turma",sub:"Sou representante",Icon:Plus,color:th.orange,bg:th.orangeLight,s:"createClass" as Screen},{label:"Entrar em Turma",sub:"Tenho um código",Icon:Hash,color:th.navy,bg:th.navyLight,s:"joinClass" as Screen}].map(({label,sub,Icon,color,bg,s})=>(
            <button key={label} onClick={()=>onNav(s)} style={{background:th.card,borderRadius:18,border:`1px solid ${th.border}`,borderLeft:`3px solid ${color}`,padding:18,display:"flex",alignItems:"center",gap:14,cursor:"pointer",textAlign:"left",transition:"all 0.15s",outline:"none"}}>
              <div style={{width:48,height:48,borderRadius:15,background:bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon size={22} style={{color}}/></div>
              <div><p style={{fontSize:15,fontWeight:700,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{label}</p><p style={{fontSize:12,color:th.muted,fontFamily:"'Inter',sans-serif",marginTop:2}}>{sub}</p></div>
              <ChevronRight size={16} style={{color:th.muted,marginLeft:"auto"}}/>
            </button>
          ))}
        </div>
      </div>
    </ScreenWrap>
  );
}

function CreateClassScreen({onNav,onCreate}:{onNav:(s:Screen)=>void;onCreate:(d:{name:string;course:string;institution:string;period:string;modality:Modality})=>void}) {
  const th=useT();
  const [form,setForm]=useState({name:"",course:"",institution:"",period:"",modality:"presencial" as Modality});
  const [errors,setErrors]=useState<Record<string,string>>({}); const [loading,setLoading]=useState(false);
  const set=(k:string,v:string)=>setForm(p=>({...p,[k]:v}));
  const submit=async()=>{
    const e:Record<string,string>={};
    if(!form.name.trim())e.name="Nome obrigatório"; if(!form.course.trim())e.course="Obrigatório"; if(!form.institution.trim())e.inst="Obrigatório"; if(!form.period.trim())e.period="Período obrigatório";
    setErrors(e); if(Object.keys(e).length>0)return;
    setLoading(true); await new Promise(r=>setTimeout(r,700)); setLoading(false); onCreate(form);
  };
  return (
    <ScreenWrap>
      <div style={{overflowY:"auto"}} className="hide-scrollbar">
        <div style={{background:th.headerBg,padding:"16px 20px 26px"}}>
          <button onClick={()=>onNav("dashboard")} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:14}}><ArrowLeft size={18} style={{color:"rgba(255,255,255,0.7)"}}/></button>
          <h1 style={{fontSize:22,fontWeight:800,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Criar Turma</h1>
        </div>
        <div style={{padding:"0 20px",marginTop:-14,paddingBottom:24}}>
          <div style={{background:th.card,borderRadius:22,padding:22,boxShadow:"0 4px 20px rgba(14,47,90,0.1)",display:"flex",flexDirection:"column",gap:14}}>
            <FInput label="Nome da turma" value={form.name} onChange={v=>set("name",v)} placeholder="Engenharia Civil — Turma A" error={errors.name} maxLen={60}/>
            <FInput label="Curso" value={form.course} onChange={v=>set("course",v)} placeholder="Engenharia Civil" error={errors.course} icon={BookOpen}/>
            <FInput label="Instituição" value={form.institution} onChange={v=>set("institution",v)} placeholder="Universidade Federal do Brasil" error={errors.inst}/>
            <FInput label="Período" value={form.period} onChange={v=>set("period",v)} placeholder="2025.1" error={errors.period}/>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <span style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:th.muted,fontFamily:"'Inter',sans-serif"}}>Modalidade</span>
              <div style={{display:"flex",gap:8}}>
                {(["presencial","ead","hibrido"] as Modality[]).map(m=>(
                  <button key={m} onClick={()=>set("modality",m)} style={{flex:1,padding:"9px 6px",borderRadius:12,fontSize:12,fontWeight:600,cursor:"pointer",border:`1.5px solid ${form.modality===m?th.orange:th.border}`,background:form.modality===m?th.orangeLight:th.inputBg,color:form.modality===m?th.orange:th.muted,fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all 0.15s"}}>
                    {m==="presencial"?"Presencial":m==="ead"?"EaD":"Híbrido"}
                  </button>
                ))}
              </div>
            </div>
            <Btn full size="lg" onClick={submit} loading={loading} icon={Plus}>Criar Turma</Btn>
          </div>
        </div>
      </div>
    </ScreenWrap>
  );
}

function ClassCreatedScreen({cls,onNav}:{cls:AppClass|null;onNav:(s:Screen)=>void}) {
  const th=useT(); const toast=useToast(); const [copied,setCopied]=useState(false);
  if(!cls)return null;
  const copy=()=>{navigator.clipboard?.writeText(cls.code).catch(()=>{});setCopied(true);toast("Código copiado!","success");setTimeout(()=>setCopied(false),2000);};
  return (
    <ScreenWrap>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:24,gap:18}}>
        <div style={{width:70,height:70,borderRadius:22,background:"#ecfdf5",display:"flex",alignItems:"center",justifyContent:"center"}}><Check size={34} style={{color:"#10b981"}} strokeWidth={2.5}/></div>
        <div style={{textAlign:"center"}}><h2 style={{fontSize:22,fontWeight:800,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Turma criada!</h2><p style={{fontSize:13,color:th.muted,marginTop:5,fontFamily:"'Inter',sans-serif"}}>Compartilhe o código abaixo</p></div>
        <div style={{width:"100%",background:th.card,borderRadius:22,padding:22,boxShadow:"0 4px 20px rgba(14,47,90,0.1)",display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
          <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:th.muted,fontFamily:"'Inter',sans-serif"}}>Código de acesso</p>
          <p style={{fontSize:26,fontWeight:800,letterSpacing:"0.08em",color:th.navy,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{cls.code}</p>
          <button onClick={copy} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 16px",borderRadius:12,background:copied?"#ecfdf5":th.orangeLight,color:copied?"#059669":th.orange,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all 0.2s"}}>
            {copied?<Check size={13} strokeWidth={3}/>:<Copy size={13}/>}{copied?"Copiado!":"Copiar código"}
          </button>
        </div>
        <Btn full size="lg" onClick={()=>onNav("classHome")}>Ir para a turma →</Btn>
      </div>
    </ScreenWrap>
  );
}

function JoinClassScreen({classes,onNav,onJoin}:{classes:AppClass[];onNav:(s:Screen)=>void;onJoin:(id:string)=>void}) {
  const th=useT(); const toast=useToast();
  const [code,setCode]=useState(""); const [status,setStatus]=useState<"idle"|"loading"|"found"|"error">("idle"); const [found,setFound]=useState<AppClass|null>(null);
  const search=async()=>{
    if(!code.trim())return; setStatus("loading"); await new Promise(r=>setTimeout(r,600));
    const m=classes.find(c=>c.code.toUpperCase()===code.trim().toUpperCase());
    if(m){setFound(m);setStatus("found");}else{setFound(null);setStatus("error");}
  };
  return (
    <ScreenWrap>
      <div style={{overflowY:"auto"}} className="hide-scrollbar">
        <div style={{background:th.headerBg,padding:"16px 20px 26px"}}>
          <button onClick={()=>onNav("dashboard")} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:14}}><ArrowLeft size={18} style={{color:"rgba(255,255,255,0.7)"}}/></button>
          <h1 style={{fontSize:22,fontWeight:800,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Entrar em Turma</h1>
        </div>
        <div style={{padding:"0 20px",marginTop:-14,paddingBottom:24,display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:th.card,borderRadius:22,padding:22,boxShadow:"0 4px 20px rgba(14,47,90,0.1)",display:"flex",flexDirection:"column",gap:13}}>
            <FInput label="Código da turma" value={code} onChange={v=>{setCode(v.toUpperCase());if(status!=="idle")setStatus("idle");}} placeholder="ENG-2025-XXXX" icon={Hash} error={status==="error"?"Código não encontrado.":undefined}/>
            <Btn full onClick={search} loading={status==="loading"}>Verificar código</Btn>
          </div>
          {status==="found"&&found&&(
            <div style={{background:"#ecfdf5",borderRadius:18,padding:18,border:"1px solid #a7f3d0"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><div style={{width:32,height:32,borderRadius:10,background:"#d1fae5",display:"flex",alignItems:"center",justifyContent:"center"}}><Check size={16} style={{color:"#059669"}} strokeWidth={2.5}/></div><p style={{fontSize:14,fontWeight:700,color:"#059669",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Turma encontrada!</p></div>
              {[["Turma",found.name],["Período",found.period],["Membros",`${found.members.length}`]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}><span style={{color:"#065f46",fontFamily:"'Inter',sans-serif"}}>{k}</span><span style={{color:"#064e3b",fontWeight:600,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{v}</span></div>
              ))}
              <div style={{marginTop:10}}><Btn full onClick={()=>{onJoin(found!.id);toast(`Entrou em ${found!.name}!`,"success");onNav("classHome");}} style={{background:"#059669"}}>Confirmar entrada</Btn></div>
            </div>
          )}
        </div>
      </div>
    </ScreenWrap>
  );
}

// ─── CLASS HOME ───────────────────────────────────────────────────────────────
function ClassHomeScreen({cls,user,myRole,statuses,onNav,onOpenAct,toggleDark,dark,unread}:{
  cls:AppClass;user:AppUser;myRole:ClassRole;statuses:Record<string,ActivityStatus>;
  onNav:(s:Screen)=>void;onOpenAct:(id:string)=>void;toggleDark:()=>void;dark:boolean;unread:number;
}) {
  const th=useT(); const loading=useLoad(600);
  const [search,setSearch]=useState("");
  const [actFilter,setActFilter]=useState<"todos"|ActivityType>("todos");
  const isRep=myRole==="owner"||myRole==="rep";
  const q=search.toLowerCase();
  const exams=cls.events.filter(e=>e.type==="prova"&&(e.month===5||e.month===6));
  const acts=cls.activities
    .filter(a=>actFilter==="todos"||a.type===actFilter)
    .filter(a=>!q||a.title.toLowerCase().includes(q)||a.subject.toLowerCase().includes(q));

  return (
    <ScreenWrap>
      {/* Header */}
      <div style={{background:th.headerBg,padding:"12px 20px 12px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div>
            <p style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:"rgba(255,255,255,0.4)",fontFamily:"'Inter',sans-serif",marginBottom:2}}>{cls.period} · {cls.course}</p>
            <h1 style={{fontSize:18,fontWeight:800,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Olá, {user.name.split(" ")[0]} 👋</h1>
          </div>
          <button onClick={toggleDark} style={{width:36,height:36,borderRadius:11,background:"rgba(255,255,255,0.1)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {dark?<Sun size={15} style={{color:"rgba(255,255,255,0.8)"}}/>:<Moon size={15} style={{color:"rgba(255,255,255,0.8)"}}/>}
          </button>
        </div>
        {/* Activity filter chips */}
        <div style={{display:"flex",gap:5,overflowX:"auto"}} className="hide-scrollbar">
          {(["todos","dever","trabalho","teste","outros"] as const).map(k=>(
            <button key={k} onClick={()=>setActFilter(k)}
              style={{flexShrink:0,padding:"6px 13px",borderRadius:9999,fontSize:12,fontWeight:700,border:"none",cursor:"pointer",transition:"all 0.18s",background:actFilter===k?"rgba(255,255,255,0.92)":"rgba(255,255,255,0.13)",color:actFilter===k?th.navy:"rgba(255,255,255,0.7)",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              {k==="todos"?"Todos":k==="dever"?"Dever":k==="trabalho"?"Trabalho":k==="teste"?"Teste/Prova":"Outros"}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content with paddingBottom for nav */}
      <div style={{flex:1,overflowY:"auto",padding:"14px 18px",paddingBottom:88}} className="hide-scrollbar">
        {/* Search */}
        <div style={{display:"flex",alignItems:"center",gap:10,background:th.card,borderRadius:13,padding:"11px 13px",border:`1px solid ${th.border}`,marginBottom:14}}>
          <Search size={14} style={{color:th.muted,flexShrink:0}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar atividades..." style={{flex:1,background:"none",border:"none",outline:"none",fontSize:14,color:th.fg,fontFamily:"'Inter',sans-serif"}}/>
          {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:th.muted,display:"flex"}}><X size={13}/></button>}
        </div>

        <SLabel>Atividades</SLabel>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
          {loading?[1,2,3].map(i=><SkelCard key={i}/>):acts.length===0
            ?<Empty icon="📚" title="Nenhuma atividade" sub={actFilter==="todos"?"Sem atividades cadastradas":"Sem atividades nessa categoria"}/>
            :acts.map(a=>{
              const st=statuses[a.id]??"todo"; const sm=STATUS_META[st]; const tm=ACT_META[a.type];
              return (
                <AccentCard key={a.id} accent={sm.color} onClick={()=>onOpenAct(a.id)}>
                  <div style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                        <span style={{fontSize:10,fontWeight:700,color:tm.color,fontFamily:"'Inter',sans-serif",textTransform:"uppercase",letterSpacing:"0.06em"}}>{tm.label}</span>
                        {a.dueTime&&<span style={{fontSize:10,color:th.muted,fontFamily:"'Inter',sans-serif"}}>· {a.dueTime}</span>}
                      </div>
                      <p style={{fontSize:13,fontWeight:700,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.title}</p>
                      <p style={{fontSize:11,color:th.muted,marginTop:2,fontFamily:"'Inter',sans-serif"}}>{a.subject} · {a.dueLabel}</p>
                    </div>
                    <Badge color={sm.color} bg={sm.bg}>{sm.label}</Badge>
                    <ChevronRight size={14} style={{color:th.muted,flexShrink:0}}/>
                  </div>
                </AccentCard>
              );
            })}
        </div>

        {exams.length>0&&(
          <>
            <SLabel>Provas próximas</SLabel>
            <div style={{background:th.card,borderRadius:16,overflow:"hidden",border:`1px solid ${th.border}`,marginBottom:8}}>
              {exams.map((ev,i)=>{
                const cm=CAL_MONTHS.find(m=>m.month===ev.month);
                return (
                  <div key={ev.id}>{i>0&&<HDivider/>}
                    <div style={{padding:"11px 14px",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:40,height:40,borderRadius:12,background:"#fef2f2",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <span style={{fontSize:9,fontWeight:700,color:"#dc2626",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{cm?.short??"MAI"}</span>
                        <span style={{fontSize:16,fontWeight:800,color:"#dc2626",lineHeight:1,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{ev.day}</span>
                      </div>
                      <div style={{flex:1}}><p style={{fontSize:13,fontWeight:700,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{ev.subject??ev.title}</p>{ev.room&&<p style={{fontSize:11,color:th.muted,fontFamily:"'Inter',sans-serif",marginTop:2}}>{ev.room}</p>}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <FloatingNav active="home" onNav={t=>{if(t==="events")onNav("events");if(t==="notifs")onNav("notifications");if(t==="profile")onNav("profile");}} unread={unread} isRep={isRep} onManage={()=>onNav("repPanel")}/>
    </ScreenWrap>
  );
}

// ─── ACTIVITY DETAIL ──────────────────────────────────────────────────────────
function ActivityDetailScreen({cls,actId,statuses,notes,onSetStatus,onSetNotes,onNav,isRep,onEditActivity,onDelActivity}:{
  cls:AppClass;actId:string|null;statuses:Record<string,ActivityStatus>;notes:Record<string,string>;
  onSetStatus:(id:string,s:ActivityStatus)=>void;onSetNotes:(id:string,n:string)=>void;onNav:(s:Screen)=>void;
  isRep?:boolean;onEditActivity?:(id:string)=>void;onDelActivity?:(id:string)=>void;
}) {
  const th=useT(); const toast=useToast();
  const act=cls.activities.find(a=>a.id===actId); if(!act)return null;
  const current=statuses[act.id]??"todo"; const tm=ACT_META[act.type];
  const [confirmDel,setConfirmDel]=useState(false);
  const opts:[ActivityStatus,string,React.ElementType][]=[["todo","Ainda não iniciei",Circle],["in_progress","Estou trabalhando nisto",Clock],["done","Atividade concluída!",Check]];
  const back=()=>onNav(isRep?"repPanel":"classHome");

  return (
    <ScreenWrap>
      <div style={{background:th.headerBg,padding:"14px 20px 20px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <button onClick={back} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><ArrowLeft size={18} style={{color:"rgba(255,255,255,0.7)"}}/></button>
          {isRep&&(
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>onEditActivity?.(act.id)} style={{width:34,height:34,borderRadius:10,background:"rgba(255,255,255,0.12)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Edit3 size={15} style={{color:"#fff"}}/></button>
              <button onClick={()=>setConfirmDel(true)} style={{width:34,height:34,borderRadius:10,background:"rgba(239,68,68,0.25)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={15} style={{color:"#fca5a5"}}/></button>
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
          <div style={{width:44,height:44,borderRadius:14,background:`${tm.color}25`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><FileText size={20} style={{color:tm.color}}/></div>
          <div><p style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"rgba(255,255,255,0.4)",fontFamily:"'Inter',sans-serif",marginBottom:3}}>{tm.label}</p><h2 style={{fontSize:16,fontWeight:800,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1.3}}>{act.title}</h2></div>
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"16px 18px",paddingBottom:24}} className="hide-scrollbar">
        {confirmDel&&(
          <div style={{background:"#fef2f2",borderRadius:14,padding:16,border:"1px solid #fecaca",marginBottom:16}}>
            <p style={{fontSize:13,color:"#dc2626",fontWeight:600,fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:6}}>Excluir esta atividade?</p>
            <p style={{fontSize:12,color:"#dc2626",fontFamily:"'Inter',sans-serif",marginBottom:12}}>Esta ação não pode ser desfeita. Todos os alunos perderão o acesso.</p>
            <div style={{display:"flex",gap:8}}><Btn variant="secondary" size="sm" full onClick={()=>setConfirmDel(false)}>Cancelar</Btn><Btn size="sm" full onClick={()=>{onDelActivity?.(act.id);toast("Atividade excluída","info");back();}} style={{background:"#ef4444"}}>Excluir definitivamente</Btn></div>
          </div>
        )}

        <div style={{background:th.card,borderRadius:14,display:"flex",marginBottom:14,border:`1px solid ${th.border}`,overflow:"hidden"}}>
          {[{label:"Matéria",val:act.subject},{label:"Prazo",val:`${act.dueLabel}${act.dueTime?`, ${act.dueTime}`:""}`},{label:"Tipo",val:tm.label}].map(({label,val},i,arr)=>(
            <div key={label} style={{flex:1,padding:"10px 6px",textAlign:"center",borderRight:i<arr.length-1?`1px solid ${th.border}`:"none"}}>
              <p style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:th.muted,fontFamily:"'Inter',sans-serif",marginBottom:3}}>{label}</p>
              <p style={{fontSize:12,fontWeight:700,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{val}</p>
            </div>
          ))}
        </div>

        {act.description&&<div style={{background:th.card2,borderRadius:14,padding:"12px 14px",marginBottom:14,border:`1px solid ${th.border}`}}><p style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:th.muted,fontFamily:"'Inter',sans-serif",marginBottom:5}}>Descrição</p><p style={{fontSize:13,color:th.fg,fontFamily:"'Inter',sans-serif",lineHeight:1.5}}>{act.description}</p><p style={{fontSize:11,color:th.muted,fontFamily:"'Inter',sans-serif",marginTop:6}}>Por {act.createdByName}</p></div>}

        <SLabel>Meu progresso</SLabel>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
          {opts.map(([key,desc,Icon])=>{
            const sm=STATUS_META[key]; const isSel=current===key;
            return (
              <button key={key} onClick={()=>onSetStatus(act.id,key)} style={{display:"flex",alignItems:"center",gap:12,padding:13,borderRadius:14,border:`2px solid ${isSel?sm.color:th.border}`,background:isSel?sm.bg:th.card,cursor:"pointer",textAlign:"left",transition:"all 0.18s",boxShadow:isSel?`0 0 0 4px ${sm.color}15`:"none",outline:"none"}}>
                <div style={{width:42,height:42,borderRadius:13,background:isSel?`${sm.color}18`:th.card2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.18s"}}><Icon size={20} style={{color:isSel?sm.color:th.muted}} strokeWidth={isSel?2.5:1.8}/></div>
                <div style={{flex:1}}><p style={{fontSize:14,fontWeight:700,color:isSel?sm.color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{sm.label}</p><p style={{fontSize:12,color:th.muted,marginTop:2,fontFamily:"'Inter',sans-serif"}}>{desc}</p></div>
                {isSel&&<div style={{width:22,height:22,borderRadius:"50%",background:sm.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Check size={12} style={{color:"#fff"}} strokeWidth={3}/></div>}
              </button>
            );
          })}
        </div>
        <SLabel>Minhas notas</SLabel>
        <FTextarea value={notes[act.id]??""} onChange={v=>onSetNotes(act.id,v)} placeholder="Anote observações ou dúvidas..." rows={4} maxLen={500}/>
        <div style={{marginTop:12}}><Btn full size="lg" onClick={()=>{toast("Progresso salvo!","success");back();}}>Salvar progresso</Btn></div>
      </div>
    </ScreenWrap>
  );
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
function NotificationsScreen({cls,read,onMarkRead,onNav,unread,isRep,userId}:{cls:AppClass;read:Set<string>;onMarkRead:(ids:string[])=>void;onNav:(s:Screen)=>void;unread:number;isRep?:boolean;userId?:string}) {
  const th=useT(); const [search,setSearch]=useState("");
  // Filter expired announcements (> 21 days)
  const active=cls.announcements.filter(a=>!isExpired(a.createdAt));
  const filtered=active.filter(a=>!search||a.title.toLowerCase().includes(search.toLowerCase())||a.desc.toLowerCase().includes(search.toLowerCase()));

  return (
    <ScreenWrap>
      <div style={{background:th.headerBg,padding:"12px 20px 12px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div>
            <p style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:"rgba(255,255,255,0.4)",fontFamily:"'Inter',sans-serif",marginBottom:2}}>{cls.name}</p>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <h1 style={{fontSize:20,fontWeight:800,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Avisos</h1>
              {unread>0&&<span style={{fontSize:12,fontWeight:700,background:"#ef4444",color:"#fff",borderRadius:9999,padding:"2px 7px",fontFamily:"'Inter',sans-serif"}}>{unread}</span>}
            </div>
          </div>
          {unread>0&&<button onClick={()=>onMarkRead(active.map(a=>a.id))} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,padding:"7px 11px",color:"rgba(255,255,255,0.7)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Marcar lidas</button>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:9,background:"rgba(255,255,255,0.1)",borderRadius:11,padding:"8px 13px"}}>
          <Search size={13} style={{color:"rgba(255,255,255,0.4)"}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar avisos..." style={{flex:1,background:"none",border:"none",outline:"none",fontSize:13,color:"#fff",fontFamily:"'Inter',sans-serif"}}/>
          {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",display:"flex"}}><X size={12}/></button>}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"13px 18px",paddingBottom:88}} className="hide-scrollbar">
        {filtered.length===0?<Empty icon="📭" title="Nenhum aviso" sub={search?"Nenhum resultado":"Sem avisos recentes"}/>:
          filtered.map(a=>{
            const pm=PRIORITY_META[a.priority]; const isUnread=!read.has(a.id)&&a.authorId!==userId;
            return (
              <div key={a.id} onClick={()=>onMarkRead([a.id])} style={{marginBottom:10,cursor:"pointer"}}>
                <AccentCard accent={pm.dot}>
                  <div style={{padding:13}}>
                    <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start",marginBottom:5}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,flex:1,minWidth:0}}>
                        {isUnread&&<span style={{width:7,height:7,borderRadius:"50%",background:th.orange,flexShrink:0}}/>}
                        <p style={{fontSize:13,fontWeight:isUnread?700:600,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.title}</p>
                      </div>
                      <Badge color={pm.text} bg={pm.bg}>{pm.label}</Badge>
                    </div>
                    <p style={{fontSize:12,color:th.muted,fontFamily:"'Inter',sans-serif",lineHeight:1.5,marginBottom:7}}>{a.desc}</p>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontSize:11,fontWeight:600,color:th.orange,fontFamily:"'Inter',sans-serif"}}>{a.authorName}</span>
                      <span style={{fontSize:11,color:th.muted,fontFamily:"'Inter',sans-serif"}}>{a.date}</span>
                    </div>
                  </div>
                </AccentCard>
              </div>
            );
          })}
      </div>
      <FloatingNav active="notifs" onNav={t=>{if(t==="home")onNav("classHome");if(t==="events")onNav("events");if(t==="profile")onNav("profile");}} unread={unread} isRep={isRep} onManage={()=>onNav("repPanel")}/>
    </ScreenWrap>
  );
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────
function EventsScreen({cls,onNav,isRep}:{cls:AppClass;onNav:(s:Screen)=>void;isRep?:boolean}) {
  const th=useT();
  const [monthIdx,setMonthIdx]=useState(1); // index into CAL_MONTHS (default May = index 1)
  const [selDay,setSelDay]=useState<number|null>(28);
  const [filter,setFilter]=useState<"all"|EventKind>("all");

  const cm=CAL_MONTHS[monthIdx]!;
  const totalCells=Math.ceil((cm.offset+cm.days)/7)*7;
  const todayMonth=5; const todayDay=28; // demo today

  const monthEvs=cls.events.filter(e=>e.month===cm.month&&(filter==="all"||e.type===filter));
  const dayEvs=selDay?cls.events.filter(e=>e.day===selDay&&e.month===cm.month&&(filter==="all"||e.type===filter)):[];

  return (
    <ScreenWrap>
      <div style={{background:th.headerBg,padding:"12px 20px 12px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <h1 style={{fontSize:20,fontWeight:800,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Calendário</h1>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <button onClick={()=>{setMonthIdx(i=>Math.max(0,i-1));setSelDay(null);}} disabled={monthIdx===0} style={{width:30,height:30,borderRadius:9,background:"rgba(255,255,255,0.1)",border:"none",cursor:monthIdx===0?"not-allowed":"pointer",opacity:monthIdx===0?.4:1,display:"flex",alignItems:"center",justifyContent:"center"}}><ChevronLeft size={14} style={{color:"rgba(255,255,255,0.8)"}}/></button>
            <span style={{fontSize:12,fontWeight:600,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif",width:90,textAlign:"center"}}>{cm.name.split(" ")[0]} {cm.year}</span>
            <button onClick={()=>{setMonthIdx(i=>Math.min(CAL_MONTHS.length-1,i+1));setSelDay(null);}} disabled={monthIdx===CAL_MONTHS.length-1} style={{width:30,height:30,borderRadius:9,background:"rgba(255,255,255,0.1)",border:"none",cursor:monthIdx===CAL_MONTHS.length-1?"not-allowed":"pointer",opacity:monthIdx===CAL_MONTHS.length-1?.4:1,display:"flex",alignItems:"center",justifyContent:"center"}}><ChevronRight size={14} style={{color:"rgba(255,255,255,0.8)"}}/></button>
          </div>
        </div>
        <div style={{display:"flex",gap:5,overflowX:"auto"}} className="hide-scrollbar">
          {(["all","prova","entrega","evento","periodo"] as const).map(k=>(
            <button key={k} onClick={()=>setFilter(k)} style={{flexShrink:0,padding:"5px 11px",borderRadius:9999,fontSize:11,fontWeight:600,border:"none",cursor:"pointer",transition:"all 0.15s",background:filter===k?th.orange:"rgba(255,255,255,0.12)",color:filter===k?"#fff":"rgba(255,255,255,0.6)",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              {k==="all"?"Todos":k==="prova"?"Provas":k==="entrega"?"Entregas":k==="evento"?"Eventos":"Períodos"}
            </button>
          ))}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",paddingBottom:88}} className="hide-scrollbar">
        <div style={{margin:"13px 13px 0",background:th.card,borderRadius:18,padding:"11px 8px",border:`1px solid ${th.border}`}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:5}}>
            {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map(d=><div key={d} style={{textAlign:"center",fontSize:9,fontWeight:700,color:th.muted,fontFamily:"'Inter',sans-serif",padding:"2px 0"}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
            {Array.from({length:totalCells},(_,i)=>{
              const day=i-cm.offset+1; const valid=day>=1&&day<=cm.days;
              const isToday=valid&&day===todayDay&&cm.month===todayMonth;
              const isSel=valid&&day===selDay;
              const dots=valid?[...new Set(cls.events.filter(e=>e.day===day&&e.month===cm.month&&(filter==="all"||e.type===filter)).map(e=>e.type))]:[];
              return (
                <button key={i} disabled={!valid} onClick={()=>valid&&setSelDay(selDay===day?null:day)} style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"3px 1px",borderRadius:9,background:isSel&&!isToday?"rgba(228,130,46,0.12)":"transparent",border:"none",cursor:valid?"pointer":"default"}}>
                  {valid?(<>
                    <div style={{width:27,height:27,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:isToday||isSel?700:400,background:isToday?th.orange:"transparent",color:isToday?"#fff":isSel?th.orange:th.fg,fontFamily:"'Inter',sans-serif"}}>{day}</div>
                    <div style={{display:"flex",gap:2,marginTop:1,minHeight:5}}>{dots.slice(0,3).map(t=><div key={t} style={{width:4,height:4,borderRadius:"50%",background:EVENT_META[t as EventKind].dot}}/>)}</div>
                  </>):<div style={{width:27,height:27}}/>}
                </button>
              );
            })}
          </div>
        </div>

        {selDay!==null&&(
          <div style={{margin:"10px 13px 0",background:th.card,borderRadius:14,overflow:"hidden",border:`1px solid ${th.border}`}}>
            <div style={{padding:"10px 14px",background:th.card2,display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${th.border}`}}>
              <span style={{fontSize:12,fontWeight:700,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{selDay} de {cm.name.split(" ")[0]}</span>
              <span style={{fontSize:11,color:th.muted,fontFamily:"'Inter',sans-serif"}}>{dayEvs.length} evento{dayEvs.length!==1?"s":""}</span>
            </div>
            {dayEvs.length===0?<p style={{padding:13,fontSize:12,color:th.muted,fontFamily:"'Inter',sans-serif"}}>Nenhum evento neste dia</p>:
              dayEvs.map((e,i)=>{const em=EVENT_META[e.type];return(
                <div key={e.id}>{i>0&&<HDivider/>}
                  <div style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:em.dot,flexShrink:0}}/>
                    <div style={{flex:1}}><p style={{fontSize:13,fontWeight:600,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{e.title}</p>{(e.subject||e.room)&&<p style={{fontSize:11,color:th.muted,marginTop:2,fontFamily:"'Inter',sans-serif"}}>{[e.subject,e.room].filter(Boolean).join(" · ")}</p>}</div>
                    <Badge color={em.text} bg={em.bg}>{em.label}</Badge>
                  </div>
                </div>
              );})}
          </div>
        )}

        <div style={{padding:"13px 13px 0"}}>
          <SLabel>{filter==="all"?"Todos os eventos":`${EVENT_META[filter as EventKind]?.label??filter}s`} — {cm.name}</SLabel>
          {monthEvs.length===0?<Empty icon="📅" title="Nenhum evento" sub="Tente trocar o filtro ou mês"/>:(
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {monthEvs.map(e=>{const em=EVENT_META[e.type];return(
                <div key={e.id} style={{background:th.card,borderRadius:13,border:`1px solid ${th.border}`,borderLeft:`3px solid ${em.dot}`,padding:"11px 13px",display:"flex",alignItems:"center",gap:10}}>
                  <div style={{textAlign:"center",width:34,flexShrink:0}}>
                    <p style={{fontSize:9,fontWeight:700,color:em.text,fontFamily:"'Inter',sans-serif"}}>{cm.short}</p>
                    <p style={{fontSize:19,fontWeight:800,color:em.text,fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1}}>{e.day}</p>
                  </div>
                  <div style={{flex:1,minWidth:0}}><p style={{fontSize:13,fontWeight:600,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.title}</p>{(e.subject||e.room)&&<p style={{fontSize:11,color:th.muted,marginTop:2,fontFamily:"'Inter',sans-serif"}}>{[e.subject,e.room].filter(Boolean).join(" · ")}</p>}</div>
                  <Badge color={em.text} bg={em.bg}>{em.label}</Badge>
                </div>
              );})}
            </div>
          )}
        </div>
      </div>
      <FloatingNav active="events" onNav={t=>{if(t==="home")onNav("classHome");if(t==="notifs")onNav("notifications");if(t==="profile")onNav("profile");}} isRep={isRep} onManage={()=>onNav("repPanel")}/>
    </ScreenWrap>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
function ProfileScreen({user,dark,toggleDark,onLogout,onNav,isRep}:{user:AppUser;dark:boolean;toggleDark:()=>void;onLogout:()=>void;onNav:(s:Screen)=>void;isRep?:boolean}) {
  const th=useT(); const [nPush,setNPush]=useState(true);
  return (
    <ScreenWrap>
      <div style={{background:th.headerBg,padding:"14px 20px 42px",flexShrink:0}}>
        <h1 style={{fontSize:20,fontWeight:800,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Perfil</h1>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"0 18px",marginTop:-26,paddingBottom:88}} className="hide-scrollbar">
        <div style={{background:th.card,borderRadius:22,padding:20,boxShadow:"0 4px 20px rgba(14,47,90,0.1)",display:"flex",flexDirection:"column",alignItems:"center",gap:11,border:`1px solid ${th.border}`,marginBottom:13}}>
          <div style={{width:66,height:66,borderRadius:20,background:`linear-gradient(135deg,${th.navy},${th.orange})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(228,130,46,0.3)"}}><span style={{fontSize:22,fontWeight:800,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{getInitials(user.name)}</span></div>
          <div style={{textAlign:"center"}}><h2 style={{fontSize:17,fontWeight:800,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{user.name}</h2><p style={{fontSize:13,color:th.muted,marginTop:2,fontFamily:"'Inter',sans-serif"}}>{user.email}</p></div>
        </div>

        {[{title:"Aparência",content:<FToggle checked={dark} onChange={toggleDark} label={dark?"Modo Escuro ativado":"Modo Escuro"}/>},{title:"Notificações",content:<FToggle checked={nPush} onChange={setNPush} label="Notificações push"/>}].map(({title,content})=>(
          <div key={title} style={{background:th.card,borderRadius:14,marginBottom:11,overflow:"hidden",border:`1px solid ${th.border}`}}>
            <div style={{padding:"7px 15px",background:th.card2,borderBottom:`1px solid ${th.border}`}}><p style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:th.muted,fontFamily:"'Inter',sans-serif"}}>{title}</p></div>
            <div style={{padding:15}}>{content}</div>
          </div>
        ))}

        <div style={{background:th.card,borderRadius:14,marginBottom:11,overflow:"hidden",border:`1px solid ${th.border}`}}>
          {[{icon:Info,label:"Sobre o Anot",screen:"about" as Screen}].map(({icon:Icon,label,screen},i,arr)=>(
            <div key={label}>{i>0&&<HDivider/>}
              <button onClick={()=>onNav(screen)} style={{width:"100%",padding:"13px 15px",display:"flex",alignItems:"center",gap:11,background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
                <div style={{width:32,height:32,borderRadius:9,background:th.card2,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon size={14} style={{color:th.muted}} strokeWidth={1.8}/></div>
                <span style={{flex:1,fontSize:14,fontWeight:500,color:th.fg,fontFamily:"'Inter',sans-serif"}}>{label}</span>
                <ChevronRight size={13} style={{color:th.muted}}/>
              </button>
            </div>
          ))}
        </div>

        <button onClick={onLogout} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:13,borderRadius:14,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",cursor:"pointer",color:"#ef4444",fontSize:14,fontWeight:700,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          <LogOut size={14}/> Sair da conta
        </button>
      </div>
      <FloatingNav active="profile" onNav={t=>{if(t==="home")onNav("classHome");if(t==="events")onNav("events");if(t==="notifs")onNav("notifications");}} isRep={isRep} onManage={()=>onNav("repPanel")}/>
    </ScreenWrap>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function SettingsScreen({user,onNav}:{user:AppUser;onNav:(s:Screen)=>void}) {
  const th=useT(); const toast=useToast();
  const [name,setName]=useState(user.name);
  const [nProva,setNProva]=useState(true); const [nAviso,setNAviso]=useState(true);
  const [shareProgress,setShareProgress]=useState(false);
  const [analytics,setAnalytics]=useState(true);
  const [saving,setSaving]=useState(false);

  const save=async()=>{setSaving(true);await new Promise(r=>setTimeout(r,600));setSaving(false);toast("Configurações salvas!","success");};
  return (
    <ScreenWrap>
      <div style={{background:th.headerBg,padding:"16px 20px 26px",flexShrink:0}}>
        <button onClick={()=>onNav("profile")} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:14}}><ArrowLeft size={18} style={{color:"rgba(255,255,255,0.7)"}}/></button>
        <h1 style={{fontSize:22,fontWeight:800,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Configurações</h1>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"0 18px",marginTop:-14,paddingBottom:24}} className="hide-scrollbar">

        <div style={{background:th.card,borderRadius:18,padding:18,boxShadow:"0 2px 12px rgba(14,47,90,0.08)",marginBottom:14,display:"flex",flexDirection:"column",gap:14,border:`1px solid ${th.border}`}}>
          <p style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.09em",color:th.muted,fontFamily:"'Inter',sans-serif"}}>Conta</p>
          <FInput label="Nome de exibição" value={name} onChange={setName} placeholder="Seu nome" icon={User}/>
          <div>
            <p style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:th.muted,fontFamily:"'Inter',sans-serif",marginBottom:6}}>E-mail</p>
            <div style={{display:"flex",alignItems:"center",gap:10,background:th.card2,borderRadius:12,padding:"12px 14px",border:`1px solid ${th.border}`}}>
              <Mail size={15} style={{color:th.muted}}/>
              <span style={{fontSize:14,color:th.muted,fontFamily:"'Inter',sans-serif"}}>{user.email}</span>
              <span style={{marginLeft:"auto",fontSize:11,color:th.orange,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600}}>Verificado</span>
            </div>
          </div>
          <Btn size="sm" onClick={save} loading={saving}>Salvar conta</Btn>
        </div>

        <div style={{background:th.card,borderRadius:18,marginBottom:14,overflow:"hidden",border:`1px solid ${th.border}`}}>
          <div style={{padding:"10px 18px",background:th.card2,borderBottom:`1px solid ${th.border}`}}><p style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.09em",color:th.muted,fontFamily:"'Inter',sans-serif"}}>Notificações</p></div>
          <div style={{padding:18,display:"flex",flexDirection:"column",gap:16}}>
            <FToggle checked={nProva} onChange={setNProva} label="Alertas de prova e teste"/>
            <HDivider/>
            <FToggle checked={nAviso} onChange={setNAviso} label="Novos avisos da turma"/>
            <HDivider/>
            <FToggle checked={shareProgress} onChange={setShareProgress} label="Compartilhar progresso com rep."/>
          </div>
        </div>

        <div style={{background:th.card,borderRadius:18,marginBottom:14,overflow:"hidden",border:`1px solid ${th.border}`}}>
          <div style={{padding:"10px 18px",background:th.card2,borderBottom:`1px solid ${th.border}`}}><p style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.09em",color:th.muted,fontFamily:"'Inter',sans-serif"}}>Privacidade</p></div>
          <div style={{padding:18,display:"flex",flexDirection:"column",gap:16}}>
            <FToggle checked={analytics} onChange={setAnalytics} label="Contribuir com análise de uso anônima"/>
          </div>
        </div>

        <div style={{background:th.card,borderRadius:18,overflow:"hidden",border:`1px solid ${th.border}`}}>
          <div style={{padding:"10px 18px",background:th.card2,borderBottom:`1px solid ${th.border}`}}><p style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.09em",color:th.muted,fontFamily:"'Inter',sans-serif"}}>Dados</p></div>
          {[{label:"Exportar meus dados",icon:Download},{label:"Limpar cache do app",icon:Globe}].map(({label,icon:Icon},i,arr)=>(
            <div key={label}>{i>0&&<HDivider/>}
              <button onClick={()=>toast("Funcionalidade em breve","info")} style={{width:"100%",padding:"14px 18px",display:"flex",alignItems:"center",gap:12,background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
                <Icon size={16} style={{color:th.muted}}/><span style={{fontSize:14,color:th.fg,fontFamily:"'Inter',sans-serif"}}>{label}</span><ChevronRight size={13} style={{color:th.muted,marginLeft:"auto"}}/>
              </button>
            </div>
          ))}
        </div>
      </div>
    </ScreenWrap>
  );
}

// ─── ABOUT ────────────────────────────────────────────────────────────────────
function AboutScreen({onNav}:{onNav:(s:Screen)=>void}) {
  const th=useT(); const toast=useToast();
  const features=[{icon:"📋",text:"Atividades com data, horário, matéria e status pessoal"},{icon:"📢",text:"Avisos e comunicados publicados pelo representante"},{icon:"📅",text:"Calendário interativo com 7 meses de navegação"},{icon:"⭐",text:"Painel exclusivo de gestão para representantes"},{icon:"👥",text:"Gerenciamento de membros com promoção e remoção"},{icon:"🌙",text:"Modo escuro completo em todas as telas"}];
  const changelog=[{v:"1.0.0",date:"Mai 2026",items:["Lançamento inicial","Criação e entrada em turmas","Sistema de atividades com rastreamento","Painel completo do representante","Calendário acadêmico integrado"]}];
  return (
    <ScreenWrap>
      <div style={{background:th.headerBg,padding:"16px 20px 26px",flexShrink:0}}>
        <button onClick={()=>onNav("profile")} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:14}}><ArrowLeft size={18} style={{color:"rgba(255,255,255,0.7)"}}/></button>
        <h1 style={{fontSize:22,fontWeight:800,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Sobre o Anot</h1>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"0 18px",marginTop:-14,paddingBottom:24}} className="hide-scrollbar">
        {/* Identity */}
        <div style={{background:th.card,borderRadius:18,padding:24,boxShadow:"0 2px 12px rgba(14,47,90,0.08)",marginBottom:14,display:"flex",flexDirection:"column",alignItems:"center",gap:12,border:`1px solid ${th.border}`,textAlign:"center"}}>
          <div style={{width:72,height:72,borderRadius:22,background:`linear-gradient(135deg,${th.navy},${th.orange})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(228,130,46,0.3)"}}>
            <img src={logo} alt="Anot" width={48} height={48} style={{objectFit:"contain",filter:"brightness(0) invert(1)"}}/>
          </div>
          <div><h2 style={{fontSize:22,fontWeight:800,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Anot</h2><p style={{fontSize:13,color:th.muted,fontFamily:"'Inter',sans-serif",marginTop:4}}>Versão 1.0.0 · Maio 2026</p></div>
          <p style={{fontSize:14,color:th.fg,fontFamily:"'Inter',sans-serif",lineHeight:1.6}}>O <strong>Anot</strong> nasceu da necessidade de comunicação eficiente entre alunos e representantes de turma. Nossa missão é tornar a vida acadêmica mais organizada, transparente e colaborativa.</p>
        </div>

        {/* Features */}
        <div style={{background:th.card,borderRadius:18,marginBottom:14,overflow:"hidden",border:`1px solid ${th.border}`}}>
          <div style={{padding:"10px 18px",background:th.card2,borderBottom:`1px solid ${th.border}`}}><p style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.09em",color:th.muted,fontFamily:"'Inter',sans-serif"}}>Recursos</p></div>
          {features.map(({icon,text},i,arr)=>(
            <div key={text}>{i>0&&<HDivider/>}<div style={{padding:"12px 18px",display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:18,flexShrink:0}}>{icon}</span><span style={{fontSize:13,color:th.fg,fontFamily:"'Inter',sans-serif",lineHeight:1.4}}>{text}</span></div></div>
          ))}
        </div>

        {/* Changelog */}
        <div style={{background:th.card,borderRadius:18,marginBottom:14,overflow:"hidden",border:`1px solid ${th.border}`}}>
          <div style={{padding:"10px 18px",background:th.card2,borderBottom:`1px solid ${th.border}`}}><p style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.09em",color:th.muted,fontFamily:"'Inter',sans-serif"}}>Novidades</p></div>
          {changelog.map(({v,date,items})=>(
            <div key={v} style={{padding:18}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:14,fontWeight:800,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>v{v}</span><span style={{fontSize:12,color:th.muted,fontFamily:"'Inter',sans-serif"}}>{date}</span></div>
              {items.map(item=><p key={item} style={{fontSize:13,color:th.muted,fontFamily:"'Inter',sans-serif",marginBottom:6,paddingLeft:14,position:"relative"}}>· {item}</p>)}
            </div>
          ))}
        </div>

        {/* Links */}
        <div style={{background:th.card,borderRadius:18,marginBottom:14,overflow:"hidden",border:`1px solid ${th.border}`}}>
          {[{label:"Termos de Uso"},{label:"Política de Privacidade"},{label:"Reportar um problema"}].map(({label},i,arr)=>(
            <div key={label}>{i>0&&<HDivider/>}<button onClick={()=>toast("Link em breve","info")} style={{width:"100%",padding:"13px 18px",display:"flex",alignItems:"center",gap:12,background:"none",border:"none",cursor:"pointer",textAlign:"left"}}><span style={{flex:1,fontSize:14,color:th.orange,fontWeight:600,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{label}</span><ChevronRight size={13} style={{color:th.orange}}/></button></div>
          ))}
        </div>

        <div style={{textAlign:"center",padding:"8px 0 4px"}}>
          <p style={{fontSize:12,color:th.muted,fontFamily:"'Inter',sans-serif"}}>Feito com ♥ no Brasil</p>
          <p style={{fontSize:11,color:th.border,fontFamily:"'Inter',sans-serif",marginTop:2}}>© 2026 Anot. Todos os direitos reservados.</p>
        </div>
      </div>
    </ScreenWrap>
  );
}

// ─── REP PANEL ────────────────────────────────────────────────────────────────
function RepPanelScreen({cls,user,myRole,read,onAddAnn,onUpdateAnn,onDelAnn,onDelAct,onNav,onOpenAct,onNewActivity,onEditActivity,onPromote,onDemote,onExpel,onUpdateClass,onDeleteClass,statuses,notes,onSetStatus,onSetNotes,userId}:{
  cls:AppClass;user:AppUser;myRole:ClassRole;read:Set<string>;
  onAddAnn:(a:Omit<Announcement,"id">)=>void;onUpdateAnn:(id:string,a:Partial<Announcement>)=>void;onDelAnn:(id:string)=>void;onDelAct:(id:string)=>void;
  onNav:(s:Screen)=>void;onOpenAct:(id:string)=>void;onNewActivity:()=>void;onEditActivity:(id:string)=>void;
  onPromote:(mId:string)=>void;onDemote:(mId:string)=>void;onExpel:(mId:string)=>void;
  onUpdateClass:(p:{name?:string;course?:string;institution?:string;period?:string;modality?:Modality})=>void;
  onDeleteClass:()=>void;
  statuses:Record<string,ActivityStatus>;notes:Record<string,string>;
  onSetStatus:(id:string,s:ActivityStatus)=>void;onSetNotes:(id:string,n:string)=>void;
  userId:string;
}) {
  const th=useT(); const toast=useToast();
  const [tab,setTab]=useState<"avisos"|"atividades"|"membros"|"turma">("atividades");
  const [showQR,setShowQR]=useState(false);
  const [memberSheet,setMemberSheet]=useState<Member|null>(null);
  const isOwner=myRole==="owner";

  // Announcement form
  const [showAnnForm,setShowAnnForm]=useState(false);
  const [editingAnn,setEditingAnn]=useState<Announcement|null>(null);
  const [annTitle,setAnnTitle]=useState(""); const [annDesc,setAnnDesc]=useState(""); const [annPrio,setAnnPrio]=useState<Priority>("media");
  const [annLoading,setAnnLoading]=useState(false);
  const [delAnnConfirm,setDelAnnConfirm]=useState<string|null>(null);
  const [delActConfirm,setDelActConfirm]=useState<string|null>(null);

  // Class settings
  const [clsName,setClsName]=useState(cls.name); const [clsCourse,setClsCourse]=useState(cls.course);
  const [clsInst,setClsInst]=useState(cls.institution); const [clsPeriod,setClsPeriod]=useState(cls.period);
  const [clsModal,setClsModal]=useState<Modality>(cls.modality);
  const [clsLoading,setClsLoading]=useState(false); const [confirmDel,setConfirmDel]=useState(false);
  const [delLoading,setDelLoading]=useState(false);

  const joinLink=`https://anot.app/entrar/${cls.code}`;
  const activeAnns=cls.announcements.filter(a=>!isExpired(a.createdAt));

  const openAnnForm=(ann?:Announcement)=>{
    if(ann){setEditingAnn(ann);setAnnTitle(ann.title);setAnnDesc(ann.desc);setAnnPrio(ann.priority);}
    else{setEditingAnn(null);setAnnTitle("");setAnnDesc("");setAnnPrio("media");}
    setShowAnnForm(true);
  };

  const submitAnn=async()=>{
    if(!annTitle.trim()||!annDesc.trim()){toast("Preencha título e descrição","error");return;}
    setAnnLoading(true); await new Promise(r=>setTimeout(r,500));
    if(editingAnn){onUpdateAnn(editingAnn.id,{title:annTitle,desc:annDesc,priority:annPrio});toast("Aviso atualizado!","success");}
    else{onAddAnn({title:annTitle,desc:annDesc,priority:annPrio,authorId:user.id,authorName:user.name,date:"Agora",createdAt:new Date().toISOString()});toast("Aviso publicado!","success");}
    setAnnLoading(false); setShowAnnForm(false);
  };

  const tabBtns:[string,string][]=[["avisos",`Avisos`],["atividades",`Tarefas`],["membros",`Membros`],["turma","⚙ Turma"]];

  return (
    <ScreenWrap>
      {/* Header */}
      <div style={{background:th.headerBg,padding:"14px 20px 0",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <button onClick={()=>onNav("classHome")} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><ArrowLeft size={18} style={{color:"rgba(255,255,255,0.7)"}}/></button>
          <div style={{textAlign:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}><Star size={13} style={{color:th.orange}} fill={th.orange}/><p style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:th.orange,fontFamily:"'Inter',sans-serif"}}>{myRole==="owner"?"Criador":"Representante"}</p></div>
            <p style={{fontSize:14,fontWeight:700,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{cls.name.split(" — ")[0]}</p>
          </div>
          {/* Profile button for reps (no profile tab in main nav) */}
          <button onClick={()=>onNav("profile")} style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${th.navy},${th.orange})`,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:13,fontWeight:800,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{getInitials(user.name)}</span>
          </button>
        </div>
        <div style={{display:"flex"}}>
          {tabBtns.map(([id,label])=>(
            <button key={id} onClick={()=>{setTab(id as typeof tab);setShowAnnForm(false);}} style={{flex:1,padding:"9px 0",fontSize:11,fontWeight:700,fontFamily:"'Plus Jakarta Sans',sans-serif",background:"none",border:"none",cursor:"pointer",color:tab===id?"#fff":"rgba(255,255,255,0.4)",borderBottom:`3px solid ${tab===id?th.orange:"transparent"}`,transition:"all 0.18s"}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{flex:1,overflowY:"auto",padding:"14px 18px",paddingBottom:100}} className="hide-scrollbar">

        {/* ── AVISOS TAB ── */}
        {tab==="avisos"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {!showAnnForm&&<Btn full variant="ghost" icon={Plus} onClick={()=>openAnnForm()}>Novo aviso</Btn>}
            {showAnnForm&&(
              <div style={{background:th.card,borderRadius:18,padding:18,border:`2px solid ${th.orange}40`,display:"flex",flexDirection:"column",gap:13}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><p style={{fontSize:14,fontWeight:700,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{editingAnn?"Editar aviso":"Novo aviso"}</p><button onClick={()=>setShowAnnForm(false)} style={{background:"none",border:"none",cursor:"pointer",color:th.muted,display:"flex"}}><X size={16}/></button></div>
                <FInput label="Título" value={annTitle} onChange={setAnnTitle} placeholder="Ex: Prova remarcada para terça" maxLen={80}/>
                <FTextarea label="Descrição" value={annDesc} onChange={setAnnDesc} placeholder="Detalhes para os alunos..." rows={3} maxLen={400}/>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:th.muted,fontFamily:"'Inter',sans-serif"}}>Prioridade</span>
                  <div style={{display:"flex",gap:7}}>
                    {(["alta","media","baixa"] as Priority[]).map(p=>{const pm=PRIORITY_META[p];return(<button key={p} onClick={()=>setAnnPrio(p)} style={{flex:1,padding:"8px 6px",borderRadius:11,fontSize:12,fontWeight:700,cursor:"pointer",border:`2px solid ${annPrio===p?pm.dot:th.border}`,background:annPrio===p?pm.bg:th.inputBg,color:annPrio===p?pm.text:th.muted,fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all 0.15s"}}>{pm.label}</button>);})}
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}><Btn variant="secondary" size="sm" full onClick={()=>setShowAnnForm(false)}>Cancelar</Btn><Btn size="sm" full icon={Send} onClick={submitAnn} loading={annLoading}>{editingAnn?"Salvar":"Publicar"}</Btn></div>
              </div>
            )}
            {activeAnns.length===0?<Empty icon="📣" title="Nenhum aviso" sub="Publique o primeiro aviso" cta="Criar aviso" onCta={()=>openAnnForm()}/>:
              activeAnns.map(a=>{const pm=PRIORITY_META[a.priority]; const isUnread=!read.has(a.id)&&a.authorId!==userId; return(
                <div key={a.id} style={{position:"relative"}}>
                  <AccentCard accent={pm.dot}>
                    <div style={{padding:"12px 14px"}}>
                      <div style={{display:"flex",gap:8,justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,flex:1,minWidth:0}}>
                          {isUnread&&<span style={{width:7,height:7,borderRadius:"50%",background:th.orange,flexShrink:0}}/>}
                          <p style={{fontSize:13,fontWeight:isUnread?700:600,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.title}</p>
                        </div>
                        <div style={{display:"flex",gap:5,flexShrink:0}}>
                          <button onClick={()=>openAnnForm(a)} style={{width:28,height:28,borderRadius:8,background:th.navyLight,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Edit3 size={12} style={{color:th.navy}}/></button>
                          <button onClick={()=>setDelAnnConfirm(a.id)} style={{width:28,height:28,borderRadius:8,background:"rgba(239,68,68,0.08)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={12} style={{color:"#ef4444"}}/></button>
                        </div>
                      </div>
                      <p style={{fontSize:12,color:th.muted,fontFamily:"'Inter',sans-serif",lineHeight:1.4,marginBottom:7}}>{a.desc.slice(0,80)}{a.desc.length>80?"...":""}</p>
                      <div style={{display:"flex",justifyContent:"space-between"}}><Badge color={pm.text} bg={pm.bg}>{pm.label}</Badge><span style={{fontSize:11,color:th.muted,fontFamily:"'Inter',sans-serif"}}>{a.date}</span></div>
                    </div>
                  </AccentCard>
                  {delAnnConfirm===a.id&&(
                    <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:th.card,borderRadius:16,padding:14,border:"2px solid #ef4444",display:"flex",flexDirection:"column",gap:10,zIndex:10}}>
                      <p style={{fontSize:13,fontWeight:700,color:"#dc2626",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Excluir aviso?</p>
                      <p style={{fontSize:12,color:th.muted,fontFamily:"'Inter',sans-serif"}}>Esta ação não pode ser desfeita.</p>
                      <div style={{display:"flex",gap:8}}><Btn variant="secondary" size="sm" full onClick={()=>setDelAnnConfirm(null)}>Cancelar</Btn><Btn size="sm" full onClick={()=>{onDelAnn(a.id);setDelAnnConfirm(null);toast("Aviso removido","info");}} style={{background:"#ef4444"}}>Excluir</Btn></div>
                    </div>
                  )}
                </div>
              );})}
          </div>
        )}

        {/* ── ATIVIDADES TAB ── */}
        {tab==="atividades"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {cls.activities.length===0?<Empty icon="📋" title="Nenhuma atividade" sub="Use o + para criar a primeira" cta="Nova atividade" onCta={onNewActivity}/>:
              cls.activities.map(a=>{
                const st=statuses[a.id]??"todo"; const sm=STATUS_META[st]; const tm=ACT_META[a.type];
                return (
                  <div key={a.id} style={{position:"relative"}}>
                    <AccentCard accent={sm.color} onClick={()=>onOpenAct(a.id)}>
                      <div style={{padding:"12px 14px"}}>
                        <div style={{display:"flex",gap:8,justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                          <div style={{flex:1,minWidth:0}}>
                            <span style={{fontSize:10,fontWeight:700,color:tm.color,fontFamily:"'Inter',sans-serif",textTransform:"uppercase",letterSpacing:"0.06em"}}>{tm.label}</span>
                            <p style={{fontSize:13,fontWeight:700,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.title}</p>
                            <p style={{fontSize:11,color:th.muted,fontFamily:"'Inter',sans-serif",marginTop:2}}>{a.subject} · {a.dueLabel}{a.dueTime?`, ${a.dueTime}`:""}</p>
                          </div>
                          <div style={{display:"flex",gap:4,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                            <button onClick={()=>onEditActivity(a.id)} style={{width:28,height:28,borderRadius:8,background:th.navyLight,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Edit3 size={12} style={{color:th.navy}}/></button>
                            <button onClick={()=>setDelActConfirm(a.id)} style={{width:28,height:28,borderRadius:8,background:"rgba(239,68,68,0.08)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={12} style={{color:"#ef4444"}}/></button>
                          </div>
                        </div>
                        <Badge color={sm.color} bg={sm.bg}>{sm.label}</Badge>
                      </div>
                    </AccentCard>
                    {delActConfirm===a.id&&(
                      <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:th.card,borderRadius:16,padding:14,border:"2px solid #ef4444",display:"flex",flexDirection:"column",gap:10,zIndex:10}}>
                        <p style={{fontSize:13,fontWeight:700,color:"#dc2626",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Excluir atividade?</p>
                        <p style={{fontSize:12,color:th.muted,fontFamily:"'Inter',sans-serif"}}>Todos os alunos perderão o acesso.</p>
                        <div style={{display:"flex",gap:8}}><Btn variant="secondary" size="sm" full onClick={()=>setDelActConfirm(null)}>Cancelar</Btn><Btn size="sm" full onClick={()=>{onDelAct(a.id);setDelActConfirm(null);toast("Atividade removida","info");}} style={{background:"#ef4444"}}>Excluir</Btn></div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* ── MEMBROS TAB ── */}
        {tab==="membros"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{background:th.card,borderRadius:14,padding:"11px 14px",border:`1px solid ${th.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div><p style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:th.muted,fontFamily:"'Inter',sans-serif"}}>Total de membros</p><p style={{fontSize:22,fontWeight:800,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{cls.members.length}</p></div>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                {(["owner","rep","student"] as ClassRole[]).map(r=>(
                  <div key={r} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:6,height:6,borderRadius:"50%",background:ROLE_META[r].color}}/><span style={{fontSize:10,color:th.muted,fontFamily:"'Inter',sans-serif"}}>{ROLE_META[r].label}: {cls.members.filter(m=>m.classRole===r).length}</span></div>
                ))}
              </div>
            </div>
            {cls.members.map(m=>{const rm=ROLE_META[m.classRole];return(
              <button key={m.id} onClick={()=>setMemberSheet(m)} style={{display:"flex",alignItems:"center",gap:13,padding:"11px 14px",borderRadius:14,background:th.card,border:`1px solid ${th.border}`,cursor:"pointer",textAlign:"left",width:"100%",outline:"none"}}>
                <MemberAvatar member={m} size={42}/><div style={{flex:1,minWidth:0}}><p style={{fontSize:14,fontWeight:700,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</p><p style={{fontSize:12,color:th.muted,fontFamily:"'Inter',sans-serif",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.email}</p></div>
                <Badge color={rm.color} bg={rm.bg}>{rm.label}</Badge>
              </button>
            );})}
          </div>
        )}

        {/* ── TURMA TAB ── */}
        {tab==="turma"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {/* Access card */}
            <div style={{background:th.navy,borderRadius:20,padding:18,display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div><p style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"rgba(255,255,255,0.5)",fontFamily:"'Inter',sans-serif",marginBottom:4}}>Código de acesso</p><p style={{fontSize:24,fontWeight:800,letterSpacing:"0.1em",color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{cls.code}</p><p style={{fontSize:11,color:"rgba(255,255,255,0.45)",fontFamily:"'Inter',sans-serif",marginTop:3}}>{cls.members.length} membros · {cls.period}</p></div>
                <button onClick={()=>setShowQR(true)} style={{width:52,height:52,borderRadius:16,background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4}}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="1" y="1" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.9"/><rect x="3" y="3" width="3" height="3" rx="0.5" fill="#0e2f5a"/><rect x="12" y="1" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.9"/><rect x="14" y="3" width="3" height="3" rx="0.5" fill="#0e2f5a"/><rect x="1" y="12" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.9"/><rect x="3" y="14" width="3" height="3" rx="0.5" fill="#0e2f5a"/><rect x="12" y="12" width="3" height="3" rx="0.5" fill="white" fillOpacity="0.9"/><rect x="17" y="12" width="2" height="2" rx="0.4" fill="white" fillOpacity="0.9"/><rect x="12" y="17" width="2" height="2" rx="0.4" fill="white" fillOpacity="0.9"/><rect x="15" y="15" width="2" height="2" rx="0.4" fill="white" fillOpacity="0.9"/></svg>
                  <span style={{fontSize:9,color:"rgba(255,255,255,0.7)",fontFamily:"'Inter',sans-serif",fontWeight:700}}>QR</span>
                </button>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.1)",borderRadius:12,padding:"10px 14px"}}>
                <span style={{flex:1,fontSize:11,color:"rgba(255,255,255,0.55)",fontFamily:"'Inter',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{joinLink}</span>
                <button onClick={()=>{navigator.clipboard?.writeText(joinLink).catch(()=>{});toast("Link copiado!","success");}} style={{background:"rgba(255,255,255,0.15)",color:"#fff",border:"none",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all 0.2s",flexShrink:0,display:"flex",alignItems:"center",gap:5}}><Copy size={11}/> Copiar</button>
              </div>
              <button onClick={async()=>{try{await navigator.share?.({title:"Entrar na turma — Anot",text:`Código: ${cls.code}`,url:joinLink});}catch{navigator.clipboard?.writeText(joinLink).catch(()=>{});toast("Link copiado!","success");}}} style={{width:"100%",padding:"11px 0",borderRadius:14,background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.2s"}}><Send size={14}/> Compartilhar turma</button>
            </div>

            {/* Edit class */}
            <div style={{background:th.card,borderRadius:18,padding:18,border:`1px solid ${th.border}`,display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><Settings size={14} style={{color:th.muted}}/><p style={{fontSize:13,fontWeight:700,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Configurações da turma</p></div>
              <FInput label="Nome da turma" value={clsName} onChange={setClsName} placeholder="Engenharia Civil — Turma A" maxLen={60}/>
              <FInput label="Curso" value={clsCourse} onChange={setClsCourse} placeholder="Ex: Engenharia Civil" icon={BookOpen}/>
              <FInput label="Instituição" value={clsInst} onChange={setClsInst} placeholder="Ex: Universidade Federal"/>
              <FInput label="Período" value={clsPeriod} onChange={setClsPeriod} placeholder="Ex: 2025.1"/>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <span style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:th.muted,fontFamily:"'Inter',sans-serif"}}>Modalidade</span>
                <div style={{display:"flex",gap:8}}>
                  {(["presencial","ead","hibrido"] as Modality[]).map(m=>(
                    <button key={m} onClick={()=>setClsModal(m)} style={{flex:1,padding:"9px 6px",borderRadius:12,fontSize:12,fontWeight:600,cursor:"pointer",border:`1.5px solid ${clsModal===m?th.orange:th.border}`,background:clsModal===m?th.orangeLight:th.inputBg,color:clsModal===m?th.orange:th.muted,fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all 0.15s"}}>{m==="presencial"?"Presencial":m==="ead"?"EaD":"Híbrido"}</button>
                  ))}
                </div>
              </div>
              <Btn full size="md" onClick={async()=>{setClsLoading(true);await new Promise(r=>setTimeout(r,600));onUpdateClass({name:clsName,course:clsCourse,institution:clsInst,period:clsPeriod,modality:clsModal});setClsLoading(false);toast("Turma atualizada!","success");}} loading={clsLoading}>Salvar alterações</Btn>
            </div>

            {/* Stats */}
            <div style={{background:th.card,borderRadius:16,border:`1px solid ${th.border}`,overflow:"hidden"}}>
              <div style={{padding:"8px 16px",background:th.card2,borderBottom:`1px solid ${th.border}`}}><p style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:th.muted,fontFamily:"'Inter',sans-serif"}}>Estatísticas</p></div>
              {[["Atividades",String(cls.activities.length),"📋"],["Avisos ativos",String(activeAnns.length),"📢"],["Membros",String(cls.members.length),"👥"]].map(([k,v,icon],i,arr)=>(
                <div key={k}>{i>0&&<HDivider/>}<div style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:14}}>{icon}</span><span style={{fontSize:13,color:th.muted,fontFamily:"'Inter',sans-serif"}}>{k}</span></div><span style={{fontSize:15,fontWeight:800,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{v}</span></div></div>
              ))}
            </div>

            {/* Danger zone */}
            {isOwner&&(
              <div style={{background:"rgba(239,68,68,0.04)",borderRadius:16,border:"1px solid rgba(239,68,68,0.18)",overflow:"hidden"}}>
                <div style={{padding:"8px 16px",background:"rgba(239,68,68,0.06)",borderBottom:"1px solid rgba(239,68,68,0.12)"}}><p style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"#ef4444",fontFamily:"'Inter',sans-serif"}}>Zona de perigo</p></div>
                <div style={{padding:16,display:"flex",flexDirection:"column",gap:12}}>
                  <p style={{fontSize:13,color:"#dc2626",fontFamily:"'Inter',sans-serif",lineHeight:1.5}}>Encerrar a turma remove permanentemente todos os membros, atividades e avisos.</p>
                  {!confirmDel?<Btn variant="danger" size="sm" icon={AlertTriangle} onClick={()=>setConfirmDel(true)}>Encerrar turma</Btn>:
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      <p style={{fontSize:12,fontWeight:700,color:"#dc2626",fontFamily:"'Inter',sans-serif",textAlign:"center"}}>Esta ação é permanente. Confirma?</p>
                      <div style={{display:"flex",gap:8}}><Btn variant="secondary" size="sm" full onClick={()=>setConfirmDel(false)}>Cancelar</Btn><Btn size="sm" full loading={delLoading} onClick={async()=>{setDelLoading(true);await new Promise(r=>setTimeout(r,800));onDeleteClass();}} style={{background:"#ef4444"}}>Encerrar definitivamente</Btn></div>
                    </div>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB for creating activities (tab = atividades) */}
      {tab==="atividades"&&(
        <button onClick={onNewActivity}
          style={{position:"absolute",bottom:78,right:18,width:52,height:52,borderRadius:9999,background:th.orange,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(228,130,46,0.5)",zIndex:50,transition:"all 0.2s"}}>
          <Plus size={24} style={{color:"#fff"}}/>
        </button>
      )}

      <FloatingNav active="manage" onNav={t=>{if(t==="home")onNav("classHome");if(t==="events")onNav("events");}} isRep onManage={()=>{}}/>

      {showQR&&<QRModal link={joinLink} code={cls.code} onClose={()=>setShowQR(false)}/>}
      {memberSheet&&<MemberSheet member={memberSheet} isOwner={isOwner} onClose={()=>setMemberSheet(null)} onPromote={()=>{onPromote(memberSheet.id);setMemberSheet(m=>m?{...m,classRole:"rep"}:null);}} onDemote={()=>{onDemote(memberSheet.id);setMemberSheet(m=>m?{...m,classRole:"student"}:null);}} onExpel={()=>{onExpel(memberSheet.id);setMemberSheet(null);}}/>}
    </ScreenWrap>
  );
}

// ─── ACTIVITY FORM ────────────────────────────────────────────────────────────
function ActivityFormScreen({cls,editId,user,onSave,onNav}:{cls:AppClass;editId:string|null;user:AppUser;onSave:(d:Omit<Activity,"id">)=>void;onNav:(s:Screen)=>void}) {
  const th=useT(); const toast=useToast();
  const existing=editId?cls.activities.find(a=>a.id===editId):null;
  const [title,setTitle]=useState(existing?.title??"");
  const [type,setType]=useState<ActivityType>(existing?.type??"dever");
  const [subject,setSubject]=useState(existing?.subject??"");
  const [dueDate,setDueDate]=useState(existing?.dueDate??TODAY_ISO);
  const [dueTime,setDueTime]=useState(existing?.dueTime??"");
  const [addTime,setAddTime]=useState(!!existing?.dueTime);
  const [desc,setDesc]=useState(existing?.description??"");
  const [errors,setErrors]=useState<Record<string,string>>({}); const [loading,setLoading]=useState(false);

  const submit=async()=>{
    const e:Record<string,string>={};
    if(!title.trim())e.title="Título obrigatório"; if(!subject.trim())e.subject="Matéria obrigatória"; if(!dueDate)e.dueDate="Data de entrega obrigatória";
    setErrors(e); if(Object.keys(e).length>0)return;
    setLoading(true); await new Promise(r=>setTimeout(r,600));
    onSave({title:title.trim(),type,subject:subject.trim(),dueDate,dueTime:addTime&&dueTime?dueTime:undefined,dueLabel:fmtDueLabel(dueDate),description:desc.trim()||undefined,createdById:user.id,createdByName:user.name});
    setLoading(false); toast(editId?"Atividade atualizada!":"Atividade criada!","success"); onNav("repPanel");
  };

  return (
    <ScreenWrap>
      <div style={{background:th.headerBg,padding:"16px 20px 26px",flexShrink:0}}>
        <button onClick={()=>onNav("repPanel")} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:13}}><ArrowLeft size={18} style={{color:"rgba(255,255,255,0.7)"}}/></button>
        <h1 style={{fontSize:22,fontWeight:800,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{editId?"Editar Atividade":"Nova Atividade"}</h1>
        <p style={{fontSize:13,color:"rgba(255,255,255,0.4)",fontFamily:"'Inter',sans-serif",marginTop:3}}>{cls.name}</p>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"0 20px",marginTop:-14,paddingBottom:90}} className="hide-scrollbar">
        <div style={{background:th.card,borderRadius:22,padding:22,boxShadow:"0 4px 20px rgba(14,47,90,0.1)",display:"flex",flexDirection:"column",gap:16,marginBottom:12}}>
          <FInput label="Título da atividade *" value={title} onChange={setTitle} placeholder="Ex: Lista de Exercícios — Cap. 7" error={errors.title} maxLen={80}/>

          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <span style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:th.muted,fontFamily:"'Inter',sans-serif"}}>Tipo *</span>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {(Object.entries(ACT_META) as [ActivityType,{label:string;color:string}][]).map(([t,tm])=>(
                <button key={t} onClick={()=>setType(t)} style={{padding:"11px 8px",borderRadius:14,fontSize:13,fontWeight:700,cursor:"pointer",border:`2px solid ${type===t?tm.color:th.border}`,background:type===t?`${tm.color}12`:th.inputBg,color:type===t?tm.color:th.muted,fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all 0.15s",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  {t==="dever"?"📝":t==="trabalho"?"🗂️":t==="teste"?"📊":"📌"} {tm.label}
                </button>
              ))}
            </div>
          </div>

          <FInput label="Matéria / Disciplina *" value={subject} onChange={setSubject} placeholder="Ex: Cálculo II" error={errors.subject} icon={BookOpen}/>

          {/* Smart date picker */}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <span style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:th.muted,fontFamily:"'Inter',sans-serif"}}>Data de entrega *</span>
            {/* Quick date chips */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {QUICK_DATES.map(({label,offset})=>{
                const d=addDays(TODAY_ISO,offset);
                return (
                  <button key={label} onClick={()=>setDueDate(d)} style={{padding:"6px 12px",borderRadius:9999,fontSize:12,fontWeight:600,border:`1.5px solid ${dueDate===d?th.orange:th.border}`,background:dueDate===d?th.orangeLight:th.inputBg,color:dueDate===d?th.orange:th.muted,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all 0.15s"}}>
                    {label}
                  </button>
                );
              })}
            </div>
            {/* Custom date */}
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1}}>
                <FInput type="date" value={dueDate} onChange={setDueDate} error={errors.dueDate}/>
              </div>
              {dueDate&&<span style={{fontSize:12,color:th.orange,fontWeight:600,fontFamily:"'Plus Jakarta Sans',sans-serif",whiteSpace:"nowrap",flexShrink:0}}>📅 {fmtDueLabel(dueDate)}</span>}
            </div>
          </div>

          {/* Time toggle */}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <FToggle checked={addTime} onChange={setAddTime} label="Adicionar horário"/>
            {addTime&&(
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <input type="time" value={dueTime} onChange={e=>setDueTime(e.target.value)}
                  style={{flex:1,background:th.inputBg,color:th.fg,border:`1.5px solid ${th.border}`,borderRadius:12,padding:"12px 16px",fontSize:14,fontFamily:"'Inter',sans-serif",outline:"none"}}/>
                {dueTime&&<span style={{fontSize:12,color:th.orange,fontWeight:600,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>⏰ {dueTime}</span>}
              </div>
            )}
          </div>

          <FTextarea label="Descrição / Instruções (opcional)" value={desc} onChange={setDesc} placeholder="Instruções, referências, formato esperado..." rows={4} maxLen={500}/>

          {/* Preview */}
          {(title||subject)&&(
            <div style={{background:th.card2,borderRadius:14,padding:13,border:`1px solid ${th.border}`}}>
              <p style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:th.muted,fontFamily:"'Inter',sans-serif",marginBottom:8}}>Pré-visualização</p>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:3,height:44,borderRadius:2,background:ACT_META[type].color,flexShrink:0}}/>
                <div><span style={{fontSize:10,fontWeight:700,color:ACT_META[type].color,fontFamily:"'Inter',sans-serif",textTransform:"uppercase",letterSpacing:"0.06em"}}>{ACT_META[type].label}</span><p style={{fontSize:13,fontWeight:700,color:th.fg,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{title||"Título"}</p><p style={{fontSize:11,color:th.muted,fontFamily:"'Inter',sans-serif",marginTop:2}}>{subject||"Matéria"} · {dueDate?fmtDueLabel(dueDate):"—"}{addTime&&dueTime?`, ${dueTime}`:""}</p></div>
              </div>
            </div>
          )}

          <Btn full size="lg" onClick={submit} loading={loading}>{editId?"Salvar alterações":"Criar atividade"}</Btn>
        </div>
      </div>
      <FloatingNav active="manage" onNav={t=>{if(t==="home")onNav("classHome");if(t==="events")onNav("events");}} isRep onManage={()=>onNav("repPanel")}/>
    </ScreenWrap>
  );
}

// ─── SCREEN META ──────────────────────────────────────────────────────────────
const SCREEN_LABELS:Partial<Record<Screen,string>>={
  welcome:"Tela Inicial",login:"Login",register:"Registro",dashboard:"Dashboard",
  createClass:"Criar Turma",classCreated:"Turma Criada",joinClass:"Entrar em Turma",
  classHome:"Início",activityDetail:"Atividade",notifications:"Avisos",
  events:"Eventos",profile:"Perfil",settings:"Configurações",about:"Sobre",
  repPanel:"Painel Rep.",activityForm:"Nova Atividade",
};
const SCREEN_ORDER:Screen[]=["welcome","login","register","dashboard","createClass","classCreated","joinClass","classHome","activityDetail","notifications","events","profile","settings","about","repPanel","activityForm"];

// ─── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [dark,setDark]=useState(false);
  const [screen,setScreen]=useState<Screen>("welcome");
  const [user,setUser]=useState<AppUser|null>(null);
  const [classes,setClasses]=useState<AppClass[]>([DEMO_CLASS]);
  const [activeId,setActiveId]=useState<string|null>(null);
  const [statuses,setStatuses]=useState<Record<string,ActivityStatus>>({act1:"todo",act2:"in_progress",act3:"done",act4:"todo",act5:"todo",act6:"todo"});
  const [notes,setNotes]=useState<Record<string,string>>({});
  const [viewActId,setViewActId]=useState<string|null>(null);
  const [editActId,setEditActId]=useState<string|null>(null);
  const [readSet,setReadSet]=useState<Set<string>>(new Set());
  const [createdCls,setCreatedCls]=useState<AppClass|null>(null);
  const [toasts,setToasts]=useState<Array<{id:number;msg:string;type:"success"|"error"|"info"}>>([]);
  const toastRef=useRef(0);

  const showToast:ToastFn=useCallback((msg,type="info")=>{
    const id=++toastRef.current; setToasts(p=>[...p,{id,msg,type}]); setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3000);
  },[]);

  const th=dark?DARK:LIGHT;
  const nav=useCallback((s:Screen)=>setScreen(s),[]);
  const activeClass=classes.find(c=>c.id===activeId)??null;
  const myMember=activeClass?.members.find(m=>m.userId===user?.id);
  const myRole:ClassRole=myMember?.classRole??"student";
  const isRep=myRole==="owner"||myRole==="rep";
  const activeAnns=activeClass?.announcements.filter(a=>!isExpired(a.createdAt))??[];
  const unread=activeAnns.filter(a=>!readSet.has(a.id)&&a.authorId!==user?.id).length;
  const userClasses=user?classes.filter(c=>c.members.some(m=>m.userId===user.id)):[];

  const doLogin=useCallback((email:string)=>{
    const demo=DEMO_ACCOUNTS[email];
    const u:AppUser={id:email,name:demo?.name??email.split("@")[0].replace(/[._]/g," "),email};
    setUser(u);
    if(DEMO_CLASS.members.some(m=>m.userId===email)){setActiveId("demo-1");setScreen("classHome");}
    else setScreen("dashboard");
  },[]);

  const doRegister=useCallback((name:string,email:string)=>{setUser({id:email,name,email});setScreen("dashboard");},[]);

  const doCreateClass=useCallback((d:{name:string;course:string;institution:string;period:string;modality:Modality})=>{
    if(!user)return;
    const code=makeCode(d.course,d.period);
    const nc:AppClass={id:nid(),code,...d,ownerId:user.id,members:[{id:nid(),userId:user.id,name:user.name,email:user.email,classRole:"owner",joinedAt:TODAY_ISO}],announcements:[],events:[],activities:[]};
    setClasses(p=>[...p,nc]); setActiveId(nc.id); setCreatedCls(nc); setScreen("classCreated");
  },[user]);

  const doJoin=useCallback((classId:string)=>{
    if(!user)return;
    const m={id:nid(),userId:user.id,name:user.name,email:user.email,classRole:"student" as ClassRole,joinedAt:TODAY_ISO};
    setClasses(p=>p.map(c=>c.id===classId?{...c,members:[...c.members,m]}:c)); setActiveId(classId);
  },[user]);

  const doAddAnn=useCallback((a:Omit<Announcement,"id">)=>{setClasses(p=>p.map(c=>c.id===activeId?{...c,announcements:[{...a,id:nid()},...c.announcements]}:c));},[activeId]);
  const doUpdateAnn=useCallback((id:string,patch:Partial<Announcement>)=>{setClasses(p=>p.map(c=>c.id===activeId?{...c,announcements:c.announcements.map(a=>a.id===id?{...a,...patch}:a)}:c));},[activeId]);
  const doDelAnn=useCallback((id:string)=>{setClasses(p=>p.map(c=>c.id===activeId?{...c,announcements:c.announcements.filter(a=>a.id!==id)}:c));},[activeId]);

  const doSaveActivity=useCallback((data:Omit<Activity,"id">)=>{
    const typeMap:Record<string,EventKind>={dever:"entrega",trabalho:"entrega",teste:"prova",outros:"evento"};
    const parts=data.dueDate.split("-");
    const evDay=parseInt(parts[2]??"1"); const evMonth=parseInt(parts[1]??"5");
    const evKind:EventKind=typeMap[data.type]??"entrega";
    setClasses(p=>p.map(c=>{
      if(c.id!==activeId)return c;
      if(editActId){
        const evId=`act_${editActId}`;
        const updEv:AppEvent={id:evId,title:data.title,day:evDay,month:evMonth,type:evKind,subject:data.subject};
        return{...c,activities:c.activities.map(a=>a.id===editActId?{...a,...data}:a),events:[...c.events.filter(e=>e.id!==evId),updEv]};
      }else{
        const newId=nid();
        return{...c,activities:[...c.activities,{...data,id:newId}],events:[...c.events,{id:`act_${newId}`,title:data.title,day:evDay,month:evMonth,type:evKind,subject:data.subject}]};
      }
    }));
  },[activeId,editActId]);

  const doDelAct=useCallback((id:string)=>{setClasses(p=>p.map(c=>c.id===activeId?{...c,activities:c.activities.filter(a=>a.id!==id),events:c.events.filter(e=>e.id!==`act_${id}`)}:c));},[activeId]);
  const doPromote=useCallback((mId:string)=>{setClasses(p=>p.map(c=>c.id===activeId?{...c,members:c.members.map(m=>m.id===mId?{...m,classRole:"rep" as ClassRole}:m)}:c));},[activeId]);
  const doDemote=useCallback((mId:string)=>{setClasses(p=>p.map(c=>c.id===activeId?{...c,members:c.members.map(m=>m.id===mId?{...m,classRole:"student" as ClassRole}:m)}:c));},[activeId]);
  const doExpel=useCallback((mId:string)=>{setClasses(p=>p.map(c=>c.id===activeId?{...c,members:c.members.filter(m=>m.id!==mId)}:c));},[activeId]);
  const doUpdateClass=useCallback((patch:{name?:string;course?:string;institution?:string;period?:string;modality?:Modality})=>{setClasses(p=>p.map(c=>c.id===activeId?{...c,...patch}:c));},[activeId]);
  const doDeleteClass=useCallback(()=>{setClasses(p=>p.filter(c=>c.id!==activeId));setActiveId(null);setScreen("dashboard");},[activeId]);
  const doMarkRead=useCallback((ids:string[])=>{setReadSet(p=>new Set([...p,...ids]));},[]);
  const doLogout=useCallback(()=>{setUser(null);setActiveId(null);setCreatedCls(null);setReadSet(new Set());setScreen("welcome");},[]);

  const navIdx=SCREEN_ORDER.indexOf(screen);
  const prevS=navIdx>0?SCREEN_ORDER[navIdx-1]:null;
  const nextS=navIdx<SCREEN_ORDER.length-1?SCREEN_ORDER[navIdx+1]:null;

  return (
    <ThemeCtx.Provider value={th}>
      <ToastCtx.Provider value={showToast}>
        <div style={{minHeight:"100dvh",background:dark?"#020810":"#c8d5ec",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,gap:14,fontFamily:"'Inter',sans-serif"}}>
          {/* Navigator */}
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
            {prevS?<button onClick={()=>setScreen(prevS)} style={{padding:"5px 11px",borderRadius:8,background:"rgba(255,255,255,0.1)",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.55)",fontSize:11,fontWeight:600}}>← {SCREEN_LABELS[prevS]}</button>:<div style={{width:80}}/>}
            <div style={{padding:"5px 13px",borderRadius:9999,background:"rgba(228,130,46,0.2)",border:"1px solid rgba(228,130,46,0.35)"}}>
              <span style={{fontSize:12,fontWeight:700,color:th.orange}}>{SCREEN_LABELS[screen]}</span>
              <span style={{fontSize:11,color:"rgba(228,130,46,0.5)",marginLeft:7}}>{navIdx+1}/{SCREEN_ORDER.length}</span>
            </div>
            {nextS?<button onClick={()=>setScreen(nextS)} style={{padding:"5px 11px",borderRadius:8,background:"rgba(255,255,255,0.1)",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.55)",fontSize:11,fontWeight:600}}>{SCREEN_LABELS[nextS]} →</button>:<div style={{width:80}}/>}
          </div>

          <PhoneShell>
            {screen==="welcome"       &&<WelcomeScreen onNav={nav}/>}
            {screen==="login"         &&<LoginScreen onNav={nav} onLogin={doLogin}/>}
            {screen==="register"      &&<RegisterScreen onNav={nav} onRegister={doRegister}/>}
            {screen==="dashboard"     &&user&&<DashboardScreen user={user} userClasses={userClasses} onNav={nav}/>}
            {screen==="createClass"   &&<CreateClassScreen onNav={nav} onCreate={doCreateClass}/>}
            {screen==="classCreated"  &&<ClassCreatedScreen cls={createdCls} onNav={nav}/>}
            {screen==="joinClass"     &&<JoinClassScreen classes={classes} onNav={nav} onJoin={doJoin}/>}
            {screen==="classHome"     &&activeClass&&user&&<ClassHomeScreen cls={activeClass} user={user} myRole={myRole} statuses={statuses} onNav={nav} onOpenAct={id=>{setViewActId(id);nav("activityDetail");}} toggleDark={()=>setDark(d=>!d)} dark={dark} unread={unread}/>}
            {screen==="activityDetail"&&activeClass&&<ActivityDetailScreen cls={activeClass} actId={viewActId} statuses={statuses} notes={notes} onSetStatus={(id,s)=>setStatuses(p=>({...p,[id]:s}))} onSetNotes={(id,n)=>setNotes(p=>({...p,[id]:n}))} onNav={nav} isRep={isRep} onEditActivity={id=>{setEditActId(id);nav("activityForm");}} onDelActivity={doDelAct}/>}
            {screen==="notifications" &&activeClass&&<NotificationsScreen cls={activeClass} read={readSet} onMarkRead={doMarkRead} onNav={nav} unread={unread} isRep={isRep} userId={user?.id}/>}
            {screen==="events"        &&activeClass&&<EventsScreen cls={activeClass} onNav={nav} isRep={isRep}/>}
            {screen==="profile"       &&user&&<ProfileScreen user={user} dark={dark} toggleDark={()=>setDark(d=>!d)} onLogout={doLogout} onNav={nav} isRep={isRep}/>}
            {screen==="settings"      &&user&&<SettingsScreen user={user} onNav={nav}/>}
            {screen==="about"         &&<AboutScreen onNav={nav}/>}
            {screen==="repPanel"      &&activeClass&&user&&<RepPanelScreen cls={activeClass} user={user} myRole={myRole} read={readSet} onAddAnn={doAddAnn} onUpdateAnn={doUpdateAnn} onDelAnn={doDelAnn} onDelAct={doDelAct} onNav={nav} onOpenAct={id=>{setViewActId(id);nav("activityDetail");}} onNewActivity={()=>{setEditActId(null);nav("activityForm");}} onEditActivity={id=>{setEditActId(id);nav("activityForm");}} onPromote={doPromote} onDemote={doDemote} onExpel={doExpel} onUpdateClass={doUpdateClass} onDeleteClass={doDeleteClass} statuses={statuses} notes={notes} onSetStatus={(id,s)=>setStatuses(p=>({...p,[id]:s}))} onSetNotes={(id,n)=>setNotes(p=>({...p,[id]:n}))} userId={user.id}/>}
            {screen==="activityForm"  &&activeClass&&user&&<ActivityFormScreen cls={activeClass} editId={editActId} user={user} onSave={doSaveActivity} onNav={nav}/>}
            <ToastLayer toasts={toasts}/>
          </PhoneShell>

          <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:5,maxWidth:520}}>
            {SCREEN_ORDER.map(s=>(
              <button key={s} onClick={()=>setScreen(s)} style={{padding:"3px 9px",borderRadius:6,fontSize:10,fontWeight:600,background:s===screen?th.orange:"rgba(255,255,255,0.08)",color:s===screen?"#fff":"rgba(255,255,255,0.45)",border:"none",cursor:"pointer",transition:"all 0.15s"}}>{SCREEN_LABELS[s]}</button>
            ))}
            <button onClick={()=>setDark(d=>!d)} style={{padding:"3px 9px",borderRadius:6,fontSize:10,fontWeight:600,background:dark?"rgba(228,130,46,0.2)":"rgba(255,255,255,0.08)",color:dark?th.orange:"rgba(255,255,255,0.45)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>
              {dark?<Sun size={10}/>:<Moon size={10}/>} {dark?"Claro":"Escuro"}
            </button>
          </div>
        </div>
      </ToastCtx.Provider>
    </ThemeCtx.Provider>
  );
}
