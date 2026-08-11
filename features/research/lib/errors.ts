export type ResearchErrorCode =
    | 'INVALID_INPUT'
    | 'SESSION_EXPIRED'
    | 'SEARCH_TIMEOUT'
    | 'SEARCH_ERROR'
    | 'EMPTY_SEARCH'
    | 'GEMINI_ERROR'
    | 'OPENROUTER_ERROR'
    | 'OPENROUTER_RATE_LIMITED'
    | 'OPENROUTER_SERVER_ERROR'
    | 'LLM_ERROR'
    | 'INVALID_JSON'
    | 'RATE_LIMIT'
    | 'AI_RATE_LIMITED'
    | 'SAVE_FAILED'
    | 'NOT_FOUND'

export class ResearchError extends Error {
    code: ResearchErrorCode
    status: number
    retryAfterMs: number | null = null

    constructor(code: ResearchErrorCode, message: string, status: number) {
        super(message)
        this.name = 'ResearchError'
        this.code = code
        this.status = status
    }
}

export function isResearchError(error: unknown): error is ResearchError {
    return error instanceof ResearchError
}
