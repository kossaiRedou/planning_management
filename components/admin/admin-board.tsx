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
    <div className="flex flex-col gap-5">
      {/* Header card */}
      <Card className="border-border/60">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Tableau de bord</h1>
            <p className="text-xs text-muted-foreground">Vue d'ensemble de l'activité</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
              <button
                type="button"
                onClick={() => setPeriod("week")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === "week" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semaine
              </button>
              <button
                type="button"
                onClick={() => setPeriod("month")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === "month" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mois
              </button>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigatePeriod(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[130px] text-center text-xs font-medium capitalize text-foreground">
                {periodLabel}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigatePeriod(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {shifts.length > 0 && (
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={exportCSV} className="h-8 gap-1.5 text-xs">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportPDF} disabled={isExporting} className="h-8 gap-1.5 text-xs">
                  <FileDown className="h-3.5 w-3.5" />
                  {isExporting ? "…" : "PDF"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filtres card */}
      <Card className="border-border/60">
        <CardContent className="flex flex-wrap items-center gap-2 p-3">
          <Select value={agentId || "all"} onValueChange={(v) => setAgentId(v === "all" ? "" : v)}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
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
            <SelectTrigger className="h-8 w-[150px] text-xs">
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
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-primary">Total</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{formatHoursDisplay(stats.totalHours)}<span className="ml-0.5 text-sm font-normal text-muted-foreground">h</span></p>
          </CardContent>
        </Card>
        <Card className="border-amber-800/30 bg-amber-500/5">
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-amber-400">Jour</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{formatHoursDisplay(stats.dayHours)}<span className="ml-0.5 text-sm font-normal text-muted-foreground">h</span></p>
          </CardContent>
        </Card>
        <Card className="border-blue-800/30 bg-blue-500/5">
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-blue-400">Nuit</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{formatHoursDisplay(stats.nightHours)}<span className="ml-0.5 text-sm font-normal text-muted-foreground">h</span></p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Missions</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{stats.shiftCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des missions */}
      <Card className="overflow-hidden border-border/60">
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
