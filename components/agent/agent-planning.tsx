"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { demoShifts, demoSites, getShiftDurationHours } from "@/lib/demo-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  eachDayOfInterval,
  isToday,
  isSameDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  parseISO,
} from "date-fns"
import { fr } from "date-fns/locale"
import { ChevronLeft, ChevronRight, MapPin, Clock, Moon, ExternalLink } from "lucide-react"

type ViewMode = "week" | "month"

export function AgentPlanning() {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const myShifts = useMemo(() => {
    if (!user) return []
    return demoShifts.filter((s) => s.agentId === user.id)
  }, [user])

  const dateRange = useMemo(() => {
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const end = endOfWeek(currentDate, { weekStartsOn: 1 })
      return eachDayOfInterval({ start, end })
    }
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }, [currentDate, viewMode])

  function navigate(direction: number) {
    if (viewMode === "week") {
      setCurrentDate((d) => addWeeks(d, direction))
    } else {
      setCurrentDate((d) => addMonths(d, direction))
    }
    setSelectedDay(null)
  }

  function getShiftsForDay(day: Date) {
    const dateStr = format(day, "yyyy-MM-dd")
    return myShifts.filter((s) => s.date === dateStr)
  }

  function getSiteById(siteId: string) {
    return demoSites.find((s) => s.id === siteId)
  }

  const headerLabel =
    viewMode === "week"
      ? `Semaine du ${format(dateRange[0], "d MMM", { locale: fr })} au ${format(dateRange[dateRange.length - 1], "d MMM yyyy", { locale: fr })}`
      : format(currentDate, "MMMM yyyy", { locale: fr })

  const selectedDayShifts = selectedDay ? getShiftsForDay(selectedDay) : []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mon Planning</h1>
        <p className="text-sm text-muted-foreground">
          Consultez vos missions et horaires
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} aria-label="Periode precedente">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-48 text-center text-sm font-medium text-foreground capitalize">
            {headerLabel}
          </span>
          <Button variant="outline" size="icon" onClick={() => navigate(1)} aria-label="Periode suivante">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Tabs value={viewMode} onValueChange={(v) => { setViewMode(v as ViewMode); setSelectedDay(null) }}>
          <TabsList>
            <TabsTrigger value="week">Semaine</TabsTrigger>
            <TabsTrigger value="month">Mois</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Calendar Grid */}
      {viewMode === "week" ? (
        <div className="flex flex-col gap-2">
          {dateRange.map((day) => {
            const shifts = getShiftsForDay(day)
            const today = isToday(day)

            return (
              <Card
                key={day.toISOString()}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  today ? "border-primary/50 bg-primary/5" : ""
                } ${selectedDay && isSameDay(day, selectedDay) ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedDay(day)}
              >
                <CardContent className="flex items-center gap-4 p-3 sm:p-4">
                  <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg ${
                    today ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}>
                    <span className="text-xs font-medium capitalize">
                      {format(day, "EEE", { locale: fr })}
                    </span>
                    <span className="text-lg font-bold leading-none">
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="flex-1">
                    {shifts.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {shifts.map((shift) => {
                          const site = getSiteById(shift.siteId)
                          return (
                            <div key={shift.id} className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${
                                shift.isNight ? "bg-indigo-500" : "bg-accent"
                              }`} />
                              <span className="text-sm font-medium text-foreground">
                                {shift.startTime} - {shift.endTime}
                              </span>
                              <span className="hidden text-sm text-muted-foreground sm:inline">
                                {site?.name}
                              </span>
                              {shift.isNight && (
                                <Moon className="h-3 w-3 text-indigo-500" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Repos</span>
                    )}
                  </div>
                  {shifts.length > 0 && (
                    <Badge variant="secondary" className="shrink-0">
                      {shifts.reduce((acc, s) => acc + getShiftDurationHours(s), 0)}h
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
          {/* Fill empty days at start */}
          {Array.from({
            length: ((dateRange[0].getDay() + 6) % 7),
          }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {dateRange.map((day) => {
            const shifts = getShiftsForDay(day)
            const today = isToday(day)
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`flex flex-col items-center gap-0.5 rounded-lg p-2 transition-colors hover:bg-muted ${
                  today ? "bg-primary/10 font-bold" : ""
                } ${selectedDay && isSameDay(day, selectedDay) ? "ring-2 ring-primary" : ""}`}
              >
                <span className={`text-sm ${today ? "text-primary" : "text-foreground"}`}>
                  {format(day, "d")}
                </span>
                {shifts.length > 0 && (
                  <div className="flex gap-0.5">
                    {shifts.map((s) => (
                      <div
                        key={s.id}
                        className={`h-1.5 w-1.5 rounded-full ${
                          s.isNight ? "bg-indigo-500" : "bg-accent"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Selected Day Details */}
      {selectedDay && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base capitalize">
              {format(selectedDay, "EEEE d MMMM yyyy", { locale: fr })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayShifts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune mission ce jour.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {selectedDayShifts.map((shift) => {
                  const site = getSiteById(shift.siteId)
                  const duration = getShiftDurationHours(shift)
                  return (
                    <div
                      key={shift.id}
                      className="flex flex-col gap-3 rounded-lg border border-border p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold text-foreground">
                            {shift.startTime} - {shift.endTime}
                          </span>
                          <Badge variant="secondary">{duration}h</Badge>
                          {shift.isNight && (
                            <Badge className="bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/10">
                              Nuit
                            </Badge>
                          )}
                          {shift.isSunday && (
                            <Badge className="bg-warning/10 text-warning hover:bg-warning/10">
                              Dimanche
                            </Badge>
                          )}
                        </div>
                      </div>
                      {site && (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">{site.name}</span>
                          </div>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-6 flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            {site.address}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                      {shift.notes && (
                        <p className="text-sm text-muted-foreground">
                          Consignes : {shift.notes}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
