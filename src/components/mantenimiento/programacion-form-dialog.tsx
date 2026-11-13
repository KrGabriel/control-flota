"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  programacionSchema,
  type ProgramacionInput,
  type ProgramacionFormValues,
} from "@/lib/validaciones/mantenimiento";
import { crearProgramacion, actualizarProgramacion } from "@/services/programaciones";
import type { CategoriaMantenimiento, Programacion, Vehiculo } from "@/types/database";
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
import { Separator } from "@/components/ui/separator";

function valoresIniciales(
  programacion?: Programacion | null,
  vehiculoPreseleccionado?: string
): ProgramacionFormValues {
  return {
    vehiculo_id: programacion?.vehiculo_id ?? vehiculoPreseleccionado ?? "",
    categoria_id: programacion?.categoria_id ?? "",
    modo: programacion?.modo ?? "ambos",
    intervalo_km: programacion?.intervalo_km != null ? String(programacion.intervalo_km) : "",
    intervalo_dias: programacion?.intervalo_dias != null ? String(programacion.intervalo_dias) : "",
    fecha_ultimo_mantenimiento: programacion?.fecha_ultimo_mantenimiento ?? "",
    kilometraje_ultimo_mantenimiento:
      programacion?.kilometraje_ultimo_mantenimiento != null
        ? String(programacion.kilometraje_ultimo_mantenimiento)
        : "",
    observaciones: programacion?.observaciones ?? "",
  };
}

interface ProgramacionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programacion?: Programacion | null;
  vehiculos: Vehiculo[];
  categorias: CategoriaMantenimiento[];
  vehiculoPreseleccionado?: string;
  onGuardado: (programacion: Programacion) => void;
}

export function ProgramacionFormDialog({
  open,
  onOpenChange,
  programacion,
  vehiculos,
  categorias,
  vehiculoPreseleccionado,
  onGuardado,
}: ProgramacionFormDialogProps) {
  const esEdicion = !!programacion;
  const [guardando, setGuardando] = useState(false);
  const [modo, setModo] = useState<ProgramacionFormValues["modo"]>(
    programacion?.modo ?? "ambos"
  );

  const form = useForm<ProgramacionFormValues, undefined, ProgramacionInput>({
    resolver: zodResolver(programacionSchema),
    defaultValues: valoresIniciales(programacion, vehiculoPreseleccionado),
  });

  async function onSubmit(values: ProgramacionInput) {
    setGuardando(true);
    try {
      const resultado = esEdicion
        ? await actualizarProgramacion(programacion.id, values)
        : await crearProgramacion(values);
      toast.success(esEdicion ? "Programación actualizada" : "Programación creada", {
        description: `${resultado.vehiculos?.patente ?? "Vehículo"} · ${resultado.categorias_mantenimiento?.nombre ?? ""}`,
      });
      form.reset(valoresIniciales(resultado, vehiculoPreseleccionado));
      onGuardado(resultado);
      onOpenChange(false);
    } catch (error) {
      toast.error("No se pudo guardar la programación", {
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
          form.reset(valoresIniciales(programacion, vehiculoPreseleccionado));
          setModo(programacion?.modo ?? "ambos");
        }
        onOpenChange(nuevoEstado);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? "Editar programación" : "Nueva programación de mantenimiento"}
          </DialogTitle>
          <DialogDescription>
            Define la recurrencia del mantenimiento. Si cargás el último
            mantenimiento realizado, se calculan las próximas estimaciones
            automáticamente. Solo puede haber una programación activa por
            vehículo y categoría.
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <FormLabel>Categoría de mantenimiento *</FormLabel>
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
                name="modo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modo de programación *</FormLabel>
                    <Select
                      onValueChange={(valor) => {
                        field.onChange(valor);
                        setModo(valor as ProgramacionFormValues["modo"]);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="kilometraje">Por kilometraje</SelectItem>
                        <SelectItem value="tiempo">Por tiempo</SelectItem>
                        <SelectItem value="ambos">Por km y tiempo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="intervalo_km"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Intervalo de km {modo === "tiempo" ? "(no aplica)" : "*"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="Ej.: 10000"
                        disabled={modo === "tiempo"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="intervalo_dias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Intervalo en días {modo === "kilometraje" ? "(no aplica)" : "*"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="Ej.: 180"
                        disabled={modo === "kilometraje"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <p className="text-sm text-muted-foreground">
              Último mantenimiento realizado (opcional: activa el cálculo de
              próximas estimaciones).
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="fecha_ultimo_mantenimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha del último mantenimiento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kilometraje_ultimo_mantenimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kilometraje del último mantenimiento</FormLabel>
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
                  form.reset(valoresIniciales(programacion, vehiculoPreseleccionado));
                  onOpenChange(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? <LoaderCircle className="size-4 animate-spin" /> : null}
                {guardando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear programación"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
