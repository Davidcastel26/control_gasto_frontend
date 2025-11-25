import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { FondoMonetario } from '../../../core/interfaces/models';

@Component({
  standalone: true,
  selector: 'app-monetary-fund-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './monetary-fund-page.component.html',
})
export class MonetaryFundPageComponent {
  private api = inject(ApiService);
  private fb = inject(NonNullableFormBuilder);

  items = signal<FondoMonetario[]>([]);
  loading = signal(false);
  saving = signal(false);
  isFormOpen = signal(false);
  editingId = signal<number | null>(null);

  form = this.fb.group({
    nombre: this.fb.control('', { validators: [Validators.required, Validators.minLength(2)] }),
    tipoFondo: this.fb.control<'CajaMenuda' | 'CuentaBancaria'>('CajaMenuda', { validators: [Validators.required] }),
    numeroCuenta: this.fb.control<string | null>(null),
    descripcion: this.fb.control<string | null>(null),
  });

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<FondoMonetario[]>('api/FondoMonetario').subscribe({
      next: res => this.items.set(res),
      error: () => { },
      complete: () => this.loading.set(false),
    });
  }

  startCreate() {
    this.isFormOpen.set(true);
    this.editingId.set(null);
    this.form.reset({ nombre: '', tipoFondo: 'CajaMenuda', numeroCuenta: null, descripcion: null });
  }

  edit(item: FondoMonetario) {
    this.isFormOpen.set(true);
    this.editingId.set(item.id);
    this.form.setValue({
      nombre: item.nombre,
      tipoFondo: item.tipoFondo as any,
      numeroCuenta: item.numeroCuenta ?? null,
      descripcion: item.descripcion ?? null,
    });
  }

  cancel() {
    this.isFormOpen.set(false);
    this.editingId.set(null);
    this.form.reset();
  }

  save() {
    if (this.form.invalid) return;
    const dto = this.form.getRawValue();
    this.saving.set(true);

    if (this.editingId() == null) {
      this.api.post<any>('api/FondoMonetario', dto).subscribe({
        next: res => { const created = res?.data ?? res; this.items.set([created, ...this.items()]); this.cancel(); },
        error: () => { },
        complete: () => this.saving.set(false),
      });
    } else {
      const id = this.editingId()!;
      this.api.put<void>(`api/FondoMonetario/${id}`, dto).subscribe({
        next: () => {
          this.items.set(this.items().map(x => x.id === id ? ({ ...x, ...dto } as any) : x));
          this.cancel();
        },
        error: () => { },
        complete: () => this.saving.set(false),
      });
    }
  }

  remove(item: FondoMonetario) {
    if (!confirm(`¿Eliminar "${item.nombre}"?`)) return;
    this.api.delete<void>(`api/FondoMonetario/${item.id}`).subscribe({
      next: () => this.items.set(this.items().filter(x => x.id !== item.id)),
    });
  }
}
