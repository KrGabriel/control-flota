interface SupabaseError {
  code?: string;
  message?: string;
  details?: string | null;
}

export function mensajeSupabase(error: SupabaseError): string {
  switch (error.code) {
    case "23505": {
      const detalle = error.details ?? "";
      if (detalle.includes("patente")) {
        return "Ya existe un vehículo registrado con esa patente.";
      }
      if (detalle.includes("numero_vehiculo")) {
        return "Ya existe un vehículo registrado con ese número.";
      }
      return "Ya existe un registro con esos datos únicos.";
    }
    case "23503":
      return "El registro relacionado no existe o fue eliminado.";
    case "23514":
      return "Hay valores fuera de rango. Revisá los datos ingresados.";
    case "42501":
      return "No tenés permisos para realizar esta operación.";
    default:
      return "Error al comunicarse con la base de datos. Intentá nuevamente.";
  }
}
