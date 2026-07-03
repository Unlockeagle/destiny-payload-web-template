import { FlightCard } from '../blocks/FlightCard'
import config from '@payload-config'
import { getPayload } from 'payload'

export const FeaturedFlights = async () => {
	const payload = await getPayload({ config })

	const flights = await payload.find({
		collection: 'flights',
		where: {
			and: [
				{ _status: { equals: 'published' } },
				{ isFeatured: { equals: true } },
			],
		},
		sort: '-publishedAt',
		limit: 6,
		depth: 2,
	})

	if (!flights) return <p>No hay vuelos</p> // impide errores cundo no hay vuelos
	return (
		<section className="featured-flights">
			<h2>Vuelos Destacados</h2>
			<div className="featured-flights__grid bg-red-400 grid grid-cols-1 gap-2">
				{flights.docs.map((flight) => {
					return <FlightCard key={flight.id} flight={flight} />
				})}
			</div>
		</section>
	)
}
