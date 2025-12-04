export function SchoolsTableSkeleton() {
  return (
    <div className="neu rounded-3xl overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-border/50">
        <div className="h-7 w-32 rounded-xl neu-inset-sm animate-pulse" />
        <div className="h-4 w-64 mt-3 rounded-lg neu-inset-sm animate-pulse" />
      </div>
      
      {/* Header skeleton */}
      <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-muted/30 border-b border-border/30">
        {[4, 2, 2, 1, 2, 1].map((span, i) => (
          <div key={i} className={`col-span-${span}`}>
            <div className="h-4 w-16 rounded-md neu-inset-sm animate-pulse" />
          </div>
        ))}
      </div>
      
      {/* Rows skeleton */}
      <div className="divide-y divide-border/30">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 sm:px-8 py-5 items-center"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* School Info */}
            <div className="lg:col-span-4 flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl neu-inset-sm animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-40 rounded-lg neu-inset-sm animate-pulse" />
                <div className="h-4 w-24 rounded-md neu-inset-sm animate-pulse" />
              </div>
            </div>
            
            {/* Plan */}
            <div className="hidden lg:block lg:col-span-2">
              <div className="h-7 w-20 rounded-xl neu-inset-sm animate-pulse" />
            </div>
            
            {/* Status */}
            <div className="hidden lg:block lg:col-span-2">
              <div className="h-7 w-16 rounded-xl neu-inset-sm animate-pulse" />
            </div>
            
            {/* Users */}
            <div className="hidden lg:flex lg:col-span-1 justify-center">
              <div className="h-9 w-9 rounded-xl neu-inset-sm animate-pulse" />
            </div>
            
            {/* Toggle */}
            <div className="hidden lg:flex lg:col-span-2 justify-center">
              <div className="h-7 w-14 rounded-full neu-inset-sm animate-pulse" />
            </div>
            
            {/* Actions */}
            <div className="hidden lg:flex lg:col-span-1 justify-end">
              <div className="h-10 w-10 rounded-xl neu-inset-sm animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
