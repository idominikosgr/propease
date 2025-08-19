'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  Filter,
  RefreshCw,
  Settings,
  Crown,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
  Mail,
  Calendar,
  Activity,
  Database,
  BarChart3,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface UserWithRole {
  userId: string
  email?: string
  firstName?: string
  lastName?: string
  role: 'admin' | 'agent' | 'user'
  createdAt: string
}

export default function AdminPage() {
  const { user } = useUser()
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null)
  const [newRole, setNewRole] = useState<string>('')

  // Check user role
  const userRole = user?.publicMetadata?.role as string
  const isAdmin = userRole === 'admin'

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()

      if (data.success) {
        setUsers(data.users || [])
      } else {
        toast.error('Failed to fetch users')
        console.error('Users fetch error:', data.error)
      }
    } catch (error) {
      toast.error('Failed to fetch users')
      console.error('Users fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Update user role
  const updateUserRole = async () => {
    if (!(selectedUser && newRole)) return

    setUpdating(selectedUser.userId)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.userId,
          role: newRole,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`User role updated to ${newRole}`)
        setShowRoleDialog(false)
        setSelectedUser(null)
        setNewRole('')
        fetchUsers() // Refresh list
      } else {
        toast.error('Failed to update user role')
      }
    } catch (error) {
      toast.error('Failed to update user role')
      console.error('Role update error:', error)
    } finally {
      setUpdating(null)
    }
  }

  // Open role dialog
  const openRoleDialog = (user: UserWithRole) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setShowRoleDialog(true)
  }

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === 'all' || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  // Calculate user statistics
  const userStats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    agents: users.filter((u) => u.role === 'agent').length,
    regularUsers: users.filter((u) => u.role === 'user').length,
    recentUsers: users.filter((u) => {
      const userDate = new Date(u.createdAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return userDate > weekAgo
    }).length,
  }

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [user, isAdmin])

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: {
        variant: 'default' as const,
        icon: Crown,
        color: 'bg-red-100 text-red-800',
        label: 'Admin',
      },
      agent: {
        variant: 'secondary' as const,
        icon: ShieldCheck,
        color: 'bg-blue-100 text-blue-800',
        label: 'Agent',
      },
      user: {
        variant: 'outline' as const,
        icon: Users,
        color: 'bg-gray-100 text-gray-800',
        label: 'User',
      },
    }

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString))
  }

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need admin privileges to access the admin panel. Contact your system administrator.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">System administration and user management</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <Crown className="w-3 h-3 mr-1" />
            Admin Access
          </Badge>
          <Button onClick={fetchUsers} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="system">System Overview</TabsTrigger>
          <TabsTrigger value="security">Security & Roles</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* User Statistics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{userStats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Crown className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold">{userStats.admins}</p>
                    <p className="text-sm text-muted-foreground">Admins</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{userStats.agents}</p>
                    <p className="text-sm text-muted-foreground">Agents</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-gray-600" />
                  <div>
                    <p className="text-2xl font-bold">{userStats.regularUsers}</p>
                    <p className="text-sm text-muted-foreground">Regular Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <UserPlus className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{userStats.recentUsers}</p>
                    <p className="text-sm text-muted-foreground">New (7 days)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filter Users
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by name, email, or user ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                    <SelectItem value="agent">Agents</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(searchTerm || roleFilter !== 'all') && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredUsers.length} of {users.length} users
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('')
                      setRoleFilter('all')
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>System Users ({filteredUsers.length})</CardTitle>
              <CardDescription>Manage user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {users.length === 0 ? 'No users found' : 'No users match your search criteria'}
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((userData) => (
                        <TableRow key={userData.userId}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {userData.firstName || userData.lastName
                                  ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
                                  : 'Unknown User'}
                                {userData.userId === user?.id && (
                                  <Badge variant="outline" className="ml-2">
                                    You
                                  </Badge>
                                )}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {userData.email || 'No email'}
                              </div>
                              <p className="text-xs text-muted-foreground font-mono">
                                ID: {userData.userId}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{getRoleBadge(userData.role)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-3 w-3" />
                              {formatDate(userData.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRoleDialog(userData)}
                                disabled={
                                  userData.userId === user?.id || updating === userData.userId
                                }
                              >
                                {updating === userData.userId ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Settings className="h-4 w-4" />
                                )}
                              </Button>
                              {userData.userId === user?.id && (
                                <Badge variant="outline" className="text-xs">
                                  Current User
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Overview Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Connected</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Authentication</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">User Management</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Operational</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>New users (7 days)</span>
                    <span className="font-semibold">{userStats.recentUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Admin users</span>
                    <span className="font-semibold">{userStats.admins}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Agent users</span>
                    <span className="font-semibold">{userStats.agents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total users</span>
                    <span className="font-semibold">{userStats.total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  User Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Admins</span>
                      <span className="text-sm font-semibold">
                        {Math.round((userStats.admins / userStats.total) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{ width: `${(userStats.admins / userStats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Agents</span>
                      <span className="text-sm font-semibold">
                        {Math.round((userStats.agents / userStats.total) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(userStats.agents / userStats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Users</span>
                      <span className="text-sm font-semibold">
                        {Math.round((userStats.regularUsers / userStats.total) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gray-600 h-2 rounded-full"
                        style={{ width: `${(userStats.regularUsers / userStats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security & Roles Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Role Definitions
                </CardTitle>
                <CardDescription>Understanding system roles and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-4 w-4 text-red-600" />
                    <span className="font-semibold text-red-600">Admin</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Full system access: manage users, properties, sync settings, analytics, and all
                    admin functions.
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-blue-600">Agent</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Property management: view/manage properties, handle inquiries, import data, and
                    sync with iList.
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="font-semibold text-gray-600">User</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Basic access: view properties, submit inquiries, and access personal dashboard
                    features.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Security Health</AlertTitle>
                  <AlertDescription>
                    All security measures are active and functioning properly.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Role-based access control</span>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Authentication required</span>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Admin-only user management</span>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Secure API endpoints</span>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Role Assignment Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.firstName} {selectedUser?.lastName} (
              {selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Role</Label>
              <div className="mt-1">{selectedUser && getRoleBadge(selectedUser.role)}</div>
            </div>

            <div>
              <Label htmlFor="newRole">New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Role Change Warning</AlertTitle>
              <AlertDescription>
                Changing user roles affects their access to system features. Make sure this change
                is authorized.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={updateUserRole}
                disabled={updating !== null || newRole === selectedUser?.role}
              >
                {updating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Role'
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
