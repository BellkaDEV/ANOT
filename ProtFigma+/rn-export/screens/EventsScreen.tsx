/**
 * EventsScreen.tsx — ANOT (React Native / Expo SDK 54)
 *
 * Tela de Calendário: grade mensal com pontos de eventos por dia,
 * painel do dia selecionado, lista de eventos do mês e nav flutuante.
 *
 * INTEGRAÇÃO COM API:
 *   - A prop `events` contém todos os eventos já filtrados para a turma.
 *   - API: GET /api/classes/:classId/events
 *   - Filtragem por mês/tipo é feita no cliente (lista normalmente pequena).
 *     Para turmas com muitos eventos, envie ?month=5&type=prova como query params.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { AppEvent, EventKind, ClassRole } from "../shared/types";
import {
  COLORS,
  CAL_MONTHS,
  EVENT_META,
  TODAY_DAY,
  TODAY_MONTH,
  buildCalendarRows,
} from "../shared/constants";

// ─── TIPOS DAS PROPS ──────────────────────────────────────────────────────────

interface EventsScreenProps {
  // ── Eventos da turma ────────────────────────────────────────────────────────
  // API: GET /api/classes/:classId/events
  // Inclui eventos automáticos (vinculados a atividades) e institucionais.
  events: AppEvent[];

  // ── Papel do usuário (determina se o botão de gerenciar aparece na nav) ──────
  userRole?: ClassRole;

  // ── Callbacks de navegação ───────────────────────────────────────────────────
  onNavigate: (target: "home" | "notifications" | "profile") => void;
  onManageClass?: () => void;
}

type FilterKind = "all" | EventKind;

// ─── SUB-COMPONENTES ──────────────────────────────────────────────────────────

/** Badge de tipo de evento com ponto colorido */
function EventBadge({ kind }: { kind: EventKind }) {
  const meta = EVENT_META[kind];
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: meta.dot }]} />
      <Text style={[styles.badgeText, { color: meta.text }]}>{meta.label}</Text>
    </View>
  );
}

/** Célula individual da grade do calendário */
function CalCell({
  day,
  isToday,
  isSelected,
  dotTypes,
  onPress,
}: {
  day: number | null;
  isToday: boolean;
  isSelected: boolean;
  dotTypes: EventKind[];
  onPress: () => void;
}) {
  if (day === null) {
    return <View style={styles.calCell} />;
  }

  return (
    <TouchableOpacity
      style={[styles.calCell, isSelected && !isToday && styles.calCellSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Número do dia */}
      <View
        style={[
          styles.calDayCircle,
          isToday && styles.calDayCircleToday,
        ]}
      >
        <Text
          style={[
            styles.calDayText,
            isToday && styles.calDayTextToday,
            isSelected && !isToday && styles.calDayTextSelected,
          ]}
        >
          {day}
        </Text>
      </View>

      {/* Pontos de eventos (máx. 3) */}
      <View style={styles.calDotsRow}>
        {dotTypes.slice(0, 3).map((type, i) => (
          <View
            key={`${type}-${i}`}
            style={[styles.calDot, { backgroundColor: EVENT_META[type].dot }]}
          />
        ))}
      </View>
    </TouchableOpacity>
  );
}

/** Barra de navegação flutuante (idêntica à da ClassHomeScreen, aba "events" ativa) */
function FloatingNav({
  isRep,
  onNavigate,
  onManageClass,
}: {
  isRep: boolean;
  onNavigate: (t: "home" | "notifications" | "profile") => void;
  onManageClass?: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.navWrapper, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.navPill}>
        {/* Início */}
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => onNavigate("home")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="home-outline" size={19} color={COLORS.muted} />
        </TouchableOpacity>

        {/* Eventos (ativo) */}
        <View style={[styles.navBtn, styles.navBtnActive]}>
          <Ionicons name="calendar" size={19} color="#fff" />
        </View>

        {/* Avisos */}
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => onNavigate("notifications")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="notifications-outline" size={19} color={COLORS.muted} />
        </TouchableOpacity>

        {/* Perfil */}
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => onNavigate("profile")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="person-outline" size={19} color={COLORS.muted} />
        </TouchableOpacity>

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

export default function EventsScreen({
  events,
  userRole,
  onNavigate,
  onManageClass,
}: EventsScreenProps) {
  // Mês inicial: índice 1 = Maio 2026 (mês "hoje" no demo)
  // Na integração, derive o índice a partir do mês atual:
  // const todayMonthIdx = CAL_MONTHS.findIndex(m => m.month === new Date().getMonth() + 1);
  const [monthIdx, setMonthIdx]   = useState(1);
  const [selDay,   setSelDay]     = useState<number | null>(TODAY_DAY);
  const [filter,   setFilter]     = useState<FilterKind>("all");

  const isRep = userRole === "owner" || userRole === "rep";
  const cm = CAL_MONTHS[monthIdx]!;

  // Eventos do mês atual filtrados pelo tipo selecionado
  // API (opcional): GET /api/classes/:id/events?month=5&type=prova
  const monthEvents = events.filter(
    (e) => e.month === cm.month && (filter === "all" || e.type === filter)
  );

  // Eventos do dia selecionado (filtrado por tipo)
  const dayEvents =
    selDay !== null
      ? events.filter(
          (e) =>
            e.day === selDay &&
            e.month === cm.month &&
            (filter === "all" || e.type === filter)
        )
      : [];

  // Grade do calendário: linhas de 7 células (null = célula vazia)
  const calendarRows = buildCalendarRows(cm);

  const filterKeys: FilterKind[] = ["all", "prova", "entrega", "evento", "periodo"];
  const filterLabels: Record<FilterKind, string> = {
    all:     "Todos",
    prova:   "Provas",
    entrega: "Entregas",
    evento:  "Eventos",
    periodo: "Períodos",
  };

  // Para cada dia do mês, quais tipos de evento existem (para os pontos coloridos)
  const dotsByDay = (day: number): EventKind[] => {
    const types = events
      .filter(
        (e) =>
          e.day === day &&
          e.month === cm.month &&
          (filter === "all" || e.type === filter)
      )
      .map((e) => e.type);
    return [...new Set(types)] as EventKind[]; // deduplicado por tipo
  };

  const monthDisplayName = cm.name.split(" ")[0] ?? "";

  return (
    <View style={styles.root}>
      {/* ── HEADER (azul-marinho) ──────────────────────────────────────────── */}
      <View style={styles.header}>
        {/* Linha: título + navegação de mês */}
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Calendário</Text>

          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={() => {
                setMonthIdx((i) => Math.max(0, i - 1));
                setSelDay(null);
              }}
              disabled={monthIdx === 0}
              style={[styles.monthNavBtn, monthIdx === 0 && { opacity: 0.4 }]}
            >
              <Ionicons name="chevron-back" size={14} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>

            <Text style={styles.monthNavLabel}>
              {monthDisplayName} {cm.year}
            </Text>

            <TouchableOpacity
              onPress={() => {
                setMonthIdx((i) => Math.min(CAL_MONTHS.length - 1, i + 1));
                setSelDay(null);
              }}
              disabled={monthIdx === CAL_MONTHS.length - 1}
              style={[
                styles.monthNavBtn,
                monthIdx === CAL_MONTHS.length - 1 && { opacity: 0.4 },
              ]}
            >
              <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chips de filtro por tipo */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {filterKeys.map((key) => {
            const isActive = filter === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setFilter(key)}
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Grade do Calendário ─────────────────────────────────────────── */}
        <View style={styles.calCard}>
          {/* Cabeçalho dos dias da semana */}
          <View style={styles.calWeekHeader}>
            {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map((d) => (
              <View key={d} style={styles.calWeekCell}>
                <Text style={styles.calWeekLabel}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Linhas da grade */}
          {calendarRows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.calRow}>
              {row.map((day, colIdx) => {
                const isToday =
                  day !== null && day === TODAY_DAY && cm.month === TODAY_MONTH;
                const isSelected = day !== null && day === selDay;

                return (
                  <CalCell
                    key={colIdx}
                    day={day}
                    isToday={isToday}
                    isSelected={isSelected}
                    dotTypes={day !== null ? dotsByDay(day) : []}
                    onPress={() => {
                      if (day !== null) {
                        setSelDay(selDay === day ? null : day);
                      }
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>

        {/* ── Painel do Dia Selecionado ─────────────────────────────────────── */}
        {selDay !== null && (
          <View style={styles.dayPanel}>
            {/* Cabeçalho do painel */}
            <View style={styles.dayPanelHeader}>
              <Text style={styles.dayPanelTitle}>
                {selDay} de {monthDisplayName}
              </Text>
              <Text style={styles.dayPanelCount}>
                {dayEvents.length} evento{dayEvents.length !== 1 ? "s" : ""}
              </Text>
            </View>

            {dayEvents.length === 0 ? (
              <Text style={styles.dayPanelEmpty}>Nenhum evento neste dia</Text>
            ) : (
              dayEvents.map((ev, i) => {
                const meta = EVENT_META[ev.type];
                return (
                  <React.Fragment key={ev.id}>
                    {i > 0 && <View style={styles.divider} />}
                    <View style={styles.dayEventRow}>
                      {/* Ponto colorido */}
                      <View style={[styles.dayEventDot, { backgroundColor: meta.dot }]} />
                      {/* Info do evento */}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dayEventTitle}>{ev.title}</Text>
                        {(ev.subject != null || ev.room != null) && (
                          <Text style={styles.dayEventSub}>
                            {[ev.subject, ev.room].filter(Boolean).join(" · ")}
                          </Text>
                        )}
                      </View>
                      <EventBadge kind={ev.type} />
                    </View>
                  </React.Fragment>
                );
              })
            )}
          </View>
        )}

        {/* ── Lista de Eventos do Mês ────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>
          {filter === "all"
            ? "TODOS OS EVENTOS"
            : (EVENT_META[filter as EventKind]?.label ?? filter).toUpperCase() + "S"}{" "}
          — {cm.name.toUpperCase()}
        </Text>

        {monthEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Text style={styles.emptyEmoji}>📅</Text>
            </View>
            <Text style={styles.emptyTitle}>Nenhum evento</Text>
            <Text style={styles.emptySub}>Tente trocar o filtro ou o mês</Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {monthEvents.map((ev) => {
              const meta = EVENT_META[ev.type];
              return (
                <View
                  key={ev.id}
                  style={[styles.eventRow, { borderLeftColor: meta.dot }]}
                >
                  {/* Dia em destaque */}
                  <View style={styles.eventDateBlock}>
                    <Text style={[styles.eventMonthLabel, { color: meta.text }]}>
                      {cm.short}
                    </Text>
                    <Text style={[styles.eventDayLabel, { color: meta.text }]}>
                      {ev.day}
                    </Text>
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {ev.title}
                    </Text>
                    {(ev.subject != null || ev.room != null) && (
                      <Text style={styles.eventSub}>
                        {[ev.subject, ev.room].filter(Boolean).join(" · ")}
                      </Text>
                    )}
                  </View>

                  <EventBadge kind={ev.type} />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── NAV FLUTUANTE (absoluta, sempre visível) ────────────────────────── */}
      <FloatingNav
        isRep={isRep}
        onNavigate={onNavigate}
        onManageClass={onManageClass}
      />
    </View>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Largura de cada célula do calendário — 7 colunas com padding lateral
const CELL_WIDTH = Math.floor((SCREEN_WIDTH - 26 * 2 - 16) / 7); // 26px margin + 8px padding

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
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },

  // ── Navegação de mês ──────────────────────────────────────────────────────
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  monthNavBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  monthNavLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    width: 90,
    textAlign: "center",
  },

  // ── Chips ─────────────────────────────────────────────────────────────────
  chipsContainer: {
    gap: 5,
    paddingRight: 4,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 9999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  chipActive: {
    backgroundColor: COLORS.orange,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.60)",
  },
  chipTextActive: {
    color: "#fff",
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 96,
  },

  // ── Card do Calendário ───────────────────────────────────────────────────
  calCard: {
    margin: 13,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    // Sombra
    shadowColor: "#0e2f5a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  // Cabeçalho dos dias da semana
  calWeekHeader: {
    flexDirection: "row",
    marginBottom: 5,
  },
  calWeekCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 2,
  },
  calWeekLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.muted,
    textTransform: "uppercase",
  },

  // Linhas da grade
  calRow: {
    flexDirection: "row",
  },

  // Célula individual
  calCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 1,
    borderRadius: 9,
  },
  calCellSelected: {
    backgroundColor: "rgba(228,130,46,0.12)",
  },
  calDayCircle: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  calDayCircleToday: {
    backgroundColor: COLORS.orange,
  },
  calDayText: {
    fontSize: 11,
    fontWeight: "400",
    color: COLORS.fg,
  },
  calDayTextToday: {
    color: "#fff",
    fontWeight: "700",
  },
  calDayTextSelected: {
    color: COLORS.orange,
    fontWeight: "700",
  },

  // Pontos de eventos
  calDotsRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 1,
    minHeight: 5,
  },
  calDot: {
    width: 4,
    height: 4,
    borderRadius: 9999,
  },

  // ── Painel do Dia Selecionado ─────────────────────────────────────────────
  dayPanel: {
    marginHorizontal: 13,
    marginTop: 10,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.card2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dayPanelTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.fg,
  },
  dayPanelCount: {
    fontSize: 11,
    color: COLORS.muted,
  },
  dayPanelEmpty: {
    padding: 13,
    fontSize: 12,
    color: COLORS.muted,
  },

  // Linha de evento dentro do painel
  dayEventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dayEventDot: {
    width: 7,
    height: 7,
    borderRadius: 9999,
    flexShrink: 0,
  },
  dayEventTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.fg,
  },
  dayEventSub: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },

  // ── Rótulo de seção ───────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
    color: COLORS.muted,
    textTransform: "uppercase",
    marginTop: 13,
    marginBottom: 8,
    marginHorizontal: 13,
  },

  // ── Lista de eventos do mês ───────────────────────────────────────────────
  eventsList: {
    gap: 7,
    paddingHorizontal: 13,
  },
  eventRow: {
    backgroundColor: COLORS.card,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
    paddingVertical: 11,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  eventDateBlock: {
    textAlign: "center",
    width: 34,
    flexShrink: 0,
    alignItems: "center",
  },
  eventMonthLabel: {
    fontSize: 9,
    fontWeight: "700",
  },
  eventDayLabel: {
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 22,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.fg,
  },
  eventSub: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
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

  // ── Divisor ───────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  // ── Badge de evento ───────────────────────────────────────────────────────
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

  // ── FloatingNav ───────────────────────────────────────────────────────────
  navWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingTop: 8,
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
    shadowColor: "#0e2f5a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 32,
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
  navSeparator: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
    marginHorizontal: 2,
  },
});
