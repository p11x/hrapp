import type { HTMLAttributes } from 'react'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-ink-800 rounded animate-pulse ${className || ''}`}
      {...props}
    />
  )
}