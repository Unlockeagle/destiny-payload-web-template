# SPEC 01 — Destiny Hero

> **Estado:** Aprobado
> **Depende de:** —
> **Fecha:** 2026-10-21
> **Objetivo:** Añadir un nuevo tipo de hero `destinyHero` para Pages que reproduzca el diseño de referencia (texto + CTA a la izquierda, avión `public/airplane.png` al centro, curva rosa animada y nube morada al fondo).

## Por qué existe esta spec

Los heros de la plantilla (High/Medium/Low Impact) son genéricos y no reflejan la identidad de Destiny Trip. El diseño de referencia ya tiene piezas parciales en el repo (`VectorComponent` con la curva y la animación `animation-draw`), hoy usadas solo por `PruebaBlock`. Esta spec las aprovecha dentro del sistema de heros existente en lugar de crear un block nuevo.

## Alcance

**Dentro:**

- Nueva opción `destinyHero` (label "Destiny Hero") en el select `hero.type` de `src/heros/config.ts`.
- Nuevo componente `src/heros/DestinyHero/index.tsx` mapeado en `src/heros/RenderHero.tsx`.
- Contenido editable reutilizando los campos existentes del hero: `richText` (título H1 + párrafo) y `links` (máx. 2: el primero es el botón rosa "Contacto" con ▶, el segundo un botón outline azul marino sin icono).
- Avión estático desde `/airplane.png` con `next/image`.
- Curva rosa reutilizando `VectorComponent`, con una nueva prop opcional `className`.
- Nube morada como SVG inline dibujado a mano (aproximación de la referencia) en `src/heros/DestinyHero/Cloud.tsx`.
- Animaciones: dibujo de la curva (existente) y entrada del avión (fade + slide hacia arriba).
- Respeto de `prefers-reduced-motion` para la curva y el avión.
- Altura `min-h-screen` en desktop (≥768px); en móvil la altura la marca el contenido.
- Layout responsive: dos zonas en desktop y apilado en móvil (<768px).

**Fuera de alcance (para futuras specs):**

- Badge de "Google Reviews" y avatares de clientes.
- Restilizar el Header global (logo, navegación, botón Contacto del header).
- Cambiar la fuente del sitio a Poppins o crear tokens de marca globales en `globals.css`.
- Nueva variante `brand` en `src/components/ui/button.tsx` o nueva opción `appearance` en los links.
- Subir el avión como Media editable desde el admin.

## Modelo de datos

No se crean colecciones ni campos nuevos. Solo se amplía el select existente `hero.type` en `src/heros/config.ts`:

```ts
options: [
  { label: 'None', value: 'none' },
  { label: 'High Impact', value: 'highImpact' },
  { label: 'Medium Impact', value: 'mediumImpact' },
  { label: 'Low Impact', value: 'lowImpact' },
  { label: 'Destiny Hero', value: 'destinyHero' }, // nuevo
]
```

Consecuencias:

- `Page['hero']['type']` en `src/payload-types.ts` incluye `'destinyHero'` tras `pnpm generate:types`.
- El campo `media` sigue condicionado a `highImpact` / `mediumImpact`, así que no es obligatorio para `destinyHero`.
- MongoDB no necesita migración: añadir una opción a un select no rompe documentos existentes.

Nueva firma de `VectorComponent` (retrocompatible):

```ts
type Props = { className?: string }
// Sin className → usa las posiciones actuales: 'absolute inset-[-1.45%_-2.06%_-1.46%_10.07%]'
```

Colores tomados de la referencia, aplicados como clases Tailwind arbitrarias solo dentro del hero:

- Texto (título y párrafo): azul marino `#1A1F71`.
- Botón "Contacto" (primer link): fondo `#B12672`, texto blanco, icono `Play` de `lucide-react` tras el label (orden en que `CMSLink` renderiza `label` y `children`).
- Segundo link (si existe): borde y texto `#1A1F71`, fondo transparente, sin icono.
- Nube: morado `#2A1A87`.
- Curva: gradiente existente de `VectorComponent` (`#C45390` → `#B12672` → `#6A247F`).

## Plan de implementación

1. **Opción en el schema.** Añadir `destinyHero` a `src/heros/config.ts` y ejecutar `pnpm generate:types`. Verificación: el admin muestra "Destiny Hero" en el select del hero de una Page; el sitio sigue funcionando sin cambios visuales (`RenderHero` devuelve `null` para el tipo no mapeado).
2. **Prop `className` en `VectorComponent`.** Modificar `src/components/Backgorund/Vector-component.tsx` para aceptar `className` opcional en el `div` contenedor. Si no llega, usa las clases actuales. Verificación: `PruebaBlock` se ve igual que antes.
3. **Esqueleto de `DestinyHero`.** Crear `src/heros/DestinyHero/index.tsx` (`'use client'`, firma `React.FC<Page['hero']>`) con `richText` y `links` en la columna izquierda. Llamar `setHeaderTheme('light')` como hacen los demás heros. Mapearlo como `destinyHero` en `src/heros/RenderHero.tsx`. Verificación: una Page con hero "Destiny Hero" muestra título, párrafo y botón.
4. **Estilos de texto y botón.** Aplicar el azul marino al `RichText` y renderizar cada link con `CMSLink` (`appearance="inline"`) con clases de botón rosa, más el icono `Play` como `children`. Verificación: el texto y el botón coinciden en color con la referencia.
5. **Avión.** Añadir `next/image` con `src="/airplane.png"`, `width={1094}`, `height={1094}`, `priority` y `alt="Avión de Destiny Trip"`. Va centrado en desktop y debajo del texto en móvil. Entrada con utilidades de `tw-animate-css` (`animate-in fade-in slide-in-from-bottom-8`) y `motion-reduce:animate-none`. Verificación: el avión aparece animado al cargar.
6. **Curva.** Insertar `VectorComponent` detrás del avión con su propio `className` de posicionamiento para el hero. Verificación: la curva se dibuja en ~2s y queda detrás del avión y delante del fondo.
7. **Nube.** Crear `src/heros/DestinyHero/Cloud.tsx` (SVG inline, color `#2A1A87`) anclado al borde inferior del hero, a ancho completo y detrás del avión. Verificación: la nube cubre el ancho del viewport en desktop y móvil.
8. **Reduced motion para la curva.** Añadir en `src/app/(frontend)/globals.css` una regla `@media (prefers-reduced-motion: reduce)` que desactive `animation` y fije `stroke-dashoffset: 0` en `.animation-draw`. Verificación: con reduced motion activo en DevTools, la curva aparece completa sin animar.
9. **Responsive.** Ajustar breakpoints: en `<768px` el texto y el botón van arriba, el avión más pequeño debajo, y la curva y la nube escalan. Verificación: sin scroll horizontal a 375px de ancho.

## Criterios de aceptación

- [ ] El select `hero.type` de Pages en el admin incluye la opción "Destiny Hero".
- [ ] `src/payload-types.ts` incluye `'destinyHero'` en el tipo del hero.
- [ ] Una Page con hero "Destiny Hero" muestra el `richText` y los `links` configurados en el admin.
- [ ] El botón "Contacto" tiene fondo `#B12672`, texto blanco e icono ▶, y navega al link configurado.
- [ ] El avión se carga desde `/airplane.png` mediante `next/image`.
- [ ] La curva rosa se dibuja animada al cargar la página.
- [ ] El avión entra con fade + slide al cargar la página.
- [ ] Con `prefers-reduced-motion: reduce`, la curva aparece completa y el avión aparece sin animación.
- [ ] La nube morada ocupa el ancho completo en el borde inferior del hero.
- [ ] A 375px de ancho, el texto queda arriba, el avión debajo y no hay scroll horizontal.
- [ ] `PruebaBlock` se ve igual que antes del cambio.
- [ ] Las Pages con heros High/Medium/Low Impact se ven igual que antes.
- [ ] `pnpm lint` no reporta errores nuevos.
- [ ] La consola del navegador no muestra errores al cargar una Page con `destinyHero`.

## Decisiones

- **Sí:** nuevo tipo de hero en `hero.type`. Sigue el patrón de la plantilla, ya que el hero vive fuera del layout de blocks.
- **No:** crearlo como block del `layout`. Rompería la convención de heros.
- **Sí:** reutilizar `richText` + `links`. No añade campos al schema y el editor controla el texto y el CTA.
- **No:** campos dedicados (`title`, `description`). Más schema sin una necesidad clara hoy.
- **No:** contenido hardcodeado. El editor no podría cambiarlo.
- **Sí:** avión estático en `public/airplane.png`. Lo pidió el usuario y es parte fija del diseño.
- **No:** avión como Media subido al admin. Queda para otra spec si se necesita.
- **Sí:** reutilizar `VectorComponent` añadiendo una prop `className` retrocompatible. Evita duplicar el path y la animación.
- **No:** envolverlo sin modificarlo. Se pierde control sobre la posición de la curva.
- **Sí:** Geist + colores de marca como clases arbitrarias dentro del hero. No altera estilos globales.
- **No:** Poppins ni tokens globales de marca. Afectaría a todo el sitio y merece su propia spec.
- **Sí:** botón con estilo local sobre `CMSLink` (`appearance="inline"`). No toca `Button` compartido.
- **No:** variante `brand` en `Button`. Toca componentes compartidos; se puede extraer después.
- **Sí:** animación de entrada del avión con `tw-animate-css` (ya importado en `globals.css`). No añade dependencias ni keyframes nuevos.
- **Sí:** regla de reduced motion en `globals.css` para `.animation-draw`. Es el único cambio global y también beneficia a `PruebaBlock`.
- **Sí:** `setHeaderTheme('light')`. El hero tiene fondo blanco como en la referencia.
- **No:** Google Reviews / avatares. Implica datos reales (colección o API de Google) y va en otra spec.
- **No:** restilizar el Header. Va en otra spec.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `VectorComponent` usa `preserveAspectRatio="none"` y la curva puede deformarse en anchos extremos | Posicionarla con un `className` que mantenga una proporción razonable por breakpoint, y verificarlo a 375px y 1440px. |
| `stroke-dasharray: 2000` puede no cubrir toda la curva si se escala mucho | Verificar visualmente en el paso 6 que la curva se dibuja completa. Si no, ajustar el valor en `.animation-draw`. |
| `airplane.png` (1094×1094) pesa en el LCP | `next/image` con `priority` y `sizes` adecuados por breakpoint. |
| Se elige "Destiny Hero" y queda un `media` antiguo guardado de otro tipo de hero | `DestinyHero` ignora el campo `media`. No afecta al render. |

## Lo que **no** entra en esta spec

- Badge de Google Reviews y avatares.
- Restyling del Header global.
- Fuente Poppins y tokens de marca globales.
- Variante `brand` del componente `Button`.
- Avión editable desde el admin.

Cada uno de estos, si llega, va en su propia spec.
