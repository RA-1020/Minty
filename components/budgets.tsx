"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useFormatting } from "@/lib/hooks/use-formatting"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Calendar, DollarSign, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"

// Initialize the client
const supabase = createClient()

export function Budgets() {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<any>(null)

  const { user } = useAuth()
  const { formatCurrency, formatDate } = useFormatting()

  useEffect(() => {
    const loadBudgets = async () => {
      if (!user?.id) return

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('budgets')
          .select(`
            id,
            user_id,
            name,
            type,
            total_amount,
            spent_amount,
            start_date,
            end_date,
            created_at,
            updated_at
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading budgets:', error)
          return
        }

        setBudgets(data || [])
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBudgets()

    // Set up real-time listener for budget changes
    const budgetChannel = supabase
      .channel('budget_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'budgets',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('Budget change detected:', payload)
          // Reload budgets when changes occur
          loadBudgets()
        }
      )
      .subscribe()

    // Cleanup function
    return () => {
      console.log('Cleaning up budget listener')
      supabase.removeChannel(budgetChannel)
    }
  }, [user?.id])

  const getBudgetStatus = (spent: number, total: number) => {
    const percentage = (spent / total) * 100
    if (percentage >= 100) return { status: "over", color: "destructive" }
    if (percentage >= 90) return { status: "warning", color: "secondary" }
    if (percentage >= 75) return { status: "caution", color: "outline" }
    return { status: "good", color: "default" }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "monthly":
        return <Calendar className="h-4 w-4" />
      case "goal":
        return <DollarSign className="h-4 w-4" />
      case "event":
        return <Calendar className="h-4 w-4" />
      case "savings":
        return <DollarSign className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const handleCreateBudget = async (formData: FormData) => {
    if (!user?.id) return

    const name = formData.get("name") as string
    const type = formData.get("type") as string
    const amount = formData.get("amount") as string
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string

    // Validate required fields
    if (!name || !type || !amount || !startDate || !endDate) {
      alert('Please fill in all required fields')
      return
    }

    // Validate date range
    if (new Date(startDate) >= new Date(endDate)) {
      alert('End date must be after start date')
      return
    }

    const newBudget = {
      user_id: user.id,
      name: name.trim(),
      type: type,
      total_amount: Number.parseFloat(amount),
      spent_amount: 0, // Always start at 0
      start_date: startDate,
      end_date: endDate,
    }

    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert([newBudget])
        .select(`
          id,
          user_id,
          name,
          type,
          total_amount,
          spent_amount,
          start_date,
          end_date,
          created_at,
          updated_at
        `)
        .single()

      if (error) {
        console.error('Error creating budget:', error)
        alert('Failed to create budget: ' + error.message)
        return
      }

      // Add to local state
      setBudgets([data, ...budgets])
      setIsCreateOpen(false)
      alert('Budget created successfully!')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to create budget')
    }
  }

  const handleEditBudget = async (formData: FormData) => {
    if (!user?.id || !editingBudget) return

    const name = formData.get("name") as string
    const type = formData.get("type") as string
    const amount = formData.get("amount") as string
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string

    // Validate required fields
    if (!name || !type || !amount || !startDate || !endDate) {
      alert('Please fill in all required fields')
      return
    }

    // Validate date range
    if (new Date(startDate) >= new Date(endDate)) {
      alert('End date must be after start date')
      return
    }

    const updatedBudget = {
      name: name.trim(),
      type: type,
      total_amount: Number.parseFloat(amount),
      start_date: startDate,
      end_date: endDate,
    }

    console.log('Updating budget with data:', updatedBudget)

    try {
      const { data, error } = await supabase
        .from('budgets')
        .update(updatedBudget)
        .eq('id', editingBudget.id)
        .eq('user_id', user.id) // Security check
        .select(`
          id,
          user_id,
          name,
          type,
          total_amount,
          spent_amount,
          start_date,
          end_date,
          created_at,
          updated_at
        `)
        .single()

      if (error) {
        console.error('Supabase error details:', error)
        alert(`Failed to update budget: ${error.message}`)
        return
      }

      console.log('Budget updated successfully:', data)

      // Update local state
      const updatedBudgets = budgets.map(b => 
        b.id === editingBudget.id ? data : b
      )
      setBudgets(updatedBudgets)
      setEditingBudget(null)

      alert('Budget updated successfully!')
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('An unexpected error occurred')
    }
  }

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget? This action cannot be undone.')) {
      return
    }

    try {
      // First check if there are any transactions associated with this budget
      const { data: associatedTransactions, error: checkError } = await supabase
        .from('transactions')
        .select('id')
        .eq('budget_id', id)
        .eq('user_id', user?.id)

      if (checkError) {
        console.error('Error checking associated transactions:', checkError)
        alert('Failed to check associated transactions')
        return
      }

      // If there are associated transactions, ask for confirmation
      if (associatedTransactions && associatedTransactions.length > 0) {
        if (!confirm(`This budget has ${associatedTransactions.length} associated transaction(s). Deleting it will unlink these transactions from the budget. Continue?`)) {
          return
        }

        // Unlink transactions from this budget
        const { error: unlinkError } = await supabase
          .from('transactions')
          .update({ budget_id: null })
          .eq('budget_id', id)
          .eq('user_id', user?.id)

        if (unlinkError) {
          console.error('Error unlinking transactions:', unlinkError)
          alert('Failed to unlink transactions from budget')
          return
        }
      }

      // Now delete the budget
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id) // Security check

      if (error) {
        console.error('Error deleting budget:', error)
        alert('Failed to delete budget')
        return
      }

      // Remove from local state
      setBudgets(budgets.filter((budget) => budget.id !== id))
      alert('Budget deleted successfully!')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to delete budget')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading budgets...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Budgets</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your budgets and track spending limits</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-tutorial="create-budget">
              <Plus className="mr-2 h-4 w-4" />
              Create Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
              <DialogDescription>Set up a new budget to track your spending</DialogDescription>
            </DialogHeader>
            <form action={handleCreateBudget} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Budget Name</Label>
                <Input id="name" name="name" placeholder="e.g., Monthly Expenses" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Budget Type</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="goal">Goal-based</SelectItem>
                    <SelectItem value="event">Event-based</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Total Amount</Label>
                <Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" name="endDate" type="date" required />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Budget</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editingBudget} onOpenChange={(open) => !open && setEditingBudget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
            <DialogDescription>Update budget details and settings</DialogDescription>
          </DialogHeader>
          {editingBudget && (
            <form action={handleEditBudget} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Budget Name</Label>
                <Input 
                  id="edit-name" 
                  name="name" 
                  placeholder="e.g., Monthly Expenses" 
                  defaultValue={editingBudget.name}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Budget Type</Label>
                <Select name="type" defaultValue={editingBudget.type} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="goal">Goal-based</SelectItem>
                    <SelectItem value="event">Event-based</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Total Amount</Label>
                <Input 
                  id="edit-amount" 
                  name="amount" 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  defaultValue={editingBudget.total_amount}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input 
                    id="edit-startDate" 
                    name="startDate" 
                    type="date" 
                    defaultValue={editingBudget.start_date}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endDate">End Date</Label>
                  <Input 
                    id="edit-endDate" 
                    name="endDate" 
                    type="date" 
                    defaultValue={editingBudget.end_date}
                    required 
                  />
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Current spent amount:</strong> {formatCurrency(editingBudget.spent_amount || 0)}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Spent amounts are automatically calculated from your transactions and cannot be edited manually.
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditingBudget(null)}>
                  Cancel
                </Button>
                <Button type="submit">Update Budget</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Budgets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgets.length}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Active budgets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(budgets.reduce((sum, budget) => sum + (budget.total_amount || 0), 0))}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Across all budgets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(Math.abs(budgets.reduce((sum, budget) => sum + (budget.spent_amount || 0), 0)))}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">This period</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map((budget) => {
          const totalAmount = budget.total_amount || 0
          const spentAmount = budget.spent_amount || 0
          const absoluteSpentAmount = Math.abs(spentAmount)
          const percentage = totalAmount > 0 ? (absoluteSpentAmount / totalAmount) * 100 : 0
          const status = getBudgetStatus(absoluteSpentAmount, totalAmount)

          return (
            <Card key={budget.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(budget.type)}
                    <CardTitle className="text-lg">{budget.name}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={status.color as any}>
                      {status.status === "over"
                        ? "Over Budget"
                        : status.status === "warning"
                          ? "Near Limit"
                          : status.status === "caution"
                            ? "Caution"
                            : "On Track"}
                    </Badge>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditingBudget(budget)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteBudget(budget.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <CardDescription>
                  {budget.start_date} to {budget.end_date}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Spent: {formatCurrency(absoluteSpentAmount)}</span>
                    <span>Budget: {formatCurrency(totalAmount)}</span>
                  </div>
                  <Progress value={Math.min(percentage, 100)} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>{percentage.toFixed(1)}% used</span>
                    <span>{formatCurrency(totalAmount - absoluteSpentAmount)} remaining</span>
                  </div>
                </div>

              </CardContent>
            </Card>
          )
        })}
      </div>

      {budgets.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No budgets yet</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
              Create your first budget to start tracking your spending and reach your financial goals.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Budget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}