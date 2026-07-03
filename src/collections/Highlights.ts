import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'
import { slugField, type CollectionConfig } from 'payload'

export const Highlights: CollectionConfig = {
	slug: 'highlights',
	labels: {
		singular: {
			en: 'Highlight',
			es: '✨ Punto clave',
		},
		plural: {
			en: 'Highlights',
			es: '✨ Puntos clave',
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
		defaultColumns: ['title', 'type', 'icon'],
		description:
			'Gestiona las características o elementos destacados que se mostrarán en la plataforma para resaltar promociones, destinos, servicios y experiencias importantes dentro de los vuelos y cruceros Destiny Trip.',
	},
	fields: [
		{
			name: 'title',
			label: 'Etiqueta',
			type: 'text',
			required: true,
			unique: true,
			admin: {
				description:
					'Ej: Vuelo directo, sin escalas, Equipaje incluido, etc...',
			},
		},
		{
			name: 'icon',
			label: 'Icono',
			type: 'text',
			admin: {
				description: 'Ej: Airplane, Bag, Pool, etc...',
			},
		},
		{
			name: 'type',
			label: 'Aplica a',
			type: 'select',
			options: [
				{ label: '✈️ Vuelos', value: 'flights' },
				{ label: '🚢 Cruceros', value: 'cruises' },
				{ label: '🏨 Hoteles', value: 'hotels' },
				{ label: '📦 Paquetes', value: 'packages' },
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
		slugField({
			position: 'sidebar',
		}),
	],
}
