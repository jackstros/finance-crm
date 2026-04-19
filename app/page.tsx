'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  QUESTIONS,
  TOPIC_LABELS,
  DIFFICULTY_LABELS,
  QUESTION_TYPE_LABELS,
  TOPICS,
  DIFFICULTIES,
  type Topic,
  type Difficulty,
  type QuestionType,
  type Question,
} from '@/lib/questions'

// ── Types ──────────────────────────────────────────────────────────────────────

type NavTab = 'about' | 'pricing' | 'guides' | 'features'
type FeatureTab = 'crm' | 'prep'
type QuizScreen = 'type' | 'topic' | 'difficulty' | 'quiz' | 'results'

// ── Demo data for CRM preview ──────────────────────────────────────────────────

const DEMO_CONTACTS = [
  { name: 'Sarah Chen',       firm: 'Goldman Sachs',      role: 'VP, M&A Advisory',       date: 'Apr 10',  tag: 'Follow-up' },
  { name: 'James Whitfield',  firm: 'Morgan Stanley',     role: 'MD, Leveraged Finance',  date: 'Apr 7',   tag: 'Meeting Set' },
  { name: 'Priya Sharma',     firm: 'Lazard',             role: 'Associate, Restructuring',date: 'Apr 3',  tag: 'Connected' },
  { name: 'Tyler Huang',      firm: 'Evercore',           role: 'Analyst, M&A',           date: 'Mar 28',  tag: 'Follow-up' },
  { name: 'Alexandra Ross',   firm: 'Centerview Partners',role: 'Partner',                date: 'Mar 21',  tag: 'Coffee Chat' },
]

const DEMO_FIRMS = [
  { name: 'Goldman Sachs',        div: 'Investment Banking',  status: 'Interview',    last: 'Apr 10' },
  { name: 'Morgan Stanley',       div: 'M&A Advisory',        status: 'Applied',      last: 'Apr 2' },
  { name: 'JPMorgan',             div: 'Leveraged Finance',   status: 'Prospective',  last: 'Mar 28' },
  { name: 'Lazard',               div: 'Restructuring',       status: 'Offer',        last: 'Apr 12' },
  { name: 'Evercore',             div: 'Advisory',            status: 'Rejected',     last: 'Mar 15' },
]

const FIRM_STATUS: Record<string, string> = {
  Prospective: 'bg-[rgba(255,255,255,0.06)] text-[#aaa]',
  Applied:     'bg-[#4A90E2]/20 text-[#4A90E2]',
  Interview:   'bg-[#F39C12]/20 text-[#F39C12]',
  Offer:       'bg-[#2ECC71]/20 text-[#2ECC71]',
  Rejected:    'bg-[#E74C3C]/20 text-[#E74C3C]',
}

const TAG_COLOR: Record<string, string> = {
  'Follow-up':   'bg-[#F39C12]/15 text-[#F39C12]',
  'Meeting Set': 'bg-[#2ECC71]/15 text-[#2ECC71]',
  'Connected':   'bg-[#4A90E2]/15 text-[#4A90E2]',
  'Coffee Chat': 'bg-[#C9A84C]/15 text-[#C9A84C]',
}

// ── Style helpers ──────────────────────────────────────────────────────────────

const DIFF_META: Record<Difficulty, { badge: string; dot: string }> = {
  easy:     { badge: 'bg-[#2ECC71]/15 text-[#2ECC71]', dot: 'bg-[#2ECC71]' },
  medium:   { badge: 'bg-[#F39C12]/15 text-[#F39C12]', dot: 'bg-[#F39C12]' },
  advanced: { badge: 'bg-[#E74C3C]/15 text-[#E74C3C]', dot: 'bg-[#E74C3C]' },
}

const TOPIC_COLOR: Record<Topic, string> = {
  accounting:        'bg-[#4A90E2]/15 text-[#4A90E2]',
  valuation:         'bg-[#9B59B6]/15 text-[#9B59B6]',
  dcf:               'bg-[#5B8AF0]/15 text-[#5B8AF0]',
  lbo:               'bg-[#E67E22]/15 text-[#E67E22]',
  ma:                'bg-[#1ABC9C]/15 text-[#1ABC9C]',
  restructuring:     'bg-[#E74C3C]/15 text-[#E74C3C]',
  financial_markets: 'bg-[#F39C12]/15 text-[#F39C12]',
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className ?? ''}`}>
      {children}
    </span>
  )
}

// ── CRM Demo ───────────────────────────────────────────────────────────────────

function CRMDemo() {
  const [view, setView] = useState<'contacts' | 'firms' | 'dashboard'>('dashboard')

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#08101E]" style={{ height: 520 }}>
      {/* Mock browser chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3 bg-[#06090F] border-b border-white/[0.06]">
        <div className="w-3 h-3 rounded-full bg-white/10" />
        <div className="w-3 h-3 rounded-full bg-white/10" />
        <div className="w-3 h-3 rounded-full bg-white/10" />
        <div className="flex-1 mx-4 h-6 rounded-md bg-white/[0.04] flex items-center px-3">
          <span className="text-xs text-white/20 font-mono">app.recruitbanking.com/dashboard</span>
        </div>
      </div>

      {/* Mock app layout */}
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-44 shrink-0 border-r border-white/[0.06] bg-[#060C18] flex flex-col py-4">
          <div className="px-4 mb-6">
            <p className="text-sm font-bold text-[#C9A84C]">RecruitBanking</p>
          </div>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'contacts', label: 'CRM' },
            { id: 'firms',    label: 'Firms' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as typeof view)}
              className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors border-l-2 ${
                view === item.id
                  ? 'border-[#C9A84C] bg-[#1d3251]/60 text-white'
                  : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {view === 'dashboard' && <DashboardPreview />}
          {view === 'contacts' && <ContactsPreview />}
          {view === 'firms'    && <FirmsPreview />}
        </div>
      </div>
    </div>
  )
}

function DashboardPreview() {
  return (
    <div className="p-5 h-full overflow-y-auto">
      <p className="text-sm font-semibold text-white mb-4">Dashboard</p>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Firms Tracked', value: '12' },
          { label: 'Contacts Added', value: '34' },
          { label: 'Practice Score', value: '8/10', gold: true },
        ].map((s) => (
          <div key={s.label} className="bg-[#0F1F3D] rounded-lg border border-white/[0.06] px-3 py-3">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-xl font-semibold ${s.gold ? 'text-[#C9A84C]' : 'text-white'}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0F1F3D] rounded-lg border border-white/[0.06] p-3">
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-3">Pipeline</p>
          {[
            { label: 'Prospective', pct: 25, color: 'bg-white/20' },
            { label: 'Applied',     pct: 40, color: 'bg-[#4A90E2]' },
            { label: 'Interview',   pct: 25, color: 'bg-[#F39C12]' },
            { label: 'Offer',       pct: 10, color: 'bg-[#2ECC71]' },
          ].map((row) => (
            <div key={row.label} className="mb-2">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-white/50">{row.label}</span>
                <span className="text-white/30">{row.pct}%</span>
              </div>
              <div className="h-1 bg-white/[0.06] rounded-full">
                <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-[#0F1F3D] rounded-lg border border-white/[0.06] p-3">
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-3">Recent Contacts</p>
          {DEMO_CONTACTS.slice(0, 4).map((c) => (
            <div key={c.name} className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[10px] font-medium text-white">{c.name}</p>
                <p className="text-[9px] text-white/30">{c.firm}</p>
              </div>
              <span className="text-[9px] text-white/30">{c.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ContactsPreview() {
  return (
    <div className="p-5 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-white">CRM</p>
        <div className="h-6 px-3 bg-[#C9A84C]/20 text-[#C9A84C] text-[10px] font-medium rounded-md flex items-center">
          + Add Contact
        </div>
      </div>
      <div className="bg-[#0F1F3D] rounded-lg border border-white/[0.06] overflow-hidden">
        <div className="grid grid-cols-4 px-3 py-2 border-b border-white/[0.06]">
          {['Name', 'Firm', 'Date', 'Status'].map((h) => (
            <p key={h} className="text-[9px] font-medium text-white/30 uppercase tracking-wider">{h}</p>
          ))}
        </div>
        {DEMO_CONTACTS.map((c) => (
          <div key={c.name} className="grid grid-cols-4 items-center px-3 py-2.5 border-b border-white/[0.03] hover:bg-white/[0.02]">
            <div>
              <p className="text-[10px] font-medium text-white">{c.name}</p>
              <p className="text-[9px] text-white/30">{c.role}</p>
            </div>
            <p className="text-[10px] text-white/50">{c.firm}</p>
            <p className="text-[10px] text-white/40">{c.date}</p>
            <Badge className={TAG_COLOR[c.tag] ?? 'bg-white/10 text-white/50'}>{c.tag}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

function FirmsPreview() {
  return (
    <div className="p-5 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-white">Firms</p>
        <div className="h-6 px-3 bg-[#C9A84C]/20 text-[#C9A84C] text-[10px] font-medium rounded-md flex items-center">
          + Add Firm
        </div>
      </div>
      <div className="bg-[#0F1F3D] rounded-lg border border-white/[0.06] overflow-hidden">
        <div className="grid grid-cols-4 px-3 py-2 border-b border-white/[0.06]">
          {['Firm', 'Division', 'Status', 'Last Contact'].map((h) => (
            <p key={h} className="text-[9px] font-medium text-white/30 uppercase tracking-wider">{h}</p>
          ))}
        </div>
        {DEMO_FIRMS.map((f) => (
          <div key={f.name} className="grid grid-cols-4 items-center px-3 py-2.5 border-b border-white/[0.03] hover:bg-white/[0.02]">
            <p className="text-[10px] font-medium text-white">{f.name}</p>
            <p className="text-[10px] text-white/50">{f.div}</p>
            <Badge className={FIRM_STATUS[f.status]}>{f.status}</Badge>
            <p className="text-[10px] text-white/40">{f.last}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Technical Prep Demo ────────────────────────────────────────────────────────

type QuizResult = { question: Question; correct: boolean }

function TechPrepDemo() {
  const [screen, setScreen] = useState<QuizScreen>('type')
  const [selType,  setSelType]  = useState<QuestionType | null>(null)
  const [selTopic, setSelTopic] = useState<Topic | null>(null)
  const [sessionQs, setSessionQs] = useState<Question[]>([])
  const [results,   setResults]   = useState<QuizResult[]>([])

  function filteredFor(d: Difficulty) {
    return QUESTIONS.filter(
      (q) =>
        q.question_type === selType &&
        (selType === 'behavioral' ? true : q.topic === selTopic) &&
        q.difficulty === d
    )
  }

  function startQuiz(d: Difficulty) {
    const qs = [...filteredFor(d)].sort(() => Math.random() - 0.5)
    setSessionQs(qs)
    setResults([])
    setScreen('quiz')
  }

  function reset() {
    setScreen('type'); setSelType(null); setSelTopic(null)
    setSessionQs([]); setResults([])
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#08101E] overflow-hidden" style={{ minHeight: 520 }}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Technical Prep — Live Demo</p>
          <p className="text-xs text-white/40 mt-0.5">No account required</p>
        </div>
        {screen !== 'type' && (
          <button
            onClick={reset}
            className="text-xs text-white/40 hover:text-white transition-colors"
          >
            ← Start over
          </button>
        )}
      </div>

      <div className="p-6">
        {screen === 'type' && (
          <PrepTypeScreen onSelect={(t) => {
            setSelType(t)
            setScreen(t === 'behavioral' ? 'difficulty' : 'topic')
          }} />
        )}
        {screen === 'topic' && (
          <PrepTopicScreen
            onSelect={(t) => { setSelTopic(t); setScreen('difficulty') }}
            onBack={() => { setSelType(null); setScreen('type') }}
          />
        )}
        {screen === 'difficulty' && (
          <PrepDifficultyScreen
            selType={selType!}
            selTopic={selTopic}
            countFor={filteredFor}
            onSelect={startQuiz}
            onBack={() => {
              if (selType === 'behavioral') { setSelType(null); setScreen('type') }
              else { setSelTopic(null); setScreen('topic') }
            }}
          />
        )}
        {screen === 'quiz' && (
          <PrepQuizScreen
            questions={sessionQs}
            onFinish={(r) => { setResults(r); setScreen('results') }}
          />
        )}
        {screen === 'results' && (
          <PrepResultsScreen
            results={results}
            onRetry={() => { setResults([]); setScreen('quiz') }}
            onNew={reset}
          />
        )}
      </div>
    </div>
  )
}

function PrepTypeScreen({ onSelect }: { onSelect: (t: QuestionType) => void }) {
  return (
    <div>
      <p className="text-xs text-white/40 uppercase tracking-wider mb-4">Step 1 — Question Type</p>
      <div className="grid grid-cols-2 gap-3">
        {(['behavioral', 'technical'] as QuestionType[]).map((t) => (
          <button
            key={t}
            onClick={() => onSelect(t)}
            className="group bg-[#0F1F3D] border border-white/[0.06] rounded-xl p-5 text-left hover:border-[#C9A84C]/30 hover:bg-[#162840] transition-all"
          >
            <p className="text-sm font-semibold text-white mb-1">{QUESTION_TYPE_LABELS[t]}</p>
            <p className="text-xs text-white/40">
              {t === 'behavioral'
                ? 'Motivations, fit, leadership'
                : 'Accounting, DCF, LBO, M&A and more'}
            </p>
            <p className="text-xs text-[#C9A84C]/60 mt-3 group-hover:text-[#C9A84C] transition-colors">
              Select →
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

function PrepTopicScreen({ onSelect, onBack }: { onSelect: (t: Topic) => void; onBack: () => void }) {
  return (
    <div>
      <p className="text-xs text-white/40 uppercase tracking-wider mb-4">Step 2 — Topic</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {TOPICS.map((t) => (
          <button
            key={t}
            onClick={() => onSelect(t)}
            className="flex items-center justify-between bg-[#0F1F3D] border border-white/[0.06] rounded-lg px-4 py-3 hover:border-[#C9A84C]/30 hover:bg-[#162840] transition-all group"
          >
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TOPIC_COLOR[t]}`}>
              {TOPIC_LABELS[t]}
            </span>
            <svg className="w-3 h-3 text-white/20 group-hover:text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
      <button onClick={onBack} className="text-xs text-white/30 hover:text-white/60 transition-colors">← Back</button>
    </div>
  )
}

function PrepDifficultyScreen({
  selType, selTopic, countFor, onSelect, onBack,
}: {
  selType: QuestionType
  selTopic: Topic | null
  countFor: (d: Difficulty) => Question[]
  onSelect: (d: Difficulty) => void
  onBack: () => void
}) {
  return (
    <div>
      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
        Step {selType === 'behavioral' ? '2' : '3'} — Difficulty
      </p>
      <p className="text-xs text-white/30 mb-4">
        {selType === 'behavioral' ? 'Behavioral' : selTopic ? TOPIC_LABELS[selTopic] : ''} questions
      </p>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {DIFFICULTIES.map((d) => {
          const count = countFor(d).length
          const meta  = DIFF_META[d]
          return (
            <button
              key={d}
              onClick={() => onSelect(d)}
              disabled={count === 0}
              className="bg-[#0F1F3D] border border-white/[0.06] rounded-xl p-4 text-left hover:border-[#C9A84C]/30 hover:bg-[#162840] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                <span className="text-xs font-semibold text-white">{DIFFICULTY_LABELS[d]}</span>
              </div>
              <p className="text-[10px] text-white/30">{count} question{count !== 1 ? 's' : ''}</p>
            </button>
          )
        })}
      </div>
      <button onClick={onBack} className="text-xs text-white/30 hover:text-white/60 transition-colors">← Back</button>
    </div>
  )
}

function PrepQuizScreen({ questions, onFinish }: { questions: Question[]; onFinish: (r: QuizResult[]) => void }) {
  const [idx,      setIdx]      = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [results,  setResults]  = useState<QuizResult[]>([])

  if (questions.length === 0) {
    return <p className="text-sm text-white/40 text-center py-8">No questions available for this selection.</p>
  }

  const q    = questions[idx]
  const meta = q.difficulty ? DIFF_META[q.difficulty] : null
  const pct  = (idx / questions.length) * 100

  function answer(correct: boolean) {
    const next = [...results, { question: q, correct }]
    setResults(next)
    if (idx + 1 >= questions.length) {
      onFinish(next)
    } else {
      setIdx((i) => i + 1)
      setRevealed(false)
    }
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-white/30 mb-2">
        <span>{idx + 1} / {questions.length}</span>
        <span>{results.filter((r) => r.correct).length} correct</span>
      </div>
      <div className="h-0.5 bg-white/[0.06] rounded-full mb-4 overflow-hidden">
        <div className="h-full bg-[#C9A84C] rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>

      {/* Card */}
      <div className="bg-[#0F1F3D] rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            {meta && q.difficulty && (
              <Badge className={meta.badge}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${meta.dot}`} />
                {DIFFICULTY_LABELS[q.difficulty]}
              </Badge>
            )}
            {q.topic ? (
              <Badge className={TOPIC_COLOR[q.topic]}>{TOPIC_LABELS[q.topic]}</Badge>
            ) : (
              <Badge className="bg-white/10 text-white/50">Behavioral</Badge>
            )}
          </div>
          <p className="text-sm font-medium text-white leading-snug">{q.question}</p>
        </div>

        {!revealed ? (
          <div className="px-5 pb-4">
            <button
              onClick={() => setRevealed(true)}
              className="w-full py-2 text-xs font-medium text-white/40 border border-white/[0.06] rounded-lg hover:border-[#C9A84C]/30 hover:text-white/70 hover:bg-[#162840] transition-all"
            >
              Reveal Answer
            </button>
          </div>
        ) : (
          <div className="border-t border-white/[0.06] px-5 py-4">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">Answer</p>
            <p className="text-xs text-white/80 whitespace-pre-line leading-relaxed">{q.answer}</p>
          </div>
        )}
      </div>

      {revealed && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <button
            onClick={() => answer(false)}
            className="py-2.5 text-xs font-semibold text-[#E74C3C] border border-[#E74C3C]/30 rounded-xl hover:bg-[#E74C3C]/10 transition-colors"
          >
            Missed it
          </button>
          <button
            onClick={() => answer(true)}
            className="py-2.5 text-xs font-semibold text-[#2ECC71] border border-[#2ECC71]/30 rounded-xl hover:bg-[#2ECC71]/10 transition-colors"
          >
            Got it ✓
          </button>
        </div>
      )}
    </div>
  )
}

function PrepResultsScreen({ results, onRetry, onNew }: { results: QuizResult[]; onRetry: () => void; onNew: () => void }) {
  const total   = results.length
  const correct = results.filter((r) => r.correct).length
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0

  return (
    <div>
      <div className="bg-[#0F1F3D] rounded-xl border border-white/[0.06] p-6 text-center mb-4">
        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Your Score</p>
        <p className="text-4xl font-bold text-[#C9A84C] mb-1">{pct}%</p>
        <p className="text-xs text-white/40">{correct} of {total} correct</p>
        <div className="mt-3 h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full bg-[#C9A84C] rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onRetry}
          className="py-2.5 text-xs font-medium text-white/50 border border-white/[0.06] rounded-xl hover:bg-[#0F1F3D] hover:text-white/80 transition-colors"
        >
          Retry
        </button>
        <button
          onClick={onNew}
          className="py-2.5 text-xs font-semibold text-[#0A1628] bg-[#C9A84C] rounded-xl hover:bg-[#D4B866] transition-colors"
        >
          New Session
        </button>
      </div>
      <p className="text-center text-xs text-white/30 mt-4">
        Sign up to track your progress over time →{' '}
        <Link href="/signup" className="text-[#C9A84C] hover:text-[#D4B866] transition-colors">
          Get started free
        </Link>
      </p>
    </div>
  )
}

// ── Tab content panels ─────────────────────────────────────────────────────────

function AboutTab() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-white mb-4">
          Built for the modern IB recruiting process
        </h2>
        <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
          RecruitBanking gives students a single platform to manage every relationship,
          track every application, and drill every technical question — all in one place.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-16">
        {[
          {
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            ),
            title: 'Relationship Tracking',
            desc: 'Log every coffee chat, email, and phone call. Never let a connection go cold.',
          },
          {
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M8 11v4M12 11v4M16 11v4" />
              </svg>
            ),
            title: 'Pipeline Management',
            desc: 'Track every firm from researching through offer. Know exactly where you stand.',
          },
          {
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            ),
            title: 'Technical Prep',
            desc: 'Drill accounting, valuation, DCF, LBO, M&A, and restructuring questions with self-scoring.',
          },
        ].map((card) => (
          <div key={card.title} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C] mb-4">
              {card.icon}
            </div>
            <h3 className="text-base font-semibold text-white mb-2">{card.title}</h3>
            <p className="text-sm text-white/40 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center">
        <p className="text-sm text-white/40 mb-2">Recruiting season is competitive</p>
        <p className="text-2xl font-bold text-white mb-6">
          The students who land offers are the ones who prepare obsessively.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#C9A84C] text-[#0A1628] text-sm font-semibold rounded-xl hover:bg-[#D4B866] transition-colors"
        >
          Start for free
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  )
}

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-6">
        <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">{label}</h2>
      <p className="text-white/40 text-sm">This section is coming soon.</p>
    </div>
  )
}

function FeaturesTab() {
  const [ft, setFt] = useState<FeatureTab>('crm')

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-4">Everything you need to land the offer</h2>
        <p className="text-white/50 max-w-xl mx-auto text-base">
          Two purpose-built tools working together — one for relationship management,
          one for technical preparation.
        </p>
      </div>

      {/* Feature toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
          {([
            { id: 'crm',  label: 'Networking CRM' },
            { id: 'prep', label: 'Technical Prep' },
          ] as { id: FeatureTab; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFt(tab.id)}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                ft === tab.id
                  ? 'bg-[#C9A84C] text-[#0A1628]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {ft === 'crm' && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { title: 'Contact Log', desc: 'Track every person you meet by firm, role, and date.' },
              { title: 'Pipeline Board', desc: 'Know exactly where each firm application stands.' },
              { title: 'Follow-up Reminders', desc: 'Never let a warm contact go cold.' },
            ].map((f) => (
              <div key={f.title} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] mb-3" />
                <p className="text-sm font-semibold text-white mb-1">{f.title}</p>
                <p className="text-xs text-white/40">{f.desc}</p>
              </div>
            ))}
          </div>
          <CRMDemo />
        </div>
      )}

      {ft === 'prep' && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { title: '2 Question Types', desc: 'Behavioral fit questions and 7 technical topics.' },
              { title: 'Self-scoring', desc: 'Mark each answer Got it or Missed it to track progress.' },
              { title: 'Results breakdown', desc: 'See your score by topic after every session.' },
            ].map((f) => (
              <div key={f.title} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] mb-3" />
                <p className="text-sm font-semibold text-white mb-1">{f.title}</p>
                <p className="text-xs text-white/40">{f.desc}</p>
              </div>
            ))}
          </div>
          <TechPrepDemo />
        </div>
      )}
    </div>
  )
}

// ── Landing page ───────────────────────────────────────────────────────────────

const NAV_TABS: { id: NavTab; label: string }[] = [
  { id: 'about',    label: 'About' },
  { id: 'features', label: 'Features' },
  { id: 'pricing',  label: 'Pricing' },
  { id: 'guides',   label: 'Guides' },
]

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<NavTab | null>(null)

  return (
    <div className="min-h-screen bg-[#050A14] text-white">

      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06]"
        style={{ background: 'rgba(5,10,20,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => setActiveTab(null)} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#C9A84C]/20 flex items-center justify-center">
              <span className="text-[9px] font-bold text-[#C9A84C]">RB</span>
            </div>
            <span className="text-sm font-bold text-white">RecruitBanking</span>
          </button>

          {/* Nav tabs */}
          <nav className="flex items-center gap-1">
            {NAV_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'text-white bg-white/[0.08]'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-1.5 text-sm font-semibold text-[#0A1628] bg-[#C9A84C] rounded-lg hover:bg-[#D4B866] transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Tab panel (shown when a nav tab is active) ─────────────────────── */}
      {activeTab && (
        <div className="border-b border-white/[0.06] bg-[#050A14]">
          <div className="max-w-6xl mx-auto px-8 py-16">
            {activeTab === 'about'    && <AboutTab />}
            {activeTab === 'features' && <FeaturesTab />}
            {activeTab === 'pricing'  && <EmptyTab label="Pricing" />}
            {activeTab === 'guides'   && <EmptyTab label="Guides" />}
          </div>
        </div>
      )}

      {/* ── Hero (always visible) ──────────────────────────────────────────── */}
      <main>
        <section className="max-w-6xl mx-auto px-8 pt-24 pb-20 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#C9A84C]/20 bg-[#C9A84C]/5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
            <span className="text-xs text-[#C9A84C] font-medium">Built for IB recruiting season</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
            Land your{' '}
            <span style={{
              background: 'linear-gradient(135deg, #C9A84C 0%, #D4B866 50%, #C9A84C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              investment banking
            </span>
            {' '}role
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-white/50 max-w-xl mx-auto leading-relaxed mb-10">
            Track every contact, manage every application, and drill every technical question
            — all in one place designed for the IB recruiting process.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="flex items-center gap-2 px-6 py-3 bg-[#C9A84C] text-[#0A1628] text-sm font-semibold rounded-xl hover:bg-[#D4B866] transition-colors"
            >
              Get started free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <button
              onClick={() => setActiveTab('features')}
              className="px-6 py-3 text-sm font-medium text-white/60 border border-white/[0.1] rounded-xl hover:text-white hover:border-white/20 transition-colors"
            >
              See how it works
            </button>
          </div>
        </section>

        {/* ── Stat bar ──────────────────────────────────────────────────────── */}
        <section className="border-y border-white/[0.06] bg-white/[0.02]">
          <div className="max-w-6xl mx-auto px-8 py-8 grid grid-cols-3 divide-x divide-white/[0.06]">
            {[
              { value: '50+',  label: 'Technical questions' },
              { value: '7',    label: 'Topic categories' },
              { value: '100%', label: 'Free to use' },
            ].map((s) => (
              <div key={s.label} className="text-center px-8">
                <p className="text-3xl font-bold text-[#C9A84C] mb-1">{s.value}</p>
                <p className="text-sm text-white/40">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature highlights ─────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-8 py-20">
          <div className="grid grid-cols-2 gap-6">
            {/* CRM card */}
            <button
              onClick={() => setActiveTab('features')}
              className="group bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-left hover:border-white/[0.12] hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5 rounded-full">
                  Networking CRM
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Every contact.<br />Every firm. Organized.
              </h3>
              <p className="text-sm text-white/40 leading-relaxed mb-6">
                Log coffee chats, track application stages, and get reminded when it's time
                to follow up. Never let a warm lead go cold again.
              </p>
              <span className="text-sm text-white/40 group-hover:text-[#C9A84C] transition-colors font-medium">
                See the demo →
              </span>
            </button>

            {/* Tech prep card */}
            <button
              onClick={() => setActiveTab('features')}
              className="group bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-left hover:border-white/[0.12] hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5 rounded-full">
                  Technical Prep
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Drill every question<br />they'll throw at you.
              </h3>
              <p className="text-sm text-white/40 leading-relaxed mb-6">
                Behavioral, accounting, DCF, LBO, M&A, restructuring, markets —
                self-score every answer and track where you need more work.
              </p>
              <span className="text-sm text-white/40 group-hover:text-[#C9A84C] transition-colors font-medium">
                Try it now →
              </span>
            </button>
          </div>
        </section>

        {/* ── CTA banner ────────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-8 pb-24">
          <div
            className="rounded-2xl px-12 py-16 text-center border border-[#C9A84C]/20"
            style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(10,22,40,0) 100%)' }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Recruiting season doesn't wait.
            </h2>
            <p className="text-white/50 mb-8 max-w-md mx-auto">
              Start tracking your network and sharpening your technicals today — it's free.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#C9A84C] text-[#0A1628] text-sm font-semibold rounded-xl hover:bg-[#D4B866] transition-colors"
            >
              Create your account
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-8 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#C9A84C]/20 flex items-center justify-center">
              <span className="text-[8px] font-bold text-[#C9A84C]">RB</span>
            </div>
            <span className="text-sm font-semibold text-white/60">RecruitBanking</span>
          </div>
          <p className="text-xs text-white/20">
            Built for aspiring investment bankers
          </p>
          <div className="flex items-center gap-6">
            <Link href="/login"  className="text-xs text-white/30 hover:text-white/60 transition-colors">Sign in</Link>
            <Link href="/signup" className="text-xs text-white/30 hover:text-white/60 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
