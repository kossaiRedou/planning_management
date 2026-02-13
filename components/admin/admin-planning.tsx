"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { getShiftDurationHours } from "@/lib/shift-utils"
import type { Shift, Site, User } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  eachDayOfInterval,
  isToday,
  parseISO,
} from "date-fns"
import { fr } from "date-fns/locale"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertTriangle,
  Send,
  Check,
} from "lucide-react"

export function AdminPlanning() {
  const { user, organization } = useAuth()
  const supabase = createClient()
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [shifts, setShifts] = useState<Shift[]>([])
  const [agents, setAgents] = useState<User[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [availabilities, setAvailabilities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ agentId: string; date: string } | null>(null)
  const [published, setPublished] = useState(false)

  // New shift form state
  const [newShiftSite, setNewShiftSite] = useState("")
  const [newShiftStart, setNewShiftStart] = useState("08:00")
  const [newShiftEnd, setNewShiftEnd] = useState("20:00")
  const [newShiftNotes, setNewShiftNotes] = useState("")

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Load data from Supabase
  useEffect(() => {
    if (!organization) return

    async function loadData() {
      if (!organization) return
      const orgId = organization.id
      
      setIsLoading(true)
      try {
        // Load agents
        const { data: agentsData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('organization_id', orgId)
          .eq('role', 'agent')

        if (agentsData) {
          setAgents((agentsData as any[]).map(profile => ({
            id: profile.id,
            organization_id: profile.organization_id,
            email: '', // Email not in profile table
            firstName: profile.first_name,
            lastName: profile.last_name,
            role: 'agent' as const,
            phone: profile.phone || undefined,
            certifications: profile.certifications || undefined,
          })))
        }

        // Load sites
        const { data: sitesData } = await supabase
          .from('sites')
          .select('*')
          .eq('organization_id', orgId)

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

        // Load shifts for the week
        const weekStartStr = format(weekStart, 'yyyy-MM-dd')
        const weekEndStr = format(weekEnd, 'yyyy-MM-dd')

        const { data: shiftsData } = await supabase
          .from('shifts')
          .select('*')
          .eq('organization_id', orgId)
          .gte('date', weekStartStr)
          .lte('date', weekEndStr)

        if (shiftsData) {
          setShifts((shiftsData as any[]).map(shift => ({
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

        // Load availabilities
        const { data: availData } = await supabase
          .from('availabilities')
          .select('*')
          .eq('organization_id', orgId)
          .gte('date', weekStartStr)
          .lte('date', weekEndStr)

        if (availData) {
          setAvailabilities(availData as any[])
        }

      } catch (error) {
        console.error('Error loading planning data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [organization, currentDate])

  const getShiftsForCell = useCallback(
    (agentId: string, date: string) => {
      return shifts.filter((s) => s.agentId === agentId && s.date === date)
    },
    [shifts]
  )

  const isAgentUnavailable = useCallback((agentId: string, date: string) => {
    const avail = availabilities.find(
      (a) => a.agent_id === agentId && a.date === date
    )
    return avail?.available === false
  }, [availabilities])

  function handleCellClick(agentId: string, date: string) {
    setSelectedCell({ agentId, date })
    setNewShiftSite(sites[0]?.id || "")
    setNewShiftStart("08:00")
    setNewShiftEnd("20:00")
    setNewShiftNotes("")
    setShowAddDialog(true)
  }

  async function handleAddShift() {
    if (!selectedCell || !newShiftSite || !organization) return

    const orgId = organization.id
    const startH = parseInt(newShiftStart.split(":")[0])
    const isNight = startH >= 20 || startH < 6
    const date = parseISO(selectedCell.date)
    const isSun = date.getDay() === 0

    try {
      const { data, error } = await (supabase
        .from('shifts') as any)
        .insert({
          organization_id: orgId,
          agent_id: selectedCell.agentId,
          site_id: newShiftSite,
          date: selectedCell.date,
          start_time: newShiftStart,
          end_time: newShiftEnd,
          notes: newShiftNotes || null,
          is_night: isNight,
          is_sunday: isSun,
          status: 'scheduled',
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        const newShift: Shift = {
          id: data.id,
          organization_id: data.organization_id,
          agentId: data.agent_id,
          siteId: data.site_id,
          date: data.date,
          startTime: data.start_time,
          endTime: data.end_time,
          notes: data.notes || undefined,
          isNight: data.is_night,
          isSunday: data.is_sunday,
          status: data.status,
        }
        setShifts((prev) => [...prev, newShift])
      }

      setShowAddDialog(false)
      setSelectedCell(null)
    } catch (error) {
      console.error('Error adding shift:', error)
    }
  }

  async function removeShift(shiftId: string) {
    try {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftId)

      if (error) throw error

      setShifts((prev) => prev.filter((s) => s.id !== shiftId))
    } catch (error) {
      console.error('Error removing shift:', error)
    }
  }

  function handlePublish() {
    setPublished(true)
    setTimeout(() => setPublished(false), 3000)
  }

  // Count total hours per agent for this week
  const agentWeekHours = useMemo(() => {
    const map: Record<string, number> = {}
    agents.forEach((agent) => {
      let total = 0
      weekDays.forEach((day) => {
        const dateStr = format(day, "yyyy-MM-dd")
        const cellShifts = getShiftsForCell(agent.id, dateStr)
        cellShifts.forEach((s) => {
          total += getShiftDurationHours(s)
        })
      })
      map[agent.id] = total
    })
    return map
  }, [agents, weekDays, getShiftsForCell])

  // Count total hours per day (column totals)
  const dayTotalHours = useMemo(() => {
    const map: Record<string, number> = {}
    weekDays.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd")
      let total = 0
      agents.forEach((agent) => {
        const cellShifts = getShiftsForCell(agent.id, dateStr)
        cellShifts.forEach((s) => {
          total += getShiftDurationHours(s)
        })
      })
      map[dateStr] = total
    })
    return map
  }, [agents, weekDays, getShiftsForCell])

  // Calculate grand total (all hours in the week)
  const grandTotal = useMemo(() => {
    return Object.values(agentWeekHours).reduce((sum, hours) => sum + hours, 0)
  }, [agentWeekHours])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Chargement du planning...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planificateur</h1>
          <p className="text-sm text-muted-foreground">
            Assignez les missions aux agents
          </p>
        </div>
        <Button
          onClick={handlePublish}
          className="gap-2"
          disabled={published}
        >
          {published ? (
            <>
              <Check className="h-4 w-4" />
              Planning publie
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Publier le planning
            </>
          )}
        </Button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setCurrentDate((d) => addWeeks(d, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-56 text-center text-sm font-semibold text-foreground">
          Semaine du {format(weekStart, "d MMM", { locale: fr })} au{" "}
          {format(weekEnd, "d MMM yyyy", { locale: fr })}
        </span>
        <Button variant="outline" size="icon" onClick={() => setCurrentDate((d) => addWeeks(d, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Planning Grid */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-[800px]">
              {/* Header row */}
              <div className="grid grid-cols-[200px_repeat(7,1fr)_120px] border-b border-border">
                <div className="flex items-center border-r border-border px-4 py-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Agent
                  </span>
                </div>
                {weekDays.map((day) => {
                  const today = isToday(day)
                  return (
                    <div
                      key={day.toISOString()}
                      className={`flex flex-col items-center border-r border-border px-2 py-3 ${
                        today ? "bg-primary/5" : ""
                      }`}
                    >
                      <span className="text-xs font-medium text-muted-foreground capitalize">
                        {format(day, "EEE", { locale: fr })}
                      </span>
                      <span className={`text-sm font-bold ${today ? "text-primary" : "text-foreground"}`}>
                        {format(day, "d MMM", { locale: fr })}
                      </span>
                    </div>
                  )
                })}
                <div className="flex items-center justify-center bg-primary/10 px-4 py-3">
                  <span className="text-xs font-semibold text-primary uppercase">
                    Total
                  </span>
                </div>
              </div>

              {/* Agent rows */}
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="grid grid-cols-[200px_repeat(7,1fr)_120px] border-b border-border last:border-b-0"
                >
                  <div className="flex items-center gap-2 border-r border-border px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {agent.firstName} {agent.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {agentWeekHours[agent.id] || 0}h / semaine
                      </span>
                    </div>
                  </div>
                  {weekDays.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd")
                    const cellShifts = getShiftsForCell(agent.id, dateStr)
                    const unavailable = isAgentUnavailable(agent.id, dateStr)
                    const today = isToday(day)

                    return (
                      <div
                        key={dateStr}
                        className={`group relative flex min-h-[72px] flex-col gap-1 border-r border-border p-1.5 ${
                          today ? "bg-primary/5" : ""
                        } ${unavailable ? "bg-destructive/5" : ""}`}
                      >
                        {unavailable && (
                          <div className="absolute right-1 top-1">
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                          </div>
                        )}
                        {cellShifts.map((shift) => {
                          const site = sites.find((s) => s.id === shift.siteId)
                          return (
                            <button
                              key={shift.id}
                              type="button"
                              onClick={() => removeShift(shift.id)}
                              className={`rounded px-1.5 py-0.5 text-left text-xs transition-colors hover:opacity-80 ${
                                shift.isNight
                                  ? "bg-indigo-500/15 text-indigo-700"
                                  : "bg-accent/15 text-accent-foreground"
                              }`}
                              title={`Cliquer pour supprimer - ${site?.name}`}
                            >
                              <div className="font-medium">
                                {shift.startTime}-{shift.endTime}
                              </div>
                              <div className="truncate opacity-70">
                                {site?.name}
                              </div>
                            </button>
                          )
                        })}
                        <button
                          type="button"
                          onClick={() => handleCellClick(agent.id, dateStr)}
                          className="flex h-6 items-center justify-center rounded border border-dashed border-border text-muted-foreground opacity-0 transition-opacity hover:border-primary hover:text-primary group-hover:opacity-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                  {/* Total column for this agent */}
                  <div className="flex items-center justify-center bg-primary/5 px-4 py-3">
                    <span className="text-base font-bold text-primary">
                      {agentWeekHours[agent.id] || 0}h
                    </span>
                  </div>
                </div>
              ))}

              {/* Totals row (by day) */}
              <div className="grid grid-cols-[200px_repeat(7,1fr)_120px] border-t-2 border-primary/20 bg-primary/5">
                <div className="flex items-center border-r border-border px-4 py-3">
                  <span className="text-sm font-bold text-primary uppercase">
                    Total par jour
                  </span>
                </div>
                {weekDays.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd")
                  const totalHours = dayTotalHours[dateStr] || 0
                  const today = isToday(day)

                  return (
                    <div
                      key={dateStr}
                      className={`flex items-center justify-center border-r border-border px-2 py-3 ${
                        today ? "bg-primary/10" : ""
                      }`}
                    >
                      <span className="text-base font-bold text-primary">
                        {totalHours}h
                      </span>
                    </div>
                  )
                })}
                {/* Grand total */}
                <div className="flex items-center justify-center bg-primary/10 px-4 py-3">
                  <span className="text-lg font-extrabold text-primary">
                    {grandTotal}h
                  </span>
                </div>
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-accent/15" />
          <span>Mission de jour</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-indigo-500/15" />
          <span>Mission de nuit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 text-destructive" />
          <span>Agent indisponible</span>
        </div>
      </div>

      {/* Add Shift Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une mission</DialogTitle>
          </DialogHeader>
          {selectedCell && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {agents.find((a) => a.id === selectedCell.agentId)?.firstName}{" "}
                  {agents.find((a) => a.id === selectedCell.agentId)?.lastName}
                </span>
                <span>-</span>
                <span className="capitalize">
                  {format(parseISO(selectedCell.date), "EEEE d MMMM", { locale: fr })}
                </span>
              </div>

              {isAgentUnavailable(selectedCell.agentId, selectedCell.date) && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Attention : cet agent est marque comme indisponible ce jour.
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label>Site</Label>
                <Select value={newShiftSite} onValueChange={setNewShiftSite}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Heure de debut</Label>
                  <Input
                    type="time"
                    value={newShiftStart}
                    onChange={(e) => setNewShiftStart(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Heure de fin</Label>
                  <Input
                    type="time"
                    value={newShiftEnd}
                    onChange={(e) => setNewShiftEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Consignes (optionnel)</Label>
                <Textarea
                  value={newShiftNotes}
                  onChange={(e) => setNewShiftNotes(e.target.value)}
                  placeholder="Instructions particulieres..."
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddShift}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
