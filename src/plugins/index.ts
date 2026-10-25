import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import {
	GenerateDescription,
	GenerateTitle,
	GenerateURL,
} from '@payloadcms/plugin-seo/types'
import {
	FixedToolbarFeature,
	HeadingFeature,
	lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'

import { getServerSideURL } from '@/utilities/getURL'

const generateTitle: GenerateTitle = ({ doc, collectionConfig }) => {
	switch (collectionConfig?.slug) {
		case 'flights':
			// `title` ({origin}→{destination.name}) lo genera el hook de Flights
			return doc?.title
				? `Vuelo ${doc.title} | Destiny Trip`
				: 'Destiny Trip'

		case 'posts':
			return doc?.title
				? `${doc.title} | Blog Destiny Trip`
				: 'Blog | Destiny Trip'

		case 'travel-packages':
			return doc?.title
				? `${doc.title} | Paquetes Destiny Trip`
				: 'Paquete | Destiny Trip'

		case 'destinations':
			return doc?.name
				? `${doc.name} | Destinos Destiny Trip`
				: 'Destino | Destiny Trip'

		default:
			return 'Destiny Trip'
	}
}

const generateDescription: GenerateDescription = ({
	doc,
	collectionConfig,
}) => {
	switch (collectionConfig?.slug) {
		case 'flights':
			return doc?.description ?? ''

		case 'posts':
			return doc?.excerpt ?? ''

		case 'travel-packages':
			return doc?.description ?? ''

		case 'destinations':
			return doc?.description ?? ''

		default:
			return ''
	}
}

const generateURL: GenerateURL = ({ doc, collectionConfig }) => {
	const base = getServerSideURL()

	if (!doc?.slug) return base

	switch (collectionConfig?.slug) {
		case 'flights':
			// typeFlight puede ser un objeto populated o un string
			const type = doc?.typeFlight?.slug ?? 'internacionales'
			return doc?.slug ? `${base}/vuelos/${type}/${doc.slug}` : base

		case 'posts':
			return doc?.slug ? `${base}/blog/${doc.slug}` : base

		case 'travel-packages':
			return doc?.slug ? `${base}/paquete/${doc.slug}` : base

		case 'destinations':
			return doc?.slug ? `${base}/destinos/${doc.slug}` : base

		default:
			return base
	}
}

export const plugins: Plugin[] = [
	redirectsPlugin({
		collections: ['pages', 'posts'],
		overrides: {
			// @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
			fields: ({ defaultFields }) => {
				return defaultFields.map((field) => {
					if ('name' in field && field.name === 'from') {
						return {
							...field,
							admin: {
								description:
									'You will need to rebuild the website when changing this field.',
							},
						}
					}
					return field
				})
			},
			hooks: {
				afterChange: [revalidateRedirects],
			},
		},
	}),
	nestedDocsPlugin({
		collections: ['categories'],
		generateURL: (docs) =>
			docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
	}),
	seoPlugin({
		generateTitle,
		generateDescription,
		generateURL,
		// Solo colecciones sin pestaña `meta` propia: si no, el grupo `meta` del
		// plugin (sin `image`) pisa al definido a mano. Los endpoints "Generar"
		// funcionan para todas las colecciones aunque no estén en esta lista.
		collections: ['cruises'],
	}),

	formBuilderPlugin({
		fields: {
			payment: false,
		},
		formOverrides: {
			fields: ({ defaultFields }) => {
				return defaultFields.map((field) => {
					if (
						'name' in field &&
						field.name === 'confirmationMessage'
					) {
						return {
							...field,
							editor: lexicalEditor({
								features: ({ rootFeatures }) => {
									return [
										...rootFeatures,
										FixedToolbarFeature(),
										HeadingFeature({
											enabledHeadingSizes: [
												'h1',
												'h2',
												'h3',
												'h4',
											],
										}),
									]
								},
							}),
						}
					}
					return field
				})
			},
		},
	}),
	searchPlugin({
		collections: ['posts'],
		beforeSync: beforeSyncWithSearch,
		searchOverrides: {
			fields: ({ defaultFields }) => {
				return [...defaultFields, ...searchFields]
			},
		},
	}),
]
