import type { Metadata } from 'next'

import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { FlightCard } from '@/components/blocks/FlightCard'
import { Media } from '@/components/Media'
import configPromise from '@payload-config'
import { getPayload, type Where } from 'payload'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import React, { cache } from 'react'

import type { Destination } from '@/payload-types'

import { getFlightDisplayPrice } from '@/utilities/flightPrice'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'

export async function generateStaticParams() {
	const payload = await getPayload({ config: configPromise })
	const destinations = await payload.find({
		collection: 'destinations',
		draft: false,
		limit: 1000,
		overrideAccess: false,
		pagination: false,
		where: {
			_status: {
				equals: 'published',
			},
		},
		select: {
			slug: true,
		},
	})

	return destinations.docs
		.filter(({ slug }) => Boolean(slug))
		.map(({ slug }) => ({ slug: slug as string }))
}

type Args = {
	params: Promise<{
		slug?: string
	}>
}

export default async function DestinationPage({ params: paramsPromise }: Args) {
	const { slug = '' } = await paramsPromise
	// Decode to support slugs with special characters
	const decodedSlug = decodeURIComponent(slug)
	const destination = await queryDestinationBySlug({ slug: decodedSlug })

	if (!destination) notFound()

	const relatedPosts = (destination.relatedPosts ?? []).filter(
		(post) => typeof post === 'object',
	)

	const flights = await queryPublishedFlightsByDestination({
		destinationId: destination.id,
	})

	// "Desde $X": menor precio mostrado (con descuento vigente) entre los vuelos
	const fromPrice =
		flights.length > 0
			? Math.min(
					...flights.map((flight) => getFlightDisplayPrice(flight)),
				)
			: null

	return (
		<article className="pb-16">
			<PageClient />

			<DestinationHero destination={destination} fromPrice={fromPrice} />

			{destination.layout && destination.layout.length > 0 && (
				<RenderBlocks blocks={destination.layout} />
			)}

			{flights.length > 0 && (
				<section className="container pt-8">
					<h2 className="mb-8 text-2xl md:text-3xl font-semibold">
						Vuelos a {destination.name}
					</h2>
					<div className="pb-10 flex gap-4 md:gap-6 w-full overflow-x-auto scrollbar-hide snap-x snap-proximity">
						{flights.map((flight) => (
							<FlightCard key={flight.id} flight={flight} />
						))}
					</div>
				</section>
			)}

			{relatedPosts.length > 0 && (
				<section className="container pt-8">
					<h2 className="mb-8 text-2xl md:text-3xl font-semibold">
						Lee más sobre {destination.name}
					</h2>
					<RelatedPosts docs={relatedPosts} />
				</section>
			)}
		</article>
	)
}

const DestinationHero: React.FC<{
	destination: Destination
	fromPrice: number | null
}> = ({ destination, fromPrice }) => {
	const { cover_image, country, description, name } = destination

	return (
		<div className="relative isolate -mt-[10.4rem] flex items-end">
			<div className="container z-10 relative text-white pb-8">
				<p className="uppercase text-sm mb-4">{country}</p>
				<h1 className="mb-6 text-3xl md:text-5xl lg:text-6xl">
					{name}
				</h1>
				<p className="max-w-[48rem] md:text-lg">{description}</p>
				{fromPrice !== null && (
					<p className="mt-6 text-lg md:text-xl">
						Desde <strong>$ {fromPrice}</strong>
					</p>
				)}
			</div>
			<div className="min-h-[80vh] select-none">
				{cover_image && typeof cover_image === 'object' && (
					<Media
						fill
						priority
						pictureClassName="absolute inset-0 -z-10"
						imgClassName="object-cover"
						resource={cover_image}
					/>
				)}
				<div className="absolute pointer-events-none left-0 bottom-0 w-full h-1/2 bg-linear-to-t from-black to-transparent" />
			</div>
		</div>
	)
}

export async function generateMetadata({
	params: paramsPromise,
}: Args): Promise<Metadata> {
	const { slug = '' } = await paramsPromise
	// Decode to support slugs with special characters
	const decodedSlug = decodeURIComponent(slug)
	const destination = await queryDestinationBySlug({ slug: decodedSlug })

	return generateMeta({ doc: destination })
}

const queryDestinationBySlug = cache(async ({ slug }: { slug: string }) => {
	const { isEnabled: draft } = await draftMode()

	const payload = await getPayload({ config: configPromise })

	// La lectura es pública (`anyone`): fuera de draftMode hay que filtrar
	// los destinos publicados explícitamente.
	const where: Where = draft
		? { slug: { equals: slug } }
		: {
				and: [
					{ slug: { equals: slug } },
					{ _status: { equals: 'published' } },
				],
			}

	const result = await payload.find({
		collection: 'destinations',
		draft,
		limit: 1,
		overrideAccess: draft,
		pagination: false,
		where,
	})

	return result.docs?.[0] || null
})

// Flights no tiene control de lectura por estado: se filtran los publicados
const queryPublishedFlightsByDestination = cache(
	async ({ destinationId }: { destinationId: string }) => {
		const payload = await getPayload({ config: configPromise })

		const result = await payload.find({
			collection: 'flights',
			draft: false,
			depth: 1,
			limit: 100,
			overrideAccess: false,
			pagination: false,
			sort: 'price',
			where: {
				and: [
					{ destination: { equals: destinationId } },
					{ _status: { equals: 'published' } },
				],
			},
		})

		return result.docs
	},
)
