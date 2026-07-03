'use client'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

export const RowLabel: React.FC<RowLabelProps> = () => {
	const { data, rowNumber } = useRowLabel<{
		question?: string
		title?: string
		item?: string
		name?: string
		label?: string
	}>()

	const label =
		data?.question ??
		data?.title ??
		data?.item ??
		data?.name ??
		data?.label ??
		`Item - ${data?.name ?? ''} ${rowNumber ?? ''}`

	return <span>{label}</span>
}
