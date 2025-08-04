"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Filter, Edit, Trash2, ArrowUpDown, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState("desc")

  const { user } = useAuth()

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return

      setLoading(true)
      try {
        // Load transactions with category and budget names
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select(`
            *,
            categories(name, color),
            budgets(name)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        // Load categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('name')

        // Load budgets
        const { data: budgetsData, error: budgetsError } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id)
          .order('name')

        if (transactionsError) {
          console.error('Error loading transactions:', transactionsError)
          return
        }
        if (categoriesError) {
          console.error('Error loading categories:', categoriesError)
          return
        }
        if (budgetsError) {
          console.error('Error loading budgets:', budgetsError)
          return
        }

        // Format transactions data
        const formattedTransactions = (transactionsData || []).map(t => ({
          ...t,
          categoryName: t.categories?.name || 'Uncategorized',
          categoryColor: t.categories?.color || '#8884d8',
          budgetName: t.budgets?.name || null,
          // Parse tags if stored as JSON string
          parsedTags: typeof t.tags === 'string' ? 
            (t.tags ? t.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []) : 
            (Array.isArray(t.tags) ? t.tags : [])
        }))

        setTransactions(formattedTransactions)
        setFilteredTransactions(formattedTransactions)
        setCategories(categoriesData || [])
        setBudgets(budgetsData || [])
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id])

  // Apply filters whenever dependencies change
  useEffect(() => {
    applyFilters()
  }, [transactions, searchTerm, filterCategory, filterType, sortBy, sortOrder])

  const applyFilters = () => {
    let filtered = [...transactions]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.parsedTags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter((transaction) => transaction.categoryName === filterCategory)
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((transaction) => transaction.type === filterType)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue
      switch (sortBy) {
        case "amount":
          aValue = Math.abs(a.amount)
          bValue = Math.abs(b.amount)
          break
        case "category":
          aValue = a.categoryName
          bValue = b.categoryName
          break
        default:
          aValue = new Date(a.date)
          bValue = new Date(b.date)
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredTransactions(filtered)
  }

  const handleCreateTransaction = async (formData: FormData) => {
    if (!user?.id) return

    const amount = Number.parseFloat(formData.get("amount") as string)
    const type = formData.get("type") as string
    const categoryId = formData.get("category") as string
    const budgetId = formData.get("budget") as string
    const description = formData.get("description") as string
    const date = formData.get("date") as string
    const notes = formData.get("notes") as string || ""
    const tags = (formData.get("tags") as string || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .join(",") // Store as comma-separated string

    // Validate required fields
    if (!description || !amount || !type || !categoryId || !date) {
      alert('Please fill in all required fields')
      return
    }

    const newTransaction = {
      user_id: user.id,
      description: description.trim(),
      amount: type === "expense" ? -Math.abs(amount) : Math.abs(amount),
      category_id: categoryId,
      budget_id: budgetId === "none" || !budgetId ? null : budgetId,
      type: type,
      date: date,
      notes: notes.trim(),
      tags: tags || null,
    }

    console.log('Creating transaction with data:', newTransaction)

    try {
      // First insert the transaction
      const { data, error } = await supabase
        .from('transactions')
        .insert([newTransaction])
        .select()
        .single()

      if (error) {
        console.error('Supabase error details:', error)
        alert(`Failed to create transaction: ${error.message}`)
        return
      }

      console.log('Transaction created successfully:', data)

      // Then fetch the complete transaction with related data
      const { data: fullTransaction, error: fetchError } = await supabase
        .from('transactions')
        .select(`
          *,
          categories(name, color),
          budgets(name)
        `)
        .eq('id', data.id)
        .single()

      if (fetchError) {
        console.error('Error fetching full transaction:', fetchError)
        // Still add the basic transaction to local state
        setTransactions([data, ...transactions])
        setFilteredTransactions([data, ...transactions])
        setIsCreateOpen(false)
        return
      }

      // Format the new transaction
      const formattedTransaction = {
        ...fullTransaction,
        categoryName: fullTransaction.categories?.name || 'Uncategorized',
        categoryColor: fullTransaction.categories?.color || '#8884d8',
        budgetName: fullTransaction.budgets?.name || null,
        parsedTags: fullTransaction.tags ? fullTransaction.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
      }

      // Update local state
      const updatedTransactions = [formattedTransaction, ...transactions]
      setTransactions(updatedTransactions)
      setFilteredTransactions(updatedTransactions)
      setIsCreateOpen(false)

      // Update budget spent amount if budget is selected and it's an expense
      if (budgetId && budgetId !== "none" && type === 'expense') {
        updateBudgetSpentAmount(budgetId, Math.abs(amount))
      }

      alert('Transaction created successfully!')
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('An unexpected error occurred')
    }
  }

  // NEW: Handle editing transactions
  const handleEditTransaction = async (formData: FormData) => {
    if (!user?.id || !editingTransaction) return

    const amount = Number.parseFloat(formData.get("amount") as string)
    const type = formData.get("type") as string
    const categoryId = formData.get("category") as string
    const budgetId = formData.get("budget") as string
    const description = formData.get("description") as string
    const date = formData.get("date") as string
    const notes = formData.get("notes") as string || ""
    const tags = (formData.get("tags") as string || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .join(",") // Store as comma-separated string

    // Validate required fields
    if (!description || !amount || !type || !categoryId || !date) {
      alert('Please fill in all required fields')
      return
    }

    const updatedTransaction = {
      description: description.trim(),
      amount: type === "expense" ? -Math.abs(amount) : Math.abs(amount),
      category_id: categoryId,
      budget_id: budgetId === "none" || !budgetId ? null : budgetId,
      type: type,
      date: date,
      notes: notes.trim(),
      tags: tags || null,
    }

    console.log('Updating transaction with data:', updatedTransaction)

    try {
      // Calculate budget adjustments
      const oldTransaction = editingTransaction
      const oldBudgetId = oldTransaction.budget_id
      const newBudgetId = updatedTransaction.budget_id
      const oldAmount = Math.abs(oldTransaction.amount)
      const newAmount = Math.abs(amount)

      // Update the transaction
      const { data, error } = await supabase
        .from('transactions')
        .update(updatedTransaction)
        .eq('id', editingTransaction.id)
        .eq('user_id', user.id) // Security check
        .select()
        .single()

      if (error) {
        console.error('Supabase error details:', error)
        alert(`Failed to update transaction: ${error.message}`)
        return
      }

      console.log('Transaction updated successfully:', data)

      // Fetch the complete updated transaction with related data
      const { data: fullTransaction, error: fetchError } = await supabase
        .from('transactions')
        .select(`
          *,
          categories(name, color),
          budgets(name)
        `)
        .eq('id', data.id)
        .single()

      if (fetchError) {
        console.error('Error fetching full transaction:', fetchError)
        // Still update with basic data
        const updatedTransactions = transactions.map(t => 
          t.id === editingTransaction.id ? { ...t, ...data } : t
        )
        setTransactions(updatedTransactions)
        setFilteredTransactions(updatedTransactions)
        setEditingTransaction(null)
        return
      }

      // Format the updated transaction
      const formattedTransaction = {
        ...fullTransaction,
        categoryName: fullTransaction.categories?.name || 'Uncategorized',
        categoryColor: fullTransaction.categories?.color || '#8884d8',
        budgetName: fullTransaction.budgets?.name || null,
        parsedTags: fullTransaction.tags ? fullTransaction.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
      }

      // Update local state
      const updatedTransactions = transactions.map(t => 
        t.id === editingTransaction.id ? formattedTransaction : t
      )
      setTransactions(updatedTransactions)
      setFilteredTransactions(updatedTransactions)
      setEditingTransaction(null)

      // Handle budget adjustments for expense transactions
      if (type === 'expense') {
        // Remove old amount from old budget if it exists
        if (oldBudgetId && oldTransaction.type === 'expense') {
          updateBudgetSpentAmount(oldBudgetId, -oldAmount)
        }
        
        // Add new amount to new budget if it exists
        if (newBudgetId) {
          updateBudgetSpentAmount(newBudgetId, newAmount)
        }
      }

      alert('Transaction updated successfully!')
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('An unexpected error occurred')
    }
  }

  const updateBudgetSpentAmount = async (budgetId: string, amount: number) => {
    try {
      // Get current budget
      const { data: budget, error: fetchError } = await supabase
        .from('budgets')
        .select('spent_amount')
        .eq('id', budgetId)
        .single()

      if (fetchError) {
        console.error('Error fetching budget:', fetchError)
        return
      }

      // Update spent amount
      const newSpentAmount = (budget.spent_amount || 0) + amount
      const { error: updateError } = await supabase
        .from('budgets')
        .update({ spent_amount: newSpentAmount })
        .eq('id', budgetId)

      if (updateError) {
        console.error('Error updating budget:', updateError)
      }
    } catch (error) {
      console.error('Error updating budget spent amount:', error)
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    try {
      const transaction = transactions.find(t => t.id === id)
      
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id) // Security check

      if (error) {
        console.error('Error deleting transaction:', error)
        alert('Failed to delete transaction')
        return
      }

      // Update budget spent amount if it was an expense with a budget
      if (transaction?.budget_id && transaction.type === 'expense') {
        updateBudgetSpentAmount(transaction.budget_id, -Math.abs(transaction.amount))
      }

      // Remove from local state
      const updatedTransactions = transactions.filter((t) => t.id !== id)
      setTransactions(updatedTransactions)
      setFilteredTransactions(updatedTransactions)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to delete transaction')
    }
  }

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = Math.abs(transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0))

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading transactions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-gray-600 dark:text-gray-400">Track and manage all your financial transactions</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
              <DialogDescription>Record a new income or expense transaction</DialogDescription>
            </DialogHeader>
            <form action={handleCreateTransaction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="e.g., Grocery Store" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select name="type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" name="date" type="date" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (Optional)</Label>
                <Select name="budget">
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Budget</SelectItem>
                    {budgets.map((budget) => (
                      <SelectItem key={budget.id} value={budget.id}>
                        {budget.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea id="notes" name="notes" placeholder="Additional details..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (Optional)</Label>
                <Input id="tags" name="tags" placeholder="e.g., groceries, weekly (comma-separated)" />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Transaction</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* NEW: Edit Transaction Dialog */}
      <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>Update transaction details</DialogDescription>
          </DialogHeader>
          {editingTransaction && (
            <form action={handleEditTransaction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input 
                  id="edit-description" 
                  name="description" 
                  placeholder="e.g., Grocery Store" 
                  defaultValue={editingTransaction.description}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-amount">Amount</Label>
                  <Input 
                    id="edit-amount" 
                    name="amount" 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00"
                    defaultValue={Math.abs(editingTransaction.amount)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Type</Label>
                  <Select name="type" defaultValue={editingTransaction.type} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select name="category" defaultValue={editingTransaction.category_id} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input 
                    id="edit-date" 
                    name="date" 
                    type="date" 
                    defaultValue={editingTransaction.date}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-budget">Budget (Optional)</Label>
                <Select name="budget" defaultValue={editingTransaction.budget_id || "none"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Budget</SelectItem>
                    {budgets.map((budget) => (
                      <SelectItem key={budget.id} value={budget.id}>
                        {budget.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes (Optional)</Label>
                <Textarea 
                  id="edit-notes" 
                  name="notes" 
                  placeholder="Additional details..."
                  defaultValue={editingTransaction.notes || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags (Optional)</Label>
                <Input 
                  id="edit-tags" 
                  name="tags" 
                  placeholder="e.g., groceries, weekly (comma-separated)"
                  defaultValue={editingTransaction.parsedTags ? editingTransaction.parsedTags.join(', ') : ''}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditingTransaction(null)}>
                  Cancel
                </Button>
                <Button type="submit">Update Transaction</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              ${(totalIncome - totalExpenses).toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Income - Expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search transactions..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {sortOrder === "asc" ? "Ascending" : "Descending"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-3 h-3 rounded-full ${transaction.type === "income" ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <div className="space-y-1">
                    <p className="font-medium">{transaction.description}</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: transaction.categoryColor }}
                        />
                        <Badge variant="outline" className="text-xs">
                          {transaction.categoryName}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{transaction.date}</span>
                      {transaction.budgetName && (
                        <Badge variant="secondary" className="text-xs">
                          {transaction.budgetName}
                        </Badge>
                      )}
                    </div>
                    {transaction.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.notes}</p>
                    )}
                    {transaction.parsedTags && transaction.parsedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {transaction.parsedTags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className={`font-medium ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {transaction.type === "income" ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditingTransaction(transaction)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteTransaction(transaction.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTransactions.length === 0 && transactions.length > 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No transactions found matching your criteria.</p>
            </div>
          )}

          {transactions.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Plus className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No transactions yet</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                Start by adding your first transaction to track your income and expenses.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Transaction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}