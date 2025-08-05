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
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('preferences')
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Create default settings for new user
          const { data: newData, error: insertError } = await supabase
            .from('notification_settings')
            .insert({
              user_id: user.id,
              preferences: defaultSettings
            })
            .select('preferences')
            .single()

          if (insertError) {
            throw insertError
          }

          setSettings(newData?.preferences || defaultSettings)
        } else {
          throw error
        }
      } else {
        setSettings(data?.preferences || defaultSettings)
      }

      setError(null)
    } catch (err: any) {
      console.error('Error loading notification settings:', err)
      setError(err?.message || 'Failed to load notification settings')
      setSettings(defaultSettings)
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

      const { data, error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          preferences: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .select('preferences')
        .single()

      if (error) {
        throw error
      }

      setSettings(data?.preferences || updatedSettings)
      setError(null)
      return true
    } catch (err: any) {
      console.error('Error updating notification settings:', err)
      setSettings(previousSettings)
      setError(err?.message || 'Failed to update notification settings')
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
