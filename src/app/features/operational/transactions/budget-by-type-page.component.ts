import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/interfaces/api-response';

// Ajusta si ya tienes estas interfaces en tu proyecto
type TipoGasto = { id: number; nombre: string; codigo: string; descripcion?: string | null };
type PresupuestoDto = {
  id: number;
  anio: number;
  mes: number;
  tipoGastoId: number;
  montoPresupuestado: number;
  usuarioId: number | null;
};

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

  // Catálogos y lista
  expenseTypes = signal<TipoGasto[]>([]);
  budgets = signal<PresupuestoDto[]>([]);

  // Estado UI
  isLoadingExpenseTypes = signal(false);
  isLoadingBudgets = signal(false);
  isSavingBudget = signal(false);
  saveError = signal<string | null>(null);

  // Form
  private today = new Date();
  form = this.fb.group({
    anio: this.fb.control<number>(this.today.getFullYear(), { validators: [Validators.required] }),
    mes: this.fb.control<number>(this.today.getMonth() + 1, {
      validators: [Validators.required, Validators.min(1), Validators.max(12)],
    }),
    tipoGastoId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
    usuarioId: this.fb.control<number | null>(null), // opcional
    montoPresupuestado: this.fb.control<number>(0, {
      validators: [Validators.required, Validators.min(0)],
    }),
  });

  // Helper para mostrar el nombre del TipoGasto
  expenseTypeName = computed(() => {
    const map = new Map(this.expenseTypes().map((t) => [t.id, t.nombre]));
    return (id: number) => map.get(id) ?? `Tipo ${id}`;
  });

  ngOnInit() {
    this.loadExpenseTypes();
    this.loadBudgets();
  }

  // --- Carga de tipos de gasto (GET api/TipoGasto) ---
  loadExpenseTypes() {
    this.isLoadingExpenseTypes.set(true);
    this.api.get<any>('api/TipoGasto').subscribe({
      next: (res) => {
        // Puede venir envuelto (ApiResponse) o plano
        const list: TipoGasto[] = Array.isArray(res) ? res : res?.data ?? [];
        this.expenseTypes.set(list);
      },
      error: (err) => {
        console.error('Error cargando tipos de gasto:', err);
        this.expenseTypes.set([]);
      },
      complete: () => this.isLoadingExpenseTypes.set(false),
    });
  }

  // --- Carga de presupuestos (GET api/Presupuesto) ---
  loadBudgets() {
    const { anio, mes, usuarioId } = this.form.getRawValue();
    this.isLoadingBudgets.set(true);

    // ⚠️ usar bracket-notation para evitar TS4111
    const params: Record<string, any> = { anio, mes };
    if (usuarioId !== null && usuarioId !== undefined && `${usuarioId}`.trim() !== '') {
      params['usuarioId'] = usuarioId;
    }

    this.api.get<ApiResponse<PresupuestoDto[]>>('api/Presupuesto', { params }).subscribe({
      next: (res) => {
        const items = (res as any)?.data ?? (Array.isArray(res) ? res : []);
        this.budgets.set(items);
      },
      error: (err) => {
        console.error('Error cargando presupuestos:', err);
        this.budgets.set([]);
      },
      complete: () => this.isLoadingBudgets.set(false),
    });
  }

  // --- Guardar (POST api/Presupuesto/upsert) ---
  save() {
    this.saveError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      console.warn('Formulario inválido:', this.form.value);
      return;
    }

    const raw = this.form.getRawValue();
    const payload: UpsertDto = {
      anio: raw.anio!,
      mes: raw.mes!,
      tipoGastoId: raw.tipoGastoId!,
      montoPresupuestado: raw.montoPresupuestado!,
      usuarioId: raw.usuarioId ?? null,
    };

    this.isSavingBudget.set(true);

    this.api.post<ApiResponse<PresupuestoDto>>('api/Presupuesto/upsert', payload).subscribe({
      next: (res) => {
        const saved: PresupuestoDto | undefined = (res as any)?.data ?? res;
        if (!saved) {
          // Si el backend devolviera sólo el Id, recarga.
          this.loadBudgets();
          return;
        }

        // Upsert optimista en la tabla
        const current = this.budgets();
        const idx = current.findIndex((b) => b.id === saved.id);
        if (idx >= 0) {
          const copy = [...current];
          copy[idx] = saved;
          this.budgets.set(copy);
        } else {
          this.budgets.set([saved, ...current]);
        }
      },
      error: (err) => {
        console.error('Error guardando presupuesto:', err);
        this.saveError.set(
          typeof err?.error === 'string'
            ? err.error
            : err?.error?.title || err?.message || 'No se pudo guardar el presupuesto.'
        );
      },
      complete: () => this.isSavingBudget.set(false),
    });
  }

  // Cuando cambie año/mes/usuario => recargar lista
  onFiltersChange() {
    if (this.form.controls.anio.invalid || this.form.controls.mes.invalid) return;
    this.loadBudgets();
  }

  // Binders de estado para el template (nombres más autoexplicativos)
  loadingList = this.isLoadingBudgets;
  saving = this.isSavingBudget;
}
