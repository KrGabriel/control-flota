"use client";

import { useState } from "react";
import { TriangleAlert, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { vehiculoSchema, type VehiculoInput, type VehiculoFormValues } from "@/lib/validaciones/vehiculo";
import { crearVehiculo, actualizarVehiculo } from "@/services/vehiculos";
import {
  ESTADOS_FISICA,
  ESTADOS_OPERATIVOS,
  TIPOS_VEHICULO,
  type TecnicoResumen,
  type Vehiculo,
} from "@/types/database";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function valoresIniciales(vehiculo?: Vehiculo | null) {
  return {
    numero_vehiculo: vehiculo ? String(vehiculo.numero_vehiculo) : "",
    tipo_vehiculo: vehiculo?.tipo_vehiculo ?? "",
    patente: vehiculo?.patente ?? "",
    marca: vehiculo?.marca ?? "",
    modelo: vehiculo?.modelo ?? "",
    anio: vehiculo ? String(vehiculo.anio) : "",
    tecnico_responsable_id: vehiculo?.tecnico_responsable_id ?? "",
    kilometraje_actual: vehiculo ? String(vehiculo.kilometraje_actual) : "0",
    fecha_proxima_vtv: vehiculo?.fecha_proxima_vtv ?? "",
    fecha_vencimiento_seguro: vehiculo?.fecha_vencimiento_seguro ?? "",
    fecha_vencimiento_matafuego: vehiculo?.fecha_vencimiento_matafuego ?? "",
    fecha_instalacion_bateria: vehiculo?.fecha_instalacion_bateria ?? "",
    estado_botiquin: vehiculo?.estado_botiquin ?? "requiere_revision",
    estado_cubiertas: vehiculo?.estado_cubiertas ?? "requiere_revision",
    estado_operativo: vehiculo?.estado_operativo ?? "disponible",
    observaciones: vehiculo?.observaciones ?? "",
  };
}

interface VehiculoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehiculo?: Vehiculo | null;
  tecnicos: TecnicoResumen[];
  onGuardado: (vehiculo: Vehiculo) => void;
}

const SIN_ASIGNAR = "__sin_asignar__";

export function VehiculoFormDialog({
  open,
  onOpenChange,
  vehiculo,
  tecnicos,
  onGuardado,
}: VehiculoFormDialogProps) {
  const esEdicion = !!vehiculo;
  const [guardando, setGuardando] = useState(false);
  const [confirmarKm, setConfirmarKm] = useState(false);

  const form = useForm<VehiculoFormValues, undefined, VehiculoInput>({
    resolver: zodResolver(vehiculoSchema),
    defaultValues: valoresIniciales(vehiculo),
  });

  const kmOriginal = vehiculo?.kilometraje_actual ?? null;

  async function onSubmit(values: VehiculoInput, confirmado = false) {
    const kmIngresado = Number(values.kilometraje_actual);
    if (
      esEdicion &&
      kmOriginal !== null &&
      kmIngresado < kmOriginal &&
      !confirmado
    ) {
      setConfirmarKm(true);
      return;
    }
    setConfirmarKm(false);
    setGuardando(true);
    try {
      const resultado = esEdicion
        ? await actualizarVehiculo(vehiculo.id, values)
        : await crearVehiculo(values);
      toast.success(
        esEdicion ? "Vehículo actualizado" : "Vehículo registrado",
        {
          description: `${resultado.numero_vehiculo} - ${resultado.marca} ${resultado.modelo} (${resultado.patente})`,
        }
      );
      form.reset(valoresIniciales(resultado));
      onGuardado(resultado);
      onOpenChange(false);
    } catch (error) {
      toast.error("No se pudo guardar el vehículo", {
        description: error instanceof Error ? error.message : "Error desconocido.",
      });
    } finally {
      setGuardando(false);
    }
  }

  const mostrarAdvertenciaKm = confirmarKm;

  return (
    <Dialog
      open={open}
      onOpenChange={(nuevoEstado) => {
        if (!nuevoEstado) {
          form.reset(valoresIniciales(vehiculo));
          setConfirmarKm(false);
        }
        onOpenChange(nuevoEstado);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {esEdicion
              ? `Editar vehículo ${vehiculo.numero_vehiculo}`
              : "Nuevo vehículo"}
          </DialogTitle>
          <DialogDescription>
            Los campos de identificación principales son obligatorios. La patente y
            el número no pueden repetirse.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => onSubmit(v))} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="numero_vehiculo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de vehículo *</FormLabel>
                    <FormControl>
                      <Input type="number" inputMode="numeric" placeholder="Ej.: 12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo_vehiculo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de vehículo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPOS_VEHICULO.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="patente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patente *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej.: AB123CD" {...field} className="uppercase" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="marca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej.: Toyota" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="modelo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej.: Hilux" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="anio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Año *</FormLabel>
                    <FormControl>
                      <Input type="number" inputMode="numeric" placeholder="Ej.: 2023" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tecnico_responsable_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Técnico responsable</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === SIN_ASIGNAR ? "" : v)}
                      value={field.value ? field.value : SIN_ASIGNAR}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={SIN_ASIGNAR}>Sin asignar</SelectItem>
                        {tecnicos.map((tecnico) => (
                          <SelectItem key={tecnico.id} value={tecnico.id}>
                            {tecnico.nombre} {tecnico.apellido}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kilometraje_actual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kilometraje actual *</FormLabel>
                    <FormControl>
                      <Input type="number" inputMode="numeric" min={0} placeholder="Ej.: 85000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estado_operativo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado operativo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ESTADOS_OPERATIVOS.map((estado) => (
                          <SelectItem key={estado.valor} value={estado.valor}>
                            {estado.etiqueta}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <p className="text-sm font-medium">Vencimientos</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="fecha_proxima_vtv"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Próxima VTV</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fecha_vencimiento_seguro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimiento del seguro</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fecha_vencimiento_matafuego"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimiento del matafuego</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fecha_instalacion_bateria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instalación de batería</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <p className="text-sm font-medium">Equipamiento</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="estado_botiquin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado del botiquín</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ESTADOS_FISICA.map((estado) => (
                          <SelectItem key={estado.valor} value={estado.valor}>
                            {estado.etiqueta}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estado_cubiertas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado de las cubiertas</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ESTADOS_FISICA.map((estado) => (
                          <SelectItem key={estado.valor} value={estado.valor}>
                            {estado.etiqueta}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Observaciones adicionales (opcional)"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mostrarAdvertenciaKm ? (
              <Alert
                variant="default"
                className="border-amber-200 bg-amber-50 text-amber-900 [&_svg]:text-amber-600 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
              >
                <TriangleAlert className="size-4" />
                <AlertTitle>Kilometraje inferior al registrado</AlertTitle>
                <AlertDescription>
                  El último kilometraje registrado es{" "}
                  <strong>{kmOriginal!.toLocaleString("es-AR")} km</strong> y estás
                  ingresando{" "}
                  <strong>
                    {Number(form.getValues("kilometraje_actual")).toLocaleString("es-AR")} km
                  </strong>
                  . Si es un error, corregí el valor; si es una corrección legítima,
                  confirmá para guardarlo.
                </AlertDescription>
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={guardando}
                    onClick={() => {
                      setConfirmarKm(false);
                    }}
                  >
                    Corregir
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={guardando}
                    onClick={() => form.handleSubmit((v) => onSubmit(v, true))()}
                  >
                    Sí, guardar igualmente
                  </Button>
                </div>
              </Alert>
            ) : null}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={guardando}
                onClick={() => {
                  form.reset(valoresIniciales(vehiculo));
                  setConfirmarKm(false);
                  onOpenChange(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? <LoaderCircle className="size-4 animate-spin" /> : null}
                {guardando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Registrar vehículo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
