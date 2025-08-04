"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SetupGuide() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Supabase Setup Guide</h1>
        <p className="text-gray-600 dark:text-gray-400">Follow these steps to connect your project to Supabase</p>
      </div>

      {/* Step 1 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Badge variant="outline">1</Badge>
            <span>Create or Access Your Supabase Project</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              Go to{" "}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center"
              >
                supabase.com <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </li>
            <li>Sign in to your account</li>
            <li>Create a new project or select your existing project</li>
            <li>Wait for the project to be fully provisioned (this takes 2-3 minutes)</li>
          </ol>
        </CardContent>
      </Card>

      {/* Step 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Badge variant="outline">2</Badge>
            <span>Get Your Supabase Credentials</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              In your Supabase dashboard, click on <strong>"Settings"</strong> in the sidebar
            </li>
            <li>
              Click on <strong>"API"</strong>
            </li>
            <li>
              Copy the <strong>"Project URL"</strong> (looks like: https://your-project-id.supabase.co)
            </li>
            <li>
              Copy the <strong>"anon public"</strong> key (the public API key)
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Step 3 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Badge variant="outline">3</Badge>
            <span>Environment Variables Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-medium mb-3">Current Environment Variables:</h3>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex items-center justify-between">
                <span>NEXT_PUBLIC_SUPABASE_URL:</span>
                <div className="flex items-center space-x-2">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Connected</span>
                    </>
                  ) : (
                    <span className="text-red-600">Not Set</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                <div className="flex items-center space-x-2">
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Connected</span>
                    </>
                  ) : (
                    <span className="text-red-600">Not Set</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {process.env.NEXT_PUBLIC_SUPABASE_URL && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                ✅ Great! Your environment variables are set up.
              </h3>
              <p className="text-green-600 dark:text-green-400 text-sm">
                Your project is connected to:{" "}
                <code className="bg-green-100 dark:bg-green-800 px-1 rounded">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL}
                </code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 4 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Badge variant="outline">4</Badge>
            <span>Set Up Database Tables</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Run these SQL scripts in your Supabase dashboard (SQL Editor) in this exact order:
          </p>

          <div className="space-y-3">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">1. Create Tables</span>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard("scripts/01-create-tables.sql")}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Script Name
                </Button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Creates all database tables and security policies
              </p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">2. Create Default Categories Function</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard("scripts/04-create-default-categories.sql")}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Script Name
                </Button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Creates function to add default categories for new users
              </p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">3. Create Functions & Triggers</span>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard("scripts/02-create-functions.sql")}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Script Name
                </Button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Sets up automatic profile creation and data triggers
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">💡 How to run SQL scripts:</h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-600 dark:text-blue-400 text-sm">
              <li>Go to your Supabase dashboard</li>
              <li>Click on "SQL Editor" in the sidebar</li>
              <li>Click "New Query"</li>
              <li>Copy and paste each script from the v0 project</li>
              <li>Click "Run" to execute</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Step 5 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Badge variant="outline">5</Badge>
            <span>Test Your Setup</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Once you've completed the steps above, test your connection to make sure everything is working.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
