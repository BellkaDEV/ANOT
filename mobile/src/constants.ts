import type { AppTheme, ActivityStatus, ActivityType, EventKind, ClassRole, Priority, AppClass } from "./types";

export const LIGHT: AppTheme = {
  bg: "#f4f6fb", card: "#ffffff", card2: "#edf1f8", headerBg: "#0e2f5a",
  fg: "#0a1628", muted: "#5a6a8a", border: "#e6ecf5",
  orange: "#e4822e", orangeLight: "rgba(228,130,46,0.1)",
  navy: "#0e2f5a", navyLight: "rgba(14,47,90,0.07)", inputBg: "#edf1f8", isDark: false,
  success: "#10b981", successBg: "#ecfdf5",
  error: "#ef4444", errorBg: "#fef2f2",
  warning: "#f59e0b", warningBg: "#fffbeb",
};

export const DARK: AppTheme = {
  bg: "#0B1220", card: "#121C2B", card2: "#18263A", headerBg: "#18263A",
  fg: "#E7EEF9", muted: "#9BAEC8", border: "#263854",
  orange: "#FFAD45", orangeLight: "rgba(255,173,69,0.15)",
  navy: "#3b82f6", navyLight: "rgba(59,130,246,0.15)", inputBg: "#18263A", isDark: true,
  success: "#34D399", successBg: "rgba(16,185,129,0.15)",
  error: "#F87171", errorBg: "rgba(239,68,68,0.15)",
  warning: "#FBBF24", warningBg: "rgba(245,158,11,0.15)",
};

export const STATUS_META: Record<ActivityStatus,{label:string;color:string;bg:string}> = {
  todo:        {label:"Não feito",    color:"#9ca3af", bg:"rgba(156,163,175,0.12)"},
  in_progress: {label:"Em andamento", color:"#e4822e", bg:"rgba(228,130,46,0.12)"},
  done:        {label:"Pronto",       color:"#10b981", bg:"rgba(16,185,129,0.12)"},
};
export const ACT_META: Record<ActivityType,{label:string;color:string;icon:string}> = {
  dever:    {label:"Dever",       color:"#e4822e", icon:"document-text-outline"},
  trabalho: {label:"Trabalho",    color:"#3b82f6", icon:"folder-open-outline"},
  teste:    {label:"Teste/Prova", color:"#ef4444", icon:"school-outline"},
  outros:   {label:"Outros",      color:"#8b5cf6", icon:"bookmark-outline"},
};
export const EVENT_META: Record<EventKind,{label:string;dot:string;text:string;bg:string}> = {
  prova:   {label:"Prova",   dot:"#ef4444", text:"#dc2626", bg:"#fef2f2"},
  entrega: {label:"Entrega", dot:"#f59e0b", text:"#b45309", bg:"#fffbeb"},
  evento:  {label:"Evento",  dot:"#8b5cf6", text:"#6d28d9", bg:"#f5f3ff"},
  periodo: {label:"Período", dot:"#3b82f6", text:"#1d4ed8", bg:"#eff6ff"},
};
export const PRIORITY_META: Record<Priority,{label:string;dot:string;text:string;bg:string}> = {
  alta:  {label:"Alta",  dot:"#ef4444", text:"#dc2626", bg:"#fef2f2"},
  media: {label:"Média", dot:"#f59e0b", text:"#b45309", bg:"#fffbeb"},
  baixa: {label:"Baixa", dot:"#10b981", text:"#065f46", bg:"#ecfdf5"},
};
export const ROLE_META: Record<ClassRole,{label:string;color:string;bg:string}> = {
  owner:   {label:"Criador",       color:"#e4822e", bg:"rgba(228,130,46,0.12)"},
  rep:     {label:"Representante", color:"#0e2f5a", bg:"rgba(14,47,90,0.10)"},
  student: {label:"Aluno",         color:"#5a6a8a", bg:"rgba(90,106,138,0.10)"},
};

export const CAL_MONTHS = [
  {year:2026, month:4,  name:"Abril 2026",    short:"ABR", days:30, offset:2},
  {year:2026, month:5,  name:"Maio 2026",     short:"MAI", days:31, offset:4},
  {year:2026, month:6,  name:"Junho 2026",    short:"JUN", days:30, offset:0},
  {year:2026, month:7,  name:"Julho 2026",    short:"JUL", days:31, offset:2},
  {year:2026, month:8,  name:"Agosto 2026",   short:"AGO", days:31, offset:5},
  {year:2026, month:9,  name:"Setembro 2026", short:"SET", days:30, offset:1},
  {year:2026, month:10, name:"Outubro 2026",  short:"OUT", days:31, offset:3},
] as const;

export const TODAY_ISO = "2026-05-28";
export const TODAY_DAY = 28;
export const TODAY_MONTH = 5;

export const QUICK_DATES = [
  {label:"Hoje",offset:0},{label:"Amanhã",offset:1},
  {label:"+1 sem",offset:7},{label:"+2 sem",offset:14},{label:"+1 mês",offset:30},
];

const MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"] as const;
export const nid = () => Math.random().toString(36).slice(2,9);
export const fmtDueLabel = (d:string) => {if(!d)return""; const[,mm,dd]=d.split("-"); return`${parseInt(dd??"1")} ${MONTHS_PT[parseInt(mm??"1")-1]??""}`; };
export const fmtDatePt = (iso:string) => new Date(iso+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"});
export const getInitials = (name:string) => name.split(" ").slice(0,2).map(w=>w[0]??"").join("").toUpperCase();
export const isValidEmail = (e:string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export const isExpired = (createdAt:string) => { const d=new Date(createdAt),t=new Date(TODAY_ISO); return t.getTime()-d.getTime()>21*24*60*60*1000; };
export const makeCode = (course:string,period:string) => { const pre=course.split(" ").map(w=>w[0]||"X").join("").toUpperCase().slice(0,3).padEnd(3,"X"); const yr=period.replace(/\D/g,"").slice(0,4).padEnd(4,"0"); return`${pre}-${yr}-${Math.random().toString(36).slice(2,6).toUpperCase()}`; };
export const addDays = (iso:string,days:number) => { const d=new Date(iso+"T12:00:00"); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); };
export const buildCalRows = (cm:{offset:number;days:number}) => { const total=Math.ceil((cm.offset+cm.days)/7)*7; const rows:Array<Array<number|null>>=[];for(let i=0;i<total;i+=7){const row:Array<number|null>=[];for(let j=0;j<7;j++){const day=i+j-cm.offset+1;row.push(day>=1&&day<=cm.days?day:null);}rows.push(row);}return rows; };

