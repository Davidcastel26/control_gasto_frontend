import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/interfaces/api-response';
import { PresupuestoDto, TipoGasto } from '../../../core/interfaces/models';

type UpsertDto = {
  anio: number;
  mes: number;
  tipoGastoId: number;
  montoPresupuestado: number;
  usuarioId: number | null;
};

@Component({
  standalone: true,
  selector: 'app-budget-by-type-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './budget-by-type-page.component.html',
})
export class BudgetByTypePageComponent {
  private api = inject(ApiService);
  private fb = inject(NonNullableFormBuilder);


  expenseTypes = signal<TipoGasto[]>([]);
  budgets = signal<PresupuestoDto[]>([]);


  loadingTypes = signal(false);
  loadingList = signal(false);
  saving = signal(false);


  private now = new Date();
  form = this.fb.group({
    anio: this.fb.control<number>(this.now.getFullYear(), { validators: [Validators.required] }),
    mes: this.fb.control<number>(this.now.getMonth() + 1, {
      validators: [Validators.required, Validators.min(1), Validators.max(12)],
    }),
    tipoGastoId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
    usuarioId: this.fb.control<number | null>(null), // opcional
    montoPresupuestado: this.fb.control<number>(0, {
      validators: [Validators.required, Validators.min(0)],
    }),
  });

  expenseTypeName = computed(() => {
    const map = new Map(this.expenseTypes().map(t => [t.id, t.nombre]));
    return (id: number) => map.get(id) ?? `Tipo ${id}`;
  });

  constructor() {
    this.loadExpenseTypes();
    this.loadBudgets();
  }

  loadExpenseTypes() {
    this.loadingTypes.set(true);
    this.api.get<TipoGasto[]>('api/TipoGasto').subscribe({
      next: (list) => this.expenseTypes.set(list),
      error: () => { /* TODO: notificar */ },
      complete: () => this.loadingTypes.set(false),
    });
  }

  loadBudgets() {
    const { anio, mes, usuarioId } = this.form.getRawValue();
    this.loadingList.set(true);

    const params: any = { anio, mes };
    if (usuarioId !== null && usuarioId !== undefined && `${usuarioId}`.trim() !== '') {
      params.usuarioId = usuarioId;
    }

    this.api.get<ApiResponse<PresupuestoDto[]>>('api/Presupuesto', { params }).subscribe({
      next: (res) => this.budgets.set(res.data ?? []),
      error: () => { /* TODO: notificar */ },
      complete: () => this.loadingList.set(false),
    });
  }

  save() {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload: UpsertDto = {
      anio: raw.anio!,
      mes: raw.mes!,
      tipoGastoId: raw.tipoGastoId!,
      montoPresupuestado: raw.montoPresupuestado!,
      usuarioId: raw.usuarioId ?? null,
    };

    this.saving.set(true);

    this.api
      .post<ApiResponse<PresupuestoDto>>('api/Presupuesto/upsert', payload)
      .subscribe({
        next: (res) => {
          const saved = res.data;
          if (!saved) return this.loadBudgets();

          const current = this.budgets();
          const idx = current.findIndex(b => b.id === saved.id);
          if (idx >= 0) {
            const copy = [...current];
            copy[idx] = saved;
            this.budgets.set(copy);
          } else {
            this.budgets.set([saved, ...current]);
          }
        },
        error: () => { /* TODO: notificar */ },
        complete: () => this.saving.set(false),
      });
  }

  onFiltersChange() {
    this.loadBudgets();
  }
}
