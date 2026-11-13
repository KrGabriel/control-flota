"use client";

import { useState } from "react";
import {
  CircleCheck,
  CircleX,
  Download,
  FileUp,
  LoaderCircle,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  descargarCsv,
  parsearCsv,
  serializarCsv,
  type CsvParseResult,
} from "@/lib/csv";
import { vehiculoSchema, type VehiculoInput } from "@/lib/validaciones/vehiculo";
import { listarVehiculos, crearVehiculosMasivo } from "@/services/vehiculos";
import { listarTecnicos } from "@/services/tecnicos";
import { listarMantenimientos } from "@/services/mantenimientos";
import { listarCargas } from "@/services/combustible";
import type { Vehiculo } from "@/types/database";

const ENCABEZADOS_IMPORT = [
  "numero_vehiculo",
  "tipo_vehiculo",
  "patente",
  "marca",
  "modelo",
  "anio",
  "kilometraje_actual",
  "fecha_proxima_vtv",
  "fecha_vencimiento_seguro",
  "fecha_vencimiento_matafuego",
  "fecha_instalacion_bateria",
  "estado_botiquin",
  "estado_cubiertas",
  "estado_operativo",
  "observaciones",
];

const PLANTILLA = [
  ...ENCABEZADOS_IMPORT,
].join(",") + "\n4,Auto,AB123CD,Toyota,Corolla,2021,45000,2027-03-15,2026-12-01,2026-09-30,2025-06-01,disponible,disponible,disponible,Vehículo importado por CSV";

const FORMATOS_ESTADO = "Los estados se escriben como: disponible, asignado, en_mantenimiento, fuera_de_servicio (operativo) y disponible, faltante, requiere_revision (botiquín/cubiertas).";

interface FilaImport {
  numero: number;
  input: VehiculoInput;
}

interface FilaError {
  numero: number;
  motivo: string;
}

interface AnalisisImport {
  total: number;
  validas: FilaImport[];
  errores: FilaError[];
  duplicadas: FilaError[];
}

export function RespaldosView() {
  const [exportando, setExportando] = useState<string | null>(null);
  const [archivo, setArchivo] = useState<string | null>(null);
  const [analisis, setAnalisis] = useState<AnalisisImport | null>(null);
  const [importando, setImportando] = useState(false);

  async function exportar(nombre: string, generador: () => Promise<void>) {
    setExportando(nombre);
    try {
      await generador();
    } catch (error) {
      toast.error(`Error al exportar ${nombre}`, {
        description: error instanceof Error ? error.message : "Error desconocido.",
      });
    } finally {
      setExportando(null);
    }
  }

  const exportarVehiculos = () =>
    exportar("vehículos", async () => {
      const lista = await listarVehiculos();
      descargarCsv(
        "vehiculos.csv",
        serializarCsv(
          [
            "numero_vehiculo",
            "tipo_vehiculo",
            "patente",
            "marca",
            "modelo",
            "anio",
            "kilometraje_actual",
            "fecha_proxima_vtv",
            "fecha_vencimiento_seguro",
            "fecha_vencimiento_matafuego",
            "fecha_instalacion_bateria",
            "estado_botiquin",
            "estado_cubiertas",
            "estado_operativo",
            "tecnico_responsable",
            "activo",
            "observaciones",
          ],
          lista.map((v) => [
            v.numero_vehiculo,
            v.tipo_vehiculo,
            v.patente,
            v.marca,
            v.modelo,
            v.anio,
            v.kilometraje_actual,
            v.fecha_proxima_vtv,
            v.fecha_vencimiento_seguro,
            v.fecha_vencimiento_matafuego,
            v.fecha_instalacion_bateria,
            v.estado_botiquin,
            v.estado_cubiertas,
            v.estado_operativo,
            v.tecnicos ? `${v.tecnicos.nombre} ${v.tecnicos.apellido}` : "",
            v.activo ? "si" : "no",
            v.observaciones,
          ])
        )
      );
      toast.success("Exportación descargada", { description: "vehiculos.csv" });
    });

  const exportarTecnicos = () =>
    exportar("técnicos", async () => {
      const lista = await listarTecnicos();
      descargarCsv(
        "tecnicos.csv",
        serializarCsv(
          ["nombre", "apellido", "telefono", "email", "activo", "observaciones"],
          lista.map((t) => [
            t.nombre,
            t.apellido,
            t.telefono,
            t.email,
            t.activo ? "si" : "no",
            t.observaciones,
          ])
        )
      );
      toast.success("Exportación descargada", { description: "tecnicos.csv" });
    });

  const exportarMantenimientos = () =>
    exportar("mantenimientos", async () => {
      const lista = await listarMantenimientos();
      descargarCsv(
        "mantenimientos.csv",
        serializarCsv(
          [
            "patente",
            "categoria",
            "fecha",
            "kilometraje",
            "trabajo_realizado",
            "taller",
            "costo_total",
            "observaciones",
          ],
          lista.map((m) => [
            m.vehiculos?.patente ?? "",
            m.categorias_mantenimiento?.nombre ?? "",
            m.fecha,
            m.kilometraje,
            m.trabajo_realizado,
            m.taller,
            m.costo_total,
            m.observaciones,
          ])
        )
      );
      toast.success("Exportación descargada", { description: "mantenimientos.csv" });
    });

  const exportarCargas = () =>
    exportar("cargas de combustible", async () => {
      const lista = await listarCargas();
      descargarCsv(
        "cargas_combustible.csv",
        serializarCsv(
          [
            "patente",
            "tecnico",
            "fecha",
            "kilometraje",
            "litros",
            "precio_por_litro",
            "costo_total",
            "observaciones",
          ],
          lista.map((c) => [
            c.vehiculos?.patente ?? "",
            c.tecnicos ? `${c.tecnicos.nombre} ${c.tecnicos.apellido}` : "",
            c.fecha,
            c.kilometraje,
            c.litros,
            c.precio_por_litro,
            c.costo_total,
            c.observaciones,
          ])
        )
      );
      toast.success("Exportación descargada", {
        description: "cargas_combustible.csv",
      });
    });

  function descargarPlantilla() {
    descargarCsv("plantilla_vehiculos.csv", PLANTILLA);
  }

  async function alElegirArchivo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setArchivo(file.name);
    setAnalisis(null);
    try {
      const texto = await file.text();
      const parseado = parsearCsv(texto);
      const existentes = await listarVehiculos();
      setAnalisis(analizarImport(parseado, existentes));
    } catch (error) {
      toast.error("No se pudo leer el archivo", {
        description: error instanceof Error ? error.message : "Error desconocido.",
      });
    }
  }

  async function importarValidas() {
    if (!analisis || analisis.validas.length === 0) return;
    setImportando(true);
    try {
      const creados = await crearVehiculosMasivo(
        analisis.validas.map((f) => f.input)
      );
      toast.success("Importación completada", {
        description: `${creados.length} vehículo(s) creado(s).`,
      });
      setAnalisis(null);
      setArchivo(null);
    } catch (error) {
      toast.error("Error al importar vehículos", {
        description: error instanceof Error ? error.message : "Error desconocido.",
      });
    } finally {
      setImportando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">Exportación</h3>
          <p className="text-xs text-muted-foreground">
            Descargá un respaldo en CSV de los registros. Los archivos se abren
            en Excel, Google Sheets o LibreOffice.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={exportando !== null}
            onClick={exportarVehiculos}
          >
            {exportando === "vehículos" ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Vehículos
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={exportando !== null}
            onClick={exportarTecnicos}
          >
            {exportando === "técnicos" ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Técnicos
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={exportando !== null}
            onClick={exportarMantenimientos}
          >
            {exportando === "mantenimientos" ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Mantenimientos
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={exportando !== null}
            onClick={exportarCargas}
          >
            {exportando === "cargas de combustible" ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Cargas de combustible
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">Importación de vehículos</h3>
          <p className="text-xs text-muted-foreground">
            Subí un CSV con un vehículo por fila. Las fechas van en formato
            AAAA-MM-DD. {FORMATOS_ESTADO} Los vehículos con patente o número ya
            existente se saltean.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Label
            htmlFor="archivo-import"
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm font-medium shadow-xs hover:bg-accent"
          >
            <FileUp className="size-4" />
            Elegir archivo CSV
            <Input
              id="archivo-import"
              type="file"
              accept=".csv,text/csv,.txt"
              className="sr-only"
              onChange={alElegirArchivo}
            />
          </Label>
          <Button variant="ghost" size="sm" onClick={descargarPlantilla}>
            <Download className="size-4" />
            Descargar plantilla
          </Button>
          {archivo ? (
            <Badge variant="secondary" className="text-xs">
              {archivo}
            </Badge>
          ) : null}
        </div>

        {analisis ? (
          <div className="space-y-3 rounded-xl border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {analisis.total} fila(s) leída(s)
              </Badge>
              <Badge className="text-xs">
                {analisis.validas.length} válida(s)
              </Badge>
              {analisis.duplicadas.length > 0 ? (
                <Badge variant="secondary" className="text-xs">
                  {analisis.duplicadas.length} duplicada(s)
                </Badge>
              ) : null}
              {analisis.errores.length > 0 ? (
                <Badge variant="destructive" className="text-xs">
                  {analisis.errores.length} con error
                </Badge>
              ) : null}
              <div className="ml-auto">
                <Button
                  size="sm"
                  disabled={
                    analisis.validas.length === 0 || importando
                  }
                  onClick={importarValidas}
                >
                  {importando ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  Importar {analisis.validas.length} vehículo(s)
                </Button>
              </div>
            </div>

            {analisis.validas.length + analisis.errores.length +
              analisis.duplicadas.length ===
            0 ? (
              <p className="text-sm text-muted-foreground">
                El archivo no contiene filas de datos.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Fila</TableHead>
                      <TableHead>Patente</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Detalle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analisis.validas.map((f) => (
                      <TableRow key={`v-${f.numero}`}>
                        <TableCell>{f.numero}</TableCell>
                        <TableCell className="font-medium">
                          {f.input.patente}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <CircleCheck className="size-3.5" />
                            Lista para importar
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {f.input.marca} {f.input.modelo} {f.input.anio}
                        </TableCell>
                      </TableRow>
                    ))}
                    {analisis.duplicadas.map((f) => (
                      <TableRow key={`d-${f.numero}`} className="opacity-60">
                        <TableCell>{f.numero}</TableCell>
                        <TableCell className="font-medium">—</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <CircleX className="size-3.5" />
                            Duplicada
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {f.motivo}
                        </TableCell>
                      </TableRow>
                    ))}
                    {analisis.errores.map((f) => (
                      <TableRow key={`e-${f.numero}`}>
                        <TableCell>{f.numero}</TableCell>
                        <TableCell className="font-medium">—</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <CircleX className="size-3.5" />
                            Error
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {f.motivo}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function analizarImport(
  parseado: CsvParseResult,
  existentes: Vehiculo[]
): AnalisisImport {
  const validas: FilaImport[] = [];
  const errores: FilaError[] = [];
  const duplicadas: FilaError[] = [];

  const patentesExistentes = new Set(
    existentes.map((v) => v.patente.toUpperCase())
  );
  const numerosExistentes = new Set(existentes.map((v) => v.numero_vehiculo));
  const patentesVistas = new Set<string>();
  const numerosVistos = new Set<number>();

  const total = parseado.filas.length;
  parseado.filas.forEach((fila, i) => {
    const numero = i + 2;
    if (!fila["patente"]) {
      errores.push({ numero, motivo: "Falta la patente." });
      return;
    }
    const registro = {
      ...fila,
      tecnico_responsable_id: "",
    };
    const resultado = vehiculoSchema.safeParse(registro);
    if (!resultado.success) {
      const primerError = resultado.error.issues[0];
      errores.push({
        numero,
        motivo: `${primerError.path.join(".") || "fila"}: ${primerError.message}`,
      });
      return;
    }
    const patente = resultado.data.patente.toUpperCase();
    const numeroVehiculo = resultado.data.numero_vehiculo;
    if (patentesExistentes.has(patente) || patentesVistas.has(patente)) {
      duplicadas.push({ numero, motivo: `La patente ${patente} ya existe.` });
      return;
    }
    if (numerosExistentes.has(numeroVehiculo) || numerosVistos.has(numeroVehiculo)) {
      duplicadas.push({
        numero,
        motivo: `El número ${numeroVehiculo} ya existe.`,
      });
      return;
    }
    patentesVistas.add(patente);
    numerosVistos.add(numeroVehiculo);
    validas.push({ numero, input: resultado.data });
  });

  return { total, validas, errores, duplicadas };
}
