import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

// Respuesta del endpoint /api/Reportes/movimientos (array plano)
type MovimientoItemDto = {
  tipo: number; // 0 = Gasto, 1 = Deposito
  fecha: string; // ISO o yyyy-MM-dd
  fondoMonetarioId: number;
  descripcion: string | null;
  montoTotal: number; // positivo siempre (gasto/deposito)
};

@Component({
  standalone: true,
  selector: 'app-transaction-inquiry-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-inquiry-page.component.html',
})
export class TransactionInquiryPageComponent {
  // DI
  private apiService = inject(ApiService);
  private formBuilder = inject(NonNullableFormBuilder);

  // Estado
  isLoading = signal(false);
  movementItems = signal<MovimientoItemDto[]>([]);
  loadErrorMessage = signal<string | null>(null);

  // Rango por defecto (mes actual)
  private today = new Date();
  private monthStart = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
  private monthEnd = new Date(this.today.getFullYear(), this.today.getMonth() + 1, 0);

  // Form
  filterForm = this.formBuilder.group({
    desde: this.formBuilder.control<string>(this.toInputDate(this.monthStart), {
      validators: [Validators.required],
    }),
    hasta: this.formBuilder.control<string>(this.toInputDate(this.monthEnd), {
      validators: [Validators.required],
    }),
  });

  // Totales (computeds)
  totalDeposits = computed(() =>
    this.movementItems()
      .filter((m) => m.tipo === 1)
      .reduce((acc, it) => acc + it.montoTotal, 0)
  );

  totalExpenses = computed(() =>
    this.movementItems()
      .filter((m) => m.tipo === 0)
      .reduce((acc, it) => acc + it.montoTotal, 0)
  );

  netBalance = computed(() => this.totalDeposits() - this.totalExpenses());

  ngOnInit() {
    this.load();
  }

  load(): void {
    if (this.filterForm.invalid) return;
    this.isLoading.set(true);
    this.loadErrorMessage.set(null);

    const { desde, hasta } = this.filterForm.getRawValue();

    // Enviamos ISO para evitar problemas de zona horaria; tu backend ya maneja rango inclusivo/exclusivo
    const queryParams = {
      desde: new Date(desde!).toISOString(),
      hasta: new Date(hasta!).toISOString(),
    };

    this.apiService
      .get<MovimientoItemDto[]>('api/Reportes/movimientos', { params: queryParams })
      .subscribe({
        next: (data) => {
          this.movementItems.set(Array.isArray(data) ? data : []);
        },
        error: (err) => {
          console.error('Error cargando movimientos:', err);
          this.movementItems.set([]);
          // Mensaje amigable
          this.loadErrorMessage.set(
            typeof err?.error === 'string'
              ? err.error
              : err?.error?.title || err?.message || 'No se pudo cargar la información.'
          );
        },
        complete: () => this.isLoading.set(false),
      });
  }

  // Helpers
  trackByMovement = (_: number, item: MovimientoItemDto) =>
    `${item.tipo}|${item.fecha}|${item.fondoMonetarioId}|${item.descripcion ?? ''}|${
      item.montoTotal
    }`;

  private toInputDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
