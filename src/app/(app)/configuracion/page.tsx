import {
  BellRing,
  ListTree,
  Users,
  Mail,
  ArrowLeftRight,
  Settings,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SECTIONS = [
  {
    icon: BellRing,
    title: "Alertas y anticipos",
    description:
      "Configuración de la anticipación para avisos (30, 15, 7, 0 días) y umbrales de kilometraje por categoría de vencimiento.",
  },
  {
    icon: ListTree,
    title: "Categorías de mantenimiento",
    description:
      "Administración de categorías: preventivo, correctivo, aceite y filtros, mecánica, eléctrica, neumáticos, frenos, batería y otros.",
  },
  {
    icon: Users,
    title: "Técnicos",
    description:
      "Registro de técnicos responsables de vehículos. No son usuarios de la aplicación.",
  },
  {
    icon: Mail,
    title: "Notificaciones por correo",
    description:
      "Envío opcional de alertas por email mediante Resend. Requiere configurar las credenciales en variables de entorno.",
  },
  {
    icon: ArrowLeftRight,
    title: "Importación y exportación",
    description:
      "Importación de vehículos y registros desde CSV/Excel, y exportación de respaldos.",
  },
];

export default function ConfiguracionPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configuración"
        description="Parámetros generales del sistema de gestión de flota."
      />

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
                Se activa en próximas etapas
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

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
