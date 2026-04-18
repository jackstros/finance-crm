'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  QUESTIONS as STATIC_QUESTIONS,
  TOPIC_LABELS,
  DIFFICULTY_LABELS,
  type Difficulty,
  type Topic,
  type Question,
} from '@/lib/questions'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'advanced']
const TOPICS: Topic[] = ['accounting', 'valuation', 'dcf', 'lbo', 'other', 'brainteaser']

const DIFFICULTY_STYLES: Record<Difficulty, { badge: string; dot: string }> = {
  easy:     { badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-400' },
  medium:   { badge: 'bg-amber-50 text-amber-700',     dot: 'bg-amber-400' },
  advanced: { badge: 'bg-red-50 text-red-700',          dot: 'bg-red-400' },
}

const TOPIC_STYLES: Record<Topic, string> = {
  accounting:  'bg-blue-50 text-blue-700',
  valuation:   'bg-violet-50 text-violet-700',
  dcf:         'bg-indigo-50 text-indigo-700',
  lbo:         'bg-orange-50 text-orange-700',
  other:       'bg-slate-100 text-slate-600',
  brainteaser: 'bg-pink-50 text-pink-700',
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active
          ? 'bg-indigo-600 text-white'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

function QuestionCard({ q }: { q: (typeof QUESTIONS)[number] }) {
  const [open, setOpen] = useState(false)
  const diff = DIFFICULTY_STYLES[q.difficulty]

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors"
      >
        {/* Collapse indicator */}
        <svg
          className={`w-4 h-4 text-slate-400 shrink-0 mt-0.5 transition-transform duration-200 ${
            open ? 'rotate-90' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>

        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${diff.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
              {DIFFICULTY_LABELS[q.difficulty]}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TOPIC_STYLES[q.topic]}`}>
              {TOPIC_LABELS[q.topic]}
            </span>
          </div>

          {/* Question */}
          <p className="text-sm font-medium text-slate-800 leading-snug">{q.question}</p>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-slate-100">
          <div className="ml-8">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Answer
            </p>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {q.answer}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PracticePage() {
  const supabase = createClient()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loadingQ, setLoadingQ] = useState(true)
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all')
  const [topic, setTopic] = useState<Topic | 'all'>('all')
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setQuestions(data && data.length > 0 ? data : STATIC_QUESTIONS)
        setLoadingQ(false)
      })
      .catch(() => {
        setQuestions(STATIC_QUESTIONS)
        setLoadingQ(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = questions.filter(
    (q) =>
      (difficulty === 'all' || q.difficulty === difficulty) &&
      (topic === 'all' || q.topic === topic)
  )

  // Counts per filter for display
  const difficultyCounts = Object.fromEntries(
    DIFFICULTIES.map((d) => [
      d,
      questions.filter((q) => q.difficulty === d && (topic === 'all' || q.topic === topic)).length,
    ])
  ) as Record<Difficulty, number>

  const topicCounts = Object.fromEntries(
    TOPICS.map((t) => [
      t,
      questions.filter((q) => q.topic === t && (difficulty === 'all' || q.difficulty === difficulty)).length,
    ])
  ) as Record<Topic, number>

  if (loadingQ) {
    return (
      <div className="px-8 py-8 max-w-3xl">
        <div className="flex items-center justify-center py-32 text-sm text-slate-400">Loading…</div>
      </div>
    )
  }

  return (
    <div className="px-8 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Interview Prep</h1>
        <p className="text-sm text-slate-500 mt-1">
          Practice technical finance questions. Click a question to reveal the answer.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-2 mb-6">
        {/* Difficulty */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-slate-400 w-16 shrink-0">Difficulty</span>
          <FilterPill active={difficulty === 'all'} onClick={() => setDifficulty('all')}>
            All ({questions.filter((q) => topic === 'all' || q.topic === topic).length})
          </FilterPill>
          {DIFFICULTIES.map((d) => (
            <FilterPill key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
              {DIFFICULTY_LABELS[d]} ({difficultyCounts[d]})
            </FilterPill>
          ))}
        </div>

        {/* Topic */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-slate-400 w-16 shrink-0">Topic</span>
          <FilterPill active={topic === 'all'} onClick={() => setTopic('all')}>
            All ({questions.filter((q) => difficulty === 'all' || q.difficulty === difficulty).length})
          </FilterPill>
          {TOPICS.map((t) => (
            <FilterPill key={t} active={topic === t} onClick={() => setTopic(t)}>
              {TOPIC_LABELS[t]} ({topicCounts[t]})
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Results summary + expand all */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-400">
          {filtered.length} question{filtered.length !== 1 ? 's' : ''}
          {difficulty !== 'all' || topic !== 'all' ? ' matching filters' : ' total'}
        </p>
        <button
          onClick={() => setRevealed((r) => !r)}
          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
        >
          {revealed ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      {/* Question list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 flex items-center justify-center py-16">
          <p className="text-sm text-slate-400">No questions match the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => (
            <ExpandableCard key={q.id} q={q} forceOpen={revealed} />
          ))}
        </div>
      )}
    </div>
  )
}

// Separate component so forceOpen can be handled via key reset or local state
function ExpandableCard({
  q,
  forceOpen,
}: {
  q: (typeof QUESTIONS)[number]
  forceOpen: boolean
}) {
  const [open, setOpen] = useState(false)
  const isOpen = open || forceOpen
  const diff = DIFFICULTY_STYLES[q.difficulty]

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors"
      >
        <svg
          className={`w-4 h-4 text-slate-400 shrink-0 mt-0.5 transition-transform duration-200 ${
            isOpen ? 'rotate-90' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${diff.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
              {DIFFICULTY_LABELS[q.difficulty]}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TOPIC_STYLES[q.topic]}`}>
              {TOPIC_LABELS[q.topic]}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-800 leading-snug">{q.question}</p>
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-1 border-t border-slate-100">
          <div className="ml-8">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Answer
            </p>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {q.answer}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
