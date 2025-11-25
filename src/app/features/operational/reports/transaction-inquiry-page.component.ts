import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/interfaces/api-response';

type MovimientoItemDto = {
  tipo: number; // 0=Gasto, 1=Deposito
  fecha: string;
  fondoMonetarioId: number;
  descripcion: string | null;
  montoTotal: number;
};

@Component({
  standalone: true,
  selector: 'app-transaction-inquiry-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-inquiry-page.component.html',
})
export class TransactionInquiryPageComponent {
  private api = inject(ApiService);
  private fb = inject(NonNullableFormBuilder);

  loading = signal(false);
  items = signal<MovimientoItemDto[]>([]);

  private today = new Date();
  private first = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
  private last = new Date(this.today.getFullYear(), this.today.getMonth() + 1, 0);

  form = this.fb.group({
    desde: this.fb.control<string>(this.toInputDate(this.first), { validators: [Validators.required] }),
    hasta: this.fb.control<string>(this.toInputDate(this.last), { validators: [Validators.required] }),
  });

  ngOnInit() { this.load(); }

  load() {
    if (this.form.invalid) return;
    this.loading.set(true);
    const { desde, hasta } = this.form.getRawValue();
    const params = {
      desde: new Date(desde!).toISOString(),
      hasta: new Date(hasta!).toISOString(),
    };
    this.api.get<ApiResponse<MovimientoItemDto[]>>('api/Reportes/movimientos', { params })
      .subscribe({
        next: res => this.items.set(res.data ?? []),
        error: () => this.items.set([]),
        complete: () => this.loading.set(false),
      });
  }

  private toInputDate(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
