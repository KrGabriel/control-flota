"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CostoPorVehiculo, PuntoMensual } from "@/services/dashboard";

const formatearCompacto = (valor: number): string =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(valor);

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  fontSize: "0.8rem",
} as const;

export function GraficoGastosMensuales({ datos }: { datos: PuntoMensual[] }) {
  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            tickFormatter={formatearCompacto}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(valor) => formatearCompacto(Number(valor))}
          />
          <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
          <Line
            type="monotone"
            dataKey="combustible"
            name="Combustible"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="mantenimiento"
            name="Mantenimiento"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GraficoCostosPorVehiculo({ datos }: { datos: CostoPorVehiculo[] }) {
  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="patente"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            tickFormatter={formatearCompacto}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(valor) => formatearCompacto(Number(valor))}
          />
          <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
          <Bar dataKey="combustible" name="Combustible" stackId="gastos" fill="var(--primary)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="mantenimiento" name="Mantenimiento" stackId="gastos" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
