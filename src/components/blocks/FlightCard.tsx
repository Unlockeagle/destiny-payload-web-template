import { Flight } from '@/payload-types'
import {
	getFlightDisplayPrice,
	isDiscountActive,
} from '@/utilities/flightPrice'
import { Play } from 'lucide-react'
import Link from 'next/link'

type Props = {
	flight: Flight
}

export const FlightCard = ({ flight }: Props) => {
	const hasActiveDiscount = isDiscountActive(flight)
	const displayPrice = getFlightDisplayPrice(flight)

	// `destination` llega populado (depth >= 1) desde las consultas de vuelos
	const destination =
		typeof flight.destination === 'object' ? flight.destination : null

	// Única ruta que existe hoy; cambiará cuando exista /vuelos/...
	const href = destination?.slug ? `/destinos/${destination.slug}` : '#'

	const title = `${flight.origin} → ${destination?.name ?? ''}`
	const cover =
		flight.cover_image && typeof flight.cover_image === 'object'
			? flight.cover_image
			: null

	return (
		<article className="flight-card group rounded-lg overflow-hidden shadow-slate-600/30 shadow-sm flex-none basis-80 snap-center text-base">
			{/* flight ---->>> imagen */}
			{cover && (
				<div className="flight-card__images h-56 relative overflow-hidden">
					<img
						className="w-full h-full object-cover group-hover:scale-105 transition-transform ease-in-out duration-300"
						src={cover.sizes?.small?.url ?? ''}
						alt={cover.alt || title}
						loading="lazy"
					/>
					{/* flight --->>> badge */}
					{flight.isFeatured && (
						<span className="absolute bg-amber-300 text-slate-950 rounded-2xl px-2 py-1 text-xs font-medium top-2 left-2">
							Destacado
						</span>
					)}
				</div>
			)}

			{/* flight --->>> content */}
			<div className="flight-card__content p-4 w-full flex flex-col justify-between">
				<div className="flex flex-col gap-1">
					<h3 className="leading-snug font-semibold">{title}</h3>
					<p className="leading-snug text-slate-600 dark:text-slate-400 line-clamp-2">
						{flight.description}
					</p>

					{/* flight --->>> price */}
					<p className="flight-card__price mt-1">
						Desde{' '}
						{hasActiveDiscount && (
							<span className="mr-1 text-slate-500 line-through">
								$ {flight.price}
							</span>
						)}
						<strong className="font-bold">$ {displayPrice}</strong>
					</p>
				</div>

				{/* flight --->>> CTA */}
				<Link
					href={href}
					aria-label={`Ver vuelo ${title}`}
					className="group inline-flex items-center justify-center gap-2 mt-4 bg-pink-600 text-zinc-50 text-center rounded-full px-4 py-2 font-medium transition-opacity hover:opacity-90"
				>
					Ver vuelo
					<Play
						aria-hidden
						className="group-hover:ml-4 group-hover:rotate-360 transition-all ease-in-out duration-300 size-4 fill-current"
					/>
				</Link>
			</div>
		</article>
	)
}
