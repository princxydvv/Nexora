import { NextRequest, NextResponse } from 'next/server'
import { createRouteSupabaseClient } from '@/lib/supabase-route-client'
import { executeResearch, type ResearchInput } from '@/features/research/services/research-service'
import { ResearchError, isResearchError } from '@/features/research/lib/errors'
import { checkResearchGate, incrementReportUsage } from '@/features/billing/services/gate'
import { rateLimitGuard } from '@/lib/middleware/rate-limit-guard'
import type {
    ResearchReportJson,
    ResearchReportRecord,
    ResearchReportSummary,
    ResearchStage,
    ResearchStreamEvent,
    ResearchType,
    ResearchDepth,
    ResearchSource,
} from '@/features/research/types/research'

function log(message: string): void {
    console.log(`[Research API] ${message}`)
}

type ReportRow = ResearchReportRecord & {
    user_id: string
    topic: string | null
    content: string | null
}

interface ResearchRequestBody {
    topic: string
    instructions?: string
    reportType?: ResearchType
    depth?: ResearchDepth
}

function isResearchType(value: unknown): value is ResearchType {
    return value === 'market' || value === 'tech' || value === 'competitive' || value === 'career' || value === 'policy' || value === 'custom'
}

function isResearchDepth(value: unknown): value is ResearchDepth {
    return value === 'basic' || value === 'standard' || value === 'deep'
}

function serialize(event: ResearchStreamEvent): string {
    return `${JSON.stringify(event)}\n`
}

function normalizeReportJson(value: unknown): ResearchReportJson | null {
    if (!value || typeof value !== 'object') {
        return null
    }

    const candidate = value as Partial<ResearchReportJson>
    if (
        typeof candidate.executiveSummary !== 'string' ||
        typeof candidate.background !== 'string' ||
        typeof candidate.currentMarket !== 'string' ||
        typeof candidate.conclusion !== 'string' ||
        !Array.isArray(candidate.keyInsights) ||
        !Array.isArray(candidate.risks) ||
        !Array.isArray(candidate.opportunities) ||
        !Array.isArray(candidate.futureTrends) ||
        !Array.isArray(candidate.references)
    ) {
        return null
    }

    return candidate as ResearchReportJson
}

function toSummary(row: ReportRow): ResearchReportSummary {
    const reportJson = normalizeReportJson(row.report_json)
    const sourcesJson = Array.isArray(row.sources_json) ? row.sources_json as ResearchSource[] : []

    return {
        id: row.id,
        title: row.title,
        query: row.query,
        status: row.status,
        created_at: row.created_at,
        tokens_used: row.tokens_used ?? null,
        model: row.model ?? null,
        summary: reportJson?.executiveSummary ?? row.content,
        sourceCount: sourcesJson.length,
    }
}

async function updateReportStatus(
    supabase: ReturnType<typeof createRouteSupabaseClient>,
    reportId: string,
    status: ResearchStage,
    extra?: Partial<Pick<ReportRow, 'title' | 'query' | 'content' | 'report_json' | 'sources_json' | 'tokens_used' | 'model'>>
) {
    const { error } = await supabase
        .from('reports')
        .update({
            status,
            ...extra,
        })
        .eq('id', reportId)

    if (error) {
        throw new ResearchError('SAVE_FAILED', 'Unable to update the report status', 500)
    }
}

function mapErrorToMessage(error: unknown): { message: string } {
    if (isResearchError(error)) {
        return { message: error.message }
    }

    return { message: 'Unexpected research failure' }
}

export async function GET(request: NextRequest) {
    const supabase = createRouteSupabaseClient(request)
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const { data, error } = await supabase
        .from('reports')
        .select('id,user_id,title,query,created_at,status,report_json,sources_json,tokens_used,model,content,topic')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 })
    }

    const rows = (data ?? []) as ReportRow[]
    const reports = rows.map(toSummary)
    const totalReports = reports.length
    const totalTokens = rows.reduce((sum, row) => sum + (row.tokens_used ?? 0), 0)
    const totalSources = rows.reduce((sum, row) => sum + (Array.isArray(row.sources_json) ? row.sources_json.length : 0), 0)

    return NextResponse.json({
        reports,
        totalReports,
        totalTokens,
        totalSources,
    })
}

export async function POST(request: NextRequest) {
    // Apply rate limiting for research generation (expensive operation)
    const rateLimit = await rateLimitGuard('research')(request)
    
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: 'Too many requests', message: 'Please wait before generating another report' },
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

    let body: ResearchRequestBody
    try {
        body = (await request.json()) as ResearchRequestBody
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const topic = body.topic?.trim()
    const reportType = body.reportType && isResearchType(body.reportType) ? body.reportType : null
    const depth = body.depth && isResearchDepth(body.depth) ? body.depth : null
    const instructions = body.instructions?.trim() ?? ''

    if (!topic || !reportType || !depth) {
        return NextResponse.json(
            { error: 'Topic, report type, and depth are required' },
            { status: 400 }
        )
    }

    // Backend feature gate — never trust frontend
    const gate = await checkResearchGate(user.id, depth)
    if (!gate.allowed) {
        return NextResponse.json(
            { error: gate.reason, plan: gate.plan, reportsUsed: gate.reportsUsed, reportsLimit: gate.reportsLimit },
            { status: gate.statusCode ?? 403 }
        )
    }

    const { data: insertedReport, error: insertError } = await supabase
        .from('reports')
        .insert({
            user_id: user.id,
            title: topic,
            query: topic,
            topic,
            status: 'researching',
            report_json: {},
            sources_json: [],
            tokens_used: 0,
            model: null,
            content: null,
        })
        .select('id')
        .single()

    if (insertError || !insertedReport) {
        return NextResponse.json({ error: 'Failed to create research record' }, { status: 500 })
    }

    const reportId = insertedReport.id as string
    const encoder = new TextEncoder()

    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            const emit = (event: ResearchStreamEvent) => {
                controller.enqueue(encoder.encode(serialize(event)))
            }

            const run = async () => {
                try {
                    emit({ type: 'progress', stage: 'researching', message: 'Researching...', reportId })

                    const researchInput: ResearchInput = {
                        topic,
                        instructions,
                        reportType,
                        depth,
                    }

                    const result = await executeResearch(researchInput, async (stage, message) => {
                        await updateReportStatus(supabase, reportId, stage)
                        emit({ type: 'progress', stage, message, reportId })
                    })

                    emit({ type: 'progress', stage: 'saving', message: 'Saving...', reportId })
                    await updateReportStatus(supabase, reportId, 'saving', {
                        title: result.title,
                        query: result.query,
                        content: result.report.executiveSummary,
                        report_json: result.report,
                        sources_json: result.sources,
                        tokens_used: result.tokensUsed ?? 0,
                        model: result.model,
                    })

                    await updateReportStatus(supabase, reportId, 'completed', {
                        title: result.title,
                        query: result.query,
                        content: result.report.executiveSummary,
                        report_json: result.report,
                        sources_json: result.sources,
                        tokens_used: result.tokensUsed ?? 0,
                        model: result.model,
                    })
                    log(`Report saved: id=${reportId}`)

                    // Increment usage counter atomically
                    await incrementReportUsage(user.id)

                    emit({ type: 'complete', reportId, report: result.report })
                } catch (error) {
                    const { message } = mapErrorToMessage(error)
                    log(`Failed: ${isResearchError(error) ? error.code : 'UNKNOWN'} — ${message}`)

                    await supabase
                        .from('reports')
                        .update({
                            status: 'failed',
                            report_json: {
                                error: message,
                            },
                        })
                        .eq('id', reportId)

                    emit({ type: 'error', message })
                } finally {
                    controller.close()
                }
            }

            void run()
        },
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'application/x-ndjson; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    })
}
