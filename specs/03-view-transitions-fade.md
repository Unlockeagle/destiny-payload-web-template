# SPEC 03 — View transitions fade

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-10-28
> **Objetivo:** Hacer un fundido cruzado de 250ms del contenido de la página al navegar dentro del frontend, con Header, Footer y AdminBar fijos, usando View Transitions con la animación definida en CSS.

## Por qué existe esta spec

La regla CSS `@view-transition { navigation: auto; }` solo actúa en navegaciones entre documentos del mismo origen, como los enlaces `<a>` normales o los botones atrás/adelante. Las recargas quedan excluidas por el estándar. Los `<Link>` de Next navegan en el cliente sin recargar el documento, así que con esa regla sola no habría fade en la navegación habitual del sitio.

Para esos casos hace falta `experimental.viewTransition` de Next junto con el componente `<ViewTransition>` de React. React lanza `document.startViewTransition` cuando aplica el payload RSC de la nueva página.

Las páginas se siguen renderizando en el servidor, sea en modo estático o dinámico. La transición solo afecta a cómo se pasa de la página vieja a la nueva en el navegador.

## Alcance

**Dentro:**

- Activar `experimental.viewTransition: true` en `next.config.ts`.
- Envolver `{children}` con `<ViewTransition>` de React en `src/app/(frontend)/layout.tsx`, dejando fuera `AdminBar`, `Header` y `Footer`.
- Añadir `@view-transition { navigation: auto; }` en `src/app/(frontend)/globals.css` para las navegaciones entre documentos.
- Crossfade simultáneo de 250ms `ease-out`, definido en `globals.css` sobre los pseudo-elementos `::view-transition-*`.
- Header, Footer y AdminBar con `view-transition-name` propio y sin animación, para que no hagan fundido. El Header queda por encima del contenido durante la transición.
- Con `prefers-reduced-motion: reduce`, sin ninguna animación: el cambio de página es instantáneo.
- Test e2e `tests/e2e/view-transitions.e2e.spec.ts`.
- Una línea en `CLAUDE.md` (sección UI) que documente el mecanismo.

**Fuera de alcance (para futuras specs):**

- `loading.tsx`, esqueletos o barra de progreso mientras responde el servidor.
- Transiciones compartidas entre elementos (p. ej. la imagen de una `FlightCard` que crece hasta el hero de `/destinos/[slug]`).
- Animaciones distintas por ruta o por dirección (slide adelante/atrás).
- Transiciones en el admin de Payload (`src/app/(payload)`).
- Cambiar la estrategia de render (estático/dinámico) de las páginas.

## Modelo de datos

Esta feature no introduce estructuras de datos ni cambios en colecciones de Payload. No hace falta `pnpm generate:types`.

Nombres de view transition que se introducen (deben ser únicos en el documento):

| Elemento | Archivo | `view-transition-name` |
| --- | --- | --- |
| `<header>` | `src/Header/Component.client.tsx` | `site-header` |
| `<footer>` | `src/Footer/Component.tsx` | `site-footer` |
| contenedor raíz de AdminBar | `src/components/AdminBar/index.tsx` | `admin-bar` |

El contenido (`{children}`) lo nombra React automáticamente desde `<ViewTransition>`. En las navegaciones entre documentos, el contenido forma parte del grupo `root`.

Forma del CSS (ilustrativa, no definitiva):

```css
@view-transition { navigation: auto; }

::view-transition-old(*),
::view-transition-new(*) { animation-duration: 250ms; animation-timing-function: ease-out; }

::view-transition-group(site-header),
::view-transition-group(site-footer),
::view-transition-group(admin-bar) { animation: none; }
::view-transition-group(site-header) { z-index: 10; }  /* por encima del contenido */

@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) { animation: none !important; }
}
```

## Plan de implementación

1. **Flag de Next.** Añadir `experimental: { viewTransition: true }` a `nextConfig` en `next.config.ts`. No tocar los bloques `//Todo: Comentar para el deploy`. Verificación: `pnpm dev` arranca y el sitio se ve y navega igual que antes.
2. **`<ViewTransition>` en el layout.** En `src/app/(frontend)/layout.tsx`, importar `ViewTransition` desde `react` y envolver solo `{children}`. Verificación: al navegar con el logo del Header desde `/posts` a `/`, se ve el crossfade por defecto del navegador y no hay errores en consola.
3. **Duración y curva.** En `src/app/(frontend)/globals.css`, fijar 250ms `ease-out` en `::view-transition-old(*)` y `::view-transition-new(*)`, y añadir `@view-transition { navigation: auto; }`. Verificación: en el panel Animations de DevTools la transición dura 250ms, y una navegación con un enlace `<a>` normal también hace fundido. Las recargas (F5) no lo hacen: `@view-transition` excluye las navegaciones de tipo `reload`.
4. **Header, Footer y AdminBar fijos.** Añadir los `view-transition-name` de la tabla con clases arbitrarias de Tailwind (p. ej. `[view-transition-name:site-header]`). En `globals.css`, quitar la animación de sus grupos y subir el `z-index` del grupo `site-header`. Verificación: al navegar, el Header y el Footer no parpadean, y el contenido no se pinta por encima del Header sticky.
5. **Reduced motion.** Añadir el bloque `@media (prefers-reduced-motion: reduce)` junto a la regla existente de `.animation-draw`. Verificación: con la emulación de reduced motion de DevTools, la navegación cambia la página sin fundido.
6. **Test e2e.** Crear `tests/e2e/view-transitions.e2e.spec.ts`, siguiendo el patrón de `destiny-hero.e2e.spec.ts`:
   - Con `page.addInitScript`, envolver `document.startViewTransition` para contar las llamadas. Al resolverse `transition.ready`, guardar las animaciones de `document.getAnimations()` cuyo `pseudoElement` empiece por `::view-transition`.
   - Caso normal: ir a `/posts`, hacer clic en el logo del Header (`<Link href="/">`), esperar a la URL `/`. Comprobar que hubo al menos una llamada y que las animaciones de `::view-transition-new` duran 250ms.
   - Caso reduced motion (`reducedMotion: 'reduce'`): la misma navegación no deja ninguna animación de `::view-transition-*` en curso.

   Verificación: `pnpm test:e2e tests/e2e/view-transitions.e2e.spec.ts` pasa.
7. **Documentación.** Añadir en `CLAUDE.md`, sección **UI**, una línea: las transiciones de página usan `experimental.viewTransition` + `<ViewTransition>` en el layout del frontend, la animación vive en `globals.css`, y Header, Footer y AdminBar llevan `view-transition-name` propio. Verificación: la línea existe.

## Criterios de aceptación

- [ ] `next.config.ts` tiene `experimental.viewTransition: true` y los bloques de deploy no han cambiado.
- [ ] Navegar con un `<Link>` dentro del frontend llama a `document.startViewTransition`.
- [ ] El contenido de la página hace crossfade de 250ms con `ease-out`.
- [ ] Una navegación entre documentos con un enlace `<a>` normal también hace el fundido en Chromium. Las recargas no, por diseño del estándar.
- [ ] Durante la transición, el Header y el Footer no hacen fundido ni parpadean.
- [ ] Durante la transición, el contenido no se dibuja por encima del Header.
- [ ] Con sesión iniciada, la AdminBar no hace fundido al navegar.
- [ ] Con `prefers-reduced-motion: reduce`, no se ejecuta ninguna animación de `::view-transition-*`.
- [ ] La navegación dentro del admin de Payload (`/admin`) no tiene fundido.
- [ ] En un navegador sin View Transitions, la navegación funciona igual que antes, sin errores.
- [ ] `pnpm test:e2e tests/e2e/view-transitions.e2e.spec.ts` pasa.
- [ ] `pnpm build` termina sin errores de tipos.
- [ ] La consola del navegador no muestra errores ni warnings nuevos al navegar entre `/`, `/posts` y `/destinos/{slug}`.

## Decisiones

- **Sí:** `experimental.viewTransition` + `<ViewTransition>` de React. Es la única forma de que los `<Link>` de Next (navegación de cliente) disparen la transición.
- **Sí:** además, `@view-transition { navigation: auto; }`. Cubre los enlaces `<a>` y otras navegaciones entre documentos con el mismo CSS, sin coste extra. No cubre las recargas.
- **No:** solo `@view-transition` en CSS. No anima las navegaciones con `<Link>`, que son la mayoría.
- **No:** librería `next-view-transitions`. Añade una dependencia y obliga a cambiar todos los imports de `Link`.
- **Sí:** `<ViewTransition>` solo alrededor de `{children}`, en el layout del frontend. El admin no se ve afectado y el layout es el único punto de entrada.
- **Sí:** Header, Footer y AdminBar con `view-transition-name` propio y grupos sin animación. El menú no parpadea y funciona igual en los dos mecanismos.
- **No:** fundido de la página completa. Hace parpadear el Header en cada clic.
- **Sí:** crossfade simultáneo de 250ms `ease-out`. Se percibe sin frenar la navegación.
- **No:** fade secuencial. Deja un vacío visible entre páginas.
- **Sí:** sin animación con `prefers-reduced-motion: reduce`. Es coherente con la regla existente de `.animation-draw`.
- **Sí:** animación en `globals.css` con selectores `::view-transition-*`. Sin keyframes nuevos ni JS.
- **Sí:** clases arbitrarias de Tailwind para `view-transition-name`. No hacen falta clases globales nuevas por elemento.
- **No:** `loading.tsx` en esta spec. Es un problema distinto (feedback de carga) y va en su propia spec.
- **Sí:** test e2e con Playwright que mide las animaciones reales. Es verificable y sigue el patrón de `destiny-hero.e2e.spec.ts`.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `experimental.viewTransition` es experimental y su API puede cambiar entre versiones de Next | El cambio se limita a una línea en `next.config.ts` y un wrapper en el layout. Revisar el changelog al actualizar Next. |
| `ViewTransition` no está exportado o tipado desde `react` 19.2.4 (el App Router usa el React canary incluido en Next) | Si falla el import o los tipos, usar `unstable_ViewTransition as ViewTransition`. Anotarlo como desviación. |
| Las páginas son dinámicas: la página vieja queda quieta hasta que llega la respuesta, y el fade empieza tarde | Se acepta en esta spec. El feedback de carga va en otra spec (`loading.tsx` o barra de progreso). |
| El grupo del contenido se pinta por encima del Header sticky (los grupos con nombre se ordenan por orden en el DOM) | `z-index` en `::view-transition-group(site-header)` (paso 4) y verificación visual. |
| Nombre de view transition duplicado (p. ej. dos `<header>` en la página) aborta la transición | Los nombres se ponen solo en `HeaderClient`, `Footer` y `AdminBar`, que se renderizan una vez en el layout. |
| El `backdrop-blur` del Header se ve distinto durante la transición, porque el snapshot es una imagen plana | Se acepta. Dura 250ms. |
| El cambio de `headerTheme` tras la navegación (`setHeaderTheme(null)` en `HeaderClient`) produce un salto de color del Header | El grupo `site-header` no anima. El cambio se aplica al terminar, igual que hoy. |
| Los botones atrás/adelante del navegador pueden no disparar la transición | Se acepta. No forma parte de los criterios de aceptación. |

## Desviaciones de la implementación

Cambios respecto al plan, acordados durante la implementación:

- **El snapshot `old` de Header, Footer y AdminBar se oculta** (paso 4). El plan solo pedía quitar la animación de sus grupos, pero eso no basta. La regla `::view-transition-old(*)` / `::view-transition-new(*)` del paso 3 sigue haciendo el fundido de los snapshots `old` y `new` dentro del grupo. Además, si los dos quedan visibles sin animar, el navegador los mezcla con `plus-lighter` y el fondo semitransparente del Header (`bg-slate-50/30`) se ve más claro. Por eso `::view-transition-new(site-header|site-footer|admin-bar)` lleva `animation: none` y `::view-transition-old(...)` lleva `display: none`.
- **Las recargas no hacen fundido** (paso 3 y criterios). La versión inicial de la spec decía que F5 también hacía fundido. `@view-transition { navigation: auto; }` solo actúa en navegaciones `push`, `replace` y `traverse` del mismo origen; las de tipo `reload` quedan excluidas por el estándar. Con Playwright, un enlace `<a>` normal sí produce transición (`pageswap.viewTransition` presente) y una recarga no. Se corrigieron el texto de la spec y el comentario de `globals.css`.
- **El test e2e comprueba también Header y Footer** (paso 6). Además de lo pedido, verifica que `::view-transition-new(site-header)` y `::view-transition-new(site-footer)` no tienen animación.

## Lo que **no** entra en esta spec

- `loading.tsx`, esqueletos o barra de progreso.
- Transiciones compartidas entre elementos (card → hero).
- Animaciones por ruta o por dirección.
- Transiciones en el admin de Payload.
- Cambios en la estrategia de render de las páginas.

Cada uno de estos, si llega, va en su propia spec.
