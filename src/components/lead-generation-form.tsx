"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  MessageSquareIcon, 
  PhoneIcon, 
  MailIcon, 
  CalendarIcon,
  CheckCircleIcon,
  StarIcon,
  HeartIcon,
  MapPinIcon,
  EuroIcon,
  ClockIcon,
  UserIcon,
  BuildingIcon,
  HomeIcon
} from "lucide-react";
import { toast } from "sonner";

interface LeadGenerationFormProps {
  children: React.ReactNode;
  propertyId?: number;
  propertyTitle?: string;
  propertyPrice?: number;
  propertyArea?: string;
  source?: "property_page" | "contact_form" | "golden_visa" | "general_inquiry";
}

interface LeadFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  inquiryType: string;
  budget: string;
  timeline: string;
  preferredContact: string;
  message: string;
  goldenVisaInterest: boolean;
  propertyTypes: string[];
  areas: string[];
  newsletter: boolean;
  whatsapp: boolean;
}

const INQUIRY_TYPES = [
  { value: "buying", label: "🏠 Buying Property" },
  { value: "investment", label: "📈 Investment Opportunity" },
  { value: "golden_visa", label: "⭐ Golden Visa Program" },
  { value: "rental", label: "🏡 Rental Property" },
  { value: "consultation", label: "💬 Free Consultation" },
  { value: "market_analysis", label: "📊 Market Analysis" },
  { value: "other", label: "🤝 Other Services" }
];

const BUDGET_RANGES = [
  { value: "under_250k", label: "Under €250,000" },
  { value: "250k_500k", label: "€250,000 - €500,000" },
  { value: "500k_1m", label: "€500,000 - €1,000,000" },
  { value: "1m_2m", label: "€1,000,000 - €2,000,000" },
  { value: "over_2m", label: "Over €2,000,000" },
  { value: "flexible", label: "Flexible Budget" }
];

const TIMELINES = [
  { value: "immediate", label: "🚀 Immediate (Within 1 month)" },
  { value: "3_months", label: "⏰ Within 3 months" },
  { value: "6_months", label: "📅 Within 6 months" },
  { value: "12_months", label: "🗓️ Within 12 months" },
  { value: "exploring", label: "🔍 Just exploring options" }
];

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Land" },
  { value: "investment", label: "Investment Property" }
];

const ATHENS_AREAS = [
  { value: "center", label: "Athens Center" },
  { value: "north", label: "Northern Suburbs" },
  { value: "south", label: "Southern Suburbs" },
  { value: "east", label: "Eastern Suburbs" },
  { value: "west", label: "Western Suburbs" },
  { value: "piraeus", label: "Piraeus" },
  { value: "islands", label: "Greek Islands" },
  { value: "other", label: "Other Areas" }
];

export default function LeadGenerationForm({ 
  children, 
  propertyId, 
  propertyTitle, 
  propertyPrice,
  propertyArea,
  source = "general_inquiry" 
}: LeadGenerationFormProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<LeadFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    inquiryType: propertyId ? "buying" : "",
    budget: "",
    timeline: "",
    preferredContact: "email",
    message: "",
    goldenVisaInterest: false,
    propertyTypes: [],
    areas: [],
    newsletter: true,
    whatsapp: false
  });

  const updateFormData = (key: keyof LeadFormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayValue = (key: "propertyTypes" | "areas", value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].includes(value) 
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const submitLead = async () => {
    try {
      setSubmitting(true);

      const leadData = {
        ...formData,
        propertyId,
        propertyTitle,
        propertyPrice,
        propertyArea,
        source,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer
      };

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Thank you! We'll contact you within 24 hours.");
        setOpen(false);
        setStep(1);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          country: "",
          inquiryType: "",
          budget: "",
          timeline: "",
          preferredContact: "email",
          message: "",
          goldenVisaInterest: false,
          propertyTypes: [],
          areas: [],
          newsletter: true,
          whatsapp: false
        });
      } else {
        toast.error("Failed to submit inquiry. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast.error("Failed to submit inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.email;
      case 2:
        return formData.inquiryType && formData.timeline;
      case 3:
        return true; // Optional step
      default:
        return false;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("el-GR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareIcon className="w-5 h-5" />
            {propertyId ? "Property Inquiry" : "Get Expert Advice"}
          </DialogTitle>
        </DialogHeader>

        {/* Property Context (if applicable) */}
        {propertyId && propertyTitle && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <HomeIcon className="w-8 h-8 text-primary mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{propertyTitle}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    {propertyPrice && (
                      <span className="flex items-center gap-1">
                        <EuroIcon className="w-3 h-3" />
                        {formatPrice(propertyPrice)}
                      </span>
                    )}
                    {propertyArea && (
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="w-3 h-3" />
                        {propertyArea}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3].map((stepNum) => (
            <div
              key={stepNum}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step === stepNum
                  ? "bg-primary text-primary-foreground"
                  : step > stepNum
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > stepNum ? <CheckCircleIcon className="w-4 h-4" /> : stepNum}
            </div>
          ))}
        </div>

        {/* Step 1: Personal Information */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <p className="text-sm text-muted-foreground">
                We'll use this to provide personalized recommendations
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData("firstName", e.target.value)}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData("lastName", e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                placeholder="john@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  placeholder="+30 123 456 7890"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => updateFormData("country", e.target.value)}
                  placeholder="Greece"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="preferred-contact">Preferred Contact Method</Label>
              <Select value={formData.preferredContact} onValueChange={(value) => updateFormData("preferredContact", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">📧 Email</SelectItem>
                  <SelectItem value="phone">📞 Phone Call</SelectItem>
                  <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                  <SelectItem value="video">📹 Video Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Property Requirements */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Your Requirements</h3>
              <p className="text-sm text-muted-foreground">
                Help us understand what you're looking for
              </p>
            </div>

            <div>
              <Label>Type of Inquiry *</Label>
              <Select value={formData.inquiryType} onValueChange={(value) => updateFormData("inquiryType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select inquiry type" />
                </SelectTrigger>
                <SelectContent>
                  {INQUIRY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Budget Range</Label>
              <Select value={formData.budget} onValueChange={(value) => updateFormData("budget", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_RANGES.map((budget) => (
                    <SelectItem key={budget.value} value={budget.value}>
                      {budget.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Timeline *</Label>
              <Select value={formData.timeline} onValueChange={(value) => updateFormData("timeline", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="When are you looking to proceed?" />
                </SelectTrigger>
                <SelectContent>
                  {TIMELINES.map((timeline) => (
                    <SelectItem key={timeline.value} value={timeline.value}>
                      {timeline.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Property Types (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {PROPERTY_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    variant={formData.propertyTypes.includes(type.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayValue("propertyTypes", type.value)}
                    className="justify-start"
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Preferred Areas</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {ATHENS_AREAS.map((area) => (
                  <Button
                    key={area.value}
                    variant={formData.areas.includes(area.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayValue("areas", area.value)}
                    className="justify-start"
                  >
                    {area.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="golden-visa"
                checked={formData.goldenVisaInterest}
                onCheckedChange={(checked) => updateFormData("goldenVisaInterest", checked)}
              />
              <Label htmlFor="golden-visa" className="flex items-center gap-2">
                <StarIcon className="w-4 h-4 text-yellow-600" />
                Interested in Golden Visa program
              </Label>
            </div>
          </div>
        )}

        {/* Step 3: Additional Information */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <p className="text-sm text-muted-foreground">
                Tell us more about your specific needs
              </p>
            </div>

            <div>
              <Label htmlFor="message">Message or Specific Requirements</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => updateFormData("message", e.target.value)}
                placeholder="Tell us about your specific requirements, questions, or any additional information that would help us assist you better..."
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="newsletter"
                  checked={formData.newsletter}
                  onCheckedChange={(checked) => updateFormData("newsletter", checked)}
                />
                <Label htmlFor="newsletter">
                  Subscribe to our newsletter for market updates and new listings
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="whatsapp"
                  checked={formData.whatsapp}
                  onCheckedChange={(checked) => updateFormData("whatsapp", checked)}
                />
                <Label htmlFor="whatsapp">
                  I'm available on WhatsApp for quick updates
                </Label>
              </div>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <ClockIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm">What happens next?</h4>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                      <li>• Our expert team will review your requirements</li>
                      <li>• We'll contact you within 24 hours</li>
                      <li>• You'll receive personalized property recommendations</li>
                      <li>• Schedule a consultation at your convenience</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Step {step} of 3</span>
          </div>
          
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Previous
              </Button>
            )}
            
            {step < 3 ? (
              <Button 
                onClick={() => setStep(step + 1)}
                disabled={!isStepValid()}
              >
                Continue
              </Button>
            ) : (
              <Button 
                onClick={submitLead}
                disabled={submitting || !formData.email}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? "Submitting..." : "Submit Inquiry"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}