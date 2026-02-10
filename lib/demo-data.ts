import type { User, Site, Shift, Availability } from "./types"
import {
  format,
  addDays,
  startOfWeek,
  isSunday,
} from "date-fns"

export const demoUsers: User[] = [
  {
    id: "1",
    email: "admin@secu-planning.fr",
    firstName: "Marie",
    lastName: "Dupont",
    role: "admin",
    phone: "06 12 34 56 78",
  },
  {
    id: "2",
    email: "jean.martin@secu-planning.fr",
    firstName: "Jean",
    lastName: "Martin",
    role: "agent",
    phone: "06 98 76 54 32",
    certifications: ["SSIAP 1", "SST"],
  },
  {
    id: "3",
    email: "sophie.bernard@secu-planning.fr",
    firstName: "Sophie",
    lastName: "Bernard",
    role: "agent",
    phone: "06 11 22 33 44",
    certifications: ["SSIAP 2", "CQP APS"],
  },
  {
    id: "4",
    email: "lucas.petit@secu-planning.fr",
    firstName: "Lucas",
    lastName: "Petit",
    role: "agent",
    phone: "06 55 66 77 88",
    certifications: ["CQP APS"],
  },
  {
    id: "5",
    email: "emma.durand@secu-planning.fr",
    firstName: "Emma",
    lastName: "Durand",
    role: "agent",
    phone: "06 99 88 77 66",
    certifications: ["SSIAP 1", "CQP APS", "SST"],
  },
]

export const demoSites: Site[] = [
  {
    id: "s1",
    name: "Centre Commercial Riviera",
    address: "45 Avenue des Champs, 06000 Nice",
    contactName: "Paul Leclerc",
    contactPhone: "04 93 12 34 56",
  },
  {
    id: "s2",
    name: "Tour Meridia",
    address: "12 Boulevard Carabacel, 06000 Nice",
    contactName: "Claire Fontaine",
    contactPhone: "04 93 65 43 21",
  },
  {
    id: "s3",
    name: "Entrepot LogiSud",
    address: "Zone Industrielle, 06200 Nice",
    contactName: "Marc Dupuis",
    contactPhone: "04 93 78 90 12",
  },
  {
    id: "s4",
    name: "Residence Les Palmiers",
    address: "8 Rue des Oliviers, 06300 Nice",
    contactName: "Anne Moreau",
    contactPhone: "04 93 45 67 89",
  },
]

function generateShifts(): Shift[] {
  const shifts: Shift[] = []
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const agents = demoUsers.filter((u) => u.role === "agent")
  const siteIds = demoSites.map((s) => s.id)

  const shiftPatterns = [
    { start: "06:00", end: "14:00", isNight: false },
    { start: "14:00", end: "22:00", isNight: false },
    { start: "22:00", end: "06:00", isNight: true },
    { start: "08:00", end: "20:00", isNight: false },
  ]

  for (let dayOffset = -7; dayOffset < 14; dayOffset++) {
    const date = addDays(weekStart, dayOffset)
    const dateStr = format(date, "yyyy-MM-dd")
    const sunday = isSunday(date)

    agents.forEach((agent, agentIndex) => {
      if ((dayOffset + agentIndex) % 3 === 0) return

      const patternIndex = (agentIndex + dayOffset) % shiftPatterns.length
      const pattern = shiftPatterns[Math.abs(patternIndex)]
      const siteIndex = (agentIndex + Math.abs(dayOffset)) % siteIds.length

      shifts.push({
        id: `shift-${dateStr}-${agent.id}`,
        agentId: agent.id,
        siteId: siteIds[siteIndex],
        date: dateStr,
        startTime: pattern.start,
        endTime: pattern.end,
        isNight: pattern.isNight,
        isSunday: sunday,
      })
    })
  }

  return shifts
}

function generateAvailabilities(): Availability[] {
  const availabilities: Availability[] = []
  const today = new Date()
  const agents = demoUsers.filter((u) => u.role === "agent")

  agents.forEach((agent) => {
    for (let dayOffset = 0; dayOffset < 31; dayOffset++) {
      const date = addDays(today, dayOffset)
      const dateStr = format(date, "yyyy-MM-dd")
      const available = Math.random() > 0.2

      availabilities.push({
        id: `avail-${dateStr}-${agent.id}`,
        agentId: agent.id,
        date: dateStr,
        available,
      })
    }
  })

  return availabilities
}

export const demoShifts: Shift[] = generateShifts()
export const demoAvailabilities: Availability[] = generateAvailabilities()

export function getShiftDurationHours(shift: Shift): number {
  const [startH, startM] = shift.startTime.split(":").map(Number)
  const [endH, endM] = shift.endTime.split(":").map(Number)
  let startMinutes = startH * 60 + startM
  let endMinutes = endH * 60 + endM
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60
  }
  return (endMinutes - startMinutes) / 60
}
