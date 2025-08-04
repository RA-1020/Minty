"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, TrendingUp, PieChart, BarChart3, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent, type: "login" | "signup") => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    const formData = new FormData(e.target as HTMLFormElement)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string

    try {
      if (type === "signup") {
        // ✅ FIXED: Changed full_Name to fullName
        const { error } = await signUp(email, password, fullName)
        if (error) throw error
        setMessage("Check your email for the confirmation link!")
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Features showcase */}
        <div className="hidden lg:block space-y-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Wallet className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">FinanceTracker</h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Take control of your finances with our comprehensive budget management platform
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Smart Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Track spending patterns and trends</p>
            </div>

            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <PieChart className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Visual Reports</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Beautiful charts and insights</p>
            </div>

            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Budget Control</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Set limits and get smart alerts</p>
            </div>

            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <Wallet className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Multi-Budget</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Manage multiple budgets easily</p>
            </div>
          </div>
        </div>

        {/* Right side - Auth form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 lg:hidden mb-4">
              <Wallet className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold">FinanceTracker</h1>
            </div>
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={(e) => handleSubmit(e, "login")} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="john@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={(e) => handleSubmit(e, "signup")} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" name="fullName" placeholder="John Doe" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" name="email" type="email" placeholder="john@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" name="password" type="password" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}