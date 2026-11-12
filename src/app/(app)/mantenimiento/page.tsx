import { Wrench, CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PlaceholderButton } from "@/components/shared/placeholder-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function MantenimientoPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mantenimiento"
        description="Registros de ingresos al taller y mantenimientos programados."
        action={<PlaceholderButton label="Registrar mantenimiento" stage="Etapa 5" />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Mantenimientos realizados
            <Badge variant="secondary" className="text-xs">
              0 registros
            </Badge>
          </CardTitle>
          <CardDescription>
            Historial de ingresos al taller con categoría, taller, costo y comprobantes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Wrench}
            title="No hay mantenimientos registrados"
            description="Cada registro guardará fecha, vehículo, patente, kilometraje, categoría, trabajo realizado, taller, costo y observaciones."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Mantenimientos programados
            <Badge variant="secondary" className="text-xs">
              0 programaciones
            </Badge>
          </CardTitle>
          <CardDescription>
            Recordatorios recurrentes por kilometraje, por tiempo, o ambos, lo que ocurra primero.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={CalendarClock}
            title="No hay mantenimientos programados"
            description="Configurá intervalos (por ejemplo: cambio de aceite cada 10.000 km o 12 meses) y el sistema calculará las próximas fechas y alertas automáticamente."
          />
        </CardContent>
      </Card>
    </div>
  );
}
