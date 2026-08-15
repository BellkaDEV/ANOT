/**
 * ClassHomeScreen.tsx — ANOT (React Native / Expo SDK 54)
 *
 * Tela principal da turma: lista de atividades com busca + filtros,
 * seção de provas próximas e barra de navegação flutuante inferior.
 *
 * INTEGRAÇÃO COM API:
 *   - As props `activities`, `events` e `statuses` são o único ponto de entrada de dados.
 *   - No seu contexto/store, dispare os fetches indicados nos comentários "API:" antes
 *     de renderizar esta tela.
 *   - As callbacks (onUpdateStatus, onOpenActivity, onNavigate) são o único ponto
 *     de saída — conecte-as às actions do seu store e ao React Navigation.
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Activity, AppEvent, ActivityStatus, ActivityType, ClassRole } from "../shared/types";
import {
  COLORS,
  STATUS_META,
  ACT_META,
  EVENT_META,
  CAL_MONTHS,
  TODAY_MONTH,
} from "../shared/constants";

// ─── TIPOS DAS PROPS ──────────────────────────────────────────────────────────

interface ClassHomeScreenProps {
  // ── Dados da turma ──────────────────────────────────────────────────────────
  // API: GET /api/classes/:classId
  classPeriod: string;     // ex: "2025.1"
  classCourse: string;     // ex: "Engenharia Civil"

  // ── Dados do usuário logado ──────────────────────────────────────────────────
  // API: proveniente do contexto de autenticação (JWT payload ou /api/me)
  userName: string;        // primeiro nome para saudação
  userRole: ClassRole;     // determina se o ícone de gerenciar turma aparece na nav

  // ── Atividades da turma ──────────────────────────────────────────────────────
  // API: GET /api/classes/:classId/activities
  activities: Activity[];

  // ── Eventos do calendário (usado para a seção "Provas próximas") ─────────────
  // API: GET /api/classes/:classId/events
  events: AppEvent[];

  // ── Progresso pessoal do usuário por atividade ───────────────────────────────
  // API: GET /api/users/:userId/progress?classId=:classId
  // Estrutura: { [activityId]: ActivityStatus }
  statuses: Record<string, ActivityStatus>;

  // ── Contagem de avisos não lidos (exibida como badge no ícone de sino) ────────
  // API: GET /api/classes/:classId/announcements/unread-count?userId=:userId
  unreadCount: number;

  // ── Callbacks de navegação e ação ────────────────────────────────────────────
  onOpenActivity: (activityId: string) => void;
  onNavigate: (target: "events" | "notifications" | "profile") => void;
  onManageClass?: () => void;  // visível apenas para rep/owner

  // ── Controle de tema ─────────────────────────────────────────────────────────
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

// ─── SUB-COMPONENTES ──────────────────────────────────────────────────────────

/** Badge de status ou tipo com ponto colorido */
function Badge({
  color,
  bg,
  children,
}: {
  color: string;
  bg: string;
  children: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{children}</Text>
    </View>
  );
}

/** Card pulsante para o estado de carregamento */
function SkeletonCard() {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity: anim }]}>
      <View style={styles.skeletonBody}>
        <View style={[styles.skeletonLine, { width: "60%" }]} />
        <View style={[styles.skeletonLine, { width: "38%", marginTop: 8 }]} />
      </View>
      <View style={styles.skeletonBadge} />
    </Animated.View>
  );
}

/** Card de atividade com acento lateral de cor */
function ActivityCard({
  activity,
  status,
  onPress,
}: {
  activity: Activity;
  status: ActivityStatus;
  onPress: () => void;
}) {
  const sm = STATUS_META[status];
  const tm = ACT_META[activity.type];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.activityCard, { borderLeftColor: sm.color }]}
      activeOpacity={0.75}
    >
      <View style={styles.activityCardContent}>
        {/* Info */}
        <View style={styles.activityInfo}>
          <View style={styles.activityTypeRow}>
            <Text style={[styles.activityTypeLabel, { color: tm.color }]}>
              {tm.label.toUpperCase()}
            </Text>
            {activity.dueTime != null && (
              <Text style={styles.activityTimeLabel}>· {activity.dueTime}</Text>
            )}
          </View>
          <Text style={styles.activityTitle} numberOfLines={1}>
            {activity.title}
          </Text>
          <Text style={styles.activitySub}>
            {activity.subject} · {activity.dueLabel}
          </Text>
        </View>

        {/* Status badge + chevron */}
        <Badge color={sm.color} bg={sm.bg}>{sm.label}</Badge>
        <Ionicons name="chevron-forward" size={14} color={COLORS.muted} style={{ marginLeft: 4 }} />
      </View>
    </TouchableOpacity>
  );
}

/** Estado vazio quando não há atividades */
function EmptyActivities({ filtered }: { filtered: boolean }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBox}>
        <Text style={styles.emptyEmoji}>📚</Text>
      </View>
      <Text style={styles.emptyTitle}>Nenhuma atividade</Text>
      <Text style={styles.emptySub}>
        {filtered ? "Sem atividades nessa categoria" : "Sem atividades cadastradas"}
      </Text>
    </View>
  );
}

/** Barra de navegação flutuante inferior em formato de pílula */
function FloatingNav({
  unreadCount,
  isRep,
  onNavigate,
  onManageClass,
}: {
  unreadCount: number;
  isRep: boolean;
  onNavigate: (t: "events" | "notifications" | "profile") => void;
  onManageClass?: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    // position: "absolute" mantém a nav fixada independentemente do scroll
    <View style={[styles.navWrapper, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.navPill}>
        {/* Início (ativo — laranja) */}
        <View style={[styles.navBtn, styles.navBtnActive]}>
          <Ionicons name="home" size={19} color="#fff" />
        </View>

        {/* Eventos */}
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => onNavigate("events")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="calendar-outline" size={19} color={COLORS.muted} />
        </TouchableOpacity>

        {/* Avisos (com badge de não-lidos) */}
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => onNavigate("notifications")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="notifications-outline" size={19} color={COLORS.muted} />
          {unreadCount > 0 && <View style={styles.navBadgeDot} />}
        </TouchableOpacity>

        {/* Perfil */}
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => onNavigate("profile")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="person-outline" size={19} color={COLORS.muted} />
        </TouchableOpacity>

        {/* Separador + botão de gerenciar turma (rep/owner) */}
        {isRep && (
          <>
            <View style={styles.navSeparator} />
            <TouchableOpacity
              style={styles.navBtn}
              onPress={onManageClass}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="star-outline" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

// ─── SCREEN PRINCIPAL ─────────────────────────────────────────────────────────

export default function ClassHomeScreen({
  classPeriod,
  classCourse,
  userName,
  userRole,
  activities,
  events,
  statuses,
  unreadCount,
  onOpenActivity,
  onNavigate,
  onManageClass,
  isDarkMode,
  onToggleDarkMode,
}: ClassHomeScreenProps) {
  const [search, setSearch] = useState("");
  const [actFilter, setActFilter] = useState<"todos" | ActivityType>("todos");

  // Simula o skeleton loader inicial de 600 ms.
  // Na integração real, substitua por um estado de `isLoading` vindo da API.
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const isRep = userRole === "owner" || userRole === "rep";
  const q = search.toLowerCase();

  // Filtra atividades por tipo e por texto de busca
  // API: esta filtragem pode ser feita no cliente (poucas atividades) ou
  //      enviada como query params: GET /api/classes/:id/activities?type=dever&q=cálculo
  const filteredActivities = activities
    .filter((a) => actFilter === "todos" || a.type === actFilter)
    .filter(
      (a) =>
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.subject.toLowerCase().includes(q)
    );

  // Provas dos próximos meses (maio + junho no demo)
  // API: pode ser obtido via GET /api/classes/:id/events?type=prova&monthFrom=5&monthTo=6
  const upcomingExams = events.filter(
    (e) => e.type === "prova" && (e.month === TODAY_MONTH || e.month === TODAY_MONTH + 1)
  );

  const filterLabels: Record<"todos" | ActivityType, string> = {
    todos:    "Todos",
    dever:    "Dever",
    trabalho: "Trabalho",
    teste:    "Teste/Prova",
    outros:   "Outros",
  };
  const filterKeys: Array<"todos" | ActivityType> = [
    "todos", "dever", "trabalho", "teste", "outros",
  ];

  return (
    <View style={styles.root}>
      {/* ── HEADER (fundo azul-marinho) ─────────────────────────────────────── */}
      <View style={styles.header}>
        {/* Linha: período/curso + toggle dark mode */}
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {classPeriod} · {classCourse}
            </Text>
            <Text style={styles.headerTitle}>Olá, {userName.split(" ")[0]} 👋</Text>
          </View>
          <TouchableOpacity style={styles.headerIconBtn} onPress={onToggleDarkMode}>
            <Ionicons
              name={isDarkMode ? "sunny-outline" : "moon-outline"}
              size={15}
              color="rgba(255,255,255,0.8)"
            />
          </TouchableOpacity>
        </View>

        {/* Chips de filtro por tipo de atividade */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {filterKeys.map((key) => {
            const isActive = actFilter === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setActFilter(key)}
                style={[styles.chip, isActive && styles.chipActive]}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {filterLabels[key]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── CONTEÚDO SCROLLÁVEL ─────────────────────────────────────────────── */}
      {/* paddingBottom de 88 garante que o conteúdo não fique sob a nav flutuante */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Campo de busca ───────────────────────────────────────────────── */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={14} color={COLORS.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar atividades..."
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={13} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Seção de Atividades ─────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>ATIVIDADES</Text>

        {isLoading ? (
          // Skeleton loaders enquanto a API não responde
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filteredActivities.length === 0 ? (
          <EmptyActivities filtered={actFilter !== "todos" || q.length > 0} />
        ) : (
          filteredActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              status={statuses[activity.id] ?? "todo"}
              onPress={() => onOpenActivity(activity.id)}
            />
          ))
        )}

        {/* ── Seção: Provas próximas ──────────────────────────────────────── */}
        {upcomingExams.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>PROVAS PRÓXIMAS</Text>
            <View style={styles.examsCard}>
              {upcomingExams.map((ev, i) => {
                const cm = CAL_MONTHS.find((m) => m.month === ev.month);
                return (
                  <React.Fragment key={ev.id}>
                    {i > 0 && <View style={styles.divider} />}
                    <View style={styles.examRow}>
                      {/* Mini calendário vermelho */}
                      <View style={styles.examDateBox}>
                        <Text style={styles.examMonth}>{cm?.short ?? "MAI"}</Text>
                        <Text style={styles.examDay}>{ev.day}</Text>
                      </View>
                      {/* Info da prova */}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.examTitle}>{ev.subject ?? ev.title}</Text>
                        {ev.room != null && (
                          <Text style={styles.examRoom}>{ev.room}</Text>
                        )}
                      </View>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* ── BARRA DE NAVEGAÇÃO FLUTUANTE (absoluta, sempre visível) ─────────── */}
      <FloatingNav
        unreadCount={unreadCount}
        isRep={isRep}
        onNavigate={onNavigate}
        onManageClass={onManageClass}
      />
    </View>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: COLORS.headerBg,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.7,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Chips de filtro ───────────────────────────────────────────────────────
  chipsContainer: {
    gap: 5,
    paddingRight: 4,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 9999,
    backgroundColor: "rgba(255,255,255,0.13)",
  },
  chipActive: {
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.70)",
  },
  chipTextActive: {
    color: COLORS.navy,
  },

  // ── Scroll e conteúdo ─────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 96, // espaço para a nav flutuante
  },

  // ── Campo de busca ────────────────────────────────────────────────────────
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.card,
    borderRadius: 13,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.fg,
    paddingVertical: 0, // remove padding padrão Android
  },

  // ── Rótulo de seção ───────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
    color: COLORS.muted,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  // ── Card de atividade ─────────────────────────────────────────────────────
  activityCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
    marginBottom: 8,
    // Sombra iOS
    shadowColor: "#0e2f5a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    // Sombra Android
    elevation: 1,
  },
  activityCardContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  activityInfo: {
    flex: 1,
    minWidth: 0,
  },
  activityTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  activityTypeLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  activityTimeLabel: {
    fontSize: 10,
    color: COLORS.muted,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.fg,
  },
  activitySub: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },

  // ── Badge ─────────────────────────────────────────────────────────────────
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 9999,
    flexShrink: 0,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────
  skeletonCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  skeletonBody: {
    flex: 1,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: "#dde5f0",
  },
  skeletonBadge: {
    width: 58,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#dde5f0",
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 10,
  },
  emptyIconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: COLORS.card2,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyEmoji: {
    fontSize: 22,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.fg,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 19.5,
    maxWidth: 200,
  },

  // ── Provas próximas ───────────────────────────────────────────────────────
  examsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  examRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  examDateBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  examMonth: {
    fontSize: 9,
    fontWeight: "700",
    color: "#dc2626",
  },
  examDay: {
    fontSize: 16,
    fontWeight: "800",
    color: "#dc2626",
    lineHeight: 18,
  },
  examTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.fg,
  },
  examRoom: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },

  // ── Divisor ───────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  // ── FloatingNav ───────────────────────────────────────────────────────────
  navWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingTop: 8,
    // Gradiente pode ser adicionado com expo-linear-gradient se necessário
  },
  navPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: COLORS.border,
    // Sombra iOS
    shadowColor: "#0e2f5a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 32,
    // Sombra Android
    elevation: 10,
  },
  navBtn: {
    width: 46,
    height: 46,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  navBtnActive: {
    backgroundColor: COLORS.orange,
  },
  navBadgeDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 9999,
    backgroundColor: "#ef4444",
    borderWidth: 2,
    borderColor: "#fff",
  },
  navSeparator: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
    marginHorizontal: 2,
  },
});
