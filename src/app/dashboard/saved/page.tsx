'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  HeartIcon,
  BellIcon,
  SearchIcon,
  TrashIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  EditIcon,
  FilterIcon,
  StarIcon,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface SavedSearch {
  id: string
  name: string
  filters: any
  results_count: number
  created_at: string
}

interface PropertyAlert {
  id: string
  name: string
  filters: any
  email_notifications: boolean
  frequency: string
  active: boolean
  created_at: string
  last_notification: string | null
}

interface UserPreferences {
  language: string
  email_notifications: boolean
  sms_notifications: boolean
  currency: string
}

export default function SavedPage() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [alerts, setAlerts] = useState<PropertyAlert[]>([])
  const [preferences, setPreferences] = useState<UserPreferences>({
    language: 'en',
    email_notifications: true,
    sms_notifications: false,
    currency: 'EUR',
  })
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newAlert, setNewAlert] = useState({
    name: '',
    filters: {},
    frequency: 'daily',
    emailNotifications: true,
  })

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/preferences')
      const result = await response.json()

      if (result.success) {
        setSavedSearches(result.data.savedSearches)
        setAlerts(result.data.alerts)
        setPreferences(result.data.preferences)
      } else {
        toast.error('Failed to load saved data')
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const deleteSavedSearch = async (id: string) => {
    try {
      const response = await fetch(`/api/user/preferences?type=saved_search&id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSavedSearches((prev) => prev.filter((search) => search.id !== id))
        toast.success('Saved search deleted')
      } else {
        toast.error('Failed to delete saved search')
      }
    } catch (error) {
      console.error('Error deleting saved search:', error)
      toast.error('Failed to delete saved search')
    }
  }

  const toggleAlert = async (alertId: string, active: boolean) => {
    try {
      const response = await fetch(`/api/user/preferences?type=alert&id=${alertId}`, {
        method: active ? 'POST' : 'DELETE',
      })

      if (response.ok) {
        setAlerts((prev) =>
          prev.map((alert) => (alert.id === alertId ? { ...alert, active } : alert))
        )
        toast.success(`Alert ${active ? 'activated' : 'deactivated'}`)
      } else {
        toast.error('Failed to update alert')
      }
    } catch (error) {
      console.error('Error updating alert:', error)
      toast.error('Failed to update alert')
    }
  }

  const createAlert = async () => {
    try {
      setCreating(true)
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'create_alert',
          data: newAlert,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setAlerts((prev) => [...prev, result.data])
        setNewAlert({
          name: '',
          filters: {},
          frequency: 'daily',
          emailNotifications: true,
        })
        toast.success('Alert created successfully')
      } else {
        toast.error('Failed to create alert')
      }
    } catch (error) {
      console.error('Error creating alert:', error)
      toast.error('Failed to create alert')
    } finally {
      setCreating(false)
    }
  }

  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'update_preferences',
          data: { ...preferences, ...newPrefs },
        }),
      })

      if (response.ok) {
        setPreferences((prev) => ({ ...prev, ...newPrefs }))
        toast.success('Preferences updated')
      } else {
        toast.error('Failed to update preferences')
      }
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error('Failed to update preferences')
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB')
  }

  const getFilterSummary = (filters: any) => {
    const parts = []
    if (filters.minPrice) parts.push(`€${filters.minPrice}+`)
    if (filters.maxPrice) parts.push(`€${filters.maxPrice}-`)
    if (filters.minRooms) parts.push(`${filters.minRooms}+ rooms`)
    if (filters.area) parts.push(filters.area)
    if (filters.goldenVisaOnly) parts.push('Golden Visa')
    return parts.join(', ') || 'All properties'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Saved Searches & Alerts</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Saved Searches & Alerts</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Property Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="alert-name">Alert Name</Label>
                <Input
                  id="alert-name"
                  value={newAlert.name}
                  onChange={(e) => setNewAlert((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Golden Visa Properties in Athens"
                />
              </div>
              <div>
                <Label htmlFor="frequency">Notification Frequency</Label>
                <Select
                  value={newAlert.frequency}
                  onValueChange={(value) => setNewAlert((prev) => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="email-notifications"
                  checked={newAlert.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNewAlert((prev) => ({ ...prev, emailNotifications: checked }))
                  }
                />
                <Label htmlFor="email-notifications">Email notifications</Label>
              </div>
              <Button onClick={createAlert} disabled={creating || !newAlert.name}>
                {creating ? 'Creating...' : 'Create Alert'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="searches" className="space-y-6">
        <TabsList>
          <TabsTrigger value="searches" className="flex items-center gap-2">
            <HeartIcon className="w-4 h-4" />
            Saved Searches ({savedSearches.length})
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <BellIcon className="w-4 h-4" />
            Property Alerts ({alerts.filter((a) => a.active).length})
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <EditIcon className="w-4 h-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="searches">
          {savedSearches.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Saved Searches</h3>
                <p className="text-muted-foreground mb-4">
                  Save your property searches to quickly access them later
                </p>
                <Link href="/properties">
                  <Button>
                    <SearchIcon className="w-4 h-4 mr-2" />
                    Start Searching
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedSearches.map((search) => (
                <Card key={search.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{search.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSavedSearch(search.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        <FilterIcon className="w-4 h-4 inline mr-1" />
                        {getFilterSummary(search.filters)}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{search.results_count} results</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(search.created_at)}
                        </span>
                      </div>
                      <Link
                        href={`/properties?${new URLSearchParams(search.filters).toString()}`}
                        className="block"
                      >
                        <Button className="w-full">
                          <SearchIcon className="w-4 h-4 mr-2" />
                          View Results
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alerts">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BellIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Property Alerts</h3>
                <p className="text-muted-foreground mb-4">
                  Create alerts to get notified when new properties match your criteria
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Create Your First Alert
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Property Alert</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="alert-name">Alert Name</Label>
                        <Input
                          id="alert-name"
                          value={newAlert.name}
                          onChange={(e) =>
                            setNewAlert((prev) => ({ ...prev, name: e.target.value }))
                          }
                          placeholder="e.g., Golden Visa Properties in Athens"
                        />
                      </div>
                      <div>
                        <Label htmlFor="frequency">Notification Frequency</Label>
                        <Select
                          value={newAlert.frequency}
                          onValueChange={(value) =>
                            setNewAlert((prev) => ({ ...prev, frequency: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">Immediate</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={createAlert} disabled={creating || !newAlert.name}>
                        {creating ? 'Creating...' : 'Create Alert'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {alerts.map((alert) => (
                <Card key={alert.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{alert.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAlert(alert.id, !alert.active)}
                        >
                          {alert.active ? (
                            <PauseIcon className="w-4 h-4" />
                          ) : (
                            <PlayIcon className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAlert(alert.id, false)}
                          className="text-destructive hover:text-destructive"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={alert.active ? 'default' : 'secondary'}>
                          {alert.active ? 'Active' : 'Paused'}
                        </Badge>
                        <Badge variant="outline">{alert.frequency}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <FilterIcon className="w-4 h-4 inline mr-1" />
                        {getFilterSummary(alert.filters)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Created: {formatDate(alert.created_at)}
                        {alert.last_notification && (
                          <div>Last notification: {formatDate(alert.last_notification)}</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="preferences">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <Switch
                    id="email-notifications"
                    checked={preferences.email_notifications}
                    onCheckedChange={(checked) =>
                      updatePreferences({ email_notifications: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-notifications">SMS Notifications</Label>
                  <Switch
                    id="sms-notifications"
                    checked={preferences.sms_notifications}
                    onCheckedChange={(checked) => updatePreferences({ sms_notifications: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Display Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) => updatePreferences({ language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                      <SelectItem value="el">🇬🇷 Ελληνικά</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={preferences.currency}
                    onValueChange={(value) => updatePreferences({ currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">€ Euro (EUR)</SelectItem>
                      <SelectItem value="USD">$ US Dollar (USD)</SelectItem>
                      <SelectItem value="GBP">£ British Pound (GBP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
