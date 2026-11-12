import { cn } from "cn";

export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5 px-2", className)}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary font-heading text-sm font-bold text-primary-foreground">
        SN
      </div>
      <div className="min-w-0 leading-tight">
        <p className="truncate font-heading text-sm font-semibold">SwissNet</p>
        <p className="truncate text-xs text-muted-foreground">Gestión de Flota</p>
      </div>
    </div>
  );
}
