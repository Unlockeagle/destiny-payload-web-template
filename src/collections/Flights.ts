import type { CollectionConfig, PayloadRequest } from 'payload'
import { slugField } from 'payload'
import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'
import {
	MetaDescriptionField,
	MetaImageField,
	MetaTitleField,
	OverviewField,
	PreviewField,
} from '@payloadcms/plugin-seo/fields'
import {
	revalidateFlightDestination,
	revalidateFlightDestinationDelete,
} from '@/hooks/revalidateFlightDestination'

// `destination` llega como id en los hooks; si viene populado se usa tal cual
const resolveDestinationName = async (
	destination: unknown,
	req: PayloadRequest,
): Promise<string> => {
	if (!destination) return ''

	if (typeof destination === 'object' && 'name' in destination) {
		return String(destination.name ?? '')
	}

	try {
		const doc = await req.payload.findByID({
			collection: 'destinations',
			id: String(destination),
			depth: 0,
			req,
		})
		return doc?.name ?? ''
	} catch {
		return ''
	}
}

export const Flights: CollectionConfig = {
	slug: 'flights',
	labels: {
		singular: {
			en: 'Flight',
			es: 'Vuelo',
		},
		plural: {
			en: 'Flights',
			es: '✈️ Vuelos',
		},
	},
	versions: {
		drafts: true,
	},
	admin: {
		useAsTitle: 'title',
		defaultColumns: ['title', 'typeFlight', 'price', '_status'],
		description:
			'Gestiona y organiza la colección de vuelos disponibles para ofrecer a tus clientes las mejores opciones de viaje desde el panel administrativo de Destiny Trip.',
	},
	access: {
		create: authenticated,
		delete: authenticated,
		read: anyone,
		update: authenticated,
	},
	hooks: {
		afterChange: [revalidateFlightDestination],
		afterDelete: [revalidateFlightDestinationDelete],
	},

	fields: [
		{
			name: 'title',
			type: 'text',
			admin: {
				hidden: true,
			},
			hooks: {
				beforeChange: [
					async ({ data, req }) => {
						const destinationName = await resolveDestinationName(
							data?.destination,
							req,
						)
						return `${data?.origin ?? ''}→${destinationName}`
					},
				],
			},
		},
		{
			type: 'tabs',
			tabs: [
				{
					label: 'Información del vuelo',
					fields: [
						{
							name: 'isFeatured',
							label: 'Destacado en Home',
							type: 'checkbox',
							defaultValue: false,
							admin: {
								description:
									'⭐ Mostrar en el carousel más vendidos',
							},
						},
						{
							type: 'row',
							fields: [
								{
									name: 'origin',
									label: '🛫 Ciudad de Origen',
									type: 'text',
									required: true,
									admin: {
										description:
											'Ej: Caracas (De donde sale el vuelo)',
										width: '50%',
									},
								},
								{
									name: 'destination',
									label: '🛬 Destino',
									type: 'relationship',
									relationTo: 'destinations',
									required: true,
									admin: {
										description:
											'Selecciona el destino (se gestionan en 📍 Destinos)',
										width: '50%',
									},
								},
							],
						},
						{
							type: 'row',
							fields: [
								{
									name: 'typeFlight',
									label: '✈️ Tipo de vuelo',
									type: 'relationship',
									relationTo: 'types-flights',
									admin: {
										width: '50%',
									},
								},
							],
						},

						{
							name: 'description',
							label: 'ℹ️ Descripción',
							type: 'textarea',
							required: true,
							admin: {
								description:
									'Descripción corta, min. 100 - max. 150 caracteres',
							},
						},

						{
							name: 'cover_image',
							label: '🖼️ Imagen Principal',
							type: 'upload',
							relationTo: 'media',
							required: true,
							admin: {
								description: 'Imagen Principal del vuelo',
							},
						},
					],
				},

				{
					label: 'Precios',
					fields: [
						{
							name: 'price',
							label: '💸 Precio $',
							type: 'number',
							required: true,
							admin: {
								description:
									'Ej: 1500 (sin símbolos ni puntos)',
							},
						},
						{
							name: 'hasDiscount',
							label: 'Descuento',
							type: 'checkbox',
							defaultValue: false,
						},
						{
							type: 'row',
							fields: [
								{
									name: 'startDiscount',
									label: '🕐 Fecha de inicio de la promoción',
									type: 'date',
									admin: {
										condition: (data) =>
											data?.hasDiscount === true,
										description:
											'Fecha de inicio de la promoción',
										width: '50%',
									},
								},
								{
									name: 'endDiscount',
									label: '🕝 Fecha de finalización de la promoción',
									type: 'date',
									admin: {
										condition: (data) =>
											data?.hasDiscount === true,
										description:
											'Fecha de final de la promoción',
										width: '50%',
									},
								},
							],
						},

						{
							name: 'discountPrice',
							label: '💵 Precio con descuento $',
							type: 'number',
							admin: {
								condition: (data) => data?.hasDiscount === true,
								description:
									'Precio final después del descuento',
							},
							hooks: {
								beforeChange: [
									({ siblingData, value }) => {
										if (!siblingData.hasDiscount) return 0
										return value
									},
								],
							},
						},
					],
				},

				{
					label: 'Contenido',
					fields: [
						{
							name: 'highlights',
							label: '✨Puntos Claves',
							type: 'relationship',
							relationTo: 'highlights',
							hasMany: true,
							filterOptions: {
								type: { contains: 'flights' },
							},
							admin: {
								description:
									'Selecciona las características para este vuelo',
							},
						},
					],
				},

				{
					name: 'meta',
					label: 'SEO',
					fields: [
						OverviewField({
							titlePath: 'meta.title',
							descriptionPath: 'meta.description',
							imagePath: 'meta.image',
						}),
						MetaTitleField({
							hasGenerateFn: true,
						}),
						MetaDescriptionField({
							hasGenerateFn: true, // ← AÑADIR ESTO
						}),
						MetaImageField({
							relationTo: 'media',
						}),
						PreviewField({
							hasGenerateFn: true,
							titlePath: 'meta.title',
							descriptionPath: 'meta.description',
						}),
					],
				},
			],
		},
		{
			name: 'publishedAt',
			type: 'date',
			defaultValue: () => new Date(),
			admin: {
				date: {
					pickerAppearance: 'dayAndTime',
				},
				position: 'sidebar',
			},
			hooks: {
				beforeChange: [
					({ siblingData, value }) => {
						if (siblingData._status === 'published' && !value) {
							return new Date()
						}
						return value
					},
				],
			},
		},
		{
			name: 'slug',
			label: 'Slug',
			type: 'text',
			unique: true,
			index: true,
			admin: {
				position: 'sidebar',
				description: 'URL del vuelo — se genera automáticamente',
			},
			hooks: {
				beforeChange: [
					async ({ data, req, value }) => {
						if (value) return value

						const origin = data?.origin ?? ''
						const destination = await resolveDestinationName(
							data?.destination,
							req,
						)

						return `${origin} ${destination}`
							.toLowerCase()
							.normalize('NFD')
							.replace(/[\u0300-\u036f]/g, '')
							.replace(/[^a-z0-9\s-]/g, '')
							.replace(/\s+/g, '-')
							.replace(/-+/g, '-')
							.trim()
					},
				],
			},
		},
	],
}
