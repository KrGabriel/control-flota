import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { VencimientosView } from "@/components/vencimientos/vencimientos-view";

function VencimientosFallback() {
  return (
    <div className="space-y-4">
      <div className="h-9 w-64 animate-pulse rounded-md bg-muted" />
      <div className="space-y-2 rounded-xl border p-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default function VencimientosPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vencimientos"
        description="VTV, seguros, matafuegos y equipamiento de toda la flota, ordenados por urgencia."
      />
      <Suspense fallback={<VencimientosFallback />}>
        <VencimientosView />
      </Suspense>
    </div>
  );
}
