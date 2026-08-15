// ─── ANOT — Shared Constants & Metadata (React Native / Expo) ─────────────────
import type { ActivityStatus, ActivityType, EventKind, ClassRole, Priority } from "./types";

// ─── PALETA DE CORES ──────────────────────────────────────────────────────────
// Tema claro (padrão). Tema escuro pode ser construído sobrepondo estes tokens.
export const COLORS = {
  // Primárias
  navy:         "#0e2f5a",
  orange:       "#e4822e",
  // Backgrounds
  background:   "#f4f6fb",
  card:         "#ffffff",
  card2:        "#edf1f8",
  headerBg:     "#0e2f5a",
  inputBg:      "#edf1f8",
  // Texto
  fg:           "#0a1628",
  muted:        "#5a6a8a",
  // Bordas
  border:       "#e6ecf5",
  // Derivados com alpha
  orangeLight:  "rgba(228,130,46,0.10)",
  navyLight:    "rgba(14,47,90,0.07)",
  // Semânticas
  success:      "#10b981",
  danger:       "#ef4444",
  warning:      "#f59e0b",
  info:         "#3b82f6",
} as const;

// ─── CALENDÁRIO — meses navegáveis (Abril–Outubro 2026) ───────────────────────
// offset = número de células vazias antes do dia 1 (semana iniciando na segunda)
export interface CalMonth {
  year: number;
  month: number; // 1–12
  name: string;
  short: string;
  days: number;
  offset: number;
}

export const CAL_MONTHS: CalMonth[] = [
  { year: 2026, month: 4,  name: "Abril 2026",    short: "ABR", days: 30, offset: 2 },
  { year: 2026, month: 5,  name: "Maio 2026",     short: "MAI", days: 31, offset: 4 },
  { year: 2026, month: 6,  name: "Junho 2026",    short: "JUN", days: 30, offset: 0 },
  { year: 2026, month: 7,  name: "Julho 2026",    short: "JUL", days: 31, offset: 2 },
  { year: 2026, month: 8,  name: "Agosto 2026",   short: "AGO", days: 31, offset: 5 },
  { year: 2026, month: 9,  name: "Setembro 2026", short: "SET", days: 30, offset: 1 },
  { year: 2026, month: 10, name: "Outubro 2026",  short: "OUT", days: 31, offset: 3 },
];

// Data "hoje" no demo — substituir por new Date().toISOString().slice(0,10) na integração
export const TODAY_ISO = "2026-05-28";
export const TODAY_DAY   = 28;
export const TODAY_MONTH = 5;

// ─── METADADOS POR TIPO ───────────────────────────────────────────────────────

export const STATUS_META: Record<
  ActivityStatus,
  { label: string; color: string; bg: string }
> = {
  todo:        { label: "Não feito",    color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
  in_progress: { label: "Em andamento", color: "#e4822e", bg: "rgba(228,130,46,0.12)"  },
  done:        { label: "Pronto",       color: "#10b981", bg: "rgba(16,185,129,0.12)"  },
};

export const ACT_META: Record<ActivityType, { label: string; color: string }> = {
  dever:    { label: "Dever",       color: "#e4822e" },
  trabalho: { label: "Trabalho",    color: "#3b82f6" },
  teste:    { label: "Teste/Prova", color: "#ef4444" },
  outros:   { label: "Outros",      color: "#8b5cf6" },
};

export const EVENT_META: Record<
  EventKind,
  { label: string; dot: string; text: string; bg: string }
> = {
  prova:   { label: "Prova",   dot: "#ef4444", text: "#dc2626", bg: "#fef2f2" },
  entrega: { label: "Entrega", dot: "#f59e0b", text: "#b45309", bg: "#fffbeb" },
  evento:  { label: "Evento",  dot: "#8b5cf6", text: "#6d28d9", bg: "#f5f3ff" },
  periodo: { label: "Período", dot: "#3b82f6", text: "#1d4ed8", bg: "#eff6ff" },
};

export const PRIORITY_META: Record<
  Priority,
  { label: string; dot: string; text: string; bg: string }
> = {
  alta:  { label: "Alta",  dot: "#ef4444", text: "#dc2626", bg: "#fef2f2" },
  media: { label: "Média", dot: "#f59e0b", text: "#b45309", bg: "#fffbeb" },
  baixa: { label: "Baixa", dot: "#10b981", text: "#065f46", bg: "#ecfdf5" },
};

export const ROLE_META: Record<
  ClassRole,
  { label: string; color: string; bg: string }
> = {
  owner:   { label: "Criador",       color: "#e4822e", bg: "rgba(228,130,46,0.12)" },
  rep:     { label: "Representante", color: "#0e2f5a", bg: "rgba(14,47,90,0.10)"   },
  student: { label: "Aluno",         color: "#5a6a8a", bg: "rgba(90,106,138,0.10)" },
};

// ─── NOMES DOS MESES (pt-BR) ──────────────────────────────────────────────────
export const MONTH_NAMES = [
  "Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez",
] as const;

// ─── UTILS ────────────────────────────────────────────────────────────────────

/** Converte "2026-05-27" → "27 Mai" */
export function fmtDueLabel(iso: string): string {
  if (!iso) return "";
  const [, mm, dd] = iso.split("-");
  return `${parseInt(dd ?? "1")} ${MONTH_NAMES[parseInt(mm ?? "1") - 1] ?? ""}`;
}

/** Retorna as iniciais de um nome (máx. 2 letras) */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

/** Verifica se um aviso expirou (> 21 dias desde createdAt) */
export function isExpired(createdAt: string): boolean {
  const created = new Date(createdAt);
  const today   = new Date(TODAY_ISO);
  return today.getTime() - created.getTime() > 21 * 24 * 60 * 60 * 1000;
}

/** Constrói a grade do calendário como linhas de 7 células (null = vazio) */
export function buildCalendarRows(cm: CalMonth): Array<Array<number | null>> {
  const totalCells = Math.ceil((cm.offset + cm.days) / 7) * 7;
  const rows: Array<Array<number | null>> = [];
  for (let i = 0; i < totalCells; i += 7) {
    const row: Array<number | null> = [];
    for (let j = 0; j < 7; j++) {
      const day = i + j - cm.offset + 1;
      row.push(day >= 1 && day <= cm.days ? day : null);
    }
    rows.push(row);
  }
  return rows;
}
