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

	// ✅ filtra highlights inválidos antes del map
	const highlights = (flight.highlights ?? []).filter(
		(h): h is Extract<typeof h, { id: string }> =>
			typeof h === 'object' && h !== null,
	)
	return (
		<article className="flight-card group rounded-lg overflow-hidden shadow-slate-600/30 shadow-sm flex-none basis-80 snap-center ">
			{/* flight ---->>> imagen */}
			{flight.cover_image && typeof flight.cover_image === 'object' && (
				<div className="flight-card__images h-56 relative overflow-hidden">
					<img
						className="w-full h-full object-cover group-hover:scale-105 transition-transform ease-in-out duration-300"
						src={flight.cover_image.sizes?.small?.url ?? ''}
						alt={flight.cover_image.alt ?? ''}
					/>
					{/* flight --->>> badge */}
					{flight.isFeatured &&
						typeof flight.isFeatured === 'boolean' && (
							<span className=" absolute bg-amber-300 text-slate-950 rounded-2xl px-2 py-1 text-xs top-2 left-2">
								Destacado
							</span>
						)}
				</div>
			)}

			{/* flight --->>> content */}
			<div className="flight-card__content p-4 w-full flex flex-col justify-between">
				<div className=" flex flex-col gap-1">
					<h3 className="text-sm font-semibold">
						{flight.origin} → {destination?.name}
					</h3>
					<p className="text-sm text-slate-600 dark:text-slate-400 truncate">
						{flight.description}
					</p>
					{/* flight --->>> highlight */}
					{/* ✅ map limpio sin returns condicionales */}
					{/* {highlights.length > 0 && (
						<ul>
							{highlights.map((h) => (
								<li key={h.id}>
									{h.icon} {h.title}
								</li>
							))}
						</ul>
					)} */}
					{/* flight --->>> price */}
					<div className="flight-highlights__price-original max-h-12 text-sm">
						<p>
							Desde{' '}
							{hasActiveDiscount && <span>$ {flight.price}</span>}
							<strong>$ {displayPrice}</strong>
						</p>
					</div>
				</div>

				{/* flight --->>> CTA */}

				<Link
					href={href}
					className="group inline-flex items-center gap-2 mt-4  bg-pink-600 text-zinc-50 text-center rounded-md px-4 py-2 font-medium transition-opacity hover:opacity-90"
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
