"use client"

import { useEffect, useState } from 'react'
import { NotificationManager } from '../services/notification-manager'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'

const supabase = createClient()

export interface NotificationSettings {
  budgetAlerts: boolean
  transactionReminders: boolean
  weeklyReports: boolean
  monthlyReports: boolean
  emailNotifications: boolean
  pushNotifications: boolean
}

const defaultSettings: NotificationSettings = {
  budgetAlerts: false,
  transactionReminders: false,
  weeklyReports: false,
  monthlyReports: false,
  emailNotifications: false,
  pushNotifications: false
}

export function useNotificationSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = async () => {
    if (typeof window === 'undefined' || !user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // First check if settings exist
      const { data, error } = await supabase
        .from('notification_settings')
        .select('budget_alerts, transaction_reminders, weekly_reports, monthly_reports, email_notifications, push_notifications')
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create them
          const { data: newData, error: insertError } = await supabase
            .from('notification_settings')
            .insert({
              user_id: user.id,
              budget_alerts: false,
              transaction_reminders: false,
              weekly_reports: false,
              monthly_reports: false,
              email_notifications: false,
              push_notifications: false
            })
            .select()
            .single()

          if (insertError) throw insertError
          
          if (newData) {
            setSettings({
              budgetAlerts: newData.budget_alerts,
              transactionReminders: newData.transaction_reminders,
              weeklyReports: newData.weekly_reports,
              monthlyReports: newData.monthly_reports,
              emailNotifications: newData.email_notifications,
              pushNotifications: newData.push_notifications
            })
          } else {
            setSettings(defaultSettings)
          }
        } else {
          throw error
        }
      } else if (data) {
        // Convert snake_case to camelCase
        setSettings({
          budgetAlerts: data.budget_alerts,
          transactionReminders: data.transaction_reminders,
          weeklyReports: data.weekly_reports,
          monthlyReports: data.monthly_reports,
          emailNotifications: data.email_notifications,
          pushNotifications: data.push_notifications
        })
      }

      setError(null)
    } catch (err: any) {
      console.error('Error loading notification settings:', err)
      setError(err?.message || 'Failed to load notification settings')
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!user?.id) {
      throw new Error('Please sign in to update notification settings')
    }

    const previousSettings = { ...settings }
    try {
      // If enabling push notifications, request permission first
      if (newSettings.pushNotifications && !settings.pushNotifications) {
        if (NotificationManager.isSupported()) {
          const permission = await Notification.requestPermission()
          if (permission !== 'granted') {
            throw new Error('Notification permission denied')
          }
        }
      }

      const updatedSettings = { ...settings, ...newSettings }

      // Convert camelCase to snake_case for database
      const dbSettings = {
        budget_alerts: updatedSettings.budgetAlerts,
        transaction_reminders: updatedSettings.transactionReminders,
        weekly_reports: updatedSettings.weeklyReports,
        monthly_reports: updatedSettings.monthlyReports,
        email_notifications: updatedSettings.emailNotifications,
        push_notifications: updatedSettings.pushNotifications
      }

      // Update the record
      const { data: updateData, error: updateError } = await supabase
        .from('notification_settings')
        .update(dbSettings)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError
      
      if (updateData) {
        // Convert snake_case back to camelCase
        setSettings({
          budgetAlerts: updateData.budget_alerts,
          transactionReminders: updateData.transaction_reminders,
          weeklyReports: updateData.weekly_reports,
          monthlyReports: updateData.monthly_reports,
          emailNotifications: updateData.email_notifications,
          pushNotifications: updateData.push_notifications
        })
      }

      // Set the new settings immediately
      setSettings(updatedSettings)
      setError(null)
      return true
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to update notification settings'
      console.error('Error updating notification settings:', errorMessage)
      setSettings(previousSettings)
      setError(errorMessage)
      return false
    }
  }

  useEffect(() => {
    loadSettings()
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    settings,
    updateSettings,
    loading,
    error,
    isSupported: NotificationManager.isSupported()
  }
}
