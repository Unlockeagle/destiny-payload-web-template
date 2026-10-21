import React from 'react'

import { cn } from '@/utilities/ui'

type Props = { className?: string }

export const Cloud: React.FC<Props> = ({ className }) => {
  return (
    <svg
      aria-hidden
      className={cn('block h-auto w-full', className)}
      fill="#2A1A87"
      preserveAspectRatio="none"
      viewBox="0 0 1440 220"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 220V130C40 92 102 84 150 112C178 62 250 46 300 82C334 40 410 36 452 80C490 58 548 64 572 104C610 70 680 66 716 106C748 50 834 34 890 76C926 44 1000 46 1036 92C1078 64 1140 70 1166 110C1200 72 1270 66 1310 100C1346 78 1404 84 1440 116V220H0Z" />
    </svg>
  )
}
