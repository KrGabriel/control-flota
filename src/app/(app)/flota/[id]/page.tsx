import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { FichaVehiculoContent } from "@/components/vehiculos/ficha-vehiculo-content";
import { obtenerVehiculoServidor, listarAsignacionesServidor } from "@/services/vehiculos-server";

async function VehiculoContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }

  const vehiculo = await obtenerVehiculoServidor(id);
  if (!vehiculo) {
    notFound();
  }

  const asignaciones = await listarAsignacionesServidor(id);

  return <FichaVehiculoContent vehiculo={vehiculo} asignaciones={asignaciones} />;
}

export default function VehiculoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<FichaSkeleton />}>
      <VehiculoContent params={params} />
    </Suspense>
  );
}

function FichaSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-60 w-full" />
    </div>
  );
}
