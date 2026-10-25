import type {
	CollectionAfterChangeHook,
	CollectionAfterDeleteHook,
} from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Destination } from '../../../payload-types'

export const revalidateDestination: CollectionAfterChangeHook<Destination> = ({
	doc,
	previousDoc,
	req: { payload, context },
}) => {
	if (!context.disableRevalidate) {
		if (doc._status === 'published') {
			const path = `/destinos/${doc.slug}`

			payload.logger.info(`Revalidating destination at path: ${path}`)

			revalidatePath(path)
			revalidateTag('destinations-sitemap', 'max')
		}

		// If the destination was previously published under another slug or is no
		// longer published, we need to revalidate the old path
		if (
			previousDoc?._status === 'published' &&
			(doc._status !== 'published' || previousDoc.slug !== doc.slug)
		) {
			const oldPath = `/destinos/${previousDoc.slug}`

			payload.logger.info(
				`Revalidating old destination at path: ${oldPath}`,
			)

			revalidatePath(oldPath)
			revalidateTag('destinations-sitemap', 'max')
		}
	}
	return doc
}

export const revalidateDestinationDelete: CollectionAfterDeleteHook<
	Destination
> = ({ doc, req: { context } }) => {
	if (!context.disableRevalidate) {
		const path = `/destinos/${doc?.slug}`

		revalidatePath(path)
		revalidateTag('destinations-sitemap', 'max')
	}

	return doc
}
