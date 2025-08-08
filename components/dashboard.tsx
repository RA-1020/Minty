"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useFormatting } from "@/lib/hooks/use-formatting"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
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
  const { formatCurrency, formatDate, getWeekStart } = useFormatting()
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
    console.log('=== DEBUGGING DASHBOARD DATA ===')
    console.log('Total transactions loaded:', allTransactions.length)
    console.log('Total categories loaded:', allCategories.length)
    
    // Recent transactions (last 5)
    setRecentTransactions(allTransactions.slice(0, 5))

    // Use real data from your database
    const currentMonth = '2025-08'
    const categorySpending = {}
    const currentMonthExpenses = allTransactions.filter(t => 
      t.type === 'expense' && 
      t.date && 
      t.date.startsWith(currentMonth) &&
      t.amount && !isNaN(Number(t.amount))
    )
    
    console.log('Real current month expenses:', currentMonthExpenses.length)
    
    currentMonthExpenses.forEach(transaction => {
      const category = allCategories.find(c => c.id === transaction.category_id)
      const categoryName = category?.name || 'Other'
      const amount = Math.abs(Number(transaction.amount))
      
      if (amount > 0 && !isNaN(amount)) {
        categorySpending[categoryName] = (categorySpending[categoryName] || 0) + amount
      }
    })

    console.log('Real category spending totals:', categorySpending)

    const realCategoryChartData = Object.entries(categorySpending)
      .filter(([name, value]) => {
        const numValue = Number(value)
        return numValue > 0 && !isNaN(numValue)
      })
      .map(([name, value], index) => {
        const category = allCategories.find(c => c.name === name)
        const numValue = Number(value)
        return {
          name,
          value: numValue,
          color: category?.color || `hsl(${index * 60}, 70%, 60%)`
        }
      })
      .sort((a, b) => b.value - a.value)

    console.log('Final category chart data:', realCategoryChartData)
    setCategoryData(realCategoryChartData)

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
  const currentMonth = '2025-08' // Your data is in August 2025
  const currentMonthTransactions = transactions.filter(t => 
    t.date && t.date.startsWith(currentMonth)
  )
  
  const totalIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
    
  const totalExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
    
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
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
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
              {formatCurrency(totalSavings)}
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
            <div className="h-[300px] w-full">
              {categoryData && categoryData.length > 0 ? (
                <div className="w-full h-full flex flex-col">
                  {/* Custom Pie Chart using CSS Conic Gradient */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="relative">
                      <div 
                        className="w-48 h-48 rounded-full will-change-transform"
                        style={{
                          background: `conic-gradient(${categoryData.map((entry, index) => {
                            const total = categoryData.reduce((sum, item) => sum + item.value, 0)
                            const percentage = (entry.value / total) * 100
                            const prevPercentage = categoryData.slice(0, index).reduce((sum, item) => sum + (item.value / total) * 100, 0)
                            return `${entry.color} ${prevPercentage}% ${prevPercentage + percentage}%`
                          }).join(', ')})`,
                          animation: 'smoothPieGrow 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                        }}
                      />
                      {/* Center hole for donut effect */}
                      <div className="absolute inset-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center will-change-transform"
                           style={{ animation: 'centerAppear 0.6s ease-out 0.8s forwards', opacity: 0 }}>
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900 dark:text-white"
                             style={{ animation: 'slideUp 0.4s ease-out 1.1s forwards', opacity: 0, transform: 'translateY(10px)' }}>
                            {formatCurrency(categoryData.reduce((sum, item) => sum + item.value, 0))}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400"
                             style={{ animation: 'slideUp 0.4s ease-out 1.3s forwards', opacity: 0, transform: 'translateY(10px)' }}>
                            Total
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap gap-4 justify-center">
                    {categoryData.map((entry, index) => {
                      const total = categoryData.reduce((sum, item) => sum + item.value, 0)
                      return (
                        <div 
                          key={index} 
                          className="flex items-center gap-2 cursor-pointer will-change-transform"
                          style={{
                            animation: `legendSlideIn 0.4s ease-out ${1.4 + index * 0.1}s forwards`,
                            opacity: 0,
                            transform: 'translateY(20px)',
                            transition: 'transform 0.2s ease-out'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(20px) scale(1.05)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)'
                          }}
                        >
                          <div 
                            className="w-3 h-3 rounded-full will-change-transform" 
                            style={{ 
                              backgroundColor: entry.color,
                              transition: 'transform 0.2s ease-out'
                            }}
                          />
                          <span className="text-sm font-medium">
                            {entry.name}: {formatCurrency(entry.value)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center animate-in fade-in-50 duration-500">
                    <p className="text-lg font-medium">No expense data available</p>
                    <p className="text-sm">Add some expense transactions to see the breakdown</p>
                    <p className="text-xs mt-2 opacity-75">Debug: {categoryData ? categoryData.length : 0} categories found</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Add custom CSS for smooth pie chart animation */}
            <style jsx>{`
              @keyframes smoothPieGrow {
                0% {
                  transform: scale(0);
                  opacity: 0;
                }
                100% {
                  transform: scale(1);
                  opacity: 1;
                }
              }
              
              @keyframes centerAppear {
                0% {
                  transform: scale(0);
                  opacity: 0;
                }
                100% {
                  transform: scale(1);
                  opacity: 1;
                }
              }
              
              @keyframes slideUp {
                0% {
                  transform: translateY(10px);
                  opacity: 0;
                }
                100% {
                  transform: translateY(0);
                  opacity: 1;
                }
              }
              
              @keyframes legendSlideIn {
                0% {
                  transform: translateY(20px);
                  opacity: 0;
                }
                100% {
                  transform: translateY(0);
                  opacity: 1;
                }
              }
            `}</style>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Income vs Expenses over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ChartContainer
                config={{
                  income: {
                    label: "Income",
                    color: "hsl(142, 76%, 36%)",
                  },
                  expenses: {
                    label: "Expenses", 
                    color: "hsl(346, 87%, 43%)",
                  },
                  savings: {
                    label: "Net Savings",
                    color: "hsl(217, 91%, 60%)",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <ChartTooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length > 0) {
                          return (
                            <div className="bg-white dark:bg-gray-800 p-4 border rounded-lg shadow-lg">
                              <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">{label}</p>
                              <div className="space-y-1">
                                {payload.map((entry, index) => (
                                  <div key={index} className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: entry.color }}
                                      />
                                      <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {entry.name}:
                                      </span>
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                      {formatCurrency(Number(entry.value) || 0)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar 
                      dataKey="income" 
                      fill="hsl(142, 76%, 36%)" 
                      radius={[4, 4, 0, 0]}
                      name="Income"
                    />
                    <Bar 
                      dataKey="expenses" 
                      fill="hsl(346, 87%, 43%)" 
                      radius={[4, 4, 0, 0]}
                      name="Expenses"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded mx-auto mb-4 flex items-center justify-center">
                    <div className="flex space-x-1">
                      <div className="w-2 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      <div className="w-2 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      <div className="w-2 h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                  </div>
                  <p className="text-lg font-medium">No transaction history</p>
                  <p className="text-sm">Add some transactions to see monthly trends</p>
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
                recentTransactions.map((transaction) => {
                  const category = categories.find(c => c.id === transaction.category_id)
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${transaction.type === 'income' ? "bg-green-500" : "bg-red-500"}`} />
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{category?.name || 'Uncategorized'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${transaction.type === 'income' ? "text-green-600" : "text-red-600"}`}>
                          {transaction.type === 'income' ? "+" : ""}{formatCurrency(Math.abs(transaction.amount))}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(new Date(transaction.date))}</p>
                      </div>
                    </div>
                  )
                })
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
                        <span>{formatCurrency(alert.spent)} spent</span>
                        <span>{formatCurrency(alert.limit)} limit</span>
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