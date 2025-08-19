"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileSpreadsheet, 
  Upload, 
  Database, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Download,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyImportForm } from "@/components/property-import-form";
import Link from "next/link";

interface ImportTemplateField {
  id: string;
  name: string;
  required: boolean;
}

export default function ImportCenterPage() {
  const { user } = useUser();
  const [supportedFields, setSupportedFields] = useState<ImportTemplateField[]>([]);
  const [csvTemplate, setCsvTemplate] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Check user role
  const userRole = user?.publicMetadata?.role as string;
  const isAgent = userRole === "agent" || userRole === "admin";

  // Redirect if not agent/admin
  if (!isAgent && !loading) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need agent or admin privileges to access the import center.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch import template and field information
  const fetchImportInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/properties/import');
      const data = await response.json();

      if (data.success) {
        setSupportedFields(data.supportedFields || []);
        setCsvTemplate(data.csvTemplate || "");
      }
    } catch (error) {
      console.error("Failed to fetch import info:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchImportInfo();
    }
  }, [user]);

  // Download CSV template
  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'property-import-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading import center...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Property Import Center</h1>
          <p className="text-muted-foreground">
            Import properties from CSV or Excel files with flexible field mapping
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {userRole}
          </Badge>
          <Link href="/dashboard/properties">
            <Button variant="outline" size="sm">
              <Database className="h-4 w-4 mr-2" />
              View Properties
            </Button>
          </Link>
        </div>
      </div>

      {/* Import Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Before You Start</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            The import system supports CSV and Excel files with flexible field mapping. 
            You can import properties with any column structure - just map them to our fields.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Button size="sm" onClick={downloadTemplate}>
              <Download className="h-3 w-3 mr-1" />
              Download Template
            </Button>
            <span className="text-sm text-muted-foreground">
              Get a sample CSV file to see the expected format
            </span>
          </div>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="import" className="space-y-6">
        <TabsList>
          <TabsTrigger value="import">Import Properties</TabsTrigger>
          <TabsTrigger value="fields">Field Reference</TabsTrigger>
          <TabsTrigger value="examples">Examples & Tips</TabsTrigger>
        </TabsList>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                File Upload & Mapping
              </CardTitle>
              <CardDescription>
                Upload your CSV or Excel file and map the columns to our property fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PropertyImportForm />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fields Tab */}
        <TabsContent value="fields" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supported Property Fields</CardTitle>
              <CardDescription>
                Complete list of fields you can import with their requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {supportedFields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{field.name}</p>
                      <p className="text-sm text-muted-foreground">Field ID: {field.id}</p>
                    </div>
                    {field.required ? (
                      <Badge variant="destructive">Required</Badge>
                    ) : (
                      <Badge variant="outline">Optional</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Field Validation Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Price</p>
                  <p className="text-sm text-muted-foreground">Must be a number in euros. Example: 250000</p>
                </div>
                <div>
                  <p className="font-medium">Size (Square Meters)</p>
                  <p className="text-sm text-muted-foreground">Must be a number. Example: 85</p>
                </div>
                <div>
                  <p className="font-medium">Rooms</p>
                  <p className="text-sm text-muted-foreground">Whole number. Example: 3</p>
                </div>
                <div>
                  <p className="font-medium">Area ID</p>
                  <p className="text-sm text-muted-foreground">Numeric area code from iList. Example: 2011 (for Kolonaki)</p>
                </div>
                <div>
                  <p className="font-medium">Coordinates</p>
                  <p className="text-sm text-muted-foreground">Latitude: 37.9755, Longitude: 23.7348</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examples Tab */}
        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CSV Example</CardTitle>
              <CardDescription>
                Sample CSV structure with required and optional fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{csvTemplate}</pre>
              </div>
              <Button className="mt-4" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download This Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Clean Your Data First</p>
                    <p className="text-sm text-muted-foreground">
                      Remove empty rows, ensure consistent formatting, and validate prices/numbers
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Test with Small Batches</p>
                    <p className="text-sm text-muted-foreground">
                      Import 5-10 properties first to verify your mapping is correct
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Use Standard Formats</p>
                    <p className="text-sm text-muted-foreground">
                      UTF-8 encoding for Greek characters, comma-separated values, no special formatting
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Backup Your Data</p>
                    <p className="text-sm text-muted-foreground">
                      Always keep a backup of your original file before making changes
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Common Issues & Solutions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Greek Characters Not Displaying</p>
                    <p className="text-sm text-muted-foreground">
                      Save your CSV with UTF-8 encoding. In Excel: File → Save As → CSV UTF-8
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Price Formatting Issues</p>
                    <p className="text-sm text-muted-foreground">
                      Use plain numbers without currency symbols, commas, or spaces. Example: 350000 not €350,000
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Column Mapping Errors</p>
                    <p className="text-sm text-muted-foreground">
                      If auto-mapping fails, manually select the correct column for each field
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertTitle>Need Help?</AlertTitle>
            <AlertDescription>
              If you're having trouble with imports, check the{" "}
              <Link href="/dashboard/properties" className="underline">
                Properties page
              </Link>{" "}
              to see if your data was imported correctly, or review the{" "}
              <Link href="/dashboard/analytics" className="underline">
                Analytics dashboard
              </Link>{" "}
              for import statistics.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}