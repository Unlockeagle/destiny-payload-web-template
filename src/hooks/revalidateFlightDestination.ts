import type {
	CollectionAfterChangeHook,
	CollectionAfterDeleteHook,
	PayloadRequest,
} from 'payload'

import { revalidatePath } from 'next/cache'

import type { Flight } from '../payload-types'

// `destination` puede llegar como id o populado según el `depth` de la operación
const getDestinationSlug = async (
	destination: Flight['destination'] | null | undefined,
	req: PayloadRequest,
): Promise<string | null> => {
	if (!destination) return null
	if (typeof destination === 'object') return destination.slug ?? null

	try {
		const doc = await req.payload.findByID({
			collection: 'destinations',
			id: destination,
			depth: 0,
			req,
		})
		return doc?.slug ?? null
	} catch {
		return null
	}
}

const getDestinationId = (
	destination: Flight['destination'] | null | undefined,
): string | null =>
	destination
		? typeof destination === 'object'
			? destination.id
			: destination
		: null

const revalidateDestinationPath = async (
	destination: Flight['destination'] | null | undefined,
	req: PayloadRequest,
) => {
	const slug = await getDestinationSlug(destination, req)
	if (!slug) return

	const path = `/destinos/${slug}`

	req.payload.logger.info(`Revalidating flight destination at path: ${path}`)

	revalidatePath(path)
}

export const revalidateFlightDestination: CollectionAfterChangeHook<
	Flight
> = async ({ doc, previousDoc, req }) => {
	if (req.context.disableRevalidate) return doc

	// Solo afecta a la página del destino si el vuelo está o estaba publicado
	if (doc._status !== 'published' && previousDoc?._status !== 'published') {
		return doc
	}

	await revalidateDestinationPath(doc.destination, req)

	// Si cambió el destino, el anterior también deja de mostrar este vuelo
	if (
		previousDoc?.destination &&
		getDestinationId(previousDoc.destination) !==
			getDestinationId(doc.destination)
	) {
		await revalidateDestinationPath(previousDoc.destination, req)
	}

	return doc
}

export const revalidateFlightDestinationDelete: CollectionAfterDeleteHook<
	Flight
> = async ({ doc, req }) => {
	if (!req.context.disableRevalidate) {
		await revalidateDestinationPath(doc?.destination, req)
	}

	return doc
}
