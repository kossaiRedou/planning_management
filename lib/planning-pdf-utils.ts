import { format, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval } from "date-fns"
import { fr } from "date-fns/locale"
import type { Shift, User } from "@/lib/types"
import { getShiftDurationHours } from "@/lib/shift-utils"
import type { PlanningPdfSection } from "@/components/admin/planning-pdf-document"

/**
 * Build one PDF section (one week table) from agents, shifts for that week, and availabilities.
 */
export function buildPlanningPdfSection(
  agents: User[],
  days: Date[],
  shifts: Shift[],
  availabilities: { agent_id: string; date: string; available: boolean }[]
): PlanningPdfSection {
  const cellShifts: Record<string, Record<string, Shift[]>> = {}
  const unavailable: Record<string, Record<string, boolean>> = {}
  const agentWeekHours: Record<string, number> = {}
  const dayTotalHours: Record<string, number> = {}

  agents.forEach((agent) => {
    cellShifts[agent.id] = {}
    unavailable[agent.id] = {}
    let agentTotal = 0
    days.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd")
      const cell = shifts.filter((s) => s.agentId === agent.id && s.date === dateStr)
      cellShifts[agent.id][dateStr] = cell
      cell.forEach((s) => {
        agentTotal += getShiftDurationHours(s)
      })
      const av = availabilities.find((a) => a.agent_id === agent.id && a.date === dateStr)
      unavailable[agent.id][dateStr] = av?.available === false
    })
    agentWeekHours[agent.id] = agentTotal
  })

  days.forEach((day) => {
    const dateStr = format(day, "yyyy-MM-dd")
    let total = 0
    agents.forEach((agent) => {
      const cell = cellShifts[agent.id]?.[dateStr] ?? []
      cell.forEach((s) => {
        total += getShiftDurationHours(s)
      })
    })
    dayTotalHours[dateStr] = total
  })

  const grandTotal = Object.values(agentWeekHours).reduce((s, h) => s + h, 0)

  return {
    weekLabel: days.length ? `Semaine du ${format(days[0], "d MMM", { locale: fr })} au ${format(days[days.length - 1], "d MMM yyyy", { locale: fr })}` : "",
    agents,
    days,
    cellShifts,
    unavailable,
    agentWeekHours,
    dayTotalHours,
    grandTotal,
  }
}

/**
 * Build multiple sections for a month (one per week).
 */
export function buildPlanningPdfSectionsForMonth(
  agents: User[],
  shifts: Shift[],
  availabilities: { agent_id: string; date: string; available: boolean }[],
  monthStart: Date,
  monthEnd: Date,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1
): PlanningPdfSection[] {
  const sections: PlanningPdfSection[] = []
  let weekStart = startOfWeek(monthStart, { weekStartsOn })
  while (weekStart <= monthEnd) {
    const weekEndDate = endOfWeek(weekStart, { weekStartsOn })
    const allDays = eachDayOfInterval({ start: weekStart, end: weekEndDate })
    const days = allDays.filter((d) => d >= monthStart && d <= monthEnd)
    if (days.length > 0) {
      const weekShifts = shifts.filter((s) =>
        days.some((day) => format(day, "yyyy-MM-dd") === s.date)
      )
      sections.push(buildPlanningPdfSection(agents, days, weekShifts, availabilities))
    }
    weekStart = addWeeks(weekStart, 1)
  }
  return sections
}
