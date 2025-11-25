export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface TipoGasto { id: number; codigo: string; nombre: string; descripcion?: string | null; }
export interface PresupuestoDto {
  id: number; anio: number; mes: number;
  tipoGastoId: number; montoPresupuestado: number; usuarioId?: number | null;
}