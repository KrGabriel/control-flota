"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Car,
  ChevronDown,
  ChevronUp,
  CirclePlus,
  Eye,
  Pencil,
  Power,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  EstadoOperativoBadge,
  EstadoVehiculoBadge,
  nombreTecnico,
} from "@/components/shared/estado-badges";
import { VehiculoFormDialog } from "@/components/vehiculos/vehiculo-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { desactivarVehiculo, listarVehiculos, reactivarVehiculo } from "@/services/vehiculos";
import { listarTecnicosActivos } from "@/services/tecnicos";
import { ESTADOS_OPERATIVOS, type Vehiculo } from "@/types/database";

type OrdenCampo = "numero_vehiculo" | "patente" | "marca" | "kilometraje_actual" | "estado_operativo";
type Mostrar = "activos" | "inactivos" | "todos";

const filasSkeleton = [0, 1, 2, 3, 4];

export function VehiculosView() {
  const router = useRouter();
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [tecnicos, setTecnicos] = useState<{ id: string; nombre: string; apellido: string }[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [mostrar, setMostrar] = useState<Mostrar>("activos");
  const [ordenCampo, setOrdenCampo] = useState<OrdenCampo>("numero_vehiculo");
  const [ordenDir, setOrdenDir] = useState<"asc" | "desc">("asc");
  const [formAbierto, setFormAbierto] = useState(false);
  const [vehiculoEditando, setVehiculoEditando] = useState<Vehiculo | null>(null);
  const [vehiculoAccion, setVehiculoAccion] = useState<Vehiculo | null>(null);

  async function cargar() {
    setErrorCarga(null);
    try {
      const [listaVehiculos, listaTecnicos] = await Promise.all([
        listarVehiculos(),
        listarTecnicosActivos(),
      ]);
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
    Promise.all([listarVehiculos(), listarTecnicosActivos()])
      .then(([listaVehiculos, listaTecnicos]) => {
        if (!activo) return;
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

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    let lista = vehiculos.filter((v) => {
      if (mostrar === "activos" && !v.activo) return false;
      if (mostrar === "inactivos" && v.activo) return false;
      if (filtroEstado !== "todos" && v.estado_operativo !== filtroEstado) return false;
      if (!q) return true;
      const campos = [
        String(v.numero_vehiculo),
        v.patente,
        v.marca,
        v.modelo,
        v.tipo_vehiculo,
        nombreTecnico(v.tecnicos ?? null),
      ];
      return campos.some((c) => c.toLowerCase().includes(q));
    });

    lista = [...lista].sort((a, b) => {
      let cmp = 0;
      switch (ordenCampo) {
        case "numero_vehiculo":
          cmp = a.numero_vehiculo - b.numero_vehiculo;
          break;
        case "patente":
          cmp = a.patente.localeCompare(b.patente);
          break;
        case "marca":
          cmp = `${a.marca} ${a.modelo}`.localeCompare(`${b.marca} ${b.modelo}`);
          break;
        case "kilometraje_actual":
          cmp = a.kilometraje_actual - b.kilometraje_actual;
          break;
        case "estado_operativo":
          cmp = a.estado_operativo.localeCompare(b.estado_operativo);
          break;
      }
      return ordenDir === "asc" ? cmp : -cmp;
    });

    return lista;
  }, [vehiculos, busqueda, filtroEstado, mostrar, ordenCampo, ordenDir]);

  function alternarOrden(campo: OrdenCampo) {
    if (ordenCampo === campo) {
      setOrdenDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setOrdenCampo(campo);
      setOrdenDir("asc");
    }
  }

  function abrirNuevo() {
    setVehiculoEditando(null);
    setFormAbierto(true);
  }

  function abrirEdicion(vehiculo: Vehiculo) {
    setVehiculoEditando(vehiculo);
    setFormAbierto(true);
  }

  async function confirmarAccion() {
    if (!vehiculoAccion) return;
    try {
      if (vehiculoAccion.activo) {
        await desactivarVehiculo(vehiculoAccion.id);
        toast.success("Vehículo desactivado", {
          description: `${vehiculoAccion.numero_vehiculo} - ${vehiculoAccion.patente}. El historial se conserva intacto.`,
        });
      } else {
        await reactivarVehiculo(vehiculoAccion.id);
        toast.success("Vehículo reactivado", {
          description: `${vehiculoAccion.numero_vehiculo} - ${vehiculoAccion.patente}`,
        });
      }
      await cargar();
    } catch (error) {
      toast.error("No se pudo actualizar el vehículo", {
        description: error instanceof Error ? error.message : "Error desconocido.",
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="buscar-vehiculo" className="sr-only">
            Buscar
          </Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="buscar-vehiculo"
              placeholder="Buscar por número, patente, marca, modelo o técnico..."
              className="pl-8"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
          <div className="space-y-1.5">
            <Label className="sr-only" htmlFor="filtro-estado">
              Estado operativo
            </Label>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger id="filtro-estado" className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESTADOS_OPERATIVOS.map((estado) => (
                  <SelectItem key={estado.valor} value={estado.valor}>
                    {estado.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="sr-only" htmlFor="mostrar">
              Mostrar
            </Label>
            <Select value={mostrar} onValueChange={(v) => setMostrar(v as Mostrar)}>
              <SelectTrigger id="mostrar" className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activos">Activos</SelectItem>
                <SelectItem value="inactivos">Desactivados</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={abrirNuevo} className="shrink-0">
          <CirclePlus className="size-4" />
          Nuevo vehículo
        </Button>
      </div>

      {cargando ? (
        <div className="rounded-xl border">
          {filasSkeleton.map((i) => (
            <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="hidden h-4 w-40 sm:block" />
              <Skeleton className="hidden h-4 w-32 md:block" />
              <Skeleton className="ml-auto h-5 w-20" />
            </div>
          ))}
        </div>
      ) : errorCarga ? (
        <EmptyState
          icon={Car}
          title="Error al cargar los vehículos"
          description={errorCarga}
        >
          <Button variant="outline" size="sm" onClick={cargar} className="mt-2">
            Reintentar
          </Button>
        </EmptyState>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={Car}
          title={
            vehiculos.length === 0
              ? "No hay vehículos cargados"
              : "No se encontraron vehículos"
          }
          description={
            vehiculos.length === 0
              ? "Registrá el primer vehículo para comenzar a gestionar la flota."
              : "Probá con otros términos de búsqueda o cambiá los filtros."
          }
        >
          {vehiculos.length === 0 ? (
            <Button size="sm" onClick={abrirNuevo} className="mt-2">
              <CirclePlus className="size-4" />
              Registrar vehículo
            </Button>
          ) : null}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => alternarOrden("numero_vehiculo")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    N° <IconoOrden activo={ordenCampo === "numero_vehiculo"} dir={ordenDir} />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => alternarOrden("patente")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Patente <IconoOrden activo={ordenCampo === "patente"} dir={ordenDir} />
                  </button>
                </TableHead>
                <TableHead className="hidden sm:table-cell">
                  <button
                    type="button"
                    onClick={() => alternarOrden("marca")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Marca / Modelo <IconoOrden activo={ordenCampo === "marca"} dir={ordenDir} />
                  </button>
                </TableHead>
                <TableHead className="hidden lg:table-cell">Técnico responsable</TableHead>
                <TableHead className="hidden md:table-cell">
                  <button
                    type="button"
                    onClick={() => alternarOrden("kilometraje_actual")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Kilometraje{" "}
                    <IconoOrden activo={ordenCampo === "kilometraje_actual"} dir={ordenDir} />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => alternarOrden("estado_operativo")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Estado{" "}
                    <IconoOrden activo={ordenCampo === "estado_operativo"} dir={ordenDir} />
                  </button>
                </TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((vehiculo) => (
                <TableRow key={vehiculo.id} className={!vehiculo.activo ? "opacity-60" : undefined}>
                  <TableCell className="font-medium tabular-nums">
                    <Link
                      href={`/flota/${vehiculo.id}`}
                      className="font-heading text-primary hover:underline"
                    >
                      {vehiculo.numero_vehiculo}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/flota/${vehiculo.id}`} className="hover:underline">
                      {vehiculo.patente}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="leading-tight">
                      <p className="font-medium">{vehiculo.marca}</p>
                      <p className="text-xs text-muted-foreground">
                        {vehiculo.modelo} · {vehiculo.anio} · {vehiculo.tipo_vehiculo}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {nombreTecnico(vehiculo.tecnicos ?? null)}
                  </TableCell>
                  <TableCell className="hidden tabular-nums md:table-cell">
                    {vehiculo.kilometraje_actual.toLocaleString("es-AR")} km
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <EstadoOperativoBadge estado={vehiculo.estado_operativo} />
                      {!vehiculo.activo ? <EstadoVehiculoBadge activo={false} /> : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Ver ficha de ${vehiculo.patente}`}
                        onClick={() => router.push(`/flota/${vehiculo.id}`)}
                      >
                        <Eye className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Editar ${vehiculo.patente}`}
                        onClick={() => abrirEdicion(vehiculo)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={vehiculo.activo ? "Desactivar vehículo" : "Reactivar vehículo"}
                        onClick={() => setVehiculoAccion(vehiculo)}
                      >
                        <Power className="size-3.5" />
                      </Button>
                    </div>
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
          : `${filtrados.length} de ${vehiculos.length} vehículo(s) mostrados · ${
              vehiculos.filter((v) => v.activo).length
            } activo(s)`}
      </p>

      <VehiculoFormDialog
        open={formAbierto}
        onOpenChange={setFormAbierto}
        vehiculo={vehiculoEditando}
        tecnicos={tecnicos}
        onGuardado={() => cargar()}
      />

      <ConfirmDialog
        open={!!vehiculoAccion}
        onOpenChange={(abierto) => {
          if (!abierto) setVehiculoAccion(null);
        }}
        title={
          vehiculoAccion?.activo
            ? `¿Desactivar el vehículo ${vehiculoAccion?.numero_vehiculo}?`
            : `¿Reactivar el vehículo ${vehiculoAccion?.numero_vehiculo}?`
        }
        description={
          vehiculoAccion?.activo
            ? "El vehículo quedará oculto de las vistas principales. No se elimina ningún registro: el historial de asignaciones, mantenimientos y cargas se conserva."
            : "El vehículo volverá a estar activo y visible en la flota."
        }
        confirmLabel={vehiculoAccion?.activo ? "Desactivar" : "Reactivar"}
        destructive={vehiculoAccion?.activo}
        onConfirm={confirmarAccion}
      />
    </div>
  );
}

function IconoOrden({ activo, dir }: { activo: boolean; dir: "asc" | "desc" }) {
  if (!activo) {
    return <ChevronDown className="size-3 text-transparent" />;
  }
  return dir === "asc" ? (
    <ChevronUp className="size-3" />
  ) : (
    <ChevronDown className="size-3" />
  );
}
