"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { 
  RefreshCw, 
  Database, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Zap,
  Globe,
  Calendar,
  BarChart3,
  ExternalLink,
  Copy,
  TestTube,
  PlayCircle,
  StopCircle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface SyncSession {
  id: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  total_properties?: number;
  new_properties?: number;
  updated_properties?: number;
  deleted_properties?: number;
  failed_properties?: number;
  error_message?: string;
}

interface SyncStats {
  lastSync?: SyncSession;
  totalSessions?: number;
  successfulSyncs?: number;
  failedSyncs?: number;
  totalPropertiesSynced?: number;
}

export default function SyncHubPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [connectionTesting, setConnectionTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState<SyncStats>({});
  const [syncHistory, setSyncHistory] = useState<SyncSession[]>([]);
  
  // Sync configuration
  const [authToken, setAuthToken] = useState("");
  const [syncType, setSyncType] = useState<"full" | "incremental">("incremental");
  const [includeDeleted, setIncludeDeleted] = useState(true);
  
  // Webhook configuration
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  // Check user role
  const userRole = user?.publicMetadata?.role as string;
  const isAgent = userRole === "agent" || userRole === "admin";

  // Redirect if not agent/admin
  if (!isAgent) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need agent or admin privileges to access the sync hub.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch sync status and history
  const fetchSyncData = async () => {
    try {
      setLoading(true);
      
      const [syncResponse, scheduledResponse, debugResponse] = await Promise.all([
        fetch('/api/ilist/sync'),
        fetch('/api/ilist/scheduled-sync'),
        fetch('/api/debug/properties'),
      ]);

      const syncData = await syncResponse.json();
      const scheduledData = await scheduledResponse.json();
      const debugData = await debugResponse.json();

      // Set sync stats
      setSyncStats({
        lastSync: debugData.debug?.recentSyncSessions?.[0] || syncData.latestSync,
        ...scheduledData,
      });

      // Set sync history
      setSyncHistory(debugData.debug?.recentSyncSessions || []);

    } catch (error) {
      console.error("Failed to fetch sync data:", error);
      toast.error("Failed to load sync data");
    } finally {
      setLoading(false);
    }
  };

  // Test iList connection
  const testConnection = async () => {
    if (!authToken.trim()) {
      toast.error("Please enter an auth token");
      return;
    }

    try {
      setConnectionTesting(true);
      const response = await fetch('/api/ilist/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authToken }),
      });

      const data = await response.json();

      if (data.success && data.connected) {
        toast.success("iList connection successful!");
      } else {
        toast.error(data.error || "Connection failed");
      }
    } catch (error) {
      toast.error("Connection test failed");
      console.error("Connection test error:", error);
    } finally {
      setConnectionTesting(false);
    }
  };

  // Perform manual sync
  const performSync = async () => {
    if (!authToken.trim()) {
      toast.error("Please enter an auth token and test connection first");
      return;
    }

    try {
      setSyncing(true);
      const response = await fetch('/api/ilist/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authToken,
          syncType,
          includeDeleted,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Sync completed! ${data.stats?.new || 0} new, ${data.stats?.updated || 0} updated properties`);
        fetchSyncData(); // Refresh data
      } else {
        toast.error(data.error || "Sync failed");
      }
    } catch (error) {
      toast.error("Sync failed");
      console.error("Sync error:", error);
    } finally {
      setSyncing(false);
    }
  };

  // Configure webhook
  const configureWebhook = async () => {
    try {
      // First get webhook URL info
      const infoResponse = await fetch('/api/ilist/webhook-config');
      const infoData = await infoResponse.json();

      if (infoData.success) {
        setWebhookUrl(infoData.webhookUrl);
        toast.success("Webhook configuration retrieved");
      }
    } catch (error) {
      toast.error("Failed to get webhook configuration");
      console.error("Webhook config error:", error);
    }
  };

  // Copy webhook URL to clipboard
  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success("Webhook URL copied to clipboard");
  };

  useEffect(() => {
    fetchSyncData();
    configureWebhook();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSyncData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'syncing': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'syncing':
        return <Badge className="bg-yellow-100 text-yellow-800"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Syncing</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">iList Sync Hub</h1>
          <p className="text-muted-foreground">
            Manage synchronization with iList CRM and monitor sync status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {userRole}
          </Badge>
          <Button onClick={fetchSyncData} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{syncStats.totalPropertiesSynced || 0}</p>
                <p className="text-sm text-muted-foreground">Total Synced</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{syncStats.successfulSyncs || 0}</p>
                <p className="text-sm text-muted-foreground">Successful Syncs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{syncStats.failedSyncs || 0}</p>
                <p className="text-sm text-muted-foreground">Failed Syncs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {syncStats.lastSync ? new Date(syncStats.lastSync.started_at).toLocaleDateString() : 'Never'}
                </p>
                <p className="text-sm text-muted-foreground">Last Sync</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Sync Status */}
      {syncStats.lastSync && (
        <Alert className={`border-l-4 ${
          syncStats.lastSync.status === 'completed' ? 'border-l-green-500' :
          syncStats.lastSync.status === 'failed' ? 'border-l-red-500' :
          'border-l-yellow-500'
        }`}>
          <Database className="h-4 w-4" />
          <AlertTitle>Latest Sync Status</AlertTitle>
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                {getSyncStatusBadge(syncStats.lastSync.status)} • 
                {syncStats.lastSync.total_properties || 0} properties processed • 
                {syncStats.lastSync.new_properties || 0} new, {syncStats.lastSync.updated_properties || 0} updated
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(syncStats.lastSync.started_at).toLocaleString()}
              </div>
            </div>
            {syncStats.lastSync.error_message && (
              <p className="text-red-600 mt-2">Error: {syncStats.lastSync.error_message}</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="manual" className="space-y-6">
        <TabsList>
          <TabsTrigger value="manual">Manual Sync</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Sync</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="history">Sync History</TabsTrigger>
        </TabsList>

        {/* Manual Sync Tab */}
        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5" />
                Manual Synchronization
              </CardTitle>
              <CardDescription>
                Manually trigger a sync with iList CRM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="authToken">iList Auth Token</Label>
                <Input
                  id="authToken"
                  type="password"
                  placeholder="Enter your iList authentication token"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sync Type</Label>
                  <Select value={syncType} onValueChange={(value: "full" | "incremental") => setSyncType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incremental">Incremental (Changes Only)</SelectItem>
                      <SelectItem value="full">Full Sync (All Properties)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Include Deleted Properties</Label>
                  <Select value={includeDeleted.toString()} onValueChange={(value) => setIncludeDeleted(value === "true")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes, include deleted</SelectItem>
                      <SelectItem value="false">No, skip deleted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={testConnection}
                  disabled={connectionTesting || !authToken.trim()}
                  variant="outline"
                >
                  <TestTube className={`h-4 w-4 mr-2 ${connectionTesting ? 'animate-pulse' : ''}`} />
                  {connectionTesting ? 'Testing...' : 'Test Connection'}
                </Button>
                
                <Button
                  onClick={performSync}
                  disabled={syncing || !authToken.trim()}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Start Sync'}
                </Button>
              </div>

              {syncing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Sync in progress...</span>
                    <span>This may take several minutes</span>
                  </div>
                  <Progress value={undefined} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Sync Tab */}
        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Scheduled Synchronization
              </CardTitle>
              <CardDescription>
                Configure automated sync with cron jobs or external schedulers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertTitle>Recommended Schedule</AlertTitle>
                <AlertDescription>
                  Run incremental sync every 15 minutes during business hours for optimal performance.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Cron Job Configuration</h4>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                    <p># Run every 15 minutes during business hours (9 AM - 6 PM)</p>
                    <p>*/15 9-18 * * 1-5 curl -X POST "https://yourdomain.com/api/ilist/scheduled-sync" \</p>
                    <p>  -H "Content-Type: application/json" \</p>
                    <p>  -H "x-cron-secret: your-cron-secret" \</p>
                    <p>  -d '{`{"syncType": "incremental", "includeDeleted": true}`}'</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">API Endpoint</h4>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value="/api/ilist/scheduled-sync"
                      className="font-mono"
                    />
                    <Button size="sm" variant="outline" onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + "/api/ilist/scheduled-sync");
                      toast.success("API endpoint copied to clipboard");
                    }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Webhook Configuration
              </CardTitle>
              <CardDescription>
                Set up real-time sync with iList webhooks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Webhook URL</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      readOnly
                      value={webhookUrl}
                      className="font-mono"
                      placeholder="Loading webhook URL..."
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyWebhookUrl}
                      disabled={!webhookUrl}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure this URL in your iList CRM webhook settings
                  </p>
                </div>

                <div>
                  <Label>Supported Events</Label>
                  <div className="mt-2 space-y-2">
                    {[
                      "property.created",
                      "property.updated", 
                      "property.deleted",
                      "property.status_changed"
                    ].map((event) => (
                      <div key={event} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <code className="text-sm bg-muted px-2 py-1 rounded">{event}</code>
                      </div>
                    ))}
                  </div>
                </div>

                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertTitle>Real-time Updates</AlertTitle>
                  <AlertDescription>
                    Once configured, properties will be automatically synchronized whenever changes occur in iList CRM.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Sync History
              </CardTitle>
              <CardDescription>
                View detailed history of all sync operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {syncHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sync history available
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Properties</TableHead>
                      <TableHead>Results</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncHistory.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <Badge variant="outline">{session.sync_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {getSyncStatusBadge(session.status)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">
                              {new Date(session.started_at).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.started_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {session.duration_seconds ? `${session.duration_seconds}s` : '-'}
                        </TableCell>
                        <TableCell>
                          {session.total_properties || 0}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-4">
                              <span className="text-green-600">+{session.new_properties || 0}</span>
                              <span className="text-blue-600">~{session.updated_properties || 0}</span>
                              <span className="text-red-600">-{session.deleted_properties || 0}</span>
                              {(session.failed_properties || 0) > 0 && (
                                <span className="text-orange-600">!{session.failed_properties}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}