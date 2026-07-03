import type { Block } from 'payload'

export const FeaturedFlightsBlock: Block = {
	slug: 'featuredFlights',
	labels: {
		singular: 'Sección de Vuelos Destacados',
		plural: 'Secciones de Vuelos',
	},
	fields: [
		{
			name: 'title',
			type: 'text',
			label: 'Título',
		},
		{
			name: 'subtitle',
			type: 'text',
			label: 'Subtítulo',
		},
		{
			name: 'selectionMode',
			type: 'radio',
			label: 'Modo de selección',
			defaultValue: 'manual',
			options: [
				{ label: '✋ Selección manual', value: 'manual' },
				{ label: '⭐ Solo destacados', value: 'featured' },
				{ label: '🕐 Más recientes', value: 'latest' },
			],
		},
		{
			name: 'flights',
			type: 'relationship',
			relationTo: 'flights',
			hasMany: true,
			label: 'Vuelos',
			maxRows: 12,
			// Solo visible cuando el modo es manual
			admin: {
				condition: (_, siblingData) =>
					siblingData?.selectionMode === 'manual',
				description:
					'Seleccione los vuelos que deseas mostrar en esta sección.',
			},
		},
		{
			name: 'limit',
			type: 'number',
			label: 'Límite de vuelos',
			defaultValue: 6,
			min: 1,
			max: 12,
			// Solo visible en modos automáticos
			admin: {
				condition: (_, siblingData) =>
					siblingData?.selectionMode !== 'manual',
			},
		},
		{
			name: 'disableInnerContainer',
			type: 'checkbox',
			label: 'Deshabilitar contenedor interno',
			defaultValue: false,
		},
	],
}
