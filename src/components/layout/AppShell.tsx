import { useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { WifiOff } from 'lucide-react'
import { AnnouncementBar } from './AnnouncementBar'
import { BottomNav } from './BottomNav'
import { NotificationsSheet } from './NotificationsSheet'
import { TopBar } from './TopBar'
import { AddressSheet } from '@/components/location/AddressSheet'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { FloatingCartBar } from '@/components/cart/FloatingCartBar'
import { MascotCompanion } from '@/components/mascot/BurgerMascot'
import { useMascotReactions } from '@/hooks/useMascotReactions'
import { useNativeNotifications } from '@/hooks/useNativeNotifications'
import { Logo } from '@/components/brand/Logo'
import { StoreStatusPill } from '@/components/store/StoreHours'
import { Toaster } from '@/components/ui/Toaster'
import { useDb } from '@/store/db'
import { useUi } from '@/store/ui'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

function OfflineBanner() {
  const online = useUi((s) => s.online)
  const setOnline = useUi((s) => s.setOnline)
  const toast = useUi((s) => s.toast)

  useEffect(() => {
    const goOnline = () => {
      setOnline(true)
      toast({ title: '¡Volviste al parche!', description: 'Conexión restaurada.', emoji: '📶', tone: 'success' })
    }
    const goOffline = () => {
      setOnline(false)
      toast({
        title: 'Parece que te quedaste sin conexión',
        description: 'Guardamos tu carrito. Sigue armando tu pedido.',
        emoji: '🔌',
        tone: 'error',
      })
    }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [setOnline, toast])

  if (online) return null

  return (
    <div className="flex items-center justify-center gap-2 bg-flame/15 px-4 py-2 text-xs font-bold text-flame">
      <WifiOff className="size-3.5" />
      Sin conexión · Guardamos tu carrito
    </div>
  )
}

function SiteFooter() {
  const settings = useDb((s) => s.settings)
  return (
    <footer className="mt-16 hidden border-t border-white/[0.07] bg-carbon/50 lg:block">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo size="lg" />
          <p className="max-w-xs text-sm text-ash">
            Hamburguesas urbanas 100% a domicilio. Calle, sabor y parche desde el primer mordisco.
          </p>
          <p className="font-display text-sm uppercase tracking-[0.14em] text-orange">
            EL PARCHE EMPIEZA AQUÍ.
          </p>
          <p className="font-display text-lg leading-none">
            <span className="tag-3d-sm tag-fill-fire">#ElParcheEstáServido</span>
          </p>
        </div>
        <FooterCol
          title="Explorar"
          links={[
            { to: '/menu', label: 'Menú completo' },
            { to: '/drops', label: 'Drops' },
            { to: '/rewards', label: 'Street Points' },
            { to: '/community', label: '#ELPARCHE' },
          ]}
        />
        <FooterCol
          title="Tu cuenta"
          links={[
            { to: '/profile', label: 'Perfil' },
            { to: '/orders', label: 'Mis pedidos' },
            { to: '/profile/favorites', label: 'Favoritos' },
            { to: '/profile/coupons', label: 'Cupones' },
          ]}
        />
        <div className="space-y-3">
          <h4 className="font-display text-sm uppercase tracking-wide text-bone">Contacto</h4>
          <p className="text-sm text-ash">WhatsApp {settings.whatsapp}</p>
          <p className="text-sm text-ash">Bogotá, Colombia</p>
          <StoreStatusPill />
          <p className="text-xs text-concrete">
            Pago seguro procesado por ePayco · PSE · Nequi · Daviplata
          </p>
        </div>
      </div>
      <div className="border-t border-white/[0.06] px-6 py-5">
        <p className="mx-auto max-w-7xl text-xs text-concrete">
          © {new Date().getFullYear()} EL PARCHE. Hecho con hambre en Colombia. 🇨🇴
        </p>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div className="space-y-3">
      <h4 className="font-display text-sm uppercase tracking-wide text-bone">{title}</h4>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className="text-sm text-ash transition hover:text-red">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  // La mascota reacciona a lo que pasa en la app (solo lectura, no toca nada).
  useMascotReactions()
  // Lleva las notificaciones in-app al sistema (solo lectura).
  useNativeNotifications()

  return (
    <div className="bg-mural relative min-h-dvh overflow-x-clip">
      {/* Capa urbana fija: solo concreto muy sutil, para no competir con el contenido */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 print:hidden">
        <div className="texture-concrete absolute inset-0 opacity-40" />
      </div>
      <ScrollToTop />
      <div className="contents print:hidden">
        <AnnouncementBar />
        <OfflineBanner />
        <TopBar />
      </div>
      <main className="mx-auto min-h-[60vh] max-w-7xl pb-36 lg:pb-8 print:pb-0">{children}</main>
      <div className="contents print:hidden">
        <SiteFooter />
        <BottomNav />
        <FloatingCartBar />
        <MascotCompanion />
        <CartDrawer />
        <AddressSheet />
        <NotificationsSheet />
        <Toaster />
      </div>
    </div>
  )
}
