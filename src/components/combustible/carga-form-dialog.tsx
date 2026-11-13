"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  cargaCombustibleSchema,
  type CargaCombustibleInput,
  type CargaCombustibleFormValues,
} from "@/lib/validaciones/combustible";
import { crearCarga, actualizarCarga } from "@/services/combustible";
import { formatearMoneda, hoyISO } from "@/lib/formato";
import type { CargaCombustible, TecnicoResumen, Vehiculo } from "@/types/database";
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

const SIN_TECNICO = "__sin_tecnico__";

function valoresIniciales(
  carga?: CargaCombustible | null,
  vehiculoPreseleccionado?: string
): CargaCombustibleFormValues {
  return {
    vehiculo_id: carga?.vehiculo_id ?? vehiculoPreseleccionado ?? "",
    tecnico_id: carga?.tecnico_id ?? "",
    fecha: carga?.fecha ?? hoyISO(),
    kilometraje: carga ? String(carga.kilometraje) : "",
    litros: carga ? String(carga.litros) : "",
    precio_por_litro: carga ? String(carga.precio_por_litro) : "",
    observaciones: carga?.observaciones ?? "",
  };
}

interface CargaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carga?: CargaCombustible | null;
  vehiculos: Vehiculo[];
  tecnicos: TecnicoResumen[];
  vehiculoPreseleccionado?: string;
  onGuardado: (carga: CargaCombustible) => void;
}

export function CargaCombustibleFormDialog({
  open,
  onOpenChange,
  carga,
  vehiculos,
  tecnicos,
  vehiculoPreseleccionado,
  onGuardado,
}: CargaFormDialogProps) {
  const esEdicion = !!carga;
  const [guardando, setGuardando] = useState(false);
  const [totalCalculado, setTotalCalculado] = useState<string>(
    carga ? String(Number(carga.costo_total)) : ""
  );

  const form = useForm<CargaCombustibleFormValues, undefined, CargaCombustibleInput>({
    resolver: zodResolver(cargaCombustibleSchema),
    defaultValues: valoresIniciales(carga, vehiculoPreseleccionado),
  });

  function actualizarTotal() {
    const litros = String(form.getValues("litros") ?? "").replace(",", ".");
    const precio = String(form.getValues("precio_por_litro") ?? "").replace(",", ".");
    const total = Number(litros) * Number(precio);
    setTotalCalculado(
      Number.isFinite(total) && total > 0 ? formatearMoneda(total) : ""
    );
  }

  async function onSubmit(values: CargaCombustibleInput) {
    setGuardando(true);
    try {
      const resultado = esEdicion
        ? await actualizarCarga(carga.id, values)
        : await crearCarga(values);
      toast.success(esEdicion ? "Carga actualizada" : "Carga registrada", {
        description: `${resultado.vehiculos?.patente ?? "Vehículo"} · ${resultado.fecha} · ${Number(resultado.litros).toLocaleString("es-AR", { maximumFractionDigits: 2 })} L · ${formatearMoneda(Number(resultado.costo_total))}`,
      });
      form.reset(valoresIniciales(resultado, vehiculoPreseleccionado));
      setTotalCalculado(String(Number(resultado.costo_total)));
      onGuardado(resultado);
      onOpenChange(false);
    } catch (error) {
      toast.error("No se pudo guardar la carga", {
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
          form.reset(valoresIniciales(carga, vehiculoPreseleccionado));
          setTotalCalculado(carga ? String(Number(carga.costo_total)) : "");
        }
        onOpenChange(nuevoEstado);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? "Editar carga de combustible" : "Nueva carga de combustible"}
          </DialogTitle>
          <DialogDescription>
            El costo total se calcula automáticamente (litros × precio por
            litro). El kilometraje del vehículo se actualiza si la carga es la
            más avanzada.
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
                name="tecnico_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Técnico que cargó</FormLabel>
                    <Select
                      onValueChange={(valor) => field.onChange(valor === SIN_TECNICO ? "" : valor)}
                      value={field.value || SIN_TECNICO}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar técnico..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={SIN_TECNICO}>Sin asignar</SelectItem>
                        {tecnicos.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.nombre} {t.apellido}
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
                    <FormLabel>Fecha de la carga *</FormLabel>
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
                    <FormLabel>Kilometraje al cargar *</FormLabel>
                    <FormControl>
                      <Input type="number" inputMode="numeric" placeholder="Ej.: 48300" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="litros"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Litros cargados *</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="decimal"
                        placeholder="Ej.: 45,80"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          actualizarTotal();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="precio_por_litro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio por litro (ARS) *</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="decimal"
                        placeholder="Ej.: 1195,50"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          actualizarTotal();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {totalCalculado ? (
              <p className="text-sm">
                <span className="text-muted-foreground">Costo total calculado: </span>
                <span className="font-heading font-semibold tabular-nums">{totalCalculado}</span>
              </p>
            ) : null}

            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Ej.: tanque lleno, ruta 2, etc. (opcional)"
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
                  form.reset(valoresIniciales(carga, vehiculoPreseleccionado));
                  setTotalCalculado(carga ? String(Number(carga.costo_total)) : "");
                  onOpenChange(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? <LoaderCircle className="size-4 animate-spin" /> : null}
                {guardando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Registrar carga"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
