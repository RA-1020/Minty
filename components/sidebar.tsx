"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LayoutDashboard, Wallet, Receipt, Tags, Settings, LogOut, Menu, X } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"

interface SidebarProps {
  currentPage: string
  setCurrentPage: (page: string) => void
}

export function Sidebar({ currentPage, setCurrentPage }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { user, profile, signOut } = useAuth()

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "budgets", label: "Budgets", icon: Wallet },
    { id: "transactions", label: "Transactions", icon: Receipt },
    { id: "categories", label: "Categories", icon: Tags },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Wallet className="h-8 w-8 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">FinanceTracker</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={currentPage === item.id ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                setCurrentPage(item.id)
                setIsMobileOpen(false)
              }}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.label}
            </Button>
          )
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar>
            <AvatarImage src={profile?.avatar_url || "/placeholder.svg?height=32&width=32"} />
            <AvatarFallback>{profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{profile?.full_name || "User"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || "user@example.com"}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full bg-transparent" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-transparent"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
