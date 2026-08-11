import { generateResearchReport } from '@/lib/ai/llm'
import { searchWebSources } from '@/lib/search/tavily'
import { ResearchError } from '@/features/research/lib/errors'
import type {
    ResearchDepth,
    ResearchReportJson,
    ResearchSource,
    ResearchStage,
    ResearchType,
} from '@/features/research/types/research'

function log(message: string): void {
    console.log(`[Research] ${message}`)
}

export interface ResearchInput {
    topic: string
    instructions: string
    reportType: ResearchType
    depth: ResearchDepth
}

export interface ResearchExecutionResult {
    title: string
    query: string
    sources: ResearchSource[]
    report: ResearchReportJson
    tokensUsed: number | null
    model: string
}

type ProgressHandler = (stage: ResearchStage, message: string) => Promise<void> | void

function buildSearchQuery(input: ResearchInput): string {
    const segments = [
        input.topic.trim(),
        input.reportType.replace(/([A-Z])/g, ' $1'),
        input.depth,
        input.instructions.trim(),
    ].filter((segment) => segment.length > 0)

    return segments.join(' | ')
}

function buildTitle(topic: string): string {
    return topic.trim().replace(/\s+/g, ' ').slice(0, 96)
}

export async function executeResearch(
    input: ResearchInput,
    onProgress?: ProgressHandler
): Promise<ResearchExecutionResult> {
    const topic = input.topic.trim()
    if (!topic) {
        throw new ResearchError('INVALID_INPUT', 'Topic is required', 400)
    }

    const query = buildSearchQuery(input)
    log(`Started: topic="${topic}", type=${input.reportType}, depth=${input.depth}`)

    await onProgress?.('searching', 'Searching Web...')
    const sources = await searchWebSources(query, input.depth)
    log(`Tavily search completed: ${sources.length} sources`)

    await onProgress?.('analyzing', 'Analyzing Sources...')
    await onProgress?.('writing', 'Writing Report...')
    log('Gemini request started')
    const generated = await generateResearchReport({
        topic,
        instructions: input.instructions,
        reportType: input.reportType,
        depth: input.depth,
        sources,
    })
    log(`Report generated, tokens=${generated.tokensUsed ?? 'unknown'}`)

    return {
        title: buildTitle(topic),
        query,
        sources,
        report: generated.report,
        tokensUsed: generated.tokensUsed,
        model: generated.model,
    }
}
