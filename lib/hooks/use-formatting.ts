import { useProfile } from './use-profile'
import { format, startOfWeek } from 'date-fns'

export function useFormatting() {
  const { profile, loading } = useProfile()

  const formatCurrency = (amount: number) => {
    // Ensure we have a valid currency, even while loading
    const currency = profile?.currency || 'USD'
    const locale = profile?.language || 'en-US'

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
      }).format(amount)
    } catch (error) {
      // Fallback to basic USD formatting if there's an error
      console.warn('Error formatting currency:', error)
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)
    }
  }

  const formatDate = (date: Date | string) => {
    if (!date) return ''
    
    try {
      const dateFormat = (profile?.date_format || 'MM/dd/yyyy').toLowerCase()
      const dateObj = typeof date === 'string' ? new Date(date) : date
      return format(dateObj, dateFormat)
    } catch (error) {
      console.warn('Error formatting date:', error)
      return new Date(date).toLocaleDateString()
    }
  }

  const getWeekStart = (date: Date = new Date()) => {
    const weekStartsOn = (profile?.week_start_day || 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6
    return startOfWeek(date, { weekStartsOn })
  }

  return {
    formatCurrency,
    formatDate,
    getWeekStart,
    currency: profile?.currency || 'USD',
    dateFormat: profile?.date_format || 'MM/DD/YYYY',
    weekStartDay: profile?.week_start_day || 1
  }
}
