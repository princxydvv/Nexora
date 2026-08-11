import { fetchWithTimeout } from '@/lib/network/fetch-with-timeout'
import { ResearchError } from '@/features/research/lib/errors'
import type { ResearchDepth, ResearchSource } from '@/features/research/types/research'

interface TavilyResult {
    title?: string
    content?: string
    raw_content?: string
    url?: string
    published_date?: string
}

interface TavilySearchResponse {
    results?: TavilyResult[]
}

function toSearchDepth(depth: ResearchDepth): 'basic' | 'advanced' {
    return depth === 'basic' ? 'basic' : 'advanced'
}

function limitContent(content: string): string {
    if (content.length <= 1800) {
        return content.trim()
    }

    return `${content.slice(0, 1800).trim()}...`
}

function normalizeSource(result: TavilyResult): ResearchSource | null {
    if (!result.title || !result.url) {
        return null
    }

    const content = result.content ?? result.raw_content ?? ''
    return {
        title: result.title.trim(),
        content: limitContent(content),
        url: result.url,
        publishedDate: result.published_date ?? null,
    }
}

export async function searchWebSources(query: string, depth: ResearchDepth): Promise<ResearchSource[]> {
    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) {
        throw new ResearchError('INVALID_INPUT', 'Tavily API key is missing', 500)
    }

    const response = await fetchWithTimeout(
        'https://api.tavily.com/search',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: apiKey,
                query,
                search_depth: toSearchDepth(depth),
                topic: 'general',
                max_results: depth === 'deep' ? 10 : 8,
                include_answer: false,
                include_raw_content: true,
                include_images: false,
            }),
        },
        25000
    )

    if (response.status === 429) {
        throw new ResearchError('RATE_LIMIT', 'Tavily rate limit reached', 429)
    }

    if (!response.ok) {
        throw new ResearchError('SEARCH_ERROR', 'Tavily search failed', response.status)
    }

    const payload = (await response.json()) as TavilySearchResponse
    const results = Array.isArray(payload.results) ? payload.results : []
    const sources = results
        .map(normalizeSource)
        .filter((source): source is ResearchSource => source !== null)
        .filter((source, index, array) => array.findIndex((candidate) => candidate.url === source.url) === index)

    if (sources.length === 0) {
        throw new ResearchError('EMPTY_SEARCH', 'No fresh sources were found for this topic', 404)
    }

    return sources
}
