import type {
    ResearchDepth,
    ResearchReportJson,
    ResearchReportRecord,
    ResearchReportSummary,
    ResearchRequest,
    ResearchStage,
    ResearchStreamEvent,
    ResearchType,
} from '@/features/research/types/research'

export interface ResearchOverviewResponse {
    reports: ResearchReportSummary[]
    totalReports: number
    totalTokens: number
    totalSources: number
}

export interface ResearchDetailResponse {
    report: ResearchReportRecord
}

function parseJsonResponse(response: Response): Promise<unknown> {
    return response.json() as Promise<unknown>
}

async function readErrorMessage(response: Response): Promise<string> {
    try {
        const payload = await parseJsonResponse(response)
        if (payload && typeof payload === 'object' && 'error' in payload && typeof (payload as { error?: unknown }).error === 'string') {
            return (payload as { error: string }).error
        }
    } catch {
        const text = await response.text()
        if (text) {
            return text
        }
    }

    return 'Request failed'
}

export async function fetchResearchOverview(): Promise<ResearchOverviewResponse> {
    const response = await fetch('/api/research', {
        method: 'GET',
        cache: 'no-store',
    })

    if (!response.ok) {
        throw new Error(await readErrorMessage(response))
    }

    return (await parseJsonResponse(response)) as ResearchOverviewResponse
}

export async function fetchResearchReport(reportId: string): Promise<ResearchDetailResponse> {
    const response = await fetch(`/api/research/${encodeURIComponent(reportId)}`, {
        method: 'GET',
        cache: 'no-store',
    })

    if (!response.ok) {
        throw new Error(await readErrorMessage(response))
    }

    return (await parseJsonResponse(response)) as ResearchDetailResponse
}

export async function submitResearchRequest(
    input: ResearchRequest,
    onEvent: (event: ResearchStreamEvent) => void
): Promise<void> {
    const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/x-ndjson',
        },
        body: JSON.stringify(input),
    })

    if (!response.ok || !response.body) {
        throw new Error(await readErrorMessage(response))
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) {
                break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed) {
                    continue
                }

                onEvent(JSON.parse(trimmed) as ResearchStreamEvent)
            }
        }

        const remaining = buffer.trim()
        if (remaining) {
            onEvent(JSON.parse(remaining) as ResearchStreamEvent)
        }
    } finally {
        reader.releaseLock()
    }
}
