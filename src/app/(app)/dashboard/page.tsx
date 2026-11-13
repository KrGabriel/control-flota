import { Suspense } from "react";
import Link from "next/link";
import {
  Banknote,
  BellRing,
  CalendarClock,
  Car,
  CircleCheck,
  CircleX,
  ClipboardList,
  FileDown,
  FileWarning,
  Fuel,
  Gauge,
  RefreshCw,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  GraficoCostosPorVehiculo,
  GraficoGastosMensuales,
} from "@/components/dashboard/dashboard-graficos";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { obtenerDatosDashboard, type AlertaDestacada } from "@/services/dashboard";
import { formatearMoneda } from "@/lib/formato";
import type { EstadoVencimiento } from "@/lib/formato";

function NivelAlertaBadge({ nivel }: { nivel: EstadoVencimiento }) {
  switch (nivel) {
    case "vencido":
      return (
        <Badge className="text-xs" variant="destructive">
          Vencido
        </Badge>
      );
    case "urgente":
      return (
        <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900" variant="outline">
          Urgente
        </Badge>
      );
    default:
      return (
        <Badge className="text-xs" variant="secondary">
          Próximo
        </Badge>
      );
  }
}

function comparacionMes(actual: number, anterior: number): string {
  if (anterior === 0 && actual === 0) return "Sin registros";
  if (anterior === 0) return `Mes anterior: sin registros`;
  const variacion = ((actual - anterior) / anterior) * 100;
  const direccion = variacion >= 0 ? "+" : "";
  return `Mes anterior: ${formatearMoneda(anterior)} (${direccion}${variacion.toFixed(0)}%)`;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Resumen del estado de la flota, gastos y alertas."
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

async function DashboardContent() {
  const datos = await obtenerDatosDashboard();
  const hayGraficos =
    datos.gastosMensuales.some((p) => p.combustible + p.mantenimiento > 0) ||
    datos.costosPorVehiculo.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <AutoRefresh />
      <PageHeader
        title="Dashboard"
        description="Resumen del estado de la flota, gastos y alertas."
        action={
          <Badge variant="secondary" className="text-xs">
            <RefreshCw className="mr-1 size-3" />
            Se actualiza cada minuto
          </Badge>
        }
      />

      {/* Indicadores de flota */}
      <section aria-label="Indicadores de flota" className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Estado de la flota
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard title="Total de vehículos" value={datos.flota.total} icon={Car} />
          <StatCard
            title="Disponibles"
            value={datos.flota.disponibles}
            icon={CircleCheck}
            tone="success"
          />
          <StatCard
            title="Asignados"
            value={datos.flota.asignados}
            icon={Car}
            tone="primary"
          />
          <StatCard
            title="En mantenimiento"
            value={datos.flota.enMantenimiento}
            icon={Wrench}
            tone="warning"
          />
          <StatCard
            title="Fuera de servicio"
            value={datos.flota.fueraDeServicio}
            icon={CircleX}
            tone="destructive"
          />
          <StatCard
            title="Vencimientos próximos"
            value={datos.vencimientos.proximos}
            icon={CalendarClock}
            tone="warning"
          />
          <StatCard
            title="Documentación vencida"
            value={datos.vencimientos.vencidos}
            icon={FileWarning}
            tone="destructive"
          />
          <StatCard
            title="Mantenimientos pendientes"
            value={datos.vencimientos.mantenimientosPendientes}
            icon={ClipboardList}
            tone="warning"
          />
        </div>
      </section>

      {/* Información económica */}
      <section aria-label="Gastos" className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Gastos del mes ({datos.gastos.etiquetaMes})
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            title="Gasto total del mes"
            value={formatearMoneda(datos.gastos.total)}
            icon={Banknote}
            hint={comparacionMes(
              datos.gastos.total,
              datos.gastos.combustibleMesAnterior +
                datos.gastos.mantenimientoMesAnterior
            )}
          />
          <StatCard
            title="Combustible del mes"
            value={formatearMoneda(datos.gastos.combustible)}
            icon={Fuel}
            hint={comparacionMes(
              datos.gastos.combustible,
              datos.gastos.combustibleMesAnterior
            )}
          />
          <StatCard
            title="Mantenimiento del mes"
            value={formatearMoneda(datos.gastos.mantenimiento)}
            icon={Wrench}
            hint={comparacionMes(
              datos.gastos.mantenimiento,
              datos.gastos.mantenimientoMesAnterior
            )}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Los importes se muestran en pesos argentinos (ARS). Acumulado del año:{" "}
          <span className="font-medium">{formatearMoneda(datos.gastos.acumuladoAnio)}</span>.
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
            {datos.alertas.length === 0 ? (
              <EmptyState
                icon={BellRing}
                title="No hay alertas activas"
                description="Cuando registres vehículos y vencimientos, las alertas aparecerán aquí automáticamente."
              />
            ) : (
              <ul className="divide-y">
                {datos.alertas.map((alerta, i) => (
                  <AlertaItem key={`${alerta.vehiculoId}-${alerta.titulo}-${i}`} alerta={alerta} />
                ))}
              </ul>
            )}
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
              <CardDescription>
                Combustible y mantenimiento por mes (últimos 12 meses)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hayGraficos ? (
                <GraficoGastosMensuales datos={datos.gastosMensuales} />
              ) : (
                <EmptyState
                  icon={FileDown}
                  title="Sin datos para graficar"
                  description="El gráfico se activará cuando existan registros de combustible o mantenimiento."
                  className="py-8"
                />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Costos por vehículo</CardTitle>
              <CardDescription>
                Comparación de costos acumulados del año
              </CardDescription>
            </CardHeader>
            <CardContent>
              {datos.costosPorVehiculo.length > 0 ? (
                <GraficoCostosPorVehiculo datos={datos.costosPorVehiculo} />
              ) : (
                <EmptyState
                  icon={Gauge}
                  title="Sin datos para graficar"
                  description="El gráfico se activará cuando existan registros de gastos por vehículo."
                  className="py-8"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function AlertaItem({ alerta }: { alerta: AlertaDestacada }) {
  return (
    <li className="py-2.5 first:pt-0 last:pb-0">
      <Link
        href={`/flota/${alerta.vehiculoId}`}
        className="flex items-start justify-between gap-3 rounded-lg p-1 transition-colors hover:bg-muted/60"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{alerta.titulo}</p>
          <p className="text-xs text-muted-foreground">{alerta.detalle}</p>
        </div>
        <NivelAlertaBadge nivel={alerta.nivel} />
      </Link>
    </li>
  );
}
