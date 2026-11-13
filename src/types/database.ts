export type EstadoOperativo =
  | "disponible"
  | "asignado"
  | "en_mantenimiento"
  | "fuera_de_servicio";

export type EstadoFisica = "disponible" | "faltante" | "requiere_revision";

export type EstadoDocumento =
  | "vigente"
  | "proximo_vencer"
  | "urgente"
  | "vencido";

export interface Tecnico {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
  activo: boolean;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface TecnicoResumen {
  id: string;
  nombre: string;
  apellido: string;
}

export interface Vehiculo {
  id: string;
  numero_vehiculo: number;
  tipo_vehiculo: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  tecnico_responsable_id: string | null;
  kilometraje_actual: number;
  fecha_proxima_vtv: string | null;
  fecha_vencimiento_seguro: string | null;
  fecha_vencimiento_matafuego: string | null;
  fecha_instalacion_bateria: string | null;
  estado_botiquin: EstadoFisica;
  estado_cubiertas: EstadoFisica;
  estado_operativo: EstadoOperativo;
  activo: boolean;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  tecnicos?: Pick<Tecnico, "id" | "nombre" | "apellido"> | null;
}

export interface Asignacion {
  id: string;
  vehiculo_id: string;
  tecnico_anterior_id: string | null;
  tecnico_nuevo_id: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  observaciones: string | null;
  created_at: string;
  tecnico_anterior?: TecnicoResumen | null;
  tecnico_nuevo?: TecnicoResumen | null;
}

export const ESTADOS_OPERATIVOS: { valor: EstadoOperativo; etiqueta: string }[] = [
  { valor: "disponible", etiqueta: "Disponible" },
  { valor: "asignado", etiqueta: "Asignado" },
  { valor: "en_mantenimiento", etiqueta: "En mantenimiento" },
  { valor: "fuera_de_servicio", etiqueta: "Fuera de servicio" },
];

export const ESTADOS_FISICA: { valor: EstadoFisica; etiqueta: string }[] = [
  { valor: "disponible", etiqueta: "Disponible" },
  { valor: "faltante", etiqueta: "Faltante" },
  { valor: "requiere_revision", etiqueta: "Requiere revisión" },
];

export const TIPOS_VEHICULO = [
  "Auto",
  "Camioneta",
  "Pickup",
  "Van",
  "Furgón",
  "Moto",
  "Otro",
];

export type ModoProgramacion = "kilometraje" | "tiempo" | "ambos";

export interface VehiculoResumen {
  id: string;
  numero_vehiculo: number;
  patente: string;
  marca: string;
  modelo: string;
  kilometraje_actual: number;
}

export interface CategoriaMantenimiento {
  id: string;
  nombre: string;
  orden: number;
  activo: boolean;
  created_at: string;
}

export interface Mantenimiento {
  id: string;
  vehiculo_id: string;
  categoria_id: string;
  fecha: string;
  kilometraje: number;
  trabajo_realizado: string;
  taller: string | null;
  costo_total: number;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  vehiculos?: VehiculoResumen | null;
  categorias_mantenimiento?: Pick<CategoriaMantenimiento, "id" | "nombre"> | null;
}

export interface Programacion {
  id: string;
  vehiculo_id: string;
  categoria_id: string;
  modo: ModoProgramacion;
  intervalo_km: number | null;
  intervalo_dias: number | null;
  fecha_ultimo_mantenimiento: string | null;
  kilometraje_ultimo_mantenimiento: number | null;
  proxima_fecha_estimada: string | null;
  proximo_kilometraje_estimado: number | null;
  activo: boolean;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  vehiculos?: VehiculoResumen | null;
  categorias_mantenimiento?: Pick<CategoriaMantenimiento, "id" | "nombre"> | null;
}

export interface ConfigAlertas {
  anticipos_dias: number[];
  umbral_km_proximo: number;
  umbral_km_urgente: number;
  email_habilitado: boolean;
  email_destino: string | null;
}

export type OrigenAlerta =
  | "vtv"
  | "seguro"
  | "matafuego"
  | "bateria"
  | "mantenimiento_programado"
  | "otro";

export type NivelAlerta = "normal" | "proximo_vencer" | "urgente" | "vencido";

export type CanalNotificacion = "app" | "email";

export interface NotificacionEnviada {
  id: string;
  alerta_id: string;
  canal: CanalNotificacion;
  nivel_al_enviar: NivelAlerta;
  fecha_envio: string;
}

export interface CargaCombustible {
  id: string;
  vehiculo_id: string;
  tecnico_id: string | null;
  fecha: string;
  kilometraje: number;
  litros: number;
  precio_por_litro: number;
  costo_total: number;
  observaciones: string | null;
  created_at: string;
  vehiculos?: VehiculoResumen | null;
  tecnicos?: TecnicoResumen | null;
}

export const MODOS_PROGRAMACION: { valor: ModoProgramacion; etiqueta: string }[] = [
  { valor: "kilometraje", etiqueta: "Por kilometraje" },
  { valor: "tiempo", etiqueta: "Por tiempo" },
  { valor: "ambos", etiqueta: "Por km y tiempo" },
];
