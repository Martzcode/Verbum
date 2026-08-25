import { Component, Input, Output, EventEmitter, HostListener, signal, ViewChild, ElementRef, inject } from '@angular/core';
import { TranslateService } from '../services/translate.service';
import { TranslatePipe } from '../pipes/translate.pipe';

interface MenuItem {
  labelKey?: string;
  label?: string;
  shortcut?: string;
  action?: () => void;
  disabled?: boolean;
  divider?: boolean;
}

@Component({
  selector: 'app-menu-button',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="menu-container" #container>
      <button
        class="menu-button"
        type="button"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-haspopup]="true"
        (click)="toggle($event)"
        (keydown)="onKeyDown($event)">
        {{ labelKey ? (labelKey | t) : label }}
      </button>

      @if (isOpen()) {
        <div class="menu-dropdown" role="menu">
          @for (item of items; track $index) {
            @if (item.divider) {
              <div class="menu-divider" role="separator"></div>
            } @else {
              <button
                class="menu-item"
                role="menuitem"
                [disabled]="item.disabled"
                (click)="execute(item)"
                (keydown)="onItemKeyDown($event, item)">
                <span>{{ item.labelKey ? (item.labelKey | t) : item.label }}</span>
                @if (item.shortcut) {
                  <kbd>{{ item.shortcut }}</kbd>
                }
              </button>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .menu-container {
      position: relative;
      display: inline-block;
    }

    .menu-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      min-width: 180px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      padding: 4px 0;
      z-index: 1000;
      animation: fadeIn 0.1s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 12px;
      font-size: 12px;
      color: var(--text-primary);
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.1s ease;
    }

    .menu-item:hover:not(:disabled) {
      background: var(--bg-hover);
    }

    .menu-item:disabled {
      color: var(--text-muted);
      cursor: not-allowed;
    }

    .menu-item:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: -2px;
    }

    .menu-item kbd {
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', monospace;
      font-size: 10px;
      padding: 2px 6px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-light);
      border-radius: 3px;
      color: var(--text-muted);
      margin-left: auto;
    }

    .menu-divider {
      height: 1px;
      background: var(--border-light);
      margin: 4px 8px;
    }
  `]
})
export class MenuButtonComponent {
  @Input({ required: true }) labelKey?: string;
  @Input() label?: string;
  @Input({ required: true }) items!: MenuItem[];
  @Output() actionTriggered = new EventEmitter<string>();

  @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>;

  isOpen = signal(false);
  focusedIndex = signal(-1);

  private translate = inject(TranslateService);

  toggle(event: MouseEvent) {
    event.stopPropagation();
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.focusedIndex.set(-1);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.isOpen() && this.containerRef?.nativeElement &&
        !this.containerRef.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.isOpen.set(false);
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.isOpen.set(true);
      this.focusedIndex.set(event.key === 'ArrowDown' ? 0 : this.getLastValidIndex());
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.isOpen.set(true);
    }
  }

  onItemKeyDown(event: KeyboardEvent, item: MenuItem) {
    const index = this.items.indexOf(item);
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex.set(this.getNextValidIndex(index));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex.set(this.getPrevValidIndex(index));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!item.disabled) this.execute(item);
        break;
      case 'Escape':
        this.isOpen.set(false);
        break;
    }
  }

  execute(item: MenuItem) {
    if (item.disabled || !item.action) return;
    item.action();
    this.actionTriggered.emit(item.labelKey || item.label || '');
    this.isOpen.set(false);
  }

  private getNextValidIndex(current: number): number {
    for (let i = current + 1; i < this.items.length; i++) {
      if (!this.items[i].divider && !this.items[i].disabled) return i;
    }
    return current;
  }

  private getPrevValidIndex(current: number): number {
    for (let i = current - 1; i >= 0; i--) {
      if (!this.items[i].divider && !this.items[i].disabled) return i;
    }
    return current;
  }

  private getLastValidIndex(): number {
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (!this.items[i].divider && !this.items[i].disabled) return i;
    }
    return -1;
  }
}
