'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  QUESTIONS,
  TOPIC_LABELS,
  TOPICS,
  type Topic,
} from '@/lib/questions'

// ── Topic metadata ─────────────────────────────────────────────────────────────

const TOPIC_DATA: Record<Topic, { desc: string; color: string; bg: string }> = {
  accounting:        { desc: 'Financial statements, GAAP, and accounting mechanics', color: 'text-blue-600',   bg: 'bg-blue-50' },
  valuation:         { desc: 'Comparable companies, precedents, and multiples',      color: 'text-purple-600', bg: 'bg-purple-50' },
  dcf:               { desc: 'Discounted cash flow, WACC, and terminal value',       color: 'text-indigo-600', bg: 'bg-indigo-50' },
  lbo:               { desc: 'LBO mechanics, returns analysis, and PE concepts',     color: 'text-orange-600', bg: 'bg-orange-50' },
  ma:                { desc: 'Deal structure, synergies, and merger modeling',        color: 'text-teal-600',   bg: 'bg-teal-50' },
  restructuring:     { desc: 'Bankruptcy, distressed debt, and capital structure',   color: 'text-red-600',    bg: 'bg-red-50' },
  financial_markets: { desc: 'Macro, rates, market dynamics, and estimation',        color: 'text-amber-600',  bg: 'bg-amber-50' },
}

// ── Demo data ──────────────────────────────────────────────────────────────────

const DEMO_CONTACTS = [
  { name: 'Sarah Chen',      firm: 'Goldman Sachs',       role: 'VP, M&A Advisory',        date: 'Apr 10', status: 'Follow-up' },
  { name: 'James Whitfield', firm: 'Morgan Stanley',      role: 'MD, Leveraged Finance',   date: 'Apr 7',  status: 'Meeting Set' },
  { name: 'Priya Sharma',    firm: 'Lazard',              role: 'Associate, Restructuring', date: 'Apr 3',  status: 'Connected' },
  { name: 'Tyler Huang',     firm: 'Evercore',            role: 'Analyst, M&A',            date: 'Mar 28', status: 'Follow-up' },
  { name: 'Alexandra Ross',  firm: 'Centerview Partners', role: 'Partner',                 date: 'Mar 21', status: 'Coffee Chat' },
]

const DEMO_FIRMS = [
  { name: 'Goldman Sachs',  div: 'Investment Banking',  status: 'Interview',    badge: 'bg-amber-100 text-amber-700' },
  { name: 'Morgan Stanley', div: 'M&A Advisory',        status: 'Applied',      badge: 'bg-blue-100 text-blue-700' },
  { name: 'Lazard',         div: 'Restructuring',       status: 'Offer',        badge: 'bg-green-100 text-green-700' },
  { name: 'Evercore',       div: 'Advisory',            status: 'Prospective',  badge: 'bg-gray-100 text-gray-600' },
]

const CONTACT_STATUS_COLOR: Record<string, string> = {
  'Follow-up':   'bg-amber-100 text-amber-700',
  'Meeting Set': 'bg-green-100 text-green-700',
  'Connected':   'bg-blue-100 text-blue-700',
  'Coffee Chat': 'bg-purple-100 text-purple-700',
}

// ── Scroll helper ──────────────────────────────────────────────────────────────

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

// ── Navigation ─────────────────────────────────────────────────────────────────

function Nav({ scrolled }: { scrolled: boolean }) {
  const navLinks = [
    { id: 'about',               label: 'About' },
    { id: 'technical-prep',      label: 'Technical Prep' },
    { id: 'networking-tracker',  label: 'Networking Tracker' },
    { id: 'guides',              label: 'Guides' },
    { id: 'pricing',             label: 'Pricing' },
  ]

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-8 h-[68px] flex items-center justify-between gap-8">
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`text-sm font-semibold tracking-[0.18em] uppercase shrink-0 transition-colors ${
            scrolled ? 'text-gray-900' : 'text-white'
          }`}
        >
          RecruitBanking
        </button>

        {/* Center links */}
        <div className="hidden lg:flex items-center gap-7">
          {navLinks.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`text-sm font-medium transition-colors ${
                scrolled
                  ? 'text-gray-500 hover:text-gray-900'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-5 shrink-0">
          <Link
            href="/login"
            className={`text-sm font-medium transition-colors ${
              scrolled ? 'text-gray-500 hover:text-gray-900' : 'text-white/90 hover:text-white'
            }`}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className={`text-sm font-semibold px-5 py-2.5 rounded-full transition-colors ${
              scrolled
                ? 'bg-[#0A1628] text-white hover:bg-[#162840]'
                : 'bg-white text-[#0A1628] hover:bg-white/90'
            }`}
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ── Hero ───────────────────────────────────────────────────────────────────────

function Hero() {
  const [email, setEmail] = useState('')

  return (
    <section
      id="hero"
      className="relative flex flex-col"
      style={{ height: '100svh', minHeight: 600 }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/nyc.jpg)' }}
      />
      {/* Overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(5,10,20,0.58)' }} />

      {/* Main content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1
          className="text-5xl md:text-6xl lg:text-[4.5rem] font-semibold text-white leading-[1.1] max-w-3xl mb-6"
          style={{ letterSpacing: '-0.03em' }}
        >
          Simplify the investment banking recruiting process
        </h1>

        <p className="text-lg md:text-xl max-w-lg mb-12 leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
          Track contacts, prepare for technicals, and land your offer.
        </p>

        {/* Email + CTA */}
        <div className="flex items-center gap-2 w-full max-w-sm">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 min-w-0 px-5 py-3 rounded-full text-sm text-white placeholder-white/50 focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.22)',
            }}
          />
          <Link
            href={`/signup${email ? `?email=${encodeURIComponent(email)}` : ''}`}
            className="shrink-0 px-6 py-3 rounded-full bg-white text-[#0A1628] text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>

      {/* Disclaimer bar */}
      <div
        className="relative px-6 py-3.5 text-center"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
      >
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
          RecruitBanking is an independent platform. Not affiliated with any financial institution.
        </p>
      </div>
    </section>
  )
}

// ── About ──────────────────────────────────────────────────────────────────────

function AboutSection() {
  return (
    <section id="about" className="py-32 bg-white">
      <div className="max-w-6xl mx-auto px-8">
        <div className="max-w-2xl mb-20">
          <p className="text-xs font-semibold tracking-[0.16em] uppercase text-amber-600 mb-5">About</p>
          <h2
            className="text-4xl md:text-5xl font-semibold text-gray-900 leading-tight mb-6"
            style={{ letterSpacing: '-0.025em' }}
          >
            Built for students breaking into investment banking
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed">
            Recruiting for investment banking is one of the most competitive processes in finance.
            RecruitBanking gives you the tools to stay organized and walk into every interview prepared.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Track every contact',
              desc:  'Log every coffee chat and informational interview. Set follow-up reminders and never let a relationship go cold.',
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              ),
            },
            {
              title: 'Master the technicals',
              desc:  'Practice 50+ questions across accounting, valuation, DCF, LBO, M&A, restructuring, and financial markets.',
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              ),
            },
            {
              title: 'Monitor your pipeline',
              desc:  'See exactly where you stand with every firm — from first contact through offer. Know your next move.',
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-gray-100 p-8 hover:border-gray-200 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 mb-5">
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Technical Prep ─────────────────────────────────────────────────────────────

function TechnicalPrepSection() {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [qIdx, setQIdx]       = useState(0)
  const [revealed, setRevealed] = useState(false)

  const pool = selectedTopic
    ? QUESTIONS.filter((q) => q.topic === selectedTopic)
    : []
  const currentQ = pool[qIdx] ?? null

  function pick(t: Topic) {
    setSelectedTopic(t)
    setQIdx(0)
    setRevealed(false)
  }

  function next() {
    setQIdx((i) => i + 1)
    setRevealed(false)
  }

  return (
    <section id="technical-prep" className="py-32 bg-gray-50">
      <div className="max-w-6xl mx-auto px-8">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <p className="text-xs font-semibold tracking-[0.16em] uppercase text-amber-600 mb-5">Technical Prep</p>
          <h2
            className="text-4xl md:text-5xl font-semibold text-gray-900 leading-tight mb-6"
            style={{ letterSpacing: '-0.025em' }}
          >
            Everything you need to ace the technical round
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed">
            50+ questions across 7 core topics. Self-grade your answers and track performance by topic.
          </p>
        </div>

        {/* Topic grid — 4 + 3 + CTA */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {TOPICS.map((t) => {
            const d = TOPIC_DATA[t]
            const active = selectedTopic === t
            return (
              <button
                key={t}
                onClick={() => pick(t)}
                className={`p-5 rounded-xl border text-left transition-all ${
                  active
                    ? 'border-gray-900 bg-white shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${d.color}`}>
                  {TOPIC_LABELS[t]}
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">{d.desc}</p>
              </button>
            )
          })}
          {/* 8th slot — CTA card to round out the grid */}
          <Link
            href="/signup"
            className="p-5 rounded-xl border border-dashed border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm transition-all flex flex-col justify-between group"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 group-hover:text-gray-600 transition-colors">
              50+ questions
            </p>
            <p className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-500 transition-colors">
              Get full access — free
            </p>
          </Link>
        </div>

        {/* Question card */}
        <div className="max-w-2xl mx-auto">
          {selectedTopic && currentQ ? (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-8 py-7">
                <div className="flex items-center gap-2 mb-5">
                  <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${TOPIC_DATA[selectedTopic].bg} ${TOPIC_DATA[selectedTopic].color}`}>
                    {TOPIC_LABELS[selectedTopic]}
                  </span>
                  {currentQ.difficulty && (
                    <span className="text-xs text-gray-400 capitalize">{currentQ.difficulty}</span>
                  )}
                </div>
                <p className="text-[1.05rem] font-medium text-gray-900 leading-snug">
                  {currentQ.question}
                </p>
              </div>

              {!revealed ? (
                <div className="px-8 pb-7">
                  <button
                    onClick={() => setRevealed(true)}
                    className="w-full py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    Reveal answer
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-100 px-8 py-7">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Answer</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{currentQ.answer}</p>
                  <div className="flex items-center justify-between mt-7 pt-6 border-t border-gray-100">
                    <p className="text-xs text-gray-400">{qIdx + 1} of {pool.length}</p>
                    {qIdx + 1 < pool.length ? (
                      <button
                        onClick={next}
                        className="flex items-center gap-1 text-sm font-medium text-gray-900 hover:opacity-60 transition-opacity"
                      >
                        Next question
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ) : (
                      <Link href="/signup" className="text-sm font-medium text-amber-600 hover:opacity-70 transition-opacity">
                        Get full access →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 px-8 py-14 text-center">
              <p className="text-sm text-gray-400">Select a topic above to try a sample question</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#0A1628] text-white text-sm font-semibold rounded-full hover:bg-[#162840] transition-colors"
          >
            Start practicing free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── Networking Tracker ─────────────────────────────────────────────────────────

function NetworkingTrackerSection() {
  const [activeTab, setActiveTab] = useState<'contacts' | 'firms'>('contacts')

  return (
    <section id="networking-tracker" className="py-32 bg-white">
      <div className="max-w-6xl mx-auto px-8">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-amber-600 mb-5">
              Networking Tracker
            </p>
            <h2
              className="text-4xl md:text-5xl font-semibold text-gray-900 leading-tight mb-6"
              style={{ letterSpacing: '-0.025em' }}
            >
              Your entire network, organized
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-10">
              Log every contact, track every firm, and stay on top of follow-ups — all in one place.
            </p>

            <ul className="space-y-5">
              {[
                { title: 'Contact log', desc: 'Record names, firms, roles, and the date of every conversation.' },
                { title: 'Firm pipeline', desc: 'Track each firm from prospective through offer. Update status as you progress.' },
                { title: 'Follow-up reminders', desc: 'Get alerted when a contact hasn\'t heard from you in over a week.' },
                { title: 'Email quick-send', desc: 'Click any contact\'s email to open a pre-addressed message instantly.' },
              ].map((f) => (
                <li key={f.title} className="flex gap-4">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{f.title}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#0A1628] text-white text-sm font-semibold rounded-full hover:bg-[#162840] transition-colors"
              >
                Start tracking free
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right — mock dashboard */}
          <div>
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-2xl">
              {/* Browser chrome */}
              <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4 bg-white rounded-md px-3 py-1.5 flex items-center">
                  <span className="text-[11px] text-gray-400 font-mono">
                    app.recruitbanking.com/{activeTab}
                  </span>
                </div>
              </div>

              {/* App */}
              <div className="flex bg-[#0A1628]" style={{ height: 380 }}>
                {/* Sidebar */}
                <div className="w-40 shrink-0 bg-[#0F1F3D] border-r border-[#1E3A5F] py-5 flex flex-col">
                  <div className="px-4 mb-6">
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#C9A84C]">RecruitBanking</span>
                  </div>
                  {[
                    { id: 'contacts', label: 'CRM' },
                    { id: 'firms',    label: 'Firms' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as typeof activeTab)}
                      className={`w-full text-left px-4 py-2 text-[11px] font-medium border-l-2 transition-colors ${
                        activeTab === item.id
                          ? 'border-[#C9A84C] text-white bg-[#1d3251]/60'
                          : 'border-transparent text-white/40 hover:text-white/70'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden p-5">
                  {activeTab === 'contacts' && (
                    <>
                      <p className="text-xs font-semibold text-white mb-3">Contacts</p>
                      <div className="space-y-1.5">
                        {DEMO_CONTACTS.map((c) => (
                          <div key={c.name} className="flex items-center justify-between bg-[#0F1F3D] rounded-lg px-3 py-2.5">
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium text-white truncate">{c.name}</p>
                              <p className="text-[10px] text-white/40 truncate">{c.firm} · {c.role}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className="text-[9px] text-white/30">{c.date}</span>
                              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${CONTACT_STATUS_COLOR[c.status]}`}>
                                {c.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {activeTab === 'firms' && (
                    <>
                      <p className="text-xs font-semibold text-white mb-3">Firms</p>
                      <div className="space-y-1.5">
                        {DEMO_FIRMS.map((f) => (
                          <div key={f.name} className="flex items-center justify-between bg-[#0F1F3D] rounded-lg px-3 py-2.5">
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium text-white truncate">{f.name}</p>
                              <p className="text-[10px] text-white/40 truncate">{f.div}</p>
                            </div>
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ml-2 ${f.badge}`}>
                              {f.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Coming Soon section ────────────────────────────────────────────────────────

function ComingSoonSection({
  id,
  label,
  title,
  desc,
  bg,
}: {
  id: string
  label: string
  title: string
  desc: string
  bg: string
}) {
  return (
    <section id={id} className={`py-32 ${bg}`}>
      <div className="max-w-6xl mx-auto px-8 text-center">
        <p className="text-xs font-semibold tracking-[0.16em] uppercase text-amber-600 mb-5">{label}</p>
        <h2
          className="text-4xl md:text-5xl font-semibold text-gray-900 leading-tight mb-6 max-w-xl mx-auto"
          style={{ letterSpacing: '-0.025em' }}
        >
          {title}
        </h2>
        <p className="text-lg text-gray-500 leading-relaxed max-w-md mx-auto mb-12">
          {desc}
        </p>
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gray-100 border border-gray-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="text-sm font-medium text-gray-500">Coming soon</span>
        </div>
      </div>
    </section>
  )
}

// ── Footer ─────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-12">
      <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <span className="text-sm font-semibold tracking-[0.18em] uppercase text-gray-900">
          RecruitBanking
        </span>
        <div className="flex items-center gap-8">
          {[
            { id: 'about', label: 'About' },
            { id: 'technical-prep', label: 'Technical Prep' },
            { id: 'networking-tracker', label: 'Networking' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              {label}
            </button>
          ))}
          <Link href="/login"  className="text-sm text-gray-400 hover:text-gray-700 transition-colors">Sign in</Link>
          <Link href="/signup" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">Sign up</Link>
        </div>
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} RecruitBanking</p>
      </div>
    </footer>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="bg-white" style={{ fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif' }}>
      <Nav scrolled={scrolled} />
      <Hero />
      <AboutSection />
      <TechnicalPrepSection />
      <NetworkingTrackerSection />
      <ComingSoonSection
        id="pricing"
        label="Pricing"
        title="Simple, transparent pricing"
        desc="We're finalizing our pricing plans. Sign up free today — early users keep their access."
        bg="bg-gray-50"
      />
      <ComingSoonSection
        id="guides"
        label="Guides"
        title="Your IB recruiting playbook"
        desc="In-depth guides on networking, the recruiting timeline, and how to stand out in interviews."
        bg="bg-white"
      />
      <Footer />
    </div>
  )
}
