"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Car, CircleCheck, CircleMinus, FileText, Fuel, Wrench, Camera, BellRing, Banknote, Users, ClipboardList, Pencil } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { VehiculoFormDialog } from "@/components/vehiculos/vehiculo-form-dialog";
import { FichaMantenimientoTab } from "@/components/mantenimiento/ficha-mantenimiento-tab";
import { FichaCombustibleTab } from "@/components/combustible/ficha-combustible-tab";
import { FichaDocumentacionTab } from "@/components/vehiculos/ficha-documentacion-tab";
import { FichaAlertasTab } from "@/components/vehiculos/ficha-alertas-tab";
import {
  EstadoFisicaBadge,
  EstadoOperativoBadge,
  EstadoVehiculoBadge,
  nombreTecnico,
} from "@/components/shared/estado-badges";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listarTecnicosActivos } from "@/services/tecnicos";
import { formatearFecha, estadoVencimiento, type EstadoVencimiento } from "@/lib/formato";
import type { Asignacion, Tecnico, Vehiculo } from "@/types/database";

function VencimientoBadge({ fecha, etiqueta }: { fecha: string | null; etiqueta: string }) {
  const estado: EstadoVencimiento = estadoVencimiento(fecha);
  const clases: Record<EstadoVencimiento, string> = {
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
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-muted-foreground">{etiqueta}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm tabular-nums">{formatearFecha(fecha)}</span>
        <Badge variant="outline" className={clases[estado]}>
          {estado === "vigente" && "Vigente"}
          {estado === "proximo_vencer" && "Próximo a vencer"}
          {estado === "urgente" && "Urgente"}
          {estado === "vencido" && "Vencido"}
          {estado === "sin_dato" && "Sin dato"}
        </Badge>
      </div>
    </div>
  );
}

export function FichaVehiculoContent({
  vehiculo: vehiculoInicial,
  asignaciones,
}: {
  vehiculo: Vehiculo;
  asignaciones: Asignacion[];
}) {
  const router = useRouter();
  const [vehiculo, setVehiculo] = useState(vehiculoInicial);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [formAbierto, setFormAbierto] = useState(false);

  useEffect(() => {
    listarTecnicosActivos()
      .then(setTecnicos)
      .catch(() => setTecnicos([]));
  }, []);

  async function guardarEdicion(vehiculoActualizado: Vehiculo) {
    setVehiculo(vehiculoActualizado);
    setFormAbierto(false);
    toast.success("Ficha actualizada");
    router.refresh();
  }

  const TABS = [
    { value: "general", label: "Información general", icon: FileText },
    { value: "asignaciones", label: "Asignaciones", icon: Users },
    { value: "mantenimiento", label: "Mantenimiento", icon: Wrench },
    { value: "combustible", label: "Combustible", icon: Fuel },
    { value: "documentacion", label: "Documentación y equipamiento", icon: ClipboardList },
    { value: "gastos", label: "Gastos", icon: Banknote, etapa: "Etapa 8" },
    { value: "alertas", label: "Historial de alertas", icon: BellRing },
    { value: "archivos", label: "Fotografías y archivos", icon: Camera, etapa: "Etapa 7" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Car className="size-5 shrink-0 text-primary" />
            <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              Vehículo {vehiculo.numero_vehiculo} · {vehiculo.patente}
            </h1>
            <EstadoOperativoBadge estado={vehiculo.estado_operativo} />
            <EstadoVehiculoBadge activo={vehiculo.activo} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {vehiculo.marca} {vehiculo.modelo} · {vehiculo.anio} · {vehiculo.tipo_vehiculo}
          </p>
        </div>
        <Button onClick={() => setFormAbierto(true)} className="shrink-0">
          <Pencil className="size-4" />
          Editar vehículo
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card size="sm" className="gap-0 py-3">
          <CardContent className="px-3">
            <p className="text-xs font-medium text-muted-foreground">Kilometraje actual</p>
            <p className="mt-1 font-heading text-xl font-semibold tabular-nums">
              {vehiculo.kilometraje_actual.toLocaleString("es-AR")} km
            </p>
          </CardContent>
        </Card>
        <Card size="sm" className="gap-0 py-3">
          <CardContent className="px-3">
            <p className="text-xs font-medium text-muted-foreground">Técnico responsable</p>
            <p className="mt-1 truncate font-heading text-xl font-semibold">
              {nombreTecnico(vehiculo.tecnicos ?? null)}
            </p>
          </CardContent>
        </Card>
        <Card size="sm" className="gap-0 py-3">
          <CardContent className="px-3">
            <p className="text-xs font-medium text-muted-foreground">Asignaciones registradas</p>
            <p className="mt-1 font-heading text-xl font-semibold tabular-nums">
              {asignaciones.length}
            </p>
          </CardContent>
        </Card>
        <Card size="sm" className="gap-0 py-3">
          <CardContent className="px-3">
            <p className="text-xs font-medium text-muted-foreground">Ingresado</p>
            <p className="mt-1 font-heading text-xl font-semibold">
              {formatearFecha(vehiculo.created_at.slice(0, 10))}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="gap-1.5 text-xs sm:text-sm"
                >
                  <tab.icon className="hidden size-3.5 sm:inline" />
                  <span className="truncate">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="general" className="mt-4 space-y-6">
              <div>
                <p className="mb-3 text-sm font-semibold">Identificación</p>
                <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                  <Dato etiqueta="Número de vehículo" valor={String(vehiculo.numero_vehiculo)} />
                  <Dato etiqueta="Patente" valor={vehiculo.patente} />
                  <Dato etiqueta="Tipo" valor={vehiculo.tipo_vehiculo} />
                  <Dato etiqueta="Marca" valor={vehiculo.marca} />
                  <Dato etiqueta="Modelo" valor={vehiculo.modelo} />
                  <Dato etiqueta="Año" valor={String(vehiculo.anio)} />
                </div>
              </div>
              <Separator />
              <div>
                <p className="mb-3 text-sm font-semibold">Vencimientos</p>
                <div className="space-y-2">
                  <VencimientoBadge etiqueta="Próxima VTV" fecha={vehiculo.fecha_proxima_vtv} />
                  <VencimientoBadge etiqueta="Vencimiento del seguro" fecha={vehiculo.fecha_vencimiento_seguro} />
                  <VencimientoBadge etiqueta="Vencimiento del matafuego" fecha={vehiculo.fecha_vencimiento_matafuego} />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">Instalación de batería</span>
                    <span className="text-sm tabular-nums">{formatearFecha(vehiculo.fecha_instalacion_bateria)}</span>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="mb-3 text-sm font-semibold">Equipamiento</p>
                <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">Botiquín</span>
                    <EstadoFisicaBadge estado={vehiculo.estado_botiquin} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">Cubiertas</span>
                    <EstadoFisicaBadge estado={vehiculo.estado_cubiertas} />
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="mb-2 text-sm font-semibold">Observaciones</p>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {vehiculo.observaciones ?? "Sin observaciones."}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="asignaciones" className="mt-4 space-y-4">
              {asignaciones.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Sin asignaciones registradas"
                  description="Cuando edites el vehículo y cambies el técnico responsable, el historial se registrará automáticamente aquí."
                />
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Técnico anterior</TableHead>
                        <TableHead>Técnico nuevo</TableHead>
                        <TableHead className="hidden sm:table-cell">Inicio</TableHead>
                        <TableHead className="hidden sm:table-cell">Fin</TableHead>
                        <TableHead>Situación</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asignaciones.map((asignacion) => (
                        <TableRow key={asignacion.id}>
                          <TableCell>
                            {nombreTecnico(asignacion.tecnico_anterior ?? null)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {nombreTecnico(asignacion.tecnico_nuevo ?? null)}
                          </TableCell>
                          <TableCell className="hidden tabular-nums sm:table-cell">
                            {formatearFecha(asignacion.fecha_inicio)}
                          </TableCell>
                          <TableCell className="hidden tabular-nums sm:table-cell">
                            {formatearFecha(asignacion.fecha_fin)}
                          </TableCell>
                          <TableCell>
                            {asignacion.fecha_fin ? (
                              <Badge variant="outline" className="bg-muted text-muted-foreground">
                                <CircleMinus className="size-3" />
                                Finalizada
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900"
                              >
                                <CircleCheck className="size-3" />
                                Vigente
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Las asignaciones nunca se sobrescriben ni se eliminan: cada cambio de
                técnico genera un registro nuevo.
              </p>
            </TabsContent>

            <TabsContent value="mantenimiento" className="mt-4">
              <FichaMantenimientoTab vehiculoId={vehiculo.id} />
            </TabsContent>

            <TabsContent value="combustible" className="mt-4">
              <FichaCombustibleTab vehiculoId={vehiculo.id} />
            </TabsContent>

            <TabsContent value="documentacion" className="mt-4">
              <FichaDocumentacionTab vehiculo={vehiculo} />
            </TabsContent>

            <TabsContent value="alertas" className="mt-4">
              <FichaAlertasTab vehiculoId={vehiculo.id} />
            </TabsContent>

            {TABS.filter((t) => t.etapa).map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-4">
                <EmptyState
                  icon={tab.icon}
                  title={`Sin información de "${tab.label}"`}
                  description={`Esta sección se activará al desarrollar el módulo correspondiente (${tab.etapa}).`}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <VehiculoFormDialog
        open={formAbierto}
        onOpenChange={setFormAbierto}
        vehiculo={vehiculo}
        tecnicos={tecnicos.map((t) => ({ id: t.id, nombre: t.nombre, apellido: t.apellido }))}
        onGuardado={guardarEdicion}
      />
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-muted-foreground">{etiqueta}</span>
      <span className="text-sm font-medium">{valor}</span>
    </div>
  );
}
