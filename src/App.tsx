import { Suspense, lazy, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { SprayCan } from '@/components/brand/StreetArt'
import { Spinner } from '@/components/ui/Feedback'
import { useAuth } from '@/store/auth'

const Home = lazy(() => import('@/pages/Home'))
const Menu = lazy(() => import('@/pages/Menu'))
const ProductDetail = lazy(() => import('@/pages/ProductDetail'))
const Builder = lazy(() => import('@/pages/Builder'))
const Cart = lazy(() => import('@/pages/Cart'))
const Checkout = lazy(() => import('@/pages/Checkout'))
const CheckoutResponse = lazy(() => import('@/pages/CheckoutResponse'))
const Tracking = lazy(() => import('@/pages/Tracking'))
const Orders = lazy(() => import('@/pages/Orders'))
const InvoicePage = lazy(() => import('@/pages/Invoice'))
const Rewards = lazy(() => import('@/pages/Rewards'))
const Drops = lazy(() => import('@/pages/Drops'))
const Community = lazy(() => import('@/pages/Community'))
const Profile = lazy(() => import('@/pages/Profile'))
const Favorites = lazy(() => import('@/pages/profile/Favorites'))
const Addresses = lazy(() => import('@/pages/profile/Addresses'))
const PaymentMethods = lazy(() => import('@/pages/profile/PaymentMethods'))
const Coupons = lazy(() => import('@/pages/profile/Coupons'))
const Missions = lazy(() => import('@/pages/profile/Missions'))
const Referrals = lazy(() => import('@/pages/profile/Referrals'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))
const Forgot = lazy(() => import('@/pages/auth/Forgot'))
const DeliveryBoard = lazy(() => import('@/pages/domiciliario/DeliveryBoard'))
const KitchenBoard = lazy(() => import('@/pages/cocina/KitchenBoard'))
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'))
const AdminProducts = lazy(() => import('@/pages/admin/Products'))
const AdminOrders = lazy(() => import('@/pages/admin/Orders'))
const AdminCustomers = lazy(() => import('@/pages/admin/Customers'))
const AdminPromos = lazy(() => import('@/pages/admin/Promos'))
const AdminRewards = lazy(() => import('@/pages/admin/RewardsAdmin'))
const AdminDrops = lazy(() => import('@/pages/admin/DropsAdmin'))
const AdminPayments = lazy(() => import('@/pages/admin/PaymentsAdmin'))
const AdminStats = lazy(() => import('@/pages/admin/Stats'))
const AdminSettings = lazy(() => import('@/pages/admin/Settings'))
const AdminInvoices = lazy(() => import('@/pages/admin/InvoicesAdmin'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function PageFallback() {
  return (
    <div className="relative grid min-h-[60vh] place-items-center overflow-hidden">
      <div className="texture-brick pointer-events-none absolute inset-0 opacity-25" />
      <div className="relative flex flex-col items-center gap-4">
        <span className="relative grid size-20 place-items-center">
          <span className="absolute inset-0 animate-spray-puff rounded-full bg-red/30" />
          <span className="animate-wiggle grid size-14 place-items-center rounded-2xl bg-graphite text-red">
            <SprayCan className="size-8" />
          </span>
        </span>
        <Spinner className="size-6" />
        <p className="font-display text-sm uppercase tracking-widest text-ash">
          Pintando el parche…
        </p>
      </div>
    </div>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAuth((s) => s.user)
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const user = useAuth((s) => s.user)
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

/** Módulo de domiciliario: entran los repartidores y también el admin. */
function RequireCourier({ children }: { children: ReactNode }) {
  const user = useAuth((s) => s.user)
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (user.role !== 'courier' && user.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

/** Módulo de cocina: entran los cocineros y también el admin. */
function RequireKitchen({ children }: { children: ReactNode }) {
  const user = useAuth((s) => s.user)
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (user.role !== 'kitchen' && user.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AppShell>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/menu/:categorySlug" element={<Menu />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/construye" element={<Builder />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/response" element={<CheckoutResponse />} />
          <Route path="/tracking/:orderId" element={<Tracking />} />
          <Route path="/invoice/:orderId" element={<InvoicePage />} />
          <Route path="/community" element={<Community />} />
          <Route path="/drops" element={<Drops />} />
          <Route path="/rewards" element={<Rewards />} />

          <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/favorites" element={<Favorites />} />
          <Route path="/profile/addresses" element={<RequireAuth><Addresses /></RequireAuth>} />
          <Route path="/profile/payments" element={<RequireAuth><PaymentMethods /></RequireAuth>} />
          <Route path="/profile/coupons" element={<Coupons />} />
          <Route path="/profile/missions" element={<RequireAuth><Missions /></RequireAuth>} />
          <Route path="/profile/referrals" element={<RequireAuth><Referrals /></RequireAuth>} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<Forgot />} />

          <Route
            path="/domiciliario"
            element={
              <RequireCourier>
                <DeliveryBoard />
              </RequireCourier>
            }
          />

          <Route
            path="/cocina"
            element={
              <RequireKitchen>
                <KitchenBoard />
              </RequireKitchen>
            }
          />

          <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="promos" element={<AdminPromos />} />
            <Route path="rewards" element={<AdminRewards />} />
            <Route path="drops" element={<AdminDrops />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="invoices" element={<AdminInvoices />} />
            <Route path="stats" element={<AdminStats />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppShell>
  )
}
