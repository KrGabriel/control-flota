import { Fuel, Gauge, Banknote, Droplets } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PlaceholderButton } from "@/components/shared/placeholder-button";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CombustiblePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Combustible"
        description="Cargas de combustible, consumo y costos por vehículo."
        action={<PlaceholderButton label="Registrar carga" stage="Etapa 6" />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Gasto mensual" value="$ 0,00" icon={Banknote} />
        <StatCard title="Gasto anual" value="$ 0,00" icon={Banknote} />
        <StatCard title="Consumo promedio" value="—" icon={Gauge} hint="km/litro" />
        <StatCard title="Costo por kilómetro" value="—" icon={Droplets} hint="ARS/km" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Cargas registradas
            <Badge variant="secondary" className="text-xs">
              0 registros
            </Badge>
          </CardTitle>
          <CardDescription>
            El costo total se calcula automáticamente (litros × precio por litro) y el
            kilometraje del vehículo se actualiza con cada carga válida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Fuel}
            title="No hay cargas registradas"
            description="Registrá la primera carga para comenzar a calcular consumo, costo por kilómetro y evolución de gastos."
          />
        </CardContent>
      </Card>
    </div>
  );
}
