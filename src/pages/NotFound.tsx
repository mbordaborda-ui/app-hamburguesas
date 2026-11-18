import { LinkButton } from '@/components/ui/Button'
import { Crown, Scribble, SpraySplat, Star4 } from '@/components/brand/StreetArt'

export default function NotFound() {
  return (
    <div className="relative mx-auto flex max-w-lg flex-col items-center overflow-hidden px-4 py-20 text-center sm:px-6">
      <div className="texture-brick pointer-events-none absolute inset-0 opacity-15" />
      <SpraySplat seed={33} className="pointer-events-none absolute -left-20 top-4 size-56 text-red/[0.07]" />
      <Crown className="relative size-10 text-orange/70" />

      <p className="relative mt-4 font-marker text-xl text-red">
        Uy, te perdiste en el barrio
      </p>
      <h1 className="relative mt-2 font-display text-6xl text-bone">404</h1>
      <Scribble className="relative mt-2 h-4 w-48 text-red/60" />

      <p className="relative mt-4 text-sm text-ash">
        La página que buscas no existe o se mudó de esquina. Pero el hambre no se espera.
      </p>

      <div className="relative mt-6 flex flex-wrap justify-center gap-2">
        <LinkButton to="/" size="lg" icon={<Star4 className="size-3.5" />}>
          Volver al inicio
        </LinkButton>
        <LinkButton to="/menu" variant="outline" size="lg">
          Ver el menú
        </LinkButton>
      </div>

      <p className="relative mt-8 font-marker text-sm text-red/60">
        Aquí sí hay parche, pero no esa página.
      </p>
    </div>
  )
}
