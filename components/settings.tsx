"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"
import { User, Bell, Globe, Download, Upload, Shield, Trash2, Save, Moon, Sun } from "lucide-react"

export function Settings() {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState({
    profile: {
      name: "John Doe",
      email: "john@example.com",
      avatar: "/placeholder.svg?height=64&width=64",
    },
    preferences: {
      currency: "USD",
      dateFormat: "MM/DD/YYYY",
      language: "en",
      theme: "light",
    },
    notifications: {
      budgetAlerts: true,
      weeklyReports: true,
      monthlyReports: true,
      transactionReminders: false,
      emailNotifications: true,
      pushNotifications: true,
    },
    privacy: {
      dataSharing: false,
      analytics: true,
      marketing: false,
    },
  })

  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  ]

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
  ]

  const handleSaveSettings = () => {
    // Simulate saving settings
    console.log("Settings saved:", settings)
  }

  const handleExportData = () => {
    // Simulate data export
    console.log("Exporting data...")
  }

  const handleImportData = () => {
    // Simulate data import
    console.log("Importing data...")
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account preferences and application settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Information</span>
            </CardTitle>
            <CardDescription>Update your personal information and profile picture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={settings.profile.avatar || "/placeholder.svg"} />
                <AvatarFallback>{settings.profile.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button variant="outline" size="sm">
                  Change Photo
                </Button>
                <p className="text-sm text-gray-600 dark:text-gray-400">JPG, PNG or GIF. Max size 2MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={settings.profile.name}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      profile: { ...settings.profile, name: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.profile.email}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      profile: { ...settings.profile, email: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common settings and actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span className="text-sm font-medium">Dark Mode</span>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
            </div>

            <Separator />

            <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>

            <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleImportData}>
              <Upload className="mr-2 h-4 w-4" />
              Import Data
            </Button>

            <Separator />

            <Button className="w-full" onClick={handleSaveSettings}>
              <Save className="mr-2 h-4 w-4" />
              Save All Changes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Preferences</span>
          </CardTitle>
          <CardDescription>Customize your application experience</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={settings.preferences.currency}
                onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    preferences: { ...settings.preferences, currency: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center space-x-2">
                        <span>{currency.symbol}</span>
                        <span>{currency.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select
                value={settings.preferences.dateFormat}
                onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    preferences: { ...settings.preferences, dateFormat: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={settings.preferences.language}
                onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    preferences: { ...settings.preferences, language: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      {language.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notifications</span>
          </CardTitle>
          <CardDescription>Control when and how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Budget & Spending Alerts</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Budget limit alerts</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Get notified when approaching budget limits
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.budgetAlerts}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, budgetAlerts: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Transaction reminders</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Remind me to log transactions</p>
                  </div>
                  <Switch
                    checked={settings.notifications.transactionReminders}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, transactionReminders: checked },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Reports & Summaries</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Weekly reports</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Weekly spending summary</p>
                  </div>
                  <Switch
                    checked={settings.notifications.weeklyReports}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, weeklyReports: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Monthly reports</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Monthly financial overview</p>
                  </div>
                  <Switch
                    checked={settings.notifications.monthlyReports}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, monthlyReports: checked },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Delivery Methods</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Email notifications</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, emailNotifications: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Push notifications</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Receive push notifications in browser</p>
                  </div>
                  <Switch
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, pushNotifications: checked },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Privacy & Security</span>
          </CardTitle>
          <CardDescription>Manage your privacy settings and data preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Data sharing</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Share anonymized data to improve the service
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.dataSharing}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, dataSharing: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Analytics</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Help us improve by sharing usage analytics</p>
                </div>
                <Switch
                  checked={settings.privacy.analytics}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, analytics: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Marketing communications</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Receive updates about new features and tips
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.marketing}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, marketing: checked },
                    })
                  }
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-red-600">Danger Zone</h4>
              <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg space-y-4">
                <div>
                  <h5 className="text-sm font-medium">Delete Account</h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export or import your financial data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Export Data</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                  Download your data in various formats for backup or analysis.
                </p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Download className="mr-2 h-4 w-4" />
                    Export as CSV
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Download className="mr-2 h-4 w-4" />
                    Export as PDF Report
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Import Data</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                  Import transactions from bank statements or other financial apps.
                </p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV File
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Upload className="mr-2 h-4 w-4" />
                    Connect Bank Account
                    <Badge variant="secondary" className="ml-2">
                      Coming Soon
                    </Badge>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
