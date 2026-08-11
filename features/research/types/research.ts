export type ResearchType = 'market' | 'tech' | 'competitive' | 'career' | 'policy' | 'custom'
export type ResearchDepth = 'basic' | 'standard' | 'deep'
export type ResearchStage = 'researching' | 'searching' | 'analyzing' | 'writing' | 'saving' | 'completed' | 'failed'

export interface ResearchRequest {
    topic: string
    instructions: string
    reportType: ResearchType
    depth: ResearchDepth
}

export interface ResearchSource {
    title: string
    content: string
    url: string
    publishedDate: string | null
}

export interface ResearchReference {
    title: string
    url: string
    publishedDate: string | null
    summary: string
}

export interface ResearchReportJson {
    executiveSummary: string
    background: string
    currentMarket: string
    keyInsights: string[]
    risks: string[]
    opportunities: string[]
    futureTrends: string[]
    references: ResearchReference[]
    conclusion: string
}

export interface ResearchReportSummary {
    id: string
    title: string
    query: string
    status: ResearchStage
    created_at: string
    tokens_used: number | null
    model: string | null
    summary: string | null
    sourceCount: number
}

export interface ResearchReportRecord extends ResearchReportSummary {
    report_json: ResearchReportJson | null
    sources_json: ResearchSource[]
}

export interface ResearchStreamProgressEvent {
    type: 'progress'
    stage: ResearchStage
    message: string
    reportId: string
}

export interface ResearchStreamCompleteEvent {
    type: 'complete'
    reportId: string
    report: ResearchReportJson
}

export interface ResearchStreamErrorEvent {
    type: 'error'
    message: string
}

export type ResearchStreamEvent = ResearchStreamProgressEvent | ResearchStreamCompleteEvent | ResearchStreamErrorEvent

export const researchTypeOptions: Array<{ id: ResearchType; title: string; description: string }> = [
    {
        id: 'market',
        title: 'Market Research',
        description: 'Analyze market size, trends, and opportunities',
    },
    {
        id: 'tech',
        title: 'Technology Analysis',
        description: 'Deep dive into technology stacks and innovations',
    },
    {
        id: 'competitive',
        title: 'Competitive Analysis',
        description: 'Understand your competitors and market positioning',
    },
    {
        id: 'career',
        title: 'Career Research',
        description: 'Explore industries, companies, and career paths',
    },
    {
        id: 'policy',
        title: 'Policy Research',
        description: 'Analyze regulations, policies, and compliance',
    },
    {
        id: 'custom',
        title: 'Custom Research',
        description: 'Define your own research parameters and goals',
    },
]

export const researchDepthOptions: Array<{ id: ResearchDepth; title: string; description: string }> = [
    {
        id: 'basic',
        title: 'Basic',
        description: 'Quick overview of the topic',
    },
    {
        id: 'standard',
        title: 'Standard',
        description: 'Comprehensive analysis (recommended)',
    },
    {
        id: 'deep',
        title: 'Deep',
        description: 'In-depth research with detailed insights',
    },
]

export const researchStageOrder: ResearchStage[] = ['researching', 'searching', 'analyzing', 'writing', 'saving']
