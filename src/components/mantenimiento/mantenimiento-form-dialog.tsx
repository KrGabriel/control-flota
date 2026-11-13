"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  mantenimientoSchema,
  type MantenimientoInput,
  type MantenimientoFormValues,
} from "@/lib/validaciones/mantenimiento";
import { crearMantenimiento, actualizarMantenimiento } from "@/services/mantenimientos";
import { hoyISO } from "@/lib/formato";
import type { CategoriaMantenimiento, Mantenimiento, Vehiculo } from "@/types/database";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function valoresIniciales(
  mantenimiento?: Mantenimiento | null,
  vehiculoPreseleccionado?: string
): MantenimientoFormValues {
  return {
    vehiculo_id: mantenimiento?.vehiculo_id ?? vehiculoPreseleccionado ?? "",
    categoria_id: mantenimiento?.categoria_id ?? "",
    fecha: mantenimiento?.fecha ?? hoyISO(),
    kilometraje: mantenimiento ? String(mantenimiento.kilometraje) : "",
    trabajo_realizado: mantenimiento?.trabajo_realizado ?? "",
    taller: mantenimiento?.taller ?? "",
    costo_total: mantenimiento ? String(mantenimiento.costo_total) : "",
    observaciones: mantenimiento?.observaciones ?? "",
  };
}

interface MantenimientoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mantenimiento?: Mantenimiento | null;
  vehiculos: Vehiculo[];
  categorias: CategoriaMantenimiento[];
  vehiculoPreseleccionado?: string;
  onGuardado: (mantenimiento: Mantenimiento) => void;
}

export function MantenimientoFormDialog({
  open,
  onOpenChange,
  mantenimiento,
  vehiculos,
  categorias,
  vehiculoPreseleccionado,
  onGuardado,
}: MantenimientoFormDialogProps) {
  const esEdicion = !!mantenimiento;
  const [guardando, setGuardando] = useState(false);

  const form = useForm<MantenimientoFormValues, undefined, MantenimientoInput>({
    resolver: zodResolver(mantenimientoSchema),
    defaultValues: valoresIniciales(mantenimiento, vehiculoPreseleccionado),
  });

  async function onSubmit(values: MantenimientoInput) {
    setGuardando(true);
    try {
      const resultado = esEdicion
        ? await actualizarMantenimiento(mantenimiento.id, values)
        : await crearMantenimiento(values);
      toast.success(esEdicion ? "Mantenimiento actualizado" : "Mantenimiento registrado", {
        description: `${resultado.vehiculos?.patente ?? "Vehículo"} · ${resultado.categorias_mantenimiento?.nombre ?? ""} · ${resultado.fecha}`,
      });
      form.reset(valoresIniciales(resultado, vehiculoPreseleccionado));
      onGuardado(resultado);
      onOpenChange(false);
    } catch (error) {
      toast.error("No se pudo guardar el mantenimiento", {
        description: error instanceof Error ? error.message : "Error desconocido.",
      });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nuevoEstado) => {
        if (!nuevoEstado) {
          form.reset(valoresIniciales(mantenimiento, vehiculoPreseleccionado));
        }
        onOpenChange(nuevoEstado);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? "Editar mantenimiento" : "Nuevo registro de mantenimiento"}
          </DialogTitle>
          <DialogDescription>
            Los registros de mantenimiento forman parte del historial: no se
            eliminan. Al registrar uno, las programaciones asociadas se
            recalculan automáticamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => onSubmit(v))} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="vehiculo_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehículo *</FormLabel>
                    <Select
                      onValueChange={(valor) => {
                        field.onChange(valor);
                        if (!esEdicion) {
                          const seleccionado = vehiculos.find((v) => v.id === valor);
                          if (seleccionado && !form.getValues("kilometraje")) {
                            form.setValue("kilometraje", String(seleccionado.kilometraje_actual));
                          }
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar vehículo..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehiculos.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.numero_vehiculo} · {v.patente} · {v.marca} {v.modelo}
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
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nombre}
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
                name="fecha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha del trabajo *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kilometraje"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kilometraje al momento del trabajo *</FormLabel>
                    <FormControl>
                      <Input type="number" inputMode="numeric" placeholder="Ej.: 48250" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="trabajo_realizado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trabajo realizado *</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Detalle del trabajo: cambio de aceite y filtros, revisión de frenos, etc."
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="taller"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taller</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej.: Taller Central (opcional)" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="costo_total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo total (ARS) *</FormLabel>
                    <FormControl>
                      <Input type="number" inputMode="decimal" step="0.01" placeholder="Ej.: 125000,50" {...field} />
                    </FormControl>
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
                      rows={2}
                      placeholder="Observaciones adicionales (opcional)"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={guardando}
                onClick={() => {
                  form.reset(valoresIniciales(mantenimiento, vehiculoPreseleccionado));
                  onOpenChange(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? <LoaderCircle className="size-4 animate-spin" /> : null}
                {guardando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Registrar mantenimiento"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
