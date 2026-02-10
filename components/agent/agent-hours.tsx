"use client"

import { useState, useMemo, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { getShiftDurationHours } from "@/lib/demo-data"
import type { Site, Shift } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths, addMonths } from "date-fns"
import { fr } from "date-fns/locale"
import { Clock, Sun, Moon, ChevronLeft, ChevronRight, Download } from "lucide-react"

export function AgentHours() {
  const { user } = useAuth()
  const supabase = createClient()
  
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [myShifts, setMyShifts] = useState<Shift[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load shifts from Supabase
  useEffect(() => {
    if (!user) return

    async function loadShifts() {
      setIsLoading(true)
      try {
        const start = startOfMonth(currentMonth)
        const end = endOfMonth(currentMonth)

        // Load shifts
        const { data: shiftsData } = await supabase
          .from('shifts')
          .select('*')
          .eq('agent_id', user.id)
          .gte('date', format(start, 'yyyy-MM-dd'))
          .lte('date', format(end, 'yyyy-MM-dd'))
          .order('date', { ascending: true })

        if (shiftsData) {
          setMyShifts(shiftsData.map(shift => ({
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
          .eq('organization_id', user.organization_id)

        if (sitesData) {
          setSites(sitesData.map(site => ({
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
  }, [user, currentMonth, supabase])

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
        duration.toString(),
        type,
      ]
    })
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `heures_${format(currentMonth, "yyyy-MM")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Chargement des heures...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Compteur d{"'"}Heures</h1>
        <p className="text-sm text-muted-foreground">
          Suivi detaille de vos heures travaillees
        </p>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth((d) => subMonths(d, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold text-foreground capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: fr })}
        </span>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth((d) => addMonths(d, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{stats.totalHours}</span>
            <span className="text-xs text-muted-foreground">Heures totales</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <Sun className="h-5 w-5 text-warning" />
            <span className="text-2xl font-bold text-foreground">{stats.dayHours}</span>
            <span className="text-xs text-muted-foreground">Heures de jour</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <Moon className="h-5 w-5 text-indigo-500" />
            <span className="text-2xl font-bold text-foreground">{stats.nightHours}</span>
            <span className="text-xs text-muted-foreground">Heures de nuit</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <span className="text-lg font-bold text-primary">{stats.shiftCount}</span>
            <span className="text-xs text-muted-foreground">Missions</span>
          </CardContent>
        </Card>
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Shifts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail des missions</CardTitle>
        </CardHeader>
        <CardContent>
          {myShifts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune mission ce mois-ci.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Horaires</TableHead>
                    <TableHead className="hidden sm:table-cell">Site</TableHead>
                    <TableHead>Duree</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myShifts.map((shift) => {
                    const site = sites.find((s) => s.id === shift.siteId)
                    const duration = getShiftDurationHours(shift)
                    return (
                      <TableRow key={shift.id}>
                        <TableCell className="text-sm font-medium capitalize">
                          {format(parseISO(shift.date), "EEE d MMM", { locale: fr })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {shift.startTime} - {shift.endTime}
                        </TableCell>
                        <TableCell className="hidden text-sm sm:table-cell">
                          {site?.name}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{duration}h</TableCell>
                        <TableCell>
                          {shift.isNight ? (
                            <Badge className="bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/10">Nuit</Badge>
                          ) : shift.isSunday ? (
                            <Badge className="bg-warning/10 text-warning hover:bg-warning/10">Dim.</Badge>
                          ) : (
                            <Badge variant="secondary">Jour</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
