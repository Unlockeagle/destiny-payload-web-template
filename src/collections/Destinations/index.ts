import type { CollectionConfig } from 'payload'
import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'
import { Banner } from '@/blocks/Banner/config'
import { CallToAction } from '@/blocks/CallToAction/config'
import { Content } from '@/blocks/Content/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import {
	MetaDescriptionField,
	MetaImageField,
	MetaTitleField,
	OverviewField,
	PreviewField,
} from '@payloadcms/plugin-seo/fields'
import {
	revalidateDestination,
	revalidateDestinationDelete,
} from './hooks/revalidateDestination'

export const Destinations: CollectionConfig<'destinations'> = {
	slug: 'destinations',
	labels: {
		singular: {
			en: 'Destination',
			es: 'Destino',
		},
		plural: {
			en: 'Destinations',
			es: '📍 Destinos',
		},
	},
	versions: {
		drafts: true,
	},
	admin: {
		useAsTitle: 'name',
		defaultColumns: ['name', 'country', '_status'],
		description:
			'Gestiona los destinos de Destiny Trip: su contenido, su SEO y su página pública. Los vuelos apuntan a un destino.',
	},
	access: {
		create: authenticated,
		delete: authenticated,
		read: anyone,
		update: authenticated,
	},
	hooks: {
		afterChange: [revalidateDestination],
		afterDelete: [revalidateDestinationDelete],
	},

	fields: [
		{
			type: 'tabs',
			tabs: [
				{
					label: 'Información del destino',
					fields: [
						{
							type: 'row',
							fields: [
								{
									name: 'name',
									label: '📍 Nombre del destino',
									type: 'text',
									required: true,
									admin: {
										description:
											'Ej: Madrid, Firenze, Los Roques...',
										width: '50%',
									},
								},
								{
									name: 'country',
									label: '🗺️ País',
									type: 'text',
									required: true,
									admin: {
										description:
											'Ej: España, Italia, Venezuela...',
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
									'Descripción corta para tarjetas y meta, min. 100 - max. 150 caracteres',
							},
						},
						{
							name: 'cover_image',
							label: '🖼️ Imagen Principal',
							type: 'upload',
							relationTo: 'media',
							required: true,
							admin: {
								description: 'Imagen Principal del destino',
							},
						},
					],
				},

				{
					label: 'Contenido',
					fields: [
						{
							name: 'layout',
							label: '🧱 Bloques',
							type: 'blocks',
							blocks: [Content, MediaBlock, CallToAction, Banner],
							admin: {
								initCollapsed: true,
								description:
									'Qué hacer, clima, documentos... el contenido extendido del destino',
							},
						},
						{
							name: 'relatedPosts',
							label: '📖 Posts relacionados',
							type: 'relationship',
							relationTo: 'posts',
							hasMany: true,
							admin: {
								description:
									'Posts del blog que hablan de este destino',
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
							hasGenerateFn: true,
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
				description:
					'URL del destino — se genera automáticamente desde el nombre',
			},
			hooks: {
				beforeChange: [
					({ data, value }) => {
						if (value) return value

						return (data?.name ?? '')
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
