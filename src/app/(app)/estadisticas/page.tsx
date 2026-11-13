import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EstadisticasView } from "@/components/estadisticas/estadisticas-view";

export default function EstadisticasPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Estadísticas e informes"
        description="Análisis de costos, consumo y vencimientos de la flota, con exportación a CSV e impresión en PDF."
      />
      <Suspense fallback={null}>
        <EstadisticasView />
      </Suspense>
    </div>
  );
}
