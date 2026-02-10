"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { AdminPlanning } from "@/components/admin/admin-planning"
import { AdminProfiles } from "@/components/admin/admin-profiles"
import { LayoutGrid, Users } from "lucide-react"

const navItems = [
  { label: "Planificateur", id: "planning", icon: <LayoutGrid className="h-4 w-4" /> },
  { label: "Profils", id: "profiles", icon: <Users className="h-4 w-4" /> },
]

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("planning")

  return (
    <AppShell navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="mx-auto max-w-7xl pb-20 md:pb-0">
        {activeTab === "planning" && <AdminPlanning />}
        {activeTab === "profiles" && <AdminProfiles />}
      </div>
    </AppShell>
  )
}
