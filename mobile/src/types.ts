export type ActivityStatus = "todo" | "in_progress" | "done";
export type Priority       = "alta" | "media" | "baixa";
export type EventKind      = "entrega" | "evento" | "periodo" | "prova";
export type Modality       = "presencial" | "ead" | "hibrido";
export type ClassRole      = "owner" | "rep" | "student";
export type ActivityType   = "dever" | "trabalho" | "teste" | "outros";
export type WorkMode       = "individual" | "groups";
export type AssessmentFormat = "fechada" | "aberta" | "mista" | "nao_informado";

export type Screen =
  | "welcome" | "login" | "register" | "dashboard"
  | "createClass" | "classCreated" | "joinClass"
  | "classHome" | "activityDetail" | "announcementDetail" | "notifications"
  | "events" | "profile" | "settings" | "about"
  | "repPanel" | "activityForm" | "announcementForm";

export interface AppTheme {
  bg: string; card: string; card2: string; headerBg: string;
  fg: string; muted: string; border: string;
  orange: string; orangeLight: string;
  navy: string; navyLight: string; inputBg: string; isDark: boolean;
  success: string; successBg: string;
  error: string; errorBg: string;
  warning: string; warningBg: string;
}

export interface AppUser  { id: string; name: string; email: string; }
export interface Member   { id: string; userId: string; name: string; email: string; classRole: ClassRole; joinedAt: string; }

export interface Announcement {
  id: string;
  title: string;
  desc: string;
  content?: string;
  priority: Priority;
  authorId: string;
  authorName: string;
  date: string;
  createdAt: string;
  expiresAt?: string | null;
}

export interface ActivityGroupMember {
  id: string;
  activityGroupId: string;
  userId: string;
  joinedAt: string;
  user?: AppUser;
}

export interface ActivityGroupInvitation {
  id: string;
  activityGroupId: string;
  invitedUserId: string;
  invitedByUserId: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  invitedUser?: AppUser;
  invitedBy?: AppUser;
}

export interface ActivityGroup {
  id: string;
  activityId: string;
  name: string;
  capacity: number;
  leaderUserId?: string | null;
  description?: string | null;
  leader?: AppUser | null;
  members: ActivityGroupMember[];
  invitations: ActivityGroupInvitation[];
}

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  workMode?: WorkMode | null;
  groupSize?: number | null;
  assessmentFormat?: AssessmentFormat | null;
  pointsValue?: number | null;
  subject: string;
  dueDate: string;
  dueTime?: string;
  dueLabel: string;
  description?: string;
  createdById: string;
  createdByName: string;
  user_progress?: ActivityStatus | null;
  groups?: ActivityGroup[];
}

export interface AppEvent { id: string; title: string; day: number; month: number; type: EventKind; subject?: string; room?: string; }

export interface AppClass {
  id: string; code: string; name: string; course: string; institution: string; period: string; modality: Modality;
  isOpen?: boolean;
  ownerId: string; members: Member[];
  announcements: Announcement[]; events: AppEvent[]; activities: Activity[];
}

export interface ToastItem { id: number; msg: string; type: "success" | "error" | "info"; }
