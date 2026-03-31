"use client"

import { type ReactNode, useState, useCallback, useMemo } from "react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, KeyRound, Eye, EyeOff, Loader2 } from "lucide-react"

interface NavItem {
  label: string
  id: string
  icon: ReactNode
}

interface AppShellProps {
  children: ReactNode
  navItems: NavItem[]
  activeTab: string
  onTabChange: (tab: string) => void
}

export function AppShell({ children, navItems, activeTab, onTabChange }: AppShellProps) {
  const { user, organization, logout } = useAuth()
  const supabase = useMemo(() => createClient(), [])

  const [pwOpen, setPwOpen] = useState(false)
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [pwError, setPwError] = useState("")
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const resetPwForm = useCallback(() => {
    setCurrentPw("")
    setNewPw("")
    setConfirmPw("")
    setPwError("")
    setPwSuccess(false)
    setShowCurrent(false)
    setShowNew(false)
  }, [])

  const handleChangePassword = useCallback(async () => {
    setPwError("")
    if (!newPw || !confirmPw || !currentPw) {
      setPwError("Tous les champs sont obligatoires.")
      return
    }
    if (newPw.length < 8) {
      setPwError("Le nouveau mot de passe doit contenir au moins 8 caractères.")
      return
    }
    if (newPw !== confirmPw) {
      setPwError("Les mots de passe ne correspondent pas.")
      return
    }
    setPwLoading(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email ?? "",
        password: currentPw,
      })
      if (signInError) {
        setPwError("Mot de passe actuel incorrect.")
        setPwLoading(false)
        return
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPw })
      if (updateError) {
        setPwError(updateError.message)
        setPwLoading(false)
        return
      }
      setPwSuccess(true)
      setTimeout(() => {
        setPwOpen(false)
        resetPwForm()
      }, 1500)
    } catch {
      setPwError("Une erreur est survenue. Réessayez.")
    } finally {
      setPwLoading(false)
    }
  }, [supabase, user?.email, currentPw, newPw, confirmPw, resetPwForm])

  const handleLogout = async () => {
    await logout()
  }

  if (!user) return null

  const initials = `${user.firstName[0]}${user.lastName[0]}`

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-4 lg:px-6">
          {/* Left: Organisation branding */}
          <div className="flex items-center gap-2.5">
            {organization?.logo_url ? (
              <Image
                src={organization.logo_url}
                alt={organization.name}
                width={32}
                height={32}
                className="h-8 w-auto max-w-[120px] rounded object-contain"
              />
            ) : organization ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                {organization.name.slice(0, 2).toUpperCase()}
              </div>
            ) : null}
            {organization && (
              <span className="text-sm font-semibold text-foreground">
                {organization.name}
              </span>
            )}
          </div>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onTabChange(item.id)}
                className="gap-2"
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Right: Powered by ShiftMe (desktop only) */}
            <div className="hidden items-center gap-1.5 md:flex">
              <Image src="/logowithoutBG.png" alt="ShiftMe" width={16} height={16} className="opacity-60" />
              <span className="text-xs text-muted-foreground">Powered by ShiftMe</span>
            </div>

            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm md:inline">
                  {user.firstName} {user.lastName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-foreground">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                {user.role === "admin" ? "Administrateur" : "Agent"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setPwOpen(true); resetPwForm() }} className="gap-2">
                <KeyRound className="h-4 w-4" />
                Modifier le mot de passe
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive">
                <LogOut className="h-4 w-4" />
                Deconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Password Change Dialog */}
      <Dialog open={pwOpen} onOpenChange={(open) => { setPwOpen(open); if (!open) resetPwForm() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le mot de passe</DialogTitle>
            <DialogDescription>
              Saisissez votre mot de passe actuel puis choisissez un nouveau mot de passe (8 caractères minimum).
            </DialogDescription>
          </DialogHeader>

          {pwSuccess ? (
            <div className="flex flex-col items-center gap-2 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15">
                <KeyRound className="h-6 w-6 text-green-400" />
              </div>
              <p className="text-sm font-medium text-green-400">Mot de passe modifié avec succès</p>
            </div>
          ) : (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="current-pw">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="current-pw"
                    type={showCurrent ? "text" : "password"}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-pw">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="new-pw"
                    type={showNew ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="8 caractères minimum"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-pw">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="confirm-pw"
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={(e) => { if (e.key === "Enter") handleChangePassword() }}
                />
              </div>
              {pwError && <p className="text-sm text-destructive">{pwError}</p>}
            </div>
          )}

          {!pwSuccess && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setPwOpen(false)} disabled={pwLoading}>
                Annuler
              </Button>
              <Button onClick={handleChangePassword} disabled={pwLoading}>
                {pwLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {pwLoading ? "Modification…" : "Confirmer"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 lg:px-6">{children}</main>

      {/* Mobile Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:hidden"
        aria-label="Navigation mobile"
      >
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors ${
                activeTab === item.id
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
