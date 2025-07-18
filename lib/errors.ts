/**
 * Error handling utilities for consistent error management
 */

import React from 'react'

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'Une erreur inattendue s\'est produite'
}

export function logError(error: unknown, context?: string) {
  const errorMessage = handleApiError(error)
  const logContext = context ? `[${context}]` : ''
  console.error(`${logContext} Error:`, errorMessage, error)
}

export function createApiErrorHandler(context: string) {
  return (error: unknown) => {
    logError(error, context)
    throw new ApiError(handleApiError(error))
  }
}

/**
 * Wrapper for async functions that handles errors consistently
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    logError(error, context)
    throw new ApiError(handleApiError(error))
  }
}

