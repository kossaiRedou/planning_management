"use client"

import { useState, useMemo, useCallback } from "react"
import {
  demoUsers,
  demoSites,
  demoShifts,
  demoAvailabilities,
  getShiftDurationHours,
} from "@/lib/demo-data"
import type { Shift } from "@/lib/types"
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
  const [currentDate, setCurrentDate] = useState(new Date())
  const [shifts, setShifts] = useState<Shift[]>(demoShifts)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ agentId: string; date: string } | null>(null)
  const [published, setPublished] = useState(false)

  // New shift form state
  const [newShiftSite, setNewShiftSite] = useState("")
  const [newShiftStart, setNewShiftStart] = useState("08:00")
  const [newShiftEnd, setNewShiftEnd] = useState("20:00")
  const [newShiftNotes, setNewShiftNotes] = useState("")

  const agents = demoUsers.filter((u) => u.role === "agent")

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const getShiftsForCell = useCallback(
    (agentId: string, date: string) => {
      return shifts.filter((s) => s.agentId === agentId && s.date === date)
    },
    [shifts]
  )

  const isAgentUnavailable = useCallback((agentId: string, date: string) => {
    const avail = demoAvailabilities.find(
      (a) => a.agentId === agentId && a.date === date
    )
    return avail?.available === false
  }, [])

  function handleCellClick(agentId: string, date: string) {
    setSelectedCell({ agentId, date })
    setNewShiftSite(demoSites[0].id)
    setNewShiftStart("08:00")
    setNewShiftEnd("20:00")
    setNewShiftNotes("")
    setShowAddDialog(true)
  }

  function handleAddShift() {
    if (!selectedCell || !newShiftSite) return

    const startH = parseInt(newShiftStart.split(":")[0])
    const isNight = startH >= 20 || startH < 6
    const date = parseISO(selectedCell.date)
    const isSun = date.getDay() === 0

    const newShift: Shift = {
      id: `shift-new-${Date.now()}`,
      agentId: selectedCell.agentId,
      siteId: newShiftSite,
      date: selectedCell.date,
      startTime: newShiftStart,
      endTime: newShiftEnd,
      notes: newShiftNotes || undefined,
      isNight,
      isSunday: isSun,
    }

    setShifts((prev) => [...prev, newShift])
    setShowAddDialog(false)
    setSelectedCell(null)
  }

  function removeShift(shiftId: string) {
    setShifts((prev) => prev.filter((s) => s.id !== shiftId))
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
              <div className="grid grid-cols-[200px_repeat(7,1fr)] border-b border-border">
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
                      className={`flex flex-col items-center border-r border-border px-2 py-3 last:border-r-0 ${
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
              </div>

              {/* Agent rows */}
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="grid grid-cols-[200px_repeat(7,1fr)] border-b border-border last:border-b-0"
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
                        className={`group relative flex min-h-[72px] flex-col gap-1 border-r border-border p-1.5 last:border-r-0 ${
                          today ? "bg-primary/5" : ""
                        } ${unavailable ? "bg-destructive/5" : ""}`}
                      >
                        {unavailable && (
                          <div className="absolute right-1 top-1">
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                          </div>
                        )}
                        {cellShifts.map((shift) => {
                          const site = demoSites.find((s) => s.id === shift.siteId)
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
                </div>
              ))}
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
                    {demoSites.map((site) => (
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
