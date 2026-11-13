"use client";

import { useEffect, useState } from "react";
import { CirclePlus, LoaderCircle, ListTree, Pencil, Power, Search } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { categoriaSchema, type CategoriaInput, type CategoriaFormValues } from "@/lib/validaciones/categoria";
import {
  actualizarCategoria,
  cambiarEstadoCategoria,
  crearCategoria,
  listarCategorias,
} from "@/services/categorias";
import type { CategoriaMantenimiento } from "@/types/database";

function valoresIniciales(categoria?: CategoriaMantenimiento | null) {
  return {
    nombre: categoria?.nombre ?? "",
    orden: categoria ? String(categoria.orden) : "0",
  };
}

export function CategoriasView() {
  const [categorias, setCategorias] = useState<CategoriaMantenimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [formAbierto, setFormAbierto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<CategoriaMantenimiento | null>(null);
  const [categoriaAccion, setCategoriaAccion] = useState<CategoriaMantenimiento | null>(null);

  async function cargar() {
    try {
      setCategorias(await listarCategorias());
    } catch (error) {
      toast.error("Error al cargar categorías", {
        description: error instanceof Error ? error.message : "Error desconocido.",
      });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    let activo = true;
    listarCategorias()
      .then((lista) => {
        if (!activo) return;
        setCategorias(lista);
        setCargando(false);
      })
      .catch((error) => {
        if (!activo) return;
        toast.error("Error al cargar categorías", {
          description: error instanceof Error ? error.message : "Error desconocido.",
        });
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const filtradas = categorias.filter((c) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return c.nombre.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar categoría..."
            className="pl-8"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <Button
          onClick={() => {
            setCategoriaEditando(null);
            setFormAbierto(true);
          }}
          className="shrink-0"
        >
          <CirclePlus className="size-4" />
          Nueva categoría
        </Button>
      </div>

      {cargando ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <EmptyState
          icon={ListTree}
          title={
            categorias.length === 0
              ? "No hay categorías registradas"
              : "No se encontraron categorías"
          }
          description={
            categorias.length === 0
              ? "Las categorías clasifican los registros y programaciones de mantenimiento."
              : "Probá con otros términos de búsqueda."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Orden</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((categoria) => (
                <TableRow key={categoria.id} className={!categoria.activo ? "opacity-60" : undefined}>
                  <TableCell className="font-medium">{categoria.nombre}</TableCell>
                  <TableCell className="hidden sm:table-cell">{categoria.orden}</TableCell>
                  <TableCell>
                    <EstadoVehiculoBadge activo={categoria.activo} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Editar ${categoria.nombre}`}
                        onClick={() => {
                          setCategoriaEditando(categoria);
                          setFormAbierto(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={categoria.activo ? "Desactivar categoría" : "Reactivar categoría"}
                        onClick={() => setCategoriaAccion(categoria)}
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

      <CategoriaFormDialog
        open={formAbierto}
        onOpenChange={setFormAbierto}
        categoria={categoriaEditando}
        onGuardado={() => cargar()}
      />

      <ConfirmDialog
        open={!!categoriaAccion}
        onOpenChange={(abierto) => {
          if (!abierto) setCategoriaAccion(null);
        }}
        title={
          categoriaAccion?.activo
            ? `¿Desactivar la categoría "${categoriaAccion?.nombre}"?`
            : `¿Reactivar la categoría "${categoriaAccion?.nombre}"?`
        }
        description={
          categoriaAccion?.activo
            ? "Dejará de aparecer como opción al registrar o programar mantenimientos. Los registros existentes se conservan."
            : "Volverá a estar disponible para nuevos registros."
        }
        confirmLabel={categoriaAccion?.activo ? "Desactivar" : "Reactivar"}
        destructive={categoriaAccion?.activo}
        onConfirm={async () => {
          if (!categoriaAccion) return;
          try {
            await cambiarEstadoCategoria(categoriaAccion.id, !categoriaAccion.activo);
            toast.success(categoriaAccion.activo ? "Categoría desactivada" : "Categoría reactivada");
            await cargar();
          } catch (error) {
            toast.error("No se pudo actualizar la categoría", {
              description: error instanceof Error ? error.message : "Error desconocido.",
            });
          }
        }}
      />
    </div>
  );
}

function CategoriaFormDialog({
  open,
  onOpenChange,
  categoria,
  onGuardado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria: CategoriaMantenimiento | null;
  onGuardado: () => void;
}) {
  const esEdicion = !!categoria;
  const [guardando, setGuardando] = useState(false);
  const form = useForm<CategoriaFormValues, undefined, CategoriaInput>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: valoresIniciales(categoria),
  });

  async function onSubmit(values: CategoriaInput) {
    setGuardando(true);
    try {
      const resultado = esEdicion
        ? await actualizarCategoria(categoria.id, values)
        : await crearCategoria(values);
      toast.success(
        esEdicion ? "Categoría actualizada" : "Categoría creada",
        { description: resultado.nombre }
      );
      form.reset(valoresIniciales(resultado));
      onGuardado();
      onOpenChange(false);
    } catch (error) {
      toast.error("No se pudo guardar la categoría", {
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
        if (!abierto) form.reset(valoresIniciales(categoria));
        onOpenChange(abierto);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
          <DialogDescription>
            Las categorías clasifican los mantenimientos. El nombre debe ser único.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej.: Alineación y balanceo" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="orden"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orden *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={999}
                      placeholder="Ej.: 10"
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
