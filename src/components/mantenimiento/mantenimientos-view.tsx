"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CircleCheck,
  CirclePlus,
  CircleX,
  Pencil,
  Repeat,
  Search,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  MantenimientoFormDialog,
} from "@/components/mantenimiento/mantenimiento-form-dialog";
import {
  ProgramacionFormDialog,
} from "@/components/mantenimiento/programacion-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listarMantenimientos } from "@/services/mantenimientos";
import { obtenerConfigAlertas } from "@/services/config";
import {
  desactivarProgramacion,
  listarProgramaciones,
  reactivarProgramacion,
} from "@/services/programaciones";
import { listarCategoriasActivas } from "@/services/categorias";
import { listarVehiculos } from "@/services/vehiculos";
import { formatearFecha, formatearMoneda, type EstadoVencimiento } from "@/lib/formato";
import {
  CONFIG_ALERTAS_POR_DEFECTO,
  estadoProgramacion,
  etiquetaNivel,
} from "@/lib/alertas";
import type {
  CategoriaMantenimiento,
  ConfigAlertas,
  Mantenimiento,
  ModoProgramacion,
  Programacion,
  Vehiculo,
} from "@/types/database";

const filasSkeleton = [0, 1, 2, 3, 4];

const nivelClases: Record<string, string> = {
  vencido:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
  urgente:
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900",
  proximo_vencer:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  vigente:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  sin_dato: "bg-muted text-muted-foreground",
};

export function NivelProgramacionBadge({ nivel }: { nivel: string }) {
  return (
    <Badge variant="outline" className={nivelClases[nivel] ?? nivelClases.sin_dato}>
      {etiquetaNivel(nivel as EstadoVencimiento)}
    </Badge>
  );
}

export function etiquetaModo(modo: ModoProgramacion): string {
  switch (modo) {
    case "kilometraje":
      return "Por km";
    case "tiempo":
      return "Por tiempo";
    default:
      return "Km y tiempo";
  }
}

function etiquetaIntervalo(prog: Programacion): string {
  const partes: string[] = [];
  if (prog.intervalo_km != null) partes.push(`${prog.intervalo_km.toLocaleString("es-AR")} km`);
  if (prog.intervalo_dias != null) partes.push(`${prog.intervalo_dias} días`);
  return partes.join(" · ") || "—";
}

function etiquetaProximo(prog: Programacion): string {
  const partes: string[] = [];
  if (prog.proxima_fecha_estimada) partes.push(formatearFecha(prog.proxima_fecha_estimada));
  if (prog.proximo_kilometraje_estimado != null) {
    partes.push(`${prog.proximo_kilometraje_estimado.toLocaleString("es-AR")} km`);
  }
  return partes.join(" · ") || "Sin estimación";
}

function resumenUltimo(prog: Programacion): string {
  const partes: string[] = [];
  if (prog.fecha_ultimo_mantenimiento) partes.push(formatearFecha(prog.fecha_ultimo_mantenimiento));
  if (prog.kilometraje_ultimo_mantenimiento != null) {
    partes.push(`${prog.kilometraje_ultimo_mantenimiento.toLocaleString("es-AR")} km`);
  }
  return partes.join(" · ") || "Sin registrar";
}

export function MantenimientosView() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMantenimiento[]>([]);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [programaciones, setProgramaciones] = useState<Programacion[]>([]);
  const [config, setConfig] = useState<ConfigAlertas>(CONFIG_ALERTAS_POR_DEFECTO);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [tabActivo, setTabActivo] = useState("registros");
  const [busquedaRegistros, setBusquedaRegistros] = useState("");
  const [filtroVehiculoRegistros, setFiltroVehiculoRegistros] = useState("todos");
  const [filtroCategoriaRegistros, setFiltroCategoriaRegistros] = useState("todas");
  const [busquedaProgramados, setBusquedaProgramados] = useState("");
  const [filtroVehiculoProgramados, setFiltroVehiculoProgramados] = useState("todos");
  const [mostrarProgramados, setMostrarProgramados] = useState<"activos" | "inactivos" | "todos">("activos");

  const [mantenimientoForm, setMantenimientoForm] = useState(false);
  const [mantenimientoEditando, setMantenimientoEditando] = useState<Mantenimiento | null>(null);
  const [programacionForm, setProgramacionForm] = useState(false);
  const [programacionEditando, setProgramacionEditando] = useState<Programacion | null>(null);
  const [programacionAccion, setProgramacionAccion] = useState<Programacion | null>(null);

  async function cargar() {
    setErrorCarga(null);
    try {
      const [listaVehiculos, listaCategorias, listaMantenimientos, listaProgramaciones, configAlertas] =
        await Promise.all([
          listarVehiculos(),
          listarCategoriasActivas(),
          listarMantenimientos(),
          listarProgramaciones(),
          obtenerConfigAlertas(),
        ]);
      setVehiculos(listaVehiculos);
      setCategorias(listaCategorias);
      setMantenimientos(listaMantenimientos);
      setProgramaciones(listaProgramaciones);
      setConfig(configAlertas);
    } catch (error) {
      setErrorCarga(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    let activo = true;
    Promise.all([
      listarVehiculos(),
      listarCategoriasActivas(),
      listarMantenimientos(),
      listarProgramaciones(),
      obtenerConfigAlertas(),
    ])
      .then(([listaVehiculos, listaCategorias, listaMantenimientos, listaProgramaciones, configAlertas]) => {
        if (!activo) return;
        setVehiculos(listaVehiculos);
        setCategorias(listaCategorias);
        setMantenimientos(listaMantenimientos);
        setProgramaciones(listaProgramaciones);
        setConfig(configAlertas);
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

  const vehiculosSelect = useMemo(
    () => vehiculos.filter((v) => v.activo),
    [vehiculos]
  );

  const registrosFiltrados = useMemo(() => {
    const q = busquedaRegistros.trim().toLowerCase();
    return mantenimientos.filter((m) => {
      if (filtroVehiculoRegistros !== "todos" && m.vehiculo_id !== filtroVehiculoRegistros) return false;
      if (filtroCategoriaRegistros !== "todas" && m.categoria_id !== filtroCategoriaRegistros) return false;
      if (!q) return true;
      const campos = [
        m.trabajo_realizado,
        m.taller ?? "",
        m.observaciones ?? "",
        String(m.vehiculos?.numero_vehiculo ?? ""),
        m.vehiculos?.patente ?? "",
        `${m.vehiculos?.marca ?? ""} ${m.vehiculos?.modelo ?? ""}`,
        m.categorias_mantenimiento?.nombre ?? "",
      ];
      return campos.some((c) => c.toLowerCase().includes(q));
    });
  }, [mantenimientos, busquedaRegistros, filtroVehiculoRegistros, filtroCategoriaRegistros]);

  const programadosFiltrados = useMemo(() => {
    const q = busquedaProgramados.trim().toLowerCase();
    return programaciones
      .filter((p) => {
        if (mostrarProgramados === "activos" && !p.activo) return false;
        if (mostrarProgramados === "inactivos" && p.activo) return false;
        if (filtroVehiculoProgramados !== "todos" && p.vehiculo_id !== filtroVehiculoProgramados) return false;
        if (!q) return true;
        const campos = [
          String(p.vehiculos?.numero_vehiculo ?? ""),
          p.vehiculos?.patente ?? "",
          `${p.vehiculos?.marca ?? ""} ${p.vehiculos?.modelo ?? ""}`,
          p.categorias_mantenimiento?.nombre ?? "",
        ];
        return campos.some((c) => c.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        const nivelA = estadoProgramacion(a, config);
        const nivelB = estadoProgramacion(b, config);
        const peso: Record<string, number> = { vencido: 0, urgente: 1, proximo_vencer: 2, vigente: 3, sin_dato: 4 };
        return peso[nivelA] - peso[nivelB];
      });
  }, [programaciones, busquedaProgramados, filtroVehiculoProgramados, mostrarProgramados, config]);

  function abrirNuevoRegistro() {
    setMantenimientoEditando(null);
    setMantenimientoForm(true);
  }

  function abrirEdicionRegistro(mantenimiento: Mantenimiento) {
    setMantenimientoEditando(mantenimiento);
    setMantenimientoForm(true);
  }

  function abrirNuevaProgramacion() {
    setProgramacionEditando(null);
    setProgramacionForm(true);
  }

  function abrirEdicionProgramacion(programacion: Programacion) {
    setProgramacionEditando(programacion);
    setProgramacionForm(true);
  }

  async function confirmarAccionProgramacion() {
    if (!programacionAccion) return;
    try {
      if (programacionAccion.activo) {
        await desactivarProgramacion(programacionAccion.id);
        toast.success("Programación desactivada", {
          description: "Deja de generar alertas. El registro se conserva y podés reactivarla.",
        });
      } else {
        await reactivarProgramacion(programacionAccion.id);
        toast.success("Programación reactivada");
      }
      const lista = await listarProgramaciones();
      setProgramaciones(lista);
    } catch (error) {
      toast.error("No se pudo actualizar la programación", {
        description: error instanceof Error ? error.message : "Error desconocido.",
      });
    }
  }

  function vehiculosParaForm(registro?: Mantenimiento | Programacion | null): Vehiculo[] {
    if (!registro) return vehiculosSelect;
    const vehiculo = vehiculos.find((v) => v.id === registro.vehiculo_id);
    if (vehiculo && vehiculo.activo) return vehiculosSelect;
    if (vehiculo) return [...vehiculosSelect, vehiculo];
    return vehiculosSelect;
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={tabActivo} onValueChange={setTabActivo}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-auto w-fit">
            <TabsTrigger value="registros" className="gap-1.5">
              <Wrench className="size-3.5" />
              Registros
            </TabsTrigger>
            <TabsTrigger value="programados" className="gap-1.5">
              <Repeat className="size-3.5" />
              Programados
            </TabsTrigger>
          </TabsList>
          {tabActivo === "registros" ? (
            <Button onClick={abrirNuevoRegistro} className="shrink-0">
              <CirclePlus className="size-4" />
              Registrar mantenimiento
            </Button>
          ) : (
            <Button onClick={abrirNuevaProgramacion} className="shrink-0">
              <CirclePlus className="size-4" />
              Nueva programación
            </Button>
          )}
        </div>

        <TabsContent value="registros" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="buscar-mantenimientos" className="sr-only">
                Buscar
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="buscar-mantenimientos"
                  placeholder="Buscar por trabajo, taller, vehículo o categoría..."
                  className="pl-8"
                  value={busquedaRegistros}
                  onChange={(e) => setBusquedaRegistros(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
              <div className="space-y-1.5">
                <Label className="sr-only" htmlFor="filtro-vehiculo-registros">
                  Vehículo
                </Label>
                <Select value={filtroVehiculoRegistros} onValueChange={setFiltroVehiculoRegistros}>
                  <SelectTrigger id="filtro-vehiculo-registros" className="w-full sm:w-52">
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
              <div className="space-y-1.5">
                <Label className="sr-only" htmlFor="filtro-categoria-registros">
                  Categoría
                </Label>
                <Select value={filtroCategoriaRegistros} onValueChange={setFiltroCategoriaRegistros}>
                  <SelectTrigger id="filtro-categoria-registros" className="w-full sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las categorías</SelectItem>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {cargando ? (
            <div className="rounded-xl border">
              {filasSkeleton.map((i) => (
                <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="hidden h-4 w-40 sm:block" />
                  <Skeleton className="ml-auto h-4 w-24" />
                </div>
              ))}
            </div>
          ) : errorCarga ? (
            <EmptyState
              icon={Wrench}
              title="Error al cargar los mantenimientos"
              description={errorCarga}
            >
              <Button variant="outline" size="sm" onClick={cargar} className="mt-2">
                Reintentar
              </Button>
            </EmptyState>
          ) : registrosFiltrados.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title={
                mantenimientos.length === 0
                  ? "No hay mantenimientos registrados"
                  : "No se encontraron mantenimientos"
              }
              description={
                mantenimientos.length === 0
                  ? "Registrá el primer trabajo de mantenimiento para comenzar a construir el historial."
                  : "Probá con otros términos de búsqueda o cambiá los filtros."
              }
            >
              {mantenimientos.length === 0 ? (
                <Button size="sm" onClick={abrirNuevoRegistro} className="mt-2">
                  <CirclePlus className="size-4" />
                  Registrar mantenimiento
                </Button>
              ) : null}
            </EmptyState>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                    <TableHead>Vehículo</TableHead>
                    <TableHead className="hidden md:table-cell">Categoría</TableHead>
                    <TableHead>Trabajo</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Km</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrosFiltrados.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="hidden tabular-nums sm:table-cell">
                        {formatearFecha(m.fecha)}
                      </TableCell>
                      <TableCell>
                        <div className="leading-tight">
                          <p className="font-medium tabular-nums">
                            <Link href={`/flota/${m.vehiculo_id}`} className="hover:underline">
                              {m.vehiculos?.numero_vehiculo ?? "?"} · {m.vehiculos?.patente ?? "—"}
                            </Link>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatearFecha(m.fecha)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {m.categorias_mantenimiento?.nombre ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate text-sm" title={m.trabajo_realizado}>
                          {m.trabajo_realizado}
                        </p>
                        {m.taller ? (
                          <p className="text-xs text-muted-foreground">{m.taller}</p>
                        ) : null}
                      </TableCell>
                      <TableCell className="hidden tabular-nums text-right sm:table-cell">
                        {m.kilometraje.toLocaleString("es-AR")}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatearMoneda(Number(m.costo_total))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Editar mantenimiento"
                          onClick={() => abrirEdicionRegistro(m)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
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
              : `${registrosFiltrados.length} registro(s) mostrados de ${mantenimientos.length} en total`}
          </p>
        </TabsContent>

        <TabsContent value="programados" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="buscar-programados" className="sr-only">
                Buscar
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="buscar-programados"
                  placeholder="Buscar por vehículo o categoría..."
                  className="pl-8"
                  value={busquedaProgramados}
                  onChange={(e) => setBusquedaProgramados(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
              <div className="space-y-1.5">
                <Label className="sr-only" htmlFor="filtro-vehiculo-programados">
                  Vehículo
                </Label>
                <Select value={filtroVehiculoProgramados} onValueChange={setFiltroVehiculoProgramados}>
                  <SelectTrigger id="filtro-vehiculo-programados" className="w-full sm:w-52">
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
              <div className="space-y-1.5">
                <Label className="sr-only" htmlFor="mostrar-programados">
                  Mostrar
                </Label>
                <Select
                  value={mostrarProgramados}
                  onValueChange={(v) => setMostrarProgramados(v as typeof mostrarProgramados)}
                >
                  <SelectTrigger id="mostrar-programados" className="w-full sm:w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activos">Activas</SelectItem>
                    <SelectItem value="inactivos">Desactivadas</SelectItem>
                    <SelectItem value="todos">Todas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {cargando ? (
            <div className="rounded-xl border">
              {filasSkeleton.map((i) => (
                <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="hidden h-4 w-36 md:block" />
                  <Skeleton className="ml-auto h-5 w-20" />
                </div>
              ))}
            </div>
          ) : errorCarga ? (
            <EmptyState
              icon={CalendarClock}
              title="Error al cargar las programaciones"
              description={errorCarga}
            >
              <Button variant="outline" size="sm" onClick={cargar} className="mt-2">
                Reintentar
              </Button>
            </EmptyState>
          ) : programadosFiltrados.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title={
                programaciones.length === 0
                  ? "No hay programaciones creadas"
                  : "No se encontraron programaciones"
              }
              description={
                programaciones.length === 0
                  ? "Creá una programación para recibir avisos cuando un mantenimiento por km o por tiempo esté por vencer."
                  : "Probá con otros términos de búsqueda o cambiá los filtros."
              }
            >
              {programaciones.length === 0 ? (
                <Button size="sm" onClick={abrirNuevaProgramacion} className="mt-2">
                  <CirclePlus className="size-4" />
                  Nueva programación
                </Button>
              ) : null}
            </EmptyState>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehículo</TableHead>
                    <TableHead className="hidden md:table-cell">Categoría</TableHead>
                    <TableHead className="hidden sm:table-cell">Modo · Intervalo</TableHead>
                    <TableHead className="hidden lg:table-cell">Último</TableHead>
                    <TableHead>Próximo estimado</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programadosFiltrados.map((p) => {
                    const nivel = estadoProgramacion(p, config);
                    return (
                      <TableRow key={p.id} className={!p.activo ? "opacity-60" : undefined}>
                        <TableCell>
                          <div className="leading-tight">
                            <p className="font-medium tabular-nums">
                              <Link href={`/flota/${p.vehiculo_id}`} className="hover:underline">
                                {p.vehiculos?.numero_vehiculo ?? "?"} · {p.vehiculos?.patente ?? "—"}
                              </Link>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {p.vehiculos?.marca} {p.vehiculos?.modelo}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {p.categorias_mantenimiento?.nombre ?? "—"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <p className="text-sm">{etiquetaModo(p.modo)}</p>
                          <p className="text-xs text-muted-foreground">{etiquetaIntervalo(p)}</p>
                        </TableCell>
                        <TableCell className="hidden text-sm tabular-nums lg:table-cell">
                          {resumenUltimo(p)}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {etiquetaProximo(p)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <NivelProgramacionBadge nivel={nivel} />
                            {!p.activo ? (
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                Desactivada
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Editar programación"
                              onClick={() => abrirEdicionProgramacion(p)}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={p.activo ? "Desactivar programación" : "Reactivar programación"}
                              onClick={() => setProgramacionAccion(p)}
                            >
                              {p.activo ? (
                                <CircleX className="size-3.5" />
                              ) : (
                                <CircleCheck className="size-3.5" />
                              )}
                            </Button>
                          </div>
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
              : `${programadosFiltrados.length} programación(es) mostradas · ${
                  programaciones.filter((p) => p.activo).length
                } activa(s)`}
          </p>
        </TabsContent>
      </Tabs>

      <MantenimientoFormDialog
        open={mantenimientoForm}
        onOpenChange={setMantenimientoForm}
        mantenimiento={mantenimientoEditando}
        vehiculos={vehiculosParaForm(mantenimientoEditando)}
        categorias={categorias}
        onGuardado={() => cargar()}
      />

      <ProgramacionFormDialog
        open={programacionForm}
        onOpenChange={setProgramacionForm}
        programacion={programacionEditando}
        vehiculos={vehiculosParaForm(programacionEditando)}
        categorias={categorias}
        onGuardado={() => cargar()}
      />

      <ConfirmDialog
        open={!!programacionAccion}
        onOpenChange={(abierto) => {
          if (!abierto) setProgramacionAccion(null);
        }}
        title={
          programacionAccion?.activo
            ? "¿Desactivar esta programación?"
            : "¿Reactivar esta programación?"
        }
        description={
          programacionAccion?.activo
            ? "La programación deja de considerarse para alertas y estimaciones. No se elimina ningún registro y podés reactivarla cuando quieras."
            : "La programación vuelve a estar activa y participa de las alertas."
        }
        confirmLabel={programacionAccion?.activo ? "Desactivar" : "Reactivar"}
        destructive={programacionAccion?.activo}
        onConfirm={confirmarAccionProgramacion}
      />
    </div>
  );
}
