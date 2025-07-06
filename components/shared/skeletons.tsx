import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface CardSkeletonProps {
  count?: number
  className?: string
}

export function CardSkeleton({ count = 1, className = "" }: CardSkeletonProps) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <Card key={i} className={`border-0 shadow-soft bg-white/90 backdrop-blur-sm ${className}`}>
          <CardHeader className="pb-4">
            <div className="space-y-3">
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-32 animate-pulse" />
              <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24 animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-full animate-pulse" />
              <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  )
}

interface StatCardSkeletonProps {
  count?: number
}

export function StatCardSkeleton({ count = 4 }: StatCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="bg-white/80 backdrop-blur-sm border-slate-100 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-16 animate-pulse" />
                <div className="h-8 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-12 animate-pulse" />
                <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-20 animate-pulse" />
              </div>
              <div className="h-10 w-10 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-xl animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="space-y-4">
      {[...Array(rows)].map((_, i) => (
        <Card key={i} className="border-0 shadow-soft bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="h-10 w-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48 animate-pulse" />
                  <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32 animate-pulse" />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-16 animate-pulse" />
                <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-8 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface DashboardSkeletonProps {
  showStats?: boolean
  showHeader?: boolean
}

export function DashboardSkeleton({ showStats = true, showHeader = true }: DashboardSkeletonProps) {
  return (
    <div className="space-y-8 p-6 lg:p-8 bg-gradient-to-br from-gray-50/50 via-white to-emerald-50/20 min-h-screen">
      {showHeader && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-48 animate-pulse" />
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-64 animate-pulse" />
            </div>
            <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-32 animate-pulse" />
          </div>
        </div>
      )}
      
      {showStats && (
        <div className="animate-slide-up animate-delay-100">
          <StatCardSkeleton />
        </div>
      )}
      
      <div className="animate-slide-up animate-delay-200">
        <CardSkeleton count={6} />
      </div>
    </div>
  )
}

export function MainDashboardSkeleton() {
  return (
    <div className="flex-1 space-y-8 p-6 lg:p-8 bg-gradient-to-br from-gray-50/50 via-white to-emerald-50/20 min-h-screen">
      {/* Header Skeleton */}
      <div className="space-y-3 animate-fade-in">
        <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-64 animate-pulse" />
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-96 animate-pulse" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="animate-slide-up">
        <StatCardSkeleton />
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 animate-slide-up animate-delay-200">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="border-0 shadow-soft bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Skeleton */}
      <Card className="border-0 shadow-soft bg-white/90 backdrop-blur-sm animate-slide-up animate-delay-300">
        <CardHeader className="pb-4">
          <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-40 animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48 animate-pulse" />
                <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32 animate-pulse" />
              </div>
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-16 animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function GridSkeleton({ items = 6 }: { items?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-in">
      {[...Array(items)].map((_, i) => (
        <Card key={i} className="border-0 shadow-soft bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="space-y-3">
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32 animate-pulse" />
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48 animate-pulse" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-full animate-pulse" />
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2 animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ListSkeleton({ items = 8 }: { items?: number }) {
  return (
    <div className="space-y-4 animate-fade-in">
      {[...Array(items)].map((_, i) => (
        <Card key={i} className="border-0 shadow-soft bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32 animate-pulse" />
                  <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24 animate-pulse" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-16 animate-pulse" />
                <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-8 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function FormSkeleton() {
  return (
    <Card className="border-0 shadow-soft bg-white/90 backdrop-blur-sm animate-pulse">
      <CardHeader className="pb-6">
        <div className="space-y-3">
          <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48 animate-pulse" />
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-64 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-20 animate-pulse" />
            <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-full animate-pulse" />
          </div>
        ))}
        <div className="flex space-x-4 pt-4">
          <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24 animate-pulse" />
          <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}

export function EmptyStateWithSkeleton({
  title,
  description,
  icon: Icon,
  action,
  isLoading = false,
  skeletonCount = 3
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  action?: React.ReactNode
  isLoading?: boolean
  skeletonCount?: number
}) {
  if (isLoading) {
    return <CardSkeleton count={skeletonCount} />
  }

  return (
    <Card className="border-0 shadow-soft bg-white/80 backdrop-blur-sm animate-scale-in">
      <CardContent className="pt-16 pb-16">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mb-8 shadow-soft">
            <Icon className="h-10 w-10 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
          <p className="text-gray-600 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
          {action && <div className="mt-6">{action}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
