'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  QUESTIONS as STATIC_QUESTIONS,
  TOPIC_LABELS,
  DIFFICULTY_LABELS,
  TOPICS,
  DIFFICULTIES,
  type Difficulty,
  type Topic,
  type QuestionType,
  type Question,
} from '@/lib/questions'

// ── Types ──────────────────────────────────────────────────────────────────────

type PracticeMode = 'freestyle' | 'set'
type Screen = 'mode' | 'size' | 'type' | 'filters' | 'quiz' | 'results'
type ResultStatus = 'correct' | 'incorrect' | 'skipped' | 'known'
type ActiveTab = 'practice' | 'known'

interface SessionResult {
  question: Question
  status: ResultStatus
}

// ── Theme constants ───────────────────────────────────────────────────────────

const T = {
  page:    '#f8fafc',
  card:    '#ffffff',
  border:  '#e2e8f0',
  borderL: '#f1f5f9',
  text:    '#0f172a',
  muted:   '#64748b',
  light:   '#94a3b8',
  teal:    '#0d9488',
  tealBg:  '#f0fdfa',
  tealDk:  '#0f766e',
}

const inputBase: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 8,
  border: `1px solid ${T.border}`, background: T.card, color: T.text,
  outline: 'none', boxSizing: 'border-box',
}

// ── Topic / difficulty metadata ───────────────────────────────────────────────

const TOPIC_COLORS: Record<Topic, { bg: string; color: string }> = {
  accounting:        { bg: '#eff6ff', color: '#3b82f6' },
  valuation:         { bg: '#f5f3ff', color: '#7c3aed' },
  dcf:               { bg: '#eff6ff', color: '#2563eb' },
  lbo:               { bg: '#fff7ed', color: '#ea580c' },
  ma:                { bg: '#f0fdfa', color: '#0d9488' },
  restructuring:     { bg: '#fef2f2', color: '#dc2626' },
  financial_markets: { bg: '#fefce8', color: '#ca8a04' },
}

const DIFF_COLORS: Record<Difficulty, { bg: string; color: string }> = {
  easy:     { bg: '#f0fdf4', color: '#16a34a' },
  medium:   { bg: '#fffbeb', color: '#d97706' },
  advanced: { bg: '#fef2f2', color: '#dc2626' },
}

// ── Small reusable components ─────────────────────────────────────────────────

function TopicBadge({ topic }: { topic: Topic | null }) {
  if (!topic) return <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: T.light }}>Behavioral</span>
  const { bg, color } = TOPIC_COLORS[topic]
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: bg, color }}>{TOPIC_LABELS[topic]}</span>
}

function DiffBadge({ diff }: { diff: Difficulty | null }) {
  if (!diff) return null
  const { bg, color } = DIFF_COLORS[diff]
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: bg, color }}>{DIFFICULTY_LABELS[diff]}</span>
}

function MultiSelect<T extends string>({
  label, placeholder, options, selected, onChange, renderOption,
}: {
  label: string; placeholder: string; options: readonly T[]; selected: T[]
  onChange: (v: T[]) => void; renderOption: (o: T) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function outside(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    if (open) document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [open])

  function toggle(o: T) {
    onChange(selected.includes(o) ? selected.filter((s) => s !== o) : [...selected, o])
  }

  const summary = selected.length === 0 ? placeholder : selected.length === options.length ? `All ${label.toLowerCase()}` : `${selected.length} selected`

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen((v) => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: T.card, border: `1px solid ${open ? T.teal : T.border}`, borderRadius: 10, cursor: 'pointer', textAlign: 'left', boxShadow: open ? `0 0 0 3px rgba(13,148,136,0.1)` : 'none' }}>
        <div>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: T.light }}>{label}</p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: selected.length > 0 ? T.text : T.muted, marginTop: 1 }}>{summary}</p>
        </div>
        <svg style={{ transform: open ? 'rotate(180deg)' : 'none', color: T.light, flexShrink: 0 }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 20, overflow: 'hidden' }}>
          {options.map((o, i) => (
            <button key={o} type="button" onClick={() => toggle(o)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: i < options.length - 1 ? `1px solid ${T.borderL}` : 'none', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = T.page}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${selected.includes(o) ? T.teal : T.border}`, background: selected.includes(o) ? T.teal : T.card, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {selected.includes(o) && <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              {renderOption(o)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Screen 1: Mode ────────────────────────────────────────────────────────────

function ModeScreen({ onSelect }: { onSelect: (m: PracticeMode) => void }) {
  return (
    <div style={{ maxWidth: 540 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: '0 0 4px', letterSpacing: '-0.01em' }}>Choose Practice Mode</h2>
      <p style={{ fontSize: 13, color: T.muted, margin: '0 0 24px' }}>How would you like to practice today?</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {([
          { mode: 'freestyle' as PracticeMode, title: 'Freestyle', desc: 'Practice as many questions as you want with no set endpoint. End the session whenever you\'re ready.' },
          { mode: 'set' as PracticeMode, title: 'Set Session', desc: 'Choose a fixed number of questions. The session ends automatically when you\'ve reached your goal.' },
        ]).map(({ mode, title, desc }) => (
          <button key={mode} onClick={() => onSelect(mode)}
            style={{ padding: '20px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = T.teal; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 3px rgba(13,148,136,0.08)` }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: '0 0 6px' }}>{title}</p>
            <p style={{ fontSize: 12, color: T.muted, margin: 0, lineHeight: 1.5 }}>{desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Screen 2: Session size (Set mode only) ────────────────────────────────────

function SizeScreen({ onSelect, onBack }: { onSelect: (n: number) => void; onBack: () => void }) {
  const [custom, setCustom] = useState('')
  const presets = [5, 10, 25, 50]

  return (
    <div style={{ maxWidth: 400 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: '0 0 4px', letterSpacing: '-0.01em' }}>How many questions?</h2>
      <p style={{ fontSize: 13, color: T.muted, margin: '0 0 24px' }}>Skips and &ldquo;I Know This&rdquo; count toward your total.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {presets.map((n) => (
          <button key={n} onClick={() => onSelect(n)}
            style={{ padding: '14px 0', fontSize: 16, fontWeight: 700, color: T.teal, background: T.tealBg, border: `1px solid rgba(13,148,136,0.2)`, borderRadius: 10, cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = '#ccfbf1'}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = T.tealBg}>
            {n}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="number" min={1} max={500} placeholder="Custom number"
          value={custom} onChange={(e) => setCustom(e.target.value)}
          style={{ ...inputBase, flex: 1 }}
        />
        <button
          onClick={() => { const n = parseInt(custom); if (n > 0) onSelect(n) }}
          disabled={!custom || parseInt(custom) < 1}
          style={{ padding: '9px 16px', fontSize: 13, fontWeight: 600, color: '#fff', background: T.teal, border: 'none', borderRadius: 8, cursor: 'pointer', opacity: !custom || parseInt(custom) < 1 ? 0.4 : 1 }}>
          Start
        </button>
      </div>
      <button onClick={onBack} style={{ marginTop: 16, fontSize: 13, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Back</button>
    </div>
  )
}

// ── Screen 3: Question type ───────────────────────────────────────────────────

function TypeScreen({ onSelect, onBack }: { onSelect: (t: QuestionType) => void; onBack: () => void }) {
  return (
    <div style={{ maxWidth: 480 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: '0 0 4px', letterSpacing: '-0.01em' }}>Choose Question Type</h2>
      <p style={{ fontSize: 13, color: T.muted, margin: '0 0 24px' }}>Select the type of questions you want to practice.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {([
          { type: 'behavioral' as QuestionType, title: 'Behavioral', desc: 'Motivations, leadership, situational, and story-based questions' },
          { type: 'technical' as QuestionType, title: 'Technical', desc: 'Accounting, valuation, DCF, LBO, M&A, restructuring, and markets' },
        ]).map(({ type, title, desc }) => (
          <button key={type} onClick={() => onSelect(type)}
            style={{ padding: '20px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = T.teal; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 3px rgba(13,148,136,0.08)` }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: '0 0 6px' }}>{title}</p>
            <p style={{ fontSize: 12, color: T.muted, margin: 0, lineHeight: 1.5 }}>{desc}</p>
          </button>
        ))}
      </div>
      <button onClick={onBack} style={{ marginTop: 20, fontSize: 13, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Back</button>
    </div>
  )
}

// ── Screen 4: Technical filters ───────────────────────────────────────────────

function FiltersScreen({
  allQuestions, onStart, onBack,
}: {
  allQuestions: Question[]
  onStart: (questions: Question[], topics: Topic[], difficulties: Difficulty[]) => void
  onBack: () => void
}) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [diffs, setDiffs] = useState<Difficulty[]>([])

  const pool = allQuestions.some((q) => q.question_type === 'technical') ? allQuestions : STATIC_QUESTIONS
  const effectiveTopics = topics.length > 0 ? topics : [...TOPICS]
  const effectiveDiffs = diffs.length > 0 ? diffs : [...DIFFICULTIES]

  const filtered = pool.filter(
    (q) => q.question_type === 'technical' && q.topic && effectiveTopics.includes(q.topic as Topic) && q.difficulty && effectiveDiffs.includes(q.difficulty)
  )

  return (
    <div style={{ maxWidth: 480 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: '0 0 4px', letterSpacing: '-0.01em' }}>Filter Questions</h2>
      <p style={{ fontSize: 13, color: T.muted, margin: '0 0 24px' }}>Leave blank to include all topics and difficulties.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        <MultiSelect
          label="Topics" placeholder="All topics" options={TOPICS} selected={topics} onChange={setTopics}
          renderOption={(t) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TopicBadge topic={t} />
            </div>
          )}
        />
        <MultiSelect
          label="Difficulty" placeholder="All difficulties" options={DIFFICULTIES} selected={diffs} onChange={setDiffs}
          renderOption={(d) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DiffBadge diff={d} />
            </div>
          )}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: filtered.length > 0 ? T.text : '#dc2626', fontWeight: 600 }}>{filtered.length}</span>
        <span style={{ fontSize: 13, color: T.muted }}>question{filtered.length !== 1 ? 's' : ''} match</span>
        {(topics.length > 0 || diffs.length > 0) && (
          <button onClick={() => { setTopics([]); setDiffs([]) }} style={{ marginLeft: 'auto', fontSize: 12, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Clear filters</button>
        )}
      </div>

      <button
        onClick={() => onStart([...filtered].sort(() => Math.random() - 0.5), topics.length > 0 ? topics : [...TOPICS], diffs.length > 0 ? diffs : [...DIFFICULTIES])}
        disabled={filtered.length === 0}
        style={{ width: '100%', padding: '11px', fontSize: 13, fontWeight: 600, color: '#fff', background: T.teal, border: 'none', borderRadius: 10, cursor: 'pointer', opacity: filtered.length === 0 ? 0.4 : 1, marginBottom: 12 }}>
        Start Practice
      </button>
      <button onClick={onBack} style={{ fontSize: 13, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Back</button>
    </div>
  )
}

// ── Screen 5: Quiz ────────────────────────────────────────────────────────────

function QuizScreen({
  questions,
  mode,
  sessionSize,
  onEnd,
  knownIds,
  onMarkKnown,
}: {
  questions: Question[]
  mode: PracticeMode
  sessionSize: number | null
  onEnd: (results: SessionResult[]) => void
  knownIds: Set<string>
  onMarkKnown: (q: Question) => Promise<void>
}) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [selfAssess, setSelfAssess] = useState<'correct' | 'incorrect' | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Use a ref so advance() always reads the latest list synchronously,
  // avoiding the stale-closure / setState-async race that caused missing saves.
  const resultsRef = useRef<SessionResult[]>([])
  const [resultsLen, setResultsLen] = useState(0) // just for re-render

  const pool = questions
  const q = mode === 'freestyle'
    ? pool[index % pool.length]
    : pool[index]

  if (!q) return null

  const total = sessionSize ?? null
  const answered = resultsLen  // total questions touched (all statuses)

  function advance(status: ResultStatus) {
    const next = [...resultsRef.current, { question: q, status }]
    resultsRef.current = next
    setResultsLen(next.length)

    if (mode === 'set' && total !== null && next.length >= total) {
      onEnd(next)   // pass the complete, up-to-date list directly
      return
    }
    setIndex((i) => i + 1)
    setRevealed(false)
    setSelfAssess(null)
  }

  async function handleKnown() {
    setToast('Saved to your known questions')
    await onMarkKnown(q)
    setTimeout(() => {
      setToast(null)
      advance('known')
    }, 1200)
  }

  const progressPct = total ? Math.min((answered / total) * 100, 100) : 0
  const questionNum = answered + 1

  return (
    <div style={{ maxWidth: 600 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: T.muted }}>
            {mode === 'set' && total
              ? `Question ${questionNum} of ${total}`
              : `Question ${questionNum}`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: T.light }}>
          {mode === 'freestyle' && (
            <span>{answered} answered this session</span>
          )}
        </div>
      </div>

      {/* Progress bar (set mode only) */}
      {mode === 'set' && total && (
        <div style={{ height: 3, background: T.borderL, borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: T.teal, borderRadius: 2, transition: 'width 0.3s' }} />
        </div>
      )}

      {/* Question card */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '24px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <TopicBadge topic={q.topic} />
            <DiffBadge diff={q.difficulty} />
            {knownIds.has(q.id) && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#3b82f6' }}>Known</span>
            )}
          </div>
          <p style={{ fontSize: 15, fontWeight: 500, color: T.text, margin: 0, lineHeight: 1.65 }}>{q.question}</p>
        </div>

        {/* Revealed answer */}
        {revealed && (
          <div style={{ borderTop: `1px solid ${T.borderL}`, padding: '18px 24px 20px', background: T.page }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.light, margin: '0 0 10px' }}>Answer</p>
            <p style={{ fontSize: 14, color: T.text, margin: 0, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{q.answer}</p>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, marginBottom: 12, fontSize: 13, color: '#1d4ed8', fontWeight: 500 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          {toast}
        </div>
      )}

      {/* Self-assess buttons (post-reveal) */}
      {revealed && !selfAssess && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <button onClick={() => { setSelfAssess('incorrect'); advance('incorrect') }}
            style={{ padding: '12px', fontSize: 13, fontWeight: 600, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, cursor: 'pointer' }}>
            I Got This Wrong
          </button>
          <button onClick={() => { setSelfAssess('correct'); advance('correct') }}
            style={{ padding: '12px', fontSize: 13, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, cursor: 'pointer' }}>
            Got It ✓
          </button>
        </div>
      )}

      {/* Main action row (pre-reveal) */}
      {!revealed && !toast && (
        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr auto', gap: 8, alignItems: 'center' }}>
          {/* Skip */}
          <button onClick={() => advance('skipped')}
            style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: T.muted, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = T.page}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = T.card}>
            Skip
          </button>

          {/* I Know This */}
          <button onClick={handleKnown}
            style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = '#dbeafe'}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = '#eff6ff'}>
            I Know This
          </button>

          {/* Submit / Reveal */}
          <button onClick={() => setRevealed(true)}
            style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#fff', background: T.teal, border: 'none', borderRadius: 10, cursor: 'pointer' }}>
            Submit Answer
          </button>

          {/* End Session */}
          <button onClick={() => onEnd(resultsRef.current)}
            style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: T.muted, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = T.page}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = T.card}>
            End Session
          </button>
        </div>
      )}

      {/* End session link after reveal */}
      {revealed && (
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <button onClick={() => onEnd(resultsRef.current)} style={{ fontSize: 12, color: T.light, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            End session early
          </button>
        </div>
      )}
    </div>
  )
}

// ── Screen 6: Results ─────────────────────────────────────────────────────────

function ResultsScreen({
  results,
  onNew,
}: {
  results: SessionResult[]
  onNew: () => void
}) {
  const correct = results.filter((r) => r.status === 'correct').length
  const incorrect = results.filter((r) => r.status === 'incorrect').length
  const skipped = results.filter((r) => r.status === 'skipped').length
  const known = results.filter((r) => r.status === 'known').length
  const answered = correct + incorrect
  const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0

  // By topic (technical only)
  const byTopic = TOPICS.map((t) => {
    const qs = results.filter((r) => r.question.topic === t && (r.status === 'correct' || r.status === 'incorrect'))
    if (qs.length === 0) return null
    const c = qs.filter((r) => r.status === 'correct').length
    return { topic: t, correct: c, total: qs.length, pct: Math.round((c / qs.length) * 100) }
  }).filter(Boolean) as { topic: Topic; correct: number; total: number; pct: number }[]

  // By difficulty
  const byDiff = DIFFICULTIES.map((d) => {
    const qs = results.filter((r) => r.question.difficulty === d && (r.status === 'correct' || r.status === 'incorrect'))
    if (qs.length === 0) return null
    const c = qs.filter((r) => r.status === 'correct').length
    return { diff: d, correct: c, total: qs.length, pct: Math.round((c / qs.length) * 100) }
  }).filter(Boolean) as { diff: Difficulty; correct: number; total: number; pct: number }[]

  function barColor(p: number) { return p >= 80 ? '#16a34a' : p >= 50 ? '#d97706' : '#dc2626' }

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: '0 0 4px', letterSpacing: '-0.01em' }}>Session Complete</h2>
      <p style={{ fontSize: 13, color: T.muted, margin: '0 0 20px' }}>Here&apos;s how you did.</p>

      {/* Score card */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '24px', marginBottom: 14, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.light, margin: '0 0 8px' }}>Accuracy</p>
        <p style={{ fontSize: 48, fontWeight: 800, color: T.teal, margin: '0 0 4px', lineHeight: 1, letterSpacing: '-0.02em' }}>{pct}%</p>
        <p style={{ fontSize: 13, color: T.muted, margin: '0 0 16px' }}>{correct} of {answered} answered correctly</p>
        <div style={{ height: 6, background: T.borderL, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: T.teal, borderRadius: 3, transition: 'width 0.5s' }} />
        </div>
      </div>

      {/* Breakdown tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Correct', value: correct, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Incorrect', value: incorrect, color: '#dc2626', bg: '#fef2f2' },
          { label: 'Skipped', value: skipped, color: T.muted, bg: T.page },
          { label: 'I Know This', value: known, color: '#2563eb', bg: '#eff6ff' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 10px', textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 700, color, margin: '0 0 2px' }}>{value}</p>
            <p style={{ fontSize: 11, color: T.muted, margin: 0, fontWeight: 500 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* By topic */}
      {byTopic.length > 0 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px', marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.light, margin: '0 0 14px' }}>By Topic</p>
          {byTopic.map(({ topic, correct: c, total, pct: p }) => (
            <div key={topic} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <TopicBadge topic={topic} />
                <span style={{ fontSize: 12, color: T.muted }}>{c}/{total} ({p}%)</span>
              </div>
              <div style={{ height: 4, background: T.borderL, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${p}%`, background: barColor(p), borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* By difficulty */}
      {byDiff.length > 0 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.light, margin: '0 0 14px' }}>By Difficulty</p>
          {byDiff.map(({ diff, correct: c, total, pct: p }) => (
            <div key={diff} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <DiffBadge diff={diff} />
                <span style={{ fontSize: 12, color: T.muted }}>{c}/{total} ({p}%)</span>
              </div>
              <div style={{ height: 4, background: T.borderL, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${p}%`, background: barColor(p), borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={onNew}
        style={{ width: '100%', padding: '12px', fontSize: 13, fontWeight: 600, color: '#fff', background: T.teal, border: 'none', borderRadius: 10, cursor: 'pointer' }}>
        New Session
      </button>
    </div>
  )
}

// ── Questions I Know tab ──────────────────────────────────────────────────────

function KnownQuestionsTab({ allQuestions }: { allQuestions: Question[] }) {
  const supabase = createClient()
  const [rows, setRows] = useState<{ id: string; question_id: string; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('known_questions')
        .select('id, question_id, created_at')
        .order('created_at', { ascending: false })
      setRows(data ?? [])
    } catch { setRows([]) }
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function handleRemove(id: string) {
    setRemoving(id)
    try { await supabase.from('known_questions').delete().eq('id', id) } catch { /* ignore */ }
    setRemoving(null)
    load()
  }

  function resolveQuestion(qid: string): Question | null {
    return allQuestions.find((q) => q.id === qid) ?? STATIC_QUESTIONS.find((q) => q.id === qid) ?? null
  }

  if (loading) return <div style={{ padding: '60px 0', textAlign: 'center', color: T.muted, fontSize: 13 }}>Loading…</div>

  if (rows.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <p style={{ fontSize: 14, fontWeight: 500, color: T.text, margin: 0 }}>No questions marked as known yet.</p>
        <p style={{ fontSize: 13, color: T.muted, marginTop: 4, marginBottom: 0 }}>Click &ldquo;I Know This&rdquo; during practice to add questions here.</p>
      </div>
    )
  }

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${T.borderL}` }}>
            {['Question', 'Topic', 'Difficulty', 'Date Marked', ''].map((h, i) => (
              <th key={i} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.light, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const q = resolveQuestion(row.question_id)
            return (
              <tr key={row.id} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${T.page}` : 'none' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = T.page}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <td style={{ padding: '12px 20px', color: T.text, maxWidth: 360 }}>
                  <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {q ? q.question : <span style={{ color: T.light, fontStyle: 'italic' }}>Question not found (ID: {row.question_id})</span>}
                  </p>
                </td>
                <td style={{ padding: '12px 20px' }}><TopicBadge topic={q?.topic ?? null} /></td>
                <td style={{ padding: '12px 20px' }}><DiffBadge diff={q?.difficulty ?? null} /></td>
                <td style={{ padding: '12px 20px', color: T.muted, whiteSpace: 'nowrap' }}>
                  {new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td style={{ padding: '12px 20px' }}>
                  <button onClick={() => handleRemove(row.id)} disabled={removing === row.id}
                    style={{ fontSize: 12, fontWeight: 500, color: '#ef4444', background: '#fff', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', opacity: removing === row.id ? 0.5 : 1 }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = '#fef2f2'}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = '#fff'}>
                    Remove
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PracticePage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<ActiveTab>('practice')

  // Question bank
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [loadingQ, setLoadingQ] = useState(true)

  // Known question IDs
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set())

  // Session flow state machine
  const [screen, setScreen] = useState<Screen>('mode')
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('freestyle')
  const [sessionSize, setSessionSize] = useState<number | null>(null)
  const [questionType, setQuestionType] = useState<QuestionType | null>(null)
  const [sessionPool, setSessionPool] = useState<Question[]>([])
  const [sessionTopics, setSessionTopics] = useState<Topic[]>([])
  const [sessionDiffs, setSessionDiffs] = useState<Difficulty[]>([])
  const [results, setResults] = useState<SessionResult[]>([])

  // Load questions and known IDs
  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from('questions').select('*').order('created_at', { ascending: true })
        setAllQuestions(data && data.length > 0 ? data : STATIC_QUESTIONS)
      } catch {
        setAllQuestions(STATIC_QUESTIONS)
      } finally {
        setLoadingQ(false)
      }
      try {
        const { data: kd } = await supabase.from('known_questions').select('question_id')
        setKnownIds(new Set((kd ?? []).map((r: { question_id: string }) => r.question_id)))
      } catch { /* table may not exist yet */ }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleMarkKnown(q: Question) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('known_questions').upsert({ user_id: user.id, question_id: q.id }, { onConflict: 'user_id,question_id' })
      setKnownIds((prev) => new Set([...prev, q.id]))
    } catch { /* ignore */ }
  }

  async function saveSession(resultList: SessionResult[], topics: Topic[], difficulties: Difficulty[], type: QuestionType, mode: PracticeMode) {
    if (resultList.length === 0) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const correct  = resultList.filter((r) => r.status === 'correct').length
      const incorrect = resultList.filter((r) => r.status === 'incorrect').length
      const skipped  = resultList.filter((r) => r.status === 'skipped').length
      const known    = resultList.filter((r) => r.status === 'known').length
      // questions_answered = self-assessed only (used for accuracy calculation)
      const answered = correct + incorrect
      const { error } = await supabase.from('practice_sessions').insert({
        user_id: user.id,
        question_type: type,
        mode: mode === 'set' ? 'custom' : 'freestyle',
        questions_answered: answered,
        questions_correct: correct,
        questions_skipped: skipped + known,   // both excluded from accuracy
        topics: topics.length > 0 ? topics : null,
        difficulties: difficulties.length > 0 ? difficulties : null,
      })
      if (error) console.error('practice_sessions insert error:', error.message)
    } catch (e) {
      console.error('saveSession failed:', e)
    }
  }

  function startBehavioral(mode: PracticeMode, size: number | null) {
    const pool = allQuestions.filter((q) => q.question_type === 'behavioral')
    const effective = pool.length > 0 ? pool : STATIC_QUESTIONS.filter((q) => q.question_type === 'behavioral')
    const shuffled = [...effective].sort(() => Math.random() - 0.5)
    const sliced = (mode === 'set' && size) ? shuffled.slice(0, Math.min(size, shuffled.length)) : shuffled
    setSessionPool(sliced)
    setSessionTopics([])
    setSessionDiffs([])
    setResults([])
    setScreen('quiz')
  }

  function onEnd(finalResults: SessionResult[]) {
    setResults(finalResults)
    saveSession(finalResults, sessionTopics, sessionDiffs, questionType ?? 'behavioral', practiceMode)
    setScreen('results')
  }

  function resetToStart() {
    setScreen('mode')
    setPracticeMode('freestyle')
    setSessionSize(null)
    setQuestionType(null)
    setSessionPool([])
    setResults([])
  }

  if (loadingQ) {
    return (
      <div style={{ padding: '32px', background: T.page, minHeight: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 80, color: T.muted, fontSize: 13 }}>Loading…</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', background: T.page, minHeight: '100%' }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em' }}>Practice</h1>
        <p style={{ fontSize: 13, color: T.muted, marginTop: 4, marginBottom: 0 }}>Sharpen your interview skills with targeted practice sessions.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: `1px solid ${T.border}` }}>
        {([
          { key: 'practice', label: 'Practice Session' },
          { key: 'known', label: 'Questions I Know' },
        ] as { key: ActiveTab; label: string }[]).map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{
              padding: '10px 20px', fontSize: 13, fontWeight: activeTab === key ? 600 : 500,
              color: activeTab === key ? T.teal : T.muted,
              background: 'none', border: 'none',
              borderBottom: activeTab === key ? `2px solid ${T.teal}` : '2px solid transparent',
              marginBottom: -1, cursor: 'pointer',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Practice */}
      {activeTab === 'practice' && (
        <>
          {screen === 'results' && (
            <ResultsScreen results={results} onNew={resetToStart} />
          )}

          {screen === 'quiz' && (
            <QuizScreen
              questions={sessionPool}
              mode={practiceMode}
              sessionSize={practiceMode === 'set' ? sessionSize : null}
              onEnd={onEnd}
              knownIds={knownIds}
              onMarkKnown={handleMarkKnown}
            />
          )}

          {screen === 'mode' && (
            <ModeScreen onSelect={(m) => { setPracticeMode(m); setScreen(m === 'set' ? 'size' : 'type') }} />
          )}

          {screen === 'size' && (
            <SizeScreen
              onSelect={(n) => { setSessionSize(n); setScreen('type') }}
              onBack={() => setScreen('mode')}
            />
          )}

          {screen === 'type' && (
            <TypeScreen
              onSelect={(t) => {
                setQuestionType(t)
                if (t === 'behavioral') {
                  startBehavioral(practiceMode, sessionSize)
                } else {
                  setScreen('filters')
                }
              }}
              onBack={() => setScreen(practiceMode === 'set' ? 'size' : 'mode')}
            />
          )}

          {screen === 'filters' && (
            <FiltersScreen
              allQuestions={allQuestions}
              onStart={(pool, topics, diffs) => {
                const effective = practiceMode === 'set' && sessionSize
                  ? pool.slice(0, Math.min(sessionSize, pool.length))
                  : pool
                setSessionPool(effective)
                setSessionTopics(topics)
                setSessionDiffs(diffs)
                setResults([])
                setScreen('quiz')
              }}
              onBack={() => setScreen('type')}
            />
          )}
        </>
      )}

      {/* Tab: Known questions */}
      {activeTab === 'known' && (
        <KnownQuestionsTab allQuestions={allQuestions} />
      )}
    </div>
  )
}
