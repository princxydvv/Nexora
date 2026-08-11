'use client'

import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, FileText, Globe, Sparkles, Wand2, Zap } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  researchDepthOptions,
  researchStageOrder,
  researchTypeOptions,
  type ResearchDepth,
  type ResearchStage,
  type ResearchType,
} from '@/features/research/types/research'
import { submitResearchRequest } from '@/features/research/lib/client'

const stageLabels: Record<ResearchStage, string> = {
  researching: 'Researching...',
  searching: 'Searching Web...',
  analyzing: 'Analyzing Sources...',
  writing: 'Writing Report...',
  saving: 'Saving...',
  completed: 'Complete',
  failed: 'Failed',
}

export default function NewResearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [topic, setTopic] = useState('')
  const [instructions, setInstructions] = useState('')
  const [selectedType, setSelectedType] = useState<ResearchType>('market')
  const [selectedDepth, setSelectedDepth] = useState<ResearchDepth>('standard')
  const [isLoading, setIsLoading] = useState(false)
  const [currentStage, setCurrentStage] = useState<ResearchStage | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const suggestedTopic = searchParams.get('topic')
    if (suggestedTopic) {
      setTopic(suggestedTopic)
    }
  }, [searchParams])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setCurrentStage('researching')
    setStatusMessage(stageLabels.researching)

    let didComplete = false

    try {
      await submitResearchRequest(
        {
          topic,
          instructions,
          reportType: selectedType,
          depth: selectedDepth,
        },
        (event) => {
          if (event.type === 'progress') {
            setCurrentStage(event.stage)
            setStatusMessage(event.message)
          }

          if (event.type === 'error') {
            throw new Error(event.message)
          }

          if (event.type === 'complete') {
            didComplete = true
            setCurrentStage('completed')
            setStatusMessage(stageLabels.completed)
            router.replace(`/report/${event.reportId}`)
          }
        }
      )

      if (!didComplete) {
        throw new Error('Research finished unexpectedly before the report was saved')
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to generate report')
      setCurrentStage('failed')
      setStatusMessage(stageLabels.failed)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/workspace" className="text-primary text-sm mb-4 inline-block">
              ← Back to Workspace
            </Link>
            <h1 className="text-3xl font-display font-italic text-foreground mb-2">
              Start New Research
            </h1>
            <p className="text-muted-foreground">
              Define your research parameters and let AI handle the rest
            </p>
          </motion.div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <form onSubmit={handleGenerate} className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-lg font-semibold text-foreground mb-4">
              What do you want to research?
            </label>
            <input
              type="text"
              placeholder="e.g., Impact of AI on healthcare industry..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-4 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground text-lg"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <label className="block text-lg font-semibold text-foreground mb-4">
              Optional Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Focus on India, compare public and private markets, include recent pricing, and cite every claim."
              rows={4}
              className="w-full px-4 py-4 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground resize-none"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label className="block text-lg font-semibold text-foreground mb-4">
              Report Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {researchTypeOptions.map((type) => (
                <motion.button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`p-4 text-left rounded-lg border transition-all ${selectedType === type.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:bg-secondary'
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <h3 className="font-semibold text-foreground mb-1">
                    {type.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {type.description}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-lg font-semibold text-foreground mb-4">
              Research Depth
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {researchDepthOptions.map((depth) => (
                <motion.button
                  key={depth.id}
                  type="button"
                  onClick={() => setSelectedDepth(depth.id)}
                  className={`p-4 text-left rounded-lg border transition-all ${selectedDepth === depth.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:bg-secondary'
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <h3 className="font-semibold text-foreground mb-1">
                    {depth.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {depth.description}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.button
            type="submit"
            disabled={isLoading || !topic.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Zap className="w-5 h-5 animate-spin" />
                {statusMessage || 'Generating Research...'}
              </>
            ) : (
              <>
                Generate Report <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>

        <motion.div
          className="mt-8 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Research Progress</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {researchStageOrder.map((stage) => {
              const isActive = currentStage === stage
              const currentIndex = currentStage ? researchStageOrder.indexOf(currentStage) : -1
              const stageIndex = researchStageOrder.indexOf(stage)
              const isComplete = currentIndex > stageIndex

              return (
                <div
                  key={stage}
                  className={`rounded-xl border px-3 py-3 text-sm ${isActive
                    ? 'border-primary bg-primary/10 text-foreground'
                    : isComplete
                      ? 'border-green-500/40 bg-green-500/10 text-green-400'
                      : 'border-border bg-background/50 text-muted-foreground'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isActive ? (
                      <Wand2 className="h-4 w-4 animate-pulse" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    <span>{stageLabels[stage]}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span>{statusMessage || 'Your report will be researched, written, saved, and then opened automatically.'}</span>
          </div>
          {error && (
            <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
              <p className="font-medium mb-2">Research failed</p>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setCurrentStage(null)
                  setStatusMessage('')
                }}
                className="mt-3 px-4 py-2 rounded-lg border border-red-500/40 hover:bg-red-500/20 transition-colors text-red-400 text-xs font-medium"
              >
                Try Again
              </button>
            </div>
          )}
        </motion.div>

        <motion.div
          className="mt-12 p-6 bg-secondary/30 border border-border rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-semibold text-foreground mb-2">💡 Pro Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              • Be specific with your topic for more targeted results
            </li>
            <li>
              • Standard depth is recommended for most use cases
            </li>
            <li>
              • Deep research takes longer but provides comprehensive insights
            </li>
          </ul>
        </motion.div>
      </div>
    </main>
  )
}
