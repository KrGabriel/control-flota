"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarX2, Search, TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listarVehiculos } from "@/services/vehiculos";
import { formatearFecha, estadoVencimiento, hoyISO, type EstadoVencimiento } from "@/lib/formato";
import { EstadoFisicaBadge } from "@/components/shared/estado-badges";
import type { EstadoFisica, Vehiculo } from "@/types/database";

const filasSkeleton = [0, 1, 2, 3, 4];

const nivelClases: Record<EstadoVencimiento, string> = {
  vigente:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  proximo_vencer:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  urgente:
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900",
  vencido:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
  sin_dato: "bg-muted text-muted-foreground",
};

const nivelEtiquetas: Record<EstadoVencimiento, string> = {
  vigente: "Vigente",
  proximo_vencer: "Próximo",
  urgente: "Urgente",
  vencido: "Vencido",
  sin_dato: "Sin dato",
};

export function NivelVencimientoBadge({ estado }: { estado: EstadoVencimiento }) {
  return (
    <Badge variant="outline" className={nivelClases[estado]}>
      {nivelEtiquetas[estado]}
    </Badge>
  );
}

interface CeldaVencimiento {
  fecha: string | null;
  estado: EstadoVencimiento;
}

const PESO: Record<EstadoVencimiento, number> = {
  vencido: 0,
  urgente: 1,
  proximo_vencer: 2,
  vigente: 3,
  sin_dato: 4,
};

function peorEstado(estados: EstadoVencimiento[]): EstadoVencimiento {
  return estados.reduce((peor, actual) =>
    PESO[actual] < PESO[peor] ? actual : peor
  );
}

export function VencimientosView() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [mostrar, setMostrar] = useState<"activos" | "todos">("activos");

  async function cargar() {
    setErrorCarga(null);
    try {
      setVehiculos(await listarVehiculos());
    } catch (error) {
      setErrorCarga(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    let activo = true;
    listarVehiculos()
      .then((lista) => {
        if (!activo) return;
        setVehiculos(lista);
        setCargando(false);
      })
      .catch((error) => {
        if (!activo) return;
        setErrorCarga(error instanceof Error ? error.message : "Error desconocido");
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const filas = useMemo(() => {
    const hoy = hoyISO();
    return vehiculos
      .filter((v) => (mostrar === "activos" ? v.activo : true))
      .map((v) => {
        const vtv: CeldaVencimiento = {
          fecha: v.fecha_proxima_vtv,
          estado: estadoVencimiento(v.fecha_proxima_vtv),
        };
        const seguro: CeldaVencimiento = {
          fecha: v.fecha_vencimiento_seguro,
          estado: estadoVencimiento(v.fecha_vencimiento_seguro),
        };
        const matafuego: CeldaVencimiento = {
          fecha: v.fecha_vencimiento_matafuego,
          estado: estadoVencimiento(v.fecha_vencimiento_matafuego),
        };
        const estadoGeneral = peorEstado([vtv.estado, seguro.estado, matafuego.estado]);
        const proximoVencimiento = [vtv, seguro, matafuego]
          .filter((c) => c.fecha && c.fecha > hoy)
          .map((c) => c.fecha!)
          .sort()[0] ?? null;
        return { vehiculo: v, vtv, seguro, matafuego, estadoGeneral, proximoVencimiento };
      })
      .filter((fila) => {
        const q = busqueda.trim().toLowerCase();
        if (filtroEstado !== "todos" && fila.estadoGeneral !== filtroEstado) return false;
        if (!q) return true;
        const campos = [
          String(fila.vehiculo.numero_vehiculo),
          fila.vehiculo.patente,
          `${fila.vehiculo.marca} ${fila.vehiculo.modelo}`,
        ];
        return campos.some((c) => c.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (PESO[a.estadoGeneral] !== PESO[b.estadoGeneral]) {
          return PESO[a.estadoGeneral] - PESO[b.estadoGeneral];
        }
        if (a.proximoVencimiento && b.proximoVencimiento) {
          return a.proximoVencimiento < b.proximoVencimiento ? -1 : 1;
        }
        return a.proximoVencimiento ? -1 : 1;
      });
  }, [vehiculos, busqueda, filtroEstado, mostrar]);

  const resumen = useMemo(() => {
    let vencidos = 0;
    let urgentes = 0;
    let proximos = 0;
    for (const fila of filas) {
      for (const celda of [fila.vtv, fila.seguro, fila.matafuego]) {
        if (celda.estado === "vencido") vencidos++;
        else if (celda.estado === "urgente") urgentes++;
        else if (celda.estado === "proximo_vencer") proximos++;
      }
    }
    return { vencidos, urgentes, proximos };
  }, [filas]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Vencimientos vencidos"
          value={resumen.vencidos}
          icon={CalendarX2}
          tone={resumen.vencidos > 0 ? "destructive" : "default"}
          hint="VTV, seguro o matafuego"
        />
        <StatCard
          title="Urgentes (≤ 7 días)"
          value={resumen.urgentes}
          icon={TriangleAlert}
          tone={resumen.urgentes > 0 ? "warning" : "default"}
          hint="Renovar a la brevedad"
        />
        <StatCard
          title="Próximos (≤ 30 días)"
          value={resumen.proximos}
          icon={TriangleAlert}
          tone={resumen.proximos > 0 ? "warning" : "default"}
          hint="Planificar renovación"
        />
        <div className="hidden lg:block" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="buscar-vencimientos" className="sr-only">
            Buscar
          </Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="buscar-vencimientos"
              placeholder="Buscar por número, patente o marca..."
              className="pl-8"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
          <div className="space-y-1.5">
            <Label className="sr-only" htmlFor="filtro-estado-vencimientos">
              Estado
            </Label>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger id="filtro-estado-vencimientos" className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="vencido">Con vencidos</SelectItem>
                <SelectItem value="urgente">Con urgentes</SelectItem>
                <SelectItem value="proximo_vencer">Con próximos</SelectItem>
                <SelectItem value="vigente">Al día</SelectItem>
                <SelectItem value="sin_dato">Sin datos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="sr-only" htmlFor="mostrar-vencimientos">
              Mostrar
            </Label>
            <Select value={mostrar} onValueChange={(v) => setMostrar(v as typeof mostrar)}>
              <SelectTrigger id="mostrar-vencimientos" className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activos">Activos</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {cargando ? (
        <div className="rounded-xl border">
          {filasSkeleton.map((i) => (
            <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="hidden h-5 w-24 sm:block" />
              <Skeleton className="hidden h-5 w-24 md:block" />
            </div>
          ))}
        </div>
      ) : errorCarga ? (
        <EmptyState
          icon={CalendarX2}
          title="Error al cargar los vencimientos"
          description={errorCarga}
        >
          <Button variant="outline" size="sm" onClick={cargar} className="mt-2">
            Reintentar
          </Button>
        </EmptyState>
      ) : filas.length === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title={
            vehiculos.length === 0
              ? "No hay vehículos cargados"
              : "No hay vencimientos que coincidan"
          }
          description={
            vehiculos.length === 0
              ? "Registrá vehículos en el módulo Flota para ver sus vencimientos aquí."
              : "Probá con otros términos de búsqueda o cambiá los filtros."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehículo</TableHead>
                <TableHead>Próxima VTV</TableHead>
                <TableHead className="hidden sm:table-cell">Venc. seguro</TableHead>
                <TableHead className="hidden md:table-cell">Venc. matafuego</TableHead>
                <TableHead className="hidden lg:table-cell">Botiquín</TableHead>
                <TableHead className="hidden lg:table-cell">Cubiertas</TableHead>
                <TableHead>Estado general</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((fila) => (
                <TableRow key={fila.vehiculo.id} className={!fila.vehiculo.activo ? "opacity-60" : undefined}>
                  <TableCell>
                    <div className="leading-tight">
                      <p className="font-medium tabular-nums">
                        <Link
                          href={`/flota/${fila.vehiculo.id}`}
                          className="hover:underline"
                        >
                          {fila.vehiculo.numero_vehiculo} · {fila.vehiculo.patente}
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fila.vehiculo.marca} {fila.vehiculo.modelo} · {fila.vehiculo.anio}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-sm tabular-nums">{formatearFecha(fila.vtv.fecha)}</span>
                      <NivelVencimientoBadge estado={fila.vtv.estado} />
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-sm tabular-nums">{formatearFecha(fila.seguro.fecha)}</span>
                      <NivelVencimientoBadge estado={fila.seguro.estado} />
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-sm tabular-nums">{formatearFecha(fila.matafuego.fecha)}</span>
                      <NivelVencimientoBadge estado={fila.matafuego.estado} />
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <EstadoFisicaBadge estado={fila.vehiculo.estado_botiquin as EstadoFisica} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <EstadoFisicaBadge estado={fila.vehiculo.estado_cubiertas as EstadoFisica} />
                  </TableCell>
                  <TableCell>
                    <NivelVencimientoBadge estado={fila.estadoGeneral} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {cargando
          ? null
          : `${filas.length} vehículo(s) mostrados · Anticipos: urgente ≤ 7 días, próximo ≤ 30 días`}
      </p>
    </div>
  );
}
