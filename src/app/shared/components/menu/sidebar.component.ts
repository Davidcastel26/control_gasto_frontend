import { Component, computed, signal } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

interface NavSection {
  id: string;
  label: string;
  icon: string;
  items: NavItem[];
}

@Component({
  standalone: true,
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule, NgClass],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private readonly _sections = signal<NavSection[]>([
    {
      id: 'maintenance',
      label: 'Mantenimientos',
      icon: 'build',
      items: [
        {
          label: 'Tipos de Gasto',
          path: '/maintenance/expense-types',
          icon: 'category',
        },
        {
          label: 'Fondo Monetario',
          path: '/maintenance/monetary-fund',
          icon: 'account_balance_wallet',
        },
      ],
    },
    {
      id: 'transactions',
      label: 'Movimientos',
      icon: 'sync_alt',
      items: [
        {
          label: 'Presupuesto por tipo de gasto',
          path: '/transactions/budget-by-type',
          icon: 'payments',
        },
        {
          label: 'Registros de gastos',
          path: '/transactions/expense-logs',
          icon: 'receipt_long',
        },
        {
          label: 'Depósitos',
          path: '/transactions/deposits',
          icon: 'savings',
        },
      ],
    },
    {
      id: 'reports',
      label: 'Consultas y Reportes',
      icon: 'query_stats',
      items: [
        {
          label: 'Transaction Inquiry',
          path: '/reports/transaction-inquiry',
          icon: 'travel_explore',
        },
        {
          label: 'Comparative Budget vs Execution',
          path: '/reports/budget-comparison',
          icon: 'monitoring',
        },
      ],
    },
  ]);

  // Varias secciones abiertas a la vez
  readonly openSections = signal<Record<string, boolean>>({
    maintenance: true,
    transactions: true,
    reports: false,
  });

  readonly sections = computed(() => this._sections());

  readonly year = computed(() => new Date().getFullYear());

  toggleSection(sectionId: string): void {
    this.openSections.update((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  }

  isSectionOpen(sectionId: string): boolean {
    return !!this.openSections()[sectionId];
  }
}
