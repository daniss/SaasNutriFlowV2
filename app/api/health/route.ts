import config from '@/lib/config'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Health Check API Endpoint
 * Provides system status and service availability
 */

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  services: {
    database: ServiceStatus
    ai: ServiceStatus
    email: ServiceStatus
    storage: ServiceStatus
    monitoring: ServiceStatus
  }
  environment: {
    nodeEnv: string
    region: string | null
  }
  performance: {
    memoryUsage: NodeJS.MemoryUsage | null
    responseTime: number
  }
}

interface ServiceStatus {
  status: 'connected' | 'disconnected' | 'degraded' | 'not_configured'
  message?: string
  lastChecked: string
}

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Check database connectivity
    const databaseStatus = await checkDatabase()
    
    // Check AI service
    const aiStatus = await checkAIService()
    
    // Check email service
    const emailStatus = await checkEmailService()
    
    // Check storage service
    const storageStatus = await checkStorageService()
    
    // Check monitoring service
    const monitoringStatus = await checkMonitoringService()
    
    // Calculate overall status
    const services = {
      database: databaseStatus,
      ai: aiStatus,
      email: emailStatus,
      storage: storageStatus,
      monitoring: monitoringStatus
    }
    
    const overallStatus = calculateOverallStatus(services)
    const responseTime = Date.now() - startTime
    
    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      services,
      environment: {
        nodeEnv: config.app.env,
        region: process.env.VERCEL_REGION || process.env.AWS_REGION || null
      },
      performance: {
        memoryUsage: typeof process !== 'undefined' ? process.memoryUsage() : null,
        responseTime
      }
    }
    
    // Set appropriate status code based on health
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503
    
    return NextResponse.json(healthStatus, { status: statusCode })
    
  } catch (error) {
    const errorStatus: Partial<HealthStatus> = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: { status: 'disconnected', message: 'Health check failed', lastChecked: new Date().toISOString() },
        ai: { status: 'not_configured', lastChecked: new Date().toISOString() },
        email: { status: 'not_configured', lastChecked: new Date().toISOString() },
        storage: { status: 'not_configured', lastChecked: new Date().toISOString() },
        monitoring: { status: 'not_configured', lastChecked: new Date().toISOString() }
      }
    }
    
    return NextResponse.json(errorStatus, { status: 503 })
  }
}

async function checkDatabase(): Promise<ServiceStatus> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      return {
        status: 'disconnected',
        message: error.message,
        lastChecked: new Date().toISOString()
      }
    }
    
    return {
      status: 'connected',
      message: 'Database connection successful',
      lastChecked: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'disconnected',
      message: error instanceof Error ? error.message : 'Unknown database error',
      lastChecked: new Date().toISOString()
    }
  }
}

async function checkAIService(): Promise<ServiceStatus> {
  if (!config.ai.googleApiKey && !config.ai.openaiApiKey) {
    return {
      status: 'not_configured',
      message: 'No AI service configured',
      lastChecked: new Date().toISOString()
    }
  }
  
  // In a real implementation, you might make a test API call
  // For now, we'll just check if the API key is present
  return {
    status: 'connected',
    message: 'AI service configured',
    lastChecked: new Date().toISOString()
  }
}

async function checkEmailService(): Promise<ServiceStatus> {
  const hasEmailConfig = config.email.resendApiKey || 
                        config.email.sendgridApiKey || 
                        (config.email.smtp.host && config.email.smtp.user)
  
  if (!hasEmailConfig) {
    return {
      status: 'not_configured',
      message: 'No email service configured',
      lastChecked: new Date().toISOString()
    }
  }
  
  return {
    status: 'connected',
    message: 'Email service configured',
    lastChecked: new Date().toISOString()
  }
}

async function checkStorageService(): Promise<ServiceStatus> {
  if (!config.storage.aws.accessKeyId || !config.storage.aws.secretAccessKey) {
    return {
      status: 'not_configured',
      message: 'Storage service not configured (using local storage)',
      lastChecked: new Date().toISOString()
    }
  }
  
  return {
    status: 'connected',
    message: 'AWS S3 storage configured',
    lastChecked: new Date().toISOString()
  }
}

async function checkMonitoringService(): Promise<ServiceStatus> {
  if (!config.monitoring.enabled) {
    return {
      status: 'not_configured',
      message: 'Monitoring disabled',
      lastChecked: new Date().toISOString()
    }
  }
  
  return {
    status: 'connected',
    message: 'Monitoring enabled',
    lastChecked: new Date().toISOString()
  }
}

function calculateOverallStatus(services: HealthStatus['services']): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(services).map(service => service.status)
  
  // If database is down, system is unhealthy
  if (services.database.status === 'disconnected') {
    return 'unhealthy'
  }
  
  // If any critical service is degraded, system is degraded
  if (statuses.includes('degraded') || statuses.includes('disconnected')) {
    return 'degraded'
  }
  
  return 'healthy'
}
