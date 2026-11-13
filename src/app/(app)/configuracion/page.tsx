import { Suspense } from "react";
import {
  BellRing,
  ArrowLeftRight,
  Settings,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertasConfig } from "@/components/configuracion/alertas-config";
import { CategoriasView } from "@/components/categorias/categorias-view";
import { TecnicosView } from "@/components/tecnicos/tecnicos-view";

const SECTIONS = [
  {
    icon: ArrowLeftRight,
    title: "Importación y exportación",
    description:
      "Importación de vehículos y registros desde CSV/Excel, y exportación de respaldos.",
    etapa: "Etapa 8",
  },
];

export default function ConfiguracionPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configuración"
        description="Parámetros generales del sistema de gestión de flota."
      />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Alertas y anticipos
          </h2>
          <Badge variant="secondary" className="text-xs">
            Activo
          </Badge>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="size-4 text-primary" />
              Configuración de alertas
            </CardTitle>
            <CardDescription>
              Define con cuánta anticipación se avisan los vencimientos, los
              umbrales de kilometraje y el envío del resumen por correo. Las
              alertas se recalculan diariamente mediante el proceso programado
              (<code>/api/cron/alertas</code>).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={null}>
              <AlertasConfig />
            </Suspense>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Categorías de mantenimiento
          </h2>
          <Badge variant="secondary" className="text-xs">
            Activo
          </Badge>
        </div>
        <Card>
          <CardContent>
            <CategoriasView />
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Técnicos
          </h2>
          <Badge variant="secondary" className="text-xs">
            Activo
          </Badge>
        </div>
        <Card>
          <CardContent>
            <TecnicosView />
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Módulos pendientes
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SECTIONS.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <section.icon className="size-4 text-primary" />
                  {section.title}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-xs">
                  Se activa en la {section.etapa}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-4 text-primary" />
            Información del sistema
          </CardTitle>
          <CardDescription>
            Zona horaria de referencia: America/Argentina/Buenos_Aires. Moneda: pesos
            argentinos (ARS). Todos los registros se almacenan en Supabase.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
