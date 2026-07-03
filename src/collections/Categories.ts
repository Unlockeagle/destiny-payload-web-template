import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { slugField } from 'payload'

export const Categories: CollectionConfig = {
	slug: 'categories',
	labels: {
		singular: {
			en: 'Category',
			es: '📦 Categoría',
		},
		plural: {
			en: 'Categories',
			es: '📦 Categorías',
		},
	},
	access: {
		create: authenticated,
		delete: authenticated,
		read: anyone,
		update: authenticated,
	},
	admin: {
		useAsTitle: 'title',
	},
	fields: [
		{
			name: 'title',
			label: 'Titulo',
			type: 'text',
			required: true,
		},
		{
			name: 'description',
			label: 'Description',
			type: 'textarea',
			required: true,
		},
		{
			name: 'longDescription',
			label: 'Description larga',
			type: 'richText',
			required: true,
			admin: {
				description:
					'La descripción debe contener al menos 300 caracteres para garantizar información clara, completa y detallada sobre la categoría. (SEO)',
			},
		},
		{
			name: 'faqs',
			label: 'Preguntas Frecuentes',
			type: 'array',
			admin: {
				description:
					'Genera schema FAQPage → rich snippets en Google. Mínimo 3 preguntas.',
				initCollapsed: true, // empieza collapsed para no saturar el admin
				// components: {
				//         RowLabel: ({ data }) => data?.question ?? 'Nueva pregunta',
				//     },
			},
			fields: [
				{
					name: 'question',
					label: 'Pregunta',
					type: 'text',
					required: true,
					admin: {
						description:
							'Ej: ¿Cuánto cuesta volar de Caracas a Madrid?',
					},
				},
				{
					name: 'answer',
					label: 'Respuesta',
					type: 'text',
					required: true,
					admin: {
						description:
							'Respuesta clara y concisa. Mín. 50 caracteres.',
					},
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
		slugField({
			position: 'sidebar',
		}),
	],
}
