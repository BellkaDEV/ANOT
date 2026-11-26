import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import api from '../services/api';
import { CAL_MONTHS, TODAY_DAY, TODAY_MONTH, TODAY_YEAR } from '../constants';


export default function CalendarScreen({ navigation }: any) {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const selectedClassIdRef = useRef<number | null>(null);
  const eventsRequestIdRef = useRef(0);

  // Calendar UI states matching figma
  const currentMonthIdx = CAL_MONTHS.findIndex((m) => m.year === TODAY_YEAR && m.month === TODAY_MONTH);
  const [monthIdx, setMonthIdx] = useState(currentMonthIdx >= 0 ? currentMonthIdx : 12);
  const [selDay, setSelDay] = useState<number | null>(TODAY_DAY);
  const [filter, setFilter] = useState<'all' | 'prova' | 'entrega' | 'evento' | 'periodo'>('all');

  const selectClass = (classId: number | null) => {
    if (selectedClassIdRef.current === classId) return;
    selectedClassIdRef.current = classId;
    setSelectedClassId(classId);
  };

  const fetchClasses = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else if (classes.length === 0) {
      setIsLoadingClasses(true);
    }
    setClassesError(null);
    try {
      const response = await api.get('/classes');
      const classList = response.data.classes || [];
      setClasses(classList);

      if (classList.length > 0) {
        const currentClassId = selectedClassIdRef.current;
        const nextClassId = currentClassId !== null && classList.some((c: any) => c.id === currentClassId)
          ? currentClassId
          : classList[0].id;
        selectClass(nextClassId);
      } else {
        selectClass(null);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Não foi possível carregar suas turmas.';
      setClassesError(msg);
    } finally {
      setIsLoadingClasses(false);
      if (isRefresh) setIsRefreshing(false);
    }
  };

  const fetchEvents = async (classId: number, isRefresh = false) => {
    const requestId = ++eventsRequestIdRef.current;
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoadingEvents(true);
    }
    setEventsError(null);
    try {
      const response = await api.get(`/classes/${classId}/events`);
      if (requestId !== eventsRequestIdRef.current || selectedClassIdRef.current !== classId) return;
      setEvents(response.data.events || []);
    } catch (err: any) {
      if (requestId !== eventsRequestIdRef.current || selectedClassIdRef.current !== classId) return;
      console.error(err);
      const msg = err.response?.data?.message || 'Não foi possível carregar a agenda desta turma.';
      setEventsError(msg);
    } finally {
      if (requestId === eventsRequestIdRef.current) {
        setIsLoadingEvents(false);
        setIsRefreshing(false);
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setClassesError(null);
    setEventsError(null);
    let eventsReloadingForSelection = false;
    try {
      const response = await api.get('/classes');
      const classList = response.data.classes || [];
      setClasses(classList);

      const currentClassId = selectedClassIdRef.current;
      const targetId = (currentClassId !== null && classList.some((c: any) => c.id === currentClassId))
        ? currentClassId
        : (classList.length > 0 ? classList[0].id : null);

      if (targetId !== currentClassId) {
        selectClass(targetId);
        eventsReloadingForSelection = targetId !== null;
      }

      if (targetId !== null && !eventsReloadingForSelection) {
        await fetchEvents(targetId, true);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Não foi possível atualizar o calendário.';
      setClassesError(msg);
    } finally {
      if (!eventsReloadingForSelection) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchClasses();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (selectedClassId !== null) {
      setEvents([]);
      setEventsError(null);
      fetchEvents(selectedClassId);
    } else {
      setEvents([]);
      setEventsError(null);
      setIsLoadingEvents(false);
    }
  }, [selectedClassId]);

  const getEventMeta = (type: string) => {
    switch (type) {
      case 'prova':
        return { label: 'Prova', dot: theme.colors.error, bg: '#fef2f2', text: '#dc2626' };
      case 'entrega':
        return { label: 'Entrega', dot: theme.colors.secondary, bg: '#fffbeb', text: '#b45309' };
      case 'evento':
        return { label: 'Evento', dot: '#8b5cf6', bg: '#f5f3ff', text: '#6d28d9' };
      default:
        return { label: 'Período', dot: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8' };
    }
  };

  const cm = CAL_MONTHS[monthIdx]!;
  const totalCells = Math.ceil((cm.offset + cm.days) / 7) * 7;
  const todayMonth = TODAY_MONTH;
  const todayDay = TODAY_DAY;

  // Parse event date (YYYY-MM-DD) into day, month and year
  const parseEventDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      return {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10),
        day: parseInt(parts[2], 10),
      };
    } catch {
      return { day: 0, month: 0, year: 0 };
    }
  };

  // Filter events by selected month & filter tab
  const monthEvs = events.filter((e) => {
    const p = parseEventDate(e.event_date);
    return (!p.year || !cm.year || p.year === cm.year) && p.month === cm.month && (filter === 'all' || e.type === filter);
  });

  // Filter events of the selected day
  const dayEvs = selDay
    ? events.filter((e) => {
        const p = parseEventDate(e.event_date);
        return (!p.year || !cm.year || p.year === cm.year) && p.day === selDay && p.month === cm.month && (filter === 'all' || e.type === filter);
      })
    : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Area */}
      <View style={styles.headerBackground}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Calendário</Text>
          
          <View style={styles.monthControls}>
            <TouchableOpacity
              style={[styles.arrowBtn, monthIdx === 0 && { opacity: 0.4 }]}
              disabled={monthIdx === 0}
              onPress={() => {
                setMonthIdx((i) => Math.max(0, i - 1));
                setSelDay(null);
              }}
            >
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>
            
            <Text style={styles.monthLabel}>
              {cm.name.split(' ')[0]} {cm.year}
            </Text>

            <TouchableOpacity
              style={[styles.arrowBtn, monthIdx === CAL_MONTHS.length - 1 && { opacity: 0.4 }]}
              disabled={monthIdx === CAL_MONTHS.length - 1}
              onPress={() => {
                setMonthIdx((i) => Math.min(CAL_MONTHS.length - 1, i + 1));
                setSelDay(null);
              }}
            >
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Event Kind Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          {(['all', 'prova', 'entrega', 'evento', 'periodo'] as const).map((k) => (
            <TouchableOpacity
              key={k}
              style={[styles.filterChip, filter === k && styles.filterChipActive]}
              onPress={() => setFilter(k)}
            >
              <Text style={[styles.filterChipText, filter === k && styles.filterChipTextActive]}>
                {k === 'all' ? 'Todos' : k === 'prova' ? 'Provas' : k === 'entrega' ? 'Entregas' : k === 'evento' ? 'Eventos' : 'Períodos'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoadingClasses && classes.length === 0 ? (
        <View style={styles.centerContainer} accessibilityRole="progressbar" accessibilityLabel="Carregando calendário">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : classesError && classes.length === 0 ? (
        <View style={styles.centerContainer} accessibilityRole="alert">
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Não foi possível carregar as turmas</Text>
          <Text style={styles.errorMessage}>{classesError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchClasses()}
            accessibilityRole="button"
            accessibilityLabel="Tentar novamente"
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Class Selector Tab if multiple classes */}
          <View style={styles.classesSelector}>
            <FlatList
              horizontal
              data={classes}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.classChip,
                    selectedClassId === item.id && styles.classChipActive,
                  ]}
                  onPress={() => selectClass(item.id)}
                >
                  <Text
                    style={[
                      styles.classChipText,
                      selectedClassId === item.id && styles.classChipTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.chipsPadding}
            />
          </View>

          {((classesError && classes.length > 0) || (eventsError && events.length > 0)) && (
            <View style={styles.inlineErrorBanner} accessibilityRole="alert">
              <Text style={styles.inlineErrorText} numberOfLines={2}>
                {classesError || eventsError}
              </Text>
              <TouchableOpacity
                style={styles.inlineRetryButton}
                onPress={() => {
                  if (classesError) {
                    fetchClasses(true);
                  } else if (selectedClassId !== null) {
                    fetchEvents(selectedClassId, true);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Tentar novamente"
              >
                <Text style={styles.inlineRetryButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView
            style={styles.scrollView}
            bounces={true}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          >
        {/* Calendar Grid Container Card */}
        <View style={styles.gridCard}>
          {/* Weekday Headers */}
          <View style={styles.weekHeadersRow}>
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
              <Text key={d} style={styles.weekHeaderText}>
                {d}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {Array.from({ length: totalCells }, (_, i) => {
              const day = i - cm.offset + 1;
              const valid = day >= 1 && day <= cm.days;
              const isToday = valid && day === todayDay && cm.month === todayMonth && cm.year === TODAY_YEAR;
              const isSel = valid && day === selDay;

              // Filter event categories present on this specific day
              const dayEvents = valid
                ? events.filter((e) => {
                    const p = parseEventDate(e.event_date);
                    return (!p.year || !cm.year || p.year === cm.year) && p.day === day && p.month === cm.month && (filter === 'all' || e.type === filter);
                  })
                : [];

              // Unique categories representing dots color
              const uniqueTypes = Array.from(new Set(dayEvents.map((e) => e.type)));

              return (
                <TouchableOpacity
                  key={i}
                  disabled={!valid}
                  style={[
                    styles.dayCell,
                    isSel && !isToday && styles.dayCellSelected,
                  ]}
                  onPress={() => valid && setSelDay(selDay === day ? null : day)}
                >
                  {valid ? (
                    <>
                      <View
                        style={[
                          styles.dayCircle,
                          isToday && styles.dayCircleToday,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isToday && styles.dayTextToday,
                            isSel && !isToday && styles.dayTextSelected,
                          ]}
                        >
                          {day}
                        </Text>
                      </View>

                      {/* Dots Row */}
                      <View style={styles.dotsRow}>
                        {uniqueTypes.slice(0, 3).map((t, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.dot,
                              { backgroundColor: getEventMeta(t).dot },
                            ]}
                          />
                        ))}
                      </View>
                    </>
                  ) : (
                    <View style={styles.dayPlaceholder} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Day events card */}
        {selDay !== null && (
          <View style={styles.dayEventsCard}>
            <View style={styles.dayEventsHeader}>
              <Text style={styles.dayEventsTitle}>
                {selDay} de {cm.name.split(' ')[0]}
              </Text>
              <Text style={styles.dayEventsCount}>
                {dayEvs.length} evento{dayEvs.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {dayEvs.length === 0 ? (
              <Text style={styles.emptyDayText}>Nenhum evento neste dia</Text>
            ) : (
              dayEvs.map((e, idx) => {
                const em = getEventMeta(e.type);
                return (
                  <View key={e.id} style={[styles.dayEventItem, idx > 0 && styles.borderedItem]}>
                    <View style={[styles.eventDotIndicator, { backgroundColor: em.dot }]} />
                    <View style={styles.dayEventDetails}>
                      <Text style={styles.dayEventTitleText}>{e.title}</Text>
                      {(e.event_time || e.subject || e.room) && (
                        <Text style={styles.dayEventSubtext}>
                          {[e.event_time, e.subject, e.room].filter(Boolean).join(' · ')}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.miniBadge, { backgroundColor: em.bg }]}>
                      <Text style={[styles.miniBadgeText, { color: em.text }]}>{em.label}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Monthly Events Title */}
        <View style={styles.monthlyLabelContainer}>
          <Text style={styles.monthlyLabel}>
            {filter === 'all' ? 'Todos os eventos' : `${getEventMeta(filter).label}s`} — {cm.name}
          </Text>
        </View>

        {/* Monthly Events List */}
        {isLoadingEvents && events.length === 0 ? (
          <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 20 }} accessibilityRole="progressbar" />
        ) : eventsError && events.length === 0 ? (
          <View style={styles.eventsErrorContainer} accessibilityRole="alert">
            <Text style={styles.errorIconSmall}>⚠️</Text>
            <Text style={styles.eventsErrorText}>{eventsError}</Text>
            <TouchableOpacity
              style={styles.retryButtonSmall}
              onPress={() => selectedClassId !== null && fetchEvents(selectedClassId)}
              accessibilityRole="button"
              accessibilityLabel="Tentar novamente"
            >
              <Text style={styles.retryButtonSmallText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : monthEvs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>Nenhum evento</Text>
            <Text style={styles.emptySub}>Tente trocar o filtro ou mês</Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {monthEvs.map((e) => {
              const em = getEventMeta(e.type);
              const p = parseEventDate(e.event_date);
              return (
                <View key={e.id} style={[styles.monthlyEventCard, { borderLeftColor: em.dot }]}>
                  <View style={styles.monthlyDateBlock}>
                    <Text style={[styles.monthlyDateMonth, { color: em.text }]}>{cm.short}</Text>
                    <Text style={[styles.monthlyDateDay, { color: em.text }]}>{p.day}</Text>
                  </View>
                  <View style={styles.monthlyEventDetails}>
                    <Text style={styles.monthlyEventTitle} numberOfLines={1}>{e.title}</Text>
                    {(e.event_time || e.subject || e.room) && (
                      <Text style={styles.monthlyEventSubtext}>
                        {[e.event_time, e.subject, e.room].filter(Boolean).join(' · ')}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.miniBadge, { backgroundColor: em.bg }]}>
                    <Text style={[styles.miniBadgeText, { color: em.text }]}>{em.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerBackground: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  monthControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 18,
    fontWeight: '600',
  },
  monthLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    width: 80,
    textAlign: 'center',
  },
  filterContainer: {
    gap: 6,
    paddingRight: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  filterChipActive: {
    backgroundColor: theme.colors.secondary,
  },
  filterChipText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  classesSelector: {
    backgroundColor: '#fff',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  chipsPadding: {
    paddingHorizontal: theme.spacing.lg,
  },
  classChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.round,
    backgroundColor: '#edf1f8',
    marginRight: 8,
  },
  classChipActive: {
    backgroundColor: theme.colors.primary,
  },
  classChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  classChipTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
    paddingBottom: 100, // Safe padding for floating bottom tab bar
  },
  gridCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginHorizontal: 13,
    marginTop: 13,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  weekHeadersRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 9,
  },
  dayCellSelected: {
    backgroundColor: 'rgba(228, 130, 46, 0.12)',
  },
  dayCircle: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    backgroundColor: theme.colors.secondary,
  },
  dayText: {
    fontSize: 12,
    color: theme.colors.text,
  },
  dayTextToday: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dayTextSelected: {
    color: theme.colors.secondary,
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    height: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dayPlaceholder: {
    width: 27,
    height: 27,
  },
  dayEventsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginHorizontal: 13,
    marginTop: 10,
    overflow: 'hidden',
  },
  dayEventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.cardSecondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dayEventsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
  },
  dayEventsCount: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  emptyDayText: {
    padding: 14,
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  dayEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  borderedItem: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  eventDotIndicator: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dayEventDetails: {
    flex: 1,
  },
  dayEventTitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  dayEventSubtext: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  monthlyLabelContainer: {
    paddingHorizontal: 13,
    marginTop: 14,
    marginBottom: 8,
  },
  monthlyLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 6,
  },
  emptyIcon: {
    fontSize: 24,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  emptySub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  eventsList: {
    paddingHorizontal: 13,
    gap: 7,
    paddingBottom: 110, // Margin to overlap the bottom tabs
  },
  monthlyEventCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 3,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monthlyDateBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
  },
  monthlyDateMonth: {
    fontSize: 9,
    fontWeight: '700',
  },
  monthlyDateDay: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 18,
  },
  monthlyEventDetails: {
    flex: 1,
    minWidth: 0,
  },
  monthlyEventTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  monthlyEventSubtext: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  inlineErrorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: theme.colors.error,
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 13,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  inlineErrorText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.error,
    fontWeight: '600',
  },
  inlineRetryButton: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inlineRetryButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  errorIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  errorIconSmall: {
    fontSize: 24,
    marginBottom: 6,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  eventsErrorContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  eventsErrorText: {
    fontSize: 12,
    color: theme.colors.error,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  retryButtonSmall: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  retryButtonSmallText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
