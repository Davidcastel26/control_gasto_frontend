import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  template: `
    <section class="space-y-2">
      <h2 class="text-xl font-semibold">Resumen general</h2>
      <p class="text-sm text-slate-400">
        Work in progress. Aquí verás un resumen de tus finanzas personales.
      </p>
    </section>
  `,
})
export class DashboardComponent {}
