'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TOPIC_LABELS, DIFFICULTY_LABELS, type Topic, type Difficulty } from '@/lib/questions'

// ── Types ─────────────────────────────────────────────────────────────────────

type DBQuestion = {
  id: string
  question: string
  answer: string
  topic: Topic
  difficulty: Difficulty
  created_at: string
}

type FormState = {
  question: string
  answer: string
  topic: Topic
  difficulty: Difficulty
}

type CSVRow = {
  question: string
  answer: string
  topic: string
  difficulty: string
  valid: boolean
  errors: string[]
}

const TOPICS: Topic[] = ['accounting', 'valuation', 'dcf', 'lbo', 'other', 'brainteaser']
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'advanced']

const EMPTY_FORM: FormState = {
  question: '',
  answer: '',
  topic: 'accounting',
  difficulty: 'easy',
}

const DIFFICULTY_BADGE: Record<Difficulty, string> = {
  easy:     'bg-emerald-50 text-emerald-700',
  medium:   'bg-amber-50 text-amber-700',
  advanced: 'bg-red-50 text-red-700',
}

const TOPIC_BADGE: Record<Topic, string> = {
  accounting:  'bg-blue-50 text-blue-700',
  valuation:   'bg-violet-50 text-violet-700',
  dcf:         'bg-indigo-50 text-indigo-700',
  lbo:         'bg-orange-50 text-orange-700',
  other:       'bg-slate-100 text-slate-600',
  brainteaser: 'bg-pink-50 text-pink-700',
}

// ── CSV Parser ────────────────────────────────────────────────────────────────

function parseCSV(text: string): CSVRow[] {
  // Strip BOM if present
  const cleaned = text.replace(/^\uFEFF/, '')
  const lines: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (ch === '"') {
      // Handle escaped quotes ""
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
        fields.push(field.trim())
        field = ''
      } else {
        field += c
      }
    }
    fields.push(field.trim())
    return fields
  }

  if (lines.length < 2) return []

  const headers = splitLine(lines[0]).map((h) => h.toLowerCase().replace(/"/g, '').trim())
  const qIdx = headers.indexOf('question')
  const aIdx = headers.indexOf('answer')
  const tIdx = headers.indexOf('topic')
  const dIdx = headers.indexOf('difficulty')

  if (qIdx === -1 || aIdx === -1 || tIdx === -1 || dIdx === -1) return []

  return lines.slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const cols = splitLine(line)
      const question = (cols[qIdx] ?? '').replace(/^"|"$/g, '').trim()
      const answer   = (cols[aIdx] ?? '').replace(/^"|"$/g, '').trim()
      const topic    = (cols[tIdx] ?? '').replace(/^"|"$/g, '').trim().toLowerCase()
      const difficulty = (cols[dIdx] ?? '').replace(/^"|"$/g, '').trim().toLowerCase()

      const errors: string[] = []
      if (!question)                              errors.push('Question is empty')
      if (!answer)                                errors.push('Answer is empty')
      if (!TOPICS.includes(topic as Topic))       errors.push(`Invalid topic: "${topic}"`)
      if (!DIFFICULTIES.includes(difficulty as Difficulty)) errors.push(`Invalid difficulty: "${difficulty}"`)

      return { question, answer, topic, difficulty, valid: errors.length === 0, errors }
    })
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}

function QuestionFormFields({
  form,
  onChange,
}: {
  form: FormState
  onChange: (f: FormState) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Topic</label>
          <select
            value={form.topic}
            onChange={(e) => onChange({ ...form, topic: e.target.value as Topic })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>{TOPIC_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Difficulty</label>
          <select
            value={form.difficulty}
            onChange={(e) => onChange({ ...form, difficulty: e.target.value as Difficulty })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Question</label>
        <textarea
          rows={3}
          required
          value={form.question}
          onChange={(e) => onChange({ ...form, question: e.target.value })}
          placeholder="Enter the interview question…"
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Answer</label>
        <textarea
          rows={6}
          required
          value={form.answer}
          onChange={(e) => onChange({ ...form, answer: e.target.value })}
          placeholder="Enter the full answer…"
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>
    </div>
  )
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
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

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminPanel({ adminEmail }: { adminEmail: string }) {
  const supabase = createClient()

  // Questions list
  const [questions, setQuestions] = useState<DBQuestion[]>([])
  const [loading, setLoading] = useState(true)

  // Add-question tabs
  const [addTab, setAddTab] = useState<'manual' | 'csv'>('manual')

  // Manual form
  const [manualForm, setManualForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  // CSV
  const [csvRows, setCsvRows] = useState<CSVRow[] | null>(null)
  const [csvFileName, setCsvFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  // Edit modal
  const [editing, setEditing] = useState<DBQuestion | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)
  const [editSaving, setEditSaving] = useState(false)

  // Table filters
  const [filterTopic, setFilterTopic] = useState<Topic | 'all'>('all')
  const [filterDiff, setFilterDiff] = useState<Difficulty | 'all'>('all')

  // ── Data loading ─────────────────────────────────────────────────────────────

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
    const { error } = await supabase.from('questions').insert({
      question: manualForm.question.trim(),
      answer: manualForm.answer.trim(),
      topic: manualForm.topic,
      difficulty: manualForm.difficulty,
    })
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
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setCsvRows(parseCSV(text))
    }
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
        question: r.question,
        answer: r.answer,
        topic: r.topic as Topic,
        difficulty: r.difficulty as Difficulty,
      }))
    )
    if (error) {
      setImportMsg(`Error: ${error.message}`)
    } else {
      setImportMsg(`Imported ${valid.length} question${valid.length !== 1 ? 's' : ''} successfully.`)
      setCsvRows(null)
      setCsvFileName('')
      load()
    }
    setImporting(false)
  }

  // ── Edit ─────────────────────────────────────────────────────────────────

  function openEdit(q: DBQuestion) {
    setEditing(q)
    setEditForm({ question: q.question, answer: q.answer, topic: q.topic, difficulty: q.difficulty })
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setEditSaving(true)
    const { error } = await supabase
      .from('questions')
      .update({
        question: editForm.question.trim(),
        answer: editForm.answer.trim(),
        topic: editForm.topic,
        difficulty: editForm.difficulty,
      })
      .eq('id', editing.id)
    if (!error) {
      setEditing(null)
      load()
    }
    setEditSaving(false)
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    if (!confirm('Delete this question?')) return
    await supabase.from('questions').delete().eq('id', id)
    load()
  }

  // ── Filtered table data ───────────────────────────────────────────────────

  const filtered = questions.filter(
    (q) =>
      (filterTopic === 'all' || q.topic === filterTopic) &&
      (filterDiff === 'all' || q.difficulty === filterDiff)
  )

  const validCSVRows = csvRows?.filter((r) => r.valid) ?? []
  const invalidCSVRows = csvRows?.filter((r) => !r.valid) ?? []

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-base font-semibold text-slate-900">Question Admin</h1>
            <p className="text-xs text-slate-400">{adminEmail}</p>
          </div>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {questions.length} questions
        </span>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-8 space-y-8">

        {/* ── Add Question card ──────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Add Question</h2>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {(['manual', 'csv'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setAddTab(t)}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  addTab === t
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
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
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                  >
                    {saving ? 'Adding…' : 'Add Question'}
                  </button>
                  {saveMsg && (
                    <span className={`text-sm ${saveMsg.startsWith('Error') ? 'text-red-600' : 'text-emerald-600'}`}>
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
                <div className="bg-slate-50 rounded-lg px-4 py-3 text-xs text-slate-500 space-y-1">
                  <p className="font-medium text-slate-600">Expected CSV columns (header row required):</p>
                  <p><code className="font-mono bg-white px-1 rounded border border-slate-200">question, answer, topic, difficulty</code></p>
                  <p className="mt-1">
                    Valid topics: {TOPICS.join(', ')}
                    <br />
                    Valid difficulties: {DIFFICULTIES.join(', ')}
                  </p>
                </div>

                {/* File input */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">CSV File</label>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="block text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-200 file:text-xs file:font-medium file:text-slate-600 file:bg-white hover:file:bg-slate-50 file:cursor-pointer"
                  />
                </div>

                {/* Preview */}
                {csvRows !== null && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-medium text-slate-800">{csvFileName}</span>
                      <span className="text-emerald-600">{validCSVRows.length} valid</span>
                      {invalidCSVRows.length > 0 && (
                        <span className="text-red-500">{invalidCSVRows.length} invalid (will be skipped)</span>
                      )}
                    </div>

                    {csvRows.length > 0 && (
                      <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50 sticky top-0">
                            <tr>
                              <th className="text-left text-slate-400 font-medium px-3 py-2 w-6">#</th>
                              <th className="text-left text-slate-400 font-medium px-3 py-2">Question</th>
                              <th className="text-left text-slate-400 font-medium px-3 py-2 w-28">Topic</th>
                              <th className="text-left text-slate-400 font-medium px-3 py-2 w-24">Difficulty</th>
                              <th className="text-left text-slate-400 font-medium px-3 py-2 w-8" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {csvRows.map((row, i) => (
                              <tr key={i} className={row.valid ? '' : 'bg-red-50'}>
                                <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                                <td className="px-3 py-2 text-slate-700 max-w-xs truncate">{row.question || '—'}</td>
                                <td className="px-3 py-2 text-slate-500">{row.topic || '—'}</td>
                                <td className="px-3 py-2 text-slate-500">{row.difficulty || '—'}</td>
                                <td className="px-3 py-2">
                                  {!row.valid && (
                                    <span title={row.errors.join('; ')} className="text-red-500 cursor-help">✕</span>
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
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                      >
                        {importing ? 'Importing…' : `Import ${validCSVRows.length} Question${validCSVRows.length !== 1 ? 's' : ''}`}
                      </button>
                      {importMsg && (
                        <span className={`text-sm ${importMsg.startsWith('Error') ? 'text-red-600' : 'text-emerald-600'}`}>
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
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Question Bank
              {!loading && (
                <span className="ml-2 text-xs font-normal text-slate-400">
                  {filtered.length}{filtered.length !== questions.length ? ` of ${questions.length}` : ''} questions
                </span>
              )}
            </h2>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <select
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value as Topic | 'all')}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Topics</option>
                {TOPICS.map((t) => <option key={t} value={t}>{TOPIC_LABELS[t]}</option>)}
              </select>
              <select
                value={filterDiff}
                onChange={(e) => setFilterDiff(e.target.value as Difficulty | 'all')}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Difficulties</option>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-400">
              {questions.length === 0
                ? 'No questions yet. Add one above or import a CSV.'
                : 'No questions match the selected filters.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Question</th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3 w-32">Topic</th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3 w-28">Difficulty</th>
                    <th className="px-4 py-3 w-24" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-800 max-w-md">
                        <span className="line-clamp-2 leading-snug">{q.question}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={TOPIC_BADGE[q.topic]}>{TOPIC_LABELS[q.topic]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={DIFFICULTY_BADGE[q.difficulty]}>{DIFFICULTY_LABELS[q.difficulty]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(q)}
                            className="text-xs text-slate-500 hover:text-slate-900 px-2.5 py-1 rounded border border-slate-200 hover:border-slate-300 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            className="text-xs text-red-500 hover:text-red-700 px-2.5 py-1 rounded border border-red-100 hover:border-red-200 transition"
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

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      {editing && (
        <Modal title="Edit Question" onClose={() => setEditing(null)}>
          <form onSubmit={handleEditSave}>
            <QuestionFormFields form={editForm} onChange={setEditForm} />
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
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
