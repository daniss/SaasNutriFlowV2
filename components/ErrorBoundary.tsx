"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Home, Mail, RefreshCw } from 'lucide-react'
import React from 'react'

// Declare gtag function for Google Analytics
declare global {
  interface Window {
    gtag?: (command: string, targetId: string, config?: Record<string, any>) => void
  }
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  errorInfo?: React.ErrorInfo
}

// Default error fallback component
function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-gray-900">
            Oops ! Une erreur s'est produite
          </CardTitle>
          <CardDescription className="text-lg">
            Nous nous excusons pour ce désagrément. Une erreur inattendue s'est produite.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isDev && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">Détails de l'erreur (mode développement) :</h4>
              <pre className="text-sm text-red-700 whitespace-pre-wrap overflow-auto max-h-32">
                {error.message}
                {error.stack}
              </pre>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Que pouvez-vous faire ?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Rechargez la page pour réessayer</li>
              <li>• Vérifiez votre connexion internet</li>
              <li>• Essayez de revenir à la page d'accueil</li>
              <li>• Si le problème persiste, contactez notre support</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={resetError}
              className="flex-1"
              size="lg"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1"
              size="lg"
            >
              <Home className="h-4 w-4 mr-2" />
              Accueil
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = 'mailto:support@nutriflow.com?subject=Erreur Application&body=Une erreur s\'est produite dans l\'application NutriFlow.'}
              className="flex-1"
              size="lg"
            >
              <Mail className="h-4 w-4 mr-2" />
              Support
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600 pt-4 border-t">
            <p>
              Cette erreur a été automatiquement signalée à notre équipe technique.
              <br />
              Nous travaillons à résoudre le problème.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              ID d'erreur: {error.name}_{Date.now().toString(36)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main Error Boundary Class Component
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to monitoring service in production
    this.logErrorToService(error, errorInfo)
  }

  private logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // In production, send to error monitoring service like Sentry
    console.error('Error Boundary caught an error:', error, errorInfo)
    
    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: true,
        error_boundary: true
      })
    }

    // Send to custom error tracking
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          },
          errorInfo,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(err => console.error('Failed to log error:', err))
    }
  }

  private resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo}
        />
      )
    }

    return this.props.children
  }
}

// Hook for functional component error boundaries
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}

// HOC to wrap components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Async error catcher
export function catchAsyncErrors<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return ((...args: any[]) => {
    const result = fn(...args)
    if (result && typeof result.catch === 'function') {
      return result.catch((error: Error) => {
        console.error('Async error caught:', error)
        // Re-throw to be caught by error boundary
        setTimeout(() => {
          throw error
        }, 0)
        return Promise.reject(error)
      })
    }
    return result
  }) as T
}

export default ErrorBoundary
