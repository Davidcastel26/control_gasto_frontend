// src/app/features/operational/reports/budget-comparison-page.component.ts
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ChartData, ChartOptions } from 'chart.js';
// 👇 standalone directive
import { BaseChartDirective } from 'ng2-charts';

import { ApiService } from '../../../core/services/api.service';

type ComparativoItemDto = {
  tipoGastoId: number;
  tipoGastoNombre: string;
  presupuestado: number;
  ejecutado: number;
};

// Para arreglar TS4111 y tener autocompletado
type ReportQuery = { desde: string; hasta: string; usuarioId?: string };

@Component({
  standalone: true,
  selector: 'app-budget-comparison-page',
  imports: [CommonModule, ReactiveFormsModule, BaseChartDirective],
  templateUrl: './budget-comparison-page.component.html',
})
export class BudgetComparisonPageComponent {
  private apiService = inject(ApiService);
  private formBuilder = inject(NonNullableFormBuilder);

  isLoading = signal(false);
  loadErrorMessage = signal<string | null>(null);
  comparisonItems = signal<ComparativoItemDto[]>([]);

  private today = new Date();
  private firstOfMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
  private lastOfMonth = new Date(this.today.getFullYear(), this.today.getMonth() + 1, 0);

  filterForm = this.formBuilder.group({
    desde: this.formBuilder.control<string>(this.toInputDate(this.firstOfMonth), {
      validators: [Validators.required],
    }),
    hasta: this.formBuilder.control<string>(this.toInputDate(this.lastOfMonth), {
      validators: [Validators.required],
    }),
    usuarioId: this.formBuilder.control<number | null>(null),
  });

  // Totales
  totalBudgeted = computed(() => this.comparisonItems().reduce((a, b) => a + b.presupuestado, 0));
  totalExecuted = computed(() => this.comparisonItems().reduce((a, b) => a + b.ejecutado, 0));
  totalDelta = computed(() => this.totalBudgeted() - this.totalExecuted());

  // Data para el chart
  chartLabels = computed(() => this.comparisonItems().map((x) => x.tipoGastoNombre));
  budgetSeries = computed(() => this.comparisonItems().map((x) => x.presupuestado));
  executionSeries = computed(() => this.comparisonItems().map((x) => x.ejecutado));

  barChartData = computed<ChartData<'bar'>>(() => ({
    labels: this.chartLabels(),
    datasets: [
      {
        label: 'Presupuestado',
        data: this.budgetSeries(),
        backgroundColor: 'rgba(2, 132, 199, 0.7)', // sky-600
        borderColor: 'rgba(2, 132, 199, 1)',
        borderWidth: 1,
      },
      {
        label: 'Ejecutado',
        data: this.executionSeries(),
        backgroundColor: 'rgba(16, 185, 129, 0.7)', // emerald-500
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
    ],
  }));

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: '#cbd5e1' },
        grid: { color: 'rgba(148,163,184,0.15)' },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#cbd5e1',
          callback(value) {
            return Number(value).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          },
        },
        grid: { color: 'rgba(148,163,184,0.1)' },
      },
    },
    plugins: {
      legend: {
        labels: { color: '#e2e8f0' },
      },
      tooltip: {
        callbacks: {
          label(ctx) {
            const v = ctx.parsed.y ?? 0;
            return `${ctx.dataset.label}: ${v.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
          },
        },
      },
    },
  };

  ngOnInit() {
    this.load();
  }

  load(): void {
    if (this.filterForm.invalid) return;
    this.isLoading.set(true);
    this.loadErrorMessage.set(null);

    const { desde, hasta, usuarioId } = this.filterForm.getRawValue();

    const params: ReportQuery = {
      desde: new Date(desde!).toISOString(),
      hasta: new Date(hasta!).toISOString(),
    };
    if (usuarioId !== null && usuarioId !== undefined && !Number.isNaN(usuarioId)) {
      params.usuarioId = String(usuarioId); // ✔️ sin TS4111
    }

    // ⚠️ Este endpoint devuelve array plano, NO ApiResponse<...>
    this.apiService.get<ComparativoItemDto[]>('api/Reportes/comparativo', { params }).subscribe({
      next: (data) => this.comparisonItems.set(Array.isArray(data) ? data : []),
      error: (err) => {
        console.error('Error cargando comparativo:', err);
        this.comparisonItems.set([]);
        this.loadErrorMessage.set(
          typeof err?.error === 'string'
            ? err.error
            : err?.error?.title || err?.message || 'No se pudo cargar la información.'
        );
      },
      complete: () => this.isLoading.set(false),
    });
  }

  private toInputDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
