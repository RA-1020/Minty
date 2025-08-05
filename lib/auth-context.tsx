"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

interface AuthContextType {
  user: User | null
  profile: any | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  updateProfile: (updates: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  // Memoize fetchProfile function
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching profile:", error)
        return
      }
      setProfile(data || null)
    } catch (error) {
      console.error("Error fetching profile:", error)
    }
  }, [supabase])

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)  // Set loading to false immediately after getting auth state
          
          // Fetch profile in the background
          if (session?.user) {
            fetchProfile(session.user.id)
          }
        }
      } catch (error) {
        console.error("Error getting session:", error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setUser(session?.user ?? null)
        setLoading(false)  // Update loading state immediately
        
        // Fetch profile in the background
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Now using the memoized fetchProfile from above

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('Starting signup for:', email)
      
      // ✅ SIMPLIFIED: Just do the basic signup, let Supabase handle profile creation
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        console.error('Signup error:', error)
        return { data, error }
      }

      console.log('Signup successful:', data.user?.id)
      
      // Don't try to create profile manually - let the database trigger handle it
      // or let the user confirm their email first
      
      return { data, error: null }
    } catch (error: any) {
      console.error("Signup exception:", error)
      return { data: null, error }
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updateProfile = async (updates: any) => {
    if (!user) return

    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id)

    if (error) throw error

    // Refresh profile
    await fetchProfile(user.id)
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}