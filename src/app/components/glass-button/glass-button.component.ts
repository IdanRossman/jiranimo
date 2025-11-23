import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-glass-button',
  imports: [CommonModule],
  templateUrl: './glass-button.component.html',
  styleUrl: './glass-button.component.css'
})
export class GlassButtonComponent {
  @Input() variant: 'primary' | 'secondary' = 'primary';
  @Input() icon?: string;
  @Input() disabled: boolean = false;
  @Output() clicked = new EventEmitter<void>();

  onClick() {
    if (!this.disabled) {
      this.clicked.emit();
    }
  }
}
