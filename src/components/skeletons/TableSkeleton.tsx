import { Skeleton } from './Skeleton'

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-ink-900 border border-hairline rounded-lg">
      <div className="border-b border-hairline p-4">
        <Skeleton className="h-5 w-32" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 border-b border-hairline last:border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}