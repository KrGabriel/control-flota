"use client";

import { useEffect, useState } from "react";
import { Banknote, Fuel, Wrench } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/stat-card";
import { listarMantenimientosPorVehiculo } from "@/services/mantenimientos";
import { listarCargasPorVehiculo } from "@/services/combustible";
import { formatearFecha, formatearMoneda } from "@/lib/formato";
import type { CargaCombustible, Mantenimiento } from "@/types/database";

interface Movimiento {
  fecha: string;
  tipo: "mantenimiento" | "combustible";
  concepto: string;
  monto: number;
}

const formatearCompacto = (valor: number): string =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(valor);

function mesActual(desplazamiento = 0): string {
  const ahora = new Date();
  const offsetBsAs = -3 * 60;
  const fechaBsAs = new Date(
    ahora.getTime() + (ahora.getTimezoneOffset() + offsetBsAs) * 60000
  );
  fechaBsAs.setUTCDate(1);
  fechaBsAs.setUTCMonth(fechaBsAs.getUTCMonth() + desplazamiento);
  return fechaBsAs.toISOString().slice(0, 7);
}

export function FichaGastosTab({ vehiculoId }: { vehiculoId: string }) {
  const [cargando, setCargando] = useState(true);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [cargas, setCargas] = useState<CargaCombustible[]>([]);

  useEffect(() => {
    let activo = true;
    Promise.all([
      listarMantenimientosPorVehiculo(vehiculoId),
      listarCargasPorVehiculo(vehiculoId),
    ])
      .then(([mantenimientosLista, cargasLista]) => {
        if (!activo) return;
        setMantenimientos(mantenimientosLista);
        setCargas(cargasLista);
        setCargando(false);
      })
      .catch((error) => {
        if (!activo) return;
        console.error(error);
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [vehiculoId]);

  if (cargando) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  const anioActual = mesActual().slice(0, 4);
  const enAnio = (fecha: string) => fecha.startsWith(anioActual);

  const mantenimientoAnio = mantenimientos
    .filter((m) => enAnio(m.fecha))
    .reduce((s, m) => s + Number(m.costo_total), 0);
  const combustibleAnio = cargas
    .filter((c) => enAnio(c.fecha))
    .reduce((s, c) => s + Number(c.costo_total), 0);
  const totalHistorico =
    mantenimientos.reduce((s, m) => s + Number(m.costo_total), 0) +
    cargas.reduce((s, c) => s + Number(c.costo_total), 0);

  const meses: { mes: string; combustible: number; mantenimiento: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const clave = mesActual(-i);
    const etiqueta = formatearFecha(`${clave}-15`).slice(3);
    meses.push({
      mes: etiqueta,
      combustible: cargas
        .filter((c) => c.fecha.startsWith(clave))
        .reduce((s, c) => s + Number(c.costo_total), 0),
      mantenimiento: mantenimientos
        .filter((m) => m.fecha.startsWith(clave))
        .reduce((s, m) => s + Number(m.costo_total), 0),
    });
  }

  const movimientos: Movimiento[] = [
    ...mantenimientos.map((m) => ({
      fecha: m.fecha,
      tipo: "mantenimiento" as const,
      concepto: m.categorias_mantenimiento?.nombre ?? "Mantenimiento",
      monto: Number(m.costo_total),
    })),
    ...cargas.map((c) => ({
      fecha: c.fecha,
      tipo: "combustible" as const,
      concepto: `${c.litros} L · ${formatearMoneda(c.precio_por_litro)}/L`,
      monto: Number(c.costo_total),
    })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  const hayDatos = mantenimientos.length + cargas.length > 0;

  if (!hayDatos) {
    return (
      <EmptyState
        icon={Banknote}
        title="Sin gastos registrados"
        description="Los gastos de mantenimiento y combustible de este vehículo aparecerán acá cuando registres mantenimientos o cargas."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          title={`Mantenimiento ${anioActual}`}
          value={formatearMoneda(mantenimientoAnio)}
          icon={Wrench}
          hint={`${mantenimientos.length} registro(s) histórico(s)`}
        />
        <StatCard
          title={`Combustible ${anioActual}`}
          value={formatearMoneda(combustibleAnio)}
          icon={Fuel}
          hint={`${cargas.length} carga(s) histórica(s)`}
        />
        <StatCard
          title="Total histórico"
          value={formatearMoneda(totalHistorico)}
          icon={Banknote}
          hint="Mantenimiento + combustible"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gastos por mes</CardTitle>
          <CardDescription>Últimos 12 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={meses}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                barGap={2}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                />
                <YAxis
                  tickFormatter={formatearCompacto}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    fontSize: "0.8rem",
                  }}
                  formatter={(valor) => formatearCompacto(Number(valor))}
                />
                <Bar dataKey="mantenimiento" name="Mantenimiento" fill="var(--primary)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="combustible" name="Combustible" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Concepto</th>
              <th className="px-3 py-2 text-right font-medium">Monto</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.slice(0, 10).map((mov, i) => (
              <tr
                key={`${mov.tipo}-${mov.fecha}-${i}`}
                className="border-b last:border-0"
              >
                <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                  {formatearFecha(mov.fecha)}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={
                      mov.tipo === "mantenimiento"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                  >
                    {mov.tipo === "mantenimiento" ? "Mantenimiento" : "Combustible"}
                  </span>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{mov.concepto}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums font-medium">
                  {formatearMoneda(mov.monto)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Mostrando los últimos 10 movimientos de {movimientos.length} en total.
      </p>
    </div>
  );
}
