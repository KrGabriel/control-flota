"use client";

import { useEffect, useState } from "react";
import { CirclePlus, LoaderCircle, Pencil, Power, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EstadoVehiculoBadge } from "@/components/shared/estado-badges";
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
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { tecnicoSchema, type TecnicoInput, type TecnicoFormValues } from "@/lib/validaciones/vehiculo";
import {
  actualizarTecnico,
  cambiarEstadoTecnico,
  crearTecnico,
  listarTecnicos,
} from "@/services/tecnicos";
import type { Tecnico } from "@/types/database";

function valoresIniciales(tecnico?: Tecnico | null) {
  return {
    nombre: tecnico?.nombre ?? "",
    apellido: tecnico?.apellido ?? "",
    telefono: tecnico?.telefono ?? "",
    email: tecnico?.email ?? "",
    observaciones: tecnico?.observaciones ?? "",
  };
}

export function TecnicosView() {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [formAbierto, setFormAbierto] = useState(false);
  const [tecnicoEditando, setTecnicoEditando] = useState<Tecnico | null>(null);
  const [tecnicoAccion, setTecnicoAccion] = useState<Tecnico | null>(null);

  async function cargar() {
    try {
      setTecnicos(await listarTecnicos());
    } catch (error) {
      toast.error("Error al cargar técnicos", {
        description: error instanceof Error ? error.message : "Error desconocido.",
      });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    let activo = true;
    listarTecnicos()
      .then((lista) => {
        if (!activo) return;
        setTecnicos(lista);
        setCargando(false);
      })
      .catch((error) => {
        if (!activo) return;
        toast.error("Error al cargar técnicos", {
          description: error instanceof Error ? error.message : "Error desconocido.",
        });
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const filtrados = tecnicos.filter((t) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return [t.nombre, t.apellido, t.email ?? "", t.telefono ?? ""].some((c) =>
      c.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar técnico..."
            className="pl-8"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <Button
          onClick={() => {
            setTecnicoEditando(null);
            setFormAbierto(true);
          }}
          className="shrink-0"
        >
          <CirclePlus className="size-4" />
          Nuevo técnico
        </Button>
      </div>

      {cargando ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            tecnicos.length === 0
              ? "No hay técnicos registrados"
              : "No se encontraron técnicos"
          }
          description={
            tecnicos.length === 0
              ? "Los técnicos son las personas responsables de los vehículos. No necesitan ser usuarios de la aplicación."
              : "Probá con otros términos de búsqueda."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre y apellido</TableHead>
                <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((tecnico) => (
                <TableRow key={tecnico.id} className={!tecnico.activo ? "opacity-60" : undefined}>
                  <TableCell className="font-medium">
                    {tecnico.nombre} {tecnico.apellido}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {tecnico.telefono ?? "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {tecnico.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    <EstadoVehiculoBadge activo={tecnico.activo} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Editar ${tecnico.nombre}`}
                        onClick={() => {
                          setTecnicoEditando(tecnico);
                          setFormAbierto(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={tecnico.activo ? "Desactivar técnico" : "Reactivar técnico"}
                        onClick={() => setTecnicoAccion(tecnico)}
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

      <TecnicoFormDialog
        open={formAbierto}
        onOpenChange={setFormAbierto}
        tecnico={tecnicoEditando}
        onGuardado={() => cargar()}
      />

      <ConfirmDialog
        open={!!tecnicoAccion}
        onOpenChange={(abierto) => {
          if (!abierto) setTecnicoAccion(null);
        }}
        title={
          tecnicoAccion?.activo
            ? `¿Desactivar a ${tecnicoAccion?.nombre} ${tecnicoAccion?.apellido}?`
            : `¿Reactivar a ${tecnicoAccion?.nombre} ${tecnicoAccion?.apellido}?`
        }
        description={
          tecnicoAccion?.activo
            ? "Dejará de aparecer como opción al asignar responsables. Su historial se conserva."
            : "Volverá a estar disponible para asignaciones."
        }
        confirmLabel={tecnicoAccion?.activo ? "Desactivar" : "Reactivar"}
        destructive={tecnicoAccion?.activo}
        onConfirm={async () => {
          if (!tecnicoAccion) return;
          try {
            await cambiarEstadoTecnico(tecnicoAccion.id, !tecnicoAccion.activo);
            toast.success(tecnicoAccion.activo ? "Técnico desactivado" : "Técnico reactivado");
            await cargar();
          } catch (error) {
            toast.error("No se pudo actualizar el técnico", {
              description: error instanceof Error ? error.message : "Error desconocido.",
            });
          }
        }}
      />
    </div>
  );
}

function TecnicoFormDialog({
  open,
  onOpenChange,
  tecnico,
  onGuardado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tecnico: Tecnico | null;
  onGuardado: () => void;
}) {
  const esEdicion = !!tecnico;
  const [guardando, setGuardando] = useState(false);
  const form = useForm<TecnicoFormValues, undefined, TecnicoInput>({
    resolver: zodResolver(tecnicoSchema),
    defaultValues: valoresIniciales(tecnico),
  });

  async function onSubmit(values: TecnicoInput) {
    setGuardando(true);
    try {
      const resultado = esEdicion
        ? await actualizarTecnico(tecnico.id, values)
        : await crearTecnico(values);
      toast.success(
        esEdicion ? "Técnico actualizado" : "Técnico registrado",
        { description: `${resultado.nombre} ${resultado.apellido}` }
      );
      form.reset(valoresIniciales(resultado));
      onGuardado();
      onOpenChange(false);
    } catch (error) {
      toast.error("No se pudo guardar el técnico", {
        description: error instanceof Error ? error.message : "Error desconocido.",
      });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(abierto) => {
        if (!abierto) form.reset(valoresIniciales(tecnico));
        onOpenChange(abierto);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar técnico" : "Nuevo técnico"}</DialogTitle>
          <DialogDescription>
            Los técnicos son registros de personas responsables de vehículos, no
            usuarios de la aplicación.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej.: Juan" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="apellido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej.: Pérez" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="Ej.: 351 000-0000"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Ej.: jperez@ejemplo.com"
                        {...field}
                        value={field.value ?? ""}
                      />
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
                      placeholder="Observaciones (opcional)"
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
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? <LoaderCircle className="size-4 animate-spin" /> : null}
                {guardando ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
