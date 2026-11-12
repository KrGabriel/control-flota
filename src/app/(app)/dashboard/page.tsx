import {
  Car,
  CircleCheck,
  CircleX,
  CalendarClock,
  FileWarning,
  Wrench,
  ClipboardList,
  Fuel,
  Banknote,
  BellRing,
  ChartLine,
  ChartColumn,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Resumen del estado de la flota, gastos y alertas."
        action={
          <Badge variant="secondary" className="text-xs">
            Actualización en tiempo real: Etapa 3
          </Badge>
        }
      />

      {/* Indicadores de flota */}
      <section aria-label="Indicadores de flota" className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Estado de la flota
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard title="Total de vehículos" value="0" icon={Car} />
          <StatCard title="Disponibles" value="0" icon={CircleCheck} tone="success" />
          <StatCard title="Asignados" value="0" icon={Car} tone="primary" />
          <StatCard title="En mantenimiento" value="0" icon={Wrench} tone="warning" />
          <StatCard title="Fuera de servicio" value="0" icon={CircleX} tone="destructive" />
          <StatCard title="Vencimientos próximos" value="0" icon={CalendarClock} tone="warning" />
          <StatCard title="Documentación vencida" value="0" icon={FileWarning} tone="destructive" />
          <StatCard title="Mantenimientos pendientes" value="0" icon={ClipboardList} tone="warning" />
        </div>
      </section>

      {/* Información económica */}
      <section aria-label="Gastos" className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Gastos del mes
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            title="Gasto total del mes"
            value="$ 0,00"
            icon={Banknote}
            hint="Combustible + mantenimiento"
          />
          <StatCard
            title="Combustible del mes"
            value="$ 0,00"
            icon={Fuel}
            hint="Sin registros este mes"
          />
          <StatCard
            title="Mantenimiento del mes"
            value="$ 0,00"
            icon={Wrench}
            hint="Sin registros este mes"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Los importes se muestran en pesos argentinos (ARS) y comparación con el mes
          anterior cuando existan registros. Acumulado del año: <span className="font-medium">$ 0,00</span>.
        </p>
      </section>

      {/* Alertas destacadas */}
      <section aria-label="Alertas destacadas" className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Alertas destacadas
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Vencimientos y mantenimientos que requieren atención</CardTitle>
            <CardDescription>
              Ordenados por urgencia. Accedé a la ficha del vehículo desde cada alerta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={BellRing}
              title="No hay alertas activas"
              description="Cuando registres vehículos y vencimientos, las alertas aparecerán aquí automáticamente."
            />
          </CardContent>
        </Card>
      </section>

      {/* Gráficos */}
      <section aria-label="Gráficos" className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Evolución de gastos
        </h2>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Gastos mensuales</CardTitle>
              <CardDescription>Combustible y mantenimiento por mes</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={ChartLine}
                title="Sin datos para graficar"
                description="El gráfico se activará cuando existan registros de combustible o mantenimiento."
                className="py-8"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Costos por vehículo</CardTitle>
              <CardDescription>Comparación de costos entre vehículos</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={ChartColumn}
                title="Sin datos para graficar"
                description="El gráfico se activará cuando existan registros de gastos por vehículo."
                className="py-8"
              />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
