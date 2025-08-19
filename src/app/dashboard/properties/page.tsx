'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Building,
  Search,
  Filter,
  Eye,
  ToggleLeft,
  ToggleRight,
  MapPin,
  Euro,
  Home,
  Calendar,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

interface Property {
  id: string
  ilist_id: number
  title?: string
  price: number
  sqr_meters?: number
  rooms?: number
  bathrooms?: number
  area_id?: number
  subarea_id?: number
  status_id: number
  building_year?: number
  energy_class_id?: number
  latitude?: number
  longitude?: number
  postal_code?: string
  update_date: string
  last_ilist_sync?: string
  primary_image?: string
  partner_name?: string
  custom_code?: string
}

interface PropertyFilters {
  search: string
  minPrice: string
  maxPrice: string
  minRooms: string
  maxRooms: string
  minSqrMeters: string
  maxSqrMeters: string
  areaIds: string
  statusFilter: string
  limit: number
  offset: number
}

export default function PropertiesPage() {
  const { user } = useUser()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [filters, setFilters] = useState<PropertyFilters>({
    search: '',
    minPrice: '',
    maxPrice: '',
    minRooms: '',
    maxRooms: '',
    minSqrMeters: '',
    maxSqrMeters: '',
    areaIds: '',
    statusFilter: 'all',
    limit: 20,
    offset: 0,
  })

  // Check user role
  const userRole = user?.publicMetadata?.role as string
  const isAgent = userRole === 'agent' || userRole === 'admin'

  // Fetch properties with filters
  const fetchProperties = async (newFilters = filters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      // Add filters to params
      if (newFilters.search) params.append('search', newFilters.search)
      if (newFilters.minPrice) params.append('minPrice', newFilters.minPrice)
      if (newFilters.maxPrice) params.append('maxPrice', newFilters.maxPrice)
      if (newFilters.minRooms) params.append('minRooms', newFilters.minRooms)
      if (newFilters.maxRooms) params.append('maxRooms', newFilters.maxRooms)
      if (newFilters.minSqrMeters) params.append('minSqrMeters', newFilters.minSqrMeters)
      if (newFilters.maxSqrMeters) params.append('maxSqrMeters', newFilters.maxSqrMeters)
      if (newFilters.areaIds) params.append('areaIds', newFilters.areaIds)
      params.append('limit', newFilters.limit.toString())
      params.append('offset', newFilters.offset.toString())

      // Use direct table access for admin/agent to see all properties
      if (isAgent) {
        params.append('source', 'direct')
      }

      const response = await fetch(`/api/properties?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        // Filter by status if needed (since API might return all)
        let filteredProperties = data.data || []
        if (newFilters.statusFilter === 'active') {
          filteredProperties = filteredProperties.filter((p: Property) => p.status_id === 1)
        } else if (newFilters.statusFilter === 'inactive') {
          filteredProperties = filteredProperties.filter((p: Property) => p.status_id !== 1)
        }

        setProperties(filteredProperties)
        setTotal(data.total || filteredProperties.length)
      } else {
        toast.error('Failed to fetch properties')
        console.error('Properties fetch error:', data.error)
      }
    } catch (error) {
      toast.error('Failed to fetch properties')
      console.error('Properties fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Toggle property status
  const togglePropertyStatus = async (property: Property) => {
    const newStatus = property.status_id === 1 ? 2 : 1

    try {
      const response = await fetch(`/api/properties/${property.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status_id: newStatus,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Property ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`)
        // Refresh properties list
        fetchProperties()
      } else {
        toast.error('Failed to update property status')
      }
    } catch (error) {
      toast.error('Failed to update property status')
      console.error('Status update error:', error)
    }
  }

  // Apply filters
  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, offset: 0 }))
    fetchProperties({ ...filters, offset: 0 })
  }

  // Clear filters
  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      minPrice: '',
      maxPrice: '',
      minRooms: '',
      maxRooms: '',
      minSqrMeters: '',
      maxSqrMeters: '',
      areaIds: '',
      statusFilter: 'all',
      limit: 20,
      offset: 0,
    }
    setFilters(clearedFilters)
    fetchProperties(clearedFilters)
  }

  // Pagination
  const handlePagination = (direction: 'prev' | 'next') => {
    const newOffset =
      direction === 'prev'
        ? Math.max(0, filters.offset - filters.limit)
        : filters.offset + filters.limit

    const newFilters = { ...filters, offset: newOffset }
    setFilters(newFilters)
    fetchProperties(newFilters)
  }

  useEffect(() => {
    fetchProperties()
  }, [user])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getStatusBadge = (statusId: number) => {
    return statusId === 1 ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Properties Management</h1>
          <p className="text-muted-foreground">
            Manage and search through {total.toLocaleString()} properties
          </p>
        </div>
        <Button onClick={() => fetchProperties()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Search & Filters
          </CardTitle>
          <CardDescription>
            Use the powerful search capabilities to find specific properties
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Status */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search properties by title, code, or description..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select
              value={filters.statusFilter}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, statusFilter: value }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Min Price (€)</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Max Price (€)</label>
              <Input
                type="number"
                placeholder="1000000"
                value={filters.maxPrice}
                onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Min Rooms</label>
              <Input
                type="number"
                placeholder="1"
                value={filters.minRooms}
                onChange={(e) => setFilters((prev) => ({ ...prev, minRooms: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Max Rooms</label>
              <Input
                type="number"
                placeholder="10"
                value={filters.maxRooms}
                onChange={(e) => setFilters((prev) => ({ ...prev, maxRooms: e.target.value }))}
              />
            </div>
          </div>

          {/* Size Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Min Size (m²)</label>
              <Input
                type="number"
                placeholder="20"
                value={filters.minSqrMeters}
                onChange={(e) => setFilters((prev) => ({ ...prev, minSqrMeters: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Max Size (m²)</label>
              <Input
                type="number"
                placeholder="500"
                value={filters.maxSqrMeters}
                onChange={(e) => setFilters((prev) => ({ ...prev, maxSqrMeters: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Area IDs (comma separated)</label>
              <Input
                placeholder="2011, 2208, 2501"
                value={filters.areaIds}
                onChange={(e) => setFilters((prev) => ({ ...prev, areaIds: e.target.value }))}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search Properties
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle>Properties ({total.toLocaleString()})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading properties...
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No properties found matching your criteria
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {property.custom_code || `Property ${property.ilist_id}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ID: {property.ilist_id} • Area: {property.area_id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Euro className="h-4 w-4 text-green-600" />
                          {formatPrice(property.price)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {property.sqr_meters && (
                            <span className="flex items-center gap-1">
                              <Home className="h-3 w-3" />
                              {property.sqr_meters}m²
                            </span>
                          )}
                          {property.rooms && <span>🛏️ {property.rooms}</span>}
                          {property.bathrooms && <span>🚿 {property.bathrooms}</span>}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(property.status_id)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(property.update_date).toLocaleDateString()}</p>
                          {property.last_ilist_sync && (
                            <p className="text-muted-foreground">
                              Sync: {new Date(property.last_ilist_sync).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedProperty(property)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Property Details</DialogTitle>
                                <DialogDescription>
                                  Detailed information for property {selectedProperty?.ilist_id}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedProperty && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold">Basic Info</h4>
                                      <div className="space-y-2 text-sm">
                                        <p>iList ID: {selectedProperty.ilist_id}</p>
                                        <p>Price: {formatPrice(selectedProperty.price)}</p>
                                        <p>Size: {selectedProperty.sqr_meters}m²</p>
                                        <p>Rooms: {selectedProperty.rooms}</p>
                                        <p>Bathrooms: {selectedProperty.bathrooms}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">Location & Details</h4>
                                      <div className="space-y-2 text-sm">
                                        <p>Area ID: {selectedProperty.area_id}</p>
                                        <p>Subarea ID: {selectedProperty.subarea_id}</p>
                                        <p>Postal Code: {selectedProperty.postal_code}</p>
                                        <p>Building Year: {selectedProperty.building_year}</p>
                                        <p>Energy Class: {selectedProperty.energy_class_id}</p>
                                      </div>
                                    </div>
                                  </div>
                                  {selectedProperty.latitude && selectedProperty.longitude && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Location</h4>
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-red-500" />
                                        <span className="text-sm">
                                          {selectedProperty.latitude}, {selectedProperty.longitude}
                                        </span>
                                        <Button size="sm" variant="outline" asChild>
                                          <a
                                            href={`https://maps.google.com/?q=${selectedProperty.latitude},${selectedProperty.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            <ExternalLink className="h-3 w-3 mr-1" />
                                            View on Maps
                                          </a>
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {isAgent && (
                            <Button
                              size="sm"
                              variant={property.status_id === 1 ? 'destructive' : 'default'}
                              onClick={() => togglePropertyStatus(property)}
                            >
                              {property.status_id === 1 ? (
                                <ToggleRight className="h-4 w-4" />
                              ) : (
                                <ToggleLeft className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filters.offset + 1} to {Math.min(filters.offset + filters.limit, total)}{' '}
                  of {total} properties
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePagination('prev')}
                    disabled={filters.offset === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePagination('next')}
                    disabled={filters.offset + filters.limit >= total}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
