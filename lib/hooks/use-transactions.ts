"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"

export interface Transaction {
  id: string
  user_id: string
  budget_id?: string
  category_id?: string
  description: string
  amount: number
  type: "income" | "expense"
  date: string
  notes?: string
  tags?: string[]
  created_at: string
  updated_at: string
  category?: {
    name: string
    color: string
  }
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  const fetchTransactions = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          category:categories(name, color)
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createTransaction = async (
    transactionData: Omit<Transaction, "id" | "user_id" | "created_at" | "updated_at" | "category">,
  ) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("transactions")
        .insert([{ ...transactionData, user_id: user.id }])
        .select(`
          *,
          category:categories(name, color)
        `)
        .single()

      if (error) throw error
      setTransactions((prev) => [data, ...prev])
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          category:categories(name, color)
        `)
        .single()

      if (error) throw error
      setTransactions((prev) => prev.map((transaction) => (transaction.id === id ? data : transaction)))
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id)

      if (error) throw error
      setTransactions((prev) => prev.filter((transaction) => transaction.id !== id))
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [user])

  return {
    transactions,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  }
}
