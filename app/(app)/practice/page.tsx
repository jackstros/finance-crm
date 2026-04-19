'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  QUESTIONS as STATIC_QUESTIONS,
  TOPIC_LABELS,
  DIFFICULTY_LABELS,
  QUESTION_TYPE_LABELS,
  TOPICS,
  DIFFICULTIES,
  type Difficulty,
  type Topic,
  type QuestionType,
  type Question,
} from '@/lib/questions'

// ── Style maps ────────────────────────────────────────────────────────────────

const DIFFICULTY_META: Record<Difficulty, { badge: string; dot: string; desc: string }> = {
  easy:     { badge: 'bg-pos/20 text-pos',   dot: 'bg-pos',  desc: 'Core concepts and definitions' },
  medium:   { badge: 'bg-warn/20 text-warn', dot: 'bg-warn', desc: 'Application and analysis' },
  advanced: { badge: 'bg-neg/20 text-neg',   dot: 'bg-neg',  desc: 'Complex, multi-step problems' },
}

const TOPIC_META: Record<Topic, { badge: string; desc: string }> = {
  accounting:        { badge: 'bg-[#4A90E2]/20 text-[#4A90E2]',  desc: 'Financial statements, GAAP, accounting mechanics' },
  valuation:         { badge: 'bg-[#9B59B6]/20 text-[#9B59B6]',  desc: 'Comps, precedents, multiples frameworks' },
  dcf:               { badge: 'bg-[#5B8AF0]/20 text-[#5B8AF0]',  desc: 'DCF modeling, WACC, terminal value' },
  lbo:               { badge: 'bg-[#E67E22]/20 text-[#E67E22]',  desc: 'LBO mechanics, returns, PE concepts' },
  ma:                { badge: 'bg-[#1ABC9C]/20 text-[#1ABC9C]',  desc: 'Deal structure, synergies, merger models' },
  restructuring:     { badge: 'bg-[#E74C3C]/20 text-[#E74C3C]',  desc: 'Bankruptcy, distress, capital structure repair' },
  financial_markets: { badge: 'bg-[#F39C12]/20 text-[#F39C12]',  desc: 'Macro, rates, markets, estimation questions' },
}

type Screen = 'type' | 'technical-filter' | 'quiz' | 'results'
type SessionResult = { question: Question; correct: boolean }

// ── Multi-select dropdown ─────────────────────────────────────────────────────

function MultiSelect<T extends string>({
  label,
  placeholder,
  options,
  selected,
  onChange,
  renderOption,
}: {
  label: string
  placeholder: string
  options: readonly T[]
  selected: T[]
  onChange: (vals: T[]) => void
  renderOption: (o: T) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function toggle(o: T) {
    if (selected.includes(o)) {
      onChange(selected.filter((s) => s !== o))
    } else {
      onChange([...selected, o])
    }
  }

  const summaryText =
    selected.length === 0
      ? placeholder
      : selected.length === options.length
      ? `All ${label.toLowerCase()}`
      : `${selected.length} selected`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-4 py-3.5 bg-n8 border rounded-xl transition-colors text-left ${
          open ? 'border-gold/50' : 'border-n7 hover:border-n5'
        }`}
      >
        <div>
          <p className="text-xs text-muted mb-0.5">{label}</p>
          <p className={`text-sm font-medium ${selected.length > 0 ? 'text-white' : 'text-muted'}`}>
            {summaryText}
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-muted transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-n8 border border-n7 rounded-xl overflow-hidden shadow-2xl z-20">
          {options.map((o, i) => (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-n6 transition-colors text-left ${
                i < options.length - 1 ? 'border-b border-n7/40' : ''
              }`}
            >
              {/* Checkbox */}
              <div
                className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-colors ${
                  selected.includes(o) ? 'bg-gold border-gold' : 'border-n5 bg-n9'
                }`}
              >
                {selected.includes(o) && (
                  <svg className="w-2.5 h-2.5 text-n9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              {renderOption(o)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Screen 1: Question Type ───────────────────────────────────────────────────

function TypeScreen({ onSelect }: { onSelect: (t: QuestionType) => void }) {
  return (
    <div className="px-8 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Interview Practice</h1>
        <p className="text-sm text-muted mt-1">
          Choose a question type to begin your session.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {(['behavioral', 'technical'] as QuestionType[]).map((t) => (
          <button
            key={t}
            onClick={() => onSelect(t)}
            className="group bg-n8 border border-n7 rounded-xl p-6 text-left hover:border-gold/40 hover:bg-n6 transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                {t === 'behavioral' ? (
                  <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <span className="text-base font-semibold text-white">{QUESTION_TYPE_LABELS[t]}</span>
            </div>
            <p className="text-sm text-muted leading-snug">
              {t === 'behavioral'
                ? 'Tell me about yourself, motivations, leadership and situational questions'
                : 'Accounting, valuation, DCF, LBO, M&A, restructuring, and markets'}
            </p>
            <div className="mt-4 flex items-center text-xs text-gold/70 group-hover:text-gold transition-colors">
              Select <svg className="w-3.5 h-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Screen 2a: Technical filter (multi-select dropdowns) ──────────────────────

function TechnicalFilterScreen({
  allQuestions,
  onStart,
  onBack,
}: {
  allQuestions: Question[]
  onStart: (questions: Question[]) => void
  onBack: () => void
}) {
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([])
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([])

  const effectiveTopics = selectedTopics.length > 0 ? selectedTopics : [...TOPICS]
  const effectiveDiffs  = selectedDifficulties.length > 0 ? selectedDifficulties : [...DIFFICULTIES]

  const technicalPool = allQuestions.some((q) => q.question_type === 'technical')
    ? allQuestions
    : STATIC_QUESTIONS

  const filtered = technicalPool.filter(
    (q) =>
      q.question_type === 'technical' &&
      q.topic !== null &&
      effectiveTopics.includes(q.topic as Topic) &&
      q.difficulty !== null && effectiveDiffs.includes(q.difficulty)
  )

  function start() {
    const shuffled = [...filtered].sort(() => Math.random() - 0.5)
    onStart(shuffled)
  }

  return (
    <div className="px-8 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Technical Practice</h1>
        <p className="text-sm text-muted mt-1">
          Filter by topic and difficulty, then start your session.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        <MultiSelect
          label="Topics"
          placeholder="All topics"
          options={TOPICS}
          selected={selectedTopics}
          onChange={setSelectedTopics}
          renderOption={(t) => (
            <div className="flex items-center gap-2.5">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TOPIC_META[t].badge}`}>
                {TOPIC_LABELS[t]}
              </span>
              <span className="text-xs text-muted">{TOPIC_META[t].desc}</span>
            </div>
          )}
        />

        <MultiSelect
          label="Difficulty"
          placeholder="All difficulties"
          options={DIFFICULTIES}
          selected={selectedDifficulties}
          onChange={setSelectedDifficulties}
          renderOption={(d) => (
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${DIFFICULTY_META[d].dot}`} />
              <span className="text-sm font-medium text-white">{DIFFICULTY_LABELS[d]}</span>
              <span className="text-xs text-muted">{DIFFICULTY_META[d].desc}</span>
            </div>
          )}
        />
      </div>

      {/* Question count */}
      <div className="flex items-center gap-2 mb-6 px-1">
        <span className={`text-sm font-semibold ${filtered.length > 0 ? 'text-white' : 'text-neg'}`}>
          {filtered.length}
        </span>
        <span className="text-sm text-muted">
          question{filtered.length !== 1 ? 's' : ''} match your filters
        </span>
        {(selectedTopics.length > 0 || selectedDifficulties.length > 0) && (
          <button
            type="button"
            onClick={() => { setSelectedTopics([]); setSelectedDifficulties([]) }}
            className="ml-auto text-xs text-muted hover:text-white transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      <button
        onClick={start}
        disabled={filtered.length === 0}
        className="w-full py-3 text-sm font-semibold text-n9 bg-gold rounded-xl hover:bg-gold2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-4"
      >
        Start Practice
      </button>

      <button onClick={onBack} className="text-sm text-muted hover:text-white transition-colors">
        ← Back
      </button>
    </div>
  )
}


// ── Screen 3: Quiz ────────────────────────────────────────────────────────────

function QuizScreen({
  questions,
  onFinish,
}: {
  questions: Question[]
  onFinish: (results: SessionResult[]) => void
}) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState<SessionResult[]>([])

  const q = questions[index]
  if (!q) return null
  const diffMeta = q.difficulty ? DIFFICULTY_META[q.difficulty] : null
  const progress = (index / questions.length) * 100

  function answer(correct: boolean) {
    const next = [...results, { question: q, correct }]
    setResults(next)
    if (index + 1 >= questions.length) {
      onFinish(next)
    } else {
      setIndex((i) => i + 1)
      setRevealed(false)
    }
  }

  return (
    <div className="px-8 py-8 max-w-2xl">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted">
            {index + 1} / {questions.length}
          </p>
          <p className="text-xs text-muted">
            {results.filter((r) => r.correct).length} correct
          </p>
        </div>
        <div className="h-0.5 bg-n7 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-n8 border border-n7 rounded-xl overflow-hidden mb-4">
        <div className="px-6 py-5">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-4">
            {diffMeta && q.difficulty ? (
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${diffMeta.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${diffMeta.dot}`} />
                {DIFFICULTY_LABELS[q.difficulty]}
              </span>
            ) : null}
            {q.topic ? (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TOPIC_META[q.topic].badge}`}>
                {TOPIC_LABELS[q.topic]}
              </span>
            ) : (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-n7 text-muted">
                Behavioral
              </span>
            )}
          </div>

          <p className="text-base font-medium text-white leading-snug">{q.question}</p>
        </div>

        {!revealed ? (
          <div className="px-6 pb-6">
            <button
              onClick={() => setRevealed(true)}
              className="w-full py-2.5 text-sm font-medium text-muted border border-n7 rounded-lg hover:border-gold/30 hover:text-white hover:bg-n6 transition-all"
            >
              Reveal Answer
            </button>
          </div>
        ) : (
          <div className="border-t border-n7 px-6 py-5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Answer</p>
            <p className="text-sm text-white/90 whitespace-pre-line leading-relaxed">{q.answer}</p>
          </div>
        )}
      </div>

      {/* Self-assessment */}
      {revealed && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => answer(false)}
            className="py-3 text-sm font-semibold text-neg border border-neg/30 rounded-xl hover:bg-neg/10 transition-colors"
          >
            Missed it
          </button>
          <button
            onClick={() => answer(true)}
            className="py-3 text-sm font-semibold text-pos border border-pos/30 rounded-xl hover:bg-pos/10 transition-colors"
          >
            Got it ✓
          </button>
        </div>
      )}
    </div>
  )
}

// ── Screen 4: Results ─────────────────────────────────────────────────────────

function ResultsScreen({
  results,
  onRetry,
  onNew,
}: {
  results: SessionResult[]
  onRetry: () => void
  onNew: () => void
}) {
  const total = results.length
  const correct = results.filter((r) => r.correct).length
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0

  const byType = (['behavioral', 'technical'] as QuestionType[]).map((t) => {
    const qs = results.filter((r) => r.question.question_type === t)
    if (qs.length === 0) return null
    const c = qs.filter((r) => r.correct).length
    return { type: t, correct: c, total: qs.length, pct: Math.round((c / qs.length) * 100) }
  }).filter(Boolean) as { type: QuestionType; correct: number; total: number; pct: number }[]

  const technicalResults = results.filter((r) => r.question.question_type === 'technical')
  const byTopic = TOPICS.map((t) => {
    const qs = technicalResults.filter((r) => r.question.topic === t)
    if (qs.length === 0) return null
    const c = qs.filter((r) => r.correct).length
    return { topic: t, correct: c, total: qs.length, pct: Math.round((c / qs.length) * 100) }
  }).filter(Boolean) as { topic: Topic; correct: number; total: number; pct: number }[]

  useEffect(() => {
    localStorage.setItem('practice_last_score', `${correct}/${total}`)
    const breakdown = {
      byType: (['behavioral', 'technical'] as QuestionType[])
        .map((t) => {
          const qs = results.filter((r) => r.question.question_type === t)
          if (qs.length === 0) return null
          return { type: t, score: qs.filter((r) => r.correct).length, total: qs.length }
        })
        .filter(Boolean),
      byTopic: TOPICS
        .map((t) => {
          const qs = results.filter((r) => r.question.topic === t)
          if (qs.length === 0) return null
          return { topic: t, score: qs.filter((r) => r.correct).length, total: qs.length }
        })
        .filter(Boolean),
    }
    localStorage.setItem('practice_breakdown', JSON.stringify(breakdown))
  }, [correct, total]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="px-8 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Session Complete</h1>
        <p className="text-sm text-muted mt-1">Here&apos;s how you performed</p>
      </div>

      {/* Score */}
      <div className="bg-n8 border border-n7 rounded-xl p-6 mb-4 text-center">
        <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Overall Score</p>
        <p className="text-5xl font-bold text-gold mb-1">{pct}%</p>
        <p className="text-sm text-muted">{correct} of {total} correct</p>
        <div className="mt-4 h-1.5 bg-n7 rounded-full overflow-hidden">
          <div className="h-full bg-gold rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* By question type */}
      {byType.length > 1 && (
        <div className="bg-n8 border border-n7 rounded-xl p-5 mb-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">By Question Type</p>
          <div className="space-y-3">
            {byType.map(({ type, correct: c, total: t, pct: p }) => (
              <div key={type}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-white">{QUESTION_TYPE_LABELS[type]}</span>
                  <span className="text-xs text-muted">{c}/{t} ({p}%)</span>
                </div>
                <div className="h-1 bg-n7 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${p >= 80 ? 'bg-pos' : p >= 50 ? 'bg-warn' : 'bg-neg'}`}
                    style={{ width: `${p}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By topic (technical only) */}
      {byTopic.length > 0 && (
        <div className="bg-n8 border border-n7 rounded-xl p-5 mb-6">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Technical — By Topic</p>
          <div className="space-y-3">
            {byTopic.map(({ topic, correct: c, total: t, pct: p }) => (
              <div key={topic}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TOPIC_META[topic].badge}`}>
                    {TOPIC_LABELS[topic]}
                  </span>
                  <span className="text-xs text-muted">{c}/{t} ({p}%)</span>
                </div>
                <div className="h-1 bg-n7 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${p >= 80 ? 'bg-pos' : p >= 50 ? 'bg-warn' : 'bg-neg'}`}
                    style={{ width: `${p}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="flex-1 py-2.5 text-sm font-medium text-muted border border-n7 rounded-lg hover:bg-n6 hover:text-white transition-colors"
        >
          Retry Same Questions
        </button>
        <button
          onClick={onNew}
          className="flex-1 py-2.5 text-sm font-semibold text-n9 bg-gold rounded-lg hover:bg-gold2 transition-colors"
        >
          New Session
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PracticePage() {
  const supabase = createClient()
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [loadingQ, setLoadingQ] = useState(true)
  const [screen, setScreen] = useState<Screen>('type')

  // Session
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([])
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([])

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('questions')
          .select('*')
          .order('created_at', { ascending: true })
        setAllQuestions(data && data.length > 0 ? data : STATIC_QUESTIONS)
      } catch {
        setAllQuestions(STATIC_QUESTIONS)
      } finally {
        setLoadingQ(false)
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function startSession(questions: Question[]) {
    setSessionQuestions(questions)
    setSessionResults([])
    setScreen('quiz')
  }

  function startBehavioralSession() {
    const qs = allQuestions.filter((q) => q.question_type === 'behavioral')
    const pool = qs.length > 0 ? qs : STATIC_QUESTIONS.filter((q) => q.question_type === 'behavioral')
    startSession([...pool].sort(() => Math.random() - 0.5))
  }

  function resetToStart() {
    setScreen('type')
    setSessionQuestions([])
    setSessionResults([])
  }

  if (loadingQ) {
    return (
      <div className="px-8 py-8">
        <div className="flex items-center justify-center py-32 text-sm text-muted">Loading…</div>
      </div>
    )
  }

  if (screen === 'quiz') {
    return (
      <QuizScreen
        questions={sessionQuestions}
        onFinish={(results) => {
          setSessionResults(results)
          setScreen('results')
        }}
      />
    )
  }

  if (screen === 'results') {
    return (
      <ResultsScreen
        results={sessionResults}
        onRetry={() => {
          setScreen('quiz')
          setSessionResults([])
        }}
        onNew={resetToStart}
      />
    )
  }

  if (screen === 'type') {
    return (
      <TypeScreen
        onSelect={(t) => {
          if (t === 'behavioral') {
            startBehavioralSession()
          } else {
            setScreen('technical-filter')
          }
        }}
      />
    )
  }

  // screen === 'technical-filter'
  return (
    <TechnicalFilterScreen
      allQuestions={allQuestions}
      onStart={startSession}
      onBack={() => setScreen('type')}
    />
  )
}
