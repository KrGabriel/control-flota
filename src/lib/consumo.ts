import type { CargaCombustible } from "@/types/database";

export interface StatsConsumo {
  gastoTotal: number;
  litrosTotal: number;
  cantidadCargas: number;
  precioPromedio: number | null;
  distanciaTotal: number | null;
  rendimientoKmPorLitro: number | null;
}

export const STATS_VACIAS: StatsConsumo = {
  gastoTotal: 0,
  litrosTotal: 0,
  cantidadCargas: 0,
  precioPromedio: null,
  distanciaTotal: null,
  rendimientoKmPorLitro: null,
};

export function calcularEstadisticas(cargas: CargaCombustible[]): {
  stats: StatsConsumo;
  rendimientoPorCarga: Record<string, number>;
} {
  if (cargas.length === 0) {
    return { stats: STATS_VACIAS, rendimientoPorCarga: {} };
  }

  const porVehiculo = new Map<string, CargaCombustible[]>();
  for (const carga of cargas) {
    const lista = porVehiculo.get(carga.vehiculo_id) ?? [];
    lista.push(carga);
    porVehiculo.set(carga.vehiculo_id, lista);
  }

  let distanciaTotal = 0;
  let litrosUsados = 0;
  let distanciaValida = false;
  let litrosValidos = false;
  const rendimientoPorCarga: Record<string, number> = {};

  for (const lista of porVehiculo.values()) {
    const ordenada = [...lista].sort((a, b) => {
      if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
      return a.created_at < b.created_at ? -1 : 1;
    });

    for (let i = 1; i < ordenada.length; i++) {
      const actual = ordenada[i];
      const anterior = ordenada[i - 1];
      const tramo = actual.kilometraje - anterior.kilometraje;
      if (tramo > 0 && anterior.litros > 0) {
        rendimientoPorCarga[actual.id] = tramo / anterior.litros;
      }
    }

    if (ordenada.length >= 2) {
      const primera = ordenada[0];
      const ultima = ordenada[ordenada.length - 1];
      const tramo = ultima.kilometraje - primera.kilometraje;
      if (tramo > 0) {
        distanciaValida = true;
        distanciaTotal += tramo;
        litrosValidos = true;
        litrosUsados += ordenada
          .slice(1)
          .reduce((suma, c) => suma + Number(c.litros), 0);
      }
    }
  }

  const gastoTotal = cargas.reduce((suma, c) => suma + Number(c.costo_total), 0);
  const litrosTotal = cargas.reduce((suma, c) => suma + Number(c.litros), 0);

  return {
    stats: {
      gastoTotal,
      litrosTotal,
      cantidadCargas: cargas.length,
      precioPromedio: litrosTotal > 0 ? gastoTotal / litrosTotal : null,
      distanciaTotal: distanciaValida ? distanciaTotal : null,
      rendimientoKmPorLitro:
        distanciaValida && litrosValidos && litrosUsados > 0
          ? distanciaTotal / litrosUsados
          : null,
    },
    rendimientoPorCarga,
  };
}
