export interface TipoGasto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
}

export interface FondoMonetario {
  id: number;
  nombre: string;
  tipoFondo: 'CajaMenuda' | 'CuentaBancaria';
  numeroCuenta?: string | null;
  descripcion?: string | null;
}

export interface PresupuestoDto {
  id: number;
  anio: number;
  mes: number;
  tipoGastoId: number;
  montoPresupuestado: number;
  usuarioId?: number | null;
}

export interface PresupuestoUpsertDto {
  anio: number;
  mes: number;
  tipoGastoId: number;
  montoPresupuestado: number;
  usuarioId?: number | null;
}

export interface DepositoDto {
  id: number;
  fecha: string;        
  fondoMonetarioId: number;
  monto: number;
}

export interface MovimientoItemDto {
  tipo: 'Gasto' | 'Deposito';
  fecha: string;
  fondoMonetarioId: number;
  descripcion?: string | null;
  montoTotal: number;
}

export interface ComparativoItemDto {
  tipoGastoId: number;
  tipoGastoNombre: string;
  presupuestado: number;
  ejecutado: number;
}

export interface ApiEnvelope<T> { status: number; message: string; data: T; }
export type ApiResponse<T> = ApiEnvelope<T>;
