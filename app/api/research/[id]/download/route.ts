import { NextRequest, NextResponse } from 'next/server'
import { createRouteSupabaseClient } from '@/lib/supabase-route-client'
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

function generateMarkdown(report: ResearchReportJson, title: string, query: string, createdAt: string, model: string | null, tokensUsed: number | null): string {
    const date = new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })

    let markdown = `# ${title}\n\n`
    markdown += `**Research Query:** ${query}\n\n`
    markdown += `**Generated:** ${date}\n\n`
    markdown += `**Model:** ${model || 'Gemini'}\n\n`
    markdown += `**Tokens Used:** ${tokensUsed?.toLocaleString() || '0'}\n\n`
    markdown += `---\n\n`

    markdown += `## Executive Summary\n\n${report.executiveSummary}\n\n`

    markdown += `## Background\n\n${report.background}\n\n`

    markdown += `## Current Market\n\n${report.currentMarket}\n\n`

    markdown += `## Key Insights\n\n`
    report.keyInsights.forEach((insight) => {
        markdown += `- ${insight}\n`
    })
    markdown += `\n`

    markdown += `## Risks\n\n`
    report.risks.forEach((risk) => {
        markdown += `- ${risk}\n`
    })
    markdown += `\n`

    markdown += `## Opportunities\n\n`
    report.opportunities.forEach((opportunity) => {
        markdown += `- ${opportunity}\n`
    })
    markdown += `\n`

    markdown += `## Future Trends\n\n`
    report.futureTrends.forEach((trend) => {
        markdown += `- ${trend}\n`
    })
    markdown += `\n`

    markdown += `## Conclusion\n\n${report.conclusion}\n\n`

    markdown += `## References\n\n`
    report.references.forEach((ref) => {
        markdown += `- **${ref.title}** (${ref.publishedDate || 'Date unavailable'})\n`
        markdown += `  ${ref.summary}\n`
        markdown += `  [Link](${ref.url})\n\n`
    })

    return markdown
}

function generatePlainText(report: ResearchReportJson, title: string, query: string, createdAt: string, model: string | null, tokensUsed: number | null): string {
    const date = new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })

    let text = `${title}\n`
    text += `${'='.repeat(title.length)}\n\n`

    text += `Research Query: ${query}\n`
    text += `Generated: ${date}\n`
    text += `Model: ${model || 'Gemini'}\n`
    text += `Tokens Used: ${tokensUsed?.toLocaleString() || '0'}\n\n`
    text += `${'='.repeat(80)}\n\n`

    text += `EXECUTIVE SUMMARY\n`
    text += `${'-'.repeat(80)}\n${report.executiveSummary}\n\n`

    text += `BACKGROUND\n`
    text += `${'-'.repeat(80)}\n${report.background}\n\n`

    text += `CURRENT MARKET\n`
    text += `${'-'.repeat(80)}\n${report.currentMarket}\n\n`

    text += `KEY INSIGHTS\n`
    text += `${'-'.repeat(80)}\n`
    report.keyInsights.forEach((insight) => {
        text += `• ${insight}\n`
    })
    text += `\n`

    text += `RISKS\n`
    text += `${'-'.repeat(80)}\n`
    report.risks.forEach((risk) => {
        text += `• ${risk}\n`
    })
    text += `\n`

    text += `OPPORTUNITIES\n`
    text += `${'-'.repeat(80)}\n`
    report.opportunities.forEach((opportunity) => {
        text += `• ${opportunity}\n`
    })
    text += `\n`

    text += `FUTURE TRENDS\n`
    text += `${'-'.repeat(80)}\n`
    report.futureTrends.forEach((trend) => {
        text += `• ${trend}\n`
    })
    text += `\n`

    text += `CONCLUSION\n`
    text += `${'-'.repeat(80)}\n${report.conclusion}\n\n`

    text += `REFERENCES\n`
    text += `${'-'.repeat(80)}\n`
    report.references.forEach((ref, index) => {
        text += `${index + 1}. ${ref.title}\n`
        text += `   Published: ${ref.publishedDate || 'Date unavailable'}\n`
        text += `   ${ref.summary}\n`
        text += `   URL: ${ref.url}\n\n`
    })

    return text
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const supabase = createRouteSupabaseClient(request)
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const params = await context.params
    const reportId = params.id
    const format = request.nextUrl.searchParams.get('format') || 'markdown'

    const { data, error } = await supabase
        .from('reports')
        .select('id,user_id,title,query,status,created_at,report_json,sources_json,tokens_used,model')
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

    if (!reportJson) {
        return NextResponse.json({ error: 'Invalid report format' }, { status: 400 })
    }

    let content: string
    let contentType: string
    let filename: string

    if (format === 'markdown') {
        content = generateMarkdown(reportJson, row.title, row.query, row.created_at, row.model, row.tokens_used)
        contentType = 'text/markdown; charset=utf-8'
        filename = `${row.title || 'research-report'}.md`
    } else if (format === 'text') {
        content = generatePlainText(reportJson, row.title, row.query, row.created_at, row.model, row.tokens_used)
        contentType = 'text/plain; charset=utf-8'
        filename = `${row.title || 'research-report'}.txt`
    } else {
        return NextResponse.json({ error: 'Invalid format. Use "markdown" or "text"' }, { status: 400 })
    }

    return new Response(content, {
        headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
    })
}
