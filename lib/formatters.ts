/**
 * Formatting utility functions for consistent data display
 */

export const formatCurrency = (amount: number, currency = '€'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  
  return new Intl.DateTimeFormat('fr-FR', { ...defaultOptions, ...options }).format(dateObj)
}

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return "Hier"
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`
  
  return `Il y a ${Math.floor(diffDays / 365)} ans`
}

export const formatPhone = (phone: string): string => {
  if (!phone) return ''
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  
  // Format as French phone number if it looks like one
  if (digits.length === 10 && digits.startsWith('0')) {
    return digits.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
  }
  
  return phone
}

export const formatWeight = (weight: number, unit = 'kg'): string => {
  return `${weight.toFixed(1)} ${unit}`
}

export const formatHeight = (height: string): string => {
  if (!height) return ''
  
  // If it's already formatted (contains quotes), return as-is
  if (height.includes("'") || height.includes('"')) {
    return height
  }
  
  // If it's just a number, assume it's in cm and convert
  const num = parseFloat(height)
  if (!isNaN(num)) {
    const feet = Math.floor(num / 30.48)
    const inches = Math.round((num / 2.54) % 12)
    return `${feet}'${inches}"`
  }
  
  return height
}

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':')
  return `${hours}:${minutes}`
}
