"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Settings, 
  Database,
  Globe,
  Key,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Copy,
  TestTube,
  Save,
  ExternalLink,
  Shield,
  Clock,
  Zap,
  Activity,
  Info,
  Crown
} from "lucide-react";
import { toast } from "sonner";

interface SystemSettings {
  ilist: {
    auth_token: string;
    base_url: string;
    sync_interval: number;
    is_active: boolean;
  };
  webhook: {
    webhookUrl: string;
    supportedEvents: string[];
  };
  system: {
    supabaseUrl?: string;
    vercelUrl?: string;
    nextAuthUrl?: string;
    nodeEnv?: string;
  };
}

export default function SettingsPage() {
  const { user } = useUser();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message: string;
    lastTested?: Date;
  } | null>(null);

  // Form states for different sections
  const [ilistForm, setIlistForm] = useState({
    auth_token: "",
    base_url: "https://ilist.e-agents.gr/api/v1",
    sync_interval: 15,
    is_active: true,
  });

  // Check user role
  const userRole = user?.publicMetadata?.role as string;
  const isAdmin = userRole === "admin";

  // Fetch settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        setIlistForm({
          auth_token: data.data.ilist.auth_token || "",
          base_url: data.data.ilist.base_url || "https://ilist.e-agents.gr/api/v1",
          sync_interval: data.data.ilist.sync_interval || 15,
          is_active: data.data.ilist.is_active !== undefined ? data.data.ilist.is_active : true,
        });
      } else {
        toast.error("Failed to fetch settings");
        console.error("Settings fetch error:", data.error);
      }
    } catch (error) {
      toast.error("Failed to fetch settings");
      console.error("Settings fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Save settings
  const saveSettings = async (section: string, sectionSettings: any) => {
    setSaving(section);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section,
          settings: sectionSettings,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved`);
        fetchSettings(); // Refresh settings
      } else {
        toast.error(`Failed to save ${section} settings`);
        console.error("Settings save error:", data.error);
      }
    } catch (error) {
      toast.error(`Failed to save ${section} settings`);
      console.error("Settings save error:", error);
    } finally {
      setSaving(null);
    }
  };

  // Test iList connection
  const testConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "test_connection",
          authToken: ilistForm.auth_token,
          baseUrl: ilistForm.base_url,
        }),
      });

      const data = await response.json();
      
      setConnectionStatus({
        connected: data.connected || false,
        message: data.message || "Connection test completed",
        lastTested: new Date(),
      });

      if (data.connected) {
        toast.success("iList connection successful!");
      } else {
        toast.error("iList connection failed");
      }
    } catch (error) {
      setConnectionStatus({
        connected: false,
        message: "Connection test failed",
        lastTested: new Date(),
      });
      toast.error("Connection test failed");
      console.error("Connection test error:", error);
    } finally {
      setTesting(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
    }
  }, [user, isAdmin]);

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need admin privileges to access system settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading && !settings) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mr-4" />
          <div>
            <h2 className="text-xl font-semibold">Loading Settings...</h2>
            <p className="text-muted-foreground">Fetching system configuration</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure iList integration, webhooks, and system preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <Crown className="w-3 h-3 mr-1" />
            Admin Only
          </Badge>
          <Button onClick={fetchSettings} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="ilist" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ilist">iList Integration</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="system">System Info</TabsTrigger>
        </TabsList>

        {/* iList Integration Tab */}
        <TabsContent value="ilist" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                iList CRM Configuration
              </CardTitle>
              <CardDescription>
                Configure connection settings for iList property management system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Connection Status */}
              {connectionStatus && (
                <Alert variant={connectionStatus.connected ? "default" : "destructive"}>
                  {connectionStatus.connected ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertTitle>Connection Status</AlertTitle>
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>{connectionStatus.message}</span>
                      {connectionStatus.lastTested && (
                        <span className="text-sm text-muted-foreground">
                          Tested: {connectionStatus.lastTested.toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4">
                <div>
                  <Label htmlFor="ilist_auth_token">Authentication Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="ilist_auth_token"
                      type="password"
                      placeholder="Enter your iList API token"
                      value={ilistForm.auth_token}
                      onChange={(e) => setIlistForm(prev => ({ ...prev, auth_token: e.target.value }))}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(ilistForm.auth_token)}
                      disabled={!ilistForm.auth_token}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your iList CRM API authentication token
                  </p>
                </div>

                <div>
                  <Label htmlFor="ilist_base_url">API Base URL</Label>
                  <Input
                    id="ilist_base_url"
                    placeholder="https://ilist.e-agents.gr/api/v1"
                    value={ilistForm.base_url}
                    onChange={(e) => setIlistForm(prev => ({ ...prev, base_url: e.target.value }))}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    The base URL for iList API endpoints
                  </p>
                </div>

                <div>
                  <Label htmlFor="sync_interval">Sync Interval (minutes)</Label>
                  <Input
                    id="sync_interval"
                    type="number"
                    min="1"
                    max="1440"
                    value={ilistForm.sync_interval}
                    onChange={(e) => setIlistForm(prev => ({ ...prev, sync_interval: parseInt(e.target.value) || 15 }))}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    How often to automatically sync with iList (recommended: 15 minutes)
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="ilist_active"
                    checked={ilistForm.is_active}
                    onCheckedChange={(checked) => setIlistForm(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="ilist_active">Enable iList Integration</Label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={testConnection}
                  disabled={testing || !ilistForm.auth_token}
                  variant="outline"
                >
                  <TestTube className={`h-4 w-4 mr-2 ${testing ? 'animate-pulse' : ''}`} />
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>
                
                <Button
                  onClick={() => saveSettings("ilist", ilistForm)}
                  disabled={saving === "ilist"}
                >
                  <Save className={`h-4 w-4 mr-2 ${saving === "ilist" ? 'animate-spin' : ''}`} />
                  {saving === "ilist" ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>

              {/* Configuration Tips */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Configuration Tips</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 space-y-1 mt-2">
                    <li>Test the connection after entering your authentication token</li>
                    <li>Use a sync interval of 15-30 minutes for optimal performance</li>
                    <li>Disable integration temporarily if you need to perform maintenance</li>
                    <li>Contact iList support if you need help obtaining an API token</li>
                  </ul>
                </AlertDescription>
              </Alert>
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
                Set up real-time notifications from iList CRM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Webhook Endpoint URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    readOnly
                    value={settings?.webhook.webhookUrl || "Loading..."}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => settings && copyToClipboard(settings.webhook.webhookUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={settings?.webhook.webhookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure this URL in your iList CRM webhook settings
                </p>
              </div>

              <div>
                <Label>Supported Events</Label>
                <div className="mt-2 space-y-2">
                  {settings?.webhook.supportedEvents.map((event) => (
                    <div key={event} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">{event}</code>
                    </div>
                  ))}
                </div>
              </div>

              <Alert>
                <Zap className="h-4 w-4" />
                <AlertTitle>Real-time Sync Setup</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2 mt-2">
                    <p>To enable real-time property synchronization:</p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Copy the webhook URL above</li>
                      <li>Log in to your iList CRM admin panel</li>
                      <li>Navigate to API Settings → Webhooks</li>
                      <li>Add a new webhook with the URL and select all events</li>
                      <li>Set the content type to "application/json"</li>
                    </ol>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="bg-muted rounded-md p-4">
                <h4 className="font-semibold mb-2">Webhook Configuration Example</h4>
                <pre className="text-sm overflow-x-auto">
{JSON.stringify({
  url: settings?.webhook.webhookUrl,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "User-Agent": "iList-Webhook/1.0"
  },
  events: settings?.webhook.supportedEvents,
}, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Info Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Environment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Environment</span>
                    <Badge variant={settings?.system.nodeEnv === "production" ? "default" : "secondary"}>
                      {settings?.system.nodeEnv || "unknown"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Supabase URL</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {settings?.system.supabaseUrl ? "Configured" : "Not set"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Deployment URL</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {settings?.system.vercelUrl || settings?.system.nextAuthUrl || "localhost"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database Connection</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Active</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Authentication</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Operational</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Endpoints</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Available</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">iList Integration</span>
                    <div className="flex items-center gap-2">
                      {ilistForm.is_active ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">Enabled</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium">Disabled</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>System Information</AlertTitle>
            <AlertDescription>
              This information is automatically detected from your environment. 
              Contact your system administrator if any values appear incorrect.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}