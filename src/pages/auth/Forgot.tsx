import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail, MailCheck } from 'lucide-react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/store/auth'

export default function Forgot() {
  const { recover, status } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const ok = await recover(email)
    if (ok) setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout
        title="Revisa tu correo"
        subtitle="Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu contraseña."
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <span className="grid size-16 place-items-center rounded-3xl bg-red/15 text-red">
            <MailCheck className="size-7" />
          </span>
          <p className="text-sm text-ash">
            Enviamos las instrucciones a <span className="font-bold text-bone">{email}</span>
          </p>
          <Link
            to="/login"
            className="text-sm font-bold text-red transition hover:underline"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace para crear una nueva."
      footer={
        <Link to="/login" className="font-bold text-red hover:underline">
          Volver a iniciar sesión
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <Input
          label="Correo"
          type="email"
          required
          placeholder="tu@correo.com"
          icon={<Mail className="size-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" fullWidth size="lg" loading={status === 'loading'}>
          Enviar enlace
        </Button>
      </form>
    </AuthLayout>
  )
}
