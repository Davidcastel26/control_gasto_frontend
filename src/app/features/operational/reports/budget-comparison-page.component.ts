import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/interfaces/api-response';

type ComparativoItemDto = {
  tipoGastoId: number;
  tipoGastoNombre: string;
  presupuestado: number;
  ejecutado: number;
};

@Component({
  standalone: true,
  selector: 'app-budget-comparison-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './budget-comparison-page.component.html',
})
export class BudgetComparisonPageComponent {
  private api = inject(ApiService);
  private fb = inject(NonNullableFormBuilder);

  loading = signal(false);
  items = signal<ComparativoItemDto[]>([]);

  private today = new Date();
  private firstOfMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
  private lastOfMonth = new Date(this.today.getFullYear(), this.today.getMonth() + 1, 0);

  form = this.fb.group({
    desde: this.fb.control<string>(this.toInputDate(this.firstOfMonth), { validators: [Validators.required] }),
    hasta: this.fb.control<string>(this.toInputDate(this.lastOfMonth), { validators: [Validators.required] }),
    usuarioId: this.fb.control<number | null>(null),
  });

  ngOnInit() {
    this.load();
  }

  load() {
    if (this.form.invalid) return;
    this.loading.set(true);

    const { desde, hasta, usuarioId } = this.form.getRawValue();
    const params: any = {
      desde: new Date(desde!).toISOString(),
      hasta: new Date(hasta!).toISOString(),
    };
    if (usuarioId != null) params.usuarioId = String(usuarioId);

    this.api.get<ApiResponse<ComparativoItemDto[]>>('api/Reportes/comparativo', { params })
      .subscribe({
        next: (res) => this.items.set(res.data ?? []),
        error: () => this.items.set([]),
        complete: () => this.loading.set(false),
      });
  }

  private toInputDate(d: Date): string {
    // yyyy-MM-dd para <input type="date">
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
