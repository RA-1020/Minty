"use client"

import { useState, Suspense, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { AuthForm } from "@/components/auth-form"
import { SupabaseTest } from "@/components/supabase-test"
import { SetupGuide } from "@/components/setup-guide"
import { ErrorBoundary } from "@/components/error-boundary"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import dynamic from 'next/dynamic'

// Dynamically import components with suspense
const DynamicDashboard = dynamic(() => import("@/components/dashboard").then(mod => ({ default: mod.Dashboard })), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading dashboard..." />
})

const DynamicBudgets = dynamic(() => import("@/components/budgets").then(mod => ({ default: mod.Budgets })), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading budgets..." />
})

const DynamicTransactions = dynamic(() => import("@/components/transactions").then(mod => ({ default: mod.Transactions })), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading transactions..." />
})

const DynamicCategories = dynamic(() => import("@/components/categories").then(mod => ({ default: mod.Categories })), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading categories..." />
})

const DynamicSettings = dynamic(() => import("@/components/settings"), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading settings..." />
})

const DynamicChatBot = dynamic(() => import("@/components/financial-chat-bot"), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading AI assistant..." />
})

function AppContent() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [showSupabaseTest, setShowSupabaseTest] = useState(false)
  const [showSetupGuide, setShowSetupGuide] = useState(false)
  const { user, loading } = useAuth()

  // Memoize state update handlers
  const handlePageChange = useCallback((page: string) => {
    setCurrentPage(page)
  }, [])

  const toggleSupabaseTest = useCallback((show: boolean) => {
    setShowSupabaseTest(show)
  }, [])

  const toggleSetupGuide = useCallback((show: boolean) => {
    setShowSetupGuide(show)
  }, [])

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />
  }

  // Show Supabase test if requested
  if (showSupabaseTest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Supabase Connection Test</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Let's verify your Supabase connection is working properly
            </p>
            <Button variant="outline" onClick={() => toggleSupabaseTest(false)}>
              Back to App
            </Button>
          </div>
          <SupabaseTest />
        </div>
      </div>
    )
  }

  // Show setup guide if requested
  if (showSetupGuide) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 p-6">
        <div className="mb-4">
          <Button variant="outline" onClick={() => toggleSetupGuide(false)}>
            Back to App
          </Button>
        </div>
        <SetupGuide />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
        <div className="absolute top-4 right-4 space-x-2">
          <Button variant="outline" onClick={() => toggleSetupGuide(true)}>
            Setup Guide
          </Button>
          <Button variant="outline" onClick={() => toggleSupabaseTest(true)}>
            Test Connection
          </Button>
        </div>
        <AuthForm />
      </div>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DynamicDashboard />
      case "budgets":
        return <DynamicBudgets />
      case "transactions":
        return <DynamicTransactions />
      case "categories":
        return <DynamicCategories />
      case "settings":
        return <DynamicSettings />
      case "chat":
        return <DynamicChatBot />
      default:
        return <DynamicDashboard />
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900">
      <Sidebar currentPage={currentPage} setCurrentPage={handlePageChange} />
      <main className="flex-1 overflow-auto">
        <ErrorBoundary>
          {renderPage()}
        </ErrorBoundary>
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading app..." />}>
      <AppContent />
    </Suspense>
  )
}
