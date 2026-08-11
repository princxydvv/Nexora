import { fetchWithTimeout } from '@/lib/network/fetch-with-timeout'
import { ResearchError } from '@/features/research/lib/errors'
import type { ResearchDepth, ResearchReportJson, ResearchSource, ResearchType } from '@/features/research/types/research'

const MAX_RETRIES = 2
const BASE_BACKOFF_MS = 2000
const MAX_BACKOFF_MS = 10000

interface GeminiResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                text?: string
            }>
        }
    }>
    usageMetadata?: {
        totalTokenCount?: number
    }
}

interface GeminiErrorDetail {
    '@type'?: string
    reason?: string
    domain?: string
    metadata?: Record<string, string>
}

interface GeminiErrorBody {
    error?: {
        code?: number
        message?: string
        status?: string
        details?: GeminiErrorDetail[]
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
    console.log(`[Gemini] ${message}`)
}

function classifyGeminiError(status: string | undefined, message: string | undefined): string {
    const s = (status ?? '').toUpperCase()
    const m = (message ?? '').toLowerCase()

    if (s === 'UNAUTHENTICATED' || m.includes('api key') || m.includes('invalid key') || m.includes('api_key')) {
        return 'INVALID_API_KEY'
    }
    if (m.includes('quota') && (m.includes('day') || m.includes('daily'))) {
        return 'DAILY_QUOTA_EXCEEDED'
    }
    if (m.includes('token') && (m.includes('rate') || m.includes('limit') || m.includes('quota'))) {
        return 'TOKENS_PER_MINUTE_LIMIT'
    }
    if (s === 'RESOURCE_EXHAUSTED' || m.includes('quota') || m.includes('rate limit') || m.includes('requests per minute') || m.includes('rpm')) {
        return 'REQUESTS_PER_MINUTE_LIMIT'
    }
    if (m.includes('overloaded') || m.includes('capacity') || s === 'UNAVAILABLE') {
        return 'TEMPORARY_CAPACITY_ISSUE'
    }
    if (s === 'INVALID_ARGUMENT' || m.includes('invalid') || m.includes('bad request')) {
        return 'INVALID_REQUEST'
    }
    return 'UNKNOWN'
}

async function readErrorBody(response: Response): Promise<GeminiErrorBody> {
    try {
        const text = await response.clone().text()
        log(`Response body (first 500 chars): ${text.substring(0, 500)}`)
        return JSON.parse(text) as GeminiErrorBody
    } catch {
        return {}
    }
}

function logGeminiError(
    httpStatus: number,
    body: GeminiErrorBody,
    model: string,
    attempt: number,
    retryAfterMs: number | null
): void {
    const err = body.error
    const geminiStatus = err?.status ?? 'unknown'
    const geminiMessage = err?.message ?? 'no message returned'
    const classification = classifyGeminiError(err?.status, err?.message)
    const detail = err?.details?.[0]

    log('--- Gemini Error Diagnostic ---')
    log(`  HTTP status    : ${httpStatus}`)
    log(`  Gemini status  : ${geminiStatus}`)
    log(`  Gemini message : ${geminiMessage}`)
    log(`  Model          : ${model}`)
    log(`  Classification : ${classification}`)
    log(`  Attempt        : ${attempt} of ${MAX_RETRIES + 1}`)
    if (retryAfterMs !== null) {
        log(`  Retry-After    : ${retryAfterMs}ms`)
    }
    if (detail?.reason) {
        log(`  Detail reason  : ${detail.reason}`)
    }
    if (detail?.metadata) {
        const entries = Object.entries(detail.metadata)
            .map(([k, v]) => `${k}=${v}`)
            .join(', ')
        log(`  Detail metadata: ${entries}`)
    }
    log('-------------------------------')
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
        throw new ResearchError('INVALID_JSON', 'Gemini returned invalid JSON', 502)
    }
}

function getRetryAfterMs(response: Response): number | null {
    const header = response.headers.get('Retry-After')
    if (!header) return null

    const seconds = parseFloat(header)
    if (!Number.isNaN(seconds) && seconds > 0) {
        return Math.min(seconds * 1000, MAX_BACKOFF_MS)
    }

    return null
}

function backoffMs(attempt: number): number {
    return Math.min(BASE_BACKOFF_MS * Math.pow(2.5, attempt), MAX_BACKOFF_MS)
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function findAvailableModel(apiKey: string): Promise<string> {
    try {
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        const listResponse = await fetchWithTimeout(listUrl, { method: 'GET' }, 10000)
        
        if (listResponse.ok) {
            const listData = (await listResponse.json()) as { models?: Array<{ name: string }> }
            const allModels = listData.models?.map(m => m.name.replace('models/', '')) ?? []
            log(`All available models: ${allModels.join(', ')}`)
            
            // Filter out known unavailable models
            const unavailablePatterns = ['2.5-flash', '2.0-flash', 'gemini-pro-vision']
            const availableModels = allModels.filter(m => 
                !unavailablePatterns.some(pattern => m.includes(pattern))
            )
            
            log(`Filtered available models: ${availableModels.join(', ')}`)
            
            if (availableModels.length > 0) {
                const selectedModel = availableModels[0]
                log(`Selected model: ${selectedModel}`)
                return selectedModel
            }
            
            // If all filtered out, try to find any 1.5 model
            const fallbackModels = allModels.filter(m => m.includes('1.5'))
            if (fallbackModels.length > 0) {
                const selectedModel = fallbackModels[0]
                log(`Selected fallback model: ${selectedModel}`)
                return selectedModel
            }
        }
    } catch (listError) {
        log(`Could not list models: ${listError instanceof Error ? listError.message : 'unknown error'}`)
    }
    
    // Last resort fallback
    log('Using hardcoded fallback model: gemini-pro')
    return 'gemini-pro'
}

export async function generateResearchReportGemini(
    params: GenerateResearchReportParams
): Promise<GenerateResearchReportResult> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        throw new ResearchError('INVALID_INPUT', 'Gemini API key is missing', 500)
    }

    let model = process.env.GEMINI_MODEL ?? ''
    const keyPrefix = apiKey.substring(0, 5)
    
    if (!model) {
        log('No model specified in GEMINI_MODEL, discovering available models...')
        model = await findAvailableModel(apiKey)
    }
    
    log(`Using model: ${model} (GEMINI_MODEL env=${process.env.GEMINI_MODEL ?? 'not set, auto-discovered'})`)
    log(`Authentication: Using API key with prefix '${keyPrefix}...' via query parameter`)
    
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
        contents: [
            {
                role: 'user',
                parts: [{ text: prompt }],
            },
        ],
        generationConfig: {
            temperature: 0.2,
            topP: 0.9,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
        },
    })

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    let lastError: ResearchError | null = null

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
            const waitMs = lastError?.retryAfterMs ?? backoffMs(attempt - 1)
            log(`Rate limited. Waiting ${Math.round(waitMs / 1000)}s before retry ${attempt}/${MAX_RETRIES}`)
            await sleep(waitMs)
        }

        log(`Request started (attempt ${attempt + 1}/${MAX_RETRIES + 1}), model=${model}`)

        let response: Response
        try {
            response = await fetchWithTimeout(
                url,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: requestBody,
                },
                45000
            )
        } catch (fetchError) {
            log(`Network error: ${fetchError instanceof Error ? fetchError.message : 'unknown'}`)
            throw new ResearchError('GEMINI_ERROR', 'Gemini request failed (network error)', 503)
        }

        if (response.status === 429) {
            const retryAfterMs = getRetryAfterMs(response)
            const errorBody = await readErrorBody(response)
            logGeminiError(429, errorBody, model, attempt + 1, retryAfterMs)
            lastError = new ResearchError(
                'AI_RATE_LIMITED',
                'The AI service is temporarily busy. Please try again in a moment.',
                429
            )
            lastError.retryAfterMs = retryAfterMs
            continue
        }

        if (response.status === 401) {
            const errorBody = await readErrorBody(response)
            logGeminiError(response.status, errorBody, model, attempt + 1, null)
            log(`Authentication failed with key prefix '${keyPrefix}...'`)
            throw new ResearchError('GEMINI_ERROR', 'Gemini authentication failed. Verify GEMINI_API_KEY is valid and has appropriate permissions.', 401)
        }

        if (response.status === 400 || response.status === 403) {
            const errorBody = await readErrorBody(response)
            logGeminiError(response.status, errorBody, model, attempt + 1, null)
            throw new ResearchError('GEMINI_ERROR', 'Gemini request failed', response.status)
        }

        if (!response.ok) {
            const errorBody = await readErrorBody(response)
            logGeminiError(response.status, errorBody, model, attempt + 1, null)
            const errorMsg = errorBody.error?.message || 'Unknown error'
            const errorStatus = errorBody.error?.status || 'UNKNOWN'
            log(`Non-ok response: status=${response.status}, error=${errorStatus}, message=${errorMsg}`)
            throw new ResearchError('GEMINI_ERROR', `Gemini request failed: ${errorMsg}`, response.status)
        }

        const payload = (await response.json()) as GeminiResponse
        const text = payload.candidates?.[0]?.content?.parts?.[0]?.text

        if (!text) {
            log('Empty response from Gemini')
            throw new ResearchError('GEMINI_ERROR', 'Gemini returned no content', 502)
        }

        const report = parseResearchReport(text)
        const tokensUsed = payload.usageMetadata?.totalTokenCount ?? null
        log(`Request completed, tokens=${tokensUsed ?? 'unknown'}`)

        return { report, tokensUsed, model }
    }

    log('All retries exhausted after rate limiting')
    throw lastError ?? new ResearchError('AI_RATE_LIMITED', 'The AI service is temporarily busy. Please try again in a moment.', 429)
}
