import { BellRing, CalendarClock, CircleAlert, CircleCheck, CircleMinus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const LEVELS = [
  { label: "Normal", icon: CircleCheck, className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900" },
  { label: "Próximo a vencer", icon: CalendarClock, className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900" },
  { label: "Urgente", icon: CircleAlert, className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900" },
  { label: "Vencido", icon: CircleMinus, className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900" },
];

export default function VencimientosPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vencimientos y alertas"
        description="Control automático de VTV, seguro, matafuego, batería y mantenimientos programados."
        action={
          <Badge variant="secondary" className="text-xs">
            Se activan en la Etapa 7
          </Badge>
        }
      />

      <div className="flex flex-wrap gap-2">
        {LEVELS.map((level) => (
          <Badge key={level.label} variant="outline" className={level.className}>
            <level.icon className="size-3.5" />
            {level.label}: 0
          </Badge>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alertas activas</CardTitle>
          <CardDescription>
            Los niveles se recalculan automáticamente cada día según los anticipos
            configurados (días para vencimientos, kilómetros restantes para
            mantenimientos).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={BellRing}
            title="No hay alertas para mostrar"
            description="Las alertas por VTV, seguro, matafuego, batería y mantenimientos aparecerán aquí, además del centro de notificaciones y el envío opcional por correo."
          />
        </CardContent>
      </Card>
    </div>
  );
}
