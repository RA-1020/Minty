'use client'

import dynamic from 'next/dynamic'
import { LoadingSpinner } from '../components/ui/loading-spinner'

// Create loading components with descriptive messages
const createLoadingComponent = (componentName: string) => 
  () => <LoadingSpinner message={`Loading ${componentName}...`} />

// Dynamically import pages with descriptive loading states
export const DynamicDashboard = dynamic(
  () => import('../components/dashboard').then(mod => ({ default: mod.Dashboard })),
  { loading: createLoadingComponent('Dashboard'), ssr: false }
)

export const DynamicBudgets = dynamic(
  () => import('../components/budgets').then(mod => ({ default: mod.Budgets })),
  { loading: createLoadingComponent('Budgets'), ssr: false }
)

export const DynamicTransactions = dynamic(
  () => import('../components/transactions').then(mod => ({ default: mod.Transactions })),
  { loading: createLoadingComponent('Transactions'), ssr: false }
)

export const DynamicCategories = dynamic(
  () => import('../components/categories').then(mod => ({ default: mod.Categories })),
  { loading: createLoadingComponent('Categories'), ssr: false }
)

// Settings uses default export
export const DynamicSettings = dynamic(
  () => import('../components/settings'),
  { loading: createLoadingComponent('Settings'), ssr: false }
)
