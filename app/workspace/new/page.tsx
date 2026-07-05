'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const researchTypes = [
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

const researchDepths = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Quick overview of the topic',
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Comprehensive analysis (recommended)',
  },
  {
    id: 'deep',
    name: 'Deep',
    description: 'In-depth research with detailed insights',
  },
]

export default function NewResearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [topic, setTopic] = useState('')
  const [selectedType, setSelectedType] = useState('market')
  const [selectedDepth, setSelectedDepth] = useState('standard')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const suggestedTopic = searchParams.get('topic')
    if (suggestedTopic) {
      setTopic(suggestedTopic)
    }
  }, [searchParams])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Mock generation logic
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
    router.push(`/report/${encodeURIComponent(topic.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 48) || 'new')}`)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <form onSubmit={handleGenerate} className="space-y-8">
          {/* Topic Input */}
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

          {/* Research Type */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label className="block text-lg font-semibold text-foreground mb-4">
              Research Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {researchTypes.map((type) => (
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

          {/* Research Depth */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-lg font-semibold text-foreground mb-4">
              Research Depth
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {researchDepths.map((depth) => (
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
                    {depth.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {depth.description}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading || !topic}
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
                Generating Research...
              </>
            ) : (
              <>
                Generate Report <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>

        {/* Info Box */}
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
