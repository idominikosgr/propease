'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  StarIcon,
  EuroIcon,
  CalculatorIcon,
  CheckIcon,
  ClockIcon,
  UsersIcon,
  MapPinIcon,
  TrendingUpIcon,
  ShieldIcon,
  HomeIcon,
  FileTextIcon,
  InfoIcon,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import LeadGenerationForm from '@/components/lead-generation-form'

interface GoldenVisaCalculation {
  investmentAmount: number
  propertyType: 'residential' | 'commercial' | 'mixed'
  rentalYield: number
  annualRental: number
  managementFees: number
  taxes: number
  netAnnualReturn: number
  roiPercentage: number
  breakEvenYears: number
}

const PROPERTY_TYPES = [
  { value: 'residential', label: 'Residential', yield: 4.5 },
  { value: 'commercial', label: 'Commercial', yield: 6.0 },
  { value: 'mixed', label: 'Mixed Use', yield: 5.2 },
]

const GOLDEN_VISA_BENEFITS = [
  {
    icon: MapPinIcon,
    title: 'EU Travel Freedom',
    description: 'Visa-free travel to all 27 EU countries and Schengen area',
  },
  {
    icon: HomeIcon,
    title: 'Permanent Residency',
    description: 'Renewable 5-year residency permits for you and your family',
  },
  {
    icon: TrendingUpIcon,
    title: 'Investment Returns',
    description: 'Generate rental income from your Greek property investment',
  },
  {
    icon: ShieldIcon,
    title: 'EU Security',
    description: 'Access to EU healthcare, education, and social systems',
  },
  {
    icon: UsersIcon,
    title: 'Family Inclusion',
    description: 'Include spouse, children under 21, and parents in application',
  },
  {
    icon: ClockIcon,
    title: 'Fast Processing',
    description: 'Application processed in 40-60 days with proper documentation',
  },
]

const PROCESS_STEPS = [
  {
    step: 1,
    title: 'Property Selection',
    description: 'Choose qualifying property worth minimum €250,000',
    duration: '1-2 weeks',
  },
  {
    step: 2,
    title: 'Legal Documentation',
    description: 'Prepare all required documents and legal paperwork',
    duration: '2-3 weeks',
  },
  {
    step: 3,
    title: 'Property Purchase',
    description: 'Complete property transaction with legal representation',
    duration: '1-2 weeks',
  },
  {
    step: 4,
    title: 'Visa Application',
    description: 'Submit Golden Visa application with all documentation',
    duration: '1 week',
  },
  {
    step: 5,
    title: 'Approval & Collection',
    description: 'Receive approval and collect residency permits',
    duration: '6-8 weeks',
  },
]

export default function GoldenVisaPage() {
  const [calculation, setCalculation] = useState<GoldenVisaCalculation>({
    investmentAmount: 250000,
    propertyType: 'residential',
    rentalYield: 4.5,
    annualRental: 0,
    managementFees: 0,
    taxes: 0,
    netAnnualReturn: 0,
    roiPercentage: 0,
    breakEvenYears: 0,
  })

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    nationality: '',
    investmentBudget: '',
    message: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const calculateReturns = () => {
    const { investmentAmount, rentalYield } = calculation
    const annualRental = (investmentAmount * rentalYield) / 100
    const managementFees = annualRental * 0.1 // 10% management fees
    const taxes = annualRental * 0.15 // 15% taxes (simplified)
    const netAnnualReturn = annualRental - managementFees - taxes
    const roiPercentage = (netAnnualReturn / investmentAmount) * 100
    const breakEvenYears = investmentAmount / netAnnualReturn

    setCalculation((prev) => ({
      ...prev,
      annualRental,
      managementFees,
      taxes,
      netAnnualReturn,
      roiPercentage,
      breakEvenYears,
    }))
  }

  useEffect(() => {
    calculateReturns()
  }, [calculation.investmentAmount, calculation.rentalYield])

  const handlePropertyTypeChange = (type: 'residential' | 'commercial' | 'mixed') => {
    const selectedType = PROPERTY_TYPES.find((t) => t.value === type)
    setCalculation((prev) => ({
      ...prev,
      propertyType: type,
      rentalYield: selectedType?.yield || 4.5,
    }))
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Here you would send the contact form data to your API
      console.log('Golden Visa inquiry:', contactForm)
      // Reset form after successful submission
      setContactForm({
        name: '',
        email: '',
        phone: '',
        nationality: '',
        investmentBudget: '',
        message: '',
      })
      alert("Thank you for your inquiry! We'll contact you within 24 hours.")
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('There was an error submitting your inquiry. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <StarIcon className="w-8 h-8 text-yellow-600" />
            <Badge variant="default" className="bg-yellow-600 text-yellow-50 px-3 py-1">
              Golden Visa Program
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Greek Golden Visa</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
            Secure EU residency through strategic real estate investment in Greece. From €250,000
            investment, gain permanent residency for your entire family.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Badge variant="outline" className="px-3 py-1">
              <ClockIcon className="w-4 h-4 mr-1" />
              40-60 Day Processing
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <UsersIcon className="w-4 h-4 mr-1" />
              Entire Family Included
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <MapPinIcon className="w-4 h-4 mr-1" />
              EU Travel Freedom
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="calculator" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calculator">Investment Calculator</TabsTrigger>
            <TabsTrigger value="benefits">Benefits</TabsTrigger>
            <TabsTrigger value="process">Process</TabsTrigger>
            <TabsTrigger value="contact">Get Started</TabsTrigger>
          </TabsList>

          {/* Investment Calculator Tab */}
          <TabsContent value="calculator" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Calculator Inputs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalculatorIcon className="w-5 h-5" />
                    Investment Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="investment">Investment Amount (€)</Label>
                    <Input
                      id="investment"
                      type="number"
                      min="250000"
                      step="10000"
                      value={calculation.investmentAmount}
                      onChange={(e) =>
                        setCalculation((prev) => ({
                          ...prev,
                          investmentAmount: Number(e.target.value),
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum €250,000 required for Golden Visa eligibility
                    </p>
                  </div>

                  <div>
                    <Label>Property Type</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {PROPERTY_TYPES.map((type) => (
                        <Button
                          key={type.value}
                          variant={calculation.propertyType === type.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() =>
                            handlePropertyTypeChange(
                              type.value as 'residential' | 'commercial' | 'mixed'
                            )
                          }
                        >
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="yield">Expected Rental Yield (%)</Label>
                    <Input
                      id="yield"
                      type="number"
                      min="0"
                      max="15"
                      step="0.1"
                      value={calculation.rentalYield}
                      onChange={(e) =>
                        setCalculation((prev) => ({
                          ...prev,
                          rentalYield: Number(e.target.value),
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Average yields: Residential 3-5%, Commercial 5-7%
                    </p>
                  </div>

                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertDescription>
                      Calculations are estimates based on current market conditions. Actual returns
                      may vary based on location, property condition, and market factors.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Calculator Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Investment Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(calculation.annualRental)}
                      </div>
                      <div className="text-sm text-muted-foreground">Annual Rental Income</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(calculation.netAnnualReturn)}
                      </div>
                      <div className="text-sm text-muted-foreground">Net Annual Return</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gross Rental Income:</span>
                      <span className="font-medium">
                        {formatCurrency(calculation.annualRental)}
                      </span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Management Fees (10%):</span>
                      <span>-{formatCurrency(calculation.managementFees)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Taxes & Expenses (15%):</span>
                      <span>-{formatCurrency(calculation.taxes)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Net Annual Return:</span>
                      <span className="text-green-600">
                        {formatCurrency(calculation.netAnnualReturn)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">
                        {calculation.roiPercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Annual ROI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-600">
                        {calculation.breakEvenYears.toFixed(1)} years
                      </div>
                      <div className="text-sm text-muted-foreground">Break-even</div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Link href="/properties?goldenVisa=true">
                      <Button className="w-full">
                        <StarIcon className="w-4 h-4 mr-2" />
                        View Golden Visa Properties
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Benefits Tab */}
          <TabsContent value="benefits">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {GOLDEN_VISA_BENEFITS.map((benefit, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <benefit.icon className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-12">
              <h2 className="text-2xl font-bold text-center mb-8">Eligibility Requirements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">✅ Required</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckIcon className="w-4 h-4 text-green-600" />
                      <span>Non-EU citizen, 18+ years old</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckIcon className="w-4 h-4 text-green-600" />
                      <span>Property investment of €250,000+</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckIcon className="w-4 h-4 text-green-600" />
                      <span>Clean criminal background</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckIcon className="w-4 h-4 text-green-600" />
                      <span>Health insurance coverage</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckIcon className="w-4 h-4 text-green-600" />
                      <span>Proof of funds and income</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-blue-600">💡 Additional Benefits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <InfoIcon className="w-4 h-4 text-blue-600" />
                      <span>No residency requirement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <InfoIcon className="w-4 h-4 text-blue-600" />
                      <span>Path to EU citizenship after 7 years</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <InfoIcon className="w-4 h-4 text-blue-600" />
                      <span>Include spouse and children under 21</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <InfoIcon className="w-4 h-4 text-blue-600" />
                      <span>Include parents and parents-in-law</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <InfoIcon className="w-4 h-4 text-blue-600" />
                      <span>Renewable every 5 years</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Process Tab */}
          <TabsContent value="process">
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-center">Golden Visa Application Process</h2>

              <div className="space-y-6">
                {PROCESS_STEPS.map((step, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                          <p className="text-muted-foreground mb-2">{step.description}</p>
                          <Badge variant="outline">{step.duration}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-muted">
                <CardContent className="p-6 text-center">
                  <ClockIcon className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="text-xl font-semibold mb-2">Total Timeline</h3>
                  <p className="text-3xl font-bold text-primary mb-2">3-4 Months</p>
                  <p className="text-muted-foreground">
                    From property selection to receiving your Golden Visa
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Get Expert Golden Visa Consultation</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={contactForm.name}
                          onChange={(e) =>
                            setContactForm((prev) => ({ ...prev, name: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={contactForm.email}
                          onChange={(e) =>
                            setContactForm((prev) => ({ ...prev, email: e.target.value }))
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={contactForm.phone}
                          onChange={(e) =>
                            setContactForm((prev) => ({ ...prev, phone: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="nationality">Nationality</Label>
                        <Input
                          id="nationality"
                          value={contactForm.nationality}
                          onChange={(e) =>
                            setContactForm((prev) => ({ ...prev, nationality: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="budget">Investment Budget</Label>
                      <Input
                        id="budget"
                        value={contactForm.investmentBudget}
                        onChange={(e) =>
                          setContactForm((prev) => ({ ...prev, investmentBudget: e.target.value }))
                        }
                        placeholder="e.g., €300,000 - €500,000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">Message</Label>
                      <textarea
                        id="message"
                        className="w-full p-3 border border-input rounded-md resize-none"
                        rows={4}
                        value={contactForm.message}
                        onChange={(e) =>
                          setContactForm((prev) => ({ ...prev, message: e.target.value }))
                        }
                        placeholder="Tell us about your Golden Visa requirements and timeline..."
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Request Free Consultation'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Why Choose RealtyIQ?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <ShieldIcon className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <h4 className="font-semibold">Expert Legal Support</h4>
                        <p className="text-sm text-muted-foreground">
                          Licensed lawyers specializing in Golden Visa applications
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <HomeIcon className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <h4 className="font-semibold">Curated Properties</h4>
                        <p className="text-sm text-muted-foreground">
                          Hand-selected properties that qualify for Golden Visa program
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FileTextIcon className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <h4 className="font-semibold">Full Service Support</h4>
                        <p className="text-sm text-muted-foreground">
                          From property selection to visa approval, we handle everything
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        📞
                      </div>
                      <div>
                        <p className="font-medium">+30 210 3000 356</p>
                        <p className="text-sm text-muted-foreground">Mon-Fri 9AM-6PM</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        📧
                      </div>
                      <div>
                        <p className="font-medium">goldenvisа@realtyiq.gr</p>
                        <p className="text-sm text-muted-foreground">24h response time</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        📍
                      </div>
                      <div>
                        <p className="font-medium">Leof. Siggrou 229</p>
                        <p className="text-sm text-muted-foreground">Nea Smirni, Athens</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
