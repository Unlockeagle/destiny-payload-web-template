# SPEC 02 — Destinations

> **Estado:** Aprobado
> **Depende de:** —
> **Fecha:** 2026-10-23
> **Objetivo:** Crear la colección `destinations` con su página pública `/destinos/[slug]` y convertir `Flights.destination` en una relación con ella, migrando los vuelos existentes.

## Por qué existe esta spec

Hoy `Flights` guarda el destino como texto libre (`destination`, `country`) y enlaza a un post (`relatedPost`) para tener contenido extendido. La información de un destino (qué hacer, clima, documentos) es la misma para todos los vuelos que llegan a esa ciudad. Con texto libre, esa información quedaría duplicada en cada vuelo, o repartida entre posts sin una URL propia. Un documento `Destination` concentra el contenido, el SEO y la URL del destino, y los vuelos apuntan a él. Más adelante podrán apuntar a él también `TravelPackages` y `Hotels`.

## Alcance

**Dentro:**

- Nueva colección `destinations` en `src/collections/Destinations/index.ts`, con drafts, acceso `anyone` de lectura y `authenticated` de escritura, y labels en español.
- Campos: `name`, `country`, `slug`, `cover_image`, `description`, `layout` (bloques), `relatedPosts` y pestaña SEO (`meta`).
- En `Flights`:
  - `destination` pasa de `text` a `relationship` con `destinations`.
  - Se eliminan `country` y `relatedPost`.
  - El hook de `title` lee el nombre del destino relacionado.
- Script de migración `src/scripts/migrate-destinations.ts`, que crea los destinos a partir de los textos actuales y enlaza cada vuelo.
- Ruta pública `src/app/(frontend)/destinos/[slug]/page.tsx`, con hero del destino, precio "Desde $X" calculado, bloques del `layout`, vuelos publicados del destino y posts relacionados.
- Utilidad de precios `src/utilities/flightPrice.ts` (descuento vigente y precio mostrado), usada por la página del destino y por `FlightCard`.
- Hooks de revalidación: `Destinations` revalida su propia ruta, y `Flights` revalida la ruta de su destino.
- SEO:
  - `destinations` se añade al plugin SEO, con `generateURL` → `/destinos/{slug}`.
  - Se ajusta `generateTitle` de `flights`.
- Sitemap `destinations-sitemap.xml`, registrado en `next-sitemap.config.cjs`.
- `FlightCard` enlaza a `/destinos/{destination.slug}` y muestra `destination.name`.

**Fuera de alcance (para futuras specs):**

- Página de detalle del vuelo `/vuelos/[type]/[slug]`.
- Relacionar `TravelPackages`, `Hotels` o `Cruises` con `destinations`. Esto incluye el `relatedPost` de `TravelPackages`, que no se toca.
- Página índice `/destinos` con el listado de todos los destinos.
- Live preview y botón de preview en el admin para `destinations`.
- Precio guardado en `Destination` (ni manual ni calculado y persistido).
- Job programado que desactive descuentos vencidos.
- Añadir `destinations` al plugin de búsqueda o al de redirects.

## Modelo de datos

### Colección `destinations` (nueva)

```ts
// src/collections/Destinations/index.ts — forma resumida
{
  slug: 'destinations',
  labels: { singular: { es: 'Destino' }, plural: { es: '📍 Destinos' } },
  versions: { drafts: true },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'country', '_status'] },
  fields: [
    // tabs
    // 'Información del destino'
    { name: 'name', type: 'text', required: true },          // 'Madrid'
    { name: 'country', type: 'text', required: true },       // 'España'
    { name: 'description', type: 'textarea', required: true }, // corta, para tarjetas y meta
    { name: 'cover_image', type: 'upload', relationTo: 'media', required: true },
    // 'Contenido'
    { name: 'layout', type: 'blocks', blocks: [Content, MediaBlock, CallToAction, Banner] },
    { name: 'relatedPosts', type: 'relationship', relationTo: 'posts', hasMany: true },
    // 'SEO' (name: 'meta') — mismos campos del plugin que Flights
    // sidebar
    { name: 'slug', type: 'text', unique: true, index: true }, // generado desde name si viene vacío
    { name: 'publishedAt', type: 'date' },                     // mismo patrón que Flights
  ],
}
```

- El `slug` se genera desde `name` con la misma normalización que usa `Flights` (minúsculas, sin acentos, guiones). Ejemplo: `'Firenze'` → `'firenze'`.
- `afterChange: [revalidateDestination]`, `afterDelete: [revalidateDestinationDelete]` en `src/collections/Destinations/hooks/revalidateDestination.ts`.
- La colección es una carpeta, como `Pages` y `Posts`, porque lleva hooks propios.

### Cambios en `flights`

```ts
// Antes
{ name: 'destination', type: 'text', required: true }
{ name: 'country', type: 'text', required: true }
{ name: 'relatedPost', type: 'relationship', relationTo: 'posts' }

// Después
{ name: 'destination', type: 'relationship', relationTo: 'destinations', required: true }
// country y relatedPost eliminados
```

- `title`: `beforeChange` pasa a ser `${origin}→${destination.name}`. Si `destination` llega como id, el nombre se resuelve con `req.payload.findByID({ collection: 'destinations', id, depth: 0, req })`.
- `slug`: solo se genera si viene vacío (como hoy), usando `destination.name`. Los slugs de los vuelos existentes no cambian.
- `afterChange` / `afterDelete`: nuevo hook `revalidateFlightDestination` que revalida `/destinos/{slug}`. Revalida el destino actual y, si cambió, también el anterior.

### Precio "Desde $X" (calculado, no persistido)

```ts
// src/utilities/flightPrice.ts
isDiscountActive(flight, now = new Date()): boolean
// hasDiscount === true
// && discountPrice > 0
// && (!startDiscount || startDiscount <= now)
// && (!endDiscount || now <= endDiscount)

getFlightDisplayPrice(flight, now?): number
// isDiscountActive ? discountPrice : price
```

- La página del destino muestra `Desde $ {min(getFlightDisplayPrice(f))}` entre sus vuelos publicados.
- Si el destino no tiene vuelos publicados, no se muestra el precio.
- Al vencer `endDiscount`, el frontend vuelve al precio normal sin intervención. Como la página es estática, el cambio se ve en la siguiente revalidación (ver Riesgos).

### Migración de datos

- Antes de empezar se hace un respaldo con `mongodump` de la base de datos.
- El script lee los vuelos en crudo (`payload.db.collections.flights`, `lean`), porque en ese momento `destination` aún es texto.
- Clave de agrupación: `name` normalizado (trim + case-insensitive) + `country` normalizado. Por ejemplo, `"madrid"/"España"` y `"Madrid "/"españa"` son el mismo destino.
- Por cada clave crea un `Destination` publicado con:
  - `name` y `country` tomados del primer vuelo.
  - `description` igual a la `description` de ese vuelo.
  - `cover_image` igual al `cover_image` de ese vuelo.
  - `layout` vacío.
- Actualiza cada vuelo con `destination: <id>` usando la Local API, con `context: { disableRevalidate: true }`.
- `relatedPost` de los vuelos: si el vuelo tenía post, ese post se añade a `relatedPosts` del destino (sin duplicados).
- El script es idempotente: si ya existe un `Destination` con el mismo `slug`, lo reutiliza.
- Comando: `pnpm payload run src/scripts/migrate-destinations.ts`.

## Plan de implementación

1. **Respaldo.** Ejecutar `mongodump` contra `DATABASE_URL` y guardar la ruta del respaldo. Verificación: existe el directorio del dump con la colección `flights`.
2. **Utilidad de precios.** Crear `src/utilities/flightPrice.ts` con `isDiscountActive` y `getFlightDisplayPrice`. Cambiar `FlightCard` para usar `getFlightDisplayPrice` y mostrar el precio tachado solo si `isDiscountActive`. Verificación: un vuelo con `endDiscount` pasado muestra el precio normal en la home.
3. **Colección `destinations`.** Crear `src/collections/Destinations/index.ts` (sin hooks todavía), registrarla en `src/payload.config.ts` y ejecutar `pnpm generate:types`. Verificación: "📍 Destinos" aparece en el admin y se puede crear y publicar un destino.
4. **SEO de destinos.** En `src/plugins/index.ts`:
   - Añadir `destinations` a `seoPlugin.collections`.
   - Añadir los `case 'destinations'` en `generateTitle` (`${name} | Destinos Destiny Trip`), `generateDescription` (`description`) y `generateURL` (`/destinos/{slug}`).

   Verificación: los botones "Generar" de la pestaña SEO rellenan título, descripción y URL.
5. **Página `/destinos/[slug]`.** Crear `src/app/(frontend)/destinos/[slug]/page.tsx`:
   - `generateStaticParams`.
   - `queryDestinationBySlug`, con soporte de `draftMode` como en posts.
   - `generateMetadata` con `generateMeta`.
   - Contenido: hero (imagen, nombre, país, descripción) + `RenderBlocks` del `layout` + `RelatedPosts`.

   Si el slug no existe, `notFound()`. Verificación: un destino publicado se ve en `/destinos/{slug}` y un slug inexistente devuelve 404.
6. **Script de migración.** Primero añadir a `Flights` un campo temporal `destinationRef` (relationship a `destinations`, oculto en el admin). Después crear `src/scripts/migrate-destinations.ts` según "Migración de datos", rellenando `destinationRef`. Ejecutarlo. Verificación:
   - Cada vuelo tiene `destinationRef`.
   - Los destinos creados no tienen duplicados.
   - Una segunda ejecución no crea nada nuevo.
7. **Cambio de esquema en `Flights`.**
   - Reemplazar `destination` (texto) por `destination` (relationship) y eliminar `country`, `relatedPost` y `destinationRef`.
   - Añadir al script un segundo paso, `--finalize`, que copie `destinationRef` → `destination` en crudo (`payload.db.collections.flights`, `updateMany` por documento) y haga `$unset` de `destinationRef`, `country` y `relatedPost`.
   - Ejecutar el script con `--finalize` y luego `pnpm generate:types`.

   Verificación: en el admin, cada vuelo muestra su destino seleccionado y no aparecen `country` ni "Post relacionado".
8. **Hooks de `title` y `slug` en Flights.** Adaptar `beforeChange` para resolver `destination.name`. En `generateTitle` del plugin SEO, el caso `flights` pasa a usar `doc.title`. Verificación: guardar un vuelo regenera `title` como `Caracas→Madrid`.
9. **Consumidores de `destination`.** Actualizar `FlightCard`: muestra `destination.name` y su `href` pasa a `/destinos/{destination.slug}`. Revisar que `FeaturedFlights` consulte con `depth` suficiente para popular `destination`. Ejecutar `pnpm build` y `tsc` para que no quede ningún uso de `flight.destination` como string ni de `flight.relatedPost`. Verificación: la home muestra los vuelos destacados con el nombre del destino, y "Ver vuelo" lleva a `/destinos/...`.
10. **Vuelos y precio en la página del destino.** En `/destinos/[slug]`:
    - Consultar los `flights` con `destination = id` y `_status = 'published'`.
    - Renderizarlos con `FlightCard`.
    - Mostrar "Desde $ X" en el hero con `getFlightDisplayPrice`.

    Verificación: el destino muestra sus vuelos publicados y no los borradores. El precio coincide con el menor de ellos.
11. **Revalidación.** Crear `revalidateDestination` / `revalidateDestinationDelete`, siguiendo el patrón de `revalidatePage` (path `/destinos/{slug}` + tag `destinations-sitemap`), y `revalidateFlightDestination` en Flights. Todos respetan `context.disableRevalidate`. Verificación: con `pnpm build && pnpm start`, publicar un cambio en un vuelo o en un destino se refleja en `/destinos/{slug}` sin redeploy.
12. **Sitemap.**
    - Crear `src/app/(frontend)/(sitemaps)/destinations-sitemap.xml/route.ts`, copiando el patrón de `posts-sitemap.xml` con el tag `destinations-sitemap`.
    - Añadir `/destinations-sitemap.xml` a `exclude` y a `additionalSitemaps` en `next-sitemap.config.cjs`.

    Verificación: `/destinations-sitemap.xml` lista los destinos publicados.

## Criterios de aceptación

- [ ] El admin muestra la colección "📍 Destinos" con los campos `name`, `country`, `description`, `cover_image`, `layout`, `relatedPosts`, `slug` y la pestaña SEO.
- [ ] Al guardar un destino con el `slug` vacío, el `slug` se genera desde `name`, sin acentos y en kebab-case.
- [ ] En `Flights`, `destination` es un selector de destinos obligatorio, y ya no existen los campos `country` ni "Post relacionado".
- [ ] Tras la migración, cada vuelo existente apunta a un destino, y el número de destinos es igual al número de pares (`destination`, `country`) distintos normalizados.
- [ ] Ejecutar el script de migración dos veces no crea destinos duplicados.
- [ ] Los posts que antes eran `relatedPost` de un vuelo aparecen en `relatedPosts` de su destino.
- [ ] Guardar un vuelo genera `title` con el formato `{origin}→{destination.name}`.
- [ ] `/destinos/{slug}` de un destino publicado muestra imagen, nombre, país, descripción, bloques del `layout`, vuelos publicados y posts relacionados.
- [ ] `/destinos/{slug}` no muestra vuelos en borrador.
- [ ] `/destinos/{slug-inexistente}` devuelve 404.
- [ ] El precio "Desde $ X" es el menor `getFlightDisplayPrice` entre los vuelos publicados del destino. Si no hay vuelos, no se muestra.
- [ ] Un vuelo con `hasDiscount` y `endDiscount` en el pasado muestra su `price` normal, tanto en `FlightCard` como en el cálculo del destino.
- [ ] Un vuelo con `startDiscount` en el futuro muestra su `price` normal.
- [ ] "Ver vuelo" en `FlightCard` navega a `/destinos/{destination.slug}`.
- [ ] Los botones "Generar" del SEO de un destino producen el título `{name} | Destinos Destiny Trip`, la descripción y la URL `/destinos/{slug}`.
- [ ] En build de producción, publicar un cambio en un destino o en uno de sus vuelos actualiza `/destinos/{slug}` sin redeploy.
- [ ] `/destinations-sitemap.xml` lista las URLs de los destinos publicados.
- [ ] `pnpm build` termina sin errores de tipos.
- [ ] La consola del navegador no muestra errores al cargar `/destinos/{slug}`.

## Decisiones

- **Sí:** colección `destinations` separada. El contenido del destino se comparte entre vuelos y, más adelante, entre paquetes y hoteles.
- **No:** relacionar `Flights` con `Pages`. Duplica URL y SEO, y Pages está pensada para páginas sueltas, no para un catálogo.
- **No:** bloques dentro de cada vuelo. Duplica el contenido cuando varios vuelos van al mismo destino.
- **Sí:** reemplazar `destination`/`country` por la relación y migrar con un script. Evita mantener datos duplicados.
- **No:** convivencia del texto y la relación. Los datos se desincronizarían.
- **Sí:** migración en dos pasos (`destinationRef` temporal + `--finalize`). Al leer en crudo nunca se pierde el texto original antes de tener el id.
- **No:** cambiar el tipo de campo y migrar en un solo paso. Mientras tanto, la Local API intentaría popular textos como ids.
- **Sí:** contenido con bloques (`Content`, `MediaBlock`, `CallToAction`, `Banner`) renderizados con `RenderBlocks`. El editor ya los conoce.
- **No:** un `richText` único ni campos fijos (clima, documentos…). El primero es menos flexible; los segundos son rígidos.
- **Sí:** `relatedPosts` (hasMany) en el destino, y eliminar `relatedPost` de `Flights`. El post es contenido editorial del destino, no del vuelo.
- **Sí:** precio "Desde $X" calculado en el render a partir de los vuelos publicados. No hay datos duplicados que se desincronicen.
- **No:** precio manual en `Destination` ni precio calculado y persistido con un hook. El primero duplica datos; el segundo añade complejidad sin necesidad de ordenar o filtrar por precio hoy.
- **Sí:** el descuento vigente se decide en el frontend con `startDiscount`/`endDiscount`, el mismo patrón de fechas que `Flights`.
- **No:** job que desactive descuentos. Más piezas móviles.
- **Sí:** `FlightCard` usa la misma utilidad de precio. Así la tarjeta y el destino nunca muestran precios distintos para el mismo vuelo.
- **Sí:** `FlightCard` enlaza a `/destinos/{slug}`. Es la única ruta que existe; se cambiará cuando exista `/vuelos/...`.
- **No:** enlazar a `/vuelos/...` ya. Daría 404.
- **Sí:** hooks `revalidatePath` + página estática con `generateStaticParams`. Es el patrón de Pages y Posts.
- **No:** `force-dynamic`. Consulta Mongo en cada visita.
- **Sí:** la imagen y la descripción del destino se toman del primer vuelo en la migración. Así ambos campos pueden ser obligatorios sin romper el script.
- **Sí:** el slug del vuelo no se regenera. Cambiarlo rompería URLs ya indexadas.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La migración deja datos inconsistentes o falla a mitad | `mongodump` previo (paso 1). Script idempotente, y `--finalize` separado y ejecutado solo tras verificar el paso 6. |
| Textos de destino con variantes ("Nueva York" / "New York") generan destinos duplicados | El script imprime la lista de destinos creados. Los duplicados se fusionan a mano en el admin antes de `--finalize`. |
| Las versiones antiguas en `_flights_versions` conservan `destination` como texto, y restaurarlas rompe el vuelo | No restaurar versiones anteriores a la migración. Queda documentado en el log del script. |
| Vuelos con un borrador pendiente más nuevo que la versión publicada | El script actualiza el documento principal. Hay que revisar en el admin los vuelos con borrador tras migrar. |
| El descuento vence pero la página estática sigue mostrando el precio rebajado hasta la próxima revalidación | Se acepta en esta spec. Si molesta, se añade `revalidate` por tiempo a la ruta en otra spec. |
| `generateMeta` está tipado para `Page`/`Post` | Ampliar su tipo para aceptar `Destination` en el paso 5. |
| El hook de `title` hace una consulta extra por guardado | Solo cuando `destination` llega como id. Se pasa `req` para mantener la transacción. |

## Lo que **no** entra en esta spec

- Página de detalle del vuelo `/vuelos/[type]/[slug]`.
- Relación de `TravelPackages`, `Hotels` y `Cruises` con `destinations`.
- Página índice `/destinos`.
- Live preview de destinos.
- Precio persistido en `Destination`.
- Job de vencimiento de descuentos.
- Destinos en el plugin de búsqueda o de redirects.

Cada uno de estos, si llega, va en su propia spec.
