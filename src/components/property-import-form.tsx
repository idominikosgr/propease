"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  Upload,
  FileUp,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  X,
  Clipboard,
  Loader2,
  Info,
  Database,
  Check,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  parseCSVText,
  parseExcelFile,
  getSuggestedMapping,
} from "@/lib/property-import-utils";
import {
  PropertyImportMapping,
  PropertyImportResult,
} from "@/lib/property-import-types";

// Max file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Property fields for mapping
const PROPERTY_FIELDS = [
  { id: "ilist_id", name: "iList ID", required: false },
  { id: "title", name: "Property Title", required: true },
  { id: "description", name: "Description", required: false },
  { id: "price", name: "Price (€)", required: true },
  { id: "sqr_meters", name: "Size (m²)", required: false },
  { id: "rooms", name: "Rooms", required: false },
  { id: "bathrooms", name: "Bathrooms", required: false },
  { id: "area_id", name: "Area ID", required: false },
  { id: "subarea_id", name: "Subarea ID", required: false },
  { id: "energy_class_id", name: "Energy Class ID", required: false },
  { id: "building_year", name: "Building Year", required: false },
  { id: "latitude", name: "Latitude", required: false },
  { id: "longitude", name: "Longitude", required: false },
  { id: "postal_code", name: "Postal Code", required: false },
  { id: "partner_name", name: "Agent Name", required: false },
  { id: "partner_email", name: "Agent Email", required: false },
  { id: "partner_phone", name: "Agent Phone", required: false },
];

interface PropertyImportFormProps {
  onSuccess?: (result: PropertyImportResult) => void;
  onCancel?: () => void;
}

export function PropertyImportForm({
  onSuccess,
  onCancel,
}: PropertyImportFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Source selection state
  const [importSource, setImportSource] = useState<
    "file" | "paste" | "ilist" | null
  >(null);

  // State for file handling
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"csv" | "excel" | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // State for CSV paste
  const [csvText, setCsvText] = useState("");

  // State for preview data
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);

  // State for column mapping
  const [columnMapping, setColumnMapping] = useState<PropertyImportMapping>({});

  // State for import process
  const [step, setStep] = useState<
    | "source"
    | "upload"
    | "preview"
    | "mapping"
    | "importing"
    | "complete"
    | "error"
  >("source");
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<PropertyImportResult | null>(
    null,
  );
  const [importError, setImportError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Import stats
  const [importStats, setImportStats] = useState({
    total: 0,
    valid: 0,
    invalid: 0,
  });

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFileError(null);

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setFileError(
        `File size exceeds the limit of ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(1)}MB`,
      );
      return;
    }

    // Determine file type
    let detectedType: "csv" | "excel" | null = null;

    if (
      selectedFile.name.endsWith(".csv") ||
      selectedFile.type.includes("csv")
    ) {
      detectedType = "csv";
    } else if (
      selectedFile.name.endsWith(".xlsx") ||
      selectedFile.name.endsWith(".xls") ||
      selectedFile.type.includes("sheet") ||
      selectedFile.type.includes("excel")
    ) {
      detectedType = "excel";
    } else {
      setFileError("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
      return;
    }

    setFile(selectedFile);
    setFileType(detectedType);

    // Read and preview file
    try {
      await generatePreviewFromFile(selectedFile, detectedType);
      setStep("preview");
    } catch (error: any) {
      setFileError(error.message || "Failed to read file");
    }
  };

  // Handle CSV paste
  const handleCsvPaste = async () => {
    if (!csvText.trim()) {
      setFileError("Please paste CSV content first");
      return;
    }

    setIsProcessing(true);
    setFileError(null);

    try {
      const data = await parseCSVText(csvText);
      const csvHeaders = Object.keys(data[0] || {});

      setPreviewData(data.slice(0, 5)); // Preview first 5 rows
      setHeaders(csvHeaders);

      // Auto-map columns
      const suggestedMapping = getSuggestedMapping(csvHeaders);
      setColumnMapping(suggestedMapping);

      setImportStats({
        total: data.length,
        valid: data.length,
        invalid: 0,
      });

      setStep("preview");
    } catch (error: any) {
      setFileError(error.message || "Failed to process CSV text");
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate preview from file
  const generatePreviewFromFile = async (
    file: File,
    type: "csv" | "excel",
  ): Promise<void> => {
    if (type === "csv") {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
          try {
            const result = e.target?.result as string;
            const data = await parseCSVText(result);
            const csvHeaders = Object.keys(data[0] || {});

            setPreviewData(data.slice(0, 5));
            setHeaders(csvHeaders);

            // Auto-map columns
            const suggestedMapping = getSuggestedMapping(csvHeaders);
            setColumnMapping(suggestedMapping);

            setImportStats({
              total: data.length,
              valid: data.length,
              invalid: 0,
            });

            resolve();
          } catch (error: any) {
            reject(new Error(`Failed to parse CSV: ${error.message}`));
          }
        };

        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };

        reader.readAsText(file);
      });
    } else if (type === "excel") {
      try {
        const { data, headers: excelHeaders } = await parseExcelFile(file);

        setPreviewData(data.slice(0, 5));
        setHeaders(excelHeaders);

        // Auto-map columns
        const suggestedMapping = getSuggestedMapping(excelHeaders);
        setColumnMapping(suggestedMapping);

        setImportStats({
          total: data.length,
          valid: data.length,
          invalid: 0,
        });
      } catch (error: any) {
        throw new Error(`Failed to parse Excel: ${error.message}`);
      }
    }
  };

  // Handle column mapping change
  const handleMappingChange = (fieldId: string, headerName: string | null) => {
    if (!headerName || headerName === "none") {
      // Remove mapping
      const newMapping = { ...columnMapping };
      delete newMapping[fieldId as keyof PropertyImportMapping];
      setColumnMapping(newMapping);
    } else {
      setColumnMapping((prev) => ({
        ...prev,
        [fieldId]: headerName,
      }));
    }
  };

  // Check if we have required field mappings
  const hasRequiredMappings = () => {
    const requiredFields = PROPERTY_FIELDS.filter((f) => f.required).map(
      (f) => f.id,
    );
    return requiredFields.every(
      (field) => columnMapping[field as keyof PropertyImportMapping],
    );
  };

  // Start import process
  const handleStartImport = async () => {
    if (!previewData || !hasRequiredMappings()) {
      setImportError("Missing required field mappings");
      return;
    }

    setStep("importing");
    setImportProgress(0);
    setImportError(null);

    try {
      // Get full dataset
      let fullData: any[];

      if (file && fileType) {
        if (fileType === "csv") {
          const reader = new FileReader();
          const fileContent = await new Promise<string>((resolve, reject) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsText(file);
          });
          fullData = await parseCSVText(fileContent);
        } else if (fileType === "excel") {
          const { data } = await parseExcelFile(file);
          fullData = data;
        } else {
          throw new Error("Unsupported file type");
        }
      } else {
        fullData = await parseCSVText(csvText);
      }

      // Debug log before import
      console.log("About to import:", {
        dataLength: fullData.length,
        sampleData: fullData.slice(0, 2),
        columnMapping,
        importType: "parsed_data",
      });

      // Call import API
      const response = await fetch("/api/properties/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvData: fullData,
          columnMapping,
          importType: "parsed_data",
        }),
      });

      const result = await response.json();

      // Debug log import result
      console.log("Import result:", result);

      if (result.success) {
        setImportResult(result);
        setStep("complete");

        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        setImportError(result.error || "Import failed");
        setStep("error");
      }
    } catch (error: any) {
      console.error("Import error:", error);
      setImportError(error.message || "An error occurred during import");
      setStep("error");
    }
  };

  // Reset form
  const handleReset = () => {
    setFile(null);
    setFileError(null);
    setPreviewData(null);
    setHeaders([]);
    setColumnMapping({});
    setImportSource(null);
    setImportProgress(0);
    setImportResult(null);
    setImportError(null);
    setCsvText("");
    setImportStats({ total: 0, valid: 0, invalid: 0 });
    setStep("source");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = [
      "title,price,sqr_meters,rooms,bathrooms,area_id,description,partner_name,partner_email",
      "Beautiful Apartment,250000,85,2,1,2011,Modern apartment in Athens,John Smith,john@example.com",
      "Luxury Villa,590000,290,4,3,2208,Stunning villa with garden,Maria Papadopoulos,maria@example.com",
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "property-import-template.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Download Excel template
  const downloadExcelTemplate = async () => {
    const XLSX = await import("xlsx");

    const data = [
      [
        "title",
        "price",
        "sqr_meters",
        "rooms",
        "bathrooms",
        "area_id",
        "description",
        "partner_name",
        "partner_email",
      ],
      [
        "Beautiful Apartment",
        250000,
        85,
        2,
        1,
        2011,
        "Modern apartment in Athens",
        "John Smith",
        "john@example.com",
      ],
      [
        "Luxury Villa",
        590000,
        290,
        4,
        3,
        2208,
        "Stunning villa with garden",
        "Maria Papadopoulos",
        "maria@example.com",
      ],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Properties");
    XLSX.writeFile(wb, "property-import-template.xlsx");
  };

  // Render source selection
  const renderSourceSelection = () => (
    <div className="grid grid-cols-1 gap-6 p-6">
      <Card
        className="flex flex-col items-center justify-center p-6 cursor-pointer border-2 border-dashed transition-all hover:border-primary/50 hover:bg-primary/5"
        onClick={() => {
          setImportSource("file");
          setStep("upload");
        }}
      >
        <FileSpreadsheet size={48} className="text-primary mb-4" />
        <CardTitle className="text-lg mb-2">Upload CSV/Excel File</CardTitle>
        <CardDescription className="text-center">
          Import properties from CSV or Excel files exported from iList or other
          systems
        </CardDescription>
      </Card>

      <Card
        className="flex flex-col items-center justify-center p-6 cursor-pointer border-2 border-dashed transition-all hover:border-primary/50 hover:bg-primary/5"
        onClick={() => {
          setImportSource("paste");
          setStep("upload");
        }}
      >
        <Clipboard size={48} className="text-primary mb-4" />
        <CardTitle className="text-lg mb-2">Paste CSV Data</CardTitle>
        <CardDescription className="text-center">
          Copy and paste CSV data directly from a spreadsheet
        </CardDescription>
      </Card>
    </div>
  );

  // Render file upload
  const renderFileUpload = () => (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>CSV Format</AlertTitle>
        <AlertDescription>
          Your CSV should include columns for: Title, Price, Size, Rooms, Area
          ID, and Agent details
        </AlertDescription>
      </Alert>

      <div className="border-2 border-dashed rounded-lg p-12 text-center">
        <div className="flex flex-col items-center">
          <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Upload Property Data</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Upload your CSV file with property data. Make sure it includes
            headers in the first row.
          </p>

          <Input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
          />

          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Select CSV File
              </>
            )}
          </Button>

          <p className="mt-4 text-xs text-muted-foreground">
            Supported formats: CSV (.csv), Excel (.xlsx, .xls)
            <br />
            Maximum file size: {(MAX_FILE_SIZE / (1024 * 1024)).toFixed(1)}MB
          </p>
        </div>
      </div>

      {fileError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{fileError}</AlertDescription>
        </Alert>
      )}

      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle>Need a template?</CardTitle>
          <CardDescription>
            Download a CSV template with the correct format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Use our template to ensure your data is formatted correctly with all
            required fields.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <FileUp className="mr-2 h-4 w-4" />
              CSV Template
            </Button>
            <Button variant="outline" onClick={downloadExcelTemplate}>
              <FileUp className="mr-2 h-4 w-4" />
              Excel Template
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep("source")}>
          Back
        </Button>
      </div>
    </div>
  );

  // Render CSV paste interface
  const renderCsvPaste = () => (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Paste CSV Data</AlertTitle>
        <AlertDescription>
          Copy CSV data from Excel, Google Sheets, or any spreadsheet
          application
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <Label>CSV Content</Label>
          <Textarea
            placeholder="Paste your CSV content here... (include headers in first row)"
            className="min-h-[200px] font-mono text-sm"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            disabled={isProcessing}
          />
        </div>

        <Button
          onClick={handleCsvPaste}
          disabled={isProcessing || !csvText.trim()}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Clipboard className="mr-2 h-4 w-4" />
              Process CSV Data
            </>
          )}
        </Button>
      </div>

      {fileError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{fileError}</AlertDescription>
        </Alert>
      )}

      <div className="bg-muted rounded-md p-3">
        <div className="flex items-start">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 mr-2" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">CSV Format Tips:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>First row must contain column headers</li>
              <li>Columns should be separated by commas</li>
              <li>Text with commas should be in quotes</li>
              <li>Required fields: title, price</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep("source")}>
          Back
        </Button>
      </div>
    </div>
  );

  // Render preview step
  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Preview Data</h3>
          <p className="text-sm text-muted-foreground">
            Review the first few rows to ensure data loaded correctly
          </p>
        </div>

        <Button variant="ghost" size="sm" onClick={handleReset}>
          <X className="h-4 w-4 mr-1" />
          Change Source
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold">{importStats.total}</div>
          <div className="text-sm text-muted-foreground">Total Properties</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {importStats.valid}
          </div>
          <div className="text-sm text-muted-foreground">Valid Properties</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {importStats.invalid}
          </div>
          <div className="text-sm text-muted-foreground">
            Invalid Properties
          </div>
        </div>
      </div>

      {/* Preview table */}
      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header, index) => (
                  <TableHead key={`header-${index}`}>
                    {header || `Column ${index + 1}`}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData?.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {headers.map((header, colIndex) => (
                    <TableCell
                      key={`cell-${rowIndex}-${colIndex}`}
                      className="max-w-xs truncate"
                    >
                      {row[header] !== undefined ? String(row[header]) : ""}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {previewData && importStats.total > previewData.length && (
        <p className="text-sm text-center text-muted-foreground">
          Showing {previewData.length} of {importStats.total} properties
        </p>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep("upload")}>
          Back
        </Button>
        <Button onClick={() => setStep("mapping")}>
          Continue to Mapping
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Render column mapping step
  const renderMappingStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Map Columns</h3>
        <p className="text-sm text-muted-foreground">
          Match your CSV columns to property fields. Required fields are marked
          with *.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PROPERTY_FIELDS.map((field) => (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center">
              <Label className="flex-grow">
                {field.name}{" "}
                {field.required && <span className="text-red-500">*</span>}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">
                      {field.id === "title" &&
                        "The name or title of the property listing"}
                      {field.id === "price" && "Property price in Euros"}
                      {field.id === "sqr_meters" &&
                        "Property size in square meters"}
                      {field.id === "area_id" && "iList area ID number"}
                      {field.id === "partner_name" && "Real estate agent name"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={
                columnMapping[field.id as keyof PropertyImportMapping] || "none"
              }
              onValueChange={(value) => handleMappingChange(field.id, value)}
            >
              <SelectTrigger
                className={
                  field.required &&
                  !columnMapping[field.id as keyof PropertyImportMapping]
                    ? "border-red-300"
                    : ""
                }
              >
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {headers.map((header, index) => (
                  <SelectItem
                    key={`select-${index}-${header || "empty"}`}
                    value={header}
                  >
                    {header || `Column ${index + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.required &&
              !columnMapping[field.id as keyof PropertyImportMapping] && (
                <p className="text-xs text-red-500">This field is required</p>
              )}
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setStep("preview")}>
          Back
        </Button>
        <Button onClick={handleStartImport} disabled={!hasRequiredMappings()}>
          Start Import
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Render importing step
  const renderImportingStep = () => (
    <div className="space-y-6 py-8">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">Importing Properties</h3>
        <p className="text-sm text-muted-foreground mb-8">
          Converting your data to iList format and saving to database...
        </p>

        <div className="w-full max-w-md mx-auto mb-8">
          <Progress value={importProgress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            {importProgress}% complete
          </p>
        </div>
      </div>
    </div>
  );

  // Render complete step
  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="text-center py-4">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-medium mb-2">Import Complete</h3>
        <p className="text-muted-foreground mb-8">
          Your properties have been successfully imported
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">
              {importResult?.total || 0}
            </CardTitle>
            <CardDescription>Total Records</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-green-600">
              {importResult?.success || 0}
            </CardTitle>
            <CardDescription>Successfully Imported</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-red-600">
              {importResult?.failed || 0}
            </CardTitle>
            <CardDescription>Errors</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {importResult && importResult.failed > 0 && importResult.errorDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Error Details</CardTitle>
            <CardDescription>
              Issues that occurred during import
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto">
              {importResult.errorDetails.map((error, index) => (
                <Alert key={index} variant="destructive" className="mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Row {error.row}</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {error.errors.map((err, errIndex) => (
                        <li key={errIndex}>{err}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleReset}>
          Import Another File
        </Button>
        <Button onClick={() => router.push("/dashboard/properties")}>
          View Properties
        </Button>
      </div>
    </div>
  );

  // Render error step
  const renderErrorStep = () => (
    <div className="space-y-6">
      <div className="text-center py-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-medium mb-2">Import Failed</h3>
        <p className="text-red-600 mb-8">
          {importError || "An error occurred during the import process"}
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleReset}>
          Start Over
        </Button>
        <Button
          onClick={onCancel || (() => router.push("/dashboard/properties"))}
        >
          Cancel Import
        </Button>
      </div>
    </div>
  );

  // Render the appropriate step
  const renderStep = () => {
    switch (step) {
      case "source":
        return renderSourceSelection();
      case "upload":
        return importSource === "file" ? renderFileUpload() : renderCsvPaste();
      case "preview":
        return renderPreviewStep();
      case "mapping":
        return renderMappingStep();
      case "importing":
        return renderImportingStep();
      case "complete":
        return renderCompleteStep();
      case "error":
        return renderErrorStep();
      default:
        return renderSourceSelection();
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress steps */}
      {step !== "source" && step !== "complete" && step !== "error" && (
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {["upload", "preview", "mapping", "importing"].map(
              (stepName, index) => (
                <div
                  key={stepName}
                  className={`flex flex-col items-center ${
                    step === stepName
                      ? "text-primary"
                      : ["upload", "preview", "mapping", "importing"].indexOf(
                            step,
                          ) > index
                        ? "text-primary"
                        : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                      step === stepName
                        ? "bg-primary text-white"
                        : ["upload", "preview", "mapping", "importing"].indexOf(
                              step,
                            ) > index
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-xs capitalize">{stepName}</span>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div>{renderStep()}</div>
    </div>
  );
}
