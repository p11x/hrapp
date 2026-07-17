import { gsap } from 'gsap'
import { useEffect, useRef } from 'react'

interface StatusDotProps {
  status: 'signal' | 'pulse' | 'warn' | 'neutral'
  animate?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function StatusDot({
  status,
  animate = true,
  size = 'md',
}: StatusDotProps) {
  const dotRef = useRef<HTMLDivElement>(null)

  const colorMap = {
    signal: 'bg-signal',
    pulse: 'bg-pulse',
    warn: 'bg-warn',
    neutral: 'bg-text-low',
  }

  const sizeMap = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  useEffect(() => {
    if (!animate || !dotRef.current) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      gsap.to(dotRef.current, {
        scale: 1.15,
        duration: 1,
        ease: 'power1.inOut',
        yoyo: true,
        repeat: -1,
      })
    })

    return () => ctx.revert()
  }, [animate])

  return (
    <div
      ref={dotRef}
      className={`rounded-full ${colorMap[status]} ${sizeMap[size]}`}
    />
  )
}