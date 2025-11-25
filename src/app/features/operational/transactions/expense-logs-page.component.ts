import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/interfaces/api-response';

/** Catálogos mínimos */
type TipoGasto = { id: number; nombre: string };
type FondoMonetario = { id: number; nombre: string };

/** Respuesta de guardado (del backend) */
type GastoSaveResult = {
  gastoEncabezadoId: number;
  guardado: boolean;
  sobregiros: {
    tipoGastoId: number;
    tipoGastoNombre: string;
    presupuestado: number;
    ejecutadoPrevio: number;
    montoNuevo: number;
    exceso: number;
  }[];
};

/** Payload exacto que espera /api/Gastos */
type GastoCreateRequest = {
  fecha: string; // "2025-11-22" o ISO
  fondoMonetarioId: number;
  observaciones: string | null;
  nombreComercio: string;
  tipoDocumento: 'Factura' | 'Comprobante' | 'Otro';
  usuarioId: number | null;
  detalles: { tipoGastoId: number; monto: number }[];
};

@Component({
  standalone: true,
  selector: 'app-budget-by-type-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expense-logs-page.component.html',
})
export class ExpenseLogsPageComponent {
  private api = inject(ApiService);
  private fb = inject(NonNullableFormBuilder);

  // catálogos
  expenseTypes = signal<TipoGasto[]>([]);
  funds = signal<FondoMonetario[]>([]);

  // estado
  saving = signal(false);
  lastOverdrafts = signal<GastoSaveResult['sobregiros']>([]);

  // fecha por defecto
  private today = new Date();
  private defaultDate = `${this.today.getFullYear()}-${String(this.today.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(this.today.getDate()).padStart(2, '0')}`;

  // form: un solo detalle (como pediste)
  form = this.fb.group({
    fecha: this.fb.control<string>(this.defaultDate, { validators: [Validators.required] }),
    fondoMonetarioId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
    tipoDocumento: this.fb.control<'Factura' | 'Comprobante' | 'Otro'>('Factura', {
      validators: [Validators.required],
    }),
    usuarioId: this.fb.control<number | null>(null),
    nombreComercio: this.fb.control<string>('', {
      validators: [Validators.required, Validators.minLength(2)],
    }),
    observaciones: this.fb.control<string | null>(null),

    // detalle único
    tipoGastoId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
    monto: this.fb.control<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01)],
    }),
  });

  constructor() {
    this.loadExpenseTypes();
    this.loadFunds();
  }

  // Helpers para tolerar ApiResponse<T> o T directo
  private pickArrayData<T>(res: ApiResponse<T[]> | T[]): T[] {
    return Array.isArray(res) ? res : res?.data ?? [];
  }
  private pickItemData<T>(res: ApiResponse<T> | T): T {
    return (res as any)?.data ?? (res as any);
  }

  // Cargar catálogos
  loadExpenseTypes() {
    console.log('[GASTO-QUICK] GET api/TipoGasto');
    this.api.get<ApiResponse<TipoGasto[]> | TipoGasto[]>('api/TipoGasto').subscribe({
      next: (res) => {
        const list = this.pickArrayData(res);
        this.expenseTypes.set(list);
        console.log('[GASTO-QUICK] tipos OK:', list);
      },
      error: (err) => {
        console.error('[GASTO-QUICK] tipos ERROR:', err);
        this.expenseTypes.set([]);
      },
    });
  }

  loadFunds() {
    console.log('[GASTO-QUICK] GET api/FondoMonetario');
    this.api.get<ApiResponse<FondoMonetario[]> | FondoMonetario[]>('api/FondoMonetario').subscribe({
      next: (res) => {
        const list = this.pickArrayData(res);
        this.funds.set(list);
        console.log('[GASTO-QUICK] fondos OK:', list);
        // seleccionar el primero si hay
        if (!this.form.value.fondoMonetarioId && list.length > 0) {
          this.form.patchValue({ fondoMonetarioId: list[0].id }, { emitEvent: false });
        }
      },
      error: (err) => {
        console.error('[GASTO-QUICK] fondos ERROR:', err);
        this.funds.set([]);
      },
    });
  }

  // Acciones
  resetForm() {
    this.form.reset({
      fecha: this.defaultDate,
      fondoMonetarioId: this.funds()?.[0]?.id ?? null,
      tipoDocumento: 'Factura',
      usuarioId: null,
      nombreComercio: '',
      observaciones: null,
      tipoGastoId: null,
      monto: null,
    });
    this.lastOverdrafts.set([]);
  }

  onSubmit() {
    console.log(
      '[GASTO-QUICK] submit -> valid?',
      this.form.valid,
      'value:',
      this.form.getRawValue()
    );
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    // construir payload EXACTO
    const payload: GastoCreateRequest = {
      fecha: raw.fecha!, // backend acepta "yyyy-MM-dd" o ISO. Si prefieres ISO: new Date(`${raw.fecha}T00:00:00`).toISOString()
      fondoMonetarioId: raw.fondoMonetarioId!,
      observaciones: raw.observaciones ?? null,
      nombreComercio: raw.nombreComercio!,
      tipoDocumento: raw.tipoDocumento!, // 'Factura' | 'Comprobante' | 'Otro'
      usuarioId: raw.usuarioId ?? null,
      detalles: [
        {
          tipoGastoId: raw.tipoGastoId!, // seleccionado del combo
          monto: Number(raw.monto!), // numérico
        },
      ],
    };

    console.log('[GASTO-QUICK] POST api/Gastos -> payload:', payload);
    this.saving.set(true);

    this.api.post<ApiResponse<GastoSaveResult> | GastoSaveResult>('api/Gastos', payload).subscribe({
      next: (res) => {
        const data = this.pickItemData(res) as GastoSaveResult;
        console.log('[GASTO-QUICK] OK:', data);
        this.lastOverdrafts.set(data?.sobregiros ?? []);
        alert(`Gasto #${data?.gastoEncabezadoId} guardado.`);
        // reset suave
        this.form.patchValue({
          nombreComercio: '',
          observaciones: null,
          monto: null,
          tipoGastoId: null,
        });
      },
      error: (err) => {
        console.error('[GASTO-QUICK] ERROR:', err);
        alert('Error guardando el gasto. Revisa consola.');
      },
      complete: () => this.saving.set(false),
    });
  }
}
