// src/blocks/FeaturedFlights/Component.tsx
import { getPayload } from 'payload'
import config from '@payload-config'
import { FlightCard } from '@/components/blocks/FlightCard'
import type { Flight, Page } from '@/payload-types'

type FeaturedFlightsBlock = Extract<
	Page['layout'][number],
	{ blockType: 'featuredFlights' }
>

type Props = FeaturedFlightsBlock & {
	disableInnerContainer?: boolean
}

export const FeaturedFlightsComponent = async ({
	title,
	subtitle,
	selectionMode,
	flights: selectedFlights,
	limit,
	disableInnerContainer,
}: Props) => {
	const payload = await getPayload({ config })

	let docs: Flight[] = []

	if (selectionMode === 'manual' && selectedFlights?.length) {
		// Extrae los IDs tanto si vienen populated como si vienen como string
		const ids = selectedFlights.map((f) =>
			typeof f === 'object' ? f.id : f,
		)

		const result = await payload.find({
			collection: 'flights',
			where: {
				and: [
					{ _status: { equals: 'published' } },
					{ id: { in: ids } },
				],
			},
			depth: 2,
			limit: ids.length,
		})

		// Respeta el orden manual que eligió el editor
		const map = new Map(result.docs.map((f) => [f.id, f]))
		docs = ids.map((id: string) => map.get(id)).filter(Boolean) as Flight[]
	} else {
		// Modo automático: featured o latest
		const result = await payload.find({
			collection: 'flights',
			where: {
				and: [
					{ _status: { equals: 'published' } },
					...(selectionMode === 'featured'
						? [{ isFeatured: { equals: true } }]
						: []),
				],
			},
			sort: '-publishedAt',
			limit: limit ?? 6,
			depth: 2,
		})

		docs = result.docs
	}

	if (!docs.length) return null

	return (
		<section
			className={
				disableInnerContainer ? '' : 'container mx-auto max-w-5xl px-4'
			}
		>
			{(title || subtitle) && (
				<div className="mb-8 text-center">
					{title && <h2 className="text-3xl font-bold">{title}</h2>}
					{subtitle && (
						<p className="text-muted-foreground mt-2">{subtitle}</p>
					)}
				</div>
			)}

			<div className=" pb-10 container mx-auto flex gap-4 md:gap-6 w-full overflow-x-auto scrollbar-hide snap-x snap-proximity">
				{docs.map((flight) => (
					<FlightCard key={flight.id} flight={flight} />
				))}
			</div>
		</section>
	)
}
