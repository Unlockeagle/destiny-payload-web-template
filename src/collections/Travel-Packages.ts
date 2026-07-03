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
	FixedToolbarFeature,
	HeadingFeature,
	InlineToolbarFeature,
	lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { slugField, type CollectionConfig } from 'payload'

export const TravelPackages: CollectionConfig = {
	slug: 'travel-packages',
	labels: {
		singular: {
			en: 'Travel package',
			es: 'Paquete de viaje',
		},
		plural: {
			en: 'Travel Packages',
			es: '🏝️ Paquetes de viaje',
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
			'Administra los paquetes de viajes disponibles y configuraciones para organizar mejor las opciones de viaje dentro del panel administrativo de Destiny Trip.',
	},
	fields: [
		{
			type: 'tabs',
			tabs: [
				{
					label: 'Información General',
					fields: [
						{
							name: 'isFeatured',
							label: '⭐ Destacado en Home',
							type: 'checkbox',
							defaultValue: false,
						},
						{
							name: 'title',
							label: 'Titulo',
							type: 'text',
							required: true,
							admin: {
								description:
									'Ej: Paquete Todo Incluido Cancún 7 días, Min. 50 - Máx 60 caracteres - se usa como meta.tite ',
							},
						},
						{
							name: 'description',
							label: 'Descripción',
							type: 'textarea',
							required: true,
							admin: {
								description:
									'Min. 100 - Máx. 150 caracteres — se usa como meta.description',
							},
						},
						{
							name: 'cover_image',
							label: 'Imagen Principal',
							type: 'upload',
							relationTo: 'media',
							required: true,
						},
						{
							name: 'gallery',
							label: 'Galería de imágenes',
							type: 'array',
							fields: [
								{
									name: 'image',
									type: 'upload',
									relationTo: 'media',
									required: true,
								},
								{
									name: 'alt',
									label: 'Texto alternativo',
									type: 'text',
									required: true,
									admin: {
										description:
											'Descripción breve de la imagen usar 2 - 3 palabras, ayuda al SEO',
									},
								},
								{
									name: 'caption',
									label: 'Caption',
									type: 'textarea',
									required: true,
									admin: {
										description:
											'Descripción de la imagen, ayuda al SEO',
									},
								},
							],
						},
						{
							name: 'Destiny',
							label: 'Destino',
							type: 'text',
						},
						{
							name: 'category',
							label: 'Categoría',
							type: 'relationship',
							relationTo: 'categories',
						},
						{
							name: 'highlights',
							label: 'Características',
							type: 'relationship',
							relationTo: 'highlights',
							hasMany: true,
							filterOptions: { type: { contains: 'packages' } },
						},
						{
							name: 'relatedPost',
							label: '📖 Post Relacionado',
							type: 'relationship',
							relationTo: 'posts',
							hasMany: false,
						},
					],
				},
				{
					label: 'Servicios Incluidos',
					fields: [
						{
							name: 'includesFlight',
							label: '✈️ Incluye Vuelo',
							type: 'checkbox',
							defaultValue: false,
						},
						{
							name: 'flight',
							label: 'Vuelo',
							type: 'relationship',
							relationTo: 'flights',
							admin: {
								condition: (data) =>
									data?.includesFlight === true,
								description:
									'Selecciona el vuelo incluido en el paquete',
							},
						},
						{
							name: 'includesHotel',
							label: '🏨 Incluye Hotel',
							type: 'checkbox',
							defaultValue: false,
						},
						{
							name: 'hotel',
							label: 'Hotel',
							type: 'relationship',
							relationTo: 'hotels',
							admin: {
								condition: (data) =>
									data?.includesHotel === true,
								description:
									'Selecciona el hotel incluido en el paquete',
							},
						},
						{
							name: 'roomType',
							label: 'Tipo de Habitación',
							type: 'select',
							options: [
								{ label: '🛏️ Sencilla', value: 'single' },
								{ label: '🛏️🛏️ Doble', value: 'double' },
								{ label: '👨‍👩‍👧 Triple', value: 'triple' },
								{ label: '👑 Suite', value: 'suite' },
							],
							admin: {
								condition: (data) =>
									data?.includesHotel === true,
							},
						},
						// ── Crucero ─────────────────────────
						{
							name: 'includesCruise',
							label: '🛳️ Incluye Crucero',
							type: 'checkbox',
							defaultValue: false,
						},
						{
							name: 'cruise',
							label: 'Crucero',
							type: 'relationship',
							relationTo: 'cruises',
							admin: {
								condition: (data) =>
									data?.includesCruise === true,
							},
						},
						// ── Servicios extra ──────────────────
						{
							name: 'extraServices',
							label: '➕ Servicios Adicionales',
							type: 'relationship',
							relationTo: 'services',
							hasMany: true,
							admin: {
								description:
									'Traslados, tours, seguros, entradas...',
							},
						},
						// ── Resumen visual de lo que incluye ─
						{
							name: 'includes',
							label: '✅ ¿Qué incluye el paquete?',
							type: 'array',
							admin: {
								description:
									'Lista visible para el cliente en la página del paquete',
								initCollapsed: true,
								// components: {
								// 	RowLabel: ({ data }) =>
								// 		data?.item ?? 'Nuevo ítem', // TODO: Ver que es RowLabel
								// },
							},
							fields: [
								{
									name: 'item',
									label: 'Ítem incluido',
									type: 'text',
									required: true,
									admin: {
										description:
											'Ej: Vuelo de ida y vuelta, Desayuno incluido',
									},
								},
							],
						},
						// ── Qué NO incluye ───────────────────
						{
							name: 'excludes',
							label: '❌ ¿Qué NO incluye?',
							type: 'array',
							admin: {
								description:
									'Importante para evitar malentendidos con el cliente',
								initCollapsed: true,
								// components: {
								//     RowLabel: ({ data }) => data?.item ?? 'Nuevo ítem',
								// },
							},
							fields: [
								{
									name: 'item',
									label: 'Ítem no incluido',
									type: 'text',
									required: true,
									admin: {
										description:
											'Ej: Gastos personales, Visas, Propinas',
									},
								},
							],
						},
					],
				},
				{
					label: 'Capacidad y fechas',
					fields: [
						// ── Duración ────────────────────────
						{
							type: 'row',
							fields: [
								{
									name: 'days',
									label: 'Días',
									type: 'number',
									required: true,
									min: 1,
									admin: {
										description: 'Ej: 7',
										width: '50%',
									},
								},
								{
									name: 'nights',
									label: 'Noches',
									type: 'number',
									required: true,
									min: 0,
									admin: {
										description: 'Ej: 6',
										width: '50%',
									},
								},
							],
						},

						// ── Capacidad ───────────────────────
						{
							type: 'row',
							fields: [
								{
									name: 'minPersons',
									label: 'Mínimo de personas',
									type: 'number',
									defaultValue: 1,
									min: 1,
									admin: { width: '50%' },
								},
								{
									name: 'maxPersons',
									label: 'Máximo de personas',
									type: 'number',
									defaultValue: 10,
									admin: { width: '50%' },
								},
							],
						},

						// ── Tipos de pasajeros ───────────────
						{
							name: 'allowsChildren',
							label: 'Permite niños',
							type: 'checkbox',
							defaultValue: true,
						},
						{
							type: 'row',
							fields: [
								{
									name: 'childMinAge',
									label: 'Edad mínima niño',
									type: 'number',
									defaultValue: 2,
									admin: {
										condition: (data) =>
											data?.allowsChildren === true,
										width: '50%',
									},
								},
								{
									name: 'childMaxAge',
									label: 'Edad máxima niño',
									type: 'number',
									defaultValue: 12,
									admin: {
										condition: (data) =>
											data?.allowsChildren === true,
										width: '50%',
									},
								},
							],
						},
						{
							name: 'allowsInfants',
							label: 'Permite bebés',
							type: 'checkbox',
							defaultValue: false,
						},
						{
							name: 'infantMaxAge',
							label: 'Edad máxima bebé (años)',
							type: 'number',
							defaultValue: 2,
							admin: {
								condition: (data) =>
									data?.allowsInfants === true,
							},
						},

						// ── Fechas disponibles ───────────────
						{
							name: 'availableDates',
							label: '📅 Fechas Disponibles',
							type: 'array',
							admin: {
								description:
									'Agrega las salidas disponibles con sus cupos',
								initCollapsed: true,
								// components: {
								// 	RowLabel: ({ data }) =>
								// 		data?.departureDate
								// 			? new Date(
								// 					data.departureDate,
								// 				).toLocaleDateString('es-VE') // TODO!!!
								// 			: 'Nueva fecha',
								// },
							},
							fields: [
								{
									type: 'row',
									fields: [
										{
											name: 'departureDate',
											label: 'Fecha de salida',
											type: 'date',
											required: true,
											admin: { width: '50%' },
										},
										{
											name: 'returnDate',
											label: 'Fecha de regreso',
											type: 'date',
											admin: { width: '50%' },
										},
									],
								},
								{
									type: 'row',
									fields: [
										{
											name: 'spotsTotal',
											label: 'Cupos totales',
											type: 'number',
											required: true,
											admin: { width: '50%' },
										},
										{
											name: 'spotsAvailable',
											label: 'Cupos disponibles',
											type: 'number',
											required: true,
											admin: { width: '50%' },
										},
									],
								},
								{
									name: 'priceOverride',
									label: 'Precio especial para esta fecha',
									type: 'number',
									admin: {
										description:
											'Deja vacío para usar el precio base del paquete',
									},
								},
								{
									name: 'status',
									label: 'Estado',
									type: 'select',
									defaultValue: 'available',
									options: [
										{
											label: '✅ Disponible',
											value: 'available',
										},
										{
											label: '⚠️ Últimos cupos',
											value: 'limited',
										},
										{
											label: '❌ Agotado',
											value: 'sold_out',
										},
										{
											label: '🔒 Cerrado',
											value: 'closed',
										},
									],
								},
							],
						},
					],
				},
				{
					label: 'Precios',
					fields: [
						{
							name: 'priceType',
							label: 'Tipo de precio',
							type: 'select',
							required: true,
							defaultValue: 'per_person',
							options: [
								{ label: 'Por persona', value: 'per_person' },
								{ label: 'Por grupo', value: 'per_group' },
								{ label: 'Precio fijo', value: 'fixed' },
							],
						},
						{
							name: 'price',
							label: 'Precio base $',
							type: 'number',
							required: true,
							admin: {
								description:
									'Precio por persona o total según el tipo',
							},
						},
						{
							name: 'childPrice',
							label: 'Precio niño $',
							type: 'number',
							defaultValue: 0,
							admin: {
								condition: (data) =>
									data?.allowsChildren === true,
								description:
									'Dejar en 0 si aplica el mismo precio',
							},
						},
						{
							name: 'infantPrice',
							label: 'Precio bebé $',
							type: 'number',
							defaultValue: 0,
							admin: {
								condition: (data) =>
									data?.allowsInfants === true,
								description: 'Dejar en 0 si viajan gratis',
							},
						},
						{
							name: 'hasDiscount',
							label: 'Tiene descuento',
							type: 'checkbox',
							defaultValue: false,
						},
						{
							type: 'row',
							fields: [
								{
									name: 'startDiscount',
									label: 'Inicio promoción',
									type: 'date',
									admin: {
										condition: (data) =>
											data?.hasDiscount === true,
										width: '50%',
									},
								},
								{
									name: 'endDiscount',
									label: 'Fin promoción',
									type: 'date',
									admin: {
										condition: (data) =>
											data?.hasDiscount === true,
										width: '50%',
									},
								},
							],
						},
						{
							name: 'discountPrice',
							label: 'Precio con descuento $',
							type: 'number',
							admin: {
								condition: (data) => data?.hasDiscount === true,
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
							name: 'longDescription',
							label: 'Descripción larga',
							type: 'richText',
							editor: lexicalEditor({
								features: ({ defaultFeatures }) => [
									...defaultFeatures,
									FixedToolbarFeature(),
									InlineToolbarFeature(),
									HeadingFeature({
										enabledHeadingSizes: ['h2', 'h3', 'h4'],
									}),
								],
							}),
							admin: {
								description: 'Mínimo 300 palabras para SEO',
							},
						},
						{
							name: 'itinerary',
							label: '🗓️ Itinerario',
							type: 'array',
							admin: {
								description: 'Día a día del paquete',
								initCollapsed: true,
								// components: {
								// 	RowLabel: ({ data }) =>
								// 		data?.day
								// 			? `Día ${data.day}`
								// 			: 'Nuevo día',
								// },
							},
							fields: [
								{
									type: 'row',
									fields: [
										{
											name: 'day',
											label: 'Día',
											type: 'number',
											required: true,
											admin: { width: '20%' },
										},
										{
											name: 'title',
											label: 'Título del día',
											type: 'text',
											required: true,
											admin: {
												description:
													'Ej: Llegada a Cancún y check-in',
												width: '80%',
											},
										},
									],
								},
								{
									name: 'description',
									label: 'Descripción del día',
									type: 'textarea',
									required: true,
								},
								{
									name: 'meals',
									label: 'Comidas incluidas',
									type: 'select',
									hasMany: true,
									options: [
										{
											label: '🌅 Desayuno',
											value: 'breakfast',
										},
										{
											label: '☀️ Almuerzo',
											value: 'lunch',
										},
										{ label: '🌙 Cena', value: 'dinner' },
									],
								},
							],
						},
						{
							name: 'faqs',
							label: 'Preguntas Frecuentes',
							type: 'array',
							admin: {
								initCollapsed: true,
								components: {
									// RowLabel: '@/components/RowLabels/RowLabel',
									RowLabel: {
										path: '@/components/RowLabels/RowLabel',
										exportName: 'RowLabel',
									},
								},
								// components: {
								//     RowLabel: ({ data }) => data?.question ?? 'Nueva pregunta', // TODO!!
								// },
							},
							fields: [
								{
									name: 'question',
									label: 'Pregunta',
									type: 'text',
									required: true,
								},
								{
									name: 'answer',
									label: 'Respuesta',
									type: 'textarea',
									required: true,
								},
							],
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
		slugField({
			position: 'sidebar',
		}),
	],
}
