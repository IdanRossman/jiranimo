import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Project {
  key: string;
  name: string;
  color: string;
  visible: boolean;
}

@Component({
  selector: 'app-project-filter-chips',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-filter-chips.component.html',
  styleUrl: './project-filter-chips.component.css'
})
export class ProjectFilterChipsComponent {
  @Input() projects: Project[] = [];
  @Output() projectToggle = new EventEmitter<string>();

  onToggle(projectKey: string) {
    this.projectToggle.emit(projectKey);
  }

  hexToRgb(hex: string): string {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
}
