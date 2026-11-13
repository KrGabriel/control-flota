"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { descargarCsv, serializarCsv } from "@/lib/csv";
import { estadoVencimiento, hoyISO, type EstadoVencimiento } from "@/lib/formato";
import { estadoProgramacion, CONFIG_ALERTAS_POR_DEFECTO } from "@/lib/alertas";
import { listarVehiculos } from "@/services/vehiculos";
import { listarTecnicos } from "@/services/tecnicos";
import { listarCargas } from "@/services/combustible";
import { listarMantenimientos } from "@/services/mantenimientos";
import { listarProgramaciones } from "@/services/programaciones";
import { listarCategoriasActivas } from "@/services/categorias";
import { obtenerConfigAlertas } from "@/services/config";
import type {
  CategoriaMantenimiento,
  CargaCombustible,
  ConfigAlertas,
  Mantenimiento,
  Programacion,
  Tecnico,
  Vehiculo,
} from "@/types/database";

function primerDiaDelAnio(): string {
  return `${hoyISO().slice(0, 4)}-01-01`;
}

function formatearCompacto(valor: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(valor);
}

function nombreTecnico(t: { nombre: string; apellido: string } | null | undefined): string {
  return t ? `${t.nombre} ${t.apellido}` : "—";
}

const ETIQUETAS_NIVEL: Record<string, string> = {
  vencido: "Vencido",
  urgente: "Urgente",
  proximo_vencer: "Próximo",
  vigente: "Al día",
  sin_dato: "Sin dato",
};

export function EstadisticasView() {
  const [cargando, setCargando] = useState(true);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [cargas, setCargas] = useState<CargaCombustible[]>([]);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [programaciones, setProgramaciones] = useState<Programacion[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMantenimiento[]>([]);
  const [config, setConfig] = useState<ConfigAlertas>(CONFIG_ALERTAS_POR_DEFECTO);

  const [filtroVehiculo, setFiltroVehiculo] = useState("todas");
  const [filtroTecnico, setFiltroTecnico] = useState("todas");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [desde, setDesde] = useState(primerDiaDelAnio());
  const [hasta, setHasta] = useState(hoyISO());

  useEffect(() => {
    let activo = true;
    Promise.all([
      listarVehiculos(),
      listarTecnicos(),
      listarCargas(),
      listarMantenimientos(),
      listarProgramaciones(),
      listarCategoriasActivas(),
      obtenerConfigAlertas(),
    ])
      .then(
        ([
          vehiculosLista,
          tecnicosLista,
          cargasLista,
          mantenimientosLista,
          programacionesLista,
          categoriasLista,
          configLista,
        ]) => {
          if (!activo) return;
          setVehiculos(vehiculosLista);
          setTecnicos(tecnicosLista);
          setCargas(cargasLista);
          setMantenimientos(mantenimientosLista);
          setProgramaciones(programacionesLista);
          setCategorias(categoriasLista);
          setConfig(configLista);
          setCargando(false);
        }
      )
      .catch((error) => {
        if (!activo) return;
        toast.error("Error al cargar los datos de informes", {
          description: error instanceof Error ? error.message : "Error desconocido.",
        });
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const cargasFiltradas = useMemo(
    () =>
      cargas.filter((c) => {
        if (c.fecha < desde || c.fecha > hasta) return false;
        if (filtroVehiculo !== "todas" && c.vehiculo_id !== filtroVehiculo) return false;
        if (filtroTecnico !== "todas" && c.tecnico_id !== filtroTecnico) return false;
        return true;
      }),
    [cargas, desde, hasta, filtroVehiculo, filtroTecnico]
  );

  const mantenimientosFiltrados = useMemo(
    () =>
      mantenimientos.filter((m) => {
        if (m.fecha < desde || m.fecha > hasta) return false;
        if (filtroVehiculo !== "todas" && m.vehiculo_id !== filtroVehiculo) return false;
        if (filtroCategoria !== "todas" && m.categoria_id !== filtroCategoria) return false;
        return true;
      }),
    [mantenimientos, desde, hasta, filtroVehiculo, filtroCategoria]
  );

  const totalCombustible = cargasFiltradas.reduce((s, c) => s + Number(c.costo_total), 0);
  const totalMantenimiento = mantenimientosFiltrados.reduce((s, m) => s + Number(m.costo_total), 0);

  const costosPorVehiculo = useMemo(() => {
    const mapa = new Map<string, { patente: string; combustible: number; mantenimiento: number; movimientos: number }>();
    vehiculos.forEach((v) =>
      mapa.set(v.id, { patente: v.patente, combustible: 0, mantenimiento: 0, movimientos: 0 })
    );
    cargasFiltradas.forEach((c) => {
      const fila = mapa.get(c.vehiculo_id);
      if (fila) {
        fila.combustible += Number(c.costo_total);
        fila.movimientos += 1;
      }
    });
    mantenimientosFiltrados.forEach((m) => {
      const fila = mapa.get(m.vehiculo_id);
      if (fila) {
        fila.mantenimiento += Number(m.costo_total);
        fila.movimientos += 1;
      }
    });
    return [...mapa.values()]
      .filter((f) => f.movimientos > 0)
      .sort((a, b) => b.combustible + b.mantenimiento - (a.combustible + a.mantenimiento));
  }, [vehiculos, cargasFiltradas, mantenimientosFiltrados]);

  const consumoPorVehiculo = useMemo(() => {
    const mapa = new Map<string, { patente: string; litros: number; costo: number; kmMin: number; kmMax: number; cargas: number }>();
    cargasFiltradas.forEach((c) => {
      let fila = mapa.get(c.vehiculo_id);
      if (!fila) {
        fila = { patente: c.vehiculos?.patente ?? "—", litros: 0, costo: 0, kmMin: c.kilometraje, kmMax: c.kilometraje, cargas: 0 };
        mapa.set(c.vehiculo_id, fila);
      }
      fila.litros += Number(c.litros);
      fila.costo += Number(c.costo_total);
      fila.kmMin = Math.min(fila.kmMin, c.kilometraje);
      fila.kmMax = Math.max(fila.kmMax, c.kilometraje);
      fila.cargas += 1;
    });
    return [...mapa.values()]
      .map((f) => {
        const kmRecorridos = f.kmMax - f.kmMin;
        return {
          patente: f.patente,
          kmRecorridos,
          litros: f.litros,
          kmPorLitro: kmRecorridos > 0 ? kmRecorridos / f.litros : null,
          costoPorKm: kmRecorridos > 0 ? f.costo / kmRecorridos : null,
        };
      })
      .sort((a, b) => b.litros - a.litros);
  }, [cargasFiltradas]);

  const vencimientosReporte = useMemo(() => {
    const diasProximo = Math.max(...config.anticipos_dias, 0);
    const diasUrgente = Math.min(
      ...config.anticipos_dias.filter((d) => d > 0),
      diasProximo || Infinity
    );
    const filas: { patente: string; concepto: string; fecha: string | null; estado: EstadoVencimiento; detalle: string }[] = [];
    vehiculos.forEach((v) => {
      const docs = [
        { concepto: "VTV", fecha: v.fecha_proxima_vtv },
        { concepto: "Seguro", fecha: v.fecha_vencimiento_seguro },
        { concepto: "Matafuego", fecha: v.fecha_vencimiento_matafuego },
      ];
      docs.forEach((doc) => {
        const estado = estadoVencimiento(doc.fecha, diasUrgente, diasProximo);
        if (estado === "vencido" || estado === "urgente" || estado === "proximo_vencer") {
          filas.push({
            patente: v.patente,
            concepto: doc.concepto,
            fecha: doc.fecha,
            estado,
            detalle: estadoVencimientoTexto(doc.fecha, estado),
          });
        }
      });
    });
    programaciones.forEach((p) => {
      const estado = estadoProgramacion(p, config);
      if (estado === "vencido" || estado === "urgente" || estado === "proximo_vencer") {
        filas.push({
          patente: p.vehiculos?.patente ?? "—",
          concepto: `Mant. programado · ${p.categorias_mantenimiento?.nombre ?? "—"}`,
          fecha: p.proxima_fecha_estimada,
          estado,
          detalle: estadoProgramacionTexto(p),
        });
      }
    });
    const jerarquia: Record<string, number> = { vencido: 3, urgente: 2, proximo_vencer: 1 };
    return filas.sort((a, b) => jerarquia[b.estado] - jerarquia[a.estado]);
  }, [vehiculos, programaciones, config]);

  if (cargando) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const hayDatos = cargasFiltradas.length + mantenimientosFiltrados.length > 0;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Aplican a los informes de gastos y consumo. Los vencimientos se
            muestran según su estado actual.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Vehículo</Label>
            <Select value={filtroVehiculo} onValueChange={setFiltroVehiculo}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos</SelectItem>
                {vehiculos.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    #{v.numero_vehiculo} · {v.patente}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Técnico (cargas)</Label>
            <Select value={filtroTecnico} onValueChange={setFiltroTecnico}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos</SelectItem>
                {tecnicos.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {nombreTecnico(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Categoría</Label>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Desde</Label>
            <Input
              type="date"
              value={desde}
              max={hasta}
              onChange={(e) => setDesde(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Hasta</Label>
            <Input
              type="date"
              value={hasta}
              min={desde}
              onChange={(e) => setHasta(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {formatearPeriodo(desde, hasta)}
          </Badge>
          {hayDatos ? null : (
            <Badge variant="outline" className="text-xs">
              Sin movimientos en el período
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="size-4" />
          Imprimir / PDF
        </Button>
      </div>

      {/* Resumen de costos */}
      <InformeCard
        titulo="Resumen de costos por vehículo"
        descripcion="Totales del período filtrado, ordenados por gasto total."
        alExportar={() =>
          descargarCsv(
            "resumen_costos.csv",
            serializarCsv(
              ["patente", "combustible", "mantenimiento", "total", "movimientos"],
              costosPorVehiculo.map((f) => [
                f.patente,
                f.combustible,
                f.mantenimiento,
                f.combustible + f.mantenimiento,
                f.movimientos,
              ])
            )
          )
        }
        totalCombustible={totalCombustible}
        totalMantenimiento={totalMantenimiento}
      >
        {costosPorVehiculo.length === 0 ? (
          <SinDatos />
        ) : (
          <Tabla>
            <TableRow>
              <TableHead>Vehículo</TableHead>
              <TableHead className="text-right">Combustible</TableHead>
              <TableHead className="text-right">Mantenimiento</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Movimientos</TableHead>
            </TableRow>
            {costosPorVehiculo.map((f) => (
              <TableRow key={f.patente}>
                <TableCell className="font-medium">{f.patente}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatearMonedaLocal(f.combustible)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatearMonedaLocal(f.mantenimiento)}
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {formatearMonedaLocal(f.combustible + f.mantenimiento)}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">
                  {f.movimientos}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {formatearMonedaLocal(totalCombustible)}
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {formatearMonedaLocal(totalMantenimiento)}
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {formatearMonedaLocal(totalCombustible + totalMantenimiento)}
              </TableCell>
              <TableCell className="hidden sm:table-cell" />
            </TableRow>
          </Tabla>
        )}
      </InformeCard>

      {/* Combustible */}
      <InformeCard
        titulo="Gastos de combustible"
        descripcion={`${cargasFiltradas.length} carga(s) en el período · ${cargasFiltradas.reduce((s, c) => s + Number(c.litros), 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })} litros`}
        alExportar={() =>
          descargarCsv(
            "combustible_periodo.csv",
            serializarCsv(
              ["fecha", "patente", "tecnico", "kilometraje", "litros", "precio_por_litro", "costo_total"],
              cargasFiltradas.map((c) => [
                c.fecha,
                c.vehiculos?.patente ?? "",
                c.tecnicos ? `${c.tecnicos.nombre} ${c.tecnicos.apellido}` : "",
                c.kilometraje,
                c.litros,
                c.precio_por_litro,
                c.costo_total,
              ])
            )
          )
        }
      >
        {cargasFiltradas.length === 0 ? (
          <SinDatos />
        ) : (
          <Tabla>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Patente</TableHead>
              <TableHead className="hidden sm:table-cell">Técnico</TableHead>
              <TableHead className="text-right">Litros</TableHead>
              <TableHead className="hidden text-right md:table-cell">Precio/L</TableHead>
              <TableHead className="text-right">Costo</TableHead>
            </TableRow>
            {cargasFiltradas.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatearFechaCorta(c.fecha)}
                </TableCell>
                <TableCell className="font-medium">{c.vehiculos?.patente ?? "—"}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {nombreTecnico(c.tecnicos)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{c.litros}</TableCell>
                <TableCell className="hidden text-right tabular-nums md:table-cell">
                  {formatearMonedaLocal(Number(c.precio_por_litro))}
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {formatearMonedaLocal(Number(c.costo_total))}
                </TableCell>
              </TableRow>
            ))}
          </Tabla>
        )}
      </InformeCard>

      {/* Mantenimientos */}
      <InformeCard
        titulo="Gastos de mantenimiento"
        descripcion={`${mantenimientosFiltrados.length} registro(s) en el período`}
        alExportar={() =>
          descargarCsv(
            "mantenimientos_periodo.csv",
            serializarCsv(
              ["fecha", "patente", "categoria", "kilometraje", "trabajo_realizado", "taller", "costo_total"],
              mantenimientosFiltrados.map((m) => [
                m.fecha,
                m.vehiculos?.patente ?? "",
                m.categorias_mantenimiento?.nombre ?? "",
                m.kilometraje,
                m.trabajo_realizado,
                m.taller ?? "",
                m.costo_total,
              ])
            )
          )
        }
      >
        {mantenimientosFiltrados.length === 0 ? (
          <SinDatos />
        ) : (
          <Tabla>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Patente</TableHead>
              <TableHead className="hidden md:table-cell">Categoría</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Km</TableHead>
              <TableHead className="text-right">Costo</TableHead>
            </TableRow>
            {mantenimientosFiltrados.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatearFechaCorta(m.fecha)}
                </TableCell>
                <TableCell className="font-medium">{m.vehiculos?.patente ?? "—"}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {m.categorias_mantenimiento?.nombre ?? "—"}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">
                  {m.kilometraje.toLocaleString("es-AR")}
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {formatearMonedaLocal(Number(m.costo_total))}
                </TableCell>
              </TableRow>
            ))}
          </Tabla>
        )}
      </InformeCard>

      {/* Consumo */}
      <InformeCard
        titulo="Consumo por vehículo"
        descripcion="Km recorridos entre la primera y la última carga del período."
        alExportar={() =>
          descargarCsv(
            "consumo_periodo.csv",
            serializarCsv(
              ["patente", "km_recorridos", "litros", "km_por_litro", "costo", "costo_por_km"],
              consumoPorVehiculo.map((f) => [
                f.patente,
                f.kmRecorridos,
                f.litros.toFixed(2),
                f.kmPorLitro?.toFixed(2) ?? "",
                f.litros > 0
                  ? cargasFiltradas
                      .filter((c) => c.vehiculos?.patente === f.patente)
                      .reduce((s, c) => s + Number(c.costo_total), 0)
                  : 0,
                f.costoPorKm?.toFixed(2) ?? "",
              ])
            )
          )
        }
      >
        {consumoPorVehiculo.length === 0 ? (
          <SinDatos />
        ) : (
          <Tabla>
            <TableRow>
              <TableHead>Vehículo</TableHead>
              <TableHead className="text-right">Km recorridos</TableHead>
              <TableHead className="text-right">Litros</TableHead>
              <TableHead className="text-right">Km/L</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Costo/Km</TableHead>
            </TableRow>
            {consumoPorVehiculo.map((f) => (
              <TableRow key={f.patente}>
                <TableCell className="font-medium">{f.patente}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {f.kmRecorridos.toLocaleString("es-AR")}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {f.litros.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {f.kmPorLitro === null ? "—" : f.kmPorLitro.toFixed(2)}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">
                  {f.costoPorKm === null ? "—" : formatearMonedaLocal(f.costoPorKm)}
                </TableCell>
              </TableRow>
            ))}
          </Tabla>
        )}
      </InformeCard>

      {/* Vencimientos */}
      <InformeCard
        titulo="Vencimientos y mantenimientos pendientes"
        descripcion="Documentación y programaciones que requieren atención, según la configuración de alertas vigente."
        alExportar={() =>
          descargarCsv(
            "vencimientos_pendientes.csv",
            serializarCsv(
              ["patente", "concepto", "fecha", "estado", "detalle"],
              vencimientosReporte.map((f) => [f.patente, f.concepto, f.fecha ?? "", ETIQUETAS_NIVEL[f.estado], f.detalle])
            )
          )
        }
      >
        {vencimientosReporte.length === 0 ? (
          <SinDatos texto="Todo al día: no hay vencimientos ni mantenimientos pendientes." />
        ) : (
          <Tabla>
            <TableRow>
              <TableHead>Patente</TableHead>
              <TableHead>Concepto</TableHead>
              <TableHead className="hidden sm:table-cell">Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden md:table-cell">Detalle</TableHead>
            </TableRow>
            {vencimientosReporte.map((f, i) => (
              <TableRow key={`${f.patente}-${f.concepto}-${i}`} className={f.estado === "vencido" ? "opacity-90" : undefined}>
                <TableCell className="font-medium">{f.patente}</TableCell>
                <TableCell>{f.concepto}</TableCell>
                <TableCell className="hidden whitespace-nowrap tabular-nums sm:table-cell">
                  {f.fecha ? formatearFechaCorta(f.fecha) : "—"}
                </TableCell>
                <TableCell>
                  <NivelBadge estado={f.estado} />
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {f.detalle}
                </TableCell>
              </TableRow>
            ))}
          </Tabla>
        )}
      </InformeCard>
    </div>
  );
}

function InformeCard({
  titulo,
  descripcion,
  alExportar,
  children,
  totalCombustible,
  totalMantenimiento,
}: {
  titulo: string;
  descripcion: string;
  alExportar: () => void;
  children: React.ReactNode;
  totalCombustible?: number;
  totalMantenimiento?: number;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle>{titulo}</CardTitle>
            <CardDescription>{descripcion}</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="print:hidden" onClick={alExportar}>
            <Download className="size-4" />
            Exportar CSV
          </Button>
        </div>
        {totalCombustible !== undefined && totalMantenimiento !== undefined ? (
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="secondary" className="text-xs">
              Combustible: {formatearCompacto(totalCombustible)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Mantenimiento: {formatearCompacto(totalMantenimiento)}
            </Badge>
            <Badge className="text-xs">
              Total: {formatearCompacto(totalCombustible + totalMantenimiento)}
            </Badge>
          </div>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Tabla({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>{children}</TableHeader>
      </Table>
    </div>
  );
}

function SinDatos({ texto }: { texto?: string }) {
  return (
    <p className="py-6 text-center text-sm text-muted-foreground">
      {texto ?? "No hay datos para el período o los filtros seleccionados."}
    </p>
  );
}

function NivelBadge({ estado }: { estado: EstadoVencimiento }) {
  switch (estado) {
    case "vencido":
      return (
        <Badge variant="destructive" className="text-xs">
          Vencido
        </Badge>
      );
    case "urgente":
      return (
        <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900">
          Urgente
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="text-xs">
          Próximo
        </Badge>
      );
  }
}

function formatearFechaCorta(fecha: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(`${fecha}T12:00:00Z`));
}

function formatearPeriodo(desde: string, hasta: string): string {
  return `${formatearFechaCorta(desde)} → ${formatearFechaCorta(hasta)}`;
}

function formatearMonedaLocal(monto: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(monto);
}

function estadoVencimientoTexto(fecha: string | null, estado: EstadoVencimiento): string {
  if (!fecha) return "Sin fecha registrada.";
  if (estado === "vencido") return `Venció el ${formatearFechaCorta(fecha)}.`;
  const dias = Math.round(
    (new Date(`${fecha}T12:00:00Z`).getTime() -
      new Date(`${hoyISO()}T12:00:00Z`).getTime()) /
      86400000
  );
  return dias > 0 ? `Vence el ${formatearFechaCorta(fecha)} (en ${dias} días).` : `Vence hoy.`;
}

function estadoProgramacionTexto(p: Programacion): string {
  const partes: string[] = [];
  if (p.proxima_fecha_estimada) {
    partes.push(`Fecha estimada: ${formatearFechaCorta(p.proxima_fecha_estimada)}`);
  }
  if (p.proximo_kilometraje_estimado !== null && p.vehiculos?.kilometraje_actual !== undefined) {
    const faltante = p.proximo_kilometraje_estimado - p.vehiculos.kilometraje_actual;
    partes.push(
      faltante > 0
        ? `faltan ${faltante.toLocaleString("es-AR")} km`
        : "kilometraje alcanzado"
    );
  }
  return partes.join(" · ") || "Requiere atención.";
}
