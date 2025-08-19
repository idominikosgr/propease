"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Eye, 
  Mail,
  Phone,
  MapPin,
  Calendar,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserCheck,
  DollarSign,
  Building,
  User,
  MessageCircle,
  Globe,
  Smartphone,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

interface PropertyInquiry {
  id: string;
  property_id: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source?: string;
  user_agent?: string;
  ip_address?: string;
  referrer?: string;
  status: string;
  assigned_to?: string;
  sent_to_ilist?: boolean;
  ilist_lead_id?: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
  properties: {
    id: string;
    ilist_id: number;
    title?: string;
    custom_code?: string;
    price: number;
    area_id?: number;
    partner_name?: string;
  };
}

interface InquiryStats {
  total: number;
  new: number;
  contacted: number;
  converted: number;
  closed: number;
  thisMonth: number;
}

interface InquiryFilters {
  search: string;
  status: string;
  assignedTo: string;
  propertyId: string;
  limit: number;
  offset: number;
}

export default function InquiriesPage() {
  const { user } = useUser();
  const [inquiries, setInquiries] = useState<PropertyInquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<InquiryStats>({
    total: 0,
    new: 0,
    contacted: 0,
    converted: 0,
    closed: 0,
    thisMonth: 0,
  });
  const [selectedInquiry, setSelectedInquiry] = useState<PropertyInquiry | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: "",
    assignedTo: "",
    notes: "",
  });

  const [filters, setFilters] = useState<InquiryFilters>({
    search: "",
    status: "all",
    assignedTo: "",
    propertyId: "",
    limit: 25,
    offset: 0,
  });

  // Check user role
  const userRole = user?.publicMetadata?.role as string;
  const isAgent = userRole === "agent" || userRole === "admin";

  // Fetch inquiries with filters
  const fetchInquiries = async (newFilters = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Add filters to params
      if (newFilters.search) params.append("search", newFilters.search);
      if (newFilters.status !== "all") params.append("status", newFilters.status);
      if (newFilters.assignedTo) params.append("assignedTo", newFilters.assignedTo);
      if (newFilters.propertyId) params.append("propertyId", newFilters.propertyId);
      params.append("limit", newFilters.limit.toString());
      params.append("offset", newFilters.offset.toString());

      const response = await fetch(`/api/inquiries?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setInquiries(data.data || []);
        setStats(data.stats || stats);
      } else {
        toast.error("Failed to fetch inquiries");
        console.error("Inquiries fetch error:", data.error);
      }
    } catch (error) {
      toast.error("Failed to fetch inquiries");
      console.error("Inquiries fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update inquiry status
  const updateInquiry = async () => {
    if (!selectedInquiry) return;

    setUpdating(true);
    try {
      const response = await fetch("/api/inquiries", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inquiryId: selectedInquiry.id,
          status: updateForm.status || selectedInquiry.status,
          assignedTo: updateForm.assignedTo || selectedInquiry.assigned_to,
          notes: updateForm.notes || selectedInquiry.notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Inquiry updated successfully");
        setShowUpdateDialog(false);
        setSelectedInquiry(null);
        setUpdateForm({ status: "", assignedTo: "", notes: "" });
        fetchInquiries();
      } else {
        toast.error("Failed to update inquiry");
      }
    } catch (error) {
      toast.error("Failed to update inquiry");
      console.error("Inquiry update error:", error);
    } finally {
      setUpdating(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    setFilters(prev => ({ ...prev, offset: 0 }));
    fetchInquiries({ ...filters, offset: 0 });
  };

  // Clear filters
  const clearFilters = () => {
    const clearedFilters = {
      search: "",
      status: "all",
      assignedTo: "",
      propertyId: "",
      limit: 25,
      offset: 0,
    };
    setFilters(clearedFilters);
    fetchInquiries(clearedFilters);
  };

  // Pagination
  const handlePagination = (direction: 'prev' | 'next') => {
    const newOffset = direction === 'prev' 
      ? Math.max(0, filters.offset - filters.limit)
      : filters.offset + filters.limit;
    
    const newFilters = { ...filters, offset: newOffset };
    setFilters(newFilters);
    fetchInquiries(newFilters);
  };

  useEffect(() => {
    if (isAgent) {
      fetchInquiries();
    }
  }, [user]);

  const formatDateTime = (date: string) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(date));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { variant: "default" as const, icon: AlertCircle, color: "bg-blue-100 text-blue-800" },
      contacted: { variant: "secondary" as const, icon: MessageCircle, color: "bg-yellow-100 text-yellow-800" },
      converted: { variant: "default" as const, icon: CheckCircle2, color: "bg-green-100 text-green-800" },
      closed: { variant: "outline" as const, icon: Clock, color: "bg-gray-100 text-gray-800" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const openUpdateDialog = (inquiry: PropertyInquiry) => {
    setSelectedInquiry(inquiry);
    setUpdateForm({
      status: inquiry.status,
      assignedTo: inquiry.assigned_to || "",
      notes: inquiry.notes || "",
    });
    setShowUpdateDialog(true);
  };

  // Redirect if not agent/admin
  if (!isAgent) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need agent or admin privileges to access the inquiries management center.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Property Inquiries</h1>
          <p className="text-muted-foreground">
            Manage customer inquiries and lead responses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {userRole}
          </Badge>
          <Button onClick={() => fetchInquiries()} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Inquiries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.new}</p>
                <p className="text-sm text-muted-foreground">New</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.contacted}</p>
                <p className="text-sm text-muted-foreground">Contacted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.converted}</p>
                <p className="text-sm text-muted-foreground">Converted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-gray-600" />
              <div>
                <p className="text-2xl font-bold">{stats.closed}</p>
                <p className="text-sm text-muted-foreground">Closed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.thisMonth}</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter Inquiries
          </CardTitle>
          <CardDescription>
            Find specific inquiries by customer, property, or status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by customer name, email, property title, or message..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Property ID (optional)"
                value={filters.propertyId}
                onChange={(e) => setFilters(prev => ({ ...prev, propertyId: e.target.value }))}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Assigned to (user ID)"
                value={filters.assignedTo}
                onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search Inquiries
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inquiries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inquiries ({stats.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading inquiries...
            </div>
          ) : inquiries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No inquiries found matching your criteria
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inquiries.map((inquiry) => (
                    <TableRow key={inquiry.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{inquiry.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {inquiry.email}
                          </div>
                          {inquiry.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {inquiry.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {inquiry.properties.custom_code || `Property ${inquiry.properties.ilist_id}`}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              ID: {inquiry.properties.ilist_id}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatPrice(inquiry.properties.price)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(inquiry.status)}
                          {inquiry.assigned_to && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <UserCheck className="h-3 w-3" />
                              {inquiry.assigned_to}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          {inquiry.source === "website" ? (
                            <Globe className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Smartphone className="h-4 w-4 text-gray-600" />
                          )}
                          <span>{inquiry.source || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDateTime(inquiry.created_at)}</p>
                          {inquiry.ip_address && (
                            <p className="text-muted-foreground">
                              IP: {inquiry.ip_address}
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
                                onClick={() => setSelectedInquiry(inquiry)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Inquiry Details</DialogTitle>
                                <DialogDescription>
                                  Complete information for inquiry from {selectedInquiry?.name}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedInquiry && (
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold mb-2">Customer Details</h4>
                                      <div className="space-y-2 text-sm">
                                        <p><strong>Name:</strong> {selectedInquiry.name}</p>
                                        <p><strong>Email:</strong> {selectedInquiry.email}</p>
                                        {selectedInquiry.phone && <p><strong>Phone:</strong> {selectedInquiry.phone}</p>}
                                        <p><strong>Status:</strong> {selectedInquiry.status}</p>
                                        {selectedInquiry.assigned_to && (
                                          <p><strong>Assigned to:</strong> {selectedInquiry.assigned_to}</p>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-2">Property Details</h4>
                                      <div className="space-y-2 text-sm">
                                        <p><strong>Code:</strong> {selectedInquiry.properties.custom_code || "N/A"}</p>
                                        <p><strong>iList ID:</strong> {selectedInquiry.properties.ilist_id}</p>
                                        <p><strong>Price:</strong> {formatPrice(selectedInquiry.properties.price)}</p>
                                        <p><strong>Area ID:</strong> {selectedInquiry.properties.area_id}</p>
                                        {selectedInquiry.properties.partner_name && (
                                          <p><strong>Agent:</strong> {selectedInquiry.properties.partner_name}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {selectedInquiry.message && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Message</h4>
                                      <div className="bg-muted p-3 rounded-md">
                                        <p className="text-sm">{selectedInquiry.message}</p>
                                      </div>
                                    </div>
                                  )}

                                  {selectedInquiry.notes && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Internal Notes</h4>
                                      <div className="bg-yellow-50 p-3 rounded-md">
                                        <p className="text-sm">{selectedInquiry.notes}</p>
                                      </div>
                                    </div>
                                  )}

                                  <div>
                                    <h4 className="font-semibold mb-2">Technical Details</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <p><strong>Source:</strong> {selectedInquiry.source || "Unknown"}</p>
                                      <p><strong>IP Address:</strong> {selectedInquiry.ip_address || "N/A"}</p>
                                      <p><strong>User Agent:</strong> {selectedInquiry.user_agent || "N/A"}</p>
                                      <p><strong>Referrer:</strong> {selectedInquiry.referrer || "N/A"}</p>
                                      <p><strong>Created:</strong> {formatDateTime(selectedInquiry.created_at)}</p>
                                      {selectedInquiry.updated_at && (
                                        <p><strong>Updated:</strong> {formatDateTime(selectedInquiry.updated_at)}</p>
                                      )}
                                    </div>
                                  </div>

                                  {selectedInquiry.sent_to_ilist && (
                                    <div className="bg-green-50 p-3 rounded-md">
                                      <p className="text-sm font-medium text-green-800">
                                        ✅ Sent to iList CRM
                                        {selectedInquiry.ilist_lead_id && (
                                          <span> (Lead ID: {selectedInquiry.ilist_lead_id})</span>
                                        )}
                                      </p>
                                    </div>
                                  )}

                                  <div className="flex gap-2 pt-4 border-t">
                                    <Button
                                      onClick={() => openUpdateDialog(selectedInquiry)}
                                      size="sm"
                                    >
                                      Update Inquiry
                                    </Button>
                                    <Button asChild size="sm" variant="outline">
                                      <Link href={`/dashboard/properties?search=${selectedInquiry.properties.ilist_id}`}>
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        View Property
                                      </Link>
                                    </Button>
                                    <Button asChild size="sm" variant="outline">
                                      <a href={`mailto:${selectedInquiry.email}?subject=Re: Property Inquiry - ${selectedInquiry.properties.ilist_id}&body=Dear ${selectedInquiry.name},%0D%0A%0D%0AThank you for your inquiry about property ${selectedInquiry.properties.ilist_id}.%0D%0A%0D%0A`}>
                                        <Mail className="h-3 w-3 mr-1" />
                                        Reply by Email
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => openUpdateDialog(inquiry)}
                          >
                            Update
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filters.offset + 1} to {Math.min(filters.offset + filters.limit, stats.total)} of {stats.total} inquiries
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
                    disabled={filters.offset + filters.limit >= stats.total}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Inquiry Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Inquiry</DialogTitle>
            <DialogDescription>
              Update the status, assignment, or add notes to this inquiry
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={updateForm.status} 
                onValueChange={(value) => setUpdateForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assignedTo">Assign To (User ID)</Label>
              <Input
                id="assignedTo"
                placeholder="Enter user ID or leave empty"
                value={updateForm.assignedTo}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, assignedTo: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add internal notes about this inquiry..."
                value={updateForm.notes}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={updateInquiry} disabled={updating}>
                {updating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Inquiry'
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}