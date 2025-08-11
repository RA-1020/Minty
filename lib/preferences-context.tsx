"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { format } from 'date-fns'

type PreferencesContextType = {
  currency: string
  currencySymbol: string
  dateFormat: string
  weekStartDay: number
  formatCurrency: (amount: number) => string
  formatDate: (date: Date | string) => string
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState({
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    weekStartDay: 1,
  })

  const currencySymbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF',
    CNY: '¥',
    INR: '₹',
    PKR: '₨',
    AED: 'د.إ',
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: preferences.currency,
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, preferences.dateFormat.toLowerCase())
  }

  return (
    <PreferencesContext.Provider
      value={{
        currency: preferences.currency,
        currencySymbol: currencySymbols[preferences.currency],
        dateFormat: preferences.dateFormat,
        weekStartDay: preferences.weekStartDay,
        formatCurrency,
        formatDate,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}
