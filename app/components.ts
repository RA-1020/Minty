import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

// Simple dynamic imports without type manipulation
export const DynamicDashboard = dynamic(
  () => import('@/components/dashboard').then(mod => mod.Dashboard), 
  { ssr: false }
)

export const DynamicBudgets = dynamic(
  () => import('@/components/budgets').then(mod => mod.Budgets), 
  { ssr: false }
)

export const DynamicTransactions = dynamic(
  () => import('@/components/transactions').then(mod => mod.Transactions), 
  { ssr: false }
)

export const DynamicCategories = dynamic(
  () => import('@/components/categories').then(mod => mod.Categories), 
  { ssr: false }
)

export const DynamicSettings = dynamic(
  () => import('@/components/settings'), 
  { ssr: false }
)
