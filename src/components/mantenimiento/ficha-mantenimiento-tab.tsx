"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Wrench } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { NivelProgramacionBadge, etiquetaModo } from "@/components/mantenimiento/mantenimientos-view";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listarMantenimientosPorVehiculo } from "@/services/mantenimientos";
import { obtenerConfigAlertas } from "@/services/config";
import { listarProgramacionesPorVehiculo } from "@/services/programaciones";
import { CONFIG_ALERTAS_POR_DEFECTO, estadoProgramacion } from "@/lib/alertas";
import { formatearFecha, formatearMoneda } from "@/lib/formato";
import type { ConfigAlertas, Mantenimiento, Programacion } from "@/types/database";

export function FichaMantenimientoTab({ vehiculoId }: { vehiculoId: string }) {
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [programaciones, setProgramaciones] = useState<Programacion[]>([]);
  const [config, setConfig] = useState<ConfigAlertas>(CONFIG_ALERTAS_POR_DEFECTO);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    Promise.all([
      listarMantenimientosPorVehiculo(vehiculoId),
      listarProgramacionesPorVehiculo(vehiculoId),
      obtenerConfigAlertas(),
    ])
      .then(([listaMantenimientos, listaProgramaciones, configAlertas]) => {
        if (!activo) return;
        setMantenimientos(listaMantenimientos);
        setProgramaciones(listaProgramaciones);
        setConfig(configAlertas);
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
    return (
      <EmptyState icon={Wrench} title="Error al cargar el mantenimiento" description={error} />
    );
  }

  if (cargando) {
    return (
      <p className="text-sm text-muted-foreground">Cargando mantenimiento...</p>
    );
  }

  const tieneProgramaciones = programaciones.length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Historial de mantenimientos</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/mantenimiento">Gestionar en el módulo</Link>
          </Button>
        </div>
        {mantenimientos.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Sin mantenimientos registrados"
            description="Los trabajos que registres en el módulo Mantenimiento aparecerán aquí."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                  <TableHead>Trabajo</TableHead>
                  <TableHead className="text-right">Km</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mantenimientos.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="tabular-nums">{formatearFecha(m.fecha)}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {m.categorias_mantenimiento?.nombre ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm" title={m.trabajo_realizado}>
                        {m.trabajo_realizado}
                      </p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {m.kilometraje.toLocaleString("es-AR")}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatearMoneda(Number(m.costo_total))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Mantenimientos programados</p>
        {!tieneProgramaciones ? (
          <EmptyState
            icon={CalendarClock}
            title="Sin programaciones para este vehículo"
            description="Creá programaciones por kilometraje o tiempo en el módulo Mantenimiento."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="hidden sm:table-cell">Modo · Intervalo</TableHead>
                  <TableHead>Próximo estimado</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programaciones.map((p) => (
                  <TableRow key={p.id} className={!p.activo ? "opacity-60" : undefined}>
                    <TableCell className="font-medium">
                      {p.categorias_mantenimiento?.nombre ?? "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {etiquetaModo(p.modo)}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {[
                        p.proxima_fecha_estimada ? formatearFecha(p.proxima_fecha_estimada) : null,
                        p.proximo_kilometraje_estimado != null
                          ? `${p.proximo_kilometraje_estimado.toLocaleString("es-AR")} km`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Sin estimación"}
                    </TableCell>
                    <TableCell>
                      <NivelProgramacionBadge nivel={estadoProgramacion(p, config)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
