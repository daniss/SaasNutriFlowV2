// Advanced Error Tracking and Performance Monitoring
// Integrates with Sentry, LogRocket, and custom analytics

interface ErrorContext {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  session?: {
    id: string;
    startTime: number;
    userAgent: string;
  };
  action?: string;
  page?: string;
  component?: string;
  additionalData?: Record<string, any>;
}

interface PerformanceMetrics {
  timing: {
    navigationStart: number;
    domContentLoaded: number;
    loadComplete: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
  };
  resources: {
    totalResources: number;
    totalSize: number;
    totalDuration: number;
    slowResources: Array<{
      name: string;
      duration: number;
      size: number;
    }>;
  };
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

interface UserAnalytics {
  pageViews: Array<{
    page: string;
    timestamp: number;
    timeSpent: number;
    referrer?: string;
  }>;
  interactions: Array<{
    type: 'click' | 'scroll' | 'form' | 'search';
    element: string;
    timestamp: number;
    data?: any;
  }>;
  features: Array<{
    feature: string;
    used: boolean;
    frequency: number;
    lastUsed: number;
  }>;
}

class MonitoringService {
  private sessionId: string;
  private userId?: string;
  private startTime: number;
  private pageStartTime: number;
  private errorQueue: Array<any> = [];
  private analyticsQueue: Array<any> = [];
  private performanceObserver?: PerformanceObserver;
  private intersectionObserver?: IntersectionObserver;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.pageStartTime = Date.now();
    
    this.initializeMonitoring();
    this.setupPerformanceMonitoring();
    this.setupUserAnalytics();
    this.setupErrorBoundary();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize monitoring services
   */
  private initializeMonitoring(): void {
    // Initialize Sentry for error tracking
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      this.initializeSentry();
    }

    // Initialize LogRocket for session replay
    if (process.env.NEXT_PUBLIC_LOGROCKET_ID) {
      this.initializeLogRocket();
    }

    // Setup custom error handler
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
  }

  private initializeSentry(): void {
    // Sentry initialization would go here
    console.log('Sentry initialized for error tracking');
  }

  private initializeLogRocket(): void {
    // LogRocket initialization would go here
    console.log('LogRocket initialized for session replay');
  }

  /**
   * Set up performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Web Vitals monitoring
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPerformanceEntry(entry);
        }
      });

      // Observe different types of performance entries
      try {
        this.performanceObserver.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
      } catch (e) {
        console.warn('Performance Observer not fully supported:', e);
      }
    }

    // Memory usage monitoring
    if ('memory' in performance) {
      setInterval(() => {
        this.trackMemoryUsage();
      }, 30000); // Every 30 seconds
    }

    // Resource loading monitoring
    this.monitorResourceLoading();
  }

  private trackPerformanceEntry(entry: PerformanceEntry): void {
    const performanceData = {
      type: entry.entryType,
      name: entry.name,
      startTime: entry.startTime,
      duration: entry.duration,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    // Track specific metrics
    if (entry.entryType === 'largest-contentful-paint') {
      this.trackMetric('lcp', entry.startTime);
    } else if (entry.entryType === 'first-input') {
      this.trackMetric('fid', (entry as any).processingStart - entry.startTime);
    } else if (entry.entryType === 'layout-shift') {
      this.trackMetric('cls', (entry as any).value);
    }

    this.queueAnalytics('performance', performanceData);
  }

  private trackMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.trackMetric('memory_usage', {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usage_percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      });
    }
  }

  private monitorResourceLoading(): void {
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource');
      const slowResources = resources
        .filter(resource => resource.duration > 1000)
        .map(resource => ({
          name: resource.name,
          duration: resource.duration,
          size: (resource as any).transferSize || 0
        }));

      if (slowResources.length > 0) {
        this.trackMetric('slow_resources', {
          count: slowResources.length,
          resources: slowResources
        });
      }
    });
  }

  /**
   * Set up user analytics and interaction tracking
   */
  private setupUserAnalytics(): void {
    // Track page views
    this.trackPageView();

    // Track clicks
    document.addEventListener('click', (event) => {
      this.trackInteraction('click', event.target as Element, {
        x: event.clientX,
        y: event.clientY
      });
    });

    // Track form interactions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.trackInteraction('form', form, {
        action: form.action,
        method: form.method,
        fields: Array.from(form.elements).length
      });
    });

    // Track scroll behavior
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackInteraction('scroll', document.body, {
          scrollY: window.scrollY,
          maxScroll: document.body.scrollHeight - window.innerHeight,
          percentage: (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        });
      }, 100);
    });

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackMetric('page_hidden', {
          timeSpent: Date.now() - this.pageStartTime,
          timestamp: Date.now()
        });
      } else {
        this.pageStartTime = Date.now();
        this.trackMetric('page_visible', { timestamp: Date.now() });
      }
    });

    // Track viewport and device info
    this.trackDeviceInfo();
  }

  private trackPageView(): void {
    const pageData = {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    this.queueAnalytics('page_view', pageData);
  }

  private trackInteraction(type: string, element: Element, data?: any): void {
    const interactionData = {
      type,
      element: this.getElementSelector(element),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      data
    };

    this.queueAnalytics('interaction', interactionData);
  }

  private trackDeviceInfo(): void {
    const deviceData = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt
      } : null
    };

    this.queueAnalytics('device_info', deviceData);
  }

  /**
   * Error handling and reporting
   */
  private setupErrorBoundary(): void {
    // Global error handlers are already set up in initializeMonitoring
  }

  private handleError(event: ErrorEvent): void {
    const errorData = {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error ? {
        name: event.error.name,
        message: event.error.message,
        stack: event.error.stack
      } : null,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.queueError('javascript_error', errorData);
  }

  private handlePromiseRejection(event: PromiseRejectionEvent): void {
    const errorData = {
      reason: event.reason,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: window.location.href
    };

    this.queueError('promise_rejection', errorData);
  }

  /**
   * Public API methods
   */
  public setUser(user: { id: string; email: string; role: string }): void {
    this.userId = user.id;
    this.trackMetric('user_identified', user);
  }

  public trackError(error: Error, context?: ErrorContext): void {
    const errorData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href
    };

    this.queueError('custom_error', errorData);
  }

  public trackMetric(name: string, value: any, tags?: Record<string, string>): void {
    const metricData = {
      name,
      value,
      tags,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId
    };

    this.queueAnalytics('metric', metricData);
  }

  public trackFeatureUsage(feature: string, data?: any): void {
    const featureData = {
      feature,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId
    };

    this.queueAnalytics('feature_usage', featureData);
  }

  public trackUserAction(action: string, data?: any): void {
    const actionData = {
      action,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href
    };

    this.queueAnalytics('user_action', actionData);
  }

  /**
   * Performance testing utilities
   */
  public measureFunction<T>(fn: () => T, name: string): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    this.trackMetric('function_performance', {
      name,
      duration: end - start,
      timestamp: Date.now()
    });
    
    return result;
  }

  public async measureAsyncFunction<T>(fn: () => Promise<T>, name: string): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    this.trackMetric('async_function_performance', {
      name,
      duration: end - start,
      timestamp: Date.now()
    });
    
    return result;
  }

  /**
   * A/B Testing support
   */
  public getExperimentVariant(experimentName: string): string {
    // Simple hash-based variant assignment
    const hash = this.hashCode(this.userId || this.sessionId);
    const variant = hash % 2 === 0 ? 'A' : 'B';
    
    this.trackMetric('experiment_assignment', {
      experiment: experimentName,
      variant,
      userId: this.userId,
      sessionId: this.sessionId
    });
    
    return variant;
  }

  /**
   * Health check and diagnostics
   */
  public getHealthReport(): any {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      uptime: Date.now() - this.startTime,
      errorCount: this.errorQueue.length,
      analyticsQueueSize: this.analyticsQueue.length,
      memoryUsage: (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize
      } : null,
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink
      } : null
    };
  }

  /**
   * Private utility methods
   */
  private queueError(type: string, data: any): void {
    this.errorQueue.push({ type, data });
    this.flushErrors();
  }

  private queueAnalytics(type: string, data: any): void {
    this.analyticsQueue.push({ type, data });
    
    // Flush periodically or when queue gets large
    if (this.analyticsQueue.length >= 10) {
      this.flushAnalytics();
    }
  }

  private async flushErrors(): Promise<void> {
    if (this.errorQueue.length === 0) return;
    
    try {
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errors: this.errorQueue,
          timestamp: Date.now()
        })
      });
      
      this.errorQueue = [];
    } catch (error) {
      console.warn('Failed to send error data:', error);
    }
  }

  private async flushAnalytics(): Promise<void> {
    if (this.analyticsQueue.length === 0) return;
    
    try {
      await fetch('/api/monitoring/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: this.analyticsQueue,
          timestamp: Date.now()
        })
      });
      
      this.analyticsQueue = [];
    } catch (error) {
      console.warn('Failed to send analytics data:', error);
    }
  }

  private getElementSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      return `.${element.className.split(' ').join('.')}`;
    }
    
    return element.tagName.toLowerCase();
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    // Flush remaining data
    this.flushErrors();
    this.flushAnalytics();
  }
}

// React hook for monitoring
import { useEffect, useRef } from 'react';

export function useMonitoring() {
  const monitoringRef = useRef<MonitoringService | null>(null);

  useEffect(() => {
    if (!monitoringRef.current) {
      monitoringRef.current = new MonitoringService();
    }

    return () => {
      if (monitoringRef.current) {
        monitoringRef.current.destroy();
      }
    };
  }, []);

  return {
    trackError: (error: Error, context?: ErrorContext) => 
      monitoringRef.current?.trackError(error, context),
    trackMetric: (name: string, value: any, tags?: Record<string, string>) => 
      monitoringRef.current?.trackMetric(name, value, tags),
    trackFeatureUsage: (feature: string, data?: any) => 
      monitoringRef.current?.trackFeatureUsage(feature, data),
    trackUserAction: (action: string, data?: any) => 
      monitoringRef.current?.trackUserAction(action, data),
    setUser: (user: { id: string; email: string; role: string }) => 
      monitoringRef.current?.setUser(user),
    measureFunction: <T>(fn: () => T, name: string) => 
      monitoringRef.current?.measureFunction(fn, name),
    measureAsyncFunction: <T>(fn: () => Promise<T>, name: string) => 
      monitoringRef.current?.measureAsyncFunction(fn, name),
    getExperimentVariant: (experimentName: string) => 
      monitoringRef.current?.getExperimentVariant(experimentName) || 'A',
    getHealthReport: () => 
      monitoringRef.current?.getHealthReport()
  };
}

// Export singleton instance
export const monitoringService = new MonitoringService();
