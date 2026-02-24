"use client"

import { useState, useMemo, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { getShiftDurationHours, formatTimeNoSeconds, formatHoursDisplay } from "@/lib/shift-utils"
import type { Site, Shift } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addWeeks, addMonths, subMonths } from "date-fns"
import { fr } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"

type PeriodType = "month" | "week"

export function AgentHours() {
  const { user } = useAuth()
  const supabase = createClient()
  
  const [period, setPeriod] = useState<PeriodType>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [myShifts, setMyShifts] = useState<Shift[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const rangeStart = period === "month" ? startOfMonth(currentDate) : startOfWeek(currentDate, { weekStartsOn: 1 })
  const rangeEnd = period === "month" ? endOfMonth(currentDate) : endOfWeek(currentDate, { weekStartsOn: 1 })

  // Load shifts from Supabase
  useEffect(() => {
    if (!user) return

    async function loadShifts() {
      if (!user) return
      const userId = user.id
      const userOrgId = user.organization_id
      
      setIsLoading(true)
      try {
        const start = rangeStart
        const end = rangeEnd

        // Load shifts
        const { data: shiftsData } = await supabase
          .from('shifts')
          .select('*')
          .eq('agent_id', userId)
          .gte('date', format(start, 'yyyy-MM-dd'))
          .lte('date', format(end, 'yyyy-MM-dd'))
          .order('date', { ascending: true })

        if (shiftsData) {
          setMyShifts((shiftsData as any[]).map(shift => ({
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

        // Load sites
        const { data: sitesData } = await supabase
          .from('sites')
          .select('*')
          .eq('organization_id', userOrgId)

        if (sitesData) {
          setSites((sitesData as any[]).map(site => ({
            id: site.id,
            organization_id: site.organization_id,
            name: site.name,
            address: site.address,
            contactName: site.contact_name || undefined,
            contactPhone: site.contact_phone || undefined,
          })))
        }

      } catch (error) {
        console.error('Error loading hours:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadShifts()
  }, [user, rangeStart, rangeEnd, supabase])

  const stats = useMemo(() => {
    let totalHours = 0
    let dayHours = 0
    let nightHours = 0
    let sundayHours = 0

    myShifts.forEach((shift) => {
      const hours = getShiftDurationHours(shift)
      totalHours += hours
      if (shift.isNight) {
        nightHours += hours
      } else {
        dayHours += hours
      }
      if (shift.isSunday) {
        sundayHours += hours
      }
    })

    return { totalHours, dayHours, nightHours, sundayHours, shiftCount: myShifts.length }
  }, [myShifts])

  function exportCSV() {
    const headers = ["Date", "Site", "Debut", "Fin", "Duree (h)", "Type"]
    const rows = myShifts.map((shift) => {
      const site = sites.find((s) => s.id === shift.siteId)
      const duration = getShiftDurationHours(shift)
      const type = shift.isNight ? "Nuit" : shift.isSunday ? "Dimanche" : "Jour"
      return [
        format(parseISO(shift.date), "dd/MM/yyyy"),
        site?.name || "",
        shift.startTime,
        shift.endTime,
        formatHoursDisplay(duration),
        type,
      ]
    })
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = period === "month"
      ? `heures_${format(rangeStart, "yyyy-MM")}.csv`
      : `heures_${format(rangeStart, "yyyy-MM-dd")}_semaine.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function navigatePeriod(delta: number) {
    if (period === "month") {
      setCurrentDate((d) => (delta > 0 ? addMonths(d, 1) : subMonths(d, 1)))
    } else {
      setCurrentDate((d) => addWeeks(d, delta))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Chargement des heures...</div>
      </div>
    )
  }

  const periodLabel = period === "month"
    ? format(rangeStart, "MMMM yyyy", { locale: fr })
    : `Sem. du ${format(rangeStart, "d MMM", { locale: fr })}`

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-[#222222]">Heures</h1>

      {/* Filtre Mois / Semaine + Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-0.5">
          <button
            type="button"
            onClick={() => setPeriod("week")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              period === "week" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Semaine
          </button>
          <button
            type="button"
            onClick={() => setPeriod("month")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              period === "month" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mois
          </button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigatePeriod(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center text-sm font-medium capitalize text-[#222222]">
            {periodLabel}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigatePeriod(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Totaux - 2 décimales, très simple */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-white px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-[#555555]">Total</p>
          <p className="text-lg font-semibold text-[#222222]">{formatHoursDisplay(stats.totalHours)} h</p>
        </div>
        <div className="rounded-lg border border-border bg-white px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-[#555555]">Jour</p>
          <p className="text-lg font-semibold text-[#222222]">{formatHoursDisplay(stats.dayHours)} h</p>
        </div>
        <div className="rounded-lg border border-border bg-white px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-[#555555]">Nuit</p>
          <p className="text-lg font-semibold text-[#222222]">{formatHoursDisplay(stats.nightHours)} h</p>
        </div>
        <div className="rounded-lg border border-border bg-white px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-[#555555]">Missions</p>
          <p className="text-lg font-semibold text-[#222222]">{stats.shiftCount}</p>
        </div>
      </div>

      {/* Export + Table */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={exportCSV} className="gap-1.5 text-[#555555]">
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
        </div>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {myShifts.length === 0 ? (
              <p className="py-10 text-center text-sm text-[#555555]">
                {period === "month" ? "Aucune mission ce mois-ci." : "Aucune mission cette semaine."}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-[#555555]">Date</TableHead>
                    <TableHead className="text-xs font-medium text-[#555555]">Horaires</TableHead>
                    <TableHead className="hidden text-xs font-medium text-[#555555] sm:table-cell">Site</TableHead>
                    <TableHead className="text-xs font-medium text-[#555555]">Duree</TableHead>
                    <TableHead className="text-xs font-medium text-[#555555]">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myShifts.map((shift) => {
                    const site = sites.find((s) => s.id === shift.siteId)
                    const duration = getShiftDurationHours(shift)
                    return (
                      <TableRow key={shift.id} className="border-b border-border/50">
                        <TableCell className="text-sm text-[#222222]">
                          {format(parseISO(shift.date), "EEE d MMM", { locale: fr })}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-[#222222]">
                          {formatTimeNoSeconds(shift.startTime)} – {formatTimeNoSeconds(shift.endTime)}
                        </TableCell>
                        <TableCell className="hidden text-sm text-[#555555] sm:table-cell">
                          {site?.name}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-[#222222]">
                          {formatHoursDisplay(duration)} h
                        </TableCell>
                        <TableCell>
                          {shift.isNight ? (
                            <Badge className="border border-[#B8D4F0] bg-[#E3F0FF] text-[#1A3A8A] hover:bg-[#E3F0FF]">Nuit</Badge>
                          ) : shift.isSunday ? (
                            <Badge className="bg-warning/10 text-warning hover:bg-warning/10">Dim.</Badge>
                          ) : (
                            <Badge className="border border-[#E8E0B8] bg-[#FFF8D6] text-[#222222] hover:bg-[#FFF8D6]">Jour</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
