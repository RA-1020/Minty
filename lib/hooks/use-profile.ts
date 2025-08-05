"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  currency: string
  date_format: string
  language: string
  theme: string
  timezone: string
  week_start_day: number
  notification_preferences: Record<string, any>
  created_at: string
  updated_at: string
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>({
    id: '',
    email: '',
    full_name: null,
    avatar_url: null,
    currency: 'USD',
    date_format: 'MM/dd/yyyy',
    language: 'en',
    theme: 'system',
    timezone: 'UTC',
    week_start_day: 1,
    notification_preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  const fetchProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single()

      if (error) throw error
      setProfile(data)
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateNotificationPreferences = async (preferences: Record<string, any>) => {
    return updateProfile({ notification_preferences: preferences })
  }

  useEffect(() => {
    fetchProfile()
  }, [user?.id]) // Only depend on user.id to prevent unnecessary re-renders

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateNotificationPreferences,
    refetch: fetchProfile,
  }
}
