"use client"

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer"
import type { Shift, Site, User } from "@/lib/types"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { getShiftDurationHours } from "@/lib/shift-utils"

export interface PlanningPdfSection {
  weekLabel: string
  agents: User[]
  days: Date[]
  cellShifts: Record<string, Record<string, Shift[]>>
  unavailable: Record<string, Record<string, boolean>>
  agentWeekHours: Record<string, number>
  dayTotalHours: Record<string, number>
  grandTotal: number
}

export interface PlanningPdfDocumentProps {
  periodLabel: string
  scopeLabel: string
  sections: PlanningPdfSection[]
  sites: Site[]
  formatTimeNoSeconds: (time: string) => string
  formatHoursDisplay: (hours: number) => string
}

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 8 },
  title: { fontSize: 14, marginBottom: 4, fontWeight: "bold" },
  subtitle: { fontSize: 9, marginBottom: 12, color: "#555" },
  sectionTitle: { fontSize: 10, marginTop: 10, marginBottom: 6, fontWeight: "bold" },
  table: { flexDirection: "column", borderWidth: 1, borderColor: "#ccc", marginBottom: 8 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: "#ddd" },
  headerRow: { flexDirection: "row", backgroundColor: "#2C5BD3", borderBottomWidth: 1, borderColor: "#2C5BD3" },
  totalRow: { flexDirection: "row", backgroundColor: "#EDEDED", fontWeight: "bold" },
  cellAgent: { width: "22%", padding: 6, borderRightWidth: 0.5, borderColor: "#ddd" },
  cellDay: { width: "9%", padding: 4, borderRightWidth: 0.5, borderColor: "#ddd", alignItems: "center", justifyContent: "center" },
  cellTotal: { width: "15%", padding: 6, alignItems: "center", justifyContent: "center" },
  headerText: { color: "white", fontSize: 7, fontWeight: "bold", textAlign: "center" },
  headerTextAgent: { color: "white", fontSize: 7, fontWeight: "bold" },
  cellText: { fontSize: 7, color: "#222" },
  cellTextMuted: { fontSize: 6, color: "#555", marginTop: 1 },
  shiftBlock: { marginBottom: 2, padding: 2, backgroundColor: "#f5f5f5", borderRadius: 1 },
  shiftBlockNight: { backgroundColor: "#E3F0FF" },
  shiftBlockDay: { backgroundColor: "#FFF8D6" },
  legend: { flexDirection: "row", marginTop: 12, gap: 12, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendBox: { width: 8, height: 8, backgroundColor: "#FFF8D6", borderWidth: 0.5, borderColor: "#E8E0B8" },
  legendBoxNight: { backgroundColor: "#E3F0FF", borderColor: "#B8D4F0" },
  legendBoxUnavail: { backgroundColor: "#FFE5E5", borderColor: "#fcc" },
})

function CellContent({
  shifts,
  sites,
  formatTimeNoSeconds,
  formatHoursDisplay,
}: {
  shifts: Shift[]
  sites: Site[]
  formatTimeNoSeconds: (t: string) => string
  formatHoursDisplay: (h: number) => string
}) {
  if (shifts.length === 0) return <Text style={styles.cellText}>—</Text>
  return (
    <View>
      {shifts.map((shift) => {
        const site = sites.find((s) => s.id === shift.siteId)
        const hours = getShiftDurationHours(shift)
        return (
          <View
            key={shift.id}
            style={[
              styles.shiftBlock,
              shift.isNight ? styles.shiftBlockNight : styles.shiftBlockDay,
            ]}
          >
            <Text style={styles.cellText}>
              {formatTimeNoSeconds(shift.startTime)} – {formatTimeNoSeconds(shift.endTime)}
            </Text>
            <Text style={styles.cellTextMuted}>{site?.name ?? "—"}</Text>
            <Text style={styles.cellTextMuted}>{formatHoursDisplay(hours)} h</Text>
          </View>
        )
      })}
    </View>
  )
}

function PlanningTable({
  section,
  sites,
  formatTimeNoSeconds,
  formatHoursDisplay,
}: {
  section: PlanningPdfSection
  sites: Site[]
  formatTimeNoSeconds: (t: string) => string
  formatHoursDisplay: (h: number) => string
}) {
  const { weekLabel, agents, days, cellShifts, unavailable, agentWeekHours, dayTotalHours, grandTotal } = section
  const dayWidth = "9%"
  const totalWidth = "15%"
  const agentWidth = "22%"

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.sectionTitle}>{weekLabel}</Text>
      <View style={styles.table}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={[styles.cellAgent, { width: agentWidth }]}>
            <Text style={styles.headerTextAgent}>Agent</Text>
          </View>
          {days.map((day) => (
            <View key={day.toISOString()} style={[styles.cellDay, { width: dayWidth }]}>
              <Text style={styles.headerText}>{format(day, "EEE", { locale: fr })}</Text>
              <Text style={styles.headerText}>{format(day, "d")}</Text>
            </View>
          ))}
          <View style={[styles.cellTotal, { width: totalWidth }]}>
            <Text style={styles.headerText}>Total</Text>
          </View>
        </View>
        {/* Agent rows */}
        {agents.map((agent) => (
          <View key={agent.id} style={styles.row}>
            <View style={[styles.cellAgent, { width: agentWidth }]}>
              <Text style={styles.cellText}>
                {agent.firstName} {agent.lastName}
              </Text>
              <Text style={styles.cellTextMuted}>
                {formatHoursDisplay(agentWeekHours[agent.id] ?? 0)} h
              </Text>
            </View>
            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd")
              const shifts = cellShifts[agent.id]?.[dateStr] ?? []
              const unav = unavailable[agent.id]?.[dateStr]
              return (
                <View key={dateStr} style={[styles.cellDay, { width: dayWidth }]}>
                  {unav ? (
                    <Text style={[styles.cellText, { color: "#c00" }]}>Indisp.</Text>
                  ) : (
                    <CellContent
                      shifts={shifts}
                      sites={sites}
                      formatTimeNoSeconds={formatTimeNoSeconds}
                      formatHoursDisplay={formatHoursDisplay}
                    />
                  )}
                </View>
              )
            })}
            <View style={[styles.cellTotal, { width: totalWidth }]}>
              <Text style={styles.cellText}>
                {formatHoursDisplay(agentWeekHours[agent.id] ?? 0)} h
              </Text>
            </View>
          </View>
        ))}
        {/* Totals row */}
        <View style={styles.totalRow}>
          <View style={[styles.cellAgent, { width: agentWidth }]}>
            <Text style={styles.cellText}>Total par jour</Text>
          </View>
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd")
            return (
              <View key={dateStr} style={[styles.cellTotal, { width: dayWidth }]}>
                <Text style={styles.cellText}>{formatHoursDisplay(dayTotalHours[dateStr] ?? 0)} h</Text>
              </View>
            )
          })}
          <View style={[styles.cellTotal, { width: totalWidth }]}>
            <Text style={styles.cellText}>{formatHoursDisplay(grandTotal)} h</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export function PlanningPdfDocument({
  periodLabel,
  scopeLabel,
  sections,
  sites,
  formatTimeNoSeconds,
  formatHoursDisplay,
}: PlanningPdfDocumentProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>Planning – {periodLabel}</Text>
        <Text style={styles.subtitle}>{scopeLabel}</Text>
        {sections.map((section, i) => (
          <PlanningTable
            key={i}
            section={section}
            sites={sites}
            formatTimeNoSeconds={formatTimeNoSeconds}
            formatHoursDisplay={formatHoursDisplay}
          />
        ))}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={styles.legendBox} />
            <Text style={styles.cellText}>Mission de jour</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.legendBoxNight]} />
            <Text style={styles.cellText}>Mission de nuit</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.legendBoxUnavail]} />
            <Text style={styles.cellText}>Agent indisponible</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export async function downloadPlanningPdf(props: PlanningPdfDocumentProps, filename: string) {
  const blob = await pdf(<PlanningPdfDocument {...props} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
