import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, OverlayModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'frontend';
}
