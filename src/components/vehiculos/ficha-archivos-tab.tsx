"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CircleX,
  Download,
  File as FileIcon,
  ImageUp,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  eliminarAdjunto,
  listarAdjuntos,
  obtenerUrlAdjunto,
  subirAdjunto,
} from "@/services/adjuntos";
import type { Adjunto } from "@/types/database";

interface AdjuntoConUrl {
  adjunto: Adjunto;
  url: string | null;
  errorUrl: boolean;
}

const MAX_BYTES = 10 * 1024 * 1024;

function tamanoLegible(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FichaArchivosTab({ vehiculoId }: { vehiculoId: string }) {
  const [cargando, setCargando] = useState(true);
  const [items, setItems] = useState<AdjuntoConUrl[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [totalPorSubir, setTotalPorSubir] = useState(0);
  const [paraEliminar, setParaEliminar] = useState<Adjunto | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const resolverUrls = useCallback(async (lista: Adjunto[]) => {
    const conUrl: AdjuntoConUrl[] = lista.map((adjunto) => ({
      adjunto,
      url: null,
      errorUrl: false,
    }));
    setItems(conUrl);
    await Promise.all(
      conUrl.map(async (item) => {
        try {
          item.url = await obtenerUrlAdjunto(item.adjunto.path_storage);
        } catch {
          item.errorUrl = true;
        }
      })
    );
    setItems([...conUrl]);
  }, []);

  const cargar = useCallback(async () => {
    try {
      await resolverUrls(await listarAdjuntos("vehiculo", vehiculoId));
    } catch (error) {
      toast.error("Error al cargar los archivos", {
        description: error instanceof Error ? error.message : "Error desconocido.",
      });
    } finally {
      setCargando(false);
    }
  }, [vehiculoId, resolverUrls]);

  useEffect(() => {
    let activo = true;
    listarAdjuntos("vehiculo", vehiculoId)
      .then(async (lista) => {
        if (!activo) return;
        await resolverUrls(lista);
        setCargando(false);
      })
      .catch((error) => {
        if (!activo) return;
        toast.error("Error al cargar los archivos", {
          description: error instanceof Error ? error.message : "Error desconocido.",
        });
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [vehiculoId, resolverUrls]);

  async function alElegirArchivo(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const invalidos = files.filter((f) => f.size > MAX_BYTES);
    if (invalidos.length > 0) {
      toast.error("Archivo(s) demasiado grande(s)", {
        description: `Máximo 10 MB por archivo: ${invalidos.map((f) => f.name).join(", ")}.`,
      });
    }
    const validos = files.filter((f) => f.size <= MAX_BYTES);

    setSubiendo(true);
    setProgreso(0);
    setTotalPorSubir(validos.length);
    let ok = 0;
    try {
      for (const file of validos) {
        try {
          await subirAdjunto("vehiculo", vehiculoId, file);
          ok += 1;
        } catch (error) {
          toast.error(`No se pudo subir ${file.name}`, {
            description: error instanceof Error ? error.message : "Error desconocido.",
          });
        }
        setProgreso((p) => p + 1);
      }
      if (ok > 0) {
        toast.success(
          ok === 1 ? "Archivo subido" : `${ok} archivos subidos`
        );
        await cargar();
      }
    } finally {
      setSubiendo(false);
      setProgreso(0);
    }
  }

  async function confirmarEliminar() {
    if (!paraEliminar) return;
    try {
      await eliminarAdjunto(paraEliminar);
      toast.success("Archivo eliminado");
      setParaEliminar(null);
      await cargar();
    } catch (error) {
      toast.error("No se pudo eliminar el archivo", {
        description: error instanceof Error ? error.message : "Error desconocido.",
      });
    }
  }

  const imagenes = items.filter((i) =>
    i.adjunto.tipo_mime?.startsWith("image/")
  );
  const otros = items.filter(
    (i) => !i.adjunto.tipo_mime?.startsWith("image/")
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Fotografías y archivos del vehículo. Máximo 10 MB por archivo.
        </p>
        <Label
          htmlFor="subir-archivo-vehiculo"
          className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
        >
          <ImageUp className="size-4" />
          {subiendo
            ? `Subiendo (${progreso}/${totalPorSubir})...`
            : "Subir archivos"}
          <Input
            ref={inputRef}
            id="subir-archivo-vehiculo"
            type="file"
            multiple
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
            className="sr-only"
            disabled={subiendo}
            onChange={alElegirArchivo}
          />
        </Label>
      </div>

      {cargando ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ImageUp}
          title="Sin fotografías ni archivos"
          description="Subí fotos del vehículo, comprobantes o documentación escaneada."
        />
      ) : (
        <div className="space-y-4">
          {imagenes.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {imagenes.map((item) => (
                <figure
                  key={item.adjunto.id}
                  className="group relative overflow-hidden rounded-xl border"
                >
                  {item.url && !item.errorUrl ? (
                    <a href={item.url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt={item.adjunto.nombre_archivo}
                        className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    </a>
                  ) : item.errorUrl ? (
                    <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 bg-muted text-center text-xs text-muted-foreground">
                      <CircleX className="size-4" />
                      Enlace vencido
                    </div>
                  ) : (
                    <Skeleton className="aspect-square w-full" />
                  )}
                  <figcaption className="flex items-center justify-between gap-2 border-t bg-background/80 px-2 py-1.5 backdrop-blur">
                    <span className="truncate text-xs text-muted-foreground">
                      {item.adjunto.nombre_archivo}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Eliminar ${item.adjunto.nombre_archivo}`}
                      onClick={() => setParaEliminar(item.adjunto)}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : null}

          {otros.length > 0 ? (
            <ul className="divide-y rounded-xl border">
              {otros.map((item) => (
                <li
                  key={item.adjunto.id}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.adjunto.nombre_archivo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tamanoLegible(item.adjunto.tamano_bytes)}
                    </p>
                  </div>
                  {item.url && !item.errorUrl ? (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={item.url} target="_blank" rel="noreferrer">
                        <Download className="size-4" />
                        Descargar
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Eliminar ${item.adjunto.nombre_archivo}`}
                    onClick={() => setParaEliminar(item.adjunto)}
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={!!paraEliminar}
        onOpenChange={(abierto) => {
          if (!abierto) setParaEliminar(null);
        }}
        title={`¿Eliminar "${paraEliminar?.nombre_archivo}"?`}
        description="El archivo se borra permanentemente del almacenamiento."
        confirmLabel="Eliminar"
        destructive
        onConfirm={confirmarEliminar}
      />
    </div>
  );
}
