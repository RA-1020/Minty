"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useFormatting } from "@/lib/hooks/use-formatting"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown, Wallet, Target, AlertTriangle, Brain, Lightbulb } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

// Smart Insights Generator Function - AI Powered
const generateAIInsights = async (allTransactions: any[], allCategories: any[], allBudgets: any[]) => {
  try {
    const financialData = {
      transactions: allTransactions,
      categories: allCategories,
      budgets: allBudgets,
      summary: {
        totalIncome: allTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0),
        totalExpenses: allTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0),
        transactionCount: allTransactions.length
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch('/api/smart-insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        financialData
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to fetch AI insights: ${response.status}`)
    }

    const data = await response.json()
    return data.insights || []
  } catch (error) {
    console.error('Error generating AI insights:', error)
    
    // Check if it's a timeout error
    const isTimeout = error.name === 'AbortError'
    
    // Fallback insights if API fails
    return [
      {
        type: 'tip',
        icon: isTimeout ? '⏱️' : '🤖',
        title: isTimeout ? 'AI Analysis Timeout' : 'AI Insights Temporarily Unavailable',
        description: isTimeout ? 
          'AI analysis is taking longer than expected' : 
          'Unable to connect to AI service for personalized insights',
        actionTip: isTimeout ? 
          'Your dashboard is ready! AI insights will load when available' : 
          'Check your internet connection and try refreshing the page',
        trend: 'info',
        interactive: false,
        category: null
      }
    ]
  }
}

export function Dashboard() {
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryData, setCategoryData] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [budgetAlerts, setBudgetAlerts] = useState([])
  const [smartInsights, setSmartInsights] = useState([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  
  const { formatCurrency, formatDate } = useFormatting()
  const { user } = useAuth()

  // Load all user data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return

      setLoading(true)
      try {
        // Load transactions - try basic query first, then enhance if needed
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })

        // Load budgets - try without category join first to avoid foreign key issues
        const { data: budgetsData, error: budgetsError } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id)

        // Load categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)

        if (transactionsError) {
          console.error('Error loading transactions:', transactionsError)
          console.error('Transactions error details:', JSON.stringify(transactionsError, null, 2))
        }
        if (budgetsError) {
          console.error('Error loading budgets:', budgetsError)
          console.error('Budgets error details:', JSON.stringify(budgetsError, null, 2))
        }
        if (categoriesError) {
          console.error('Error loading categories:', categoriesError)
          console.error('Categories error details:', JSON.stringify(categoriesError, null, 2))
        }

        // Don't let one failed query stop the entire process
        const allTransactions = transactionsData || []
        const allBudgets = budgetsData || []
        const allCategories = categoriesData || []

        console.log('Loaded data counts:', {
          transactions: allTransactions.length,
          budgets: allBudgets.length,
          categories: allCategories.length
        })

        setTransactions(allTransactions)
        setBudgets(allBudgets)
        setCategories(allCategories)

        // Only process data if we have at least some data
        if (allTransactions.length > 0 || allCategories.length > 0) {
          await processTransactionData(allTransactions, allCategories, allBudgets)
        } else {
          console.log('No data to process - skipping processTransactionData')
        }
        
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user?.id])

  // Load AI insights separately to avoid blocking the dashboard
  useEffect(() => {
    const loadAIInsights = async () => {
      // Only load insights if we have data and user is authenticated
      if (!user?.id || transactions.length === 0) return
      
      setInsightsLoading(true)
      try {
        console.log('Generating AI insights...')
        const insights = await generateAIInsights(transactions, categories, budgets)
        console.log('Generated insights:', insights)
        setSmartInsights(insights)
      } catch (error) {
        console.error('Error generating insights:', error)
        setSmartInsights([{
          type: 'tip',
          icon: '⚠️',
          title: 'Unable to Load AI Insights',
          description: 'There was an error generating personalized insights',
          actionTip: 'Please refresh the page to try again',
          trend: 'info',
          interactive: false
        }])
      } finally {
        setInsightsLoading(false)
      }
    }

    // Delay AI loading by 2 seconds to let dashboard render first
    const timeoutId = setTimeout(() => {
      loadAIInsights()
    }, 2000)

    return () => clearTimeout(timeoutId)
  }, [user?.id, transactions.length, categories.length, budgets.length])

  // Process data for dashboard displays
  const processTransactionData = async (allTransactions, allCategories, allBudgets) => {
    try {
      console.log('=== DEBUGGING DASHBOARD DATA ===')
      console.log('Total transactions loaded:', allTransactions.length)
      console.log('Total categories loaded:', allCategories.length)
      console.log('Total budgets loaded:', allBudgets.length)
    
    // Debug category mapping
    const debugCategoryMapping = () => {
      console.log('Categories available:', allCategories.map(c => ({ id: c.id, name: c.name })))
      
      const uncategorized = allTransactions.filter(t => {
        const hasCategory = allCategories.find(c => c.id === t.category_id)
        return !hasCategory && t.type === 'expense'
      })
      
      console.log('Uncategorized transactions:', uncategorized.length)
      console.log('Sample uncategorized:', uncategorized.slice(0, 3).map(t => ({
        id: t.id,
        description: t.description,
        category_id: t.category_id,
        amount: t.amount
      })))
    }
    
    debugCategoryMapping()
    
    // Recent transactions (last 5)
    setRecentTransactions(allTransactions.slice(0, 5))

    // Current month data - determine current month dynamically
    const currentDate = new Date()
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    console.log('Using current month:', currentMonth)
    
    const categorySpending = {}
    const currentMonthExpenses = allTransactions.filter(t => 
      t.type === 'expense' && 
      t.date && 
      t.date.startsWith(currentMonth) &&
      t.amount && !isNaN(Number(t.amount))
    )
    
    console.log('Real current month expenses:', currentMonthExpenses.length)
    
    currentMonthExpenses.forEach(transaction => {
      // First try to find category by ID
      let category = allCategories.find(c => c.id === transaction.category_id)
      
      // If not found but transaction has nested category data, use that
      if (!category && transaction.categories) {
        category = transaction.categories
      }
      
      const categoryName = category?.name || 'Uncategorized'
      
      console.log('Transaction:', transaction.description, 'Category ID:', transaction.category_id, 'Found Category:', category?.name || 'None')
      
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

    // Budget alerts - use the spent amounts already calculated in budgets
    const budgetAlertsData = []
    for (const budget of allBudgets) {
      const budgetCategory = allCategories.find(c => c.id === budget.category_id)
      const spent = Math.abs(budget.spent_amount || 0) // Use the spent amount from budget record
      const limit = budget.total_amount || 0
      const percentage = limit > 0 ? (spent / limit) * 100 : 0
      
      if (percentage > 75) { // Only show budgets over 75%
        budgetAlertsData.push({
          category: budgetCategory?.name || budget.name,
          spent,
          limit,
          percentage
        })
      }
    }

    setBudgetAlerts(budgetAlertsData)
  } catch (error) {
    console.error('Error processing transaction data:', error)
    setInsightsLoading(false)
  }
}

  // Calculate totals for current month
  const getCurrentMonthData = () => {
    const currentDate = new Date()
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    
    const currentMonthTransactions = transactions.filter(t => 
      t.date && t.date.startsWith(currentMonth)
    )
    
    const totalIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0)
      
    const totalExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0)
      
    const totalSavings = totalIncome - totalExpenses

    return { totalIncome, totalExpenses, totalSavings }
  }

  const { totalIncome, totalExpenses, totalSavings } = getCurrentMonthData()

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
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's your financial overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-tutorial="metrics">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-tutorial="charts">
        <Card data-tutorial="spending-chart">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Your expenses breakdown for this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              {categoryData && categoryData.length > 0 ? (
                <div className="w-full h-full flex flex-col">
                  
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

        
        <Card className="border-0 shadow-sm" data-tutorial="smart-insights">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Brain className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Smart Insights</CardTitle>
                <CardDescription className="text-sm text-gray-500">AI-powered recommendations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {insightsLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <div className="text-center space-y-3">
                  <div className="relative mx-auto w-8 h-8">
                    <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 rounded-full"></div>
                    <div className="absolute inset-0 w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">🧠 AI analyzing your financial patterns...</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">This may take a few seconds</p>
                </div>
              </div>
            ) : smartInsights.length > 0 ? (
              <div className="h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-2">
                <div className="space-y-3">
                  {smartInsights.map((insight, index) => (
                    <div 
                      key={index}
                      className="group p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200 cursor-pointer hover:shadow-sm"
                      style={{ 
                        animationDelay: `${index * 50}ms`,
                        opacity: 0,
                        animation: 'fadeInUp 0.4s ease-out forwards'
                      }}
                      onClick={() => {
                        if (insight.interactive) {
                          console.log('Clicked insight:', insight)
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        
                        <div className={`p-1.5 rounded-md flex-shrink-0 ${
                          insight.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/20' :
                          insight.type === 'success' || insight.type === 'achievement' ? 'bg-emerald-100 dark:bg-emerald-900/20' :
                          insight.type === 'goal' ? 'bg-blue-100 dark:bg-blue-900/20' :
                          insight.type === 'prediction' ? 'bg-purple-100 dark:bg-purple-900/20' :
                          'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          <span className="text-sm">{insight.icon}</span>
                        </div>
                        
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-base text-gray-900 dark:text-gray-100 leading-tight line-clamp-1">
                              {insight.title}
                            </h4>
                            {insight.trend === 'warning' && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                            {insight.trend === 'success' && <Target className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />}
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 leading-relaxed line-clamp-2">
                            {insight.description}
                          </p>
                          
                          
                          {insight.type === 'goal' && insight.progress && (
                            <div className="mb-2">
                              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                                <span className="text-sm">Progress</span>
                                <span className="text-sm">{insight.progress.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div 
                                  className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                                  style={{ width: `${Math.min(insight.progress, 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          
                          {insight.actionTip && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                              <div className="flex items-start gap-1.5">
                                <Lightbulb className="h-2.5 w-2.5 mt-0.5 text-gray-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">
                                  {insight.actionTip}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          
                          <div className="flex items-center gap-1.5 mt-2">
                            {insight.type === 'achievement' && (
                              <div className="px-1.5 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
                                <span className="text-sm font-medium text-white">Achievement</span>
                              </div>
                            )}
                            {insight.challenge && (
                              <div className="px-1.5 py-0.5 border border-orange-200 dark:border-orange-800 rounded-full">
                                <span className="text-sm text-orange-600 dark:text-orange-400">Challenge</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                
                {smartInsights.length > 4 && (
                  <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <button className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                      View {smartInsights.length - 4} more insights →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px]">
                <div className="text-center max-w-xs">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-gray-400" />
                  </div>
                  <h4 className="font-medium text-base text-gray-900 dark:text-gray-100 mb-1">Ready to analyze</h4>
                  <p className="text-sm text-gray-500 mb-3">Add transactions to unlock insights</p>
                  <div className="flex justify-center space-x-1">
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            
            <style jsx>{`
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              
              .line-clamp-1 {
                display: -webkit-box;
                -webkit-line-clamp: 1;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }
              
              .line-clamp-2 {
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }
              
              .scrollbar-thin {
                scrollbar-width: thin;
              }
              
              .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
                background-color: rgb(209 213 219);
                border-radius: 9999px;
              }
              
              .scrollbar-track-transparent::-webkit-scrollbar-track {
                background-color: transparent;
              }
              
              .scrollbar-thin::-webkit-scrollbar {
                width: 4px;
              }
            `}</style>
          </CardContent>
        </Card>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <Card data-tutorial="recent-transactions">
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

        
        
        <Card data-tutorial="budget-alerts">
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