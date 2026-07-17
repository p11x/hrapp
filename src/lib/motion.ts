const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const pageVariants = prefersReduced
  ? {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    }
  : {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    }

export const staggerContainer = prefersReduced
  ? {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    }
  : {
      initial: { opacity: 0 },
      animate: {
        opacity: 1,
        transition: {
          staggerChildren: 0.06,
          delayChildren: 0.1,
        },
      },
    }

export const cardVariants = prefersReduced
  ? {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    }
  : {
      initial: { opacity: 0, y: 20, scale: 0.98 },
      animate: { opacity: 1, y: 0, scale: 1 },
    }