import type { Shift } from "./types"

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
