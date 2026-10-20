import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'
import Script from 'next/script'

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const { isEnabled } = await draftMode()

	return (
		<html
			className={cn(GeistSans.variable, GeistMono.variable)}
			lang="en"
			suppressHydrationWarning
		>
			<head>
				<InitTheme />
				<link href="/favicon.ico" rel="icon" sizes="32x32" />
				<link href="/favicon.svg" rel="icon" type="image/svg+xml" />
				{/* umami script */}
				{process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
					<Script
						src={process.env.NEXT_PUBLIC_UMAMI_URL}
						data-website-id={
							process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
						}
						strategy="afterInteractive"
					/>
				)}
			</head>
			<body>
				<Providers>
					<AdminBar
						adminBarProps={{
							preview: isEnabled,
						}}
					/>

					<Header />
					{children}
					<Footer />
				</Providers>
			</body>
		</html>
	)
}

export const metadata: Metadata = {
	metadataBase: new URL(getServerSideURL()),
	openGraph: mergeOpenGraph(),
	twitter: {
		card: 'summary_large_image',
		creator: '@payloadcms',
	},
}
