import { generateResearchReportOpenRouter } from '@/lib/ai/openrouter'
import { generateResearchReportGemini } from '@/lib/ai/gemini'
import { ResearchError, isResearchError } from '@/features/research/lib/errors'
import type { ResearchDepth, ResearchReportJson, ResearchSource, ResearchType } from '@/features/research/types/research'

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
    console.log(`[LLM] ${message}`)
}

function isRetryableError(error: unknown): boolean {
    if (!isResearchError(error)) return false

    const retryableCodes = [
        'OPENROUTER_RATE_LIMITED',
        'OPENROUTER_SERVER_ERROR',
        'OPENROUTER_ERROR',
    ]

    const retryableStatuses = [429, 500, 502, 503]

    return retryableCodes.includes(error.code) || retryableStatuses.includes(error.status)
}

export async function generateResearchReport(
    params: GenerateResearchReportParams
): Promise<GenerateResearchReportResult> {
    const hasOpenRouter = !!process.env.OPENROUTER_API_KEY
    const hasGemini = !!process.env.GEMINI_API_KEY

    if (!hasOpenRouter && !hasGemini) {
        throw new ResearchError('INVALID_INPUT', 'No LLM provider configured (OpenRouter or Gemini required)', 500)
    }

    let lastError: ResearchError | null = null

    // Try OpenRouter first if available
    if (hasOpenRouter) {
        try {
            log('Provider: OpenRouter')
            const result = await generateResearchReportOpenRouter(params)
            log('OpenRouter succeeded')
            return result
        } catch (error) {
            if (isResearchError(error)) {
                log(`OpenRouter failed: ${error.status} ${error.code}`)
                lastError = error
            } else {
                log(`OpenRouter failed: ${error instanceof Error ? error.message : 'unknown error'}`)
                lastError = new ResearchError('OPENROUTER_ERROR', 'OpenRouter request failed', 500)
            }

            if (!isRetryableError(error)) {
                throw error
            }
        }
    }

    // Fallback to Gemini if available
    if (hasGemini) {
        try {
            log('Switching to Gemini...')
            const result = await generateResearchReportGemini(params)
            log('Gemini succeeded')
            return result
        } catch (error) {
            if (isResearchError(error)) {
                log(`Gemini failed: ${error.status} ${error.code}`)
                lastError = error
            } else {
                log(`Gemini failed: ${error instanceof Error ? error.message : 'unknown error'}`)
                lastError = new ResearchError('GEMINI_ERROR', 'Gemini request failed', 500)
            }
        }
    }

    // All providers failed
    if (lastError) {
        throw lastError
    }

    throw new ResearchError('LLM_ERROR', 'All LLM providers failed', 500)
}
