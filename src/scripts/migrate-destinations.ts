/**
 * SPEC 02 — Migración de `flights.destination` (texto) a `destinations`.
 *
 * Paso 1 (este script, sin flags): lee los vuelos en crudo, crea un
 * `Destination` publicado por cada par (destino, país) normalizado y guarda
 * su id en el campo temporal `flights.destinationRef`. Es idempotente: si ya
 * existe un destino con el mismo slug, lo reutiliza.
 *
 * Uso: pnpm payload run src/scripts/migrate-destinations.ts
 *
 * Paso 2 (`finalize`): con `destination` ya como relationship en Flights,
 * copia en crudo `destinationRef` → `destination` y hace `$unset` de
 * `destinationRef`, `country` y `relatedPost`, tanto en el documento principal
 * como en la versión `latest` de `_flights_versions` (la que lee el admin).
 * Ejecutar solo tras revisar el resultado del paso 1.
 *
 * Uso: pnpm payload run src/scripts/migrate-destinations.ts finalize
 * (`payload run` solo reenvía argumentos posicionales: `--finalize` no llega
 * al script, por eso se usa `finalize`; ambos se aceptan.)
 *
 * ⚠️ Las versiones antiguas (no `latest`) en `_flights_versions` conservan `destination` como
 * texto: no restaurar versiones anteriores a la migración.
 */
import config from '@payload-config'
import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { ObjectId } from 'mongodb'
import { getPayload } from 'payload'

import type { Flight } from '@/payload-types'

type RawFlight = {
	_id: ObjectId
	title?: string
	destination?: unknown
	destinationRef?: unknown
	country?: unknown
	description?: string
	cover_image?: unknown
	relatedPost?: unknown
}

// Misma normalización que el slug de Flights y Destinations
const toSlug = (value: string): string =>
	value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.trim()

const normalize = (value: unknown): string =>
	typeof value === 'string' ? value.trim().toLowerCase() : ''

const toId = (value: unknown): string | null =>
	value === null || value === undefined || value === '' ? null : String(value)

const payload = await getPayload({ config })
const db = payload.db as unknown as MongooseAdapter

const isFinalize = process.argv
	.slice(2)
	.some((arg) => arg === 'finalize' || arg === '--finalize')

if (isFinalize) {
	// Colección nativa: el esquema de Mongoose ya no tiene `destinationRef`,
	// `country` ni `relatedPost`, y en modo strict ignoraría esos paths.
	const flightsCollection = db.collections.flights.collection
	const docs = (await flightsCollection
		.find({})
		.toArray()) as unknown as RawFlight[]

	const pending = docs.filter(
		(flight) =>
			!flight.destinationRef && typeof flight.destination === 'string',
	)

	if (pending.length > 0) {
		payload.logger.error(
			`Hay ${pending.length} vuelo(s) con destino en texto y sin destinationRef: ${pending.map((f) => String(f._id)).join(', ')}. Ejecuta primero el paso 1. No se ha modificado nada.`,
		)
		process.exit(1)
	}

	let finalized = 0
	let alreadyDone = 0

	for (const flight of docs) {
		const hasRef = Boolean(flight.destinationRef)

		await flightsCollection.updateMany(
			{ _id: flight._id },
			{
				...(hasRef
					? { $set: { destination: flight.destinationRef } }
					: {}),
				$unset: { destinationRef: '', country: '', relatedPost: '' },
			},
		)

		if (hasRef) finalized++
		else alreadyDone++
	}

	// Con drafts, el admin (y `draft: true`) lee la versión `latest` de
	// `_flights_versions`, no el documento principal: se migra igual, usando
	// su propio `version.destinationRef`.
	const versionsCollection = db.versions.flights.collection
	const latestVersions = (await versionsCollection
		.find({ latest: true })
		.toArray()) as unknown as { _id: ObjectId; version?: RawFlight }[]

	let versionsFinalized = 0
	const versionsPending: string[] = []

	for (const { _id, version } of latestVersions) {
		if (version?.destinationRef) {
			await versionsCollection.updateMany(
				{ _id },
				{
					$set: { 'version.destination': version.destinationRef },
					$unset: {
						'version.destinationRef': '',
						'version.country': '',
						'version.relatedPost': '',
					},
				},
			)
			versionsFinalized++
		} else if (typeof version?.destination === 'string') {
			versionsPending.push(String(_id))
		}
	}

	payload.logger.info(
		`Finalize: ${finalized} vuelo(s) pasan a destination = destinationRef, ${alreadyDone} ya estaban finalizados. Versiones latest migradas: ${versionsFinalized}/${latestVersions.length}. Ejecuta ahora pnpm generate:types.`,
	)

	if (versionsPending.length > 0) {
		payload.logger.warn(
			`Versiones latest con destino en texto y sin destinationRef (revisa esos vuelos en el admin): ${versionsPending.join(', ')}`,
		)
	}

	payload.logger.warn(
		'Las versiones antiguas (no latest) en _flights_versions conservan destination como texto: no restaures versiones anteriores a la migración.',
	)
	process.exit(0)
}

const rawFlights = (await db.collections.flights
	.find({})
	.lean()) as unknown as RawFlight[]

payload.logger.info(`Vuelos encontrados: ${rawFlights.length}`)

// Agrupar por (destino, país) normalizados
const groups = new Map<string, RawFlight[]>()
const skipped: RawFlight[] = []
let alreadyFinalized = 0

for (const flight of rawFlights) {
	// Tras `finalize`, `destination` ya es un ObjectId: no hay nada que migrar
	if (flight.destination && typeof flight.destination !== 'string') {
		alreadyFinalized++
		continue
	}

	const name = normalize(flight.destination)
	const country = normalize(flight.country)

	if (!name || !country) {
		skipped.push(flight)
		continue
	}

	const key = `${name}|${country}`
	groups.set(key, [...(groups.get(key) ?? []), flight])
}

const summary: {
	slug: string
	name: string
	country: string
	flights: number
	status: 'creado' | 'reutilizado'
}[] = []
const failures: string[] = []
let linked = 0

for (const flights of groups.values()) {
	const first = flights[0]
	const name = String(first.destination).trim()
	const country = String(first.country).trim()
	const slug = toSlug(name)

	const postIds = [
		...new Set(
			flights
				.map((flight) => toId(flight.relatedPost))
				.filter((id): id is string => Boolean(id)),
		),
	]

	try {
		const existing = await payload.find({
			collection: 'destinations',
			where: { slug: { equals: slug } },
			limit: 1,
			depth: 0,
			draft: true,
			overrideAccess: true,
		})

		let destination = existing.docs[0]
		let status: 'creado' | 'reutilizado' = 'reutilizado'

		if (destination) {
			if (normalize(destination.country) !== normalize(country)) {
				payload.logger.warn(
					`El destino "${destination.name}" (${destination.country}) ya existe con el slug "${slug}" y se reutiliza para "${name}" (${country}). Revísalo en el admin.`,
				)
			}

			// Añadir los posts relacionados que falten, sin duplicados
			const currentPosts = (destination.relatedPosts ?? []).map((post) =>
				typeof post === 'object' ? post.id : post,
			)
			const missingPosts = postIds.filter(
				(id) => !currentPosts.includes(id),
			)

			if (missingPosts.length > 0) {
				destination = await payload.update({
					collection: 'destinations',
					id: destination.id,
					data: { relatedPosts: [...currentPosts, ...missingPosts] },
					depth: 0,
					overrideAccess: true,
					context: { disableRevalidate: true },
				})
			}
		} else {
			destination = await payload.create({
				collection: 'destinations',
				data: {
					name,
					country,
					slug,
					description: first.description ?? '',
					cover_image: toId(first.cover_image) as string,
					layout: [],
					relatedPosts: postIds,
					_status: 'published',
				},
				depth: 0,
				overrideAccess: true,
				context: { disableRevalidate: true },
			})
			status = 'creado'
		}

		summary.push({ slug, name, country, flights: flights.length, status })

		for (const flight of flights) {
			const id = String(flight._id)

			try {
				await payload.update({
					collection: 'flights',
					id,
					// `destinationRef` solo existe en el esquema antes de `finalize`
					data: { destinationRef: destination.id } as Partial<Flight>,
					depth: 0,
					overrideAccess: true,
					context: { disableRevalidate: true },
				})
				linked++
			} catch (error) {
				failures.push(
					`Vuelo ${id} (${flight.title ?? ''}): ${String(error)}`,
				)
			}
		}
	} catch (error) {
		failures.push(
			`Destino "${name}" (${country}): ${String(error)} — sus ${flights.length} vuelo(s) quedan sin enlazar`,
		)
	}
}

console.table(summary)
payload.logger.info(
	`Destinos: ${summary.filter((s) => s.status === 'creado').length} creados, ${summary.filter((s) => s.status === 'reutilizado').length} reutilizados. Vuelos enlazados: ${linked}/${rawFlights.length}.`,
)

if (alreadyFinalized > 0) {
	payload.logger.info(
		`Vuelos ya finalizados (destination es relación), omitidos: ${alreadyFinalized}`,
	)
}

if (skipped.length > 0) {
	payload.logger.warn(
		`Vuelos sin destino o país (no migrados): ${skipped.map((f) => String(f._id)).join(', ')}`,
	)
}

if (failures.length > 0) {
	payload.logger.error(
		`Errores (${failures.length}):\n${failures.join('\n')}`,
	)
}

payload.logger.warn(
	'Revisa en el admin los destinos duplicados por variantes de nombre ("Nueva York" / "New York") y los vuelos con borradores pendientes antes de ejecutar finalize. No restaures versiones de vuelos anteriores a la migración.',
)

process.exit(failures.length > 0 || skipped.length > 0 ? 1 : 0)
