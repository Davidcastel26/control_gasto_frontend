import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

// --- Tipos locales (puedes moverlos a core/interfaces/models si prefieres) ---
type TipoFondoString = 'CajaMenuda' | 'CuentaBancaria';

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface FondoMonetarioReadDto {
  id: number;
  nombre: string;
  tipoFondo: TipoFondoString; // <- viene como string en GET
  numeroCuenta?: string | null;
  descripcion?: string | null;
}

interface FondoMonetarioWriteDto {
  nombre: string;
  tipoFondo: number; // <- se envía como número en POST/PUT (0 o 1)
  numeroCuenta?: string | null;
  descripcion?: string | null;
}

// Helpers de mapeo enum
const tipoFondoOptions = [
  { value: 0, label: 'Caja Menuda' },
  { value: 1, label: 'Cuenta Bancaria' },
] as const;

function tipoFondoStringToNumber(value: TipoFondoString): number {
  return value === 'CuentaBancaria' ? 1 : 0;
}

@Component({
  standalone: true,
  selector: 'app-monetary-fund-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './monetary-fund-page.component.html',
})
export class MonetaryFundPageComponent {
  // ---- Inyección de dependencias
  private apiService = inject(ApiService);
  private formBuilder = inject(NonNullableFormBuilder);

  // ---- Estado reactivo
  monetaryFunds = signal<FondoMonetarioReadDto[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  isFormOpen = signal(false);
  editingFundId = signal<number | null>(null);

  readonly tipoFondoOptions = tipoFondoOptions;

  // ---- Formulario
  fundForm = this.formBuilder.group({
    nombre: this.formBuilder.control<string>('', {
      validators: [Validators.required, Validators.minLength(2)],
    }),
    tipoFondo: this.formBuilder.control<number>(0, { validators: [Validators.required] }), // 0/1
    numeroCuenta: this.formBuilder.control<string | null>(null),
    descripcion: this.formBuilder.control<string | null>(null),
  });

  constructor() {
    this.loadMonetaryFunds();
  }

  // ---- Cargar datos
  loadMonetaryFunds(): void {
    this.isLoading.set(true);
    this.apiService.get<ApiResponse<FondoMonetarioReadDto[]>>('api/FondoMonetario').subscribe({
      next: (response) => this.monetaryFunds.set(response.data),
      error: () => {
        // TODO: Notificar error
      },
      complete: () => this.isLoading.set(false),
    });
  }

  // ---- Acciones UI
  openCreateForm(): void {
    this.isFormOpen.set(true);
    this.editingFundId.set(null);
    this.fundForm.reset({
      nombre: '',
      tipoFondo: 0, // CajaMenuda
      numeroCuenta: null,
      descripcion: null,
    });
  }

  openEditForm(fund: FondoMonetarioReadDto): void {
    this.isFormOpen.set(true);
    this.editingFundId.set(fund.id);
    this.fundForm.setValue({
      nombre: fund.nombre,
      tipoFondo: tipoFondoStringToNumber(fund.tipoFondo), // map string -> number
      numeroCuenta: fund.numeroCuenta ?? null,
      descripcion: fund.descripcion ?? null,
    });
  }

  cancelForm(): void {
    this.isFormOpen.set(false);
    this.editingFundId.set(null);
    this.fundForm.reset();
  }

  // ---- Guardar (create/update)
  submitForm(): void {
    if (this.fundForm.invalid) return;

    const dto: FondoMonetarioWriteDto = this.fundForm.getRawValue();
    this.isSaving.set(true);

    // CREATE
    if (this.editingFundId() == null) {
      this.apiService
        .post<ApiResponse<FondoMonetarioReadDto>>('api/FondoMonetario', dto)
        .subscribe({
          next: (response) => {
            // agregar arriba y cerrar
            this.monetaryFunds.set([response.data, ...this.monetaryFunds()]);
            this.cancelForm();
          },
          error: (httpError) => {
            console.error('Error al crear el fondo:', httpError);
          },
          complete: () => this.isSaving.set(false),
        });
      return;
    }

    // UPDATE
    const id = this.editingFundId()!;
    this.apiService
      .put<ApiResponse<FondoMonetarioReadDto>>(`api/FondoMonetario/${id}`, dto)
      .subscribe({
        next: (response) => {
          const updated = response.data;
          this.monetaryFunds.set(this.monetaryFunds().map((f) => (f.id === id ? updated : f)));
          this.cancelForm();
        },
        error: (httpError) => {
          console.error('Error al editar el fondo:', httpError);
        },
        complete: () => this.isSaving.set(false),
      });
  }

  deleteFund(fund: FondoMonetarioReadDto): void {
    if (!confirm(`¿Eliminar "${fund.nombre}"?`)) return;

    this.apiService.delete<ApiResponse<string>>(`api/FondoMonetario/${fund.id}`).subscribe({
      next: () => {
        this.monetaryFunds.set(this.monetaryFunds().filter((x) => x.id !== fund.id));
      },
      error: (httpError) => {
        console.error('Error al eliminar el fondo:', httpError);
      },
    });
  }

  trackById = (_: number, item: FondoMonetarioReadDto) => item.id;
}
