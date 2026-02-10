"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { checkAgentLimit, getLimitMessage } from "@/lib/plan-limits"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Users, UserPlus, Mail, Shield, Trash2, Crown } from "lucide-react"

interface TeamMember {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'owner' | 'admin' | 'agent'
}

export default function TeamPage() {
  const { user, organization } = useAuth()
  const supabase = createClient()
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  
  // Invite form
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteFirstName, setInviteFirstName] = useState("")
  const [inviteLastName, setInviteLastName] = useState("")
  const [inviteRole, setInviteRole] = useState<'admin' | 'agent'>('admin')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    if (!organization) return

    async function loadTeamMembers() {
      setIsLoading(true)
      try {
        // Load all users in the organization (not just agents)
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('organization_id', organization.id)

        if (profiles) {
          // Get auth users to fetch emails
          const { data: { users } } = await supabase.auth.admin.listUsers()
          
          const members: TeamMember[] = profiles.map(profile => {
            const authUser = users?.find(u => u.id === profile.id)
            return {
              id: profile.id,
              firstName: profile.first_name,
              lastName: profile.last_name,
              email: authUser?.email || '',
              role: profile.role as 'owner' | 'admin' | 'agent',
            }
          })

          setTeamMembers(members)
        }
      } catch (error) {
        console.error('Error loading team:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTeamMembers()
  }, [organization, supabase])

  async function handleInvite() {
    if (!organization || !inviteEmail || !inviteFirstName || !inviteLastName) return

    // Check limits if inviting an agent
    if (inviteRole === 'agent') {
      const limitCheck = await checkAgentLimit(organization)
      if (!limitCheck.allowed) {
        alert(getLimitMessage('agents', limitCheck.limit))
        return
      }
    }

    setInviting(true)
    try {
      // Create auth user
      const tempPassword = Math.random().toString(36).slice(-12)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: inviteEmail,
        password: tempPassword,
        email_confirm: true,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create user')

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          organization_id: organization.id,
          first_name: inviteFirstName,
          last_name: inviteLastName,
          role: inviteRole,
        })

      if (profileError) throw profileError

      // Add to local state
      setTeamMembers(prev => [...prev, {
        id: authData.user.id,
        firstName: inviteFirstName,
        lastName: inviteLastName,
        email: inviteEmail,
        role: inviteRole,
      }])

      // Reset form
      setInviteEmail("")
      setInviteFirstName("")
      setInviteLastName("")
      setInviteRole('admin')
      setShowInviteDialog(false)

      alert('Membre invité avec succès ! Un email avec les instructions de connexion lui a été envoyé.')
    } catch (error: any) {
      console.error('Error inviting member:', error)
      alert(`Erreur: ${error.message}`)
    } finally {
      setInviting(false)
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre de l\'équipe ?')) return

    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      setTeamMembers(prev => prev.filter(m => m.id !== memberId))
    } catch (error: any) {
      console.error('Error removing member:', error)
      alert(`Erreur: ${error.message}`)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge className="bg-purple-500"><Crown className="mr-1 h-3 w-3" />Propriétaire</Badge>
      case 'admin':
        return <Badge className="bg-blue-500"><Shield className="mr-1 h-3 w-3" />Admin</Badge>
      case 'agent':
        return <Badge variant="secondary">Agent</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const isOwner = user?.role === 'owner'
  const canManageTeam = user?.role === 'owner' || user?.role === 'admin'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Chargement de l'équipe...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion de l'équipe</h1>
          <p className="text-muted-foreground">
            Invitez et gérez les membres de votre organisation
          </p>
        </div>
        {canManageTeam && (
          <Button onClick={() => setShowInviteDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Inviter un membre
          </Button>
        )}
      </div>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membres de l'équipe ({teamMembers.length})
          </CardTitle>
          <CardDescription>
            Liste des personnes ayant accès à votre organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {teamMembers.map((member) => {
              const isCurrentUser = member.id === user?.id
              const canRemove = canManageTeam && member.role !== 'owner' && !isCurrentUser

              return (
                <div key={member.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {member.firstName[0]}{member.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {member.firstName} {member.lastName}
                        </span>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-xs">Vous</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(member.role)}
                    {canRemove && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {teamMembers.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aucun membre dans l'équipe
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter un nouveau membre</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau membre à votre organisation. Un email avec les instructions lui sera envoyé.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={inviteFirstName}
                  onChange={(e) => setInviteFirstName(e.target.value)}
                  placeholder="Jean"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={inviteLastName}
                  onChange={(e) => setInviteLastName(e.target.value)}
                  placeholder="Dupont"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="jean.dupont@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rôle *</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'admin' | 'agent')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Les administrateurs peuvent gérer l'équipe et les paramètres. Les agents peuvent uniquement voir leur planning.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail || !inviteFirstName || !inviteLastName}
            >
              {inviting ? 'Invitation...' : 'Inviter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
