// ─── ANOT — Shared TypeScript Types (React Native / Expo) ─────────────────────
// Espelha exatamente o modelo de dados do protótipo web.
// Quando o backend estiver pronto, esses tipos devem ser gerados a partir do
// schema OpenAPI / Zod para garantir sincronismo com os endpoints.

export type ActivityStatus = "todo" | "in_progress" | "done";
export type Priority       = "alta" | "media" | "baixa";
export type EventKind      = "entrega" | "evento" | "periodo" | "prova";
export type Modality       = "presencial" | "ead" | "hibrido";
export type ClassRole      = "owner" | "rep" | "student";
export type ActivityType   = "dever" | "trabalho" | "teste" | "outros";

export interface AppUser {
  id: string;       // = email no protótipo demo
  name: string;
  email: string;
}

export interface Member {
  id: string;
  userId: string;   // FK → AppUser.id
  name: string;     // desnormalizado
  email: string;    // desnormalizado
  classRole: ClassRole;
  joinedAt: string; // ISO date "YYYY-MM-DD"
}

export interface Announcement {
  id: string;
  title: string;    // max 80 chars
  desc: string;     // max 400 chars
  priority: Priority;
  authorId: string; // FK → AppUser.id
  authorName: string;
  date: string;     // display string, ex: "Hoje, 14h22"
  createdAt: string;// ISO datetime — usado para calcular expiração (21 dias)
}

export interface Activity {
  id: string;
  title: string;        // max 80 chars
  type: ActivityType;
  subject: string;      // matéria/disciplina
  dueDate: string;      // ISO date "YYYY-MM-DD"
  dueTime?: string;     // "HH:MM", opcional
  dueLabel: string;     // display formatado, ex: "27 Mai"
  description?: string; // max 500 chars, opcional
  createdById: string;  // FK → AppUser.id
  createdByName: string;// desnormalizado
}

export interface AppEvent {
  id: string;       // eventos vinculados a atividades: "act_" + activityId
  title: string;
  day: number;      // dia do mês (1–31)
  month: number;    // mês (1–12)
  type: EventKind;
  subject?: string; // matéria, opcional
  room?: string;    // sala/local, opcional
}

export interface AppClass {
  id: string;
  code: string;         // único, imutável (ex: "ENG-2025-7XK4")
  name: string;
  course: string;
  institution: string;
  period: string;       // ex: "2025.1"
  modality: Modality;
  ownerId: string;      // FK → AppUser.id
  members: Member[];
  announcements: Announcement[];
  events: AppEvent[];
  activities: Activity[];
}

// ─── Resposta esperada da API de progresso ───────────────────────────────────
// API endpoint: GET /api/users/:userId/progress
// Body: { activityId: string; status: ActivityStatus; notes: string }[]
export interface ProgressEntry {
  activityId: string;
  status: ActivityStatus;
  notes: string;
}
