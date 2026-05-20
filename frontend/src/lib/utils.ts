import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amountBani: number, currency = 'RON'): string {
  const amount = amountBani / 100
  return new Intl.NumberFormat('ro-RO', {
    style:    'currency',
    currency: currency === 'RON' ? 'RON' : currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function timeAgo(date: string | Date): string {
  const rtf = new Intl.RelativeTimeFormat('ro', { numeric: 'auto' })
  const seconds = Math.round((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60)    return 'Acum'
  if (seconds < 3600)  return rtf.format(-Math.floor(seconds / 60), 'minutes')
  if (seconds < 86400) return rtf.format(-Math.floor(seconds / 3600), 'hours')
  return rtf.format(-Math.floor(seconds / 86400), 'days')
}
