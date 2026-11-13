"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { NivelVencimientoBadge } from "@/components/vencimientos/vencimientos-view";
import { listarAlertasPorVehiculo, type Alerta } from "@/services/alertas";
import { formatearFecha } from "@/lib/formato";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function FichaAlertasTab({ vehiculoId }: { vehiculoId: string }) {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    listarAlertasPorVehiculo(vehiculoId)
      .then((lista) => {
        if (!activo) return;
        setAlertas(lista);
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
    return <EmptyState icon={BellRing} title="Error al cargar las alertas" description={error} />;
  }

  if (cargando) {
    return <p className="text-sm text-muted-foreground">Cargando alertas...</p>;
  }

  if (alertas.length === 0) {
    return (
      <EmptyState
        icon={BellRing}
        title="Sin alertas registradas"
        description="Las alertas de vencimientos y mantenimientos programados se generan con el proceso automático que se activará en las etapas finales (con envío por correo)."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Título</TableHead>
            <TableHead className="hidden sm:table-cell">Descripción</TableHead>
            <TableHead>Nivel</TableHead>
            <TableHead>Situación</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alertas.map((alerta) => (
            <TableRow key={alerta.id} className={alerta.resuelta ? "opacity-60" : undefined}>
              <TableCell className="tabular-nums">{formatearFecha(alerta.fecha_alerta)}</TableCell>
              <TableCell className="font-medium">{alerta.titulo}</TableCell>
              <TableCell className="hidden max-w-xs text-sm text-muted-foreground sm:table-cell">
                {alerta.descripcion ?? "—"}
              </TableCell>
              <TableCell>
                <NivelVencimientoBadge estado={alerta.nivel} />
              </TableCell>
              <TableCell>
                {alerta.resuelta ? (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Resuelta
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700 border-amber-200 text-xs dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900"
                  >
                    Activa
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
