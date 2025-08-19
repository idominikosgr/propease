'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import {
  MapPinIcon,
  HomeIcon,
  RulerIcon,
  CalendarIcon,
  CameraIcon,
  ArrowLeftIcon,
  PhoneIcon,
  MailIcon,
  MessageSquareIcon,
  CheckIcon,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'

interface PropertyImage {
  id: number
  url: string
  order_num: number
  description?: string
}

interface PropertyCharacteristic {
  id: number
  title: string
  value: string
  language_id: number
}

interface Property {
  id: number
  code: string
  price: number
  rooms: number
  sqr_meters: number
  area_name: string
  subarea_name: string
  category_name: string
  subcategory_name: string
  energy_class_name: string
  floor: number
  bathrooms: number
  construction_year: number
  title: string
  description: string
  adText: string
  primaryImage: string
  imageCount: number
  partnerName: string
  images: PropertyImage[]
  characteristics: PropertyCharacteristic[]
  update_date: string
  latitude?: number
  longitude?: number
}

interface PropertyResponse {
  success: boolean
  data: Property
}

interface InquiryFormData {
  name: string
  email: string
  phone: string
  message: string
}

export default function PropertyDetailsPage() {
  const params = useParams()
  const propertyId = params.id as string

  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [inquiryForm, setInquiryForm] = useState<InquiryFormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [submittingInquiry, setSubmittingInquiry] = useState(false)
  const [inquirySubmitted, setInquirySubmitted] = useState(false)

  const fetchProperty = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/properties/${propertyId}`)
      const result: PropertyResponse = await response.json()

      if (result.success) {
        setProperty(result.data)
        // Set initial message
        setInquiryForm((prev) => ({
          ...prev,
          message: `Hello! I'm interested in the property "${result.data.title}" (Ref: ${result.data.code}). Could you please provide more information?`,
        }))
      } else {
        toast.error('Property not found')
      }
    } catch (error) {
      console.error('Error fetching property:', error)
      toast.error('Failed to load property details')
    } finally {
      setLoading(false)
    }
  }

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!(inquiryForm.name && inquiryForm.email)) {
      toast.error('Please fill in your name and email')
      return
    }

    try {
      setSubmittingInquiry(true)

      const response = await fetch(`/api/properties/${propertyId}/inquire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inquiryForm),
      })

      const result = await response.json()

      if (result.success) {
        setInquirySubmitted(true)
        toast.success('Your inquiry has been submitted successfully!')
      } else {
        toast.error(result.error || 'Failed to submit inquiry')
      }
    } catch (error) {
      console.error('Error submitting inquiry:', error)
      toast.error('Failed to submit inquiry')
    } finally {
      setSubmittingInquiry(false)
    }
  }

  useEffect(() => {
    if (propertyId) {
      fetchProperty()
    }
  }, [propertyId])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="w-32 h-10 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="w-full h-64 md:h-96 rounded-lg mb-6" />
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-20 w-full mb-6" />
            </div>
            <div>
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <HomeIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Property Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The property you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/properties">
              <Button>
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Properties
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const displayImages = property.images?.length > 0 ? property.images : []

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/properties">
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Properties
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="mb-6">
              {displayImages.length > 0 ? (
                <div>
                  <div className="relative h-64 md:h-96 rounded-lg overflow-hidden bg-muted mb-4">
                    <Image
                      src={displayImages[currentImageIndex]?.url || property.primaryImage}
                      alt={property.title}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                    {displayImages.length > 1 && (
                      <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 text-sm">
                        {currentImageIndex + 1} / {displayImages.length}
                      </div>
                    )}
                  </div>

                  {displayImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {displayImages.map((image, index) => (
                        <button
                          key={image.id}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative shrink-0 w-20 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                            index === currentImageIndex
                              ? 'border-primary'
                              : 'border-transparent hover:border-muted-foreground'
                          }`}
                        >
                          <Image
                            src={image.url}
                            alt={`View ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative h-64 md:h-96 rounded-lg bg-muted flex items-center justify-center">
                  <CameraIcon className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">{property.title}</h1>
                  <div className="flex items-center text-muted-foreground mb-2">
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    {property.subarea_name}, {property.area_name}
                  </div>
                  <div className="text-sm text-muted-foreground">Reference: {property.code}</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {formatPrice(property.price)}
                  </div>
                  <Badge variant="secondary">{property.category_name}</Badge>
                </div>
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <HomeIcon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{property.rooms}</span>
                  <span className="text-muted-foreground">rooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <RulerIcon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{property.sqr_meters}</span>
                  <span className="text-muted-foreground">m²</span>
                </div>
                {property.bathrooms > 0 && (
                  <div className="flex items-center gap-2">
                    <HomeIcon className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">{property.bathrooms}</span>
                    <span className="text-muted-foreground">bathrooms</span>
                  </div>
                )}
                {property.construction_year > 0 && (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">{property.construction_year}</span>
                    <span className="text-muted-foreground">built</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {property.description && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">Description</h2>
                  <div
                    className="prose prose-sm max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{
                      __html: property.description.replace(/\n/g, '<br>'),
                    }}
                  />
                </div>
              )}

              {/* Additional Details */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Property Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span>{property.subcategory_name}</span>
                    </div>
                    {property.floor !== null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Floor:</span>
                        <span>{property.floor}</span>
                      </div>
                    )}
                    {property.energy_class_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Energy Class:</span>
                        <span>{property.energy_class_name}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span>{formatDate(property.update_date)}</span>
                    </div>
                    {property.partnerName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Agent:</span>
                        <span>{property.partnerName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inquiry Form Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareIcon className="w-5 h-5" />
                  Interested in this property?
                </CardTitle>
              </CardHeader>
              <CardContent>
                {inquirySubmitted ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckIcon className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
                    <p className="text-muted-foreground">
                      Your inquiry has been submitted successfully. We'll get back to you soon!
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={inquiryForm.name}
                        onChange={(e) =>
                          setInquiryForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Your full name"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={inquiryForm.email}
                        onChange={(e) =>
                          setInquiryForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="your@email.com"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={inquiryForm.phone}
                        onChange={(e) =>
                          setInquiryForm((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="+30 xxx xxx xxxx"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        value={inquiryForm.message}
                        onChange={(e) =>
                          setInquiryForm((prev) => ({
                            ...prev,
                            message: e.target.value,
                          }))
                        }
                        placeholder="Tell us about your requirements..."
                        rows={4}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={submittingInquiry}>
                      {submittingInquiry ? 'Submitting...' : 'Send Inquiry'}
                    </Button>

                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        By submitting this form, you agree to be contacted about this property.
                      </p>
                    </div>
                  </form>
                )}

                {/* Contact Information */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3">Or contact us directly:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4 text-muted-foreground" />
                      <a href="tel:+302103000356" className="hover:text-primary">
                        +30 210 3000 356
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <MailIcon className="w-4 h-4 text-muted-foreground" />
                      <a href="mailto:info@realtyiq.gr" className="hover:text-primary">
                        info@realtyiq.gr
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
