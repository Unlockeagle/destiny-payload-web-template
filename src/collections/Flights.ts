import type { CollectionConfig } from 'payload'
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

	fields: [
		{
			name: 'title',
			type: 'text',
			admin: {
				hidden: true,
			},
			hooks: {
				beforeChange: [
					({ data }) => {
						return `${data?.origin ?? ''}→${data?.destination ?? ''}`
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
									label: '🛬 Ciudad Destino',
									type: 'text',
									required: true,
									admin: {
										description:
											'Ej: Madrid, Firenze, Los Roques...',
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
								{
									name: 'country',
									label: '🗺️ País del destino',
									type: 'text',
									required: true,
									admin: {
										description:
											'Ej: España, Italia, Argentina...',
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
						{
							name: 'relatedPost',
							label: '📖 Post relacionado',
							type: 'relationship',
							relationTo: 'posts',
							hasMany: false,
							admin: {
								description:
									'Post del blog que habla de este vuelo — genera tráfico SEO hacia esta página',
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
					({ data, value }) => {
						if (value) return value

						const origin = data?.origin ?? ''
						const destination = data?.destination ?? ''

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
