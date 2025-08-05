"use client"

import { NotificationService } from './notification-service'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useMemo, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useNotificationSettings } from '@/lib/hooks/use-notification-settings'

interface Transaction {
  amount: number
  type: 'expense' | 'income'
  category_id: string
  date: string
}

interface Category {
  id: string
  name: string
}

export function useNotificationsListener() {
  const { user } = useAuth()
  const { settings } = useNotificationSettings()
  const notificationService = NotificationService.getInstance()
  const supabase = useMemo(() => createClient(), [])
  
  // Rate limiting mechanism
  const lastRequestTime = useRef(Date.now())
  const pendingRequests = useRef(new Set<string>())
  
  // Helper for rate-limited requests
  const executeWithRateLimit = useCallback(async <T>(
    key: string,
    action: () => Promise<T>
  ): Promise<T | null> => {
    if (pendingRequests.current.has(key)) {
      return null
    }

    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime.current
    const MINIMUM_DELAY = 2000 // 2 seconds minimum between requests

    if (timeSinceLastRequest < MINIMUM_DELAY) {
      await new Promise(resolve => 
        setTimeout(resolve, MINIMUM_DELAY - timeSinceLastRequest)
      )
    }

    pendingRequests.current.add(key)
    
    try {
      lastRequestTime.current = Date.now()
      return await action()
    } catch (error) {
      console.error(`Request failed for ${key}:`, error)
      return null
    } finally {
      pendingRequests.current.delete(key)
    }
  }, [])

  // Database access helpers
  const fetchTransactions = useCallback(async (
    startDate: Date,
    endDate?: Date,
    requestKey: string = 'fetch-transactions'
  ) => {
    return executeWithRateLimit(requestKey, async () => {
      const query = supabase
        .from('transactions')
        .select('amount,type,category_id,date')
        .eq('user_id', user?.id)
        .gte('date', startDate.toISOString())

      if (endDate) {
        query.lt('date', endDate.toISOString())
      }

      const { data } = await query
      return data || []
    })
  }, [supabase, user?.id, executeWithRateLimit])

  const getCategories = useCallback(async (categoryIds: string[]) => {
    if (categoryIds.length === 0) return []

    return executeWithRateLimit('fetch-categories', async () => {
      const { data } = await supabase
        .from('categories')
        .select('id,name')
        .in('id', categoryIds)
      return data || []
    })
  }, [supabase, executeWithRateLimit])

  // Notification handlers
  const handleBudgetUpdate = useCallback(async (budget: any) => {
    if (!settings?.budgetAlerts || !budget) return
    
    const totalAmount = budget.total_amount || 0
    const spentAmount = budget.spent_amount || 0
    const percentage = totalAmount > 0 ? (spentAmount / totalAmount) * 100 : 0

    if (percentage >= 80) {
      await executeWithRateLimit('budget-alert', () =>
        notificationService.sendBudgetAlert({
          name: budget.name,
          spent: spentAmount,
          limit: totalAmount
        })
      )
    }
  }, [settings?.budgetAlerts, notificationService, executeWithRateLimit])

  const handleTransactionReminder = useCallback(async () => {
    if (!settings?.transactionReminders || !user?.id) return

    const transactions = await fetchTransactions(
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      undefined,
      'transaction-reminder'
    )

    if (!transactions || transactions.length === 0) {
      await executeWithRateLimit('transaction-reminder', () =>
        notificationService.sendTransactionReminder()
      )
    }
  }, [
    settings?.transactionReminders,
    user?.id,
    fetchTransactions,
    notificationService,
    executeWithRateLimit
  ])

  const handleWeeklyReport = useCallback(async () => {
    if (!settings?.weeklyReports || !user?.id) return

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Fetch data with rate limiting
    const [currentWeekData, prevWeekData] = await Promise.all([
      fetchTransactions(weekAgo, undefined, 'weekly-current'),
      fetchTransactions(
        new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000),
        weekAgo,
        'weekly-previous'
      )
    ])

    if (!currentWeekData || !prevWeekData) return

    const totalSpent = currentWeekData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const prevWeekSpent = prevWeekData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const categorySpending = currentWeekData
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category_id] = (acc[t.category_id] || 0) + Math.abs(t.amount)
        return acc
      }, {} as Record<string, number>)

    const topCategoryId = Object.entries(categorySpending)
      .sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0]

    if (topCategoryId) {
      const categories = await getCategories([topCategoryId])
      const topCategory = categories[0]

      if (topCategory) {
        await executeWithRateLimit('weekly-report', () =>
          notificationService.sendWeeklyReport({
            totalSpent,
            topCategory: topCategory.name,
            comparedToLastWeek: prevWeekSpent ? 
              ((Number(totalSpent) - Number(prevWeekSpent)) / Number(prevWeekSpent)) * 100 : 0
          })
        )
      }
    }
  }, [
    settings?.weeklyReports,
    user?.id,
    fetchTransactions,
    getCategories,
    notificationService,
    executeWithRateLimit
  ])

  useEffect(() => {
    if (typeof window === 'undefined' || !user?.id || !settings?.pushNotifications) return

    // Set up realtime subscription with delay
    const setupRealtimeListener = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const budgetChannel = supabase
        .channel('budget_notifications')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'budgets',
            filter: `user_id=eq.${user.id}`,
          },
          payload => handleBudgetUpdate(payload.new)
        )
        .subscribe()

      return budgetChannel
    }

    let budgetChannel: any
    setupRealtimeListener().then(channel => {
      budgetChannel = channel
    })

    // Stagger interval starts
    const intervals = [
      {
        handler: handleTransactionReminder,
        interval: 24 * 60 * 60 * 1000,
        initialDelay: 5000
      },
      {
        handler: handleWeeklyReport,
        interval: 7 * 24 * 60 * 60 * 1000,
        initialDelay: 10000
      }
    ].map(({ handler, interval, initialDelay }) => {
      const timeoutId = setTimeout(handler, initialDelay)
      const intervalId = setInterval(handler, interval)
      return { timeoutId, intervalId }
    })

    // Cleanup
    return () => {
      if (budgetChannel) {
        supabase.removeChannel(budgetChannel)
      }
      intervals.forEach(({ timeoutId, intervalId }) => {
        clearTimeout(timeoutId)
        clearInterval(intervalId)
      })
    }
  }, [
    user?.id,
    settings?.pushNotifications,
    supabase,
    handleBudgetUpdate,
    handleTransactionReminder,
    handleWeeklyReport
  ])
}
