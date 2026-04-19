'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-n9">
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-gold tracking-tight">RecruitBanking</p>
          <p className="text-sm text-muted mt-1">Investment Banking Recruiting Platform</p>
        </div>

        <div className="bg-n8 rounded-xl border border-n7 p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-white">Welcome back</h1>
            <p className="text-sm text-muted mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-n7 bg-n9 text-white placeholder-[#8A9BB5]/50 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-n7 bg-n9 text-white placeholder-[#8A9BB5]/50 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition"
              />
            </div>

            {error && (
              <p className="text-sm text-neg bg-neg/10 px-3 py-2.5 rounded-lg border border-neg/20">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gold text-n9 text-sm font-semibold rounded-lg hover:bg-gold2 disabled:opacity-60 transition-colors mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-gold font-medium hover:text-gold2 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
