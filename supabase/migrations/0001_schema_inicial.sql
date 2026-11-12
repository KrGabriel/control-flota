-- =====================================================================
-- SwissNet | Gestión de Flota Vehicular
-- Migración 0001: esquema inicial completo
-- Ejecutar en: Dashboard de Supabase > SQL Editor
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tipos enumerados
-- ---------------------------------------------------------------------
create type estado_operativo as enum ('disponible', 'asignado', 'en_mantenimiento', 'fuera_de_servicio');
create type estado_fisica as enum ('disponible', 'faltante', 'requiere_revision');
create type estado_documento as enum ('vigente', 'proximo_vencer', 'urgente', 'vencido');
create type modo_programacion as enum ('kilometraje', 'tiempo', 'ambos');
create type origen_alerta as enum ('vtv', 'seguro', 'matafuego', 'bateria', 'mantenimiento_programado', 'otro');
create type nivel_alerta as enum ('normal', 'proximo_vencer', 'urgente', 'vencido');
create type tipo_elemento as enum ('documento_vencimiento', 'disponible_fisica');
create type elemento_doc as enum ('patente', 'seguro', 'vtv', 'matafuego', 'botiquin', 'balizas', 'crique', 'llave_ruedas', 'cubiertas', 'bateria', 'otro');
create type entidad_adjunto as enum ('vehiculo', 'mantenimiento', 'combustible', 'documento');
create type canal_notificacion as enum ('app', 'email');

-- ---------------------------------------------------------------------
-- Técnicos
-- ---------------------------------------------------------------------
create table public.tecnicos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellido text not null,
  telefono text,
  email text,
  activo boolean not null default true,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Vehículos (baja lógica: nunca eliminar históricos)
-- ---------------------------------------------------------------------
create table public.vehiculos (
  id uuid primary key default gen_random_uuid(),
  numero_vehiculo integer not null unique,
  tipo_vehiculo text not null,
  patente text not null unique,
  marca text not null,
  modelo text not null,
  anio integer not null check (anio between 1980 and 2100),
  tecnico_responsable_id uuid references public.tecnicos (id) on delete set null,
  kilometraje_actual integer not null default 0 check (kilometraje_actual >= 0),
  fecha_proxima_vtv date,
  fecha_vencimiento_seguro date,
  fecha_vencimiento_matafuego date,
  fecha_instalacion_bateria date,
  estado_botiquin estado_fisica not null default 'requiere_revision',
  estado_cubiertas estado_fisica not null default 'requiere_revision',
  estado_operativo estado_operativo not null default 'disponible',
  activo boolean not null default true,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_vehiculos_activo on public.vehiculos (activo);
create index idx_vehiculos_estado on public.vehiculos (estado_operativo);

-- ---------------------------------------------------------------------
-- Asignaciones históricas (no se sobrescriben ni eliminan)
-- ---------------------------------------------------------------------
create table public.asignaciones (
  id uuid primary key default gen_random_uuid(),
  vehiculo_id uuid not null references public.vehiculos (id) on delete cascade,
  tecnico_anterior_id uuid references public.tecnicos (id) on delete set null,
  tecnico_nuevo_id uuid not null references public.tecnicos (id) on delete restrict,
  fecha_inicio date not null default current_date,
  fecha_fin date,
  observaciones text,
  created_at timestamptz not null default now()
);

create index idx_asignaciones_vehiculo on public.asignaciones (vehiculo_id, fecha_inicio desc);

-- ---------------------------------------------------------------------
-- Categorías de mantenimiento (administrables desde Configuración)
-- ---------------------------------------------------------------------
create table public.categorias_mantenimiento (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  orden integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.categorias_mantenimiento (nombre, orden) values
  ('Mantenimiento preventivo', 1),
  ('Mantenimiento correctivo', 2),
  ('Cambio de aceite y filtros', 3),
  ('Reparación mecánica', 4),
  ('Reparación eléctrica', 5),
  ('Neumáticos', 6),
  ('Frenos', 7),
  ('Batería', 8),
  ('Otros', 9);

-- ---------------------------------------------------------------------
-- Registros de mantenimiento
-- ---------------------------------------------------------------------
create table public.mantenimientos (
  id uuid primary key default gen_random_uuid(),
  vehiculo_id uuid not null references public.vehiculos (id) on delete cascade,
  categoria_id uuid not null references public.categorias_mantenimiento (id) on delete restrict,
  fecha date not null,
  kilometraje integer not null check (kilometraje >= 0),
  trabajo_realizado text not null,
  taller text,
  costo_total numeric(14,2) not null check (costo_total >= 0),
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_mantenimientos_vehiculo on public.mantenimientos (vehiculo_id, fecha desc);
create index idx_mantenimientos_categoria on public.mantenimientos (categoria_id);
create index idx_mantenimientos_mes on public.mantenimientos (fecha);

-- ---------------------------------------------------------------------
-- Programaciones de mantenimiento (recurrentes por km, tiempo o ambos)
-- ---------------------------------------------------------------------
create table public.programaciones_mantenimiento (
  id uuid primary key default gen_random_uuid(),
  vehiculo_id uuid not null references public.vehiculos (id) on delete cascade,
  categoria_id uuid not null references public.categorias_mantenimiento (id) on delete restrict,
  modo modo_programacion not null default 'ambos',
  intervalo_km integer check (intervalo_km > 0),
  intervalo_dias integer check (intervalo_dias > 0),
  fecha_ultimo_mantenimiento date,
  kilometraje_ultimo_mantenimiento integer,
  proxima_fecha_estimada date,
  proximo_kilometraje_estimado integer,
  activo boolean not null default true,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_modo_kilometraje check (modo not in ('kilometraje', 'ambos') or intervalo_km is not null),
  constraint chk_modo_tiempo check (modo not in ('tiempo', 'ambos') or intervalo_dias is not null)
);

create unique index uq_programacion_activa
  on public.programaciones_mantenimiento (vehiculo_id, categoria_id)
  where activo;
create index idx_programaciones_vehiculo on public.programaciones_mantenimiento (vehiculo_id);

-- ---------------------------------------------------------------------
-- Cargas de combustible
-- ---------------------------------------------------------------------
create table public.cargas_combustible (
  id uuid primary key default gen_random_uuid(),
  vehiculo_id uuid not null references public.vehiculos (id) on delete cascade,
  tecnico_id uuid references public.tecnicos (id) on delete set null,
  fecha date not null,
  kilometraje integer not null check (kilometraje >= 0),
  litros numeric(10,2) not null check (litros > 0),
  precio_por_litro numeric(10,2) not null check (precio_por_litro > 0),
  costo_total numeric(14,2) generated always as (litros * precio_por_litro) stored,
  observaciones text,
  created_at timestamptz not null default now()
);

create index idx_cargas_vehiculo on public.cargas_combustible (vehiculo_id, fecha desc);
create index idx_cargas_mes on public.cargas_combustible (fecha);

-- ---------------------------------------------------------------------
-- Documentación y equipamiento (integrado en la ficha del vehículo)
-- ---------------------------------------------------------------------
create table public.documentos_equipamiento (
  id uuid primary key default gen_random_uuid(),
  vehiculo_id uuid not null references public.vehiculos (id) on delete cascade,
  elemento elemento_doc not null,
  tipo tipo_elemento not null,
  fecha_vencimiento date,
  estado_documento estado_documento,
  estado_fisica estado_fisica,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_documento_por_vehiculo unique (vehiculo_id, elemento),
  constraint chk_tipo_estado check (
    (tipo = 'documento_vencimiento' and estado_documento is not null and estado_fisica is null)
    or
    (tipo = 'disponible_fisica' and estado_fisica is not null and estado_documento is null)
  )
);

create index idx_documentos_vehiculo on public.documentos_equipamiento (vehiculo_id);

-- ---------------------------------------------------------------------
-- Archivos adjuntos (Supabase Storage, buckets privados)
-- ---------------------------------------------------------------------
create table public.adjuntos (
  id uuid primary key default gen_random_uuid(),
  entidad entidad_adjunto not null,
  entidad_id uuid not null,
  nombre_archivo text not null,
  path_storage text not null unique,
  tipo_mime text,
  tamano_bytes bigint,
  created_at timestamptz not null default now()
);

create index idx_adjuntos_entidad on public.adjuntos (entidad, entidad_id);

-- ---------------------------------------------------------------------
-- Alertas (recalculadas por proceso programado)
-- ---------------------------------------------------------------------
create table public.alertas (
  id uuid primary key default gen_random_uuid(),
  vehiculo_id uuid references public.vehiculos (id) on delete cascade,
  origen origen_alerta not null,
  referencia_id uuid,
  nivel nivel_alerta not null default 'normal',
  titulo text not null,
  descripcion text,
  fecha_alerta date not null default current_date,
  resuelta boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_alertas_vehiculo on public.alertas (vehiculo_id);
create index idx_alertas_activas on public.alertas (resuelta, nivel, fecha_alerta);

-- ---------------------------------------------------------------------
-- Notificaciones enviadas (control anti-repetición por nivel)
-- ---------------------------------------------------------------------
create table public.notificaciones_enviadas (
  id uuid primary key default gen_random_uuid(),
  alerta_id uuid not null references public.alertas (id) on delete cascade,
  canal canal_notificacion not null,
  nivel_al_enviar nivel_alerta not null,
  fecha_envio timestamptz not null default now(),
  constraint uq_notificacion_unicas unique (alerta_id, canal, nivel_al_enviar)
);

-- ---------------------------------------------------------------------
-- Configuración del sistema (clave/valor JSONB)
-- ---------------------------------------------------------------------
create table public.configuracion (
  clave text primary key,
  valor jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.configuracion (clave, valor) values
  ('alertas', jsonb_build_object(
    'anticipos_dias', '[30, 15, 7, 0]'::jsonb,
    'anticipos_por_categoria', '{}'::jsonb,
    'umbral_km_proximo', 2000,
    'umbral_km_urgente', 500,
    'email_habilitado', false
  ));

-- =====================================================================
-- Funciones y triggers
-- =====================================================================

-- updated_at automático
create or replace function public.set_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_updated_at before update on public.tecnicos
  for each row execute function public.set_updated_at();
create trigger trg_updated_at before update on public.vehiculos
  for each row execute function public.set_updated_at();
create trigger trg_updated_at before update on public.mantenimientos
  for each row execute function public.set_updated_at();
create trigger trg_updated_at before update on public.programaciones_mantenimiento
  for each row execute function public.set_updated_at();
create trigger trg_updated_at before update on public.documentos_equipamiento
  for each row execute function public.set_updated_at();
create trigger trg_updated_at before update on public.alertas
  for each row execute function public.set_updated_at();
create trigger trg_updated_at before update on public.configuracion
  for each row execute function public.set_updated_at();

-- Normalización de patente (mayúsculas, sin espacios)
create or replace function public.normalizar_patente() returns trigger
language plpgsql
as $$
begin
  new.patente = upper(trim(new.patente));
  return new;
end;
$$;

create trigger trg_patente before insert or update on public.vehiculos
  for each row execute function public.normalizar_patente();

-- Historial de asignaciones: cada cambio de técnico cierra la asignación
-- vigente y crea una nueva (nunca se sobrescribe ni elimina).
create or replace function public.registrar_cambio_asignacion() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tecnico_responsable_id is distinct from old.tecnico_responsable_id then
    update public.asignaciones
      set fecha_fin = current_date
      where vehiculo_id = new.id and fecha_fin is null;

    if new.tecnico_responsable_id is not null then
      insert into public.asignaciones (vehiculo_id, tecnico_anterior_id, tecnico_nuevo_id, fecha_inicio)
      values (new.id, old.tecnico_responsable_id, new.tecnico_responsable_id, current_date);
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_asignaciones after update of tecnico_responsable_id on public.vehiculos
  for each row execute function public.registrar_cambio_asignacion();

-- Kilometraje: actualización automática monotónica (nunca hacia atrás,
-- nunca silenciosamente descendente). La app advierte antes de guardar
-- kilometrajes menores al último registrado.
create or replace function public.actualizar_kilometraje_vehiculo() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.kilometraje is not null then
    update public.vehiculos
      set kilometraje_actual = new.kilometraje
      where id = new.vehiculo_id and kilometraje_actual < new.kilometraje;
  end if;
  return new;
end;
$$;

create trigger trg_kilometraje_mantenimiento after insert on public.mantenimientos
  for each row execute function public.actualizar_kilometraje_vehiculo();

create trigger trg_kilometraje_carga after insert on public.cargas_combustible
  for each row execute function public.actualizar_kilometraje_vehiculo();

-- Programaciones: al registrar un mantenimiento de la categoría asociada,
-- se actualiza el último registro y se recalculan las próximas estimaciones.
-- Con modo 'ambos', la alerta se dispara con lo que venza primero.
create or replace function public.actualizar_programacion() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prog public.programaciones_mantenimiento%rowtype;
begin
  for v_prog in
    select * from public.programaciones_mantenimiento
    where vehiculo_id = new.vehiculo_id
      and categoria_id = new.categoria_id
      and activo
  loop
    if v_prog.fecha_ultimo_mantenimiento is null or new.fecha >= v_prog.fecha_ultimo_mantenimiento then
      update public.programaciones_mantenimiento set
        fecha_ultimo_mantenimiento = new.fecha,
        kilometraje_ultimo_mantenimiento = coalesce(new.kilometraje, v_prog.kilometraje_ultimo_mantenimiento),
        proxima_fecha_estimada = case
          when v_prog.modo in ('tiempo', 'ambos') and v_prog.intervalo_dias is not null
            then new.fecha + make_interval(days => v_prog.intervalo_dias)
          else v_prog.proxima_fecha_estimada
        end,
        proximo_kilometraje_estimado = case
          when v_prog.modo in ('kilometraje', 'ambos') and v_prog.intervalo_km is not null
            then new.kilometraje + v_prog.intervalo_km
          else v_prog.proximo_kilometraje_estimado
        end,
        updated_at = now()
      where id = v_prog.id;
    end if;
  end loop;
  return new;
end;
$$;

create trigger trg_actualizar_programacion after insert on public.mantenimientos
  for each row execute function public.actualizar_programacion();

-- =====================================================================
-- Row Level Security: acceso completo solo para usuarios autenticados
-- (el administrador es el único usuario; sin registros públicos)
-- =====================================================================
alter table public.tecnicos enable row level security;
alter table public.vehiculos enable row level security;
alter table public.asignaciones enable row level security;
alter table public.categorias_mantenimiento enable row level security;
alter table public.mantenimientos enable row level security;
alter table public.programaciones_mantenimiento enable row level security;
alter table public.cargas_combustible enable row level security;
alter table public.documentos_equipamiento enable row level security;
alter table public.adjuntos enable row level security;
alter table public.alertas enable row level security;
alter table public.notificaciones_enviadas enable row level security;
alter table public.configuracion enable row level security;

create policy "acceso_administrador" on public.tecnicos for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "acceso_administrador" on public.vehiculos for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "acceso_administrador" on public.asignaciones for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "acceso_administrador" on public.categorias_mantenimiento for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "acceso_administrador" on public.mantenimientos for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "acceso_administrador" on public.programaciones_mantenimiento for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "acceso_administrador" on public.cargas_combustible for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "acceso_administrador" on public.documentos_equipamiento for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "acceso_administrador" on public.adjuntos for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "acceso_administrador" on public.alertas for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "acceso_administrador" on public.notificaciones_enviadas for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "acceso_administrador" on public.configuracion for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

-- =====================================================================
-- Storage: buckets privados para documentación y comprobantes
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('documentos-vehiculos', 'documentos-vehiculos', false)
on conflict (id) do update set public = false;

create policy "archivos_admin" on storage.objects for all
  to authenticated
  using (bucket_id in ('documentos-vehiculos'))
  with check (bucket_id in ('documentos-vehiculos'));
