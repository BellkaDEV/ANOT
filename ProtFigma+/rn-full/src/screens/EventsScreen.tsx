import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge, Empty } from "../components/ui";
import FloatingNav from "../components/FloatingNav";
import { CAL_MONTHS, EVENT_META, buildCalRows, TODAY_DAY, TODAY_MONTH } from "../constants";
import type { AppTheme, AppClass, AppUser, Screen, AppEvent } from "../types";

const WDAYS = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];

interface Props {
  cls: AppClass;
  user: AppUser;
  onNav: (s: Screen) => void;
  th: AppTheme;
}

export default function EventsScreen({ cls, user, onNav, th }: Props) {
  const initMonth = CAL_MONTHS.findIndex(m => m.month === TODAY_MONTH);
  const [mi, setMi] = useState(initMonth >= 0 ? initMonth : 1);
  const [selDay, setSelDay] = useState<number | null>(TODAY_DAY);
  const cm = CAL_MONTHS[mi]!;
  const rows = buildCalRows(cm);

  function eventsForDay(day: number): AppEvent[] {
    return cls.events.filter(e => e.month === cm.month && e.day === day);
  }
  const dayEvts = selDay != null ? eventsForDay(selDay) : [];

  function CalCell({ day }: { day: number | null }) {
    if (!day) return <View style={S.cellEmpty}/>;
    const evts = eventsForDay(day);
    const isToday = day === TODAY_DAY && cm.month === TODAY_MONTH;
    const isSel   = day === selDay;
    const dot1    = evts[0] ? EVENT_META[evts[0].type].dot : null;
    const dot2    = evts[1] ? EVENT_META[evts[1].type].dot : null;
    return (
      <TouchableOpacity onPress={() => setSelDay(day === selDay ? null : day)}
        style={[S.cell, isToday && [S.cellToday, { backgroundColor: th.navy }],
          isSel && !isToday && [S.cellSel, { backgroundColor: th.orange }]]}>
        <Text style={[S.cellText, { color: isToday || isSel ? "#fff" : th.fg,
          fontWeight: isToday || evts.length ? "700" : "400" }]}>{day}</Text>
        {evts.length > 0 && (
          <View style={S.dotRow}>
            {dot1 && <View style={[S.evtDot, { backgroundColor: isToday || isSel ? "#fff" : dot1 }]}/>}
            {dot2 && <View style={[S.evtDot, { backgroundColor: isToday || isSel ? "rgba(255,255,255,0.6)" : dot2 }]}/>}
            {evts.length > 2 && <View style={[S.evtDot, { backgroundColor: isToday || isSel ? "rgba(255,255,255,0.4)" : th.muted }]}/>}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={[S.safe, { backgroundColor: th.bg }]}>
      <View style={[S.header, { backgroundColor: th.headerBg }]}>
        <Text style={S.hTitle}>Calendário</Text>
        <View style={[S.countBadge, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <Text style={S.countText}>{cls.events.length} eventos</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Month nav */}
        <View style={[S.calCard, { backgroundColor: th.card, borderColor: th.border }]}>
          <View style={S.monthNav}>
            <TouchableOpacity onPress={() => { if (mi > 0) { setMi(mi-1); setSelDay(null); } }}
              style={[S.navBtn, { backgroundColor: th.navyLight }]}
              disabled={mi === 0}>
              <Ionicons name="chevron-back" size={16} color={mi === 0 ? th.border : th.navy}/>
            </TouchableOpacity>
            <Text style={[S.monthName, { color: th.fg }]}>{cm.name}</Text>
            <TouchableOpacity onPress={() => { if (mi < CAL_MONTHS.length-1) { setMi(mi+1); setSelDay(null); } }}
              style={[S.navBtn, { backgroundColor: th.navyLight }]}
              disabled={mi === CAL_MONTHS.length-1}>
              <Ionicons name="chevron-forward" size={16} color={mi === CAL_MONTHS.length-1 ? th.border : th.navy}/>
            </TouchableOpacity>
          </View>

          {/* Weekday headers */}
          <View style={S.wdRow}>
            {WDAYS.map(d => (
              <Text key={d} style={[S.wd, { color: th.muted }]}>{d}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          {rows.map((row, ri) => (
            <View key={ri} style={S.calRow}>
              {row.map((day, ci) => <CalCell key={ci} day={day}/>)}
            </View>
          ))}

          {/* Legend */}
          <View style={[S.legend, { borderTopColor: th.border }]}>
            {Object.entries(EVENT_META).map(([k, m]) => (
              <View key={k} style={S.legendItem}>
                <View style={[S.legendDot, { backgroundColor: m.dot }]}/>
                <Text style={[S.legendText, { color: th.muted }]}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Day panel */}
        <View style={S.dayPanel}>
          <Text style={[S.dayTitle, { color: th.muted }]}>
            {selDay != null
              ? `${selDay} de ${cm.name} — ${dayEvts.length} evento${dayEvts.length !== 1 ? "s" : ""}`
              : "Selecione um dia"}
          </Text>
          {selDay != null && dayEvts.length === 0 && (
            <Empty th={th} icon="📅" title="Sem eventos" sub="Nenhum evento neste dia"/>
          )}
          {dayEvts.map(evt => {
            const em = EVENT_META[evt.type];
            return (
              <View key={evt.id} style={[S.evtCard, { backgroundColor: th.card, borderColor: th.border, borderLeftColor: em.dot }]}>
                <View style={{ gap: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Badge color={em.text} bg={em.bg}>{em.label}</Badge>
                    <Text style={[S.evtTitle, { color: th.fg }]}>{evt.title}</Text>
                  </View>
                  {evt.subject && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons name="book-outline" size={12} color={th.muted}/>
                      <Text style={[S.evtMeta, { color: th.muted }]}>{evt.subject}</Text>
                    </View>
                  )}
                  {evt.room && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons name="location-outline" size={12} color={th.muted}/>
                      <Text style={[S.evtMeta, { color: th.muted }]}>{evt.room}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* All events list */}
        <View style={[S.section, { borderTopColor: th.border }]}>
          <Text style={[S.sLabel, { color: th.muted }]}>TODOS OS EVENTOS</Text>
          {cls.events.filter(e => e.month === cm.month).length === 0 ? (
            <Empty th={th} icon="📆" title="Sem eventos este mês"/>
          ) : (
            cls.events.filter(e => e.month === cm.month).sort((a,b) => a.day - b.day).map(evt => {
              const em = EVENT_META[evt.type];
              return (
                <TouchableOpacity key={evt.id} onPress={() => setSelDay(evt.day)}
                  style={[S.listCard, { backgroundColor: th.card, borderColor: th.border }]}>
                  <View style={[S.dayBubble, { backgroundColor: th.navyLight }]}>
                    <Text style={[S.dayNum, { color: th.navy }]}>{evt.day}</Text>
                    <Text style={[S.daySub, { color: th.muted }]}>{cm.short}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[S.evtTitle, { color: th.fg }]}>{evt.title}</Text>
                    <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                      <Badge color={em.text} bg={em.bg}>{em.label}</Badge>
                      {evt.subject && <Text style={[S.evtMeta, { color: th.muted }]}>{evt.subject}</Text>}
                    </View>
                  </View>
                  <View style={[S.evtDotLarge, { backgroundColor: em.dot }]}/>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <FloatingNav current="events" onNav={onNav} th={th}/>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:      { flex: 1 },
  header:    { paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  hTitle:    { fontSize: 20, fontWeight: "800", color: "#fff" },
  countBadge:{ paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20 },
  countText: { fontSize: 12, color: "#fff" },
  calCard:   { margin: 16, borderRadius: 20, borderWidth: 1, padding: 16,
               shadowColor: "#0e2f5a", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  monthNav:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  navBtn:    { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  monthName: { fontSize: 16, fontWeight: "800" },
  wdRow:     { flexDirection: "row", marginBottom: 6 },
  wd:        { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "600" },
  calRow:    { flexDirection: "row" },
  cell:      { flex: 1, alignItems: "center", paddingVertical: 4, borderRadius: 8, margin: 1 },
  cellEmpty: { flex: 1, margin: 1 },
  cellToday: { borderRadius: 8 },
  cellSel:   { borderRadius: 8 },
  cellText:  { fontSize: 13 },
  dotRow:    { flexDirection: "row", gap: 2, marginTop: 2 },
  evtDot:    { width: 4, height: 4, borderRadius: 2 },
  legend:    { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingTop: 12, marginTop: 8, borderTopWidth: 1 },
  legendItem:{ flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText:{ fontSize: 11 },
  dayPanel:  { paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  dayTitle:  { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  evtCard:   { borderRadius: 14, borderWidth: 1, borderLeftWidth: 3, padding: 14 },
  evtTitle:  { fontSize: 14, fontWeight: "700" },
  evtMeta:   { fontSize: 12 },
  section:   { paddingHorizontal: 16, paddingTop: 16, borderTopWidth: 1, gap: 8 },
  sLabel:    { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.9, marginBottom: 6 },
  listCard:  { borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  dayBubble: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dayNum:    { fontSize: 17, fontWeight: "800" },
  daySub:    { fontSize: 9, fontWeight: "600", textTransform: "uppercase" },
  evtDotLarge:{ width: 10, height: 10, borderRadius: 5 },
});
