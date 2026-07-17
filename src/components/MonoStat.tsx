import { motion } from 'framer-motion'
import type { HTMLAttributes } from 'react'

interface MonoStatProps extends HTMLAttributes<HTMLDivElement> {
  value: string | number
  label?: string
  status?: 'default' | 'signal' | 'pulse' | 'warn'
  size?: 'sm' | 'md' | 'lg'
}

export function MonoStat({
  value,
  label,
  status = 'default',
  size = 'md',
  className,
}: MonoStatProps) {
  const statusColors = {
    default: 'text-text-hi',
    signal: 'text-primary',
    pulse: 'text-accent-mint',
    warn: 'text-accent-amber',
  }

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  }

  return (
    <div className={className}>
      <motion.div
        className={`font-mono font-normal ${statusColors[status]} ${sizeClasses[size]}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {value}
      </motion.div>
      {label && (
        <div className="text-text-mid text-sm mt-1 font-body">{label}</div>
      )}
    </div>
  )
}