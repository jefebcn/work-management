import React, { useState } from 'react'
import { FlaskConical, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode]       = useState('login') // 'login' | 'register'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { setError('Inserisci email e password.'); return }
    setError(null); setSuccess(null); setLoading(true)

    if (mode === 'login') {
      const err = await signIn(email, password)
      if (err) setError(err)
    } else {
      const err = await signUp(email, password)
      if (err) setError(err)
      else setSuccess('Registrazione avvenuta. Controlla la tua email per confermare l\'account, poi accedi.')
    }
    setLoading(false)
  }

  function toggle() {
    setMode(m => m === 'login' ? 'register' : 'login')
    setError(null); setSuccess(null)
  }

  return (
    <div className="min-h-screen bg-galenic-base flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-galenic-accent/10 border border-galenic-accent/30 rounded-2xl flex items-center justify-center">
            <FlaskConical size={22} className="text-galenic-accent" strokeWidth={2} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-galenic-primary tracking-tight">Galenic-OS</h1>
            <p className="text-xs font-mono text-galenic-muted mt-0.5">Formulatore Galenico Professionale</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-galenic-surface border border-galenic-border rounded-2xl shadow-lg overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-galenic-border">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccess(null) }}
                className={[
                  'flex-1 py-3 text-sm font-medium font-mono transition-colors',
                  mode === m
                    ? 'text-galenic-accent border-b-2 border-galenic-accent -mb-px bg-galenic-surface'
                    : 'text-galenic-muted hover:text-galenic-primary bg-galenic-elevated/50',
                ].join(' ')}
              >
                {m === 'login' ? 'Accedi' : 'Registrati'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-mono text-galenic-muted mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="mario@farmacia.it"
                className="w-full bg-galenic-elevated border border-galenic-border rounded-xl text-galenic-primary font-mono text-sm px-3.5 py-2.5 outline-none focus:border-galenic-accent transition-colors placeholder:text-galenic-muted/50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-mono text-galenic-muted mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-galenic-elevated border border-galenic-border rounded-xl text-galenic-primary font-mono text-sm px-3.5 py-2.5 pr-10 outline-none focus:border-galenic-accent transition-colors placeholder:text-galenic-muted/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-galenic-muted hover:text-galenic-primary transition-colors"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {mode === 'register' && (
                <p className="text-xs font-mono text-galenic-muted/60 mt-1">
                  Minimo 6 caratteri.
                </p>
              )}
            </div>

            {/* Error / success */}
            {error && (
              <div className="bg-galenic-danger/8 border border-galenic-danger/20 rounded-xl px-3.5 py-2.5 text-xs font-mono text-galenic-danger">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-galenic-ok/8 border border-galenic-ok/20 rounded-xl px-3.5 py-2.5 text-xs font-mono text-galenic-ok leading-relaxed">
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-galenic-accent text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {mode === 'login' ? 'Accedi' : 'Crea account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs font-mono text-galenic-muted/50 mt-6">
          Galenic-OS · Dati protetti con Row-Level Security
        </p>
      </div>
    </div>
  )
}
