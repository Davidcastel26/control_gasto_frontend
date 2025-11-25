import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/menu/sidebar.component';

@Component({
  standalone: true,
  selector: 'app-main-layout',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {}
