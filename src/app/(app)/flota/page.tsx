import { Car, CirclePlus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PlaceholderButton } from "@/components/shared/placeholder-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function FlotaPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Flota de vehículos"
        description="Administrá los vehículos de la empresa, sus estados e información general."
        action={<PlaceholderButton label="Nuevo vehículo" stage="Etapa 4" />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Vehículos
            <Badge variant="secondary" className="text-xs">
              0 registrados
            </Badge>
          </CardTitle>
          <CardDescription>
            Buscá, filtrá y ordená la flota. Hacé clic en un vehículo para abrir su ficha
            completa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption className="mt-4">
              Aún no hay vehículos registrados.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Patente</TableHead>
                <TableHead className="hidden sm:table-cell">Marca / Modelo</TableHead>
                <TableHead className="hidden md:table-cell">Técnico responsable</TableHead>
                <TableHead className="hidden md:table-cell">Kilometraje</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody />
          </Table>
          <EmptyState
            icon={Car}
            title="No hay vehículos cargados"
            description="Registrá el primer vehículo para comenzar a gestionar la flota. Los datos se guardarán en la base de datos."
            className="mt-4"
          >
            <Button variant="outline" size="sm" disabled className="mt-2">
              <CirclePlus className="size-4" />
              Importar desde CSV/Excel
            </Button>
          </EmptyState>
        </CardContent>
      </Card>
    </div>
  );
}
