import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { MantenimientosView } from "@/components/mantenimiento/mantenimientos-view";

function MantenimientoFallback() {
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

export default function MantenimientoPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mantenimiento"
        description="Registros de trabajos realizados y mantenimientos programados por km, tiempo o ambos."
      />
      <Suspense fallback={<MantenimientoFallback />}>
        <MantenimientosView />
      </Suspense>
    </div>
  );
}
