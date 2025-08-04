"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<"testing" | "connected" | "error">("testing")
  const [error, setError] = useState<string | null>(null)
  const [projectInfo, setProjectInfo] = useState<any>(null)

  const testConnection = async () => {
    setConnectionStatus("testing")
    setError(null)

    try {
      const supabase = createClient()

      // Test basic connection
      const { data, error } = await supabase.from("profiles").select("count", { count: "exact", head: true })

      if (error && error.code !== "42P01") {
        // 42P01 is "relation does not exist" which is expected if tables aren't created yet
        throw error
      }

      // Get project info
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setProjectInfo({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasUser: !!user,
        tablesExist: !error || error.code !== "42P01",
      })

      setConnectionStatus("connected")
    } catch (err: any) {
      setError(err.message)
      setConnectionStatus("error")
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {connectionStatus === "testing" && <Loader2 className="h-5 w-5 animate-spin" />}
          {connectionStatus === "connected" && <CheckCircle className="h-5 w-5 text-green-500" />}
          {connectionStatus === "error" && <XCircle className="h-5 w-5 text-red-500" />}
          <span>Supabase Connection Test</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-medium">Environment Variables:</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono">
            <div>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing"}</div>
            <div>
              NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"}
            </div>
          </div>
        </div>

        {projectInfo && (
          <div className="space-y-2">
            <h3 className="font-medium">Connection Details:</h3>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
              <div>Project URL: {projectInfo.url}</div>
              <div>Tables Created: {projectInfo.tablesExist ? "✅ Yes" : "❌ No"}</div>
              <div>User Authenticated: {projectInfo.hasUser ? "✅ Yes" : "❌ No"}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded">
            <h3 className="font-medium text-red-800 dark:text-red-200">Connection Error:</h3>
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
          </div>
        )}

        <Button onClick={testConnection} className="w-full">
          Test Connection Again
        </Button>
      </CardContent>
    </Card>
  )
}
