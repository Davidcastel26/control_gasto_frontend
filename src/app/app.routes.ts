import { Routes } from '@angular/router';

import { MainLayoutComponent } from './core/components/main-layout/main-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard';
import { ApplicationConfigComponent } from './features/application-config/application-config';

import { ExpenseTypesPageComponent } from './features/operational/maintenance/expense-types-page.component';
import { MonetaryFundPageComponent } from './features/operational/maintenance/monetary-fund-page.component';

import { BudgetByTypePageComponent } from './features/operational/transactions/budget-by-type-page.component';
import { ExpenseLogsPageComponent } from './features/operational/transactions/expense-logs-page.component';
import { DepositsPageComponent } from './features/operational/transactions/deposits-page.component';

import { TransactionInquiryPageComponent } from './features/operational/reports/transaction-inquiry-page.component';
import { BudgetComparisonPageComponent } from './features/operational/reports/budget-comparison-page.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'application-config',
        component: ApplicationConfigComponent,
      },

      // Mantenimientos
      {
        path: 'maintenance/expense-types',
        component: ExpenseTypesPageComponent,
      },
      {
        path: 'maintenance/monetary-fund',
        component: MonetaryFundPageComponent,
      },

      // Movimientos
      {
        path: 'transactions/budget-by-type',
        component: BudgetByTypePageComponent,
      },
      {
        path: 'transactions/expense-logs',
        component: ExpenseLogsPageComponent,
      },
      {
        path: 'transactions/deposits',
        component: DepositsPageComponent,
      },

      // Consultas y Reportes
      {
        path: 'reports/transaction-inquiry',
        component: TransactionInquiryPageComponent,
      },
      {
        path: 'reports/budget-comparison',
        component: BudgetComparisonPageComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
