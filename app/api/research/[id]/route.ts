import { NextRequest, NextResponse } from 'next/server'
import { createRouteSupabaseClient } from '@/lib/supabase-route-client'
import { ResearchError } from '@/features/research/lib/errors'
import { rateLimitGuard } from '@/lib/middleware/rate-limit-guard'
import type { ResearchReportJson, ResearchSource } from '@/features/research/types/research'

type ReportRow = {
    id: string
    user_id: string
    title: string
    query: string
    status: string
    created_at: string
    report_json: unknown
    sources_json: unknown
    tokens_used: number | null
    model: string | null
    content: string | null
    topic: string | null
}

function normalizeReportJson(value: unknown): ResearchReportJson | null {
    if (!value || typeof value !== 'object') {
        return null
    }

    const report = value as Partial<ResearchReportJson>
    if (
        typeof report.executiveSummary !== 'string' ||
        typeof report.background !== 'string' ||
        typeof report.currentMarket !== 'string' ||
        typeof report.conclusion !== 'string' ||
        !Array.isArray(report.keyInsights) ||
        !Array.isArray(report.risks) ||
        !Array.isArray(report.opportunities) ||
        !Array.isArray(report.futureTrends) ||
        !Array.isArray(report.references)
    ) {
        return null
    }

    return report as ResearchReportJson
}

function normalizeSources(value: unknown): ResearchSource[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value.filter((item): item is ResearchSource => {
        return (
            typeof item === 'object' &&
            item !== null &&
            'title' in item &&
            'content' in item &&
            'url' in item
        )
    })
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    // Apply rate limiting for read operations
    const rateLimit = await rateLimitGuard('read')(request)
    
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: 'Too many requests', message: 'Please wait before retrying' },
            { 
                status: 429,
                headers: {
                    ...rateLimit.headers,
                    'Retry-After': rateLimit.retryAfter.toString(),
                }
            }
        )
    }

    const supabase = createRouteSupabaseClient(request)
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const params = await context.params
    const reportId = params.id

    const { data, error } = await supabase
        .from('reports')
        .select('id,user_id,title,query,status,created_at,report_json,sources_json,tokens_used,model,content,topic')
        .eq('id', reportId)
        .eq('user_id', user.id)
        .maybeSingle()

    if (error) {
        return NextResponse.json({ error: 'Failed to load report' }, { status: 500 })
    }

    if (!data) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const row = data as ReportRow
    const reportJson = normalizeReportJson(row.report_json)

    const sources = normalizeSources(row.sources_json)

    return NextResponse.json({
        report: {
            id: row.id,
            title: row.title,
            query: row.query,
            status: row.status,
            created_at: row.created_at,
            tokens_used: row.tokens_used,
            model: row.model,
            summary: reportJson?.executiveSummary ?? null,
            sourceCount: sources.length,
            report_json: reportJson,
            sources_json: sources,
        },
    })
}
