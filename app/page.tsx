"use client"

import { useState, Suspense } from "react"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { Budgets } from "@/components/budgets"
import { Transactions } from "@/components/transactions"
import { Categories } from "@/components/categories"
import { Settings } from "@/components/settings"
import { AuthForm } from "@/components/auth-form"
import { SupabaseTest } from "@/components/supabase-test"
import { SetupGuide } from "@/components/setup-guide"
import { ErrorBoundary } from "@/components/error-boundary"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  )
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [showSupabaseTest, setShowSupabaseTest] = useState(false)
  const [showSetupGuide, setShowSetupGuide] = useState(false)
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />
  }

  // Show Supabase test if requested
  if (showSupabaseTest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Supabase Connection Test</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Let's verify your Supabase connection is working properly
            </p>
            <Button variant="outline" onClick={() => setShowSupabaseTest(false)}>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="mb-4">
          <Button variant="outline" onClick={() => setShowSetupGuide(false)}>
            Back to App
          </Button>
        </div>
        <SetupGuide />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="absolute top-4 right-4 space-x-2">
          <Button variant="outline" onClick={() => setShowSetupGuide(true)}>
            Setup Guide
          </Button>
          <Button variant="outline" onClick={() => setShowSupabaseTest(true)}>
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
        return (
          <Suspense fallback={<LoadingSpinner message="Loading dashboard..." />}>
            <ErrorBoundary>
              <Dashboard />
            </ErrorBoundary>
          </Suspense>
        )
      case "budgets":
        return (
          <Suspense fallback={<LoadingSpinner message="Loading budgets..." />}>
            <ErrorBoundary>
              <Budgets />
            </ErrorBoundary>
          </Suspense>
        )
      case "transactions":
        return (
          <Suspense fallback={<LoadingSpinner message="Loading transactions..." />}>
            <ErrorBoundary>
              <Transactions />
            </ErrorBoundary>
          </Suspense>
        )
      case "categories":
        return (
          <Suspense fallback={<LoadingSpinner message="Loading categories..." />}>
            <ErrorBoundary>
              <Categories />
            </ErrorBoundary>
          </Suspense>
        )
      case "settings":
        return (
          <Suspense fallback={<LoadingSpinner message="Loading settings..." />}>
            <ErrorBoundary>
              <Settings />
            </ErrorBoundary>
          </Suspense>
        )
      default:
        return (
          <Suspense fallback={<LoadingSpinner message="Loading dashboard..." />}>
            <ErrorBoundary>
              <Dashboard />
            </ErrorBoundary>
          </Suspense>
        )
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 overflow-auto">{renderPage()}</main>
    </div>
  )
}

export default function Home() {
  return <AppContent />
}
