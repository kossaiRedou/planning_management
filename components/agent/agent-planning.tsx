"use client"

import { useState, useMemo, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { getShiftDurationHours, formatTimeNoSeconds, formatHoursDisplay } from "@/lib/shift-utils"
import type { Site, Shift } from "@/lib/types"
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
import { ChevronLeft, ChevronRight, MapPin, Clock, Moon, ExternalLink, Check } from "lucide-react"

type ViewMode = "week" | "month"

export function AgentPlanning() {
  const { user } = useAuth()
  const supabase = createClient()
  
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [myShifts, setMyShifts] = useState<Shift[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const userId = user.id
    const userOrgId = user.organization_id
    const start = viewMode === 'week' ? startOfWeek(currentDate, { weekStartsOn: 1 }) : startOfMonth(currentDate)
    const end = viewMode === 'week' ? endOfWeek(currentDate, { weekStartsOn: 1 }) : endOfMonth(currentDate)
    const startStr = format(start, 'yyyy-MM-dd')
    const endStr = format(end, 'yyyy-MM-dd')

    setIsLoading(true)
    Promise.all([
      supabase.from('shifts').select('*').eq('agent_id', userId).gte('date', startStr).lte('date', endStr),
      supabase.from('sites').select('*').eq('organization_id', userOrgId),
    ])
      .then(([shiftsRes, sitesRes]) => {
        if (cancelled) return
        if (shiftsRes.data) {
          setMyShifts((shiftsRes.data as any[]).map((shift: any) => ({
            id: shift.id,
            organization_id: shift.organization_id,
            agentId: shift.agent_id,
            siteId: shift.site_id,
            date: shift.date,
            startTime: shift.start_time,
            endTime: shift.end_time,
            notes: shift.notes || undefined,
            isNight: shift.is_night,
            isSunday: shift.is_sunday,
            status: shift.status,
          })))
        }
        if (sitesRes.data) {
          setSites((sitesRes.data as any[]).map((site: any) => ({
            id: site.id,
            organization_id: site.organization_id,
            name: site.name,
            address: site.address,
            contactName: site.contact_name || undefined,
            contactPhone: site.contact_phone || undefined,
          })))
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true }
  }, [user, currentDate, viewMode, supabase])

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
    return sites.find((s) => s.id === siteId)
  }

  const headerLabel =
    viewMode === "week"
      ? `Semaine du ${format(dateRange[0], "d MMM", { locale: fr })} au ${format(dateRange[dateRange.length - 1], "d MMM yyyy", { locale: fr })}`
      : format(currentDate, "MMMM yyyy", { locale: fr })

  const selectedDayShifts = selectedDay ? getShiftsForDay(selectedDay) : []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Chargement du planning...</div>
      </div>
    )
  }

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

      {/* Calendar Grid - structure claire, couleurs par statut */}
      {viewMode === "week" ? (
        <div className="flex flex-col gap-2">
          {dateRange.map((day) => {
            const shifts = getShiftsForDay(day)
            const today = isToday(day)
            const isRest = shifts.length === 0
            const dayTotalHours = shifts.reduce((acc, s) => acc + getShiftDurationHours(s), 0)

            return (
              <Card
                key={day.toISOString()}
                className={`cursor-pointer transition-colors hover:opacity-95 ${
                  !isRest ? "bg-[#F2F7FF]" : "bg-[#E8F8EC]"
                } ${today ? "ring-2 ring-[#2C5BD3]" : ""} ${
                  selectedDay && isSameDay(day, selectedDay) ? "ring-2 ring-[#2C5BD3]" : ""
                }`}
                onClick={() => setSelectedDay(day)}
              >
                <CardContent className="flex items-center gap-4 p-3 sm:p-4">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-[#222222]/5">
                    <span className="text-xs font-bold capitalize text-[#222222]">
                      {format(day, "EEE", { locale: fr })}
                    </span>
                    <span className="text-sm font-medium leading-none text-[#555555]">
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    {shifts.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {shifts.map((shift) => {
                          const site = getSiteById(shift.siteId)
                          const durationHours = getShiftDurationHours(shift)
                          return (
                            <div key={shift.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              <span className="text-sm font-bold text-[#222222]">
                                {formatTimeNoSeconds(shift.startTime)} – {formatTimeNoSeconds(shift.endTime)}
                              </span>
                              <span className="text-xs text-[#666666]">
                                {site?.name}
                              </span>
                              <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-[#E3F0FF] text-[#1A3A8A]">
                                {formatHoursDisplay(durationHours)} h
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Check className="h-4 w-4 shrink-0 text-[#1E6B3A]" />
                        <span className="text-sm font-medium text-[#1E6B3A]">Repos</span>
                      </div>
                    )}
                  </div>
                  {shifts.length > 0 && (
                    <span
                      className="shrink-0 rounded px-2 py-1 text-sm font-semibold bg-[#E3F0FF] text-[#1A3A8A]"
                      title={`Valeur exacte: ${dayTotalHours} h`}
                    >
                      {formatHoursDisplay(dayTotalHours)} h
                    </span>
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
                          s.isNight ? "bg-indigo-500" : "bg-blue-500"
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
            <CardTitle className="text-base capitalize text-[#222222]">
              {format(selectedDay, "EEEE d MMMM yyyy", { locale: fr })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayShifts.length === 0 ? (
              <p className="text-sm text-[#555555]">Aucune mission ce jour.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {selectedDayShifts.map((shift) => {
                  const site = getSiteById(shift.siteId)
                  const duration = getShiftDurationHours(shift)
                  return (
                    <div
                      key={shift.id}
                      className="flex flex-col gap-3 rounded-lg border border-border bg-[#F2F7FF]/50 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Clock className="h-4 w-4 text-[#555555]" />
                        <span className="text-sm font-bold text-[#222222]">
                          {formatTimeNoSeconds(shift.startTime)} – {formatTimeNoSeconds(shift.endTime)}
                        </span>
                        <span
                          className="rounded px-2 py-0.5 text-xs font-medium bg-[#E3F0FF] text-[#1A3A8A]"
                          title={`Valeur exacte: ${duration} h`}
                        >
                          {formatHoursDisplay(duration)} h
                        </span>
                        {shift.isNight && (
                          <Badge className="border border-[#B8D4F0] bg-[#E3F0FF] text-[#1A3A8A] hover:bg-[#E3F0FF]">
                            Nuit
                          </Badge>
                        )}
                        {shift.isSunday && (
                          <Badge className="bg-warning/10 text-warning hover:bg-warning/10">
                            Dimanche
                          </Badge>
                        )}
                      </div>
                      {site && (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-[#555555]" />
                            <span className="text-sm font-medium text-[#222222]">{site.name}</span>
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
                        <p className="text-sm text-[#555555]">
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
