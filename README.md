# 🍔 EL PARCHE — Hamburguesas urbanas 100% a domicilio

PWA mobile-first (móvil → tablet → desktop) para una marca de hamburguesas urbanas
colombiana. No es un mockup: navegación, menú, personalización, carrito, checkout,
pagos (arquitectura ePayco), tracking, rewards, drops, cupones, comunidad y panel
administrativo funcionan de verdad.

### Abrir sin terminal (Windows)

Doble clic en **`ABRIR-APP.bat`** en la raíz del proyecto. Instala lo que falte,
arranca Vite y abre el navegador en `http://localhost:5180` solo.
Para apagarla: `Ctrl + C` en la ventana negra.

```bash
npm install
npm run dev        # http://localhost:5180
npm run build      # typecheck + build de producción
npm run preview    # sirve dist/ en http://localhost:4180
npm test           # pruebas de humo (flujo completo de compra)
npm run lint
npm run clean      # borra dist y cachés de Vite
```

> **Puerto propio (5180).** Está fijado en `vite.config.ts` (`DEV_PORT` / `PREVIEW_PORT`)
> para no chocar con otras apps que usan el 5173. Cámbialo ahí, en un solo lugar.

> ⚠️ **No uses Live Server (puerto 5500).** Live Server solo sirve archivos
> estáticos: no compila TypeScript/React, así que el navegador recibe `main.tsx`
> sin procesar y ves una pantalla blanca. Esta app **siempre** se levanta con
> Vite: `npm run dev`.

### Arrancar desde VS Code

- `Ctrl + Shift + B` → *EL PARCHE: arrancar app (Vite)* y abre el navegador solo.
- O `F5` → *EL PARCHE: depurar en Chrome*.

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Zustand (persistencia) ·
React Router 7 · Framer Motion · lucide-react · vite-plugin-pwa · Vitest + happy-dom.

## Identidad visual — sistema v2 (street food / urbano / graffiti)

Todo vive en `src/index.css` como tokens de Tailwind v4 (`@theme` + `@utility`).

### Paleta

| Rol | Token | Hex |
| --- | --- | --- |
| Base oscura | `ink` / `carbon` / `graphite` | `#0B0B0D` · `#111111` · `#191A1D` |
| Base clara | `bone` / `cream` | `#F4F0E8` |
| **Identidad** | `red` / `primary` | `#E4002B` |
| **Identidad** | `yellow` | `#FFD21F` |
| Energía | `orange` / `accent` | `#FF6A00` |
| Acento | `magenta` | `#FF2D7A` |
| Acento | `acid` | `#A8E600` |
| Acento | `violet` | `#7A3CFF` |
| No usado | `cyan` | `#35C9FF` (token conservado, fuera de la UI) |

**Jerarquía:** rojo = acción principal. Amarillo = base energética, stickers y
rating. Naranja = promos, drops y urgencia. **Degradado insignia: amarillo →
naranja → rojo** (`tag-fill-fire`), usado en el lettering principal.
Magenta / verde ácido / morado = solo acentos puntuales.

Los alias legados (`volt`, `flame`, `lime`, `grape`) siguen vivos y apuntan a la
paleta actual, así ningún componente antiguo se rompe.

### Tipografía (2 familias)

- **Anton** — títulos, botones y lettering urbano condensado.
- **Inter** — textos funcionales, precios, formularios y checkout.

### Lettering graffiti

`tag-3d`, `tag-3d-sm`, `tag-outline`, `tag-fill-fire|red|yellow|hot`, `tag-tilt`.
Usan `-webkit-text-stroke` (contorno negro grueso) + `paint-order: stroke fill`
+ `filter: drop-shadow` para el volumen 3D.

> ⚠️ El volumen se hace con `filter: drop-shadow`, **no** con `text-shadow`:
> el relleno es un degradado con `color: transparent` y un `text-shadow` se
> vería a través de las letras, lavando el color.

### Fondos urbanos

`bg-mural` (halos de color de marca sobre carbón), `texture-concrete`,
`texture-brick`, `texture-grid`, `texture-halftone`, `texture-hatch`,
`texture-spray`, `texture-paper`, `tape`, `sticker-print`, `torn-1|2|3`.

### Capa de barrio (`src/components/brand/`)

- `StreetArt.tsx` — SVG generados: `SpraySplat` (manchas con gotas,
  deterministas por semilla), `SprayDots`, `TagArrow`, `Scribble`, `Crown`,
  `Star4`, `Barcode`, `TapeStrip`, `SprayCan`, `Boombox`, `BurgerGlyph`,
  `ScooterGlyph`, `Sticker`, `BurstSticker`, `GraffitiTitle`, `StreetBand`.
- `BarrioLayer.tsx` — capa decorativa (`hero` / `section` / `subtle` / `poster`)
  **detrás** del contenido, con `pointer-events-none` y `aria-hidden`.
- `Logo.tsx` — wordmark con degradado azul, contorno y trazo de aerosol naranja.

### Regla 70 / 20 / 10

El equilibrio que hace que la app sirva para todo público:

| Peso | Qué es | Dónde |
| --- | --- | --- |
| **70%** | Interfaz limpia y profesional | superficies de carbón, tipografía Inter, jerarquía clara, fotos grandes |
| **20%** | Identidad urbana / graffiti | lettering Anton con `tag-3d`, un sello por tarjeta, una mancha por pantalla, cinta de frases |
| **10%** | Humor y mascota | La Burger del Parche, mensajes reactivos, partículas |

### Reglas del sistema

1. **La hamburguesa es la protagonista.** Foto grande, nombre claro, precio
   visible, botón evidente. El graffiti complementa, nunca compite.
2. **Un solo sticker por tarjeta de producto.** Antes había dos y tapaban la foto.
3. **Máximo un elemento decorativo por pantalla** (una mancha o un ladrillo),
   siempre por debajo del 10% de opacidad.
4. **El grafiti vive en los títulos**, no en el cuerpo. El lettering se conserva
   en logo, titulares, frases de marca, stickers y promos.
5. **El checkout no lleva decoración.** Cero texturas, cero stickers: solo
   claridad y confianza.
6. **Sin animaciones constantes.** Nada de latidos ni bucles infinitos; solo
   microinteracciones de 150–400 ms al interactuar.
7. **2 familias tipográficas** (Anton + Inter) y contraste alto en textos
   secundarios (`ash` y `concrete` aclarados para leerse bien).
8. Todo el arte decorativo es `aria-hidden` + `pointer-events-none` y respeta
   `prefers-reduced-motion`.

## Arquitectura

```
src/
  types/         Modelo de datos completo (users, orders, payments, drops, ...)
  data/          Datos semilla del catálogo y marketing (capa de datos, no UI)
  lib/           Dominio puro: pricing, loyalty, upsell, formatos, utilidades
  hooks/         useCartPricing, useLoyalty, useFavorites, useMediaQuery
  store/         Estado global: db (persistido), auth, cart, ui
  services/      http.ts · api.ts · payments.ts   ← frontera con el backend
  components/    ui/, layout/, cart/, product/, admin/, auth/, brand/
  pages/         Home, Menu, ProductDetail, Cart, Checkout, Tracking, Orders,
                 Rewards, Drops, Community, Profile (+subpáginas), auth/, admin/
```

### Frontera con el backend

Ningún componente conoce la fuente de datos. Todo pasa por `src/services/api.ts`:

- **Modo local** (por defecto): repositorio persistido en `localStorage`
  (`src/store/db.ts`). Permite que la PWA funcione offline y que el carrito
  sobreviva a la pérdida de conexión.
- **Modo remoto**: basta definir `VITE_API_URL` para que `api.ts` use
  `src/services/http.ts` contra el backend real. No se toca ni un componente.

```
VITE_API_URL=https://api.elparche.co     # activa el modo remoto
```

### Pagos (ePayco-ready)

`src/services/payments.ts` define la interfaz `PaymentGateway` con dos
implementaciones intercambiables:

- `LocalGateway` — simulador determinista para desarrollo/demo.
- `EpaycoGateway` — habla con el backend (`/payments/epayco/*`).

**Las llaves privadas de ePayco (`P_KEY`, `P_CUST_ID_CLIENTE`, firma) nunca
viajan al frontend.** El navegador solo recibe llave pública y URL de checkout;
los webhooks se validan por firma en el servidor. Cada pago lleva
`idempotencyKey` para evitar cobros y pedidos duplicados.

Estados soportados: `pending · processing · approved · rejected · cancelled ·
refunded`. Los métodos (tarjeta, PSE, Nequi, Daviplata, efectivo, Bancolombia,
Efecty) se activan/desactivan desde el panel admin o desde Perfil → Métodos de pago.

### Backend de pagos y pedidos (`server/`)

Backend **sin dependencias**: `node:http` + `node:sqlite` (Node 22.5+). No hay
que instalar nada; solo correrlo.

```bash
npm run server        # http://localhost:8787
npm run server:dev    # con --watch
```

Copia `server/.env.example` a `server/.env` para configurar puerto, URLs y el
modo de ePayco. Luego, en el frontend, copia `.env.example` a `.env.local`:

```
VITE_PAYMENTS_API_URL=http://localhost:8787
```

Con esa variable, **solo los pagos/pedidos** pasan por el backend; el resto de
datos sigue en modo local (la app no se rompe si el backend no está arriba,
salvo al pagar).

**Flujo ePayco (real y simulado son el mismo):**

```
Checkout → POST /payments/epayco/session   (idempotente)
         → redirige al checkout de ePayco
         → ePayco → POST /payments/epayco/webhook  (firma validada en el server)
         → vuelve a /checkout/response?ref=...
         → GET /payments/epayco/status/:ref  → sincroniza el pedido local
```

- `EPAYCO_MODE=test` (por defecto): firma y respuestas simuladas con llaves de
  prueba. El checkout simulado vive en `/pay/epayco/checkout` y dispara el
  webhook firmado de verdad (md5), así se prueba el flujo completo sin cobrar.
- `EPAYCO_MODE=live`: usa `P_CUST_ID_CLIENTE`, `P_KEY` y `PUBLIC_KEY` del
  entorno. **Esas llaves nunca llegan al navegador.**

**Endpoints:** `GET /health`, `GET|POST /orders`, `GET|PATCH /orders/:id`,
`GET /payments`, `POST /payments/epayco/session`, `GET /payments/epayco/status/:ref`,
`POST /payments/epayco/webhook`, `POST /payments/epayco/refund`,
`GET /pay/epayco/checkout`, `POST /pay/epayco/confirm`.

**Archivos**

```
server/index.mjs     servidor + router
server/db.mjs        SQLite (orders, payments, webhook_events)
server/epayco.mjs    firma md5, confirmación y checkout simulado
server/util.mjs      helpers HTTP (JSON, CORS, body)
```

> Para desplegar en producción, el backend va en un host con Node (Railway,
> Render, Fly.io, un VPS…). Netlify solo sirve el frontend estático; apunta
> `VITE_PAYMENTS_API_URL` al backend desplegado.

### Entidades del modelo

`users · addresses · products · categories · orders · order_items · payments ·
delivery · coupons · loyalty_points · loyalty_levels · missions · rewards ·
referrals · reviews · favorites · notifications · drops · settings`

## Funcionalidad incluida

- **Home**: hero, CTAs, más vendidos, nuevos, combos con ahorro, drops con
  contador, promos, comunidad, manifiesto de marca.
- **Menú**: categorías, búsqueda, ordenamientos, skeletons, menú secreto por nivel.
- **Personalización**: carne, queso, toppings, salsas y extras con precio en
  tiempo real, notas y cantidad.
- **Carrito y upsell**: cantidades, cupones, puntos, domicilio gratis, máximo 2
  recomendaciones contextuales, *pedir de nuevo*.
- **Checkout** en 4 pasos con direcciones guardadas, propina, canje de puntos y
  confirmación.
- **Tracking** con línea de tiempo, ETA, repartidor, mapa y avance en vivo.
- **Rewards**: Street Points, 4 niveles, misiones, insignias, referidos y canje.
- **Drops** con inventario, countdown y SOLD OUT.
- **Comunidad #ELPARCHE**: reseñas con foto, valoraciones por categoría y likes.
- **Perfil**: favoritos, direcciones, métodos de pago, cupones, historial.
- **Admin** (`/admin`): pedidos (tablero), productos, clientes, promociones,
  rewards, drops, pagos y estadísticas.
- **PWA**: manifest, iconos, service worker, caché de imágenes y aviso offline.

## Acceso demo

| Rol | Credenciales |
| --- | --- |
| Cliente | Cualquier registro nuevo (`/register`) |
| Admin | `admin@elparche.co` / `parche123` |
| Cocina | `cocina@elparche.co` / `parche123` |
| Domiciliario | `domiciliario@elparche.co` / `parche123` |

## Fotografías (locales, sin CDN)

Todas las fotos viven en **`public/img/`** (2,85 MB, 28 archivos). La app **no
depende de ningún CDN externo**: las imágenes se sirven desde el mismo origen, se
cachean con el service worker y funcionan sin conexión.

Antes apuntaban a `images.unsplash.com`, que **limita ráfagas de peticiones** y
devolvía error de forma intermitente: por eso la foto del hero desaparecía al
refrescar o después de un rato.

```bash
node scripts/fetch-images.mjs   # vuelve a descargarlas (idempotente)
```

El script recorre `src/data/*.ts`, saca todos los IDs usados y los baja a
`public/img/<id>.jpg`. Si agregas un producto con una foto nueva, corre el
script y listo.

## 🛵 Módulo Domiciliario

Ruta **`/domiciliario`**. Entran los usuarios con rol `courier` (y el admin).
Diseñado para usarse con una mano desde el celular.

**Qué muestra**

- Cabecera con el domiciliario, su vehículo, rating y sus números del día
  (en curso · entregados · recaudado).
- **EN CURSO** → sus entregas activas. Cada tarjeta muestra, en este orden:
  1. **Dirección** (lo más grande y legible de la tarjeta)
  2. Barrio, ciudad y detalles (torre, portería…)
  3. Productos, tiempo y **aviso de cobro** si el pago es en efectivo
  4. Notas del cliente
  5. Acciones: **Llamar** · **Seguimiento** · **Iniciar viaje** / **Marcar entregado**
- **DISPONIBLES** → pedidos listos sin asignar. El domiciliario puede
  **tomarlos** él mismo.
- **ENTREGADOS** → historial con lo recaudado.

**Flujo de estados**

```
LISTO  --[Iniciar viaje]-->  EN CAMINO  --[Marcar entregado]-->  ENTREGADO
```

Cada acción actualiza el pedido real y dispara una notificación al cliente
(que ve el cambio en `/tracking/:id`).

**Asignar un domiciliario (desde el admin)**

En `/admin/orders`, cada tarjeta tiene un selector **“Sin domiciliario”**.
Al elegir uno se guarda `order.courierId` + la copia `order.courier`, y el
cliente empieza a ver el nombre y teléfono reales en el seguimiento.

**Roles**

`customer` → `courier` → `kitchen` → `admin`. Se cambian desde
`/admin/customers` con el botón de rol (cicla entre los cuatro).

**Archivos**

```
src/data/drivers.ts                    domiciliarios de ejemplo
src/pages/domiciliario/DeliveryBoard.tsx  el módulo
src/store/db.ts                        drivers[] + assignCourier()
```

**Cuenta demo:** `domiciliario@elparche.co` / `parche123`

> GPS en tiempo real: pendiente. El módulo ya está preparado para agregarlo
> (la tarjeta tiene el enlace a `/tracking/:id` y el estado en vivo).

## 👨‍🍳 Módulo Cocina

Ruta **`/cocina`**. Entran los usuarios con rol `kitchen` (y el admin). Es la
pantalla de preparación (KDS): cada pedido se ve **exactamente como lo pidió el
cliente** para no meter ingredientes que no van.

**Qué muestra**

- Cabecera con el cocinero y los contadores del día (por preparar · en
  preparación · listos).
- Pestañas **Por preparar · En preparación · Listos** (con contador). Al avanzar
  un pedido, el ticket **sigue solo** a la pestaña siguiente.
- Cada ticket muestra:
  1. Código, tiempo transcurrido, ETA y total de ítems.
  2. Dirección de entrega.
  3. **Para preparar** → cada ítem con su cantidad, la **receta completa**
     (todos los ingredientes del producto, ej. *Pan brioche, Carne smash 120g,
     Cheddar, Tocineta, Salsa de la casa, Lechuga, Tomate*), lo que **incluye**
     si es combo, la **personalización** del cliente (una línea por selección) y
     las **notas del ítem**. Cada ítem tiene su botón **Marcar preparado** (uno
     por uno) y el contador `X/Y preparados`.
  4. **Adicionales · van en la bolsa** → las bebidas y acompañamientos (categorías
     `cat_drinks` / `cat_sides`) como **checklist** para confirmar que se empacan.
     Se guarda en `order.packedItems`.
  5. **Observaciones del cliente** al final del ticket (notas del pedido).

**Flujo**

```
CONFIRMADO --[Empezar a preparar]--> EN PREPARACIÓN
EN PREPARACIÓN --[Marcar preparado, ítem por ítem]--> (X/Y)
EN PREPARACIÓN --[Confirmar toda la orden]--> LISTO   (se habilita al tener todo preparado)
LISTO --[Confirmar listo]--> CONFIRMADO (empacado, esperando domiciliario)
```

El botón **Confirmar toda la orden** solo se habilita cuando **todos los ítems
están preparados**; **Confirmar listo** cuando **todos los adicionales están
empacados**. Cada acción actualiza el pedido y notifica al cliente (lo ve en
`/tracking/:id`). Los pedidos **listos** aparecen también en el módulo del
domiciliario.

**Archivos**

```
src/pages/cocina/KitchenBoard.tsx   el módulo (ticket + adicionales)
src/store/db.ts                     togglePackedItem()
```

**Cuenta demo:** `cocina@elparche.co` / `parche123`

## Estructura del Menú

El menú comparte el lenguaje visual de **Drops** (cabecera póster + tarjeta
destacada), pero organizado para escanear rápido:

1. **Cabecera póster** — eyebrow naranja, título grande en Anton, rayón y
   contador de productos. Es el momento de marca.
2. **Barra funcional fija** (`sticky`) — buscador, categorías y orden. Se queda
   pegada arriba mientras haces scroll, así nunca pierdes el filtro.
3. **Destacado estilo Drop** — el más vendido en formato póster horizontal
   (foto | nombre graffiti | descripción | precio | CTA). Se saca de la
   cuadrícula para no repetirlo.
4. **Cuadrícula** — el resto de productos en 2 columnas (móvil) a 4 (desktop),
   con foto grande, precio visible y botón `+ AGREGAR`.

La personalidad se concentra arriba; conforme bajas, la interfaz se vuelve
puramente funcional.

## 🍔 La Burger del Parche (mascota)

Mascota interactiva de la marca. Misma esencia, 6 actitudes (**En Llamas** es la
predeterminada, la primera que aparece, por ser la que mejor combina con la
paleta de la app):

| # | Actitud | Frase |
| --- | --- | --- |
| 1 | En Llamas | ESTO ESTÁ CALIENTE. |
| 2 | Tranqui | ¿QUÉ MÁS, PARCE? |
| 3 | Bandida | HOY SE PECÓ. |
| 4 | Pesada | ¿SEGURO QUE PUEDES? |
| 5 | Delivery | VOY PA' TU CASA. |
| 6 | Hambrienta | NO COMPARTO. |

### Dónde aparece

- **Home** → `MascotStage`: bloque grande con la mascota, su nombre, bocadillo,
  descripción y selector de actitud.
- **Resto de la app** → `MascotCompanion`: tarjeta flotante que **solo aparece
  cuando hay algo que decir** (reacciona a lo que hace el usuario) y se va sola
  a los 7 segundos. En Home no se muestra para no duplicar.

### Frases

Cada actitud tiene **entre 7 y 11 frases propias** (más de 50 en total). Se elige
una al azar y **nunca se repite la anterior**, así la mascota no dice siempre lo
mismo. Al cambiar de actitud vuelve a su propio repertorio.

### Interacción

Tocar la burger → siguiente actitud, cambia el dibujo completo (pose, ropa,
expresión, accesorios), suelta una frase nueva, hace un rebote (squash & stretch)
y lanza partículas de aerosol. Tras la sexta vuelve a la primera. También hay
**chips con el emoji** de cada actitud para saltar a una concreta y un botón
**Sorpréndeme** que elige una al azar.

Animación en capas (cada una en su propio elemento para que no se pisen):
**flotación continua** (`mascot-idle`) + **shake** cuando reacciona +
**pop** al cambiar de actitud + **rebote** al tocar + **onda** que se expande +
**emojis flotando** alrededor (propios de cada actitud) + partículas. Todo
respeta `prefers-reduced-motion` (los bucles se apagan).

### Mensajes reactivos (solo lectura)

| Cuándo | Mensaje |
| --- | --- |
| Agrega una burger | 🔥 ¡SE FUE PA' TU PARCHE! |
| Agrega varias | YA ESTO ES PERSONAL. 💀 |
| Elimina una | ¿SE ARREPINTIÓ O QUÉ? 😭 |
| Carrito vacío | PARCE... AQUÍ NO HAY NADA. |
| Mucho tiempo sin hacer nada | PARCE... ¿VAS A PEDIR O QUÉ? |
| Pedido confirmado | 🔥 PARCHE CONFIRMADO. |
| Pedido preparando | 🍔 LA COCINA ESTÁ EN MARCHA. |
| Pedido en camino | 🛵 EL PARCHE VA PA' TU CASA. |
| Pedido entregado | 🍔 PARCHE COMPLETADO. |

Cada mensaje tiene 3 variantes y **nunca repite el inmediatamente anterior**
(`pickMascotMessage`). La actitud elegida se recuerda entre sesiones.

`useMascotReactions` es **100% de solo lectura**: observa el carrito y los
pedidos, nunca los modifica. No toca carrito, checkout, pagos ni pedidos.

### Cómo está dibujada

La mascota es **SVG propio y paramétrico** (`MascotGlyph`): no depende de
imágenes externas, escala perfecto y pesa casi nada. Cada actitud se define con
4 ejes en `src/data/mascot.ts`:

| Eje | Valores | Ejemplo |
| --- | --- | --- |
| `pose` | `thumbsUp` · `kiss` · `fists` · `raised` · `pointing` · `munching` | la Bandida sopla un beso con una mano en la cadera |
| `outfit` | `jeans` · `ripped` · `cargo` · `flame` · `uniform` · `messy` | la Pesada va de cargo militar, la Delivery de uniforme reflectivo |
| `patties` | `1` · `2` · `3` | la Pesada es triple carne de verdad |
| `eyes` | `chill` · `flirty` · `serious` · `fire` · `focused` · `crazy` | En Llamas tiene ojos de fuego; la Bandida guiña un ojo |
| `extras` | `chain` `earrings` `rings` `hearts` `sparkles` `blush` `lashes` `sweat` `smoke` `heatLines` `box` `headset` `drool` `bite` `ketchup` | la Hambrienta tiene mordida, baba y mancha de ketchup |

**Ropa por actitud:** Tranqui va de jean clásico, Bandida de jean roto con cadena,
Pesada de cargo militar, En Llamas de shorts con llamas en el ruedo, Delivery de
uniforme con franjas reflectivas y Hambrienta de short con manchas de comida.
Todas llevan cinturón con hebilla y tenis a juego.

Para cambiar una actitud solo se edita su entrada en `mascotPersonalities`.
Añadir un extra nuevo = una rama más en el componente `Extras`.

**Imágenes opcionales:** si algún día quieres usar arte propio, suelta PNGs en
`public/mascota/` con los nombres del `LEEME.txt` y la app los usará
automáticamente. Si falta el archivo, dibuja el SVG.

### Archivos

```
src/data/mascot.ts                    personalidades + mensajes
src/store/mascot.ts                   estado (actitud, mensaje, partículas)
src/components/mascot/MascotGlyph.tsx personaje SVG paramétrico
src/components/mascot/BurgerMascot.tsx MascotStage + MascotCompanion
src/hooks/useMascotReactions.ts       reacciones de solo lectura
```

## 🔔 Notificaciones

Las notificaciones in-app (`useDb.notifications`) también se muestran como
notificación del sistema. El puente es `useNativeNotifications` (montado en
`AppShell`): observa el store y, si el usuario dio permiso, llama a
`showLocalNotification`. Es de solo lectura, nunca toca carrito ni pedidos.

- **Sin backend** (modo local): la notificación aparece mientras la pestaña esté
  viva (primer plano o segundo plano). Sirve para "tu pedido va en camino",
  cambios de estado, puntos y reseñas.
- **Con backend** (push real): `public/sw-push.js` ya escucha el evento `push`,
  así que el aviso llega **con la app cerrada**. Para activarlo:
  1. Genera llaves VAPID en el backend.
  2. Define `VITE_VAPID_PUBLIC_KEY=<llave pública>`.
  3. El backend guarda la suscripción (llega a `/notifications/subscribe`) y
     envía los mensajes de Web Push.

El usuario activa las notificaciones desde **Perfil → Notificaciones del pedido**
o desde el banner de `/tracking/:id`. Al aceptar, `subscribeToPush()` registra la
suscripción (no-op si falta la llave VAPID).

**Archivos**

```
src/lib/push.ts                      permisos, notificación local y suscripción
src/hooks/useNativeNotifications.ts  puente store → notificación del sistema
src/hooks/usePushNotifications.ts    estado del permiso + activar
public/sw-push.js                    listeners notificationclick y push
```

## 🕒 Horario de atención

El local tiene horario por día y turnos (permite varios por día y turnos que
cruzan medianoche, ej. `18:00 – 02:00`). El dominio es puro y vive en
`src/lib/hours.ts` (`storeStatus`); `useStoreStatus` lo recalcula cada 30 s para
que la UI cambie en el momento exacto del cierre.

- **`settings.isOpen`** es el interruptor maestro: apagado, la app está cerrada
  sin importar el horario.
- **Bloqueo real:** el botón `Pedir ahora` del carrito y `Confirmar pedido` del
  checkout se deshabilitan cuando está cerrado, con el mensaje de próxima
  apertura/cierre. `api.orders.create` vuelve a validar (defensa en profundidad).
- **Dónde se ve:** píldora de estado en el hero de Home y el footer, y la tarjeta
  `StoreHoursCard` con la semana y el día de hoy resaltado.
- **Admin:** `/admin/settings` (nav **Horario**) edita el interruptor maestro, los
  turnos por día y el preset **Abrir 24 h**.

**Archivos**

```
src/lib/hours.ts                       storeStatus + formato (puro)
src/hooks/useStoreStatus.ts            estado reactivo (cada 30 s)
src/components/store/StoreHours.tsx    StoreStatusPill + StoreHoursCard
src/pages/admin/Settings.tsx           panel de horarios
```

## 🧠 Perfil del cliente

La app recuerda lo que cada cliente pide siempre y lo repite con un toque:

- **`src/lib/habits.ts`** (puro): `usualOrder` agrupa el historial por firma de
  productos y devuelve el combo más repetido; `topProduct` saca el producto
  estrella; `orderToLines` convierte un pedido en líneas de carrito.
- **`useOrderHabits`** lee el store y expone `usual`, `topProduct` y el nombre.
- **`UsualOrderCard`** muestra *"Miguel, ¿otra vez LA CALLEJERA? 👀"*, el combo
  con sus productos y el botón **Pedir de nuevo** (carga el carrito y va a
  `/cart`). Aparece en **Home** y en **Perfil**, y solo si hay historial.

## 🧾 Facturas

Cada pedido emite su factura con consecutivo `EP-F-000000`, se puede ver,
descargar/imprimir en PDF y enviar al correo del cliente.

- **`src/lib/invoice.ts`** (puro): `buildInvoice` arma la factura desde el pedido
  y `invoiceHtml` la renderiza como documento autocontenido (para imprimir o
  descargar). IVA incluido opcional vía `settings.taxRate`.
- **`/invoice/:orderId`** — página de la factura: **Imprimir / PDF** (usa el
  diálogo del navegador, sin dependencias), **Descargar** (HTML) y **Enviar a mi
  correo**. Al imprimir se ocultan el chrome de la app (`print:hidden` en
  `AppShell`) y queda solo el documento.
- **`/admin/invoices`** (nav **Facturas**) — KPIs, filtro por estado y acciones:
  ver, descargar, enviar, marcar pagada y anular.
- **`api.invoices`** — `list · byOrder · send · setStatus`. En **modo remoto**
  llama al backend (`/invoices/:id/send`), que hace el envío real por correo; en
  **modo local** lo simula y marca la factura como enviada. Se accede desde
  **Mis pedidos** y **Tracking**.

**Archivos**

```
src/lib/habits.ts                      combo habitual y producto estrella (puro)
src/lib/invoice.ts                     buildInvoice + HTML imprimible (puro)
src/lib/download.ts                    descarga de archivos en el navegador
src/components/profile/UsualOrderCard.tsx  "tu combo habitual"
src/pages/Invoice.tsx                  ver / imprimir / descargar / enviar
src/pages/admin/InvoicesAdmin.tsx      panel de facturas
```

## 🔥 Construye tu burger

Ruta **`/construye`**. Armador visual paso a paso (Pan → Carne → Queso → Salsa →
Toppings) donde la hamburguesa **se arma capa por capa con animación** mientras
el cliente elige, y el total se actualiza en vivo.

- **`src/data/builder.ts`** (datos): pasos, opciones, precios y
  `defaultBuilderSelection` / `builderSelectionTotal`. La selección por defecto
  (Brioche + 150 g + Cheddar + House Sauce + Bacon/Cebolla/Pepinillos) suma
  **$32.900**.
- **`BurgerStack`** — hamburguesa que **refleja la selección real** y combina
  animado + realista + interactivo:
  - *Realista*: gradientes radiales, brillos especulares, sombras de contacto,
    texturas (marcas de parrilla, ajonjolí/sal con sombra) y plato con foco
    cálido. El **queso** y las **salsas** son SVG con borde derretido irregular,
    goteos de distinta longitud que caen sobre la capa de abajo y brillo húmedo;
    la salsa picante y la garlic llevan motas.
  - *Animado*: cada capa entra/sale con resorte y el pan sube al agregar; vaho
    que sube una sola vez por cambio (sin bucles). Al **Agregar al pedido** la
    burger se **reensambla capa por capa** (con chispas) y luego se abre el carrito.
  - *Interactivo*: se **inclina en 3D** siguiendo el mouse; al pasar por una capa
    se **resalta y muestra su nombre y precio**; **tocar un topping lo quita** y
    tocar otra capa **salta a su paso**.
  - La carne doble dibuja dos carnes (con su queso), el queso cambia de color,
    el pan cambia (brioche/pretzel/integral) y cada topping tiene su forma.
- **`/construye`** — preview en vivo, control de cantidad, notas, resumen en
  stickers y **Agregar al pedido** (crea una línea de carrito con todas las
  selecciones, que se ven en carrito, checkout y factura).
- Accesos desde el **hero de Home** y la **cabecera del Menú**.

**Archivos**

```
src/data/builder.ts                     pasos, opciones y total (datos)
src/components/builder/BurgerStack.tsx  hamburguesa apilada y animada
src/pages/Builder.tsx                   la página del armador
```

## Pendiente de conectar (arquitectura ya preparada)

Base de datos real para el resto de la app, push real (VAPID + envío desde el
servidor), envío real de facturas por correo (SMTP/servicio), tracking GPS con
mapas y almacenamiento de imágenes. El backend de pagos (`server/`) ya está
funcionando; falta ponerle llaves de ePayco de producción.


## Solución de problemas

### Pantalla blanca

La app incluye un `ErrorBoundary` que, si algo falla en runtime, muestra el
error real con botones **Recargar** y **Limpiar caché** en lugar de dejar la
pantalla vacía. Si aun así ves blanco:

1. Abre las DevTools (`F12`) → pestaña **Console** y mira el primer error.
2. Usa la URL exacta que imprime Vite al arrancar (normalmente
   `http://localhost:5173`). Si el puerto está ocupado, Vite usa otro.
3. Un **service worker viejo** es la causa más común: quedó registrado de un
   `npm run preview` o de un deploy anterior y sirve un `index.html` que
   apunta a archivos que ya no existen.
   - DevTools → **Application** → *Service Workers* → **Unregister**
   - Application → *Storage* → **Clear site data**
   - O desde la consola: `await navigator.serviceWorker.getRegistrations()`
4. Limpia cachés de Vite y vuelve a arrancar:

   ```bash
   npm run clean && npm run dev
   ```

5. No abras `dist/index.html` con doble clic (`file://`): los módulos ES y las
   rutas absolutas no funcionan así. Usa `npm run preview`.

### El carrito o los puntos no se guardan

El navegador está bloqueando `localStorage` (modo privado, cookies bloqueadas
o política de empresa). La app funciona igual —cae a memoria— pero los datos
se pierden al cerrar la pestaña. El `ErrorBoundary` avisa cuando detecta esto.
