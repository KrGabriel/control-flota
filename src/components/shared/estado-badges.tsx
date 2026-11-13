import { Badge } from "@/components/ui/badge";
import { cn } from "cn";
import {
  ESTADOS_FISICA,
  ESTADOS_OPERATIVOS,
  type EstadoFisica,
  type EstadoOperativo,
} from "@/types/database";

const estadoOperativoClases: Record<EstadoOperativo, string> = {
  disponible:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  asignado:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900",
  en_mantenimiento:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  fuera_de_servicio:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
};

export function EstadoOperativoBadge({
  estado,
  className,
}: {
  estado: EstadoOperativo;
  className?: string;
}) {
  const etiqueta =
    ESTADOS_OPERATIVOS.find((e) => e.valor === estado)?.etiqueta ?? estado;
  return (
    <Badge variant="outline" className={cn(estadoOperativoClases[estado], className)}>
      {etiqueta}
    </Badge>
  );
}

export function EstadoFisicaBadge({
  estado,
  className,
}: {
  estado: EstadoFisica;
  className?: string;
}) {
  const etiqueta = ESTADOS_FISICA.find((e) => e.valor === estado)?.etiqueta ?? estado;
  const clases: Record<EstadoFisica, string> = {
    disponible:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
    faltante:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
    requiere_revision:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  };
  return (
    <Badge variant="outline" className={cn(clases[estado], className)}>
      {etiqueta}
    </Badge>
  );
}

export function EstadoVehiculoBadge({ activo }: { activo: boolean }) {
  return activo ? (
    <Badge variant="secondary" className="text-xs">
      Activo
    </Badge>
  ) : (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      Desactivado
    </Badge>
  );
}

export function nombreTecnico(
  tecnico?: { nombre: string; apellido: string } | null
): string {
  if (!tecnico) return "Sin asignar";
  return `${tecnico.nombre} ${tecnico.apellido}`;
}
