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
import { ChevronLeft, ChevronRight, FileDown, FileSpreadsheet } from "lucide-react"

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

  const [isExporting, setIsExporting] = useState(false)

  function exportCSV() {
    const header = ["Date", "Site", "Horaires", "Durée (h)", "Type"]
    const rows = shifts.map((shift) => {
      const site = sites.find((s) => s.id === shift.siteId)
      const duration = getShiftDurationHours(shift)
      const type = shift.isNight ? "Nuit" : shift.isSunday ? "Dimanche" : "Jour"
      return [
        format(parseISO(shift.date), "dd/MM/yyyy"),
        site?.name ?? "",
        `${formatTimeNoSeconds(shift.startTime)} - ${formatTimeNoSeconds(shift.endTime)}`,
        formatHoursDisplay(duration),
        type,
      ]
    })

    const bom = "\uFEFF"
    const csv = bom + [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(";")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rapport-${format(rangeStart, "yyyy-MM-dd")}_${format(rangeEnd, "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportPDF() {
    setIsExporting(true)
    try {
      const { downloadBoardPdf } = await import("@/components/admin/board-pdf-document")
      await downloadBoardPdf(
        {
          periodLabel: periodLabel,
          orgName: organization?.name ?? "",
          shifts,
          sites,
          totalHours: formatHoursDisplay(stats.totalHours),
          dayHours: formatHoursDisplay(stats.dayHours),
          nightHours: formatHoursDisplay(stats.nightHours),
          formatTimeNoSeconds,
          formatHoursDisplay,
        },
        `rapport-${format(rangeStart, "yyyy-MM-dd")}_${format(rangeEnd, "yyyy-MM-dd")}.pdf`
      )
    } catch (e) {
      console.error("Export PDF failed:", e)
    } finally {
      setIsExporting(false)
    }
  }

  if (!organization) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Tableau de bord</h1>
        {shifts.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF} disabled={isExporting} className="gap-1.5">
              <FileDown className="h-4 w-4" />
              {isExporting ? "Export…" : "PDF"}
            </Button>
          </div>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={agentId || "all"} onValueChange={(v) => setAgentId(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 w-[160px] border-border bg-card text-sm text-foreground">
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
            <SelectTrigger className="h-9 w-[160px] border-border bg-card text-sm text-foreground">
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
            <span className="min-w-[140px] text-center text-sm font-medium capitalize text-foreground">
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
        <div className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-blue-300">Total</p>
          <p className="text-lg font-semibold text-foreground">{formatHoursDisplay(stats.totalHours)} h</p>
        </div>
        <div className="rounded-lg border border-amber-700 bg-amber-500/10 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-amber-300">Jour</p>
          <p className="text-lg font-semibold text-foreground">{formatHoursDisplay(stats.dayHours)} h</p>
        </div>
        <div className="rounded-lg border border-blue-700 bg-blue-500/10 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-blue-300">Nuit</p>
          <p className="text-lg font-semibold text-foreground">{formatHoursDisplay(stats.nightHours)} h</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/50 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Missions</p>
          <p className="text-lg font-semibold text-foreground">{stats.shiftCount}</p>
        </div>
      </div>

      {/* Tableau des missions */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>
          ) : shifts.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Aucune mission sur la période.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="text-xs font-medium text-muted-foreground">Date</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Agent</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Site</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Horaires</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Duree</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift) => {
                  const agent = agents.find((a) => a.id === shift.agentId)
                  const site = sites.find((s) => s.id === shift.siteId)
                  const duration = getShiftDurationHours(shift)
                  return (
                    <TableRow key={shift.id} className="border-b border-border/50">
                      <TableCell className="text-sm text-foreground">
                        {format(parseISO(shift.date), "EEE d MMM", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        {agent ? `${agent.firstName} ${agent.lastName}` : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{site?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        {formatTimeNoSeconds(shift.startTime)} – {formatTimeNoSeconds(shift.endTime)}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        {formatHoursDisplay(duration)} h
                      </TableCell>
                      <TableCell>
                        {shift.isNight ? (
                          <Badge className="border border-blue-700 bg-blue-500/10 text-blue-300 hover:bg-blue-500/15">
                            Nuit
                          </Badge>
                        ) : shift.isSunday ? (
                          <Badge className="bg-warning/10 text-warning hover:bg-warning/10">Dim.</Badge>
                        ) : (
                          <Badge className="border border-amber-700 bg-amber-500/10 text-foreground hover:bg-amber-500/15">
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
