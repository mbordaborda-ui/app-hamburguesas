import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface SmartImageProps {
  src: string
  alt: string
  className?: string
  wrapperClassName?: string
  emoji?: string
  priority?: boolean
}

/**
 * Imagen con carga progresiva, reintento automático y fallback de marca.
 *
 * Dos detalles importantes:
 *  1. Reintenta con cache-busting: los CDN de fotos limitan ráfagas y fallan
 *     de forma transitoria.
 *  2. Comprueba `img.complete` al montar. Si la imagen ya estaba en caché, el
 *     evento `load` puede haber ocurrido antes de que React lo escuche y la
 *     imagen se quedaría invisible (opacity 0). Con esta comprobación siempre
 *     se muestra.
 */
export function SmartImage({
  src,
  alt,
  className,
  wrapperClassName,
  emoji = '🍔',
  priority,
}: SmartImageProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const currentSrc =
    attempt === 0 ? src : `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}`

  useEffect(() => {
    setLoaded(false)
    setFailed(false)
    setAttempt(0)
  }, [src])

  // Si la imagen ya estaba completa (caché), el evento load no vuelve a
  // dispararse: lo detectamos aquí.
  useEffect(() => {
    const image = imgRef.current
    if (image && image.complete && image.naturalWidth > 0) setLoaded(true)
  }, [currentSrc])

  return (
    <div className={cn('relative overflow-hidden bg-graphite', wrapperClassName)}>
      {!loaded && !failed && <div className="skeleton absolute inset-0" />}

      {failed ? (
        <div className="texture-grid absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-graphite via-carbon to-ink">
          <span className="text-4xl opacity-80">{emoji}</span>
          <span className="font-display text-[10px] tracking-widest text-ash/60">
            EL PARCHE
          </span>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (attempt < 2) {
              window.setTimeout(() => setAttempt((value) => value + 1), 700 * (attempt + 1))
            } else {
              setFailed(true)
            }
          }}
          className={cn(
            'size-full object-cover transition-all duration-500',
            loaded ? 'scale-100 opacity-100 blur-0' : 'scale-105 opacity-0 blur-md',
            className,
          )}
        />
      )}
    </div>
  )
}
