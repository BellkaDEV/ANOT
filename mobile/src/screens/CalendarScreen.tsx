import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert, ScrollView } from 'react-native';
import { theme } from '../theme/theme';
import api from '../services/api';

// Calendar months: April–October 2026 (same as Figma seed)
const CAL_MONTHS = [
  { year: 2026, month: 4, name: "Abril 2026", short: "ABR", days: 30, offset: 2 },
  { year: 2026, month: 5, name: "Maio 2026", short: "MAI", days: 31, offset: 4 },
  { year: 2026, month: 6, name: "Junho 2026", short: "JUN", days: 30, offset: 0 },
  { year: 2026, month: 7, name: "Julho 2026", short: "JUL", days: 31, offset: 2 },
  { year: 2026, month: 8, name: "Agosto 2026", short: "AGO", days: 31, offset: 5 },
  { year: 2026, month: 9, name: "Setembro 2026", short: "SET", days: 30, offset: 1 },
  { year: 2026, month: 10, name: "Outubro 2026", short: "OUT", days: 31, offset: 3 },
];

export default function CalendarScreen({ navigation }: any) {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Calendar UI states matching figma
  const [monthIdx, setMonthIdx] = useState(1); // default May 2026 (index 1)
  const [selDay, setSelDay] = useState<number | null>(28);
  const [filter, setFilter] = useState<'all' | 'prova' | 'entrega' | 'evento' | 'periodo'>('all');

  const fetchClasses = async () => {
    setIsLoadingClasses(true);
    try {
      const response = await api.get('/classes');
      const classList = response.data.classes || [];
      setClasses(classList);

      if (classList.length > 0) {
        setSelectedClassId(classList[0].id);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível carregar suas turmas.');
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const fetchEvents = async (classId: number) => {
    setIsLoadingEvents(true);
    try {
      const response = await api.get(`/classes/${classId}/events`);
      setEvents(response.data.events || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível carregar a agenda desta turma.');
    } finally {
      setIsLoadingEvents(false);
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
      fetchEvents(selectedClassId);
    } else {
      setEvents([]);
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
  const todayMonth = 5; // May
  const todayDay = 28;  // 28th (Figma seed alignment)

  // Parse event date (YYYY-MM-DD) into day and month
  const parseEventDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      return {
        day: parseInt(parts[2], 10),
        month: parseInt(parts[1], 10),
      };
    } catch {
      return { day: 0, month: 0 };
    }
  };

  // Filter events by selected month & filter tab
  const monthEvs = events.filter((e) => {
    const p = parseEventDate(e.event_date);
    return p.month === cm.month && (filter === 'all' || e.type === filter);
  });

  // Filter events of the selected day
  const dayEvs = selDay
    ? events.filter((e) => {
        const p = parseEventDate(e.event_date);
        return p.day === selDay && p.month === cm.month && (filter === 'all' || e.type === filter);
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
              onPress={() => setSelectedClassId(item.id)}
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

      <ScrollView style={styles.scrollView} bounces={false}>
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
              const isToday = valid && day === todayDay && cm.month === todayMonth;
              const isSel = valid && day === selDay;

              // Filter event categories present on this specific day
              const dayEvents = valid
                ? events.filter((e) => {
                    const p = parseEventDate(e.event_date);
                    return p.day === day && p.month === cm.month && (filter === 'all' || e.type === filter);
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
                      {(e.subject || e.room) && (
                        <Text style={styles.dayEventSubtext}>
                          {[e.subject, e.room].filter(Boolean).join(' · ')}
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
        {isLoadingEvents ? (
          <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 20 }} />
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
                    {(e.subject || e.room) && (
                      <Text style={styles.monthlyEventSubtext}>
                        {[e.subject, e.room].filter(Boolean).join(' · ')}
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
});
