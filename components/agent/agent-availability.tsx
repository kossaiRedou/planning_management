"use client"

import { useState, useMemo, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { demoAvailabilities } from "@/lib/demo-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  isSameDay,
  isToday,
  isBefore,
  parseISO,
} from "date-fns"
import { fr } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Check, X, Info } from "lucide-react"
import type { Availability } from "@/lib/types"

export function AgentAvailability() {
  const { user } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(addMonths(new Date(), 1))
  const [localAvailabilities, setLocalAvailabilities] = useState<Availability[]>(demoAvailabilities)
  const [saved, setSaved] = useState(false)

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const myAvailabilities = useMemo(() => {
    if (!user) return []
    return localAvailabilities.filter((a) => a.agentId === user.id)
  }, [user, localAvailabilities])

  const getAvailabilityForDay = useCallback(
    (day: Date) => {
      const dateStr = format(day, "yyyy-MM-dd")
      return myAvailabilities.find((a) => a.date === dateStr)
    },
    [myAvailabilities]
  )

  function toggleDay(day: Date) {
    if (!user) return
    const dateStr = format(day, "yyyy-MM-dd")
    setSaved(false)

    setLocalAvailabilities((prev) => {
      const existing = prev.find((a) => a.agentId === user.id && a.date === dateStr)
      if (existing) {
        return prev.map((a) =>
          a.id === existing.id ? { ...a, available: !a.available } : a
        )
      }
      return [
        ...prev,
        {
          id: `avail-${dateStr}-${user.id}`,
          agentId: user.id,
          date: dateStr,
          available: false,
        },
      ]
    })
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const availableCount = monthDays.filter((d) => {
    const a = getAvailabilityForDay(d)
    return a?.available !== false
  }).length

  const unavailableCount = monthDays.length - availableCount

  const deadline = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 20)
  const isPastDeadline = isBefore(deadline, new Date())

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mes Disponibilites</h1>
        <p className="text-sm text-muted-foreground">
          Declarez vos disponibilites pour le mois suivant
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="text-sm text-foreground">
          <p className="font-medium">Comment declarer vos disponibilites :</p>
          <p className="mt-1 text-muted-foreground">
            Cliquez sur un jour pour le marquer comme indisponible (rouge) ou disponible (vert).
            Les disponibilites doivent etre saisies avant le 20 du mois precedent.
          </p>
          {isPastDeadline && (
            <p className="mt-1 font-medium text-warning">
              Date limite depassee pour ce mois.
            </p>
          )}
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth((d) => addMonths(d, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold text-foreground capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: fr })}
        </span>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth((d) => addMonths(d, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary */}
      <div className="flex gap-4">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-success" />
          {availableCount} jours disponibles
        </Badge>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-destructive" />
          {unavailableCount} jours indisponibles
        </Badge>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-1">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
            {/* Fill empty days at start */}
            {Array.from({
              length: ((monthDays[0].getDay() + 6) % 7),
            }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {monthDays.map((day) => {
              const availability = getAvailabilityForDay(day)
              const isAvailable = availability?.available !== false
              const today = isToday(day)

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-lg p-2 transition-all hover:scale-105 ${
                    isAvailable
                      ? "bg-success/10 text-success hover:bg-success/20"
                      : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                  } ${today ? "ring-2 ring-primary" : ""}`}
                >
                  <span className="text-sm font-medium">{format(day, "d")}</span>
                  {isAvailable ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Enregistre
            </>
          ) : (
            "Enregistrer mes disponibilites"
          )}
        </Button>
      </div>
    </div>
  )
}
