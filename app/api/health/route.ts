import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-service'

/**
 * GET /api/health
 * Health check endpoint for monitoring and load balancers
 * Returns application status and database connectivity
 */
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: 'unknown',
      supabase: 'unknown',
    },
    uptime: process.uptime ? `${Math.floor(process.uptime())}s` : 'unknown',
  }

  try {
    // Check Supabase connectivity
    const db = createServiceClient()
    
    const { error } = await db
      .from('user_profiles')
      .select('id')
      .limit(1)

    if (error) {
      health.checks.database = 'unhealthy'
      health.checks.supabase = 'unhealthy'
      health.status = 'degraded'
      
      return NextResponse.json(health, {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    }

    health.checks.database = 'healthy'
    health.checks.supabase = 'healthy'

    return NextResponse.json(health, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    health.checks.database = 'unhealthy'
    health.checks.supabase = 'error'
    health.status = 'unhealthy'

    return NextResponse.json(health, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  }
}
