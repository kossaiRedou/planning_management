"use client"

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer"
import type { Shift, Site } from "@/lib/types"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { getShiftDurationHours } from "@/lib/shift-utils"

export interface BoardPdfProps {
  periodLabel: string
  orgName: string
  shifts: Shift[]
  sites: Site[]
  totalHours: string
  dayHours: string
  nightHours: string
  formatTimeNoSeconds: (t: string) => string
  formatHoursDisplay: (h: number) => string
}

const s = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: "Helvetica" },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 2, color: "#1a1a1a" },
  subtitle: { fontSize: 10, color: "#555", marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statBox: { flex: 1, padding: 8, borderWidth: 1, borderColor: "#ddd", borderRadius: 3, backgroundColor: "#fafafa" },
  statLabel: { fontSize: 7, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  statValue: { fontSize: 13, fontWeight: "bold", color: "#222" },
  table: { borderWidth: 1, borderColor: "#ccc" },
  headerRow: { flexDirection: "row", backgroundColor: "#2C5BD3", borderBottomWidth: 1, borderColor: "#2C5BD3" },
  headerText: { color: "white", fontSize: 8, fontWeight: "bold" },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: "#e5e5e5" },
  rowAlt: { backgroundColor: "#f9f9f9" },
  cellDate: { width: "18%", padding: 6 },
  cellSite: { width: "28%", padding: 6 },
  cellTime: { width: "22%", padding: 6 },
  cellDuration: { width: "16%", padding: 6, alignItems: "center" },
  cellType: { width: "16%", padding: 6, alignItems: "center" },
  text: { fontSize: 8, color: "#222" },
  textMuted: { fontSize: 8, color: "#555" },
  badgeDay: { backgroundColor: "#FFF8D6", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2, borderWidth: 0.5, borderColor: "#E8E0B8" },
  badgeNight: { backgroundColor: "#E3F0FF", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2, borderWidth: 0.5, borderColor: "#B8D4F0" },
  badgeSunday: { backgroundColor: "#FFF0E0", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2, borderWidth: 0.5, borderColor: "#E8C8A0" },
  badgeText: { fontSize: 7, fontWeight: "bold" },
  footer: { marginTop: 20, fontSize: 7, color: "#999", textAlign: "center" },
})

function BoardPdfDocument({
  periodLabel,
  orgName,
  shifts,
  sites,
  totalHours,
  dayHours,
  nightHours,
  formatTimeNoSeconds,
  formatHoursDisplay,
}: BoardPdfProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Rapport d&apos;activité</Text>
        <Text style={s.subtitle}>{orgName} — {periodLabel}</Text>

        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Total heures</Text>
            <Text style={s.statValue}>{totalHours} h</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Heures jour</Text>
            <Text style={s.statValue}>{dayHours} h</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Heures nuit</Text>
            <Text style={s.statValue}>{nightHours} h</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Missions</Text>
            <Text style={s.statValue}>{shifts.length}</Text>
          </View>
        </View>

        <View style={s.table}>
          <View style={s.headerRow}>
            <View style={s.cellDate}><Text style={s.headerText}>Date</Text></View>
            <View style={s.cellSite}><Text style={s.headerText}>Site</Text></View>
            <View style={s.cellTime}><Text style={s.headerText}>Horaires</Text></View>
            <View style={s.cellDuration}><Text style={s.headerText}>Durée</Text></View>
            <View style={s.cellType}><Text style={s.headerText}>Type</Text></View>
          </View>
          {shifts.map((shift, i) => {
            const site = sites.find((st) => st.id === shift.siteId)
            const duration = getShiftDurationHours(shift)
            const isNight = shift.isNight
            const isSunday = shift.isSunday
            return (
              <View key={shift.id} style={[s.row, i % 2 === 1 ? s.rowAlt : {}]}>
                <View style={s.cellDate}>
                  <Text style={s.text}>{format(parseISO(shift.date), "EEE d MMM yyyy", { locale: fr })}</Text>
                </View>
                <View style={s.cellSite}>
                  <Text style={s.text}>{site?.name ?? "—"}</Text>
                </View>
                <View style={s.cellTime}>
                  <Text style={s.text}>{formatTimeNoSeconds(shift.startTime)} – {formatTimeNoSeconds(shift.endTime)}</Text>
                </View>
                <View style={s.cellDuration}>
                  <Text style={s.text}>{formatHoursDisplay(duration)} h</Text>
                </View>
                <View style={s.cellType}>
                  <View style={isNight ? s.badgeNight : isSunday ? s.badgeSunday : s.badgeDay}>
                    <Text style={[s.badgeText, { color: isNight ? "#1A3A8A" : isSunday ? "#8B5E14" : "#222" }]}>
                      {isNight ? "Nuit" : isSunday ? "Dim." : "Jour"}
                    </Text>
                  </View>
                </View>
              </View>
            )
          })}
        </View>

        <Text style={s.footer}>
          Généré le {format(new Date(), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
        </Text>
      </Page>
    </Document>
  )
}

export async function downloadBoardPdf(props: BoardPdfProps, filename: string) {
  const blob = await pdf(<BoardPdfDocument {...props} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
