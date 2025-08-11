"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTheme as useCustomTheme } from "@/components/theme-provider"
import { useProfile } from "@/lib/hooks/use-profile"
import { useAuth } from "@/lib/auth-context"
import { useTutorial } from "@/lib/tutorial-context"
import { createClient } from "@/lib/supabase/client"
import { User, Bell, Globe, Download, Upload, Save, Moon, Sun, Loader2, Camera, CheckCircle, Play } from "lucide-react"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toast } from 'sonner'

const supabase = createClient()

import { useNotificationSettings, NotificationSettings } from '../lib/hooks/use-notification-settings'

export default function Settings() {
  const { 
    settings: notificationSettings, 
    updateSettings: updateNotifications,
    loading: notificationsLoading,
    error: notificationsError,
    isSupported: notificationsSupported 
  } = useNotificationSettings()

  const [updating, setUpdating] = useState(false)
  
  const handleNotificationUpdate = async (type: keyof NotificationSettings, checked: boolean) => {
    try {
      setUpdating(true)
      const success = await updateNotifications({ [type]: checked })
      if (!success) {
        setError(`Failed to update ${type.replace(/([A-Z])/g, ' $1').toLowerCase()} setting`)
      }
    } finally {
      setUpdating(false)
    }
  }
  const { theme, setTheme } = useCustomTheme()
  const { user } = useAuth()
  const { startTutorial } = useTutorial()
  const { profile, loading, updateProfile, updateNotificationPreferences } = useProfile()
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Local state for form data
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    currency: "USD",
    date_format: "MM/DD/YYYY",
    theme: "light" as "light" | "dark",
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

  // Load profile data into form when it's available
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email,
        currency: profile.currency,
        date_format: profile.date_format,
        theme: (profile.theme as "light" | "dark") || "light",
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
      }

      // Set image preview if avatar exists
      if (profile.avatar_url) {
        setImagePreview(profile.avatar_url)
      }
    }
  }, [profile])

  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
    { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
    { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
    { code: "INR", name: "Indian Rupee", symbol: "₹" },
  ]

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ar", name: "Arabic" },
    { code: "ur", name: "Urdu" },
    { code: "hi", name: "Hindi" },
  ]

  const timezones = [
    { value: "UTC", label: "UTC (Coordinated Universal Time)" },
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "Europe/London", label: "London (GMT/BST)" },
    { value: "Europe/Paris", label: "Paris (CET/CEST)" },
    { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
    { value: "Asia/Shanghai", label: "Shanghai (CST)" },
    { value: "Asia/Dubai", label: "Dubai (GST)" },
    { value: "Asia/Karachi", label: "Karachi (PKT)" },
    { value: "Asia/Kolkata", label: "Mumbai/Delhi (IST)" },
  ]

  const dateFormats = [
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY (12/31/2024)" },
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/12/2024)" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2024-12-31)" },
    { value: "DD-MM-YYYY", label: "DD-MM-YYYY (31-12-2024)" },
    { value: "MM-DD-YYYY", label: "MM-DD-YYYY (12-31-2024)" },
  ]

  const weekStartDays = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 6, label: "Saturday" },
  ]

  const handleExportCSV = async () => {
    try {
      if (!user) {
        toast.error("You must be logged in to export data")
        return
      }

      toast.loading("Preparing CSV export...")

      // Fetch all user data
      const [transactionsResult, budgetsResult, categoriesResult] = await Promise.all([
        supabase
          .from("transactions")
          .select(`
            *,
            category:categories(name, color)
          `)
          .eq("user_id", user.id)
          .order("date", { ascending: false }),
        supabase
          .from("budgets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("categories")
          .select("*")
          .eq("user_id", user.id)
          .order("name", { ascending: true })
      ])

      if (transactionsResult.error) throw transactionsResult.error
      if (budgetsResult.error) throw budgetsResult.error
      if (categoriesResult.error) throw categoriesResult.error

      const transactions = transactionsResult.data || []
      const budgets = budgetsResult.data || []
      const categories = categoriesResult.data || []

      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,"

      // Transactions CSV
      csvContent += "=== TRANSACTIONS ===\n"
      csvContent += "Date,Description,Amount,Type,Category,Notes\n"
      transactions.forEach(transaction => {
        const date = new Date(transaction.date).toLocaleDateString()
        const description = `"${transaction.description.replace(/"/g, '""')}"`
        const amount = transaction.amount
        const type = transaction.type
        const category = transaction.category?.name || "Uncategorized"
        const notes = `"${(transaction.notes || "").replace(/"/g, '""')}"`
        csvContent += `${date},${description},${amount},${type},${category},${notes}\n`
      })

      // Budgets CSV
      csvContent += "\n=== BUDGETS ===\n"
      csvContent += "Name,Type,Amount,Start Date,End Date\n"
      budgets.forEach(budget => {
        const name = `"${budget.name.replace(/"/g, '""')}"`
        const type = budget.type
        const amount = budget.total_amount
        const startDate = new Date(budget.start_date).toLocaleDateString()
        const endDate = new Date(budget.end_date).toLocaleDateString()
        csvContent += `${name},${type},${amount},${startDate},${endDate}\n`
      })

      // Categories CSV
      csvContent += "\n=== CATEGORIES ===\n"
      csvContent += "Name,Type,Color,Icon\n"
      categories.forEach(category => {
        const name = `"${category.name.replace(/"/g, '""')}"`
        const type = category.type
        const color = category.color
        const icon = category.icon || ""
        csvContent += `${name},${type},${color},${icon}\n`
      })

      // Download CSV
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `minty-export-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.dismiss()
      toast.success("CSV export completed successfully!")

    } catch (error) {
      console.error("Error exporting CSV:", error)
      toast.dismiss()
      toast.error("Failed to export CSV. Please try again.")
    }
  }

  const handleExportPDF = async () => {
    try {
      if (!user) {
        toast.error("You must be logged in to export data")
        return
      }

      toast.loading("Generating PDF report...")

      // Fetch all user data
      const [transactionsResult, budgetsResult, categoriesResult] = await Promise.all([
        supabase
          .from("transactions")
          .select(`
            *,
            category:categories(name, color)
          `)
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(50), // Limit for PDF readability
        supabase
          .from("budgets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("categories")
          .select("*")
          .eq("user_id", user.id)
          .order("name", { ascending: true })
      ])

      if (transactionsResult.error) throw transactionsResult.error
      if (budgetsResult.error) throw budgetsResult.error
      if (categoriesResult.error) throw categoriesResult.error

      const transactions = transactionsResult.data || []
      const budgets = budgetsResult.data || []
      const categories = categoriesResult.data || []

      // Create PDF
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      let yPosition = 20

      // Title
      doc.setFontSize(20)
      doc.setFont("helvetica", "bold")
      doc.text("Minty Financial Report", pageWidth / 2, yPosition, { align: "center" })
      yPosition += 10

      // Date
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: "center" })
      yPosition += 20

      // Summary Statistics
      const totalIncome = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0)
      
      const totalExpenses = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0)

      const netAmount = totalIncome - totalExpenses

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Financial Summary", 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Total Income: $${totalIncome.toFixed(2)}`, 20, yPosition)
      yPosition += 6
      doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 20, yPosition)
      yPosition += 6
      doc.text(`Net Amount: $${netAmount.toFixed(2)}`, 20, yPosition)
      yPosition += 15

      // Recent Transactions Table
      if (transactions.length > 0) {
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Recent Transactions (Last 50)", 20, yPosition)
        yPosition += 10

        const transactionData = transactions.map(transaction => [
          new Date(transaction.date).toLocaleDateString(),
          transaction.description.substring(0, 30) + (transaction.description.length > 30 ? "..." : ""),
          transaction.type === "income" ? `+$${transaction.amount.toFixed(2)}` : `-$${transaction.amount.toFixed(2)}`,
          transaction.category?.name || "Uncategorized"
        ])

        autoTable(doc, {
          head: [['Date', 'Description', 'Amount', 'Category']],
          body: transactionData,
          startY: yPosition,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [34, 197, 94] },
          margin: { left: 20, right: 20 }
        })

        yPosition = (doc as any).lastAutoTable.finalY + 15
      }

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      // Active Budgets Table
      if (budgets.length > 0) {
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Active Budgets", 20, yPosition)
        yPosition += 10

        const budgetData = budgets.map(budget => [
          budget.name,
          budget.type,
          `$${budget.total_amount.toFixed(2)}`,
          new Date(budget.start_date).toLocaleDateString(),
          new Date(budget.end_date).toLocaleDateString()
        ])

        autoTable(doc, {
          head: [['Name', 'Type', 'Amount', 'Start Date', 'End Date']],
          body: budgetData,
          startY: yPosition,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 20, right: 20 }
        })

        yPosition = (doc as any).lastAutoTable.finalY + 15
      }

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      // Categories Table
      if (categories.length > 0) {
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Categories", 20, yPosition)
        yPosition += 10

        const categoryData = categories.map(category => [
          category.name,
          category.type,
          category.color
        ])

        autoTable(doc, {
          head: [['Name', 'Type', 'Color']],
          body: categoryData,
          startY: yPosition,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [168, 85, 247] },
          margin: { left: 20, right: 20 }
        })
      }

      // Save PDF
      doc.save(`minty-report-${new Date().toISOString().split('T')[0]}.pdf`)

      toast.dismiss()
      toast.success("PDF report generated successfully!")

    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.dismiss()
      toast.error("Failed to generate PDF report. Please try again.")
    }
  }

  // Handle profile image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPG, PNG, or GIF)')
      return
    }

    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      setError('Image size must be less than 2MB')
      return
    }

    setUploadingImage(true)
    setError(null)

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setError('Failed to upload image. Please try again.')
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      await updateProfile({
        avatar_url: publicUrl
      })

      setImagePreview(publicUrl)
      setSuccess('Profile image updated successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)

    } catch (error) {
      console.error('Error uploading image:', error)
      setError('Failed to upload image. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      setError(null)
      
      // Update profile data
      await updateProfile({
        full_name: formData.full_name,
        currency: formData.currency,
        date_format: formData.date_format,
        theme: formData.theme,
        week_start_day: formData.week_start_day,
      })

      // Update notification preferences
      await updateNotificationPreferences(notifications)

      // Update theme immediately when saving
      setTheme(formData.theme)

      setSuccess("Settings saved successfully!")
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)

    } catch (error) {
      console.error("Error saving settings:", error)
      setError("Failed to save settings. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  // Handle theme toggle in settings page
  const handleThemeToggle = (checked: boolean) => {
    const newTheme = checked ? "dark" : "light"
    setFormData({ ...formData, theme: newTheme })
    // Apply theme immediately without waiting for save
    setTheme(newTheme)
  }

  

  const handleExportData = async () => {
    try {
      setError(null)
      
      // Get all user data
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false })

      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user?.id)

      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id)

      // Create CSV content
      const csvContent = [
        // Headers
        ['Type', 'Date', 'Description', 'Amount', 'Category', 'Budget', 'Notes', 'Tags'].join(','),
        // Transactions data
        ...(transactions || []).map(t => [
          t.type,
          t.date,
          `"${t.description}"`,
          t.amount,
          t.category || '',
          t.budget || '',
          `"${t.notes || ''}"`,
          `"${t.tags || ''}"`
        ].join(','))
      ].join('\n')

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `finance-tracker-export-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setSuccess('Data exported successfully!')
      setTimeout(() => setSuccess(null), 3000)

    } catch (error) {
      console.error('Export error:', error)
      setError('Failed to export data. Please try again.')
    }
  }

  const handleImportData = () => {
    setError('Data import feature is coming soon! Currently you can manually add transactions.')
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

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={imagePreview || profile.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="text-lg">
                    {formData.full_name?.charAt(0) || formData.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-slate-800 bg-opacity-50 rounded-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors"
                >
                  <Camera className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Change Photo"
                  )}
                </Button>
                <p className="text-sm text-gray-600 dark:text-gray-400">JPG, PNG or GIF. Max size 2MB.</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif"
                onChange={handleImageUpload}
                className="hidden"
              />
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
                  placeholder="Enter your full name"
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
                {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span className="text-sm font-medium">Dark Mode</span>
              </div>
              <Switch 
                checked={theme === "dark"} 
                onCheckedChange={handleThemeToggle}
              />
            </div>

            <Separator />

            {/* Tutorial Section - Enhanced */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                    Take the Tutorial
                  </h3>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  Learn how to make the most of Minty with our interactive guided tour
                </p>
              </div>
              <Button 
                onClick={() => startTutorial('main')}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <Play className="mr-1.5 h-3.5 w-3.5" />
                Start
              </Button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency Format</Label>
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
              <p className="text-xs text-gray-500">Affects how monetary values are displayed</p>
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
                  {dateFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Used throughout the application for dates</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weekStart">Week Start Day</Label>
              <Select
                value={formData.week_start_day.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, week_start_day: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weekStartDays.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Affects calendar and weekly report views</p>
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
                    checked={notificationSettings.budgetAlerts}
                    onCheckedChange={(checked) => handleNotificationUpdate('budgetAlerts', checked)}
                    disabled={!notificationsSupported || notificationsLoading || updating}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Transaction reminders</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Remind me to log transactions</p>
                  </div>
                  <Switch
                    checked={notificationSettings.transactionReminders}
                    onCheckedChange={(checked) => handleNotificationUpdate('transactionReminders', checked)}
                    disabled={!notificationsSupported || notificationsLoading || updating}
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
                    checked={notificationSettings.weeklyReports}
                    onCheckedChange={(checked) => handleNotificationUpdate('weeklyReports', checked)}
                    disabled={!notificationsSupported || notificationsLoading || updating}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Monthly reports</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Monthly financial overview</p>
                  </div>
                  <Switch
                    checked={notificationSettings.monthlyReports}
                    onCheckedChange={(checked) => handleNotificationUpdate('monthlyReports', checked)}
                    disabled={!notificationsSupported || notificationsLoading || updating}
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
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => handleNotificationUpdate('emailNotifications', checked)}
                    disabled={!notificationsSupported || notificationsLoading || updating}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Push notifications</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Receive push notifications in browser</p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) => handleNotificationUpdate('pushNotifications', checked)}
                    disabled={!notificationsSupported || notificationsLoading || updating}
                  />
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
                  <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleExportData}>
                    <Download className="mr-2 h-4 w-4" />
                    Export as CSV
                  </Button>


                  <Button 
                      variant="outline" 
                     className="w-full justify-start bg-transparent" 
                    onClick={handleExportPDF}
                    >
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
                  <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleImportData}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV File
                    <Badge variant="secondary" className="ml-2">
                      Coming Soon
                    </Badge>
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent" disabled>
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