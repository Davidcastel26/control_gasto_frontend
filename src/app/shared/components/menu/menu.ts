import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-menu',
  imports: [],
  template: `<p>menu works!</p>`,
  styleUrl: './menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Menu { }
