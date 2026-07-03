import type { Block } from 'payload'

export const PruebaBlockContent: Block = {
	slug: 'pruebaBlockContent',
	labels: {
		singular: {
			en: 'Proof Block Content',
			es: 'Prueba Bloque de contenido',
		},
		plural: {
			en: 'Proof Blocks Contents',
			es: 'Prueba Bloques de contenido',
		},
	},
	fields: [
		{
			name: 'title',
			type: 'text',
			label: '✨ Titulo',
			required: true,
		},
		{ name: 'subTitle', type: 'textarea', label: '👉 Sub-titulo' },
	],
}
