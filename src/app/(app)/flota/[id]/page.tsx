import { Suspense } from "react";
import { Car, FileText, Fuel, Wrench, Camera, BellRing, Banknote, Users, ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PlaceholderButton } from "@/components/shared/placeholder-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { value: "general", label: "Información general", icon: FileText },
  { value: "asignaciones", label: "Asignaciones", icon: Users },
  { value: "mantenimiento", label: "Mantenimiento", icon: Wrench },
  { value: "combustible", label: "Combustible", icon: Fuel },
  { value: "documentacion", label: "Documentación y equipamiento", icon: ClipboardList },
  { value: "gastos", label: "Gastos", icon: Banknote },
  { value: "alertas", label: "Historial de alertas", icon: BellRing },
  { value: "archivos", label: "Fotografías y archivos", icon: Camera },
];

async function VehiculoContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Car className="size-5 text-primary" />
            <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              Ficha del vehículo
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Identificador: <span className="font-mono">{id}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Estado operativo: sin datos
          </Badge>
          <PlaceholderButton label="Editar" stage="Etapa 4" />
        </div>
      </div>

      <Card>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs sm:text-sm">
                  <tab.icon className="hidden size-3.5 sm:inline" />
                  <span className="truncate">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-4">
                <EmptyState
                  icon={tab.icon}
                  title={`Sin información de "${tab.label}"`}
                  description="El contenido de esta sección se activará al conectar la base de datos (Etapa 3) y desarrollar el módulo correspondiente."
                />
              </TabsContent>
            ))}
          </Tabs>
          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground">
            Todos los registros mostrados en esta ficha estarán relacionados con el
            vehículo correspondiente y persistidos en la base de datos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function VehiculoSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Card>
        <CardContent>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="mt-4 h-40 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function VehiculoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<VehiculoSkeleton />}>
      <VehiculoContent params={params} />
    </Suspense>
  );
}
