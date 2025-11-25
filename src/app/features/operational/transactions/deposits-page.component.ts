import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/interfaces/api-response';

export interface MonetaryFund {
  id: number;
  nombre: string;
  tipoFondo: 'CajaMenuda' | 'CuentaBancaria';
  numeroCuenta?: string | null;
  descripcion?: string | null;
}

export interface DepositDto {
  id: number;
  fecha: string;
  fondoMonetarioId: number;
  monto: number;
}

type CreateDepositDto = {
  fecha: string;
  fondoMonetarioId: number;
  monto: number;
};

@Component({
  standalone: true,
  selector: 'app-deposits-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './deposits-page.component.html',
})
export class DepositsPageComponent {
  private api = inject(ApiService);
  private fb = inject(NonNullableFormBuilder);

  funds = signal<MonetaryFund[]>([]);
  loadingFunds = signal(false);
  saving = signal(false);
  lastSaved = signal<DepositDto | null>(null);
  private today = new Date();
  form = this.fb.group({
    fecha: this.fb.control<string>(this.today.toISOString().slice(0, 10), { validators: [Validators.required] }),
    fondoMonetarioId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
    monto: this.fb.control<number>(0, { validators: [Validators.required, Validators.min(0.01)] }),
  });

  constructor() {
    this.loadFunds();
  }

  loadFunds() {
    this.loadingFunds.set(true);
    this.api
      .get<ApiResponse<MonetaryFund[]>>('api/FondoMonetario')
      .subscribe({
        next: (res) => this.funds.set(res.data ?? []),
        error: () => { /* TODO: notificar */ },
        complete: () => this.loadingFunds.set(false),
      });
  }

  save() {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload: CreateDepositDto = {
      fecha: raw.fecha!,
      fondoMonetarioId: raw.fondoMonetarioId!,
      monto: raw.monto!,
    };

    this.saving.set(true);

    this.api
      .post<ApiResponse<DepositDto>>('api/Depositos', payload)
      .subscribe({
        next: (res) => {
          this.lastSaved.set(res.data ?? null);

          this.form.patchValue({ monto: 0 });
        },
        error: () => { /* TODO: notificar */ },
        complete: () => this.saving.set(false),
      });
  }
}
