import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  const loadCategories = async () => {
    if (!user?.id) {
      setCategories([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (fetchError) {
        console.error('Error loading categories:', fetchError)
        setError(fetchError.message)
        return
      }

      setCategories(data || [])
    } catch (err) {
      console.error('Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [user?.id])

  const createCategory = async (categoryData) => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          ...categoryData,
          user_id: user.id
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating category:', error)
        throw error
      }

      setCategories(prev => [...prev, data])
      return data
    } catch (err) {
      console.error('Error creating category:', err)
      throw err
    }
  }

  const updateCategory = async (id, updates) => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating category:', error)
        throw error
      }

      setCategories(prev => prev.map(cat => cat.id === id ? data : cat))
      return data
    } catch (err) {
      console.error('Error updating category:', err)
      throw err
    }
  }

  const deleteCategory = async (id) => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting category:', error)
        throw error
      }

      setCategories(prev => prev.filter(cat => cat.id !== id))
    } catch (err) {
      console.error('Error deleting category:', err)
      throw err
    }
  }

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: loadCategories
  }
}