/**
 * Performance Monitoring Utilities for NutriFlow
 * Tracks page load times, API responses, and user interactions
 */

import React from 'react'
import { LogCategory, logger } from './logger'

// Performance metrics types
interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
  labels?: Record<string, string>
}

interface PageLoadMetrics {
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  timeToInteractive: number
  domContentLoaded: number
  loadComplete: number
}

interface APIMetrics {
  endpoint: string
  method: string
  duration: number
  status: number
  size?: number
  cached?: boolean
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observer: PerformanceObserver | null = null
  private isClient = typeof window !== 'undefined'

  constructor() {
    if (this.isClient) {
      this.initializeBrowserMonitoring()
    }
  }

  private initializeBrowserMonitoring(): void {
    // Monitor Web Vitals
    this.observeWebVitals()
    
    // Monitor resource loading
    this.observeResourceTiming()
    
    // Monitor long tasks
    this.observeLongTasks()
    
    // Monitor user interactions
    this.observeUserTiming()
  }

  private observeWebVitals(): void {
    try {
      // Observe First Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('first_contentful_paint', entry.startTime, 'ms')
          }
        }
      }).observe({ entryTypes: ['paint'] })

      // Observe Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.recordMetric('largest_contentful_paint', lastEntry.startTime, 'ms')
      }).observe({ entryTypes: ['largest-contentful-paint'] })

      // Observe First Input Delay
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          this.recordMetric('first_input_delay', entry.processingStart - entry.startTime, 'ms')
        }
      }).observe({ entryTypes: ['first-input'] })

      // Observe Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let clsValue = 0
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        }
        this.recordMetric('cumulative_layout_shift', clsValue, 'score')
      }).observe({ entryTypes: ['layout-shift'] })

    } catch (error) {
      console.warn('Performance monitoring not fully supported in this browser')
    }
  }

  private observeResourceTiming(): void {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
        // Skip monitoring of our own analytics requests
        if (entry.name.includes('analytics') || entry.name.includes('monitoring')) {
          continue
        }

        this.recordMetric('resource_load_time', entry.duration, 'ms', {
          resource_type: this.getResourceType(entry.name),
          cached: entry.transferSize === 0 ? 'true' : 'false'
        })
      }
    }).observe({ entryTypes: ['resource'] })
  }

  private observeLongTasks(): void {
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('long_task', entry.duration, 'ms')
          
          if (entry.duration > 100) {
            logger.warn(LogCategory.PERFORMANCE, `Long task detected: ${entry.duration}ms`)
          }
        }
      }).observe({ entryTypes: ['longtask'] })
    } catch (error) {
      // Long task observer not supported in all browsers
    }
  }

  private observeUserTiming(): void {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric('user_timing', entry.duration || 0, 'ms', {
          name: entry.name,
          type: entry.entryType
        })
      }
    }).observe({ entryTypes: ['measure'] })
  }

  private getResourceType(url: string): string {
    if (url.match(/\.(css)$/)) return 'stylesheet'
    if (url.match(/\.(js)$/)) return 'script'
    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'image'
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font'
    if (url.includes('/api/')) return 'api'
    return 'other'
  }

  recordMetric(name: string, value: number, unit: string, labels?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      labels
    }

    this.metrics.push(metric)
    
    // Log significant performance issues
    if (this.isSignificantMetric(metric)) {
      logger.logPerformanceMetric(name, value, unit, labels)
    }

    // Keep only recent metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500)
    }
  }

  private isSignificantMetric(metric: PerformanceMetric): boolean {
    const thresholds: Record<string, number> = {
      first_contentful_paint: 2000,
      largest_contentful_paint: 4000,
      first_input_delay: 100,
      cumulative_layout_shift: 0.1,
      long_task: 50,
      api_response_time: 1000
    }

    return metric.value > (thresholds[metric.name] || Infinity)
  }

  // Track API calls
  trackAPICall(endpoint: string, method: string, startTime: number, status: number, size?: number): void {
    const duration = performance.now() - startTime
    
    this.recordMetric('api_response_time', duration, 'ms', {
      endpoint,
      method,
      status: status.toString(),
      cached: size === 0 ? 'true' : 'false'
    })

    // Log slow API calls
    if (duration > 1000) {
      logger.warn(LogCategory.PERFORMANCE, `Slow API call: ${method} ${endpoint}`, {
        duration,
        status
      })
    }
  }

  // Track component render times
  trackComponentRender(componentName: string, renderTime: number): void {
    this.recordMetric('component_render_time', renderTime, 'ms', {
      component: componentName
    })
  }

  // Track user interactions
  trackUserInteraction(action: string, element: string, duration?: number): void {
    this.recordMetric('user_interaction', duration || 0, 'ms', {
      action,
      element
    })
  }

  // Get performance summary
  getPerformanceSummary(): {
    pageLoad: Partial<PageLoadMetrics>
    apiCalls: APIMetrics[]
    averages: Record<string, number>
  } {
    const recentMetrics = this.metrics.filter(m => m.timestamp > Date.now() - 60000) // Last minute

    // Calculate page load metrics
    const pageLoad: Partial<PageLoadMetrics> = {}
    const pageLoadMetrics = recentMetrics.filter(m => 
      ['first_contentful_paint', 'largest_contentful_paint', 'cumulative_layout_shift', 'first_input_delay'].includes(m.name)
    )
    
    pageLoadMetrics.forEach(metric => {
      const key = metric.name as keyof PageLoadMetrics
      pageLoad[key] = metric.value
    })

    // Calculate API metrics
    const apiCalls: APIMetrics[] = recentMetrics
      .filter(m => m.name === 'api_response_time')
      .map(m => ({
        endpoint: m.labels?.endpoint || '',
        method: m.labels?.method || '',
        duration: m.value,
        status: parseInt(m.labels?.status || '0'),
        cached: m.labels?.cached === 'true'
      }))

    // Calculate averages
    const averages: Record<string, number> = {}
    const metricGroups = recentMetrics.reduce((groups, metric) => {
      if (!groups[metric.name]) groups[metric.name] = []
      groups[metric.name].push(metric.value)
      return groups
    }, {} as Record<string, number[]>)

    Object.entries(metricGroups).forEach(([name, values]) => {
      averages[name] = values.reduce((sum, value) => sum + value, 0) / values.length
    })

    return { pageLoad, apiCalls, averages }
  }

  // Export metrics for external analysis
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  // Clear stored metrics
  clearMetrics(): void {
    this.metrics = []
  }
}

// React hook for component performance tracking
export const usePerformanceTracking = (componentName: string) => {
  const startTime = performance.now()

  const trackRender = () => {
    const renderTime = performance.now() - startTime
    performanceMonitor.trackComponentRender(componentName, renderTime)
  }

  const trackInteraction = (action: string, element: string) => {
    performanceMonitor.trackUserInteraction(action, element)
  }

  return { trackRender, trackInteraction }
}

// HOC for automatic component performance tracking
export const withPerformanceTracking = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  const PerformanceTrackedComponent = (props: P) => {
    const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name
    const { trackRender } = usePerformanceTracking(displayName)

    React.useEffect(() => {
      trackRender()
    })

    return React.createElement(WrappedComponent, props)
  }

  return PerformanceTrackedComponent
}

// API call tracking wrapper
export const trackAPICall = async <T>(
  apiCall: () => Promise<T>,
  endpoint: string,
  method: string = 'GET'
): Promise<T> => {
  const startTime = performance.now()
  
  try {
    const result = await apiCall()
    performanceMonitor.trackAPICall(endpoint, method, startTime, 200)
    return result
  } catch (error) {
    performanceMonitor.trackAPICall(endpoint, method, startTime, 500)
    throw error
  }
}

// Performance budget checker
export const checkPerformanceBudget = (): {
  passed: boolean
  issues: string[]
} => {
  const summary = performanceMonitor.getPerformanceSummary()
  const issues: string[] = []

  // Check Core Web Vitals
  if (summary.pageLoad.firstContentfulPaint && summary.pageLoad.firstContentfulPaint > 2000) {
    issues.push('First Contentful Paint is too slow (>2s)')
  }

  if (summary.pageLoad.largestContentfulPaint && summary.pageLoad.largestContentfulPaint > 4000) {
    issues.push('Largest Contentful Paint is too slow (>4s)')
  }

  if (summary.pageLoad.cumulativeLayoutShift && summary.pageLoad.cumulativeLayoutShift > 0.1) {
    issues.push('Cumulative Layout Shift is too high (>0.1)')
  }

  if (summary.pageLoad.firstInputDelay && summary.pageLoad.firstInputDelay > 100) {
    issues.push('First Input Delay is too high (>100ms)')
  }

  // Check API performance
  const slowAPICalls = summary.apiCalls.filter(call => call.duration > 1000)
  if (slowAPICalls.length > 0) {
    issues.push(`${slowAPICalls.length} API calls are slower than 1 second`)
  }

  return {
    passed: issues.length === 0,
    issues
  }
}

// Page visibility change tracking
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      performanceMonitor.recordMetric('page_hidden', Date.now(), 'timestamp')
    } else {
      performanceMonitor.recordMetric('page_visible', Date.now(), 'timestamp')
    }
  })
}

// Memory usage tracking
export const trackMemoryUsage = (): void => {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory
    performanceMonitor.recordMetric('memory_used', memory.usedJSHeapSize, 'bytes')
    performanceMonitor.recordMetric('memory_total', memory.totalJSHeapSize, 'bytes')
    performanceMonitor.recordMetric('memory_limit', memory.jsHeapSizeLimit, 'bytes')
  }
}

// Network information tracking
export const trackNetworkInfo = (): void => {
  if (typeof window !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection
    performanceMonitor.recordMetric('network_downlink', connection.downlink || 0, 'mbps')
    performanceMonitor.recordMetric('network_rtt', connection.rtt || 0, 'ms')
  }
}

// Initialize performance monitoring
const performanceMonitor = new PerformanceMonitor()

// Start periodic monitoring
if (typeof window !== 'undefined') {
  setInterval(() => {
    trackMemoryUsage()
    trackNetworkInfo()
  }, 30000) // Every 30 seconds
}

export default performanceMonitor
export { PerformanceMonitor }
