import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { CombustibleView } from "@/components/combustible/combustible-view";

function CombustibleFallback() {
  return (
    <div className="space-y-4">
      <div className="h-9 w-56 animate-pulse rounded-md bg-muted" />
      <div className="space-y-2 rounded-xl border p-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default function CombustiblePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Combustible"
        description="Cargas de combustible, consumo y costos por vehículo."
      />
      <Suspense fallback={<CombustibleFallback />}>
        <CombustibleView />
      </Suspense>
    </div>
  );
}
