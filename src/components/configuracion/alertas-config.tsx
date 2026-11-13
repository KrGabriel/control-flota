"use client";

import { useEffect, useState } from "react";
import { CirclePlus, LoaderCircle, Save, X } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  configAlertasSchema,
  type ConfigAlertasFormValues,
} from "@/lib/validaciones/configuracion";
import { obtenerConfigAlertas, guardarConfigAlertas } from "@/services/config";
import type { ConfigAlertas } from "@/types/database";

function valoresIniciales(config: ConfigAlertas): ConfigAlertasFormValues {
  return {
    anticipos_dias: config.anticipos_dias.map((d) => ({ dias: String(d) })),
    umbral_km_proximo: String(config.umbral_km_proximo),
    umbral_km_urgente: String(config.umbral_km_urgente),
    email_habilitado: config.email_habilitado,
    email_destino: config.email_destino ?? "",
  };
}

export function AlertasConfig() {
  const [cargando, setCargando] = useState(true);
  const [config, setConfig] = useState<ConfigAlertas | null>(null);
  const [guardando, setGuardando] = useState(false);
  const form = useForm<ConfigAlertasFormValues>({
    resolver: zodResolver(configAlertasSchema),
    defaultValues: valoresIniciales({
      anticipos_dias: [30, 15, 7, 0],
      umbral_km_proximo: 2000,
      umbral_km_urgente: 500,
      email_habilitado: false,
      email_destino: null,
    }),
  });
  const anticipos = useFieldArray({
    control: form.control,
    name: "anticipos_dias",
  });

  useEffect(() => {
    let activo = true;
    obtenerConfigAlertas()
      .then((c) => {
        if (!activo) return;
        setConfig(c);
        form.reset(valoresIniciales(c));
        setCargando(false);
      })
      .catch((error) => {
        if (!activo) return;
        toast.error("Error al cargar la configuración", {
          description: error instanceof Error ? error.message : "Error desconocido.",
        });
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [form]);

  async function onSubmit(values: ConfigAlertasFormValues) {
    setGuardando(true);
    try {
      const guardada = await guardarConfigAlertas(values);
      setConfig(guardada);
      form.reset(valoresIniciales(guardada));
      toast.success("Configuración guardada", {
        description: "Las alertas se recalcularán en la próxima corrida programada.",
      });
    } catch (error) {
      toast.error("No se pudo guardar la configuración", {
        description: error instanceof Error ? error.message : "Error desconocido.",
      });
    } finally {
      setGuardando(false);
    }
  }

  if (cargando || !config) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">Anticipos de aviso (días)</h3>
            <p className="text-xs text-muted-foreground">
              Días restantes para considerar un vencimiento &quot;próximo&quot; o
              &quot;urgente&quot;. Por ejemplo, 7 avisa una semana antes y 0 el
              mismo día del vencimiento.
            </p>
          </div>
          <FormField
            control={form.control}
            name="anticipos_dias"
            render={() => (
              <FormItem>
                <div className="flex flex-wrap items-center gap-2">
                  {anticipos.fields.map((f, index) => (
                    <div key={f.id} className="flex items-center gap-1">
                      <FormField
                        control={form.control}
                        name={`anticipos_dias.${index}.dias`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min={0}
                                  max={365}
                                  className="w-24 pr-7"
                                  aria-label={`Anticipo ${index + 1} (días)`}
                                  {...field}
                                  value={field.value ?? ""}
                                />
                                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                  d
                                </span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Quitar anticipo"
                        onClick={() => anticipos.remove(index)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => anticipos.append({ dias: "0" })}
                  >
                    <CirclePlus className="size-4" />
                    Agregar
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">Umbrales de kilometraje</h3>
            <p className="text-xs text-muted-foreground">
              Kilómetros faltantes para marcar un mantenimiento programado como
              próximo o urgente.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="umbral_km_proximo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Umbral próximo (km)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="umbral_km_urgente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Umbral urgente (km)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">Notificaciones por correo</h3>
            <p className="text-xs text-muted-foreground">
              Envío diario de un resumen de alertas mediante Resend. Requiere
              configurar la variable <code>RESEND_API_KEY</code> en el hosting.
            </p>
          </div>
          <FormField
            control={form.control}
            name="email_habilitado"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={field.value}
                      onChange={field.onChange}
                      aria-label="Habilitar envío por correo"
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Enviar resumen diario por correo
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email_destino"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destinatario</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Ej.: flota@ejemplo.com"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={guardando}>
            {guardando ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {guardando ? "Guardando..." : "Guardar configuración"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
