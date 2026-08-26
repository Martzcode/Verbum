import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TitleBarComponent } from './titlebar';
import { TranslateService } from './services/translate.service';

@Component({
  imports: [RouterOutlet, TitleBarComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App implements OnInit {
  private translate = inject(TranslateService);

  async ngOnInit() {
    await this.translate.init();
  }
}
