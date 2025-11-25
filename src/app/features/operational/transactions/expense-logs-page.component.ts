import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators, FormArray } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/interfaces/api-response';

type TipoGasto = { id: number; codigo: string; nombre: string; descripcion?: string | null };
type FondoMonetario = { id: number; nombre: string; tipoFondo: string; numeroCuenta?: string | null; descripcion?: string | null };

type GastoDetalleCreateDto = { tipoGastoId: number; monto: number };
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

@Component({
  standalone: true,
  selector: 'app-expense-logs-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expense-logs-page.component.html'
})
export class ExpenseLogsPageComponent {
  private api = inject(ApiService);
  private fb = inject(NonNullableFormBuilder);

  tipos = signal<TipoGasto[]>([]);
  fondos = signal<FondoMonetario[]>([]);
  saving = signal(false);
  total = signal(0);
  lastOverdrafts = signal<GastoSaveResult['sobregiros']>([]);

  private today = new Date();

  form = this.fb.group({
    fecha: this.fb.control<string>(this.toInputDate(this.today), { validators: [Validators.required] }),
    fondoMonetarioId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
    observaciones: this.fb.control<string>(''),
    nombreComercio: this.fb.control<string>('', { validators: [Validators.required, Validators.minLength(2)] }),
    tipoDocumento: this.fb.control<'Factura' | 'Comprobante' | 'Otro'>('Factura', { validators: [Validators.required] }),
    usuarioId: this.fb.control<number | null>(null),
    detalles: this.fb.array(this.createDetailArray(1), { validators: [Validators.required] })
  });

  get detalles() { return this.form.controls.detalles as FormArray; }

  ngOnInit() {
    this.loadCombos();
    this.recalcTotal();
  }

  private loadCombos() {
    this.api.get<ApiResponse<TipoGasto[]>>('api/TipoGasto')
      .subscribe({ next: r => this.tipos.set(r.data ?? []) });

    this.api.get<ApiResponse<FondoMonetario[]>>('api/FondoMonetario')
      .subscribe({ next: r => this.fondos.set(r.data ?? []) });
  }

  addDetail() {
    this.detalles.push(this.createDetailGroup());
    this.recalcTotal();
  }
  removeDetail(i: number) {
    this.detalles.removeAt(i);
    this.recalcTotal();
  }

  private recalcTotal() {
    const compute = () =>
      this.detalles.controls
        .map(g => Number(g.get('monto')?.value || 0))
        .reduce((a, b) => a + b, 0);
    // pequeña desincronización para esperar cambios del form
    queueMicrotask(() => this.total.set(compute()));
  }

  save() {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const payload = {
      fecha: new Date(v.fecha!).toISOString(),
      fondoMonetarioId: v.fondoMonetarioId!,
      observaciones: v.observaciones || null,
      nombreComercio: v.nombreComercio!,
      tipoDocumento: v.tipoDocumento!,  // "Factura" | "Comprobante" | "Otro"
      usuarioId: v.usuarioId,
      detalles: (v.detalles as any[]).map(d => ({ tipoGastoId: Number(d.tipoGastoId), monto: Number(d.monto) })) as GastoDetalleCreateDto[]
    };

    this.saving.set(true);
    this.api.post<ApiResponse<GastoSaveResult>>('api/Gastos', payload)
      .subscribe({
        next: res => {
          const data = res.data!;
          this.lastOverdrafts.set(data.sobregiros ?? []);
          // Reset al formulario, dejando una fila
          this.form.reset({
            fecha: this.toInputDate(this.today),
            fondoMonetarioId: null,
            observaciones: '',
            nombreComercio: '',
            tipoDocumento: 'Factura',
            usuarioId: null
          });
          this.form.setControl('detalles', this.fb.array(this.createDetailArray(1)));
          this.recalcTotal();
          // TODO: toast/alert OK
        },
        error: _ => {
          // TODO: notificar error
        },
        complete: () => this.saving.set(false)
      });
  }

  private createDetailArray(n: number) {
    return Array.from({ length: n }, () => this.createDetailGroup());
  }
  private createDetailGroup() {
    return this.fb.group({
      tipoGastoId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      monto: this.fb.control<number | null>(0, { validators: [Validators.required, Validators.min(0.01)] })
    });
  }

  private toInputDate(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
