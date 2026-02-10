"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { AgentPlanning } from "@/components/agent/agent-planning"
import { AgentHours } from "@/components/agent/agent-hours"
import { AgentAvailability } from "@/components/agent/agent-availability"
import { CalendarDays, Clock, CalendarCheck } from "lucide-react"

const navItems = [
  { label: "Planning", id: "planning", icon: <CalendarDays className="h-4 w-4" /> },
  { label: "Heures", id: "hours", icon: <Clock className="h-4 w-4" /> },
  { label: "Disponibilites", id: "availability", icon: <CalendarCheck className="h-4 w-4" /> },
]

export function AgentDashboard() {
  const [activeTab, setActiveTab] = useState("planning")

  return (
    <AppShell navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="mx-auto max-w-4xl pb-20 md:pb-0">
        {activeTab === "planning" && <AgentPlanning />}
        {activeTab === "hours" && <AgentHours />}
        {activeTab === "availability" && <AgentAvailability />}
      </div>
    </AppShell>
  )
}
