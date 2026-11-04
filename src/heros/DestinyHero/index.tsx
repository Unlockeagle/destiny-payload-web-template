'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { Play } from 'lucide-react'
import Image from 'next/image'
import React, { useEffect } from 'react'

import type { Page } from '@/payload-types'

import { VectorComponent } from '@/components/Backgorund/Vector-component'
import { CMSLink } from '@/components/Link'
import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

import { Cloud } from './Cloud'

// Clases completas (no armadas con plantillas) para que Tailwind las detecte
const textSizeClasses = {
	sm: 'prose-h1:text-[28px] prose-h2:text-[24px] prose-p:text-[16px]',
	md: 'prose-h1:text-[34px] prose-h2:text-[28px] prose-p:text-[17px]',
	lg: 'prose-h1:text-[44px] prose-h2:text-[36px] prose-p:text-[20px]',
} as const

export const DestinyHero: React.FC<Page['hero']> = ({
	links,
	richText,
	textSize,
}) => {
	const { setHeaderTheme } = useHeaderTheme()

	useEffect(() => {
		setHeaderTheme('light')
	})

	return (
		<div className="relative flex flex-col overflow-hidden md:min-h-screen">
			<Cloud className="pointer-events-none absolute inset-x-0 bottom-0" />
			<div className="container relative z-10 flex flex-1 flex-col gap-8 pt-8 pb-16 md:flex-row md:items-center md:pt-12 md:pb-32">
				<div className="md:w-1/2 md:max-w-[36.5rem]">
					{richText && (
						<RichText
							className={cn(
								'mb-6 break-words text-[#1A1F71] prose-headings:text-[#1A1F71] prose-p:text-[#1A1F71]',
								textSizeClasses[textSize ?? 'md'],
							)}
							data={richText}
							enableGutter={false}
						/>
					)}
					{Array.isArray(links) && links.length > 0 && (
						<ul className="flex flex-wrap gap-4 text-base">
							{links.map(({ link }, i) => {
								const isPrimary = i === 0

								return (
									<li key={i}>
										<CMSLink
											{...link}
											appearance="inline"
											className={cn(
												'group inline-flex items-center gap-2 rounded-full px-6 py-3 font-medium transition-opacity hover:opacity-90',
												isPrimary
													? 'text-zinc-50 text-center bg-pink-600 '
													: 'border-[#1A1F71] bg-transparent text-[#1A1F71]',
											)}
										>
											{isPrimary && (
												<Play
													aria-hidden
													className="group-hover:ml-4 group-hover:rotate-360 transition-all ease-in-out duration-300 size-4 fill-current"
												/>
											)}
										</CMSLink>
									</li>
								)
							})}
						</ul>
					)}
				</div>
				<div className="flex justify-center md:flex-1">
					<div className="relative w-full max-w-[18rem] sm:max-w-[24rem] md:max-w-[36rem]">
						<VectorComponent className="pointer-events-none absolute inset-x-[5%] -inset-y-[5%]" />
						<Image
							alt="Avión de Destiny Trip"
							className="relative h-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-1000 motion-reduce:animate-none"
							height={1094}
							priority
							sizes="(min-width: 768px) 50vw, (min-width: 640px) 384px, 288px"
							src="/airplane.png"
							width={1094}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}
