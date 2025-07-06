import { Loader2 } from 'lucide-react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function Loading({ size = 'md', text, className = '' }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`animate-spin text-emerald-600 ${sizeClasses[size]}`} />
      {text && (
        <span className={`text-gray-600 font-medium ${textSizeClasses[size]}`}>
          {text}
        </span>
      )}
    </div>
  )
}

export function PageLoading({ text = 'Chargement...' }: { text?: string }) {
  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-gray-50/50 via-white to-emerald-50/20 flex items-center justify-center">
      <Loading size="lg" text={text} />
    </div>
  )
}

export function InlineLoading({ text }: { text?: string }) {
  return <Loading size="sm" text={text} />
}
