"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  type: "income" | "expense"
  monthly_limit: number
  alert_enabled: boolean
  alert_threshold: number
  created_at: string
  updated_at: string
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  const fetchCategories = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase.from("categories").select("*").eq("user_id", user.id).order("name")

      if (error) throw error
      setCategories(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createCategory = async (categoryData: Omit<Category, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert([{ ...categoryData, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      setCategories((prev) => [...prev, data])
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const { data, error } = await supabase.from("categories").update(updates).eq("id", id).select().single()

      if (error) throw error
      setCategories((prev) => prev.map((cat) => (cat.id === id ? data : cat)))
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id)

      if (error) throw error
      setCategories((prev) => prev.filter((cat) => cat.id !== id))
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [user])

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  }
}
