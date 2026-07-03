import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'
import { slugField, type CollectionConfig } from 'payload'

export const TypesFlights: CollectionConfig = {
	slug: 'types-flights',
	labels: {
		singular: {
			en: 'Type flight',
			es: '🛩️ Tipo de Vuelo',
		},
		plural: {
			en: 'Types Flights',
			es: '🛩️ Tipos de Vuelos',
		},
	},
	versions: {
		drafts: true,
	},
	access: {
		create: authenticated,
		delete: authenticated,
		read: anyone,
		update: authenticated,
	},
	admin: {
		useAsTitle: 'title',
		description:
			'Administra los tipos de vuelos disponibles y configuraciones para organizar mejor las opciones de viaje dentro del panel administrativo de Destiny Trip.',
	},
	fields: [
		{
			name: 'title',
			label: 'Titulo',
			type: 'text',
			required: true,
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
		slugField({
			position: 'sidebar',
		}),
	],
}
