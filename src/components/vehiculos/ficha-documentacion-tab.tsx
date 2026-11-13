"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  documentoSchema,
  ELEMENTOS_ADICIONALES,
  type DocumentoInput,
  type DocumentoFormValues,
  type ElementoAdicional,
} from "@/lib/validaciones/documento";
import {
  eliminarDocumento,
  guardarDocumento,
  listarDocumentosPorVehiculo,
  type DocumentoEquipamiento,
} from "@/services/documentos";
import {
  EstadoFisicaBadge,
} from "@/components/shared/estado-badges";
import { NivelVencimientoBadge } from "@/components/vencimientos/vencimientos-view";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatearFecha, estadoVencimiento, type EstadoVencimiento } from "@/lib/formato";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Vehiculo } from "@/types/database";

function valoresIniciales(documento?: DocumentoEquipamiento | null): DocumentoFormValues {
  return {
    elemento: (documento?.elemento as ElementoAdicional) ?? "otro",
    tipo: documento?.tipo ?? "disponible_fisica",
    fecha_vencimiento: documento?.fecha_vencimiento ?? "",
    estado_fisica: documento?.estado_fisica ?? "requiere_revision",
    observaciones: documento?.observaciones ?? "",
  };
}

export function FichaDocumentacionTab({
  vehiculo,
}: {
  vehiculo: Vehiculo;
}) {
  const [documentos, setDocumentos] = useState<DocumentoEquipamiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<DocumentoEquipamiento | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [aEliminar, setAEliminar] = useState<DocumentoEquipamiento | null>(null);
  const [tipo, setTipo] = useState<DocumentoFormValues["tipo"]>(
    editando?.tipo ?? "disponible_fisica"
  );

  const form = useForm<DocumentoFormValues, undefined, DocumentoInput>({
    resolver: zodResolver(documentoSchema),
    defaultValues: valoresIniciales(editando),
  });

  async function cargar() {
    try {
      setDocumentos(await listarDocumentosPorVehiculo(vehiculo.id));
    } catch (error) {
      toast.error("Error al cargar la documentación", {
        description: error instanceof Error ? error.message : "Error desconocido.",
      });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    let activo = true;
    listarDocumentosPorVehiculo(vehiculo.id)
      .then((lista) => {
        if (!activo) return;
        setDocumentos(lista);
        setCargando(false);
      })
      .catch(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [vehiculo.id]);

  async function onSubmit(values: DocumentoInput) {
    setGuardando(true);
    try {
      await guardarDocumento(vehiculo.id, values);
      toast.success(
        editando ? "Elemento actualizado" : "Elemento agregado",
        {
          description:
            values.tipo === "documento_vencimiento"
              ? `${etiquetaElemento(values.elemento)} · vence ${formatearFecha(values.fecha_vencimiento)}`
              : `${etiquetaElemento(values.elemento)} · ${values.estado_fisica === "disponible" ? "disponible" : values.estado_fisica === "faltante" ? "faltante" : "requiere revisión"}`,
        }
      );
      setFormAbierto(false);
      setEditando(null);
      await cargar();
    } catch (error) {
      toast.error("No se pudo guardar el elemento", {
        description: error instanceof Error ? error.message : "Error desconocido.",
      });
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar() {
    if (!aEliminar) return;
    try {
      await eliminarDocumento(aEliminar.id);
      toast.success("Elemento eliminado", {
        description: `${etiquetaElemento(aEliminar.elemento as ElementoAdicional)} quitado de la ficha.`,
      });
      await cargar();
    } catch (error) {
      toast.error("No se pudo eliminar el elemento", {
        description: error instanceof Error ? error.message : "Error desconocido.",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold">Vencimientos</p>
        <div className="grid grid-cols-1 gap-2 rounded-xl border p-4 sm:grid-cols-2">
          <VencimientoLinea etiqueta="Próxima VTV" fecha={vehiculo.fecha_proxima_vtv} />
          <VencimientoLinea etiqueta="Vencimiento del seguro" fecha={vehiculo.fecha_vencimiento_seguro} />
          <VencimientoLinea etiqueta="Vencimiento del matafuego" fecha={vehiculo.fecha_vencimiento_matafuego} />
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">Instalación de batería</span>
            <span className="text-sm tabular-nums">{formatearFecha(vehiculo.fecha_instalacion_bateria)}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Estas fechas se editan desde el botón Editar vehículo.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Equipamiento integrado</p>
        <div className="grid grid-cols-1 gap-2 rounded-xl border p-4 sm:grid-cols-2">
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Elementos adicionales</p>
          <Button
            size="sm"
            onClick={() => {
              setEditando(null);
              form.reset(valoresIniciales(null));
              setTipo("disponible_fisica");
              setFormAbierto(true);
            }}
          >
            <Plus className="size-4" />
            Agregar elemento
          </Button>
        </div>
        {cargando ? (
          <p className="text-sm text-muted-foreground">Cargando elementos...</p>
        ) : documentos.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            No hay elementos adicionales cargados (patente, balizas, crique,
            llave de ruedas, etc.).
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Elemento</TableHead>
                  <TableHead>Estado / Vencimiento</TableHead>
                  <TableHead className="hidden sm:table-cell">Observaciones</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentos.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      {etiquetaElemento(doc.elemento as ElementoAdicional)}
                    </TableCell>
                    <TableCell>
                      {doc.tipo === "documento_vencimiento" ? (
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="text-sm tabular-nums">
                            {formatearFecha(doc.fecha_vencimiento)}
                          </span>
                          <NivelVencimientoBadge
                            estado={estadoVencimiento(doc.fecha_vencimiento)}
                          />
                        </div>
                      ) : (
                        <EstadoFisicaBadge estado={doc.estado_fisica ?? "requiere_revision"} />
                      )}
                    </TableCell>
                    <TableCell className="hidden max-w-xs truncate text-sm text-muted-foreground sm:table-cell">
                      {doc.observaciones ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Editar elemento"
                          onClick={() => {
                            setEditando(doc);
                            form.reset(valoresIniciales(doc));
                            setTipo(doc.tipo);
                            setFormAbierto(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Eliminar elemento"
                          onClick={() => setAEliminar(doc)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog
        open={formAbierto}
        onOpenChange={(nuevoEstado) => {
          if (!nuevoEstado) {
            form.reset(valoresIniciales(editando));
            setTipo(editando?.tipo ?? "disponible_fisica");
          }
          setFormAbierto(nuevoEstado);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar elemento" : "Agregar elemento"}
            </DialogTitle>
            <DialogDescription>
              Documentación con vencimiento o equipamiento físico del vehículo.
              Cada elemento se guarda una sola vez por vehículo.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => onSubmit(v))} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="elemento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Elemento *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ELEMENTOS_ADICIONALES.map((e) => (
                            <SelectItem key={e.valor} value={e.valor}>
                              {e.etiqueta}
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
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clase *</FormLabel>
                      <Select
                        onValueChange={(valor) => {
                          field.onChange(valor);
                          setTipo(valor as DocumentoFormValues["tipo"]);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="disponible_fisica">
                            Equipamiento físico
                          </SelectItem>
                          <SelectItem value="documento_vencimiento">
                            Documento con vencimiento
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {tipo === "documento_vencimiento" ? (
                <FormField
                  control={form.control}
                  name="fecha_vencimiento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de vencimiento *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="estado_fisica"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="disponible">Disponible</SelectItem>
                          <SelectItem value="faltante">Faltante</SelectItem>
                          <SelectItem value="requiere_revision">
                            Requiere revisión
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Opcional" {...field} value={field.value ?? ""} />
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
                    form.reset(valoresIniciales(editando));
                    setTipo(editando?.tipo ?? "disponible_fisica");
                    setFormAbierto(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardando}>
                  {guardando ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Agregar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!aEliminar}
        onOpenChange={(abierto) => {
          if (!abierto) setAEliminar(null);
        }}
        title="¿Eliminar este elemento?"
        description={`${etiquetaElemento(aEliminar?.elemento as ElementoAdicional)} se quitará de la ficha. Los vencimientos principales (VTV, seguro, matafuego) no se ven afectados.`}
        confirmLabel="Eliminar"
        destructive
        onConfirm={confirmarEliminar}
      />
    </div>
  );
}

function etiquetaElemento(elemento: ElementoAdicional): string {
  return ELEMENTOS_ADICIONALES.find((e) => e.valor === elemento)?.etiqueta ?? elemento;
}

function VencimientoLinea({ etiqueta, fecha }: { etiqueta: string; fecha: string | null }) {
  const estado: EstadoVencimiento = estadoVencimiento(fecha);
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-muted-foreground">{etiqueta}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm tabular-nums">{formatearFecha(fecha)}</span>
        <NivelVencimientoBadge estado={estado} />
      </div>
    </div>
  );
}
