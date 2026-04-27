export function CardSkeleton() {
  return (
    <div className="bg-comando-900 border border-comando-700 p-6 animate-pulse">
      <div className="h-6 bg-comando-700 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-comando-700 rounded w-full mb-2"></div>
      <div className="h-4 bg-comando-700 rounded w-5/6 mb-4"></div>
      <div className="h-10 bg-comando-700 rounded w-full"></div>
    </div>
  );
}

export function GameCardSkeleton() {
  return (
    <div className="bg-comando-900 border-2 border-comando-700 animate-pulse">
      <div className="bg-comando-800 p-4 h-20"></div>
      <div className="p-6">
        <div className="h-6 bg-comando-700 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-comando-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-comando-700 rounded w-5/6 mb-4"></div>
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-comando-700 rounded w-2/3"></div>
          <div className="h-4 bg-comando-700 rounded w-1/2"></div>
          <div className="h-8 bg-comando-700 rounded w-1/3"></div>
        </div>
        <div className="h-12 bg-comando-700 rounded w-full"></div>
      </div>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="bg-carbon border border-comando-800 p-4 flex items-center justify-between animate-pulse">
      <div className="flex-1">
        <div className="h-5 bg-comando-700 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-comando-700 rounded w-3/4"></div>
      </div>
      <div className="text-right">
        <div className="h-6 bg-comando-700 rounded w-20 mb-1"></div>
        <div className="h-4 bg-comando-700 rounded w-16"></div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-carbon">
      <div className="bg-comando-900 border-b-2 border-comando-700 h-20 animate-pulse"></div>
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-4 bg-comando-700 rounded w-32 mb-3 animate-pulse"></div>
          <div className="h-12 bg-comando-700 rounded w-96 mb-2 animate-pulse"></div>
          <div className="h-6 bg-comando-700 rounded w-64 animate-pulse"></div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </main>
    </div>
  );
}