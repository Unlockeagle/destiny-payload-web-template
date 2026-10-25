import type { Flight } from '@/payload-types'

type FlightPriceFields = Pick<
	Flight,
	'price' | 'hasDiscount' | 'discountPrice' | 'startDiscount' | 'endDiscount'
>

export const isDiscountActive = (
	flight: FlightPriceFields,
	now: Date = new Date(),
): boolean => {
	if (flight.hasDiscount !== true) return false
	if (!flight.discountPrice || flight.discountPrice <= 0) return false
	if (flight.startDiscount && new Date(flight.startDiscount) > now)
		return false
	if (flight.endDiscount && now > new Date(flight.endDiscount)) return false

	return true
}

export const getFlightDisplayPrice = (
	flight: FlightPriceFields,
	now: Date = new Date(),
): number =>
	isDiscountActive(flight, now)
		? (flight.discountPrice as number)
		: flight.price
