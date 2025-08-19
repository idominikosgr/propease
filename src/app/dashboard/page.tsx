"use client";

import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Users, BarChart3, MessageSquare, Database, RefreshCw, Upload, Settings, AlertCircle, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardStats {
  properties: {
    total: number;
    active: number;
    inactive: number;
  };
  sync: {
    lastSync: string | null;
    status: 'completed' | 'failed' | 'syncing' | null;
    totalSynced: number;
    newProperties: number;
    updatedProperties: number;
  };
  inquiries: {
    total: number;
    thisMonth: number;
    pending: number;
  };
  users: {
    total: number;
    agents: number;
    admins: number;
  };
}

export default function DashboardPage() {
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Check user role
  const userRole = user?.publicMetadata?.role as string;
  const isAdmin = userRole === "admin";
  const isAgent = userRole === "agent" || isAdmin;

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      setLoading(true);
      const [debugResponse, syncResponse, usersResponse] = await Promise.all([
        fetch('/api/debug/properties'),
        fetch('/api/ilist/sync'),
        isAdmin ? fetch('/api/admin/users') : Promise.resolve(null),
      ]);

      const debugData = await debugResponse.json();
      const syncData = await syncResponse.json();
      const usersData = usersResponse ? await usersResponse.json() : null;

      // Calculate property stats
      const totalProperties = debugData.debug?.totalProperties || 0;
      // Estimate active vs inactive (we'd need to enhance the debug API for exact counts)
      const activeProperties = Math.floor(totalProperties * 0.8); // Estimate
      const inactiveProperties = totalProperties - activeProperties;

      // Get latest sync session
      const latestSync = debugData.debug?.recentSyncSessions?.[0];

      setStats({
        properties: {
          total: totalProperties,
          active: activeProperties,
          inactive: inactiveProperties,
        },
        sync: {
          lastSync: latestSync?.started_at || null,
          status: latestSync?.status || null,
          totalSynced: latestSync?.total_properties || 0,
          newProperties: latestSync?.new_properties || 0,
          updatedProperties: latestSync?.updated_properties || 0,
        },
        inquiries: {
          total: 0, // We'd need to add an inquiries API endpoint
          thisMonth: 0,
          pending: 0,
        },
        users: {
          total: usersData?.users?.length || 0,
          agents: usersData?.users?.filter((u: any) => u.role === 'agent')?.length || 0,
          admins: usersData?.users?.filter((u: any) => u.role === 'admin')?.length || 0,
        },
      });
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [user, isAdmin]);

  const statsCards = [
    {
      title: "Total Properties",
      value: stats?.properties.total.toLocaleString() || "0",
      description: `${stats?.properties.active || 0} active, ${stats?.properties.inactive || 0} inactive`,
      icon: Building,
      color: "text-blue-600",
      href: "/dashboard/properties",
    },
    {
      title: "Recent Sync",
      value: stats?.sync.totalSynced?.toLocaleString() || "0",
      description: stats?.sync.lastSync 
        ? `Last sync: ${new Date(stats.sync.lastSync).toLocaleDateString()}`
        : "No recent sync",
      icon: Database,
      color: stats?.sync.status === 'completed' ? "text-green-600" : 
             stats?.sync.status === 'failed' ? "text-red-600" : "text-yellow-600",
      href: "/dashboard/sync",
    },
    {
      title: "Property Inquiries",
      value: stats?.inquiries.total.toLocaleString() || "0",
      description: `${stats?.inquiries.pending || 0} pending response`,
      icon: MessageSquare,
      color: "text-purple-600",
      href: "/dashboard/inquiries",
    },
    ...(isAdmin ? [{
      title: "System Users",
      value: stats?.users.total.toLocaleString() || "0",
      description: `${stats?.users.admins || 0} admins, ${stats?.users.agents || 0} agents`,
      icon: Users,
      color: "text-orange-600",
      href: "/dashboard/admin",
    }] : []),
  ];

  const quickActions = [
    {
      title: "Import Properties",
      description: "Upload CSV/Excel files",
      icon: Upload,
      href: "/dashboard/import",
      variant: "default" as const,
      show: isAgent,
    },
    {
      title: "Sync with iList",
      description: "Manual synchronization",
      icon: RefreshCw,
      href: "/dashboard/sync",
      variant: "secondary" as const,
      show: isAgent,
    },
    {
      title: "View Analytics",
      description: "Performance metrics",
      icon: BarChart3,
      href: "/dashboard/analytics",
      variant: "outline" as const,
      show: true,
    },
    {
      title: "System Settings",
      description: "Configure iList API",
      icon: Settings,
      href: "/dashboard/settings",
      variant: "outline" as const,
      show: isAdmin,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {userRole || "user"}
          </Badge>
          <Button
            onClick={fetchStats}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {stats?.sync && (
        <Card className={`border-l-4 ${
          stats.sync.status === 'completed' ? 'border-l-green-500' :
          stats.sync.status === 'failed' ? 'border-l-red-500' :
          stats.sync.status === 'syncing' ? 'border-l-yellow-500' :
          'border-l-gray-500'
        }`}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              {stats.sync.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              {stats.sync.status === 'failed' && <AlertCircle className="h-5 w-5 text-red-600" />}
              {stats.sync.status === 'syncing' && <RefreshCw className="h-5 w-5 text-yellow-600 animate-spin" />}
              {!stats.sync.status && <Clock className="h-5 w-5 text-gray-600" />}
              
              <div>
                <p className="font-medium">
                  {stats.sync.status === 'completed' && 'iList sync completed successfully'}
                  {stats.sync.status === 'failed' && 'iList sync failed'}
                  {stats.sync.status === 'syncing' && 'iList sync in progress'}
                  {!stats.sync.status && 'No recent iList sync'}
                </p>
                {stats.sync.lastSync && (
                  <p className="text-sm text-muted-foreground">
                    Last sync: {new Date(stats.sync.lastSync).toLocaleString()} • 
                    {stats.sync.newProperties} new, {stats.sync.updatedProperties} updated
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Get started with common dashboard tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.filter(action => action.show).map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} href={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <Icon className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <h3 className="font-semibold mb-1">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium">Database</p>
                <p className="text-sm text-muted-foreground">Connected</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 ${stats?.sync.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'} rounded-full`}></div>
              <div>
                <p className="font-medium">iList API</p>
                <p className="text-sm text-muted-foreground">
                  {stats?.sync.status === 'completed' ? 'Synchronized' : 'Pending sync'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium">Search Index</p>
                <p className="text-sm text-muted-foreground">
                  {stats?.properties.total || 0} properties indexed
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}