'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  TOPIC_LABELS,
  DIFFICULTY_LABELS,
  QUESTION_TYPE_LABELS,
  TOPICS,
  DIFFICULTIES,
  QUESTION_TYPES,
  type Topic,
  type Difficulty,
  type QuestionType,
} from '@/lib/questions'

// ── Types ─────────────────────────────────────────────────────────────────────

type DBQuestion = {
  id: string
  question: string
  answer: string
  question_type: QuestionType
  topic: Topic | null
  difficulty: Difficulty | null  // null for behavioral
  created_at: string
}

type FormState = {
  question: string
  answer: string
  question_type: QuestionType
  topic: Topic | ''           // '' means no topic (behavioral)
  difficulty: Difficulty | '' // '' means no difficulty (behavioral)
}

type CSVRow = {
  question: string
  answer: string
  question_type: string
  topic: string
  difficulty: string
  valid: boolean
  errors: string[]
}

const EMPTY_FORM: FormState = {
  question: '',
  answer: '',
  question_type: 'technical',
  topic: 'accounting',
  difficulty: 'easy',
}

// ── Style maps ────────────────────────────────────────────────────────────────

const DIFFICULTY_BADGE: Record<Difficulty, string> = {
  easy:     'bg-emerald-900/40 text-emerald-400',
  medium:   'bg-amber-900/40 text-amber-400',
  advanced: 'bg-red-900/40 text-red-400',
}

const TOPIC_BADGE: Record<Topic, string> = {
  accounting:        'bg-blue-900/40 text-blue-400',
  valuation:         'bg-violet-900/40 text-violet-400',
  dcf:               'bg-indigo-900/40 text-indigo-400',
  lbo:               'bg-orange-900/40 text-orange-400',
  ma:                'bg-teal-900/40 text-teal-400',
  restructuring:     'bg-red-900/40 text-red-400',
  financial_markets: 'bg-yellow-900/40 text-yellow-400',
}

const TYPE_BADGE: Record<QuestionType, string> = {
  behavioral: 'bg-purple-900/40 text-purple-400',
  technical:  'bg-sky-900/40 text-sky-400',
}

// ── CSV Parser ────────────────────────────────────────────────────────────────

function parseCSV(text: string): CSVRow[] {
  const cleaned = text.replace(/^\uFEFF/, '')
  const lines: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (ch === '"') {
      if (inQuotes && cleaned[i + 1] === '"') { current += '"'; i++; continue }
      inQuotes = !inQuotes
    } else if ((ch === '\n' || (ch === '\r' && cleaned[i + 1] === '\n')) && !inQuotes) {
      if (ch === '\r') i++
      lines.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) lines.push(current)

  function splitLine(line: string): string[] {
    const fields: string[] = []
    let field = ''
    let inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { field += '"'; i++; continue }
        inQ = !inQ
      } else if (c === ',' && !inQ) {
        fields.push(field.trim()); field = ''
      } else {
        field += c
      }
    }
    fields.push(field.trim())
    return fields
  }

  if (lines.length < 2) return []

  const headers = splitLine(lines[0]).map((h) => h.toLowerCase().replace(/"/g, '').trim())
  const qIdx  = headers.indexOf('question')
  const aIdx  = headers.indexOf('answer')
  const qtIdx = headers.indexOf('question_type')
  const tIdx  = headers.indexOf('topic')
  const dIdx  = headers.indexOf('difficulty')

  if (qIdx === -1 || aIdx === -1 || qtIdx === -1 || dIdx === -1) return []

  return lines.slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const cols = splitLine(line)
      const question      = (cols[qIdx]  ?? '').replace(/^"|"$/g, '').trim()
      const answer        = (cols[aIdx]  ?? '').replace(/^"|"$/g, '').trim()
      const question_type = (cols[qtIdx] ?? '').replace(/^"|"$/g, '').trim().toLowerCase()
      const topic         = tIdx !== -1 ? (cols[tIdx] ?? '').replace(/^"|"$/g, '').trim().toLowerCase() : ''
      const difficulty    = (cols[dIdx]  ?? '').replace(/^"|"$/g, '').trim().toLowerCase()

      const errors: string[] = []
      if (!question) errors.push('Question is empty')
      if (!answer)   errors.push('Answer is empty')
      if (!QUESTION_TYPES.includes(question_type as QuestionType))
        errors.push(`Invalid question_type: "${question_type}" (must be behavioral or technical)`)
      if (question_type === 'technical' && !TOPICS.includes(topic as Topic))
        errors.push(`Invalid topic for technical question: "${topic}"`)
      if (question_type === 'behavioral' && topic && topic !== '')
        errors.push('Behavioral questions must not have a topic')
      if (question_type === 'technical' && !DIFFICULTIES.includes(difficulty as Difficulty))
        errors.push(`Invalid difficulty for technical question: "${difficulty}" (must be easy, medium, or advanced)`)
      if (question_type === 'behavioral' && difficulty && difficulty !== '')
        errors.push('Behavioral questions must not have a difficulty')

      return { question, answer, question_type, topic, difficulty, valid: errors.length === 0, errors }
    })
}

// ── Shared input styles ───────────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-n7 bg-n9 text-white placeholder-[#8A9BB5]/50 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition'
const labelCls = 'block text-xs font-medium text-muted uppercase tracking-wider mb-1.5'
const selectCls = `${inputCls} cursor-pointer`

// ── QuestionFormFields ────────────────────────────────────────────────────────

function QuestionFormFields({
  form,
  onChange,
}: {
  form: FormState
  onChange: (f: FormState) => void
}) {
  return (
    <div className="space-y-4">
      {/* Row 1: question_type + difficulty (difficulty hidden for behavioral) */}
      <div className={`grid gap-4 ${form.question_type === 'technical' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div>
          <label className={labelCls}>Question Type</label>
          <select
            value={form.question_type}
            onChange={(e) => {
              const qt = e.target.value as QuestionType
              onChange({
                ...form,
                question_type: qt,
                topic:      qt === 'behavioral' ? '' : (form.topic || 'accounting'),
                difficulty: qt === 'behavioral' ? '' : (form.difficulty || 'easy'),
              })
            }}
            className={selectCls}
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        {form.question_type === 'technical' && (
          <div>
            <label className={labelCls}>Difficulty</label>
            <select
              value={form.difficulty}
              onChange={(e) => onChange({ ...form, difficulty: e.target.value as Difficulty })}
              className={selectCls}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Topic — only for technical */}
      {form.question_type === 'technical' && (
        <div>
          <label className={labelCls}>Topic</label>
          <select
            value={form.topic}
            onChange={(e) => onChange({ ...form, topic: e.target.value as Topic })}
            className={selectCls}
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>{TOPIC_LABELS[t]}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={labelCls}>Question</label>
        <textarea
          rows={3}
          required
          value={form.question}
          onChange={(e) => onChange({ ...form, question: e.target.value })}
          placeholder="Enter the interview question…"
          className={`${inputCls} resize-none`}
        />
      </div>
      <div>
        <label className={labelCls}>Answer</label>
        <textarea
          rows={6}
          required
          value={form.answer}
          onChange={(e) => onChange({ ...form, answer: e.target.value })}
          placeholder="Enter the full answer…"
          className={`${inputCls} resize-none`}
        />
      </div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-n8 rounded-xl border border-n7 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-n7 sticky top-0 bg-n8">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminPanel({ adminEmail }: { adminEmail: string }) {
  const supabase = createClient()

  const [questions, setQuestions] = useState<DBQuestion[]>([])
  const [loading, setLoading]     = useState(true)
  const [addTab, setAddTab]       = useState<'manual' | 'csv'>('manual')

  // Manual form
  const [manualForm, setManualForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [saveMsg, setSaveMsg]       = useState<string | null>(null)

  // CSV
  const [csvRows, setCsvRows]         = useState<CSVRow[] | null>(null)
  const [csvFileName, setCsvFileName] = useState('')
  const [importing, setImporting]     = useState(false)
  const [importMsg, setImportMsg]     = useState<string | null>(null)

  // Edit
  const [editing, setEditing]       = useState<DBQuestion | null>(null)
  const [editForm, setEditForm]     = useState<FormState>(EMPTY_FORM)
  const [editSaving, setEditSaving] = useState(false)

  // Filters
  const [filterType,  setFilterType]  = useState<QuestionType | 'all'>('all')
  const [filterTopic, setFilterTopic] = useState<Topic | 'all'>('all')
  const [filterDiff,  setFilterDiff]  = useState<Difficulty | 'all'>('all')

  // ── Data ─────────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })
    setQuestions(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  // ── Manual submit ──────────────────────────────────────────────────────────

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg(null)
    const payload = {
      question:      manualForm.question.trim(),
      answer:        manualForm.answer.trim(),
      question_type: manualForm.question_type,
      topic:         manualForm.question_type === 'technical' ? manualForm.topic || null : null,
      difficulty:    manualForm.question_type === 'technical' ? manualForm.difficulty || null : null,
    }
    const { error } = await supabase.from('questions').insert(payload)
    if (error) {
      setSaveMsg(`Error: ${error.message}`)
    } else {
      setSaveMsg('Question added.')
      setManualForm(EMPTY_FORM)
      load()
    }
    setSaving(false)
  }

  // ── CSV ───────────────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFileName(file.name)
    setImportMsg(null)
    const reader = new FileReader()
    reader.onload = (ev) => setCsvRows(parseCSV(ev.target?.result as string))
    reader.readAsText(file)
  }

  async function handleCSVImport() {
    if (!csvRows) return
    const valid = csvRows.filter((r) => r.valid)
    if (valid.length === 0) return
    setImporting(true)
    setImportMsg(null)
    const { error } = await supabase.from('questions').insert(
      valid.map((r) => ({
        question:      r.question,
        answer:        r.answer,
        question_type: r.question_type as QuestionType,
        topic:         r.question_type === 'technical' ? (r.topic as Topic) || null : null,
        difficulty:    r.question_type === 'technical' ? (r.difficulty as Difficulty) || null : null,
      }))
    )
    if (error) {
      setImportMsg(`Error: ${error.message}`)
    } else {
      setImportMsg(`Imported ${valid.length} question${valid.length !== 1 ? 's' : ''}.`)
      setCsvRows(null)
      setCsvFileName('')
      load()
    }
    setImporting(false)
  }

  // ── Edit / Delete ─────────────────────────────────────────────────────────

  function openEdit(q: DBQuestion) {
    setEditing(q)
    setEditForm({
      question:      q.question,
      answer:        q.answer,
      question_type: q.question_type,
      topic:         q.topic ?? '',
      difficulty:    q.difficulty ?? '',
    })
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setEditSaving(true)
    const { error } = await supabase
      .from('questions')
      .update({
        question:      editForm.question.trim(),
        answer:        editForm.answer.trim(),
        question_type: editForm.question_type,
        topic:         editForm.question_type === 'technical' ? editForm.topic || null : null,
        difficulty:    editForm.question_type === 'technical' ? editForm.difficulty || null : null,
      })
      .eq('id', editing.id)
    if (!error) { setEditing(null); load() }
    setEditSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this question?')) return
    await supabase.from('questions').delete().eq('id', id)
    load()
  }

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filtered = questions.filter((q) => {
    if (filterType  !== 'all' && q.question_type !== filterType)  return false
    if (filterTopic !== 'all' && q.topic          !== filterTopic) return false
    if (filterDiff  !== 'all' && q.difficulty     !== filterDiff)  return false
    return true
  })

  // Hide topic filter when showing only behavioral
  const showTopicFilter = filterType !== 'behavioral'

  const validCSVRows   = csvRows?.filter((r) => r.valid) ?? []
  const invalidCSVRows = csvRows?.filter((r) => !r.valid) ?? []

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-n9">
      {/* Header */}
      <header className="bg-n8 border-b border-n7 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-muted hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-base font-semibold text-white">Question Admin</h1>
            <p className="text-xs text-muted">{adminEmail}</p>
          </div>
        </div>
        <span className="text-xs font-medium text-muted bg-n7 px-2.5 py-1 rounded-full">
          {questions.length} questions
        </span>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">

        {/* ── Add Question ───────────────────────────────────────────────── */}
        <div className="bg-n8 rounded-xl border border-n7">
          <div className="px-6 py-4 border-b border-n7">
            <h2 className="text-sm font-semibold text-white">Add Question</h2>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-n7">
            {(['manual', 'csv'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setAddTab(t)}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  addTab === t
                    ? 'border-gold text-gold'
                    : 'border-transparent text-muted hover:text-white'
                }`}
              >
                {t === 'manual' ? 'Manual Entry' : 'Import CSV'}
              </button>
            ))}
          </div>

          <div className="px-6 py-5">
            {/* Manual Entry */}
            {addTab === 'manual' && (
              <form onSubmit={handleManualSubmit}>
                <QuestionFormFields form={manualForm} onChange={setManualForm} />
                <div className="flex items-center gap-3 mt-5">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm font-semibold text-n9 bg-gold rounded-lg hover:bg-gold2 disabled:opacity-60 transition-colors"
                  >
                    {saving ? 'Adding…' : 'Add Question'}
                  </button>
                  {saveMsg && (
                    <span className={`text-sm ${saveMsg.startsWith('Error') ? 'text-neg' : 'text-pos'}`}>
                      {saveMsg}
                    </span>
                  )}
                </div>
              </form>
            )}

            {/* CSV Import */}
            {addTab === 'csv' && (
              <div className="space-y-5">
                {/* Instructions */}
                <div className="bg-n9 rounded-lg px-4 py-3 border border-n7 text-xs text-muted space-y-2">
                  <p className="font-medium text-white">Expected CSV columns (header row required):</p>
                  <p>
                    <code className="font-mono text-gold">question_type, topic, difficulty, question, answer</code>
                  </p>
                  <div className="space-y-1 pt-1">
                    <p><span className="text-white">question_type:</span> behavioral | technical</p>
                    <p><span className="text-white">topic:</span> (leave empty for behavioral) accounting | valuation | dcf | lbo | ma | restructuring | financial_markets</p>
                    <p><span className="text-white">difficulty:</span> (technical only) easy | medium | advanced — leave empty for behavioral</p>
                  </div>
                  <p className="pt-1 text-muted/70">
                    Tip: Wrap fields containing commas in double quotes. Escape internal quotes by doubling them.
                  </p>
                </div>

                {/* File input */}
                <div>
                  <label className={labelCls}>CSV File</label>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="block text-sm text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-n7 file:text-xs file:font-medium file:text-muted file:bg-n8 hover:file:bg-n6 file:cursor-pointer transition"
                  />
                </div>

                {/* Preview */}
                {csvRows !== null && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-medium text-white">{csvFileName}</span>
                      <span className="text-pos">{validCSVRows.length} valid</span>
                      {invalidCSVRows.length > 0 && (
                        <span className="text-neg">{invalidCSVRows.length} invalid (will be skipped)</span>
                      )}
                    </div>

                    {csvRows.length > 0 && (
                      <div className="max-h-64 overflow-y-auto rounded-lg border border-n7">
                        <table className="w-full text-xs">
                          <thead className="bg-n9 sticky top-0">
                            <tr>
                              <th className="text-left text-muted font-medium px-3 py-2 w-6">#</th>
                              <th className="text-left text-muted font-medium px-3 py-2">Question</th>
                              <th className="text-left text-muted font-medium px-3 py-2 w-24">Type</th>
                              <th className="text-left text-muted font-medium px-3 py-2 w-28">Topic</th>
                              <th className="text-left text-muted font-medium px-3 py-2 w-24">Difficulty</th>
                              <th className="text-left text-muted font-medium px-3 py-2 w-8" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-n7">
                            {csvRows.map((row, i) => (
                              <tr key={i} className={row.valid ? '' : 'bg-neg/5'}>
                                <td className="px-3 py-2 text-muted">{i + 1}</td>
                                <td className="px-3 py-2 text-white max-w-xs truncate">{row.question || '—'}</td>
                                <td className="px-3 py-2 text-muted">{row.question_type || '—'}</td>
                                <td className="px-3 py-2 text-muted">{row.topic || '—'}</td>
                                <td className="px-3 py-2 text-muted">{row.difficulty || '—'}</td>
                                <td className="px-3 py-2">
                                  {!row.valid && (
                                    <span title={row.errors.join('; ')} className="text-neg cursor-help">✕</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleCSVImport}
                        disabled={importing || validCSVRows.length === 0}
                        className="px-4 py-2 text-sm font-semibold text-n9 bg-gold rounded-lg hover:bg-gold2 disabled:opacity-60 transition-colors"
                      >
                        {importing
                          ? 'Importing…'
                          : `Import ${validCSVRows.length} Question${validCSVRows.length !== 1 ? 's' : ''}`}
                      </button>
                      {importMsg && (
                        <span className={`text-sm ${importMsg.startsWith('Error') ? 'text-neg' : 'text-pos'}`}>
                          {importMsg}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Question Bank ──────────────────────────────────────────────── */}
        <div className="bg-n8 rounded-xl border border-n7">
          <div className="px-6 py-4 border-b border-n7 flex items-start justify-between gap-4">
            <h2 className="text-sm font-semibold text-white pt-0.5">
              Question Bank
              {!loading && (
                <span className="ml-2 text-xs font-normal text-muted">
                  {filtered.length}{filtered.length !== questions.length ? ` of ${questions.length}` : ''} questions
                </span>
              )}
            </h2>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as QuestionType | 'all')
                  setFilterTopic('all')
                }}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-n7 bg-n9 text-muted focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
              >
                <option value="all">All Types</option>
                {QUESTION_TYPES.map((t) => <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>)}
              </select>
              {showTopicFilter && (
                <select
                  value={filterTopic}
                  onChange={(e) => setFilterTopic(e.target.value as Topic | 'all')}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-n7 bg-n9 text-muted focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
                >
                  <option value="all">All Topics</option>
                  {TOPICS.map((t) => <option key={t} value={t}>{TOPIC_LABELS[t]}</option>)}
                </select>
              )}
              <select
                value={filterDiff}
                onChange={(e) => setFilterDiff(e.target.value as Difficulty | 'all')}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-n7 bg-n9 text-muted focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
              >
                <option value="all">All Difficulties</option>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted">
              {questions.length === 0
                ? 'No questions yet. Add one above or import a CSV.'
                : 'No questions match the selected filters.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-n7">
                    <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Question</th>
                    <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3 w-28">Type</th>
                    <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3 w-32">Topic</th>
                    <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3 w-28">Difficulty</th>
                    <th className="px-4 py-3 w-24" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((q, i) => (
                    <tr
                      key={q.id}
                      className={`border-b border-n7/50 hover:bg-n6 transition-colors ${i % 2 === 0 ? 'bg-n8' : 'bg-n9/20'}`}
                    >
                      <td className="px-4 py-3 text-white max-w-md">
                        <span className="line-clamp-2 leading-snug">{q.question}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={TYPE_BADGE[q.question_type]}>
                          {QUESTION_TYPE_LABELS[q.question_type]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {q.topic ? (
                          <Badge className={TOPIC_BADGE[q.topic]}>{TOPIC_LABELS[q.topic]}</Badge>
                        ) : (
                          <span className="text-muted/40 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {q.difficulty ? (
                          <Badge className={DIFFICULTY_BADGE[q.difficulty]}>{DIFFICULTY_LABELS[q.difficulty]}</Badge>
                        ) : (
                          <span className="text-muted/40 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(q)}
                            className="text-xs text-muted hover:text-white px-2.5 py-1 rounded border border-n7 hover:border-n5 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            className="text-xs text-neg/70 hover:text-neg px-2.5 py-1 rounded border border-neg/20 hover:border-neg/40 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      {editing && (
        <Modal title="Edit Question" onClose={() => setEditing(null)}>
          <form onSubmit={handleEditSave}>
            <QuestionFormFields form={editForm} onChange={setEditForm} />
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm font-medium text-muted rounded-lg border border-n7 hover:bg-n6 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="px-4 py-2 text-sm font-semibold text-n9 bg-gold rounded-lg hover:bg-gold2 disabled:opacity-60 transition-colors"
              >
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
