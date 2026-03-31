"use client"

import { useState, useMemo, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { getShiftDurationHours, formatTimeNoSeconds, formatHoursDisplay } from "@/lib/shift-utils"
import type { Shift, Site, User } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addWeeks,
  addMonths,
  subMonths,
} from "date-fns"
import { fr } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"

type PeriodType = "week" | "month"

export function AdminBoard() {
  const { organization } = useAuth()
  const supabase = createClient()

  const [period, setPeriod] = useState<PeriodType>("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [agentId, setAgentId] = useState<string>("")
  const [siteId, setSiteId] = useState<string>("")
  const [agents, setAgents] = useState<User[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const rangeStart = period === "month" ? startOfMonth(currentDate) : startOfWeek(currentDate, { weekStartsOn: 1 })
  const rangeEnd = period === "month" ? endOfMonth(currentDate) : endOfWeek(currentDate, { weekStartsOn: 1 })
  const rangeStartStr = format(rangeStart, "yyyy-MM-dd")
  const rangeEndStr = format(rangeEnd, "yyyy-MM-dd")

  useEffect(() => {
    if (!organization) return
    let cancelled = false
    const orgId = organization.id

    async function loadRefs() {
      try {
        const [agentsRes, sitesRes] = await Promise.all([
          supabase.from("user_profiles").select("*").eq("organization_id", orgId).eq("role", "agent"),
          supabase.from("sites").select("*").eq("organization_id", orgId),
        ])
        if (cancelled) return
        if (agentsRes.data) {
          setAgents(
            (agentsRes.data as any[]).map((p) => ({
              id: p.id,
              organization_id: p.organization_id,
              email: "",
              firstName: p.first_name,
              lastName: p.last_name,
              role: "agent" as const,
              phone: p.phone ?? undefined,
              certifications: p.certifications ?? undefined,
            }))
          )
        }
        if (sitesRes.data) {
          setSites(
            (sitesRes.data as any[]).map((s) => ({
              id: s.id,
              organization_id: s.organization_id,
              name: s.name,
              address: s.address,
              contactName: s.contact_name ?? undefined,
              contactPhone: s.contact_phone ?? undefined,
            }))
          )
        }
      } catch {
        // silently ignore if component unmounted
      }
    }
    loadRefs()
    return () => { cancelled = true }
  }, [organization, supabase])

  useEffect(() => {
    if (!organization) return
    let cancelled = false
    const orgId = organization.id

    async function loadShifts() {
      setIsLoading(true)
      try {
        let q = supabase
          .from("shifts")
          .select("*")
          .eq("organization_id", orgId)
          .gte("date", rangeStartStr)
          .lte("date", rangeEndStr)
          .order("date", { ascending: true })

        if (agentId) q = q.eq("agent_id", agentId)
        if (siteId) q = q.eq("site_id", siteId)

        const { data } = await q
        if (cancelled) return
        if (data) {
          setShifts(
            (data as any[]).map((s) => ({
              id: s.id,
              organization_id: s.organization_id,
              agentId: s.agent_id,
              siteId: s.site_id,
              date: s.date,
              startTime: s.start_time,
              endTime: s.end_time,
              notes: s.notes ?? undefined,
              isNight: s.is_night,
              isSunday: s.is_sunday,
              status: s.status,
            }))
          )
        } else {
          setShifts([])
        }
      } catch {
        if (!cancelled) setShifts([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadShifts()
    return () => { cancelled = true }
  }, [organization, rangeStartStr, rangeEndStr, agentId, siteId, supabase])

  const stats = useMemo(() => {
    let totalHours = 0
    let dayHours = 0
    let nightHours = 0
    shifts.forEach((s) => {
      const h = getShiftDurationHours(s)
      totalHours += h
      if (s.isNight) nightHours += h
      else dayHours += h
    })
    return { totalHours, dayHours, nightHours, shiftCount: shifts.length }
  }, [shifts])

  function navigatePeriod(delta: number) {
    if (period === "month") {
      setCurrentDate((d) => (delta > 0 ? addMonths(d, 1) : subMonths(d, 1)))
    } else {
      setCurrentDate((d) => addWeeks(d, delta))
    }
  }

  const periodLabel =
    period === "month"
      ? format(rangeStart, "MMMM yyyy", { locale: fr })
      : `Sem. du ${format(rangeStart, "d MMM", { locale: fr })}`

  if (!organization) return null

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-[#222222]">Tableau de bord</h1>

      {/* Filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={agentId || "all"} onValueChange={(v) => setAgentId(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 w-[160px] border-[#E5E5E5] bg-white text-sm text-[#222222]">
              <SelectValue placeholder="Agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les agents</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.firstName} {a.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={siteId || "all"} onValueChange={(v) => setSiteId(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 w-[160px] border-[#E5E5E5] bg-white text-sm text-[#222222]">
              <SelectValue placeholder="Site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les sites</SelectItem>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
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
      </div>

      {/* Totaux - 2 décimales, un peu colorés */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-[#E0ECFF] bg-[#F2F7FF] px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#1A3A8A]">Total</p>
          <p className="text-lg font-semibold text-[#222222]">{formatHoursDisplay(stats.totalHours)} h</p>
        </div>
        <div className="rounded-lg border border-[#E8E0B8] bg-[#FFF8D6] px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#8B6914]">Jour</p>
          <p className="text-lg font-semibold text-[#222222]">{formatHoursDisplay(stats.dayHours)} h</p>
        </div>
        <div className="rounded-lg border border-[#B8D4F0] bg-[#E3F0FF] px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#1A3A8A]">Nuit</p>
          <p className="text-lg font-semibold text-[#222222]">{formatHoursDisplay(stats.nightHours)} h</p>
        </div>
        <div className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#555555]">Missions</p>
          <p className="text-lg font-semibold text-[#222222]">{stats.shiftCount}</p>
        </div>
      </div>

      {/* Tableau des missions */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-[#555555]">Chargement…</p>
          ) : shifts.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#555555]">Aucune mission sur la période.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="text-xs font-medium text-[#555555]">Date</TableHead>
                  <TableHead className="text-xs font-medium text-[#555555]">Agent</TableHead>
                  <TableHead className="text-xs font-medium text-[#555555]">Site</TableHead>
                  <TableHead className="text-xs font-medium text-[#555555]">Horaires</TableHead>
                  <TableHead className="text-xs font-medium text-[#555555]">Duree</TableHead>
                  <TableHead className="text-xs font-medium text-[#555555]">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift) => {
                  const agent = agents.find((a) => a.id === shift.agentId)
                  const site = sites.find((s) => s.id === shift.siteId)
                  const duration = getShiftDurationHours(shift)
                  return (
                    <TableRow key={shift.id} className="border-b border-border/50">
                      <TableCell className="text-sm text-[#222222]">
                        {format(parseISO(shift.date), "EEE d MMM", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-[#222222]">
                        {agent ? `${agent.firstName} ${agent.lastName}` : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-[#555555]">{site?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm font-medium text-[#222222]">
                        {formatTimeNoSeconds(shift.startTime)} – {formatTimeNoSeconds(shift.endTime)}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-[#222222]">
                        {formatHoursDisplay(duration)} h
                      </TableCell>
                      <TableCell>
                        {shift.isNight ? (
                          <Badge className="border border-[#B8D4F0] bg-[#E3F0FF] text-[#1A3A8A] hover:bg-[#E3F0FF]">
                            Nuit
                          </Badge>
                        ) : shift.isSunday ? (
                          <Badge className="bg-warning/10 text-warning hover:bg-warning/10">Dim.</Badge>
                        ) : (
                          <Badge className="border border-[#E8E0B8] bg-[#FFF8D6] text-[#222222] hover:bg-[#FFF8D6]">
                            Jour
                          </Badge>
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
  )
}
