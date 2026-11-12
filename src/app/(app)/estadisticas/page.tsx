import { ChartColumn, FileDown, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PlaceholderButton } from "@/components/shared/placeholder-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function EstadisticasPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Estadísticas e informes"
        description="Análisis de costos y funcionamiento de la flota, con exportación a Excel y PDF."
        action={
          <Badge variant="secondary" className="text-xs">
            Se activa en la Etapa 8
          </Badge>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtrá por vehículo, técnico, período, tipo de mantenimiento y categoría de gasto.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {["Vehículo", "Técnico", "Período", "Tipo de mantenimiento", "Categoría de gasto"].map(
            (filtro) => (
              <div key={filtro} className="space-y-2">
                <Label className="text-xs text-muted-foreground">{filtro}</Label>
                <Button
                  variant="outline"
                  disabled
                  className="w-full justify-between font-normal text-muted-foreground"
                >
                  Sin opciones
                </Button>
              </div>
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informes disponibles</CardTitle>
          <CardDescription>
            Gastos de combustible, mantenimiento, totales, historial de mantenimiento,
            consumo, vencimientos y asignaciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={ChartColumn}
            title="Sin datos para informes"
            description="Los informes y gráficos se generarán a partir de los registros reales almacenados en la base de datos."
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <PlaceholderButton label="Exportar a Excel" stage="Etapa 8" />
            <PlaceholderButton label="Exportar a PDF" stage="Etapa 8" />
            <Button variant="outline" disabled className="w-full sm:w-auto">
              <FileSpreadsheet className="size-4" />
              Respaldo general
            </Button>
            <Button variant="outline" disabled className="w-full sm:w-auto">
              <FileDown className="size-4" />
              Importar CSV/Excel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
