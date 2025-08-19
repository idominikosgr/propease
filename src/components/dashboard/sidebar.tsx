'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import {
  Home,
  Building,
  Settings,
  Database,
  BarChart3,
  MessageSquare,
  Users,
  Shield,
  FileSpreadsheet,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useUser } from '@clerk/nextjs'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Properties',
    href: '/dashboard/properties',
    icon: Building,
  },
  {
    name: 'Import',
    href: '/dashboard/import',
    icon: FileSpreadsheet,
    agentOnly: true,
  },
  {
    name: 'Inquiries',
    href: '/dashboard/inquiries',
    icon: MessageSquare,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: 'iList Sync',
    href: '/dashboard/sync',
    icon: Database,
  },
  {
    name: 'Admin',
    href: '/dashboard/admin',
    icon: Shield,
    adminOnly: true,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useUser()

  // Check user role from public metadata
  const userRole = user?.publicMetadata?.role as string
  const isAdmin = userRole === 'admin'
  const isAgent = userRole === 'agent' || isAdmin

  return (
    <div className="w-64 bg-card border-r flex flex-col h-full">
      <div className="p-6">
        <h2 className="text-2xl font-bold">RealtyIQ</h2>
        <p className="text-sm text-muted-foreground">Property Management</p>
      </div>

      <nav className="px-4 space-y-2 flex-1">
        {navigation.map((item) => {
          // Hide admin-only items from non-admins
          if (item.adminOnly && !isAdmin) {
            return null
          }

          // Hide agent-only items from regular users
          if (item.agentOnly && !isAgent) {
            return null
          }

          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn('w-full justify-start', isActive && 'bg-secondary')}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.name}
                {item.adminOnly && <Shield className="ml-auto h-3 w-3 text-red-500" />}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8',
              },
            }}
          />
          <div className="text-sm">
            <p className="font-medium">Account</p>
            <p className="text-muted-foreground">Manage profile</p>
          </div>
        </div>
      </div>
    </div>
  )
}
