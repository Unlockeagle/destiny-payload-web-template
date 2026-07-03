'use client'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

const typeLabels: Record<string, string> = {
	phone: '📞 Teléfono',
	whatsapp: '📱 WhatsApp',
	email: '📧 Email',
	contact: '👔 Nombre de contacto',
	zip: '📍 Numero Postal',
	website: '🌐 Sitio Web',
	facebook: '📘 Facebook',
	instagram: '📸 Instagram',
	linkedin: '💼 LinkedIn',
	tiktok: '🎵 TikTok',
}

export const RowInfoLabel: React.FC<RowLabelProps> = () => {
	const { data, rowNumber } = useRowLabel<{
		question?: string
		type?: string
		value?: string
		title?: string
		item?: string
		name?: string
		label?: string
	}>()
	const type = typeLabels[data?.type as string]
	const label = data?.label as string
	const value = data?.value as string

	if (type && label) return `${type} — ${label}`
	if (type && value) return `${type} — ${value}`
	if (type) return type

	return `Contacto ${(rowNumber ?? 0) + 1}`
}
