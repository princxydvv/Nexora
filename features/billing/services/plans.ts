export type PlanId = 'free' | 'pro' | 'team'

export interface PlanConfig {
    id: PlanId
    name: string
    priceInPaise: number
    displayPrice: string
    period: string
    description: string
    reportsLimit: number
    allowedDepths: string[]
    canDownloadMarkdown: boolean
    canDownloadText: boolean
    canUseCustomInstructions: boolean
    features: string[]
    highlighted: boolean
}

export const PLANS: Record<PlanId, PlanConfig> = {
    free: {
        id: 'free',
        name: 'Free',
        priceInPaise: 0,
        displayPrice: '₹0',
        period: 'forever',
        description: 'Get started with Nexora',
        reportsLimit: 5,
        allowedDepths: ['basic', 'standard'],
        canDownloadMarkdown: false,
        canDownloadText: true,
        canUseCustomInstructions: false,
        highlighted: false,
        features: [
            '5 reports per month',
            'Basic & Standard research depth',
            'Download as TXT',
            'Web source access',
        ],
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        priceInPaise: 49900,
        displayPrice: '₹499',
        period: '/month',
        description: 'For serious researchers',
        reportsLimit: 999999,
        allowedDepths: ['basic', 'standard', 'deep'],
        canDownloadMarkdown: true,
        canDownloadText: true,
        canUseCustomInstructions: true,
        highlighted: true,
        features: [
            'Unlimited reports',
            'Deep research depth',
            'Custom instructions',
            'Download as MD & TXT',
            'Priority generation',
            'All report types',
        ],
    },
    team: {
        id: 'team',
        name: 'Team',
        priceInPaise: 149900,
        displayPrice: '₹1499',
        period: '/month',
        description: 'For teams and organizations',
        reportsLimit: 999999,
        allowedDepths: ['basic', 'standard', 'deep'],
        canDownloadMarkdown: true,
        canDownloadText: true,
        canUseCustomInstructions: true,
        highlighted: false,
        features: [
            'Everything in Pro',
            'Up to 5 team members',
            'Shared workspace',
            'Team analytics',
            'Dedicated support',
            'Advanced exports',
        ],
    },
}

export function getPlan(planId: string): PlanConfig {
    return PLANS[planId as PlanId] ?? PLANS.free
}

export function isValidPlan(value: unknown): value is PlanId {
    return value === 'free' || value === 'pro' || value === 'team'
}

export function canUseDepth(plan: PlanId, depth: string): boolean {
    return PLANS[plan].allowedDepths.includes(depth)
}

export function hasReportsRemaining(reportsUsed: number, plan: PlanId): boolean {
    const limit = PLANS[plan].reportsLimit
    if (limit >= 999999) return true
    return reportsUsed < limit
}
