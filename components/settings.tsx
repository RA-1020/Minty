"use client"

import { useState, useEffect } from "react"
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
import { useProfile } from "@/lib/hooks/use-profile"
import { toast } from "sonner"
import { User, Bell, Globe, Download, Upload, Shield, Trash2, Save, Moon, Sun, Loader2 } from "lucide-react"

export function Settings() {
  const { theme, setTheme } = useTheme()
  const { profile, loading, updateProfile, updateNotificationPreferences } = useProfile()
  const [saving, setSaving] = useState(false)

  // Local state for form data
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    currency: "USD",
    date_format: "MM/DD/YYYY",
    language: "en",
    theme: "light",
    timezone: "UTC",
    week_start_day: 1,
  })

  // Local state for notifications
  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    weeklyReports: true,
    monthlyReports: true,
    transactionReminders: false,
    emailNotifications: true,
    pushNotifications: true,
  })

  // Local state for privacy settings
  const [privacy, setPrivacy] = useState({
    dataSharing: false,
    analytics: true,
    marketing: false,
  })

  // Load profile data into form when it's available
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email,
        currency: profile.currency,
        date_format: profile.date_format,
        language: profile.language,
        theme: profile.theme,
        timezone: profile.timezone,
        week_start_day: profile.week_start_day,
      })

      // Load notification preferences
      if (profile.notification_preferences) {
        setNotifications({
          budgetAlerts: profile.notification_preferences.budgetAlerts ?? true,
          weeklyReports: profile.notification_preferences.weeklyReports ?? true,
          monthlyReports: profile.notification_preferences.monthlyReports ?? true,
          transactionReminders: profile.notification_preferences.transactionReminders ?? false,
          emailNotifications: profile.notification_preferences.emailNotifications ?? true,
          pushNotifications: profile.notification_preferences.pushNotifications ?? true,
        })

        // Load privacy preferences
        setPrivacy({
          dataSharing: profile.notification_preferences.dataSharing ?? false,
          analytics: profile.notification_preferences.analytics ?? true,
          marketing: profile.notification_preferences.marketing ?? false,
        })
      }
    }
  }, [profile])

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

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      
      // Update profile data
      await updateProfile({
        full_name: formData.full_name,
        currency: formData.currency,
        date_format: formData.date_format,
        language: formData.language,
        theme: formData.theme,
        timezone: formData.timezone,
        week_start_day: formData.week_start_day,
      })

      // Update notification preferences (merge with privacy)
      await updateNotificationPreferences({
        ...notifications,
        ...privacy,
      })

      // Update theme in next-themes
      setTheme(formData.theme)

      toast.success("Settings saved successfully!")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = () => {
    // TODO: Implement data export
    toast.info("Data export feature coming soon!")
  }

  const handleImportData = () => {
    // TODO: Implement data import
    toast.info("Data import feature coming soon!")
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-600 dark:text-gray-400">Failed to load profile data.</p>
      </div>
    )
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
                <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{formData.full_name.charAt(0) || formData.email.charAt(0)}</AvatarFallback>
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
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
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
                {formData.theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span className="text-sm font-medium">Dark Mode</span>
              </div>
              <Switch 
                checked={formData.theme === "dark"} 
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, theme: checked ? "dark" : "light" })
                } 
              />
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

            <Button className="w-full" onClick={handleSaveSettings} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save All Changes"}
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
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData({ ...formData, currency: value })
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
                value={formData.date_format}
                onValueChange={(value) =>
                  setFormData({ ...formData, date_format: value })
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
                value={formData.language}
                onValueChange={(value) =>
                  setFormData({ ...formData, language: value })
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
                    checked={notifications.budgetAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, budgetAlerts: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Transaction reminders</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Remind me to log transactions</p>
                  </div>
                  <Switch
                    checked={notifications.transactionReminders}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, transactionReminders: checked })
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
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, weeklyReports: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Monthly reports</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Monthly financial overview</p>
                  </div>
                  <Switch
                    checked={notifications.monthlyReports}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, monthlyReports: checked })
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
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, emailNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Push notifications</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Receive push notifications in browser</p>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, pushNotifications: checked })
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
                  checked={privacy.dataSharing}
                  onCheckedChange={(checked) =>
                    setPrivacy({ ...privacy, dataSharing: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Analytics</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Help us improve by sharing usage analytics</p>
                </div>
                <Switch
                  checked={privacy.analytics}
                  onCheckedChange={(checked) =>
                    setPrivacy({ ...privacy, analytics: checked })
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
                  checked={privacy.marketing}
                  onCheckedChange={(checked) =>
                    setPrivacy({ ...privacy, marketing: checked })
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
