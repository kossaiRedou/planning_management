"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { AdminPlanning } from "@/components/admin/admin-planning"
import { AdminProfiles } from "@/components/admin/admin-profiles"
import { AdminBoard } from "@/components/admin/admin-board"
import { LayoutGrid, Users, BarChart3 } from "lucide-react"

const navItems = [
  { label: "Tableau de bord", id: "board", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Planificateur", id: "planning", icon: <LayoutGrid className="h-4 w-4" /> },
  { label: "Profils", id: "profiles", icon: <Users className="h-4 w-4" /> },
]

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("board")

  return (
    <AppShell navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="mx-auto w-full max-w-4xl px-3 py-4 pb-20 md:pb-6">
        {activeTab === "board" && <AdminBoard />}
        {activeTab === "planning" && <AdminPlanning />}
        {activeTab === "profiles" && <AdminProfiles />}
      </div>
    </AppShell>
  )
}
