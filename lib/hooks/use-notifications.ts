import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export interface NotificationPreferences {
  budgetAlerts: boolean
  transactionReminders: boolean
  weeklyReports: boolean
  monthlyReports: boolean
  emailNotifications: boolean
  pushNotifications: boolean
}

export interface NotificationSettings {
  user_id: string
  preferences: NotificationPreferences
}

export function useNotifications() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    budgetAlerts: false,
    transactionReminders: false,
    weeklyReports: false,
    monthlyReports: false,
    emailNotifications: false,
    pushNotifications: false
  })

  useEffect(() => {
    loadNotificationPreferences()
  }, [])

  const loadNotificationPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { data, error } = await supabase
        .from('notification_settings')
        .select('preferences')
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      if (data) {
        setNotifications(data.preferences)
      }
    } catch (err) {
      console.error('Error loading notification preferences:', err)
      setError('Failed to load notification preferences')
    } finally {
      setLoading(false)
    }
  }

  const updateNotificationPreferences = async (preferences: NotificationPreferences) => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          preferences: preferences
        })

      if (error) throw error

      setNotifications(preferences)
      return { success: true }
    } catch (err) {
      console.error('Error updating notification preferences:', err)
      setError('Failed to update notification preferences')
      return { success: false, error: err }
    } finally {
      setLoading(false)
    }
  }

  return {
    notifications,
    setNotifications: updateNotificationPreferences,
    loading,
    error
  }
}
