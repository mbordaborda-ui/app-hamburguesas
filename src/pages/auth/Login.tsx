import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail, TriangleAlert } from 'lucide-react'
import { AuthLayout, SocialButtons } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/store/auth'
import { toast } from '@/store/ui'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const { signIn, signInWithProvider, status, error, clearError } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const ok = await signIn(email, password)
    if (ok) {
      toast({ title: '¡Bienvenido al parche!', emoji: '🍔', tone: 'success' })
      navigate(from, { replace: true })
    }
  }

  const oauth = async (provider: 'google' | 'apple') => {
    const ok = await signInWithProvider(provider)
    if (ok) {
      toast({ title: `Sesión con ${provider}`, emoji: '✅', tone: 'success' })
      navigate(from, { replace: true })
    }
  }

  return (
    <AuthLayout
      title="Inicia sesión"
      subtitle="Vuelve al parche y sigue sumando Street Points."
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-bold text-red hover:underline">
            Regístrate
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <Input
          label="Correo"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@correo.com"
          icon={<Mail className="size-4" />}
          value={email}
          onChange={(e) => {
            clearError()
            setEmail(e.target.value)
          }}
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          icon={<Lock className="size-4" />}
          value={password}
          onChange={(e) => {
            clearError()
            setPassword(e.target.value)
          }}
        />

        {error && (
          <p className="flex items-center gap-2 rounded-2xl border border-flame/30 bg-flame/[0.08] px-3.5 py-2.5 text-xs font-semibold text-flame">
            <TriangleAlert className="size-3.5 shrink-0" /> {error}
          </p>
        )}

        <div className="flex justify-end">
          <Link to="/forgot" className="text-xs font-bold text-ash transition hover:text-red">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" fullWidth size="lg" loading={status === 'loading'}>
          Entrar
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-concrete">o</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <SocialButtons
        loading={status === 'loading'}
        onGoogle={() => oauth('google')}
        onApple={() => oauth('apple')}
      />

      <div className="mt-5 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-concrete">
          Acceso demo
        </p>
        <p className="mt-1 text-xs text-ash">
          Cliente: crea tu cuenta en segundos.
        </p>
        <p className="mt-1 text-xs text-ash">
          Admin: <span className="font-mono text-red">admin@elparche.co</span> /{' '}
          <span className="font-mono text-red">parche123</span>
        </p>
        <p className="mt-1 text-xs text-ash">
          Domiciliario: <span className="font-mono text-orange">domiciliario@elparche.co</span> /{' '}
          <span className="font-mono text-orange">parche123</span>
        </p>
      </div>
    </AuthLayout>
  )
}
