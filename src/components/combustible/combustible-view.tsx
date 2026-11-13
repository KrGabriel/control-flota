"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CirclePlus, Fuel, Gauge, Pencil, Search, Wallet } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { CargaCombustibleFormDialog } from "@/components/combustible/carga-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listarCargas } from "@/services/combustible";
import { listarTecnicosActivos } from "@/services/tecnicos";
import { listarVehiculos } from "@/services/vehiculos";
import { formatearFecha, formatearMoneda } from "@/lib/formato";
import { calcularEstadisticas } from "@/lib/consumo";
import { nombreTecnico } from "@/components/shared/estado-badges";
import type { CargaCombustible, TecnicoResumen, Vehiculo } from "@/types/database";

const filasSkeleton = [0, 1, 2, 3, 4];

export function CombustibleView() {
  const [cargas, setCargas] = useState<CargaCombustible[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [tecnicos, setTecnicos] = useState<TecnicoResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroVehiculo, setFiltroVehiculo] = useState("todos");
  const [formAbierto, setFormAbierto] = useState(false);
  const [cargaEditando, setCargaEditando] = useState<CargaCombustible | null>(null);

  async function cargar() {
    setErrorCarga(null);
    try {
      const [listaCargas, listaVehiculos, listaTecnicos] = await Promise.all([
        listarCargas(),
        listarVehiculos(),
        listarTecnicosActivos(),
      ]);
      setCargas(listaCargas);
      setVehiculos(listaVehiculos);
      setTecnicos(listaTecnicos);
    } catch (error) {
      setErrorCarga(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    let activo = true;
    Promise.all([listarCargas(), listarVehiculos(), listarTecnicosActivos()])
      .then(([listaCargas, listaVehiculos, listaTecnicos]) => {
        if (!activo) return;
        setCargas(listaCargas);
        setVehiculos(listaVehiculos);
        setTecnicos(listaTecnicos);
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

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return cargas.filter((c) => {
      if (filtroVehiculo !== "todos" && c.vehiculo_id !== filtroVehiculo) return false;
      if (!q) return true;
      const campos = [
        c.fecha,
        String(c.vehiculos?.numero_vehiculo ?? ""),
        c.vehiculos?.patente ?? "",
        `${c.vehiculos?.marca ?? ""} ${c.vehiculos?.modelo ?? ""}`,
        nombreTecnico(c.tecnicos ?? null),
        c.observaciones ?? "",
      ];
      return campos.some((campo) => campo.toLowerCase().includes(q));
    });
  }, [cargas, busqueda, filtroVehiculo]);

  const { stats, rendimientoPorCarga } = useMemo(
    () => calcularEstadisticas(filtradas),
    [filtradas]
  );

  function abrirNueva() {
    setCargaEditando(null);
    setFormAbierto(true);
  }

  function abrirEdicion(carga: CargaCombustible) {
    setCargaEditando(carga);
    setFormAbierto(true);
  }

  const vehiculosSelect = useMemo(
    () => vehiculos.filter((v) => v.activo),
    [vehiculos]
  );

  function vehiculosParaForm(registro?: CargaCombustible | null): Vehiculo[] {
    if (!registro) return vehiculosSelect;
    const vehiculo = vehiculos.find((v) => v.id === registro.vehiculo_id);
    if (vehiculo && vehiculo.activo) return vehiculosSelect;
    if (vehiculo) return [...vehiculosSelect, vehiculo];
    return vehiculosSelect;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Gasto total"
          value={formatearMoneda(stats.gastoTotal)}
          icon={Wallet}
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
          hint={
            stats.distanciaTotal !== null
              ? `${stats.distanciaTotal.toLocaleString("es-AR")} km entre cargas`
              : "Se calcula con al menos 2 cargas por vehículo"
          }
        />
        <div className="hidden lg:block" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="buscar-cargas" className="sr-only">
            Buscar
          </Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="buscar-cargas"
              placeholder="Buscar por fecha, vehículo, técnico u observaciones..."
              className="pl-8"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5 sm:w-52">
          <Label className="sr-only" htmlFor="filtro-vehiculo-cargas">
            Vehículo
          </Label>
          <Select value={filtroVehiculo} onValueChange={setFiltroVehiculo}>
            <SelectTrigger id="filtro-vehiculo-cargas" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los vehículos</SelectItem>
              {vehiculos.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.numero_vehiculo} · {v.patente}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={abrirNueva} className="shrink-0">
          <CirclePlus className="size-4" />
          Registrar carga
        </Button>
      </div>

      {cargando ? (
        <div className="rounded-xl border">
          {filasSkeleton.map((i) => (
            <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="hidden h-4 w-36 sm:block" />
              <Skeleton className="ml-auto h-4 w-24" />
            </div>
          ))}
        </div>
      ) : errorCarga ? (
        <EmptyState
          icon={Fuel}
          title="Error al cargar las cargas de combustible"
          description={errorCarga}
        >
          <Button variant="outline" size="sm" onClick={cargar} className="mt-2">
            Reintentar
          </Button>
        </EmptyState>
      ) : filtradas.length === 0 ? (
        <EmptyState
          icon={Fuel}
          title={
            cargas.length === 0
              ? "No hay cargas de combustible registradas"
              : "No se encontraron cargas"
          }
          description={
            cargas.length === 0
              ? "Registrá la primera carga para empezar a medir el consumo de la flota."
              : "Probá con otros términos de búsqueda o cambiá los filtros."
          }
        >
          {cargas.length === 0 ? (
            <Button size="sm" onClick={abrirNueva} className="mt-2">
              <CirclePlus className="size-4" />
              Registrar carga
            </Button>
          ) : null}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead className="hidden md:table-cell">Técnico</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Km</TableHead>
                <TableHead className="text-right">Litros</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Precio/L</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Km/L</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((c) => {
                const rendimiento = rendimientoPorCarga[c.id];
                return (
                  <TableRow key={c.id}>
                    <TableCell className="tabular-nums">{formatearFecha(c.fecha)}</TableCell>
                    <TableCell>
                      <div className="leading-tight">
                        <p className="font-medium tabular-nums">
                          <Link href={`/flota/${c.vehiculo_id}`} className="hover:underline">
                            {c.vehiculos?.numero_vehiculo ?? "?"} · {c.vehiculos?.patente ?? "—"}
                          </Link>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.vehiculos?.marca} {c.vehiculos?.modelo}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {nombreTecnico(c.tecnicos ?? null)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
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
                        ? `${rendimiento.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Editar carga"
                        onClick={() => abrirEdicion(c)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {cargando
          ? null
          : `${filtradas.length} carga(s) mostradas de ${cargas.length} en total · El km/L se estima entre cargas consecutivas del mismo vehículo`}
      </p>

      <CargaCombustibleFormDialog
        open={formAbierto}
        onOpenChange={setFormAbierto}
        carga={cargaEditando}
        vehiculos={vehiculosParaForm(cargaEditando)}
        tecnicos={tecnicos}
        onGuardado={() => cargar()}
      />
    </div>
  );
}
