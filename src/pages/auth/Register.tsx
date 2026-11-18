import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Mail, Phone, Ticket, TriangleAlert, User } from 'lucide-react'
import { AuthLayout, SocialButtons } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/store/auth'
import { toast } from '@/store/ui'

export default function Register() {
  const navigate = useNavigate()
  const { signUp, signInWithProvider, status, error, clearError } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    referral: '',
  })

  const update = (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    clearError()
    setForm((f) => ({ ...f, [key]: event.target.value }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (form.password.length < 6) {
      toast({ title: 'Contraseña muy corta', description: 'Usa al menos 6 caracteres.', tone: 'error' })
      return
    }
    const ok = await signUp({
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
    })
    if (ok) {
      toast({
        title: '¡Cuenta creada!',
        description: 'Usa WELCOME y ahorra $8.000 en tu primer pedido.',
        emoji: '🎉',
        tone: 'reward',
      })
      navigate('/menu', { replace: true })
    }
  }

  const oauth = async (provider: 'google' | 'apple') => {
    const ok = await signInWithProvider(provider)
    if (ok) navigate('/menu', { replace: true })
  }

  return (
    <AuthLayout
      title="Únete al parche"
      subtitle="Crea tu cuenta y empieza a ganar Street Points desde el primer pedido."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-bold text-red hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <Input
          label="Nombre"
          required
          placeholder="¿Cómo te dicen?"
          icon={<User className="size-4" />}
          value={form.name}
          onChange={update('name')}
        />
        <Input
          label="Correo"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@correo.com"
          icon={<Mail className="size-4" />}
          value={form.email}
          onChange={update('email')}
        />
        <Input
          label="Celular (opcional)"
          type="tel"
          placeholder="300 000 0000"
          icon={<Phone className="size-4" />}
          value={form.phone}
          onChange={update('phone')}
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Mínimo 6 caracteres"
          icon={<Lock className="size-4" />}
          value={form.password}
          onChange={update('password')}
        />
        <Input
          label="Código de referido (opcional)"
          placeholder="PARCHE123"
          icon={<Ticket className="size-4" />}
          value={form.referral}
          onChange={update('referral')}
          hint="Si un amigo te invitó, ganas puntos extra."
        />

        {error && (
          <p className="flex items-center gap-2 rounded-2xl border border-flame/30 bg-flame/[0.08] px-3.5 py-2.5 text-xs font-semibold text-flame">
            <TriangleAlert className="size-3.5 shrink-0" /> {error}
          </p>
        )}

        <Button type="submit" fullWidth size="lg" loading={status === 'loading'}>
          Crear cuenta
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

      <p className="mt-5 text-center text-[11px] leading-relaxed text-concrete">
        Al crear tu cuenta aceptas los términos y la política de tratamiento de datos de EL PARCHE.
      </p>
    </AuthLayout>
  )
}
