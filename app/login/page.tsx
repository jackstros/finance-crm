'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    fontSize: 14,
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.08)',
    color: '#ffffff',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
    letterSpacing: '0.01em',
  }

  return (
    <div style={{ position: 'relative', minHeight: '100svh', display: 'flex', flexDirection: 'column' }}>

      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/wallstreet.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,10,20,0.62)' }} />

      {/* Nav */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 68 }}>
        <Link
          href="/"
          style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ffffff', textDecoration: 'none' }}
        >
          RecruitBanking
        </Link>
        <Link
          href="/"
          style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', transition: 'color 0.2s' }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = '#ffffff'}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'}
        >
          ← Back to home
        </Link>
      </nav>

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Heading above card */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1
              style={{
                fontSize: 36,
                fontWeight: 600,
                color: '#ffffff',
                margin: '0 0 10px',
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
              }}
            >
              Welcome back
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>
              Sign in to your RecruitBanking account
            </p>
          </div>

          {/* Card */}
          <div
            style={{
              background: 'rgba(255,255,255,0.07)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.13)',
              borderRadius: 20,
              padding: '36px 36px 32px',
            }}
          >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  Email
                </label>
                <FocusInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  baseStyle={inputStyle}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  Password
                </label>
                <FocusInput
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  baseStyle={inputStyle}
                />
              </div>

              {/* Error */}
              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 13, color: '#fca5a5' }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#0A1628',
                  background: loading ? 'rgba(255,255,255,0.7)' : '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.01em',
                  transition: 'background 0.2s, opacity 0.2s',
                  marginTop: 4,
                }}
                onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.88)' }}
                onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#ffffff' }}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '24px 0' }} />

            {/* Sign up link */}
            <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                style={{ color: '#ffffff', fontWeight: 600, textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.textDecoration = 'underline'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.textDecoration = 'none'}
              >
                Sign up
              </Link>
            </p>
          </div>

        </div>
      </div>

      {/* Footer disclaimer */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '16px 20px', fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>
        RecruitBanking · Investment Banking Recruiting Platform
      </div>
    </div>
  )
}

// Focus-aware input that highlights on focus
function FocusInput({
  baseStyle,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { baseStyle: React.CSSProperties }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      style={{
        ...baseStyle,
        borderColor: focused ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.18)',
        boxShadow: focused ? '0 0 0 3px rgba(255,255,255,0.08)' : 'none',
        background: focused ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}
