'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ScaleIcon,
  XIcon,
  PlusIcon,
  MapPinIcon,
  RulerIcon,
  BedIcon,
  BathIcon,
  CalendarIcon,
  EuroIcon,
  StarIcon,
  ZapIcon,
  CarIcon,
  HomeIcon,
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface Property {
  id: number
  title: string
  price: number
  rooms: number
  sqr_meters: number
  area_name: string
  subarea_name: string
  category_name: string
  subcategory_name: string
  primary_image?: string
  description: string
  status_name: string
  bathrooms?: number
  floor?: number
  construction_year?: number
  energy_class_name?: string
  golden_visa_eligible?: boolean
  parking_spots?: number
  balcony_sqr_meters?: number
  heating_type?: string
  furnished?: boolean
}

interface PropertyComparisonProps {
  children: React.ReactNode
}

export default function PropertyComparison({ children }: PropertyComparisonProps) {
  const [open, setOpen] = useState(false)
  const [comparedProperties, setComparedProperties] = useState<Property[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Property[]>([])
  const [searching, setSearching] = useState(false)

  // Load compared properties from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('comparedProperties')
    if (saved) {
      try {
        setComparedProperties(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading compared properties:', error)
      }
    }
  }, [])

  // Save to localStorage whenever compared properties change
  useEffect(() => {
    localStorage.setItem('comparedProperties', JSON.stringify(comparedProperties))
  }, [comparedProperties])

  const searchProperties = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)
      const response = await fetch(`/api/properties?search=${encodeURIComponent(query)}&limit=10`)
      const result = await response.json()

      if (result.success) {
        // Filter out already compared properties
        const filtered = result.data.filter(
          (prop: Property) => !comparedProperties.some((compared) => compared.id === prop.id)
        )
        setSearchResults(filtered)
      }
    } catch (error) {
      console.error('Error searching properties:', error)
      toast.error('Failed to search properties')
    } finally {
      setSearching(false)
    }
  }

  const addProperty = (property: Property) => {
    if (comparedProperties.length >= 4) {
      toast.error('You can compare up to 4 properties at once')
      return
    }

    if (comparedProperties.some((p) => p.id === property.id)) {
      toast.error('Property already in comparison')
      return
    }

    setComparedProperties((prev) => [...prev, property])
    setSearchResults((prev) => prev.filter((p) => p.id !== property.id))
    toast.success('Property added to comparison')
  }

  const removeProperty = (propertyId: number) => {
    setComparedProperties((prev) => prev.filter((p) => p.id !== propertyId))
    toast.success('Property removed from comparison')
  }

  const clearAll = () => {
    setComparedProperties([])
    setSearchResults([])
    setSearchTerm('')
    toast.success('Comparison cleared')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatPricePerSqm = (price: number, sqm: number) => {
    const pricePerSqm = price / sqm
    return (
      new Intl.NumberFormat('el-GR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(pricePerSqm) + '/m²'
    )
  }

  if (comparedProperties.length === 0) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScaleIcon className="w-5 h-5" />
              Property Comparison
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <ScaleIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Properties to Compare</h3>
            <p className="text-muted-foreground mb-4">
              Add properties from search results to start comparing
            </p>
            <Button onClick={() => setOpen(false)}>Browse Properties</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <ScaleIcon className="w-5 h-5" />
              Compare Properties ({comparedProperties.length}/4)
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Add Property Section */}
        {comparedProperties.length < 4 && (
          <div className="border-b pb-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <PlusIcon className="w-4 h-4" />
              <span className="font-medium">Add Property to Compare</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search properties to add..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  searchProperties(e.target.value)
                }}
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between p-2 border rounded bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{property.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {property.subarea_name}, {property.area_name} •{' '}
                        {formatPrice(property.price)}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => addProperty(property)}>
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <div
            className="grid grid-cols-1 gap-4"
            style={{ minWidth: `${comparedProperties.length * 280}px` }}
          >
            {/* Property Cards */}
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${comparedProperties.length}, 1fr)` }}
            >
              {comparedProperties.map((property) => (
                <Card key={property.id} className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProperty(property.id)}
                    className="absolute top-2 right-2 z-10 h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <XIcon className="w-4 h-4" />
                  </Button>

                  <div className="relative h-48 bg-muted">
                    {property.primary_image ? (
                      <Image
                        src={property.primary_image}
                        alt={property.title}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <HomeIcon className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}

                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <Badge
                        variant="secondary"
                        className="bg-background/80 backdrop-blur-sm text-xs"
                      >
                        {property.category_name}
                      </Badge>
                      {property.golden_visa_eligible && (
                        <Badge
                          variant="default"
                          className="bg-yellow-600/90 backdrop-blur-sm text-xs"
                        >
                          <StarIcon className="w-3 h-3 mr-1" />
                          Golden Visa
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-2">{property.title}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      {property.subarea_name}, {property.area_name}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Price */}
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {formatPrice(property.price)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatPricePerSqm(property.price, property.sqr_meters)}
                      </div>
                    </div>

                    {/* Basic Stats */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <BedIcon className="w-4 h-4 mr-1 text-muted-foreground" />
                        {property.rooms} rooms
                      </div>
                      {property.bathrooms && (
                        <div className="flex items-center">
                          <BathIcon className="w-4 h-4 mr-1 text-muted-foreground" />
                          {property.bathrooms} baths
                        </div>
                      )}
                      <div className="flex items-center col-span-2">
                        <RulerIcon className="w-4 h-4 mr-1 text-muted-foreground" />
                        {property.sqr_meters} m²
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="space-y-2 text-sm">
                      {property.construction_year && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Built:</span>
                          <span>{property.construction_year}</span>
                        </div>
                      )}
                      {property.floor !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Floor:</span>
                          <span>{property.floor === 0 ? 'Ground' : `${property.floor}`}</span>
                        </div>
                      )}
                      {property.energy_class_name && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Energy:</span>
                          <Badge variant="outline" className="text-xs">
                            {property.energy_class_name}
                          </Badge>
                        </div>
                      )}
                      {property.parking_spots && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Parking:</span>
                          <span>{property.parking_spots} spots</span>
                        </div>
                      )}
                      {property.balcony_sqr_meters && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Balcony:</span>
                          <span>{property.balcony_sqr_meters} m²</span>
                        </div>
                      )}
                      {property.furnished !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Furnished:</span>
                          <span>{property.furnished ? 'Yes' : 'No'}</span>
                        </div>
                      )}
                    </div>

                    <Button className="w-full" asChild>
                      <a
                        href={`/properties/${property.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Details
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
