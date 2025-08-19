'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { HeartIcon, BellIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@clerk/nextjs'

interface SaveSearchDialogProps {
  filters: any
  resultsCount: number
  children: React.ReactNode
}

export default function SaveSearchDialog({
  filters,
  resultsCount,
  children,
}: SaveSearchDialogProps) {
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [createAlert, setCreateAlert] = useState(false)
  const [alertFrequency, setAlertFrequency] = useState('daily')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save searches')
      return
    }

    if (!searchName.trim()) {
      toast.error('Please enter a name for your search')
      return
    }

    try {
      setSaving(true)

      // Save the search
      const searchResponse = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'save_search',
          data: {
            name: searchName,
            filters,
            resultsCount,
          },
        }),
      })

      if (!searchResponse.ok) {
        throw new Error('Failed to save search')
      }

      // Create alert if requested
      if (createAlert) {
        const alertResponse = await fetch('/api/user/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'create_alert',
            data: {
              name: `${searchName} Alert`,
              filters,
              frequency: alertFrequency,
              emailNotifications: true,
            },
          }),
        })

        if (!alertResponse.ok) {
          throw new Error('Failed to create alert')
        }
      }

      toast.success(createAlert ? 'Search saved and alert created!' : 'Search saved successfully!')
      setOpen(false)
      setSearchName('')
      setCreateAlert(false)
      setAlertFrequency('daily')
    } catch (error) {
      console.error('Error saving search:', error)
      toast.error('Failed to save search')
    } finally {
      setSaving(false)
    }
  }

  const getFilterSummary = () => {
    const parts = []
    if (filters.searchTerm) parts.push(`"${filters.searchTerm}"`)
    if (filters.minPrice) parts.push(`€${filters.minPrice}+`)
    if (filters.maxPrice) parts.push(`€${filters.maxPrice}-`)
    if (filters.minRooms) parts.push(`${filters.minRooms}+ rooms`)
    if (filters.category && filters.category !== 'all') parts.push(filters.category)
    if (filters.areaId && filters.areaId !== 'all') parts.push(filters.areaId)
    if (filters.goldenVisaOnly) parts.push('Golden Visa')
    return parts.length > 0 ? parts.join(', ') : 'All properties'
  }

  if (!user) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HeartIcon className="w-5 h-5" />
            Save Search
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium mb-1">Current Search:</p>
            <p className="text-sm text-muted-foreground">{getFilterSummary()}</p>
            <p className="text-xs text-muted-foreground mt-1">{resultsCount} properties found</p>
          </div>

          <div>
            <Label htmlFor="search-name">Search Name</Label>
            <Input
              id="search-name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="e.g., Athens Golden Visa Properties"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch id="create-alert" checked={createAlert} onCheckedChange={setCreateAlert} />
              <Label htmlFor="create-alert" className="flex items-center gap-2">
                <BellIcon className="w-4 h-4" />
                Also create property alert
              </Label>
            </div>

            {createAlert && (
              <div>
                <Label htmlFor="alert-frequency">Alert Frequency</Label>
                <Select value={alertFrequency} onValueChange={setAlertFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Get notified when new properties match your criteria
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving || !searchName.trim()} className="flex-1">
              {saving ? 'Saving...' : 'Save Search'}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
