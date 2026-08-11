import { fetchWithTimeout } from '@/lib/network/fetch-with-timeout'
import { ResearchError } from '@/features/research/lib/errors'
import type { ResearchDepth, ResearchReportJson, ResearchSource, ResearchType } from '@/features/research/types/research'

interface OpenRouterResponse {
    choices?: Array<{
        message?: {
            content?: string
        }
    }>
    usage?: {
        total_tokens?: number
    }
    error?: {
        code?: string | number
        message?: string
    }
}

interface GenerateResearchReportParams {
    topic: string
    instructions: string
    reportType: ResearchType
    depth: ResearchDepth
    sources: ResearchSource[]
}

interface GenerateResearchReportResult {
    report: ResearchReportJson
    tokensUsed: number | null
    model: string
}

function log(message: string): void {
    console.log(`[OpenRouter] ${message}`)
}

function extractJson(text: string): string {
    const trimmed = text.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        return trimmed
    }

    const firstBrace = trimmed.indexOf('{')
    const lastBrace = trimmed.lastIndexOf('}')
    if (firstBrace >= 0 && lastBrace > firstBrace) {
        return trimmed.slice(firstBrace, lastBrace + 1)
    }

    return trimmed
}

function parseResearchReport(text: string): ResearchReportJson {
    try {
        const raw = JSON.parse(extractJson(text)) as Partial<ResearchReportJson>

        if (
            typeof raw.executiveSummary !== 'string' ||
            typeof raw.background !== 'string' ||
            typeof raw.currentMarket !== 'string' ||
            typeof raw.conclusion !== 'string' ||
            !Array.isArray(raw.keyInsights) ||
            !Array.isArray(raw.risks) ||
            !Array.isArray(raw.opportunities) ||
            !Array.isArray(raw.futureTrends) ||
            !Array.isArray(raw.references)
        ) {
            throw new Error('Invalid research JSON shape')
        }

        return {
            executiveSummary: raw.executiveSummary,
            background: raw.background,
            currentMarket: raw.currentMarket,
            keyInsights: raw.keyInsights.map((item) => String(item)),
            risks: raw.risks.map((item) => String(item)),
            opportunities: raw.opportunities.map((item) => String(item)),
            futureTrends: raw.futureTrends.map((item) => String(item)),
            references: raw.references.map((reference) => ({
                title: String(reference.title ?? ''),
                url: String(reference.url ?? ''),
                publishedDate: typeof reference.publishedDate === 'string' ? reference.publishedDate : null,
                summary: String(reference.summary ?? ''),
            })),
            conclusion: raw.conclusion,
        }
    } catch {
        throw new ResearchError('INVALID_JSON', 'OpenRouter returned invalid JSON', 502)
    }
}

export async function generateResearchReportOpenRouter(
    params: GenerateResearchReportParams
): Promise<GenerateResearchReportResult> {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
        throw new ResearchError('INVALID_INPUT', 'OpenRouter API key is missing', 500)
    }

    const model = process.env.OPENROUTER_MODEL ?? 'deepseek/deepseek-chat-v3-0324'
    const keyPrefix = apiKey.substring(0, 10)
    log(`Using model: ${model}`)
    log(`Authentication: Using API key with prefix '${keyPrefix}...'`)

    const prompt = [
        'You are Nexora, a senior research analyst writing a professional consulting-grade research report.',
        'Write like McKinsey, Deloitte, or Gartner: clear, concise, evidence-based, and strategically useful.',
        'You must output valid JSON only. Do not include markdown, code fences, commentary, or hidden reasoning.',
        'Use the supplied sources as the evidence base. References must use real URLs from the source list.',
        'Return exactly this JSON shape:',
        '{',
        '  "executiveSummary": string,',
        '  "background": string,',
        '  "currentMarket": string,',
        '  "keyInsights": string[],',
        '  "risks": string[],',
        '  "opportunities": string[],',
        '  "futureTrends": string[],',
        '  "references": [{ "title": string, "url": string, "publishedDate": string | null, "summary": string }],',
        '  "conclusion": string',
        '}',
        '',
        `Topic: ${params.topic}`,
        `Report type: ${params.reportType}`,
        `Depth: ${params.depth}`,
        params.instructions ? `Additional instructions: ${params.instructions}` : 'Additional instructions: none',
        '',
        'Fresh source data:',
        JSON.stringify(params.sources, null, 2),
    ].join('\n')

    const requestBody = JSON.stringify({
        model,
        messages: [
            {
                role: 'user',
                content: prompt,
            },
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 4096,
    })

    const url = 'https://openrouter.ai/api/v1/chat/completions'

    log(`Request started, model=${model}`)

    let response: Response
    try {
        response = await fetchWithTimeout(
            url,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://nexora.ai',
                    'X-Title': 'Nexora Research',
                },
                body: requestBody,
            },
            45000
        )
    } catch (fetchError) {
        log(`Network error: ${fetchError instanceof Error ? fetchError.message : 'unknown'}`)
        throw new ResearchError('OPENROUTER_ERROR', 'OpenRouter request failed (network error)', 503)
    }

    // Check for retryable errors
    if (response.status === 429) {
        const errorBody = (await response.json()) as OpenRouterResponse
        const errorMsg = errorBody.error?.message || 'Rate limit exceeded'
        log(`Rate limit error: ${errorMsg}`)
        throw new ResearchError('OPENROUTER_RATE_LIMITED', `OpenRouter rate limited: ${errorMsg}`, 429)
    }

    if (response.status === 500 || response.status === 502 || response.status === 503) {
        const errorBody = (await response.json()) as OpenRouterResponse
        const errorMsg = errorBody.error?.message || 'Server error'
        log(`Server error (${response.status}): ${errorMsg}`)
        throw new ResearchError('OPENROUTER_SERVER_ERROR', `OpenRouter server error: ${errorMsg}`, response.status)
    }

    if (!response.ok) {
        const errorBody = (await response.json()) as OpenRouterResponse
        const errorMsg = errorBody.error?.message || 'Unknown error'
        log(`Error (${response.status}): ${errorMsg}`)
        throw new ResearchError('OPENROUTER_ERROR', `OpenRouter request failed: ${errorMsg}`, response.status)
    }

    const payload = (await response.json()) as OpenRouterResponse
    const text = payload.choices?.[0]?.message?.content

    if (!text) {
        log('Empty response from OpenRouter')
        throw new ResearchError('OPENROUTER_ERROR', 'OpenRouter returned no content', 502)
    }

    const report = parseResearchReport(text)
    const tokensUsed = payload.usage?.total_tokens ?? null
    log(`Request completed, tokens=${tokensUsed ?? 'unknown'}`)

    return { report, tokensUsed, model }
}
