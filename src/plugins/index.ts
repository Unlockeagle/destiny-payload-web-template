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
			// ✅ lee los campos reales, no el virtual
			return doc?.origin && doc?.destination
				? `Vuelo ${doc.origin} → ${doc.destination} | Destiny Trip`
				: 'Destiny Trip'

		case 'posts':
			return doc?.title
				? `${doc.title} | Blog Destiny Trip`
				: 'Blog | Destiny Trip'

		case 'travel-packages':
			return doc?.title
				? `${doc.title} | Paquetes Destiny Trip`
				: 'Paquete | Destiny Trip'

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
		collections: ['flights', 'cruises', 'posts', 'travel-packages'],
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
