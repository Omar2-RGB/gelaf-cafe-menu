export function CategorySkeleton() {
  return (
    <div className="rounded-3xl overflow-hidden bg-stone-200/60 animate-pulse">
      <div className="aspect-[4/3] bg-stone-300/60" />
      <div className="p-4 space-y-2">
        <div className="h-5 w-2/3 bg-stone-300/60 rounded-lg" />
        <div className="h-3 w-1/2 bg-stone-300/40 rounded-lg" />
      </div>
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div className="rounded-2xl bg-stone-200/60 p-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2 flex-1">
          <div className="h-5 w-1/3 bg-stone-300/60 rounded-lg" />
          <div className="h-3 w-2/3 bg-stone-300/40 rounded-lg" />
        </div>
        <div className="h-6 w-20 bg-stone-300/60 rounded-lg" />
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="rounded-3xl bg-stone-200/60 p-6 animate-pulse">
      <div className="h-4 w-24 bg-stone-300/60 rounded-lg mb-3" />
      <div className="h-10 w-16 bg-stone-300/60 rounded-lg" />
    </div>
  );
}
