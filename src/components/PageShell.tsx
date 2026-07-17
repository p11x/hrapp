import { motion } from 'framer-motion'
import type { HTMLAttributes } from 'react'
import { pageVariants, staggerContainer } from '../lib/motion'

interface PageShellProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
}

export function PageShell({ title, children, className }: PageShellProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`p-6 ${className || ''}`}
    >
      {title && (
        <h1 className="text-3xl font-display font-semibold text-text-hi mb-6">
          {title}
        </h1>
      )}
      <motion.div variants={staggerContainer} initial="initial" animate="animate">
        {children}
      </motion.div>
    </motion.div>
  )
}