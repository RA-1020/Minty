"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LayoutDashboard, Wallet, Receipt, Tags, Settings, LogOut, Menu, X, MessageCircle } from "lucide-react"
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
    { id: "chat", label: "AI Assistant", icon: MessageCircle },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-800 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          {/* Ultra clean logo */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          {/* Clean title */}
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Minty
            </h1>
            <p className="text-xs text-gray-400 dark:text-slate-400 font-medium">
              Finance Tracker
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={`
                w-full justify-start h-10 px-3 rounded-lg font-medium transition-all duration-150 group relative overflow-hidden
                ${isActive 
                  ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 shadow-none" 
                  : "text-gray-300 dark:text-slate-400 hover:text-white dark:hover:text-slate-100 hover:bg-slate-700 dark:hover:bg-slate-900/50"
                }
              `}
              onClick={() => {
                setCurrentPage(item.id)
                setIsMobileOpen(false)
              }}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
              )}
              <Icon className={`mr-3 h-4 w-4 transition-colors duration-150 ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`} />
              <span className="text-sm">{item.label}</span>
            </Button>
          )
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-slate-700/50 dark:bg-slate-900/50">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="w-8 h-8 ring-2 ring-slate-600 dark:ring-slate-800">
            <AvatarImage src={profile?.avatar_url || "/placeholder.svg?height=32&width=32"} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-medium">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white dark:text-white truncate">
              {profile?.full_name || "User"}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-400 truncate">
              {user?.email || "user@example.com"}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          className="w-full h-8 text-gray-400 dark:text-slate-400 hover:text-white dark:hover:text-slate-200 hover:bg-slate-600 dark:hover:bg-slate-800 rounded-md transition-all duration-150 text-xs font-medium" 
          onClick={signOut}
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-slate-700 dark:bg-slate-950 border border-slate-500 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-150 rounded-xl"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-40 lg:hidden transition-all duration-200" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-all duration-200 ease-out
        ${isMobileOpen ? "translate-x-0 shadow-xl" : "-translate-x-full lg:translate-x-0 lg:shadow-none"}
      `}
      >
        <SidebarContent />
      </aside>
    </>
  )
}