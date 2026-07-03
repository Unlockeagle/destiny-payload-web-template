import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'
import { slugField, type CollectionConfig } from 'payload'

export const Hotels: CollectionConfig = {
	slug: 'hotels',
	labels: {
		singular: {
			en: 'Hotel',
			es: '🛌 Hotel y alojamiento',
		},
		plural: {
			en: 'Hotels',
			es: '🛌 Hoteles y alojamientos',
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
		defaultColumns: ['title', 'address', 'cover_image', 'country'],
		description:
			'Colección de hoteles disponibles para gestionar, organizar y ofrecer las mejores opciones de alojamiento a tus clientes desde el panel administrativo de Destiny Trip.',
	},
	fields: [
		{
			type: 'tabs',
			tabs: [
				// ─── TAB: Contenido general ───────────────────────────────
				{
					label: 'Información general',
					fields: [
						{
							name: 'title',
							type: 'text',
							label: '🛎️ Nombre del hotel',
							required: true,
							unique: true,
						},
						{
							name: 'address',
							type: 'textarea',
							label: '📍 Dirección del hotel',
						},
						{
							type: 'row',
							fields: [
								{
									name: 'country',
									type: 'text',
									label: '🌍 País',
								},
								{
									name: 'state',
									type: 'text',
									label: '📌 Estado o provincia',
								},
							],
						},
						{
							name: 'info',
							type: 'array',
							label: 'Información adicional de contacto',

							admin: {
								description:
									'Agrega teléfonos, emails, redes sociales o cualquier dato de contacto',
								components: {
									RowLabel: {
										path: '@/components/RowLabels/RowInfoLabel#RowInfoLabel',
									},
								},
							},
							fields: [
								{
									name: 'type',
									type: 'select',
									label: 'Tipo',
									required: true,
									options: [
										{
											label: '📞 Teléfono',
											value: 'phone',
										},
										{
											label: '📱 WhatsApp',
											value: 'whatsapp',
										},
										{ label: '📧 Email', value: 'email' },
										{
											label: '👔 Nombre de contacto',
											value: 'contact',
										},
										{
											label: '📍 Numero Postal',
											value: 'zip',
										},
										{
											label: '🌐 Sitio Web',
											value: 'website',
										},
										{
											label: '📘 Facebook',
											value: 'facebook',
										},
										{
											label: '📸 Instagram',
											value: 'instagram',
										},
										{
											label: '💼 LinkedIn',
											value: 'linkedin',
										},
										{ label: '🎵 TikTok', value: 'tiktok' },
									],
								},
								{
									name: 'label',
									type: 'text',
									label: 'Etiqueta',
									admin: {
										description:
											'Ej: Oficina Principal, Soporte, Ventas.',
									},
								},
								{
									name: 'value',
									type: 'text',
									label: 'Valor',
									required: true,
									admin: {
										description: 'Ej: +58 412 123 4567',
									},
								},
								{
									name: 'isPublic',
									type: 'checkbox',
									label: 'Visible en el sitio',
									defaultValue: true,
								},
							],
						},
						{
							name: 'cover_image',
							type: 'upload',
							label: 'Imagen Principal',
							relationTo: 'media',
						},
						{
							name: 'gallery_images',
							type: 'upload',
							label: 'Galería de imágenes',
							relationTo: 'media',
							hasMany: true,
							maxRows: 5,
						},
					],
				},

				// ─── TAB: Precios ─────────────────────────────────────────
				{
					label: 'Precio',
					fields: [
						{
							name: 'price',
							label: 'Precio',
							type: 'number',
							admin: {
								description:
									'Precio alojamiento por persona en $',
							},
							defaultValue: 0,
						},
						{
							name: 'expiration-date',
							label: 'Fecha de Expiración',
							type: 'date',
							admin: {
								description: 'Fecha final del precio',
							},
						},
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

		slugField({
			position: 'sidebar',
		}),
	],
}
