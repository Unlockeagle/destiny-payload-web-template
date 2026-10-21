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

export const DestinyHero: React.FC<Page['hero']> = ({ links, richText }) => {
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
							className="mb-6 break-words text-[#1A1F71] prose-headings:text-[#1A1F71] prose-p:text-[#1A1F71]"
							data={richText}
							enableGutter={false}
						/>
					)}
					{Array.isArray(links) && links.length > 0 && (
						<ul className="flex flex-wrap gap-4">
							{links.map(({ link }, i) => {
								const isPrimary = i === 0

								return (
									<li key={i}>
										<CMSLink
											{...link}
											appearance="inline"
											className={cn(
												'inline-flex items-center gap-2 rounded-full border-2 px-6 py-3 font-medium transition-opacity hover:opacity-90',
												isPrimary
													? 'border-[#B12672] bg-[#B12672] text-white'
													: 'border-[#1A1F71] bg-transparent text-[#1A1F71]',
											)}
										>
											{isPrimary && (
												<Play
													aria-hidden
													className="size-4 fill-current"
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
