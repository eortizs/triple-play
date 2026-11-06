import { Skeleton } from "@/components/ui/skeleton";

export default function Cargando() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, indice) => (
          <Skeleton key={indice} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
