"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"

export interface Budget {
  id: string
  user_id: string
  name: string
  type: "monthly" | "goal" | "event" | "savings"
  total_amount: number
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  const fetchBudgets = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setBudgets(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createBudget = async (budgetData: Omit<Budget, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("budgets")
        .insert([{ ...budgetData, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      setBudgets((prev) => [data, ...prev])
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    try {
      const { data, error } = await supabase.from("budgets").update(updates).eq("id", id).select().single()

      if (error) throw error
      setBudgets((prev) => prev.map((budget) => (budget.id === id ? data : budget)))
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteBudget = async (id: string) => {
    try {
      const { error } = await supabase.from("budgets").delete().eq("id", id)

      if (error) throw error
      setBudgets((prev) => prev.filter((budget) => budget.id !== id))
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  useEffect(() => {
    fetchBudgets()
  }, [user?.id]) // Only depend on user.id, not the whole user object

  return {
    budgets,
    loading,
    error,
    createBudget,
    updateBudget,
    deleteBudget,
    refetch: fetchBudgets,
  }
}
