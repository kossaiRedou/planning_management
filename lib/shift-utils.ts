import type { Shift } from "./types"

/** Format time for display: strip seconds (e.g. "10:12:00" or "10:12" -> "10:12") */
export function formatTimeNoSeconds(time: string): string {
  const parts = time.split(":")
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`
  return time
}

/** Format hours for display: round to 2 decimals, comma as separator (e.g. 3.88333 -> "3,88") */
export function formatHoursDisplay(hours: number): string {
  return (Math.round(hours * 100) / 100).toFixed(2).replace(".", ",")
}

/**
 * Calculate the duration of a shift in hours
 * Handles shifts that cross midnight
 */
export function getShiftDurationHours(shift: Shift): number {
  const [startH, startM] = shift.startTime.split(":").map(Number)
  const [endH, endM] = shift.endTime.split(":").map(Number)
  let startMinutes = startH * 60 + startM
  let endMinutes = endH * 60 + endM
  
  // If end is before start, shift crosses midnight
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60
  }
  
  return (endMinutes - startMinutes) / 60
}
