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
    if (!user) {
      setLoading(false)
      return // Don't set error when user is not logged in, this is a normal state
    }

    try {
      setLoading(true)
      setError(null) // Clear any previous errors
      
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("name")

      if (error) {
        console.error("Database error:", error)
        setError(error.message)
        return
      }

      setCategories(data || [])
    } catch (err: any) {
      console.error("Error in fetchCategories:", err)
      setError(err.message || "Failed to load categories")
      setCategories([]) // Reset categories on error
    } finally {
      setLoading(false)
    }
  }

  const createCategory = async (categoryData: Omit<Category, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) {
      const error = new Error('You must be logged in to create a category')
      setError(error.message)
      throw error
    }

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert([{ 
          ...categoryData, 
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      
      if (!data) {
        throw new Error('Failed to create category')
      }

      setCategories((prev) => [...prev, data])
      setError(null) // Clear any previous errors
      return data
    } catch (err: any) {
      const message = err.message || 'Failed to create category'
      setError(message)
      throw new Error(message)
    }
  }

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    if (!user) {
      const error = new Error('You must be logged in to update a category')
      setError(error.message)
      throw error
    }

    try {
      const { data, error } = await supabase
        .from("categories")
        .update({ 
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .eq("user_id", user.id) // Ensure user owns the category
        .select()
        .single()

      if (error) throw error
      
      if (!data) {
        throw new Error('Category not found or access denied')
      }

      setCategories((prev) => prev.map((cat) => (cat.id === id ? data : cat)))
      setError(null) // Clear any previous errors
      return data
    } catch (err: any) {
      const message = err.message || 'Failed to update category'
      setError(message)
      throw new Error(message)
    }
  }

  const deleteCategory = async (id: string) => {
    if (!user) {
      const error = new Error('You must be logged in to delete a category')
      setError(error.message)
      throw error
    }

    try {
      // First check if the category exists and belongs to the user
      const { data: category, error: fetchError } = await supabase
        .from("categories")
        .select()
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

      if (fetchError || !category) {
        throw new Error('Category not found or access denied')
      }

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id) // Ensure user owns the category

      if (error) throw error

      setCategories((prev) => prev.filter((cat) => cat.id !== id))
      setError(null) // Clear any previous errors
    } catch (err: any) {
      const message = err.message || 'Failed to delete category'
      setError(message)
      throw new Error(message)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

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
