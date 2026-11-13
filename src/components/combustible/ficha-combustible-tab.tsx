"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Fuel, Gauge } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listarCargasPorVehiculo } from "@/services/combustible";
import { calcularEstadisticas } from "@/lib/consumo";
import { formatearFecha, formatearMoneda } from "@/lib/formato";
import { nombreTecnico } from "@/components/shared/estado-badges";
import type { CargaCombustible } from "@/types/database";

export function FichaCombustibleTab({ vehiculoId }: { vehiculoId: string }) {
  const [cargas, setCargas] = useState<CargaCombustible[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    listarCargasPorVehiculo(vehiculoId)
      .then((lista) => {
        if (!activo) return;
        setCargas(lista);
        setCargando(false);
      })
      .catch((e) => {
        if (!activo) return;
        setError(e instanceof Error ? e.message : "Error desconocido");
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [vehiculoId]);

  if (error) {
    return <EmptyState icon={Fuel} title="Error al cargar el combustible" description={error} />;
  }

  if (cargando) {
    return <p className="text-sm text-muted-foreground">Cargando combustible...</p>;
  }

  const { stats, rendimientoPorCarga } = calcularEstadisticas(cargas);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Gasto total"
          value={formatearMoneda(stats.gastoTotal)}
          icon={Fuel}
          hint={`${stats.cantidadCargas} carga(s)`}
        />
        <StatCard
          title="Litros totales"
          value={`${stats.litrosTotal.toLocaleString("es-AR", { maximumFractionDigits: 2 })} L`}
          icon={Fuel}
          hint={
            stats.precioPromedio !== null
              ? `Promedio: ${formatearMoneda(stats.precioPromedio)}/L`
              : undefined
          }
        />
        <StatCard
          title="Rendimiento promedio"
          value={
            stats.rendimientoKmPorLitro !== null
              ? `${stats.rendimientoKmPorLitro.toLocaleString("es-AR", { maximumFractionDigits: 2 })} km/L`
              : "—"
          }
          icon={Gauge}
          hint="Entre cargas consecutivas"
        />
      </div>

      {cargas.length === 0 ? (
        <EmptyState
          icon={Fuel}
          title="Sin cargas de combustible"
          description="Las cargas que registres en el módulo Combustible aparecerán aquí."
        >
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/combustible">Gestionar en el módulo</Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead className="hidden sm:table-cell">Técnico</TableHead>
                <TableHead className="text-right">Km</TableHead>
                <TableHead className="text-right">Litros</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Precio/L</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Km/L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargas.map((c) => {
                const rendimiento = rendimientoPorCarga[c.id];
                return (
                  <TableRow key={c.id}>
                    <TableCell className="tabular-nums">{formatearFecha(c.fecha)}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {nombreTecnico(c.tecnicos ?? null)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.kilometraje.toLocaleString("es-AR")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(c.litros).toLocaleString("es-AR", { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {formatearMoneda(Number(c.precio_por_litro))}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatearMoneda(Number(c.costo_total))}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums lg:table-cell">
                      {rendimiento !== undefined
                        ? rendimiento.toLocaleString("es-AR", { maximumFractionDigits: 2 })
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
