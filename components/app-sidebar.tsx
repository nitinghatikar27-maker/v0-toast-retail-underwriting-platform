'use client'

import { useState, useEffect, memo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { storage } from '@/lib/storage'
import { ToastLogo } from '@/components/toast-logo'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Settings,
  LogOut,
  ChevronDown,
  Users,
  Shield,
  Bell,
  MessageCircle
} from 'lucide-react'

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'user', 'approver']
  },
  {
    title: 'Submit Request',
    href: '/dashboard/submit',
    icon: FileText,
    roles: ['admin', 'user']
  },
  {
    title: 'My Approvals',
    href: '/dashboard/approvals',
    icon: ClipboardList,
    roles: ['admin', 'approver']
  },
  {
    title: 'User Management',
    href: '/dashboard/users',
    icon: Users,
    roles: ['admin']
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['admin']
  }
]

interface AppSidebarProps {
  onNavigate?: () => void
}

export const AppSidebar = memo(function AppSidebar({ onNavigate }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isAdmin, isApprover } = useAuth()
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    if (user) {
      const checkNotifications = () => {
        try {
          if (storage && typeof storage.getUnreadNotificationsForUser === 'function') {
            const unread = storage.getUnreadNotificationsForUser(user.id)
            setUnreadNotifications(unread.length)
          }
        } catch {
          // Silently handle if function not available
        }
      }
      checkNotifications()
      // Poll for new notifications every 30 seconds
      const interval = setInterval(checkNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const filteredNavItems = navItems.filter(item => {
    if (!user) return false
    return item.roles.some(role => user.roles.includes(role as 'admin' | 'user' | 'approver'))
  })

  return (
    <aside className="w-64 min-h-screen sticky top-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">T</span>
            </div>
            <div>
              <p className="font-semibold text-sm">Toast</p>
              <p className="text-xs text-sidebar-foreground/70">Retail Underwriting</p>
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {filteredNavItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        })}
        
        {/* Notifications indicator */}
        {unreadNotifications > 0 && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm bg-primary/10 text-primary">
            <div className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full flex items-center justify-center text-[8px] text-destructive-foreground">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            </div>
            <span>{unreadNotifications} new message{unreadNotifications > 1 ? 's' : ''}</span>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto py-2 px-2 hover:bg-sidebar-accent"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user ? getInitials(user.name) : '??'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.name || 'Unknown'}
                </p>
                <div className="flex items-center gap-1">
                  {isAdmin && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                      Admin
                    </span>
                  )}
                  {isApprover && !isAdmin && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sidebar-accent text-sidebar-accent-foreground">
                      Approver
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-sidebar-foreground/50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-muted-foreground text-xs">
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
})
