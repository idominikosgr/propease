"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Building, 
  MessageSquare, 
  Database,
  RefreshCw,
  Calendar,
  DollarSign,
  Target,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Zap,
  PieChart,
  LineChart
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AnalyticsData {
  period: number;
  metrics: {
    properties: {
      total: number;
      newInPeriod: number;
      averagePrice: number;
      priceRange: { min: number; max: number };
      byStatus: { active: number; inactive: number };
      byArea: Record<string, number>;
    };
    sync: {
      total: number;
      inPeriod: number;
      successful: number;
      failed: number;
      averageDuration: number;
      totalPropertiesProcessed: number;
      totalPropertiesAdded: number;
      totalPropertiesUpdated: number;
      lastSyncStatus: string;
      recentSessions: any[];
    };
    inquiries: {
      total: number;
      inPeriod: number;
      conversionRate: number;
      byStatus: { new: number; contacted: number; converted: number; closed: number };
      bySource: Record<string, number>;
      averagePropertyPrice: number;
      topAreas: Record<string, number>;
    };
  };
  charts: {
    daily: Array<{
      date: string;
      properties: number;
      inquiries: number;
      syncSessions: number;
      conversions: number;
    }>;
  };
  generated_at: string;
}

export default function AnalyticsPage() {
  const { user } = useUser();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("30");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Check user role
  const userRole = user?.publicMetadata?.role as string;
  const isAgent = userRole === "agent" || userRole === "admin";

  // Fetch analytics data
  const fetchAnalytics = async (selectedPeriod = period) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics?period=${selectedPeriod}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
        setLastRefresh(new Date());
      } else {
        console.error("Analytics fetch error:", data.error);
      }
    } catch (error) {
      console.error("Analytics fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle period change
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    fetchAnalytics(newPeriod);
  };

  useEffect(() => {
    if (isAgent) {
      fetchAnalytics();
      // Auto-refresh every 5 minutes
      const interval = setInterval(() => fetchAnalytics(), 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user, isAgent]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getSuccessRate = (successful: number, total: number) => {
    return total > 0 ? Math.round((successful / total) * 100) : 0;
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  // Calculate trend data (comparing current period to previous period)
  const calculateTrend = (data: AnalyticsData) => {
    const currentPeriodData = data.charts.daily;
    const currentTotal = currentPeriodData.reduce((sum, day) => sum + day.properties, 0);
    const previousTotal = data.metrics.properties.total - data.metrics.properties.newInPeriod;
    
    return {
      properties: {
        current: data.metrics.properties.newInPeriod,
        trend: previousTotal > 0 ? ((data.metrics.properties.newInPeriod - previousTotal) / previousTotal) * 100 : 0
      },
      inquiries: {
        current: data.metrics.inquiries.inPeriod,
        trend: data.metrics.inquiries.total > data.metrics.inquiries.inPeriod 
          ? ((data.metrics.inquiries.inPeriod - (data.metrics.inquiries.total - data.metrics.inquiries.inPeriod)) / 
             (data.metrics.inquiries.total - data.metrics.inquiries.inPeriod)) * 100 
          : 0
      },
      sync: {
        current: data.metrics.sync.inPeriod,
        successRate: getSuccessRate(data.metrics.sync.successful, data.metrics.sync.inPeriod)
      }
    };
  };

  // Redirect if not agent/admin
  if (!isAgent) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need agent or admin privileges to access the analytics dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mr-4" />
          <div>
            <h2 className="text-xl font-semibold">Loading Analytics...</h2>
            <p className="text-muted-foreground">Processing data from the last {period} days</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            Unable to load analytics data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const trends = calculateTrend(analytics);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline">{userRole}</Badge>
          <Button 
            onClick={() => fetchAnalytics()} 
            disabled={loading} 
            size="sm" 
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Data from the last {period} days</span>
        <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="sync">Sync Performance</TabsTrigger>
          <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
          <TabsTrigger value="trends">Trends & Charts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Properties</p>
                    <p className="text-2xl font-bold">{analytics.metrics.properties.total.toLocaleString()}</p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +{analytics.metrics.properties.newInPeriod} this period
                    </p>
                  </div>
                  <Building className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Inquiries</p>
                    <p className="text-2xl font-bold">{analytics.metrics.inquiries.total.toLocaleString()}</p>
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {analytics.metrics.inquiries.conversionRate}% conversion rate
                    </p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Sync Sessions</p>
                    <p className="text-2xl font-bold">{analytics.metrics.sync.total.toLocaleString()}</p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {getSuccessRate(analytics.metrics.sync.successful, analytics.metrics.sync.total)}% success rate
                    </p>
                  </div>
                  <Database className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Property Price</p>
                    <p className="text-2xl font-bold">
                      {formatPrice(analytics.metrics.properties.averagePrice)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Range: {formatPrice(analytics.metrics.properties.priceRange.min)} - {formatPrice(analytics.metrics.properties.priceRange.max)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Period Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Properties Added</span>
                    <span className="font-semibold">{analytics.metrics.properties.newInPeriod}</span>
                  </div>
                  <Progress 
                    value={Math.min((analytics.metrics.properties.newInPeriod / analytics.metrics.properties.total) * 100, 100)} 
                    className="h-2" 
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Inquiries Received</span>
                    <span className="font-semibold">{analytics.metrics.inquiries.inPeriod}</span>
                  </div>
                  <Progress 
                    value={Math.min((analytics.metrics.inquiries.inPeriod / analytics.metrics.inquiries.total) * 100, 100)} 
                    className="h-2" 
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Sync Sessions</span>
                    <span className="font-semibold">{analytics.metrics.sync.inPeriod}</span>
                  </div>
                  <Progress 
                    value={Math.min((analytics.metrics.sync.inPeriod / analytics.metrics.sync.total) * 100, 100)} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Properties</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{analytics.metrics.properties.byStatus.active}</span>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Sync Status</span>
                  <Badge 
                    variant={analytics.metrics.sync.lastSyncStatus === "completed" ? "default" : "destructive"}
                    className={analytics.metrics.sync.lastSyncStatus === "completed" ? "bg-green-100 text-green-800" : ""}
                  >
                    {analytics.metrics.sync.lastSyncStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg Sync Duration</span>
                  <span className="font-semibold">{formatDuration(analytics.metrics.sync.averageDuration)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Conversion Rate</span>
                  <span className="font-semibold text-green-600">{analytics.metrics.inquiries.conversionRate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Properties Synced</span>
                  <span className="font-semibold">{analytics.metrics.sync.totalPropertiesProcessed.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">New from Sync</span>
                  <span className="font-semibold text-green-600">+{analytics.metrics.sync.totalPropertiesAdded}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Updated from Sync</span>
                  <span className="font-semibold text-blue-600">~{analytics.metrics.sync.totalPropertiesUpdated}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg Inquiry Value</span>
                  <span className="font-semibold">{formatPrice(analytics.metrics.inquiries.averagePropertyPrice)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Property Distribution by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span>Active Properties</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{analytics.metrics.properties.byStatus.active}</div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round((analytics.metrics.properties.byStatus.active / analytics.metrics.properties.total) * 100)}%
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={(analytics.metrics.properties.byStatus.active / analytics.metrics.properties.total) * 100} 
                    className="h-2" 
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span>Inactive Properties</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{analytics.metrics.properties.byStatus.inactive}</div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round((analytics.metrics.properties.byStatus.inactive / analytics.metrics.properties.total) * 100)}%
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={(analytics.metrics.properties.byStatus.inactive / analytics.metrics.properties.total) * 100} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Areas by Property Count</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.metrics.properties.byArea)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([area, count], index) => (
                    <div key={area} className="flex items-center justify-between">
                      <span className="text-sm">Area {area}</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(count / Math.max(...Object.values(analytics.metrics.properties.byArea))) * 100} 
                          className="w-20 h-2" 
                        />
                        <span className="font-semibold w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sync Performance Tab */}
        <TabsContent value="sync" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Sync Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">
                    {getSuccessRate(analytics.metrics.sync.successful, analytics.metrics.sync.inPeriod)}%
                  </div>
                  <p className="text-muted-foreground">
                    {analytics.metrics.sync.successful} of {analytics.metrics.sync.inPeriod} successful
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600">
                    {formatDuration(analytics.metrics.sync.averageDuration)}
                  </div>
                  <p className="text-muted-foreground">per sync session</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Properties Processed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600">
                    {analytics.metrics.sync.totalPropertiesProcessed.toLocaleString()}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground space-y-1">
                    <div className="text-green-600">+{analytics.metrics.sync.totalPropertiesAdded} added</div>
                    <div className="text-blue-600">~{analytics.metrics.sync.totalPropertiesUpdated} updated</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Sync Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Sync Sessions</CardTitle>
              <CardDescription>Last 10 synchronization attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.metrics.sync.recentSessions.map((session: any, index: number) => (
                  <div key={session.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={session.status === "completed" ? "default" : "destructive"}
                          className={session.status === "completed" ? "bg-green-100 text-green-800" : ""}
                        >
                          {session.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(session.started_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm mt-1">
                        {session.total_properties || 0} properties • 
                        +{session.new_properties || 0} new • 
                        ~{session.updated_properties || 0} updated
                        {session.duration_seconds && ` • ${formatDuration(session.duration_seconds)}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{session.sync_type || 'unknown'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inquiries Tab */}
        <TabsContent value="inquiries" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{analytics.metrics.inquiries.byStatus.new}</p>
                    <p className="text-sm text-muted-foreground">New Inquiries</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold">{analytics.metrics.inquiries.byStatus.contacted}</p>
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
                    <p className="text-2xl font-bold">{analytics.metrics.inquiries.byStatus.converted}</p>
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
                    <p className="text-2xl font-bold">{analytics.metrics.inquiries.byStatus.closed}</p>
                    <p className="text-sm text-muted-foreground">Closed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Inquiries by Source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.metrics.inquiries.bySource)
                    .sort(([,a], [,b]) => b - a)
                    .map(([source, count]) => (
                    <div key={source} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{source}</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(count / Math.max(...Object.values(analytics.metrics.inquiries.bySource))) * 100} 
                          className="w-20 h-2" 
                        />
                        <span className="font-semibold w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Areas for Inquiries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.metrics.inquiries.topAreas)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([area, count]) => (
                    <div key={area} className="flex items-center justify-between">
                      <span className="text-sm">Area {area}</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(count / Math.max(...Object.values(analytics.metrics.inquiries.topAreas))) * 100} 
                          className="w-20 h-2" 
                        />
                        <span className="font-semibold w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends & Charts Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Daily Activity Timeline
              </CardTitle>
              <CardDescription>
                Activity over the last {period} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2 bg-blue-500 rounded"></div>
                    <span>Properties</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2 bg-purple-500 rounded"></div>
                    <span>Inquiries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2 bg-green-500 rounded"></div>
                    <span>Conversions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2 bg-yellow-500 rounded"></div>
                    <span>Sync Sessions</span>
                  </div>
                </div>
                
                <div className="h-64 relative">
                  {/* Simple chart representation with bars */}
                  <div className="flex items-end justify-between h-full pt-4">
                    {analytics.charts.daily.slice(-14).map((day, index) => (
                      <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
                        <div className="flex flex-col items-center gap-1 h-full justify-end">
                          {day.properties > 0 && (
                            <div 
                              className="bg-blue-500 rounded-t min-h-[2px]" 
                              style={{ height: `${Math.max(2, (day.properties / Math.max(...analytics.charts.daily.map(d => d.properties))) * 40)}px`, width: '8px' }}
                              title={`${day.properties} properties`}
                            />
                          )}
                          {day.inquiries > 0 && (
                            <div 
                              className="bg-purple-500 rounded-t min-h-[2px]" 
                              style={{ height: `${Math.max(2, (day.inquiries / Math.max(...analytics.charts.daily.map(d => d.inquiries))) * 40)}px`, width: '8px' }}
                              title={`${day.inquiries} inquiries`}
                            />
                          )}
                          {day.conversions > 0 && (
                            <div 
                              className="bg-green-500 rounded-t min-h-[2px]" 
                              style={{ height: `${Math.max(2, (day.conversions / Math.max(...analytics.charts.daily.map(d => d.conversions))) * 20)}px`, width: '8px' }}
                              title={`${day.conversions} conversions`}
                            />
                          )}
                          {day.syncSessions > 0 && (
                            <div 
                              className="bg-yellow-500 rounded-t min-h-[2px]" 
                              style={{ height: `${Math.max(2, (day.syncSessions / Math.max(...analytics.charts.daily.map(d => d.syncSessions))) * 30)}px`, width: '8px' }}
                              title={`${day.syncSessions} sync sessions`}
                            />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground rotate-45 mt-2">
                          {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground text-center">
                  Hover over bars to see exact values
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}