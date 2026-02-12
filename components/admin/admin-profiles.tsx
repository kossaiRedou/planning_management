"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { checkAgentLimit, checkSiteLimit, getLimitMessage } from "@/lib/plan-limits"
import type { User, Site } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Building2,
  UserPlus,
  Pencil,
  Trash2,
} from "lucide-react"

export function AdminProfiles() {
  const { organization } = useAuth()
  const supabase = createClient()
  
  const [agents, setAgents] = useState<User[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddAgent, setShowAddAgent] = useState(false)
  const [showAddSite, setShowAddSite] = useState(false)

  // Agent form
  const [agentForm, setAgentForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    certifications: "",
  })

  // Site form
  const [siteForm, setSiteForm] = useState({
    name: "",
    address: "",
    contactName: "",
    contactPhone: "",
  })

  // Load data from Supabase
  useEffect(() => {
    if (!organization) return

    async function loadData() {
      setIsLoading(true)
      try {
        // Get current session token
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          console.error('No session found')
          setIsLoading(false)
          return
        }

        // Load agents from API route (server-side to access emails)
        const response = await fetch('/api/get-users', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (response.ok) {
          const { profiles } = await response.json()
          
          const agentsWithEmails = profiles
            .filter((p: any) => p.role === 'agent')
            .map((profile: any) => ({
              id: profile.id,
              organization_id: profile.organization_id,
              email: profile.email || '',
              firstName: profile.first_name,
              lastName: profile.last_name,
              role: 'agent' as const,
              phone: profile.phone || undefined,
              certifications: profile.certifications || undefined,
            }))
          
          setAgents(agentsWithEmails)
        } else {
          console.error('Failed to load agents')
        }

        // Load sites
        const { data: sitesData, error: sitesError } = await supabase
          .from('sites')
          .select('*')
          .eq('organization_id', organization.id)

        if (!sitesError && sitesData) {
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
        console.error('Error loading profiles:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [organization, supabase])

  const filteredAgents = agents.filter((a) => {
    const q = searchQuery.toLowerCase()
    return (
      a.firstName.toLowerCase().includes(q) ||
      a.lastName.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    )
  })

  const filteredSites = sites.filter((s) => {
    const q = searchQuery.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
  })

  async function handleAddAgent() {
    if (!organization) return

    // Check agent limit
    const limitCheck = await checkAgentLimit(organization)
    if (!limitCheck.allowed) {
      alert(getLimitMessage('agents', limitCheck.limit))
      return
    }

    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Call API route to create user (server-side)
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: agentForm.email,
          firstName: agentForm.firstName,
          lastName: agentForm.lastName,
          role: 'agent',
          organizationId: organization.id,
        }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user')
      }

      // Update phone and certifications if provided
      if (agentForm.phone || agentForm.certifications) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            phone: agentForm.phone || null,
            certifications: agentForm.certifications
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean),
          })
          .eq('id', result.userId)

        if (updateError) console.error('Error updating profile details:', updateError)
      }

      const newAgent: User = {
        id: result.userId,
        organization_id: organization.id,
        email: agentForm.email,
        firstName: agentForm.firstName,
        lastName: agentForm.lastName,
        role: "agent",
        phone: agentForm.phone || undefined,
        certifications: agentForm.certifications
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      }
      
      setAgents((prev) => [...prev, newAgent])
      setShowAddAgent(false)
      setAgentForm({ firstName: "", lastName: "", email: "", phone: "", certifications: "" })
      alert('Agent ajouté avec succès ! Un email avec les instructions de connexion a été envoyé.')
    } catch (error: any) {
      console.error('Error adding agent:', error)
      alert(`Erreur: ${error.message}`)
    }
  }

  async function handleAddSite() {
    if (!organization) return

    // Check site limit
    const limitCheck = await checkSiteLimit(organization)
    if (!limitCheck.allowed) {
      alert(getLimitMessage('sites', limitCheck.limit))
      return
    }

    try {
      const { data, error } = await supabase
        .from('sites')
        .insert({
          organization_id: organization.id,
          name: siteForm.name,
          address: siteForm.address,
          contact_name: siteForm.contactName || null,
          contact_phone: siteForm.contactPhone || null,
        })
        .select()
        .single()

      if (error) throw error

      const newSite: Site = {
        id: data.id,
        organization_id: data.organization_id,
        name: data.name,
        address: data.address,
        contactName: data.contact_name || undefined,
        contactPhone: data.contact_phone || undefined,
      }
      
      setSites((prev) => [...prev, newSite])
      setShowAddSite(false)
      setSiteForm({ name: "", address: "", contactName: "", contactPhone: "" })
    } catch (error: any) {
      console.error('Error adding site:', error)
      alert(`Erreur: ${error.message}`)
    }
  }

  async function removeAgent(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet agent ?')) return

    try {
      // Delete user profile (cascade will handle auth user)
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', id)

      if (error) throw error

      setAgents((prev) => prev.filter((a) => a.id !== id))
    } catch (error: any) {
      console.error('Error removing agent:', error)
      alert(`Erreur: ${error.message}`)
    }
  }

  async function removeSite(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce site ?')) return

    try {
      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSites((prev) => prev.filter((s) => s.id !== id))
    } catch (error: any) {
      console.error('Error removing site:', error)
      alert(`Erreur: ${error.message}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Chargement des profils...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestion des Profils</h1>
        <p className="text-sm text-muted-foreground">
          Gerez vos agents et vos sites clients
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un agent ou un site..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="agents">
        <TabsList>
          <TabsTrigger value="agents" className="gap-2">
            Agents ({agents.length})
          </TabsTrigger>
          <TabsTrigger value="sites" className="gap-2">
            Sites ({sites.length})
          </TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents" className="mt-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowAddAgent(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Ajouter un agent
              </Button>
            </div>

            {/* Agent Cards - mobile friendly */}
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredAgents.map((agent) => (
                <Card key={agent.id} className="group relative">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-sm text-primary-foreground">
                          {agent.firstName[0]}
                          {agent.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-foreground">
                            {agent.firstName} {agent.lastName}
                          </h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                            onClick={() => removeAgent(agent.id)}
                            aria-label={`Supprimer ${agent.firstName} ${agent.lastName}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="mt-1 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {agent.email}
                          </div>
                          {agent.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {agent.phone}
                            </div>
                          )}
                        </div>
                        {agent.certifications && agent.certifications.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {agent.certifications.map((cert) => (
                              <Badge key={cert} variant="secondary" className="text-xs">
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredAgents.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucun agent trouve.
              </p>
            )}
          </div>
        </TabsContent>

        {/* Sites Tab */}
        <TabsContent value="sites" className="mt-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowAddSite(true)} className="gap-2">
                <Building2 className="h-4 w-4" />
                Ajouter un site
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {filteredSites.map((site) => (
                <Card key={site.id} className="group relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{site.name}</h3>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {site.address}
                          </div>
                          {site.contactName && (
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {site.contactName} - {site.contactPhone}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        onClick={() => removeSite(site.id)}
                        aria-label={`Supprimer ${site.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredSites.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucun site trouve.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Agent Dialog */}
      <Dialog open={showAddAgent} onOpenChange={setShowAddAgent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un agent</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Prenom</Label>
                <Input
                  value={agentForm.firstName}
                  onChange={(e) => setAgentForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder="Jean"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Nom</Label>
                <Input
                  value={agentForm.lastName}
                  onChange={(e) => setAgentForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="Dupont"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={agentForm.email}
                onChange={(e) => setAgentForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="jean.dupont@secu-planning.fr"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Telephone</Label>
              <Input
                value={agentForm.phone}
                onChange={(e) => setAgentForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="06 12 34 56 78"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Certifications (separees par des virgules)</Label>
              <Input
                value={agentForm.certifications}
                onChange={(e) => setAgentForm((f) => ({ ...f, certifications: e.target.value }))}
                placeholder="SSIAP 1, CQP APS, SST"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAgent(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddAgent} disabled={!agentForm.firstName || !agentForm.lastName || !agentForm.email}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Site Dialog */}
      <Dialog open={showAddSite} onOpenChange={setShowAddSite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un site</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Nom du site</Label>
              <Input
                value={siteForm.name}
                onChange={(e) => setSiteForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Centre Commercial X"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Adresse</Label>
              <Input
                value={siteForm.address}
                onChange={(e) => setSiteForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="12 Rue de la Paix, 75000 Paris"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Nom du contact</Label>
                <Input
                  value={siteForm.contactName}
                  onChange={(e) => setSiteForm((f) => ({ ...f, contactName: e.target.value }))}
                  placeholder="Paul Martin"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Telephone contact</Label>
                <Input
                  value={siteForm.contactPhone}
                  onChange={(e) => setSiteForm((f) => ({ ...f, contactPhone: e.target.value }))}
                  placeholder="01 23 45 67 89"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSite(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddSite} disabled={!siteForm.name || !siteForm.address}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
