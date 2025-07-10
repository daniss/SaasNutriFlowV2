// Enhanced Error Handling and Loading States for NutriFlow
// Provides consistent error handling, loading states, and user feedback across the application

import React, { useEffect, useState } from 'react'
import { toast } from '@/hooks/use-toast'

export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: string
  context?: string | undefined
  severity: 'low' | 'medium' | 'high' | 'critical'
  user_message: string
  suggestions?: string[]
  retry_action?: () => void
}

export interface LoadingState {
  isLoading: boolean
  operation?: string
  progress?: number
  stage?: string
  estimated_duration?: number
}

export class ErrorHandler {
  private static instance: ErrorHandler
  private errors: Map<string, AppError> = new Map()
  private errorCallbacks: Array<(error: AppError) => void> = []

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  // Register error callback for global error handling
  onError(callback: (error: AppError) => void): void {
    this.errorCallbacks.push(callback)
  }

  // Handle different types of errors
  handleError(error: any, context?: string): AppError {
    const appError = this.createAppError(error, context)
    
    // Store error
    this.errors.set(appError.code, appError)
    
    // Notify callbacks
    this.errorCallbacks.forEach(callback => callback(appError))
    
    // Log error
    this.logError(appError)
    
    // Show user notification
    this.showErrorToast(appError)
    
    return appError
  }

  // Create structured error from any error type
  private createAppError(error: any, context?: string): AppError {
    const errorCode = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    let message = 'Une erreur inattendue s\'est produite'
    let userMessage = 'Une erreur s\'est produite. Veuillez réessayer.'
    let severity: AppError['severity'] = 'medium'
    let suggestions: string[] = []

    // Handle different error types
    if (error?.message) {
      message = error.message
    }

    if (error?.code) {
      const errorInfo = this.getErrorInfo(error.code)
      userMessage = errorInfo.userMessage
      severity = errorInfo.severity
      suggestions = errorInfo.suggestions
    }

    // Network errors
    if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') {
      userMessage = 'Problème de connexion réseau. Vérifiez votre connexion internet.'
      severity = 'high'
      suggestions = [
        'Vérifiez votre connexion internet',
        'Rechargez la page',
        'Contactez le support si le problème persiste'
      ]
    }

    // Database errors
    if (error?.code?.startsWith('PGRST') || error?.hint) {
      userMessage = 'Erreur de base de données. Nos équipes ont été notifiées.'
      severity = 'high'
      suggestions = [
        'Réessayez dans quelques minutes',
        'Contactez le support si urgent'
      ]
    }

    // Authentication errors
    if (error?.code === 'AUTH_ERROR' || error?.message?.includes('auth')) {
      userMessage = 'Session expirée. Veuillez vous reconnecter.'
      severity = 'medium'
      suggestions = [
        'Reconnectez-vous',
        'Vérifiez vos identifiants'
      ]
    }

    // Validation errors
    if (error?.code === 'VALIDATION_ERROR') {
      userMessage = 'Données invalides. Vérifiez les champs requis.'
      severity = 'low'
      suggestions = [
        'Vérifiez tous les champs obligatoires',
        'Respectez les formats demandés'
      ]
    }

    const errorObj: AppError = {
      code: errorCode,
      message,
      details: error,
      timestamp: new Date().toISOString(),
      severity,
      user_message: userMessage,
      suggestions
    }

    if (context) {
      errorObj.context = context
      errorObj.retry_action = () => this.retryOperation(context)
    }

    return errorObj
  }

  private getErrorInfo(code: string): { 
    userMessage: string
    severity: AppError['severity']
    suggestions: string[]
  } {
    const errorMap = {
      'NETWORK_ERROR': {
        userMessage: 'Problème de connexion réseau',
        severity: 'high' as const,
        suggestions: ['Vérifiez votre connexion', 'Réessayez']
      },
      'AUTH_REQUIRED': {
        userMessage: 'Authentification requise',
        severity: 'medium' as const,
        suggestions: ['Connectez-vous à votre compte']
      },
      'PERMISSION_DENIED': {
        userMessage: 'Accès non autorisé',
        severity: 'medium' as const,
        suggestions: ['Vérifiez vos permissions', 'Contactez l\'administrateur']
      },
      'RATE_LIMITED': {
        userMessage: 'Trop de requêtes, veuillez patienter',
        severity: 'low' as const,
        suggestions: ['Attendez quelques minutes', 'Réduisez la fréquence des actions']
      },
      'SERVER_ERROR': {
        userMessage: 'Erreur serveur temporaire',
        severity: 'high' as const,
        suggestions: ['Réessayez dans quelques minutes', 'Contactez le support']
      }
    }

    return (errorMap as any)[code] || {
      userMessage: 'Erreur inconnue',
      severity: 'medium' as const,
      suggestions: ['Réessayez', 'Contactez le support si le problème persiste']
    }
  }

  private logError(error: AppError): void {
    // In production, send to error tracking service (Sentry, etc.)
    console.error('Application Error:', {
      code: error.code,
      message: error.message,
      context: error.context,
      severity: error.severity,
      timestamp: error.timestamp,
      details: error.details
    })

    // Send to analytics if critical
    if (error.severity === 'critical') {
      this.sendErrorToAnalytics(error)
    }
  }

  private showErrorToast(error: AppError): void {
    const variant = error.severity === 'critical' || error.severity === 'high' 
      ? 'destructive' 
      : 'default'

    toast({
      title: 'Erreur',
      description: error.user_message,
      variant,
      action: error.retry_action ? {
        label: 'Réessayer',
        onClick: error.retry_action
      } : undefined
    })
  }

  private retryOperation(context: string): void {
    // Implement retry logic based on context
    console.log('Retrying operation:', context)
  }

  private sendErrorToAnalytics(error: AppError): void {
    // Send critical errors to analytics service
    console.log('Sending critical error to analytics:', error.code)
  }

  // Get error by code
  getError(code: string): AppError | undefined {
    return this.errors.get(code)
  }

  // Clear errors
  clearErrors(): void {
    this.errors.clear()
  }

  // Get all errors by severity
  getErrorsBySeverity(severity: AppError['severity']): AppError[] {
    return Array.from(this.errors.values()).filter(error => error.severity === severity)
  }
}

// Loading State Manager
export class LoadingManager {
  private static instance: LoadingManager
  private loadingStates: Map<string, LoadingState> = new Map()
  private loadingCallbacks: Array<(states: Map<string, LoadingState>) => void> = []

  static getInstance(): LoadingManager {
    if (!LoadingManager.instance) {
      LoadingManager.instance = new LoadingManager()
    }
    return LoadingManager.instance
  }

  // Register callback for loading state changes
  onChange(callback: (states: Map<string, LoadingState>) => void): void {
    this.loadingCallbacks.push(callback)
  }

  // Start loading operation
  startLoading(
    operation: string, 
    options: {
      stage?: string
      estimated_duration?: number
      progress?: number
    } = {}
  ): void {
    const loadingState: LoadingState = {
      isLoading: true,
      operation,
      stage: options.stage,
      estimated_duration: options.estimated_duration,
      progress: options.progress || 0
    }

    this.loadingStates.set(operation, loadingState)
    this.notifyCallbacks()
  }

  // Update loading progress
  updateProgress(operation: string, progress: number, stage?: string): void {
    const existing = this.loadingStates.get(operation)
    if (existing) {
      existing.progress = progress
      if (stage) existing.stage = stage
      this.notifyCallbacks()
    }
  }

  // Stop loading operation
  stopLoading(operation: string): void {
    this.loadingStates.delete(operation)
    this.notifyCallbacks()
  }

  // Check if any operation is loading
  isAnyLoading(): boolean {
    return Array.from(this.loadingStates.values()).some(state => state.isLoading)
  }

  // Get loading state for operation
  getLoadingState(operation: string): LoadingState | undefined {
    return this.loadingStates.get(operation)
  }

  // Get all loading states
  getAllLoadingStates(): Map<string, LoadingState> {
    return new Map(this.loadingStates)
  }

  private notifyCallbacks(): void {
    this.loadingCallbacks.forEach(callback => callback(this.loadingStates))
  }
}

// React hooks for error handling and loading states
export function useErrorHandler() {
  const [errors, setErrors] = useState<AppError[]>([])
  const errorHandler = ErrorHandler.getInstance()

  useEffect(() => {
    const handleError = (error: AppError) => {
      setErrors(prev => [error, ...prev.slice(0, 9)]) // Keep last 10 errors
    }

    errorHandler.onError(handleError)
    
    return () => {
      // Cleanup would go here in production
    }
  }, [])

  const handleError = (error: any, context?: string) => {
    return errorHandler.handleError(error, context)
  }

  const clearErrors = () => {
    setErrors([])
    errorHandler.clearErrors()
  }

  return {
    errors,
    handleError,
    clearErrors,
    criticalErrors: errors.filter(e => e.severity === 'critical'),
    hasErrors: errors.length > 0
  }
}

export function useLoadingState() {
  const [loadingStates, setLoadingStates] = useState<Map<string, LoadingState>>(new Map())
  const loadingManager = LoadingManager.getInstance()

  useEffect(() => {
    const handleChange = (states: Map<string, LoadingState>) => {
      setLoadingStates(new Map(states))
    }

    loadingManager.onChange(handleChange)
    
    return () => {
      // Cleanup would go here in production
    }
  }, [])

  const startLoading = (operation: string, options?: any) => {
    loadingManager.startLoading(operation, options)
  }

  const stopLoading = (operation: string) => {
    loadingManager.stopLoading(operation)
  }

  const updateProgress = (operation: string, progress: number, stage?: string) => {
    loadingManager.updateProgress(operation, progress, stage)
  }

  const isLoading = (operation?: string) => {
    if (operation) {
      return loadingManager.getLoadingState(operation)?.isLoading || false
    }
    return loadingManager.isAnyLoading()
  }

  const getProgress = (operation: string) => {
    return loadingManager.getLoadingState(operation)?.progress || 0
  }

  const getStage = (operation: string) => {
    return loadingManager.getLoadingState(operation)?.stage
  }

  return {
    loadingStates,
    startLoading,
    stopLoading,
    updateProgress,
    isLoading,
    getProgress,
    getStage,
    isAnyLoading: loadingManager.isAnyLoading()
  }
}

// HOC for automatic error handling
export function withErrorHandling<T extends object>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return function ErrorBoundaryComponent(props: T) {
    const { handleError } = useErrorHandler()

    useEffect(() => {
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        handleError(event.reason, 'unhandled_promise_rejection')
      }

      const handleError = (event: ErrorEvent) => {
        handleError(event.error, 'unhandled_error')
      }

      window.addEventListener('unhandledrejection', handleUnhandledRejection)
      window.addEventListener('error', handleError)

      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection)
        window.removeEventListener('error', handleError)
      }
    }, [])

    return <Component {...props} />
  }
}

// Async operation wrapper with error handling and loading states
export async function withErrorAndLoadingHandling<T>(
  operation: () => Promise<T>,
  operationName: string,
  options: {
    showSuccessToast?: boolean
    successMessage?: string
    context?: string
    estimatedDuration?: number
  } = {}
): Promise<T | null> {
  const errorHandler = ErrorHandler.getInstance()
  const loadingManager = LoadingManager.getInstance()

  try {
    loadingManager.startLoading(operationName, {
      estimated_duration: options.estimatedDuration
    })

    const result = await operation()

    if (options.showSuccessToast) {
      toast({
        title: 'Succès',
        description: options.successMessage || 'Opération réussie'
      })
    }

    return result
  } catch (error) {
    errorHandler.handleError(error, options.context || operationName)
    return null
  } finally {
    loadingManager.stopLoading(operationName)
  }
}

// Export singletons
export const errorHandler = ErrorHandler.getInstance()
export const loadingManager = LoadingManager.getInstance()
