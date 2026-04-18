import React, { useState } from 'react'
import { FlaskConical, Eye, EyeOff, LogIn, UserPlus, Globe } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

export default function AuthPage() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth()

  const [tab,       setTab]       = useState('login')    // 'login' | 'register'
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [info,      setInfo]      = useState(null)        // success/info messages

  function resetMessages() { setError(null); setInfo(null) }

  async function handleSubmit(e) {
    e.preventDefault()
    resetMessages()
    setLoading(true)
    try {
      if (tab === 'login') {
        await signInWithEmail(email, password)
        // App will re-render automatically via AuthContext state change
      } else {
        await signUpWithEmail(email, password)
        setInfo('Registrazione effettuata. Controlla la tua email per confermare l\'account.')
        setEmail('')
        setPassword('')
      }
    } catch (err) {
      setError(translateError(err.message))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    resetMessages()
    setLoading(true)
    try {
      await signInWithGoogle()
      // Page will redirect to Google then back; onAuthStateChange handles the rest
    } catch (err) {
      setError(translateError(err.message))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-galenic-base flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-galenic-accent/10 border border-galenic-accent/30 rounded-2xl shadow-glow-sm mb-4">
            <FlaskConical size={26} className="text-galenic-accent" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold text-galenic-primary tracking-wide">Galenic-OS</h1>
          <p className="text-xs font-mono text-galenic-muted mt-1">
            Pharmaceutical Formulator Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-galenic-surface border border-galenic-border rounded-2xl overflow-hidden shadow-lg">

          {/* Tab selector */}
          <div className="flex border-b border-galenic-border">
            {[
              { key: 'login',    label: 'Accedi',     Icon: LogIn },
              { key: 'register', label: 'Registrati',  Icon: UserPlus },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => { setTab(key); resetMessages() }}
                className={[
                  'flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-medium font-mono transition-all',
                  tab === key
                    ? 'text-galenic-accent border-b-2 border-galenic-accent bg-galenic-accent/5'
                    : 'text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated/40',
                ].join(' ')}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          <div className="px-6 py-6 space-y-4">

            {/* Info / Error banners */}
            {error && (
              <div className="text-xs font-mono text-galenic-danger bg-galenic-danger/10 border border-galenic-danger/20 rounded-lg px-3 py-2.5 leading-snug">
                {error}
              </div>
            )}
            {info && (
              <div className="text-xs font-mono text-galenic-ok bg-galenic-ok/10 border border-galenic-ok/20 rounded-lg px-3 py-2.5 leading-snug">
                {info}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">

              {/* Email */}
              <div>
                <label className="block text-xs font-mono text-galenic-muted mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nome@esempio.com"
                  className="w-full bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2.5 text-sm font-mono text-galenic-primary placeholder:text-galenic-muted/40 outline-none focus:border-galenic-accent transition-colors"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-mono text-galenic-muted mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2.5 pr-10 text-sm font-mono text-galenic-primary placeholder:text-galenic-muted/40 outline-none focus:border-galenic-accent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-galenic-muted hover:text-galenic-primary transition-colors"
                    tabIndex={-1}
                  >
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {tab === 'register' && (
                  <div className="text-xs font-mono text-galenic-muted/50 mt-1">
                    Minimo 6 caratteri
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-galenic-accent text-galenic-surface hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-galenic-surface/30 border-t-galenic-surface rounded-full animate-spin" />
                ) : tab === 'login' ? (
                  <><LogIn size={14} /> Accedi</>
                ) : (
                  <><UserPlus size={14} /> Crea account</>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 text-xs font-mono text-galenic-muted/40">
              <div className="flex-1 h-px bg-galenic-border" />
              oppure
              <div className="flex-1 h-px bg-galenic-border" />
            </div>

            {/* Google OAuth */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border border-galenic-border text-galenic-primary hover:bg-galenic-elevated transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Globe size={15} className="text-galenic-accent" />
              Continua con Google
            </button>

          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs font-mono text-galenic-muted/30 mt-6">
          Galenic-OS · Dati privati protetti per utente
        </p>
      </div>
    </div>
  )
}

// Translate Supabase English error messages to Italian
function translateError(msg) {
  if (!msg) return 'Errore sconosciuto'
  if (msg.includes('Invalid login credentials'))     return 'Email o password errata'
  if (msg.includes('Email not confirmed'))           return 'Email non confermata. Controlla la tua casella di posta'
  if (msg.includes('User already registered'))       return 'Email già registrata. Usa "Accedi"'
  if (msg.includes('Password should be at least'))   return 'La password deve essere di almeno 6 caratteri'
  if (msg.includes('Unable to validate email'))      return 'Indirizzo email non valido'
  if (msg.includes('rate limit'))                    return 'Troppi tentativi. Riprova tra qualche minuto'
  if (msg.includes('network'))                       return 'Errore di rete. Verifica la connessione'
  return msg
}
