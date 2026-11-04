import type { Field } from 'payload'

import {
	FixedToolbarFeature,
	HeadingFeature,
	InlineToolbarFeature,
	lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { linkGroup } from '@/fields/linkGroup'

export const hero: Field = {
	name: 'hero',
	type: 'group',
	fields: [
		{
			name: 'type',
			type: 'select',
			defaultValue: 'lowImpact',
			label: 'Type',
			options: [
				{
					label: 'None',
					value: 'none',
				},
				{
					label: 'High Impact',
					value: 'highImpact',
				},
				{
					label: 'Medium Impact',
					value: 'mediumImpact',
				},
				{
					label: 'Low Impact',
					value: 'lowImpact',
				},
				{
					label: 'Destiny Hero',
					value: 'destinyHero',
				},
			],
			required: true,
		},
		{
			name: 'richText',
			type: 'richText',
			editor: lexicalEditor({
				features: ({ rootFeatures }) => {
					return [
						...rootFeatures,
						HeadingFeature({
							enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'],
						}),
						FixedToolbarFeature(),
						InlineToolbarFeature(),
					]
				},
			}),
			label: false,
		},
		{
			name: 'textSize',
			type: 'select',
			defaultValue: 'md',
			label: 'Tamaño del texto',
			admin: {
				condition: (_, { type } = {}) => type === 'destinyHero',
				description:
					'Define el tamaño de los títulos (H1, H2) y los párrafos.',
			},
			options: [
				{
					label: 'Pequeño (H1 28px · H2 24px · texto 16px)',
					value: 'sm',
				},
				{
					label: 'Mediano (H1 34px · H2 28px · texto 17px)',
					value: 'md',
				},
				{
					label: 'Grande (H1 44px · H2 36px · texto 20px)',
					value: 'lg',
				},
			],
		},
		linkGroup({
			overrides: {
				maxRows: 2,
			},
		}),
		{
			name: 'media',
			type: 'upload',
			admin: {
				condition: (_, { type } = {}) =>
					['highImpact', 'mediumImpact'].includes(type),
			},
			relationTo: 'media',
			required: true,
		},
	],
	label: false,
}
