import { PageHeader } from "@/components/shared/page-header";
import { VehiculosView } from "@/components/vehiculos/vehiculos-view";

export default function FlotaPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Flota de vehículos"
        description="Administrá los vehículos de la empresa, sus estados e información general."
      />
      <VehiculosView />
    </div>
  );
}
