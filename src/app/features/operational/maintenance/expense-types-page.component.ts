import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { TipoGasto } from '../../../core/interfaces/models';

@Component({
  standalone: true,
  selector: 'app-expense-types-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expense-types-page.component.html',
})
export class ExpenseTypesPageComponent {
  private api = inject(ApiService);
  private fb = inject(NonNullableFormBuilder);

  items = signal<TipoGasto[]>([]);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  isFormOpen = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingId = signal<number | null>(null);

  form = this.fb.group({
    nombre: this.fb.control<string>('', { validators: [Validators.required, Validators.minLength(2)] }),
    descripcion: this.fb.control<string | null>(null),
  });

  currentEditing = computed(() =>
    this.items().find(x => x.id === this.editingId()!) ?? null
  );

  constructor() {
    this.load();
    effect(() => {
      const it = this.currentEditing();
      if (this.isEditing() && it) {
        this.form.patchValue({ nombre: it.nombre, descripcion: it.descripcion ?? null }, { emitEvent: false });
      }
    });
  }

  load() {
    this.loading.set(true);
    // 👇 IMPORTANTE: tu ApiService devuelve una función -> hay que invocarla con ()
    // Y el backend devuelve array plano, no { status, message, data }.
    this.api.get<TipoGasto[]>('api/TipoGasto').subscribe({
      next: res => this.items.set(res),
      error: () => { /* TODO: noti */ },
      complete: () => this.loading.set(false),
    });
  }

  startCreate() {
    this.isFormOpen.set(true);
    this.isEditing.set(false);
    this.editingId.set(null);
    this.form.reset({ nombre: '', descripcion: null });
  }

  startEdit(item: TipoGasto) {
    this.isFormOpen.set(true);
    this.isEditing.set(true);
    this.editingId.set(item.id);
    this.form.setValue({ nombre: item.nombre, descripcion: item.descripcion ?? null });
  }

  cancelForm() {
    this.isFormOpen.set(false);
    this.isEditing.set(false);
    this.editingId.set(null);
    this.form.reset();
  }

  save() {
    if (this.form.invalid) return;
    const dto = this.form.getRawValue();
    this.saving.set(true);

    if (!this.isEditing()) {
      // POST devuelve el objeto creado (o ApiResponse). Manejamos ambos.
      this.api.post<any>('api/TipoGasto', dto).subscribe({
        next: (res) => {
          const created: TipoGasto = res?.data ?? res;
          this.items.set([created, ...this.items()]);
          this.cancelForm();
        },
        error: () => { /* TODO: noti */ },
        complete: () => this.saving.set(false),
      });
    } else {
      const id = this.editingId()!;
      this.api.put<void>(`api/TipoGasto/${id}`, dto).subscribe({
        next: () => {
          const updated = this.items().map(it => it.id === id ? ({ ...it, ...dto } as TipoGasto) : it);
          this.items.set(updated);
          this.cancelForm();
        },
        error: () => { /* TODO: noti */ },
        complete: () => this.saving.set(false),
      });
    }
  }

  remove(item: TipoGasto) {
    if (!confirm(`¿Eliminar "${item.nombre}"?`)) return;
    this.api.delete<void>(`api/TipoGasto/${item.id}`).subscribe({
      next: () => this.items.set(this.items().filter(x => x.id !== item.id)),
      error: () => { /* TODO: noti */ },
    });
  }
}
