"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useFormatting } from "@/lib/hooks/use-formatting"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, AlertTriangle, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { useCategories } from "@/lib/hooks/use-categories"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

const colorOptions = [
  { value: "#8884d8", name: "Purple" },
  { value: "#82ca9d", name: "Mint Green" },
  { value: "#ffc658", name: "Golden Yellow" },
  { value: "#ff7300", name: "Orange" },
  { value: "#00ff00", name: "Bright Green" },
  { value: "#22c55e", name: "Emerald" },
  { value: "#ef4444", name: "Red" },
  { value: "#f97316", name: "Orange Red" },
  { value: "#eab308", name: "Yellow" },
  { value: "#84cc16", name: "Lime" },
  { value: "#06b6d4", name: "Cyan" },
  { value: "#8b5cf6", name: "Violet" },
]

export function Categories() {
  const { categories, loading, error, createCategory, updateCategory, deleteCategory } = useCategories()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [categoryStats, setCategoryStats] = useState<Record<string, any>>({})
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const { formatCurrency } = useFormatting()
  const { user } = useAuth()
  
  // Load user profile for currency settings
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id) return
      
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('currency')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error loading profile:', profileError)
          return
        }

        if (!profileData) {
          console.error('No profile data found')
          return
        }
      } catch (error) {
        console.error('Error in loadUserProfile:', error)
      }
    }

    loadUserProfile()
  }, [user?.id])

  const loadCategoryStats = useCallback(async () => {
    if (!user?.id) {
      setTransactionsLoading(false)
      return
    }

    // Initialize with empty stats if no categories
    if (!categories || categories.length === 0) {
      setCategoryStats({})
      setTransactionsLoading(false)
      return
    }

    setTransactionsLoading(true)
    try {
      // Get current month's transactions with proper date handling
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1
      
      const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear
      const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`
      
      const { data: transactions, error: transactionError } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          type,
          date,
          category_id,
          user_id,
          categories (
            id,
            name,
            type,
            color
          )
        `)
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lt('date', endDate)

      if (transactionError) {
        console.error('Error loading transactions:', transactionError.message)
        throw new Error(transactionError.message)
      }

      if (!transactions) {
        console.error('No transactions data received')
        throw new Error('No transactions data received')
      }

      // Calculate stats for each category
      const stats: Record<string, any> = {}
      categories.forEach(category => {
        const categoryTransactions = transactions?.filter(t => t.category_id === category.id) || []
        const totalSpent = categoryTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
        const totalIncome = categoryTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)
        
        stats[category.id] = {
          transactionCount: categoryTransactions.length,
          totalSpent: category.type === 'expense' ? totalSpent : totalIncome,
          transactions: categoryTransactions
        }
      })

      setCategoryStats(stats)
    } catch (error) {
      console.error('Error calculating category stats:', error)
    } finally {
      setTransactionsLoading(false)
    }
  }, [user?.id, categories])

  useEffect(() => {
    if (categories && categories.length > 0) {
      loadCategoryStats()
    }
  }, [loadCategoryStats])

  useEffect(() => {
    if (!user?.id) return

    const transactionChannel = supabase
      .channel('transaction_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Transaction change detected:', payload)
          loadCategoryStats()
        }
      )
      .subscribe()

    return () => {
      console.log('Cleaning up transaction listener')
      supabase.removeChannel(transactionChannel)
    }
  }, [user?.id, loadCategoryStats])

  const getCategoryStatus = (spent: number, limit: number, threshold: number) => {
    if (limit === 0) return { status: "no-limit", color: "default" }
    const percentage = (spent / limit) * 100
    if (percentage >= 100) return { status: "over", color: "destructive" }
    if (percentage >= threshold) return { status: "warning", color: "secondary" }
    return { status: "good", color: "default" }
  }

  const handleCreateCategory = async (formData: FormData) => {
    try {
      await createCategory({
        name: formData.get("name") as string,
        color: formData.get("color") as string,
        monthly_limit: Number.parseFloat(formData.get("limit") as string) || 0,
        alert_enabled: formData.get("alertEnabled") === "on",
        alert_threshold: Number.parseFloat(formData.get("threshold") as string) || 90,
        type: formData.get("type") as "income" | "expense",
      })
      setIsCreateOpen(false)
    } catch (error) {
      console.error("Error creating category:", error)
    }
  }

  const handleUpdateCategory = async (formData: FormData) => {
    if (!editingCategory) return
    
    try {
      await updateCategory(editingCategory.id, {
        name: formData.get("name") as string,
        color: formData.get("color") as string,
        monthly_limit: Number.parseFloat(formData.get("limit") as string) || 0,
        alert_enabled: formData.get("alertEnabled") === "on",
        alert_threshold: Number.parseFloat(formData.get("threshold") as string) || 90,
        type: formData.get("type") as "income" | "expense",
      })
      setEditingCategory(null)
    } catch (error) {
      console.error("Error updating category:", error)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id)
    } catch (error) {
      console.error("Error deleting category:", error)
    }
  }

  const handleEditClick = (category: any) => {
    console.log('Edit button clicked for category:', category.name)
    setEditingCategory(category)
  }

  const expenseCategories = categories?.filter((cat) => cat.type === "expense") || []
  const incomeCategories = categories?.filter((cat) => cat.type === "income") || []

  if (loading && !categories) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading categories...</p>
        </div>
      </div>
    )
  }

  if (error && !loading && user?.id) {
    // Only show error if there's an error, we're not loading, and user is logged in
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-red-800 font-medium">Error loading categories</h3>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={loadCategoryStats}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {transactionsLoading && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Updating statistics...</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage spending categories and set limits</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-tutorial="create-category">
              <Plus className="mr-2 h-4 w-4" />
              Create Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>Add a new category to organize your transactions</DialogDescription>
            </DialogHeader>
            <form action={handleCreateCategory} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input id="name" name="name" placeholder="e.g., Groceries" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select name="type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Select name="color" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose color" />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }} />
                            <span>{color.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit">Monthly Limit (Optional)</Label>
                <Input id="limit" name="limit" type="number" step="0.01" placeholder="0.00" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="alertEnabled" name="alertEnabled" />
                <Label htmlFor="alertEnabled">Enable spending alerts</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold">Alert Threshold (%)</Label>
                <Input id="threshold" name="threshold" type="number" placeholder="90" min="1" max="100" />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Category</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category details and settings</DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <form action={handleUpdateCategory} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Category Name</Label>
                <Input 
                  id="edit-name" 
                  name="name" 
                  placeholder="e.g., Groceries" 
                  defaultValue={editingCategory.name}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Type</Label>
                  <Select name="type" defaultValue={editingCategory.type} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-color">Color</Label>
                  <Select name="color" defaultValue={editingCategory.color} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose color" />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }} />
                            <span>{color.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-limit">Monthly Limit (Optional)</Label>
                <Input 
                  id="edit-limit" 
                  name="limit" 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  defaultValue={editingCategory.monthly_limit || ''}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="edit-alertEnabled" 
                  name="alertEnabled" 
                  defaultChecked={editingCategory.alert_enabled}
                />
                <Label htmlFor="edit-alertEnabled">Enable spending alerts</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-threshold">Alert Threshold (%)</Label>
                <Input 
                  id="edit-threshold" 
                  name="threshold" 
                  type="number" 
                  placeholder="90" 
                  min="1" 
                  max="100"
                  defaultValue={editingCategory.alert_threshold || 90}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>
                  Cancel
                </Button>
                <Button type="submit">Update Category</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories?.length || 0}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Active categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">With Limits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories?.filter((cat) => cat.monthly_limit > 0).length || 0}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Have spending limits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Over Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {categories?.filter((cat) => {
                const stats = categoryStats[cat.id]
                return cat.monthly_limit > 0 && stats && stats.totalSpent > cat.monthly_limit
              }).length || 0}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Exceeding limits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alerts Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories?.filter((cat) => cat.alert_enabled).length || 0}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">With notifications</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <span>Expense Categories</span>
          </CardTitle>
          <CardDescription>Categories for tracking your spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expenseCategories.map((category) => {
              const stats = categoryStats[category.id] || { transactionCount: 0, totalSpent: 0 }
              const currentSpent = stats.totalSpent
              const percentage = category.monthly_limit > 0 ? (currentSpent / category.monthly_limit) * 100 : 0
              const status = getCategoryStatus(currentSpent, category.monthly_limit, category.alert_threshold)

              return (
                <div key={category.id} className="p-4 rounded-lg border space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {stats.transactionCount} transaction{stats.transactionCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {category.alert_enabled && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                      <Badge variant={status.color as any}>
                        {status.status === "over"
                          ? "Over Budget"
                          : status.status === "warning"
                            ? "Near Limit"
                            : status.status === "no-limit"
                              ? "No Limit"
                              : "On Track"}
                      </Badge>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Spent: {formatCurrency(currentSpent)}</span>
                      {category.monthly_limit > 0 && <span>Limit: {formatCurrency(category.monthly_limit)}</span>}
                    </div>
                    {category.monthly_limit > 0 && (
                      <>
                        <Progress value={Math.min(percentage, 100)} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                          <span>{percentage.toFixed(1)}% used</span>
                          <span>{formatCurrency(category.monthly_limit - currentSpent)} remaining</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          
          {expenseCategories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No expense categories yet</p>
              <p className="text-sm">Create your first expense category to start tracking spending</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span>Income Categories</span>
          </CardTitle>
          <CardDescription>Categories for tracking your income sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incomeCategories.map((category) => {
              const stats = categoryStats[category.id] || { transactionCount: 0, totalSpent: 0 }
              const currentIncome = stats.totalSpent

              return (
                <div key={category.id} className="p-4 rounded-lg border space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {stats.transactionCount} transaction{stats.transactionCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="font-medium text-green-600">+{formatCurrency(currentIncome)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">This month</p>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {incomeCategories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No income categories yet</p>
              <p className="text-sm">Create your first income category to start tracking income sources</p>
            </div>
          )}
        </CardContent>
      </Card>

      {categories?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No categories yet</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
              Create your first category to start organizing your transactions and setting spending limits.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Category
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}