import type { AppTheme, ActivityStatus, ActivityType, EventKind, ClassRole, Priority, AppClass } from "./types";

export const LIGHT: AppTheme = {
  bg:"#f4f6fb", card:"#ffffff", card2:"#edf1f8", headerBg:"#0e2f5a",
  fg:"#0a1628", muted:"#5a6a8a", border:"#e6ecf5",
  orange:"#e4822e", orangeLight:"rgba(228,130,46,0.1)",
  navy:"#0e2f5a", navyLight:"rgba(14,47,90,0.07)", inputBg:"#edf1f8", isDark:false,
};
export const DARK: AppTheme = {
  bg:"#0d1829", card:"#142030", card2:"#1b2d42", headerBg:"#0a1220",
  fg:"#dce8f5", muted:"#6e85a8", border:"#1e3252",
  orange:"#e4822e", orangeLight:"rgba(228,130,46,0.12)",
  navy:"#1e4a8a", navyLight:"rgba(255,255,255,0.05)", inputBg:"#1a2d45", isDark:true,
};

export const STATUS_META: Record<ActivityStatus,{label:string;color:string;bg:string}> = {
  todo:        {label:"Não feito",    color:"#9ca3af", bg:"rgba(156,163,175,0.12)"},
  in_progress: {label:"Em andamento", color:"#e4822e", bg:"rgba(228,130,46,0.12)"},
  done:        {label:"Pronto",       color:"#10b981", bg:"rgba(16,185,129,0.12)"},
};
export const ACT_META: Record<ActivityType,{label:string;color:string;emoji:string}> = {
  dever:    {label:"Dever",       color:"#e4822e", emoji:"📝"},
  trabalho: {label:"Trabalho",    color:"#3b82f6", emoji:"🗂️"},
  teste:    {label:"Teste/Prova", color:"#ef4444", emoji:"📊"},
  outros:   {label:"Outros",      color:"#8b5cf6", emoji:"📌"},
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

export const DEMO_ACCOUNTS: Record<string,{name:string}> = {
  "ana@univ.edu.br":  {name:"Ana Carolina Silva"},
  "lucas@univ.edu.br":{name:"Lucas Mendes"},
};
export const DEMO_CLASS: AppClass = {
  id:"demo-1", code:"ENG-2025-7XK4",
  name:"Engenharia Civil — Turma A", course:"Engenharia Civil",
  institution:"Universidade Federal do Brasil", period:"2025.1", modality:"presencial",
  ownerId:"lucas@univ.edu.br",
  members:[
    {id:"m1",userId:"lucas@univ.edu.br",name:"Lucas Mendes",      email:"lucas@univ.edu.br",  classRole:"owner",  joinedAt:"2026-01-10"},
    {id:"m2",userId:"beatriz",          name:"Beatriz Souza",     email:"beatriz@univ.edu.br",classRole:"rep",    joinedAt:"2026-01-15"},
    {id:"m3",userId:"ana@univ.edu.br",  name:"Ana Carolina Silva",email:"ana@univ.edu.br",    classRole:"student",joinedAt:"2026-01-15"},
    {id:"m4",userId:"rafael",           name:"Rafael Pereira",    email:"rafael@univ.edu.br", classRole:"student",joinedAt:"2026-01-20"},
    {id:"m5",userId:"carla",            name:"Carla Santos",      email:"carla@univ.edu.br",  classRole:"student",joinedAt:"2026-01-22"},
    {id:"m6",userId:"joao",             name:"João Ferreira",     email:"joao@univ.edu.br",   classRole:"student",joinedAt:"2026-01-25"},
    {id:"m7",userId:"mariana",          name:"Mariana Costa",     email:"mariana@univ.edu.br",classRole:"student",joinedAt:"2026-01-25"},
  ],
  announcements:[
    {id:"a1",title:"Prova de Cálculo II — Remarcada",  desc:"A prova foi remarcada para 28/05. Local: Sala 203. Conteúdo: capítulos 1–9.",priority:"alta", authorId:"lucas@univ.edu.br",authorName:"Lucas Mendes · Rep.", date:"Hoje, 14h22",  createdAt:"2026-05-21T14:22:00Z"},
    {id:"a2",title:"Material de Física Experimental",  desc:"Slides da aula prática disponíveis no drive da turma. Acessem pelo link.",  priority:"media",authorId:"lucas@univ.edu.br",authorName:"Lucas Mendes · Rep.", date:"Ontem, 09h15",createdAt:"2026-05-20T09:15:00Z"},
    {id:"a3",title:"Reunião de Representantes",        desc:"Reunião com a coordenação na próxima terça, 12h, sala da administração.",    priority:"media",authorId:"beatriz",          authorName:"Beatriz Souza · Rep.",date:"22/05, 11h00",createdAt:"2026-05-19T11:00:00Z"},
    {id:"a4",title:"Formulário de Avaliação Docente",  desc:"Prazo para preenchimento encerra no dia 31/05. Sua participação importa!",   priority:"baixa",authorId:"lucas@univ.edu.br",authorName:"Lucas Mendes · Rep.", date:"21/05, 08h30",createdAt:"2026-05-18T08:30:00Z"},
  ],
  events:[
    {id:"act_act1",title:"Lista — Cálculo II",        day:27,month:5, type:"entrega",subject:"Cálculo II"},
    {id:"act_act2",title:"Relatório de Física",       day:30,month:5, type:"entrega",subject:"Física Exp."},
    {id:"act_act3",title:"Resenha de Filosofia",      day:28,month:5, type:"entrega",subject:"Filosofia"},
    {id:"act_act4",title:"Seminário de Materiais",    day:2, month:6, type:"evento", subject:"Materiais",room:"Auditório"},
    {id:"act_act5",title:"Prova de Cálculo II",       day:28,month:5, type:"prova",  subject:"Cálculo II",room:"Sala 203"},
    {id:"act_act6",title:"Prova de Física Exp.",      day:4, month:6, type:"prova",  subject:"Física Exp.",room:"Lab. Físico"},
    {id:"e6", title:"Início — Semana de Provas",      day:3, month:6, type:"periodo"},
    {id:"e8", title:"Defesa de TCC — Turmas Sênior",  day:10,month:6, type:"evento"},
    {id:"e9", title:"Encerramento do Semestre",       day:28,month:6, type:"periodo"},
    {id:"e10",title:"Recesso Inverno",                day:13,month:7, type:"periodo"},
    {id:"e11",title:"Retorno das Aulas",              day:3, month:8, type:"evento"},
  ],
  activities:[
    {id:"act1",title:"Lista de Exercícios — Cálculo II", type:"dever",   subject:"Cálculo II", dueDate:"2026-05-27",dueLabel:"27 Mai",description:"Capítulos 7 e 8 — exercícios ímpares.",createdById:"lucas@univ.edu.br",createdByName:"Lucas Mendes"},
    {id:"act2",title:"Relatório de Física Experimental", type:"trabalho",subject:"Física Exp.",dueDate:"2026-05-30",dueTime:"23:59",dueLabel:"30 Mai",description:"Experimento 4 — Oscilações. Usar modelo do Moodle.",createdById:"lucas@univ.edu.br",createdByName:"Lucas Mendes"},
    {id:"act3",title:"Resenha — Filosofia da Ciência",   type:"outros",  subject:"Filosofia",  dueDate:"2026-05-28",dueLabel:"28 Mai",description:"Resenha crítica do artigo de Kuhn. 1–2 páginas.",createdById:"beatriz",createdByName:"Beatriz Souza"},
    {id:"act4",title:"Seminário de Materiais",           type:"outros",  subject:"Materiais",  dueDate:"2026-06-02",dueTime:"14:00",dueLabel:"2 Jun", description:"Apresentação de 15 min sobre ligas metálicas.",createdById:"lucas@univ.edu.br",createdByName:"Lucas Mendes"},
    {id:"act5",title:"Prova de Cálculo II",              type:"teste",   subject:"Cálculo II", dueDate:"2026-05-28",dueLabel:"28 Mai",description:"Conteúdo: capítulos 1–9. Local: Sala 203.",createdById:"lucas@univ.edu.br",createdByName:"Lucas Mendes"},
    {id:"act6",title:"Prova de Física Experimental",     type:"teste",   subject:"Física Exp.",dueDate:"2026-06-04",dueLabel:"4 Jun", description:"Experimentos 1–5. Local: Lab. Físico.",createdById:"lucas@univ.edu.br",createdByName:"Lucas Mendes"},
  ],
};
