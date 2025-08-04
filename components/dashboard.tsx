"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown, Wallet, Target, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export function Dashboard() {
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryData, setCategoryData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [budgetAlerts, setBudgetAlerts] = useState([])

  const { user } = useAuth()

  // Load all user data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return

      setLoading(true)
      try {
        // Load transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })

        // Load budgets
        const { data: budgetsData, error: budgetsError } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id)

        // Load categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)

        if (transactionsError) console.error('Error loading transactions:', transactionsError)
        if (budgetsError) console.error('Error loading budgets:', budgetsError)
        if (categoriesError) console.error('Error loading categories:', categoriesError)

        const allTransactions = transactionsData || []
        const allBudgets = budgetsData || []
        const allCategories = categoriesData || []

        setTransactions(allTransactions)
        setBudgets(allBudgets)
        setCategories(allCategories)

        // Process data for charts and summaries
        processTransactionData(allTransactions, allCategories, allBudgets)
        
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user?.id])

  // Process data for dashboard displays
  const processTransactionData = (allTransactions, allCategories, allBudgets) => {
    // Recent transactions (last 5)
    setRecentTransactions(allTransactions.slice(0, 5))

    // Category spending data for pie chart
    const categorySpending = {}
    const expenseTransactions = allTransactions.filter(t => t.type === 'expense')
    
    expenseTransactions.forEach(transaction => {
      const categoryName = transaction.category || 'Other'
      categorySpending[categoryName] = (categorySpending[categoryName] || 0) + Math.abs(transaction.amount)
    })

    const categoryChartData = Object.entries(categorySpending).map(([name, value], index) => {
      const category = allCategories.find(c => c.name === name)
      return {
        name,
        value: value as number,
        color: category?.color || `hsl(${index * 45}, 70%, 50%)`
      }
    }).slice(0, 5) // Top 5 categories

    setCategoryData(categoryChartData)

    // Monthly trends (last 6 months)
    const monthlyTrends = {}
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    allTransactions.forEach(transaction => {
      const date = new Date(transaction.date)
      if (date >= sixMonthsAgo) {
        const monthKey = date.toISOString().slice(0, 7) // YYYY-MM format
        if (!monthlyTrends[monthKey]) {
          monthlyTrends[monthKey] = { income: 0, expenses: 0 }
        }
        
        if (transaction.type === 'income') {
          monthlyTrends[monthKey].income += transaction.amount
        } else {
          monthlyTrends[monthKey].expenses += Math.abs(transaction.amount)
        }
      }
    })

    const monthlyChartData = Object.entries(monthlyTrends)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Last 6 months
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
        income: (data as any).income,
        expenses: (data as any).expenses,
        savings: (data as any).income - (data as any).expenses
      }))

    setMonthlyData(monthlyChartData)

    // Budget alerts
    const alerts = allBudgets.map(budget => {
      const spent = budget.spent_amount || 0
      const limit = budget.total_amount || 0
      const percentage = limit > 0 ? (spent / limit) * 100 : 0
      
      return {
        category: budget.name,
        spent,
        limit,
        percentage
      }
    }).filter(alert => alert.percentage > 75) // Only show budgets over 75%

    setBudgetAlerts(alerts)
  }

  // Calculate totals
  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentMonthTransactions = transactions.filter(t => 
    t.date && t.date.startsWith(currentMonth)
  )
  
  const totalIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
    
  const totalExpenses = Math.abs(currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0))
    
  const totalSavings = totalIncome - totalExpenses

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's your financial overview.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalSavings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ${totalSavings.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Budgets</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgets.length}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {budgetAlerts.length} need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Your expenses breakdown for this month</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ChartContainer
                config={{
                  value: {
                    label: "Amount",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <p>No expense data available</p>
                  <p className="text-sm">Add some transactions to see the breakdown</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Income vs Expenses over time</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ChartContainer
                config={{
                  income: {
                    label: "Income",
                    color: "hsl(var(--chart-1))",
                  },
                  expenses: {
                    label: "Expenses",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="income" fill="#22c55e" />
                    <Bar dataKey="expenses" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <p>No transaction history available</p>
                  <p className="text-sm">Add some transactions to see trends</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${transaction.type === 'income' ? "bg-green-500" : "bg-red-500"}`} />
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${transaction.type === 'income' ? "text-green-600" : "text-red-600"}`}>
                        {transaction.type === 'income' ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent transactions</p>
                  <p className="text-sm">Your transactions will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Budget Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Budget Alerts</span>
            </CardTitle>
            <CardDescription>Categories approaching or exceeding limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgetAlerts.length > 0 ? (
                budgetAlerts.map((alert, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{alert.category}</span>
                      <Badge
                        variant={alert.percentage > 100 ? "destructive" : alert.percentage > 90 ? "secondary" : "default"}
                      >
                        {alert.percentage.toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Progress value={Math.min(alert.percentage, 100)} className="h-2" />
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>${alert.spent.toLocaleString()} spent</span>
                        <span>${alert.limit.toLocaleString()} limit</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No budget alerts</p>
                  <p className="text-sm">All budgets are on track</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}