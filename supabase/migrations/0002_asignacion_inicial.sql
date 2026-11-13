-- =====================================================================
-- Migración 0002: asignación inicial en el alta de vehículos
-- ---------------------------------------------------------------------
-- La migración 0001 registra el historial de asignaciones solo cuando el
-- técnico responsable CAMBIA (trigger de UPDATE). Con esta migración,
-- si un vehículo se da de alta ya con técnico responsable, se crea la
-- asignación inicial (tecnico_anterior = NULL).
--
-- Ejecutar en: Dashboard de Supabase > SQL Editor
-- =====================================================================

create or replace function public.registrar_asignacion_inicial() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tecnico_responsable_id is not null then
    insert into public.asignaciones (vehiculo_id, tecnico_anterior_id, tecnico_nuevo_id, fecha_inicio)
    values (new.id, null, new.tecnico_responsable_id, current_date);
  end if;
  return new;
end;
$$;

create trigger trg_asignacion_inicial after insert on public.vehiculos
  for each row execute function public.registrar_asignacion_inicial();
